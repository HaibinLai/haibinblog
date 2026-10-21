---
title: "Learning how to detect AI-generated text: use RAID benchmarks as an example"
description: "RAID Benchmark: Multi-Generator Detection & Adversarial Robustness Analysis 数据挖掘方面的小项目。最核心的idea是，AI生成的文本短小，且喜欢概括核心思想。检测的主要办法是再用AI跑，看困惑度。 final report: https://github.com/HaibinLai/HC3/blob/main/reports/data_mining_proj%…"
publishedAt: "2026-08-09T07:01:08Z"
updatedAt: "2026-08-09T07:13:43Z"
category: "principle"
categories: ["principle"]
tags: ["AI", "GPT"]
author: "GB"
draft: false
slug: "learning-how-to-detect-ai-generated-text-use-raid-benchmarks-as-an-example"
legacySlug: "learning-how-to-detect-ai-generated-text-use-raid-benchmarks-as-an-example"
oldSlugs: []
wordpressId: 1570
sourceUrl: "https://www.haibinlaiblog.top/index.php/learning-how-to-detect-ai-generated-text-use-raid-benchmarks-as-an-example/"
commentCount: 0
viewCount: 819
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<h1>RAID Benchmark: Multi-Generator Detection &amp; Adversarial Robustness Analysis</h1>
<p>数据挖掘方面的小项目。最核心的idea是，AI生成的文本短小，且喜欢概括核心思想。检测的主要办法是再用AI跑，看困惑度。</p>
<p>final report: <a href="https://github.com/HaibinLai/HC3/blob/main/reports/data_mining_proj%20(3).pdf">https://github.com/HaibinLai/HC3/blob/main/reports/data_mining_proj%20(3).pdf</a></p>
<p>project repo: <a href="https://github.com/HaibinLai/detect-AI-generated-text">https://github.com/HaibinLai/detect-AI-generated-text</a></p>
<blockquote>
<p><strong>数据集</strong>: RAID — Robust AI Text Detection Benchmark (Dugan et al., ACL 2024)</p>
<p><strong>论文</strong>: <a href="https://arxiv.org/abs/2405.07940">arxiv 2405.07940</a></p>
<p><strong>实验脚本</strong>: <a href="https://github.com/HaibinLai/HC3/blob/main/src/run_raid.py"><code>src/run_raid.py</code></a>（方法对比） | <a href="https://github.com/HaibinLai/HC3/blob/main/src/run_raid_analysis.py"><code>src/run_raid_analysis.py</code></a>（深度分析）</p>
<p><strong>父项目</strong>: <a href="https://github.com/HaibinLai/HC3/blob/main/README.md">README.md</a> — 完整的多数据集 AI 文本检测研究</p>
</blockquote>
<hr />
<h2>1. 数据集概览</h2>
<p>RAID 是目前最全面的 AI 文本检测基准，由 UPenn 团队于 ACL 2024 发布。</p>
<h3>1.1 规模</h3>
<table>
<thead>
<tr>
<th>指标</th>
<th>数值</th>
</tr>
</thead>
<tbody>
<tr>
<td>总文本数</td>
<td>467,985</td>
</tr>
<tr>
<td>人类文本</td>
<td>13,371 (2.9%)</td>
</tr>
<tr>
<td>AI 文本</td>
<td>454,614 (97.1%)</td>
</tr>
<tr>
<td>AI 生成器</td>
<td>11 种</td>
</tr>
<tr>
<td>领域</td>
<td>8 个</td>
</tr>
<tr>
<td>对抗攻击</td>
<td>11 种</td>
</tr>
<tr>
<td>解码策略</td>
<td>4 种</td>
</tr>
</tbody>
</table>
<h3>1.2 生成器分布</h3>
<table>
<thead>
<tr>
<th>生成器</th>
<th>数量</th>
<th>类型</th>
<th>时代</th>
</tr>
</thead>
<tbody>
<tr>
<td>Llama-2-70B-Chat</td>
<td>53,484</td>
<td>开源</td>
<td>2023</td>
</tr>
<tr>
<td>MPT-30B</td>
<td>53,484</td>
<td>开源</td>
<td>2023</td>
</tr>
<tr>
<td>MPT-30B-Chat</td>
<td>53,484</td>
<td>开源</td>
<td>2023</td>
</tr>
<tr>
<td>GPT-2 XL</td>
<td>53,484</td>
<td>开源</td>
<td>2019</td>
</tr>
<tr>
<td>Mistral-7B</td>
<td>53,484</td>
<td>开源</td>
<td>2023</td>
</tr>
<tr>
<td>Mistral-7B-Chat</td>
<td>53,484</td>
<td>开源</td>
<td>2023</td>
</tr>
<tr>
<td>GPT-3 (davinci)</td>
<td>26,742</td>
<td>闭源</td>
<td>2020</td>
</tr>
<tr>
<td>Cohere</td>
<td>26,742</td>
<td>闭源</td>
<td>2023</td>
</tr>
<tr>
<td>ChatGPT</td>
<td>26,742</td>
<td>闭源</td>
<td>2022</td>
</tr>
<tr>
<td>GPT-4</td>
<td>26,742</td>
<td>闭源</td>
<td>2023</td>
</tr>
<tr>
<td>Cohere-Chat</td>
<td>26,742</td>
<td>闭源</td>
<td>2023</td>
</tr>
</tbody>
</table>
<h3>1.3 领域分布</h3>
<table>
<thead>
<tr>
<th>领域</th>
<th>数量</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>books</td>
<td>62,335</td>
<td>书籍摘要</td>
</tr>
<tr>
<td>news</td>
<td>62,300</td>
<td>NYT 新闻</td>
</tr>
<tr>
<td>reddit</td>
<td>62,265</td>
<td>Reddit 帖子</td>
</tr>
<tr>
<td>wiki</td>
<td>62,265</td>
<td>Wikipedia</td>
</tr>
<tr>
<td>recipes</td>
<td>62,020</td>
<td>食谱</td>
</tr>
<tr>
<td>poetry</td>
<td>61,985</td>
<td>诗歌</td>
</tr>
<tr>
<td>abstracts</td>
<td>61,810</td>
<td>arXiv 摘要</td>
</tr>
<tr>
<td>reviews</td>
<td>33,005</td>
<td>IMDb 影评</td>
</tr>
</tbody>
</table>
<h3>1.4 对抗攻击</h3>
<table>
<thead>
<tr>
<th>攻击类型</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>paraphrase</td>
<td>用 LLM 释义重写</td>
</tr>
<tr>
<td>synonym</td>
<td>同义词替换</td>
</tr>
<tr>
<td>homoglyph</td>
<td>视觉相似字符替换（如 a→α）</td>
</tr>
<tr>
<td>zero_width_space</td>
<td>插入零宽空格</td>
</tr>
<tr>
<td>whitespace</td>
<td>添加额外空白</td>
</tr>
<tr>
<td>upper_lower</td>
<td>大小写随机交换</td>
</tr>
<tr>
<td>number</td>
<td>数字替换</td>
</tr>
<tr>
<td>article_deletion</td>
<td>删除冠词</td>
</tr>
<tr>
<td>alternative_spelling</td>
<td>使用替代拼写</td>
</tr>
<tr>
<td>perplexity_misspelling</td>
<td>基于困惑度的拼写错误</td>
</tr>
<tr>
<td>insert_paragraphs</td>
<td>插入段落分隔</td>
</tr>
</tbody>
</table>
<h3>1.5 解码策略</h3>
<table>
<thead>
<tr>
<th>策略</th>
<th>温度</th>
<th>重复惩罚</th>
</tr>
</thead>
<tbody>
<tr>
<td>Greedy</td>
<td>T=0</td>
<td>无</td>
</tr>
<tr>
<td>Sampling</td>
<td>T=1</td>
<td>无</td>
</tr>
<tr>
<td>Greedy + RepPenalty</td>
<td>T=0</td>
<td>θ=1.2</td>
</tr>
<tr>
<td>Sampling + RepPenalty</td>
<td>T=1</td>
<td>θ=1.2</td>
</tr>
</tbody>
</table>
<hr />
<h2>2. 实验设置</h2>
<h3>2.1 数据划分</h3>
<p>从 468K 无攻击数据中分层采样：</p>
<table>
<thead>
<tr>
<th>划分</th>
<th>样本数</th>
<th>AI 比例</th>
</tr>
</thead>
<tbody>
<tr>
<td>训练集</td>
<td>50,696</td>
<td>78.9%</td>
</tr>
<tr>
<td>测试集</td>
<td>12,675</td>
<td>78.9%</td>
</tr>
</tbody>
</table>
<h3>2.2 方法</h3>
<table>
<thead>
<tr>
<th>方法</th>
<th>范式</th>
<th>是否训练</th>
<th>特征维度</th>
</tr>
</thead>
<tbody>
<tr>
<td>XGBoost (90 features)</td>
<td>手工特征 + 传统 ML</td>
<td>有监督</td>
<td>90</td>
</tr>
<tr>
<td>Token features (Mistral-7B)</td>
<td>LLM 概率特征 + ML</td>
<td>有监督</td>
<td>30</td>
</tr>
<tr>
<td>Fast-DetectGPT</td>
<td>零样本概率曲率</td>
<td>无需训练</td>
<td>—</td>
</tr>
</tbody>
</table>
<hr />
<h2>3. 方法对比结果</h2>
<h3>3.1 总体性能</h3>
<table>
<thead>
<tr>
<th>方法</th>
<th>ROC AUC</th>
<th>Accuracy</th>
<th>耗时</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>XGBoost (90 特征)</strong></td>
<td><strong>0.9951</strong></td>
<td><strong>0.9714</strong></td>
<td>15 min</td>
</tr>
<tr>
<td>Token features (Mistral-7B)</td>
<td>0.9900</td>
<td>0.9590</td>
<td>54 min</td>
</tr>
<tr>
<td>Fast-DetectGPT (零样本)</td>
<td>0.7815</td>
<td>0.7452</td>
<td>2 min</td>
</tr>
</tbody>
</table>
<h3>3.2 Per-Model 检测准确率</h3>
<table>
<thead>
<tr>
<th>生成器</th>
<th>Accuracy</th>
<th>生成器</th>
<th>Accuracy</th>
</tr>
</thead>
<tbody>
<tr>
<td>ChatGPT</td>
<td>96.2%</td>
<td>GPT-4</td>
<td>77.3%</td>
</tr>
<tr>
<td>GPT-3</td>
<td>94.5%</td>
<td>Llama-2-70B-Chat</td>
<td>86.1%</td>
</tr>
<tr>
<td>Cohere-Chat</td>
<td>84.4%</td>
<td>Mistral-7B-Chat</td>
<td>82.0%</td>
</tr>
<tr>
<td>Cohere</td>
<td>77.9%</td>
<td>MPT-30B</td>
<td>47.4%</td>
</tr>
<tr>
<td>GPT-2 XL</td>
<td>79.9%</td>
<td>MPT-30B-Chat</td>
<td>64.0%</td>
</tr>
<tr>
<td>Mistral-7B</td>
<td>59.5%</td>
<td>Human</td>
<td>74.5%</td>
</tr>
</tbody>
</table>
<p><strong>分析</strong>：</p>
<ul>
<li><strong>ChatGPT 和 GPT-3 最易检测</strong>（&gt;94%），因为它们的生成模式最&quot;模板化&quot;</li>
<li><strong>MPT-30B 最难检测</strong>（47.4%），其生成风格最接近人类文本</li>
<li><strong>Mistral-7B（非 chat）也较难</strong>（59.5%），base model 的输出更随机</li>
<li><strong>Human 准确率 74.5%</strong> 意味着有 25.5% 的人类文本被误判为 AI
<h3>3.3 Per-Domain AUC</h3></li>
</ul>
<table>
<thead>
<tr>
<th>领域</th>
<th>AUC</th>
<th>分析</th>
</tr>
</thead>
<tbody>
<tr>
<td>wiki</td>
<td>0.8441</td>
<td>AI 的百科风格与 Wikipedia 差异最大</td>
</tr>
<tr>
<td>reviews</td>
<td>0.8412</td>
<td>影评的个人色彩使 AI 更易区分</td>
</tr>
<tr>
<td>books</td>
<td>0.8214</td>
<td>—</td>
</tr>
<tr>
<td>reddit</td>
<td>0.8214</td>
<td>—</td>
</tr>
<tr>
<td>news</td>
<td>0.8126</td>
<td>—</td>
</tr>
<tr>
<td>abstracts</td>
<td>0.7833</td>
<td>学术摘要的格式较固定，AI 更易伪装</td>
</tr>
<tr>
<td>recipes</td>
<td>0.7407</td>
<td>食谱的结构化格式对 AI 友好</td>
</tr>
<tr>
<td><strong>poetry</strong></td>
<td><strong>0.6137</strong></td>
<td>诗歌本身高度风格化，人类/AI 统计特征差异最小</td>
</tr>
</tbody>
</table>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_comparison.png" alt="RAID comparison" /></p>
<hr />
<h2>4. 对抗攻击鲁棒性分析</h2>
<h3>4.1 XGBoost 在 11 种攻击下的表现</h3>
<table>
<thead>
<tr>
<th>攻击方式</th>
<th>AUC</th>
<th>AUC 下降</th>
<th>评价</th>
</tr>
</thead>
<tbody>
<tr>
<td>insert_paragraphs</td>
<td>0.9915</td>
<td>-0.004</td>
<td>✅ 几乎无影响</td>
</tr>
<tr>
<td>whitespace</td>
<td>0.9701</td>
<td>-0.025</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>alternative_spelling</td>
<td>0.9686</td>
<td>-0.027</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>perplexity_misspelling</td>
<td>0.9682</td>
<td>-0.027</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>upper_lower</td>
<td>0.9680</td>
<td>-0.027</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>number</td>
<td>0.9686</td>
<td>-0.027</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>synonym</td>
<td>0.9660</td>
<td>-0.029</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>article_deletion</td>
<td>0.9676</td>
<td>-0.028</td>
<td>✅ 鲁棒</td>
</tr>
<tr>
<td>homoglyph</td>
<td>0.9516</td>
<td>-0.044</td>
<td>⚠️ 轻微下降</td>
</tr>
<tr>
<td><strong>zero_width_space</strong></td>
<td><strong>0.8424</strong></td>
<td><strong>-0.153</strong></td>
<td>❌ 显著下降</td>
</tr>
<tr>
<td><strong>paraphrase</strong></td>
<td><strong>0.7902</strong></td>
<td><strong>-0.205</strong></td>
<td>❌ 最致命攻击</td>
</tr>
</tbody>
</table>
<h3>4.2 攻击分类</h3>
<p><strong>表面攻击（AUC 下降 &lt; 5%）</strong>：</p>
<ul>
<li>拼写、大小写、数字、冠词删除、同义词替换、段落插入</li>
<li>这些攻击只改变字符/词级别的表面形式，不影响文本的统计结构</li>
<li>XGBoost 的 90 维特征中，大量是句子级和文档级统计，对字符级干扰天然鲁棒</li>
</ul>
<p><strong>深层攻击（AUC 下降 &gt; 15%）</strong>：</p>
<ul>
<li><strong>释义（paraphrase）</strong>：AUC 下降 20.5%，是最有效的规避手段。释义重写从根本上改变了文本的词汇选择和句法结构，破坏了词汇丰富度、可读性等核心特征</li>
<li><strong>零宽空格（zero_width_space）</strong>：AUC 下降 15.3%。不可见的 Unicode 字符干扰了基于字符计数的特征（char_count、punct_ratio 等），导致统计量失真
<h3>4.3 特征偏移分析</h3></li>
</ul>
<p>释义攻击使 AI 文本的特征分布向人类文本方向偏移：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_attack_feature_shift.png" alt="Attack feature shift" /></p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_adversarial.png" alt="RAID adversarial" /></p>
<hr />
<h2>5. 特征消融实验</h2>
<h3>5.1 各特征组独立判别能力</h3>
<table>
<thead>
<tr>
<th>特征组</th>
<th>特征数</th>
<th>RAID AUC</th>
<th>HC3 AUC</th>
<th>差异分析</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>basic_counts</strong></td>
<td>4</td>
<td><strong>0.9719</strong></td>
<td>0.9204</td>
<td>↑ 长度差异是最稳定的跨模型信号</td>
</tr>
<tr>
<td>averages</td>
<td>4</td>
<td>0.9665</td>
<td>0.9021</td>
<td>↑ 句长、段落长度差异跨模型稳定</td>
</tr>
<tr>
<td>punctuation</td>
<td>11</td>
<td>0.8617</td>
<td>0.9207</td>
<td>↓ 不同模型标点习惯各异</td>
</tr>
<tr>
<td>lexical_richness</td>
<td>7</td>
<td>0.8503</td>
<td>0.9367</td>
<td>↓ 现代模型的词汇丰富度提升</td>
</tr>
<tr>
<td>embedding_pca</td>
<td>50</td>
<td>0.7624</td>
<td>0.8972</td>
<td>↓ 语义空间更复杂</td>
</tr>
<tr>
<td>readability</td>
<td>7</td>
<td>0.6966</td>
<td>0.9741</td>
<td>↓↓ 不同模型的可读性各异</td>
</tr>
<tr>
<td>variability</td>
<td>2</td>
<td>0.6830</td>
<td>0.8987</td>
<td>↓</td>
</tr>
<tr>
<td>structure</td>
<td>1</td>
<td>0.5955</td>
<td>0.8965</td>
<td>↓</td>
</tr>
<tr>
<td><strong>perplexity</strong></td>
<td>2</td>
<td><strong>0.4920</strong></td>
<td><strong>0.9912</strong></td>
<td>↓↓↓ 完全失效</td>
</tr>
</tbody>
</table>
<h3>5.2 关键发现：困惑度在多模型场景下失效</h3>
<p>这是 RAID 分析最重要的发现之一：</p>
<p><strong>HC3 上</strong>：GPT-2 困惑度是最强特征（AUC 0.9912），因为 HC3 只有 ChatGPT 一种生成器，AI 文本的困惑度一致地低于人类文本。</p>
<p><strong>RAID 上</strong>：GPT-2 困惑度完全失效（AUC 0.4920，低于随机猜测 0.5），因为：</p>
<ol>
<li>11 种生成器的困惑度分布各不相同</li>
<li>开源 base 模型（GPT-2 XL、Mistral-7B base）的困惑度可能高于人类文本</li>
<li>GPT-2 作为&quot;观察者&quot;，对不同生成器的评估标准不一致</li>
</ol>
<p><strong>启示</strong>：在实际部署中，如果面对的 AI 模型未知或多样化，<strong>不应依赖困惑度作为核心特征</strong>，而应以文本长度、句法结构等模型无关的统计量为主。</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_feature_ablation.png" alt="RAID feature ablation" /></p>
<hr />
<h2>6. SHAP 可解释性分析</h2>
<h3>6.1 SHAP Summary（Top 25 特征）</h3>
<p>SHAP beeswarm 图展示了 XGBoost 在 RAID 上最依赖的特征：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_shap_summary.png" alt="RAID SHAP summary" /></p>
<h3>6.2 SHAP 依赖图（Top 6 特征）</h3>
<p>展示各特征值与 SHAP 值的关系，颜色为最强交互特征：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_shap_dependence.png" alt="RAID SHAP dependence" /></p>
<h3>6.3 SHAP Waterfall（4 个典型案例）</h3>
<p>对最自信的正确分类和最典型的错误分类，展示 SHAP 归因：</p>
<ul>
<li><strong>Correct Human</strong>：哪些特征使模型确信这是人类文本</li>
<li><strong>Correct AI</strong>：哪些特征使模型确信这是 AI 文本</li>
<li><strong>False Positive</strong>：人类文本为什么被误判为 AI</li>
<li><strong>False Negative</strong>：AI 文本为什么被误判为人类</li>
</ul>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_shap_waterfall.png" alt="RAID SHAP waterfall" /></p>
<h3>6.4 LR 系数分析</h3>
<p>Logistic Regression 的标准化系数提供了线性可解释性：</p>
<ul>
<li>正系数 → 指向 AI</li>
<li>负系数 → 指向 Human</li>
</ul>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_lr_coefficients.png" alt="RAID LR coefficients" /></p>
<hr />
<h2>7. 领域与特征分布分析</h2>
<h3>7.1 领域特征对比</h3>
<p>8 个领域中，关键特征在 Human/AI 间的分布差异：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_domain_feature_comparison.png" alt="RAID domain comparison" /></p>
<h3>7.2 特征相关性</h3>
<p>90 维特征的 Pearson 相关矩阵：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_correlation_heatmap.png" alt="RAID correlation" /></p>
<h3>7.3 PCA 降维可视化</h3>
<p>90 维特征 → 2D PCA：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_pca.png" alt="RAID PCA" /></p>
<h3>7.4 t-SNE 降维可视化</h3>
<p>90 维特征 → 2D t-SNE（5000 样本，perplexity=30）：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_tsne.png" alt="RAID t-SNE" /></p>
<hr />
<h2>8. Token 概率特征分析</h2>
<h3>8.1 方法</h3>
<p>使用 Mistral-7B-Instruct 提取 30 维 token-level 概率特征，训练 XGBoost。</p>
<table>
<thead>
<tr>
<th>指标</th>
<th>值</th>
</tr>
</thead>
<tbody>
<tr>
<td>Token 特征 AUC</td>
<td>0.9900</td>
</tr>
<tr>
<td>Token 特征 Accuracy</td>
<td>0.9590</td>
</tr>
</tbody>
</table>
<h3>8.2 Token SHAP 归因</h3>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_token_shap.png" alt="RAID token SHAP" /></p>
<h3>8.3 Token 特征分布（Human vs AI）</h3>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_token_distributions.png" alt="RAID token distributions" /></p>
<h3>8.4 Per-Model Token 特征</h3>
<p>11 个生成器 + Human 的 token 特征分布对比。可以看到 Human（蓝色）与各 AI 模型（红色）在 <code>rank_top100_frac</code>、<code>lp_mean</code> 等特征上的差异程度各不相同：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_per_model_features.png" alt="RAID per-model features" /></p>
<h3>8.5 Token 概率热力图</h3>
<p>每个词按 Mistral-7B 的预测概率着色（绿=可预测，红=出人意料）。直观展示 AI 文本的&quot;流畅度均匀性&quot; vs 人类文本的&quot;意外用词&quot;：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_token_heatmap.png" alt="RAID token heatmap" /></p>
<h3>8.6 Token t-SNE</h3>
<p>30 维 token 特征降到 2D。Human 和 AI 有清晰的分离趋势：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_token_tsne.png" alt="RAID token t-SNE" /></p>
<h3>8.7 误分类分析</h3>
<p>预测置信度分布、正确/错误分类的特征均值对比、TP/TN/FP/FN 饼图：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_misclassification.png" alt="RAID misclassification" /></p>
<hr />
<h2>9. RAID 独有分析</h2>
<h3>9.1 Model × Domain 检测准确率热力图</h3>
<p>11 个模型 × 8 个领域的检测准确率矩阵。可以精确定位哪些 (模型, 领域) 组合最难检测：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_model_domain_heatmap.png" alt="RAID model domain heatmap" /></p>
<h3>9.2 解码策略对比</h3>
<p>不同解码策略（Greedy, Sampling, +Repetition Penalty）对 AI 文本统计特征的影响：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_decoding_comparison.png" alt="RAID decoding comparison" /></p>
<h3>9.3 对抗攻击特征偏移（Paraphrase）</h3>
<p>对比 Human / AI (original) / AI (paraphrased) 的特征分布，展示释义攻击如何使 AI 文本&quot;伪装&quot;为人类文本：</p>
<p><img src="https://cdn.jsdelivr.net/gh/HaibinLai/HC3@main/figures/raid_attack_feature_shift.png" alt="RAID attack feature shift" /></p>
<hr />
<h2>10. 与其他数据集的对比分析</h2>
<h3>10.1 跨数据集方法对比</h3>
<table>
<thead>
<tr>
<th>数据集</th>
<th style="text-align: center;">XGBoost (90)</th>
<th style="text-align: center;">Token (Mistral)</th>
<th style="text-align: center;">Fast-DetectGPT</th>
</tr>
</thead>
<tbody>
<tr>
<td>HC3 (单模型)</td>
<td style="text-align: center;"><strong>0.9999</strong></td>
<td style="text-align: center;">0.9998</td>
<td style="text-align: center;">0.9292</td>
</tr>
<tr>
<td>SemEval (6 模型)</td>
<td style="text-align: center;">0.6872</td>
<td style="text-align: center;"><strong>0.9784</strong></td>
<td style="text-align: center;">0.8068</td>
</tr>
<tr>
<td>TuringBench (19 旧模型)</td>
<td style="text-align: center;"><strong>0.9841</strong></td>
<td style="text-align: center;">0.4853</td>
<td style="text-align: center;">0.6038</td>
</tr>
<tr>
<td>Pile (混合)</td>
<td style="text-align: center;">0.9831</td>
<td style="text-align: center;"><strong>0.9918</strong></td>
<td style="text-align: center;">0.8889</td>
</tr>
<tr>
<td><strong>RAID (11 模型)</strong></td>
<td style="text-align: center;"><strong>0.9951</strong></td>
<td style="text-align: center;">0.9900</td>
<td style="text-align: center;">0.7815</td>
</tr>
</tbody>
</table>
<h3>10.2 RAID 的定位</h3>
<p>RAID 在数据集家族中的独特价值：</p>
<table>
<thead>
<tr>
<th>特性</th>
<th>HC3</th>
<th>SemEval</th>
<th>TuringBench</th>
<th>Pile</th>
<th><strong>RAID</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td>模型数量</td>
<td>1</td>
<td>6</td>
<td>19</td>
<td>混合</td>
<td><strong>11</strong></td>
</tr>
<tr>
<td>包含 GPT-4</td>
<td>❌</td>
<td>✅</td>
<td>❌</td>
<td>❌</td>
<td><strong>✅</strong></td>
</tr>
<tr>
<td>对抗攻击</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
<td><strong>✅ (11 种)</strong></td>
</tr>
<tr>
<td>解码策略</td>
<td>—</td>
<td>—</td>
<td>—</td>
<td>—</td>
<td><strong>✅ (4 种)</strong></td>
</tr>
<tr>
<td>多领域</td>
<td>5</td>
<td>5</td>
<td>1</td>
<td>1</td>
<td><strong>8</strong></td>
</tr>
</tbody>
</table>
<p><strong>RAID 是唯一同时覆盖多模型、多领域、多攻击、多解码策略的基准</strong>，这使得它最适合评估检测系统的实际部署能力。</p>
<hr />
<h2>11. Key Findings</h2>
<ol>
<li>
<p><strong>XGBoost 90 特征在 RAID 上依然最强</strong>（AUC 0.9951），证明手工特征在多模型场景下的有效性。</p>
</li>
<li>
<p><strong>GPT-2 困惑度在多模型场景下完全失效</strong>（AUC 0.4920）。这是与 HC3（AUC 0.9912）最大的差异。多模型检测不能依赖单一语言模型的困惑度。</p>
</li>
<li>
<p><strong>基础计数特征（文本长度）是最稳定的跨模型信号</strong>（AUC 0.9719）。不同 AI 模型生成文本的长度分布差异是最一致的判别信号。</p>
</li>
<li>
<p><strong>释义攻击（paraphrase）是唯一能显著降低检测的手段</strong>（AUC 下降 20.5%），其他 10 种攻击对 XGBoost 几乎无效。</p>
</li>
<li>
<p><strong>诗歌领域最难检测</strong>（AUC 0.6137），因为诗歌本身高度风格化，人类/AI 的统计特征差异最小。</p>
</li>
<li>
<p><strong>MPT-30B 是最难检测的生成器</strong>（Accuracy 47.4%），其输出最接近人类文本的统计分布。</p>
</li>
<li>
<p><strong>实际部署建议</strong>：面对未知 AI 模型时，应以文本长度、句法结构等模型无关特征为主，辅以 token 概率特征；同时需针对释义攻击做专门防御。</p>
</li>
</ol>
<hr />
<h2>12. 文件列表</h2>
<table>
<thead>
<tr>
<th>文件</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>src/run_raid.py</code></td>
<td>RAID 方法对比实验 + 对抗攻击评估</td>
</tr>
<tr>
<td><code>src/run_raid_analysis.py</code></td>
<td>深度分析与可解释性（生成 20 张图）</td>
</tr>
<tr>
<td><code>data/external/raid/train_none.csv</code></td>
<td>RAID 无攻击数据 (468K, 765MB)</td>
</tr>
<tr>
<td><code>data/external/raid/train.csv</code></td>
<td>RAID 含攻击数据 (11GB)</td>
</tr>
<tr>
<td><code>data/processed/raid_features_*.csv</code></td>
<td>缓存的 90 维特征</td>
</tr>
<tr>
<td><code>data/processed/token_features_raid_*.csv</code></td>
<td>缓存的 token 概率特征</td>
</tr>
</tbody>
</table>
<h3>生成的图表 (20 张)</h3>
<table>
<thead>
<tr>
<th>图表</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>raid_comparison.png</code></td>
<td>方法对比柱状图</td>
</tr>
<tr>
<td><code>raid_adversarial.png</code></td>
<td>对抗攻击 AUC 下降图</td>
</tr>
<tr>
<td><code>raid_correlation_heatmap.png</code></td>
<td>特征相关性热力图</td>
</tr>
<tr>
<td><code>raid_domain_feature_comparison.png</code></td>
<td>8 领域特征对比</td>
</tr>
<tr>
<td><code>raid_pca.png</code></td>
<td>PCA 2D 散点图</td>
</tr>
<tr>
<td><code>raid_tsne.png</code></td>
<td>t-SNE 2D 散点图</td>
</tr>
<tr>
<td><code>raid_shap_summary.png</code></td>
<td>SHAP beeswarm (top 25)</td>
</tr>
<tr>
<td><code>raid_shap_dependence.png</code></td>
<td>SHAP 依赖图 (top 6)</td>
</tr>
<tr>
<td><code>raid_shap_waterfall.png</code></td>
<td>SHAP waterfall (4 案例)</td>
</tr>
<tr>
<td><code>raid_feature_ablation.png</code></td>
<td>特征消融实验</td>
</tr>
<tr>
<td><code>raid_lr_coefficients.png</code></td>
<td>LR top-20 系数</td>
</tr>
<tr>
<td><code>raid_token_shap.png</code></td>
<td>Token SHAP 归因</td>
</tr>
<tr>
<td><code>raid_token_distributions.png</code></td>
<td>Token 特征分布</td>
</tr>
<tr>
<td><code>raid_per_model_features.png</code></td>
<td>Per-model token 特征</td>
</tr>
<tr>
<td><code>raid_token_heatmap.png</code></td>
<td>Token 概率热力图</td>
</tr>
<tr>
<td><code>raid_token_tsne.png</code></td>
<td>Token t-SNE</td>
</tr>
<tr>
<td><code>raid_misclassification.png</code></td>
<td>误分类分析</td>
</tr>
<tr>
<td><code>raid_model_domain_heatmap.png</code></td>
<td>Model × Domain 热力图</td>
</tr>
<tr>
<td><code>raid_decoding_comparison.png</code></td>
<td>解码策略对比</td>
</tr>
<tr>
<td><code>raid_attack_feature_shift.png</code></td>
<td>对抗攻击特征偏移</td>
</tr>
</tbody>
</table>
<hr />
<h2>References</h2>
<ol>
<li>Dugan, L., Hwang, A., Trhlik, F., et al. (2024). <em>RAID: A Shared Benchmark for Robust Evaluation of Machine-Generated Text Detectors</em>. ACL 2024. <a href="https://arxiv.org/abs/2405.07940">arxiv 2405.07940</a></li>
<li>Bao, G., et al. (2024). <em>Fast-DetectGPT: Efficient Zero-Shot Detection of Machine-Generated Text via Conditional Probability Curvature</em>. ICLR 2024.</li>
<li>Hans, A., et al. (2024). <em>Spotting LLMs With Binoculars: Zero-Shot Detection of Machine-Generated Text</em>. ICML 2024.</li>
</ol>
