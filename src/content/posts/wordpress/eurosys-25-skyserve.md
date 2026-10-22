---
title: "Eurosys 25 Skyserve"
description: "来自大名鼎鼎的UCB Sky Computing Lab 他们尝试在云里运行LLM Serve 然后他们考虑的场景是 Spot inference。这个场景类似于云的instance很吃紧，然后会经常的扩增和缩小。在这种 动态场景 下做一个能fault tolerance, load balance的一个推理引擎调度系统。 AI也是微服务 Sky serve 首先把LLM服务当成微服务看待。在这种情况下 In summary, thi…"
publishedAt: "2025-07-29T17:37:43Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["eurosys", "System", "云计算"]
author: "GB"
draft: false
slug: "eurosys-25-skyserve"
legacySlug: "eurosys-25-skyserve"
oldSlugs: []
wordpressId: 910
sourceUrl: "https://www.haibinlaiblog.top/index.php/eurosys-25-skyserve/"
commentCount: 0
viewCount: 689
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/eurosys-25-skyserve.webp"
---
<p>来自大名鼎鼎的UCB Sky Computing Lab</p>
<p>他们尝试在云里运行LLM Serve</p>
<p>然后他们考虑的场景是 Spot inference。这个场景类似于云的instance很吃紧，然后会经常的扩增和缩小。在这种<strong>动态场景</strong>下做一个能fault tolerance, load balance的一个推理引擎调度系统。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250728215921201.png" alt="" /></p>
<h2>AI也是微服务</h2>
<p>Sky serve 首先把LLM服务当成微服务看待。在这种情况下</p>
<p>In summary, this paper makes four main contributions:
• The design of <strong>SpotHedge</strong>, a simple yet effective policy that <strong>manages a mixture of spot and on-demand replica</strong>s across regions and clouds. SpotHedge achieves high availability while improving both cost and service quality.
• The implementation of <strong>SkyServe</strong> as <strong>a distributed, multi cloud serving system with mechanisms to scale across spot</strong> and <strong>on-demand replicas to efficiently serve AI models.</strong>
• Anextensive evaluation of SpotHedge, comparing it to both research and production systems as well as state-of-the-art policies on spot GPU instances.
• An open-source serving system SkyServe1 to facilitate further research and policy design for serving on spot in stances</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250728220141122.png" alt="" /></p>
<p>Existing Systems. Existing systems [4, 26, 44, 53, 77] made promising progress toward reducing cost with spot instances. First, SpotServe [53] is a system that adjusts (data, tensor, pipeline) parallelism upon preemption within a replica. However, SpotServe does not consider or implement instance provisioning, placement, or scheduling [28]. Second, prior work has investigated training on spot instances [36, 45, 63, 67, 69, 74]. However, training aims to finish jobs within dead lines and can be paused and resumed from checkpoints upon spot instance preemption. Hence, training presents signifi cantly different goals from serving. Third, while serverless systems share a similar goal of reducing cost, serverless sys tems typically execute short-lived tasks and are not suited for long-running model serving; AWS Lambda does not yet support GPUs. Next, we show why these systems are still limited in serving AI models on spot instances</p>
<p>所以，这是一个新场景文章</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250729123541587.png" alt="" /></p>
