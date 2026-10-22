---
title: "SC25 gLLM"
description: "gLLM: Global Balanced Pipeline Parallelism System for Distributed LLM Serving with Token Throttling 几种并行方法 尝试消除泡泡： 目前在LLM推理里有两种不平衡： stage 间不平衡 inter-stage dependency, where a stage cannot begin computation until the pre…"
publishedAt: "2025-07-23T04:28:58Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["LLM"]
author: "GB"
draft: false
slug: "sc25-gllm"
legacySlug: "sc25-gllm"
oldSlugs: []
wordpressId: 905
sourceUrl: "https://www.haibinlaiblog.top/index.php/sc25-gllm/"
commentCount: 0
viewCount: 630
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm.webp"
---
<p>gLLM: Global Balanced Pipeline Parallelism System for Distributed LLM Serving with Token Throttling</p>
<p>几种并行方法
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-001-6aeec0e07b61.webp" alt="" /></p>
<p>尝试消除泡泡：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-002-5637364107ee.webp" alt="" /></p>
<p>目前在LLM推理里有两种不平衡：
stage 间不平衡
inter-stage dependency, where a stage cannot begin computation
until the preceding stage completes</p>
<p>比如两个GPU在算。例子1的GPU1算了1，然后传到GPU2，然后GPU2就闲置了，等GPU1算完2。例子2 的 GPU2算了1，但是GPU1想做3的话要等1传回来。</p>
<p>batch 间不平衡
where the number of concurrent micro-batches is limited by the pipeline depth.</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-003-ca058c47169e.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-004-1e8100d2197e.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-005-c5ee169085e7.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-006-67f2ce2ba9ee.webp" alt="" /></p>
<p>PP 他们只要传结果数值</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-07/sc25-gllm/body-007-0ba299c9d302.webp" alt="" /></p>
