---
title: "Rowhammer 行锤攻击"
description: "Intro Learn from Prof. Onur Mutlu: https://www.youtube.com/live/mEt-hhLHBG4?si=TsmRN04wcqbcQs0e Rowhammer（行锤攻击） 是一种硬件层面的安全漏洞，主要发生在 DRAM 内存 中。攻击者不需要破解软件或操作系统，只要反复高速访问（“hammer”）同一行或相邻行内存，就有可能导致相邻内存行的比特翻转（0→1 或 1→0），从而破坏数据…"
publishedAt: "2025-12-30 00:48:56"
updatedAt: "2025-12-30 00:49:10"
category: "Micro Topics"
tags: ["Arch"]
draft: false
slug: "rowhammer"
legacySlug: "rowhammer"
wordpressId: 1101
sourceUrl: "https://haibin-blog.vercel.app/index.php/rowhammer/"
commentCount: 0
importedFromWordPress: true
---
<h2>Intro</h2>
<p>Learn from Prof. Onur Mutlu: <a href="https://www.youtube.com/live/mEt-hhLHBG4?si=TsmRN04wcqbcQs0e">https://www.youtube.com/live/mEt-hhLHBG4?si=TsmRN04wcqbcQs0e</a></p>
<p>Rowhammer（行锤攻击） 是一种硬件层面的安全漏洞，主要发生在 DRAM 内存 中。攻击者不需要破解软件或操作系统，只要反复高速访问（“hammer”）同一行或相邻行内存，就有可能导致相邻内存行的比特翻转（0→1 或 1→0），从而破坏数据完整性甚至提权。</p>
<p>RowHammer is the phenomenon in which repeatedly accessing a row in a real DRAM chip causes bitflips (i.e., data corruption) in physically nearby rows. This phenomenon leads to a serious and widespread system security vulnerability, as many works since the original RowHammer paper in 2014 have shown. Recent analysis of the RowHammer phenomenon reveals that the problem is getting much worse as DRAM technology scaling continues: newer DRAM chips are fundamentally more vulnerable to RowHammer at the device and circuit levels. Deeper analysis of RowHammer shows that there are many dimensions to the problem as the vulnerability is sensitive to many variables, including environmental conditions (temperature &amp; voltage), process variation, stored data patterns, as well as memory access patterns and memory control policies. As such, it has proven difficult to devise fully-secure and very efficient (i.e., low-overhead in performance, energy, area) protection mechanisms against RowHammer and attempts made by DRAM manufacturers have been shown to lack security guarantees.</p>
<p>from <a href="https://arxiv.org/pdf/2211.07613">https://arxiv.org/pdf/2211.07613</a></p>
<h2>原理（为什么会发生）</h2>
<ul>
<li>DRAM 用电容存储比特（电荷会慢慢泄漏）</li>
<li>相邻内存行物理距离非常近</li>
<li>当一行被高频率反复激活时，会对相邻行产生电磁/电荷干扰</li>
<li>在刷新周期内，相邻行的电荷可能被“震掉”，导致bit flip</li>
</ul>
<blockquote>
<p>这是一个物理效应，不是传统意义上的软件 bug。</p>
</blockquote>
<h2>防御手段</h2>
<h3>硬件层</h3>
<ul>
<li>ECC 内存：能纠正 1-bit 错误（但多 bit 仍可能失效）</li>
<li>TRR（Target Row Refresh）：检测高频访问并刷新相邻行</li>
<li>增加刷新频率（代价是性能和能耗）</li>
</ul>
<h3>软件/系统层</h3>
<ul>
<li>随机化物理内存布局</li>
<li>限制高精度计时器（降低攻击成功率）</li>
<li>内核检测异常访问模式</li>
</ul>
