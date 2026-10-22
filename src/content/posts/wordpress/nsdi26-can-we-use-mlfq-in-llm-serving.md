---
title: "NSDI26: Can we use MLFQ in LLM Serving?"
description: "This paper is in arxiv for 2 years. Then it goes into NSDI26. Maybe we can see the difference between versions of 2023 and 2026. Paper link: https://arxiv.org/pdf/2305.05920 Main idea: Can we use MLFQ, a scheduling algo…"
publishedAt: "2025-10-21T10:25:11Z"
updatedAt: "2025-10-21T10:26:31Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["Inference", "LLM", "NSDI"]
author: "GB"
draft: false
slug: "nsdi26-can-we-use-mlfq-in-llm-serving"
legacySlug: "nsdi26-can-we-use-mlfq-in-llm-serving"
oldSlugs: []
wordpressId: 1039
sourceUrl: "https://www.haibinlaiblog.top/index.php/nsdi26-can-we-use-mlfq-in-llm-serving/"
commentCount: 0
viewCount: 5089
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/nsdi26-can-we-use-mlfq-in-llm-serving.webp"
---
<p>This paper is in arxiv for 2 years. Then it goes into NSDI26. Maybe we can see the difference between versions of 2023 and 2026.</p>
<p>Paper link:
<a href="https://arxiv.org/pdf/2305.05920">https://arxiv.org/pdf/2305.05920</a></p>
<p><strong>Main idea: Can we use MLFQ, a scheduling algorithm in Linux BSD,  for LLM Inference Scheduling?</strong>
没想到在OS课上学习的MLFQ，也有人用到文章里。</p>
<p>To learn MLFQ
From &quot;OSTEP&quot;:
<a href="https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf">https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched-mlfq.pdf</a></p>
<p>A good Chinese Videos for introduction
【冠以图灵奖之名的调度算法：MLFQ 多级反馈队列！】 <a href="https://www.bilibili.com/video/BV18T1FYMEiJ/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV18T1FYMEiJ/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<p>Implementation:
<a href="https://github.com/ananthamapod/Multi-Level-Feedback-Queue-Scheduling-Algorithm.git">https://github.com/ananthamapod/Multi-Level-Feedback-Queue-Scheduling-Algorithm.git</a></p>
<p>Some experiments in Linux 2.6
<a href="https://pages.cs.wisc.edu/~ltorrey/papers/torrey_spe06.pdf">https://pages.cs.wisc.edu/~ltorrey/papers/torrey_spe06.pdf</a></p>
<p>The article titled <strong>&quot;Fast Distributed Inference Serving for Large Language Models&quot;</strong> proposes and implements <strong>FastServe</strong>, a <strong>distributed inference serving system</strong> specifically designed for large-scale language models. It aims to address the issues of <strong>high latency</strong> and <strong>head-of-line blocking</strong> in existing LLM serving systems.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021174654602.png" alt="image.png" /></p>
<h2>Motivation</h2>
<ul>
<li>LLM inference has an <strong>autoregressive</strong> nature, generating one token at a time with an uncertain output length.</li>
<li>Existing systems (such as vLLM and Orca) use <strong>First-Come-First-Served (FCFS)</strong> and <strong>run-to-completion</strong> scheduling strategies, leading to:
<ul>
<li><strong>Head-of-line blocking</strong>: Long tasks block short tasks, causing queuing delays to account for over 90% of the total latency.</li>
</ul></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021174335888.png" alt="image.png" /></p>
<h2>Core Contributions</h2>
<h3>Try to use Multi-Level Feedback Queue (MLFQ)</h3>
<p>Each job in Scheduling is a inference request.</p>
<p>We can't use MLFQ simply. Since LLM has Decode and Prefill. So they design Skip-join mechanism for scheduling Prefilling (They will upload the priority for MLFQ)</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021174714768.png" alt="image.png" /></p>
<ul>
<li>Leverages the <strong>semi-known information</strong> characteristic of LLM inference:
<ul>
<li><strong>Input length is known</strong>, allowing prediction of the first token's generation time;  </li>
<li><strong>Output length is unknown</strong>.  </li>
</ul></li>
</ul>
<h3>补丁/solved bugs: Skip-Join</h3>
<ul>
<li>New tasks do not always enter the highest-priority queue but &quot;skip&quot; certain queues based on their <strong>initial phase execution time</strong>, directly joining a suitable priority queue.  </li>
<li>Avoids frequent preemption due to long initial phases, reducing ineffective scheduling.  </li>
<li>Introduces a <strong>starvation prevention mechanism</strong> to periodically elevate the priority of tasks that have been waiting for an extended period.</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021180945628.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021104749369.png" alt="image.png" /></p>
<h3>2. <strong>Proactive Key-Value Cache Management Mechanism</strong></h3>
<p>This is caused by using MLFQ. We have to stored KVCache.</p>
<p>就是如果你用MLFQ，就会导致KVCache经常堆积（因为很多请求来不及处理，KVCache也必须先记录着，所以才有这个设计）</p>
<p>This time GPU mem is not enough. So we have to store them in CPU.</p>
<p>One optimization is to overlap the time for transferring J2 data and compute J1.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021181856461.png" alt="image.png" /></p>
<p>To reach this, the time for this is:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021181749706.png" alt="image.png" /></p>
<ul>
<li>Preemptive scheduling generates significant intermediate states (KV Cache), occupying GPU memory.  </li>
<li>When GPU memory is insufficient, FastServe:
<ul>
<li><strong>Proactively swaps out the KV Cache of low-priority tasks to host memory</strong>;  </li>
<li><strong>Swaps it back in just before task execution</strong>;  </li>
<li>Uses <strong>pipelining and asynchronous operations</strong> to overlap swap-in/swap-out overhead with computation, hiding transfer latency.  </li>
</ul></li>
</ul>
<h3>3. <strong>Distributed LLM Serving Support</strong></h3>
<p>他们自己做了一个推理引擎，所以工程量挺大的.</p>
<p>The Engine was built with 13000 lines CUDA/C++ and 3000 lines python.</p>
<ul>
<li>Supports <strong>tensor parallelism</strong> and <strong>pipeline parallelism</strong>, suitable for ultra-large-scale models (e.g., OPT-175B).  </li>
<li>Both the scheduler and KV cache manager support distributed execution, ensuring multi-GPU collaboration.</li>
</ul>
<hr />
<h3>📊 <strong>Experimental Results</strong></h3>
<ul>
<li>Evaluated on OPT-13B/66B/175B models using real-world datasets (ShareGPT, Alpaca).</li>
<li>Compared to vLLM:
<ul>
<li><strong>Up to 31.4× throughput improvement under average latency</strong></li>
<li><strong>Up to 17.9× throughput improvement under tail latency</strong></li>
</ul></li>
<li>Compared to FasterTransformer: Achieved even more significant improvements (up to 74.9×).</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251021182005180.png" alt="image.png" /></p>
<p>请求的数量其实挺少的</p>
<h3>Summary</h3>
<p>FastServe delivers optimized performance through:</p>
<ul>
<li><strong>Iteration-level preemptive scheduling</strong></li>
<li><strong>Intelligent queue-skipping mechanism</strong></li>
<li><strong>Proactive KV cache management</strong></li>
<li><strong>Distributed execution optimization</strong></li>
</ul>
<p>文章的核心点还是在MLFQ上面，什么skip-join跟KVCache overlap，其实都是因为MLFQ导致的。这其实很糟糕，因为是你为了用MLFQ而用MLFQ，而不是说我专门解决LLM调度而去解决问题。凭什么一定要用MLFQ？不知道。所以有点像拿锤子找钉子。</p>
<p>在实验上，MLFQ其实有很多超参，然后MLFQ的overhead，这两个都没怎么测。文章的实验只测了调度的效果。所以其实实验部分做的不是很好。</p>
<p>一篇文章为什么没有中，这方面的经验一定要多学。我很认可作者的实力，我相信NSDI26的camera ready一定比23年的这个版本好很多。</p>
