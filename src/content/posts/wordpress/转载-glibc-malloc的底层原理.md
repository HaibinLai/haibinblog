---
title: "转载：glibc malloc的底层原理"
description: "原作者： https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/comment-page-1/?blogsub=confirming#subscribe-blog%E3%80%82 中文翻译原作： https://blog.csdn.net/maokelong95/article/details/51989081 https://zhuanlan.z…"
publishedAt: "2025-01-26T21:57:31Z"
updatedAt: "2025-06-10T22:27:38Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["内存", "内存管理", "操作系统"]
author: "GB"
draft: false
slug: "转载-glibc-malloc的底层原理"
legacySlug: "转载：glibc-malloc的底层原理"
oldSlugs: []
wordpressId: 606
sourceUrl: "https://www.haibinlaiblog.top/index.php/%e8%bd%ac%e8%bd%bd%ef%bc%9aglibc-malloc%e7%9a%84%e5%ba%95%e5%b1%82%e5%8e%9f%e7%90%86/"
commentCount: 0
viewCount: 1390
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-001-d1c503eef867.webp"
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86.webp"
---
<p>原作者：
<a href="https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/comment-page-1/?blogsub=confirming#subscribe-blog%E3%80%82">https://sploitfun.wordpress.com/2015/02/10/understanding-glibc-malloc/comment-page-1/?blogsub=confirming#subscribe-blog%E3%80%82</a></p>
<p>中文翻译原作：
<a href="https://blog.csdn.net/maokelong95/article/details/51989081">https://blog.csdn.net/maokelong95/article/details/51989081</a></p>
<p><a href="https://zhuanlan.zhihu.com/p/443235305">https://zhuanlan.zhihu.com/p/443235305</a></p>
<p>OSTEP: <a href="https://pages.cs.wisc.edu/~remzi/OSTEP/Chinese/17.pdf">https://pages.cs.wisc.edu/~remzi/OSTEP/Chinese/17.pdf</a></p>
<p>本篇是对 <code>malloc</code> 的具体实现的研究。我们通过观察 user lib 里的实现，查看其与操作系统的交互。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-002-ca7839901650.webp" alt="" /></p>
<ul>
<li>dlmalloc – Normal objective allocator</li>
<li>ptmalloc2 – glibc</li>
<li>jemalloc – FreeBSD and Firefox</li>
<li>tcmalloc – Google</li>
<li>libumem – Solaris</li>
</ul>
<h2>前情提要：内存申请</h2>
<p>我们使用一套header 及linklist的机制，记录目前的空闲内存，使用了的内存等情况。</p>
<p>一套普通且完善的系统是伙伴系统。它可以比较好的分配内存及合并内存申请。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-003-7e09edd162ff.webp" alt="" /></p>
<p>在内存分配系统中，每次分配，都会有个内存分配头：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-004-2519d264a341.webp" alt="" /></p>
<p>内存分配策略有如下几种。和段分配很相似（两者的模型基本是一致的）：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-005-d5d05fc075ae.webp" alt="" /></p>
<p>内存分配系统主要希望的是，能记录和管理好使用的内存，同时更高速地提供内存申请服务（比如有高速内存的存在）。一直以来有一种很有趣的方式叫作分离空闲列表（segregated list）。基本想法很简单： 如果某个应用程序经常申请一种（或几种）大小的内存空间，那就用一个独立的列表，只管理这样大小的对象。其他大小的请求都一给更通用的内存分配程序。</p>
<p>87775</p>
<h2><strong>申请堆的系统调用</strong></h2>
<p>我在之前的文章中提到过，malloc内部通过brk或mmap系统调用向内核申请堆区。</p>
<blockquote>
<p><strong>注</strong>：在内存管理领域，我们一般用「堆」指代用于分配动态内存的虚拟地址空间，而用「栈」指代用于分配静态内存的虚拟地址空间。具体到虚拟内存布局（Memory Layout），堆维护在通过brk系统调用申请的「Heap」及通过mmap系统调用申请的「Memory Mapping Segment」中；而栈维护在通过汇编栈指令动态调整的「Stack」中。在 Glibc 里，「Heap」用于分配较小的内存及主线程使用的内存。 下图为 Linux 内核 v2.6.7 之后，32 位模式下的虚拟内存布局方式。</p>
</blockquote>
<h2><strong>多线程支持</strong></h2>
<p>Linux 的早期版本采用 dlmalloc 作为它的默认分配器，但是因为 ptmalloc2 提供了多线程支持，所以 后来 Linux 就转而采用 ptmalloc2 了。多线程支持可以提升分配器的性能，进而间接提升应用的性能。</p>
<p>在 dlmalloc 中，当两个线程同时malloc时，只有一个线程能够访问临界区（critical section）——这是因为所有线程<strong>共享</strong>用以缓存已释放内存的「<a href="https://zhida.zhihu.com/search?content_id=186626530&amp;content_type=Article&amp;match_order=1&amp;q=%E7%A9%BA%E9%97%B2%E5%88%97%E8%A1%A8%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84&amp;zhida_source=entity">空闲列表数据结构</a>」（freelist data structure），所以使用 dlmalloc 的多线程应用会在malloc上耗费过多时间，从而导致整个应用性能的下降。</p>
<p>在 ptmalloc2 中，当两个线程同时调用malloc时，内存均会得以立即分配——每个线程都维护着单独的堆，各个堆被独立的空闲列表数据结构管理，因此各个线程可以并发地从空闲列表数据结构中申请内存。这种为每个线程维护独立堆与空闲列表数据结构的行为就「per thread arena」。</p>
<h3><strong>在主线程 malloc 之后</strong></h3>
<p>从如下的输出结果中我们可以看到，堆段已经产生，并且其地址区间正好在数据段（0x0804b000 - 0x0806c000）上面，这表明堆内存是移动「Program Break」的位置产生的（也即通过brk中断）。此外，请注意，尽管用户只申请了 1000 字节的内存，但是实际产生了 132KB 的堆。这个连续的堆区域被称为「<strong>arena</strong>」。因为这个 arena 是被主线程建立的，因此其被称为「<strong>main arena</strong>」。接下来的申请会继续分配这个 arena 的 132KB 中剩余的部分。当分配完毕时，它可以通过继续移动 Program Break 的位置扩容。扩容后，「<a href="https://zhida.zhihu.com/search?content_id=186626530&amp;content_type=Article&amp;match_order=1&amp;q=top+chunk&amp;zhida_source=entity">top chunk</a>」的大小也随之调整，以将这块新增的空间圈进去；相应地，arena 也可以在 top chunk 过大时缩小。</p>
<p>当分配的内存区域free掉时，其并不会立即归还给操作系统，而仅仅是移交给了作为库函数的分配器。这块free掉的内存添加在了「main arenas bin」中（在 glibc malloc 中，空闲列表数据结构被称为「<strong>bin</strong>」）。随后当用户请求内存时，分配器就不再向内核申请新堆了，而是先试着各个「bin」中查找空闲内存。只有当 bin 中不存在空闲内存时，分配器才会继续向内核申请内存。</p>
<h3><strong>在 thread1 malloc 之后</strong></h3>
<p>从如下的输出结果中我们可以看到，thread1 的堆段(b7500000 - b7521000，132KB)建立在了内存映射段中，这也表明了堆内存是使用mmap系统调用产生的，而非同主线程一样使用sbrk系统调用。类似地，尽管用户只请求了 1000B，但是映射到程地址空间的堆内存足有 1MB。这 1MB 中，只有 132KB 被设置了读写权限，并成为该线程的堆内存。这段连续内存（132KB）被称为「<strong>thread arena</strong>」。</p>
<p>free不会把内存归还给操作系统，而是移交给分配器，然后添加在了「thread arenas bin」中。</p>
<h2><strong>Arena</strong></h2>
<h3><strong>3.1. Arena 的数量</strong></h3>
<p>在以上的例子中我们可以看到，主线程包含 main arena 而 thread 1 包含它自己的 thread arena。所以线程和 arena 之间是否存在一一映射关系，而不论线程的数量有多大？当然不是，部分极端的应用甚至运行比处理器核数还多的线程，在这种情况下，每个线程都拥有一个 arena 开销过高且意义不大。所以，arena 数量其实是限于系统核数的。</p>
<h3><strong>Multiple Arena</strong></h3>
<p>举例而言：让我们来看一个运行在单核计算机上的 32 位操作系统上的多线程应用（4 线程，主线程 + 3 个线程）的例子。这里线程数量（4）&gt; 2 * 核心数（1），所以分配器中可能有 Arena（也即标题所称「multiple arenas」）会被所有线程共享。那么是如何共享的呢？</p>
<ul>
<li>当主线程第一次调用malloc时，已经建立的 main arena 会被没有任何竞争地使用；</li>
<li>当 thread 1 和 thread 2 第一次调用malloc时，一块新的 arena 将被创建，且将被没有任何竞争地使用。此时线程和 arena 之间存在一一映射关系；</li>
<li>当 thread3 第一次调用malloc时，arena 的数量限制被计算出来，结果显示已超出，因此尝试复用已经存在的 arena（也即 Main arena 或 Arena 1 或 Arena 2）；</li>
<li>复用：</li>
<li>一旦遍历到可用 arena，就开始自旋申请该 arena 的锁；</li>
<li>如果上锁成功（比如说 main arena 上锁成功），就将该 arena 返回用户；</li>
<li>如果没找到可用 arena，thread 3 的malloc将被阻塞，直到有可用的 arena 为止。</li>
<li>当thread 3 调用malloc时(第二次了)，分配器会尝试使用上一次使用的 arena（也即，main arena），从而尽量提高缓存命中率。当 main arena 可用时就用，否则 thread 3 就一直阻塞，直至 main arena 空闲。因此现在 main arena 实际上是被 main thread 和 thread 3 所共享。</li>
</ul>
<h3><strong>Multiple Heaps</strong></h3>
<p>在「glibc malloc」中主要有 3 种数据结构：</p>
<ul>
<li>heap_info ——Heap Header—— 一个 thread arena 可以维护多个堆。每个堆都有自己的堆 Header（注：也即头部元数据）。什么时候 Thread Arena 会维护多个堆呢？一般情况下，每个 thread arena 都只维护一个堆，但是当这个堆的空间耗尽时，新的堆（而非连续内存区域）就会被mmap到这个 aerna 里；</li>
<li>malloc_state ——Arena header—— 一个 thread arena 可以维护多个堆，这些堆另外共享同一个 arena header。Arena header 描述的信息包括：bins、top chunk、last remainder chunk 等；</li>
<li>malloc_chunk ——Chunk header—— 根据用户请求，每个堆被分为若干 chunk。每个 chunk 都有自己的 chunk header。</li>
</ul>
<blockquote>
<p><strong>注意</strong>：</p>
</blockquote>
<ul>
<li>Main arena 无需维护多个堆，因此也无需 heap_info。当空间耗尽时，与 thread arena 不同，main arena 可以通过sbrk拓展<strong>堆</strong>段，直至堆段「碰」到内存映射段；</li>
<li>与 thread arena 不同，main arena 的 arena header 不是保存在通过sbrk申请的堆段里，而是作为一个全局变量，可以在 libc.so 的数据段中找到。</li>
</ul>
<p>main arena 和 thread arena 的图示如下（单堆段）：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-006-6039e40b63ee.webp" alt="" /></p>
<p>thread arena 的图示如下（多堆段）：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-007-9f473186b15a.webp" alt="" /></p>
<h2><strong>Chunk</strong></h2>
<p>堆段中存在的 chunk 类型如下：</p>
<ul>
<li>Allocated chunk;</li>
<li>Free chunk;</li>
<li>Top chunk;</li>
<li>Last Remainder chunk.</li>
</ul>
<h3><strong>4.1. Allocated chunk</strong></h3>
<p>「<strong>Allocated chunck</strong>」就是已经分配给用户的 chunk，其图示如下：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-008-b9bb296c3741.webp" alt="" /></p>
<p>图中左方三个箭头依次表示：</p>
<ul>
<li>chunk：该 Allocated chunk 的起始地址；</li>
<li>mem：该 Allocated chunk 中用户可用区域的起始地址（= chunk + sizeof(malloc_chunk)）；</li>
<li>next_chunk：下一个 chunck（无论类型）的起始地址。</li>
</ul>
<p>图中结构体内部各字段的含义依次为：</p>
<ul>
<li>prev_size：若上一个 chunk 可用，则此字段赋值为上一个 chunk 的大小；否则，此字段被用来存储上一个 chunk 的用户数据；</li>
<li>size：此字段赋值本 chunk 的大小，其最后三位包含标志信息：</li>
<li>PREV_INUSE § – 置「1」表示上个 chunk 被分配；</li>
<li>IS_MMAPPED (M) – 置「1」表示这个 chunk 是通过mmap申请的（较大的内存）；</li>
<li>NON_MAIN_ARENA (N) – 置「1」表示这个 chunk 属于一个 thread arena。</li>
</ul>
<blockquote>
<p><strong>注意</strong>：</p>
</blockquote>
<ul>
<li>malloc_chunk 中的其余结构成员，如 fd、 bk，没有使用的必要而拿来存储用户数据；</li>
<li>用户请求的大小被转换为内部实际大小，因为需要额外空间存储 malloc_chunk，此外还需要考虑对齐。</li>
</ul>
<h3><strong>Free chunk</strong></h3>
<p>「<strong>Free chunck</strong>」就是用户已释放的 chunk，其图示如下：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-009-e171dc62cf65.webp" alt="" />
图中结构体内部各字段的含义依次为：</p>
<ul>
<li>prev_size: 两个相邻 free chunk 会被合并成一个，因此该字段总是保存前一个 allocated chunk 的用户数据；</li>
<li>size: 该字段保存本 free chunk 的大小；</li>
<li>fd: Forward pointer —— 本字段指向同一 bin 中的下个 free chunk（free chunk 链表的前驱指针）；</li>
<li>bk: Backward pointer —— 本字段指向同一 bin 中的上个 free chunk（free chunk 链表的后继指针）。</li>
</ul>
<h2><strong>Bins</strong></h2>
<p>「<strong>bins</strong>」 就是空闲列表数据结构。它们用以保存 free chunks。根据其中 chunk 的大小，bins 被分为如下几种类型：</p>
<ul>
<li>Fast bin;</li>
<li>Unsorted bin;</li>
<li>Small bin;</li>
<li>Large bin.</li>
</ul>
<p>保存这些 bins 的字段为：</p>
<ul>
<li>fastbinsY: 这个数组用以保存 fast bins；</li>
<li>bins: 这个数组用于保存 unsorted bin、small bins 以及 large bins，共计可容纳 126 个，其中：</li>
<li>Bin 1: unsorted bin;</li>
<li>Bin 2 - 63: small bins;</li>
<li>Bin 64 - 126: large bins.</li>
</ul>
<h3><strong>5.1. Fast Bin</strong></h3>
<p>大小为 16 ~ 80 字节的 chunk 被称为「<strong>fast chunk</strong>」。在所有的 bins 中，fast bins 路径享有最快的内存分配及释放速度。</p>
<ul>
<li><strong>数量</strong>：10</li>
<li>每个 fast bin 都维护着一条 free chunk 的单链表，采用单链表是因为链表中所有 chunk 的大小相等，增删 chunk 发生在链表顶端即可；—— LIFO</li>
<li><strong>chunk 大小</strong>：8 字节递增</li>
<li>fast bins 由一系列所维护 chunk 大小以 8 字节递增的 bins 组成。也即，fast bin[0]维护大小为 16 字节的 chunk、fast bin[1]维护大小为 24 字节的 chunk。依此类推……</li>
<li>指定 fast bin 中所有 chunk 大小相同；</li>
<li>在 malloc 初始化过程中，最大的 fast bin 的大小被设置为 64 而非 80 字节。因为默认情况下只有大小 16 ~ 64 的 chunk 被归为 fast chunk 。</li>
<li>无需合并 —— 两个相邻 chunk 不会被合并。虽然这可能会加剧内存碎片化，但也大大加速了内存释放的速度！</li>
<li>malloc(fast chunk)</li>
<li>初始情况下 fast chunck 最大尺寸以及 fast bin 相应数据结构均未初始化，因此即使用户请求内存大小落在 fast chunk 相应区间，服务用户请求的也将是 small bin 路径而非 fast bin 路径；</li>
<li>初始化后，将在计算 fast bin 索引后检索相应 bin；</li>
<li>相应 bin 中被检索的第一个 chunk 将被摘除并返回给用户。</li>
<li>free(fast chunk)</li>
<li>计算 fast bin 索引以索引相应 bin；</li>
<li>free掉的 chunk 将被添加到上述 bin 的顶端</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-010-95860ce059b2.webp" alt="" /></p>
<h3><strong>Unsorted Bin</strong></h3>
<p>当 small chunk 和 large chunk 被free掉时，它们并非被添加到各自的 bin 中，而是被添加在 「<strong>unsorted bin</strong>」 中。这使得分配器可以重新使用最近free掉的 chunk，从而消除了寻找合适 bin 的时间开销，进而加速了内存分配及释放的效率。</p>
<blockquote>
<p>译者注：经 @kwdecsdn 提醒，这里应补充说明「Unsorted Bin 中的 chunks 何时移至 small/large chunk 中」。在内存分配的时候，在前后检索 fast/small bins 未果之后，在特定条件下，会将 unsorted bin 中的 chunks 转移到合适的 bin 中去，small/large。</p>
</blockquote>
<ul>
<li><strong>数量</strong>：1</li>
<li>unsorted bin 包括一个用于保存 free chunk 的双向循环链表（又名 binlist）；</li>
<li><strong>chunk 大小</strong>：无限制，任何大小的 chunk 均可添加到这里。</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-01/%E8%BD%AC%E8%BD%BD-glibc-malloc%E7%9A%84%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/body-011-1f593dd4c625.webp" alt="" /></p>
<h3> <strong>Small Bin</strong></h3>
<p>大小小于 512 字节的 chunk 被称为 「<strong>small chunk</strong>」，而保存 small chunks 的 bin 被称为 「<strong>small bin</strong>」。在内存分配回收的速度上，small bin 比 large bin 更快。</p>
<ul>
<li><strong>数量</strong>：62</li>
<li>每个 small bin 都维护着一条 free chunk 的双向循环链表。采用双向链表的原因是，small bins 中的 chunk 可能会从链表中部摘除。这里新增项放在链表的头部位置，而从链表的尾部位置移除项。—— FIFO</li>
<li><strong>chunk 大小</strong>：8 字节递增</li>
<li>Small bins 由一系列所维护 chunk 大小以 8 字节递增的 bins 组成。举例而言，small bin[0]（Bin 2）维护着大小为 16 字节的 chunks、small bin[1]（Bin 3）维护着大小为 24 字节的 chunks ，依此类推……</li>
<li>指定 small bin 中所有 chunk 大小均相同，因此无需排序；</li>
<li>合并 —— 相邻的 free chunk 将被合并，这减缓了内存碎片化，但是减慢了free的速度；</li>
<li>malloc(small chunk)</li>
<li>初始情况下，small bins 都是 NULL，因此尽管用户请求 small chunk ，提供服务的将是 unsorted bin 路径而不是 small bin 路径；</li>
<li>第一次调用malloc时，维护在 malloc_state 中的 small bins 和 large bins 将被初始化，它们都会指向自身以表示其为空；</li>
<li>此后当 small bin 非空，相应的 bin 会摘除其中最后一个 chunk 并返回给用户；</li>
<li>free(small chunk)</li>
<li>freechunk 的时候，检查其前后的 chunk 是否空闲，若是则合并，也即把它们从所属的链表中摘除并合并成一个新的 chunk，新 chunk 会添加在 unsorted bin 的前端。</li>
</ul>
<h3><strong>5.4. Large Bin</strong></h3>
<p>大小大于等于 512 字节的 chunk 被称为「<strong>large chunk</strong>」，而保存 large chunks 的 bin 被称为 「<strong>large bin</strong>」。在内存分配回收的速度上，large bin 比 small bin 慢。</p>
<ul>
<li><strong>数量</strong>：63</li>
<li>32 个 bins 所维护的 chunk 大小以 64B 递增，也即large chunk[0](Bin 65) 维护着大小为 512B ~ 568B 的 chunk 、large chunk[1](Bin 66) 维护着大小为 576B ~ 632B 的 chunk，依此类推……</li>
<li>16 个 bins 所维护的 chunk 大小以 512 字节递增；</li>
<li>8 个 bins 所维护的 chunk 大小以 4096 字节递增；</li>
<li>4 个 bins 所维护的 chunk 大小以 32768 字节递增；</li>
<li>2 个 bins 所维护的 chunk 大小以 262144 字节递增；</li>
<li>1 个 bin 维护所有剩余 chunk 大小；</li>
<li>每个 large bin 都维护着一条 free chunk 的双向循环链表。采用双向链表的原因是，large bins 中的 chunk 可能会从链表中的任意位置插入及删除。</li>
<li>这 63 个 bins</li>
<li>不像 small bin ，large bin 中所有 chunk 大小不一定相同，各 chunk 大小递减保存。最大的 chunk 保存顶端，而最小的 chunk 保存在尾端；</li>
<li>合并 —— 两个相邻的空闲 chunk 会被合并；</li>
<li>malloc(large chunk)</li>
<li>User chunk（用户请求大小）—— 返回给用户；</li>
<li>Remainder chunk （剩余大小）—— 添加到 unsorted bin。</li>
<li>初始情况下，large bin 都会是 NULL，因此尽管用户请求 large chunk ，提供服务的将是 next largetst bin 路径而不是 large bin 路劲 。</li>
<li>第一次调用malloc时，维护在 malloc_state 中的 small bin 和 large bin 将被初始化，它们都会指向自身以表示其为空；</li>
<li>此后当 large bin 非空，如果相应 bin 中的最大 chunk 大小大于用户请求大小，分配器就从该 bin 顶端遍历到尾端，以找到一个大小最接近用户请求的 chunk。一旦找到，相应 chunk 就会被切分成两块：</li>
<li>如果相应 bin 中的最大 chunk 大小小于用户请求大小，分配器就会扫描 binmaps，从而查找最小非空 bin。如果找到了这样的 bin，就从中选择合适的 chunk 并切割给用户；反之就使用 top chunk 响应用户请求。</li>
<li>free(large chunk)—— 类似于 small chunk 。</li>
</ul>
<h3><strong>5.5. Top Chunk</strong></h3>
<p>一个 arena 中最顶部的 chunk 被称为「<strong>top chunk</strong>」。它不属于任何 bin 。当所有 bin 中都没有合适空闲内存时，就会使用 top chunk 来响应用户请求。</p>
<p>当 top chunk 的大小比用户请求的大小大的时候，top chunk 会分割为两个部分：</p>
<ul>
<li>User chunk，返回给用户；</li>
<li>Remainder chunk，剩余部分，将成为新的 top chunk。</li>
</ul>
<p>当 top chunk 的大小比用户请求的大小小的时候，top chunk 就通过sbrk（main arena）或mmap（ thread arena）系统调用扩容。</p>
<h3><strong>5.6. Last Remainder Chunk</strong></h3>
<p>「<strong>last remainder chunk</strong>」即最后一次 small request 中因分割而得到的剩余部分，它有利于改进引用局部性，也即后续对 small chunk 的malloc请求可能最终被分配得彼此靠近。</p>
<p>那么 arena 中的若干 chunks，哪个有资格成为 last remainder chunk 呢？</p>
<p>当用户请求 small chunk 而无法从 small bin 和 unsorted bin 得到服务时，分配器就会通过扫描 binmaps 找到最小非空 bin。正如前文所提及的，如果这样的 bin 找到了，其中最合适的 chunk 就会分割为两部分：返回给用户的 User chunk 、添加到 unsorted bin 中的 Remainder chunk。这一 Remainder chunk 就将成为 last remainder chunk。</p>
<p>那么引用局部性是如何达成的呢？</p>
<p>当用户的后续请求 small chunk，并且 last remainder chunk 是 unsorted bin 中唯一的 chunk，该 last remainder chunk 就将分割成两部分：返回给用户的 User chunk、添加到 unsorted bin 中的 Remainder chunk（也是 last remainder chunk）。因此后续的请求的 chunk 最终将被分配得彼此靠近。</p>
