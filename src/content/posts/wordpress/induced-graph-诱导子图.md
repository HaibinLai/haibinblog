---
title: "Induced Graph 诱导子图"
description: "在图论中， 诱导子图 （Induced Subgraph）是从一个图 ( G ) 中通过 (1) 选取一个顶点子集 ( S ) 并 (2) 保留与这些顶点相连接的边来构造的子图。具体地说，诱导子图包含了选定顶点的所有邻接边。 定义 给定一个图 $G = (V, E)$ ，如果从 ( G ) 中选择一个顶点子集 ( S \\subseteq V )，那么 诱导子图 ( $G[S]$ ) 是由顶点集 $S$ 和边集 $E'$ 组成的图，其中…"
publishedAt: "2024-12-05 04:44:02"
updatedAt: "2024-12-05 04:44:35"
category: "Graph"
tags: ["Graph"]
draft: false
slug: "induced-graph-诱导子图"
legacySlug: "induced-graph-诱导子图"
wordpressId: 454
sourceUrl: "https://haibin-blog.vercel.app/index.php/induced-graph-%e8%af%b1%e5%af%bc%e5%ad%90%e5%9b%be/"
commentCount: 0
importedFromWordPress: true
---
<p><img src="https://haibin-blog.vercel.app/wp-content/uploads/2024/12/0C24B0FB10ACCFB08BB5237BF2014E22-300x130.jpg" alt="" /></p>
<p>在图论中，<strong>诱导子图</strong>（Induced Subgraph）是从一个图 ( G ) 中通过 (1) 选取一个顶点子集 ( S ) 并 (2) 保留与这些顶点相连接的边来构造的子图。具体地说，诱导子图包含了选定顶点的所有邻接边。</p>
<h3>定义</h3>
<p>给定一个图 $G = (V, E)$ ，如果从 ( G ) 中选择一个顶点子集 ( S \subseteq V )，那么<strong>诱导子图</strong> ( $G[S]$ ) 是由顶点集  $S$  和边集  $E'$  组成的图，其中 ( $E'$ ) 包含了所有连接 ( $S$ ) 中任意两个顶点的边，即：<br />
$$
E' = { {u, v} \mid u, v \in S, {u, v} \in E }
$$</p>
<p>换句话说，诱导子图 ( $G[S]$ ) 是一个包含顶点集 ( S ) 中的所有顶点和这些顶点在原图 ( G ) 中存在的边的图。</p>
<h3>举个例子</h3>
<p>考虑一个图 ( G ) 如下所示：</p>
<ul>
<li>顶点集：( $V = {A, B, C, D, E}$ )</li>
<li>边集：( $E = { {A, B}, {A, C}, {B, D}, {C, E}$ } )</li>
</ul>
<p>如果选择顶点子集 ( S = {A, B, C} )，则诱导子图 ( G[S] ) 包含顶点集 ( S = {A, B, C} ) 和在原图 ( G ) 中连接这些顶点的边。显然，原图中的边 ( {A, B}, {A, C} ) 会被保留，而 ( {B, D} ) 和 ( {C, E} ) 因为不完全在子集 ( S ) 中而被删除。因此，诱导子图 ( G[S] ) 包含以下内容：</p>
<ul>
<li>顶点集：( {A, B, C} )</li>
<li>边集：( { {A, B}, {A, C} } )</li>
</ul>
<h3>诱导子图的性质</h3>
<ol>
<li>
<p><strong>顶点子集决定子图：</strong> 诱导子图是由顶点子集 ( S ) 唯一确定的。给定顶点集 ( S )，诱导子图 ( G[S] ) 是唯一的。</p>
</li>
<li>
<p><strong>包含所有边：</strong> 诱导子图包括所有原图中，连接 ( S ) 中任意两个顶点的边。换句话说，如果边 ( {u, v} \in E ) 并且 ( u, v \in S )，那么边 ( {u, v} ) 就会包含在诱导子图中。</p>
</li>
<li>
<p><strong>更细粒度的操作：</strong> 诱导子图提供了一种查看图中局部结构的方式，特别适合分析图的局部属性或结构。</p>
</li>
</ol>
<h3>诱导子图的应用</h3>
<ol>
<li>
<p><strong>子图同构：</strong> 在图同构问题中，诱导子图可以用于检查两个图是否在某些顶点的映射下是同构的。</p>
</li>
<li>
<p><strong>图的子结构分析：</strong> 诱导子图在图的局部结构分析中非常有用，比如寻找图中的某些特定结构（如环、连通分量等）。</p>
</li>
<li>
<p><strong>图的压缩表示：</strong> 通过选择图中的特定顶点并诱导出子图，可以用于图的压缩表示或提取重要的局部特征。</p>
</li>
</ol>
<h3>总结</h3>
<p>诱导子图是图论中的一个重要概念，通常用于从原图中选择一个顶点子集，保留与这些顶点相连的所有边，形成一个新的子图。它在图的分析和操作中有着广泛的应用，尤其在研究图的局部结构时十分重要。</p>
