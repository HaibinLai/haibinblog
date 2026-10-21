---
title: "Task-based Parallelism models and their techniques Overivew"
description: "So far there are many task programming models. Charm++ Website: https://charmplusplus.org/applications/ Github: https://github.com/charmplusplus/charm Tutorial: https://charm.readthedocs.io/en/latest/index.html From UIU…"
publishedAt: "2026-01-07 16:40:39"
updatedAt: "2026-01-07 16:57:00"
category: "High Performance Computing"
tags: ["HPC"]
draft: false
slug: "task-based-parallelism-models-and-their-techniques-overivew"
legacySlug: "task-based-parallelism-models-and-their-techniques-overivew"
wordpressId: 1143
sourceUrl: "https://haibin-blog.vercel.app/index.php/task-based-parallelism-models-and-their-techniques-overivew/"
commentCount: 0
importedFromWordPress: true
---
<p>So far there are many task programming models.</p>
<h2>Charm++</h2>
<p>Website: <a href="https://charmplusplus.org/applications/">https://charmplusplus.org/applications/</a>
Github: <a href="https://github.com/charmplusplus/charm">https://github.com/charmplusplus/charm</a>
Tutorial: <a href="https://charm.readthedocs.io/en/latest/index.html">https://charm.readthedocs.io/en/latest/index.html</a></p>
<p>From UIUC PPL Lab</p>
<p>A Lib that updated until 2023</p>
<p>Used in HPC and Scientific Computing area</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260107161055096.png" alt="image.png" /></p>
<h3>Vector Load Balancing</h3>
<p><a href="https://charm.cs.illinois.edu/newPapers/23-01/Dissertation_Buch_Final.pdf">https://charm.cs.illinois.edu/newPapers/23-01/Dissertation_Buch_Final.pdf</a></p>
<p>In this doctoral dissertation, <strong>Vector Load Balancing</strong> is an innovative solution proposed by the author to address the increasingly complex load imbalance problems in modern high-performance computing (HPC).</p>
<p>Traditional load balancing treats &quot;load&quot; as a <strong>scalar value</strong>, typically representing only the total execution time. In contrast, <strong>Vector Load Balancing</strong> redefines load as a <strong>vector</strong> $\vec{l<em>o} \in \mathbb{R}^d</em>{\ge 0}$, where each dimension of the vector represents different performance characteristics or resource consumption aspects during execution.</p>
<p>When dealing with modern complex applications and systems, traditional scalar load balancing often fails to make optimal decisions due to information loss (dimensional compression):</p>
<ul>
<li><strong>Inability to Capture Phased Structures:</strong> Many programs consist of multiple sequentially executed phases, and the load distribution can vary significantly between phases. Scalar aggregation masks severe imbalances within individual phases.</li>
<li><strong>Parallelism of Heterogeneous Resources:</strong> In systems using both CPUs and accelerators (e.g., GPUs) simultaneously, a single numerical value cannot accurately describe the concurrent loads on both types of resources.</li>
<li><strong>Limitations of Non-Temporal Constraints:</strong> Constraints in non-temporal dimensions, such as memory footprint or network bandwidth, are difficult to represent in a scalar model.</li>
</ul>
<p>This thesis addresses performance bottlenecks in the following specific scenarios through a vectorized model:</p>
<ul>
<li><strong>Phase-Based Applications:</strong>
By storing the load of each phase in a different dimension of the vector, the load balancer can identify which objects are overloaded in specific phases. This enables more precise redistribution, preventing processors from experiencing significant idle wait times at each barrier.</li>
<li><strong>Heterogeneous Systems Load:</strong>
Handles tasks running concurrently on CPUs and GPUs. The vector model allows for the simultaneous optimization of utilization across multiple processing targets.</li>
<li><strong>Constraint-Based Load Balancing:</strong>
While optimizing execution time, it incorporates hard physical resource constraints like memory capacity as vector dimensions. This prevents load balancing strategies from causing node memory overflow (OOM) crashes.</li>
<li><strong>Algorithm Scalability:</strong>
Vectorization increases the dimensionality of the problem (i.e., the &quot;curse of dimensionality&quot;). The author addresses computational efficiency challenges for vector load balancing at scales of tens of thousands of processors by introducing optimization techniques such as spatial partitioning trees (e.g., k-d trees), Pareto frontier search, and hierarchical load balancing (Hierarchical LB).</li>
</ul>
<p>Vector load balancing upgraded from a &quot;one-dimensional&quot; to a &quot;multi-dimensional&quot; perspective,  enables the load balancer to analyze and optimize the performance.</p>
<h2>TBB</h2>
<p>doc: <a href="https://uxlfoundation.github.io/oneTBB/main/tbb_userguide/Task-Based_Programming.html">https://uxlfoundation.github.io/oneTBB/main/tbb_userguide/Task-Based_Programming.html</a>
Github: <a href="https://github.com/uxlfoundation/oneTBB.git">https://github.com/uxlfoundation/oneTBB.git</a></p>
<h3>When Task-Based Programming Is Inappropriate</h3>
<p>Using the task scheduler is usually the best approach to threading for performance, however there are cases when the task scheduler is not appropriate. The task scheduler is intended for high-performance algorithms composed from non-blocking tasks. It still works if the tasks rarely block. However, if threads block frequently, there is a performance loss when using the task scheduler because while the thread is blocked, it is not working on any tasks. Blocking typically occurs while waiting for I/O or mutexes for long periods. If threads hold mutexes for long periods, your code is not likely to perform well anyway, no matter how many threads it has. If you have blocking tasks, it is best to use full-blown threads for those.</p>
<h3>How Task Scheduler Works</h3>
<p>The scheduler runs tasks in a way that tries to achieve several targets simultaneously:</p>
<ul>
<li>Enable as many threads as possible, by creating enough job, to achieve actual parallelism</li>
<li>Preserve data locality to make a single thread execution more efficient</li>
<li>Minimize both memory demands and cross-thread communication to reduce an overhead</li>
</ul>
<p>To achieve this, a balance between depth-first and breadth-first execution strategies must be reached. Assuming that the task graph is finite, <strong>depth-first is better for a sequential execution</strong> because:</p>
<ul>
<li><strong>Strike when the cache is hot</strong>. The deepest tasks are the most recently created tasks and therefore are the hottest in the cache. Also, if they can be completed, tasks that depend on it can continue executing, and though not the hottest in a cache, they are still warmer than the older tasks deeper in the dequeue.</li>
<li><strong>Minimize space</strong>. Execution of the shallowest task leads to the breadth-first unfolding of a graph. It creates an exponential number of nodes that co-exist simultaneously. In contrast, depth-first execution creates the same number of nodes, but only a linear number can exists at the same time, since it creates a stack of other ready tasks.</li>
</ul>
<p>When a thread participates in the evaluation of tasks, it constantly executes a task obtained by the first rule that applies from the roughly equivalent ruleset:</p>
<ul>
<li>Get the task returned by the previous one, if any.</li>
<li>Take a task from the bottom of its deque, if any.</li>
<li>Steal a task from the top of another randomly chosen deque. If the selected deque is empty, the thread tries again to execute this rule until it succeeds.</li>
</ul>
<h3>Task Scheduler Bypass</h3>
<p>Scheduler bypass is an optimization where you directly specify the next task to run. According to the rules of execution described in <a href="https://uxlfoundation.github.io/oneTBB/main/tbb_userguide/How_Task_Scheduler_Works.html">How Task Scheduler Works</a>, the spawning of the new task to be executed by the current thread involves the next steps</p>
<h2>HPX</h2>
<p>doc: <a href="https://hpx-docs.stellar-group.org/latest/html/index.html">https://hpx-docs.stellar-group.org/latest/html/index.html</a>
Git: <a href="https://github.com/STEllAR-GROUP/hpx.git">https://github.com/STEllAR-GROUP/hpx.git</a></p>
<p>update until 2024</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260107163139000.png" alt="image.png" /></p>
<h2>Clik</h2>
<p>Git: <a href="https://github.com/OpenCilk/opencilk-project.git">https://github.com/OpenCilk/opencilk-project.git</a>
Paper: <a href="https://www.cse.wustl.edu/~angelee/home_page/papers/opencilk.pdf">https://www.cse.wustl.edu/~angelee/home_page/papers/opencilk.pdf</a>
doc: <a href="https://www.opencilk.org/doc/users-guide/getting-started/">https://www.opencilk.org/doc/users-guide/getting-started/</a></p>
<p>The OpenCilk infrastructure consists of three main components: a compiler designed to compile fork-join task-parallel code, an efficient work-stealing runtime scheduler, and a productivity-tool development framework based on compiler instrumentation designed for fork-join parallel computations. OpenCilk is modular — modifying one component for the most part does not necessitate modifications to the other components — and easy to extend — its construction naturally encourages code reuse. Despite being modular and easy to extend, OpenCilk produces high-performing code.</p>
<h3>The Burdened-dag Model</h3>
<p>Related Paper:</p>
<ol>
<li><a href="https://www.csd.uwo.ca/~mmorenom/CS433-CS9624/Resources/p145-he.pdf">https://www.csd.uwo.ca/~mmorenom/CS433-CS9624/Resources/p145-he.pdf</a></li>
<li><a href="https://arxiv.org/pdf/2211.08800v2">https://arxiv.org/pdf/2211.08800v2</a></li>
</ol>
<p>Actual speedup is influenced not only by these intrinsic characteristics, but also by the performance of the scheduling algorithm and the cost of migrating tasks to load-balance the computation across processor cores. <strong>This section discusses prior work on scheduling bounds and proposes a new model, called “burdened dags,” for incorporating migration costs</strong>.</p>
<p>Before this bound, there exists an upper bound describe the compute accelerate bound of DAG flow:  Graham's Bound.
Graham's Bound traditionally states that for a DAG with total work W and critical path length L executed on m processors, the execution time T satisfies:</p>
<p>$$T \leq \frac{W - L}{m} + L$$</p>
<p><code class="mathjax-inline language-mathjax">T \leq \frac{W - L}{m} + L</code></p>
<p>In an ideal Directed Acyclic Graph model, only the task execution time (work <code class="mathjax-inline language-mathjax">T_1</code>) and critical path length (span <code class="mathjax-inline language-mathjax">T_\infty</code>) are considered. However, in real-world multi-core systems, <strong>task migration</strong> incurs additional overhead.</p>
<ul>
<li><strong>Explicit costs:</strong> Management overhead from the scheduler for task allocation and state maintenance.</li>
<li><strong>Implicit costs:</strong> Data migration costs due to cache misses when a task moves from one core to another.</li>
<li><strong>Return costs:</strong> Synchronization overhead incurred when a function returns and finds that its parent task has been &quot;stolen&quot; by another core.</li>
</ul>
<p>The <strong>Burdened-DAG</strong> is an enhanced model over the ordinary DAG:</p>
<ul>
<li>It embeds the aforementioned &quot;burden&quot; onto every <strong>continuation edge</strong> of the DAG.</li>
<li>This is equivalent to assuming that task stealing occurs at every potential parallel point (simulating the worst-case scenario).</li>
<li>The <strong>Burdened Span <code class="mathjax-inline language-mathjax">\hat{T}_\infty</code></strong> refers to the length of the longest path found in this graph, which includes all burden weights.</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260107165415834.png" alt="image.png" /></p>
<p>So the speedup may look like:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260107165646489.png" alt="image.png" /></p>
