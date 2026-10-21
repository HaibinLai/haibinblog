---
title: "B-Queue"
description: "3_2.eps B-Queue 是一种面向多核架构中核间通信的高效、实用的 单生产者-单消费者（SPSC）无锁队列 ，其设计旨在解决现有并发无锁队列（CLF queue）在真实应用中存在的性能退化与死锁难题。 背景动机 多核系统中，线程间通常通过共享内存进行通信，CLF 队列被广泛用于核心间通信。然而现有的方案（如 FastForward 和 MCRingBuffer）存在如下问题： 性能仅在理想条件（如 L1 缓存驻留）下突出 ，在…"
publishedAt: "2025-06-02 23:32:30"
category: "Distributed Systems"
tags: ["gcc", "queue"]
draft: false
slug: "b-queue"
legacySlug: "b-queue"
wordpressId: 829
sourceUrl: "https://haibin-blog.vercel.app/index.php/b-queue/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="http://staff.ustc.edu.cn/~bhua/network_algorithmics_2020/B-Queue.pdf">3_2.eps</a></p>
<p><strong>B-Queue</strong> 是一种面向多核架构中核间通信的高效、实用的 <strong>单生产者-单消费者（SPSC）无锁队列</strong>，其设计旨在解决现有并发无锁队列（CLF queue）在真实应用中存在的性能退化与死锁难题。</p>
<h3>背景动机</h3>
<p>多核系统中，线程间通常通过共享内存进行通信，CLF 队列被广泛用于核心间通信。然而现有的方案（如 FastForward 和 MCRingBuffer）存在如下问题：</p>
<ol>
<li><strong>性能仅在理想条件（如 L1 缓存驻留）下突出</strong>，在真实系统中易受缓存抖动影响。</li>
<li><strong>扩展性差</strong>，多队列并发使用时性能显著下降。</li>
<li><strong>难以使用</strong>，需要复杂的参数调优或辅助机制来防止死锁。</li>
</ol>
<h3>B-Queue 的关键设计</h3>
<h4>1. <strong>批处理（Batching）</strong></h4>
<ul>
<li>生产者和消费者各维护一对指针（<code>head/batch_head</code> 和 <code>tail/batch_tail</code>），一次性探测一块可用槽位。</li>
<li>减少缓存交互，提升性能，增强预取效率。</li>
</ul>
<h4>2. <strong>回溯机制（Backtracking）</strong></h4>
<ul>
<li>当消费者发现当前批次为空时，<strong>自适应缩小批次大小</strong>，逐步逼近最近的有效数据槽位。</li>
<li>避免死锁的关键机制：<strong>不再依赖额外线程或定时器</strong>来“唤醒”对方。</li>
<li><strong>复杂度低</strong>、<strong>无垃圾数据注入</strong>，真正适用于实际系统。</li>
</ul>
<h4>3. <strong>自适应回溯（Self-adaptive Backtracking）</strong></h4>
<ul>
<li>根据运行时状况调整初始批次大小，兼顾低延迟与高吞吐。</li>
<li>若生产者忙，批次增大；若生产者不活跃，批次自动减小。</li>
</ul>
<h3>优势总结</h3>
<ul>
<li><strong>无需参数调优</strong>，跨平台适用性好。</li>
<li><strong>比 FastForward 和 MCRingBuffer 分别快最多 10x 和 5x</strong>（在真实 10Gbps 网络处理系统中测试）。</li>
<li><strong>稳定性强</strong>：即使在七个并发队列同时运行下性能也几乎无下降。</li>
<li><strong>延迟低、无死锁、易集成</strong>。</li>
</ul>
<h3>实际应用场景</h3>
<ul>
<li>高速网络数据处理系统。</li>
<li>多核并行系统中的流水线化任务分解与通信。</li>
<li>高频核心间数据传递（如实时视频处理、数据库操作等）。</li>
</ul>
<h2>那岂不是180核要32400个队列?</h2>
<p>不用:  <strong>B-Queue 是单生产者-单消费者（SPSC）</strong></p>
<ul>
<li>每个 B-Queue 实例只连接<strong>两个线程（或核）</strong>：一个生产者，一个消费者。</li>
<li>你<strong>只需要为“有通信需求”的核对之间建立队列</strong>。</li>
</ul>
<table>
<thead>
<tr>
<th>通信模式</th>
<th>队列数量估计</th>
<th>举例说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>全连接通信</strong>（每个核都可能给任意其他核发消息）</td>
<td>O(n²) ≈ 32,400 个（180×179）</td>
<td>这确实是最坏情况，基本不可行</td>
</tr>
<tr>
<td><strong>流水线通信</strong>（典型场景）</td>
<td>O(n)</td>
<td>每个核仅与上下游通信，比如核 i 向 i+1 发送</td>
</tr>
<tr>
<td><strong>N:1 或 1:N 扇出/扇入</strong></td>
<td>O(n)</td>
<td>比如多个核向一个汇聚核发数据（1 aggregator + N workers）</td>
</tr>
<tr>
<td><strong>分组通信</strong>（如 6 个核一组，共 30 组）</td>
<td>O(n × g)</td>
<td>每组内部全连接最多 6² = 36 个队列，30 组则最多 1080 个</td>
</tr>
<tr>
<td><strong>稀疏通信（most practical）</strong></td>
<td>远小于 n²</td>
<td>多数核只和少数核通信，比如生产者写入共享 buffer，由 dispatcher 分发</td>
</tr>
</tbody>
</table>
<h4>✔ 典型策略一：<strong>拓扑感知的调度</strong></h4>
<ul>
<li>只为实际有数据依赖的核之间分配队列。</li>
<li>很多核之间不直接通信，而是通过中间节点（调度核、中继核、共享缓冲）转发。</li>
</ul>
<h4>✔ 典型策略二：<strong>使用池化结构</strong></h4>
<ul>
<li>一些系统采用 <strong>工作窃取（work-stealing）+ 局部队列</strong>：
<ul>
<li>每个核维护自己的本地队列。</li>
<li>少量全局共享队列（MPMC）作为 backup。</li>
<li>不再是每对核都有专队列。</li>
</ul></li>
</ul>
<h4>✔ 典型策略三：<strong>分层调度 + B-Queue 混合使用</strong></h4>
<ul>
<li>核按 NUMA 节点/Socket/Cache 层分组。</li>
<li>组内高效通信用 B-Queue；组间低频通信用其他机制（如环形缓冲/事件驱动/队列池）。</li>
</ul>
