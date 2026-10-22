---
title: "Compiler 4: CFG, Parsing"
description: "CFG Terminal: 对应loop，对应if，对应XX Productions: 产生式 Derivation推导 CFG可以推导很多不同的式子 Notations Terminologies 文法的句型 这里我们看到，文法 最左推导 & 最右推导 在编译原理中， 最左推导 和 最右推导 都是从文法的开始符号（Start Symbol）出发，通过不断用产生式替换非终结符，逐步推导出一个句子的过程。区别在于： 每一步选择替换的非终…"
publishedAt: "2025-09-29T12:11:29Z"
category: "Compilers"
categories: ["Compilers"]
tags: ["CFG"]
author: "GB"
draft: false
slug: "compiler-4-cfg-parsing"
legacySlug: "compiler-4-cfg-parsing"
oldSlugs: []
wordpressId: 995
sourceUrl: "https://www.haibinlaiblog.top/index.php/compiler-4-cfg-parsing/"
commentCount: 0
viewCount: 1019
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/compiler-4-cfg-parsing.webp"
---
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929140734725.png" alt="image.png" /></p>
<h2>CFG</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921153244338.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921154144413.png" alt="image.png" /></p>
<p>Terminal: 对应loop，对应if，对应XX</p>
<p>Productions: 产生式</p>
<p>Derivation推导
CFG可以推导很多不同的式子</p>
<h2>Notations</h2>
<h2>Terminologies 文法的句型</h2>
<p>这里我们看到，文法</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929140801371.png" alt="image.png" /></p>
<h2>最左推导 &amp; 最右推导</h2>
<p>在编译原理中，<strong>最左推导</strong>和<strong>最右推导</strong>都是从文法的开始符号（Start Symbol）出发，通过不断用产生式替换非终结符，逐步推导出一个句子的过程。区别在于：<strong>每一步选择替换的非终结符的位置不同</strong>。</p>
<hr />
<h2>1. 最左推导（Leftmost Derivation）</h2>
<ul>
<li><strong>规则</strong>：在句子中，<strong>始终优先替换最左边的非终结符</strong>。</li>
<li><strong>意义</strong>：生成的过程是“从左到右”逐步展开非终结符。</li>
<li><strong>形式化记号</strong>：用 <code>⇒_lm</code> 表示。</li>
</ul>
<p><strong>例子</strong>：<br />
文法规则：</p>
<pre><code>S → AB
A → a
B → b</code></pre>
<p>推导字符串 <code>ab</code> 的最左推导：</p>
<pre><code>S ⇒_lm AB
  ⇒_lm aB     （替换最左边的非终结符 A）
  ⇒_lm ab     （替换 B）</code></pre>
<hr />
<h2>2. 最右推导（Rightmost Derivation）</h2>
<ul>
<li><strong>规则</strong>：在句子中，<strong>始终优先替换最右边的非终结符</strong>。</li>
<li><strong>意义</strong>：生成的过程是“从右到左”逐步展开非终结符。</li>
<li><strong>形式化记号</strong>：用 <code>⇒_rm</code> 表示。</li>
</ul>
<p><strong>例子</strong>：<br />
还是上面的文法，推导字符串 <code>ab</code> 的最右推导：</p>
<pre><code>S ⇒_rm AB
  ⇒_rm Ab     （替换最右边的非终结符 B）
  ⇒_rm ab     （替换 A）</code></pre>
<hr />
<h2>3. 区别与联系</h2>
<ul>
<li><strong>区别</strong>：
<ul>
<li>最左推导：每一步替换最左边的非终结符。</li>
<li>最右推导：每一步替换最右边的非终结符。</li>
</ul></li>
<li><strong>联系</strong>：
<ul>
<li>它们推导出的<strong>终结串（最终结果）是相同的</strong>，只不过推导过程不同。</li>
<li><strong>最左推导对应自顶向下的分析（Top-Down Parsing）</strong>，常用于递归下降分析。</li>
<li><strong>最右推导的逆过程对应自底向上的分析（Bottom-Up Parsing）</strong>，尤其是LR分析。</li>
</ul></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929141747084.png" alt="image.png" /></p>
<p>推导跟分析树是many - one
但是 leftmost / rightmost 跟分析树是 one to one</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929142708337.png" alt="image.png" /></p>
<h2>模糊的二义性 Ambiguity</h2>
<p>如果一个语句，它可以有两个语法分析树，那它就是Ambiguity</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929142822527.png" alt="image.png" /></p>
<p>The grammar of a programming language typically needs to be unambiguous</p>
<h2>CFGs are more powerful than regexp</h2>
<p>CFG are powerful, while regexp are more efficient</p>
<p>Every language that can be described by a regular expression can also be described by a grammar (i.e., every regular language is also a context-free language)</p>
<ol start="2">
<li>Some context-free languages cannot be described using regular expressions</li>
</ol>
<h2>RegExp = NFA -&gt; CFG 运用构造法证明</h2>
<p>Each regular language can be accepted by an NFA. We can construct a CFG to describe the language</p>
<p>对于每个state，我们能做一个nonterminal symbol $A_i$</p>
<p>对于每个跳转/变化，我们能构建 $A_i-&gt; \alpha A_j$</p>
<p>下图里左边是CFG，右边是NFA。</p>
<p>方法：</p>
<ol>
<li>根据0，1，2，3，构建：$A_0, A_1, A_2, A_3$
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929144307504.png" alt="image.png" /></li>
</ol>
<p>So:</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929144832881.png" alt="" />
Consider the string 𝒃𝒂𝒂𝒃𝒃: The process of the NFA accepting the sentence corresponds exactly to the derivation of the sentence from the grammar</p>
<h2>however,  CFG &gt; Regular Expression</h2>
<p>some Context free languages cannot be described using regulat experssions</p>
<p>ab, aabb, aaabbb，
编程出现：小括号大括号的匹配</p>
<p>你给的文法是：</p>
<p>$$[<br />
S \to aSb \mid ab<br />
]$$</p>
<p>我们来逐步解释它“在说什么”。</p>
<hr />
<h3>1. 推导规律</h3>
<ul>
<li>递归规则：<code>S -&gt; aSb</code><br />
表示在一个已经符合规则的串外面，再加一个 <code>a</code> 在最左边、一个 <code>b</code> 在最右边。</li>
<li>基础规则：<code>S -&gt; ab</code><br />
表示最基本的串是 <code>&quot;ab&quot;</code>。</li>
</ul>
<hr />
<h3>2. 能生成的串</h3>
<p>从最小的情况出发：</p>
<ul>
<li><code>S -&gt; ab</code></li>
<li><code>S -&gt; aSb -&gt; a (ab) b = aabb</code></li>
<li><code>S -&gt; aSb -&gt; a(aSb)b = aaabb b = aaabbb</code></li>
<li><code>S -&gt; aSb -&gt; a(a(a b b) b) ...</code> 依次类推</li>
</ul>
<p>所以生成的串是：</p>
<pre><code>ab, aabb, aaabbb, aaaabbbb, ...</code></pre>
<hr />
<h3>3. 总结规律</h3>
<p>这个 CFG 生成的语言是：<br />
$$[<br />
L = { a^n b^n ;\mid; n \geq 1 }<br />
]$$</p>
<p>也就是说：<strong>数量相等的 a 和 b，先全是 a，再全是 b</strong>。<br />
它表达的是“左右对称、个数匹配”的一种结构。</p>
<hr />
<p>要不要我帮你画出这个文法的推导树（比如 <code>aaabbb</code> 的最左推导和推导树）
左推导</p>
<pre><code>S
⇒ a S b
⇒ a a S b b
⇒ a a a b b b      （把最左侧的 S 用 ab 代换）
⇒ aaabbb
</code></pre>
<p>Parse Tree</p>
<pre><code>S
├── a
├── S
│   ├── a
│   ├── S
│   │   ├── a
│   │   └── b
│   └── b
└── b
</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929150401221.png" alt="image.png" />
如何证明找不到这个语言？反证法</p>
<p>假设我找到了：</p>
<p>我们中间有一个状态，它是一定会被匹配两次的，分别是字符串 a_i 和 a_j （为什么会被匹配两次呢，因为状态数）</p>
<p>设语言 LLL 是正则的，那么必然存在一个确定有限自动机 (DFA) D 来识别它。<br />
这个 DFA 有 k 个状态。</p>
<ol start="2">
<li>处理长串时的状态重复</li>
</ol>
<p>考虑一个输入串，比如 $s=a^{k+1} b^{k+1} ∈L$。（其实我们可以取 K+2，K+3，K+XXXX状态， 都没关系，说白了就是有限自动机无法表示无限的状态）</p>
<ul>
<li>当 DFA 读入前 k+1 个 <code>a</code> 的时候，它总共会“走” k+1 步。</li>
<li>但 DFA 只有 k 个状态。</li>
<li>
<p>根据<strong>鸽巢原理</strong>，在这 k+1 步里，必然有两个时刻落在同一个状态。</p>
<ul>
<li>比如读完前 i 个 <code>a</code> 和读完前 j 个 <code>a</code>（i&lt;j）都到达了状态 s。</li>
</ul>
</li>
</ul>
<blockquote>
<p>形式语言理论里有一个工具叫 <strong>抽取引理（Pumping Lemma for Regular Languages）</strong>，用它能证明 <code>a^n b^n</code> 不是正规语言：</p>
<ul>
<li>假设 <code>a^n b^n</code> 是正则的。</li>
<li>根据抽取引理，可以把一个足够长的串（比如 <code>a^p b^p</code>）分成三段 <code>xyz</code>，其中中间的 <code>y</code> 可以抽取（重复任意次）而仍然属于语言。</li>
<li>但如果 <code>y</code> 只包含 a，那么多抽几次就会变成 <code>a^(p+|y|) b^p</code>，a 和 b 数量不再相等 → 矛盾。</li>
<li>所以 <code>a^n b^n</code> 不是正则语言。</li>
</ul>
</blockquote>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929151602864.png" alt="image.png" /></p>
<p>那么我们就能匹配上 a_i b_j，但是这不是正则表达式想要的</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929151443225.png" alt="image.png" /></p>
<h2>Top-Down Parsing</h2>
<p>Problem definition: Constructing a parse tree for the input string, starting from the root and creating the nodes of the parse tree in <strong>preorder (depth-first)</strong></p>
<p>要根据输入的string，构建一个语法生成树</p>
<p>Two basic actions in top-down parsing:
§ Predict: Determine the production to be applied for the leftmost nonterminal* (of the current parse tree’s frontier)
§ Match: Match the leading terminals in the chosen production’s body with the input string</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929152722418.png" alt="image.png" /></p>
<p>Parsing 例子：</p>
<p>用几个语法Grammar Symbol，我们就能匹配 input string</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929153606469.png" alt="image.png" /></p>
<p>永远是一个最左的句型（最左推导：每一步替换最左边的非终结符。）
We can make two observations from the example:
• Top-down parsing <strong>is equivalent to finding a leftmost derivation</strong>.
• At each step, the frontier of the tree is a left-sentential form.</p>
<p>问题：你怎么知道选谁？</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929154050727.png" alt="image.png" /></p>
<h2>方法：Recursive-descent parsing</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929154212870.png" alt="image.png" /></p>
<p>搜索方法：</p>
<ol>
<li>选择一种 A-production 分解方法，将 A分解为 X_1, X_2, ... X_k</li>
<li>每个X分别的去处理
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250929154323522.png" alt="image.png" />
例子：
A. 先选S，我们选择 S-&gt;cAd
for (c,a,b,d):
call S() -&gt; match &quot;c&quot;，c是一个terminal
下一步循环，找到“A”，A不是nonterminal，call A() —— for（a,b） match -&gt; return
match &quot;d&quot; -&gt; S() return</li>
</ol>
<p>递归下降：
递归，有可能调用到自己
下降：不断的调方法分解</p>
