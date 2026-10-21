---
title: "Compiler: Intro"
description: "Operations on Languages Languages: accountable for strings Lexer Lexical Analyzer（词法分析器，也叫 Scanner）在编译器中扮演着 前端第一步的角色 。它的主要任务是把源代码（程序员写的字符序列）转化为 Token 序列 ，供后续的语法分析器（Parser）使用。下面我分点介绍它的作用： 1. 输入与输出 输入 ：源程序（字符流，如 if (x > 0…"
publishedAt: "2025-09-17 15:28:00"
category: "Compilers"
tags: ["gcc"]
draft: false
slug: "compiler-intro"
legacySlug: "compiler-intro"
wordpressId: 987
sourceUrl: "https://www.haibinlaiblog.top/index.php/compiler-intro/"
commentCount: 0
importedFromWordPress: true
---
<p>Operations on Languages
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917151402729.png" alt="" /></p>
<p>Languages: accountable for strings</p>
<h2>Lexer</h2>
<p>Lexical Analyzer（词法分析器，也叫 Scanner）在编译器中扮演着 <strong>前端第一步的角色</strong>。它的主要任务是把源代码（程序员写的字符序列）转化为 <strong>Token 序列</strong>，供后续的语法分析器（Parser）使用。下面我分点介绍它的作用：</p>
<h3>1. 输入与输出</h3>
<ul>
<li><strong>输入</strong>：源程序（字符流，如 <code>if (x &gt; 0) y = y + 1;</code>）</li>
<li><strong>输出</strong>：Token 序列（如 <code>IF, (, ID[x], &gt;, NUM[0], ), ID[y], =, ID[y], +, NUM[1], ;</code>）</li>
</ul>
<h3>2. 主要功能</h3>
<ol>
<li><strong>扫描源程序</strong>
从左到右逐个读取字符，识别出有意义的词素（lexeme），如关键字 <code>if</code>、标识符 <code>x</code>、常数 <code>0</code>。</li>
<li><strong>生成 Token</strong>
每个词素会被归类为某种类型的 Token（如关键字、标识符、常数、运算符等），并可能带有属性值（如变量名、具体数值）。</li>
<li><strong>删除无关内容</strong>
过滤掉 <strong>空格、换行、注释</strong> 等对语法分析无用的信息。</li>
<li><strong>错误处理</strong>
如果遇到非法字符（如 <code>@</code> 出现在 C 代码中），会报错并尽量恢复继续扫描。</li>
</ol>
<h3>3. 在编译器中的作用</h3>
<ul>
<li>词法分析器相当于编译器的“<strong>分词器</strong>”，把原始的 <strong>字符流</strong> 转化成 <strong>结构化的 Token 流</strong>。</li>
<li>这样，后续的语法分析器就可以基于 Token 进行上下文无关文法（CFG）的语法解析，而不用处理复杂的字符细节。</li>
</ul>
<p>例如：
源代码：</p>
<pre><code>while (count &lt; 10) count = count + 1;</code></pre>
<p>Lexical Analyzer 输出：</p>
<pre><code>[WHILE], [(], [ID, &quot;count&quot;], [&lt;], [NUM, 10], [)], [ID, &quot;count&quot;], [=], [ID, &quot;count&quot;], [+], [NUM, 1], [;]</code></pre>
<h3>4. 工具与实现</h3>
<p>在实践中，词法分析器常用 <strong>有限状态自动机（DFA）</strong> 来实现。
编译原理课里常见的工具有：</p>
<ul>
<li><strong>Lex / Flex</strong>：自动生成词法分析器</li>
<li><strong>ANTLR</strong>：现代语言工具，支持词法和语法规则</li>
</ul>
<p>✅ <strong>一句话总结</strong>：Lexical Analyzer 的作用就是把源代码转化为 Token 流，充当编译器“读懂单词”的第一步。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250914232317195.png" alt="" /></p>
<h2>Token Pattern Lexeme</h2>
<p>编译原理老师经常会一起讲：<strong>Token、Pattern、Lexeme</strong>。我分开解释，并说明它们的联系。</p>
<h3>1. Token（记号）</h3>
<ul>
<li><strong>定义</strong>：Token 是词法分析器输出的“种类化单元”。</li>
<li><strong>作用</strong>：相当于“词法类别”，表示源程序中一个最小的有意义单元。</li>
<li>
<p><strong>例子</strong>：</p>
<ul>
<li><code>if</code> → <strong>Token</strong>: <code>IF</code>（关键字）</li>
<li><code>x</code> → <strong>Token</strong>: <code>ID</code>（标识符）</li>
<li><code>123</code> → <strong>Token</strong>: <code>NUM</code>（数字常量）</li>
<li><code>+</code> → <strong>Token</strong>: <code>PLUS</code>（运算符）</li>
</ul>
</li>
</ul>
<p>👉 可以把 Token 理解为“标签/类别”。</p>
<p>注意跟LLM token，是有区别的：</p>
<table>
<thead>
<tr>
<th>维度</th>
<th>编译器 Token</th>
<th>LLM Token</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>来源</strong></td>
<td>源代码字符流</td>
<td>自然语言文本</td>
</tr>
<tr>
<td><strong>切分依据</strong></td>
<td>严格定义的词法规则</td>
<td>数据驱动的分词算法（BPE、SentencePiece）</td>
</tr>
<tr>
<td><strong>语义性</strong></td>
<td>对应语言文法中的基本语法单位（关键字、标识符等）</td>
<td>只是统计学上的子词单元，语义不一定完整</td>
</tr>
<tr>
<td><strong>用途</strong></td>
<td>作为编译器语法分析的输入</td>
<td>作为神经网络的输入序列</td>
</tr>
<tr>
<td><strong>粒度</strong></td>
<td>比较大（关键字、变量、符号等）</td>
<td>可能很小（一个字母/子词），也可能较大（整个单词）</td>
</tr>
<tr>
<td><strong>唯一性</strong></td>
<td>每类 token 有唯一明确的 TokenType</td>
<td>不同语料/模型的 token 化方式可能完全不同</td>
</tr>
</tbody>
</table>
<h3>2. Pattern（模式）</h3>
<ul>
<li><strong>定义</strong>：Pattern 是描述某类 Token 的<strong>规则</strong>（通常用正则表达式）。</li>
<li>
<p><strong>例子</strong>：</p>
<ul>
<li>关键字 <code>if</code> → Pattern 就是字符串 <code>&quot;if&quot;</code></li>
<li>标识符 <code>ID</code> → Pattern 可能是：
<pre><code>letter (letter | digit)*</code></pre>
<p>（即以字母开头，后面跟若干字母或数字）</p></li>
<li>整数 <code>NUM</code> → Pattern 可能是：
<pre><code>digit+</code></pre></li>
</ul>
<p>（一个或多个数字）</p>
</li>
</ul>
<p>👉 可以把 Pattern 理解为“描述 Token 的正则定义”。</p>
<h3>3. Lexeme（词素）</h3>
<ul>
<li><strong>定义</strong>：Lexeme 是<strong>实际出现在源程序中的具体字符序列</strong>，与某个 Token 相匹配。</li>
<li><strong>例子</strong>：
<ul>
<li>在 <code>if (x &gt; 10)</code> 里：</li>
<li><code>if</code> 是一个 Lexeme，对应 Token <code>IF</code></li>
<li><code>x</code> 是一个 Lexeme，对应 Token <code>ID</code></li>
<li><code>10</code> 是一个 Lexeme，对应 Token <code>NUM</code>
👉 可以把 Lexeme 理解为“程序中真正的单词实例”。</li>
</ul></li>
</ul>
<p>在编译原理里，<strong>Lexical Errors</strong>（词法错误） 指的是 词法分析阶段 发现的错误。它们通常出现在源程序的字符流里，不符合词法规则（Pattern） 的地方。</p>
<h3>4. 三者关系总结</h3>
<p>一句话总结三者关系：</p>
<ul>
<li>
<p><strong>Token</strong> = 类别（抽象类型）</p>
</li>
<li>
<p><strong>Pattern</strong> = 描述这个类别的规则（正则/文法）</p>
</li>
<li>
<p><strong>Lexeme</strong> = 源代码中出现的具体实例</p>
</li>
<li>
<p><strong>Pattern（规则）</strong> → 定义一类 Token 的形式化描述（如 <code>digit+</code>）</p>
</li>
<li>
<p><strong>Token（类别）</strong> → 词法分析器输出的抽象类型（如 <code>NUM</code>）</p>
</li>
<li>
<p><strong>Lexeme（实例）</strong> → 程序中实际出现的字符串（如 <code>123</code>）
<strong>Pattern 定义 Token，Token 匹配 Lexeme</strong>。</p>
</li>
</ul>
<p>例如：</p>
<table>
<thead>
<tr>
<th>源代码片段</th>
<th>Lexeme</th>
<th>Token</th>
<th>Pattern</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>if</code></td>
<td><code>if</code></td>
<td><code>IF</code></td>
<td>关键字 <code>&quot;if&quot;</code></td>
</tr>
<tr>
<td><code>count</code></td>
<td><code>count</code></td>
<td><code>ID</code></td>
<td>\<code>letter (letter digit)\*\</code></td>
</tr>
<tr>
<td><code>123</code></td>
<td><code>123</code></td>
<td><code>NUM</code></td>
<td><code>digit+</code></td>
</tr>
<tr>
<td><code>+</code></td>
<td><code>+</code></td>
<td><code>PLUS</code></td>
<td><code>\+</code></td>
</tr>
</tbody>
</table>
<p>✅ <strong>一句话记忆法</strong>：</p>
<ul>
<li>Token：<strong>抽象种类</strong></li>
<li>Pattern：<strong>种类的规则</strong></li>
<li>Lexeme：<strong>程序里的具体单词</strong></li>
</ul>
<h2>Lexical Example</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917151757202.png" alt="" /></p>
<h2>Syntax Analysis 语法分析，建立分析树</h2>
<p>build a syntax tree</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917151925852.png" alt="" /></p>
<h2>语义分析</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152009057.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152023383.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152036708.png" alt="" /></p>
<h3>例子：分析 type</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152106057.png" alt="" /></p>
<p>三地址码是编译器常见的一种 <strong>中间表示 (IR, Intermediate Representation)</strong>。<br />
它把源程序翻译成一种 <strong>类似汇编语言的伪代码</strong>，每条语句最多包含 <strong>三个地址/操作数</strong>：</p>
<ul>
<li>一个 <strong>结果地址</strong></li>
<li>两个 <strong>源操作数</strong></li>
</ul>
<p>形式大致是：
<code>x = y op z</code>
其中 <code>x</code>、<code>y</code>、<code>z</code> 可以是变量名、临时变量或常量；<code>op</code> 是运算符（+、-、*、/ 等）。</p>
<hr />
<ol start="2">
<li>为什么用三地址码</li>
</ol>
<ul>
<li><strong>易于优化</strong>：比源代码简洁，保留了程序结构信息，方便编译器做常量折叠、公共子表达式消除等优化。</li>
<li><strong>独立于机器</strong>：不依赖具体 CPU 指令集，可以在生成目标代码前做多层优化。</li>
<li><strong>便于映射到汇编</strong>：三地址码的形式和汇编指令很接近（load、store、add 等）。</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152209217.png" alt="" /></p>
<h2>机器无关的优化</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152332167.png" alt="" /></p>
<h2>最终机器 代码生成</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917152345870.png" alt="" /></p>
