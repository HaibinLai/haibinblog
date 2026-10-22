---
title: "X-Queue阅读"
description: "Abstract—Achieving efficient task parallelism on many-core architectures is an important challenge. The widely used GNU OpenMP implementation of the popular OpenMP parallel pro gramming model incurs high overhead for fi…"
publishedAt: "2025-06-03T01:35:02Z"
updatedAt: "2025-06-11T21:42:59Z"
category: "High Performance Computing"
categories: ["High Performance Computing", "Paper Reading"]
tags: ["科研"]
author: "GB"
draft: false
slug: "x-queue阅读"
legacySlug: "x-queue阅读"
oldSlugs: []
wordpressId: 833
sourceUrl: "https://www.haibinlaiblog.top/index.php/x-queue%e9%98%85%e8%af%bb/"
commentCount: 0
viewCount: 794
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/x-queue%E9%98%85%E8%AF%BB.webp"
---
<p>Abstract—Achieving efficient task parallelism on many-core architectures is an important challenge. The widely used GNU OpenMP implementation of the popular OpenMP parallel pro gramming model incurs high overhead for fine-grained, short running tasks due to time spent on runtime synchronization. In this work, we introduce and analyze three key advances that collectively achieve significant performance gains. First, we introduce XQueue, a lock-less concurrent queue implementation to replace GNU’s priority task queue and remove the global task lock. Second, we develop a scalable, efficient, and hybrid lock-free/lock-less distributed tree barrier to address the high hardware synchronization overhead from GNU’s centralized barrier. Third, we develop two lock-less and NUMA-aware load balancing strategies. We evaluate our implementation using Barcelona OpenMP Task Suite (BOTS) benchmarks. We show that the use of XQueue and the distributed tree barrier can improve performance by up to 1522.8× compared to the original GNUOpenMP.Wefurther show that lock-less load balancing can improve performance by up to 4× compared to GNU OpenMP using XQueue.</p>
<p><strong>key idea why GNU failed: runtime synchronization on shorting running task.</strong></p>
<p>We focus on OpenMP, a task-centric model in which higher-level parallel constructs such as loops are translated into fine-granularity tasks with dependencies, which the runtime must dynamically schedule to available resources. When a task is enabled by some thread, it is conceptually queued for execution by a future available thread. Unfor tunately, <strong>OpenMP implementations and their tasking data structures often scale poorly due to the excessive use of expensive synchronization operations, such as locks, to resolve dependencies</strong> [4]–[7].</p>
<p>In prior work we proposed the use of a lock-less, concurrent, multi-producer multi-consumer (MPMC) task queue, called XQueue, in the LLVM-based OpenMP (LOMP)</p>
<p>In this paper, we focus on GNU OpenMP (GOMP)—the most common OpenMP implementation that is a part of the mainstream compiler infrastructure GNU Compiler Collection (GCC). We specifically address the unscalable and entangled implementation of GNU OpenMP for fine-grain tasks, over coming restrictive synchronization such as the excessive use of locks. We then propose, implement, and evaluate two lock less NUMA-aware, dynamic load balancing (DLB) algorithms.</p>
<p>We integrate XQueue, a lock-less, relaxed order MPMC task queue, with GOMP, replacing GNU’s unscalable priority task queue and global task lock.</p>
<p>We propose a new hybrid lock-free (gathering)/lock less (releasing) distributed tree barrier that yields a theoretical lower bound of half the atomic memory access operations than GNU’s existing barrier which relies on a globally shared atomic task counter. Our approach differs from prior work in LOMP that uses LLVM’s default lock-free (not lock-less) barrier.</p>
<p>To the best of our knowledge, we propose the first lock less, NUMA-aware dynamic load balancing algorithms for OpenMP tasking. Our approach significantly miti gates load imbalance for both fine-grained and coarse grained parallelism and achieves significant performance improvements over all previous work.</p>
<h2>X-Queue</h2>
<p>XQueue [4] is a lock-less MPMC, out-of-order queuing mechanism that can scale to hundreds of threads with little contention for hardware resources. <strong>XQueue uses B-queue, a concurrent Single-Producer-Single-Consumer (SPSC) lock free queue designed for efficient core-to-core communication. The latency of B-queue operations can be as low as 20 cycles</strong>. Fig. 2 illustrates how XQueue is used on a 4-core system. Each core has one worker thread with a single SPSC Master queue and one Auxiliary SPSC queue for each other worker. Each item in a queue is a task pointer. Upon task creation, the worker enqueues the task to either its own master queue or to an auxiliary queue of another worker. It applies a round-robin approach across these queues starting with the master queue. If the chosen queue is full, the worker instead executes that task immediately. When dequeuing, the worker first dequeues from the master queue, if no task is found, it then dequeues a task from its auxiliary queues. The dequeued task is also executed immediately.</p>
<p>B Queue: <a href="http://staff.ustc.edu.cn/~bhua/network_algorithmics_2020/B-Queue.pdf">3_2.eps</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250602095119918.png" alt="" /></p>
<h4>✅ 1. <strong>提出 XQueue 作为任务队列结构</strong></h4>
<ul>
<li><strong>背景问题</strong>：GNU OpenMP（GOMP）在细粒度任务场景中依赖一个<strong>全局任务锁 + 全局优先队列</strong>，会造成严重的同步开销与扩展性瓶颈。</li>
<li><strong>解决方案</strong>：用 <strong>XQueue</strong> 替代这个全局优先队列。</li>
</ul>
<h4>✅ 2. <strong>XQueue 是基于 B-Queue 的无锁队列结构</strong></h4>
<ul>
<li>每个线程拥有一个“主队列”和多个“辅助队列”（分别对应其他线程）。</li>
<li>所有这些队列都是基于 <strong>B-Queue 的 SPSC 无锁设计</strong> 实现的，组合起来支持 <strong>MPMC 并发场景</strong>。</li>
<li><strong>写入方式</strong>：线程将任务分发到自己或其他线程的队列（Round-Robin）。</li>
<li><strong>读取方式</strong>：先从自己的队列取任务，再尝试从辅助队列“捞”任务（非抢占式）。</li>
<li>操作延迟低至约 20 CPU cycles。</li>
</ul>
<h4>✅ 3. <strong>移除 GOMP 的全局任务锁</strong></h4>
<ul>
<li>将 GNU 的 <code>GOMP_task</code> 机制解耦，全流程中几乎不再需要全局锁。</li>
<li>保留一个用于任务完成数的原子计数器，但优化了内存访问顺序。</li>
</ul>
<h4>✅ 4. <strong>提出 XGOMP 与 XGOMPTB 运行时系统</strong></h4>
<ul>
<li><strong>XGOMP</strong>：在 GOMP 中集成 XQueue，替代全局任务锁机制。</li>
<li><strong>XGOMPTB</strong>：在 XGOMP 基础上，引入了一个高效的、<strong>混合式分布式树形 barrier</strong>，进一步减少原子同步开销。</li>
</ul>
<h4>✅ 5. <strong>配合动态负载均衡机制（DLB）使用</strong></h4>
<ul>
<li>为了应对任务分布不均，作者还提出了两个 <strong>NUMA-aware + 无锁</strong> 的负载均衡策略：
<ul>
<li><strong>NA-RP（Redirect Push）</strong>：将新生成任务 push 给“空闲线程”。</li>
<li><strong>NA-WS（Work Stealing）</strong>：让“空闲线程”从其他线程“偷任务”。</li>
</ul></li>
</ul>
<table>
<thead>
<tr>
<th>问题</th>
<th>XQueue 如何解决</th>
</tr>
</thead>
<tbody>
<tr>
<td>全局锁导致的并发瓶颈</td>
<td>使用基于 B-Queue 的局部化 SPSC 队列组合</td>
</tr>
<tr>
<td>多核间任务调度慢</td>
<td>每线程独占队列，写入异步，读取快</td>
</tr>
<tr>
<td>NUMA 跨核数据访问慢</td>
<td>配合 NUMA-aware 调度优化任务亲和性</td>
</tr>
<tr>
<td>OpenMP 不支持细粒度任务</td>
<td>无锁设计支持极小任务（几十个 cycle）</td>
</tr>
</tbody>
</table>
<h2>为什么可以不用全局任务锁？</h2>
<p><strong>XQueue 能替代全局任务锁</strong>，因为它采用了一种 <strong>结构性消除共享冲突</strong> 的方式：</p>
<blockquote>
<p>将所有任务调度操作从“一个全局共享队列 + 全局锁”转变为“多个线程本地队列 + 无锁通信协议”，从<strong>根源上消除了对全局互斥锁的依赖</strong>。</p>
</blockquote>
<h2>🔍 具体原理：为什么可以不用全局任务锁？</h2>
<h3>1. <strong>线程私有的任务队列结构</strong></h3>
<ul>
<li>每个线程有一个主队列 + 多个辅助队列（SPSC）：
<ul>
<li>自己从主队列消费；</li>
<li>其他线程可往辅助队列投任务。</li>
</ul></li>
<li>每条队列都是 <strong>单生产者-单消费者（SPSC）</strong>，天然无锁。</li>
<li>所以：<strong>每个入队/出队操作都不会与他人竞争，不需要加锁。</strong></li>
</ul>
<h3>2. <strong>任务创建 = 本地入队 or 定向推送</strong></h3>
<ul>
<li>新建任务不是放到“系统全局任务池”，而是<strong>放到目标线程的本地队列（主队列或辅助队列）</strong>。</li>
<li>入队过程是“我指定我把任务交给哪个线程”，无需协调、无需排队抢资源。</li>
</ul>
<h3>3. <strong>调度流程完全本地化</strong></h3>
<ul>
<li>线程调度只处理自己和自己收到的任务，不需要进入全局调度中心，也就避免了锁竞争。</li>
</ul>
<table>
<thead>
<tr>
<th>特性</th>
<th>GNU OpenMP (GOMP)</th>
<th>使用 XQueue (XGOMP)</th>
</tr>
</thead>
<tbody>
<tr>
<td>任务队列</td>
<td>全局共享优先队列</td>
<td>每线程私有队列</td>
</tr>
<tr>
<td>调度依赖</td>
<td>全局锁保护队列和状态变量</td>
<td>不依赖锁</td>
</tr>
<tr>
<td>操作粒度</td>
<td>原子 + 加锁</td>
<td>无锁 SPSC 设计</td>
</tr>
<tr>
<td>可扩展性</td>
<td>差，线程数越多锁争用越严重</td>
<td>高，线程之间互不干扰</td>
</tr>
<tr>
<td>延迟</td>
<td>高，尤其在细粒度任务下</td>
<td>低，&lt; 20 CPU cycles</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>替代目标</th>
<th>GOMP原设计</th>
<th>XGOMP改进（基于XQueue）</th>
</tr>
</thead>
<tbody>
<tr>
<td>全局任务锁</td>
<td>所有任务入队/出队都要加锁</td>
<td>入队是单生产者写入，无需锁</td>
</tr>
<tr>
<td>全局优先队列</td>
<td>任务共享在一个地方，易冲突</td>
<td>每线程独立持有任务队列</td>
</tr>
<tr>
<td>任务状态同步</td>
<td>多处状态变量加锁更新</td>
<td>仅保留一个 atomic task count</td>
</tr>
<tr>
<td>调度权控制</td>
<td>全线程抢锁抢任务</td>
<td>局部队列，按需协作或偷取</td>
</tr>
</tbody>
</table>
<p><strong>XQueue 替代全局任务锁的核心机制：</strong></p>
<ul>
<li>结构性地避免共享数据竞争（SPSC + MPMC 分布式设计）；</li>
<li>调度操作不需要中心协调，全部线程本地化；</li>
<li>即使在需要跨核迁移任务时，也用轻量无锁协议完成，不走共享锁路径。</li>
</ul>
<p>有点像中心化变成去中心化的结构。每次创建任务后都发给其中一个queue，然后大家线程一起来抢任务。你这个理解非常到位，而且比喻也很形象：</p>
<blockquote>
<p>✅ <strong>从中心化 → 去中心化调度结构</strong>，把原来“所有人来一个大门口排队领活”的模型，变成了“每人自建摊位，彼此点对点发活、捡活”，效率更高、冲突更少。</p>
</blockquote>
<hr />
<h3>🔁 更精确一点地说，是这样的流程：</h3>
<h4>🔹 1. <strong>每个线程启动时就创建了自己的队列集合</strong>：</h4>
<ul>
<li>一个主队列（master queue）：自己用来消费；</li>
<li>若干辅助队列（auxiliary queues）：其他线程投放任务用。</li>
</ul>
<h4>🔹 2. <strong>创建任务时，线程通过 Round-Robin 发任务</strong></h4>
<ul>
<li>比如线程 A 创建一个新任务，它可能选择发给：
<ul>
<li>自己的主队列；</li>
<li>线程 B 的辅助队列；</li>
<li>线程 C 的辅助队列；</li>
</ul></li>
<li>总之每个任务的归属是明确的：“这个任务我扔给了 X 线程”。</li>
</ul>
<h4>🔹 3. <strong>执行任务时，线程只从自己的队列中取</strong></h4>
<ul>
<li>先从自己的主队列取任务；</li>
<li>若主队列空了，再看辅助队列中有没有其他线程扔来的任务；</li>
<li>若都没有，再通过 “无锁抢任务协议” 发出请求，请别人“给我分点活”。</li>
</ul>
<h4>🔹 4. <strong>任务不需要锁调度，全流程都是线程本地处理</strong></h4>
<ul>
<li>谁的任务谁负责投放；</li>
<li>谁执行任务谁负责捡；</li>
<li>没有中心控制器，也没有抢全局锁。</li>
</ul>
<hr />
<h3>🧠 你理解的“大家一起来抢任务”这个说法，其实在 XQueue 中可以再细分：</h3>
<table>
<thead>
<tr>
<th>阶段</th>
<th>是否抢任务？</th>
<th>原理说明</th>
</tr>
</thead>
<tbody>
<tr>
<td>正常运行时</td>
<td>不抢，按分配执行</td>
<td>每人只执行发给自己的任务</td>
</tr>
<tr>
<td>本地队列空了</td>
<td>发“偷活”请求</td>
<td>启动 NUMA-aware 的 work stealing</td>
</tr>
<tr>
<td>特殊策略下（如 NA-RP）</td>
<td>别人主动“推活”给我</td>
<td>比如线程太空闲，请其他人把任务 redirect 给我</td>
</tr>
</tbody>
</table>
<h3>📌 类比总结：调度架构的演化</h3>
<table>
<thead>
<tr>
<th>模型</th>
<th>比喻</th>
<th>缺点</th>
<th>优点</th>
</tr>
</thead>
<tbody>
<tr>
<td>GOMP 全局优先队列 + 锁</td>
<td>大家在唯一窗口排队</td>
<td>拥堵、锁竞争、扩展性差</td>
<td>实现简单</td>
</tr>
<tr>
<td>XQueue 去中心调度 + 无锁队列</td>
<td>每人有摊位，互相发货抢活</td>
<td>管理复杂，任务归属分散</td>
<td>并行度高，延迟低，NUMA 友好</td>
</tr>
</tbody>
</table>
<p>如果你有兴趣，我还可以给你画一张图说明这个“分布式队列 + 抢活机制”的结构。是否需要？</p>
<hr />
<p>这是个非常关键的问题，你问的是：</p>
<blockquote>
<p>在“抢活（steal task）”的过程中，多个线程<strong>是否会产生锁竞争</strong>？</p>
</blockquote>
<hr />
<h2>✅ 简短回答</h2>
<p><strong>不会产生传统意义上的锁竞争</strong>，因为：</p>
<blockquote>
<p>XQueue 设计了一个<strong>完全无锁的、NUMA-aware 的消息通信协议</strong>来完成“抢活”操作，避开了常见的互斥锁、原子自旋锁、CAS 等同步原语。</p>
</blockquote>
<hr />
<h2>🔍 原理性解释</h2>
<p>XQueue 中的“抢活”（即论文中的 <strong>NA-WS: NUMA-aware Work Stealing</strong>）并不是传统 work-stealing 中那种“直接抢你队列里的任务”，而是通过 <strong>lock-less 消息传递协议</strong> 请求对方“自愿给你一些任务”。</p>
<h3>🧱 关键机制：两块共享内存 + 不共享队列</h3>
<p>每个线程维护两块 <strong>无锁通信内存</strong>（每个是一个 64-bit 的变量）：</p>
<ol>
<li><strong>Round cell</strong>（受害者维护）：标记已处理的请求轮数；</li>
<li><strong>Request cell</strong>（小偷写）：用于请求“我想从你这拿任务”。</li>
</ol>
<p>请求流程如下：</p>
<table>
<thead>
<tr>
<th>步骤</th>
<th>操作</th>
<th>是否需要锁</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>小偷读取 victim 的 round cell 和 request cell</td>
<td>❌ 无锁</td>
</tr>
<tr>
<td>2</td>
<td>如果发现没冲突，就写入自己的请求（含轮次 + 线程ID）</td>
<td>❌ 无锁</td>
</tr>
<tr>
<td>3</td>
<td>victim 看到请求，处理后再自愿把任务搬过去</td>
<td>❌ 无锁</td>
</tr>
<tr>
<td>4</td>
<td>偷成功后，victim 增加 round number 表示“我处理过你了”</td>
<td>❌ 无锁，只有 parent-child 读写关系</td>
</tr>
</tbody>
</table>
<ul>
<li>
<p>由于这些变量是线程私有使用（或一对一），没有共享写入的场景；</p>
</li>
<li>
<p>读写线程固定（round 只能自己写；request 只有偷的人写），<strong>避免了传统意义上的并发冲突</strong>。</p>
</li>
</ul>
<hr />
<h3>🧠 本质区别（和传统 work stealing 相比）</h3>
<table>
<thead>
<tr>
<th>特性</th>
<th>传统 work stealing</th>
<th>XQueue 的 NA-WS</th>
</tr>
</thead>
<tbody>
<tr>
<td>偷任务方法</td>
<td>自己去 victim 的 deque 中 pop</td>
<td>请求 victim 自己 push 给我</td>
</tr>
<tr>
<td>是否共享队列</td>
<td>是，会 CAS 或加锁访问队尾</td>
<td>否，每个线程拥有自己的队列，别的线程不能直接访问</td>
</tr>
<tr>
<td>是否竞争队列锁</td>
<td>会，尤其在 MPMC 队列上</td>
<td>不会，全部是私有 SPSC 队列</td>
</tr>
<tr>
<td>通信方式</td>
<td>直接操作共享数据结构</td>
<td>间接请求 + 对方自愿 push</td>
</tr>
</tbody>
</table>
<hr />
<h2>📌 小结</h2>
<p>你可以理解为：</p>
<blockquote>
<p>XQueue 的“抢活”是<strong>用消息+请求协议进行协作转移任务</strong>，而不是“抢别人盘子里的饭”。</p>
</blockquote>
<p>这种 <strong>结构性设计规避了锁</strong>，所以即使很多线程同时 idle 发出请求，也只是多了一些“写 request cell”的 cache 写入，不存在真实意义上的锁争用。</p>
<hr />
<p>之前我们做的paper是，给定一个固定的任务，然后我们用X-Queue来加速，接着可以很好的解决问题。原本的X-Queue任务基本有点像说，要一生二，二生四的任务。</p>
<table>
<thead>
<tr>
<th>Benchmark</th>
<th>任务生成方式</th>
<th>每任务生成子任务？</th>
<th>备注</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Fib</strong></td>
<td>递归</td>
<td>✅ 是（每次生成 2 个）</td>
<td>经典二叉递归</td>
</tr>
<tr>
<td><strong>NQueens</strong></td>
<td>回溯搜索</td>
<td>✅ 是（多个，约 2～8 个）</td>
<td>分支依赖当前棋盘状态</td>
</tr>
<tr>
<td><strong>FFT</strong></td>
<td>递归分治</td>
<td>✅ 是（2 个）</td>
<td>Cooley-Tukey 类型</td>
</tr>
<tr>
<td><strong>FP (Floor Plan)</strong></td>
<td>分治式递归</td>
<td>✅ 是</td>
<td>多任务拆分优化面积布局</td>
</tr>
<tr>
<td><strong>Health</strong></td>
<td>树遍历任务</td>
<td>✅ 是</td>
<td>每个病人节点生成子节点任务</td>
</tr>
<tr>
<td><strong>UTS</strong></td>
<td>Unbalanced Tree Search</td>
<td>✅ 是（非定值）</td>
<td>模拟随机生成深浅不一的树</td>
</tr>
<tr>
<td><strong>STRAS</strong></td>
<td>分块矩阵乘</td>
<td>✅ 是（7 子任务）</td>
<td>Strassen 算法典型模式</td>
</tr>
<tr>
<td><strong>Align</strong></td>
<td>多对序列比对</td>
<td>❌ 否（主要是数据并行）</td>
<td>使用 <code>#pragma omp single</code> 生成一堆固定任务</td>
</tr>
</tbody>
</table>
<p>但是在 LLM 的训练中存在一个问题。LLM是不是这种一生二 二生四的任务呢？并不是的。同时另一个问题是，LLM的小任务，是小的矩阵乘法任务。而X-Queue的小任务，是大的任务里由很多的小任务组成。</p>
<p>我们要做的应该是把单个任务做大，然后再把任务做小
把任务做小分解很简单。问题是如何把单个任务做大？</p>
