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
---
<p>gLLM: Global Balanced Pipeline Parallelism System for Distributed LLM Serving with Token Throttling</p>
<p>几种并行方法
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722211747826.png" alt="" /></p>
<p>尝试消除泡泡：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722210441380.png" alt="" /></p>
<p>目前在LLM推理里有两种不平衡：
stage 间不平衡
inter-stage dependency, where a stage cannot begin computation
until the preceding stage completes</p>
<p>比如两个GPU在算。例子1的GPU1算了1，然后传到GPU2，然后GPU2就闲置了，等GPU1算完2。例子2 的 GPU2算了1，但是GPU1想做3的话要等1传回来。</p>
<p>batch 间不平衡
where the number of concurrent micro-batches is limited by the pipeline depth.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722212236631.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722212321841.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722211350663.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722212344178.png" alt="" /></p>
<p>PP 他们只要传结果数值</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250722211652935.png" alt="" /></p>
