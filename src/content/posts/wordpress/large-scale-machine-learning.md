---
title: "Large Scale Machine Learning"
description: "机器学习优化公式学习笔记 主题：Lipschitz 连续性、Lipschitz smoothness、quadratic upper bound（descent lemma）、strong convexity、PL inequality，以及梯度下降的一步下降、contraction、linear/geometric convergence 和 condition number。 记号约定：目标函数为 F: R^d -> R ，梯度为…"
publishedAt: "2026-10-01 03:08:22"
updatedAt: "2026-10-01 03:41:37"
category: "Machine Learning"
tags: ["AI", "ML"]
draft: false
slug: "large-scale-machine-learning"
legacySlug: "large-scale-machine-learning"
wordpressId: 1687
sourceUrl: "https://www.haibinlaiblog.top/index.php/large-scale-machine-learning/"
commentCount: 0
importedFromWordPress: true
---
<h1>机器学习优化公式学习笔记</h1>
<blockquote>
<p>主题：Lipschitz 连续性、Lipschitz smoothness、quadratic upper bound（descent lemma）、strong convexity、PL inequality，以及梯度下降的一步下降、contraction、linear/geometric convergence 和 condition number。</p>
<p>记号约定：目标函数为 <code>F: R^d -&gt; R</code>，梯度为 <code>∇F(x)</code>，最优点为 <code>x*</code>，步长为 <code>η &gt; 0</code>。这里统一用 <code>L</code> 表示 smoothness 常数，用 <code>c</code> 表示强凸或 PL 常数。</p>
</blockquote>
<h2>0. 总体逻辑</h2>
<p>这些公式连接成一条证明链：</p>
<ol>
<li><strong>Lipschitz 连续梯度</strong>给出曲率上界 <code>L</code>。</li>
<li>曲率上界推出 <strong>quadratic upper bound / descent lemma</strong>。</li>
<li><strong>梯度下降更新</strong>代入这个上界，得到每一步的函数下降量。</li>
<li><strong>PL inequality</strong>把梯度大小和当前 optimality gap 联系起来。</li>
<li>因此 optimality gap 每一步都按固定比例缩小，得到 <strong>contraction</strong> 和 <strong>linear/geometric convergence</strong>。</li>
<li>比例中的 <code>L/c</code> 形成 <strong>condition number</strong>，它衡量问题的病态程度和收敛速度。</li>
</ol>
<p>需要区分：smoothness 控制“梯度变化不能太快”，strong convexity 控制“函数不能太平”，而 PL inequality 直接控制“梯度是否足够大”。</p>
<hr />
<h2>1. Lipschitz continuity</h2>
<h3>定义</h3>
<p>函数 <code>F</code> 是 Lipschitz continuous（Lipschitz 连续）的，如果存在常数 <code>G ≥ 0</code>，使得对任意 <code>x,y</code>：</p>
<p><code>|F(x) - F(y)| ≤ G ||x-y||</code>。</p>
<p>如果讨论的是梯度，则常见形式是：</p>
<p><code>||∇F(x) - ∇F(y)|| ≤ L ||x-y||</code>。</p>
<p>后一个性质通常称为 <strong>Lipschitz continuous gradient</strong>，也叫 <strong><code>L</code>-smoothness</strong>。严格说，“函数 Lipschitz 连续”和“梯度 Lipschitz 连续”不是同一件事。</p>
<h3>推导和思考</h3>
<p>函数 Lipschitz 连续意味着函数值变化至多与距离成正比；梯度 Lipschitz 连续意味着局部斜率变化至多与距离成正比。</p>
<p>在一维情况下，如果 <code>F&#039;</code> 是 <code>L</code>-Lipschitz：</p>
<p><code>|F&#039;(x) - F&#039;(y)| ≤ L |x-y|</code>，</p>
<p>那么从 <code>y</code> 移动到 <code>x</code> 时，斜率的变化受到 <code>L</code> 的控制。这正是后面二次项 <code>(L/2)||x-y||²</code> 出现的原因。</p>
<h3>直觉</h3>
<ul>
<li>函数 Lipschitz：图像整体不能突然竖直上升或下降。</li>
<li>梯度 Lipschitz：图像的斜率不能突然改变，曲率被 <code>L</code> 限制。</li>
</ul>
<p>可以把 <code>L</code> 理解成“最坏情况下的弯曲程度”。</p>
<h3>假设</h3>
<ul>
<li>定义域通常取凸集，方便讨论线段 <code>y+t(x-y)</code>。</li>
<li>若要使用梯度形式，需要 <code>F</code> 可微。</li>
<li>Lipschitz 常数不一定是最小值；只要取一个有效上界即可。</li>
</ul>
<h3>常见易错点</h3>
<ol>
<li>把 <code>|F(x)-F(y)| ≤ G||x-y||</code> 和 <code>||∇F(x)-∇F(y)|| ≤ L||x-y||</code> 当成同一个条件。</li>
<li>认为 <code>L</code> 越小函数值一定越小。<code>L</code> 描述的是曲率上界，不是函数的绝对大小。</li>
<li>忘记范数必须前后一致；欧氏范数对应后续最常见的梯度下降推导。</li>
</ol>
<h3>例子：线性函数</h3>
<p>令 <code>F(x)=aᵀx+b</code>。则 <code>∇F(x)=a</code>，所以 <code>||∇F(x)-∇F(y)||=0</code>，其梯度 Lipschitz 常数可以取 <code>L=0</code>。函数本身在欧氏范数下满足 <code>|F(x)-F(y)|≤||a|| ||x-y||</code>。</p>
<hr />
<h2>2. Lipschitz smoothness</h2>
<h3>定义</h3>
<p>可微函数 <code>F</code> 是 <code>L</code>-smooth 的，如果：</p>
<p><code>||∇F(x)-∇F(y)|| ≤ L||x-y||</code></p>
<p>对任意 <code>x,y</code> 成立。</p>
<p>若 <code>F</code> 二阶可微，一个常用的充分条件是 <code>||∇²F(x)||op ≤ L</code>。对凸函数，常写成 <code>0 ⪯ ∇²F(x) ⪯ LI</code>。</p>
<h3>推导和思考</h3>
<p>沿着线段定义 <code>φ(t)=F(y+t(x-y))</code>。则 <code>φ&#039;(t)=∇F(y+t(x-y))ᵀ(x-y)</code>，并且</p>
<p><code>F(x)-F(y)=∫₀¹ ∇F(y+t(x-y))ᵀ(x-y) dt</code>。</p>
<p>加上并减去 <code>∇F(y)</code>，使用 Cauchy–Schwarz 和 smoothness：</p>
<p><code>F(x)-F(y) ≤ ∇F(y)ᵀ(x-y) + ∫₀¹ Lt ||x-y||² dt</code></p>
<p><code>= ∇F(y)ᵀ(x-y) + (L/2)||x-y||²</code>。</p>
<p>这就得到下一节的 quadratic upper bound。</p>
<h3>直觉</h3>
<p>smoothness 不表示函数一定凸。它只说明从 <code>y</code> 走到 <code>x</code> 时，真实函数值不会超过“切平面 + 一个二次曲率缓冲项”。</p>
<h3>假设</h3>
<ul>
<li><code>F</code> 可微；</li>
<li>梯度在所考虑的区域上是 <code>L</code>-Lipschitz；</li>
<li>线段上的点仍处于定义域内。</li>
</ul>
<h3>常见易错点</h3>
<ul>
<li>smoothness 与 convexity 是不同性质：一个函数可以 smooth 但非凸。</li>
<li>二阶可微时，不能只看某一个 Hessian 元素；要控制整体算子范数。</li>
<li><code>L</code> 是上界，实际局部曲率可能远小于 <code>L</code>。</li>
</ul>
<h3>例子：二次函数</h3>
<p>令 <code>F(x)=1/2 xᵀAx+bᵀx+d</code>，其中 <code>A</code> 对称。则 <code>∇F(x)=Ax+b</code>，所以 <code>L=||A||op</code> 是一个有效 smoothness 常数。若 <code>A ⪰ 0</code>，函数还是凸的；若 <code>A ≻ 0</code>，它还会强凸。</p>
<hr />
<h2>3. Quadratic upper bound / Descent lemma</h2>
<h3>定理</h3>
<p>若 <code>F</code> 是 <code>L</code>-smooth，则对任意 <code>x,y</code>：</p>
<p><code>F(x) ≤ F(y) + ∇F(y)ᵀ(x-y) + (L/2)||x-y||²</code>。</p>
<p>这称为 quadratic upper bound，也常称为 descent lemma。</p>
<h3>推导</h3>
<p>沿线积分并拆出 <code>∇F(y)</code>：</p>
<p><code>F(x)-F(y)=∫₀¹∇F(y+t(x-y))ᵀ(x-y)dt</code></p>
<p><code>≤ ∇F(y)ᵀ(x-y)+∫₀¹ Lt||x-y||²dt</code></p>
<p><code>= ∇F(y)ᵀ(x-y)+(L/2)||x-y||²</code>。</p>
<h3>直觉</h3>
<p>右侧由三部分组成：当前函数值、切平面的线性预测、曲率造成的最坏情况二次修正。因此它是一个“不会低估真实函数值”的二次上界。</p>
<h3>假设</h3>
<p>核心假设是 <code>L</code>-smoothness（以及可微、线段在定义域内）。不需要 strong convexity，也不需要函数凸。</p>
<h3>常见易错点</h3>
<ol>
<li>不等号方向写反；这里是函数值小于等于二次上界。</li>
<li>二次项系数漏掉 <code>1/2</code>，它来自 <code>∫₀¹ t dt=1/2</code>。</li>
<li>把 <code>L</code> 换成 strong convexity 常数 <code>c</code>；上界用 <code>L</code>，下界通常用 <code>c</code>。</li>
</ol>
<h3>例子：一维平方函数</h3>
<p>令 <code>F(x)=1/2 ax²</code>，其中 <code>a&gt;0</code>。此时 <code>L=a</code>，并且二次上界取等号，因为二次函数的曲率处处正好等于 <code>a</code>。</p>
<hr />
<h2>4. Strong convexity</h2>
<h3>定义</h3>
<p>函数 <code>F</code> 是 <code>c</code>-strongly convex 的，如果对任意 <code>x,y</code>：</p>
<p><code>F(x) ≥ F(y)+∇F(y)ᵀ(x-y)+(c/2)||x-y||²</code>，其中 <code>c&gt;0</code>。</p>
<p>若 <code>F</code> 二阶可微，常用等价条件是 <code>∇²F(x) ⪰ cI</code>。</p>
<h3>从最优点得到的下界</h3>
<p>设 <code>x*</code> 是全局最优点，且 <code>∇F(x*)=0</code>。在定义中取 <code>y=x*</code>：</p>
<p><code>F(x)-F(x*) ≥ (c/2)||x-x*||²</code>。</p>
<p>这说明函数值差距至少按距离的平方增长。</p>
<h3>由强凸性推出 PL inequality</h3>
<p>在 <code>L</code>-smooth、<code>c</code>-strongly convex 的标准设置下，可得到：</p>
<p><code>||∇F(x)||² ≥ 2c(F(x)-F(x*))</code>。</p>
<p>这就是 PL inequality。对一般函数，PL 可以独立成立，并不一定要求函数本身 convex；但 strong convexity 通常能推出它。</p>
<h3>直觉</h3>
<p>强凸性表示函数像一个至少有固定碗底曲率的碗：不会出现无限长的平坦方向。因此最优点通常唯一，且离最优点越远，函数值差距不能太小。</p>
<h3>假设</h3>
<ul>
<li><code>c&gt;0</code>；</li>
<li>定义域通常为凸集；</li>
<li>若使用 Hessian 形式，需要二阶可微；</li>
<li>全局最优点 <code>x*</code> 存在。</li>
</ul>
<h3>常见易错点</h3>
<ul>
<li>凸函数只要求 <code>c=0</code> 的下界；强凸要求 <code>c&gt;0</code>。</li>
<li><code>c</code> 不是函数值，也不是步长。</li>
<li>强凸性给出函数下界，不等于直接给出梯度下降更新式。</li>
<li>非凸函数也可能满足 PL，因此 PL 与 strong convexity 不能简单画等号。</li>
</ul>
<h3>例子：正定二次函数</h3>
<p>令 <code>F(x)=1/2 xᵀAx</code>，其中 <code>A ≻ 0</code>。若 <code>A</code> 的最小和最大特征值分别为 <code>λmin, λmax</code>，则 <code>c=λmin</code>、<code>L=λmax</code>。最优点是 <code>x*=0</code>。</p>
<hr />
<h2>5. PL inequality</h2>
<h3>定义</h3>
<p>若存在 <code>c&gt;0</code>，使得对任意 <code>x</code>：</p>
<p><code>2c(F(x)-F(x*)) ≤ ||∇F(x)||²</code>，</p>
<p>则称 <code>F</code> 满足 Polyak–Łojasiewicz（PL）不等式。</p>
<h3>推导思路</h3>
<p>PL 把两个量联系起来：左侧是当前 optimality gap，右侧是梯度平方。等价地：</p>
<p><code>F(x)-F(x*) ≤ (1/(2c))||∇F(x)||²</code>。</p>
<p>所以只要函数值还离最优值很远，梯度就不能太小。梯度下降正是沿着梯度方向移动，因此这条关系可以把“梯度下降了多少”转成“函数差距下降了多少”。</p>
<h3>直觉</h3>
<p>PL 是梯度下降获得几何收敛所需的“梯度不会无故消失”条件。它不一定保证所有等高线都是标准凸碗，但保证了只要还没有达到最优值，梯度就保留足够大的信号。</p>
<h3>假设</h3>
<ul>
<li><code>F(x*)</code> 是全局最优值；</li>
<li><code>c&gt;0</code>；</li>
<li>若要与 descent lemma 连用，还需要 <code>L</code>-smoothness；</li>
<li>若从 strong convexity 推出 PL，则还需相应的强凸假设。</li>
</ul>
<h3>常见易错点</h3>
<ol>
<li>PL 不等于 <code>F</code> 本身强凸；PL 可以在某些非凸问题上成立。</li>
<li>不要把 <code>||∇F(x)||</code> 和 <code>||∇F(x)||²</code> 混用，系数 <code>2c</code> 会随之改变。</li>
<li><code>x*</code> 表示最优点，不是当前迭代点 <code>xt</code>。</li>
<li>代入负系数时要注意不等号方向。</li>
</ol>
<h3>例子：平方损失</h3>
<p>令 <code>F(x)=c/2 ||x||²</code>，其最优点为 <code>x*=0</code>，梯度为 <code>cx</code>。于是 <code>||∇F(x)||²=c²||x||²=2cF(x)</code>，PL 不等式在此处取等号。</p>
<hr />
<h2>6. 一步梯度下降的函数下降</h2>
<h3>更新规则</h3>
<p><code>x_{t+1}=x_t-η∇F(x_t)</code>，因此 <code>x_{t+1}-x_t=-η∇F(x_t)</code>。</p>
<h3>从 descent lemma 开始</h3>
<p>令 <code>x=x_{t+1}</code>、<code>y=x_t</code>：</p>
<p><code>F(x_{t+1})-F(x_t) ≤ ∇F(x_t)ᵀ(x_{t+1}-x_t) + (L/2)||x_{t+1}-x_t||²</code>。</p>
<p>代入更新量：</p>
<p><code>F(x_{t+1})-F(x_t) ≤ -η||∇F(x_t)||² + (Lη²/2)||∇F(x_t)||²</code></p>
<p><code>= -η(1-Lη/2)||∇F(x_t)||²</code>。</p>
<p>因此：</p>
<p><code>F(x_{t+1})-F(x_t) ≤ -η(1-Lη/2)||∇F(x_t)||²</code>。</p>
<h3>步长条件</h3>
<p>当 <code>0&lt;η≤2/L</code> 时，右侧非正，所以 <code>F(x_{t+1})≤F(x_t)</code>。若进一步取 <code>0&lt;η≤1/L</code>，则 <code>1-Lη/2≥1/2</code>，结合 PL 得：</p>
<p><code>F(x_{t+1})-F(x_t) ≤ -ηc(F(x_t)-F(x*))</code>。</p>
<p>注意：这里用到了负系数乘以下界时的不等号方向：</p>
<p><code>-η(1-Lη/2)||∇F(x_t)||² ≤ -η(1-Lη/2)·2c(F(x_t)-F(x*))</code>。</p>
<h3>直觉</h3>
<p>梯度方向是局部下降最快的方向。第一项 <code>-η||∇F||²</code> 表示线性下降；第二项 <code>+Lη²||∇F||²/2</code> 是函数弯曲产生的代价。步长太大时，曲率代价会抵消甚至超过线性下降。</p>
<h3>假设</h3>
<ul>
<li><code>F</code> 是 <code>L</code>-smooth；</li>
<li>使用 GD 更新；</li>
<li>若要得到 gap 形式，还需 PL inequality；</li>
<li>若要使用简洁的 <code>-ηc</code> 系数，通常取 <code>η≤1/L</code>。</li>
</ul>
<h3>常见易错点</h3>
<ul>
<li>只看到负的线性项，就断言任意步长都下降；二次项可能使结论失效。</li>
<li><code>η≤2/L</code> 常用于保证单步不增；<code>η≤1/L</code> 便于得到 contraction。</li>
<li>“函数值不增加”不等于“已经收敛到最优”。</li>
</ul>
<h3>例子：一维平方函数</h3>
<p>对 <code>F(x)=1/2 ax²</code>，有 <code>L=c=a</code>，更新为 <code>x_{t+1}=(1-ηa)x_t</code>。当 <code>0&lt;η&lt;2/a</code> 时函数值不增加；取 <code>η=1/a</code> 时一步到达 <code>x*=0</code>。</p>
<hr />
<h2>7. Contraction（收缩）</h2>
<h3>推导</h3>
<p>在 <code>0&lt;η≤1/L</code> 下，由上一节：</p>
<p><code>F(x_{t+1})-F(x_t) ≤ -ηc(F(x_t)-F(x*))</code>。</p>
<p>令 <code>Δt=F(x_t)-F(x*)</code>。因为 <code>F(x_{t+1})-F(x_t)=Δ_{t+1}-Δt</code>，所以：</p>
<p><code>Δ_{t+1}-Δt ≤ -ηcΔt</code>，</p>
<p>整理得到：</p>
<p><code>Δ_{t+1} ≤ (1-ηc)Δt</code>。</p>
<p>这就是 contraction inequality。</p>
<h3>直觉</h3>
<p>每一步最多保留当前误差的 <code>1-ηc</code> 倍。若 <code>0&lt;ηc&lt;1</code>，这个因子位于 <code>0</code> 和 <code>1</code> 之间，误差会持续缩小。</p>
<p>例如 <code>1-ηc=0.9</code>，则每一步最多保留 <code>90%</code> 的当前 gap。</p>
<h3>假设</h3>
<ul>
<li><code>L</code>-smooth；</li>
<li>满足 PL inequality（强凸函数是常见充分条件）；</li>
<li><code>0&lt;η≤1/L</code>；</li>
<li><code>0&lt;ηc&lt;1</code> 时 contraction 因子为正且小于 1。</li>
</ul>
<h3>常见易错点</h3>
<ul>
<li>contraction 作用在 <code>Δt</code> 或函数值误差上，不一定直接作用在参数距离 <code>||x_t-x*||</code> 上。</li>
<li>步长太大时，<code>1-ηc</code> 可能不在 <code>(0,1)</code> 内，不能直接套用“每次缩小固定比例”的直觉。</li>
<li><code>Δt</code> 通常要求 <code>F(x*)</code> 是全局最优值。</li>
</ul>
<h3>例子</h3>
<p>若 <code>Δ0=10</code>、收缩因子为 <code>0.8</code>，则 <code>Δ1≤8</code>、<code>Δ2≤6.4</code>、<code>Δ3≤5.12</code>。</p>
<hr />
<h2>8. Linear / geometric convergence</h2>
<h3>迭代展开</h3>
<p>由 <code>Δ_{t+1}≤(1-ηc)Δt</code> 反复应用可得：</p>
<p><code>Δt ≤ (1-ηc)^t Δ0</code>。</p>
<p>即：</p>
<p><code>F(x_t)-F(x*) ≤ (1-ηc)^t [F(x_0)-F(x*)]</code>。</p>
<p>这称为 linear convergence 或 geometric convergence。这里的“linear”指误差序列满足固定比例递推，不是指误差按 <code>1/t</code> 下降。</p>
<h3>复杂度直觉</h3>
<p>若希望 <code>Δt≤εδ0</code>，需要 <code>(1-ηc)^t≤ε</code>，因此：</p>
<p><code>t ≥ log(1/ε) / [-log(1-ηc)]</code>。</p>
<p>当 <code>ηc</code> 较小时，<code>-log(1-ηc)≈ηc</code>，所以 <code>t=O((1/(ηc)) log(1/ε))</code>。取 <code>η=1/L</code> 时：</p>
<p><code>Δt≤(1-c/L)^tΔ0</code>。</p>
<h3>直觉</h3>
<p>每一步都乘上同一个小于 1 的数，所以误差曲线呈指数衰减。相比 <code>1/t</code> 型的 sublinear convergence，达到高精度时 geometric convergence 通常更快。</p>
<h3>常见易错点</h3>
<ul>
<li>“linear convergence” 不代表图像是一条直线，也不代表 <code>O(1/t)</code>。</li>
<li>这是函数值 gap 的结论；若要推导参数距离，还需结合强凸性的上下界。</li>
<li>比例必须稳定小于 1；如果比例接近 1，理论上虽收敛，实际可能很慢。</li>
</ul>
<h3>例子</h3>
<p>若 <code>ρ=0.99</code>，前期每步只减少约 <code>1%</code>；若 <code>ρ=0.5</code>，则每两步大约缩小到四分之一，明显更快。</p>
<hr />
<h2>9. Condition number</h2>
<h3>定义</h3>
<p>在 <code>L</code>-smooth 且 <code>c</code>-strongly convex 的问题中，定义 condition number：</p>
<p><code>κ=L/c</code>。</p>
<p>通常 <code>L≥c&gt;0</code>，所以 <code>κ≥1</code>。</p>
<h3>与收敛率的关系</h3>
<p>取常用步长 <code>η=1/L</code>：</p>
<p><code>1-ηc=1-c/L=1-1/κ</code>。</p>
<p>所以：</p>
<p><code>F(x_t)-F(x*) ≤ (1-1/κ)^t [F(x_0)-F(x*)]</code>。</p>
<ul>
<li><code>κ</code> 小：<code>c</code> 与 <code>L</code> 接近，收缩因子较小，收敛快；</li>
<li><code>κ</code> 大：存在很平的方向和很陡的方向，收缩因子接近 1，收敛慢。</li>
</ul>
<h3>几何直觉</h3>
<p>对二次函数 <code>F(x)=1/2 xᵀAx</code>，<code>κ=λmax(A)/λmin(A)</code>。等高线像椭圆：<code>κ≈1</code> 时接近圆形；<code>κ≫1</code> 时是细长椭圆，梯度下降容易在狭长谷底中来回摆动。</p>
<h3>常见易错点</h3>
<ul>
<li>condition number 不是单纯的数据维度，也不是参数个数。</li>
<li><code>κ</code> 大不一定表示算法完全不能用，而是说明基础 GD 可能需要很多迭代。</li>
<li>预条件化、特征缩放、加速方法的目标之一，就是改善有效的 condition number 或减少它对迭代次数的影响。</li>
</ul>
<h3>例子</h3>
<p>令 <code>A=diag(1,100)</code>。则 <code>c=1,L=100,κ=100</code>。使用 <code>η=1/L=0.01</code> 时，理论收缩因子为 <code>1-1/κ=0.99</code>，说明最坏方向上的理论收敛会比较慢。</p>
<hr />
<h2>10. 一页式公式总结</h2>
<h3>关键定义</h3>
<p><code>||∇F(x)-∇F(y)||≤L||x-y||</code>（<code>L</code>-smoothness）</p>
<p><code>F(x)≥F(y)+∇F(y)ᵀ(x-y)+(c/2)||x-y||²</code>（<code>c</code>-strong convexity）</p>
<p><code>2c(F(x)-F(x*))≤||∇F(x)||²</code>（PL inequality）</p>
<h3>关键上界和递推</h3>
<p><code>F(x)≤F(y)+∇F(y)ᵀ(x-y)+(L/2)||x-y||²</code></p>
<p><code>x_{t+1}=x_t-η∇F(x_t)</code></p>
<p><code>F(x_{t+1})-F(x_t)≤-η(1-Lη/2)||∇F(x_t)||²</code></p>
<p>当 <code>0&lt;η≤1/L</code> 且满足 PL 时：</p>
<p><code>Δ_{t+1}≤(1-ηc)Δt</code></p>
<p><code>Δt≤(1-ηc)^tΔ0</code></p>
<p>当 <code>η=1/L</code> 时：</p>
<p><code>Δt≤(1-1/κ)^tΔ0</code>，其中 <code>κ=L/c</code>。</p>
<h3>最值得记住的推理</h3>
<blockquote>
<p>smoothness 给出二次上界；梯度下降代入后得到一步下降；PL 把梯度平方换成 optimality gap；于是 gap 按固定比例收缩，最终得到 geometric convergence。<code>L/c</code> 决定这个比例离 1 有多近。</p>
</blockquote>
