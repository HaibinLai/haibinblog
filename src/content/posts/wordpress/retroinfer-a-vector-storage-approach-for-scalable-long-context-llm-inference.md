---
title: "RetroInfer A Vector Storage Approach for Scalable Long-Context LLM Inference"
description: "RetroInfer: A Vector Storage Approach for Scalable Long-Context LLM Inference 微软新突破：RetroInfer如何让AI模型处理百万级文本不再\"卡顿\"？ microsoft/RetrievalAttention: Scalable long-context LLM decoding that leverages sparsity—by treating th…"
publishedAt: "2025-07-04 02:42:49"
category: "Paper Reading"
tags: []
draft: false
slug: "retroinfer-a-vector-storage-approach-for-scalable-long-context-llm-inference"
legacySlug: "retroinfer-a-vector-storage-approach-for-scalable-long-context-llm-inference"
wordpressId: 887
sourceUrl: "https://www.haibinlaiblog.top/index.php/retroinfer-a-vector-storage-approach-for-scalable-long-context-llm-inference/"
commentCount: 0
importedFromWordPress: true
---
<p>RetroInfer: A Vector Storage Approach for Scalable Long-Context LLM Inference</p>
<p><a href="https://www.msn.com/zh-cn/%E6%8A%80%E6%9C%AF/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/%E5%BE%AE%E8%BD%AF%E6%96%B0%E7%AA%81%E7%A0%B4-retroinfer%E5%A6%82%E4%BD%95%E8%AE%A9ai%E6%A8%A1%E5%9E%8B%E5%A4%84%E7%90%86%E7%99%BE%E4%B8%87%E7%BA%A7%E6%96%87%E6%9C%AC%E4%B8%8D%E5%86%8D-%E5%8D%A1%E9%A1%BF/ar-AA1EmXDH">微软新突破：RetroInfer如何让AI模型处理百万级文本不再&quot;卡顿&quot;？</a>
<a href="https://github.com/microsoft/RetrievalAttention">microsoft/RetrievalAttention: Scalable long-context LLM decoding that leverages sparsity—by treating the KV cache as a vector storage system.</a>
<a href="https://arxiv.org/pdf/2505.02922">RetroInfer: A Vector-Storage Approach for Scalable Long-Context LLM Inference</a></p>
<p>正如在拥挤的图书馆中找书变得困难一样，当文本长度增加，目前的AI模型不仅面临内存不足的问题，还面临&quot;查找效率&quot;的瓶颈——它需要在海量信息中反复查找关键内容，这极大拖慢了处理速度。</p>
<p><strong>RetroInfer：打造AI专属的智能图书馆系统</strong></p>
<p>面对这一挑战，微软研究团队提出了一个独特的视角：何不把整个键值缓存重新设计为一个&quot;向量存储系统&quot;？这就像是将混乱的图书馆改造成一个高效智能的图书管理系统。
在传统图书馆中，如果你想找一本特定的书，可能需要查遍所有书架。但在现代图书馆系统中，有分类索引、推荐系统和快速检索功能，帮你迅速定位最重要的书籍。RetroInfer正是基于这种思想设计的。
研究人员发现，在AI处理文本时，并非所有词语都同等重要。实际上，对于任何特定的查询，只有少部分词语（约2%）真正支配着模型的注意力输出。这就像在阅读一篇长文章时，你的大脑会自动聚焦于关键段落，而非均等地关注每个字。
RetroInfer巧妙地利用了这一&quot;注意力稀疏性&quot;特点，创建了一个系统，它能够：</p>
<p>识别出对当前处理最重要的少量词语只将这些关键词加载到快速的GPU内存中将其余大量不太重要的词语存储在容量更大但速度较慢的CPU内存中在需要时智能地在GPU和CPU之间调度数据</p>
<h2>wave index与wave buffer：AI的智能检索与资源调度系统</h2>
<p>RetroInfer系统的核心由两个关键组件构成：wave index（波形索引）和wave buffer（波形缓冲区）。让我们用通俗的语言来理解它们的工作原理。</p>
<h3>wave index：智能图书分类与检索系统</h3>
<p>想象一下，在一个图书馆中，如果书籍随意摆放，查找特定信息将非常困难。wave index就像是一个智能图书分类系统，它会根据内容相似性将书籍分组。
具体来说，wave index采用了三种创新技术：
首先是&quot;三部分注意力近似&quot;。它将所有词语（token）分为三类区域：<strong>稳定区（steady zone）、检索区（retrieval zone）和估计区（estimation zone）</strong>。</p>
<p><strong>稳定区</strong>包含那些位于文本开头和结尾的词语，研究发现这些位置的词语通常比较重要，所以直接将它们放入&quot;阅览室&quot;（GPU）中。就像图书馆中的参考书区，这些书永远摆在最显眼的位置。
<strong>检索区</strong>包含那些经过智能索引系统判断为重要的词语。系统会将相似的词语分组成&quot;聚类&quot;，然后根据查询需要，选择最相关的聚类加载到GPU中。这就像图书馆根据你的研究主题，为你选择最相关的几本专业书籍。
<strong>估计区</strong>则包含那些不太重要的词语，它们被留在CPU内存中。但有趣的是，RetroInfer并不完全忽略它们，而是使用一种&quot;精度有界的注意力估计&quot;技术，大致估算它们的贡献，确保结果的准确性。这就像图书管理员虽然没有给你取出所有相关书籍，但能告诉你：&quot;其他书架上还有约300本相关书籍，大致内容是这样的...&quot;</p>
<p>其次是&quot;分段聚类&quot;技术。传统的聚类方法处理超长文本时计算成本很高。RetroInfer的创新之处在于，它将长文本分成多个段落独立进行聚类，显著提高了效率。这就像图书馆不是对所有书籍一起分类，而是先按大类（如文学、科学、历史）分区，然后在每个区内进行更细致的分类，这样既保证了分类质量，又提高了效率。</p>
<h3>wave buffer：智能资源调度系统</h3>
<p>如果说wave index负责找出最重要的信息，那么wave buffer就负责高效地管理这些信息的存储和移动。</p>
<p>wave buffer就像图书馆的布局和书籍调度系统，它决定哪些书放在阅览室，哪些书放在书库，以及如何在两者之间高效地移动书籍。</p>
<p>wave buffer在GPU中维护几个关键区域：一个用于存放稳定区词语的小缓冲区，一个用于存放检索区词语的块缓存（block cache），以及一个专门用于注意力计算的执行缓冲区（execution buffer）。</p>
<p>更巧妙的是，wave buffer采用了&quot;异步缓存更新&quot;技术。在传统系统中，当需要新数据时，处理器必须等待数据加载完成才能继续工作。而RetroInfer将缓存访问和缓存更新分离：当模型需要新数据时，系统立即提供已有数据供GPU处理，同时在后台异步更新缓存，无需让GPU等待。这就像图书管理员在你查阅一本书的同时，悄悄地整理书架，为你的下一个需求做准备，极大提高了效率。</p>
