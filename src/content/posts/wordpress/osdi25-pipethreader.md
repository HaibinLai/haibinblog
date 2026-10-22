---
title: "OSDI25 PipeThreader"
description: "PipeThreader: Software-Defined Pipelining for Efficient DNN Execution AlpaServe 简单总结 背景问题 现在的深度学习模型越来越大，单块 GPU 内存不够用。 多模型在线服务要保证低延迟、高吞吐量，但请求量有时会突然激增，传统方法效率低。 核心想法 模型并行 ：把一个模型拆成几部分放到多块 GPU 上。 统计多路复用 ：当一个模型暂时不用 GPU，其他模型可以…"
publishedAt: "2025-08-21T10:38:45Z"
updatedAt: "2025-08-21T10:40:37Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["osdi"]
author: "GB"
draft: false
slug: "osdi25-pipethreader"
legacySlug: "osdi25-pipethreader"
oldSlugs: []
wordpressId: 945
sourceUrl: "https://www.haibinlaiblog.top/index.php/osdi25-pipethreader/"
commentCount: 0
viewCount: 1020
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-pipethreader.webp"
---
<p>PipeThreader: Software-Defined Pipelining for Efficient DNN Execution</p>
<hr />
<h3>AlpaServe 简单总结</h3>
<ol>
<li><strong>背景问题</strong></li>
</ol>
<ul>
<li>现在的深度学习模型越来越大，单块 GPU 内存不够用。</li>
<li>多模型在线服务要保证低延迟、高吞吐量，但请求量有时会突然激增，传统方法效率低。</li>
</ul>
<ol start="2">
<li><strong>核心想法</strong></li>
</ol>
<ul>
<li><strong>模型并行</strong>：把一个模型拆成几部分放到多块 GPU 上。</li>
<li><strong>统计多路复用</strong>：当一个模型暂时不用 GPU，其他模型可以使用空闲 GPU，提高资源利用率，减少等待时间。</li>
<li><strong>权衡</strong>：模型并行能提高吞吐量和突发处理能力，但会增加通信开销，可能单个请求慢一点。</li>
</ul>
<ol start="3">
<li><strong>AlpaServe 系统</strong></li>
</ol>
<ul>
<li>自动帮你决定模型怎么拆分、放在哪块 GPU、用哪种并行策略。</li>
<li>
<p>有两种核心算法：</p>
<ol>
<li><strong>贪婪模拟器算法</strong>：试不同组合，选出最能满足延迟要求的放置。</li>
<li><strong>枚举算法</strong>：全面搜索更优解。</li>
</ol>
</li>
<li><strong>运行时调度</strong>：把请求分配给最空的 GPU 组，预测超时的请求可以拒绝。</li>
</ul>
<ol start="4">
<li><strong>效果</strong></li>
</ol>
<ul>
<li>在 64 GPU 集群上，处理速度最高提升 10 倍。</li>
<li>延迟目标可严格 2.5 倍。</li>
<li>能应对更突发的请求，SLO 达成率高达 99%。</li>
</ul>
<ol start="5">
<li><strong>主要贡献</strong></li>
</ol>
<ul>
<li>系统分析模型并行在多模型服务中的利弊。</li>
<li>提出新算法优化多模型放置。</li>
<li>提供完整的 AlpaServe 系统，实现自动化、多模型推理优化。</li>
</ul>
<p><strong>总结</strong>：
AlpaServe 让多模型推理更快、更稳定，特别适合内存有限、请求突发和要求低延迟的场景。</p>
<p><a href="https://zhuanlan.zhihu.com/p/1926740033395749827">OSDI 2025 论文评述 Day 3 Session 9: AI + Systems III - 知乎</a>
<a href="https://hamerlate.github.io/publications/old/PipeThreader/">PipeThreader: Software-Defined Pipelining for Efficient DNN Execution - About</a></p>
<p><a href="https://www.usenix.org/system/files/osdi25-cheng.pdf">osdi25-cheng.pdf</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-pipethreader/body-001-81c3e5b1c51d.webp" alt="" /></p>
<p><a href="https://cs-sop.notion.site/CS-PhD-Statements-of-Purpose-df39955313834889b7ac5411c37b958d?p=2b8470ffc59c48bcbe09ee2a3fae01df&amp;pm=s">CS PhD Statements of Purpose</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-pipethreader/body-002-e9d172963070.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-pipethreader/body-003-bb395b3b6a68.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-pipethreader/body-004-180495ad9c20.webp" alt="" /></p>
