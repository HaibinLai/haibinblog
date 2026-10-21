---
title: "PRAM, BSP, logP Model"
description: "简单介绍 PRAM 、 BSP 和 logP 这三种并行计算模型。 学习参考链接： 《高性能计算与云计算》第五讲并行算法设计 - 豆丁网Docin 1. PRAM（Parallel Random Access Machine）模型 PRAM 是一种理想化的并行计算模型，用来描述并行算法的运行方式。你可以把它想象成一个理想的并行计算机，具有无限多个处理器（CPU），这些处理器可以 同时访问 共享的内存。 特点 ：所有的处理器可以 同时读…"
publishedAt: "2025-03-08 01:32:20"
updatedAt: "2025-03-08 01:34:05"
category: "High Performance Computing"
tags: ["HPC", "并行计算"]
draft: false
slug: "pram-bsp-logp-model"
legacySlug: "pram-bsp-logp-model"
wordpressId: 656
sourceUrl: "https://www.haibinlaiblog.top/index.php/pram-bsp-logp-model/"
commentCount: 0
importedFromWordPress: true
---
<p>简单介绍<strong>PRAM</strong>、<strong>BSP</strong> 和 <strong>logP</strong> 这三种并行计算模型。</p>
<p>学习参考链接：<a href="https://www.docin.com/p-2028172155.html">《高性能计算与云计算》第五讲并行算法设计 - 豆丁网Docin</a></p>
<h2>1. <strong>PRAM（Parallel Random Access Machine）模型</strong></h2>
<p><strong>PRAM</strong> 是一种理想化的并行计算模型，用来描述并行算法的运行方式。你可以把它想象成一个理想的并行计算机，具有无限多个处理器（CPU），这些处理器可以<strong>同时访问</strong>共享的内存。</p>
<ul>
<li>
<p><strong>特点</strong>：所有的处理器可以<strong>同时读取</strong>和<strong>写入</strong>内存中的数据，且没有任何访问延迟或冲突。这种理想情况使得它非常适合用于理论分析，但在实际计算机上并不完全适用。</p>
</li>
<li>
<p><strong>PRAM的种类</strong>：根据内存访问的规则，PRAM有几种不同的模型：</p>
<ul>
<li><strong>CRCW PRAM</strong>（Concurrent Read, Concurrent Write）：所有处理器可以同时读写内存。</li>
<li><strong>CREW PRAM</strong>（Concurrent Read, Exclusive Write）：所有处理器可以同时读内存，但只有一个处理器可以写某个内存地址。</li>
<li><strong>EREW PRAM</strong>（Exclusive Read, Exclusive Write）：每个处理器在任何时刻只能读或写一个内存位置。</li>
</ul>
</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080120323.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080121528.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080121483.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122097.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080121599.png" alt="" /></p>
<ul>
<li><strong>总结</strong>：PRAM模型是用来分析并行算法的一种理论工具，假设所有处理器可以同时读写内存。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080120226.png" alt="" /></li>
</ul>
<h2>2. <strong>BSP（Bulk Synchronous Parallel）模型</strong></h2>
<p><strong>BSP</strong> 是一种更接近现实的并行计算模型，它用于描述实际并行计算机上的工作方式。BSP模型假设计算是在多个<strong>处理器</strong>上并行进行的，并且这些处理器之间通过<strong>通信网络</strong>交换数据。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122726.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122133.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122354.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122461.png" alt="" /></p>
<ul>
<li>
<p><strong>特点</strong>：</p>
<ul>
<li>BSP模型中，计算过程被划分为多个<strong>超时（superstep）</strong>。每个超时包含三部分：计算阶段、通信阶段和同步阶段。</li>
<li>在每个超时中，处理器进行计算，然后进行必要的数据交换（通信），并且所有的处理器在同步阶段等待彼此完成操作。</li>
<li>这种方式通过限制每一阶段的最大通信延迟，避免了网络瓶颈，提高了计算的可预测性。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080122691.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080123943.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080123465.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080125891.png" alt="" /></li>
</ul>
</li>
<li>
<p><strong>总结</strong>：BSP模型试图将并行计算与通信相结合，通过超时机制实现计算与通信的协调，适合实际的并行计算环境。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126556.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126871.png" alt="" /></p>
</li>
</ul>
<h2>3. <strong>logP模型</strong></h2>
<p><strong>logP</strong> 是另一种并行计算模型，专注于描述实际硬件环境中并行计算时的通信延迟和带宽限制。</p>
<ul>
<li>
<p><strong>特点</strong>：</p>
<ul>
<li><strong>L</strong>（Latency）：通信的延迟，也就是从一个处理器发送信息到另一个处理器的时间。</li>
<li><strong>O</strong>（Overhead）：每次进行通信时的额外开销，比如发送和接收数据时的管理操作。</li>
<li><strong>g</strong>（Gap）：发送两个连续消息之间的最小时间间隔。</li>
<li><strong>P</strong>（Processors）：系统中处理器的数量。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126891.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126035.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126627.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126348.png" alt="" /></li>
</ul>
</li>
<li>
<p><strong>总结</strong>：logP模型不仅考虑了并行计算的计算过程，还关注通信过程中的延迟、带宽和额外开销，强调了实际硬件中的通信限制。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080126116.png" alt="" /></p>
</li>
</ul>
<hr />
<h2>总结：</h2>
<ul>
<li><strong>PRAM</strong>：是一个理想化的并行计算模型，假设没有通信延迟和冲突，所有处理器可以同时访问共享内存。</li>
<li><strong>BSP</strong>：是一个更加接近现实的并行计算模型，通过超时机制协调计算和通信，避免了通信延迟对性能的影响。</li>
<li><strong>logP</strong>：是一种专注于实际硬件性能的并行计算模型，它关注通信延迟、带宽限制以及处理器之间的通信开销。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080127263.png" alt="" /></li>
</ul>
<p>这些模型的目的都是帮助我们分析和理解并行计算的性能，尤其是在设计并行算法时，如何平衡计算和通信的开销。</p>
<h2>例子：快排</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080128110.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080128574.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202503080128835.png" alt="" /></p>
