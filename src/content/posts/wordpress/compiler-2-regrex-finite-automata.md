---
title: "Compiler 2: Regrex, Finite Automata"
description: "语言运算 Regular Expression 形式语言 For describing Languages / Patterns if, else, ... 形式化定义正则表达式（regular expression, regexp），给出了一系列归纳规则（induction rules） Basic $\\epsilon$ is a regexp, $L(\\epsilon) = {\\epsilon}$ And if a is a sy…"
publishedAt: "2025-09-24T17:39:49Z"
category: "Compilers"
categories: ["Compilers"]
tags: []
author: "GB"
draft: false
slug: "compiler-2-regrex-finite-automata"
legacySlug: "compiler-2-regrex-finite-automata"
oldSlugs: []
wordpressId: 992
sourceUrl: "https://www.haibinlaiblog.top/index.php/compiler-2-regrex-finite-automata/"
commentCount: 0
viewCount: 834
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<h2>语言运算</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914233642169.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914234002944.png" alt="" /></p>
<h2>Regular Expression 形式语言</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914233024645.png" alt="" /></p>
<p>For describing Languages / Patterns
if, else, ...</p>
<p>形式化定义正则表达式（regular expression, regexp），给出了一系列归纳规则（induction rules）</p>
<p><strong>Basic</strong>
$\epsilon$ is a regexp, $L(\epsilon) = {\epsilon}$
And if a is a symbol in $\Sigma$, then a is a regexp and  $L(a) = {a}$
$\epsilon$ 是一个正则表达式，表示只包含空串的语言。
若 $a \in \Sigma$（符号表），则 $a$ 是正则表达式，表示语言 ${a}$。</p>
<p><strong>Induction</strong>
Union
$(r)|(s)$ is a regexp denoting the language $L(r) \cup L(s)$
$(r)(s)$ denotes $L(r)L(s)$
$(r)^<em>$ denotes $(L(r))^</em>$
$r = (r)$
给出如何从已有的正则表达式构造新的正则表达式：</p>
<ul>
<li><strong>并 (Union)</strong>：$(r)|(s)$ → $L(r) \cup L(s)$</li>
<li><strong>连接 (Concatenation)</strong>：$(r)(s)$ → $L(r)L(s)$</li>
<li><strong>Kleene star</strong>：$(r)^<em>$ → $(L(r))^</em>$</li>
<li><strong>括号 (Parentheses)</strong>：如果 $r$ 是正则表达式，那么 $(r)$ 也是正则表达式，且 $L((r)) = L(r)$。</li>
</ul>
<p>优先级 Precedence
closure* &gt; concatenation &gt; union
结合性 Associativity
左结合的 $a|b|c = (a|b) | c$</p>
<p>例子
$\Sigma = {a,b}$
$a|b$ denotes {a,b}
$(a|b)(a|b)$ denotes {aa, ab, ba, bb}
$a^<em>$ denotes ${\epsilon, a, aa, aaa, ...}$ （这里*就是任意大于等于0的数目，$a^0, a^1, ...$）
$(a|b)^</em>$ </p>
<p><strong>A regular language is a language that can be defined by a regexp</strong>
• If two regexps r and s denote the same language, they are equivalent,
written as r = s</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914232830350.png" alt="" /></p>
<h2><strong>Regular Definitions（正规定义/正则定义）</strong></h2>
<p>这是编译原理里 <strong>词法规则书写的一种方式</strong>，通常结合正则表达式（Regular Expressions, RE）来描述。</p>
<hr />
<h3>1. 定义</h3>
<ul>
<li>
<p><strong>Regular Definition</strong> 是一种“<strong>命名规则</strong>”的机制：<br />
我们可以用符号/名字给一个正则表达式（Pattern）起别名，后续在更复杂的规则中直接使用这个名字。</p>
</li>
<li>
<p>它其实就是 <strong>正则表达式的宏定义</strong>。</p>
</li>
</ul>
<h3>2. 形式</h3>
<p>通常写作：</p>
<pre><code>D → r</code></pre>
<ul>
<li><code>D</code>：定义的名字（类似宏/变量名）</li>
<li><code>r</code>：一个正则表达式</li>
</ul>
<h3>3. 示例</h3>
<p>在词法分析器里，很多语言会这么定义：</p>
<pre><code>letter     → A | B | ... | Z | a | b | ... | z
digit      → 0 | 1 | ... | 9
id         → letter (letter | digit)*
number     → digit+</code></pre>
<p>解释：</p>
<ul>
<li><code>letter</code> 定义了“字母”的正则模式。</li>
<li><code>digit</code> 定义了“数字”的正则模式。</li>
<li><code>id</code> 定义了 <strong>标识符</strong>：必须以字母开头，后面跟任意多个字母或数字。</li>
<li><code>number</code> 定义了 <strong>数字</strong>：由一个或多个数字组成。</li>
</ul>
<p>这样，当你写复杂规则时，不用每次都写长长的表达式，而是用名字简化。</p>
<hr />
<h3>4. 在编译器工具中的应用</h3>
<ul>
<li>
<p>在 <strong>Lex/Flex</strong> 工具中，就经常会用到 Regular Definitions：</p>
<pre><code class="language-lex">DIGIT    [0-9]
ID       [a-zA-Z][a-zA-Z0-9]*

%%
{DIGIT}+      { printf("NUM\n"); }
{ID}          { printf("IDENTIFIER\n"); }
%%</code></pre>
</li>
<li>这里 <code>DIGIT</code>、<code>ID</code> 就是 <strong>Regular Definitions</strong>。</li>
<li>在规则部分 <code>{DIGIT}+</code>、<code class="kb-btn">ID</code> 就可以直接使用。</li>
</ul>
<hr />
<h3>5. 和 Regular Expression 的区别</h3>
<ul>
<li><strong>Regular Expression（正则表达式）</strong>：是模式本身，用来描述字符集/语言。</li>
<li><strong>Regular Definition（正规定义）</strong>：给正则表达式起名字，方便复用。</li>
</ul>
<p>👉 可以理解为：</p>
<ul>
<li>RE = 具体的公式</li>
<li>RD = 定义公式的变量</li>
</ul>
<hr />
<p>✅ <strong>一句话总结</strong>：<br />
Regular Definitions 就是 <strong>把正则表达式起名字</strong>，像数学里给复杂公式设变量一样，用来简化词法规则的书写。</p>
<p>从 letter/digit → id/number → token</p>
<h3>C identifiers</h3>
<p>标识符是用户定义的名称，用于方便引用内存。它还用于定义程序中的各种元素，例如函数、用户定义类型、标签等。因此，标识符是帮助程序员更便捷地使用编程元素的名称。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914233358778.png" alt="" /></p>
<h2>Finite Automata</h2>
<p>有穷自动机</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914234241118.png" alt="" /></p>
<h3>NFA</h3>
<p>NFA（Nondeterministic Finite Automaton，非确定有限自动机）是<strong>编译原理</strong>里用于形式化描述正则语言的重要数学模型。它和 DFA（确定有限自动机）类似，但在状态转移时允许<strong>非确定性选择</strong>（同一个输入符号可能对应多个后继状态，也允许 ε-转移）。</p>
<p>一个 NFA 定义为一个五元组：</p>
<p>$M = (Q, \Sigma, \delta, q_0, F)$</p>
<ol>
<li>自然数可数，但是无穷。要一个这个state</li>
<li>input alphabet</li>
<li>transition function</li>
<li>start state</li>
<li>accepting state</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914234400677.png" alt="" /></p>
<p>图中的 nondeterminism: 在状态转移时允许<strong>非确定性选择</strong>（同一个输入符号可能对应多个后继状态，也允许 ε-转移）</p>
<p>(0,a): 我们看到我们在状态0，下一个字母是a，我们可以走0或者1</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914234801031.png" alt="" />
状态转换图</p>
<p>note: it's possible to have $\epsilon$ moves (not using a,b,c, etc)</p>
<p>状态转换表：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915000219034.png" alt="" />
$\phi$ means error/can't go there</p>
<p>For string x, NFA starts from a state, then ends at one ending state, then we say NFA accept this x
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915000648650.png" alt="" /></p>
<p>a a b b = $L((a|b)^* abb)$</p>
<p>what would happen if you go another path</p>
<p>how to translate the graph:</p>
<p>$a^<em> | b^</em>$
$\epsilon a a<em> | \epsilon b b</em>$ = a+|b+</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915001310036.png" alt="" /></p>
<h2>DFA</h2>
<p>DFA is a special NFA.
For every new symbol, we can only have one target state. 一个symbol只能走到一个特定状态</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915001442158.png" alt="" /></p>
<p>A good algorithm for simulating a DFA</p>
<p>time complexity: $O(n)$ , n denotes for length of string
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915001605233.png" alt="" /></p>
<p>DFA的问题problem: too complex for regular expression
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915002345562.png" alt="" /></p>
<h3>build lexical analyser NFA-&gt;DFA</h3>
<p>path explosion</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915002641091.png" alt="" /></p>
<p>why reg-&gt;NFA-&gt;DFA? why not Reg-&gt;DFA?
Too complex</p>
<p>So we have 2 algorithms: Thompson's construction+subset construction</p>
<p>Subset construction: expand solutions.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915003055287.png" alt="" /></p>
<p>you can go to 3,6,1,2,7,4,8, by reading a. </p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915003655617.png" alt="" /></p>
<p>move: from a state to another state</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915003751091.png" alt="" />
注意这里的 $if(u is not in \epsilon-closure(T))$ 如果存在一个自身连着并且是epsilon的边，就可以省略</p>
<p>So $\epsilon-closure(0) = {0,1,7,2,4}$</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915004323802.png" alt="" />
我们在找等价状态</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915004441042.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250915005015998.png" alt="" /></p>
<p><strong>NFA → DFA 的子集构造法之所以是一个不动点计算，是因为我们在有限状态集合上迭代一个单调扩展算子 FFF，直到达到“稳定状态” F(C)=CF(C) = CF(C)=C。这个稳定状态就是所有可达的 DFA 状态集合，也就是子集构造的最终结果。</strong></p>
