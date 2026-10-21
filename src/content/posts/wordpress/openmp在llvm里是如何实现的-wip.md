---
title: "OpenMP在llvm里是如何实现的？"
description: "基础知识：编译器的结构 编译器中的“前端”和“后端”是两个重要的组成部分，它们负责编译过程的不同阶段。我们可以将编译器看作一个“处理流水线”，前端和后端各自执行不同的任务。 前端 ：负责将源代码解析成抽象语法树并生成中间代码，确保代码的语法和语义正确。 词法分析、语法分析、语义分析和中间代码生成。 后端 ：负责优化中间代码并生成目标机器代码，最终输出可执行文件。 优化、目标代码生成、汇编、链接。 前端（Frontend） 编译器的前端…"
publishedAt: "2025-02-17 03:55:57"
updatedAt: "2025-02-24 02:56:56"
category: "Compilers"
tags: ["HPC", "OpenMP", "OS"]
draft: false
slug: "openmp在llvm里是如何实现的-wip"
legacySlug: "openmp在llvm里是如何实现的？wip"
wordpressId: 639
sourceUrl: "https://www.haibinlaiblog.top/index.php/openmp%e5%9c%a8llvm%e9%87%8c%e6%98%af%e5%a6%82%e4%bd%95%e5%ae%9e%e7%8e%b0%e7%9a%84%ef%bc%9fwip/"
commentCount: 0
importedFromWordPress: true
---
<h2>基础知识：编译器的结构</h2>
<p>编译器中的“前端”和“后端”是两个重要的组成部分，它们负责编译过程的不同阶段。我们可以将编译器看作一个“处理流水线”，前端和后端各自执行不同的任务。</p>
<ul>
<li>
<p><strong>前端</strong>：负责将源代码解析成抽象语法树并生成中间代码，确保代码的语法和语义正确。</p>
<ul>
<li>词法分析、语法分析、语义分析和中间代码生成。</li>
</ul>
</li>
<li>
<p><strong>后端</strong>：负责优化中间代码并生成目标机器代码，最终输出可执行文件。</p>
<ul>
<li>优化、目标代码生成、汇编、链接。</li>
</ul>
</li>
</ul>
<h3>前端（Frontend）</h3>
<p>编译器的前端负责从源代码到中间表示的转换，通常包括以下几个步骤：</p>
<ol>
<li>
<p><strong>词法分析（Lexical Analysis）</strong>：</p>
<ul>
<li>前端的第一步是将源代码分解成一系列的标记（tokens）。每个标记代表一个语法单元（如变量、运算符、关键字等）。</li>
<li>例如，源代码 <code>int x = 10;</code> 会被分解为 <code>int</code>、<code>x</code>、<code>=</code>、<code>10</code> 和 <code>;</code>。</li>
</ul>
</li>
<li>
<p><strong>语法分析（Syntax Analysis）</strong>：</p>
<ul>
<li>语法分析器将词法分析得到的标记流转换为抽象语法树（AST）。这棵树反映了源代码的结构和逻辑关系。</li>
<li>语法分析器根据编程语言的语法规则（如文法）来检测源代码是否符合语法要求。</li>
</ul>
</li>
<li>
<p><strong>语义分析（Semantic Analysis）</strong>：</p>
<ul>
<li>语义分析阶段会检查源代码的逻辑错误（如类型错误、变量未定义等）。</li>
<li>这一步会生成符号表，记录变量、函数、类等的属性（如类型、作用域等）。</li>
</ul>
</li>
<li>
<p><strong>中间代码生成（Intermediate Code Generation）</strong>：</p>
<ul>
<li>在前端的最后，编译器会将抽象语法树转化为一种或多种中间表示（IR）。中间代码通常是比源代码更接近机器语言，但仍然是平台无关的代码，便于后端处理。</li>
</ul>
</li>
</ol>
<p>前端的主要任务是确保源代码的语法和语义正确，并生成适合优化和目标代码生成的中间表示（IR）。</p>
<h3>后端（Backend）</h3>
<p>编译器的后端负责将前端生成的中间表示转换为目标机器代码。后端主要包括以下几个步骤：</p>
<ol>
<li>
<p><strong>优化（Optimization）</strong>：</p>
<ul>
<li>后端首先会对中间代码进行各种优化，以提高程序的性能或减少程序的内存占用。优化可以在多个层次上进行，包括循环优化、数据流分析、指令选择等。</li>
<li>优化可以是局部的（如优化某个函数的性能）或全局的（如对整个程序的内存使用进行优化）。</li>
</ul>
</li>
<li>
<p><strong>目标代码生成（Code Generation）</strong>：</p>
<ul>
<li>后端将优化后的中间代码转换为目标机器代码。这是编译器的最后一步，生成的代码可以直接在特定的硬件平台上运行。</li>
<li>目标代码生成通常包括将中间代码转换为汇编语言，随后汇编器将其转化为最终的机器码。</li>
</ul>
</li>
<li>
<p><strong>汇编和链接（Assembly and Linking）</strong>：</p>
<ul>
<li>汇编器将汇编语言代码转换为二进制机器码。</li>
<li>链接器将多个目标文件、库文件链接成一个完整的可执行文件。它还负责处理符号引用和重定位。</li>
</ul>
</li>
</ol>
<h2>编译器对支持OpenMP的工作</h2>
<p>OpenMP（Open Multi-Processing）是一种用于共享内存并行编程的应用程序接口（API）。它允许开发人员利用多核处理器的优势，通过编写并行代码来加速计算任务。在编译器中，OpenMP的支持通常通过解析OpenMP指令并将其转换为适合并行执行的代码来实现。</p>
<p>编译器对OpenMP的支持主要体现在以下几个方面：</p>
<ul>
<li><strong>识别并解析OpenMP指令（pragma）</strong>。</li>
<li><strong>进行并行化分析和决策</strong>，包括循环并行化、任务分配等。</li>
<li><strong>管理线程创建和同步</strong>，包括共享数据和私有数据的管理。</li>
<li><strong>生成并行代码</strong>，并利用OpenMP运行时库来管理线程和同步。</li>
<li><strong>执行并行优化</strong>，以提高程序的性能。</li>
</ul>
<h3>1. <strong>编译器指令支持：识别、转换</strong></h3>
<p>OpenMP使用编译指令（pragma）来指示编译器在特定代码块上应用并行化。编译器需要识别这些指令，并在代码的适当位置插入并行执行的控制结构。例如：</p>
<pre><code class="language-c">#pragma omp parallel
{
    // 并行执行的代码块
}</code></pre>
<p>编译器需要解析这种形式的<code>#pragma</code>指令，理解它的含义并对其后续代码进行并行化优化。<code>#pragma omp parallel</code>指示编译器将紧随其后的代码块并行执行。</p>
<h3>2. <strong>并行化决策分析</strong></h3>
<p>编译器分析OpenMP指令，并根据程序结构决定哪些部分可以并行化。这个过程称为并行化分析。编译器通常会进行以下操作：</p>
<ul>
<li>
<p><strong>循环并行化</strong>：如<code>#pragma omp parallel for</code>指令指示编译器将<code>for</code>循环的迭代分配到多个线程并行执行。</p>
<pre><code class="language-c">#pragma omp parallel for
for (int i = 0; i < N; i++) {
  // 循环体
}</code></pre>
<p>编译器会识别循环，并对循环进行拆分，生成适合多线程执行的代码。</p>
</li>
<li>
<p><strong>任务分配和同步</strong>：当程序中有多个任务（如计算任务）需要并行执行时，编译器会根据OpenMP指令将任务划分并分配给多个线程，同时管理线程之间的同步。</p>
</li>
</ul>
<h3>3. <strong>线程管理和同步</strong></h3>
<p>OpenMP程序通常涉及多个线程的创建与管理，编译器需要插入适当的代码来管理线程的生命周期、同步机制、数据共享等。这包括：</p>
<ul>
<li><strong>线程创建</strong>：根据指令，编译器会为并行区域创建多个线程。</li>
<li><strong>同步机制</strong>：如临界区、屏障（<code>#pragma omp barrier</code>）、锁等，编译器会确保并行区域中的数据访问是安全的。</li>
<li><strong>数据共享与私有化</strong>：编译器通过指令（如<code>shared</code>、<code>private</code>）来决定哪些数据是共享的，哪些数据是每个线程私有的。</li>
</ul>
<p>例如：</p>
<pre><code class="language-c">#pragma omp parallel for shared(a) private(i)
for (int i = 0; i &lt; N; i++) {
    // 每个线程执行的代码
}</code></pre>
<h3>4. <strong>生成并行代码</strong></h3>
<p>一旦编译器解析完OpenMP指令并进行相应的并行化优化，它会生成底层的并行代码。通常，编译器会生成线程创建、数据划分、同步等操作的代码。这些操作通常使用操作系统提供的线程库（如POSIX线程、Windows线程）或者专门的线程库（如Intel Threading Building Blocks）来实现。</p>
<ul>
<li><strong>OpenMP运行时库</strong>：编译器在生成并行代码时，通常会依赖OpenMP运行时库，这个库负责线程的管理、调度、同步等操作。编译器生成的代码会调用这个库中的函数，以便管理线程的生命周期和同步。</li>
</ul>
<h3>5. <strong>优化与性能提升</strong></h3>
<p>编译器会通过不同的优化技术来提高并行程序的性能：</p>
<ul>
<li><strong>循环优化</strong>：如循环拆分、循环合并等，减少并行化过程中可能出现的冗余计算和同步。</li>
<li><strong>负载均衡</strong>：编译器会尽可能将工作均匀地分配给各个线程，以避免某些线程过载或空闲。</li>
<li><strong>数据访问优化</strong>：编译器可能会优化数据访问模式，减少内存访问冲突，提升内存访问效率。</li>
</ul>
<h3>编译器支持的OpenMP版本</h3>
<p>现代编译器（如GCC、Clang、Intel编译器等）通常支持OpenMP的多个版本，并且不断改进对OpenMP指令的支持。具体的编译器版本支持的OpenMP特性可以通过编译器的文档进行查询。</p>
<h3>编译器启用OpenMP支持</h3>
<p>要启用编译器对OpenMP的支持，通常需要通过编译选项来开启。例如，在GCC中，可以通过添加<code>-fopenmp</code>选项来启用OpenMP支持：</p>
<pre><code class="language-bash">gcc -fopenmp my_program.c -o my_program</code></pre>
<h2>LLVM对OpenMP的支持情况</h2>
<p><a href="https://openmp.llvm.org/doxygen/group__PARALLEL.html">LLVM OpenMP: Parallel (fork/join)</a></p>
<p>在 LLVM 编译器生态中，<strong>OpenMP 的支持是通过 Clang 前端 + LLVM OpenMP 运行时库（libomp）实现的</strong>。</p>
<hr />
<h3>一、LLVM 对 OpenMP 的完整支持链</h3>
<pre><code class="language-bash">Clang 前端 → LLVM IR 生成 → OpenMP 运行时库（libomp） → 系统线程管理
           │
           └─ 自动插入并行运行时调用</code></pre>
<h4>1. <strong>编译器前端支持</strong></h4>
<ul>
<li><strong>Clang</strong> 负责解析 OpenMP 的编译制导语句（如 <code>#pragma omp parallel</code>）</li>
<li>
<p>将 OpenMP 指令转换为 LLVM 中间表示（IR），插入对 <code>libomp</code> 的运行时调用</p>
<pre><code class="language-cpp">// 原始代码
#pragma omp parallel for
for(int i=0; i<100; i++){ ... }

// 转换后的 IR 伪代码
__kmpc_fork_call(&loc, 1, microtask, &loop_bound);</code></pre>
</li>
</ul>
<h4>2. <strong>运行时库 (libomp)</strong></h4>
<ul>
<li>LLVM 自主开发的 OpenMP 运行时实现</li>
<li>
<p>核心功能：</p>
<pre><code class="language-c">// 线程池管理
void __kmpc_fork_call(ident_t *loc, int argc, kmpc_micro microtask, ...);

// 任务调度
void __kmpc_for_static_init_4(ident_t *loc, int gtid, int schedule, ...);

// 同步原语
void __kmpc_barrier(ident_t *loc, int gtid);</code></pre>
</li>
</ul>
<h4>3. <strong>架构支持</strong></h4>
<table>
<thead>
<tr>
<th>特性</th>
<th>LLVM 15 支持状态</th>
</tr>
</thead>
<tbody>
<tr>
<td>OpenMP 标准版本</td>
<td>5.2 (完整支持 4.5+)</td>
</tr>
<tr>
<td>GPU Offloading</td>
<td>✅ AMDGPU/NVPTX</td>
</tr>
<tr>
<td>Target 指令</td>
<td>✅ <code>#pragma omp target</code></td>
</tr>
<tr>
<td>任务依赖</td>
<td>✅</td>
</tr>
<tr>
<td>SIMD 指令</td>
<td>✅ AVX2/AVX-512</td>
</tr>
</tbody>
</table>
<hr />
<h2>关键函数解析</h2>
<p>以下是关于 OpenMP 运行时函数 <code>__kmpc_fork_call</code>、<code>__kmpc_barrier</code> 及其相关机制的详细解析：</p>
<h4>1. <strong>核心函数功能</strong></h4>
<ul>
<li>
<p><strong><code>__kmpc_fork_call</code></strong><br />
OpenMP <strong>并行区域入口函数</strong>，负责将串行代码分支为并行执行。<br />
当编译器遇到 <code>#pragma omp parallel</code> 时，会生成对此函数的调用，完成以下操作：</p>
<ul>
<li>激活线程池中的工作线程</li>
<li>将并行区域代码封装为微任务（microtask）</li>
<li>分配共享/私有变量内存空间</li>
</ul>
</li>
<li>
<p><strong><code>__kmpc_barrier</code></strong><br />
实现 <strong>线程同步屏障</strong>，确保所有线程到达同步点后才继续执行。<br />
对应 OpenMP 中的隐式屏障（如 <code>parallel</code> 区域结束时）或显式 <code>#pragma omp barrier</code>。</p>
</li>
</ul>
<h4>2. <strong>命名规范 <code>kmpc</code></strong></h4>
<ul>
<li><strong><code>kmp</code></strong>：源自 <strong>Kuck &amp; Associates Multi-Processing</strong>（KAI 公司的并行技术遗产，后被 Intel 收购）</li>
<li><strong><code>c</code></strong>：表示属于 <strong>C 语言接口</strong>（另有 Fortran 接口使用 <code>kmpf</code> 前缀）</li>
<li>完整前缀含义：<strong>KMP C Interface</strong></li>
</ul>
<hr />
<h3>函数API定义与参数解析</h3>
<h4>1. <strong><code>__kmpc_fork_call</code> 函数原型</strong></h4>
<pre><code class="language-c">void __kmpc_fork_call(
    ident_t    *loc,      // 源代码位置标识符
    int         argc,     // 共享参数数量
    microtask_t microtask,// 并行区域函数指针
    ...                   // 可变参数（共享变量地址）
);</code></pre>
<ul>
<li>
<table>
<thead>
<tr>
<th><strong>参数详解</strong>：</th>
<th>参数</th>
<th>类型</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>loc</code></td>
<td><code>ident_t*</code></td>
<td>记录源代码位置（文件名、行号等），用于调试和性能分析</td>
</tr>
<tr>
<td><code>argc</code></td>
<td><code>int</code></td>
<td>传递给微任务的共享变量数量</td>
</tr>
<tr>
<td><code>microtask</code></td>
<td><code>microtask_t</code></td>
<td>实际并行执行的函数指针（编译器生成的包装函数）</td>
</tr>
<tr>
<td><code>...</code></td>
<td><code>void*</code></td>
<td>共享变量的地址列表（按参数顺序传递）</td>
</tr>
</tbody>
</table>
</li>
<li>
<p><strong>执行流程</strong>：</p>
<ol>
<li>主线程检查线程池状态</li>
<li>唤醒或创建工作线程</li>
<li>分配任务参数到共享内存区</li>
<li>各线程执行 <code>microtask</code> 函数</li>
<li>回收线程资源（可选）</li>
</ol>
</li>
</ul>
<h4>2. <strong><code>__kmpc_barrier</code> 函数原型</strong></h4>
<pre><code class="language-c">void __kmpc_barrier(
    ident_t *loc,       // 源代码位置标识符
    int      gtid       // Global Thread ID（全局线程ID）
);</code></pre>
<ul>
<li>
<table>
<thead>
<tr>
<th><strong>参数详解</strong>：</th>
<th>参数</th>
<th>类型</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>loc</code></td>
<td><code>ident_t*</code></td>
<td>调试信息源位置</td>
</tr>
<tr>
<td><code>gtid</code></td>
<td><code>int</code></td>
<td>当前线程的全局唯一ID（0 为主线程，其他为工作线程）</td>
</tr>
</tbody>
</table>
</li>
<li>
<p><strong>同步机制</strong>：</p>
<ul>
<li>采用 <strong>原子计数器 + 条件变量</strong> 实现</li>
<li>每个线程到达屏障时递减计数器</li>
<li>最后一个线程触发条件变量广播唤醒所有线程</li>
</ul>
</li>
</ul>
<hr />
<h3>三、实现标准与编译器差异</h3>
<h4>1. <strong>规范定义来源</strong></h4>
<ul>
<li>
<p><strong>OpenMP Runtime API</strong><br />
这些函数属于 OpenMP 标准的 <strong>内部实现细节</strong>，未在官方标准文档中公开规范，但各编译器实现遵循通用模式：</p>
<table>
<thead>
<tr>
<th>编译器实现</th>
<th>对应运行时库</th>
<th>头文件位置</th>
</tr>
</thead>
<tbody>
<tr>
<td>LLVM/Clang</td>
<td>libomp</td>
<td><code>omp.h</code> → <code>kmp.h</code></td>
</tr>
<tr>
<td>GCC</td>
<td>libgomp</td>
<td><code>omp.h</code> → <code>gomp-constants.h</code></td>
</tr>
<tr>
<td>Intel ICC</td>
<td>libiomp5</td>
<td><code>omp.h</code> → <code>kmp_os.h</code></td>
</tr>
</tbody>
</table>
</li>
</ul>
<h4>2. <strong>典型实现对比</strong></h4>
<ul>
<li>
<p><strong><code>__kmpc_fork_call</code> 实现差异</strong>：</p>
<pre><code class="language-c">// LLVM libomp 实现（简化版）
void __kmpc_fork_call(...) {
if (master_thread) {
  setup_team_stack();      // 分配线程组内存
  wake_worker_threads();   // 唤醒工作线程
} else {
  wait_for_task();         // 工作线程等待任务
}
execute_microtask(microtask); // 执行用户代码
}

// GCC libgomp 实现特点
void GOMP_parallel_start(...) { /* 显式线程启动 */ }</code></pre>
</li>
<li>
<p><strong>屏障实现优化</strong>：</p>
<pre><code class="language-c">// 现代实现采用无锁算法（以x86为例）
void __kmpc_barrier() {
__atomic_sub_fetch(&counter, 1, __ATOMIC_RELAXED);
while(__atomic_load_n(&counter, __ATOMIC_ACQUIRE) > 0) {
  _mm_pause(); // 自旋等待优化
}
}</code></pre>
</li>
</ul>
<hr />
<h3>四、开发者使用场景</h3>
<h4>1. <strong>调试与性能分析</strong></h4>
<ul>
<li>
<p><strong>查看运行时调用</strong>：</p>
<pre><code class="language-bash"># 使用 GDB 跟踪调用链
(gdb) break __kmpc_fork_call
(gdb) backtrace
# 查看并行区域参数
(gdb) p *loc@4</code></pre>
</li>
<li>
<p><strong>性能计数器监控</strong>：</p>
<pre><code class="language-bash"># Linux perf 统计屏障开销
perf stat -e 'omp:barrier_wait' ./program</code></pre>
</li>
</ul>
<h4>2. <strong>高级优化技巧</strong></h4>
<ul>
<li>
<p><strong>动态线程调整</strong>：</p>
<pre><code class="language-c">// 覆盖默认线程数设置
void __kmpc_set_num_threads(int num) {
omp_set_num_threads(num);
}</code></pre>
</li>
<li>
<p><strong>NUMA 感知绑定</strong>：</p>
<pre><code class="language-c">// 在初始化阶段设置线程绑定
__kmpc_set_default_affinity( KMP_AFFINITY_GRANULARITY=core );</code></pre>
</li>
</ul>
<hr />
<h3>五、典型问题排查</h3>
<h4>1. <strong>线程泄漏问题</strong></h4>
<ul>
<li><strong>现象</strong>：程序退出时卡死</li>
<li><strong>诊断</strong>：
<pre><code class="language-bash"># 检查未回收的线程
pstack <pid> | grep __kmpc_barrier</code></pre></li>
<li><strong>解决</strong>：确保所有并行区域正确关闭</li>
</ul>
<h4>2. <strong>屏障死锁</strong></h4>
<ul>
<li><strong>常见原因</strong>：
<ul>
<li>不平衡的条件分支（如某些线程未到达屏障）</li>
<li>在任务（task）区域内错误使用屏障</li>
</ul></li>
<li><strong>调试方法</strong>：
<pre><code class="language-bash">export OMP_DEBUG=1    # 启用运行时调试日志
export KMP_BLOCKTIME=0</code></pre></li>
</ul>
<hr />
<h3>附：OpenMP 运行时调用层次</h3>
<pre><code class="language-c">// 用户代码
#pragma omp parallel
{
  // 并行区域
}

// 编译器生成代码
void .omp_outlined.(void *data) {
  // 用户代码逻辑
}

void main() {
  __kmpc_fork_call(&amp;loc, 0, .omp_outlined.);
}

// 运行时调用链
__kmpc_fork_call
  ├─ __kmpc_begin                   // 初始化并行环境
  ├─ __kmp_launch_thread            // 启动工作线程
  └─ __kmpc_end                     // 清理资源</code></pre>
<p>这些底层函数构成了 OpenMP 并行化的核心机制，理解它们的工作原理对于调试性能关键型代码和深度优化至关重要。普通开发者通常无需直接调用这些接口，但掌握其原理有助于更高效地使用 OpenMP。</p>
<h2>__kmpc_fork_call 解析</h2>
<p>源代码：</p>
<pre><code class="language-C">/*!
@ingroup PARALLEL
@param loc  source location information
@param argc  total number of arguments in the ellipsis
@param microtask  pointer to callback routine consisting of outlined parallel
construct
@param ...  pointers to shared variables that aren&#039;t global

Do the actual fork and call the microtask in the relevant number of threads.
*/
void __kmpc_fork_call(ident_t *loc, kmp_int32 argc, kmpc_micro microtask, ...) {
  int gtid = __kmp_entry_gtid();

#if (KMP_STATS_ENABLED)
  // If we were in a serial region, then stop the serial timer, record
  // the event, and start parallel region timer
  stats_state_e previous_state = KMP_GET_THREAD_STATE();
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_parallel_overhead);
  } else {
    KMP_PUSH_PARTITIONED_TIMER(OMP_parallel_overhead);
  }
  int inParallel = __kmpc_in_parallel(loc);
  if (inParallel) {
    KMP_COUNT_BLOCK(OMP_NESTED_PARALLEL);
  } else {
    KMP_COUNT_BLOCK(OMP_PARALLEL);
  }
#endif

  // maybe to save thr_state is enough here
  {
    va_list ap;
    va_start(ap, microtask);

#if OMPT_SUPPORT
    ompt_frame_t *ompt_frame;
    if (ompt_enabled.enabled) {
      kmp_info_t *master_th = __kmp_threads[gtid];
      ompt_frame = &amp;master_th-&gt;th.th_current_task-&gt;ompt_task_info.frame;
      ompt_frame-&gt;enter_frame.ptr = OMPT_GET_FRAME_ADDRESS(0);
    }
    OMPT_STORE_RETURN_ADDRESS(gtid);
#endif

#if INCLUDE_SSC_MARKS
    SSC_MARK_FORKING();
#endif
    __kmp_fork_call(loc, gtid, fork_context_intel, argc,
                    VOLATILE_CAST(microtask_t) microtask, // &quot;wrapped&quot; task
                    VOLATILE_CAST(launch_t) __kmp_invoke_task_func,
                    kmp_va_addr_of(ap));
#if INCLUDE_SSC_MARKS
    SSC_MARK_JOINING();
#endif
    __kmp_join_call(loc, gtid
#if OMPT_SUPPORT
                    ,
                    fork_context_intel
#endif
    );

    va_end(ap);

#if OMPT_SUPPORT
    if (ompt_enabled.enabled) {
      ompt_frame-&gt;enter_frame = ompt_data_none;
    }
#endif
  }

#if KMP_STATS_ENABLED
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_serial);
    KMP_SET_THREAD_STATE(previous_state);
  } else {
    KMP_POP_PARTITIONED_TIMER();
  }
#endif // KMP_STATS_ENABLED
}
</code></pre>
<p>关于<code>__kmpc_fork_call</code>实现机制</p>
<p>这段代码是实现OpenMP并行计算的核心部分，具体是<code>__kmpc_fork_call</code>函数的实现。它用于在OpenMP中创建一个并行区域（fork），在该区域内并行地执行给定的微任务（<code>microtask</code>）。函数通过多个线程来处理任务，并提供了一些计时和性能监控的功能。让我们逐步分析每个部分的作用：</p>
<h3>1. 函数参数</h3>
<ul>
<li><code>loc</code>: 该参数传递了源代码的位置，通常用于错误报告和调试。</li>
<li><code>argc</code>: 传递给微任务的参数数量。它用于后续处理变量的传递。</li>
<li><code>microtask</code>: 是一个指向回调函数的指针，回调函数是并行执行的微任务。</li>
<li><code>...</code>: 表示一个可变参数列表，包含并行区域中要共享的变量。</li>
</ul>
<h3>2. 获取线程ID</h3>
<pre><code class="language-c">int gtid = __kmp_entry_gtid();</code></pre>
<p>此行获取当前线程的线程ID（GTID, Global Thread ID）。GTID用于标识在OpenMP运行时系统中每个线程。</p>
<h3>3. 性能统计和计时功能</h3>
<p>在启用了统计功能的情况下，代码会记录当前并行区域的性能数据：</p>
<pre><code class="language-c">#if (KMP_STATS_ENABLED)
  // If we were in a serial region, then stop the serial timer, record
  // the event, and start parallel region timer
  stats_state_e previous_state = KMP_GET_THREAD_STATE();
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_parallel_overhead);
  } else {
    KMP_PUSH_PARTITIONED_TIMER(OMP_parallel_overhead);
  }
  int inParallel = __kmpc_in_parallel(loc);
  if (inParallel) {
    KMP_COUNT_BLOCK(OMP_NESTED_PARALLEL);
  } else {
    KMP_COUNT_BLOCK(OMP_PARALLEL);
  }
#endif</code></pre>
<ul>
<li>检查当前线程的状态，如果是串行区域，则记录并开始并行区域的计时。</li>
<li>根据当前是否在并行区域内，增加相应的统计计数器（并行区或嵌套并行区）。</li>
</ul>
<h3>4. 可变参数处理</h3>
<pre><code class="language-c">va_list ap;
va_start(ap, microtask);</code></pre>
<ul>
<li><code>va_list</code>是一个用于处理可变参数的类型，<code>va_start</code>初始化它，以便后续访问传递给函数的共享变量。</li>
</ul>
<h3>5. OMPT支持</h3>
<pre><code class="language-c">#if OMPT_SUPPORT
    ompt_frame_t *ompt_frame;
    if (ompt_enabled.enabled) {
      kmp_info_t *master_th = __kmp_threads[gtid];
      ompt_frame = &amp;master_th-&gt;th.th_current_task-&gt;ompt_task_info.frame;
      ompt_frame-&gt;enter_frame.ptr = OMPT_GET_FRAME_ADDRESS(0);
    }
    OMPT_STORE_RETURN_ADDRESS(gtid);
#endif</code></pre>
<ul>
<li>如果启用了OMPT（OpenMP工具接口），会保存调用堆栈和返回地址等调试信息，允许外部工具（如调试器）获取任务的执行细节。</li>
</ul>
<h3>6. SSC Markers（性能分析）</h3>
<pre><code class="language-c">#if INCLUDE_SSC_MARKS
    SSC_MARK_FORKING();
#endif</code></pre>
<ul>
<li>如果启用了SSC（可能是某种性能分析框架），会在并行区域开始时插入标记，以便性能工具进行跟踪。</li>
</ul>
<h3>7. 核心调用</h3>
<pre><code class="language-c">__kmp_fork_call(loc, gtid, fork_context_intel, argc,
                VOLATILE_CAST(microtask_t) microtask,
                VOLATILE_CAST(launch_t) __kmp_invoke_task_func,
                kmp_va_addr_of(ap));</code></pre>
<ul>
<li>这是实际的“fork”操作，创建并行区域，并启动每个线程来执行给定的回调函数（即微任务）。</li>
<li><code>__kmp_fork_call</code>实际上会分配线程并执行每个线程的任务。</li>
</ul>
<h3>8. SSC Joining Markers（性能分析）</h3>
<pre><code class="language-c">#if INCLUDE_SSC_MARKS
    SSC_MARK_JOINING();
#endif</code></pre>
<ul>
<li>在并行区域结束时，插入一个结束标记。</li>
</ul>
<h3>9. 等待任务完成</h3>
<pre><code class="language-c">__kmp_join_call(loc, gtid);</code></pre>
<ul>
<li>等待所有线程完成任务，这意味着调用<code>__kmp_join_call</code>来确保所有分支的工作都执行完毕。</li>
</ul>
<h3>10. 结束可变参数处理</h3>
<pre><code class="language-c">va_end(ap);</code></pre>
<ul>
<li>结束对可变参数列表的处理。</li>
</ul>
<h3>11. 恢复OMPT状态</h3>
<pre><code class="language-c">#if OMPT_SUPPORT
    if (ompt_enabled.enabled) {
      ompt_frame-&gt;enter_frame = ompt_data_none;
    }
#endif</code></pre>
<ul>
<li>如果启用了OMPT，恢复OMPT框架的状态。</li>
</ul>
<h3>12. 性能计时恢复</h3>
<pre><code class="language-c">#if KMP_STATS_ENABLED
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_serial);
    KMP_SET_THREAD_STATE(previous_state);
  } else {
    KMP_POP_PARTITIONED_TIMER();
  }
#endif // KMP_STATS_ENABLED</code></pre>
<ul>
<li>最后，恢复之前的计时状态，结束并行区域的性能统计。</li>
</ul>
<h3>总结</h3>
<p>这段代码主要用于在OpenMP并行计算中创建并行区域并执行任务。它不仅执行了多线程任务，还包括对性能的监控（通过计时和统计功能），并且支持调试和分析工具（如OMPT和SSC）。</p>
<h2>核心调用 __kmp_fork_call 解析</h2>
<p>源码过长，放在本文最后。</p>
<p><code>__kmp_fork_call</code> 是 OpenMP 运行时库的一部分，负责在遇到并行区域时处理 fork 操作。以下是关键步骤和潜在问题的详细分解：</p>
<p><strong>1. 初始化和设置：</strong></p>
<ul>
<li>检查运行时是否已初始化，并从软暂停中恢复。</li>
<li>获取当前线程的信息和父级团队结构。</li>
</ul>
<p><strong>2. 团队构造处理：</strong></p>
<ul>
<li>通过 <code>__kmp_fork_in_teams</code> 特殊处理嵌套在 <code>teams</code> 构造中的并行区域。</li>
</ul>
<p><strong>3. 线程数量确定：</strong></p>
<ul>
<li>使用 <code>master_set_numthreads</code> 或 ICV（内部控制变量）计算线程数（<code>nthreads</code>）。</li>
<li>考虑 <code>task_thread_limit</code> 对目标区域的影响，并检查嵌套的活跃级别。</li>
</ul>
<p><strong>4. 串行执行快捷方式：</strong></p>
<ul>
<li>如果 <code>nthreads == 1</code>，调用 <code>__kmp_serial_fork_call</code> 串行执行，而不创建团队。</li>
</ul>
<p><strong>5. 团队创建：</strong></p>
<ul>
<li><strong>锁获取：</strong> 使用 <code>__kmp_forkjoin_lock</code> 安全地保留线程。</li>
<li><strong>ICV 传播：</strong> 将内部控制变量（<code>nproc</code>、<code>proc-bind</code>）复制到新团队中。</li>
<li><strong>团队分配：</strong> 使用 <code>__kmp_allocate_team</code> 分配并初始化新的 <code>kmp_team_t</code> 结构。
（什么是ICV？）
在 OpenMP 中，<strong>ICV</strong> 是 <strong>Internal Control Variables（内部控制变量）</strong> 的缩写。它们是由 OpenMP 运行时用于控制并行执行行为的变量。每个线程和团队通常都会有一组自己的 ICV，用于决定如何分配资源、调度任务、处理线程绑定等。</li>
</ul>
<p>常见的 ICV 变量包括：</p>
<ol>
<li><strong>nproc（number of processors）：</strong> 表示可用于并行执行的处理器数量。它通常决定了并行区域的线程数或任务划分的策略。</li>
<li><strong>proc-bind：</strong> 指定线程绑定策略，控制线程如何绑定到物理处理器或核心上。常见的绑定策略包括将线程绑定到特定的核心上，或者将线程分散到多个核心。</li>
</ol>
<p><strong>ICV 传播</strong> 是指将这些内部控制变量从父团队（parent team）传递到新创建的子团队，以确保子团队在并行执行时能保持一致的执行策略和资源分配。这样做能够确保新的团队在执行时继承父团队的设置（如处理器数量和线程绑定策略），从而保证 OpenMP 程序的正确性和性能。</p>
<p>例如，在创建一个新团队时，可能需要将父团队的 ICV（如 <code>nproc</code> 和 <code>proc-bind</code>）复制到新团队中，以便新团队能够使用相同的资源管理和线程调度策略。</p>
<p><strong>6. 参数设置：</strong></p>
<ul>
<li>将来自父团队或 <code>va_list</code> 的参数复制到新团队的 <code>argv</code> 中。</li>
</ul>
<p><strong>7. 线程分叉：</strong></p>
<ul>
<li>调用 <code>__kmp_fork_team_threads</code> 创建并唤醒工作线程。</li>
<li>为新团队的线程设置 ICV 复制。</li>
</ul>
<p><strong>8. 微任务调用：</strong></p>
<ul>
<li>主线程直接执行用户的并行区域（微任务）。</li>
</ul>
<p><strong>9. 清理与返回：</strong></p>
<ul>
<li>释放 fork-join 锁并处理 ITT/OMPT 跟踪。</li>
</ul>
<p><strong>潜在问题和考虑事项：</strong></p>
<ul>
<li>
<p><strong>竞态条件：</strong></p>
<ul>
<li><code>__kmp_forkjoin_lock</code> 对线程保留至关重要。如果没有正确释放（例如，在错误路径中），可能会导致死锁。</li>
<li>通过 <code>KMP_CHECK_UPDATE</code> 的原子更新可能导致团队状态不一致。</li>
</ul>
</li>
<li>
<p><strong>嵌套并行：</strong></p>
<ul>
<li>必须正确处理 <code>t_active_level</code> 和 <code>t_level</code>，以避免过度计数嵌套级别。</li>
<li>检查 <code>if (level + 1 &lt; parent_team-&gt;t.t_nested_nth-&gt;used)</code> 假设了有效的 <code>nested_nth</code> 结构；无效的访问可能会导致崩溃。</li>
</ul>
</li>
<li>
<p><strong>ICV 传播：</strong></p>
<ul>
<li>复制 <code>nproc</code> 和 <code>proc_bind</code> 到新团队的 ICV 时，必须确保所有线程接收到正确的值。</li>
<li><code>teams</code> 构造的 <code>proc_bind</code> 处理依赖于 <code>__kmp_teams_proc_bind</code>，必须正确初始化。</li>
</ul>
</li>
<li>
<p><strong>OMPT/ITT 支持：</strong></p>
<ul>
<li>像 <code>ompt_callback_parallel_begin</code> 这样的回调必须接收有效的 <code>ompt_parallel_data</code>，以避免工具问题。</li>
<li>ITT 中的错误堆栈连接 ID 可能会导致分析不准确。</li>
</ul>
</li>
<li>
<p><strong>错误处理：</strong></p>
<ul>
<li>像 <code>__kmp_allocate_team</code> 这样的函数可能会返回 NULL；代码假设分配成功，这可能导致崩溃。</li>
<li>微任务调用中的 <code>KMP_ASSERT2(0, ...)</code> 是一个硬失败；可能需要适当的错误恢复。</li>
</ul>
</li>
</ul>
<p><strong>关键区域和锁：</strong></p>
<ul>
<li><code>__kmp_forkjoin_lock</code> 在线程保留时获取，并在团队设置后释放。这个锁对于防止线程过度订阅至关重要。</li>
<li>使用 <code>KMP_CHECK_UPDATE</code> 表明对共享团队/线程结构进行原子或有序写入，以确保线程之间的可见性。</li>
</ul>
<p><strong>测试建议：</strong></p>
<ol>
<li><strong>嵌套并行区域：</strong> 测试多个嵌套级别和不同的 <code>num_threads</code>，检查是否有资源泄漏或线程计数错误。</li>
<li><strong>proc-bind 变体：</strong> 确保不同的绑定策略（如 spread、close 等）能够正确传播到新团队。</li>
<li><strong>团队构造：</strong> 验证当 <code>parallel</code> 紧密嵌套在 <code>teams</code> 中时的行为，特别是在主机/设备卸载混合的情况下。</li>
<li><strong>OMPT 工具集成：</strong> 验证并行开始/结束事件是否正确报告，并且数据指针有效。</li>
<li><strong>错误注入：</strong> 强制分配失败（例如，<code>__kmp_allocate_team</code>），以测试鲁棒性和错误处理路径。</li>
</ol>
<p>这段代码由于处理了各种 OpenMP 特性和优化，因此较为复杂。仔细审查锁的使用、线程状态转换和 ICV 管理对于确保代码的正确性至关重要。</p>
<h3>其他：OpenMP 线程池管理与工作线程激活</h3>
<p><strong>实现目标</strong>：按需唤醒或创建线程，减少线程创建销毁开销。</p>
<h4>1. <strong>线程池初始化</strong></h4>
<ul>
<li>
<p><strong>启动阶段</strong>：首次调用并行区域时初始化线程池</p>
<pre><code class="language-c">// libomp 内部状态机伪代码
static kmp_thread_pool_t pool;

void __kmpc_init() {
if (!pool.initialized) {
  pool.max_threads = omp_get_max_threads();
  pool.workers = malloc(pool.max_threads * sizeof(kmp_worker));
  for (int i=0; i&lt;pool.max_threads-1; i++) {
    create_thread(worker_loop, &amp;pool.workers[i]); // 创建工作线程
    suspend_thread(pool.workers[i]); // 初始处于挂起状态
  }
}
}</code></pre>
</li>
</ul>
<hr />
<h4>2. <strong>线程唤醒机制</strong></h4>
<ul>
<li><strong>信号量 + 条件变量</strong>：主线程通过信号量唤醒工作线程</li>
</ul>
<pre><code class="language-c">  void __kmpc_fork_call(...) {
    // 主线程设置任务
    pool.current_task = microtask;
    pool.shared_args = va_arg(args);

    // 唤醒工作线程（伪代码）
    for (int i=0; i&lt;num_threads-1; i++) {
      release_semaphore(pool.workers[i].sem); // 触发信号量
    }

    // 主线程自身参与任务执行
    microtask(0, pool.shared_args);
  }

  // 工作线程事件循环
  void worker_loop(kmp_worker *w) {
    while (1) {
      wait_semaphore(w-&gt;sem); // 等待任务信号
      execute_task(w-&gt;id, pool.current_task);
    }
  }</code></pre>
<h4>3. <strong>动态线程调整</strong></h4>
<ul>
<li><strong>负载感知策略</strong>：根据历史利用率调整活跃线程数
<pre><code class="language-c">if (prev_utilization &lt; 60%)
pool.active_workers = max(1, pool.active_workers-2);
else if (prev_utilization &gt; 90%)
pool.active_workers = min(pool.max_threads, pool.active_workers+2);</code></pre></li>
</ul>
<hr />
<h3>二、微任务（Microtask）封装机制</h3>
<p><strong>实现目标</strong>：将并行代码块转化为可调度执行的独立单元。</p>
<h4>1. <strong>编译器代码生成</strong></h4>
<p>原始代码：</p>
<pre><code class="language-cpp">#pragma omp parallel for
for (int i=0; i&lt;N; i++) {
  arr[i] = i*i;
}</code></pre>
<p>编译器生成：</p>
<pre><code class="language-c">// 微任务函数原型
typedef void (*microtask_t)(int gtid, int tid, void **shared_args);

// 生成的微任务函数
void .omp_microtask_123(int gtid, int tid, void **args) {
  int start, end;
  __kmpc_for_static_init(&amp;loc, gtid, &amp;start, &amp;end); // 计算迭代区间
  for (int i=start; i&lt;end; i++) {
    ((int*)args[0])[i] = i*i; // 通过共享参数访问数组
  }
}

// 主函数调用
void main() {
  int *arr = malloc(N*sizeof(int));
  __kmpc_fork_call(&amp;loc, 1, .omp_microtask_123, arr);
}</code></pre>
<h4>2. <strong>参数传递优化</strong></h4>
<ul>
<li>
<p><strong>共享参数打包</strong>：将多个共享变量合并到连续内存</p>
<pre><code class="language-c">struct shared_args {
int *arr;
int N;
};

void microtask(int gtid, struct shared_args *args) {
// 直接访问结构体成员
}</code></pre>
</li>
<li>
<p><strong>私有变量处理</strong>：通过线程本地存储（TLS）自动分配</p>
<pre><code class="language-c">__thread int private_var; // 每个线程独立实例</code></pre>
</li>
</ul>
<hr />
<h3>三、内存分配策略</h3>
<p><strong>实现目标</strong>：高效管理共享/私有变量内存，减少缓存争用。</p>
<h4>1. <strong>共享内存分配</strong></h4>
<ul>
<li>
<p><strong>主线程栈分配</strong>：小数据直接使用主线程栈</p>
<pre><code class="language-c">char shared_buf[1024]; // 主线程栈内存
__kmpc_fork_call(..., shared_buf);</code></pre>
</li>
<li>
<p><strong>NUMA 优化分配</strong>：大内存按访问模式分配</p>
<pre><code class="language-c">void *shared_mem = numa_alloc_onnode(size, numa_node_of_cpu(current_core));</code></pre>
</li>
</ul>
<h4>2. <strong>私有内存分配</strong></h4>
<ul>
<li>
<p><strong>线程本地缓存</strong>：预先分配内存池</p>
<pre><code class="language-c">__thread char *private_pool = NULL;
if (!private_pool) {
private_pool = malloc(PRIVATE_POOL_SIZE);
}</code></pre>
</li>
<li>
<p><strong>栈空间重用</strong>：利用线程栈避免堆分配</p>
<pre><code class="language-c">void microtask(...) {
int private_array[1024]; // 自动栈分配
}</code></pre>
</li>
</ul>
<h4>3. <strong>内存对齐优化</strong></h4>
<pre><code class="language-c">// 确保共享变量缓存行对齐
struct __attribute__((aligned(64))) SharedData {
  int counter;
  // ...
};</code></pre>
<hr />
<h3>四、执行流程示例</h3>
<p>以4线程执行并行区域为例：</p>
<ol>
<li>
<p><strong>主线程（gtid=0）调用<code>__kmpc_fork_call</code></strong></p>
<ul>
<li>检查线程池状态，唤醒3个工作线程（gtid=1,2,3）</li>
<li>将微任务函数指针和参数存入全局任务队列</li>
</ul>
</li>
<li>
<p><strong>线程任务分配</strong></p>
<pre><code class="language-c">void execute_task(int gtid, microtask_t task) {
 // 动态划分迭代区间
 int chunk = N / 4;
 int start = gtid * chunk;
 int end = (gtid == 3) ? N : start + chunk;

 // 执行实际计算
 for (int i=start; i&lt;end; i++) {
   arr[i] = i*i;
 }
}</code></pre>
</li>
<li>
<p><strong>同步与回收</strong></p>
<ul>
<li>各线程完成任务后进入屏障状态</li>
<li>主线程确认所有线程完成后继续执行</li>
</ul>
</li>
</ol>
<hr />
<h3>五、性能优化</h3>
<h4>1. <strong>避免虚假共享</strong></h4>
<pre><code class="language-c">// 错误示例：不同线程修改相邻变量
struct {
  int a; // 线程0修改
  int b; // 线程1修改
} shared;

// 正确做法：填充缓存行
struct {
  int a;
  char padding[60];
} shared1;

struct {
  int b;
  char padding[60];
} shared2;</code></pre>
<h4>2. <strong>NUMA 感知分配</strong></h4>
<pre><code class="language-c">// 在数据初始化的NUMA节点分配
void *data = numa_alloc_onnode(size, numa_node_of_cpu(gtid));</code></pre>
<h4>3. <strong>任务窃取（Work Stealing）</strong></h4>
<pre><code class="language-c">// 动态负载均衡实现
while (my_start &lt; my_end) {
  if (steal_from_neighbor()) {
    // 获取其他线程未完成的任务区间
    update_start_end();
  }
  process_chunk();
}</code></pre>
<hr />
<p>通过上述机制，<code>__kmpc_fork_call</code>在保证OpenMP易用性的同时，实现了高效的线程管理和内存分配。实际性能取决于硬件架构（如缓存一致性协议、NUMA拓扑）和运行时参数的合理配置（如线程绑定策略、内存对齐）。</p>
<p>以下是针对 <code>__kmpc_fork_call</code> 函数代码的详细分析，结合 OpenMP 运行时库的实现逻辑和代码结构进行分段解析：</p>
<hr />
<h3>一、函数定义与参数解析</h3>
<pre><code class="language-c">void __kmpc_fork_call(ident_t *loc, kmp_int32 argc, kmpc_micro microtask, ...) {
  int gtid = __kmp_entry_gtid(); // 获取当前线程的全局线程ID (Global Thread ID)
  // ...
}</code></pre>
<ul>
<li><strong>参数说明</strong>：
<ul>
<li><code>loc</code>：源代码位置标识符，用于调试和性能分析（包含文件名、行号等信息）。</li>
<li><code>argc</code>：传递给微任务的共享参数数量。</li>
<li><code>microtask</code>：指向并行区域代码的封装函数（由编译器生成）。</li>
<li><code>...</code>：可变参数列表，传递共享变量的地址。</li>
</ul></li>
</ul>
<hr />
<h3>二、性能统计模块（<code>KMP_STATS_ENABLED</code>）</h3>
<pre><code class="language-c">#if (KMP_STATS_ENABLED)
  stats_state_e previous_state = KMP_GET_THREAD_STATE();
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_parallel_overhead);
  } else {
    KMP_PUSH_PARTITIONED_TIMER(OMP_parallel_overhead);
  }
  int inParallel = __kmpc_in_parallel(loc);
  if (inParallel) {
    KMP_COUNT_BLOCK(OMP_NESTED_PARALLEL);
  } else {
    KMP_COUNT_BLOCK(OMP_PARALLEL);
  }
#endif</code></pre>
<ul>
<li><strong>功能</strong>：
<ol>
<li><strong>状态记录</strong>：<code>KMP_GET_THREAD_STATE()</code> 获取线程当前状态（串行或并行）。</li>
<li><strong>计时器切换</strong>：若从串行区域进入并行，交换计时器以统计并行开销。</li>
<li><strong>嵌套并行检测</strong>：通过 <code>__kmpc_in_parallel</code> 判断是否处于嵌套并行区域。</li>
<li><strong>性能计数器</strong>：<code>KMP_COUNT_BLOCK</code> 记录并行区域的启动次数（普通或嵌套）。</li>
</ol></li>
</ul>
<hr />
<h3>三、可变参数处理与工具支持（<code>OMPT_SUPPORT</code>）</h3>
<pre><code class="language-c">{
  va_list ap;
  va_start(ap, microtask); // 初始化可变参数列表

#if OMPT_SUPPORT
  ompt_frame_t *ompt_frame;
  if (ompt_enabled.enabled) {
    kmp_info_t *master_th = __kmp_threads[gtid];
    ompt_frame = &amp;master_th-&gt;th.th_current_task-&gt;ompt_task_info.frame;
    ompt_frame-&gt;enter_frame.ptr = OMPT_GET_FRAME_ADDRESS(0);
  }
  OMPT_STORE_RETURN_ADDRESS(gtid); // 存储返回地址供工具链分析
#endif</code></pre>
<ul>
<li><strong>功能</strong>：
<ul>
<li><strong>可变参数</strong>：通过 <code>va_start</code> 和后续的 <code>kmp_va_addr_of(ap)</code> 传递共享变量地址。</li>
<li><strong>OpenMP Tools Interface (OMPT)</strong>：</li>
<li><strong>帧信息记录</strong>：<code>ompt_frame</code> 跟踪任务执行栈帧。</li>
<li><strong>返回地址存储</strong>：<code>OMPT_STORE_RETURN_ADDRESS</code> 用于调试工具定位并行区域入口。</li>
</ul></li>
</ul>
<hr />
<h3>四、并行区域启动与同步</h3>
<pre><code class="language-c">#if INCLUDE_SSC_MARKS
  SSC_MARK_FORKING(); // 标记并行区域开始（用于Intel® VTune™等工具）
#endif

// 核心并行化操作：创建线程团队并分发任务
__kmp_fork_call(loc, gtid, fork_context_intel, argc,
                VOLATILE_CAST(microtask_t) microtask,
                VOLATILE_CAST(launch_t) __kmp_invoke_task_func,
                kmp_va_addr_of(ap));

#if INCLUDE_SSC_MARKS
  SSC_MARK_JOINING(); // 标记并行区域结束
#endif

// 同步所有线程
__kmp_join_call(loc, gtid
#if OMPT_SUPPORT
  , fork_context_intel
#endif
);

va_end(ap); // 清理可变参数

#if OMPT_SUPPORT
  if (ompt_enabled.enabled) {
    ompt_frame-&gt;enter_frame = ompt_data_none; // 重置帧信息
  }
#endif
}</code></pre>
<ul>
<li><strong>关键函数</strong>：
<ol>
<li><strong><code>__kmp_fork_call</code></strong>：
<ul>
<li><strong>线程团队创建</strong>：激活或创建工作线程。</li>
<li><strong>任务分发</strong>：将 <code>microtask</code> 和参数传递给线程池。</li>
<li><strong>参数传递</strong>：<code>kmp_va_addr_of(ap)</code> 将可变参数转换为统一格式。</li>
</ul></li>
<li><strong><code>__kmp_join_call</code></strong>：
<ul>
<li><strong>屏障同步</strong>：确保所有线程完成微任务执行。</li>
<li><strong>资源回收</strong>：释放临时分配的内存和线程状态。</li>
</ul></li>
</ol></li>
</ul>
<hr />
<h3>五、性能统计恢复</h3>
<pre><code class="language-c">#if KMP_STATS_ENABLED
  if (previous_state == stats_state_e::SERIAL_REGION) {
    KMP_EXCHANGE_PARTITIONED_TIMER(OMP_serial); // 恢复串行计时器
    KMP_SET_THREAD_STATE(previous_state);       // 重置线程状态
  } else {
    KMP_POP_PARTITIONED_TIMER(); // 弹出嵌套计时器
  }
#endif</code></pre>
<hr />
<h3>六、关键实现细节</h3>
<h4>1. <strong>线程标识管理（<code>gtid</code>）</strong></h4>
<ul>
<li><code>__kmp_entry_gtid()</code> 通过 TLS (Thread-Local Storage) 获取当前线程的唯一ID。</li>
<li>主线程的 <code>gtid</code> 固定为0，工作线程的 <code>gtid</code> 从1开始递增。</li>
</ul>
<h4>2. <strong>微任务调用机制</strong></h4>
<ul>
<li><strong>微任务原型</strong>：<code>microtask_t</code> 定义为 <code>void (*)(int gtid, int tid, void **)</code>。</li>
<li><strong>参数传递</strong>：共享变量地址通过 <code>kmp_va_addr_of(ap)</code> 转换为 <code>void**</code> 数组传入。</li>
</ul>
<h4>3. <strong>VOLATILE_CAST 的作用</strong></h4>
<pre><code class="language-c">#define VOLATILE_CAST(type) (type) </code></pre>
<ul>
<li><strong>防止编译器优化</strong>：强制类型转换确保编译器不会错误地优化掉必要的参数传递操作。</li>
</ul>
<h4>4. <strong>SSC Marks 的调试支持</strong></h4>
<ul>
<li><strong>SSC (Supervisor Service Call)</strong>：Intel 处理器特有的调试指令，用于在代码中插入标记，便于性能工具（如 VTune）识别并行区域边界。</li>
</ul>
<hr />
<h3>七、执行流程图解</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202502240237196.png" alt="" /></p>
<p>%% </p>
<pre><code>sequenceDiagram
    participant MainThread as 主线程 (gtid=0)
    participant Runtime as OpenMP 运行时
    participant WorkerThreads as 工作线程 (gtid&gt;0)

    MainThread-&gt;&gt;Runtime: __kmpc_fork_call()
    Runtime-&gt;&gt;Runtime: 记录性能计数器 (KMP_STATS)
    Runtime-&gt;&gt;Runtime: 初始化可变参数 (va_start)
    Runtime-&gt;&gt;Runtime: OMPT 帧信息设置
    Runtime-&gt;&gt;Runtime: 触发 SSC_MARK_FORKING
    Runtime-&gt;&gt;WorkerThreads: __kmp_fork_call() 唤醒线程
    WorkerThreads-&gt;&gt;Runtime: 执行 microtask
    Runtime-&gt;&gt;Runtime: __kmp_join_call() 同步线程
    Runtime-&gt;&gt;Runtime: 清理可变参数 (va_end)
    Runtime-&gt;&gt;Runtime: 重置 OMPT 帧
    Runtime-&gt;&gt;Runtime: 触发 SSC_MARK_JOINING
    Runtime-&gt;&gt;Runtime: 恢复性能计数器 (KMP_STATS)
    MainThread-&gt;&gt;MainThread: 继续执行后续代码</code></pre>
<p>%%</p>
<h3>八、典型问题与调试技巧</h3>
<h4>1. <strong>线程未正确唤醒</strong></h4>
<ul>
<li><strong>现象</strong>：程序卡在 <code>__kmp_fork_call</code>。</li>
<li><strong>诊断</strong>：
<pre><code class="language-bash">gdb -ex &quot;break __kmp_fork_call&quot; -ex &quot;run&quot; ./program
# 检查线程池状态：print pool.active_workers</code></pre></li>
</ul>
<h4>2. <strong>参数传递错误</strong></h4>
<ul>
<li><strong>现象</strong>：共享变量值异常。</li>
<li><strong>调试</strong>：
<pre><code class="language-c">// 在 microtask 中打印参数地址
void microtask(int gtid, void **args) {
printf(&quot;Shared arg0: %p\n&quot;, args[0]);
}</code></pre></li>
</ul>
<h4>3. <strong>性能瓶颈分析</strong></h4>
<ul>
<li><strong>工具</strong>：使用 Intel VTune 的 <code>SSC_MARK</code> 分析并行区域开销。
<pre><code class="language-bash">vtune -collect hotspots -ssc-markers=all ./program</code></pre></li>
</ul>
<hr />
<p>通过上述分析，可以看到 <code>__kmpc_fork_call</code> 是 OpenMP 并行执行的核心枢纽，其实现综合了线程管理、性能统计、工具支持等多项功能，开发者通过理解其内部机制，能够更高效地进行并行程序调试与优化。</p>
<h2>实际使用中的关键操作</h2>
<h4>1. 编译器调用库方法</h4>
<pre><code class="language-bash"># 基础编译命令
clang -fopenmp -o program main.c

# 显示链接的运行时库
clang -v -fopenmp main.c 2&gt;&amp;1 | grep omp
# 输出示例： &quot;-lomp&quot;

# 指定 libomp 路径（多版本共存时）
clang -fopenmp -L/opt/homebrew/opt/libomp/lib -I/opt/homebrew/opt/libomp/include</code></pre>
<h4>2. 版本兼容</h4>
<pre><code class="language-bash"># 查看支持的 OpenMP 版本
clang -fopenmp -dM -E - &lt; /dev/null | grep _OPENMP
# 输出示例： #define _OPENMP 201811

# 强制指定 OpenMP 标准版本
clang -fopenmp -Xclang -fopenmp-version=45</code></pre>
<h4>3. 跨平台编译差异</h4>
<table>
<thead>
<tr>
<th>平台</th>
<th>安装方法</th>
<th>验证命令</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>macOS</strong></td>
<td><code>brew install libomp</code></td>
<td><code>clang -fopenmp -lomp</code></td>
</tr>
<tr>
<td><strong>Linux</strong></td>
<td><code>apt-get install libomp-dev</code></td>
<td><code>ldd ./program | grep omp</code></td>
</tr>
<tr>
<td><strong>Windows</strong></td>
<td>LLVM 预编译包自带 libomp.dll</td>
<td>Dependency Walker 检查</td>
</tr>
</tbody>
</table>
<hr />
<h3>三、调试与优化技巧</h3>
<h4>1. 运行时环境控制</h4>
<pre><code class="language-bash"># 设置线程数
export OMP_NUM_THREADS=4

# 绑定线程到物理核心
export OMP_PROC_BIND=close
export OMP_PLACES=cores

# 调试运行时
export OMP_DISPLAY_ENV=VERBOSE
export OMP_DEBUG=1</code></pre>
<h4>2. 性能分析工具链</h4>
<pre><code class="language-bash"># 使用 LLVM 的 OpenMP 性能计数器
clang -fopenmp -fopenmp-targets=nvptx64 -fopenmp-version=51 \
     -Rpass=openmp-opt -Rpass-analysis=openmp-opt

# 生成优化报告
clang -fsave-optimization-record -fopenmp</code></pre>
<h4>3. 常见问题诊断</h4>
<p><strong>问题现象</strong>：未找到 OpenMP 符号</p>
<pre><code class="language-bash">error: undefined reference to `__kmpc_fork_call&#039;</code></pre>
<p><strong>解决方案</strong>：</p>
<pre><code class="language-bash"># 显式链接 libomp
clang -fopenmp -lomp main.c
# 或指定静态链接
clang -fopenmp -Wl,-Bstatic -lomp -Wl,-Bdynamic</code></pre>
<p><strong>问题现象</strong>：SIMD 向量化失败</p>
<pre><code class="language-bash">warning: loop not vectorized: failed explicitly specified vectorization</code></pre>
<p><strong>优化策略</strong>：</p>
<pre><code class="language-cpp">#pragma omp simd collapse(2) safelen(16)
for(int i=0; i&lt;M; i++){
  for(int j=0; j&lt;N; j++){
    // 确保内存连续访问模式
    arr[i][j] = ...
  }
}</code></pre>
<hr />
<h3>四、与 GCC 实现的对比</h3>
<table>
<thead>
<tr>
<th>特性</th>
<th>LLVM/libomp</th>
<th>GCC/libgomp</th>
</tr>
</thead>
<tbody>
<tr>
<td>默认线程模型</td>
<td>pthreads</td>
<td>pthreads</td>
</tr>
<tr>
<td>Target Offloading</td>
<td>✅ 统一内存架构 (HSA)</td>
<td>✅ 显式数据映射</td>
</tr>
<tr>
<td>任务优先级</td>
<td>✅ 支持</td>
<td>❌ 不支持</td>
</tr>
<tr>
<td>嵌套并行</td>
<td>动态线程池</td>
<td>静态线程分配</td>
</tr>
<tr>
<td>内存消耗</td>
<td>~5MB/线程</td>
<td>~8MB/线程</td>
</tr>
<tr>
<td>启动延迟 (1线程)</td>
<td>1.2μs</td>
<td>2.1μs</td>
</tr>
</tbody>
</table>
<hr />
<h3>五、进阶应用示例</h3>
<h4>1. GPU Offloading</h4>
<pre><code class="language-cpp">#pragma omp target teams distribute parallel for \
        map(to:input[0:N]) map(from:output[0:N])
for(int i=0; i&lt;N; i++){
  output[i] = sqrt(input[i]);
}</code></pre>
<p>编译命令：</p>
<pre><code class="language-bash">clang -fopenmp -fopenmp-targets=nvptx64-nvidia-cuda -o gpu_prog main.c</code></pre>
<h4>2. 自定义运行时扩展</h4>
<pre><code class="language-cpp">// 覆盖默认的内存分配器
void *__kmpc_alloc(size_t size) {
  return aligned_alloc(64, size);
}

void __kmpc_free(void *ptr) {
  free(ptr);
}</code></pre>
<p>编译选项：</p>
<pre><code class="language-bash">clang -fopenmp -fno-builtin-alloc -D__KMP_REDEFINE_ALLOC</code></pre>
<hr />
<p>通过以上技术实现，LLVM 提供了完整的 OpenMP 支持方案，其特点包括：</p>
<ol>
<li><strong>低延迟线程池</strong>：采用 work-stealing 调度算法</li>
<li><strong>精确的 NUMA 感知</strong>：通过 <code>hwloc</code> 库自动检测拓扑</li>
<li><strong>可扩展的运行时</strong>：支持动态加载插件（如 GPU 加速库）</li>
</ol>
<p>建议开发者在性能关键场景中结合 LLVM 的优化报告 (<code>-Rpass*</code>) 和架构特性（如 AVX-512 指令集）进行深度优化。</p>
<h2>核心fork源码</h2>
<p><a href="https://openmp.llvm.org/doxygen/group__PARALLEL.html">https://openmp.llvm.org/doxygen/group__PARALLEL.html</a></p>
<pre><code class="language-C">/* most of the work for a fork */
/* return true if we really went parallel, false if serialized */
int __kmp_fork_call(ident_t *loc, int gtid,
                    enum fork_context_e call_context, // Intel, GNU, ...
                    kmp_int32 argc, microtask_t microtask, launch_t invoker,
                    kmp_va_list ap) {
  void **argv;
  int i;
  int master_tid;
  int master_this_cons;
  kmp_team_t *team;
  kmp_team_t *parent_team;
  kmp_info_t *master_th;
  kmp_root_t *root;
  int nthreads;
  int master_active;
  int master_set_numthreads;
  int task_thread_limit = 0;
  int level;
  int active_level;
  int teams_level;
#if KMP_NESTED_HOT_TEAMS
  kmp_hot_team_ptr_t **p_hot_teams;
#endif
  { // KMP_TIME_BLOCK
    KMP_TIME_DEVELOPER_PARTITIONED_BLOCK(KMP_fork_call);
    KMP_COUNT_VALUE(OMP_PARALLEL_args, argc);

    KA_TRACE(20, (&quot;__kmp_fork_call: enter T#%d\n&quot;, gtid));
    if (__kmp_stkpadding &gt; 0 &amp;&amp; __kmp_root[gtid] != NULL) {
      /* Some systems prefer the stack for the root thread(s) to start with */
      /* some gap from the parent stack to prevent false sharing. */
      void *dummy = KMP_ALLOCA(__kmp_stkpadding);
      /* These 2 lines below are so this does not get optimized out */
      if (__kmp_stkpadding &gt; KMP_MAX_STKPADDING)
        __kmp_stkpadding += (short)((kmp_int64)dummy);
    }

    /* initialize if needed */
    KMP_DEBUG_ASSERT(
        __kmp_init_serial); // AC: potentially unsafe, not in sync with shutdown
    if (!TCR_4(__kmp_init_parallel))
      __kmp_parallel_initialize();
    __kmp_resume_if_soft_paused();

    /* setup current data */
    // AC: potentially unsafe, not in sync with library shutdown,
    // __kmp_threads can be freed
    master_th = __kmp_threads[gtid];

    parent_team = master_th-&gt;th.th_team;
    master_tid = master_th-&gt;th.th_info.ds.ds_tid;
    master_this_cons = master_th-&gt;th.th_local.this_construct;
    root = master_th-&gt;th.th_root;
    master_active = root-&gt;r.r_active;
    master_set_numthreads = master_th-&gt;th.th_set_nproc;
    task_thread_limit =
        master_th-&gt;th.th_current_task-&gt;td_icvs.task_thread_limit;

#if OMPT_SUPPORT
    ompt_data_t ompt_parallel_data = ompt_data_none;
    ompt_data_t *parent_task_data = NULL;
    ompt_frame_t *ompt_frame = NULL;
    void *return_address = NULL;

    if (ompt_enabled.enabled) {
      __ompt_get_task_info_internal(0, NULL, &amp;parent_task_data, &amp;ompt_frame,
                                    NULL, NULL);
      return_address = OMPT_LOAD_RETURN_ADDRESS(gtid);
    }
#endif

    // Assign affinity to root thread if it hasn&#039;t happened yet
    __kmp_assign_root_init_mask();

    // Nested level will be an index in the nested nthreads array
    level = parent_team-&gt;t.t_level;
    // used to launch non-serial teams even if nested is not allowed
    active_level = parent_team-&gt;t.t_active_level;
    // needed to check nesting inside the teams
    teams_level = master_th-&gt;th.th_teams_level;
#if KMP_NESTED_HOT_TEAMS
    p_hot_teams = &amp;master_th-&gt;th.th_hot_teams;
    if (*p_hot_teams == NULL &amp;&amp; __kmp_hot_teams_max_level &gt; 0) {
      *p_hot_teams = (kmp_hot_team_ptr_t *)__kmp_allocate(
          sizeof(kmp_hot_team_ptr_t) * __kmp_hot_teams_max_level);
      (*p_hot_teams)[0].hot_team = root-&gt;r.r_hot_team;
      // it is either actual or not needed (when active_level &gt; 0)
      (*p_hot_teams)[0].hot_team_nth = 1;
    }
#endif

#if OMPT_SUPPORT
    if (ompt_enabled.enabled) {
      if (ompt_enabled.ompt_callback_parallel_begin) {
        int team_size = master_set_numthreads
                            ? master_set_numthreads
                            : get__nproc_2(parent_team, master_tid);
        int flags = OMPT_INVOKER(call_context) |
                    ((microtask == (microtask_t)__kmp_teams_master)
                         ? ompt_parallel_league
                         : ompt_parallel_team);
        ompt_callbacks.ompt_callback(ompt_callback_parallel_begin)(
            parent_task_data, ompt_frame, &amp;ompt_parallel_data, team_size, flags,
            return_address);
      }
      master_th-&gt;th.ompt_thread_info.state = ompt_state_overhead;
    }
#endif

    master_th-&gt;th.th_ident = loc;

    // Parallel closely nested in teams construct:
    if (__kmp_is_fork_in_teams(master_th, microtask, level, teams_level, ap)) {
      return __kmp_fork_in_teams(loc, gtid, parent_team, argc, master_th, root,
                                 call_context, microtask, invoker,
                                 master_set_numthreads, level,
#if OMPT_SUPPORT
                                 ompt_parallel_data, return_address,
#endif
                                 ap);
    } // End parallel closely nested in teams construct

    // Need this to happen before we determine the number of threads, not while
    // we are allocating the team
    //__kmp_push_current_task_to_thread(master_th, parent_team, 0);

    KMP_DEBUG_ASSERT_TASKTEAM_INVARIANT(parent_team, master_th);

    // Determine the number of threads
    int enter_teams =
        __kmp_is_entering_teams(active_level, level, teams_level, ap);
    if ((!enter_teams &amp;&amp;
         (parent_team-&gt;t.t_active_level &gt;=
          master_th-&gt;th.th_current_task-&gt;td_icvs.max_active_levels)) ||
        (__kmp_library == library_serial)) {
      KC_TRACE(10, (&quot;__kmp_fork_call: T#%d serializing team\n&quot;, gtid));
      nthreads = 1;
    } else {
      nthreads = master_set_numthreads
                     ? master_set_numthreads
                     // TODO: get nproc directly from current task
                     : get__nproc_2(parent_team, master_tid);
      // Use the thread_limit set for the current target task if exists, else go
      // with the deduced nthreads
      nthreads = task_thread_limit &gt; 0 &amp;&amp; task_thread_limit &lt; nthreads
                     ? task_thread_limit
                     : nthreads;
      // Check if we need to take forkjoin lock? (no need for serialized
      // parallel out of teams construct).
      if (nthreads &gt; 1) {
        /* determine how many new threads we can use */
        __kmp_acquire_bootstrap_lock(&amp;__kmp_forkjoin_lock);
        /* AC: If we execute teams from parallel region (on host), then teams
           should be created but each can only have 1 thread if nesting is
           disabled. If teams called from serial region, then teams and their
           threads should be created regardless of the nesting setting. */
        nthreads = __kmp_reserve_threads(root, parent_team, master_tid,
                                         nthreads, enter_teams);
        if (nthreads == 1) {
          // Free lock for single thread execution here; for multi-thread
          // execution it will be freed later after team of threads created
          // and initialized
          __kmp_release_bootstrap_lock(&amp;__kmp_forkjoin_lock);
        }
      }
    }
    KMP_DEBUG_ASSERT(nthreads &gt; 0);

    // If we temporarily changed the set number of threads then restore it now
    master_th-&gt;th.th_set_nproc = 0;

    if (nthreads == 1) {
      return __kmp_serial_fork_call(loc, gtid, call_context, argc, microtask,
                                    invoker, master_th, parent_team,
#if OMPT_SUPPORT
                                    &amp;ompt_parallel_data, &amp;return_address,
                                    &amp;parent_task_data,
#endif
                                    ap);
    } // if (nthreads == 1)

    // GEH: only modify the executing flag in the case when not serialized
    //      serialized case is handled in kmpc_serialized_parallel
    KF_TRACE(10, (&quot;__kmp_fork_call: parent_team_aclevel=%d, master_th=%p, &quot;
                  &quot;curtask=%p, curtask_max_aclevel=%d\n&quot;,
                  parent_team-&gt;t.t_active_level, master_th,
                  master_th-&gt;th.th_current_task,
                  master_th-&gt;th.th_current_task-&gt;td_icvs.max_active_levels));
    // TODO: GEH - cannot do this assertion because root thread not set up as
    // executing
    // KMP_ASSERT( master_th-&gt;th.th_current_task-&gt;td_flags.executing == 1 );
    master_th-&gt;th.th_current_task-&gt;td_flags.executing = 0;

    if (!master_th-&gt;th.th_teams_microtask || level &gt; teams_level) {
      /* Increment our nested depth level */
      KMP_ATOMIC_INC(&amp;root-&gt;r.r_in_parallel);
    }

    // See if we need to make a copy of the ICVs.
    int nthreads_icv = master_th-&gt;th.th_current_task-&gt;td_icvs.nproc;
    kmp_nested_nthreads_t *nested_nth = NULL;
    if (!master_th-&gt;th.th_set_nested_nth &amp;&amp;
        (level + 1 &lt; parent_team-&gt;t.t_nested_nth-&gt;used) &amp;&amp;
        (parent_team-&gt;t.t_nested_nth-&gt;nth[level + 1] != nthreads_icv)) {
      nthreads_icv = parent_team-&gt;t.t_nested_nth-&gt;nth[level + 1];
    } else if (master_th-&gt;th.th_set_nested_nth) {
      nested_nth = __kmp_override_nested_nth(master_th, level);
      if ((level + 1 &lt; nested_nth-&gt;used) &amp;&amp;
          (nested_nth-&gt;nth[level + 1] != nthreads_icv))
        nthreads_icv = nested_nth-&gt;nth[level + 1];
      else
        nthreads_icv = 0; // don&#039;t update
    } else {
      nthreads_icv = 0; // don&#039;t update
    }

    // Figure out the proc_bind_policy for the new team.
    kmp_proc_bind_t proc_bind = master_th-&gt;th.th_set_proc_bind;
    // proc_bind_default means don&#039;t update
    kmp_proc_bind_t proc_bind_icv = proc_bind_default;
    if (master_th-&gt;th.th_current_task-&gt;td_icvs.proc_bind == proc_bind_false) {
      proc_bind = proc_bind_false;
    } else {
      // No proc_bind clause specified; use current proc-bind-var for this
      // parallel region
      if (proc_bind == proc_bind_default) {
        proc_bind = master_th-&gt;th.th_current_task-&gt;td_icvs.proc_bind;
      }
      // Have teams construct take proc_bind value from KMP_TEAMS_PROC_BIND
      if (master_th-&gt;th.th_teams_microtask &amp;&amp;
          microtask == (microtask_t)__kmp_teams_master) {
        proc_bind = __kmp_teams_proc_bind;
      }
      /* else: The proc_bind policy was specified explicitly on parallel clause.
         This overrides proc-bind-var for this parallel region, but does not
         change proc-bind-var. */
      // Figure the value of proc-bind-var for the child threads.
      if ((level + 1 &lt; __kmp_nested_proc_bind.used) &amp;&amp;
          (__kmp_nested_proc_bind.bind_types[level + 1] !=
           master_th-&gt;th.th_current_task-&gt;td_icvs.proc_bind)) {
        // Do not modify the proc bind icv for the two teams construct forks
        // They just let the proc bind icv pass through
        if (!master_th-&gt;th.th_teams_microtask ||
            !(microtask == (microtask_t)__kmp_teams_master || ap == NULL))
          proc_bind_icv = __kmp_nested_proc_bind.bind_types[level + 1];
      }
    }

    // Reset for next parallel region
    master_th-&gt;th.th_set_proc_bind = proc_bind_default;

    if ((nthreads_icv &gt; 0) || (proc_bind_icv != proc_bind_default)) {
      kmp_internal_control_t new_icvs;
      copy_icvs(&amp;new_icvs, &amp;master_th-&gt;th.th_current_task-&gt;td_icvs);
      new_icvs.next = NULL;
      if (nthreads_icv &gt; 0) {
        new_icvs.nproc = nthreads_icv;
      }
      if (proc_bind_icv != proc_bind_default) {
        new_icvs.proc_bind = proc_bind_icv;
      }

      /* allocate a new parallel team */
      KF_TRACE(10, (&quot;__kmp_fork_call: before __kmp_allocate_team\n&quot;));
      team = __kmp_allocate_team(root, nthreads, nthreads,
#if OMPT_SUPPORT
                                 ompt_parallel_data,
#endif
                                 proc_bind, &amp;new_icvs,
                                 argc USE_NESTED_HOT_ARG(master_th));
      if (__kmp_barrier_release_pattern[bs_forkjoin_barrier] == bp_dist_bar)
        copy_icvs((kmp_internal_control_t *)team-&gt;t.b-&gt;team_icvs, &amp;new_icvs);
    } else {
      /* allocate a new parallel team */
      KF_TRACE(10, (&quot;__kmp_fork_call: before __kmp_allocate_team\n&quot;));
      team = __kmp_allocate_team(root, nthreads, nthreads,
#if OMPT_SUPPORT
                                 ompt_parallel_data,
#endif
                                 proc_bind,
                                 &amp;master_th-&gt;th.th_current_task-&gt;td_icvs,
                                 argc USE_NESTED_HOT_ARG(master_th));
      if (__kmp_barrier_release_pattern[bs_forkjoin_barrier] == bp_dist_bar)
        copy_icvs((kmp_internal_control_t *)team-&gt;t.b-&gt;team_icvs,
                  &amp;master_th-&gt;th.th_current_task-&gt;td_icvs);
    }
    KF_TRACE(
        10, (&quot;__kmp_fork_call: after __kmp_allocate_team - team = %p\n&quot;, team));

    /* setup the new team */
    KMP_CHECK_UPDATE(team-&gt;t.t_master_tid, master_tid);
    KMP_CHECK_UPDATE(team-&gt;t.t_master_this_cons, master_this_cons);
    KMP_CHECK_UPDATE(team-&gt;t.t_ident, loc);
    KMP_CHECK_UPDATE(team-&gt;t.t_parent, parent_team);
    KMP_CHECK_UPDATE_SYNC(team-&gt;t.t_pkfn, microtask);
#if OMPT_SUPPORT
    KMP_CHECK_UPDATE_SYNC(team-&gt;t.ompt_team_info.master_return_address,
                          return_address);
#endif
    KMP_CHECK_UPDATE(team-&gt;t.t_invoke, invoker); // TODO move to root, maybe
    // TODO: parent_team-&gt;t.t_level == INT_MAX ???
    if (!master_th-&gt;th.th_teams_microtask || level &gt; teams_level) {
      int new_level = parent_team-&gt;t.t_level + 1;
      KMP_CHECK_UPDATE(team-&gt;t.t_level, new_level);
      new_level = parent_team-&gt;t.t_active_level + 1;
      KMP_CHECK_UPDATE(team-&gt;t.t_active_level, new_level);
    } else {
      // AC: Do not increase parallel level at start of the teams construct
      int new_level = parent_team-&gt;t.t_level;
      KMP_CHECK_UPDATE(team-&gt;t.t_level, new_level);
      new_level = parent_team-&gt;t.t_active_level;
      KMP_CHECK_UPDATE(team-&gt;t.t_active_level, new_level);
    }
    kmp_r_sched_t new_sched = get__sched_2(parent_team, master_tid);
    // set primary thread&#039;s schedule as new run-time schedule
    KMP_CHECK_UPDATE(team-&gt;t.t_sched.sched, new_sched.sched);

    KMP_CHECK_UPDATE(team-&gt;t.t_cancel_request, cancel_noreq);
    KMP_CHECK_UPDATE(team-&gt;t.t_def_allocator, master_th-&gt;th.th_def_allocator);

    // Check if hot team has potentially outdated list, and if so, free it
    if (team-&gt;t.t_nested_nth &amp;&amp;
        team-&gt;t.t_nested_nth != parent_team-&gt;t.t_nested_nth) {
      KMP_INTERNAL_FREE(team-&gt;t.t_nested_nth-&gt;nth);
      KMP_INTERNAL_FREE(team-&gt;t.t_nested_nth);
      team-&gt;t.t_nested_nth = NULL;
    }
    team-&gt;t.t_nested_nth = parent_team-&gt;t.t_nested_nth;
    if (master_th-&gt;th.th_set_nested_nth) {
      if (!nested_nth)
        nested_nth = __kmp_override_nested_nth(master_th, level);
      team-&gt;t.t_nested_nth = nested_nth;
      KMP_INTERNAL_FREE(master_th-&gt;th.th_set_nested_nth);
      master_th-&gt;th.th_set_nested_nth = NULL;
      master_th-&gt;th.th_set_nested_nth_sz = 0;
      master_th-&gt;th.th_nt_strict = false;
    }

    // Update the floating point rounding in the team if required.
    propagateFPControl(team);
#if OMPD_SUPPORT
    if (ompd_state &amp; OMPD_ENABLE_BP)
      ompd_bp_parallel_begin();
#endif

    KA_TRACE(
        20,
        (&quot;__kmp_fork_call: T#%d(%d:%d)-&gt;(%d:0) created a team of %d threads\n&quot;,
         gtid, parent_team-&gt;t.t_id, team-&gt;t.t_master_tid, team-&gt;t.t_id,
         team-&gt;t.t_nproc));
    KMP_DEBUG_ASSERT(team != root-&gt;r.r_hot_team ||
                     (team-&gt;t.t_master_tid == 0 &amp;&amp;
                      (team-&gt;t.t_parent == root-&gt;r.r_root_team ||
                       team-&gt;t.t_parent-&gt;t.t_serialized)));
    KMP_MB();

    /* now, setup the arguments */
    argv = (void **)team-&gt;t.t_argv;
    if (ap) {
      for (i = argc - 1; i &gt;= 0; --i) {
        void *new_argv = va_arg(kmp_va_deref(ap), void *);
        KMP_CHECK_UPDATE(*argv, new_argv);
        argv++;
      }
    } else {
      for (i = 0; i &lt; argc; ++i) {
        // Get args from parent team for teams construct
        KMP_CHECK_UPDATE(argv[i], team-&gt;t.t_parent-&gt;t.t_argv[i]);
      }
    }

    /* now actually fork the threads */
    KMP_CHECK_UPDATE(team-&gt;t.t_master_active, master_active);
    if (!root-&gt;r.r_active) // Only do assignment if it prevents cache ping-pong
      root-&gt;r.r_active = TRUE;

    __kmp_fork_team_threads(root, team, master_th, gtid, !ap);
    __kmp_setup_icv_copy(team, nthreads,
                         &amp;master_th-&gt;th.th_current_task-&gt;td_icvs, loc);

#if OMPT_SUPPORT
    master_th-&gt;th.ompt_thread_info.state = ompt_state_work_parallel;
#endif

    __kmp_release_bootstrap_lock(&amp;__kmp_forkjoin_lock);

#if USE_ITT_BUILD
    if (team-&gt;t.t_active_level == 1 // only report frames at level 1
        &amp;&amp; !master_th-&gt;th.th_teams_microtask) { // not in teams construct
#if USE_ITT_NOTIFY
      if ((__itt_frame_submit_v3_ptr || KMP_ITT_DEBUG) &amp;&amp;
          (__kmp_forkjoin_frames_mode == 3 ||
           __kmp_forkjoin_frames_mode == 1)) {
        kmp_uint64 tmp_time = 0;
        if (__itt_get_timestamp_ptr)
          tmp_time = __itt_get_timestamp();
        // Internal fork - report frame begin
        master_th-&gt;th.th_frame_time = tmp_time;
        if (__kmp_forkjoin_frames_mode == 3)
          team-&gt;t.t_region_time = tmp_time;
      } else
// only one notification scheme (either &quot;submit&quot; or &quot;forking/joined&quot;, not both)
#endif /* USE_ITT_NOTIFY */
        if ((__itt_frame_begin_v3_ptr || KMP_ITT_DEBUG) &amp;&amp;
            __kmp_forkjoin_frames &amp;&amp; !__kmp_forkjoin_frames_mode) {
          // Mark start of &quot;parallel&quot; region for Intel(R) VTune(TM) analyzer.
          __kmp_itt_region_forking(gtid, team-&gt;t.t_nproc, 0);
        }
    }
#endif /* USE_ITT_BUILD */

    /* now go on and do the work */
    KMP_DEBUG_ASSERT(team == __kmp_threads[gtid]-&gt;th.th_team);
    KMP_MB();
    KF_TRACE(10,
             (&quot;__kmp_internal_fork : root=%p, team=%p, master_th=%p, gtid=%d\n&quot;,
              root, team, master_th, gtid));

#if USE_ITT_BUILD
    if (__itt_stack_caller_create_ptr) {
      // create new stack stitching id before entering fork barrier
      if (!enter_teams) {
        KMP_DEBUG_ASSERT(team-&gt;t.t_stack_id == NULL);
        team-&gt;t.t_stack_id = __kmp_itt_stack_caller_create();
      } else if (parent_team-&gt;t.t_serialized) {
        // keep stack stitching id in the serialized parent_team;
        // current team will be used for parallel inside the teams;
        // if parent_team is active, then it already keeps stack stitching id
        // for the league of teams
        KMP_DEBUG_ASSERT(parent_team-&gt;t.t_stack_id == NULL);
        parent_team-&gt;t.t_stack_id = __kmp_itt_stack_caller_create();
      }
    }
#endif /* USE_ITT_BUILD */

    // AC: skip __kmp_internal_fork at teams construct, let only primary
    // threads execute
    if (ap) {
      __kmp_internal_fork(loc, gtid, team);
      KF_TRACE(10, (&quot;__kmp_internal_fork : after : root=%p, team=%p, &quot;
                    &quot;master_th=%p, gtid=%d\n&quot;,
                    root, team, master_th, gtid));
    }

    if (call_context == fork_context_gnu) {
      KA_TRACE(20, (&quot;__kmp_fork_call: parallel exit T#%d\n&quot;, gtid));
      return TRUE;
    }

    /* Invoke microtask for PRIMARY thread */
    KA_TRACE(20, (&quot;__kmp_fork_call: T#%d(%d:0) invoke microtask = %p\n&quot;, gtid,
                  team-&gt;t.t_id, team-&gt;t.t_pkfn));
  } // END of timer KMP_fork_call block

#if KMP_STATS_ENABLED
  // If beginning a teams construct, then change thread state
  stats_state_e previous_state = KMP_GET_THREAD_STATE();
  if (!ap) {
    KMP_SET_THREAD_STATE(stats_state_e::TEAMS_REGION);
  }
#endif

  if (!team-&gt;t.t_invoke(gtid)) {
    KMP_ASSERT2(0, &quot;cannot invoke microtask for PRIMARY thread&quot;);
  }

#if KMP_STATS_ENABLED
  // If was beginning of a teams construct, then reset thread state
  if (!ap) {
    KMP_SET_THREAD_STATE(previous_state);
  }
#endif

  KA_TRACE(20, (&quot;__kmp_fork_call: T#%d(%d:0) done microtask = %p\n&quot;, gtid,
                team-&gt;t.t_id, team-&gt;t.t_pkfn));
  KMP_MB(); /* Flush all pending memory write invalidates.  */

  KA_TRACE(20, (&quot;__kmp_fork_call: parallel exit T#%d\n&quot;, gtid));
#if OMPT_SUPPORT
  if (ompt_enabled.enabled) {
    master_th-&gt;th.ompt_thread_info.state = ompt_state_overhead;
  }
#endif

  return TRUE;
}

#if OMPT_SUPPORT
static inline void __kmp_join_restore_state(kmp_info_t *thread,
                                            kmp_team_t *team) {
  // restore state outside the region
  thread-&gt;th.ompt_thread_info.state =
      ((team-&gt;t.t_serialized) ? ompt_state_work_serial
                              : ompt_state_work_parallel);
}

static inline void __kmp_join_ompt(int gtid, kmp_info_t *thread,
                                   kmp_team_t *team, ompt_data_t *parallel_data,
                                   int flags, void *codeptr) {
  ompt_task_info_t *task_info = __ompt_get_task_info_object(0);
  if (ompt_enabled.ompt_callback_parallel_end) {
    ompt_callbacks.ompt_callback(ompt_callback_parallel_end)(
        parallel_data, &amp;(task_info-&gt;task_data), flags, codeptr);
  }

  task_info-&gt;frame.enter_frame = ompt_data_none;
  __kmp_join_restore_state(thread, team);
}
#endif</code></pre>
