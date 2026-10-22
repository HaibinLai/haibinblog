---
title: "gcc是怎么实现OpenMP的？"
description: "由于网上关于GNU openmp的解构比较少，今天我由于工作问题，我也来亲自解答：“为什么OpenMP不能完成 “小而多的并行任务” 的问题。（llvm的解构我之前在博客已经做过 llvm 如何实现OpenMP ，其实从结构来看，跟OpenMP的结构基本一致，都遵从OpenMP官方的fork-join 的idea，但是llvm的实现会比较复杂） 学习网页 我们所有的学习都可以从这里出发： 源码 doxygen文档： Libgomp:…"
publishedAt: "2025-05-29T03:32:58Z"
updatedAt: "2025-06-11T22:11:37Z"
category: "Frameworks"
categories: ["Frameworks", "High Performance Computing"]
tags: []
author: "GB"
draft: false
slug: "gcc是怎么实现openmp的"
legacySlug: "gcc是怎么实现openmp的？"
oldSlugs: []
wordpressId: 825
sourceUrl: "https://www.haibinlaiblog.top/index.php/gcc%e6%98%af%e6%80%8e%e4%b9%88%e5%ae%9e%e7%8e%b0openmp%e7%9a%84%ef%bc%9f/"
commentCount: 0
viewCount: 2334
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/gcc%E6%98%AF%E6%80%8E%E4%B9%88%E5%AE%9E%E7%8E%B0openmp%E7%9A%84.webp"
---
<p>由于网上关于GNU openmp的解构比较少，今天我由于工作问题，我也来亲自解答：“为什么OpenMP不能完成 “小而多的并行任务” 的问题。（llvm的解构我之前在博客已经做过 <a href="https://www.haibinlaiblog.top/index.php/openmp%e5%9c%a8llvm%e9%87%8c%e6%98%af%e5%a6%82%e4%bd%95%e5%ae%9e%e7%8e%b0%e7%9a%84%ef%bc%9fwip/">llvm 如何实现OpenMP</a> ，其实从结构来看，跟OpenMP的结构基本一致，都遵从OpenMP官方的fork-join 的idea，但是llvm的实现会比较复杂）</p>
<h2>学习网页</h2>
<p>我们所有的学习都可以从这里出发：</p>
<p>源码 doxygen文档：
<a href="https://www.cs.rice.edu/~la5/doc/ligbomp-doc/main.html">Libgomp: Main Page</a></p>
<p>一位知乎大佬的源码解析
<a href="https://zhuanlan.zhihu.com/p/611558324">OpenMP task construct 实现原理以及源码分析 - 知乎</a>
<a href="https://www.cnblogs.com/Chang-LeHung/p/17089310.html">OpenMP For Construct dynamic 调度方式实现原理和源码分析 - 一无是处的研究僧 - 博客园</a></p>
<p>其他OpenMP的 usercase 学习案例网上比较多，大家搜索一下都能找到</p>
<h2>一个简单的OpenMP的例子</h2>
<p>在本节，我们将查看一个简单的OpenMP的例子，查看它的汇编及调用的函数，大概理解OpenMP编译后的情况。</p>
<p>这里大家也可以查看：
<a href="https://zhuanlan.zhihu.com/p/600897883">OpenMP Parallel Construct 实现原理与源码分析 - 知乎</a></p>
<p>我们先从一个最简单的OpenMP的例子开始：</p>
<pre><code class="language-CPP">#include &lt;iostream&gt;
#include &lt;omp.h&gt;

int main() {
    #pragma omp parallel
    {
        int thread_id = omp_get_thread_num();
        std::cout &lt;&lt; &quot;Hello from thread &quot; &lt;&lt; thread_id &lt;&lt; std::endl;
    }
    return 0;
}
</code></pre>
<p>众所周知，它编译后将输出 N 个 &quot;Hello from thread X&quot;，其中N是你的核数大小。</p>
<p>现在我们看看它的汇编结果：</p>
<pre><code class="language-bash">g++ -S openmp_hello.cpp  -fopenmp -o openmp_hello.S</code></pre>
<p>为了清晰的展示，在这里我略去了很多无关函数和调用。</p>
<p>编译后我们将得到两个重要的子函数：</p>
<ul>
<li>main</li>
<li>main._omp_fn.0
main函数还会调用 <code>GOMP_parallel@PLT</code> 函数，这是OpenMP实现并行的关键函数，我们会在后面一并解析。
<h3>main: 如何启动openmp并行域？</h3></li>
</ul>
<p>首先我们查看main 函数：</p>
<pre><code class="language-assembly">main:
.LFB1731:
    pushq   %rbp  # 保存旧的栈帧指针（`%rbp`）到栈中。
    movq    %rsp, %rbp # 将当前栈指针赋值给帧指针，建立新的栈帧。

    # 清空一些通用寄存器（为 `GOMP_parallel` 做准备）
    movl    $0, %ecx
    movl    $0, %edx
    movl    $0, %esi   # %esi在 OpenMP 中通常作为 `data` 参数，代表共享数据指针。

    # 把函数 `main._omp_fn.0` 的地址加载到 `%rax` 中；
    leaq    main._omp_fn.0(%rip), %rax

    movq    %rax, %rdi # 然后把这个函数地址传入 `%rdi`，作为第一个参数（x86_64 ABI 下第一个参数传入 `%rdi`）。

    call    GOMP_parallel@PLT  # 调用 OpenMP 运行时的并行构造函数

    movl    $0, %eax # 设置返回值为 `0`，对应 `return 0;`。
    popq    %rbp # 恢复旧的栈帧指针（销毁当前栈帧）。
    ret # `ret`：从 `main` 返回。</code></pre>
<p>代码中使用的寄存器及其作用如下表（基于 x86_64 System V ABI <a href="https://gitlab.com/x86-psABIs/x86-64-ABI">x86 psABIs / x86-64 psABI · GitLab</a>）</p>
<table>
<thead>
<tr>
<th>寄存器</th>
<th>宽度</th>
<th>ABI角色</th>
<th>main中的作用</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>%rbp</code></td>
<td>64位</td>
<td>栈帧基指针（base pointer）</td>
<td>保存和恢复旧栈帧指针，构建新栈帧（函数入口和退出）</td>
</tr>
<tr>
<td><code>%rsp</code></td>
<td>64位</td>
<td>栈指针（stack pointer）</td>
<td>指向当前栈顶，用于栈管理</td>
</tr>
<tr>
<td><code>%rax</code></td>
<td>64位</td>
<td>函数返回值寄存器（返回值1）</td>
<td>暂存 <code>main._omp_fn.0</code> 的地址；后用于 <code>return 0</code></td>
</tr>
<tr>
<td><code>%rdi</code></td>
<td>64位</td>
<td>第1个函数参数</td>
<td>保存 <code>main._omp_fn.0</code> 地址，作为 <code>GOMP_parallel</code> 的回调参数</td>
</tr>
<tr>
<td><code>%esi</code></td>
<td>32位</td>
<td>第2个函数参数</td>
<td>设为 <code>0</code>，传给 <code>GOMP_parallel</code> 的 <code>data</code> 参数（共享上下文）</td>
</tr>
<tr>
<td><code>%edx</code></td>
<td>32位</td>
<td>第3个函数参数</td>
<td>设为 <code>0</code>，传给 <code>GOMP_parallel</code> 的 <code>num_threads</code> 参数（或动态）</td>
</tr>
<tr>
<td><code>%ecx</code></td>
<td>32位</td>
<td>第4个函数参数</td>
<td>设为 <code>0</code>，通常未使用</td>
</tr>
</tbody>
</table>
<p>其中，<code>movl</code> 会同时清空64位数据（向低 32 位寄存器（如 <code>%eax</code>, <code>%ecx</code>, <code>%edx</code>, <code>%esi</code>）写入数据时，高 32 位会自动清零）</p>
<h3>详细说明</h3>
<p>完整行为：</p>
<ol>
<li>准备调用openmp函数；</li>
<li>设置参数为 <code>main._omp_fn.0</code>（实际并行执行的函数），准备好openmp的调用；</li>
<li>调用 <code>GOMP_parallel</code> 启动 OpenMP 并行区域；</li>
<li>设置返回值为 0, 恢复栈帧并返回。</li>
</ol>
<p>我们可以看到，原始的 <code>#pragma omp parallel</code> 最终会被打包为 一个子函数<code>main._omp_fn.0(%rip), %rax</code>， 接着程序会调用 <code>GOMP_parallel@PLT</code> 启动子函数。
(<code>@PLT</code> 表示这个调用是通过 <strong>Procedure Linkage Table（过程链接表）</strong> 进行的，它会用PLT表做一次间接跳转，跳到libgomp.so库里的 <code>GOMP_parallel</code> 函数，在后续，你可以把它就当作是外部lib函数)</p>
<p><code>GOMP_parallel</code> 函数可以在 <a href="https://github.com/gcc-mirror/gcc/blob/e2bf0b3910de7e65363435f0a7fa606e2448a677/libgomp/parallel.c#L172">gcc/libgomp/parallel.c at e2bf0b3910de7e65363435f0a7fa606e2448a677 · gcc-mirror/gcc</a> 看到，我们稍后会深入解析它，但我们先看它的头：</p>
<pre><code class="language-cpp">void
GOMP_parallel (void (*fn) (void *), void *data, unsigned num_threads,
           unsigned int flags)</code></pre>
<p>可以看到，我们的main函数将我们的<code>main._omp_fn.0</code> 函数传入给了这个<code>GOMP_parallel</code>函数。如果我们设置了data，num_threads，flags，这个函数也会接受。</p>
<h3>子函数 <code>main._omp_fn.0</code></h3>
<p>我们来看看</p>
<pre><code class="language-assembly">main._omp_fn.0:
# 分配自己的函数栈空间
    pushq   %rbp
    movq    %rsp, %rbp
    subq    $32, %rsp
    movq    %rdi, -24(%rbp)

# 获取线程编号 并移到 -4(%rbp)
    call    omp_get_thread_num@PLT
    movl    %eax, -4(%rbp)

# 这段等价于 std::cout &lt;&lt; &quot;Hello from thread &quot;;
    leaq    .LC0(%rip), %rax # LC0 是常量字符串 &quot;Hello from thread &quot;
    movq    %rax, %rsi
    leaq    _ZSt4cout(%rip), %rax # rax = std::cout 的地址
    movq    %rax, %rdi
    call    _ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc@PLT

# 这段等价于 std::cout &lt;&lt; thread_id;
    movq    %rax, %rdx
    movl    -4(%rbp), %eax
    movl    %eax, %esi
    movq    %rdx, %rdi
    call    _ZNSolsEi@PLT

# 打印 `std::endl` 并结束输出
    movq    _ZSt4endlIcSt11char_traitsIcEERSt13basic_ostreamIT_T0_ES6_@GOTPCREL(%rip), %rdx
    movq    %rdx, %rsi
    movq    %rax, %rdi
    call    _ZNSolsEPFRSoS_E@PLT

# 清理栈帧，返回主线程
    leave
    ret</code></pre>
<p>子函数几乎没有动，就是parallel region 里的地方。
到这里我们基本上可以对OpenMP有概念了：主线程首先会准备好子函数的data，subfunction子函数，num_thread，并将他们传入 <code>GOMP_parallel</code> ，它将并行执行subFunction。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528150421162.png" alt="" /></p>
<p>注：不同的openmp函数可能会调用不同的kernel，比如<code>reduce</code> 会调用 <code>GOMP_parallel_reductions</code> ，在用的时候要注意看看。</p>
<h2>GNU gcc OpenMP底层机制</h2>
<p>在本节，我们将通过 <code>GOMP_parallel</code> 了解GNU OpenMP 的底层实现。</p>
<p><a href="https://github.com/gcc-mirror/gcc/blob/e2bf0b3910de7e65363435f0a7fa606e2448a677/libgomp/parallel.c#L172">gcc/libgomp/parallel.c at e2bf0b3910de7e65363435f0a7fa606e2448a677 · gcc-mirror/gcc</a></p>
<pre><code class="language-CPP">void
GOMP_parallel (void (*fn) (void *), void *data, unsigned num_threads,
           unsigned int flags)
{
  num_threads = gomp_resolve_num_threads (num_threads, 0);
  gomp_team_start (fn, data, num_threads, flags, gomp_new_team (num_threads),
           NULL);
  fn (data);
  ialias_call (GOMP_parallel_end) ();
}</code></pre>
<table>
<thead>
<tr>
<th>参数名</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>fn</code></td>
<td>每个线程执行的函数（刚刚我们看到的编译器生成的 <code>.omp_fn.*</code>）</td>
</tr>
<tr>
<td><code>data</code></td>
<td>传入 <code>fn</code> 的参数（由编译器生成）</td>
</tr>
<tr>
<td><code>num_threads</code></td>
<td>用户在 pragma 中设定的线程数</td>
</tr>
<tr>
<td><code>flags</code></td>
<td>运行时行为控制位，比如是否绑定线程、是否有 <code>if</code> 子句等</td>
</tr>
</tbody>
</table>
<p>我们可以看到OpenMP的大概结构：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528162910570.png" alt="" /></p>
<p>注意到主线程也会 <code>fn(data)</code>，这是 OpenMP 的经典设计模式：<strong>主线程（即调用 <code>GOMP_parallel</code> 的线程）在创建工作线程后，不闲着，而是直接参与执行工作负载</strong>。</p>
<h3>确定线程数量</h3>
<pre><code class="language-CPP">num_threads = gomp_resolve_num_threads (num_threads, 0);</code></pre>
<p>根据当前上下文（比如 nested parallel region 或资源限制）动态决定实际使用的线程数。其函数注释如下：
Determine the number of threads to be launched for a PARALLEL construct.
This algorithm is explicitly described in OpenMP 3.0 section 2.4.1.
SPECIFIED is a combination of the NUM_THREADS clause and the IF clause.
If the IF clause is false, SPECIFIED is forced to 1.  When NUM_THREADS
is not present, SPECIFIED is 0.</p>
<pre><code class="language-cpp">unsigned gomp_resolve_num_threads (unsigned specified, unsigned count)</code></pre>
<p>线程数由 <code>NUM_THREADS</code> <code>SPECIFIED</code> 和系统条款 <code>IF</code> 共同确定。IF 条款的意义是控制并行区域是否实际以并行方式执行，IF 条款允许开发者根据运行时条件动态控制并行性，以避免在某些情况下（如数据规模小、开销高于并行收益）启用并行执行。</p>
<table>
<thead>
<tr>
<th><code>IF</code> Clause</th>
<th><code>NUM_THREADS</code> Clause</th>
<th><code>SPECIFIED</code> Value</th>
<th>Number of Threads Launched</th>
</tr>
</thead>
<tbody>
<tr>
<td>Not present</td>
<td>Not present</td>
<td>0</td>
<td>Implementation-defined (e.g., <code>OMP_NUM_THREADS</code> or system default)</td>
</tr>
<tr>
<td>True</td>
<td>Not present</td>
<td>0</td>
<td>Implementation-defined (e.g., <code>OMP_NUM_THREADS</code> or system default)</td>
</tr>
<tr>
<td>False</td>
<td>Not present</td>
<td>1</td>
<td>1 thread (sequential execution)</td>
</tr>
<tr>
<td>True</td>
<td>Present (value = N)</td>
<td>N</td>
<td>N threads (capped by implementation limits)</td>
</tr>
<tr>
<td>False</td>
<td>Present (value = N)</td>
<td>1</td>
<td>1 thread (sequential execution)</td>
</tr>
</tbody>
</table>
<h3>启动并行域 gomp_team_start</h3>
<p>如果你用的是pthread，你的源码应该是在
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L319">gcc/libgomp/team.c at master · gcc-mirror/gcc</a>
（否则你要去nvptx和gcn找找，nvptx应该是链接的GPU cuda库）</p>
<p>pthread实现这里源码有600行，其实大部分的代码都是主要是在设置线程亲和度，处理闲置线程等工作。但我们最重要的是启动线程。
<a href="https://zhuanlan.zhihu.com/p/600897883">OpenMP Parallel Construct 实现原理与源码分析 - 知乎</a> 简单分析了OpenMP启动线程的操作，我们引用他的话：</p>
<blockquote>
<p>&quot;可以看到这是一个 for 循环并且启动 nthreads 个线程，<code>pthread_create</code> 是真正创建了线程的代码，并且让线程执行函数 gomp_thread_start 可以看到线程不是直接执行 subfunction 而是将这个函数指针保存到 start_data 当中，并且在函数 gomp_thread_start 真正去调用这个函数&quot;</p>
<p>gomp_thread_start 的函数体也相对比较长，在这里我们选中其中的比较重要的几行代码，其余的代码进行省略。对比上面线程启动的 pthread_create 语句我们可以知道，gomp_thread_start真正的调用了 subfunction，并且给这个函数传递了对应的参数。</p>
</blockquote>
<p>我画了一个草图来演示这个函数的基础流程：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528162954938.png" alt="" /></p>
<p>在看完600行代码后，我们可以总结<code>gomp_team_start</code> 的核心工程：</p>
<ul>
<li>从线程池里拉出要跑的线程</li>
<li>判断当前team是否处于嵌套。</li>
<li>根据环境变量和参数计算线程数和绑定策略。</li>
<li>尝试复用空闲线程（线程池复用）。</li>
<li><strong>启动新线程，设置线程亲和和任务状态。</strong></li>
<li>等待线程全部启动完成后释放。</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528221003826.png" alt="" /></p>
<p>我们换一个方向，从结构的角度进行解读。
首先我们看看整个OpenMP工程结构（整理自 <a href="https://www.cs.rice.edu/~la5/doc/ligbomp-doc/db/d9a/work_8c.html">Libgomp: work.c File Reference</a>）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528184146882.png" alt="" /></p>
<p>可以看到，我们在写入各种openmp的函数后（ <code>#pragma omp parallel XXX</code>）他们会被call到不同的具体的实现，如task，team。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528213655317.png" alt="" /></p>
<p>从<a href="https://www.cs.rice.edu/~la5/doc/ligbomp-doc/d0/dc9/structgomp__team.html">Libgomp: gomp_team Struct Reference</a> 我们可以看看team的结构：</p>
<h3>gomp_team</h3>
<p><code>gomp_team</code> 是 libgomp 中定义的一个 C 结构体，用于表示一个 OpenMP 并行区域的线程团队。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528161806877.png" alt="" /></p>
<p>team的结构可以在 libgomp.h 找到 <a href="https://www.cs.rice.edu/~la5/doc/ligbomp-doc/dd/d46/libgomp_8h-source.html">Libgomp: libgomp.h Source File</a></p>
<table>
<thead>
<tr>
<th><strong>字段名</strong></th>
<th><strong>类型</strong></th>
<th><strong>说明</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td><code>nthreads</code></td>
<td><code>unsigned</code></td>
<td>当前 team 中的线程数量。</td>
</tr>
<tr>
<td><code>work_share_chunk</code></td>
<td><code>unsigned</code></td>
<td>上次批量分配的 <code>gomp_work_share</code> 数量。</td>
</tr>
<tr>
<td><code>prev_ts</code></td>
<td><code>struct gomp_team_state</code></td>
<td>保存 master 线程在进入该 team 前的 team 状态。用于恢复。</td>
</tr>
<tr>
<td><code>master_release</code></td>
<td><code>gomp_sem_t</code></td>
<td>master 线程专用信号量。用于嵌套并行时避免信号量冲突。</td>
</tr>
<tr>
<td><code>ordered_release</code></td>
<td><code>gomp_sem_t **</code></td>
<td>指向所有线程有序释放用的信号量数组（用于 <code>ordered</code> 子句）。</td>
</tr>
<tr>
<td><code>work_share_list_alloc</code></td>
<td><code>struct gomp_work_share *</code></td>
<td>可用的 <code>gomp_work_share</code> 链表，用于新的 worksharing 构造。仅首线程分配。</td>
</tr>
<tr>
<td><code>work_share_list_free</code></td>
<td><code>struct gomp_work_share *</code></td>
<td>已释放的 <code>gomp_work_share</code> 链表。并发安全追加。</td>
</tr>
<tr>
<td><code>MARKDOWN_HASH87314a1443a69743d1247abae5c6f785MARKDOWN<em>HASH</code> </em>(或)_ <code>work_share_list_free_lock</code></td>
<td><code>unsigned long</code> 或 <code>gomp_mutex_t</code></td>
<td>若支持原子指令，则为 simple <code>single</code> 区域计数器；否则用 mutex 保护 free 列表。</td>
</tr>
<tr>
<td><code>barrier</code></td>
<td><code>gomp_barrier_t</code></td>
<td>用于 team 间同步的 barrier。大多数同步操作使用它。</td>
</tr>
<tr>
<td><code>work_shares[8]</code></td>
<td><code>struct gomp_work_share[8]</code></td>
<td>初始 work share 缓存，常见场景避免动态分配。</td>
</tr>
<tr>
<td><code>task_lock</code></td>
<td><code>gomp_mutex_t</code></td>
<td>用于串行化 task 队列的锁。</td>
</tr>
<tr>
<td><code>task_queue</code></td>
<td><code>struct gomp_task *</code></td>
<td>当前的任务队列头。</td>
</tr>
<tr>
<td><code>task_count</code></td>
<td><code>int</code></td>
<td>当前队列中任务总数。</td>
</tr>
<tr>
<td><code>task_running_count</code></td>
<td><code>int</code></td>
<td>正在执行的任务数。</td>
</tr>
<tr>
<td><code>implicit_task[]</code></td>
<td><code>struct gomp_task[]</code></td>
<td>各线程的隐式 task（比如 parallel region 中默认的 task）。这是个灵活数组成员。</td>
</tr>
</tbody>
</table>
<p>wowowow，这里有好多好多结构，怎么分析？
我把我们主要要分析的结构分成了3类：</p>
<p>config类：</p>
<ul>
<li><code>nthreads</code></li>
<li>team status: <code>prev_ts</code>
work sharing 类：</li>
<li><code>work_shares[8]</code> <code>work_share_list_alloc</code>等等
task 类：</li>
<li><code>task_lock</code>、<code>task_queue</code>等等</li>
</ul>
<h3>初始化team data</h3>
<p>提前分配好本函数要用的各种数据结构。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528201408562.png" alt="" /></p>
<h3>初始化线程亲和配置</h3>
<p>从343行开始
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L343">gcc/libgomp/team.c at master · gcc-mirror/gcc</a></p>
<p>这是它的大致流程：</p>
<table>
<thead>
<tr>
<th>步骤</th>
<th>操作</th>
<th>目的</th>
</tr>
</thead>
<tbody>
<tr>
<td>检查并初始化 <code>gomp_places_list</code></td>
<td>设置可用 CPU 核的 place 列表</td>
<td>为亲和性策略准备 place 列表</td>
</tr>
<tr>
<td><code>pthread_setaffinity_np</code></td>
<td>绑定主线程到第一个 place</td>
<td>限制线程运行在哪些核上，提高 cache locality</td>
</tr>
<tr>
<td>设置 <code>thr-&gt;ts.*</code> 字段</td>
<td>初始化线程的 place 分区信息</td>
<td>为 team 中其他线程的亲和性分配做准备</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528201157251.png" alt="1748480922304.png" /></p>
<h3>初始化team</h3>
<p>这部分将保存 team之前的状态，然后负责<strong>主线程（master thread）在创建或加入一个新 team（线程团队）时初始化其线程状态 (<code>thread_state</code>)、任务 (<code>task</code>)、调度器信息以及线程控制变量 (<code>ICV</code>) 的继承与设置</strong>。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528201240583.png" alt="1748481157545.png" /></p>
<h4>为什么会有prev_ts: 之前的team state</h4>
<p>在 OpenMP 的实现中，<code>prev_ts</code>（即 <code>prev_ts: previous team state</code>）是一个非常关键的数据结构，主要用于<strong>支持嵌套并行（nested parallelism）</strong> 和<strong>线程状态回溯</strong>。我们来深入解释这个设计的动机和作用。</p>
<p>场景：嵌套 <code>#pragma omp parallel</code></p>
<pre><code class="language-CPP">#pragma omp parallel num_threads(2)
{
    // Outer team: T0, T1

    #pragma omp parallel num_threads(4)
    {
        // Each outer thread creates its own inner team
    }
}
</code></pre>
<p>在这个例子中：</p>
<ul>
<li>外层并行区域创建了 2 个线程（一个“团队”），我们称它为 <strong>Outer Team</strong>。</li>
<li>每个线程又创建了一个新的 <code>#pragma omp parallel</code> 区域，也就是说每个线程又生成了一个 <strong>Inner Team</strong>。</li>
<li>此时<strong>同一个线程</strong>（例如主线程）可能属于两个 team：当前 team（Inner），和之前的 team（Outer）。</li>
</ul>
<pre><code class="language-CPP">struct gomp_team_state
{
  /* 线程当前所属的团队 */
  struct gomp_team *team;

  /* 线程当前正在处理的work share构造（比如并行for循环等） */
  struct gomp_work_share *work_share;

  /* 上一个work share构造，当前构造执行完后，可以释放上一个 */
  struct gomp_work_share *last_work_share;

  /* 线程在线程团队中的编号，0 到 N-1 */
  unsigned team_id;

  /* 嵌套层级，用于支持嵌套的parallel区域 */
  unsigned level;

  /* 活跃的嵌套层级，只计数活跃的parallel区域 */
  unsigned active_level;

#ifdef HAVE_SYNC_BUILTINS
  /* 计数single语句执行的次数 */
  unsigned long single_count;
#endif

  /* 对于某些静态调度的循环，记录这是第几次进入该循环 */
  unsigned long static_trip;
};
</code></pre>
<h2>确定线程亲和策略</h2>
<p>绑核代码从 392行开始
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L392">gcc/libgomp/team.c at master · gcc-mirror/gcc</a></p>
<p>根据线程数量 <code>nthreads</code> 和 place 列表 <code>gomp_places_list</code>，绑核为每个线程计算它将绑定到哪个“place”（逻辑 CPU 核心集合）。</p>
<pre><code class="language-CPP">if ( (gomp_places_list != NULL, 0))
    {
      /* Depending on chosen proc_bind model, set subpartition
     for the master thread and initialize helper variables
     P and optionally S, K and/or REST used by later place
     computation for each additional thread.  */
      p = thr-&gt;place - 1;
      switch (bind)
        {
        case omp_proc_bind_true:
        case omp_proc_bind_close:
        if (nthreads &gt; thr-&gt;ts.place_partition_len)
            {
            /* T &gt; P.  S threads will be placed in each place,
            and the final REM threads placed one by one
            into the already occupied places.  */
            .........
    }
    }
  else
    bind = omp_proc_bind_false;</code></pre>
<p>这里的T, P 分别指的是：</p>
<ul>
<li><strong><code>T</code></strong>：团队中线程的数量（<code>nthreads</code>），即 <strong>Threads</strong></li>
<li><strong><code>P</code></strong>：place partition 中的 slot 数量（<code>place_partition_len</code>），即 <strong>Places</strong></li>
</ul>
<p>我把执行的逻辑画在了下边：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528201538264.png" alt="" /></p>
<h3>线程复用并绑定调度</h3>
<p>第460行 - 730行</p>
<p>openmp在这里会用上我们的线程池 <code>pool</code> 里的空闲线程，并尝试将其重新绑核到cpu cores上。
线程复用/创建时绑定 place，按策略分配</p>
<table>
<thead>
<tr>
<th>步骤</th>
<th>功能</th>
</tr>
</thead>
<tbody>
<tr>
<td>1️⃣</td>
<td>如果是非嵌套 parallel，尝试从线程池复用已有线程</td>
</tr>
<tr>
<td>2️⃣</td>
<td>根据 <code>proc_bind</code> 策略分配线程到合适的 CPU 绑定（place）</td>
</tr>
<tr>
<td>3️⃣</td>
<td>如果绑定不符合要求，则替换线程或重新分配</td>
</tr>
<tr>
<td>4️⃣</td>
<td>设置线程的执行上下文，如 team、task、level 等</td>
</tr>
<tr>
<td>5️⃣</td>
<td>若 affinity 失败则 fallback 重试</td>
</tr>
<tr>
<td>6️⃣</td>
<td>初始化 barrier，同步所有即将被释放/复用的线程</td>
</tr>
</tbody>
</table>
<p>后面的详细逻辑我用GPT生成了，大家可以按照自己的需要看看：
<a href="https://www.haibinlaiblog.top/index.php/proc_bind-%e5%90%84%e7%ad%96%e7%95%a5%e7%9a%84-place-%e8%ae%a1%e7%ae%97%e9%80%bb%e8%be%91%e3%80%81affinity_thr-%e7%9a%84%e5%86%85%e5%ad%98%e7%ae%a1%e7%90%86%ef%bc%8cgomp_simple_barrier_reinit/">https://www.haibinlaiblog.top/index.php/proc_bind-%e5%90%84%e7%ad%96%e7%95%a5%e7%9a%84-place-%e8%ae%a1%e7%ae%97%e9%80%bb%e8%be%91%e3%80%81affinity_thr-%e7%9a%84%e5%86%85%e5%ad%98%e7%ae%a1%e7%90%86%ef%bc%8cgomp_simple_barrier_reinit/</a></p>
<p>其有3个核心逻辑：</p>
<table>
<thead>
<tr>
<th>关键机制</th>
<th>核心作用</th>
<th>实现重点</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>proc_bind</code> 策略</td>
<td>控制线程分布在 CPU 上的拓扑</td>
<td>按策略计算每线程绑定的 place</td>
</tr>
<tr>
<td><code>affinity_thr</code></td>
<td>临时结构，复用线程时按核域分类</td>
<td>栈/堆分配，使用后可释放</td>
</tr>
<tr>
<td><code>gomp_simple_barrier_reinit</code></td>
<td>线程同步起点屏障</td>
<td>轻量级 barrier，等待所有线程 ready 后统一起跑</td>
</tr>
</tbody>
</table>
<p>这里可以看到有一个重点，gomp需要创建完全部的线程才能启动。并且，我们的每一个线程都要初始化自己的堆栈。如果openmp被频繁调用，这是一个非常耗时的点。</p>
<p>另外，还会给线程预留数据空间：</p>
<pre><code class="language-CPP">              if (team-&gt;prev_ts.place_partition_len &gt; 64)
            affinity_thr
              = gomp_malloc (team-&gt;prev_ts.place_partition_len
                     * sizeof (struct gomp_thread *));
              else
            affinity_thr
              = gomp_alloca (team-&gt;prev_ts.place_partition_len
                     * sizeof (struct gomp_thread *));
              memset (affinity_thr, &#039;\0&#039;,
                  team-&gt;prev_ts.place_partition_len
                  * sizeof (struct gomp_thread *));
              for (j = i; j &lt; old_threads_used; j++)
            {
              if (pool-&gt;threads[j]-&gt;place
                  &gt; team-&gt;prev_ts.place_partition_off
                  &amp;&amp; (pool-&gt;threads[j]-&gt;place
                  &lt;= (team-&gt;prev_ts.place_partition_off
                      + team-&gt;prev_ts.place_partition_len)))
                {
                  l = pool-&gt;threads[j]-&gt;place - 1
                  - team-&gt;prev_ts.place_partition_off;
                  pool-&gt;threads[j]-&gt;data = affinity_thr[l];
                  affinity_thr[l] = pool-&gt;threads[j];
                }</code></pre>
<h3>新建额外线程的数据、配置</h3>
<p>在730行后有大概30行
这段代码处于 <code>gomp_team_start()</code> 的 <strong>线程创建阶段</strong>，紧接在线程池复用逻辑之后，它的核心任务是：</p>
<blockquote>
<p>✳️ <strong>根据当前需要的线程数（nthreads + affinity_count）与线程池中已有的线程数（old_threads_used）之差，决定是否需要新建线程，并执行相应的创建前初始化。</strong></p>
</blockquote>
<table>
<thead>
<tr>
<th>步骤</th>
<th>内容</th>
<th>目的</th>
</tr>
</thead>
<tbody>
<tr>
<td>1️⃣</td>
<td>判断是否需要新建线程</td>
<td>避免不必要的线程创建，节省资源</td>
</tr>
<tr>
<td>2️⃣</td>
<td>更新 <code>gomp_managed_threads</code></td>
<td>准确统计当前系统中管理的线程数</td>
</tr>
<tr>
<td>3️⃣</td>
<td>初始化线程属性 <code>pthread_attr</code></td>
<td>设置栈大小或为 affinity 做准备</td>
</tr>
<tr>
<td>4️⃣</td>
<td>分配线程启动参数数组</td>
<td>为新建线程准备启动时的上下文数据</td>
</tr>
</tbody>
</table>
<p>初始化要传入的数据的大小</p>
<pre><code class="language-CPP">start_data = gomp_alloca (sizeof (struct gomp_thread_start_data)
                * (nthreads - i));</code></pre>
<p>alloca源码：<a href="https://github.com/gcc-mirror/gcc/blob/0629924777ea20d56d9ea40c3915eb0327a22ac7/libgomp/libgomp.h#L117">gcc/libgomp/libgomp.h at 0629924777ea20d56d9ea40c3915eb0327a22ac7 · gcc-mirror/gcc</a></p>
<pre><code>/* Avoid conflicting prototypes of alloca() in system headers by using
   GCC&#039;s builtin alloca().  */
#define gomp_alloca(x)  __builtin_alloca(x)</code></pre>
<h3>最后：创建实际运行的线程并启动</h3>
<p>从730行开始，到最后的函数结束，函数将创建实际运行的线程，他们将调用subfunction</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528213946967.png" alt="" /></p>
<p><a href="https://zhuanlan.zhihu.com/p/600897883">OpenMP Parallel Construct 实现原理与源码分析 - 知乎</a>
进行了叙述</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528210728007.png" alt="" /></p>
<table>
<thead>
<tr>
<th>模块</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>proc_bind</code> 策略</td>
<td>控制线程如何与 place 绑定</td>
</tr>
<tr>
<td><code>gomp_init_thread_affinity</code></td>
<td>设置线程 CPU 亲和性</td>
</tr>
<tr>
<td><code>start_data</code></td>
<td>启动线程时的配置项和 thread-local storage 信息</td>
</tr>
<tr>
<td><code>pthread_create</code></td>
<td>实际创建 POSIX 线程</td>
</tr>
<tr>
<td><code>gomp_simple_barrier_reinit</code></td>
<td>动态调整线程启动后的 barrier 等待阈值</td>
</tr>
<tr>
<td><code>affinity_thr</code></td>
<td>用于临时绑定多个 affinity 信息的缓存，可被释放</td>
</tr>
</tbody>
</table>
<h4>线程亲和</h4>
<pre><code class="language-CPP">  for (; i &lt; nthreads; ++i)
    {
      int err;

      start_data-&gt;ts.place_partition_off = thr-&gt;ts.place_partition_off;
      start_data-&gt;ts.place_partition_len = thr-&gt;ts.place_partition_len;
      start_data-&gt;place = 0;
      if ( (gomp_places_list != NULL, 0))
        {
      switch (bind)
        {
        case omp_proc_bind_true:
        case omp_proc_bind_close:
          if (k == s)
        {
          ++p;
          if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
          k = 1;
          if (i == nthreads - rest)
            s = 1;
        }
          else
        ++k;
          break;
        case omp_proc_bind_master:
          break;
        case omp_proc_bind_spread:
          if (k == 0)
        {
          /* T &lt;= P.  */
          if (p &lt; rest)
            p += s + 1;
          else
            p += s;
          if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
          start_data-&gt;ts.place_partition_off = p;
          if (p &lt; rest)
            start_data-&gt;ts.place_partition_len = s + 1;
          else
            start_data-&gt;ts.place_partition_len = s;
        }
          else
        {
          /* T &gt; P.  */
          if (k == s)
            {
              ++p;
              if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
              k = 1;
              if (i == nthreads - rest)
            s = 1;
            }
          else
            ++k;
          start_data-&gt;ts.place_partition_off = p;
          start_data-&gt;ts.place_partition_len = 1;
        }
          break;
        }
      start_data-&gt;place = p + 1;
      if (affinity_thr != NULL &amp;&amp; pool-&gt;threads[i] != NULL)
        continue;
      gomp_init_thread_affinity (attr, p);
    }</code></pre>
<p>这段代码是 <code>gomp_team_start()</code> 中为新线程进行 <strong>place 绑定（affinity placement）</strong> 的关键部分。它的核心作用是：<strong>根据 OpenMP 的 <code>proc_bind</code> 策略，为每个新线程分配合适的 CPU 运行位置（place），并初始化线程亲和性（thread affinity）</strong>。</p>
<p>GPT细节分析 <a href="https://www.haibinlaiblog.top/index.php/openmp-%e7%bb%91%e5%ae%9a%e6%a0%b8%e8%b7%9f%e7%ba%bf%e7%a8%8b/">https://www.haibinlaiblog.top/index.php/openmp-%e7%bb%91%e5%ae%9a%e6%a0%b8%e8%b7%9f%e7%ba%bf%e7%a8%8b/</a></p>
<p>兼容 affinity_count 情况（CPU 绑定时预分配用的占位）。
为后续 <code>pthread_create</code> 分配启动数据结构数组。</p>
<h4>分配data</h4>
<pre><code class="language-CPP">      start_data-&gt;fn = fn;
      start_data-&gt;fn_data = data;
      start_data-&gt;ts.team = team;
      start_data-&gt;ts.work_share = &amp;team-&gt;work_shares[0];
      start_data-&gt;ts.last_work_share = NULL;
      start_data-&gt;ts.team_id = i;
      start_data-&gt;ts.level = team-&gt;prev_ts.level + 1;
      start_data-&gt;ts.active_level = thr-&gt;ts.active_level;
      start_data-&gt;ts.def_allocator = thr-&gt;ts.def_allocator;
#ifdef HAVE_SYNC_BUILTINS
      start_data-&gt;ts.single_count = 0;
#endif
      start_data-&gt;ts.static_trip = 0;
      start_data-&gt;num_teams = thr-&gt;num_teams;
      start_data-&gt;team_num = thr-&gt;team_num;
      start_data-&gt;task = &amp;team-&gt;implicit_task[i];
      gomp_init_task (start_data-&gt;task, task, icv);
      team-&gt;implicit_task[i].icv.nthreads_var = nthreads_var;
      team-&gt;implicit_task[i].icv.bind_var = bind_var;
      start_data-&gt;task-&gt;taskgroup = taskgroup;
      start_data-&gt;thread_pool = pool;
      start_data-&gt;nested = nested;</code></pre>
<h4>核心调用逻辑</h4>
<p>每个线程都会被创建</p>
<pre><code class="language-CPP">    attr = gomp_adjust_thread_attr (attr, &amp;thread_attr);
    err = pthread_create (&amp;start_data-&gt;handle, attr, gomp_thread_start,
                start_data);
    start_data++;
    if (err != 0)
    gomp_fatal (&quot;Thread creation failed: %s&quot;, strerror (err));</code></pre>
<h3>收尾同步所有的线程</h3>
<p>详细分析：
<a href="https://www.haibinlaiblog.top/index.php/openmp%e7%9a%84barrier%e5%90%8c%e6%ad%a5/">https://www.haibinlaiblog.top/index.php/openmp%e7%9a%84barrier%e5%90%8c%e6%ad%a5/</a></p>
<p>下面是它的流程图
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528213009309.png" alt="" /></p>
<p>其中，<code>gomp_display_affinity_var</code> 是展示的变量，用来调试。最核心的代码还是barrier</p>
<p>这一部分的<strong>核心目的是主线程阻塞等待所有线程就绪、同步 barrier，然后根据需要动态调整线程和 barrier 状态，并完成资源清理与调试输出。</strong></p>
<p>我们展示其中一段barrier是怎么完成wait的</p>
<pre><code class="language-CPP">void
gomp_barrier_wait_end (gomp_barrier_t *bar, gomp_barrier_state_t state)
{
  if (__builtin_expect (state &amp; BAR_WAS_LAST, 0))
    {
      /* Next time we&#039;ll be awaiting TOTAL threads again.  */
      bar-&gt;awaited = bar-&gt;total;
      __atomic_store_n (&amp;bar-&gt;generation, bar-&gt;generation + BAR_INCR,
            MEMMODEL_RELEASE);
      futex_wake ((int *) &amp;bar-&gt;generation, INT_MAX);
    }
  else
    {
      do
    do_wait ((int *) &amp;bar-&gt;generation, state);
      while (__atomic_load_n (&amp;bar-&gt;generation, MEMMODEL_ACQUIRE) == state);
    }
}

void
gomp_barrier_wait (gomp_barrier_t *bar)
{
  gomp_barrier_wait_end (bar, gomp_barrier_wait_start (bar));
}</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528214347457.png" alt="" /></p>
<p>核心机制也是非常的简单：</p>
<ul>
<li>每个线程调用 <code>gomp_barrier_wait</code>。</li>
<li>内部 <code>gomp_barrier_wait_start</code> 会减计数，返回当前状态。</li>
<li>当最后一个线程到达时，更新 <code>generation</code>，将屏障标记为完成，并唤醒等待线程。</li>
<li>其他线程阻塞等待 <code>generation</code> 发生变化。</li>
<li>这样实现线程同步，保证所有线程都到达屏障后才继续执行。</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528213912369.png" alt="" /></p>
<h2>pthread_create发生了什么？</h2>
<p>刚刚我们经过了下面图中的流程。但是，我们仍然不知道pthread_create创建了什么
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528214009340.png" alt="" /></p>
<pre><code class="language-CPP">    attr = gomp_adjust_thread_attr (attr, &amp;thread_attr);
    err = pthread_create (&amp;start_data-&gt;handle, attr, gomp_thread_start,
                start_data);
    start_data++;
    if (err != 0)
    gomp_fatal (&quot;Thread creation failed: %s&quot;, strerror (err));</code></pre>
<p>这里pthread_create导入了一个 <code>gomp_thread_start</code> 函数。我们看看发生了什么：</p>
<p><a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L70">gcc/libgomp/team.c at master · gcc-mirror/gcc</a></p>
<pre><code class="language-CPP">static void *gomp_thread_start (void *xdata)</code></pre>
<p>这里的<code>xdata</code>是 <code>gomp_thread_start_data</code></p>
<p><a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L49">gcc/libgomp/team.c at master · gcc-mirror/gcc</a></p>
<pre><code class="language-CPP">/* This structure is used to communicate across pthread_create.  */

struct gomp_thread_start_data
{
  void (*fn) (void *);
  void *fn_data;
  struct gomp_team_state ts;
  struct gomp_task *task;
  struct gomp_thread_pool *thread_pool;
  unsigned int place;
  unsigned int num_teams;
  unsigned int team_num;
  bool nested;
  pthread_t handle;
};</code></pre>
<table>
<thead>
<tr>
<th>字段名</th>
<th>类型</th>
<th>作用</th>
<th>影响线程行为的部分</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>fn</code></td>
<td><code>void (*)(void *)</code></td>
<td>要在线程中执行的函数指针</td>
<td><strong>核心行为函数</strong>，线程主循环或初始化函数</td>
</tr>
<tr>
<td><code>fn_data</code></td>
<td><code>void *</code></td>
<td><code>fn</code> 函数的参数</td>
<td>控制 <code>fn</code> 执行上下文，如函数内部如何解析输入</td>
</tr>
<tr>
<td><code>ts</code></td>
<td><code>struct gomp_team_state</code></td>
<td>表示当前线程的 team 信息，如 team ID、大小等</td>
<td>控制线程在团队中的位置、barrier 的索引等</td>
</tr>
<tr>
<td><code>task</code></td>
<td><code>struct gomp_task *</code></td>
<td>当前线程绑定的任务对象（task）</td>
<td>控制任务生命周期、task-finalization</td>
</tr>
<tr>
<td><code>thread_pool</code></td>
<td><code>struct gomp_thread_pool *</code></td>
<td>线程所属的池</td>
<td>支持线程重用（非 nested），参与全局同步</td>
</tr>
<tr>
<td><code>place</code></td>
<td><code>unsigned int</code></td>
<td>NUMA/thread affinity placement 位置信息</td>
<td>控制线程在哪个 CPU 上运行（结合 proc_bind）</td>
</tr>
<tr>
<td><code>num_teams</code></td>
<td><code>unsigned int</code></td>
<td>当前 parallel region 中的 team 总数</td>
<td>对于 <code>teams</code> 指令有用，决定并行分布策略</td>
</tr>
<tr>
<td><code>team_num</code></td>
<td><code>unsigned int</code></td>
<td>当前线程所属的 team 编号</td>
<td>多个 teams 中的标识，用于区分组</td>
</tr>
<tr>
<td><code>nested</code></td>
<td><code>bool</code></td>
<td>是否为嵌套 parallel region 启动的线程</td>
<td>控制线程是否执行完就退出，还是参与循环重用</td>
</tr>
<tr>
<td><code>handle</code></td>
<td><code>pthread_t</code></td>
<td>可选线程句柄，在某些平台用于 join 或取消</td>
<td>通常仅用于调试或手动管理线程</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>信息</th>
<th>来源字段</th>
<th>决定了线程...</th>
</tr>
</thead>
<tbody>
<tr>
<td>要做什么任务</td>
<td><code>fn</code> + <code>fn_data</code></td>
<td>执行哪个工作函数（比如 parallel region 函数）</td>
</tr>
<tr>
<td>属于哪个 team</td>
<td><code>ts</code> + <code>team_num</code></td>
<td>与哪些线程协作</td>
</tr>
<tr>
<td>属于哪个 pool</td>
<td><code>thread_pool</code></td>
<td>是否可以被重用</td>
</tr>
<tr>
<td>退出还是循环执行</td>
<td><code>nested</code></td>
<td>生命周期策略</td>
</tr>
<tr>
<td>是否参与任务调度</td>
<td><code>task</code></td>
<td>是否绑定 OpenMP task</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528215042094.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528215048093.png" alt="" /></p>
<pre><code class="language-CPP">static void *
gomp_thread_start (void *xdata)
{
  struct gomp_thread_start_data *data = xdata;
  struct gomp_thread *thr;
  struct gomp_thread_pool *pool;
  void (*local_fn) (void *);
  void *local_data;

#if defined HAVE_TLS || defined USE_EMUTLS
  thr = &amp;gomp_tls_data;
#else
  struct gomp_thread local_thr;
  thr = &amp;local_thr;
#endif
  gomp_sem_init (&amp;thr-&gt;release, 0);

  /* Extract what we need from data.  */
  local_fn = data-&gt;fn;
  local_data = data-&gt;fn_data;
  thr-&gt;thread_pool = data-&gt;thread_pool;
  thr-&gt;ts = data-&gt;ts;
  thr-&gt;task = data-&gt;task;
  thr-&gt;place = data-&gt;place;
  thr-&gt;num_teams = data-&gt;num_teams;
  thr-&gt;team_num = data-&gt;team_num;
#ifdef GOMP_NEEDS_THREAD_HANDLE
  thr-&gt;handle = data-&gt;handle;
#endif
#if !(defined HAVE_TLS || defined USE_EMUTLS)
  pthread_setspecific (gomp_tls_key, thr);
#endif

  thr-&gt;ts.team-&gt;ordered_release[thr-&gt;ts.team_id] = &amp;thr-&gt;release;

  /* Make thread pool local. */
  pool = thr-&gt;thread_pool;

  if (data-&gt;nested)
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      gomp_barrier_wait (&amp;team-&gt;barrier);

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);
      gomp_barrier_wait_last (&amp;team-&gt;barrier);
    }
  else
    {
      pool-&gt;threads[thr-&gt;ts.team_id] = thr;

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);
      do
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);

      local_fn = thr-&gt;fn;
      local_data = thr-&gt;data;
      thr-&gt;fn = NULL;
    }
      while (local_fn);
    }

  gomp_sem_destroy (&amp;thr-&gt;release);
  pthread_detach (pthread_self ());
  thr-&gt;thread_pool = NULL;
  thr-&gt;task = NULL;
  return NULL;
}
#endif</code></pre>
<ul>
<li>线程私有数据初始化（TLS 或局部变量）</li>
<li>初始化信号量 <code>release</code></li>
<li>从 <code>data</code> 中提取参数（函数指针、线程池、任务等）</li>
<li>设置线程本地存储（pthread_setspecific，如果没TLS）</li>
<li>绑定线程信号量到团队</li>
<li>获取线程池指针</li>
<li>
<p>判断 <code>data-&gt;nested</code>：</p>
<ul>
<li>
<p>是嵌套线程：</p>
<ul>
<li><code>gomp_barrier_wait</code> 等待团队barrier</li>
<li>执行任务函数</li>
<li><code>gomp_team_barrier_wait_final</code> 等待团队结束barrier</li>
<li><code>gomp_finish_task</code></li>
<li><code>gomp_barrier_wait_last</code></li>
<li>线程退出</li>
</ul>
</li>
<li>
<p>不是嵌套线程：</p>
<ul>
<li>将线程加入线程池数组</li>
<li><code>gomp_simple_barrier_wait</code> 等待所有线程准备</li>
<li>循环执行：
<ul>
<li>执行任务函数</li>
<li><code>gomp_team_barrier_wait_final</code></li>
<li><code>gomp_finish_task</code></li>
<li><code>gomp_simple_barrier_wait</code></li>
<li>更新任务函数指针</li>
</ul></li>
<li>任务为空则退出循环</li>
<li>线程退出</li>
</ul>
</li>
</ul>
</li>
<li>清理信号量，线程detach，资源释放，线程结束</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528214743504.png" alt="" /></p>
<p>核心并行+执行函数区域：</p>
<pre><code class="language-CPP">if (data-&gt;nested)
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      gomp_barrier_wait (&amp;team-&gt;barrier);

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);
      gomp_barrier_wait_last (&amp;team-&gt;barrier);
    }
  else
    {
      pool-&gt;threads[thr-&gt;ts.team_id] = thr;

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);
      do
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);

      local_fn = thr-&gt;fn;
      local_data = thr-&gt;data;
      thr-&gt;fn = NULL;
    }
      while (local_fn);
    }</code></pre>
<h4>如果是嵌套并行区域（<code>data-&gt;nested == true</code>）</h4>
<pre><code class="language-CPP">gomp_barrier_wait (&amp;team-&gt;barrier);
local_fn (local_data);
gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
gomp_finish_task (task);
gomp_barrier_wait_last (&amp;team-&gt;barrier);</code></pre>
<p>这段是标准的 <strong>Fork-Join 并行模式</strong>：</p>
<ol>
<li><strong>同步起点</strong>：等待所有线程都启动完成（<code>gomp_barrier_wait</code>）。</li>
<li><strong>执行并行区域</strong>：调用 <code>local_fn(local_data)</code> 执行目标任务。</li>
<li><strong>终点屏障</strong>：等待所有线程完成（<code>gomp_team_barrier_wait_final</code>）。</li>
<li><strong>结束任务</strong>：调用 <code>gomp_finish_task(task)</code> 通知当前任务完成。</li>
<li><strong>最后一次屏障</strong>：最后一个线程可能还要清理 barrier（<code>gomp_barrier_wait_last</code>）。</li>
</ol>
<h4>如果是非嵌套（线程池中的 worker，<code>data-&gt;nested == false</code>）</h4>
<pre><code class="language-CPP">pool-&gt;threads[thr-&gt;ts.team_id] = thr;
gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);
do {
    ...
    local_fn(local_data);
    gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
    gomp_finish_task (task);
    gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);
    local_fn = thr-&gt;fn;
    local_data = thr-&gt;data;
    thr-&gt;fn = NULL;
} while (local_fn);
</code></pre>
<p>这段是一个 <strong>线程复用 loop</strong>，目的是线程池中的线程可以重复服务多个任务（节省创建销毁开销）：</p>
<ol>
<li><strong>注册线程</strong>：把当前线程注册到线程池中对应的位置。</li>
<li><strong>线程全部就绪</strong>：用 <code>threads_dock</code> barrier 等待所有线程启动。</li>
<li><strong>进入循环</strong>：
<ul>
<li>执行任务函数 <code>local_fn(local_data)</code>。</li>
<li>执行完等待 team barrier 完成。</li>
<li>通知任务完成。</li>
<li>再次等待 <code>threads_dock</code>，和主线程同步任务分发。</li>
<li>从 <code>thr-&gt;fn</code>, <code>thr-&gt;data</code> 获取下一个任务。如果为 NULL，就退出。</li>
</ul></li>
<li><strong>退出条件</strong>：直到 <code>thr-&gt;fn == NULL</code>，即主线程不再下发任务。</li>
</ol>
<h4>线程总结</h4>
<ul>
<li><strong>所有线程执行同一个入口函数<code>fn</code>，并共享同一个<code>data</code>参数指针。</strong></li>
<li><strong>线程的身份信息通过<code>gomp_thread()-&gt;ts.team_id</code>区分。</strong></li>
<li><strong>线程根据自身id和线程数在入口函数内划分工作区间，从共享的<code>data</code>结构中读取任务边界。</strong></li>
<li><strong><code>gomp_team_start()</code>负责线程的创建、身份设置和传递入口函数及参数，但不具体划分工作细节，这由线程函数<code>fn</code>来完成。</strong></li>
</ul>
<h2>总结：pthread+线程内的这部分函数</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528220002158.png" alt="" /></p>
<h2>等等，那每个线程怎么知道自己要干什么工作？</h2>
<p>这部分逻辑在哪儿？</p>
<ul>
<li>
<p>这段“划分任务空间”不是在 <code>gomp_team_start()</code> 里完成的。<code>gomp_team_start()</code>只负责<strong>线程启动、初始化和调用入口函数</strong>。</p>
</li>
<li>
<p>任务划分属于<strong>工作共享构造（work-sharing construct）</strong> 实现范畴，主要在 libgomp 的以下几个文件/函数中：</p>
</li>
</ul>
<table>
<thead>
<tr>
<th>功能</th>
<th>相关源码文件/函数</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>并行循环任务划分（for循环调度）</strong></td>
<td><code>libgomp/gomp_loop.c</code></td>
</tr>
<tr>
<td><strong>任务队列与任务调度</strong></td>
<td><code>libgomp/gomp_task.c</code></td>
</tr>
<tr>
<td><strong>线程和迭代区间调度器</strong></td>
<td><code>libgomp/gomp_work_share.c</code></td>
</tr>
<tr>
<td><strong>线程状态结构定义与操作</strong></td>
<td><code>libgomp/gomp_thread.c</code></td>
</tr>
</tbody>
</table>
<p>原来是我们之前的函数太简单，没有传入参数，因此编译器就没有这段的操作。</p>
<h3>例子：任务调度</h3>
<p>比如任务调度，他们的写法就不一样，同时运行的情况也完全不一样
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528221923315.png" alt="" /></p>
<p>任务调度的源码可以从 <a href="https://zhuanlan.zhihu.com/p/611558324">OpenMP task construct 实现原理以及源码分析 - 知乎</a> 看到
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528222146596.png" alt="" /></p>
<pre><code class="language-CPP">/* Called when encountering an explicit task directive.  If IF_CLAUSE is
   false, then we must not delay in executing the task.  If UNTIED is true,
   then the task may be executed by any member of the team.  */

void
GOMP_task (void (*fn) (void *), void *data, void (*cpyfn) (void *, void *),
    long arg_size, long arg_align, bool if_clause, unsigned flags)
{
  struct gomp_thread *thr = gomp_thread ();
  // team 是 OpenMP 一个线程组当中共享的数据
  struct gomp_team *team = thr-&gt;ts.team;

#ifdef HAVE_BROKEN_POSIX_SEMAPHORES
  /* If pthread_mutex_* is used for omp_*lock*, then each task must be
     tied to one thread all the time.  This means UNTIED tasks must be
     tied and if CPYFN is non-NULL IF(0) must be forced, as CPYFN
     might be running on different thread than FN.  */
  if (cpyfn)
    if_clause = false;
  if (flags &amp; 1)
    flags &amp;= ~1;
#endif

  // 这里表示如果是 if 子句的条件为真的时候或者是孤立任务(team == NULL )或者是最终任务的时候或者任务队列当中的任务已经很多的时候
  // 提交的任务需要立即执行而不能够放入任务队列当中然后在 GOMP_parallel_end 函数当中进行任务的取出
  // 再执行
  if (!if_clause || team == NULL
      || (thr-&gt;task &amp;&amp; thr-&gt;task-&gt;final_task)
      || team-&gt;task_count &gt; 64 * team-&gt;nthreads)
    {
      struct gomp_task task;

      gomp_init_task (&amp;task, thr-&gt;task, gomp_icv (false));
      task.kind = GOMP_TASK_IFFALSE;
      task.final_task = (thr-&gt;task &amp;&amp; thr-&gt;task-&gt;final_task) || (flags &amp; 2);
      if (thr-&gt;task)
 task.in_tied_task = thr-&gt;task-&gt;in_tied_task;
      thr-&gt;task = &amp;task;
      if (__builtin_expect (cpyfn != NULL, 0))
 {
        // 这里是进行数据的拷贝
   char buf[arg_size + arg_align - 1];
   char *arg = (char *) (((uintptr_t) buf + arg_align - 1)
    &amp; ~(uintptr_t) (arg_align - 1));
   cpyfn (arg, data);
   fn (arg);
 }
      else
        // 如果不需要进行数据拷贝则直接执行这个函数
 fn (data);
      /* Access to &quot;children&quot; is normally done inside a task_lock
  mutex region, but the only way this particular task.children
  can be set is if this thread&#039;s task work function (fn)
  creates children.  So since the setter is *this* thread, we
  need no barriers here when testing for non-NULL.  We can have
  task.children set by the current thread then changed by a
  child thread, but seeing a stale non-NULL value is not a
  problem.  Once past the task_lock acquisition, this thread
  will see the real value of task.children.  */
      if (task.children != NULL)
 {
   gomp_mutex_lock (&amp;team-&gt;task_lock);
   gomp_clear_parent (task.children);
   gomp_mutex_unlock (&amp;team-&gt;task_lock);
 }
      gomp_end_task ();
    }
  else
    {
    // 下面就是将任务先提交到任务队列当中然后再取出执行
      struct gomp_task *task;
      struct gomp_task *parent = thr-&gt;task;
      char *arg;
      bool do_wake;

      task = gomp_malloc (sizeof (*task) + arg_size + arg_align - 1);
      arg = (char *) (((uintptr_t) (task + 1) + arg_align - 1)
        &amp; ~(uintptr_t) (arg_align - 1));
      gomp_init_task (task, parent, gomp_icv (false));
      task-&gt;kind = GOMP_TASK_IFFALSE;
      task-&gt;in_tied_task = parent-&gt;in_tied_task;
      thr-&gt;task = task;
    // 这里就是参数拷贝逻辑 如果存在拷贝函数就通过拷贝函数进行参数赋值 否则使用 memcpy 进行
    // 参数的拷贝
      if (cpyfn)
 cpyfn (arg, data);
      else
 memcpy (arg, data, arg_size);
      thr-&gt;task = parent;
      task-&gt;kind = GOMP_TASK_WAITING;
      task-&gt;fn = fn;
      task-&gt;fn_data = arg;
      task-&gt;in_tied_task = true;
      task-&gt;final_task = (flags &amp; 2) &gt;&gt; 1;
    // 在这里获取全局队列锁 保证下面的代码在多线程条件下的线程安全
    // 因为在下面的代码当中会对全局的队列进行修改操作 下面的操作就是队列的一些基本操作啦
      gomp_mutex_lock (&amp;team-&gt;task_lock);
      if (parent-&gt;children)
 {
   task-&gt;next_child = parent-&gt;children;
   task-&gt;prev_child = parent-&gt;children-&gt;prev_child;
   task-&gt;next_child-&gt;prev_child = task;
   task-&gt;prev_child-&gt;next_child = task;
 }
      else
 {
   task-&gt;next_child = task;
   task-&gt;prev_child = task;
 }
      parent-&gt;children = task;
      if (team-&gt;task_queue)
 {
   task-&gt;next_queue = team-&gt;task_queue;
   task-&gt;prev_queue = team-&gt;task_queue-&gt;prev_queue;
   task-&gt;next_queue-&gt;prev_queue = task;
   task-&gt;prev_queue-&gt;next_queue = task;
 }
      else
 {
   task-&gt;next_queue = task;
   task-&gt;prev_queue = task;
   team-&gt;task_queue = task;
 }
      ++team-&gt;task_count;
      gomp_team_barrier_set_task_pending (&amp;team-&gt;barrier);
      do_wake = team-&gt;task_running_count + !parent-&gt;in_tied_task
  &lt; team-&gt;nthreads;
      gomp_mutex_unlock (&amp;team-&gt;task_lock);
      if (do_wake)
 gomp_team_barrier_wake (&amp;team-&gt;barrier, 1);
    }
}</code></pre>
<p>这就是这个机制的精髓：</p>
<ul>
<li>
<p>当前线程跑完自己的任务代码后，该任务还有子任务，会接着去管理（或调度执行）这些子任务。</p>
</li>
<li>
<p>这样能保证任务间的依赖关系和执行顺序，避免任务丢失或死锁。</p>
</li>
<li>
<p>父任务和子任务之间用 <code>children</code>、<code>next_child</code>、<code>prev_child</code> 形成循环链表结构维护层次关系。</p>
</li>
<li>
<p>当一个任务执行完后（<code>gomp_end_task()</code>），如果它有子任务，当前线程会负责清理这些子任务（<code>gomp_clear_parent()</code>）或者调度它们继续执行。</p>
</li>
</ul>
<hr />
<h2>work_share</h2>
<p><code>struct gomp_work_share</code> 是 GNU OpenMP (<code>libgomp</code>) 中用于实现 <em>工作共享（work-sharing）构造</em> 的关键数据结构。它是 OpenMP 并行循环（如 <code>for</code>, <code>sections</code>, <code>single</code> ）背后的运行时基础，负责协调多个线程对迭代任务的分配、同步与调度。</p>
<p>它的作用是：<strong>管理并协调线程之间对某个工作负载（work unit）的分配与同步</strong>。</p>
<p>work_share 其实是一种调度范式，对应的调度范式还有work-stealing（大家可以在taskflow，以及各种图算法里看到这样的结构，感兴趣的朋友可以看看一些理论paper - ARORA, N. S., BLUMOFE, R. D., AND PLAXTON, C. G. 1998.<strong>Thread scheduling for multiprogrammed multiprocessors</strong>. In Proceedings of the 10th Annual ACM Symposium on Parallel Algorithms and Architectures (SPAA’98) (Puerto Vallarta, Mexico, June 28–July 2). ACM, New York, pp. 119–129.<a href="https://www.eecis.udel.edu/~cavazos/cisc879-spring2008/papers/arora98thread.pdf">arora98thread.pdf</a> 和一些文献<a href="https://www.kancloud.cn/cfun_good/golang/2033516">6.2 工作窃取式调度 · golan基础 · 看云</a>）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528195813314.png" alt="" /></p>
<table>
<thead>
<tr>
<th>功能</th>
<th>对应字段</th>
</tr>
</thead>
<tbody>
<tr>
<td>迭代调度策略</td>
<td><code>sched</code>, <code>chunk_size</code>, <code>next</code>, <code>end</code>, <code>incr</code></td>
</tr>
<tr>
<td>线程间同步 (<code>ordered</code>)</td>
<td><code>ordered_team_ids</code>, <code>ordered_owner</code>, <code>ordered_cur</code></td>
</tr>
<tr>
<td>互斥与状态维护</td>
<td><code>lock</code>, <code>threads_completed</code></td>
</tr>
<tr>
<td>支持单个 <code>copyprivate</code> 和 task reductions</td>
<td><code>copyprivate</code>, <code>task_reductions</code></td>
</tr>
<tr>
<td>动态结构链接</td>
<td><code>next_alloc</code>, <code>next_free</code>, <code>next_ws</code></td>
</tr>
</tbody>
</table>
<h3>1. 调度策略与循环参数</h3>
<ul>
<li><code>enum gomp_schedule_type sched</code>：指定调度策略，如 <code>static</code>、<code>dynamic</code>、<code>guided</code> 等。对于 <code>sections</code> 构造，该值始终为 <code>DYNAMIC</code>
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/libgomp.h#L215">gcc/libgomp/libgomp.h at master · gcc-mirror/gcc</a></li>
</ul>
<pre><code class="language-CPP">/* This structure contains the data to control one work-sharing construct,
   either a LOOP (FOR/DO) or a SECTIONS.  */
enum gomp_schedule_type
{
  GFS_RUNTIME,
  GFS_STATIC,
  GFS_DYNAMIC,
  GFS_GUIDED,
  GFS_AUTO,
  GFS_MONOTONIC = 0x80000000U
};</code></pre>
<ul>
<li><code>long chunk_size, end, incr</code>：分别表示每个线程处理的迭代块大小、循环终止条件和步长。</li>
<li><code>unsigned long long chunk_size_ull, end_ull, incr_ull</code>：用于处理超大循环计数的无符号版本。</li>
<li><code>long next</code> / <code>unsigned long long next_ull</code>：记录下一个待分配的迭代起始值。</li>
</ul>
<h3>2. 有序区域（<code>ordered</code>）支持</h3>
<ul>
<li><code>unsigned *ordered_team_ids</code>：循环队列，记录线程进入 <code>ordered</code> 区域的顺序。</li>
<li><code>unsigned ordered_num_used</code>：当前已注册进入 <code>ordered</code> 区域的线程数。</li>
<li><code>unsigned ordered_owner</code>：当前拥有 <code>ordered</code> 区域执行权的线程 ID。</li>
<li><code>unsigned ordered_cur</code>：当前允许进入 <code>ordered</code> 区域的线程在队列中的索引。</li>
</ul>
<h3>3. 同步与资源管理</h3>
<ul>
<li><code>gomp_mutex_t lock</code>：互斥锁，保护共享数据的更新，确保线程安全。</li>
<li><code>unsigned threads_completed</code>：记录已完成工作共享构造的线程数。</li>
<li><code>gomp_ptrlock_t next_ws</code> / <code>struct gomp_work_share *next_free</code>：用于管理工作共享结构体的链表，支持资源的复用与释放。</li>
</ul>
<h3>4. <code>single</code> 与 <code>copyprivate</code> 支持</h3>
<ul>
<li><code>void *copyprivate</code>：在 <code>single</code> 构造中，存储需要在多个线程之间共享的数据副本。</li>
</ul>
<p>比如对应<code>sched(dynamic)</code>， 就是在work_share这里实现的。具体的代码原理可以参照：
<a href="https://www.cnblogs.com/Chang-LeHung/p/17089310.html?utm_source=chatgpt.com">OpenMP For Construct dynamic 调度方式实现原理和源码分析 - 一无是处的研究僧 - 博客园</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528213512730.png" alt="" /></p>
<h2>thread</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528195521179.png" alt="" /></p>
<pre><code class="language-cpp">struct gomp_thread
{
  /* This is the function that the thread should run upon launch.  */
  void (*fn) (void *data);
  void *data;

  /* This is the current team state for this thread.  The ts.team member
     is NULL only if the thread is idle.  */
  struct gomp_team_state ts;

  /* This is the task that the thread is currently executing.  */
  struct gomp_task *task;

  /* This semaphore is used for ordered loops.  */
  gomp_sem_t release;

  /* Place this thread is bound to plus one, or zero if not bound
     to any place.  */
  unsigned int place;

  /* User pthread thread pool */
  struct gomp_thread_pool *thread_pool;

#ifdef LIBGOMP_USE_PTHREADS
  /* omp_get_num_teams () - 1.  */
  unsigned int num_teams;

  /* omp_get_team_num ().  */
  unsigned int team_num;
#endif

#if defined(LIBGOMP_USE_PTHREADS) \
    &amp;&amp; (!defined(HAVE_TLS) \
    || !defined(__GLIBC__) \
    || !defined(USING_INITIAL_EXEC_TLS))
  /* pthread_t of the thread containing this gomp_thread.
     On Linux when using initial-exec TLS,
     (typeof (pthread_t)) gomp_thread () - pthread_self ()
     is constant in all threads, so we can optimize and not
     store it.  */
#define GOMP_NEEDS_THREAD_HANDLE 1
  pthread_t handle;
#endif
};</code></pre>
<h2>Try it yourself</h2>
<p>在这里我略去了很多的函数和调用（比如调试信息的局部函数标记LFBXXXX，DWARF 调试信息，防止栈帧攻击的CET指令，用于记录当前栈帧结构的 CFI 信息Call Frame Information），大家可以自行查看。</p>
<p>在自己比对的过程中，可以试图比对几个问题：</p>
<ul>
<li>用-O2 编译出的结果跟 -O0编译出的结果有什么不同？</li>
<li>使用 <code>#pragma omp parallel for reduction(+:sum)</code> 时，for语句和reduction语句是如何实现的？</li>
</ul>
<p>小例子：</p>
<pre><code class="language-CPP">#include &lt;iostream&gt;
#include &lt;vector&gt;
#include &lt;omp.h&gt;

int main() {
    const int size = 1000;  std::vector&lt;int&gt; array(size);  long sum = 0;

    // 初始化数组
    for (int i = 0; i &lt; size; ++i) { array[i] = i + 1;}

    // 使用 OpenMP 并行计算数组和
    #pragma omp parallel for reduction(+:sum)
    for (int i = 0; i &lt; size; ++i) {
        sum += array[i];
    }

}</code></pre>
<h3>objdump</h3>
<p>你可以把程序编译成二进制，然后用objdump 查看它跳到哪了。（你看到的那些ZNS都是PLT跳到的地方）</p>
<pre><code class="language-bash">g++ openmp_hello.cpp -fopenmp -o openmp_sum -O2
objdump -d openmp_sum | grep -A 5 &quot;&lt;GOMP_parallel@plt&gt;&quot; # 如果是sum 例子，调用可能会不一样
ldd openmp_sum</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528143747922.png" alt="" /></p>
<h3>ICV是什么玩意？？？</h3>
<p>在 OpenMP 中，ICV（Implementation-Defined Control Variables，内部控制变量）是一组由 OpenMP 运行时环境维护的变量，用于控制并行执行的行为。这些变量定义了 OpenMP 程序的运行时配置，例如线程数、调度策略等。gomp_icv 是 GNU OpenMP（GOMP，GCC 的 OpenMP 实现）中用于管理这些 ICV 的内部函数或结构。</p>
<p><strong>说白了，就是你平常跑openmp的时候，export的那些东西。</strong></p>
<p>下图是常见的OpenMP ICV 列表及解释</p>
<table>
<thead>
<tr>
<th>ICV 名称</th>
<th>描述</th>
<th>默认值/典型行为</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>nthreads-var</strong></td>
<td>指定并行区域的默认线程数。受 NUM_THREADS 条款或 OMP_NUM_THREADS 环境变量影响。</td>
<td>通常为系统核心数，或由 OMP_NUM_THREADS 设置。</td>
</tr>
<tr>
<td><strong>dyn-var</strong></td>
<td>控制是否启用动态线程调整（允许运行时调整线程数）。受 OMP_DYNAMIC 环境变量影响。</td>
<td>默认关闭（如 GCC 中通常为 false）。</td>
</tr>
<tr>
<td><strong>nest-var</strong></td>
<td>控制是否允许嵌套并行（并行区域内再创建并行区域）。受 OMP_NESTED 环境变量影响。</td>
<td>默认关闭（false），避免嵌套并行开销。</td>
</tr>
<tr>
<td><strong>run-sched-var</strong></td>
<td>定义 for 循环的调度策略（如 static、dynamic、guided）及块大小。受 OMP_SCHEDULE 环境变量影响。</td>
<td>通常为 static（均分）或实现定义。</td>
</tr>
<tr>
<td><strong>def-sched-var</strong></td>
<td>默认调度策略，当未指定调度类型时使用。</td>
<td>实现定义，通常为 static。</td>
</tr>
<tr>
<td><strong>bind-var</strong></td>
<td>控制线程绑定到处理器的方式（OpenMP 3.0 引入）。受 OMP_PROC_BIND 环境变量影响。</td>
<td>实现定义（如 false 或 spread）。</td>
</tr>
<tr>
<td><strong>stacksize-var</strong></td>
<td>设置每个线程的栈大小。受 OMP_STACKSIZE 环境变量影响。</td>
<td>实现定义，通常为几 MB。</td>
</tr>
<tr>
<td><strong>wait-policy-var</strong></td>
<td>控制线程等待行为（如主动旋转或休眠）。受 OMP_WAIT_POLICY 环境变量影响。</td>
<td>实现定义，通常为主动等待。</td>
</tr>
<tr>
<td><strong>max-active-levels-var</strong></td>
<td>限制嵌套并行层数。受 OMP_MAX_ACTIVE_LEVELS 环境变量影响。</td>
<td>默认 1（仅一级并行）。</td>
</tr>
<tr>
<td><strong>active-levels-var</strong></td>
<td>当前活跃的嵌套并行层数（运行时状态）。</td>
<td>动态维护，初始为 0。</td>
</tr>
<tr>
<td><strong>levels-var</strong></td>
<td>当前并行区域的嵌套深度（包括非活跃区域）。</td>
<td>动态维护，初始为 0。</td>
</tr>
</tbody>
</table>
<p>以下是常见 OMP_* 环境变量和对应 ICV 的映射，帮你更清楚地看到它们的关系：</p>
<table>
<thead>
<tr>
<th>环境变量</th>
<th>对应的 ICV</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td>OMP_NUM_THREADS</td>
<td>nthreads-var</td>
<td>设置默认线程数</td>
</tr>
<tr>
<td>OMP_DYNAMIC</td>
<td>dyn-var</td>
<td>是否允许动态调整线程数</td>
</tr>
<tr>
<td>OMP_NESTED</td>
<td>nest-var</td>
<td>是否启用嵌套并行</td>
</tr>
<tr>
<td>OMP_SCHEDULE</td>
<td>run-sched-var</td>
<td>设置循环调度策略（如 static、dynamic）</td>
</tr>
<tr>
<td>OMP_PROC_BIND</td>
<td>bind-var</td>
<td>控制线程绑定到处理器的方式</td>
</tr>
<tr>
<td>OMP_STACKSIZE</td>
<td>stacksize-var</td>
<td>设置线程栈大小</td>
</tr>
<tr>
<td>OMP_WAIT_POLICY</td>
<td>wait-policy-var</td>
<td>控制线程等待行为（如主动/被动）</td>
</tr>
<tr>
<td>OMP_MAX_ACTIVE_LEVELS</td>
<td>max-active-levels-var</td>
<td>限制嵌套并行层数</td>
</tr>
</tbody>
</table>
<ul>
<li><strong>ICV</strong> 是 OpenMP 的核心配置变量，控制线程数、调度、嵌套等行为。</li>
<li><strong>gomp_icv</strong> 是 GCC 的 OpenMP 运行时用来管理这些变量的机制。</li>
<li>每个 ICV 对应一个运行时特性，可通过指令、环境变量或 API 函数配置。</li>
<li>例如，nthreads-var 决定线程数，run-sched-var 控制循环调度，IF 条款（如前文讨论）与 nthreads-var 交互影响并行执行。</li>
</ul>
<p>欢迎看看GNU的解释
<a href="https://gcc.gnu.org/onlinedocs/libgomp/Environment-Variables.html">Environment Variables (GNU libgomp)</a></p>
<p>如果你想详细的查表，它在这里：
<a href="https://gcc.gnu.org/onlinedocs/libgomp/Implementation-defined-ICV-Initialization.html">Implementation-defined ICV Initialization (GNU libgomp)</a></p>
<h3>什么是 __builtin_expect？</h3>
<blockquote>
<p>__builtin_expect 是 GCC（以及支持 GCC 扩展的编译器，如 Clang）提供的一个内置函数，用于向编译器提供分支预测的提示，优化条件分支的性能。OpenMP 运行时库（如 libgomp）的实现中，会用于优化线程管理或控制流逻辑。</p>
</blockquote>
<h3>源码分析入口</h3>
<p>开始吧，噩梦！
<a href="https://github.com/gcc-mirror/gcc/blob/e2bf0b3910de7e65363435f0a7fa606e2448a677/libgomp/parallel.c#L172">gcc/libgomp/parallel.c at e2bf0b3910de7e65363435f0a7fa606e2448a677 · gcc-mirror/gcc</a></p>
<h2>OpenMP的性能比较</h2>
<p>这里我们使用 LAMMPS 这一经典的计算软件，来看看 OpenMP的线程数与 LAMMPS的性能表现：</p>
<p><a href="https://www.lammps.org/#gsc.tab=0">LAMMPS Molecular Dynamics Simulator</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250528174828674.png" alt="" />
由于我们在一台2NUMA 24Core(没有超线程)的机器上运行，我们在这里能看到NUMA效应。</p>
<p>更多的并行加速分析，欢迎看阿姆达尔定律和logP定律的解析。
我把我的logP定律解析放在了这里：
<a href="https://www.haibinlaiblog.top/index.php/pram-bsp-logp-model/">https://www.haibinlaiblog.top/index.php/pram-bsp-logp-model/</a></p>
<p>欢迎做更多的实验！</p>
