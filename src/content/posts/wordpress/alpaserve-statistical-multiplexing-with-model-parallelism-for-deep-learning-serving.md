---
title: "AlpaServe: Statistical Multiplexing with Model Parallelism for Deep Learning Serving"
description: "模型并行性通常被视为一种将单个大型深度学习模型扩展到单个设备内存限制之外的方法。在本文中，我们证明了在为多个模型提供服务时，模型并行还可以用于多个设备的统计多路复用，即使单个模型可以适应单个设备。我们的工作揭示了模型并行性引入的开销与利用统计多路复用来减少突发工作负载下服务延迟的机会之间的基本权衡。我们探索了新的权衡空间，并提出了一种新的服务系统 AlpaServe，它确定了在分布式集群中放置和并行化大型深度学习模型集合的有效策略。对…"
publishedAt: "2025-06-16T06:16:47Z"
category: "High Performance Computing"
categories: ["High Performance Computing", "Paper Reading"]
tags: ["HPC", "python", "仿真器", "模型并行"]
author: "GB"
draft: false
slug: "alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving"
legacySlug: "alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving"
oldSlugs: []
wordpressId: 866
sourceUrl: "https://www.haibinlaiblog.top/index.php/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/"
commentCount: 0
viewCount: 2636
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving.webp"
---
<p>模型并行性通常被视为一种将单个大型深度学习模型扩展到单个设备内存限制之外的方法。在本文中，我们证明了在为多个模型提供服务时，模型并行还可以用于多个设备的统计多路复用，即使单个模型可以适应单个设备。我们的工作揭示了模型并行性引入的开销与利用统计多路复用来减少突发工作负载下服务延迟的机会之间的基本权衡。我们探索了新的权衡空间，并提出了一种新的服务系统 AlpaServe，它确定了在分布式集群中放置和并行化大型深度学习模型集合的有效策略。对生产工作负载的评估结果表明，AlpaServe 可以以高达 10× 的速率或 6× 的突发性处理请求，同时超过 99% 的请求保持在延迟约束范围内。</p>
<p>OSDI23
<a href="https://www.usenix.org/conference/osdi23/presentation/li-zhouhan">AlpaServe: Statistical Multiplexing with Model Parallelism for Deep Learning Serving | USENIX</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-001-106b6147d0fe.webp" alt="" /></p>
<p>Serving 成本其实更高
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-002-7c2f5940499b.webp" alt="" /></p>
<p>Serving DL models
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-003-2b635b92b876.webp" alt="" /></p>
<h2>Real world request pattern</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-004-368d2bca18c0.webp" alt="" /></p>
<h2>So, model parallelism</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-005-c88cfedbdca4.webp" alt="" />
拼好G的好处：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-006-fc5baa7761c5.webp" alt="" />
100% utilization of GPU</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-007-c5d9089ed241.webp" alt="" /></p>
<p>Model parallelism gains benefits:
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-008-de4bf66beda8.webp" alt="" /></p>
<p>Example Cluster Utilization:
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-009-fd3272335348.webp" alt="" />
So you can see that utilization comes up!</p>
<h2>But, we need 100GPU except from 2 GPU</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-010-447ee1f2db22.webp" alt="" /></p>
<h2>拼好GPU的好处</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-011-4ccc27209504.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-012-8ae5af8ad9fd.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-013-c48bdde2c942.webp" alt="" /></p>
<h2>Decomposition</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-014-e562697003c8.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-015-101b2c789552.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-016-5bd34bdce5f7.webp" alt="" /></p>
<p>3D</p>
<p><strong>how to navigate this 3D?</strong> 当设备内存有限、请求率低、请求CV高或SLO要求严格时，模型并行通过统计复用可以提高模型服务的性能。（<a href="https://zhuanlan.zhihu.com/p/643392335">OSDI 2023论文评述 Day3 - 知乎</a>)</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-017-7400b9086036.webp" alt="" /></p>
<h2>alpha serve</h2>
<p>AlpaServe，利用一个Controller将请求分派到不同的组中。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-018-375578b5b955.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-019-33c8b4d05a3d.webp" alt="" /></p>
<ol>
<li>Generate many strategies</li>
<li>placement algo</li>
</ol>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/alpaserve-statistical-multiplexing-with-model-parallelism-for-deep-learning-serving/body-020-04a884e63fc1.webp" alt="" /></p>
<h2>模拟器</h2>
<p>这篇文章用一个真实系统+模拟器来做的实验。真实系统用于部署，然后看看用时。模拟器是用来看看调度策略和用时的，给你一个大概的估摸（也就是调度是可以数学建模出来的）</p>
<p><a href="https://dl.acm.org/doi/pdf/10.1145/3673038.3673089">MIGER: Integrating Multi-Instance GPU and Multi-Process Service for Deep Learning Clusters</a> 的实验也是由类似的组成部分，搭建了一个模拟器来查看效果</p>
