---
title: 'Muon 是什么：从“向量”到“矩阵”的优化器，以及它的一张族谱'
description: 'Muon 的算法、Newton–Schulz 推导、优化器族谱，以及训练与压缩实验。'
publishedAt: 2026-11-28T11:00:00Z
category: Research
tags: [Muon, Optimization, Deep Learning]
language: zh-CN
draft: false
cardImage: https://www.haibinlaiblog.top/images/muon-shi-shen-me/fig_update_spectra.png
cardImageFit: contain
---

> 一句话：Muon 把每个矩阵参数的动量更新**正交化**（所有奇异值拉成 1），等价于在**谱范数**下做最陡下降；Adam 逐元素更新，Shampoo 累积左右两侧的矩阵预条件，Muon 可以看成"不累积的 Shampoo"。
>
> 读完你会知道：Muon 的算法和实现细节、它为什么是这个样子（数学推导）、它和 Adam / Shampoo / SOAP 等的关系、它快多少、还有哪些可以改进的方向。来源和核对情况放在文末。

---

## 1. 为什么需要"矩阵"优化器

Adam 对每个参数**单独**缩放：把梯度除以它自己的历史尺度。这等于把一个矩阵 $W\in\mathbb R^{m\times n}$ 当成 $mn$ 个互不相关的数。

可 Transformer 里最大的那部分参数（注意力的 Q/K/V/O，MLP 的投影）都是做线性映射 $y=Wx$ 的**矩阵**，它们有行、列、奇异值和方向。一个自然的问题：优化器能不能用上这个结构？

直觉是这样的：如果梯度矩阵的奇异值衰减得很快，只有少数方向在"说话"，SGD 的更新就会被这几个方向主导，其余方向几乎不动。Muon 的做法是把奇异值**拉平**，让所有方向被同等对待：

![同一个梯度矩阵（128×128，奇异值按 i^{-1.2} 衰减）经过不同优化器后，更新矩阵的奇异值（Frobenius 范数相同）。本文自制，合成数据，仅作示意。](/images/muon-shi-shen-me/fig_update_spectra.png)

- **蓝线**：SGD 的更新就是梯度本身，保持陡峭的衰减。
- **橙线**：SignSGD（去掉动量记忆的 Adam，见 4.3）逐元素取符号，衰减变缓，但后面的方向仍然很小。
- **绿线**：Muon 的更新 $UV^\top$，所有奇异值恰好等于 1；虚线是实际使用的 5 步 Newton–Schulz 近似（第 3 节细讲）。

---

## 2. 算法

Muon（**M**omentum **O**rthogonalized by **N**ewton–Schulz）来自 Keller Jordan 等人的一篇博客。它先照常算 SGD 动量，然后对每个矩阵的更新做一次正交化，再更新参数：

```text
B_t ← μ · B_{t-1} + G_t           # 动量（参考代码默认用 Nesterov 形式）
O_t ← NewtonSchulz5(B_t)          # 正交化：奇异值全部拉向 1
θ_t ← θ_{t-1} − η · O_t
```

使用上有几条约定：

- **只用于隐藏层的 2D 矩阵。** 嵌入、输出头、LayerNorm 的增益和偏置等，仍用 AdamW。
- **Q、K、V 分开做**效果更好（博客里的经验结论）。
- 参考代码在更新后乘一个形状因子 $\max(1,\text{rows}/\text{cols})^{1/2}$。
- 实际用的正交化是 **5 步 Newton–Schulz 迭代**，在 bfloat16 下运行。这是下一节的主题。

![NanoGPT speedrun 上不同优化器的样本效率；图例标注了每步毫秒数：Adam 139、Shampoo 179/154、SOAP 301、Muon 142。来源：Keller Jordan 博客，Figure 1（链接嵌入，请跳转原文）。这是作者自己的小规模对比，第 5 节会看到更严格的对比。](https://kellerjordan.github.io/images/muon/nanogpt_speedrun81w.png)

---

## 3. Newton–Schulz：怎么不用 SVD 就得到 $UV^\top$

### 3.1 要解决的问题

我们要的是 $UV^\top$，其中 $G=U\Sigma V^\top$。直接做 SVD 太慢，GPU 上也不友好。还有一个等价写法：

$$UV^\top = G\,(G^\top G)^{-1/2}.$$

（把 $G=U\Sigma V^\top$ 代进去验证即可。）难点变成了：怎么只用**矩阵乘法**算 $(G^\top G)^{-1/2}$？

### 3.2 经典的三次迭代

先把 $G$ 除以它的 Frobenius 范数，让所有奇异值落在 $[0,1]$。令 $X=G$，则 $G^\top G=X^\top X$ 的特征值也在 $[0,1]$。把 $t^{-1/2}$ 在 $t=1$ 附近做一阶展开：

$$(X^\top X)^{-1/2}\approx \tfrac32 I-\tfrac12X^\top X ,$$

代回去得到迭代

$$X\leftarrow \tfrac32X-\tfrac12\,XX^\top X .$$

这就是经典的 Newton–Schulz 迭代（Bernstein & Newhouse 的附录里也写了它）。关键观察：**它只作用在奇异值上**。设 $X=U\Sigma V^\top$，则 $XX^\top X=U\Sigma^3V^\top$，所以一步迭代只是把每个奇异值 $\sigma$ 变成

$$\sigma\ \mapsto\ \tfrac32\sigma-\tfrac12\sigma^3,$$

奇异向量不动。这个标量映射以 1 为不动点，对 $\sigma\in(0,\sqrt3)$ 收敛到 1。所以反复迭代，所有奇异值都会被推向 1，得到 $UV^\top$。

整个过程只用矩阵乘法，不需要 SVD 或求逆，这正是它适合 GPU 的原因。

### 3.3 问题：小奇异值太慢了

三次迭代在 $\sigma=0$ 附近的斜率只有 1.5：一个很小的奇异值每步最多放大 1.5 倍。从 $10^{-3}$ 放大到 0.5 以上，要 **16 步**。而梯度矩阵里确实有很多很小的奇异值。

### 3.4 Muon 的做法：换成五次多项式，把斜率调大

Muon 把标量映射换成五次多项式

$$\phi(x)=ax+bx^3+cx^5,\qquad (a,b,c)=(3.4445,\,-4.7750,\,2.0315).$$

矩阵形式就是博客里的那段代码：`A = X @ X.T; B = b*A + c*A@A; X = a*X + B@X`，每步对奇异值作用一次 $\phi$。

设计思路（博客的说法）：

- $\phi'(0)=a$，所以 $a$ 越大，小奇异值长得越快；
- 代价是不再收敛到精确的 1。博客发现，只要迭代后的值落在 $[1-\varepsilon,1+\varepsilon]$ 里（$\varepsilon$ 到 0.3 左右）就不损害训练，所以目标是在 $[0.7,1.3]$ 的约束下把 $a$ 做到最大；
- 这组系数是用"临时的基于梯度的方法"找出来的，没有闭式推导。

下图是同样 5 步，三组系数的比较（本文自己的数值计算）：

![5 步迭代后的奇异值：经典三次、基线五次 (2, −1.5, 0.5)、Muon 调优的系数。灰绿阴影是 0.7–1.15。本文自制。](/images/muon-shi-shen-me/fig_ns_compare.png)

几个数字（输入 $s=\sigma/\|G\|_F$，5 步之后）：

| $s$ | 经典三次 | 基线五次 | **Muon 系数** |
|---|---|---|---|
| $10^{-3}$ | 0.008 | 0.032 | **0.47** |
| $10^{-2}$ | 0.076 | 0.31 | **0.70** |
| $10^{-1}$ | 0.66 | 1.00 | 0.71 |
| $0.5$ | 1.00 | 1.00 | 0.77 |

经典三次是"准但慢"，Muon 的系数是"快但不准"：大多数奇异值被推进 $0.7$ 到 $1.15$ 之间并来回振荡，极小的奇异值也被放大了几百倍，但没有一个精确等于 1。参考代码的文档字符串说得更直接：输出是 $US'V^\top$，$S'_{ii}$ 大致服从 $\mathrm{Uniform}(0.5,1.5)$，"经验上相对 $UV^\top$ 完全不影响模型性能"。

### 3.5 实现细节与开销

- 初始化：先除以 Frobenius 范数。因为 $\mathrm{Ortho}(cG)=\mathrm{Ortho}(G)$，这不改变结果。
- 在"扁"的方向上迭代（`if rows > cols: X = X.T`），这样 $XX^\top$ 是较小的 Gram 矩阵。
- 步数取 5。Moonlight 试过 10 步，更精确，但没有更好的效果。
- 开销：博客估算 FLOP 额外开销至多 $Tm/B$（$T$ 是步数，$m$ 是模型维度，$B$ 是每批 token 数），典型训练低于 1%；Moonlight 的分布式实现里，优化器延迟实测约占前向反向的 1% 到 3%。
- **还能再省**：Dion3（Amsel 等，2026）专门盯着这块开销。标准做法每一步都要乘 $n\times m$ 的大矩阵；他们的 *Gram Newton–Schulz* 先算出小的 $n\times n$ 矩阵 $XX^\top$，迭代全在它上面做，最后只乘回大矩阵两次。数学上和标准迭代等价，但朴素写法在半精度下会出数值问题（论文里一次 Llama-430M 的实验输出全成了 Inf），所以中途要重启一次。再配上利用对称性的 GPU 内核，论文报告单卡上 Newton–Schulz 快 1.5–2 倍。

---

## 4. Muon 的数学性质

### 4.1 更新是"最近的半正交矩阵"

$$\mathrm{Ortho}(G)=\arg\min_{O:\;O^\top O=I\text{ 或 }OO^\top=I}\|O-G\|_F = UV^\top .$$

Bernstein & Newhouse 证明了这一点，并指出 $G$ 满秩时最小解唯一。所以 **Muon 更新的奇异值全是 1**，这就是第 1 节那条绿线。

### 4.2 它是谱范数下的最陡下降

这一条把 Muon 从"一个有效的技巧"变成"一个有原则的方法"。最陡下降在局部二次模型下选步长：

$$\arg\min_{\Delta w}\Big[g^\top\Delta w+\tfrac{\lambda}{2}\|\Delta w\|^2\Big]=-\frac{\|g\|^\dagger}{\lambda}\,\arg\max_{\|t\|=1}g^\top t ,$$

其中 $\|\cdot\|^\dagger$ 是对偶范数。对矩阵取**谱范数**，要解 $\max_{\|T\|_2\le1}\langle G,T\rangle$。手算只要两步：

$$\langle G,T\rangle=\sum_i\sigma_i\,u_i^\top T v_i\ \le\ \sum_i\sigma_i\,\|T\|_2\ \le\ \sum_i\sigma_i=\mathrm{tr}\,\Sigma ,$$

等号在 $T=UV^\top$ 时成立。所以谱范数球里最顺着梯度的方向是 $UV^\top$，对偶范数是奇异值之和（核范数）。

![不同范数下的最陡下降：改变范数就改变解的方向。来源：Bernstein & Newhouse，"Old Optimizer, New Norm"，arXiv 2409.20325，Figure 1（链接嵌入）。](https://arxiv.org/html/2409.20325v2/norms.svg)

补两个细节：真正的最陡下降步长里还有一个因子 $\sum\sigma_i$，Muon 的实现把它**丢掉了**（Pethick 等指出这一点），所以 Muon 严格说是"谱范数球上的线性最小化 oracle"；另外这个说法需要正交化是精确的，而 3.4 节说明实际并不精确（Moonlight："当公式被精确计算时，Muon 的范数约束就是谱范数"）。

### 4.3 与 Adam、SignSGD：换一个范数

同一个框架里，换范数就换算法。取向量的 $\ell_\infty$ 范数，$\arg\max_{\|t\|_\infty\le1}g^\top t=\mathrm{sign}(g)$，就是 **SignSGD**。Bernstein & Newhouse 证明：关掉 Adam 的两个滑动平均，更新就是 $g/\sqrt{g^2}=\mathrm{sign}(g)$。所以：

- Adam 是"逐元素"的最陡下降（$\ell_\infty$ 类的范数），
- Muon 是"矩阵级"的最陡下降（谱范数）。

Pethick 等的表 1 把两者并排列出：SignSGD 是 max 范数球上的 LMO，Muon 是谱范数球上的 LMO。

### 4.4 与 Shampoo：不累积的 Shampoo

Shampoo 对矩阵梯度维护左右两个预条件矩阵：

$$L_t=L_{t-1}+G_tG_t^\top,\quad R_t=R_{t-1}+G_t^\top G_t,\qquad W_{t+1}=W_t-\eta\,L_t^{-1/4}G_tR_t^{-1/4}.$$

如果**不累积**，只用当前这一步，代入 $G=USV^\top$：

$$(GG^\top)^{-1/4}\,G\,(G^\top G)^{-1/4}=(US^{-1/2}U^\top)(USV^\top)(VS^{-1/2}V^\top)=UV^\top .$$

这就是 Muon 的更新。这个观察出自 Bernstein & Newhouse，Keller 的博客也给了同样的推导：再在正交化之前加上动量，就得到 Muon，只是 Shampoo 需要逆四次根，比 Newton–Schulz 贵。（对非方阵，$GG^\top$ 或 $G^\top G$ 之一是奇异的，恒等式要按约化 SVD / 伪逆理解。）

### 4.5 更新的 RMS 与学习率怎么迁移

$UV^\top$ 的 Frobenius 范数是 $\sqrt{\min(m,n)}$，所以对 $m\times n$ 的满秩矩阵，更新的<strong>均方根（RMS）</strong>是 $\sqrt{1/\max(m,n)}$（Moonlight 的引理 1）。结论：同样的学习率，**形状不同**的矩阵得到的更新大小不一样。

Moonlight 的两个关键改动，让 Muon 能用在大规模训练上：

1. **加权重衰减**：$W_t=W_{t-1}-\eta_t(O_t+\lambda W_{t-1})$。没有它，大模型长训练里权重和层输出的 RMS 持续增长，超出 bf16 的精度范围，Muon 的优势就消失了。
2. **匹配 AdamW 的更新 RMS**：AdamW 的更新 RMS 经验上在 0.2 到 0.4，所以把 Muon 的更新乘上 $0.2\sqrt{\max(A,B)}$，使 RMS 恰为 0.2。这样 **AdamW 调好的学习率和权重衰减可以直接复用**。

第二条他们也做了消融（800M 模型，表 1）：不管是把更新范数精确匹配，还是直接用 $0.2\sqrt{\max(A,B)}$，验证损失都是 2.789，基线是 2.812。两种差不多，于是选了便宜的那个。

### 4.6 Muon 到底赢在哪：放大小方向，还是压住大方向？

3.3 节留了个问题：正交化同时做了两件事，小奇异值被放大，大奇异值被压平。收益到底来自哪一件？

Goyal 和 Ramkumar 的 *Spectrally Targeted Muon*（2026）干脆把两件事拆开测。设一个阈值 $\tau$，只对高于（或低于）$\tau$ 的奇异方向做正交化，其余保持原样。$\tau$ 推到两端，就分别退回 Muon 和归一化 SGD。（实现上对移位后的 Gram 矩阵 $M^\top M-\tau^2I$ 跑 Newton–Schulz 拿到投影，不用 SVD。）

他们在 12 层、768 维的 NanoGPT 上训 0.80B token，最终验证损失是：

| 做法 | 验证损失 |
|---|---|
| Muon | 3.280 |
| 只正交化**高于** $\tau$ 的方向（$\tau$ 从 $10^{-4}$ 到 $3\times10^{-3}$） | 3.425 → 3.875 |
| 只正交化**低于** $\tau$ 的方向（同样的 $\tau$） | 3.772 → 3.309 |
| AdamW / 加 warmup 的 AdamW | 3.468 / 3.396 |

读法很直接。只处理大方向，怎么调都追不上：最好的 3.425 也比带 warmup 的 AdamW 差。只处理小方向，$\tau=3\times10^{-3}$ 时离 Muon 只差 0.03，而这一步碰到的动量按平方范数算至多 13%。**也就是说，Muon 的好处主要来自把被梯度忽略的小方向抬起来**，而且并不需要抬所有的。反过来，把大奇异值压下去确实能让权重谱保持平，但对损失几乎没贡献。这和第 8 节的结论是一路的：谱平不平，和模型好不好，是两回事。

顺带一个有趣的现象：warmup 对 AdamW 有帮助（3.468 → 3.396），对 Muon 反而有害（3.280 → 3.309）。作者的解释是 AdamW 靠许多步低秩的逐元素更新慢慢"搭起"结构，需要热身；Muon 一步就写进一个满秩矩阵，热身只是白白少走了几个满速步。

这是一篇 v1 预印本，只有 NanoGPT 的结果，部分设置只跑了一两个种子，所以更适合当作一条线索，而不是定论。

---

## 5. Muon 到底快多少

![Moonlight 的缩放律实验：Muon（蓝）与 AdamW（红），每种五个模型尺寸。来源：Liu et al.，arXiv 2502.16982，Figure 1(a)（CC BY-NC-ND 4.0，仅链接嵌入，请跳转原文）。](https://arxiv.org/html/2502.16982v1/chinlaw_8k_flops_ratio.svg)

两个来源，两个数字：

| 来源 | 结论 | 前提 |
|---|---|---|
| **Moonlight** | 约 2× 的计算效率（约 52% 的训练 FLOP 达到相同表现） | 稠密 Llama 架构、399M–1.5B 参数上的缩放律拟合，计算最优（约 1× Chinchilla）的设定 |
| **Wen 等** "Fantastic Pretraining Optimizers" | 相对调好的 AdamW，Muon/SOAP 在 0.1B 约 1.3–1.4×，在 1.2B 只剩约 1.1× | 十个优化器、四个尺度、1–8× Chinchilla；"许多报告的 2× 加速只是弱基线" |

Moonlight 自己的下游结果也值得看一眼（论文表 4，约 1.2T token，同样设置下的 AdamW 版 Moonlight-A 对 Muon 版）：MMLU 60.2 对 60.4，基本打平；HumanEval 29.3 对 37.2、MATH 16.1 对 19.8，Muon 明显好；BBH 45.3 对 43.2，反而是 AdamW 好。所以"2×"说的是损失曲线，换成下游任务就没这么整齐。

Wen 等还发现：Muon 在 1–4× Chinchilla 数据比时最好，8× 以上被 Kron 和 SOAP 超过；用拟合的缩放律外推，1× Chinchilla 下到 7B 时 Muon 的损失会略高于 AdamW（这是外推，不是观测）。

![Wen 等：相对 AdamW 的加速随模型尺寸下降（8× Chinchilla 数据）。来源：Wen et al.，arXiv 2509.02046，Figure 1 左下分图（CC BY 4.0）。](https://arxiv.org/html/2509.02046v3/speedup_vs_model_size.svg)

结论：**Muon 的优势在小模型上大，在大模型和长训练上变小，而且取决于基线调得多好。**

---

## 6. 优化器族谱：每篇论文和 Muon 的关系

![优化器族谱（本文自制）。实线：演进关系；虚线：数学联系。](/images/muon-shi-shen-me/fig_family.png)

带 † 的只读了摘要。

### 前身与同类

| 论文 | 一句话 | 和 Muon 的关系 |
|---|---|---|
| **Adam** (Kingma & Ba, 2015)† / **AdamW** (Loshchilov & Hutter, 2019)† | 自适应矩估计；解耦权重衰减 | 逐元素；去掉滑动平均就是 SignSGD（4.3）。Muon 的非矩阵参数仍用 AdamW |
| **Shampoo** (Gupta 等, 2018, 1802.09568) | 每个张量维度一个预条件矩阵 | 不累积的 Shampoo = Muon（4.4） |
| **SOAP** (Vyas 等, 2024, 2409.11321) | 在 Shampoo 的特征基里跑 Adam | 同属矩阵预条件；原论文不提 Muon；注意它用的是 1/2 次幂，不是会退化成 $UV^\top$ 的 1/4 |
| **Old Optimizer, New Norm** (Bernstein & Newhouse, 2024, 2409.20325) | 把 Adam、Shampoo 统一成"某个范数下的最陡下降" | **理论根基**（4.2、4.4） |
| **Scion / 范数约束 LMO** (Pethick 等, 2025, 2502.07529) | 在范数球上做线性最小化 | Muon 是谱范数球上的 LMO；Scion 把范数约束推到所有层 |
| **Lion-K** (Chen 等, 2025, 2506.15054)† | Lion-K 族 | 把 Muon 视为其一员，隐式施加谱范数约束 |
| **隐式偏置** (Fan 等, 2025, 2502.04664)† | 谱下降与 Muon 在多分类线性分类中收敛到谱范数最大间隔解 | 给 Muon 一个简化的理论偏置结论 |

### 拆开看：Muon 的哪一部分有用

| 论文 | 一句话 | 和 Muon 的关系 |
|---|---|---|
| **白化 vs 方差自适应** (Frans 等, 2025, 2510.25000)† | 矩阵白化类优化器胜过 Adam，但方差自适应解释了很大一部分收益 | 提醒：Muon 的收益未必全来自正交化本身 |
| **Spectrally Targeted Muon** (Goyal & Ramkumar, 2026, 2610.10965) | 只正交化高于或低于阈值 $\tau$ 的奇异方向；$\tau$ 在 Muon 和归一化 SGD 之间连续插值 | 4.6：收益主要来自放大小方向；压大方向只是让谱变平 |

### 放大到大规模

| 论文 | 一句话 | 和 Muon 的关系 |
|---|---|---|
| **Moonlight** (Liu 等，含苏剑林, 2025, 2502.16982) | 权重衰减 + 更新 RMS 匹配，3B/16B MoE，5.7T token | 4.5、第 5 节、第 9 节分布式；还报告超过 90% 的矩阵上 Muon 的 SVD 熵更高 |
| **Dion3** (Amsel 等, 2026, 2608.11612) | 把 Muon 做便宜：Gram Newton–Schulz、对称 GPU 内核、同形状矩阵合并通信；再加一条规则：每步只正交化动量里 $f$ 比例的行 | 保留 Muon 的更新形式（$f=1$ 就是 Muon）；报告优化器步时间最多快 6×，损失持平或略好。见 3.5、第 9 节 |
| **Fantastic Pretraining Optimizers** (Wen 等, 2025, 2509.02046) | 严格调参的十个优化器对比 | 第 5 节；加速随规模降到约 1.1× |
| **Newton-Muon** (Du & Weijie Su, 2026, 2604.01472) | 把 Muon 解释成省略了输入二阶矩的牛顿型方法 | 更新写成 $\mathrm{msgn}(G(ZZ^\top)^{-1})$；$ZZ^\top\propto I$ 时退回 Muon |
| **Muon 微调不匹配** (Qu 等, 2026, 2605.10468)† | 用 Muon 微调 Adam 预训练的模型会变差 | 预训练与微调的优化器要匹配 |

### 权重是什么样、好不好压

| 论文 | 一句话 | 和 Muon 的关系 |
|---|---|---|
| **Beneventano 等** (2026, 2606.08388)† | 极分解更新产生平坦的奇异值谱 | 同一现象的理论讨论 |
| **HTMuon** (Pang 等, 2026, 2603.10067)† | 动量奇异值取 $p\in(0,1)$ 次幂，得到更重尾的谱 | 认为 Muon 抑制了重尾，是对"太平"的修正 |
| **Singh** (2026, 2608.05136)† | Adam 的坐标相关更新恢复不了 GD 能找到的低秩解，谱范数类方法可以 | 从归纳偏置的角度讨论 Muon |
| **NuMuon** (Dolatabadi 等, 2026, 2603.03597) | 对更新加核范数约束（实现上只保留前 $k$ 个奇异方向） | 让权重更好压缩；代价是未压缩的困惑度比 Muon 差 5%–14%（仍好于 AdamW）。数字见第 8 节 |
| **Spectral Weight Decay** (Andriianov 等, 2026, 2610.11730) | 作用于权重的核范数收缩，用与 Muon 相同的 5 步 NS | 主要面向 Adam 系；对 Muon 的扫描里验证损失"急剧上升" |
| **OSP** (Park 等, ACL 2025, 2506.19697)† | Muon + 单尺度 RMSNorm + 嵌入投影，1.4B 模型 4 比特量化更好 | 用 Muon 训出好量化的模型 |
| **Vlassis 等** (2025, 2509.23500)† / **He 等** (NeurIPS 2024)† / **Catalan-Tatjer 等** (2025, 2510.06213)† | 优化器、离群特征与量化 | 离群指标预测不了跨优化器的量化退化；非对角预条件（SOAP）减少离群 |
| **BMuon** (Assalouh 等, 2026, 2610.23571)† | Muon 训出的 Transformer 在 MLP 通道剪枝下掉点更多 | Muon 的结构对剪枝不友好 |

---

## 7. 苏剑林（科学空间）的 Muon 系列

苏剑林是 Moonlight 的作者之一，科学空间里有一批中文的详细讲解。下表按标题和摘要整理，具体内容请读原文：

| 文章 | 关于什么 | 对应本文 |
|---|---|---|
| [《Muon优化器赏析：从向量到矩阵的本质跨越》](https://kexue.fm/archives/10592)（2024-12-10） | 把 Muon 作为专为矩阵参数定制的优化器，是谱范数约束下的梯度下降；也谈到矩阵跨设备切分时的梯度汇聚 | 4.2；第 9 节分布式 |
| [《Muon续集：为什么我们选择尝试Muon？》](https://kexue.fm/archives/10739)（2025-02-27） | 对应 Moonlight 技术报告，讲如何匹配更新 RMS 把 Adam 的学习率迁移到 Muon | 4.5、第 5 节 |
| [《Muon优化器指南：快速上手与关键细节》](https://kexue.fm/archives/11416)（2025-11-19） | 面向只用过 Adam 的读者的上手指南 | 第 2 节 |
| [《msign算子的Newton-Schulz迭代》上](https://kexue.fm/archives/10922)、[下](https://kexue.fm/archives/10996)（2025-05、06） | 系数 $(a,b,c)$ 与步数 $T$ 是全部超参数；下篇与 Polar Express 的思路相关 | 第 3 节 |
| [《msign的导数》](https://kexue.fm/archives/11025)（2025-06） | 推导 msign 的导数 | 第 9 节 |
| [《高阶MuP》](https://kexue.fm/archives/10795)（2025-03-24）、[《为什么官方版Muon比MuP版多出一个max(1, ⋅)？》](https://kexue.fm/archives/11772)（2026-06-03） | 谱条件缩放；形状因子里 $\max(1,\cdot)$ 的由来 | 4.5 |
| [《QK-Clip》](https://kexue.fm/archives/11126)（2025-07-12） | 放大后 MaxLogit 爆炸的处理 | 第 9 节稳定性 |
| [《为什么Adam的Update RMS是0.2？》](https://kexue.fm/archives/11267) | Adam 的更新 RMS 经验上在 0.2–0.3，与 SignSGD 的差别来自动量 | 4.5 |
| [《流形上的最速下降》1–4](https://kexue.fm/archives/11196)（2025-08） | 范数下的最陡下降加参数约束（超球面、正交、Stiefel、谱球面） | 4.2、4.3 |
| [《从谱范数梯度到新式权重衰减的思考》](https://kexue.fm/archives/10648)（2024-12-25） | 谱范数的梯度；F 范数平方的权重衰减惩罚全体奇异值，谱范数平方只惩罚最大的 | 第 9 节 |
| [《矩阵参数的奇异值熵越高越好吗？》](https://spaces.ac.cn/archives/11767) | 回顾 Moonlight 的奇异值熵，追问"越高越好吗" | 第 8 节 |

---

## 8. 我们的实验：Muon 训出的权重好不好压

这是我们在做的"Muon 训出的权重是平坦的还是低秩的"项目的结果。

**平和低秩并不矛盾。** Moonlight 看 SVD 熵，NuMuon 看归一化稳定秩并把 Muon 模型描述成"低秩"。我们在 17 对公开的 AdamW/Muon 检查点（130M–1.2B 参数）上同时算两个指标：

![17 对匹配检查点上 Muon 减 AdamW 的熵 H（左）、稳定秩 sr（中），以及 Muon 的熵更高的矩阵占比（右）。本文作者实验。](/images/muon-shi-shen-me/fig_flatness_17pairs.png)

Muon 在全部 17 对上两个指标**都更高**，差距随数据量增加而缩小；两种优化器的稳定秩都远低于 1（0.08–0.18，随机矩阵是 0.34），只是 Muon 更高。

![我们自己训练的 49M 模型（0.21B token）的权重谱：AdamW、Muon、Muon 加核范数衰减，42 个矩阵的中位数。本文作者实验。](/images/muon-shi-shen-me/fig_spectra_ours.png)

**平不平不决定好不好压。** 对朴素 SVD 截断，输出误差**恰好**是"权重谱尾部能量"乘一个"对齐因子"（被丢掉的方向上有多少输入方差）：

$$\frac{\mathbb E\|E_kx\|^2}{\mathbb E\|Wx\|^2}=\tau_k\times A_k .$$

熵和稳定秩只看得见 $\tau_k$。Muon 的更新各向同性（4.1），所以它权重的奇异值与输入方差几乎无关（我们测到相关系数 $-0.04$ 到 $-0.14$，AdamW 是 $0.45$ 到 $0.74$）。结果：朴素 SVD 下 Muon 比 AdamW 多损失 1.5–10 倍，对角缩放（ASVD）更差，完全白化（SVD-LLM）把差距缩到 1.1–1.55 倍。

**能不能训出更好压的 Muon？** 我们检验了 NuMuon 式的更新截断和核范数衰减（后者与 Spectral Weight Decay 同一思路）。两者都有前人做过，我们做的是受控对比，不是新方法。结果是一条权衡曲线：

![0.63B token、49M 模型：核范数衰减强度 λ 在"好训"（未压缩验证损失）和"好压"（SVD-LLM 压到 70% 后的损失）之间排成一条曲线；nu50 是只保留更新前 50% 奇异方向。本文作者实验，3 个种子均值（λ=0.1 为 2 个）。](/images/muon-shi-shen-me/fig_tradeoff.png)

λ 越大，压缩后越好，但未压缩的验证损失越差，没有一个点同时拿到两边最好。λ=0.3 在 0.21B token 时验证损失比 Muon 低，到 0.63B 时高 0.076，所以"不付验证代价"只在小数据时成立。另外，如果压缩器固定保留前 $k$ 个奇异方向，只惩罚将被丢弃的谱尾对压缩后的权重**没有任何影响**，所以"谱尾变小"不能直接解释压缩后损失变好。

NuMuon 论文自己的数字也是同一个形状（Llama3-1.8B，压缩 40%，困惑度越低越好）：

| | Muon | NuMuon |
|---|---|---|
| 未压缩 | 15.39 | 17.56 |
| ASVD 压缩后 | 1443.6 | 20.6 |
| SVD-LLM 压缩后 | 26.4 | 19.2 |
| Dobi-SVD 压缩后 | 20.4 | 18.6 |

两点值得说。一是 ASVD 下 Muon 模型直接崩到 1443，和我们测到的方向一致（对角缩放对 Muon 最糟，见上）；二是 NuMuon 并不免费：未压缩困惑度变差，每步训练也慢了约 18%（25.4 秒对 30.0 秒），因为要做 top-$k$ 的 SVD。收益和代价都在，和上面那条权衡曲线讲的是同一件事。

范围：我们只有 49M 一个架构、C4 一个数据集。

---

## 9. 可能的优化方向

1. **更好的 Newton–Schulz**：系数是临时调出来的，极小奇异值 5 步后仍没被推到 1，还有改进空间（苏剑林有两篇系数寻优和 Polar Express 的文章）。Dion3 的 Gram 迭代则是从"算得更便宜"这头下手，两条路可以叠加。
2. **补上输入协方差**：Newton-Muon 把更新写成 $\mathrm{msgn}(G(ZZ^\top)^{-1})$，在早期的 Modded-NanoGPT 配置上报告步数少 6%、墙钟少约 4%；单次复现、小规模，需要更多验证。
3. **更好压的 Muon**：NuMuon（更新截断）、Spectral Weight Decay（核范数收缩）；第 8 节的权衡曲线说明收益与验证代价要一起看。
4. **缩放与超参迁移**：Moonlight 的 $0.2\sqrt{\max(A,B)}$ 规则；苏剑林的高阶 MuP 和 $\max(1,\cdot)$ 的文章。
5. **稳定性**：QK-Clip / MuonClip，针对放大后 MaxLogit 爆炸。
6. **只动一部分**：三篇论文从不同动机出发，都在问"每步一定要把整个动量正交化吗"。Spectrally Targeted Muon 是探针，想弄清哪些方向有用（4.6）；NuMuon 保留前 $k$ 个奇异方向，为了好压缩；Dion3 只挑 $f$ 比例的行（推荐 $f=1/4$ 或 $1/8$），为了省算力，报告在 1B 模型、100B token 上损失还略低于 NorMuon。三者合起来有个暗示：Muon 的更新里可能有相当一部分是冗余的，但冗余的是哪一部分，各篇的回答不一样。
7. **分布式实现**：Muon 只需一个动量缓冲区（AdamW 需要两个）；矩阵跨设备切分时要先汇聚梯度。Moonlight 的论文正文说通信量是分布式 AdamW 的 1 到 1.25 倍，脚注里又写实测接近 1.44，两处没对上，实际用时最好自己测。Dion3 的做法是把同形状的矩阵合并成一次 all-to-all，把通信轮数从 $O(N/\text{world size})$ 降到 $O(1)$。
8. **预训练与微调的匹配**：优化器不一致时会吃亏（Moonlight 的 SFT 实验、Qu 等）。
9. **规模变大后优势变小**：Wen 等的结论。要弄清楚是 Muon 本身的局限，还是基线调参的差距。

---

## 10. 小结与阅读顺序

1. Muon = 动量更新 → 正交化（奇异值拉向 1）→ 更新，用 5 步 Newton–Schulz，只用于隐藏层的矩阵。
2. Newton–Schulz 只用矩阵乘法，反复把奇异值推向 1；Muon 换成斜率更大的五次多项式，换来对小奇异值的快速放大，代价是结果落在 $0.7$–$1.15$ 而不是精确的 1。
3. 数学上它是谱范数下的最陡下降，也是不累积的 Shampoo；和 Adam 的差别是"用什么范数"。
4. 拆开看，收益主要来自把被忽略的小奇异方向抬起来；把大的压平，只是让谱更平（4.6）。
5. 规模化需要权重衰减和更新 RMS 匹配；加速在小模型上大，在大模型和严格基线下约 1.1×。
6. Muon 训出的权重比 AdamW 更平，压缩要用与优化器匹配的方法，不能只看谱形状。

阅读顺序：Keller Jordan 的博客 → Bernstein & Newhouse 第 1–3 节 → Moonlight 第 2–3 节 → Wen 等第 1、3 节（作为冷静剂）。苏剑林的系列可以作为中文的详细版本。

---

## 来源与核对说明

- **算法与数学性质**（第 2–5 节）对照了原始文本：Keller Jordan 的博客与参考代码、Moonlight、Bernstein & Newhouse、Pethick 等、Newton-Muon、Wen 等。博客的算法框是图片，已转写核对。
- **本文自己的计算**：3.4 节的表和图（用同一组系数做的数值计算）；Shampoo 恒等式的数值检查和更新 RMS 的数值检查是调研时做的，不是原文的说法。
- **后加的四篇**（Moonlight、Spectrally Targeted Muon、Dion3、NuMuon）读的是 arXiv 的 HTML 版。Moonlight 的第 2 节到 3.3 节逐字读过，后半部分（表 5–10、附录）没有；Spectrally Targeted Muon 的正文逐字读过；Dion3 和 NuMuon 只逐字读了摘要和引言，方法细节与表格数字来自对 HTML 的摘要提取，引用前请对一下原文。后三篇都只有 v1 预印本。
- **第 6 节**除 Shampoo、SOAP、Anthology、Scion、Moonlight、Wen、Newton-Muon、NuMuon、Spectral Weight Decay 外，其余只读了摘要（标 †）。
- **第 7 节苏剑林的文章**只看到了搜索结果里的标题、链接和摘要片段，没有读全文（科学空间拒绝自动抓取，我们没有绕过）；表里的描述限于标题和摘要能确认的内容。
- **图**：自制图随本文存放在 `/images/muon-shi-shen-me/`（本地制图脚本为 `make_figs_muon.py`，实验图还依赖本地数据；`fig_update_spectra` 是合成数据示意）；原文图都用链接嵌入、未转存：Keller Jordan 博客（页面未声明许可）、Bernstein & Newhouse（arXiv 非独占许可）、Moonlight（CC BY-NC-ND 4.0，不可裁剪修改；若博客算商用，请改为只放链接）、Wen 等（CC BY 4.0）。arXiv 图片链接带版本号，论文改版后可能失效。
