---
title: GCC 是怎么实现 OpenMP 的？
description: 从 GCC 前端、GIMPLE lowering 到 libgomp 运行库，结合编译产物与实验分析 OpenMP 的实现。
publishedAt: 2026-11-23T12:00:00Z
category: Academic
tags: [LLVM, openmp, Systems, Compilers]
language: zh-CN
author: 赖海斌、吴梦轩、黄政东
draft: false
hideFromHome: false
cardImage: https://www.haibinlaiblog.top/images/gcc-openmp-compiler-report/figure-02.png
---

作者：12211612 赖海斌；12212006 吴梦轩；12212230 黄政东

> 版本说明：本文由原编译原理课程报告转换，并于 2026 年 11 月补全。重点修订第 3、5、6 节，并新增实验。新增实验的代码、固定版本源码和原始结果保存在作者本地的 `报告补全` 目录，暂未随博客公开。

<a id="section-1"></a>

## 1 摘要

本文以 GCC 13.3.0 的 CPU 主机实现为主线，介绍 OpenMP 指令如何从前端树进入 GIMPLE，经数据环境降低、控制流构建和并行区域展开，最终形成普通函数、运行库调用与机器码。我们结合实际编译产物解释函数拆分、共享数据传递、SIMD 和 Graphite 循环变换，并沿 libgomp 源码分析线程复用、循环调度、任务依赖与等待机制。实验分别验证计算循环的标量/SIMD 对照、线程扩展性、调度选择和多面体变换，保留原始时间样本、正确性误差及代码分析材料，区分已发生的代码转换与实际性能收益。

原报告代码位于 [项目仓库](https://github.com/HaibinLai/openmp-survey.git)。本次新增的受控实验、构建脚本和数据保存在作者本地的 `报告补全/experiments` 目录，具体版本与复现命令见[附录 C](#appendix-c)。

<a id="section-2"></a>

## 2 OpenMP 简介

OpenMP 是一种针对共享内存体系结构的并行程序设计 API，它通过在现有的 C/C++/Fortran 源代码中插入编译器指令（compiler directives）来表达并行语义。与消息传递或显式线程库不同，OpenMP 采用 incremental parallelism 的模式：程序的串行版本天然可运行，而编译器通过解析 #pragma omp 指令来生成并行执行模型。运行时方面，OpenMP 借助轻量级线程池、任务队列和同步原语来提供跨线程的调度与同步支持，使得程序员能够在不改变代码整体结构的情况下获得多线程加速。

OpenMP 的核心抽象包括三类指令：parallel region 指令、work-sharing 指令以及同步与原子性指令。Parallel region 指令用于创建线程团队并定义并行执行的代码范围；work-sharing 指令用于在线程之间划分循环迭代或代码块；同步指令保证线程之间的执行时序、安全访问与一致性。编译器通过这些结构化的语义构造高层 IR（如 GCC 中的 GIMPLE_OMP 节点），随后在 lowering 阶段将其展开为普通控制流与运行库调用，从而与后端优化器无缝衔接。

<a id="section-2-1"></a>

### 2.1 OpenMP 示例

我们先从一个最简单的 OpenMP 的例子开始

```cpp
#include <iostream >
#include <omp.h>

int main() {
    #pragma omp parallel
    {
        int thread_id = omp_get_thread_num();
        std::cout << "Hello from thread " << thread_id << std::endl;
    }
    return 0;
}
```

我们使用 `g++ -fopenmp hello.cpp -o hello` 编译该 C++ 示例，并可通过 `OMP_NUM_THREADS=4 ./hello` 指定运行时线程数。

运行后，它编译后将输出 N 个”Hello from thread X”，其中 N 是本次并行区域的实际团队大小；它受环境设置与运行库规则影响，不一定等于物理核数。

OpenMP 采用 fork-join 机制运行代码，其主线程到达 OpenMP 并行域后，会展开成多个线程（在 POSIX OS 上会使用 pthread_create 创建线程）执行相关代码，随后 join 环节使团队会合。libgomp 通常复用工作线程，因此一次并行区结束不等于销毁全部工作线程。

![图 1](/images/gcc-openmp-compiler-report/figure-01.png)

*图 1: GCC 采用的 fork-join 机制*

*表 1: Summary of common OpenMP directives (C/C++ syntax).*

| Directive | Purpose | Typical Usage |
| --- | --- | --- |
| `#pragma omp parallel` | Create a team of threads to execute a parallel region. | `#pragma omp parallel [clauses]` |
| `#pragma omp for` | Distribute loop iterations among threads in a team. | `#pragma omp for [clauses]` |
| `#pragma omp parallel for` | Combined parallel region and work-sharing loop. | `#pragma omp parallel for [clauses]` |
| `#pragma omp sections` | Divide code into independent sections executed in parallel. | `#pragma omp sections [clauses]` |
| `#pragma omp section` | Mark a single section within an sections construct. | `#pragma omp section` |
| `#pragma omp single` | Specify a block executed by exactly one thread. | `#pragma omp single [clauses]` |
| `#pragma omp master` | Restrict a block to be executed only by the master thread. | `#pragma omp master` |
| `#pragma omp critical` | Define a mutually exclusive critical region. | `#pragma omp critical [name]` |
| `#pragma omp barrier` | Synchronize all threads in a team. | `#pragma omp barrier` |
| `#pragma omp atomic` | Perform an atomic update on a memory location. | `#pragma omp atomic` |
| `#pragma omp ordered` | Enforce ordered execution of loop iterations. | `#pragma omp for ordered + #pragma omp ordered` |
| `#pragma omp threadprivate` | Make global variables thread-local. | `#pragma omp threadprivate(var-list)` |

<a id="section-2-2"></a>

### 2.2 OpenMP 接口

这里我们列出一些常见的 OpenMP 语句（来源：GCC libopenmp [book](https://gcc.gnu.org/onlinedocs/gcc-14.3.0/libgomp.pdf)）[GNU OpenMP 文档](https://gcc.gnu.org/projects/gomp/)

<a id="section-2-3"></a>

### 2.3 OpenMP 应用

目前大部分 CPU 上并行程序基本使用 OpenMP 作为并行方法，比如 AI 系统里的 Llama.cpp, Pytorch，科学计算里的 LAMMPS 等大型程序。

<a id="section-3"></a>

## 3 编译流程

一个 OpenMP 程序的生成与执行涉及两个相互衔接的部分：编译器将并行语义变成控制流和运行库调用，libgomp 再在程序运行时组织线程、分配工作并完成同步。`-fopenmp` 使 GCC 识别相应指令，并在通过 GCC 驱动程序链接时自动链接 OpenMP 运行库。本文以下实现分析固定到 **GCC 13.3.0** 的 `releases/gcc-13.3.0` 源码；新增实验使用 Ubuntu 提供的 GCC 13.3.0。关键行为结合发行版编译器生成的 dump 分析。

![图 2：GCC-OpenMP 编译流程概览](/images/gcc-openmp-compiler-report/figure-02.png)

*图 2：原报告的概念概览图。具体 pass 的先后顺序以以下源码与实测 dump 为准。*

| 阶段 | 输入与主要工作 | 可观察的输出 |
| --- | --- | --- |
| 预处理与前端解析 | libcpp 处理宏与 pragma 标记；C 前端解析指令、子句和结构化块，进行语言相关语义检查 | 以 `tree` 表达的前端表示及 `OMP_PARALLEL`、`OMP_FOR`、`OMP_CLAUSE` 等节点 |
| Gimplification | 将一般表达式整理为简单操作，保留 OpenMP 的区域、循环和数据共享语义 | `-fdump-tree-gimple` 中仍能看到 `#pragma omp parallel` 等结构化表示 |
| OpenMP lowering | 建立被捕获数据的传递方式，重写区域内部引用，加入区域边界标记，为 outlined function 准备上下文 | `-fdump-tree-omplower` 中出现 `.omp_data_o.*`、子函数信息及 OpenMP 标记 |
| 控制流降低、CFG 构建与 OpenMP expansion | 先把结构化控制流变成显式跳转并构造基本块，再展开并行区域和循环调度 | `-fdump-tree-ompexp` 中出现 `add._omp_fn.0` 等函数和 `__builtin_GOMP_parallel` 等调用 |
| 常规中端优化与后端代码生成 | 构建 SSA，运行适用的循环优化、Graphite、向量化等 pass，随后进入 RTL、寄存器分配与机器指令生成 | 优化诊断、优化后的 GIMPLE、RTL dump、汇编与目标文件 |
| 链接与运行 | 链接 libgomp；运行时根据线程设置、任务依赖与调度策略执行上述函数 | 实际线程团队、迭代划分、任务执行与同步行为 |

High GIMPLE 和 Low GIMPLE 描述 GIMPLE 逐步降低的过程：前者保留较高层结构，后者将控制流进一步显式化。SSA 描述变量的定义与使用关系；RTL 则是后端采用的另一层表示。

直接查看 [GCC 13.3.0 的 `passes.def`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/passes.def#L38-L58)，可以核对 C/OpenMP 主机路径上的关键顺序：

```text
pass_lower_omp
  → pass_lower_cf
  → ... → pass_build_cfg
  → ... → pass_expand_omp
  → ... → pass_build_ssa
  → 后续 SSA 优化、Graphite 与向量化等适用 pass
  → RTL 与机器码生成
```

这解释了为什么 `.gimple`、`.omplower` 与 `.ompexp` 是三个不同的观测点：前者保留区域语义，第二个已经准备数据传递但仍有并行标记，第三个则展示并行区域展开后的普通函数与调用。OpenMP lowering 主要由 [`omp-low.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/omp-low.cc) 实现，expansion 则应查看 [`omp-expand.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/omp-expand.cc)。

还需要区分显式 OpenMP 和自动并行化。`#pragma omp parallel for` 的并行意图来自程序员；`-ftree-parallelize-loops=n` 则由编译器在中端分析循环依赖，选择可并行化的循环并生成并行代码。Graphite 和循环自动并行相关 pass 在 `passes.def` 的后续优化列表中另行安排，[优化选项手册](https://gcc.gnu.org/onlinedocs/gcc-13.3.0/gcc/Optimize-Options.html) 也对其适用条件作了说明。

本次编译实验使用一个将结果写入调用者数组的 `add` 函数，避免原例中局部数组结果无人使用而被优化删除。完整源码及各阶段输出保存在作者本地的 `报告补全/experiments`；第 5 节据此解释数据捕获和代码展开，第 6 节继续追踪生成的运行库入口。

<a id="section-4"></a>

## 4 前端解析

> 本节代码为解析流程的删节示例；GCC 13.3.0 的源码与编译产物分析见第 3、5、6 节。

GCC–OpenMP 前端沿袭了传统 GCC 编译流程，将源程序依次送入“预处理（libcpp）→ 词法胶水（front-end lexer）→ 语法分析（front-end parser）”的流水线，并最终生成可交给 gimplification 的前端树表示。在该过程中，预处理器负责完成宏展开、头文件包含及行号映射等纯文本级任务；词法胶水层则把 libcpp 输出的 `cpp_token` 转换为前端可识别的 `c_token`/`tree` 结构；随后语法分析器在完整的语言上下文与符号信息支持下构建符合 GCC 中端 (middle-end) 需求的 AST，并为后续 GIMPLE gimplification 与 RTL 生成奠定基础。

<a id="section-4-1"></a>

### 4.1 词法分析

与普通代码解析不同的是，为支持 OpenMP，GCC 在 Lexing 对 `#pragma omp` 采取 延迟处理(deferred) 策略：仅标记其类型并记录一个整型 ID，而将复杂的语义解析留待前端阶段完成。例如：对于普通 C 代码，如 `for (i = 0; i < n; ++i)` ，lexing 阶段该代码将会被拆分称多个 token。对于 `#pragma omp parallel for`，预处理器产生携带指令标识的 `CPP_PRAGMA` token；后续的 `for`、子句及表达式仍通过 token 流提供给前端，直到 `CPP_PRAGMA_EOL`。这一设计既保持了 libcpp 的轻量，也使 OpenMP 语义能够在拥有完整类型与作用域信息后再行解析。

因此在 Lexing 阶段，OpenMP 指令处理的核心目标是把形如 `#pragma omp` 的文本转换成编译器内部统一的枚举常量，并安全地传递给后续语法分析器，其具体步骤如下：

<a id="section-4-1-1"></a>

#### 4.1.1 延迟 pragma 注册

前端在初始化时，将调用 `init_pragma` 向 libcpp 注册全部已知的 OpenMP 指令，其具体操作为是多次调用 `cpp_register_deferred_pragma` 函数，建立 (space,name) 到 numeric id 的映射。相关代码函数如下：

*Listing 1: Source: c-pragma.cc*

```cpp
static void
c_register_pragma_1 (const char *space, const char *name,
                     internal_pragma_handler ihandler , bool allow_expansion)
{
  // ...
  cpp_register_deferred_pragma (parse_in , space, name, id,
                                allow_expansion , false);
}
```

这一步完成后，若后续解析器在文本读取时扫描到匹配的 pragma，预处理器便只需生成一个携带该 ID 的特殊 token 并传递给下游，而不做任何语言相关的解释。

<a id="section-4-1-2"></a>

#### 4.1.2 预处理器识别

当 libcpp 在源流中发现已登记的 `#pragma omp`，即刻构造指令标记，其具体格式如下

*Listing 2: Source: libcpp/directives.cc*

```cpp
cpp_token.type =CPP_PRAGMA
cpp_token.val.pragma=<id>
```

上述标记结果将返回给前端 lexer，从而实现对 pragma 的轻量标记。

<a id="section-4-1-3"></a>

#### 4.1.3 词法胶水层 ID 装箱

C 家族前端的 `c_lex_with_flags` 读取 `CPP_PRAGMA` 后，将其 `val.pragma` 封装成 GCC 内部统一常量节点，并进而把该节点同 token 一起向上传递。此“装箱”过程使纯整数 ID 得以在不改动现有 token 接口的前提下运输。

*Listing 3: Source: c-parser.cc*

```cpp
value=build_int_cst(integer_type_node , <id>)
```

<a id="section-4-1-4"></a>

#### 4.1.4 向语法分析器的交接

语法分析器入口 `c_lex_one_token` 再次取出该整数常量，并赋给 token 的 pragma_kind 字段，其代码如下所示

*Listing 4: Source: c-parser.cc*

```cpp
/* Read in and lex a single token, storing it in *TOKEN. If RAW,
   context -sensitive postprocessing of the token is not done. */

static void
c_lex_one_token (c_parser *parser , c_token *token, bool raw = false)
{
  //...
  switch (token->type)
    {
        // ... other cases
    case CPP_PRAGMA:
      /* We smuggled the cpp_token ->u.pragma value in an INTEGER_CST. */
      token->pragma_kind = (enum pragma_kind) TREE_INT_CST_LOW (token->value);
      token->value = NULL;
      break;
    default:
      break;
    }
}
```

由此，`c_token` 即携带了明确的 `PRAGMA_OMP_*` 枚举值。至此，Lexing 阶段完成，OpenMP pragma 以类型安全、位点信息完备的形式进入 Parser 队列，等待随后的语义派发与 AST 构造。

<a id="section-4-1-5"></a>

#### 4.1.5 词法分析小结

上述基于延迟传递的 lexing 机制实现了以下两点优势：其一，职责分离: libcpp 专注于词法级处理，而 OpenMP 特有的语义解析留待前端完成；其二，高可扩展: 任何前端或插件仅需在启动时追加 `cpp_register_deferred_pragma` 调用，即可获得完整的 pragma 通路，而无需修改核心预处理器代码。这为 GCC 后续支持多语言、多并行扩展等在代码结构上提供了有效支撑。

<a id="section-4-2"></a>

### 4.2 语法分析

在 Parsing 阶段，GCC 前端负责把词法层已进行标记处理的 pragma token 归约为语义完备的前端树 `OMP_*` 结点，并进行严格的语义检查。其处理链路可概括为：

1. Token 分派：解析器主循环 `c_parser_pragma` 读取 `c_token.pragma_kind`，并以 `switch` 语句跳转到对应的 `c_parser_omp_*` 入口。

2. Clause 语句收集：各入口首先调用统一的 `c_parser_omp_all_clauses` 解析并链接 clause 链表（结点类型为 `OMP_CLAUSE`）。

3. 主体解析：若指令后需带 structured-block ／循环／表达式，则继续按 C 语法递归调用常规语句解析器取得 `body`。

4. Finish 归并：解析结束后调用 `c_finish_omp_*` 将 `clauses` ＋ `body` 封装为具体的 `OMP_*` 结点并插入当前 AST；同时触发 `c_finish_omp_clauses` 对 clause 进行语义校验、重复检测及隐式补全。

在前端完成 parsing 后，其所生成的树表示交由 gimplification 处理，生成仍保留 OpenMP 构造的 GIMPLE。数据环境降低与并行区域、循环调度的展开还要经过后续的 OpenMP lowering 和 expansion；具体顺序见第 3、5 节。

在下文中，我们将三类典型场景（并行区、并行循环、数据环境），对 GCC 在 Parsing 部分的实现进行解析

<a id="section-4-2-1"></a>

#### 4.2.1 并行区处理

示例代码：`#pragma omp parallel num_threads(4) { /* body */ }`

**流程总结。** Token 接收与分派：解析器通过 `c_lex_one_token` 按序读取由 libcpp 产生的 token 流。当遇到类型为 `CPP_PRAGMA` 的条目时，词法胶水已将。

1. 在上一阶段，lexer 已将 `CPP_PRAGMA` 的条目数值 id 存入 `token.value` 中。而在 parsing 阶段，parser 将首先取出该常量的低位字 `TREE_INT_CST_LOW (token.value)`，写入 `token.pragma_kind`。随后在 `c_parser_pragma` 中，以 `switch (token.pragma_kind)` 的形式把控制权分派给对应的 OpenMP 入口函数（如 `c_parser_omp_parallel`），由此完成“从普通 token 流跳转至 OpenMP 专用解析子系统”的动作。

2. 对于并行区，`c_parser_omp_parallel` 读取 directive，随后：

(a) 调用 `c_parser_omp_all_clauses` 解析 `num_threads(4)`，生成 `OMP_CLAUSE_NUM_THREADS` 结点。

(b) 解析紧随的 structured-block（可为 `{ ... }` 或单语句）形成 `body`。

3. `c_finish_omp_parallel`：

(a) 结束复合语句并创建 `OMP_PARALLEL` 结点

(b) 绑定 `OMP_PARALLEL` 结点的 clause 字段与 body 字段。clause 字段绑定解析 `\#pragma` 语句所得到的分析树，而 body 字段绑定括号区域内经过普通 parsing 得到的解析树

(c) 将节点插入当前语句链：`add_stmt (stmt);`.

**具体代码解析。** 在 `c_parser_omp_parallel` 中，该函数将会判断并行区类型（比如是否为 parallel for 等），而在最后一个分支，代码将处理普通 parallel 语句，调用 `c_parser_omp_all_clauses` 形成链成 tree 链表 clauses，调用 `c_parser_statement` 进一步解析后续并行块中内容，并最终调用 `c_finish_omp_parallel` 将解析出的 body 与 clauses 绑定到 `OMP_PARALLEL` 节点中，并将 AST 子树的指针返回。

```cpp
static tree
c_parser_omp_parallel (location_t loc, c_parser *parser ,
                       char *p_name , omp_clause_mask mask, tree *cclauses ,
                       bool *if_p)
{
  tree stmt, clauses , block;

  strcat (p_name, " parallel");
  mask |= OMP_PARALLEL_CLAUSE_MASK;
  /* #pragma omp target parallel{, for, for simd} disallow copyin clause. */
  if ((mask & (OMP_CLAUSE_MASK_1 << PRAGMA_OMP_CLAUSE_MAP)) != 0
      && (mask & (OMP_CLAUSE_MASK_1 << PRAGMA_OMP_CLAUSE_DIST_SCHEDULE)) == 0)
    mask &= ~(OMP_CLAUSE_MASK_1 << PRAGMA_OMP_CLAUSE_COPYIN);

  /* other branches */

  // 普通 openmp 并行区处理分支
  clauses = c_parser_omp_all_clauses (parser , mask, p_name , cclauses == NULL);
  //...

  block = c_begin_omp_parallel (); // 创建节点
  c_parser_statement (parser , if_p); // 继续解析 pragama 下面代码块的内容
  stmt = c_finish_omp_parallel (loc, clauses , block); // 绑定并追加至当前

  return stmt;
}
```

在 `c_parser_omp_all_clauses` 中，代码使用一个 while 循环逐个 token 读取 pragma 行的内容，并进行解析与错误（语义）处理

```cpp
    static tree
c_parser_omp_all_clauses (c_parser *parser , omp_clause_mask mask,
                          const char *where, bool finish_p = true,
                          int nested = 0)
{
  tree clauses = NULL;
  bool first = true;

  while (c_parser_next_token_is_not (parser , CPP_PRAGMA_EOL)) // 还没到 pragma 行结尾
    {
      location_t here;
      pragma_omp_clause c_kind;
      const char *c_name;
      tree prev = clauses;

      /* 前置处理 */

      switch (c_kind)
        {
            /* 其他 Open MP 字句解析 */
        case PRAGMA_OMP_CLAUSE_PARALLEL:
          clauses
            = c_parser_omp_clause_cancelkind (parser , OMP_CLAUSE_PARALLEL ,
                                              clauses);
          c_name = "parallel";
          if (!first) // 错误处理以确保 parallel 是第一个 token
            {
             clause_not_first:
              error_at (here, "%qs must be the first clause of %qs",
                        c_name , where);
              clauses = prev;
            }
          break;
        /* 其他 Open MP 字句解析 */
        default:
          c_parser_error (parser , "expected an OpenMP clause");
          goto saw_error;
        }
}
  return clauses; // 返回处理好的语句链
}
```

在 `c_finish_omp_parallel` 中，代码将构造 `OMP_PARALLEL` 节点，进行 body 与 stmt 字段的绑定并返回。

*Listing 5: `c_finish_omp_parallel` 关键片段*

```cpp
/* Generate OMP_PARALLEL , with CLAUSES and BLOCK as its compound
   statement. LOC is the location of the OMP_PARALLEL. */

tree
c_finish_omp_parallel (location_t loc, tree clauses , tree block)
{
  tree stmt;

  block = c_end_compound_stmt (loc, block, true);

  stmt = make_node (OMP_PARALLEL);
  TREE_TYPE (stmt) = void_type_node;
  OMP_PARALLEL_CLAUSES (stmt) = clauses;
  OMP_PARALLEL_BODY (stmt) = block;
  SET_EXPR_LOCATION (stmt, loc);

  return add_stmt (stmt);
}
```

在上述流程完成后，parser 便成功生成完整的 parallel 并行区 AST 子树。在后续 Gimplify 阶段，`gimplify_omp_parallel` 扫描 `clauses`，保留线程数等子句信息，并把 `body` 降为 GIMPLE；具体运行库入口由后续 expansion 决定。

<a id="section-4-2-2"></a>

#### 4.2.2 并行循环解析

自动负载均衡并行循环主要由 `#pragma omp parallel for` 实现。

示例代码：

```cpp
#pragma omp parallel for schedule(dynamic , 100)
for (int i = 0; i < N; ++i) {
/* code */
}
```

OpenMP 关于并行循环区的解析过程与普通并行区基本一致，但在识别到 `for` 关键字后，会进入专门的循环解析子系统。具体来说，解析器首先调用 `c_parser_omp_parallel` 完成并行区的子句（clauses）解析，然后转而调用 `c_parser_omp_for` 处理循环相关的子句和循环头部结构。解析器会收集循环的初始化、条件判断、增量更新等信息，并生成相应的抽象语法树节点（如 `OMP_FOR`）。此外，针对并行循环中可能出现的额外子句（如 `schedule`、`collapse`、`ordered` 等），解析器也会进行专门的识别和处理，确保后续编译阶段能够正确生成支持动态调度和负载均衡的代码。

OpenMP 并行循环的核心解析逻辑分布在 `c_parser_omp_for` ，`c_parser_omp_for_loop`，`c_finish_omp_for` 三个阶段函数中，其中：

`c_parser_omp_for` 负责指令级的调度——确定本条 `parallel for`（或其复合形式）允许出现的子句集合、分流 `simd` 变体，并收集全部 loop–related 子句后进入循环头部解析子系统。

`c_parser_omp_for_loop` 负责循环头部与嵌套结构的严格递归解析与合法性判定，生成迭代变量（`declv`）、初始化／条件／增量（`initv` ／ `condv` ／ `incrv`）等向量。

`c_finish_omp_for` 负责语义归并与 AST 结点构造，把前两个阶段收集的信息封装为 `OMP_FOR` 语句结点，并执行剩余语义检查（如迭代变量与子句的互斥关系）及常量折叠。

下文依次对三个函数的具体执行逻辑进行解析。

c_parser_omp_for 函数解析 `c_parser_omp_for` 函数主要负责子句筛选与入口调度，该函数主要代码如下：

*Listing 6: `c_parser_omp_for` 关键片段*

```cpp
static tree
c_parser_omp_for (location_t loc, c_parser *parser ,
                  char *p_name , omp_clause_mask mask,
                  tree *cclauses , bool *if_p)
{
  tree block, clauses , ret;
  // 1. 子句掩码初始化 + parallel for simd 早期分流
  strcat (p_name, " for");
  mask |= OMP_FOR_CLAUSE_MASK;

  // 裁剪子句掩码
    /* parallel for{, simd} disallows nowait clause , but for
     target {teams distribute ,}parallel for{, simd} it should be accepted. */
  if (cclauses && !(mask & (OMP_CLAUSE_MASK_1 << PRAGMA_OMP_CLAUSE_MAP)))
    mask &= ~(OMP_CLAUSE_MASK_1 << PRAGMA_OMP_CLAUSE_NOWAIT);
    //...

  // 处理 parallel for simd 逻辑
  if (c_parser_next_token_is (parser , CPP_NAME)
      && strcmp (IDENTIFIER_POINTER (c_parser_peek_token (parser)->value),
                 "simd") == 0) // next token 是 smid
    {
      // ...
      // 调用 SIMD 的 parser
      block = c_begin_compound_stmt (true);
      ret = c_parser_omp_simd (loc, parser , p_name , mask, cclauses , if_p);
      block = c_end_compound_stmt (loc, block, true);
      // ...
      return ret;
    }

  // 2. 常规 parallel for 子句收集
  clauses = c_parser_omp_all_clauses (parser , mask, p_name , cclauses == NULL);
  //...
  // 进入循环头部递归解析
  block = c_begin_compound_stmt (true);
  ret = c_parser_omp_for_loop (loc, parser , OMP_FOR , clauses , cclauses , if_p);
  block = c_end_compound_stmt (loc, block, true);
  add_stmt (block);
  return ret;
}
```

代码解析：

在函数开头部分，代码主要做了两件事情：

1. 基于“外层指令 + for”复合关系调整代码所允许的子句掩码（`mask`）, 以适配不同的子句规则。例如 `nowait` 在纯 `parallel for` 中必须禁止，而在 `target teams distribute parallelfor` 中又应放行，`ordered` ／ `linear` 亦按 OpenMP 规范有互斥限制。

2. 兼容 `simd` 变体。若遇到 `parallel for simd`，解析器立即转入 `c_parser_omp_simd` 并在结束后人为包装一个 `OMP_FOR` 结点，借此保持前端 AST 结构的一致性。

随后，常规 `for` 处理流程执行了以下内容：

1. 调用 `c_parser_omp_all_clauses` 收集子句链 `clauses`

2. 调用 `c_begin_compound_stmt`，类似于并行区处理，开启一个新的复合语句块保存循环头部中可能声明的迭代变量。

3. 调用 `c_parser_omp_for_loop` 真正解析循环头与嵌套结构。

c_parser_omp_for_loop 函数解析 `c_parser_omp_for_loop` 函数主要负责 for 循环并行中的递归解析与合法性判定。该函数的具体片段如下：

*Listing 7: `c_parser_omp_for_loop` 关键片段*

```cpp
static tree
c_parser_omp_for_loop (location_t loc, c_parser *parser ,
                       enum tree_code code,
                       tree clauses , tree *cclauses , bool *if_p)
{
  //... 一些初始化
  tree body, stmt, cl, ret = NULL_TREE;
  int collapse = 1, ordered = 0, count;
  bool inscan = false;
  struct omp_for_parse_data data, *save = parser->omp_for_parse_state;

  // 1. 循环扫描 caluses 子句，确定循环类型为 collapse / ordered ，并最终确定前端需要解析的 for loop 层数
  for (cl = clauses; cl; cl = OMP_CLAUSE_CHAIN (cl))
    if (OMP_CLAUSE_CODE (cl) == OMP_CLAUSE_COLLAPSE)
      collapse = tree_to_shwi (OMP_CLAUSE_COLLAPSE_EXPR (cl));
    else if (OMP_CLAUSE_CODE (cl) == OMP_CLAUSE_ORDERED
             && OMP_CLAUSE_ORDERED_EXPR (cl))
      ordered = tree_to_shwi (OMP_CLAUSE_ORDERED_EXPR (cl));
    else if (OMP_CLAUSE_CODE (cl) == OMP_CLAUSE_REDUCTION
             && OMP_CLAUSE_REDUCTION_INSCAN (cl))
      inscan = true;

  count = ordered ? ordered : collapse;
  // 若接下来的 token 不能组成 canonical for-loop ，直接返回
  if (!c_parser_omp_next_tokens_can_be_canon_loop (parser , code, true))
    return NULL_TREE;

  // 2. 初始化循环解析状态
  data.declv = make_tree_vec (count);
  data.initv = make_tree_vec (count);
  data.condv = make_tree_vec (count);
  data.incrv = make_tree_vec (count);
  data.count = count;
  data.inscan = inscan;
  data.fail = false;
  parser->omp_for_parse_state = &data;

  // 3. 使用递归下降算法解析循环嵌套
  body = c_parser_omp_loop_nest (parser , if_p);

  // 4. 生成 OMP_FOR 结点并进行语义合规性检查
  if (!data.fail)
    {
      stmt = c_finish_omp_for (loc, code,
                               data.declv, NULL,
                               data.initv, data.condv, data.incrv,
                               body, data.pre_body , true);

      // 校验迭代变量合法性（作用域正确（私有或隐式私有），未在循环外被非法引用等
      if (stmt && !c_omp_check_loop_iv (stmt, data.declv, NULL))
        stmt = NULL_TREE;
      if (stmt)
        {
          //... 一些处理逻辑，常量折叠等
          OMP_FOR_CLAUSES (stmt) = clauses; // 把原始子句链挂到 for 节点
          add_stmt (stmt); // 插入当前语句链表
        }
      ret = stmt;
    }
  parser->omp_for_parse_state = save;
  return ret;
}
```

代码解析：

1. 子句影响的循环维度推导

首先，在解析开始前须确定“需要解析多少级 for-loop”。由于 OpenMP 允许多种情况，例如：`collapse(n)` 情况：将 n 层完美嵌套循环视为一层并行循环；`ordered(m)` 情况：若带参数的 `ordered` 存在，则真正需要解析的层数取 `ordered` 参数与 `collapse` 的较大者。源码通过扫描 `clauses` 计算出变量 `collapse` 与 `ordered`，按该片段中的 `ordered ? ordered : collapse` 记录于 `count`，从而确定需要解析的 for-loop 层级数量。

2. 循环头部递归与 Canonical 约束

随后函数初始化 `omp_for_parse_data` 以用于解析状态记录，并调用 `c_parser_omp_loop_nest`。该递归下降解析器的目的是确保每一层 for-loop 均满足 OpenMP “canonical”语法，即形如：

```cpp
    for(decl&init; cond; incr) stmt
    // 例子：
    for(int i=0;i<k;i++) { /* do sth */}
```

并记录四元组：

```cpp
    (decl, init, cond, incr)  ( declv, initv, condv, incrv)
```

该四元组代表了“迭代变量（decl)、起始值 (init）、终止条件（cond）和步长（inc）”，随后将被把每一层循环的精确编码进 `OMP_FOR` 语法树结点，形成完整的迭代空间描述。而后续 GIMPLE 阶段读取这四个向量，切分出（循环下界，上界，步长）三元组，然后按调度策略切分给各线程，具体每个元组将会在运行时确定执行的线程。

而在错误处理上，若某层不满足 canonical 形式或出现干扰代码，`data.fail` 被置真并在稍后中止生成。

`c_parser_omp_loop_nest` 和核心流程就是依据预期的形式逐次消耗 token，如果 for 循环形状不符合预期则进入错误处理，否则返回成功解析得到的四元组，其关键片段如下：

*Listing 8: `c_parser_omp_loop_nest` 关键片段*

```cpp
static tree
c_parser_omp_loop_nest (c_parser *parser , bool *if_p)
{
  // 省略初始化、诊断与其他指令变体的处理

  // 下面一个 token 一个 token 地去消耗，假定后续的 token 流都是形如 for(int i=0;i<n;i++)这样的，如果发现 token 消耗过程中遇到不符合这个形状的，就跳到错误处理
  // 解析 decl 和 init
  /* Parse the initialization declaration or expression. */
  if (c_parser_next_tokens_start_declaration (parser)) // 如果是声明的话
    {
      // ...
      c_parser_declaration_or_fndef (parser , true, true, true, true, true,
                                     false); // 解析声明语句
      //...
      // 提取迭代变量 decl ，并把 init=decl
      decl = check_for_loop_decls (omp_for_parse_state ->for_loc , flag_isoc99);
    }
  else if (c_parser_next_token_is (parser , CPP_NAME)
           && c_parser_peek_2nd_token (parser)->type == CPP_EQ) // IDENTIFIER = 这种格式，同时读后面两个 token
    {
      decl_exp = c_parser_postfix_expression (parser); // 获得左值
      decl = decl_exp.value;

      c_parser_require (parser , CPP_EQ , "expected %<=%>");

      init_loc = c_parser_peek_token (parser)->location;
      init_exp = c_parser_expr_no_commas (parser , NULL); // 解析右值
      init_exp = default_function_array_read_conversion (init_loc ,
                                                         init_exp);
      // 构造出一颗 MODIFY_EXPR 树
      c_in_omp_for = true;
      init = build_modify_expr (init_loc , decl, decl_exp.original_type ,
                                NOP_EXPR , init_loc , init_exp.value,
                                init_exp.original_type);
      c_in_omp_for = false;

      // MODIFY_EXPR 包装成语句，得到真正的 init 结点
      init = c_process_expr_stmt (init_loc , init);

      // 消耗分号 token
      c_parser_skip_until_found (parser , CPP_SEMICOLON , "expected %<;%>");
    }
  // 解析 cond
  /* Parse the loop condition. */
  if (c_parser_next_token_is_not (parser , CPP_SEMICOLON))
    {
      //... 解析 expr 表达式
      struct c_expr cond_expr
        = c_parser_binary_expression (parser , NULL, NULL_TREE);

      // 验证 canonical -for 语法：只允许 < <= > >= ，其他运算符直接报错
      switch (cond_expr.original_code)
        {
        case GT_EXPR:
        case GE_EXPR:
        case LT_EXPR:
        case LE_EXPR:
          // ...
        default:
          /* Can't be cond = error_mark_node , because we want to preserve
             the location until c_finish_omp_for. */
          cond = build1 (NOP_EXPR , boolean_type_node , error_mark_node);
          break;
        }
    }
  c_parser_skip_until_found (parser , CPP_SEMICOLON , "expected %<;%>"); // 消耗分号

  /* Parse the increment expression. */
  if (c_parser_next_token_is_not (parser , CPP_CLOSE_PAREN)) // 解析出 incr 语句
    {
      location_t incr_loc = c_parser_peek_token (parser)->location;

      incr = c_process_expr_stmt (incr_loc ,
                                  c_parser_expression (parser).value);
    }

  // 如果成功的话，就构造 <declv,initv,condv,incrv> 向量，里面是 ast 树
  if (decl == NULL || decl == error_mark_node || init == error_mark_node)
    omp_for_parse_state ->fail = true;
  else
    {
      TREE_VEC_ELT (omp_for_parse_state ->declv, depth) = decl;
      TREE_VEC_ELT (omp_for_parse_state ->initv, depth) = init;
      TREE_VEC_ELT (omp_for_parse_state ->condv, depth) = cond;
      TREE_VEC_ELT (omp_for_parse_state ->incrv, depth) = incr;
    }
  // ... 其他处理
  return body;
}
```

c_finish_omp_for 函数解析 `c_finish_omp_for` 函数主要负责 AST 结点构造与后续校验，其核心代码如下

*Listing 9: `c_finish_omp_for` 关键片段*

```cpp
tree
c_finish_omp_for (location_t locus, enum tree_code code,
                  tree declv, tree orig_declv ,
                  tree initv, tree condv, tree incrv,
                  tree body, tree pre_body , bool final_p)
{
   //... 前置处理
   bool fail = false;
  for (int i = 0; i < TREE_VEC_LENGTH (declv); ++i)
    {
      tree decl = TREE_VEC_ELT (declv, i);
      tree init = TREE_VEC_ELT (initv, i);
      tree cond = TREE_VEC_ELT (condv, i);
      tree incr = TREE_VEC_ELT (incrv, i);

      // 迭代变量类型合法性检查（循环 decl 必须要是整型）
      if (!INTEGRAL_TYPE_P (TREE_TYPE (decl))
          && TREE_CODE (TREE_TYPE (decl)) != POINTER_TYPE)
        { error_at (..., "invalid type for iteration variable %qE", decl);
          fail = true; }
      // 其他的处理与常量折叠
    }
  // AST 结点创建
  if (fail) return NULL_TREE;
  tree stmt = make_node (code); // 创建一个新的语法树节点并填写相应字段
  TREE_TYPE (stmt) = void_type_node;
  OMP_FOR_INIT (stmt) = initv;
  OMP_FOR_COND (stmt) = condv;
  OMP_FOR_INCR (stmt) = incrv;
  OMP_FOR_BODY (stmt) = body;
  OMP_FOR_PRE_BODY (stmt) = pre_body; // 关联循环体的 AST 子树
  OMP_FOR_ORIG_DECLS (stmt)= orig_declv;
  return stmt;
```

总的来说，finish 函数的职责可概括为两类：

1. 结构化封装：将前阶段收集的五元组 (declv,initv,condv,incrv,body) 全量写入 `OMP_FOR_*` 字段。

2. 后置语义检查与常量折叠：包括检查迭代循环类型必须是整型、确保增量方向与条件比较符号匹配，fold 等等。

小结 至此，`parallel for` 指令经历了 `c_parser_omp_for` ，`c_parser_omp_for_loop` 与

`c_finish_omp_for` 三个核心函数的处理，完成了从 token 流到 `OMP_FOR` AST 结点的全流程转换。解析器在阶段 `c_parser_omp_for_loop` 即完成所有循环合法性判定与嵌套展开，阶段 3 则负责统一封装、补充诊断与常量折叠。后续 gimplify 过程将会基于该节点结合 `schedule` 等子句生成对 `GOMP_loop_*` 运行时的调用，实现真正的动态划分与负载均衡。

<a id="section-4-2-3"></a>

#### 4.2.3 数据共享属性

示例代码：

```cpp
int sum = 0;
int tmp;
#pragma omp parallel for shared(sum) private(tmp)
for (int i = 0; i < N; ++i) {
    tmp = compute(i); // 每个线程独有的私有临时变量
    #pragma omp atomic
    sum += tmp;
}
```

OpenMP 对并行区域（parallel region）中的每个变量都必须明确其数据共享属性（Data-Sharing Attribute, DSA）。典型的 DSA 包括 `private`、`firstprivate`、`shared`、`reduction` 等。下面我们将说明这一部分在 GCC 在前端阶段的实现机制，并进一步讨论 `c_finish_omp_clauses` 的语义检查实现。

Clause 解析过程 在语句解析过程中，各数据共享子句均由专属解析器生成对应的 `OMP_CLAUSE_*` 语法树结点，随后统一交由 `c_parser_omp_all_clauses` 汇聚成链表。下列代码展示了 `private`/`shared` 子句解析的核心实现逻辑：

*Listing 10: 私有与共享子句解析关键流程*

```cpp
static tree
c_parser_omp_clause_private (c_parser *parser , tree list)
{
  return c_parser_omp_var_list_parens (parser , OMP_CLAUSE_PRIVATE , list);
}
// 其他比如 shared 语句也是都调用了 c_parser_omp_var_list_parens ， kind 不同

static tree
c_parser_omp_var_list_parens (c_parser *parser , enum omp_clause_code kind,
                              tree list, bool map_lvalue = false)
{
  location_t loc = c_parser_peek_token (parser)->location;
  //... other codes
  matching_parens parens;
  if (parens.require_open (parser)) // 消耗掉 '('
    {
      list = c_parser_omp_variable_list (parser , loc, kind, list, map_lvalue); //解析逗号分隔的变量序列 a,b,c
      parens.skip_until_found_close (parser); // 匹配 ')'
    }
  return list; // 返回解析得到的语法树
}

static tree
c_parser_omp_variable_list (c_parser *parser ,
                            location_t clause_loc ,
                            enum omp_clause_code kind,
                            tree list,
                            bool map_lvalue = false)
{
  // 解析变量列表的 loop ，使用 LL 解析法，反复读取形如 id | expr ',' ⋯ 直到遇到 ) */
  while (1)
  {
    tree decl = NULL_TREE; // 表示本轮解析出的对象
    //... 省略其他处理
    // 1. 读一个对象
    decl = lookup_name (c_parser_peek_token (parser)->value); // 读取 token 并返回声名节点
      if (t == NULL_TREE) // 如果找不到这个 token 的定义就报错
    {
      undeclared_variable (c_parser_peek_token (parser)->location ,
      c_parser_peek_token (parser)->value);
      t = error_mark_node;
    }
    // 2. 构造 omp_clause 结点并头插链表
    if (decl != error_mark_node)
    {
      tree c = build_omp_clause (clause_loc , kind);
      OMP_CLAUSE_DECL (c) = decl;// 指向变量 / 表达式
      OMP_CLAUSE_CHAIN (c) = list; // 新节点 .next 指向旧的 lisy
      list = c;
    }
    // 3. 逗号为分隔符进行解析的，如果遇到逗号就继续，否则结束
    if (!c_parser_next_token_is (parser , CPP_COMMA))
      break;
    c_parser_consume_token (parser);
  }
  return list;
}
```

上述代码的流程要点如下：

1. 首先，代码使用 `matching_parens` 帮助类确保“左括号–右括号”平衡，并维护消耗左右括号

2. 每个子句的解析调用 `c_parser_omp_variable_list`，使用递归下降解析法解析包含多个变量的表达式 (如 `(a,b,*p)` 这样的）

3. 最后，每解析一个子句即通过 `OMP_CLAUSE_CHAIN` 头插入链表，最终由 `c_parser_omp_all_clauses` 实现汇总。

语义检查总览 所有子句的语义合法性由 `c_finish_omp_clauses` 统一完成，该函数对已解析出的 `omp_clause` 链表执行多轮遍历并进行语法检查。由于语法检查包含相当多的内容，因此我们在此主要分析最重要的两个语法检查：

子句互斥与重复检测: 这一部分的核心实现思路如下：代码首先维护两类 bitmap：seen_clauses 与 seen_vars，前者记录已出现的子句种类，后者记录已声明变量。随后，代码对互斥子句（如 `private` vs. `shared`）或同一变量在不同子句中重复出现的情况，编译器将 `error_at` 报错并置 `error_count`。最后，若成功通过所有 if 语句检查，则将当前子句/变量记录回到 bitmap 中。

预定共享规则: 这一部分主要通过 `c_omp_predetermined_sharing` 取出变量本应的类型。再按变量种类、所在构造与子句规则检查显式属性是否合法。

下面是上述两个功能的代码实现解析：

*Listing 11: 子句互斥与重复检测相关代码*

```cpp
// 0. 声明并初始化若干 bitmap 用于检查子变量是否已经出现（ key = DECL_UID (var_decl)， value=1 表示出现过）
bitmap_head generic_head , firstprivate_head , lastprivate_head;
bitmap_initialize (&generic_head , &bitmap_default_obstack);
//...

// 1. 主循环：依次扫一条 omp_clause 链表并进行语法检查
for (pc = &clauses , c = clauses; c ; c = *pc)
{
  bool remove = false; // 本子句出错时设为 true
  bool need_complete = false; // 检查类型完整性
  bool need_implicitly_determined = false; // 是否跑预定共享规则
  tree t = NULL_TREE; // 子句的变量 / 表达式

  switch (OMP_CLAUSE_CODE (c))
  {
    // (1) 子句互斥 / 重复检测：都会跳到 check_dup_generic/check_dup_generic_t
    case OMP_CLAUSE_PRIVATE:
      need_complete = true;
      need_implicitly_determined = true;
      goto check_dup_generic;
    // shared 之类的分支也是基本一样的跳到下面，变量 option 略有不同
  }

check_dup_generic:
  t = OMP_CLAUSE_DECL (c); // 取子句里那个 decl/expression
check_dup_generic_t:
  // 不得不说虽然感觉代码一大堆但居然还是用了 guard sentences
  if (!VAR_P (t) && TREE_CODE (t) != PARM_DECL) // a. 确保一定是变量或形参
    {
      error_at (OMP_CLAUSE_LOCATION (c),
                "%qE is not a variable in clause %qs",
                t, omp_clause_code_name[OMP_CLAUSE_CODE (c)]);
      remove = true;
    }
  // b. 检验是否与此前子句冲突 / 重复，主要是依据条件查 bitmap_bit_p 之前是否在数据环境其他子句中用过这个变量
  else if (bitmap_bit_p (&generic_head , DECL_UID (t))
        || bitmap_bit_p (&firstprivate_head , DECL_UID (t))
        || bitmap_bit_p (&lastprivate_head , DECL_UID (t)))
    {
      error_at (OMP_CLAUSE_LOCATION (c),
                "%qE appears more than once in data clauses", t);
      remove = true;
    }
  else
    // 完成检查并且记录这个 decl 出现过
    bitmap_set_bit (&generic_head , DECL_UID (t));

// 2. 预定共享规则检查
if (!remove && need_implicitly_determined)
  {
    const char *share_name = NULL;
    // c_omp_predetermined_sharing 归类 t 所在作用域的默认分享类型
    switch (c_omp_predetermined_sharing (t))
      {
      case OMP_CLAUSE_DEFAULT_SHARED:
                if ((OMP_CLAUSE_CODE (c) == OMP_CLAUSE_SHARED
                       || OMP_CLAUSE_CODE (c) == OMP_CLAUSE_FIRSTPRIVATE)
                      && c_omp_predefined_variable (t)) // 定义正确的话就跳出
                    break;
        share_name = "shared";
        break;
      case OMP_CLAUSE_DEFAULT_PRIVATE:
        share_name = "private";
        break;
      }

    if (share_name) // 定义不正确（不符合规范）就报错
      {
        error_at (OMP_CLAUSE_LOCATION (c),
                  "%qE is predetermined %qs for %qs",
                  t, share_name ,
                  omp_clause_code_name[OMP_CLAUSE_CODE (c)]);
        remove = true;
      }
  }

  // 一些错误处理：若 remove=true ，从链表删除该子句，否则前进到下一节点
  if (remove)
      *pc = OMP_CLAUSE_CHAIN (c);
  else
      pc = &OMP_CLAUSE_CHAIN (c);
}
bitmap_obstack_release (NULL);
return clauses;
```

小结 至此，`private`、`firstprivate`、`shared` 与 `reduction` 子句从词法–语法解析到 静态语义校验已经完成。成功通过检查后，`c_finish_omp_clauses` 将返回一条合法的 `omp_clause` 链表，供后续 gimplify 阶段降解为 GIMPLE IR，生成相应的临时变量，锁语句等，并在 RTL 生成期转化为实际的运行时数据复制和归约调用。

<a id="section-4-2-4"></a>

#### 4.2.4 语法分析小结

在语法分析阶段，GCC 通过“分派–收集–归并”三步将 OpenMP 指令转化为统一的 `OMP_*` AST 结点；随后借助 `c_finish_omp_clauses` 与各类 `c_finish_omp_*` 完成 clause 语义检查、循环规范化及结构化块绑定。解析器保持轻量化，仅生成表示与负责早期诊断，而并行实现需要继续经过 gimplification、OpenMP lowering 与 expansion；其中一部分变为运行库调用，另一部分直接展开为计算或原子指令，从而实现了前后端职责分离与高度可扩展的 OpenMP 支持框架。

<a id="section-5"></a>

## 5 中间代码优化

前端树、GIMPLE、SSA 与 RTL 为不同阶段的分析提供合适的表示。分析 OpenMP 的编译过程，需要观察并行区域在何处拆分、数据如何进入新函数，以及循环优化如何改变代码。本节使用同一份可观察输出的例子，结合本次 GCC 13.3.0 的真实编译结果逐步说明。

![图 3：原报告中的 IR 层次示意](/images/gcc-openmp-compiler-report/figure-03.png)

*图 3：IR 层次概念图。OpenMP 主要降低路径的具体顺序见第 3 节；Graphite 与向量化均属于后续适用的中端优化。*

<a id="section-5-1"></a>

### 5.1 High GIMPLE

High GIMPLE 仍能表达并行区域的主体和子句，普通表达式则已经拆分为更简单的操作。这一阶段的重要作用是使后续 pass 不必重新理解原始 C 语法。Gimplification 及 OpenMP 相关上下文处理可见固定版本的 [`gimplify.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/gimplify.cc)。

<a id="section-5-1-1"></a>

#### 5.1.1 GIMPLE 示例

原报告的局部 `arr[4]` 没有被调用者使用，不适合在高优化等级下持续观察。这里将输出数组作为参数传入，保持“多个线程写各自元素”的并行语义，并避免死存储删除掩盖转换过程：

```c
#include <omp.h>
void add(int a, int b, int out[4]) {
    #pragma omp parallel num_threads(4) default(none) shared(out,a,b)
    {
        int tid = omp_get_thread_num();
        out[tid] = a + b;
    }
}
```

编译命令为：

```bash
gcc -O0 -fopenmp -fdump-tree-original -fdump-tree-gimple \
    -fdump-tree-omplower -fdump-tree-ompexp -c example.c
```

这里使用 `-O0` 观察转换过程，性能实验使用 `-O3`。完整结果在本地 `artifacts` 目录。`.006t.gimple` 中仍有带 `shared`、`default(none)` 和 `num_threads(4)` 的 parallel 区域，而数组下标已经变成类型转换、偏移计算与间接写入：

```text
#pragma omp parallel shared(b) shared(a) shared(out) default(none) num_threads(4)
  ...
  tid = omp_get_thread_num ();
  D.3223 = (long unsigned int) tid;
  D.3224 = D.3223 * 4;
  D.3225 = out + D.3224;
  D.3226 = a + b;
  *D.3225 = D.3226;
```

此时并行构造仍被保留，普通计算已拆为偏移计算、加法和间接写入等简单操作。后续 lowering 和 expansion 继续处理数据环境与并行区展开。

<a id="section-5-2"></a>

### 5.2 OpenMP 降低

[`omp-low.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/omp-low.cc) 与 [`omp-expand.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/omp-expand.cc) 分别负责不同层次的降低。`.009t.omplower` 已出现 `.omp_data_o.1`：调用者把 `a`、`b` 和 `out` 放进数据环境，区域内部则经 `.omp_data_i` 访问这些字段。该输出中仍保留 `#pragma omp parallel ... [child fn: ...]` 和 `#pragma omp return`，供后续 expansion 使用。

经过 CFG 构建和 expansion，`.017t.ompexp` 中可以直接观察到以下调用者关键行：

```text
.omp_data_o.1.b = b;
.omp_data_o.1.a = a;
.omp_data_o.1.out = out;
__builtin_GOMP_parallel (add._omp_fn.0, &.omp_data_o.1, 4, 0);
```

另一个函数 `add._omp_fn.0` 从结构体字段取出数据，调用 `omp_get_thread_num()`，再写入对应元素。线程启动的职责并不在这个子函数内，它作为函数指针交给 libgomp。运行库建立团队后，各线程执行相同入口，通过线程编号获得各自的逻辑工作。

数据环境中保存的是 `out` 的指针值，各线程通过它访问同一个数组。`a`、`b` 在该区域内只被读取，本次 dump 以值字段传递它们。遇到可修改共享对象、可变长度类型、归约或 C++ 构造/析构时，lowering 还需要对应的引用、初始化、合并或清理逻辑。

控制流降低也有明确作用：`pass_lower_cf` 将结构化条件等改为显式跳转，`pass_build_cfg` 建立基本块与边，expansion 利用区域标记完成函数拆分和调度控制流生成。对于显式 OpenMP 主机代码，主要 expansion 出现在 `pass_build_ssa` 之前；后续自动并行等路径另有展开 pass。

<a id="section-5-3"></a>

### 5.3 OpenMP 构造展开

| 原始语义 | 降低时必须解决的问题 | 可能观察到的实现 |
| --- | --- | --- |
| `parallel` | 团队规模、被捕获数据、区域入口和退出 | outlined function、`GOMP_parallel` |
| `for schedule(static)` | 根据线程编号计算各自的迭代范围 | 内联边界计算，或适用路径上的静态调度接口 |
| `for schedule(dynamic)` | 多个线程持续领取尚未执行的 chunk | `GOMP_loop_*` 调用及运行库中的共享迭代状态 |
| `private` / `firstprivate` | 为各线程建立独立对象，并按需初始化 | 线程函数局部对象、复制和清理操作 |
| `reduction` | 私有累积值及最终合并 | 局部累积和按类型、构造选择的合并代码 |
| `barrier` / `critical` | 同步团队或互斥访问 | 运行库调用及后续同步实现 |
| `atomic` | 按规定原子性完成读写或更新 | 目标支持时的原子指令；必要时的运行库辅助 |

具体输出受融合指令、调度类型、编译器分析结果与目标架构影响。本次例子生成的是合并入口 `GOMP_parallel`，入口内部的收尾机制见第 6 节。

<a id="section-5-4"></a>

### 5.4 多面体优化

多面体方法把循环迭代视为整数点。例如 `1 <= i,j < N-1` 定义了二维迭代域；数组访问、执行次序和依赖关系则约束哪些变换合法。新的调度函数必须维持依赖先后，而优化目标可以是改善局部性、暴露并行性或组合多种循环变换。GCC 的 Graphite 负责循环变换，OpenMP 负责表达线程并行；两者使用各自的编译选项，并可组合使用。

![图 4：多面体变换示例](/images/gcc-openmp-compiler-report/figure-04.png)

*图 4：原报告引用的多面体示例，PPT 来源为 Prof. Uday Bondhugula 的 IMPACT20 分享。*

以 `A[i][j] = f(A[i-1][j], A[i][j-1])` 为例，同一行、同一列均存在前驱依赖，直接对任意一维加 `parallel for` 会破坏语义。若取 `t=i+j`，两个前驱均属于 `t-1`，同一个 `t` 的点之间则没有这两类依赖。调度 `(t,i)=(i+j,i)` 可以据此按波前组织计算；每个波前完成后再推进下一层。下列示例通过隐式 barrier 完成层间同步：

```c
#pragma omp parallel
{
    for (int t = 2; t <= 2*N-4; ++t) {
        int lo = max(1, t-(N-2));
        int hi = min(N-2, t-1);
        #pragma omp for schedule(static)
        for (int i = lo; i <= hi; ++i) {
            int j = t-i;
            A[i][j] = f(A[i-1][j], A[i][j-1]);
        } /* 隐式 barrier 保证整个波前完成 */
    }
}
```



![图 5：Graphite 流程概念图](/images/gcc-openmp-compiler-report/figure-05.png)

*图 5：原报告中的 Graphite 流程概念图 [2]。由 GCC 13.3.0 的诊断与生成代码核对。*

实现上，Graphite 从适合分析的控制流区域构建 SCoP，使用整数集合与调度表示进行分析、变换并重新生成 GIMPLE。对本次代码，运行时行跨度产生的访问演化式 `{0B,+,_1*8}_1` 被诊断为不能表示，动态尺寸版本最终是 `number of SCoPs: 0`。

固定数组行跨度后，同一五点更新被接受为 1 个 SCoP，并出现 `loop nest optimized`。在 `N=1024` 的诊断中，两维被切成大小 51 的 tile，调度从 `(i,j)` 变成以 `floor(i/51)`、`floor(j/51)` 表达 tile 顺序，再以 `i mod 51`、`j mod 51` 表达 tile 内顺序。进一步核查 `graphite-optimize-isl.cc` 与 [`params.opt`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/params.opt#L401-L403) 可知，51 来自本版本 `loop-block-tile-size` 参数的默认值。实验另设 `--param=loop-block-tile-size=0` 对照，以区分进入 Graphite 和实施分块的作用。其代码形态可以概括为：

```text
for each i tile:
    for each j tile:
        for each valid i inside this tile:
            for each valid j inside this tile:
                perform the original five-point update
```

完整诊断包含原始/变换后的调度与 isl AST。相关 Stencil 对照保存在首轮实验中，第 7 节以矩阵转置分析分块的性能效果。配置要求及选项含义以 [GCC 13.3.0 优化手册](https://gcc.gnu.org/onlinedocs/gcc-13.3.0/gcc/Optimize-Options.html) 为准；实现入口可查看 [`graphite.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/graphite.cc) 与 [`graphite-optimize-isl.cc`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/graphite-optimize-isl.cc)。

<a id="section-5-4-1"></a>

#### 5.4.1 矩阵转置分块

为更直接观察局部性变换，本次追加二维 out-of-place double 矩阵转置作为多面体主 workload。其源代码只包含以下未分块循环，没有手写 SIMD 或循环交换：

```c
for (int i=0; i<N; ++i)
    for (int j=0; j<N; ++j)
        B[j][i] = A[i][j];
```

每个迭代写不同的输出元素，数组无别名，行跨度在编译时固定，因而具备清楚的仿射分析条件。输入 A 在内层连续读取，B 的相邻写操作却相隔一行；分块可以改变缓存行和地址转换工作集的复用顺序。本次采用独立实现的矩阵布局转换内核；PolyBench GEMM、2MM、covariance 的预选数据保存在配套目录。

`N=1024` 的 Graphite dump 识别出 1 个 SCoP，将两层循环变为 51×51 tile 的四层循环：

```text
for c0 = 0..20:
  for c1 = 0..20:
    for c2 = 0..min(50,1023-51*c0):
      for c3 = 0..min(50,1023-51*c1):
        B[51*c1+c3][51*c0+c2] = A[51*c0+c2][51*c1+c3]
```

这份调度没有交换原来 i/j 的语义次序。实际 `transpose_poly` 反汇编中的核心搬运仍是：

```asm
vmovsd xmm0,QWORD PTR [rdi+r12*8]
inc    esi
add    rdx,0x2000
vmovsd QWORD PTR [rdx-0x2000],xmm0
```

这里 `0x2000=1024×8`，对应块内部跨一行的写入步长。外层 tile 更新位于 `.cold` 分区，其中 `add ...,0x33`（51）更新迭代边界，`add rbp,0x66000`（51×8192）推进块间地址。

本地的 `汇编与多面体分析.md` 同时记录 baseline/Graphite 的 `.s`、最终 GIMPLE、完整主/冷分区反汇编和实际 ELF。其构建顺序是先生成 `.s`，再直接汇编该 `.s` 为 `.o` 并链接测量，文件哈希将展示产物与被测程序对应起来。N=1024 时函数机器码从 baseline 的 140 字节变为包含冷分区的 441 字节，增加的代码主要用于分块控制。

baseline 的中端报告出现过向量化诊断，但最终搬运是展开后的标量 `vmovsd`；Graphite 的热循环同样是标量搬运。分块的性能效果见第 7 节。并行版另外编译每线程独占区间的 `range_*` 子核，并单独保存真实反汇编。

<a id="section-5-5"></a>

### 5.5 循环优化

SIMD 在单个线程中同时处理多个数据元素，OpenMP 线程并行则让多个线程执行各自的工作。`parallel for simd` 可组合这两层并行。GCC 的循环/SLP 向量化主要在 GIMPLE/SSA 中端进行，随后才在后端落实到目标指令。固定版本的 [`passes.def`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/gcc/passes.def#L290-L310) 可以核对 Graphite、自动并行和向量化相关 pass 的安排。

<a id="section-5-5-1"></a>

#### 5.5.1 SIMD 向量化

```c
void axpy(size_t n, float a, const float *restrict x, float *restrict y) {
    #pragma omp simd
    for (size_t i=0; i<n; ++i)
        y[i] += a*x[i];
}
```

连续访存使相邻元素适合装入向量寄存器；`restrict` 向编译器提供该接口要求的无别名条件，调用者必须满足它。`omp simd` 要求循环满足相应的数据依赖约束。

本次通过 `-fopenmp-simd -O3 -march=native -ffp-contract=off` 编译，诊断报告主循环使用 32 字节向量，另有 16 字节向量路径；汇编主循环包含以下指令：

```asm
vbroadcastss %xmm0, %ymm2
vmulps      (%rcx,%rax), %ymm2, %ymm1
vaddps      (%rdx,%rax), %ymm1, %ymm1
vmovups     %ymm1, (%rdx,%rax)
```

一个 256 位寄存器容纳 8 个 `float`，这些指令执行的是多元素乘、加与存储。本次生成的主循环使用 YMM 寄存器，尾部通过更窄向量或 `vmulss`、`vaddss` 等标量指令处理剩余元素。

对照版本同时保持优化等级、目标架构和浮点收缩设置一致，关闭循环向量化与 SLP；性能实验中的 GEMM/Stencil 则进一步保持线程数、输入和算术次序一致。两组均禁用 FMA 收缩，计时结果见第 7 节。

<a id="section-5-5-2"></a>

#### 5.5.2 循环展开

循环展开把多次迭代的主体放在一次循环控制中。例如每次处理 4 个元素可以减少分支和索引更新，并向指令调度暴露独立操作。它与 SIMD 可以组合，但“连续写四条标量操作”和“一条向量指令处理四个元素”并不是相同机制。向量化循环自身也可能被展开。

展开并非越多越好：代码体积、寄存器压力、尾部处理和指令缓存都会影响收益。GCC 在树级和 RTL 阶段均有循环相关优化。配套目录保存了启用 `-funroll-loops` 的 AXPY 汇编和优化诊断；第 7 节的性能消融针对向量化。

<a id="section-5-6"></a>

### 5.6 数据布局

循环调度改变“何时计算某个迭代点”，数据布局决定“该点对应的数据放在哪里”，线程映射再决定“由哪个执行单元计算”。这三种映射需要共同考虑依赖和物理存储。

本节将范畴论相关内容收为延伸阅读。对于布局组合的形式化分析，可参考原报告链接的 [Categorical Foundations for CuTe Layouts](https://research.colfax-intl.com/categorical-foundations-for-cute-layouts/) 与 [CuTe Layouts 代数](https://mp.weixin.qq.com/s/acPP0G3ZWnOA7bU0AUBfAw)。这些材料从代数角度讨论布局组合，可与本文的循环调度分析对照阅读。

<a id="section-6"></a>

## 6 OpenMP 运行库

编译产物中的 `GOMP_parallel` 把函数指针、数据环境和线程数交给运行库。以下分析以 GCC 13.3.0 上游的 Linux/POSIX 主机实现为准，核对 [`libgomp.h`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/libgomp.h)、`parallel.c`、`team.c`、`iter.c`、`task.c` 以及 Linux 等待实现。

<a id="section-6-1"></a>

### 6.1 并行区入口

在 [`parallel.c` 的 `GOMP_parallel`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/parallel.c#L172-L180) 中，入口逻辑可归纳为：解析有效团队大小，调用 `gomp_team_start` 准备团队，由当前线程执行传入的 `fn(data)`，最后经 `GOMP_parallel_end` 完成收尾。当前线程也参加区域执行，所以请求 p 个线程通常是当前线程加 p-1 个工作线程。

`num_threads(4)` 是线程数量请求的一部分，实际团队还受动态调整、嵌套层级、线程限制等内部控制变量约束。本次实验显式设置线程数、关闭动态调整并记录线程绑定与实际团队大小。

入口的两个参数直接对应第 5 节的编译结果：`fn` 指向 `add._omp_fn.0`，`data` 指向调用者准备的 `.omp_data_o.1`。因此，编译器不需要在每个源程序中重新实现线程池；它只要按照约定的运行库 ABI 传入入口、上下文与控制信息。

<a id="section-6-2"></a>

### 6.2 线程团队与线程池

| 核心结构 | 本路径中的职责 |
| --- | --- |
| `gomp_thread` | 当前线程的状态、团队状态、当前 task 与所属线程池等 |
| `gomp_thread_pool` | 可复用线程、使用数量以及线程停靠/唤醒相关状态 |
| `gomp_team` | 一次团队执行的元数据、同步状态、任务队列等 |
| `gomp_task` | 隐式或显式 task 的执行、父子关系与依赖状态 |
| `gomp_work_share` | 循环/sections 的共享分配状态，例如范围、步长、chunk 和 next |

[`team.c`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/team.c) 通过当前线程及线程池状态处理复用，嵌套与亲和性路径另有逻辑。

`gomp_team_start` 会考察既有线程数量和请求规模，为可复用线程更新入口与数据；确需新建时，POSIX 路径通过 `pthread_create` 进入 `gomp_thread_start`。工作线程入口包含等待再次加入团队的循环。并行区结束后，线程可以停靠在池中等待下一次工作，不必随每个区域销毁。

这个设计直接影响测量。第一次进入区域可能包含线程初始化和栈等开销；稳定执行的区域主要承受唤醒、分派与同步成本。本文每组配置预热后再计时，测量进程内稳定执行表现。100 个时间步中重复进入并行区域仍会累计唤醒、分派与同步开销。

<a id="section-6-3"></a>

### 6.3 循环调度

对于无指定 chunk 的静态分配，迭代通常能按线程编号划分为连续区间；显式 `static,c` 则按块轮转分配。编译器可以将某些静态边界计算直接展开，运行库也有对应实现路径。

动态分配则要求线程在完成当前 chunk 后继续领取。固定版本的 [`iter.c`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/iter.c#L178-L240) 包含原子 fetch-and-add、CAS 及相应锁路径。实现同时处理剩余范围、终止条件、正负步长和边界裁剪。正步长下的领取过程可简化为：

```text
重复领取：
    原子地申请一段候选区间
    若 start 已越过循环终点：返回无工作
    将 end 裁剪到循环终点
    执行 [start,end) 内的迭代
```

小 chunk 可以改善负载分配，也增加对共享迭代状态的访问；大 chunk 能减少领取次数，却可能留下尾部不均衡。调度收益取决于领取开销与负载均衡之间的权衡。第 7 节在相同循环上同时测试连续静态分配、轮转静态分配和两种动态 chunk，分别衡量均匀与渐增工作量。

<a id="section-6-4"></a>

### 6.4 任务调度

显式 task 的管理可沿 [`task.c`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/task.c) 追踪。运行库需要决定一个 task 是立即由当前线程执行，还是进入可延迟调度的状态。依赖关系依据 task 的依赖描述及相关规则建立；运行库通过父任务持有的依赖哈希表匹配相关兄弟任务，处理 `in`、`out`、`inout` 等关系。依赖满足后，任务进入就绪状态。

固定版本的 `gomp_task` 包含 `depend_hash`、`dependers` 和 `num_dependees` 等信息。完成 task 后，运行库会清理依赖记录，并检查依赖它的任务。在 `gomp_task_run_post_handle_dependers` 中，`num_dependees` 递减到零的任务会被放入适用的父任务、taskgroup 和团队优先级队列，并按需要唤醒等待者。队列更新与计数的正确性依赖调用路径和 `team->task_lock` 等保护。

libgomp 结合优先级队列、父子约束、任务组和锁组织任务调度。线程在 `taskwait` 与 barrier 期间也可能执行就绪任务，将同步等待与任务推进结合起来。

<a id="section-6-5"></a>

### 6.5 同步等待

Linux 实现使用原子状态和 futex 等机制；等待路径见 [`config/linux/wait.h`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/config/linux/wait.h#L42-L67)，barrier 还需结合 [`bar.c`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/config/linux/bar.c) 与 [`bar.h`](https://github.com/gcc-mirror/gcc/blob/releases/gcc-13.3.0/libgomp/config/linux/bar.h) 查看。

`do_spin(addr,val)` 在观察到状态变化时返回 0，在自旋预算耗尽、状态仍未改变时返回 1。`do_wait` 仅在后一种情况下调用 `futex_wait`。状态检查、原子内存序以及 futex 等待/唤醒共同构成等待机制。

[`OMP_WAIT_POLICY`](https://gcc.gnu.org/onlinedocs/libgomp/OMP_005fWAIT_005fPOLICY.html) 和 [`GOMP_SPINCOUNT`](https://gcc.gnu.org/onlinedocs/libgomp/GOMP_005fSPINCOUNT.html) 等设置会影响等待策略。本次主实验统一使用 `OMP_WAIT_POLICY=PASSIVE`，避免跨 192 个物理核的短区域中大量主动自旋影响比较。

本次 profiling 记录逐线程循环区间和显式 barrier 前后的墙钟时间，用于观察各线程工作完成时间的差异和同步等待。测量结果见第 7.5 节，测量设置见[附录 A](#appendix-a)。

<a id="section-7"></a>

## 7 性能实验

本节比较线程扩展、循环调度、SIMD 和 Graphite 分块的性能。线程配置为 **1、2、4、8、16、24、48、96、192 个物理核**，每个配置独立测量三次，图中误差条表示样本标准差。实验方法见[附录 A](#appendix-a)，完整数据见[附录 B](#appendix-b)。

<a id="section-7-1"></a>

### 7.1 线程扩展

![图 7-1：线程扩展](/images/gcc-openmp-compiler-report/scaling.png)

*图 7-1：GEMM、Stencil 和 MD 在两种规模下的线程扩展。加速比以各程序相同规模的单核配置为基线，保持 SIMD 设置一致。*

较小规模分别为 GEMM N=768、Stencil N=2048 和 MD 512 粒子；较大规模分别为 GEMM N=1536、Stencil N=4096 和 MD 1024 粒子。较大规模 GEMM 在 192 核下达到约 **91.42×** 加速；Stencil 在 48 核达到约 **45.10×**，到 192 核降为 **36.53×**；MD 在 96 核达到约 **10.93×**，192 核为 **10.79×**。

三种程序呈现不同的扩展趋势。GEMM 在较大规模下继续从更多核心获益，Stencil 和 MD 则较早进入平台期，部分高核数配置的运行时间反而上升。较小规模中，每线程分到的工作更少，运行库调度与同步的相对开销随之增加。少核配置中超过线性的加速比可能与缓存容量、访存并发、调频和系统活动有关。

<a id="section-7-2"></a>

### 7.2 循环调度

![图 7-2：循环调度](/images/gcc-openmp-compiler-report/scheduling.png)

*图 7-2：均匀与递增工作量下四种调度策略的运行时间，循环均包含 65536 次迭代。*

均匀工作量中，各迭代成本接近，连续静态分配即可把工作量分到各线程，动态领取主要增加共享状态访问。递增工作量中，连续区间会让后面的线程承担更多计算；轮转静态分配和动态领取均能缓解这种不均衡。

以 192 核的递增工作量为例，static 为 **17.05 ms**，static,64 降至 **13.19 ms**，dynamic,1 与 dynamic,64 分别为 **11.51 ms** 和 **11.77 ms**。图中各策略的排序随核数变化，反映了领取开销与尾部负载不均衡之间的权衡。

<a id="section-7-3"></a>

### 7.3 SIMD 性能

![图 7-3：SIMD 性能](/images/gcc-openmp-compiler-report/simd.png)

*图 7-3：GEMM 与 Stencil 以 scalar 为基线的加速比。scalar 关闭循环向量化和 SLP，auto 使用普通 O3，SIMD 在 O3 上加入显式 omp simd。*

auto 对照展示普通 O3 自动向量化的效果，SIMD 配置展示加入指令后的变化。GEMM N=1536、192 核时，scalar 为 **32.94 ms**，auto 为 **18.28 ms**，SIMD 为 **15.99 ms**；scalar/SIMD 配对加速比均值约为 **2.06×**。

Stencil 的收益更依赖规模与核数。例如 N=2048、4 核时，SIMD 相对 scalar 加速约 **1.79×**，而 N=4096、4 核时为 **0.94×**。auto 与 SIMD 在不少配置下接近，说明普通 O3 已经完成主要向量化工作。对应的向量指令与标量尾部处理见[第 5.5 节](#section-5-5)。

<a id="section-7-4"></a>

### 7.4 多面体优化性能

<a id="section-7-4-1"></a>

#### 7.4.1 单核转置

![图 7-4：单核转置](/images/gcc-openmp-compiler-report/transpose_serial.png)

*图 7-4：五种矩阵尺寸下的单核转置时间，分别采用 eviction64MiB 和 warm 两种缓存准备方式。*

矩阵转置 `B[j][i]=A[i][j]` 在内层连续读取 A，跨行写入 B。Graphite 将原来的两层循环变为 **51×51 分块**的四层循环，改变块级访问顺序。图中的 base 使用普通 O3，identity 启用 Graphite 代码生成，poly 启用循环嵌套优化，notile 在 poly 配置上将分块大小设为 0。

poly 在本轮单核实验中获得 **1.40–2.10×** 加速。N=4096、warm 时，base 为 **175.22 ms**，poly 为 **83.65 ms**。identity 与 notile 的时间接近 base，而默认分块的 poly 更快，说明本例的性能收益主要随分块变换出现。分块在 isl AST 和机器代码中的具体形式见[第 5.4.1 节](#section-5-4-1)。

<a id="section-7-4-2"></a>

#### 7.4.2 并行转置

![图 7-5：并行转置](/images/gcc-openmp-compiler-report/transpose_parallel.png)

*图 7-5：三种矩阵尺寸下的并行转置时间。每线程处理独占的连续 i 区间，分别调用四种编译配置的范围子核。*

本轮 27 组规模与核数组合中，默认分块均获得加速，base/poly 配对加速比均值为 **1.08–2.87×**。N=6144、192 核时，base 为 **19.04 ms**，poly 为 **6.68 ms**；N=1536、192 核时，加速约为 **1.14×**。较大矩阵中，分块带来的收益更加明显。

随着核数增加，每线程处理范围缩小，分块控制开销、输出复用与跨 NUMA 访问的相对作用随之变化。N=1536 的运行时间在 96 核附近达到低点，192 核时回升；N=6144 则继续从更多核心中获益。

<a id="section-7-5"></a>

### 7.5 屏障等待

![图 7-6：屏障等待](/images/gcc-openmp-compiler-report/profiling.png)

*图 7-6：递增工作量下 static 与 dynamic,64 的屏障时间占比，按各线程墙钟区间之和计算。*

static 下，较早完成工作的线程需要等待承担更多迭代的线程，2 核及以上的屏障时间占比约为 **37%–54%**。dynamic,64 使线程按完成进度继续领取工作，2 核时该比例约为 **0.10%**，明显低于 static 的 **37.05%**。

dynamic,64 的屏障时间占比随核数上升，到 192 核约为 **19.49%**，仍低于 static 的 **47.60%**。更多线程减少了单线程工作量，也提高了调度、唤醒和团队同步在总时间中的占比。这里的 loop 区间包含计算、调度及系统抢占时间，测量定义见[附录 A](#appendix-a)。

<a id="section-8"></a>

## 8 OpenMP 工业实践

在前文中，我们已经详细介绍了 OpenMP 程序的具体实现方式及其性能表现。目前，OpenMP 在 CPU 并行编程中已被广泛采用，尤其在高性能计算、大数据处理与科学计算等领域表现卓越。然而，我们所讨论的案例多为教学示例或学术场景下的应用。那么，在工业界的实际生产中，OpenMP 又是如何助力多核处理任务的呢？

非常有幸，在此次技术调研中，我们成功邀请到一位前英特尔（上海）的资深工程师接受访谈。作为 Intel OneDNN Graph Compiler 团队的核心研发成员，他深度参与了这款面向深度神经网络推理的 AI 编译器的开发工作——其核心使命，正是生成高度优化的计算图与高性能 CPU 并行算子，以充分发挥硬件潜力。

在短短六十分钟的交流中，他为我们系统梳理了 AI 编译器的技术栈与设计哲学，并深入分享了工业级场景中 OneDNN 项目使用 OpenMP 的大规模实践心得。我们了解到，很多 AI Compiler 里的技术和思想，其实就来源于传统编译器技术，比如两层 IR，多面体优化。在 AI Compiler 场景中，他们也发现了很多传统编译器在 OpenMP 上的使用瓶颈。

在实际应用中，OneDNN Graph Compiler 有使用 OpenMP 的接口。但是在运行时，Intel 工程师将 OpenMP 线程所做的工作，如自动化 for 循环，进行抛弃。他们仅保留最基础的 OpenMP 线程代码，随后将多线程的管理完全交给自身的系统库处理。前辈表示，这是由于 GCC 自身对循环的优化、自动化向量化等操作并不完美所做的决策（以及一部分政治因素）。完全交给自身的 Graph Compiler 来优化循环后，生成出来的算子 kernel 性能才更高。

前辈介绍了几种他们在 Graph Compiler 做了而 GCC 没有做的技术：比如在计算分块矩阵乘法时，如果一个线程完成了一个计算块的计算，但是需要等待其他线程完成同步时，其可以 preload 一部分接下来要计算的数据。同时对于大量的 CPU 计算 core，他们采用了分组的 barrier（即一部分线程同步完，即可进入下一组计算），这部分的提升是比较显著的。

![图 8](/images/gcc-openmp-compiler-report/figure-08.png)

*图 8: 分组 barrier*

访谈记录链接：[Notion Link](https://www.notion.so/Summary-on-meeting-with-former-Intel-Shanghai-Engineer-2925ab55420e803db972e15b03ce487b?source=copy_link)

<a id="section-9"></a>

## 9 结论

本文结合 GCC 13.3.0 源码、GIMPLE、最终汇编和运行结果，分析了 OpenMP 从前端解析到运行库执行的过程。编译器通过 lowering 与 expansion 建立数据环境、拆分并行函数并生成运行库调用，libgomp 负责线程复用、任务依赖、循环调度和同步等待。

实验覆盖九档物理核、多种输入规模、调度策略、SIMD 和矩阵转置，每个配置独立测量三次。GEMM 在 192 核下达到约 91.42× 加速，Stencil 与 MD 更早进入扩展平台期。矩阵转置经 Graphite 生成 51×51 分块，单核加速 1.40–2.10×，并行加速 1.08–2.87×。Stencil 中 Graphite 与向量化的相互影响也表明，循环变换需要结合最终代码和具体工作负载评价。

原始测量、构建脚本、编译诊断和二进制对应关系均保存在配套目录，可据此复现并继续开展硬件计数器与跨平台实验。

## 参考文献

[1] Alejandro Duran, Xavier Teruel, Roger Ferrer, Xavier Martorell, and Eduard Ayguade. Barcelona openmp tasks suite: A set of benchmarks targeting the exploitation of task parallelism in openmp. In Proceedings of the 2009 International Conference on Parallel Processing, ICPP ’09, page 124–131, USA, 2009. IEEE Computer Society.

[2] Sebastian Pop, Albert Cohen, Cédric Bastoul, Sylvain Girbal, Georges-André Silber, and Nicolas Vasilache. Graphite: Polyhedral analyses and optimizations for gcc. In Proceedings of the GCC Developers’ Summit, pages 1–21, 2006.

[3] Free Software Foundation. [GCC 13.3.0 Optimization Options](https://gcc.gnu.org/onlinedocs/gcc-13.3.0/gcc/Optimize-Options.html).

[4] GCC Developers. [GCC 13.3.0 发布版源码](https://github.com/gcc-mirror/gcc/tree/releases/gcc-13.3.0)，提交 `b71f1de6e9cf7181a288c0f39f9b1ef6580cf5c8`。本次核查的本地源码文件与 SHA-256 见配套目录。

[5] Free Software Foundation. [GNU libgomp 文档](https://gcc.gnu.org/onlinedocs/libgomp/)。版本敏感的实现结论另以固定的 GCC 13.3.0 源码为准。

<a id="appendix-a"></a>

## 附录 A 实验方法

每个配置在三个独立进程中各计时一次。初始化、参考计算、预热和校验在计时外，被测并行区的进入、计算与同步在计时内。

计算节点为 eightsocket：8×Xeon Platinum 8160，共 192 物理核、384 逻辑 CPU、8 NUMA 节点；8×V100 32GB 仅记录环境，本轮不运行 GPU。系统为 Ubuntu 24.04.4，GCC/G++ 13.3.0。公共编译参数是 `-O3 -march=native -ffp-contract=off`，OpenMP 驱动额外使用 `-fopenmp`。

线程实验从每个物理核选一个逻辑 CPU，使用显式 `OMP_PLACES`、`OMP_PROC_BIND=spread`、`OMP_DYNAMIC=FALSE`、`OMP_WAIT_POLICY=PASSIVE` 和 `numactl --interleave=all`。程序保存实际团队大小并要求等于请求值。串行转置固定 CPU0 与 NUMA0，分别执行 64MiB eviction pass 和紧接一次预热两种准备。串行与并行转置按各自的内存放置设置分别比较；缓存准备方式记为 `eviction64MiB` 和 `warm`。

| 实验 | 规模与配置 | 配置数 | 每点次数 |
| --- | --- | --- | --- |
| GEMM | N=768/1536 × 九档核数 × scalar/auto/SIMD | 54 | 3 |
| Stencil | N=2048/4096、100 步 × 九档核数 × 三种向量化配置 | 54 | 3 |
| MD | 512/1024 粒子、50 步 × 九档核数 | 18 | 3 |
| 调度 | 均匀/递增工作量 × 九档核数 × 四种策略 | 72 | 3 |
| 并行转置 | N=1536/3072/6144 × 九档核数 × 四种 Graphite 配置 | 108 | 3 |
| 串行转置 | 五种尺寸 × 两种缓存准备 × 四种 Graphite 配置 | 40 | 3 |
| 合计 | 346 个配置 | 346 | 1038 条计时 |

输入、重置与参考保持匹配：GEMM 使用 i-k-j double 累积，Stencil 使用双缓冲五点 Jacobi，MD 复用原项目函数。GEMM 内核内部的每行清零仍计时；Stencil 包含每步指针交换；MD 的驱动包含相同的初始力计算。它们对各自所有配置保持一致。GEMM/Stencil 参考对象独立编译且关闭向量化；MD 对照忽略 OpenMP 指令的独立串行对象；转置逐元素比较完整输出。1038 条记录中的最大归一化误差或绝对误差均为 0。

所有统计的原始三次值 t0/t1/t2 都保存在 `expanded_3runs/results/summary.csv`。加速比先对同一 repeat 的基线与对照取比值，再对三个比值计算均值和标准差。实验使用共享节点，未锁定 CPU 频率；误差条表示三次测量的样本标准差。

新主案例为固定行跨度、独立输出的矩阵转置 `B[j][i]=A[i][j]`。它没有手写 tile、循环交换、SIMD intrinsic 或线程指令；不同迭代写不同输出位置，适合核对仿射调度与局部性。PolyBench GEMM、2MM、covariance 的小规模预选未显示明确收益，数据保存在 `polybench_followup/results/pilot.jsonl`。本节采用独立实现的转置内核。

四种配置均保留完整普通 O3 优化：base 无 Graphite 附加选项；identity 仅加 `-fgraphite-identity`；poly 加 `-fgraphite-identity -floop-nest-optimize`，默认 tile=51；notile 再加 `--param=loop-block-tile-size=0`。

并行驱动让每线程处理独占的连续 i 范围，调用另外编译的 `range_base/identity/poly/notile` 子核。A/B/参考数组基址显式按 64 字节对齐，N=1536/3072/6144 均能被所有九档核数整除，且每线程处理范围为 8 个 double 的整数倍，从而避免不同线程同时写同一输出缓存行。线程团队创建和同步计入时间；Graphite 子核自身不再生成线程。

每个线程配置运行三个独立进程，记录递增工作量循环的各线程 loop 区间和退出显式 barrier 的区间。先在一次运行中计算 `sum(barrier)/(sum(loop)+sum(barrier))`，再对三次比例取均值和样本标准差。

这些比例按墙钟区间计算，loop 区间包含计算、调度及系统抢占时间。节点设置 `perf_event_paranoid=4`，硬件事件和软件 task-clock 访问均被拒绝，因此本轮采用上述软件计时，失败日志保存在实验目录。

<a id="appendix-b"></a>

## 附录 B 实验数据

以下统计表与第 7 节图表使用同一批测量。时间单位为毫秒，结果为三次测量的均值 ± 样本标准差；加速比按同一 repeat 配对计算。

<a id="appendix-b-1"></a>

### B.1 线程扩展数据

**较小规模：GEMM N=768，Stencil N=2048，MD 512 粒子。**

| 物理核 | GEMM ms | Stencil ms | MD ms |
| --- | --- | --- | --- |
| 1 | 156.693 ± 5.275 | 1090.861 ± 4.383 | 337.547 ± 17.591 |
| 2 | 94.015 ± 13.334 | 366.097 ± 8.196 | 299.026 ± 7.055 |
| 4 | 54.533 ± 2.166 | 123.008 ± 1.167 | 168.432 ± 5.067 |
| 8 | 32.479 ± 8.347 | 87.809 ± 4.134 | 104.251 ± 3.747 |
| 16 | 20.060 ± 5.074 | 62.362 ± 0.514 | 82.201 ± 4.912 |
| 24 | 14.052 ± 3.255 | 47.968 ± 0.202 | 79.363 ± 6.593 |
| 48 | 8.068 ± 0.668 | 38.101 ± 0.268 | 77.445 ± 6.521 |
| 96 | 4.777 ± 0.094 | 52.584 ± 2.383 | 73.625 ± 3.826 |
| 192 | 3.046 ± 0.084 | 94.792 ± 5.609 | 105.574 ± 18.248 |

**较大规模：GEMM N=1536，Stencil N=4096，MD 1024 粒子。**

| 物理核 | GEMM ms | Stencil ms | MD ms |
| --- | --- | --- | --- |
| 1 | 1459.682 ± 26.567 | 4830.017 ± 15.013 | 1323.576 ± 20.390 |
| 2 | 730.072 ± 15.240 | 2305.681 ± 1.985 | 686.273 ± 5.063 |
| 4 | 356.842 ± 3.622 | 1128.243 ± 84.976 | 408.664 ± 44.064 |
| 8 | 214.245 ± 31.104 | 357.371 ± 4.696 | 302.933 ± 44.285 |
| 16 | 111.177 ± 19.999 | 211.059 ± 1.482 | 183.414 ± 9.108 |
| 24 | 77.876 ± 2.096 | 164.627 ± 3.378 | 143.804 ± 8.660 |
| 48 | 42.889 ± 5.995 | 107.094 ± 0.825 | 125.642 ± 7.867 |
| 96 | 28.300 ± 6.852 | 110.101 ± 3.735 | 121.130 ± 1.805 |
| 192 | 15.993 ± 0.929 | 132.225 ± 1.633 | 123.483 ± 11.415 |

<a id="appendix-b-2"></a>

### B.2 循环调度数据

| 工作量 | 核数 | static ms | static,64 ms | dynamic,1 ms | dynamic,64 ms |
| --- | --- | --- | --- | --- | --- |
| 均匀 | 1 | 569.817 ± 0.163 | 570.303 ± 0.640 | 573.709 ± 0.082 | 570.300 ± 0.433 |
| 均匀 | 2 | 286.345 ± 1.380 | 305.080 ± 33.319 | 295.761 ± 0.177 | 285.462 ± 0.457 |
| 均匀 | 4 | 194.327 ± 54.903 | 206.101 ± 55.050 | 182.458 ± 30.310 | 179.158 ± 34.265 |
| 均匀 | 8 | 90.885 ± 30.725 | 108.157 ± 31.259 | 94.003 ± 16.339 | 102.179 ± 9.034 |
| 均匀 | 16 | 63.364 ± 0.041 | 63.365 ± 0.087 | 62.396 ± 2.148 | 57.602 ± 3.570 |
| 均匀 | 24 | 48.419 ± 3.157 | 40.904 ± 4.439 | 39.382 ± 0.417 | 47.400 ± 2.325 |
| 均匀 | 48 | 31.500 ± 8.630 | 41.057 ± 0.048 | 31.078 ± 8.688 | 34.006 ± 2.631 |
| 均匀 | 96 | 22.355 ± 0.562 | 23.372 ± 0.072 | 18.967 ± 4.766 | 20.539 ± 3.111 |
| 均匀 | 192 | 10.905 ± 1.975 | 12.013 ± 2.246 | 11.920 ± 0.720 | 11.286 ± 1.793 |
| 递增 | 1 | 570.968 ± 0.209 | 571.139 ± 0.569 | 574.272 ± 0.424 | 571.224 ± 0.465 |
| 递增 | 2 | 428.522 ± 1.535 | 299.612 ± 22.025 | 296.523 ± 0.942 | 286.531 ± 0.311 |
| 递增 | 4 | 261.873 ± 21.351 | 222.364 ± 17.819 | 183.461 ± 30.719 | 166.564 ± 40.027 |
| 递增 | 8 | 167.969 ± 59.149 | 90.983 ± 31.333 | 102.818 ± 5.620 | 105.447 ± 11.570 |
| 递增 | 16 | 122.200 ± 0.015 | 64.278 ± 0.175 | 62.477 ± 1.954 | 59.446 ± 2.536 |
| 递增 | 24 | 82.416 ± 0.018 | 43.320 ± 6.252 | 39.926 ± 4.497 | 44.762 ± 5.019 |
| 递增 | 48 | 44.500 ± 4.567 | 41.274 ± 0.109 | 25.541 ± 10.761 | 35.001 ± 1.664 |
| 递增 | 96 | 29.410 ± 8.740 | 24.702 ± 0.025 | 19.328 ± 4.210 | 21.963 ± 2.056 |
| 递增 | 192 | 17.053 ± 4.863 | 13.191 ± 1.216 | 11.514 ± 2.055 | 11.772 ± 2.463 |

<a id="appendix-b-3"></a>

### B.3 SIMD 数据

SIMD 表中 scalar 为 O3 加关闭 loop/SLP 向量化，auto 为普通 O3，SIMD 为 O3 加显式 omp simd。三个版本使用相同输入、线程数、浮点收缩设置和计时范围；MD 公共对象不包含在本节的向量化消融中。时间单位为毫秒；最后一列是三个配对 scalar/SIMD 比值的均值 ± 标准差。

| 内核 | N | 核数 | scalar ms | auto ms | SIMD ms | scalar/SIMD |
| --- | --- | --- | --- | --- | --- | --- |
| GEMM | 768 | 1 | 211.555 ± 3.567 | 157.114 ± 6.798 | 156.693 ± 5.275 | 1.35 ± 0.07× |
| GEMM | 768 | 2 | 143.606 ± 37.071 | 92.972 ± 12.612 | 94.015 ± 13.334 | 1.55 ± 0.46× |
| GEMM | 768 | 4 | 89.824 ± 0.112 | 51.741 ± 2.438 | 54.533 ± 2.166 | 1.65 ± 0.06× |
| GEMM | 768 | 8 | 47.578 ± 4.228 | 28.089 ± 1.288 | 32.479 ± 8.347 | 1.51 ± 0.25× |
| GEMM | 768 | 16 | 32.754 ± 8.043 | 21.106 ± 3.720 | 20.060 ± 5.074 | 1.72 ± 0.60× |
| GEMM | 768 | 24 | 26.649 ± 7.522 | 15.597 ± 1.244 | 14.052 ± 3.255 | 2.04 ± 0.97× |
| GEMM | 768 | 48 | 14.136 ± 3.097 | 8.082 ± 1.185 | 8.068 ± 0.668 | 1.78 ± 0.50× |
| GEMM | 768 | 96 | 7.655 ± 1.272 | 4.064 ± 0.520 | 4.777 ± 0.094 | 1.61 ± 0.29× |
| GEMM | 768 | 192 | 4.482 ± 0.393 | 3.049 ± 0.251 | 3.046 ± 0.084 | 1.47 ± 0.14× |
| GEMM | 1536 | 1 | 1879.926 ± 55.126 | 1445.992 ± 36.224 | 1459.682 ± 26.567 | 1.29 ± 0.02× |
| GEMM | 1536 | 2 | 928.075 ± 15.126 | 718.746 ± 12.373 | 730.072 ± 15.240 | 1.27 ± 0.01× |
| GEMM | 1536 | 4 | 463.502 ± 8.599 | 361.407 ± 3.472 | 356.842 ± 3.622 | 1.30 ± 0.01× |
| GEMM | 1536 | 8 | 243.498 ± 21.484 | 198.321 ± 32.362 | 214.245 ± 31.104 | 1.16 ± 0.29× |
| GEMM | 1536 | 16 | 189.277 ± 5.206 | 119.833 ± 1.065 | 111.177 ± 19.999 | 1.74 ± 0.32× |
| GEMM | 1536 | 24 | 129.062 ± 3.313 | 72.181 ± 9.831 | 77.876 ± 2.096 | 1.66 ± 0.05× |
| GEMM | 1536 | 48 | 64.400 ± 0.316 | 46.663 ± 5.737 | 42.889 ± 5.995 | 1.52 ± 0.21× |
| GEMM | 1536 | 96 | 43.162 ± 6.802 | 32.028 ± 4.726 | 28.300 ± 6.852 | 1.61 ± 0.56× |
| GEMM | 1536 | 192 | 32.935 ± 0.214 | 18.278 ± 2.061 | 15.993 ± 0.929 | 2.06 ± 0.12× |
| STENCIL | 2048 | 1 | 1098.400 ± 3.148 | 1103.029 ± 4.783 | 1090.861 ± 4.383 | 1.01 ± 0.01× |
| STENCIL | 2048 | 2 | 418.100 ± 23.078 | 369.264 ± 9.166 | 366.097 ± 8.196 | 1.14 ± 0.05× |
| STENCIL | 2048 | 4 | 220.743 ± 2.434 | 122.828 ± 4.601 | 123.008 ± 1.167 | 1.79 ± 0.02× |
| STENCIL | 2048 | 8 | 117.455 ± 2.738 | 91.249 ± 1.789 | 87.809 ± 4.134 | 1.34 ± 0.07× |
| STENCIL | 2048 | 16 | 95.946 ± 0.350 | 61.740 ± 0.389 | 62.362 ± 0.514 | 1.54 ± 0.02× |
| STENCIL | 2048 | 24 | 76.942 ± 0.921 | 47.224 ± 0.260 | 47.968 ± 0.202 | 1.60 ± 0.02× |
| STENCIL | 2048 | 48 | 55.095 ± 1.034 | 38.263 ± 0.589 | 38.101 ± 0.268 | 1.45 ± 0.03× |
| STENCIL | 2048 | 96 | 61.974 ± 2.152 | 54.228 ± 3.697 | 52.584 ± 2.383 | 1.18 ± 0.08× |
| STENCIL | 2048 | 192 | 93.033 ± 10.055 | 87.904 ± 2.710 | 94.792 ± 5.609 | 0.98 ± 0.10× |
| STENCIL | 4096 | 1 | 4857.097 ± 2.435 | 4875.782 ± 8.159 | 4830.017 ± 15.013 | 1.01 ± 0.00× |
| STENCIL | 4096 | 2 | 2354.108 ± 31.112 | 2342.247 ± 4.593 | 2305.681 ± 1.985 | 1.02 ± 0.01× |
| STENCIL | 4096 | 4 | 1053.697 ± 3.832 | 1064.829 ± 35.858 | 1128.243 ± 84.976 | 0.94 ± 0.07× |
| STENCIL | 4096 | 8 | 471.859 ± 3.170 | 362.195 ± 4.200 | 357.371 ± 4.696 | 1.32 ± 0.01× |
| STENCIL | 4096 | 16 | 265.881 ± 2.133 | 210.692 ± 0.262 | 211.059 ± 1.482 | 1.26 ± 0.02× |
| STENCIL | 4096 | 24 | 207.569 ± 0.491 | 160.911 ± 0.414 | 164.627 ± 3.378 | 1.26 ± 0.03× |
| STENCIL | 4096 | 48 | 151.622 ± 0.295 | 105.730 ± 0.679 | 107.094 ± 0.825 | 1.42 ± 0.01× |
| STENCIL | 4096 | 96 | 140.268 ± 1.599 | 110.202 ± 0.277 | 110.101 ± 3.735 | 1.28 ± 0.06× |
| STENCIL | 4096 | 192 | 143.486 ± 2.517 | 175.588 ± 75.773 | 132.225 ± 1.633 | 1.09 ± 0.03× |

<a id="appendix-b-4"></a>

### B.4 单核转置数据

| N | 准备 | base ms | identity ms | poly ms | notile ms | base/poly |
| --- | --- | --- | --- | --- | --- | --- |
| 512 | eviction64MiB | 1.129 ± 0.004 | 1.129 ± 0.001 | 0.705 ± 0.002 | 1.129 ± 0.004 | 1.60 ± 0.01× |
| 1024 | eviction64MiB | 4.589 ± 0.018 | 4.669 ± 0.090 | 2.932 ± 0.033 | 4.594 ± 0.007 | 1.57 ± 0.01× |
| 1536 | eviction64MiB | 11.747 ± 0.323 | 11.733 ± 0.054 | 7.411 ± 0.048 | 11.766 ± 0.041 | 1.58 ± 0.03× |
| 2048 | eviction64MiB | 27.989 ± 0.495 | 27.834 ± 0.041 | 17.631 ± 0.247 | 27.778 ± 0.016 | 1.59 ± 0.05× |
| 4096 | eviction64MiB | 177.389 ± 6.452 | 178.250 ± 2.163 | 85.946 ± 0.695 | 179.013 ± 2.600 | 2.06 ± 0.07× |
| 512 | warm | 1.120 ± 0.001 | 1.128 ± 0.010 | 0.847 ± 0.257 | 1.120 ± 0.001 | 1.40 ± 0.36× |
| 1024 | warm | 4.554 ± 0.041 | 4.558 ± 0.052 | 2.853 ± 0.040 | 4.536 ± 0.027 | 1.60 ± 0.03× |
| 1536 | warm | 11.590 ± 0.042 | 11.859 ± 0.187 | 7.553 ± 0.508 | 11.607 ± 0.052 | 1.54 ± 0.10× |
| 2048 | warm | 28.407 ± 0.987 | 28.491 ± 0.411 | 17.456 ± 0.240 | 28.135 ± 0.426 | 1.63 ± 0.06× |
| 4096 | warm | 175.221 ± 12.891 | 177.258 ± 16.759 | 83.648 ± 1.515 | 173.811 ± 11.849 | 2.10 ± 0.18× |

<a id="appendix-b-5"></a>

### B.5 并行转置数据

| N | 核数 | base ms | identity ms | poly ms | notile ms | base/poly |
| --- | --- | --- | --- | --- | --- | --- |
| 1536 | 1 | 16.199 ± 0.669 | 16.370 ± 0.473 | 14.992 ± 0.591 | 16.452 ± 0.965 | 1.08 ± 0.05× |
| 1536 | 2 | 18.645 ± 0.924 | 18.672 ± 0.940 | 15.133 ± 0.138 | 19.461 ± 1.108 | 1.23 ± 0.06× |
| 1536 | 4 | 9.442 ± 0.464 | 9.550 ± 0.594 | 7.830 ± 0.197 | 9.702 ± 0.737 | 1.21 ± 0.09× |
| 1536 | 8 | 4.706 ± 0.115 | 4.580 ± 0.053 | 3.906 ± 0.035 | 4.731 ± 0.117 | 1.20 ± 0.03× |
| 1536 | 16 | 2.449 ± 0.117 | 2.473 ± 0.138 | 2.084 ± 0.062 | 2.493 ± 0.100 | 1.18 ± 0.07× |
| 1536 | 24 | 1.726 ± 0.037 | 1.727 ± 0.054 | 1.455 ± 0.013 | 1.755 ± 0.132 | 1.19 ± 0.01× |
| 1536 | 48 | 1.104 ± 0.014 | 1.099 ± 0.032 | 0.928 ± 0.055 | 1.104 ± 0.022 | 1.19 ± 0.08× |
| 1536 | 96 | 0.905 ± 0.077 | 0.923 ± 0.037 | 0.828 ± 0.019 | 0.893 ± 0.018 | 1.09 ± 0.07× |
| 1536 | 192 | 1.079 ± 0.075 | 1.179 ± 0.101 | 0.949 ± 0.024 | 1.092 ± 0.026 | 1.14 ± 0.06× |
| 3072 | 1 | 110.093 ± 3.218 | 112.247 ± 5.204 | 83.679 ± 0.208 | 107.800 ± 3.869 | 1.32 ± 0.04× |
| 3072 | 2 | 61.610 ± 0.680 | 62.186 ± 1.190 | 46.952 ± 1.672 | 63.347 ± 3.357 | 1.31 ± 0.04× |
| 3072 | 4 | 42.590 ± 1.333 | 42.437 ± 1.675 | 30.603 ± 0.110 | 41.655 ± 1.516 | 1.39 ± 0.04× |
| 3072 | 8 | 24.087 ± 0.058 | 24.116 ± 0.098 | 15.352 ± 0.048 | 24.041 ± 0.062 | 1.57 ± 0.01× |
| 3072 | 16 | 12.267 ± 0.081 | 12.248 ± 0.096 | 7.963 ± 0.119 | 12.323 ± 0.037 | 1.54 ± 0.02× |
| 3072 | 24 | 8.356 ± 0.070 | 8.291 ± 0.027 | 5.356 ± 0.020 | 8.283 ± 0.095 | 1.56 ± 0.01× |
| 3072 | 48 | 4.380 ± 0.054 | 4.372 ± 0.068 | 2.873 ± 0.015 | 4.349 ± 0.044 | 1.52 ± 0.01× |
| 3072 | 96 | 2.639 ± 0.093 | 2.573 ± 0.023 | 1.873 ± 0.015 | 2.549 ± 0.016 | 1.41 ± 0.04× |
| 3072 | 192 | 1.923 ± 0.057 | 1.960 ± 0.036 | 1.598 ± 0.089 | 1.975 ± 0.034 | 1.20 ± 0.03× |
| 6144 | 1 | 897.666 ± 7.750 | 898.437 ± 5.722 | 355.906 ± 4.821 | 896.311 ± 1.326 | 2.52 ± 0.03× |
| 6144 | 2 | 452.971 ± 2.255 | 457.163 ± 2.618 | 189.568 ± 6.960 | 451.825 ± 0.572 | 2.39 ± 0.10× |
| 6144 | 4 | 240.205 ± 11.400 | 242.436 ± 5.689 | 100.336 ± 4.295 | 237.502 ± 9.371 | 2.39 ± 0.06× |
| 6144 | 8 | 117.163 ± 1.599 | 117.035 ± 1.362 | 53.298 ± 2.629 | 118.588 ± 1.715 | 2.20 ± 0.13× |
| 6144 | 16 | 63.999 ± 1.325 | 62.167 ± 2.706 | 34.131 ± 0.889 | 63.264 ± 0.118 | 1.88 ± 0.09× |
| 6144 | 24 | 50.442 ± 1.050 | 50.468 ± 0.594 | 22.260 ± 0.152 | 50.039 ± 0.416 | 2.27 ± 0.05× |
| 6144 | 48 | 27.893 ± 1.119 | 28.148 ± 1.134 | 11.765 ± 0.035 | 28.065 ± 1.390 | 2.37 ± 0.09× |
| 6144 | 96 | 18.369 ± 0.242 | 19.727 ± 0.754 | 6.690 ± 0.280 | 18.710 ± 0.891 | 2.75 ± 0.08× |
| 6144 | 192 | 19.040 ± 1.616 | 23.907 ± 9.408 | 6.683 ± 0.623 | 20.282 ± 2.119 | 2.87 ± 0.42× |

<a id="appendix-b-6"></a>

### B.6 屏障等待数据

| 核数 | static 屏障暴露 | dynamic64 屏障暴露 |
| --- | --- | --- |
| 1 | 0.00 ± 0.00% | 0.00 ± 0.00% |
| 2 | 37.05 ± 0.36% | 0.10 ± 0.06% |
| 4 | 42.80 ± 6.27% | 0.32 ± 0.11% |
| 8 | 54.09 ± 2.38% | 0.79 ± 0.29% |
| 16 | 52.06 ± 2.26% | 1.36 ± 0.09% |
| 24 | 48.28 ± 2.36% | 3.04 ± 0.86% |
| 48 | 45.64 ± 3.65% | 6.89 ± 1.80% |
| 96 | 48.61 ± 3.13% | 13.48 ± 0.73% |
| 192 | 47.60 ± 0.27% | 19.49 ± 0.93% |

<a id="appendix-b-7"></a>

### B.7 原始计时

以下列出全部 346 个配置的三次原始计时，**单位为秒**，t0/t1/t2 对应 repeat 0/1/2。列名沿用本地 `summary.csv`；调度实验的 steps=1 表示均匀工作量，steps=2 表示递增工作量。完整运行记录保存在作者本地的 `kernels.jsonl`、`transpose_serial.jsonl` 和 `transpose_parallel.jsonl`。

<a id="appendix-b-7-1"></a>

#### B.7.1 GEMM

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 768 | 1 | 1 | auto | shared | 0.14967325795441866 | 0.15866562799783424 | 0.16300185496220365 |
| 768 | 1 | 1 | base | shared | 0.2098293110029772 | 0.2091796409804374 | 0.21565667900722474 |
| 768 | 1 | 1 | simd | shared | 0.1605316490167752 | 0.15886939998017624 | 0.15067816898226738 |
| 768 | 1 | 2 | auto | shared | 0.10031593102030456 | 0.07840931101236492 | 0.10019199695670977 |
| 768 | 1 | 2 | base | shared | 0.1475517789949663 | 0.1047191210091114 | 0.17854606499895453 |
| 768 | 1 | 2 | simd | shared | 0.07861850596964359 | 0.10170927899889648 | 0.10171821300173178 |
| 768 | 1 | 4 | auto | shared | 0.05026024900143966 | 0.05455504299607128 | 0.0504087979788892 |
| 768 | 1 | 4 | base | shared | 0.08992067101644352 | 0.08970122196478769 | 0.0898490899708122 |
| 768 | 1 | 4 | simd | shared | 0.05637277098139748 | 0.052145495952572674 | 0.055079701996874064 |
| 768 | 1 | 8 | auto | shared | 0.02677424903959036 | 0.029348796990234405 | 0.028144068957772106 |
| 768 | 1 | 8 | base | shared | 0.04524346999824047 | 0.04503307701088488 | 0.05245866801124066 |
| 768 | 1 | 8 | simd | shared | 0.029807561018969864 | 0.02579510898794979 | 0.04183432797435671 |
| 768 | 1 | 16 | auto | shared | 0.025143934006337076 | 0.02035631303442642 | 0.01781852904241532 |
| 768 | 1 | 16 | base | shared | 0.04186681000282988 | 0.02664400899084285 | 0.029751634981948882 |
| 768 | 1 | 16 | simd | shared | 0.019127651990856975 | 0.02553498902125284 | 0.015516481944359839 |
| 768 | 1 | 24 | auto | shared | 0.014415281999390572 | 0.016895645996555686 | 0.015481353970244527 |
| 768 | 1 | 24 | base | shared | 0.03064007597276941 | 0.01797282398911193 | 0.03133522201096639 |
| 768 | 1 | 24 | simd | shared | 0.015635507996194065 | 0.016212331014685333 | 0.010309029021300375 |
| 768 | 1 | 48 | auto | shared | 0.008972126001026481 | 0.0085356300114654 | 0.006736768002156168 |
| 768 | 1 | 48 | base | shared | 0.015833521028980613 | 0.016013406042475253 | 0.010561642004176974 |
| 768 | 1 | 48 | simd | shared | 0.007439409964717925 | 0.007995353022124618 | 0.008768834988586605 |
| 768 | 1 | 96 | auto | shared | 0.004043250984977931 | 0.004593899007886648 | 0.003554101043846458 |
| 768 | 1 | 96 | base | shared | 0.008312641992233694 | 0.00846332695800811 | 0.006188833969645202 |
| 768 | 1 | 96 | simd | shared | 0.004729762033093721 | 0.004714894981589168 | 0.004885130969341844 |
| 768 | 1 | 192 | auto | shared | 0.0033355900086462498 | 0.0028714569634757936 | 0.002939093974418938 |
| 768 | 1 | 192 | base | shared | 0.004244634008500725 | 0.004935363016556948 | 0.004264799994416535 |
| 768 | 1 | 192 | simd | shared | 0.0029702819883823395 | 0.0030313440365716815 | 0.0031366909970529377 |
| 1536 | 1 | 1 | auto | shared | 1.4177196319797076 | 1.4334319220506586 | 1.4868245440302417 |
| 1536 | 1 | 1 | base | shared | 1.8324961669859476 | 1.8668743429589085 | 1.9404064749833196 |
| 1536 | 1 | 1 | simd | shared | 1.4491283050156198 | 1.4400128590059467 | 1.4899045859929174 |
| 1536 | 1 | 2 | auto | shared | 0.7145641400129534 | 0.7090052620042115 | 0.7326672950293869 |
| 1536 | 1 | 2 | base | shared | 0.910975345002953 | 0.9335432940279134 | 0.9397052560234442 |
| 1536 | 1 | 2 | simd | shared | 0.7176838449668139 | 0.7254416000214405 | 0.7470906070084311 |
| 1536 | 1 | 4 | auto | shared | 0.3591016859863885 | 0.3597196760238148 | 0.3654001170070842 |
| 1536 | 1 | 4 | base | shared | 0.45508993399562314 | 0.4631409809808247 | 0.47227645304519683 |
| 1536 | 1 | 4 | simd | shared | 0.3533668990130536 | 0.3565644010086544 | 0.3605947880423628 |
| 1536 | 1 | 8 | auto | shared | 0.17723674594890326 | 0.23558222397696227 | 0.18214422598248348 |
| 1536 | 1 | 8 | base | shared | 0.22841079294448718 | 0.2680957719567232 | 0.23398865800118074 |
| 1536 | 1 | 8 | simd | shared | 0.22863892203895375 | 0.1785502849961631 | 0.23554458399303257 |
| 1536 | 1 | 16 | auto | shared | 0.12016195198521018 | 0.1186420579906553 | 0.12069442903157324 |
| 1536 | 1 | 16 | base | shared | 0.18580369395203888 | 0.1867644700105302 | 0.1952624170226045 |
| 1536 | 1 | 16 | simd | shared | 0.08816855400800705 | 0.12097386998357251 | 0.12438870797632262 |
| 1536 | 1 | 24 | auto | shared | 0.07765365700470284 | 0.0608324030181393 | 0.0780584110179916 |
| 1536 | 1 | 24 | base | shared | 0.12524064898025244 | 0.13112916599493474 | 0.13081508100731298 |
| 1536 | 1 | 24 | simd | shared | 0.0766654740436934 | 0.07666561397491023 | 0.08029670501127839 |
| 1536 | 1 | 48 | auto | shared | 0.04004183801589534 | 0.04979765700409189 | 0.050150488037616014 |
| 1536 | 1 | 48 | base | shared | 0.06476509902859107 | 0.06421636801678687 | 0.06421875796513632 |
| 1536 | 1 | 48 | simd | shared | 0.038306501985061914 | 0.04068625596119091 | 0.04967331199441105 |
| 1536 | 1 | 96 | auto | shared | 0.0267978529445827 | 0.03329210000811145 | 0.03599285800009966 |
| 1536 | 1 | 96 | base | shared | 0.04686786304228008 | 0.03531208704225719 | 0.04730701301014051 |
| 1536 | 1 | 96 | simd | shared | 0.023392432020045817 | 0.03612867899937555 | 0.0253793079755269 |
| 1536 | 1 | 192 | auto | shared | 0.019514145038556308 | 0.019420597003772855 | 0.015898521000053734 |
| 1536 | 1 | 192 | base | shared | 0.03307570901233703 | 0.032689012004993856 | 0.03304030100116506 |
| 1536 | 1 | 192 | simd | shared | 0.015133755980059505 | 0.015867095964495093 | 0.01697852194774896 |

<a id="appendix-b-7-2"></a>

#### B.7.2 Stencil

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2048 | 100 | 1 | auto | shared | 1.1072482590097934 | 1.0978320940048434 | 1.10400553495856 |
| 2048 | 100 | 1 | base | shared | 1.0989239150076173 | 1.1012531500309706 | 1.095023560046684 |
| 2048 | 100 | 1 | simd | shared | 1.0948045850382186 | 1.086142857966479 | 1.0916365190059878 |
| 2048 | 100 | 2 | auto | shared | 0.3796187049592845 | 0.3659848660463467 | 0.3621876100078225 |
| 2048 | 100 | 2 | base | shared | 0.39300942595582455 | 0.42287268297513947 | 0.4384191599674523 |
| 2048 | 100 | 2 | simd | shared | 0.36211359401931986 | 0.36065515695372596 | 0.375523389026057 |
| 2048 | 100 | 4 | auto | shared | 0.12810043897479773 | 0.12075291504152119 | 0.11962977197254077 |
| 2048 | 100 | 4 | base | shared | 0.22325332305626944 | 0.22058251302223653 | 0.2183941979892552 |
| 2048 | 100 | 4 | simd | shared | 0.12404038500972092 | 0.12174194701947272 | 0.12324213504325598 |
| 2048 | 100 | 8 | auto | shared | 0.09331461996771395 | 0.09024200600106269 | 0.09019072295632213 |
| 2048 | 100 | 8 | base | shared | 0.12061634403653443 | 0.11588489200221375 | 0.11586337198968977 |
| 2048 | 100 | 8 | simd | shared | 0.08811678201891482 | 0.08352939400356263 | 0.09178017498925328 |
| 2048 | 100 | 16 | auto | shared | 0.061915341997519135 | 0.06201025802874938 | 0.06129408802371472 |
| 2048 | 100 | 16 | base | shared | 0.09621625195723027 | 0.09607194998534396 | 0.0955500680138357 |
| 2048 | 100 | 16 | simd | shared | 0.061808566038962454 | 0.06282587500754744 | 0.06245095399208367 |
| 2048 | 100 | 24 | auto | shared | 0.04752288502641022 | 0.04710084100952372 | 0.04704921500524506 |
| 2048 | 100 | 24 | base | shared | 0.07648002199130133 | 0.07800232601584867 | 0.07634236401645467 |
| 2048 | 100 | 24 | simd | shared | 0.047760948014911264 | 0.0479775849962607 | 0.048164447012823075 |
| 2048 | 100 | 48 | auto | shared | 0.03769450000254437 | 0.03822360996855423 | 0.038871235970873386 |
| 2048 | 100 | 48 | base | shared | 0.053917568002361804 | 0.05585741897812113 | 0.055508645018562675 |
| 2048 | 100 | 48 | simd | shared | 0.03833760000998154 | 0.03815442300401628 | 0.037809818983078 |
| 2048 | 100 | 96 | auto | shared | 0.05734942900016904 | 0.050145766988862306 | 0.05518887599464506 |
| 2048 | 100 | 96 | base | shared | 0.06049563700798899 | 0.06444213300710544 | 0.06098308099899441 |
| 2048 | 100 | 96 | simd | shared | 0.05142913298914209 | 0.050999564002268016 | 0.055324296990875155 |
| 2048 | 100 | 192 | auto | shared | 0.0909490369958803 | 0.0857551569934003 | 0.08700834301998839 |
| 2048 | 100 | 192 | base | shared | 0.10461769596440718 | 0.08792080800049007 | 0.08656153798801824 |
| 2048 | 100 | 192 | simd | shared | 0.09752381895668805 | 0.08833972195861861 | 0.09851122600957751 |
| 4096 | 100 | 1 | auto | shared | 4.885081355983857 | 4.869826139009092 | 4.87243942997884 |
| 4096 | 100 | 1 | base | shared | 4.857273728994187 | 4.85457928199321 | 4.859439191001002 |
| 4096 | 100 | 1 | simd | shared | 4.815845781005919 | 4.82845713198185 | 4.845749030006118 |
| 4096 | 100 | 2 | auto | shared | 2.3428839370026253 | 2.3373683220124803 | 2.34648779098643 |
| 4096 | 100 | 2 | base | shared | 2.341201759991236 | 2.389595925982576 | 2.3315269380109385 |
| 4096 | 100 | 2 | simd | shared | 2.3043538040365092 | 2.304725063033402 | 2.3079630040447228 |
| 4096 | 100 | 4 | auto | shared | 1.0443294169963337 | 1.1062336890026927 | 1.0439246409805492 |
| 4096 | 100 | 4 | base | shared | 1.0513273219694383 | 1.051646015024744 | 1.0581189180375077 |
| 4096 | 100 | 4 | simd | shared | 1.1727874820353463 | 1.0302562640281394 | 1.1816857770318165 |
| 4096 | 100 | 8 | auto | shared | 0.36691893701208755 | 0.35888343496480957 | 0.3607812779955566 |
| 4096 | 100 | 8 | base | shared | 0.4697581789805554 | 0.4703136899624951 | 0.4755059599992819 |
| 4096 | 100 | 8 | simd | shared | 0.3519480259856209 | 0.3600326790474355 | 0.36013094399822876 |
| 4096 | 100 | 16 | auto | shared | 0.21056609897641465 | 0.21051697502844036 | 0.21099309297278523 |
| 4096 | 100 | 16 | base | shared | 0.26587086502695456 | 0.2680192150291987 | 0.2637522889999673 |
| 4096 | 100 | 16 | simd | shared | 0.21217744704335928 | 0.20937713800230995 | 0.2116211639950052 |
| 4096 | 100 | 24 | auto | shared | 0.16135091899195686 | 0.16085236001526937 | 0.16052866203244776 |
| 4096 | 100 | 24 | base | shared | 0.2081241919659078 | 0.20739039301406592 | 0.20719280297635123 |
| 4096 | 100 | 24 | simd | shared | 0.1625809620018117 | 0.16852523101260886 | 0.16277425998123363 |
| 4096 | 100 | 48 | auto | shared | 0.10583811596734449 | 0.10500298696570098 | 0.1063478360301815 |
| 4096 | 100 | 48 | base | shared | 0.15185546496650204 | 0.15129089303081855 | 0.15171895996900275 |
| 4096 | 100 | 48 | simd | shared | 0.10803468897938728 | 0.10649163799826056 | 0.10675553797045723 |
| 4096 | 100 | 96 | auto | shared | 0.1104745109914802 | 0.11021177901420742 | 0.10992055904353037 |
| 4096 | 100 | 96 | base | shared | 0.13994932698551565 | 0.14200312102911994 | 0.13885227701393887 |
| 4096 | 100 | 96 | simd | shared | 0.11251468898262829 | 0.10579913604306057 | 0.11198865302139893 |
| 4096 | 100 | 192 | auto | shared | 0.263066227955278 | 0.13036156498128548 | 0.13333715102635324 |
| 4096 | 100 | 192 | base | shared | 0.145642768999096 | 0.14409411197993904 | 0.14072093699360266 |
| 4096 | 100 | 192 | simd | shared | 0.13200486899586394 | 0.1307125559542328 | 0.1339562579523772 |

<a id="appendix-b-7-3"></a>

#### B.7.3 MD

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 512 | 50 | 1 | simd | shared | 0.3274962430004962 | 0.35785850801039487 | 0.3272853280068375 |
| 512 | 50 | 2 | simd | shared | 0.29501634696498513 | 0.29488876595860347 | 0.30717251799069345 |
| 512 | 50 | 4 | simd | shared | 0.1627063340274617 | 0.17233801301335916 | 0.1702507379814051 |
| 512 | 50 | 8 | simd | shared | 0.10008351696887985 | 0.10733999899821356 | 0.10533059301087633 |
| 512 | 50 | 16 | simd | shared | 0.08016820502234623 | 0.08780359401134774 | 0.07863260601880029 |
| 512 | 50 | 24 | simd | shared | 0.07514659804292023 | 0.08696147601585835 | 0.07598178798798472 |
| 512 | 50 | 48 | simd | shared | 0.08003638300579041 | 0.07002689701039344 | 0.08227276400430128 |
| 512 | 50 | 96 | simd | shared | 0.07722466997802258 | 0.06960738002089784 | 0.07404444698477164 |
| 512 | 50 | 192 | simd | shared | 0.09147087403107435 | 0.12618308805394918 | 0.09906829701503739 |
| 1024 | 50 | 1 | simd | shared | 1.3469594399794005 | 1.314267823996488 | 1.309500786010176 |
| 1024 | 50 | 2 | simd | shared | 0.6917824310366996 | 0.6852138669928536 | 0.6818234579986893 |
| 1024 | 50 | 4 | simd | shared | 0.41486845997860655 | 0.3618271970190108 | 0.4492974780150689 |
| 1024 | 50 | 8 | simd | shared | 0.2523991640191525 | 0.32142460998147726 | 0.33497447497211397 |
| 1024 | 50 | 16 | simd | shared | 0.1836279730196111 | 0.1924130609841086 | 0.17420060600852594 |
| 1024 | 50 | 24 | simd | shared | 0.1415420380071737 | 0.153370876039844 | 0.1364990550209768 |
| 1024 | 50 | 48 | simd | shared | 0.13291659898823127 | 0.11729254899546504 | 0.12671823700657114 |
| 1024 | 50 | 96 | simd | shared | 0.11913683696184307 | 0.12159748800331727 | 0.12265457300236449 |
| 1024 | 50 | 192 | simd | shared | 0.11180235602660105 | 0.12403446401003748 | 0.13461234798887745 |

<a id="appendix-b-7-4"></a>

#### B.7.4 循环调度

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 65536 | 1 | 1 | dynamic,1 | shared | 0.5736212279880419 | 0.5737837499473244 | 0.5737225609482266 |
| 65536 | 1 | 1 | dynamic,64 | shared | 0.5699951780261472 | 0.5701089730137028 | 0.5707957089762203 |
| 65536 | 1 | 1 | static | shared | 0.5698051280342042 | 0.5699858209700324 | 0.5696611300227232 |
| 65536 | 1 | 1 | static,64 | shared | 0.5700691800448112 | 0.5710274879820645 | 0.5698127479990944 |
| 65536 | 1 | 2 | dynamic,1 | shared | 0.29596391797531396 | 0.2956392939668149 | 0.29568091104738414 |
| 65536 | 1 | 2 | dynamic,64 | shared | 0.285984183952678 | 0.28526963701006025 | 0.2851327039534226 |
| 65536 | 1 | 2 | static | shared | 0.2857241359888576 | 0.2879260020563379 | 0.28538348199799657 |
| 65536 | 1 | 2 | static,64 | shared | 0.34355417697224766 | 0.2858342370018363 | 0.2858521249727346 |
| 65536 | 1 | 4 | dynamic,1 | shared | 0.14793650002684444 | 0.20470857003238052 | 0.1947279890300706 |
| 65536 | 1 | 4 | dynamic,64 | shared | 0.21150835702428594 | 0.143254810012877 | 0.18270985496928915 |
| 65536 | 1 | 4 | static | shared | 0.14251035399502143 | 0.18860149598913267 | 0.25186772795859724 |
| 65536 | 1 | 4 | static,64 | shared | 0.14289224497042596 | 0.23187623004196212 | 0.24353483703453094 |
| 65536 | 1 | 8 | dynamic,1 | shared | 0.07652548199985176 | 0.0965876699774526 | 0.10889469797257334 |
| 65536 | 1 | 8 | dynamic,64 | shared | 0.1064509879797697 | 0.09180160501273349 | 0.10828424798091874 |
| 65536 | 1 | 8 | static | shared | 0.0717281749821268 | 0.07460192596772686 | 0.12632405804470181 |
| 65536 | 1 | 8 | static,64 | shared | 0.12623380403965712 | 0.12617537897313014 | 0.07206182298250496 |
| 65536 | 1 | 16 | dynamic,1 | shared | 0.059959146019537 | 0.0640154029824771 | 0.06321268697502092 |
| 65536 | 1 | 16 | dynamic,64 | shared | 0.05866525799501687 | 0.0605206880136393 | 0.05362126603722572 |
| 65536 | 1 | 16 | static | shared | 0.06340947502758354 | 0.06332831701729447 | 0.06335448299068958 |
| 65536 | 1 | 16 | static,64 | shared | 0.06343699200078845 | 0.06326891196658835 | 0.06338907196186483 |
| 65536 | 1 | 24 | dynamic,1 | shared | 0.03960367396939546 | 0.038900871004443616 | 0.03963996400125325 |
| 65536 | 1 | 24 | dynamic,64 | shared | 0.048554501961916685 | 0.04892158502480015 | 0.04472283698851243 |
| 65536 | 1 | 24 | static | shared | 0.051368902961257845 | 0.04508999298559502 | 0.04879733797861263 |
| 65536 | 1 | 24 | static,64 | shared | 0.0427901049843058 | 0.044087998976465315 | 0.035832572961226106 |
| 65536 | 1 | 48 | dynamic,1 | shared | 0.021158480958547443 | 0.034739972034003586 | 0.037334438995458186 |
| 65536 | 1 | 48 | dynamic,64 | shared | 0.0324127379572019 | 0.032561624015215784 | 0.03704214299796149 |
| 65536 | 1 | 48 | static | shared | 0.031396619975566864 | 0.02292106399545446 | 0.04018106102012098 |
| 65536 | 1 | 48 | static,64 | shared | 0.041001626988872886 | 0.041080277995206416 | 0.04108969197841361 |
| 65536 | 1 | 96 | dynamic,1 | shared | 0.02323283505393192 | 0.019844227994326502 | 0.013822525972500443 |
| 65536 | 1 | 96 | dynamic,64 | shared | 0.017176056979224086 | 0.023314314952585846 | 0.021128071995917708 |
| 65536 | 1 | 96 | static | shared | 0.02267117303563282 | 0.022688186028972268 | 0.021706794970668852 |
| 65536 | 1 | 96 | static,64 | shared | 0.023422549944370985 | 0.023289760982152075 | 0.023402919992804527 |
| 65536 | 1 | 192 | dynamic,1 | shared | 0.011629279993940145 | 0.011391366017051041 | 0.01273973099887371 |
| 65536 | 1 | 192 | dynamic,64 | shared | 0.009577789984177798 | 0.013153030013199896 | 0.011126304976642132 |
| 65536 | 1 | 192 | static | shared | 0.008624597976449877 | 0.012015666987281293 | 0.012075881008058786 |
| 65536 | 1 | 192 | static,64 | shared | 0.00941978202899918 | 0.013336968026123941 | 0.013282531988807023 |
| 65536 | 2 | 1 | dynamic,1 | shared | 0.573802581988275 | 0.5743878119974397 | 0.5746269299997948 |
| 65536 | 2 | 1 | dynamic,64 | shared | 0.5706958320224658 | 0.5714047329965979 | 0.5715720939915627 |
| 65536 | 2 | 1 | static | shared | 0.5707357909996063 | 0.5711415449623019 | 0.5710265069501474 |
| 65536 | 2 | 1 | static,64 | shared | 0.5706953440094367 | 0.5717801690334454 | 0.57094111997867 |
| 65536 | 2 | 2 | dynamic,1 | shared | 0.2976077380008064 | 0.2960526369861327 | 0.2959096679696813 |
| 65536 | 2 | 2 | dynamic,64 | shared | 0.2868881869944744 | 0.2863841020152904 | 0.2863205220201053 |
| 65536 | 2 | 2 | static | shared | 0.42763568804366514 | 0.43029439001111314 | 0.4276373210013844 |
| 65536 | 2 | 2 | static,64 | shared | 0.32503263803664595 | 0.2862648180453107 | 0.28753718198277056 |
| 65536 | 2 | 4 | dynamic,1 | shared | 0.1480442970059812 | 0.20287078199908137 | 0.1994688760023564 |
| 65536 | 2 | 4 | dynamic,64 | shared | 0.2127837180159986 | 0.14340970403281972 | 0.1434994350420311 |
| 65536 | 2 | 4 | static | shared | 0.24953834095504135 | 0.24955444602528587 | 0.2865270950132981 |
| 65536 | 2 | 4 | static,64 | shared | 0.2018676699954085 | 0.2310519739985466 | 0.2341720309923403 |
| 65536 | 2 | 8 | dynamic,1 | shared | 0.1030431260005571 | 0.09708874503849074 | 0.10832262400072068 |
| 65536 | 2 | 8 | dynamic,64 | shared | 0.10696436796570197 | 0.0931930509977974 | 0.1161830109776929 |
| 65536 | 2 | 8 | static | shared | 0.13382292998721823 | 0.13381577702239156 | 0.23626793996663764 |
| 65536 | 2 | 8 | static,64 | shared | 0.07363210298353806 | 0.12715349602513015 | 0.0721635950030759 |
| 65536 | 2 | 16 | dynamic,1 | shared | 0.06027754896786064 | 0.0640129119856283 | 0.06313978001708165 |
| 65536 | 2 | 16 | dynamic,64 | shared | 0.06152127397945151 | 0.0601972010335885 | 0.056618181988596916 |
| 65536 | 2 | 16 | static | shared | 0.1221928329905495 | 0.12221808196045458 | 0.12219019199255854 |
| 65536 | 2 | 16 | static,64 | shared | 0.06419594498584047 | 0.06415902002481744 | 0.06447917298646644 |
| 65536 | 2 | 24 | dynamic,1 | shared | 0.041005461011081934 | 0.034987388004083186 | 0.04378458997234702 |
| 65536 | 2 | 24 | dynamic,64 | shared | 0.03948355105239898 | 0.04947311902651563 | 0.04532787500647828 |
| 65536 | 2 | 24 | static | shared | 0.0824152659624815 | 0.08239862497430295 | 0.0824351649498567 |
| 65536 | 2 | 24 | static,64 | shared | 0.048655916005373 | 0.04486214101780206 | 0.03644147299928591 |
| 65536 | 2 | 48 | dynamic,1 | shared | 0.02235983998980373 | 0.01672990102088079 | 0.037534422997850925 |
| 65536 | 2 | 48 | dynamic,64 | shared | 0.0341242229915224 | 0.03395961597561836 | 0.03691989299841225 |
| 65536 | 2 | 48 | static | shared | 0.04185025399783626 | 0.041876549017615616 | 0.0497736869729124 |
| 65536 | 2 | 48 | static,64 | shared | 0.04126292100409046 | 0.04138776002218947 | 0.041170439042616636 |
| 65536 | 2 | 96 | dynamic,1 | shared | 0.023085722990799695 | 0.020119549008086324 | 0.014778384007513523 |
| 65536 | 2 | 96 | dynamic,64 | shared | 0.019721026008483022 | 0.02375899103935808 | 0.022408892982639372 |
| 65536 | 2 | 96 | static | shared | 0.039163004024885595 | 0.02228611899772659 | 0.02678038302110508 |
| 65536 | 2 | 96 | static,64 | shared | 0.024672908009961247 | 0.024715920037124306 | 0.0247174029937014 |
| 65536 | 2 | 192 | dynamic,1 | shared | 0.012771022971719503 | 0.012628524971660227 | 0.009142966999206692 |
| 65536 | 2 | 192 | dynamic,64 | shared | 0.008956184959970415 | 0.013529766001738608 | 0.012829643033910543 |
| 65536 | 2 | 192 | static | shared | 0.01336355198873207 | 0.022563856036867946 | 0.015232757024932653 |
| 65536 | 2 | 192 | static,64 | shared | 0.013611294038128108 | 0.011820507992524654 | 0.014142100990284234 |

<a id="appendix-b-7-5"></a>

#### B.7.5 单核转置

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 512 | 0 | 1 | base | eviction64MiB | 0.00113370904000476 | 0.001126750954426825 | 0.0011275350116193295 |
| 512 | 0 | 1 | base | warm | 0.001119013992138207 | 0.0011197409476153553 | 0.0011202640016563237 |
| 512 | 0 | 1 | identity | eviction64MiB | 0.0011280130129307508 | 0.0011297530145384371 | 0.001129587006289512 |
| 512 | 0 | 1 | identity | warm | 0.0011386770056560636 | 0.001121903012972325 | 0.0011220670421607792 |
| 512 | 0 | 1 | notile | eviction64MiB | 0.001131280034314841 | 0.0011243749759159982 | 0.001129965006839484 |
| 512 | 0 | 1 | notile | warm | 0.001118116022553295 | 0.0011195450206287205 | 0.0011210470111109316 |
| 512 | 0 | 1 | poly | eviction64MiB | 0.0007038359763100743 | 0.0007078509661369026 | 0.0007036589668132365 |
| 512 | 0 | 1 | poly | warm | 0.001143762026913464 | 0.0007002060301601887 | 0.0006964210188016295 |
| 1024 | 0 | 1 | base | eviction64MiB | 0.004599204985424876 | 0.004567861964460462 | 0.004599655047059059 |
| 1024 | 0 | 1 | base | warm | 0.004532088001724333 | 0.004528987978119403 | 0.004602043016348034 |
| 1024 | 0 | 1 | identity | eviction64MiB | 0.004622410982847214 | 0.004772881977260113 | 0.004611087031662464 |
| 1024 | 0 | 1 | identity | warm | 0.00461479602381587 | 0.004511501989327371 | 0.0045473260106518865 |
| 1024 | 0 | 1 | notile | eviction64MiB | 0.004602813976816833 | 0.004589050018694252 | 0.004591320001054555 |
| 1024 | 0 | 1 | notile | warm | 0.0045570009970106184 | 0.004505409975536168 | 0.004544271971099079 |
| 1024 | 0 | 1 | poly | eviction64MiB | 0.0029651999939233065 | 0.0028983319643884897 | 0.0029327020165510476 |
| 1024 | 0 | 1 | poly | warm | 0.002896780031733215 | 0.0028201250243000686 | 0.0028410369995981455 |
| 1536 | 0 | 1 | base | eviction64MiB | 0.012120167957618833 | 0.011575037962757051 | 0.011546417023055255 |
| 1536 | 0 | 1 | base | warm | 0.011599046003539115 | 0.011627798026893288 | 0.011544655018951744 |
| 1536 | 0 | 1 | identity | eviction64MiB | 0.01179142901673913 | 0.011724026990123093 | 0.011684360972139984 |
| 1536 | 0 | 1 | identity | warm | 0.011723282979801297 | 0.011781284993048757 | 0.012072328012436628 |
| 1536 | 0 | 1 | notile | eviction64MiB | 0.011811973003204912 | 0.011731209990102798 | 0.011755270010326058 |
| 1536 | 0 | 1 | notile | warm | 0.011616266972851008 | 0.011653678957372904 | 0.01155090902466327 |
| 1536 | 0 | 1 | poly | eviction64MiB | 0.007459095038939267 | 0.007412260980345309 | 0.007362188014667481 |
| 1536 | 0 | 1 | poly | warm | 0.008137818018440157 | 0.007304497994482517 | 0.007217261998448521 |
| 2048 | 0 | 1 | base | eviction64MiB | 0.02771636500256136 | 0.028560717008076608 | 0.027691126975696534 |
| 2048 | 0 | 1 | base | warm | 0.02804508403642103 | 0.027652115968521684 | 0.029524384008254856 |
| 2048 | 0 | 1 | identity | eviction64MiB | 0.02785460598533973 | 0.027787040977273136 | 0.02785972401034087 |
| 2048 | 0 | 1 | identity | warm | 0.02893986803246662 | 0.028398037946317345 | 0.028133946005254984 |
| 2048 | 0 | 1 | notile | eviction64MiB | 0.02776180801447481 | 0.027780289005022496 | 0.02779274299973622 |
| 2048 | 0 | 1 | notile | warm | 0.028232673997990787 | 0.027669249975588173 | 0.028503326990175992 |
| 2048 | 0 | 1 | poly | eviction64MiB | 0.01779390702722594 | 0.017346768989227712 | 0.017752990999724716 |
| 2048 | 0 | 1 | poly | warm | 0.017214825958944857 | 0.017694370006211102 | 0.017458697024267167 |
| 4096 | 0 | 1 | base | eviction64MiB | 0.1798584430362098 | 0.1700676730251871 | 0.18224235699744895 |
| 4096 | 0 | 1 | base | warm | 0.18556966300820932 | 0.16078083595493808 | 0.17931121098808944 |
| 4096 | 0 | 1 | identity | eviction64MiB | 0.1799015470314771 | 0.17580189899308607 | 0.17904657899634913 |
| 4096 | 0 | 1 | identity | warm | 0.19128301402088255 | 0.15869881300022826 | 0.18179339298512787 |
| 4096 | 0 | 1 | notile | eviction64MiB | 0.18182577402330935 | 0.1785143529996276 | 0.17669873998966068 |
| 4096 | 0 | 1 | notile | warm | 0.18522372096776962 | 0.16156900400528684 | 0.17464119102805853 |
| 4096 | 0 | 1 | poly | eviction64MiB | 0.0854066300089471 | 0.08570189698366448 | 0.08672989602200687 |
| 4096 | 0 | 1 | poly | warm | 0.08353345701470971 | 0.08521685597952455 | 0.08219371002633125 |

<a id="appendix-b-7-6"></a>

#### B.7.6 并行转置

| N | steps | 核数 | 配置 | 缓存准备 | t0 (s) | t1 (s) | t2 (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1536 | 0 | 1 | base | shared | 0.01588359201559797 | 0.015746019023936242 | 0.016967847011983395 |
| 1536 | 0 | 1 | identity | shared | 0.01617733098100871 | 0.016909351979847997 | 0.016023986972868443 |
| 1536 | 0 | 1 | notile | shared | 0.015642726968508214 | 0.01619284797925502 | 0.01752045296598226 |
| 1536 | 0 | 1 | poly | shared | 0.015455037995707244 | 0.014326477015856653 | 0.015193447994533926 |
| 1536 | 0 | 2 | base | shared | 0.01757819898193702 | 0.019151996995788068 | 0.0192040289985016 |
| 1536 | 0 | 2 | identity | shared | 0.01804695895407349 | 0.018215877003967762 | 0.019752571010030806 |
| 1536 | 0 | 2 | notile | shared | 0.018848587991669774 | 0.018795741023495793 | 0.020739889005199075 |
| 1536 | 0 | 2 | poly | shared | 0.015072606969624758 | 0.015290148032363504 | 0.015034807031042874 |
| 1536 | 0 | 4 | base | shared | 0.009968203026801348 | 0.009269280009903014 | 0.009089966944884509 |
| 1536 | 0 | 4 | identity | shared | 0.008997069031465799 | 0.009475100960116833 | 0.01017859298735857 |
| 1536 | 0 | 4 | notile | shared | 0.01028092100750655 | 0.009953224973287433 | 0.008872301026713103 |
| 1536 | 0 | 4 | poly | shared | 0.0076038489933125675 | 0.007956714020110667 | 0.007930567022413015 |
| 1536 | 0 | 8 | base | shared | 0.004804465046618134 | 0.0047344890190288424 | 0.004579598025884479 |
| 1536 | 0 | 8 | identity | shared | 0.004520265967585146 | 0.004597620980348438 | 0.0046210209839046 |
| 1536 | 0 | 8 | notile | shared | 0.004791050974745303 | 0.004596459970343858 | 0.004804898984730244 |
| 1536 | 0 | 8 | poly | shared | 0.003944510011933744 | 0.00387679401319474 | 0.0038956640055403113 |
| 1536 | 0 | 16 | base | shared | 0.00237372302217409 | 0.002583716996014118 | 0.002389069995842874 |
| 1536 | 0 | 16 | identity | shared | 0.0024108010111376643 | 0.00237706903135404 | 0.002631073002703488 |
| 1536 | 0 | 16 | notile | shared | 0.002538334985729307 | 0.002378022007178515 | 0.0025614359765313566 |
| 1536 | 0 | 16 | poly | shared | 0.002031228970736265 | 0.0020692420075647533 | 0.0021519529982469976 |
| 1536 | 0 | 24 | base | shared | 0.0017010869923979044 | 0.001768467016518116 | 0.0017073529888875782 |
| 1536 | 0 | 24 | identity | shared | 0.0016651349724270403 | 0.0017493829946033657 | 0.001765702967531979 |
| 1536 | 0 | 24 | notile | shared | 0.0016707399627193809 | 0.0016867490485310555 | 0.0019074039882980287 |
| 1536 | 0 | 24 | poly | shared | 0.0014457399956882 | 0.0014695980353280902 | 0.0014488319866359234 |
| 1536 | 0 | 48 | base | shared | 0.0011153939994983375 | 0.0010882469941861928 | 0.0011071760090999305 |
| 1536 | 0 | 48 | identity | shared | 0.0010741149890236557 | 0.001088427030481398 | 0.0011350770364515483 |
| 1536 | 0 | 48 | notile | shared | 0.0011107460013590753 | 0.001079824985936284 | 0.0011215879931114614 |
| 1536 | 0 | 48 | poly | shared | 0.0008644019835628569 | 0.000950536981690675 | 0.0009678459609858692 |
| 1536 | 0 | 96 | base | shared | 0.0009814249933697283 | 0.0008271069964393973 | 0.0009056720300577581 |
| 1536 | 0 | 96 | identity | shared | 0.0009652170119807124 | 0.000903898966498673 | 0.000900016981177032 |
| 1536 | 0 | 96 | notile | shared | 0.0009110980317927897 | 0.0008742770296521485 | 0.0008938810206018388 |
| 1536 | 0 | 96 | poly | shared | 0.0008488100138492882 | 0.0008111749775707722 | 0.0008229470113292336 |
| 1536 | 0 | 192 | base | shared | 0.0010654469951987267 | 0.0011592329828999937 | 0.0010116580524481833 |
| 1536 | 0 | 192 | identity | shared | 0.0011115469969809055 | 0.0011310300324112177 | 0.001294934016186744 |
| 1536 | 0 | 192 | notile | shared | 0.0010664150468073785 | 0.0010927600087597966 | 0.0011179239954799414 |
| 1536 | 0 | 192 | poly | shared | 0.0009618650074116886 | 0.0009637299808673561 | 0.0009220759966410697 |
| 3072 | 0 | 1 | base | shared | 0.11250937503064051 | 0.10643957502907142 | 0.11132908001309261 |
| 3072 | 0 | 1 | identity | shared | 0.10930531099438667 | 0.11825561098521575 | 0.10918108001351357 |
| 3072 | 0 | 1 | notile | shared | 0.10547110199695453 | 0.11226611497113481 | 0.10566179896704853 |
| 3072 | 0 | 1 | poly | shared | 0.08362474897876382 | 0.0839086229680106 | 0.08350379497278482 |
| 3072 | 0 | 2 | base | shared | 0.062202212982811034 | 0.06175931898178533 | 0.0608669730136171 |
| 3072 | 0 | 2 | identity | shared | 0.06271688500419259 | 0.06301829300355166 | 0.060822570987511426 |
| 3072 | 0 | 2 | notile | shared | 0.06110461999196559 | 0.06173038296401501 | 0.06720673100790009 |
| 3072 | 0 | 2 | poly | shared | 0.047397560032550246 | 0.048356385028455406 | 0.04510345304151997 |
| 3072 | 0 | 4 | base | shared | 0.04107301402837038 | 0.04357379500288516 | 0.04312465700786561 |
| 3072 | 0 | 4 | identity | shared | 0.04345288698095828 | 0.040503911033738405 | 0.0433546649874188 |
| 3072 | 0 | 4 | notile | shared | 0.04340339795453474 | 0.04071073600789532 | 0.04085111996391788 |
| 3072 | 0 | 4 | poly | shared | 0.03053865401307121 | 0.030729380028788 | 0.03053977299714461 |
| 3072 | 0 | 8 | base | shared | 0.024024537997320294 | 0.02409863902721554 | 0.024139194982126355 |
| 3072 | 0 | 8 | identity | shared | 0.024016937997657806 | 0.02421222598059103 | 0.024118879984598607 |
| 3072 | 0 | 8 | notile | shared | 0.024066836980637163 | 0.02408589201513678 | 0.023970397014636546 |
| 3072 | 0 | 8 | poly | shared | 0.015398427029140294 | 0.015301954990718514 | 0.01535593398148194 |
| 3072 | 0 | 16 | base | shared | 0.012191317044198513 | 0.01235251099569723 | 0.012257736001629382 |
| 3072 | 0 | 16 | identity | shared | 0.012141229992266744 | 0.012275709013920277 | 0.012326903990469873 |
| 3072 | 0 | 16 | notile | shared | 0.012365452013909817 | 0.012309214973356575 | 0.012294396001379937 |
| 3072 | 0 | 16 | poly | shared | 0.007907419989351183 | 0.008100176986772567 | 0.007882817008066922 |
| 3072 | 0 | 24 | base | shared | 0.008392593008466065 | 0.008400679042097181 | 0.008275786996819079 |
| 3072 | 0 | 24 | identity | shared | 0.00826116098323837 | 0.008301210997160524 | 0.008312040008604527 |
| 3072 | 0 | 24 | notile | shared | 0.008218539005611092 | 0.008237790956627578 | 0.008391859009861946 |
| 3072 | 0 | 24 | poly | shared | 0.005378284025937319 | 0.0053391699912026525 | 0.005349345970898867 |
| 3072 | 0 | 48 | base | shared | 0.004432411980815232 | 0.004382984945550561 | 0.0043235839693807065 |
| 3072 | 0 | 48 | identity | shared | 0.004384141997434199 | 0.004298629995901138 | 0.004432027984876186 |
| 3072 | 0 | 48 | notile | shared | 0.004399558994919062 | 0.004320518055465072 | 0.004327858972828835 |
| 3072 | 0 | 48 | poly | shared | 0.0028899090248160064 | 0.0028628259897232056 | 0.0028652219916693866 |
| 3072 | 0 | 96 | base | shared | 0.002743216056842357 | 0.002566550043411553 | 0.00260705198161304 |
| 3072 | 0 | 96 | identity | shared | 0.0025807879865169525 | 0.0025902880006469786 | 0.0025469179963693023 |
| 3072 | 0 | 96 | notile | shared | 0.002567154006101191 | 0.002537333988584578 | 0.002543671987950802 |
| 3072 | 0 | 96 | poly | shared | 0.0018894189852289855 | 0.001867402985226363 | 0.001861537981312722 |
| 3072 | 0 | 192 | base | shared | 0.0018996879807673395 | 0.00188064097892493 | 0.001988053962122649 |
| 3072 | 0 | 192 | identity | shared | 0.0019473989959806204 | 0.0020014530164189637 | 0.0019325109897181392 |
| 3072 | 0 | 192 | notile | shared | 0.0020129659678786993 | 0.001961850968655199 | 0.00194871099665761 |
| 3072 | 0 | 192 | poly | shared | 0.0015704930410720408 | 0.001525964995380491 | 0.0016977229970507324 |
| 6144 | 0 | 1 | base | shared | 0.8898028180119582 | 0.8978986950241961 | 0.9052968229516409 |
| 6144 | 0 | 1 | identity | shared | 0.8994204690097831 | 0.8922865400090814 | 0.903603254002519 |
| 6144 | 0 | 1 | notile | shared | 0.8977109590196051 | 0.8961480869911611 | 0.8950747860362753 |
| 6144 | 0 | 1 | poly | shared | 0.35102021996863186 | 0.3606586609967053 | 0.3560381180141121 |
| 6144 | 0 | 2 | base | shared | 0.45434353896416724 | 0.4503685250529088 | 0.45420039899181575 |
| 6144 | 0 | 2 | identity | shared | 0.45876699703512713 | 0.45858005399350077 | 0.4541412590187974 |
| 6144 | 0 | 2 | notile | shared | 0.4524755119928159 | 0.45140228600939736 | 0.45159759500529617 |
| 6144 | 0 | 2 | poly | shared | 0.1925595739739947 | 0.19453280296875164 | 0.18161269597476348 |
| 6144 | 0 | 4 | base | shared | 0.22722052299650386 | 0.24857293698005378 | 0.24482219299534336 |
| 6144 | 0 | 4 | identity | shared | 0.23597004497423768 | 0.24466360796941444 | 0.24667471699649468 |
| 6144 | 0 | 4 | notile | shared | 0.24369519401807338 | 0.22672096401220188 | 0.24208952899789438 |
| 6144 | 0 | 4 | poly | shared | 0.09567738196346909 | 0.10119371104519814 | 0.1041373600019142 |
| 6144 | 0 | 8 | base | shared | 0.11729390599066392 | 0.11550213495502248 | 0.1186927100061439 |
| 6144 | 0 | 8 | identity | shared | 0.11791821697261184 | 0.11772133002523333 | 0.1154662300250493 |
| 6144 | 0 | 8 | notile | shared | 0.11959328199736774 | 0.11956360604381189 | 0.11660817899974063 |
| 6144 | 0 | 8 | poly | shared | 0.05545451695797965 | 0.05406919599045068 | 0.050369795004371554 |
| 6144 | 0 | 16 | base | shared | 0.06512070802273229 | 0.06253668398130685 | 0.06434049102244899 |
| 6144 | 0 | 16 | identity | shared | 0.06361595401540399 | 0.05904512002598494 | 0.0638385129859671 |
| 6144 | 0 | 16 | notile | shared | 0.06323231401620433 | 0.06316556298406795 | 0.06339527299860492 |
| 6144 | 0 | 16 | poly | shared | 0.03318456304259598 | 0.034947376989293844 | 0.03426248300820589 |
| 6144 | 0 | 24 | base | shared | 0.05133476102491841 | 0.050706335983704776 | 0.04928538901731372 |
| 6144 | 0 | 24 | identity | shared | 0.0501954120118171 | 0.05114940198836848 | 0.05005797400372103 |
| 6144 | 0 | 24 | notile | shared | 0.05007944704266265 | 0.05043323599966243 | 0.04960444598691538 |
| 6144 | 0 | 24 | poly | shared | 0.022162688022945076 | 0.022434712969698012 | 0.022182325017638505 |
| 6144 | 0 | 48 | base | shared | 0.028696820023469627 | 0.02661435102345422 | 0.028367374965455383 |
| 6144 | 0 | 48 | identity | shared | 0.029241385986097157 | 0.028226350957993418 | 0.026976808963809162 |
| 6144 | 0 | 48 | notile | shared | 0.028693417028989643 | 0.029028591001406312 | 0.026471623044926673 |
| 6144 | 0 | 48 | poly | shared | 0.011801880958955735 | 0.011731781996786594 | 0.011762381996959448 |
| 6144 | 0 | 96 | base | shared | 0.01862195401918143 | 0.018345164018683136 | 0.018140332016628236 |
| 6144 | 0 | 96 | identity | shared | 0.019425345002673566 | 0.019169602019246668 | 0.020585204008966684 |
| 6144 | 0 | 96 | notile | shared | 0.018285198020748794 | 0.019733871042262763 | 0.018110910954419523 |
| 6144 | 0 | 96 | poly | shared | 0.006990307010710239 | 0.006644832959864289 | 0.006435485964175314 |
| 6144 | 0 | 192 | base | shared | 0.0206799489678815 | 0.018992618017364293 | 0.017448795959353447 |
| 6144 | 0 | 192 | identity | shared | 0.018685811024624854 | 0.018267115985509008 | 0.03476813598535955 |
| 6144 | 0 | 192 | notile | shared | 0.022693234961479902 | 0.019442309974692762 | 0.018711842014454305 |
| 6144 | 0 | 192 | poly | shared | 0.006168738007545471 | 0.00737583200680092 | 0.006505705008748919 |

<a id="appendix-b-8"></a>

### B.8 屏障原始比例

以下为每次运行的屏障时间比例，取值范围为 0–1。逐线程墙钟记录见作者本地的 `profiling.csv`。

| 核数 | 调度 | repeat 0 | repeat 1 | repeat 2 |
| --- | --- | --- | --- | --- |
| 1 | static | 2.245614863741963e-06 | 1.609854339805752e-06 | 1.5966113991216403e-06 |
| 1 | dynamic64 | 3.080030285764843e-06 | 2.8046673481406114e-06 | 2.4457711093736856e-06 |
| 2 | static | 0.366366769513504 | 0.37294717450044645 | 0.3721315028863421 |
| 2 | dynamic64 | 0.0012752818873738316 | 0.0013795214149013582 | 0.0003099288316010716 |
| 4 | static | 0.35624453604975853 | 0.4550285620252279 | 0.4726262094220544 |
| 4 | dynamic64 | 0.004229483272907709 | 0.0033316396826874135 | 0.0020157054940903103 |
| 8 | static | 0.5407468135494803 | 0.5172152208944233 | 0.5648113361717707 |
| 8 | dynamic64 | 0.010737284224069051 | 0.004891487321508598 | 0.0081076102946125 |
| 16 | static | 0.5144767973615484 | 0.5456412685248067 | 0.5016133802904778 |
| 16 | dynamic64 | 0.012802130311861311 | 0.01464067522354575 | 0.01330863121837656 |
| 24 | static | 0.47960004108075005 | 0.4609564999182162 | 0.5079041308595421 |
| 24 | dynamic64 | 0.03480823021611342 | 0.036015487047958816 | 0.02049753519602451 |
| 48 | static | 0.432855201287588 | 0.4985131965484969 | 0.4379632354395749 |
| 48 | dynamic64 | 0.0631825668654872 | 0.08898741044654551 | 0.05444491389786355 |
| 96 | static | 0.5110687822131933 | 0.49619528680694014 | 0.45102180390415525 |
| 96 | dynamic64 | 0.14305242425865522 | 0.13166646328102813 | 0.12956070142724782 |
| 192 | static | 0.4729282640558567 | 0.47709077376514875 | 0.4779951850186779 |
| 192 | dynamic64 | 0.20118891355527785 | 0.1993667210987095 | 0.18425334000995272 |

<a id="appendix-c"></a>

## 附录 C 复现说明

构建脚本、编译产物与原始记录保存在配套实验目录。

<a id="appendix-c-1"></a>

### C.1 编译产物

`N=1024` 串行转置的 Graphite dump 识别 1 个 SCoP，将原来的两层循环改成 51×51 tile 的四层循环；isl AST 明确包含 `S_3(51*c0+c2,51*c1+c3)` 及边缘 tile 的 min 边界。对应完整产物位于作者本地的 `汇编与多面体分析.md`。

真实 ELF 中 `transpose_poly` 的核心搬运为：

```asm
vmovsd xmm0,QWORD PTR [rdi+r12*8]
inc    esi
add    rdx,0x2000
vmovsd QWORD PTR [rdx-0x2000],xmm0
```

输出单步仍跨 8192 字节。外层 tile 更新则在 `.cold` 分区出现 `add ...,0x33` 和 `add rbp,0x66000`，分别对应 51 个迭代和 51×8192 字节。这项优化通过改变块级访问顺序改善局部性，块内仍采用标量跨行写入。

baseline 最终使用展开的标量 `vmovsd` 搬运。N=1024 的函数机器码总大小分别为 140 字节与 441 字节（poly 含冷分区），显示优化同时增加了控制代码。

构建过程由 `.s` 汇编得到 `.o`，再链接成被测 ELF。保存的 `.linked.asm` 包含主符号和 `.cold` 等所有后缀分区。并行版的对应范围子核另存于 `expanded_3runs/artifacts/transpose_*_poly.linked.asm`；其 SCoP、GIMPLE、汇编与二进制哈希也分别保留。

Graphite dump、isl AST 和汇编共同展示了分块如何落实到机器代码，计时结果给出对应的性能变化。首轮 Stencil 实验则展示了 Graphite 与向量化之间的不利交互，相关材料保存在归档目录。

<a id="appendix-c-2"></a>

### C.2 复现方法

本地复现入口为 `expanded_3runs/README.md`，执行 `bash build.sh`、`python3 run.py` 和 `python3 analyze.py` 可复现。它依赖的前轮 MD/参考对象及串行转置 ELF 的完整构建脚本也保留在各自目录；这些文件目前未随博客公开。

- `results/summary.csv`：346 点的 t0/t1/t2、mean、std 与 samples=3。
- `results/kernels.jsonl`、`transpose_parallel.jsonl`、`transpose_serial.jsonl`：1038 条原始计时、repeat、核数、实际团队大小和完整输出误差。
- `results/profiling.csv`：2346 条逐线程记录；每个核数/策略恰好三次进程观测。
- `artifacts/`：实际用于汇编的 `.s`、Graphite/最终 GIMPLE、向量化诊断和实际 ELF 的主/冷分区反汇编。
- `results/code-manifest.json`：被测并行 ELF 哈希和对应函数分区；串行 ELF 的完整对应关系在 polybench_followup/formal_results。
- `figures/`：六张新图的 PNG/SVG，误差条统一为三次样本标准差。

第 3、5、6 节的实现核查继续固定于 GCC 13.3.0 上游提交 `b71f1de6e9cf7181a288c0f39f9b1ef6580cf5c8`；实际发行版编译器另记录完整版本。远程目录为 `/ssd/haibin/openmp_report_20261109/experiments/expanded_3runs`。前一轮 5 次/9 次结果另行存档。

<a id="appendix-d"></a>

## 附录 D 历史结果

![原报告历史 MD 图](/images/gcc-openmp-compiler-report/figure-06.png)

*历史图 A：原报告的 MD 实验结果。*

![原报告历史多面体测试图](/images/gcc-openmp-compiler-report/figure-07.png)

*历史图 B：原报告的多面体实验结果。*
