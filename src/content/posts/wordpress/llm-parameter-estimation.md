---
title: "LLM Parameter Estimation"
description: "大模型参数量估计推导 1. 为什么需要估计参数量？ 大模型（如 BERT、GPT、LLaMA）参数量通常亿级甚至万亿级，估计参数量有助于： 硬件需求评估 ：参数量影响内存和计算资源需求。 模型规模比较 ：参数量反映复杂度和潜在能力。 优化设计 ：在资源有限时，调整结构以平衡性能和效率。 参数量由模型的各个组成部分（层、权重矩阵、偏置等）决定，以下以 Transformer 架构为例推导。 2. Transformer 架构核心组件 T…"
publishedAt: "2025-05-12 03:38:43"
updatedAt: "2025-05-12 04:43:15"
category: "High Performance Computing"
tags: ["LLM", "Transformer"]
draft: false
slug: "llm-parameter-estimation"
legacySlug: "llm-parameter-estimation"
wordpressId: 711
sourceUrl: "https://www.haibinlaiblog.top/index.php/llm-parameter-estimation/"
commentCount: 0
importedFromWordPress: true
---
<h1>大模型参数量估计推导</h1>
<hr />
<h2>1. 为什么需要估计参数量？</h2>
<p>大模型（如 BERT、GPT、LLaMA）参数量通常亿级甚至万亿级，估计参数量有助于：</p>
<ul>
<li><strong>硬件需求评估</strong>：参数量影响内存和计算资源需求。</li>
<li><strong>模型规模比较</strong>：参数量反映复杂度和潜在能力。</li>
<li><strong>优化设计</strong>：在资源有限时，调整结构以平衡性能和效率。</li>
</ul>
<p>参数量由模型的各个组成部分（层、权重矩阵、偏置等）决定，以下以 Transformer 架构为例推导。</p>
<hr />
<h2>2. Transformer 架构核心组件</h2>
<p>Transformer 模型由多个堆叠的 <strong>Encoder</strong> 和 <strong>Decoder</strong> 组成（以 GPT 为例，通常只有 Decoder）。一个 Transformer 层包含：</p>
<ul>
<li><strong>多头自注意力（Multi-Head Self-Attention, MHSA）</strong>：计算查询（Query）、键（Key）、值（Value）矩阵。</li>
<li><strong>前馈神经网络（Feed-Forward Network, FFN）</strong>：逐位置的 MLP。</li>
<li><strong>归一化层（Layer Normalization）</strong>：标准化输入。</li>
<li><strong>残差连接</strong>：不引入额外参数。</li>
</ul>
<p>此外，模型还包括：</p>
<ul>
<li><strong>嵌入层（Embedding Layer）</strong>：将 token 映射到高维向量。</li>
<li><strong>输出层</strong>：将隐藏状态映射到词汇表（常共享嵌入层权重）。</li>
</ul>
<p>我们将逐一计算每个部分的 <strong>参数量</strong>。</p>
<hr />
<h2>3. 参数量推导</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746995705621.png" alt="file" /></p>
<p><strong>注意</strong>：部分模型（如 RoPE）不引入可学习的位置编码参数。</p>
<h3>3.2 单层 Transformer 参数量</h3>
<p>一个 Transformer 层包含以下部分：</p>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746995889843.png" alt="file" />
<img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746995912183.png" alt="file" />
<img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746995968415.png" alt="file" /></p>
<h3>3.3 所有 Transformer 层参数量</h3>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746995994805.png" alt="file" /></p>
<hr />
<h2>4. 简化公式（近似估计）</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996010373.png" alt="file" /></p>
<hr />
<h2>5. 示例：BERT-base 参数量估计</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996027987.png" alt="file" /></p>
<h3>5.1 嵌入层</h3>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996041227.png" alt="file" /></p>
<h3>5.2 单层 Transformer</h3>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996056404.png" alt="file" /></p>
<h3>5.3 所有层</h3>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996068601.png" alt="file" /></p>
<h3>5.4 输出层</h3>
<p>BERT 共享嵌入层和输出层权重，仅偏置：</p>
<pre><code>![file](https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996080492.png)</code></pre>
<h3>5.5 总参数量</h3>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996090659.png" alt="file" /></p>
<p><strong>结果</strong>：BERT-base 参数量约为 <strong>1.1 亿</strong>，与官方一致。</p>
<hr />
<h2>6. 扩展：其他模型估计</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996103738.png" alt="file" /></p>
<hr />
<h2>7. 注意事项</h2>
<ul>
<li><strong>权重共享</strong>：嵌入层和输出层共享时，需调整计算。</li>
<li><strong>优化技术</strong>：如 LoRA、量化影响存储需求，但不改变原始参数量。</li>
<li><strong>变体架构</strong>：如 Linformer、Performer 可能减少参数。</li>
<li><strong>偏置和 LayerNorm</strong>：大模型中占比小，小模型中不可忽略。</li>
</ul>
<hr />
<h2>8. 总结</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/05/image-1746996120925.png" alt="file" /></p>
