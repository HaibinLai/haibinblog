---
title: "CNN 的两个技术: UGC与BatchNorm"
description: "Unstructured Group Convolution 1. 普通 Group Convolution Group Convolution（分组卷积） 最早是 AlexNet（2012）用来解决 GPU 显存不足问题的。 做法 ：把输入通道分成几个组，每个组只跟自己的卷积核组连接计算。 好处 ：减少计算量和参数量（比如输入 64 个通道，分成 4 组，每组只卷 16 个通道，计算量大幅下降）。 结构特征 ：分组是规则且固定的，比…"
publishedAt: "2025-08-08T23:34:29Z"
category: "Machine Learning"
categories: ["Machine Learning"]
tags: ["CNN"]
author: "GB"
draft: false
slug: "cnn-的两个技术-ugc与batchnorm"
legacySlug: "cnn-的两个技术-ugc与batchnorm"
oldSlugs: []
wordpressId: 935
sourceUrl: "https://www.haibinlaiblog.top/index.php/cnn-%e7%9a%84%e4%b8%a4%e4%b8%aa%e6%8a%80%e6%9c%af-ugc%e4%b8%8ebatchnorm/"
commentCount: 0
viewCount: 816
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/cnn-%E7%9A%84%E4%B8%A4%E4%B8%AA%E6%8A%80%E6%9C%AF-ugc%E4%B8%8Ebatchnorm.webp"
---
<h2>Unstructured Group Convolution</h2>
<h3>1. 普通 Group Convolution</h3>
<p><strong>Group Convolution（分组卷积）</strong>最早是 AlexNet（2012）用来解决 GPU 显存不足问题的。</p>
<ul>
<li><strong>做法</strong>：把输入通道分成几个组，每个组只跟自己的卷积核组连接计算。</li>
<li><strong>好处</strong>：减少计算量和参数量（比如输入 64 个通道，分成 4 组，每组只卷 16 个通道，计算量大幅下降）。</li>
<li><strong>结构特征</strong>：分组是规则且固定的，比如通道 1–16 是第 1 组，17–32 是第 2 组……</li>
</ul>
<h3>2. “Unstructured”</h3>
<p>在 <strong>unstructured group convolution</strong> 里：</p>
<ul>
<li>分组<strong>不是规则划分</strong>（非连续、非均匀），通道之间的连接模式可能是任意的。</li>
<li>不同通道可能来自不同物理/语义特征，分组关系可以由算法、稀疏化、剪枝等方法生成。</li>
<li>分组结构不一定均衡：有的组可能通道多、有的少，甚至可能是高度稀疏的连接图。</li>
</ul>
<p>可以想象成：</p>
<ul>
<li><strong>普通 group conv</strong> 像一排整齐的座位，前排是第 1 组，后排是第 2 组；</li>
<li><strong>unstructured group conv</strong> 则是“随便坐”，谁和谁一组没有固定模式，还可能有人落单。</li>
</ul>
<h3>3. 为什么会有这种结构</h3>
<p>unstructured group convolution 往往是<strong>自动化网络压缩 / 稀疏化</strong>的结果：</p>
<ul>
<li>剪枝后，一些卷积核和输入通道的连接被删除，剩下的连接形成了“非规则”分组。</li>
<li>或者通过 NAS（神经网络架构搜索）得到的连接模式，本身就不均匀。</li>
</ul>
<h3>4. Load Balance 问题</h3>
<p>因为分组不规则，可能出现：</p>
<ul>
<li>某些组计算量大，某些组计算量小 → 在并行计算（GPU、TPU）时导致计算资源利用率低。</li>
<li>GPU kernel launch 需要针对不同组做不同处理 → 增加调度开销。</li>
</ul>
<p>文章在研究 <strong>unstructured group convolution 的 load balance</strong>，是在探索：</p>
<ul>
<li>如何重新分配通道 / 核参数，让各组负载更均衡；</li>
<li>或者如何设计计算调度策略，让 GPU 跑得更高效。</li>
</ul>
<h2>Batch Normalization</h2>
<p>Batch Normalization（BN）在 AI（尤其是深度学习）里重要，主要是因为它同时<strong>解决了训练稳定性</strong>和<strong>训练速度</strong>两个痛点，并且带来了副作用式的正则化效果。</p>
<p>我可以从 <strong>原理、好处、为什么重要</strong> 三个维度帮你捋一遍：</p>
<h3>1. 原理</h3>
<p>BN 的核心操作就是：<br />
对每个 mini-batch 内的激活值（通常是某一层的输出）做标准化，让它们的<strong>均值为 0、方差为 1</strong>，然后再引入可学习的缩放参数 γ 和平移参数 β：</p>
<p><code>$$x^=x−μbatchσbatch2+ϵ\hat{x} = \frac{x - \mu_{\text{batch}}}{\sqrt{\sigma^2_{\text{batch}} + \epsilon}} y=γx^+βy = \gamma \hat{x} + \beta$$</code></p>
<p>其中：</p>
<ul>
<li>$$μbatch\mu<em>{\text{batch}}、σbatch2\sigma^2</em>{\text{batch}} $$来自当前 batch</li>
<li>γ、β 学出来，让网络有能力恢复原本的分布（防止过强约束）</li>
</ul>
<h3>2. 好处</h3>
<p>BN 的价值不是一个单点，而是多个叠加效果：</p>
<p>(1) 缓解内部协变量偏移（Internal Covariate Shift）</p>
<ul>
<li>
<p>在深层网络里，上层参数更新会不断改变下层的输入分布</p>
</li>
<li>
<p>BN 让每层的输入分布稳定一些 → 训练更容易收敛</p>
<p>(2) 加速训练（更大学习率、更快收敛）</p>
</li>
<li>
<p>输入分布稳定 → 梯度方向更可控</p>
</li>
<li>
<p>在实践中，BN 允许使用更大学习率，而不会轻易发散</p>
</li>
</ul>
<p>(3) 降低梯度消失/爆炸风险</p>
<ul>
<li>标准化后的激活值在较适中范围 → 反向传播时梯度更稳定</li>
<li>对深网络尤其重要（ResNet 前就有这个痛点）</li>
</ul>
<p>(4) 带来正则化效果</p>
<ul>
<li>mini-batch 统计值有随机性，相当于给网络加了噪声</li>
<li>类似 Dropout，减少过拟合（虽然 BN 的正则化作用不如专门的正则方法）</li>
</ul>
<p>(5) 对权重初始化不敏感</p>
<ul>
<li>以前深网络训练要精细调初始化参数</li>
<li>BN 之后，随便用常见初始化方法也能稳定训练</li>
</ul>
<h3>3. 为什么重要（历史意义）</h3>
<p>在 BN 2015 年提出之前：</p>
<ul>
<li>深层 CNN / RNN 很容易梯度消失/爆炸</li>
<li>要训练一个很深的网络，需要极小学习率 + 很多调参</li>
<li>ImageNet 级别网络的训练时间动辄要几周</li>
</ul>
<p>BN 出来之后：</p>
<ul>
<li><strong>ResNet-152</strong> 等超深网络能顺利训练</li>
<li>收敛速度大幅提升，很多任务的训练时间直接砍半甚至更多</li>
<li>成为卷积网络、Transformer 中的<strong>标配模块</strong>（虽然 Transformer 里更多用 LayerNorm，但思想相同）</li>
</ul>
<p>Batch Norm 重要是因为它<strong>稳定了深层网络的训练过程</strong>、<strong>允许更快收敛</strong>、<strong>减少对初始化和学习率的敏感性</strong>，并且<strong>在早期深度学习浪潮中解决了“深度无法训练”的关键瓶颈</strong>。</p>
