---
title: "CSR与邻接表的内存开销对比"
description: "邻接列表（Adjacency List） 和 压缩稀疏行（CSR，Compressed Sparse Row） 是两种常见的图表示方法，它们的空间效率在不同情况下有所差异。具体来说，哪个表示法更节省空间，取决于图的稀疏程度和实际的存储需求。 1. 邻接列表（Adjacency List） 在邻接列表中，每个顶点有一个列表，存储与该顶点相邻的所有顶点。每个顶点的邻接列表可能包含不同数量的邻居，因此每个顶点的存储大小是变化的。 结构 ：…"
publishedAt: "2024-11-06T18:09:06Z"
updatedAt: "2025-05-22T21:05:39Z"
category: "Micro Topics"
categories: ["Micro Topics"]
tags: ["图存储", "图计算"]
author: "GB"
draft: false
slug: "csr与邻接表的内存开销对比"
legacySlug: "csr与邻接表的内存开销对比"
oldSlugs: []
wordpressId: 407
sourceUrl: "https://www.haibinlaiblog.top/index.php/csr%e4%b8%8e%e9%82%bb%e6%8e%a5%e8%a1%a8%e7%9a%84%e5%86%85%e5%ad%98%e5%bc%80%e9%94%80%e5%af%b9%e6%af%94/"
commentCount: 0
viewCount: 1275
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2024/08/95350.jpg"
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-11/csr%E4%B8%8E%E9%82%BB%E6%8E%A5%E8%A1%A8%E7%9A%84%E5%86%85%E5%AD%98%E5%BC%80%E9%94%80%E5%AF%B9%E6%AF%94.webp"
---
<p><strong>邻接列表（Adjacency List）</strong> 和 <strong>压缩稀疏行（CSR，Compressed Sparse Row）</strong> 是两种常见的图表示方法，它们的空间效率在不同情况下有所差异。具体来说，哪个表示法更节省空间，取决于图的稀疏程度和实际的存储需求。</p>
<h3>1. <strong>邻接列表（Adjacency List）</strong></h3>
<p>在邻接列表中，每个顶点有一个列表，存储与该顶点相邻的所有顶点。每个顶点的邻接列表可能包含不同数量的邻居，因此每个顶点的存储大小是变化的。</p>
<p><strong>结构</strong>：</p>
<ul>
<li>每个顶点存储一个列表（或者数组），该列表包含与之相邻的顶点的索引。</li>
<li>每个顶点的邻接列表的大小取决于该顶点的度（即与它相连的边的数量）。</li>
</ul>
<p><strong>空间复杂度</strong>：</p>
<ul>
<li>总空间复杂度是 <strong>O(V + E)</strong>，其中 <code>V</code> 是顶点数，<code>E</code> 是边数。</li>
<li>每个边在图中被存储了两次（一次在起点，一次在终点），如果图是无向图，每条边会在两个顶点的邻接列表中都出现一次。</li>
</ul>
<h3>2. <strong>压缩稀疏行（CSR，Compressed Sparse Row）</strong></h3>
<p>CSR 是一种将稀疏矩阵压缩存储的方式，广泛应用于图的存储，尤其是在矩阵形式表示的图（例如邻接矩阵）中。它将图的邻接信息压缩成三个数组：<code>values</code>、<code>columns</code> 和 <code>row_ptr</code>。</p>
<p><strong>结构</strong>：</p>
<ul>
<li><strong><code>row_ptr</code></strong>：一个数组，表示每个顶点的邻接列表在 <code>columns</code> 和 <code>values</code> 数组中的起始位置。它的大小为 <code>V + 1</code>。</li>
<li><strong><code>columns</code></strong>：一个数组，存储所有的邻接顶点的列索引（即，边的目标顶点）。</li>
<li><strong><code>values</code></strong>：一个数组，存储边的权重（如果有的话），或者如果是无权图，存储每条边的标记或简单值。</li>
</ul>
<p><strong>空间复杂度</strong>：</p>
<ul>
<li>总空间复杂度是 <strong>O(V + E)</strong>，其中 <code>V</code> 是顶点数，<code>E</code> 是边数。</li>
<li>相比邻接列表，CSR 不会为每个顶点存储一个完整的列表，而是将所有顶点的邻接信息压缩到两个数组（<code>columns</code> 和 <code>values</code>），使用 <code>row_ptr</code> 数组来记录每个顶点的起始位置。</li>
</ul>
<h3>3. <strong>比较空间效率</strong></h3>
<h4><strong>稀疏图：</strong></h4>
<ul>
<li><strong>CSR 更节省空间</strong>：对于一个稀疏图，特别是当图的边远少于顶点数时，CSR 更能有效利用空间。因为在 CSR 中，我们将所有邻接信息都压缩到两个数组中，<code>row_ptr</code> 数组仅包含 <code>V + 1</code> 个元素，而 <code>columns</code> 和 <code>values</code> 数组只包含图中的边的信息（即 <code>E</code> 个元素）。因此，CSR 在存储时更紧凑。</li>
<li><strong>邻接列表也很节省空间</strong>：在稀疏图中，邻接列表的空间开销通常也比较小，因为每个顶点的邻接列表只会存储实际的邻接顶点（即边的数量）。但对于每个顶点，都会有额外的存储空间开销，用来存储指向邻接顶点的指针或容器（如 <code>std::vector</code>）。</li>
</ul>
<h4><strong>稠密图：</strong></h4>
<ul>
<li><strong>CSR 可能不如邻接列表节省空间</strong>：在稠密图中（即边的数量接近顶点数的平方），图的邻接信息几乎会填满整个存储空间。此时，CSR 和邻接列表的空间差异可能不太显著，甚至邻接列表可能更简单高效，因为它能够较自然地表示每个顶点的邻接关系，而无需进行压缩。</li>
</ul>
<h3>4. <strong>总结：</strong></h3>
<ul>
<li><strong>CSR 更节省空间</strong>：在稀疏图的情况下，CSR 相比邻接列表更节省空间。因为它通过压缩存储方式（将所有的边集中在 <code>columns</code> 和 <code>values</code> 数组中）减少了存储开销，而邻接列表对于每个顶点都会分配一个单独的存储结构（如数组或列表）。</li>
<li><strong>邻接列表在稠密图下可能更高效</strong>：如果图较为稠密，邻接列表的存储可能与 CSR 的存储开销差不多，或者邻接列表在某些实现中可能更简单。</li>
</ul>
<p>因此，<strong>CSR</strong> 在大多数稀疏图的应用场景中更节省空间，但对于非常稠密的图或要求简单结构的场景，<strong>邻接列表</strong> 可能会更灵活且开销较小。</p>
