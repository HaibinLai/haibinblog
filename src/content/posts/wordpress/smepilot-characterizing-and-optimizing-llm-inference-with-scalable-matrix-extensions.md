---
title: "SMEPilot: Characterizing and Optimizing LLM Inference with Scalable Matrix Extensions"
description: "来自IPADS的文章。这篇文章把ARM里的矩阵加速器SME用在CPU LLM Serving上。SME是ARM提出的一个加速装置，功能类似Intel的AMX加速器（AMX类似GPU里的TensorCore） Modern CPUs increasingly integrate matrix extensions, such as Arm Scalable Matrix Extension (SME) ARM的SME跟Intel里AMX…"
publishedAt: "2026-08-30 20:54:15"
category: "Academic"
tags: ["ARM", "CPU", "Infra", "SME", "System"]
draft: false
slug: "smepilot-characterizing-and-optimizing-llm-inference-with-scalable-matrix-extensions"
legacySlug: "smepilot-characterizing-and-optimizing-llm-inference-with-scalable-matrix-extensions"
wordpressId: 1649
sourceUrl: "https://www.haibinlaiblog.top/index.php/smepilot-characterizing-and-optimizing-llm-inference-with-scalable-matrix-extensions/"
commentCount: 0
importedFromWordPress: true
---
<p>来自IPADS的文章。这篇文章把ARM里的矩阵加速器SME用在CPU LLM Serving上。SME是ARM提出的一个加速装置，功能类似Intel的AMX加速器（AMX类似GPU里的TensorCore）</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260830203836606.png" alt="image.png" /></p>
<p>Modern CPUs increasingly integrate matrix extensions, such as Arm Scalable Matrix Extension (SME)</p>
<p>ARM的SME跟Intel里AMX最大的区别是，SME是跟计算core分离的，他们共享内存带宽，但是不共享L1 L2 Cache。</p>
<p>看知乎里也有讨论过SME的得失。比较大的问题是，由于SME是单独分离的，有时候一旦core数量多起来，多核的优势会大于单开SME的优势。SME不是一个scalable的东西。这也是这篇文章的核心想法：在计算时，矩阵的一部分计算给SME，一部分给传统Core，大家一起协同计算。（下图里的Mixed）</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260830204211944.png" alt="image.png" /></p>
<p>这样的动态调配，有一个比较大的问题，就是要慢慢调。超参数很多，稍微行数变一下，kernel的时间、缓存、machinebalance等就变了。猜测这里作者调了不少时间。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260830204243504.png" alt="image.png" /></p>
<p>Pipeline这里估计调的更狠，并且怀疑这里的效果。虽然消融实验显示降低了一倍，但是，这里QK、PV的大小一变，pipeline的效果有可能就不明显了，用在实际工程里可能比较难用，毕竟你的请求大小是会动态变的，我们没有那么多时间像文章里的profiler等等，用在生产里。只能说要调的好了。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260830204400136.png" alt="image.png" /></p>
<p>但是总体来说，写作和思路都还是挺不错的，文章还是值得一读的。至少能给codex看看。
<a href="https://arxiv.org/pdf/2606.16332">https://arxiv.org/pdf/2606.16332</a>
但是没开源，，</p>
<p>这里作者还给了一个ARM的microkernel库，值得看和抄。
<a href="https://github.com/ARM-software/kleidiai">https://github.com/ARM-software/kleidiai</a></p>
