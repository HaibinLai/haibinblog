---
title: "OSDI 23 BWoS 更好的多线程work-stealing技术——分块"
description: "一篇有趣的文章，做的是新的多生产者多消费者的队列。 我猜这篇是他们做量化的同学搞的哈哈哈哈哈。 PowerPoint Presentation OSDI 2023 论文评述 Day3-Session11: Verify Your Bits - 知乎 stdexec/include/exec/ detail/ bwos_lifo_queue.hpp at main · NVIDIA/stdexec BWoS Work-Stealing…"
publishedAt: "2025-07-30 04:42:48"
category: "Paper Reading"
tags: ["osdi", "work-stealing", "多线程", "高性能计算"]
draft: false
slug: "osdi-23-bwos-更好的多线程work-stealing技术-分块"
legacySlug: "osdi-23-bwos-更好的多线程work-stealing技术-分块"
wordpressId: 914
sourceUrl: "https://www.haibinlaiblog.top/index.php/osdi-23-bwos-%e6%9b%b4%e5%a5%bd%e7%9a%84%e5%a4%9a%e7%ba%bf%e7%a8%8bwork-stealing%e6%8a%80%e6%9c%af-%e5%88%86%e5%9d%97/"
commentCount: 0
importedFromWordPress: true
---
<p>一篇有趣的文章，做的是新的多生产者多消费者的队列。</p>
<p>我猜这篇是他们做量化的同学搞的哈哈哈哈哈。</p>
<p><a href="https://www.usenix.org/system/files/osdi23_slides_wang_jiawei.pdf">PowerPoint Presentation</a>
<a href="https://zhuanlan.zhihu.com/p/643401930">OSDI 2023 论文评述 Day3-Session11: Verify Your Bits - 知乎</a></p>
<p><a href="https://github.com/NVIDIA/stdexec/blob/main/include/exec/__detail/__bwos_lifo_queue.hpp">stdexec/include/exec/<strong>detail/</strong>bwos_lifo_queue.hpp at main · NVIDIA/stdexec</a>
<a href="https://blog.icysky.site/posts/a-brief-introduction-to-bwos-work-stealing-queue/">BWoS Work-Stealing Queue简介 · icysky's blog</a></p>
<h2>摘要</h2>
<p>工作窃取是一种常见的调度技术，当每个核心都拥有一个调度队列时，可能出现某些核心已经空闲但其他某些核心却堆积了大量任务的情况，此时就需要利用工作窃取技术。先前的工作大多着眼于平衡各个核心的负载，<strong>但是却忽视了工作窃取这一过程本身会给任务的原所有者带来的性能影响</strong>。</p>
<p>本工作提出了BWoS，<strong>通过对任务队列分块以优化工作窃取</strong>。<strong>窃取方以块的粒度与任务所有者进行同步，避免与其在同一个块内进行操作，减少了窃取方与被窃取方间的性能影响</strong>，从而实现了整体性能的提高。同时BWoS实现了一种基于随机采样的victim选择算法，以减少此过程的开销。在Java G1GC中使用本优化可以在macrobenchmark中实现1.25倍性能提升，在Go语言的JSON处理程序中实现1.26倍性能提升。此外本工作利用模型检查器对BWoS进行了形式化验证，以确保其在弱内存模型中的正确性。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250729125012237.png" alt="" /></p>
<h2>Cache Miss</h2>
<p>Stealing会更新队列的Metadata，而队列的Metadata由Owner和Thief共享，这会导致Owner接下来访问队列发生Cache Miss。对于任务分配尤其不均衡的情况，这种Cache Miss发生得尤其频繁。Batching（批量处理）能够一定程度上减轻这种问题，但会导致偷取过多的任务，从而导致额外性能开销。</p>
<h2>弱内存模型</h2>
<p>弱内存模型（简称WMO，Weak Memory Ordering）,是把是否要求强制顺序这个要求直接交 给程序员的方法。换句话说，CPU不去保证这个顺序模型（除非他们在一个CPU上就有依赖 ），程序员要主动插入内存屏障指令来强化这个“可见性”。也没有一个全局的对所有CPU都 是一样的Total Order。允许多线程/多核对内存的读写可以乱序执行，只在同步点保证一致性。</p>
<p>好处是更高性能，缺点是需要程序员用 fence / atomic 明确指定关键位置的顺序。</p>
<p><a href="https://github.com/Kenneth-Lee/MySummary/blob/master/%E8%BD%AF%E4%BB%B6%E6%9E%84%E6%9E%B6%E8%AE%BE%E8%AE%A1/%E7%90%86%E8%A7%A3%E5%BC%B1%E5%86%85%E5%AD%98%E9%A1%BA%E5%BA%8F%E6%A8%A1%E5%9E%8B.rst">MySummary/软件构架设计/理解弱内存顺序模型.rst at master · Kenneth-Lee/MySummary</a></p>
<p><a href="https://chonghw.github.io/blog/2016/10/30/memorymodel/">深入探索并发编程系列(九)-弱/强内存模型 | High Performance</a></p>
<table>
<thead>
<tr>
<th>分类</th>
<th>特点</th>
<th>示例</th>
</tr>
</thead>
<tbody>
<tr>
<td>强内存模型（strong / sequential consistency）</td>
<td>所有线程观察到的所有操作按一个全局顺序执行，和程序顺序一致</td>
<td>理论上的 Sequential Consistency (SC)</td>
</tr>
<tr>
<td>弱内存模型（weak / relaxed）</td>
<td>允许更多指令乱序或延迟，只对特定同步点（比如 lock、barrier、fence）保证顺序</td>
<td>x86, ARM, POWER, RISC-V 默认</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>架构</th>
<th>特点</th>
</tr>
</thead>
<tbody>
<tr>
<td>x86 TSO（Total Store Order）</td>
<td>默认对 store → load 有顺序，但允许 store buffer</td>
</tr>
<tr>
<td>ARM, POWER</td>
<td>更弱，需要显式 barrier 才能保证顺序</td>
</tr>
<tr>
<td>C++11 memory model</td>
<td>提供 memory_order_relaxed, acquire, release, seq_cst 等原子顺序</td>
</tr>
<tr>
<td>GPU (CUDA)</td>
<td>block 内强一致；block 间要用 __threadfence 等保证可见性</td>
</tr>
</tbody>
</table>
<h2>Main Design</h2>
<p>Block-level同步保证了Thief永远不会从Owner正在执行<code>get</code>的Block上Steal。每个Block要么由Owner占用，要么被Thief占用。Owner可以将一个Block <strong>赋予（grant）</strong> Thief（允许该Block上的Stealing操作），也可以从Thief处 <strong>收回（take over）</strong> 一个Block（在<code>advanceGetBlock</code>里）。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250729125309263.png" alt="" /></p>
<p>每个Block均要记录最后一次访问的<strong>轮数（Round Numbers）</strong>，当执行<code>advanceBlock</code>方法时，当前Block的轮数会被带到下一个Block。如果循环完了一轮，此时所有Block的轮数均相等，则给轮数加一（借助<code>atomic_compare_exchange</code>实现）。在更新轮数时，可能当前Block上一轮的数据还没有被读取完（不论是<code>get</code>还是<code>steal</code>），此时必须等待当前Block上一轮的数据全部读取完才能更新轮数。这保证了数据既不会被覆盖，也不会被重复读取。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250729134400509.png" alt="" /></p>
<p>底层技术其实一直都有人在打磨优化。尤其是音视频，底层传输，在这些方面很多人做了很多的工作。</p>
<p>这些老工作其实性能非常强大。我在想他们能不能继续用在不规则方面的计算，但是我想做这些程序的人会能做的非常好。</p>
