---
title: "ISCA25 Neoscope: How Resilient Is My SoC to Workload Churn?"
description: "未来的硬件怎么应对不断演变的软件？ https://dl.acm.org/doi/pdf/10.1145/3695053.3731014 这篇文章是 ISCA 2025 的论文 《Neoscope: How Resilient Is My SoC to Workload Churn?》 ，核心在回答一个非常系统/架构导向的问题： 当软件和工作负载不断演进（churn）时，一个 SoC 设计在整个生命周期内还能保持多“好”？ 其建模并定…"
publishedAt: "2026-02-01T13:22:55Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["Arch", "ISCA"]
author: "GB"
draft: false
slug: "isca25-neoscope-how-resilient-is-my-soc-to-workload-churn"
legacySlug: "isca25-neoscope-how-resilient-is-my-soc-to-workload-churn"
oldSlugs: []
wordpressId: 1183
sourceUrl: "https://www.haibinlaiblog.top/index.php/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/"
commentCount: 0
viewCount: 765
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn.webp"
---
<h2>未来的硬件怎么应对不断演变的软件？</h2>
<p><a href="https://dl.acm.org/doi/pdf/10.1145/3695053.3731014">https://dl.acm.org/doi/pdf/10.1145/3695053.3731014</a></p>
<p>这篇文章是 <strong>ISCA 2025</strong> 的论文 <strong>《Neoscope: How Resilient Is My SoC to Workload Churn?》</strong>，核心在回答一个非常系统/架构导向的问题：</p>
<blockquote>
<p><strong>当软件和工作负载不断演进（churn）时，一个 SoC 设计在整个生命周期内还能保持多“好”？</strong></p>
</blockquote>
<p>其建模并定量回答：在工作负载不可避免地演化（churn）的前提下，什么样的 SoC 设计在整个生命周期内更“稳健（resilient）”？</p>
<h2>背景：硬件用得越来越久，软件变得越来越快</h2>
<ul>
<li>SoC 的使用寿命在变长（手机、嵌入式、企业平台）</li>
<li>但软件/工作负载变化很快（AI、数据库、视频编码、模型结构）</li>
<li><strong>高度专用化的硬件</strong>（DSA / accelerator-heavy SoC）<br />
👉 初期性能极高，但<strong>一旦 workload 变了，性能可能“断崖式下降”</strong></li>
</ul>
<p>论文把这个问题称为Workload Churn（工作负载演化 / 抖动）</p>
<h2>二、如何定义 &amp; 刻画 Workload Churn？</h2>
<h3>✳️ 两个维度</h3>
<p>论文提出用两个量来描述 workload 如何变化（page 2–3）：</p>
<table>
<thead>
<tr>
<th>维度</th>
<th>符号</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Magnitude</strong></td>
<td>ε</td>
<td>总工作量是否变多（执行时间是否膨胀）</td>
</tr>
<tr>
<td><strong>Disruption</strong></td>
<td>Δ</td>
<td>工作内容是否“变种类”（操作类型是否变）</td>
</tr>
</tbody>
</table>
<h3>✳️ 四种典型 churn 类型（Figure 1 &amp; 2）</h3>
<table>
<thead>
<tr>
<th>类型</th>
<th>ε</th>
<th>Δ</th>
<th>现实例子</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Minimal</strong></td>
<td>低</td>
<td>低</td>
<td>IoT 固件</td>
</tr>
<tr>
<td><strong>Perturbing</strong></td>
<td>低</td>
<td>高</td>
<td>视频 codec 迭代</td>
</tr>
<tr>
<td><strong>Escalating</strong></td>
<td>高</td>
<td>低</td>
<td>数据规模增长</td>
</tr>
<tr>
<td><strong>Volatile</strong></td>
<td>高</td>
<td>高</td>
<td>AI 模型演化（Transformer / GPT）</td>
</tr>
</tbody>
</table>
<p>高 Δ = 对专用硬件最致命</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-001-d5ed193e4a44.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-002-3652d02f1682.webp" alt="image.png" /></p>
<hr />
<h2>三、Neoscope 是什么？作者的核心方法</h2>
<h3>Neoscope：一个“<strong>面向 churn 的 SoC 设计工具</strong>”</h3>
<p>Neoscope 是一个 <strong>pre-silicon、多目标、ILP 驱动的 SoC 设计空间探索工具</strong>（Section 3）。</p>
<h4>它解决了以往工具的两个问题：</h4>
<ul>
<li>❌ 要大量参数 sweep，找不到全局最优</li>
<li>❌ 只能评估“给定 SoC”，而不是反推“最优 SoC”</li>
</ul>
<p>Neoscope 反过来给定 workload → 直接解出最优 SoC 结构</p>
<p>完整pipeline：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-003-45926826e372.webp" alt="image.png" /></p>
<hr />
<h3>技术核心</h3>
<ul>
<li>
<p>把 SoC 设计建模为 <strong>Job-Shop Scheduling Problem</strong></p>
</li>
<li>
<p>用 <strong>Integer Linear Programming (ILP)</strong>：</p>
<ul>
<li>CPU / GPU / DSA 都是 “machines”</li>
<li>workload phases 是 “jobs”</li>
</ul>
</li>
<li>
<p>通过 <strong>exclusive machine ranges</strong></p>
<ul>
<li>让 solver 在一次求解中探索整个 SoC 设计空间</li>
</ul>
</li>
<li>
<p>支持 <strong>多目标优化</strong>：</p>
<ul>
<li>性能</li>
<li>面积效率</li>
<li>能效</li>
<li>成本</li>
<li>碳效率（结合 FOCAL）
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-004-cf721cd74746.webp" alt="image.png" /></li>
</ul>
</li>
</ul>
<p>具体建模见论文：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-005-089c9f2d1c20.webp" alt="image.png" /></p>
<hr />
<h2>四、实验发现</h2>
<h3>结论 1：<strong>小而专的 SoC 最脆弱</strong></h3>
<p>在 <strong>高 Disruption（Δ）</strong> 的 churn 下（Perturbing / Volatile）：</p>
<p><strong>小面积 + 强 DSA 专用化 → 性能崩溃最快</strong>  </p>
<p>原因：</p>
<ul>
<li>DSA 只支持旧 AIO（操作类型）</li>
<li>新 workload <strong>根本跑不到这些硬件上</strong></li>
</ul>
<blockquote>
<p>Figures 6a and 6e show that, independent of workload, when churn is Minimal, performance for all SoCs is very consistent relative to the optimal across all periods. This is unsurprising, as without much churn, there is not much that can happen to change an SoC’s performance. Together, these results demonstrate that specialization pays off if Minimal churn is expected.</p>
<p>Over-specialization is especially risky for small SoCs, when churn has high Disruption (Δ). </p>
</blockquote>
<h3>结论 2：<strong>Escalating churn（ε 高，Δ 低）反而适合专用化</strong></h3>
<p>如果只是：</p>
<ul>
<li>数据规模变大</li>
<li>操作类型不变</li>
</ul>
<p>👉 <strong>强 DSA 可以持续被利用，专用化是值得的</strong></p>
<blockquote>
<p>If Magnitude is high, it is good to over-provision.</p>
</blockquote>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-006-6bd1c67cfe18.webp" alt="image.png" /></p>
<hr />
<h3>结论 3：中等规模 SoC 最省能</h3>
<p>论文发现（Section 5）：</p>
<ul>
<li>小 SoC：功率密度太高</li>
<li>大 SoC：利用率不足</li>
<li><strong>中等规模 SoC → 最优能效</strong></li>
</ul>
<blockquote>
<p>Medium SoCs balance power density with compute utilization</p>
</blockquote>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-007-23ffeadc90f1.webp" alt="image.png" /></p>
<hr />
<h3>结论4：Dark silicon</h3>
<blockquote>
<p>在 <strong>Δ 低 + DSA 很强</strong> 的情况下，<br />
<strong>“大量 dark silicon 的 SoC 反而可能是碳最优的”</strong>  </p>
<p>When DSAs are strong relative to the GPU and Disruption (Δ) is low, dark silicon is always carbon optimal.</p>
</blockquote>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/isca25-neoscope-how-resilient-is-my-soc-to-workload-churn/body-008-428c5d186ac1.webp" alt="image.png" /></p>
