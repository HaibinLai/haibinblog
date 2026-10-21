---
title: "OS与硬件的交互：TLB"
description: "我： 我已经知道了 OS 里的物理地址和虚拟地址。那难道每次我进行内存访问，都要进行一次转换吗？ GPT： 是的，从概念上说，每次内存访问都需要把虚拟地址翻译成物理地址。但这不是每次都由操作系统慢慢查表完成，而主要由硬件完成。CPU 里有一个叫 TLB 的缓存，它保存最近用过的地址翻译结果。如果 TLB 命中，虚拟地址可以很快转换成物理地址；如果 TLB miss，硬件才会去查 page table。 我： 这里，TLB 是硬件在做和…"
publishedAt: "2026-06-09T13:51:46Z"
updatedAt: "2026-06-09T13:52:09Z"
category: "OS"
categories: ["OS"]
tags: ["TLB"]
author: "GB"
draft: false
slug: "osandtlb"
legacySlug: "osandtlb"
oldSlugs: ["os与硬件的交互：tlb"]
wordpressId: 1410
sourceUrl: "https://www.haibinlaiblog.top/index.php/osandtlb/"
commentCount: 0
viewCount: 694
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<p><strong>我：</strong> 我已经知道了 OS 里的物理地址和虚拟地址。那难道每次我进行内存访问，都要进行一次转换吗？</p>
<p><strong>GPT：</strong> 是的，从概念上说，每次内存访问都需要把虚拟地址翻译成物理地址。但这不是每次都由操作系统慢慢查表完成，而主要由硬件完成。CPU 里有一个叫 <strong>TLB</strong> 的缓存，它保存最近用过的地址翻译结果。如果 TLB 命中，虚拟地址可以很快转换成物理地址；如果 TLB miss，硬件才会去查 page table。</p>
<hr />
<p><strong>我：</strong> 这里，TLB 是硬件在做和执行，而物理地址的管理是 OS 在做，对吧？</p>
<p><strong>GPT：</strong> 对。可以理解为：<strong>OS 负责管理物理内存和页表，硬件负责每次访问时快速翻译地址</strong>。OS 会分配物理页、建立虚拟页到物理页的映射，并维护 page table。CPU/MMU 在执行 load/store 时查 TLB，命中就直接翻译；miss 时通常由硬件进行 page table walk。如果发现映射不存在或权限错误，才会触发 page fault，进入 OS 处理。</p>
<hr />
<p><strong>我：</strong> page table 是完全虚拟的吗？</p>
<p><strong>GPT：</strong> 不是。<strong>page table 本身是真实存在于物理内存中的数据结构</strong>。它不是虚拟的，只是它记录的是“虚拟页到物理页”的映射关系。OS 可以通过虚拟地址访问页表，但页表的实体仍然存放在 DRAM 里。在 x86 中，当前进程页表的根地址通常保存在 <code>CR3</code> 寄存器中。</p>
<hr />
<p><strong>我：</strong> 那 TLB 怎么知道存什么？</p>
<p><strong>GPT：</strong> TLB 不是自己凭空知道的。它存的是 <strong>最近用过的页表翻译结果</strong>，比如：</p>
<pre><code class="language-text">虚拟页号 VPN → 物理页框号 PPN + 权限位</code></pre>
<p>当 CPU 访问一个虚拟地址时，会先用虚拟页号查 TLB。如果命中，就直接得到物理页框号；如果没命中，硬件会去 page table 里查。查到有效页表项之后，硬件会把这个翻译结果放进 TLB，供后续访问复用。所以 TLB 本质上是 page table 的硬件缓存。</p>
<hr />
<p><strong>我：</strong> TLB 怎么知道 page table 的？</p>
<p><strong>GPT：</strong> 更准确地说，不是 TLB 知道 page table，而是 <strong>CPU/MMU 知道当前进程 page table 的根地址</strong>。在 x86 中，这个根地址放在 <code>CR3</code> 寄存器里。TLB miss 时，MMU 会根据 <code>CR3</code> 找到当前进程的页表根节点，然后根据虚拟地址中的各级 index 进行 page table walk，最终找到对应的页表项。进程切换时，OS 会切换 <code>CR3</code>，这样不同进程可以拥有不同的虚拟地址空间。</p>
<p>关键点是一个特殊寄存器，CR3，它保存当前进程页表根节点的物理地址，比如四级页表里的顶层页表地址。</p>
<p>可以理解为：</p>
<pre><code class="language-text">当前进程正在用哪一张 page table？
        ↓
由 CPU 里的页表基址寄存器记录</code></pre>
<hr />
<p>假设当前进程访问一个虚拟地址：</p>
<pre><code class="language-text">VA = 0x7fff_abcd_1234</code></pre>
<p>CPU/MMU 会先查 TLB：</p>
<pre><code class="language-text">TLB 里有没有这个 VPN 的翻译？</code></pre>
<p>如果命中：</p>
<pre><code class="language-text">VPN → PPN</code></pre>
<p>直接访问物理地址。</p>
<p>如果没命中，CPU/MMU 就需要做 page table walk。这时候它会看：</p>
<pre><code class="language-text">CR3 里记录的页表根地址</code></pre>
<p>然后从顶层页表开始一级一级查。</p>
<p>大概是：</p>
<pre><code class="language-text">虚拟地址 VA
   ↓
拆成多个 index + offset
   ↓
CR3 找到顶层页表
   ↓
用第一级 index 找下一级页表
   ↓
用第二级 index 找下一级页表
   ↓
...
   ↓
找到最终 PTE
   ↓
得到物理页号 PPN
   ↓
填入 TLB</code></pre>
<hr />
<p>以 x86-64 四级页表为例，虚拟地址会被拆成：</p>
<pre><code class="language-text">[ PML4 index ][ PDPT index ][ PD index ][ PT index ][ offset ]</code></pre>
<p>CPU 根据 <code>CR3</code> 找到 PML4，然后用这些 index 一级一级查下去。</p>
<p>所以不是 TLB 自己知道 page table，而是：</p>
<pre><code class="language-text">CPU/MMU 有一个“当前页表根地址”
TLB miss 时，MMU 根据这个根地址去查 page table</code></pre>
<hr />
<p>OS 在进程切换时会做一件重要的事：</p>
<pre><code class="language-text">切换 CR3</code></pre>
<p>比如：</p>
<pre><code class="language-text">进程 A 正在运行：
CR3 = 进程 A 的页表根地址

切换到进程 B：
CR3 = 进程 B 的页表根地址</code></pre>
<p>这样同一个虚拟地址在不同进程里就可以映射到不同物理地址。</p>
<p>例如：</p>
<pre><code class="language-text">进程 A:
VA 0x400000 → PA 0x100000

进程 B:
VA 0x400000 → PA 0x900000</code></pre>
<p>它们的虚拟地址可以一样，但因为 <code>CR3</code> 不同，查的是不同的 page table。</p>
<hr />
<p>最后可以浓缩成一句话：</p>
<blockquote>
<p><strong>OS 创建并维护 page table，管理虚拟页到物理页的映射；CPU/MMU 根据页表基址寄存器进行地址翻译；TLB 缓存最近的翻译结果，让大多数内存访问不需要重新查完整页表。</strong></p>
</blockquote>
