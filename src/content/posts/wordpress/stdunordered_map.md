---
title: "std::unordered_map"
description: "是的， std::unordered_map 的本质是 哈希表 ，而 std::map 是基于 红黑树 的有序容器。 让我们来详细了解一下 哈希表 是如何实现的，特别是在 unordered_map 中是如何工作的。 1. 哈希表的基本原理 哈希表是基于哈希函数的概念，哈希函数将 键（key） 转换为一个固定大小的数组索引。哈希表的核心结构通常是一个数组，数组中的每个位置叫做 桶 。元素通过哈希函数计算得到哈希值，然后将元素存放到对应…"
publishedAt: "2025-05-12T15:57:52Z"
updatedAt: "2025-05-22T21:07:04Z"
category: "Micro Topics"
categories: ["Micro Topics"]
tags: ["CPP"]
author: "GB"
draft: false
slug: "stdunordered_map"
legacySlug: "stdunordered_map"
oldSlugs: []
wordpressId: 763
sourceUrl: "https://www.haibinlaiblog.top/index.php/stdunordered_map/"
commentCount: 0
viewCount: 778
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<p>是的，<code>std::unordered_map</code> 的本质是 <strong>哈希表</strong>，而 <code>std::map</code> 是基于 <strong>红黑树</strong> 的有序容器。</p>
<p>让我们来详细了解一下 <strong>哈希表</strong> 是如何实现的，特别是在 <code>unordered_map</code> 中是如何工作的。</p>
<h3>1. <strong>哈希表的基本原理</strong></h3>
<p>哈希表是基于哈希函数的概念，哈希函数将 <strong>键（key）</strong> 转换为一个固定大小的数组索引。哈希表的核心结构通常是一个数组，数组中的每个位置叫做 <strong>桶</strong>。元素通过哈希函数计算得到哈希值，然后将元素存放到对应的桶中。</p>
<p><strong>哈希表的基本操作：</strong></p>
<ul>
<li><strong>插入（Insertion）</strong>：当插入一个元素时，哈希表会使用哈希函数将元素的键映射到一个数组索引，然后将该元素存放在该位置。</li>
<li><strong>查找（Search）</strong>：当查找某个元素时，哈希表会使用哈希函数对键进行映射，找到对应的桶，然后查找桶中的元素。</li>
<li><strong>删除（Deletion）</strong>：删除操作也是类似，先通过哈希函数计算出桶的位置，再在桶中删除该元素。</li>
</ul>
<h3>2. <strong>哈希冲突（Collision）</strong></h3>
<p>哈希表的一个主要挑战是 <strong>哈希冲突</strong>，即不同的键可能通过哈希函数映射到同一个桶。为了应对哈希冲突，通常有两种常见的处理方式：</p>
<h4>a. <strong>链式解决法（Chaining）</strong></h4>
<ul>
<li>在每个桶中，不仅存储一个元素，而是存储一个 <strong>链表</strong> 或 <strong>其他数据结构</strong>。当多个元素哈希到同一个桶时，它们会被存储在这个桶中的链表里。</li>
<li>查找时，首先计算出桶的位置，如果桶中有多个元素（即发生了冲突），则会遍历这个桶中的链表查找目标元素。</li>
<li>插入和删除时，类似地，会操作链表中的元素。</li>
</ul>
<h4>b. <strong>开放寻址法（Open Addressing）</strong></h4>
<ul>
<li>当发生哈希冲突时，开放寻址法会寻找其他桶位置来存储冲突的元素。通常有几种策略来处理开放寻址：
<ul>
<li><strong>线性探测</strong>：当一个桶发生冲突时，查找下一个桶，如果该桶也发生冲突，则继续查找下一个桶，直到找到一个空桶。</li>
<li><strong>二次探测</strong>：类似于线性探测，但在查找下一个桶时使用二次方程来计算偏移。</li>
<li><strong>双重哈希</strong>：使用第二个哈希函数来计算冲突后的偏移，从而减少冲突。</li>
</ul></li>
</ul>
<h3>3. <strong>哈希表的性能</strong></h3>
<ul>
<li>
<p><strong>平均时间复杂度：</strong></p>
<ul>
<li>查找、插入、删除的 <strong>平均时间复杂度是 O(1)</strong>，因为在理想情况下，哈希表的哈希函数能够将元素均匀分布到不同的桶中。</li>
</ul>
</li>
<li>
<p><strong>最坏时间复杂度：</strong></p>
<ul>
<li>如果发生大量哈希冲突，特别是在某些特殊情况下（例如，哈希函数不好或表的负载因子过高），哈希表可能退化为链表，此时查找、插入和删除的时间复杂度会变成 <strong>O(n)</strong>。</li>
</ul>
</li>
</ul>
<h3>4. <strong>负载因子与哈希表的扩容</strong></h3>
<p>哈希表的性能还受到 <strong>负载因子（Load Factor）</strong> 的影响，负载因子是哈希表中元素数量与桶的数量之比。为了避免冲突过多，当负载因子达到一定阈值时，哈希表会进行 <strong>扩容</strong>，即增加桶的数量并重新计算每个元素的位置。扩容是一个代价较高的操作，但它能有效降低冲突，提高查找效率。</p>
<h3>5. <strong><code>std::unordered_map</code> 的实现</strong></h3>
<p>在 <code>std::unordered_map</code> 中，哈希表通常通过 <strong>链式解决法</strong> 来处理冲突。C++ 标准库会选择一种高效的哈希函数（通常是通过 <code>std::hash</code>）来映射键，并会自动扩容以维持性能。</p>
<h4><code>std::unordered_map</code> 的一些特点：</h4>
<ul>
<li><strong>无序性</strong>：由于哈希表不保证元素的顺序，因此 <code>unordered_map</code> 中的元素是无序的。你不能保证遍历时元素的顺序。</li>
<li><strong>性能</strong>：在哈希表的平均情况下，查找、插入和删除操作的时间复杂度都是 <strong>O(1)</strong>，但由于哈希冲突的存在，最坏情况下可能退化为 <strong>O(n)</strong>。</li>
<li><strong>哈希函数</strong>：C++ 提供了默认的哈希函数 <code>std::hash</code>，你也可以为自定义类型提供自定义的哈希函数。</li>
</ul>
<h3>6. <strong>总结</strong></h3>
<ul>
<li><strong><code>std::unordered_map</code> 的本质是哈希表</strong>，通过哈希函数将键映射到桶中，并使用链式解决法或开放寻址法处理哈希冲突。</li>
<li>哈希表能提供 <strong>平均 O(1)</strong> 时间复杂度的查找、插入和删除操作，但哈希冲突和不均匀的哈希函数可能导致最坏情况下的性能退化。</li>
<li><strong><code>std::map</code> 则是基于红黑树的</strong>，它保证元素的有序性，支持高效的 <strong>O(log n)</strong> 时间复杂度的查找、插入和删除操作。</li>
</ul>
<p>希望这样能帮助你理解 <code>unordered_map</code> 和哈希表的工作原理！</p>
<p>是的，<code>std::unordered_map</code> 的本质是 <strong>哈希表</strong>，而 <code>std::map</code> 是基于 <strong>红黑树</strong> 的有序容器。</p>
<p>让我们来详细了解一下 <strong>哈希表</strong> 是如何实现的，特别是在 <code>unordered_map</code> 中是如何工作的。</p>
<h3>1. <strong>哈希表的基本原理</strong></h3>
<p>哈希表是基于哈希函数的概念，哈希函数将 <strong>键（key）</strong> 转换为一个固定大小的数组索引。哈希表的核心结构通常是一个数组，数组中的每个位置叫做 <strong>桶</strong>。元素通过哈希函数计算得到哈希值，然后将元素存放到对应的桶中。</p>
<p><strong>哈希表的基本操作：</strong></p>
<ul>
<li><strong>插入（Insertion）</strong>：当插入一个元素时，哈希表会使用哈希函数将元素的键映射到一个数组索引，然后将该元素存放在该位置。</li>
<li><strong>查找（Search）</strong>：当查找某个元素时，哈希表会使用哈希函数对键进行映射，找到对应的桶，然后查找桶中的元素。</li>
<li><strong>删除（Deletion）</strong>：删除操作也是类似，先通过哈希函数计算出桶的位置，再在桶中删除该元素。</li>
</ul>
<h3>2. <strong>哈希冲突（Collision）</strong></h3>
<p>哈希表的一个主要挑战是 <strong>哈希冲突</strong>，即不同的键可能通过哈希函数映射到同一个桶。为了应对哈希冲突，通常有两种常见的处理方式：</p>
<h4>a. <strong>链式解决法（Chaining）</strong></h4>
<ul>
<li>在每个桶中，不仅存储一个元素，而是存储一个 <strong>链表</strong> 或 <strong>其他数据结构</strong>。当多个元素哈希到同一个桶时，它们会被存储在这个桶中的链表里。</li>
<li>查找时，首先计算出桶的位置，如果桶中有多个元素（即发生了冲突），则会遍历这个桶中的链表查找目标元素。</li>
<li>插入和删除时，类似地，会操作链表中的元素。</li>
</ul>
<h4>b. <strong>开放寻址法（Open Addressing）</strong></h4>
<ul>
<li>当发生哈希冲突时，开放寻址法会寻找其他桶位置来存储冲突的元素。通常有几种策略来处理开放寻址：
<ul>
<li><strong>线性探测</strong>：当一个桶发生冲突时，查找下一个桶，如果该桶也发生冲突，则继续查找下一个桶，直到找到一个空桶。</li>
<li><strong>二次探测</strong>：类似于线性探测，但在查找下一个桶时使用二次方程来计算偏移。</li>
<li><strong>双重哈希</strong>：使用第二个哈希函数来计算冲突后的偏移，从而减少冲突。</li>
</ul></li>
</ul>
<h3>3. <strong>哈希表的性能</strong></h3>
<ul>
<li>
<p><strong>平均时间复杂度：</strong></p>
<ul>
<li>查找、插入、删除的 <strong>平均时间复杂度是 O(1)</strong>，因为在理想情况下，哈希表的哈希函数能够将元素均匀分布到不同的桶中。</li>
</ul>
</li>
<li>
<p><strong>最坏时间复杂度：</strong></p>
<ul>
<li>如果发生大量哈希冲突，特别是在某些特殊情况下（例如，哈希函数不好或表的负载因子过高），哈希表可能退化为链表，此时查找、插入和删除的时间复杂度会变成 <strong>O(n)</strong>。</li>
</ul>
</li>
</ul>
<h3>4. <strong>负载因子与哈希表的扩容</strong></h3>
<p>哈希表的性能还受到 <strong>负载因子（Load Factor）</strong> 的影响，负载因子是哈希表中元素数量与桶的数量之比。为了避免冲突过多，当负载因子达到一定阈值时，哈希表会进行 <strong>扩容</strong>，即增加桶的数量并重新计算每个元素的位置。扩容是一个代价较高的操作，但它能有效降低冲突，提高查找效率。</p>
<h3>5. <strong><code>std::unordered_map</code> 的实现</strong></h3>
<p>在 <code>std::unordered_map</code> 中，哈希表通常通过 <strong>链式解决法</strong> 来处理冲突。C++ 标准库会选择一种高效的哈希函数（通常是通过 <code>std::hash</code>）来映射键，并会自动扩容以维持性能。</p>
<h4><code>std::unordered_map</code> 的一些特点：</h4>
<ul>
<li><strong>无序性</strong>：由于哈希表不保证元素的顺序，因此 <code>unordered_map</code> 中的元素是无序的。你不能保证遍历时元素的顺序。</li>
<li><strong>性能</strong>：在哈希表的平均情况下，查找、插入和删除操作的时间复杂度都是 <strong>O(1)</strong>，但由于哈希冲突的存在，最坏情况下可能退化为 <strong>O(n)</strong>。</li>
<li><strong>哈希函数</strong>：C++ 提供了默认的哈希函数 <code>std::hash</code>，你也可以为自定义类型提供自定义的哈希函数。</li>
</ul>
<h3>6. <strong>总结</strong></h3>
<ul>
<li><strong><code>std::unordered_map</code> 的本质是哈希表</strong>，通过哈希函数将键映射到桶中，并使用链式解决法或开放寻址法处理哈希冲突。</li>
<li>哈希表能提供 <strong>平均 O(1)</strong> 时间复杂度的查找、插入和删除操作，但哈希冲突和不均匀的哈希函数可能导致最坏情况下的性能退化。</li>
<li><strong><code>std::map</code> 则是基于红黑树的</strong>，它保证元素的有序性，支持高效的 <strong>O(log n)</strong> 时间复杂度的查找、插入和删除操作。</li>
</ul>
<p>希望这样能帮助你理解 <code>unordered_map</code> 和哈希表的工作原理！</p>
