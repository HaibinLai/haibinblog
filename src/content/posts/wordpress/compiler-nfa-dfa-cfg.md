---
title: "Compiler 3: NFA, DFA, CFG"
description: "第一章最后一部分+CFG Convert NFA to DFA The algorithm here is to explore the state [1,2,3,4,6,7,8] 是在move[A,a]后能达到的所有状态 ![[Pasted image 20250921142734.png]] 我们用达到闭包的个数，来判定目前的状态 Start State A (We have 0), Accepting States E (We…"
publishedAt: "2025-09-25 01:35:23"
updatedAt: "2025-09-25 01:39:22"
category: "Compilers"
tags: []
draft: false
slug: "compiler-nfa-dfa-cfg"
legacySlug: "compiler-nfa-dfa-cfg"
wordpressId: 990
sourceUrl: "https://haibin-blog.vercel.app/index.php/compiler-nfa-dfa-cfg/"
commentCount: 0
importedFromWordPress: true
---
<p>第一章最后一部分+CFG</p>
<h2>Convert NFA to DFA</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/Pasted%20image%2020250921141443.png" alt="" />
The algorithm here is to explore the state</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/Pasted%20image%2020250921141930.png" alt="" /></p>
<p>[1,2,3,4,6,7,8] 是在move[A,a]后能达到的所有状态</p>
<p>![[Pasted image 20250921142734.png]]</p>
<p>我们用达到闭包的个数，来判定目前的状态
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/Pasted%20image%2020250921141930.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/Pasted%20image%2020250921143634.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/Pasted%20image%2020250921143656.png" alt="" /></p>
<p>Start State A (We have 0), Accepting States E (We have 10)</p>
<p>这样，我们就能找到一个DFA，其每一个输入，都会对应一个状态</p>
<h2>Regexp -&gt; NFA</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921144511047.png" alt="image.png" /></p>
<p>We can now construct a machine to recognize &quot;s|t&quot;
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921144925539.png" alt="image.png" /></p>
<p>How to represent &quot;st&quot;, use an intermediate state:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921145047062.png" alt="image.png" /></p>
<p>Kleene: 返回即可， s*
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921150528075.png" alt="image.png" /></p>
<h3>Example</h3>
<p>神奇的是，我们应该先构造子表达式，再构造顶层式子</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921151101574.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921151411066.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921151500719.png" alt="image.png" /></p>
<h2>Finite Automata</h2>
<h3>Combining NFAs</h3>
<p>In Lexical Analyzer, we will get many regular expression for different pattern</p>
<p>And we can do: Regexp -&gt; NFA</p>
<p>And we combine these NFAs using an union like combination
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921151822098.png" alt="image.png" /></p>
<p>Then for each NFA, convert them into DFA</p>
<h3>Example</h3>
<p>a {action A1 for pattern p1 }
abb {action A2 for pattern p2 }
a*b+ {p3}</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921152205282.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921152550565.png" alt="image.png" /></p>
<h2>Context-Free Grammars &amp;&amp; Syntax Analysis</h2>
<p>To see if we have syntax error
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921153106153.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921153244338.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921153736648.png" alt="image.png" /></p>
<p>例子：a+b</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250921154144413.png" alt="image.png" /></p>
<p>expression 可以是 expression + term
expression 可以是 term
term 可以是factor
factor可以是id
所以这个产生式可以产生 a+b</p>
<h3>推导 (Derivation)</h3>
<ul>
<li>
<p><strong>推导</strong>：从 <strong>开始符号 (Start Symbol)</strong> 出发，不断使用产生式 (Production Rules) 替换非终结符 (Nonterminals)，直到得到一个只包含 <strong>终结符 (Terminals)</strong> 的串。</p>
</li>
<li>
<p>最终得到的串就是属于该文法的一个 <strong>句子 (Sentence)</strong>。</p>
</li>
</ul>
<p>换句话说，推导就是一个逐步 <strong>展开</strong> 的过程，把抽象的语法规则一步步替换成具体的符号，直到得到实际的程序片段或字符串。</p>
<h3>2. 推导的形式</h3>
<p>如果我们有文法规则：</p>
<pre><code>Expr → Expr + Term | Term
Term → Term * Factor | Factor
Factor → ( Expr ) | id</code></pre>
<ul>
<li>
<p><strong>开始符号</strong>：<code>Expr</code></p>
</li>
<li>
<p><strong>推导过程</strong>（一个例子）：</p>
<pre><code>Expr
⇒ Expr + Term         （应用 Expr → Expr + Term）
⇒ Term + Term         （应用 Expr → Term）
⇒ Factor + Term       （应用 Term → Factor）
⇒ id + Term           （应用 Factor → id）
⇒ id + Factor         （应用 Term → Factor）
⇒ id + id             （应用 Factor → id）</code></pre>
</li>
<li>
<p>得到的句子：<code>id + id</code></p>
</li>
</ul>
<hr />
<h3>3. 两种常见推导方式</h3>
<ol>
<li>
<p><strong>左推导 (Leftmost Derivation)</strong>：每一步都替换最左边的非终结符。</p>
</li>
<li>
<p><strong>右推导 (Rightmost Derivation)</strong>：每一步都替换最右边的非终结符。</p>
</li>
</ol>
<p>上面例子就是一个左推导。<br />
不同推导方式得到的最终结果一样，但中间步骤不同。</p>
<hr />
<h3>4. 与语法树的关系</h3>
<ul>
<li>推导过程可以用 <strong>推导树 (Derivation Tree / Parse Tree)</strong> 来表示。</li>
<li>推导描述了“展开的过程”，语法树描述了“最终的结构”。</li>
</ul>
<p>👉 总结：<br />
<strong>Derivation = 从开始符号出发，用产生式一步步替换非终结符，直到只剩终结符。</strong><br />
它解释了一个字符串是如何根据 CFG 被“生成”的。</p>
<p>要不要我帮你画一个 <code>id + id</code> 的推导树 (Parse Tree)，让你直观理解 Derivation 和语法树的关系？</p>
