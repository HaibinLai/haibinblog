---
title: "LEGO: Supporting LLM-enhanced Games with One Gaming GPU"
description: "LEGO: Supporting LLM-enhanced Games with One Gaming GPU paper: https://ieeexplore.ieee.org/document/11408477 HPCA2026 (CCF-A) Repo: https://github.com/sjtu-epcc/LEGO Professor: https://mivenhan.github.io/ An algorithm-s…"
publishedAt: "2026-06-23T07:37:07Z"
updatedAt: "2026-06-23T12:31:16Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["GPU", "Scheduling", "并行计算"]
author: "haibin"
draft: false
slug: "lego-supporting-llm-enhanced-games-with-one-gaming-gpu"
legacySlug: "lego-supporting-llm-enhanced-games-with-one-gaming-gpu"
oldSlugs: []
wordpressId: 1471
sourceUrl: "https://www.haibinlaiblog.top/index.php/lego-supporting-llm-enhanced-games-with-one-gaming-gpu/"
commentCount: 0
viewCount: 630
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<h2>LEGO: Supporting LLM-enhanced Games with One Gaming GPU</h2>
<p>paper: <a href="https://ieeexplore.ieee.org/document/11408477">https://ieeexplore.ieee.org/document/11408477</a> <strong>HPCA2026 (CCF-A)</strong>
Repo: <a href="https://github.com/sjtu-epcc/LEGO">https://github.com/sjtu-epcc/LEGO</a>
Professor: <a href="https://mivenhan.github.io/">https://mivenhan.github.io/</a></p>
<p>An algorithm-system codesign that enables the efficient co-location of LLM inference and game rendering tasks.</p>
<p>Artificial intelligence (AI) has been increasingly applied to gaming, with large language models (LLMs) playing a key role in character control. However, efficiently co-locating game rendering and LLM inference on one GPU presents challenges due to resource constraints, diverse latency requirements, and fine-grained task scheduling. </p>
<p>We propose LEGO, an algorithm-system co-design that enables the efficient colocation of LLM inference and game rendering tasks. Algorithm-wise, LEGO features a <strong>resource-oriented layer-skipping adaptor</strong>, which distills knowledge from skipped layers to reduce computational demand while maintaining inference accuracy. System-wise, LEGO proposes a headroom-maximizing LLM scheduler, which dynamically partitions inference tasks to utilize available rendering headroom. Evaluations on an Nvidia RTX 4090 show that LEGO meets latency targets in all scenarios, improves rendering headroom utilization by up to 28.6%, and reduces LLM inference accuracy loss by up to 86.3% compared to current layer-skipping approaches.</p>
<p>它的场景很具体：比如《黑神话：悟空》这类游戏本身要 60 FPS，每 16.6 ms 出一帧；同时游戏里的 NPC 或 AI 角色还要调用 LLM，每 200–600 ms 生成一次动作。问题是，大多数玩家只有一张 GPU，如果游戏渲染和 LLM 推理直接抢 GPU，就会导致游戏掉帧或者 LLM 响应超时。</p>
<p>为什么不能用云LLM：
Existing deployment strategies are not feasible on the client side, as most users have only one GPU on their personal machines. In this case, a natural idea is to leverage <strong>cloud-based LLM services. Unfortunately, the end-toend network overhead of cloud LLM services typically ranges from 20ms to 110ms.</strong> This is unacceptable for gaming scenarios, where 200 APM and 300 APM scenarios require SLOs (Service-Level Objective) of 300 ms and 200 ms, respectively. More critically, relying on cloud-based LLM services increases the overall cost of the game and undermines its market competitiveness.</p>
<p>Meanwhile, we observe considerable underutilization of GPU resources when the rendering task runs alone. <strong>Experimental results on an Nvidia RTX 4090 show that BlackMyth with high visual settings utilizes only 60.8% of the GPU time.</strong> This underutilization suggests a promising opportunity to colocate game rendering and LLM inference on the same gaming GPU. However, effectively leveraging this opportunity is nontrivial, as the available compute headroom is insufficient, dynamic, and fragmented.</p>
<p>Although 39.2% of the GPU time slice appears idle in BlackMyth, running Llama3-8B in a 100 APM scenario requires 41.9% of the GPU time–exceeding the available capacity. The resource gap only widens under 200 APM and 300 APM scenarios. Moreover, LLM inference relies on compute headroom from multiple rendering tasks for computation. Direct co-location leads to disordered contention, causing latency violations for rendering tasks. Therefore, effective co-location demands fine-grained task scheduling, which is challenging.</p>
<p>但这个空闲时间有三个麻烦：</p>
<p>第一，<strong>总量可能不够</strong>。比如 Llama3-8B 在 100 APM 场景下需要 41.9% GPU 时间，而 BlackMyth 剩余 headroom 只有 39.2%。</p>
<p>第二，<strong>空隙是碎片化的</strong>。LLM 一次推理要跨很多帧的时间窗口，不是一个完整的大块 GPU 时间。</p>
<p>第三，<strong>游戏渲染时间会波动</strong>。不同帧渲染时间不同，所以不能简单固定分配 GPU 时间。</p>
<p>所以文章不是简单说“GPU 有空闲，所以塞一个 LLM 进去”，而是要解决 <strong>fragmented GPU headroom scheduling</strong> 的问题。</p>
<p>其实本质还是一个高频任务，一个低频任务。换了一个非常有意思的故事</p>
<p>However, current GPUs only support limited formats, which means several fixed resource usage levels for LLM inference task. This lack of flexibility makes quantization poorly suited for dynamic resource conditions in task co-location within gaming. Therefore, in this work, we focus on layer-skipping techniques as a more adaptable solution.</p>
<h3>A. 算法侧：Resource-oriented layer-skipping adaptor</h3>
<p>LLM 推理太重，所以要减少计算。文章选择的方法是 <strong>layer skipping</strong>，也就是跳过一部分 Transformer 层。</p>
<p>但普通 layer skipping 有问题：<br />
现有方法比如 LITE、CALM 通常根据 token 的 confidence 动态决定是否提前退出。这种方法优化的是平均计算量，但不能保证每个 LLM 请求都满足严格 SLO。为了强行满足延迟，可能会跳过很多重要层，导致 accuracy 大幅下降。</p>
<p>LEGO 的做法是：</p>
<p>它先分析不同 Transformer 层输出之间的相似度。文章用 cosine similarity heatmap 来找哪些连续层“信息变化比较小”。如果某几层输入输出很相似，说明这些层引入的新信息较少，更适合被跳过。</p>
<p>（所以是一个固定的跳过。但是问题是，能跳多少？大模型还能这样跳吗？是不是不同prompt就不能跳了？）</p>
<p>在他们这个设置下，<strong>跳 12 层似乎还是可以接受的边界附近，跳 13、14 层就开始危险了</strong>。
<img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260623152909821.png" alt="image.png" /></p>
<p>GPT回答：文章的假设是：<strong>游戏里的 prompt 分布比较固定</strong>。比如 combat scenario 中，输入大概由场景描述、NPC/player 状态、历史动作组成，长度设为 512，输出长度设为 16。也就是说，它不是开放域 ChatGPT，而是一个比较窄的游戏控制任务。</p>
<p>（准确率好低。不过，如果假定模型会变强，那可能还好）</p>
<p><strong>跳层上限不是理论保证，而是经验结果。</strong><br />
它要靠 profiling 和 evaluation 确定最多能跳多少。（这个那岂不是要自己调和train）
<img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260623152539901.png" alt="image.png" /></p>
<p>大模型能这样做，甚至可能更有压缩空间；  但必须针对具体模型、具体任务、具体跳层数重新 profile + train；  不能直接迁移 Llama3-8B 的跳层策略。另外就是，大模型在消费GPU跑不起来。</p>
<p>然后，对于每种跳层方案，LEGO 不只是直接删除这些层，而是训练一个小的 <strong>FFN adaptor</strong> 来替代被跳过的层。这个 adaptor 用知识蒸馏方式训练，目标是让 adaptor 的输出尽量接近原本完整模型经过这些被跳过层之后的输出。</p>
<p>这个技术跟Powerinfer和LoRA当年很像啊。但是，这样相当于是缩小workload？故事好复杂，跟那篇eurosys一样。。。。。。。</p>
<pre><code>layer k -&gt; adaptor -&gt; layer k+N</code></pre>
<p>这个设计的关键是：<strong>跳哪些层不是根据 token confidence，而是根据当前 GPU 资源预算决定。</strong><br />
因此它叫 resource-oriented layer skipping。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260623152831617.png" alt="image.png" /></p>
<h3>B. 系统侧：Headroom-maximizing LLM scheduler</h3>
<p>接下来选好模型后，就要“见缝插针”，提交任务</p>
<p>第二个核心是调度器。它负责决定：</p>
<pre><code>下一次 LLM 推理有多少 GPU headroom 可用？应该跳几层？LLM 推理任务应该切成多小的 subtasks？这些 subtasks 应该什么时候插入游戏渲染空隙？</code></pre>
<p>文章发现 headroom 有两种：</p>
<pre><code>inter-rendering headroom：两帧之间的空隙intra-rendering headroom：一帧内部渲染 subtask 之间的空隙</code></pre>
<p>很多系统只利用帧和帧之间的空隙，但 LEGO 还利用一帧内部的 GPU idle gap。这个很重要，因为游戏引擎内部渲染本身也分成多个 subtask，有些阶段不使用 GPU，于是中间会产生小空隙。</p>
<p>调度器的做法是：</p>
<p>它用一个简单的 <strong>linear regression model</strong> 预测下一个 LLM execution window 的总 headroom。输入是过去三个 execution windows 的总 headroom，而不是逐帧预测每一帧的 headroom。文章说这样预测误差更低，最大约 1.3%，平均约 0.6%。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260623153201569.png" alt="image.png" /></p>
<p>然后根据预测结果选择 layer-skipping 策略。</p>
<p>最后，它把 LLM 推理拆成细粒度任务：</p>
<pre><code>decode 阶段：以 Transformer layer 为粒度，大约 0.4 msprefill 阶段：以 attention / FFN 子层为粒度，大约 0.5–1.0 ms</code></pre>
<p>对于一帧内部的小空隙，用细粒度 LLM subtask 填进去；对于帧和帧之间较大的空隙，用更粗粒度的 LLM subtask。</p>
<h2>Exp</h2>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260623153236501.png" alt="image.png" /></p>
