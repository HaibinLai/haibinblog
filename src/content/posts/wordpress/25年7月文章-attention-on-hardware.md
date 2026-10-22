---
title: "25年7月文章 Attention on Hardware"
description: "link: SystolicAttention: Fusing FlashAttention within a Single Systolic Array 这篇文章提出了一种针对 Transformer 模型中的 FlashAttention 加速的新架构 FSA（ Full Systolic Attention ），旨在解决现有 基于 systolic array 的加速器在执行 FlashAttention 时利用率低 的问题。作…"
publishedAt: "2025-08-05T17:59:53Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["GPU"]
author: "GB"
draft: false
slug: "25年7月文章-attention-on-hardware"
legacySlug: "25年7月文章-attention-on-hardware"
oldSlugs: []
wordpressId: 924
sourceUrl: "https://www.haibinlaiblog.top/index.php/25%e5%b9%b47%e6%9c%88%e6%96%87%e7%ab%a0-attention-on-hardware/"
commentCount: 0
viewCount: 1187
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/25%E5%B9%B47%E6%9C%88%E6%96%87%E7%AB%A0-attention-on-hardware.webp"
---
<p>link: <a href="https://arxiv.org/pdf/2507.11331">SystolicAttention: Fusing FlashAttention within a Single Systolic Array</a></p>
<p>这篇文章提出了一种针对 Transformer 模型中的 FlashAttention 加速的新架构 FSA（<strong>Full Systolic Attention</strong>），旨在解决现有<strong>基于 systolic array 的加速器在执行 FlashAttention 时利用率低</strong>的问题。作者指出，FlashAttention 中频繁交替的矩阵乘法与 softmax 操作不适合传统 systolic array，其原因包括：</p>
<ul>
<li>Systolic array 仅擅长执行连续、大规模的矩阵乘法；</li>
<li>softmax 含有大量非矩阵操作，必须借助外部向量单元执行；</li>
<li>在 systolic array 与向量单元之间频繁切换数据导致利用率降低；</li>
<li>同时执行 matmul 和 softmax 会造成寄存器文件和 SRAM 端口冲突，进一步降低性能。</li>
</ul>
<p>为解决上述问题，作者提出了 <strong>FSA 架构</strong>，核心是一个新的调度算法 <strong>SystolicAttention</strong>，可以将 FlashAttention 完整映射到 systolic array 内部，<strong>实现所有操作在阵列中按元素级细粒度重叠地执行</strong>，无需依赖外部单元，并保持原有浮点操作顺序以保证数值稳定性。</p>
<p>作者基于可综合 RTL 实现了 FSA，并与主流商用加速器进行了对比，结果显示：</p>
<ul>
<li>FSA 的注意力 FLOPs/s 利用率比 AWS NeuronCore-v2 高 <strong>1.77 倍</strong>；</li>
<li>比 Google TPUv5e 高 <strong>4.83 倍</strong>；</li>
<li>面积开销仅约 <strong>10%</strong>。</li>
</ul>
<h3>摘要</h3>
<p>本文提出 FSA（Full Systolic Attention），一种增强型 systolic array 架构，专为高效执行 FlashAttention 设计。通过引入 SystolicAttention 调度算法，FSA 能将所有注意力操作在 systolic array 内部以元素级重叠方式执行，从而避免外部向量单元参与，显著提高阵列利用率并确保数值稳定。硬件实现与评估表明，FSA 相较主流加速器在 attention 运算中性能提升显著，且仅带来小幅面积开销。</p>
