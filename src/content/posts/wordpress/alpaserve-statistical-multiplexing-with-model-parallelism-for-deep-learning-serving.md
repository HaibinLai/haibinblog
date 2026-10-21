---
title: "AlpaServe: Statistical Multiplexing with Model Parallelism for Deep Learning Serving"
description: "模型并行性通常被视为一种将单个大型深度学习模型扩展到单个设备内存限制之外的方法。在本文中，我们证明了在为多个模型提供服务时，模型并行还可以用于多个设备的统计多路复用，即使单个模型可以适应单个设备。我们的工作揭示了模型并行性引入的开销与利用统计多路复用来减少突发工作负载下服务延迟的机会之间的基本权衡。我们探索了新的权衡空间，并提出了一种新的服务系统 AlpaServe，它确定了在分布式集群中放置和并行化大型深度学习模型集合的有效策略。对…"
publishedAt: "2025-06-16 14:16:47"
category: "High Performance Computing"
tags: ["HPC", "python", "仿真器", "模型并行"]
draft: false
slug: "alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving"
legacySlug: "alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving"
wordpressId: 866
sourceUrl: "https://www.haibinlaiblog.top/index.php/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/"
commentCount: 0
importedFromWordPress: true
---
<p>模型并行性通常被视为一种将单个大型深度学习模型扩展到单个设备内存限制之外的方法。在本文中，我们证明了在为多个模型提供服务时，模型并行还可以用于多个设备的统计多路复用，即使单个模型可以适应单个设备。我们的工作揭示了模型并行性引入的开销与利用统计多路复用来减少突发工作负载下服务延迟的机会之间的基本权衡。我们探索了新的权衡空间，并提出了一种新的服务系统 AlpaServe，它确定了在分布式集群中放置和并行化大型深度学习模型集合的有效策略。对生产工作负载的评估结果表明，AlpaServe 可以以高达 10× 的速率或 6× 的突发性处理请求，同时超过 99% 的请求保持在延迟约束范围内。</p>
<p>OSDI23
<a href="https://www.usenix.org/conference/osdi23/presentation/li-zhouhan">AlpaServe: Statistical Multiplexing with Model Parallelism for Deep Learning Serving | USENIX</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616001629247.png" alt="" /></p>
<p>Serving 成本其实更高
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616001703209.png" alt="" /></p>
<p>Serving DL models
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616001753821.png" alt="" /></p>
<h2>Real world request pattern</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616001810729.png" alt="" /></p>
<h2>So, model parallelism</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002041545.png" alt="" />
拼好G的好处：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002051022.png" alt="" />
100% utilization of GPU</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002207380.png" alt="" /></p>
<p>Model parallelism gains benefits:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002257241.png" alt="" /></p>
<p>Example Cluster Utilization:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002325655.png" alt="" />
So you can see that utilization comes up!</p>
<h2>But, we need 100GPU except from 2 GPU</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002457894.png" alt="" /></p>
<h2>拼好GPU的好处</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002554232.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002613849.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002707258.png" alt="" /></p>
<h2>Decomposition</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002751844.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002822035.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616003101662.png" alt="" /></p>
<p>3D</p>
<p><strong>how to navigate this 3D?</strong> 当设备内存有限、请求率低、请求CV高或SLO要求严格时，模型并行通过统计复用可以提高模型服务的性能。（<a href="https://zhuanlan.zhihu.com/p/643392335">OSDI 2023论文评述 Day3 - 知乎</a>)</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002846816.png" alt="" /></p>
<h2>alpha serve</h2>
<p>AlpaServe，利用一个Controller将请求分派到不同的组中。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616003244754.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616003134641.png" alt="" /></p>
<ol>
<li>Generate many strategies</li>
<li>placement algo</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250616002952148.png" alt="" /></p>
<h2>模拟器</h2>
<p>这篇文章用一个真实系统+模拟器来做的实验。真实系统用于部署，然后看看用时。模拟器是用来看看调度策略和用时的，给你一个大概的估摸（也就是调度是可以数学建模出来的）</p>
<p><a href="https://dl.acm.org/doi/pdf/10.1145/3673038.3673089">MIGER: Integrating Multi-Instance GPU and Multi-Process Service for Deep Learning Clusters</a> 的实验也是由类似的组成部分，搭建了一个模拟器来查看效果</p>
