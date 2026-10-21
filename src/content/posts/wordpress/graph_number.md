---
title: "图个数问题与burnside引理"
description: "问题 一个图G（V,E），如果有8个顶点，一共有多少个这样的图？ 这个问题涉及到一个有趣的burnside引理，今天我们借这个问题来学习下这个图论引理。 不考虑同构情况 在这种情况下，我们假设每个顶点和边都有id，也就是他们是独一无二的。 如果默认是 无向简单图 ，也就是： 顶点已经固定为 8 个； 没有自环； 两个顶点之间最多一条边； 边没有方向。 那么 8 个顶点之间最多有 \\binom{8}{2}=\\frac{8\\times 7…"
publishedAt: "2026-07-19 00:18:25"
updatedAt: "2026-07-21 18:46:31"
category: "Graph"
tags: ["图论"]
draft: false
slug: "graph_number"
legacySlug: "graph_number"
wordpressId: 1489
sourceUrl: "https://www.haibinlaiblog.top/index.php/graph_number/"
commentCount: 0
importedFromWordPress: true
---
<h2>问题</h2>
<p>一个图G（V,E），如果有8个顶点，一共有多少个这样的图？</p>
<p>这个问题涉及到一个有趣的burnside引理，今天我们借这个问题来学习下这个图论引理。</p>
<h2>不考虑同构情况</h2>
<p>在这种情况下，我们假设每个顶点和边都有id，也就是他们是独一无二的。</p>
<p>如果默认是<strong>无向简单图</strong>，也就是：</p>
<ul>
<li>顶点已经固定为 8 个；</li>
<li>没有自环；</li>
<li>两个顶点之间最多一条边；</li>
<li>边没有方向。</li>
</ul>
<p>那么 8 个顶点之间最多有</p>
<pre><code class="language-katex">\binom{8}{2}=\frac{8\times 7}{2}=28</code></pre>
<p>条可能的边。每条边都有两种选择：<strong>存在</strong>或<strong>不存在</strong>。所以一共有</p>
<pre><code class="language-katex">2^{28}=268435456</code></pre>
<p>个不同的图。</p>
<p>如果是<strong>有向简单图</strong>，则每一对不同顶点有两个方向，所以可能边数总数是</p>
<pre><code class="language-katex">2^{56}</code></pre>
<p>如果允许自环，还会更多，但是不是我们今天的主要讨论范围，我们的正题在下面。</p>
<h2>如果考虑重合或者同构</h2>
<p>此时问题就超过了初中的组合计数。这个数不是简单除以 (8!)，不同图的对称性不同。</p>
<p>对这个情况，我们要用 <strong>Burnside 引理</strong> 来“按重命名群平均”。</p>
<h3>1. 问题本质：把同构图合并</h3>
<p>8 个点的无向简单图，如果顶点带编号，有</p>
<pre><code class="language-katex">2^{\binom{8}{2}}=2^{28}</code></pre>
<p>个。</p>
<p>但如果图同构算同一个，就相当于让所有顶点重命名：</p>
<pre><code class="language-katex">S_8</code></pre>
<p>作用在这些图上。我们想数的是这个作用下有多少个等价类，也就是多少个非同构图。</p>
<p>Burnside 引理说：</p>
<pre><code class="language-katex">\text{非同构图数量} =

\frac{1}{|S_8|}
\sum_{\pi\in S_8}
\text{Fix}(\pi)</code></pre>
<p>其中 <code class="katex-inline">\text{Fix}(\pi)</code> 表示：在顶点置换 <code class="katex-inline">\pi</code> 下保持不变的图有多少个。</p>
<p>因为：</p>
<pre><code class="language-katex">|S_8|=8!</code></pre>
<p>所以：</p>
<pre><code class="language-katex">\text{答案} =

\frac{1}{8!}
\sum_{\pi\in S_8}
\text{Fix}(\pi)</code></pre>
<hr />
<h3>2. 一个置换固定多少个图？</h3>
<p>一个置换 <code class="katex-inline">\pi</code> 会把边也进行置换。</p>
<p>例如边 <code class="katex-inline">{1,2}</code> 可能被映射成 <code class="katex-inline">{3,5}</code>。</p>
<p>如果一个图在 <code class="katex-inline">\pi</code> 下不变，那么同一个“边轨道”里的边必须一起出现，或者一起不出现。</p>
<p>所以：</p>
<pre><code class="language-katex">\text{Fix}(\pi)=2^{c(\pi)}</code></pre>
<p>其中 <code class="katex-inline">c(\pi)</code> 是置换 <code class="katex-inline">\pi</code> 在所有可能边集合上的轨道数量。</p>
<p>因为每个边轨道有两种选择：选或者不选。</p>
<p>所以 Burnside 公式变成：</p>
<pre><code class="language-katex">\text{非同构图数量} =

\frac{1}{8!}
\sum_{\pi\in S_8}
2^{c(\pi)}</code></pre>
<p>关键就是：对 <code class="katex-inline">S_8</code> 中不同循环类型的置换，计算它们的边轨道数 <code class="katex-inline">c(\pi)</code>。</p>
<hr />
<h3>3. 为什么按循环类型算？</h3>
<p>在 <code class="katex-inline">S_8</code> 里，置换很多，一共有：</p>
<pre><code class="language-katex">8!=40320</code></pre>
<p>个。</p>
<p>但同一种循环结构的置换，对边的作用本质一样，所以 <code class="katex-inline">c(\pi)</code> 相同。</p>
<p>例如：</p>
<pre><code class="language-katex">(1\ 2)(3\ 4)</code></pre>
<p>和</p>
<pre><code class="language-katex">(5\ 6)(7\ 8)</code></pre>
<p>本质一样，都是两个 2-cycle 加四个不动点。</p>
<p>所以我们只需要按 8 的整数拆分来分类。</p>
<hr />
<h2>具体计算表</h2>
<p>下面是 8 个顶点所有置换类型对应的计算结果。</p>
<table>
<thead>
<tr>
<th>顶点置换循环类型</th>
<th style="text-align: right;">这种置换有多少个</th>
<th style="text-align: right;">边轨道数 <code class="katex-inline">c(\pi)</code></th>
<th style="text-align: right;">固定图数 <code class="katex-inline">2^{c(\pi)}</code></th>
</tr>
</thead>
<tbody>
<tr>
<td><code class="katex-inline">1^8</code></td>
<td style="text-align: right;">1</td>
<td style="text-align: right;">28</td>
<td style="text-align: right;"><code class="katex-inline">2^{28}</code></td>
</tr>
<tr>
<td><code class="katex-inline">2,1^6</code></td>
<td style="text-align: right;">28</td>
<td style="text-align: right;">22</td>
<td style="text-align: right;"><code class="katex-inline">2^{22}</code></td>
</tr>
<tr>
<td><code class="katex-inline">2^2,1^4</code></td>
<td style="text-align: right;">210</td>
<td style="text-align: right;">18</td>
<td style="text-align: right;"><code class="katex-inline">2^{18}</code></td>
</tr>
<tr>
<td><code class="katex-inline">2^3,1^2</code></td>
<td style="text-align: right;">420</td>
<td style="text-align: right;">16</td>
<td style="text-align: right;"><code class="katex-inline">2^{16}</code></td>
</tr>
<tr>
<td><code class="katex-inline">2^4</code></td>
<td style="text-align: right;">105</td>
<td style="text-align: right;">16</td>
<td style="text-align: right;"><code class="katex-inline">2^{16}</code></td>
</tr>
<tr>
<td><code class="katex-inline">3,1^5</code></td>
<td style="text-align: right;">112</td>
<td style="text-align: right;">12</td>
<td style="text-align: right;"><code class="katex-inline">2^{12}</code></td>
</tr>
<tr>
<td><code class="katex-inline">3,2,1^3</code></td>
<td style="text-align: right;">1120</td>
<td style="text-align: right;">10</td>
<td style="text-align: right;"><code class="katex-inline">2^{10}</code></td>
</tr>
<tr>
<td><code class="katex-inline">3,2^2,1</code></td>
<td style="text-align: right;">1680</td>
<td style="text-align: right;">10</td>
<td style="text-align: right;"><code class="katex-inline">2^{10}</code></td>
</tr>
<tr>
<td><code class="katex-inline">3^2,1^2</code></td>
<td style="text-align: right;">1120</td>
<td style="text-align: right;">10</td>
<td style="text-align: right;"><code class="katex-inline">2^{10}</code></td>
</tr>
<tr>
<td><code class="katex-inline">4,1^4</code></td>
<td style="text-align: right;">420</td>
<td style="text-align: right;">10</td>
<td style="text-align: right;"><code class="katex-inline">2^{10}</code></td>
</tr>
<tr>
<td><code class="katex-inline">4,2,1^2</code></td>
<td style="text-align: right;">2520</td>
<td style="text-align: right;">8</td>
<td style="text-align: right;"><code class="katex-inline">2^8</code></td>
</tr>
<tr>
<td><code class="katex-inline">4,2^2</code></td>
<td style="text-align: right;">1260</td>
<td style="text-align: right;">8</td>
<td style="text-align: right;"><code class="katex-inline">2^8</code></td>
</tr>
<tr>
<td><code class="katex-inline">4,3,1</code></td>
<td style="text-align: right;">3360</td>
<td style="text-align: right;">6</td>
<td style="text-align: right;"><code class="katex-inline">2^6</code></td>
</tr>
<tr>
<td><code class="katex-inline">4^2</code></td>
<td style="text-align: right;">1260</td>
<td style="text-align: right;">8</td>
<td style="text-align: right;"><code class="katex-inline">2^8</code></td>
</tr>
<tr>
<td><code class="katex-inline">5,1^3</code></td>
<td style="text-align: right;">1344</td>
<td style="text-align: right;">8</td>
<td style="text-align: right;"><code class="katex-inline">2^8</code></td>
</tr>
<tr>
<td><code class="katex-inline">5,2,1</code></td>
<td style="text-align: right;">4032</td>
<td style="text-align: right;">6</td>
<td style="text-align: right;"><code class="katex-inline">2^6</code></td>
</tr>
<tr>
<td><code class="katex-inline">5,3</code></td>
<td style="text-align: right;">2688</td>
<td style="text-align: right;">4</td>
<td style="text-align: right;"><code class="katex-inline">2^4</code></td>
</tr>
<tr>
<td><code class="katex-inline">6,1^2</code></td>
<td style="text-align: right;">3360</td>
<td style="text-align: right;">6</td>
<td style="text-align: right;"><code class="katex-inline">2^6</code></td>
</tr>
<tr>
<td><code class="katex-inline">6,2</code></td>
<td style="text-align: right;">3360</td>
<td style="text-align: right;">6</td>
<td style="text-align: right;"><code class="katex-inline">2^6</code></td>
</tr>
<tr>
<td><code class="katex-inline">7,1</code></td>
<td style="text-align: right;">5760</td>
<td style="text-align: right;">4</td>
<td style="text-align: right;"><code class="katex-inline">2^4</code></td>
</tr>
<tr>
<td><code class="katex-inline">8</code></td>
<td style="text-align: right;">5040</td>
<td style="text-align: right;">4</td>
<td style="text-align: right;"><code class="katex-inline">2^4</code></td>
</tr>
</tbody>
</table>
<p>然后代入：</p>
<pre><code class="language-katex">\frac{1}{40320}
\sum
(\text{置换个数})\times 2^{c(\pi)}</code></pre>
<p>结果就是：</p>
<pre><code class="language-katex">\boxed{12346}</code></pre>
<hr />
<h2>一个例子理解边轨道</h2>
<p>假设置换是：</p>
<pre><code class="language-katex">\pi=(1\ 2)</code></pre>
<p>它交换 1 和 2，其他点不动。</p>
<p>看边：</p>
<pre><code class="language-katex">{1,3}\mapsto {2,3}</code></pre>
<p>所以 <code class="katex-inline">{1,3}</code> 和 <code class="katex-inline">{2,3}</code> 是同一个边轨道。</p>
<p>如果图在这个置换下不变，那么：</p>
<pre><code class="language-katex">{1,3}</code></pre>
<p>存在，当且仅当</p>
<pre><code class="language-katex">{2,3}</code></pre>
<p>也存在。</p>
<p>由于不能只选其中一条。因此每个边轨道只能整体选择，边轨道越少，被这个置换固定的图越少。</p>
<p>对于 ((1\ 2))，边轨道数是 22，所以它固定：</p>
<pre><code class="language-katex">2^{22}</code></pre>
<p>个图。</p>
<hr />
<h2>总结</h2>
<p>如果顶点带编号：</p>
<pre><code class="language-katex">\boxed{2^{28}=268435456}</code></pre>
<p>如果同构图算同一个，也就是“考虑重合”：</p>
<pre><code class="language-katex">\boxed{12346}</code></pre>
<p>这个 (12346) 是通过 Burnside 引理算出来的：</p>
<pre><code class="language-katex">\boxed{
\frac{1}{8!}
\sum_{\pi\in S_8}
2^{c(\pi)}

12346
}</code></pre>
<p>其中 <code class="katex-inline">c(\pi)</code> 是顶点置换 <code class="katex-inline">\pi</code> 对 28 条可能边造成的边轨道数量。</p>
<p>Burnside 引理是一个用来数“<strong>考虑对称/重命名后有多少种本质不同对象</strong>”的工具。</p>
<p>在你的问题里，它用来数：</p>
<blockquote>
<p>8 个点的图，如果只是顶点名字不同但结构一样，就算同一个，那么一共有多少种？</p>
</blockquote>
<p>这种问题不能直接除以 (8!)，因为有些图自己的对称性很多，有些图几乎没有对称性。Burnside 引理就是专门处理这种“不均匀对称性”的。</p>
<hr />
<h2>Burnside 引理在说什么</h2>
<p>设有一个集合 (X)，里面是所有“带编号”的对象。</p>
<p>例如：</p>
<pre><code class="language-katex">X={\text{所有 8 个带编号顶点的无向简单图}}</code></pre>
<p>然后有一个群 (G) 作用在 (X) 上。</p>
<p>在图的问题里，<code class="katex-inline">G=S_8</code>，也就是所有 8 个顶点的重命名方式。</p>
<p>Burnside 引理说：</p>
<pre><code class="language-katex">\boxed{
\text{本质不同的对象数量}

\frac{1}{|G|}
\sum_{g\in G} |\mathrm{Fix}(g)|
}</code></pre>
<p>其中：</p>
<pre><code class="language-katex">\mathrm{Fix}(g)={x\in X: g\cdot x=x}</code></pre>
<p>意思是：被操作 (g) 之后仍然不变的对象数量。</p>
<p>所以 Burnside 引理可以理解为：</p>
<blockquote>
<p><strong>本质不同的结构数量 = 所有对称操作下“不变对象数量”的平均值。</strong></p>
</blockquote>
<hr />
<h3>用一个小例子理解</h3>
<p>假设我们有两个珠子位置，每个位置可以涂黑或白。</p>
<p>如果区分左右位置，一共有：</p>
<pre><code class="language-katex">2^2=4</code></pre>
<p>种：</p>
<pre><code class="language-katex">WW,\ WB,\ BW,\ BB  </code></pre>
<p>现在如果左右翻转后相同就算同一种，那么 (WB) 和 (BW) 算同一个。</p>
<p>所以本质不同的有：</p>
<pre><code class="language-katex">WW,\ BB,\ WB/BW  </code></pre>
<p>共 3 种。</p>
<p>我们用 Burnside 引理算一下。</p>
<p>这里的对称群 (G) 有两个元素：</p>
<ol>
<li>
<p>不动操作 (e)</p>
</li>
<li>
<p>左右交换操作 (s)</p>
</li>
</ol>
<p>对于不动操作 (e)，所有 4 种都不变：</p>
<pre><code class="language-katex">|\mathrm{Fix}(e)|=4</code></pre>
<p>对于左右交换 (s)：</p>
<pre><code class="language-katex">WW \to WW</code></pre>
<pre><code class="language-katex">BB \to BB</code></pre>
<pre><code class="language-katex">WB \to BW</code></pre>
<pre><code class="language-katex">BW \to WB</code></pre>
<p>所以只有 (WW,BB) 不变：</p>
<pre><code class="language-katex">|\mathrm{Fix}(s)|=2</code></pre>
<p>Burnside 引理给出：</p>
<pre><code class="language-katex">\frac{4+2}{2}=3</code></pre>
<p>正好是本质不同的 3 种。</p>
<hr />
<h3>回到图的问题</h3>
<p>对于 8 个顶点的图：</p>
<pre><code class="language-katex">X={\text{所有带编号的 8 点图}}</code></pre>
<p>带编号时共有：</p>
<pre><code class="language-katex">2^{\binom{8}{2}}=2^{28}</code></pre>
<p>个。</p>
<p>重命名群是：</p>
<pre><code class="language-katex">G=S_8</code></pre>
<p>有：</p>
<pre><code class="language-katex">8!=40320</code></pre>
<p>种顶点重命名方式。</p>
<p>Burnside 引理说：</p>
<pre><code class="language-katex">\text{非同构 8 点图数量}

\frac{1}{8!}
\sum_{\pi\in S_8}
|\mathrm{Fix}(\pi)|</code></pre>
<p>这里 <code class="katex-inline">\pi</code> 是一个顶点置换。</p>
<hr />
<h3>一个图被置换固定的含义</h3>
<p>比如有置换：</p>
<pre><code class="language-katex">\pi=(1\ 2)</code></pre>
<p>它交换顶点 1 和 2。</p>
<p>如果一个图在交换 1 和 2 后完全不变，那么它就被 <code class="katex-inline">\pi</code> 固定。</p>
<p>例如边：</p>
<pre><code class="language-katex">{1,3}</code></pre>
<p>会被映射成：</p>
<pre><code class="language-katex">{2,3}</code></pre>
<p>所以如果图要在 ((1 2)) 下不变，那么它必须满足：</p>
<pre><code class="language-katex">{1,3}\text{存在}
\iff
{2,3}\text{存在}</code></pre>
<p>也就是说，这两条边必须一起出现，或者一起不出现。</p>
<p>类似地，所有边会被顶点置换分成若干个“边轨道”。</p>
<p>每个边轨道只能整体选或不选。</p>
<p>所以：</p>
<pre><code class="language-katex">|\mathrm{Fix}(\pi)|=2^{c(\pi)}</code></pre>
<p>其中 <code class="katex-inline">c(\pi)</code> 是 <code class="katex-inline">\pi</code> 对所有可能边产生的轨道数量。</p>
<p>比如8 个点里所有可能边有 28 条。</p>
<p>置换 ((1 2)) 会让一些边互相对应：</p>
<pre><code class="language-katex">{1,3}\leftrightarrow {2,3}</code></pre>
<pre><code class="language-katex">{1,4}\leftrightarrow {2,4}</code></pre>
<p>一直到：</p>
<pre><code class="language-katex">{1,8}\leftrightarrow {2,8}</code></pre>
<p>这些成对绑定，一共有 6 对。</p>
<p>边：</p>
<pre><code class="language-katex">{1,2}</code></pre>
<p>交换后还是自己。</p>
<p>其他不涉及 1 和 2 的边，比如：</p>
<pre><code class="language-katex">{3,4},{3,5},\dots</code></pre>
<p>也都不变。</p>
<p>所以边轨道数量是：</p>
<pre><code class="language-katex">1 + 6 + \binom{6}{2}

= 1+6+15

= 22</code></pre>
<p>因此被 ((1 2)) 固定的图有：</p>
<pre><code class="language-katex">2^{22}</code></pre>
<p>个。</p>
<p>这就是前面表格里 <code class="katex-inline">(2,1^6)</code> 类型对应 <code class="katex-inline">2^{22}</code> 的来源。</p>
