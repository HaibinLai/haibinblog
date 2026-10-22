---
title: "阿里云百炼 Qwen 请求 Trace 分析"
description: "数据来自阿里云百炼上的 Qwen 推理集群，Apache 2.0 开源。 文中统计均由全量扫描四条 JSONL 得到（每条数据约 2 小时）。 这份开源请求数据集的仓库存有2小时 C 端聊天、B 端 API、长思维链、代码助手四类流量。 这是什么数据？ Qwen-Bailian Anonymous Dataset 每条记录有到达时间、输入/输出长度、会话父子关系、请求类型，以及按 16 token 一块 哈希后的 hash_ids…"
publishedAt: "2026-09-25T08:02:04Z"
category: "Data Mining"
categories: ["Data Mining"]
tags: ["AI", "GPU"]
author: "GB"
draft: false
slug: "a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi"
legacySlug: "a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi"
oldSlugs: []
wordpressId: 1674
sourceUrl: "https://www.haibinlaiblog.top/index.php/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/"
commentCount: 0
viewCount: 362
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi.webp"
---
<blockquote>
<p>数据来自阿里云百炼上的 Qwen 推理集群，Apache 2.0 开源。<br />
文中统计均由全量扫描四条 JSONL 得到（每条数据约 2 小时）。</p>
</blockquote>
<p>这份开源请求数据集的仓库存有2小时 C 端聊天、B 端 API、长思维链、代码助手四类流量。</p>
<hr />
<h2>这是什么数据？</h2>
<p><a href="https://github.com/alibaba-edu/qwen-bailian-usagetraces-anon">Qwen-Bailian Anonymous Dataset</a> 每条记录有到达时间、输入/输出长度、会话父子关系、请求类型，以及按 <strong>16 token 一块</strong> 哈希后的 <code>hash_ids</code>。</p>
<p>配套论文为 ATC'25 的 <a href="https://www.usenix.org/conference/atc25/presentation/wang-jiahao">KVCache Cache in the Wild</a>。官方 replay 工具：<a href="https://github.com/blitz-serving/trace-replayer">blitz-serving/trace-replayer</a>。</p>
<p>一条记录参考：</p>
<pre><code class="language-json">{
  &quot;chat_id&quot;: 159,
  &quot;parent_chat_id&quot;: 55,
  &quot;timestamp&quot;: 61.114,
  &quot;input_length&quot;: 521,
  &quot;output_length&quot;: 132,
  &quot;type&quot;: &quot;text&quot;,
  &quot;turn&quot;: 2,
  &quot;hash_ids&quot;: [1089, 1090, 1091, 6326]
}</code></pre>
<p><code>timestamp</code> 是相对秒，文件开头为 0。<code>parent_chat_id = -1</code> 表示一轮会话的根。<code>hash_ids</code> 已经是 chat template <strong>之后</strong> 的 token 块，replay 时不要再套一遍模板。</p>
<details>
<summary><strong>点开：四条文件各自对应什么场景</strong></summary>

| 文件 | 场景 | 本文简称 |
| --- | --- | --- |
| <code>qwen_traceA_blksz_16.jsonl</code> | C 端交互聊天 | To-C |
| <code>qwen_traceB_blksz_16.jsonl</code> | B 端 API 任务自动化（采集标注 2024-12） | To-B |
| <code>qwen_thinking_blksz_16.jsonl</code> | 长思维链 | Thinking |
| <code>qwen_coder_blksz_16.jsonl</code> | 代码生成 | Coder |

每条都是约两小时的独立切片，**不是**按线上真实 mix 抽的同一段流量。

</details>
<details>
<summary><strong>点开：他们怎么匿名的</strong></summary>

1. token 按 16 个一组，做加盐 SipHash-2-4
2. 哈希值再映射成全局整数，切断和原文的对应
3. <code>chat_id</code> 换成顺序整数，对不上账号
4. 墙钟时间全部平移到从 0 开始

所以你能复现「哪些块以前见过」，不能复现「用户说了什么」。

</details>
<hr />
<h2>四条 trace</h2>
<table>
<thead>
<tr>
<th style="text-align: right;"></th>
<th style="text-align: right;">To-C 聊天</th>
<th style="text-align: right;">To-B API</th>
<th style="text-align: right;">Thinking</th>
<th style="text-align: right;">Coder</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: right;">请求数</td>
<td style="text-align: right;">43,058</td>
<td style="text-align: right;"><strong>172,800</strong></td>
<td style="text-align: right;">10,812</td>
<td style="text-align: right;">43,011</td>
</tr>
<tr>
<td style="text-align: right;">平均 / 峰值 QPS</td>
<td style="text-align: right;">6.0 / 9.8</td>
<td style="text-align: right;"><strong>24.0 / 37</strong></td>
<td style="text-align: right;">1.5 / <strong>10.5</strong></td>
<td style="text-align: right;">6.0 / 9.2</td>
</tr>
<tr>
<td style="text-align: right;">多轮比例</td>
<td style="text-align: right;">46%</td>
<td style="text-align: right;"><strong>0%</strong></td>
<td style="text-align: right;">11%</td>
<td style="text-align: right;">39%</td>
</tr>
<tr>
<td style="text-align: right;">输入中位数</td>
<td style="text-align: right;">1,046</td>
<td style="text-align: right;">574</td>
<td style="text-align: right;">3,680</td>
<td style="text-align: right;"><strong>4,540</strong></td>
</tr>
<tr>
<td style="text-align: right;">输出中位数</td>
<td style="text-align: right;">376</td>
<td style="text-align: right;"><strong>39</strong></td>
<td style="text-align: right;"><strong>1,666</strong></td>
<td style="text-align: right;">469</td>
</tr>
<tr>
<td style="text-align: right;">输入 P99</td>
<td style="text-align: right;">14,365</td>
<td style="text-align: right;">6,294</td>
<td style="text-align: right;">24,973</td>
<td style="text-align: right;">14,407</td>
</tr>
<tr>
<td style="text-align: right;">输出 P99</td>
<td style="text-align: right;">1,641</td>
<td style="text-align: right;">1,006</td>
<td style="text-align: right;"><strong>34,687</strong></td>
<td style="text-align: right;">5,842</td>
</tr>
<tr>
<td style="text-align: right;">全局 KV 块复用</td>
<td style="text-align: right;">60%</td>
<td style="text-align: right;">62%</td>
<td style="text-align: right;">46%</td>
<td style="text-align: right;"><strong>66%</strong></td>
</tr>
</tbody>
</table>
<ul>
<li>To-B  全是单轮，输出中位 39 token，平均刚好 24 QPS。这是模板化 API。</li>
<li>To-C 为 chat。 将近一半多轮，还夹着搜索和图、文件。</li>
<li>Coder 吃 prefill。 输入中位 4540，会话最长 54 轮。</li>
<li>Thinking 吃长 decode，而且最突发。 均值 1.5 QPS，10 秒峰到 10.5，峰均比约 7。</li>
</ul>
<details>
<summary><strong>点开：To-C / To-B 请求类型构成</strong></summary>

![To-C 与 To-B 的请求类型](https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-001-09f28ef913d7.webp)

To-C：text 73.7%，search 19.0%，image 3.8%，file 3.5%。
To-B：api 87.3%，text 12.7%。B 端几乎没有「你问我答」的会话形态。

</details>
<p>记录里没有模型名、用户、语言。能再拆的只有 <code>type</code>。Thinking / Coder 各自只有一个取值。KV 复用下面按该 type 自己的时间序列重算，避免被别的类型带高。</p>
<table>
<thead>
<tr>
<th style="text-align: right;"></th>
<th style="text-align: right;">条数</th>
<th style="text-align: right;">占比</th>
<th style="text-align: right;">均/峰 QPS</th>
<th style="text-align: right;">输入中位 / P99</th>
<th style="text-align: right;">输出中位 / P99</th>
<th style="text-align: right;">多轮</th>
<th style="text-align: right;">子集内块复用</th>
<th style="text-align: right;">相对父请求前缀</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: right;">To-C / text</td>
<td style="text-align: right;">31,744</td>
<td style="text-align: right;">73.7%</td>
<td style="text-align: right;">4.4 / 7.6</td>
<td style="text-align: right;">790 / 8,202</td>
<td style="text-align: right;">371 / 1,714</td>
<td style="text-align: right;">48%</td>
<td style="text-align: right;">71%</td>
<td style="text-align: right;">60%</td>
</tr>
<tr>
<td style="text-align: right;">To-C / search</td>
<td style="text-align: right;">8,187</td>
<td style="text-align: right;">19.0%</td>
<td style="text-align: right;">1.1 / 3.0</td>
<td style="text-align: right;"><strong>5,293 / 16,635</strong></td>
<td style="text-align: right;">419 / 1,311</td>
<td style="text-align: right;">46%</td>
<td style="text-align: right;">51%</td>
<td style="text-align: right;"><strong>90%</strong></td>
</tr>
<tr>
<td style="text-align: right;">To-C / image</td>
<td style="text-align: right;">1,617</td>
<td style="text-align: right;">3.8%</td>
<td style="text-align: right;">0.22 / 0.8</td>
<td style="text-align: right;">369 / 2,764</td>
<td style="text-align: right;"><strong>69 / 817</strong></td>
<td style="text-align: right;"><strong>8%</strong></td>
<td style="text-align: right;"><strong>85%</strong></td>
<td style="text-align: right;">63%</td>
</tr>
<tr>
<td style="text-align: right;">To-C / file</td>
<td style="text-align: right;">1,510</td>
<td style="text-align: right;">3.5%</td>
<td style="text-align: right;">0.21 / 1.0</td>
<td style="text-align: right;"><strong>5,712 / 22,390</strong></td>
<td style="text-align: right;">523 / 2,045</td>
<td style="text-align: right;">50%</td>
<td style="text-align: right;">57%</td>
<td style="text-align: right;">86%</td>
</tr>
<tr>
<td style="text-align: right;">To-B / api</td>
<td style="text-align: right;">150,936</td>
<td style="text-align: right;">87.3%</td>
<td style="text-align: right;">21.0 / 34.1</td>
<td style="text-align: right;">589 / 5,764</td>
<td style="text-align: right;">37 / 979</td>
<td style="text-align: right;">0%</td>
<td style="text-align: right;">62%</td>
<td style="text-align: right;">—</td>
</tr>
<tr>
<td style="text-align: right;">To-B / text</td>
<td style="text-align: right;">21,864</td>
<td style="text-align: right;">12.7%</td>
<td style="text-align: right;">3.0 / 5.1</td>
<td style="text-align: right;">479 / 7,695</td>
<td style="text-align: right;">46 / 1,085</td>
<td style="text-align: right;">0%</td>
<td style="text-align: right;">60%</td>
<td style="text-align: right;">—</td>
</tr>
</tbody>
</table>
<hr />
<h2>到达过程</h2>
<p>四条都覆盖约 120 分钟。形状完全不像同一种业务。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-002-070c85687589.webp" alt="两小时请求到达率" /></p>
<ol>
<li><strong>To-B 的 172800 恰好等于 24 × 7200。</strong> 像是截了一段平均 24 QPS 的窗口；但 10 秒峰到 37，五分钟均值在 19–30 之间晃，<strong>不是均匀合成到达</strong>。</li>
<li><strong>Thinking 开头有尖峰</strong>，十分钟后掉到大约 1 QPS。弹性扩缩如果按均值备，会在这段被打穿。</li>
<li><strong>To-C 在两小时里从 ~3 爬到 ~8。</strong> 短窗口也会有趋势，不只是平稳噪声。</li>
</ol>
<p>到达间隔中位数：To-B 28 ms，To-C / Coder 约 113 ms，Thinking 369 ms。</p>
<details>
<summary><strong>点开：间隔时间的 CCDF</strong></summary>

![请求间隔 CCDF](https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-003-2e05001aaa8a.webp)

横轴是相邻请求的间隔。越靠右上，越「稀疏」。Thinking 明显更稀，To-B 挤在几十毫秒量级。

</details>
<p>To-C 的爬升主要来自 text（约 4.4 QPS）。search 大约稳定在 1 QPS；image / file 更稀。To-B 里 api 约 21 QPS、text 约 3 QPS，两条曲线同涨同落，差在量不在节奏。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-004-246f004ddbc4.webp" alt="To-C 各 type 到达率" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-005-5326c93e6d2e.webp" alt="To-B api vs text 到达率" /></p>
<hr />
<h2>Token 形状</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-006-f14e452fc5df.webp" alt="输入输出 token CCDF" /></p>
<p>左图输入、右图输出，都是 log-log CCDF。To-B 的输出掉得最快；Thinking 的输出一直拖到 10⁴–10⁵。Coder 输入在 10⁴ 附近有一块平台，很像「仓库/文件上下文被截到某个长度」。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-007-fa483e8abe5c.webp" alt="token 分位数" /></p>
<p>若你关心 GPU 上到底是 prefill 忙还是 decode 忙，看到达 token/s 比看 QPS 更直接：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-008-3fa80b870d1a.webp" alt="到达 token 速率" /></p>
<ul>
<li>Coder：<strong>3.4 万 input token/s</strong>，四条里 prefill 最重。  </li>
<li>Thinking：输出约 5.5k token/s，几乎赶上它自己的输入。  </li>
<li>To-B：QPS 最高，输出 token/s 反而最低——短答把并发打满，把生成打不满。</li>
</ul>
<details>
<summary><strong>点开：输入 vs 输出散点（每条随机 5000 点）</strong></summary>

![输入 vs 输出](https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-009-b26c2b8bfc90.webp)

To-B 贴在底部一条「短输出」带上。Thinking 往右上飞。两者几乎没有重叠，硬平均没有意义。

</details>
<p>To-C 按 type 再拆，四类几乎是四种业务：</p>
<ul>
<li><strong>text</strong>：中位输入 790，像普通对话。</li>
<li><strong>search</strong>：中位输入 5.3k，P99 1.7 万。检索拼进 prompt 之后，prefill 比 text 更重——尽管 QPS 只有 text 的四分之一，<strong>输入 token/s（6.8k）已经超过 text（5.6k）</strong>。</li>
<li><strong>file</strong>：比 search 还长（中位 5.7k，P99 2.2 万），条数最少。</li>
<li><strong>image</strong>：最短。输入中位 369，输出中位 69。更像「看图短答」。</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-010-0c63e0cf0293.webp" alt="To-C 各 type token 分位数" /></p>
<details>
<summary><strong>点开：To-C 各 type 的 token CCDF</strong></summary>

![To-C token CCDF](https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-011-9d237bfc64ae.webp)

search / file 的输入长尾明显右移。image 输出掉得最快。

</details>
<p>To-B 的 api 与 text 形状很像（输入中位 589 vs 479，输出中位 37 vs 46）。内部再按 type 分，分不出两种 serving 形态。</p>
<details>
<summary><strong>点开：To-B api vs text 的 token CCDF</strong></summary>

![To-B token CCDF](https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-012-ce7eb8f5cdbf.webp)

两条几乎叠在一起。不要指望用 <code>type=text</code> 把 B 端变成 C 端聊天。

</details>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-013-efb987c9c9e6.webp" alt="各 type 到达 token/s" /></p>
<p>只 replay To-C 的 text，会低估 prefill：search + file 条数不到 23%，输入 token 却占 To-C 的大半。</p>
<hr />
<h2>会话与 KV 缓存</h2>
<p><code>chat_id</code> 在四条里都是 <strong>每条请求唯一</strong>。会话不是「同一个 chat_id 多行」，而是用 <code>parent_chat_id</code> 连成树。</p>
<pre><code class="language-mermaid">flowchart LR
  r[&quot;根请求 parent = -1&quot;] --&gt; t2[&quot;第 2 轮 parent = 根的 chat_id&quot;]
  t2 --&gt; t3[&quot;第 3 轮&quot;]</code></pre>
<p>To-B 这棵树退化成 17.3 万个互不连接的点。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-014-807e4bd1809e.webp" alt="KV 块复用" /></p>
<ul>
<li><strong>右图，多轮前缀：</strong> 子请求相对父请求，约 67–69% 的 16-token 块能对上。支持「同一会话粘到同一实例」。</li>
<li><strong>左图，全局复用：</strong> To-B 没有多轮，全局块却仍有 <strong>62%</strong> 见过。命中来自跨请求的系统提示 / 模板，不是聊天历史。</li>
</ul>
<p>只为多轮做 session routing，会漏掉 B 端最大的那部分缓存。自动前缀缓存对 API 流量同样重要。Coder 全局复用最高（66%），Thinking 最低（46%）——长推理内容更「一次性」。</p>
<details>
<summary><strong>点开：会话树规模</strong></summary>

| Trace | 会话树数量 | 多轮占比 | 会话大小 P99 | 最大轮次 |
| --- | ---: | ---: | ---: | ---: |
| To-C | 23,101 | 46.3% | 8 | 37 |
| To-B | 172,800 | 0% | 1 | 1 |
| Thinking | 9,612 | 11.1% | 5 | 16 |
| Coder | 26,406 | 38.6% | 9 | 54 |

中位数都是 1：大多数「会话」其实只有一轮。长尾才是 KV 增长的来源。

</details>
<p>按 type 看，search / file 相对父请求的前缀命中 <strong>86–90%</strong>（检索页和文件上下文会在后续轮原样带着）；但 search 在 type 内部的全局块复用只有 51%——每次检索内容更「新」。image 相反：多轮只有 8%，全局块复用却高达 85%，像是共享视觉模板。To-B 的 api / text 都是 0% 多轮、约 60% 全局复用，缓存来自模板而不是会话。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-09/a-li-yun-bai-lian-qwen-qing-qiu-trace-fen-xi/body-015-efbd3717866b.webp" alt="各 type 多轮与 KV 复用" /></p>
<p>前缀缓存：search / file 要靠会话粘性；image / To-B 更靠跨请求模板。Thinking、Coder 没有更细标签，拆不开。</p>
<table>
<thead>
<tr>
<th>系统</th>
<th>使用哪条</th>
<th>真正打满的是</th>
</tr>
</thead>
<tbody>
<tr>
<td>高并发短 decode、API 网关</td>
<td>To-B</td>
<td>调度与 batch 槽位</td>
</tr>
<tr>
<td>前缀缓存、PD 分离、长 prefill</td>
<td>Coder，其次 To-C</td>
<td>KV 容量与 prefill</td>
</tr>
<tr>
<td>长 decode、弹性扩缩</td>
<td>Thinking</td>
<td><code>max_tokens</code> 与突发</td>
</tr>
<tr>
<td>带搜索/多模态的 C 端 chat</td>
<td>To-C</td>
<td>中等 prefill + 多轮粘性</td>
</tr>
</tbody>
</table>
<p>和 ShareGPT 默认压测的差别：To-B 更短更密；Coder / Thinking 输入长一个数量级；Thinking 输出长一到两个数量级；到达有爬升和尖峰，不是平稳泊松。</p>
<details>
<summary><strong>点开：和 BurstGPT、Mooncake、Azure 怎么搭配</strong></summary>

这份数据 **没有** 天级节律，也 **没有** GPU SM。长周期突发请叠 [BurstGPT](https://github.com/HPMLL/BurstGPT)（213 天）。前缀哈希的另一种块大小（512）见 [Mooncake](https://github.com/kvcache-ai/Mooncake)。对话 vs 代码的一周到达见 [Azure LLM 2024](https://github.com/Azure/AzurePublicDataset/blob/master/AzureLLMInferenceDataset2024.md)。卡侧利用率见阿里 xMaaS / ASI GPU trace，和这份请求日志不是同一层。

块大小不要混：Bailian 是 16，Mooncake 是 512。

</details>
<hr />
<h2>replay方法</h2>
<p>克隆后 JSONL 走 Git LFS（合计约 300MB）：</p>
<pre><code class="language-bash">git lfs install
git clone https://github.com/alibaba-edu/qwen-bailian-usagetraces-anon.git
cd qwen-bailian-usagetraces-anon
git lfs pull</code></pre>
<p>用官方 Trace Replayer（OpenAI 兼容 / TGI / AIBrix）：</p>
<pre><code class="language-bash">./client \
  --tokenizer tokenizer.json \
  --endpoint http://localhost:8080/v1/chat/completions \
  --api openai \
  --dataset bailian \
  --dataset-path qwen_traceA_blksz_16.jsonl \
  --scale-factor 1.0 \
  --model-name your-model</code></pre>
<p>或 NVIDIA AIPerf：</p>
<pre><code class="language-bash">aiperf profile \
  --model Qwen/Qwen3-0.6B \
  --endpoint-type chat \
  --streaming \
  --url localhost:8000 \
  --input-file qwen_traceA_blksz_16.jsonl \
  --custom-dataset-type bailian_trace \
  --fixed-schedule</code></pre>
<p>有 <code>timestamp</code> 就用 <strong>open-loop / fixed-schedule</strong>，不要再套恒定并发。需要打更高 QPS 时用 <code>scale-factor</code> 压时间轴，尽量保留突发形状。</p>
<details>
<summary><strong>点开：字段坑（官方 FAQ）</strong></summary>

多轮里，下一轮输入并不总是完整包含上一轮输出。缺的往往是 chat template 注入的 <code>&lt;think&gt;</code> / <code>&lt;/think&gt;</code>，应用层组下一轮上下文时会剥掉。

最后一个块的哈希也可能对不上「输入+第一个输出 token」的朴素拼接：最后一块可能有 padding，第一个生成 token 会改写这块内容，哈希跟着变。这不是丢 token。详见仓库 <code>docs/qa-context-growth-pattern.md</code>。

</details>
<hr />
<h2>思考</h2>
<p>点开之前先想三秒。</p>
<details>
<summary>To-B 平均正好 24 QPS，是不是均匀合成的？</summary>

不完全是。请求数整除时长，窗口可能经过抽取；但 10 秒峰到 37 QPS，间隔也不是常数。更像「截了两小时、平均 24」而不是恒定间隔生成器。

</details>
<details>
<summary>没有多轮，前缀缓存是不是就没用？</summary>

对 To-B 来说，会话前缀没用，**跨请求模板**还有。全局 16-token 块仍有约 62% 复用。

</details>
<details>
<summary>哪条 trace 最像「普通 ChatGPT 聊天」？</summary>

只有 To-C。Thinking / Coder 是专用形态；To-B 是 API。四条平均起来什么都不像。

</details>
<details>
<summary>这份数据能告诉我 GPU 利用率吗？</summary>

不能。没有 SM、HBM、功耗。只有请求到达和 KV 块。卡侧请另找集群 trace。

</details>
<ul>
<li>推不出全天/全周节律（只有 2 小时）。  </li>
<li>推不出失败率、TTFT、排队。  </li>
<li>推不出四条在真实线上的流量占比——它们是并列切片，不是 mix 抽样。  </li>
<li>不能把「平均 token」当成百炼总负载。</li>
</ul>
<hr />
<h2>参考文献与下载</h2>
<ul>
<li>数据：<a href="https://github.com/alibaba-edu/qwen-bailian-usagetraces-anon">https://github.com/alibaba-edu/qwen-bailian-usagetraces-anon</a>  </li>
<li>Jiahao Wang et al. <em>KVCache Cache in the Wild: Characterizing and Optimizing KVCache Cache at a Large Cloud Provider</em>. USENIX ATC 2025.  </li>
<li>Replay：<a href="https://github.com/blitz-serving/trace-replayer">https://github.com/blitz-serving/trace-replayer</a>  </li>
<li>许可：Apache 2.0  </li>
</ul>
