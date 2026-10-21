---
title: "OS Assignment 5"
description: "赖海斌 12211612 1. Question1 [50pts] In a demand-paging memory management system, suppose the page table contents for a certain process are as follows (for a single-level page table, with H denoting hexadecimal values): Vi…"
publishedAt: "2024-12-09T16:18:27Z"
updatedAt: "2024-12-13T14:55:09Z"
category: "OS"
categories: ["OS"]
tags: ["OS"]
author: "GB"
draft: false
slug: "os-assignment-5"
legacySlug: "os-assignment-5"
oldSlugs: []
wordpressId: 540
sourceUrl: "https://www.haibinlaiblog.top/index.php/os-assignment-5/"
commentCount: 0
viewCount: 1230
likeCount: 1
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2024/12/图片12.png"
importedFromWordPress: true
---
<p>赖海斌
12211612</p>
<h2>1. Question1 [50pts]</h2>
<p>In a demand-paging memory management system, suppose the page table contents for a certain process are as follows (for a single-level page table, with H denoting hexadecimal values):</p>
<table>
<thead>
<tr>
<th>Virtual Page No.</th>
<th>Page Frame No.</th>
<th>Valid Bit</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td></td>
<td>0</td>
</tr>
<tr>
<td>1</td>
<td>122H</td>
<td>1</td>
</tr>
<tr>
<td>2</td>
<td>233H</td>
<td>1</td>
</tr>
</tbody>
</table>
<p>The page size is <code>4 KB</code>, the access time for main memory is <code>100 ns</code>, the access time for the TLB is <code>10 ns</code>, and the average time to handle a page fault, including the time to update the TLB and page table, is <code>10^8</code> ns. Assuming:</p>
<ol>
<li>The TLB is initially empty. </li>
<li>During address translation, the TLB is accessed first. If there is a miss in the TLB, the page table is accessed subsequently (ignoring the time taken to update the TLB after accessing the page table). </li>
<li>A valid bit set to 0 indicates that the page is not present in memory, causing a page fault interrupt. After the page fault interrupt handling is completed, the execution returns to the instruction that triggered the page fault to execute.</li>
</ol>
<p>Given a virtual address access sequence of <code>1333H</code> , <code>0555H</code> , <code>2555H</code></p>
<p>(1）Assuming there are enough free pages available in OS. What is the time required to access each of the three virtual addresses mentioned above? Give the calculation process. The answer should include the time cost of the final access to the physical address. </p>
<h3>Answer for Q1.1:</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208014634.png" alt="" /></p>
<p>Since we have a 4 KB page, that means for the lower 12 bits represent the offset within the page.</p>
<p>(a) <code>1333H</code>
For <code>1333H</code>, we have virtual page number 1, and 333 for offset</p>
<ul>
<li>The TLB is initially empty, so a TLB miss occurs. Go for page table.</li>
<li>Look up the page table for page number <code>1</code>. The page table entry for page 1 has a valid bit of <code>1</code> (valid), so the page is in memory and can be mapped to physical frame <code>122H</code>.</li>
</ul>
<p><strong>Total Time</strong>:</p>
<ul>
<li><strong>TLB Miss</strong>:  <code>10 ns</code>.</li>
<li><strong>Page Table Lookup</strong>: <code>100 ns</code> (Look up page table in Main memory)</li>
<li><strong>Memory Access</strong>: <code>100 ns</code> </li>
</ul>
<p>So intotal, <code>133H</code> needs <code>210ns</code></p>
<p>(b) <code>0555H</code>
We have virtual page number 0, and 555 for offset</p>
<ul>
<li>The TLB is initially empty, so a TLB miss occurs. Go for page table.</li>
<li>In page table, the virtual page number 0 is invalid, causing a page fault. And OS try to handle.</li>
<li>After OS handles page fault, we access the physical memory address again</li>
</ul>
<p><strong>Total Time:</strong></p>
<ul>
<li><strong>TLB Miss</strong>:  <code>10 ns</code>.</li>
<li><strong>Page Table Lookup</strong>: <code>100 ns</code> (Look up page table in Main memory)</li>
<li><strong>Page Fault:</strong> <code>10^8 ns</code></li>
<li><strong>Access TLB again, miss:</strong> <code>10ns</code></li>
<li><strong>Memory Access again</strong> : <code>100 ns</code>
So intoatal, <code>0555H</code> needs <code>100,000,220 ns</code>.</li>
</ul>
<p>(c) <code>2555H</code>
We have virtual page number 2, and 555 for offset</p>
<ul>
<li>The TLB is initially empty, so a TLB miss occurs. Go for page table.</li>
<li>Look up the page table for page number <code>2</code>. The page table entry for page 2 has a valid bit of <code>1</code> (valid), so the page is in memory and can be mapped to physical frame <code>233H</code>.</li>
</ul>
<p><strong>Total Time</strong>:</p>
<ul>
<li><strong>TLB Miss</strong>:  <code>10 ns</code>.</li>
<li><strong>Page Table Lookup</strong>: <code>100 ns</code> (Look up page table in Main memory)</li>
<li><strong>Memory Access</strong>: <code>100 ns</code> </li>
</ul>
<p>So intotal, <code>2555H</code> needs <code>210ns</code></p>
<p>(2）Suppose the operating system permits processes to <strong>use only two physical pages</strong> with frame numbers <code>122H</code> and <code>233H</code>, employing the Least Recently Used (LRU) replacement algorithm. Given the certain access sequence above, what is the physical address for the virtual address <code>0555H</code>? Please explain the reasoning behind your answer.</p>
<h3>Answer for Q1.2</h3>
<p>Since we only can use two physical pages in TLB with <code>122H</code> and <code>233H</code>.
After we fetech <code>1333H</code> , we fetch <code>0555H</code> . A page fault happens, OS will help MMU to rebuild the mapping. At this time, According to LRU replacement, physical pages <code>122H</code> has just been used. So <code>233H</code> will be reconnect to virtual page number <code>0</code>.</p>
<p>Then, the PFN <code>233H</code> will be connected to <code>555H</code>, become the final physical address <code>233555H</code> .</p>
<h2>Question 2 [50pts]</h2>
<p>Here is a computer with a <strong>riscv64</strong> architecture, employing the <strong>Sv39</strong> multi-level paging mechanism. The formats for physical and virtual addresses are as follows.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208021451.png" alt="" /></p>
<p>Assuming there are only <strong>three free physical pages</strong> in memory, with <strong>physical page</strong> numbers being <code>0x000_0008_6000</code> , <code>0x000_0008_6001</code> , and <code>0x000_0008_6002</code> . When a process requests a physical page, the operating system adopts an allocation strategy of assigning physical page numbers <strong>from largest to smallest</strong>. At a certain point, the value in the <code>satp</code> register is <code>0x8000_0000_0008_4000</code> , with all PTEs in the root page table being zero. The current process attempts to access the valid virtual address <code>0x0000_0021_2345_6789</code></p>
<p>Please simulate the computer's <strong>handling of the page fault interrupt</strong>, allocate the corresponding physical page, correctly fill in the corresponding page table entry, and find the corresponding physical address. Complete the following blanks (in hexadecimal, ignoring the actual setting of flag bits in each level of page table entries, all flags set to 0 is OK).</p>
<ol>
<li>The physical address of the root page table is ______, and the value of the ____ th page table entry is ________. </li>
<li>The physical address of second-level page table is _____<em>, and the value of the ____th page table entry is _____\</em>. </li>
<li>The physical address of third-level page table is ______, and the value of the ____th page table entry is ______. </li>
<li>The physical address corresponding to the virtual address 0x0000_0021_2345<em>6789 is _____</em></li>
</ol>
<h3>Answer</h3>
<p>An example help me analysis from <a href="https://openosorg.github.io/openos/textbook/mm/page-tables.html">14.3. Page Tables — Introduction to Operating Systems</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208150328.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208152401.png" alt="" /></p>
<p>For Sv39:
From lower bit to higher bit:
the address <code>0x0000_0021_2345_6789</code> have:
offset = 0x789
VPN[2] = 0x056
VPN[1] = b'10_0011_010 = 0x11A
VPN[0] = b'010_0001_00 = 0x084</p>
<p>All PTEs in the root page table are zero.</p>
<h2>Root page table</h2>
<p>For <code>satp</code> value <code>0x8000_0000_0008_4000</code>,</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208024307.png" alt="" />
Figure reference: <a href="https://rcore-os.cn/rCore-Tutorial-Book-v3/chapter4/3sv39-implementation-1.html">SV39 多级页表的硬件机制 - rCore-Tutorial-Book-v3 3.6.0-alpha.1 文档</a></p>
<pre><code>当 <code>MODE</code> 设置为 0 的时候，代表所有访存都被视为物理地址；而设置为 8 的时候，SV39 分页机制被启用，所有 S/U 特权级的访存被视为一个 39 位的虚拟地址，它们需要先经过 MMU 的地址转换流程，如果顺利的话，则会变成一个 56 位的物理地址来访问物理内存；否则则会触发异常，这体现了分页机制的内存保护能力。</code></pre>
<table>
<thead>
<tr>
<th>bits</th>
<th>63-60</th>
<th>59-44</th>
<th>43-0</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>segment</strong></td>
<td>Mode</td>
<td>ASID</td>
<td>PPN</td>
</tr>
<tr>
<td><strong>description</strong></td>
<td>Sv39?</td>
<td>to identify kernel/process</td>
<td>PPN</td>
</tr>
<tr>
<td><strong>Num</strong></td>
<td><code>0x8</code></td>
<td><code>0x000_0</code></td>
<td><code>0x00_0008_4000</code></td>
</tr>
</tbody>
</table>
<p>So the physical address of the root page table is <code>0x00_0008_4000</code>.</p>
<p>The <strong>VPN[2] = 0x084</strong>, so we need to access the <strong>PTE at index 0x084</strong> in the root page table. Since all PTEs in the root page table are initially zero, a page fault occurs, and the operating system will allocate a new physical page for the second-level page table.</p>
<p><strong>Physical page allocation</strong>: The system allocates physical pages in the <strong>largest-to-smallest</strong> order. The largest free physical page is <code>0x000_0008_6002</code>, so the second-level page table will be placed at this address.</p>
<p>For our PTE, we have</p>
<pre><code class="language-txt"> 63      54 53      28 27      19 18      10 9   8 7 6 5 4 3 2 1 0
+----------+----------+----------+----------+-----+-+-+-+-+-+-+-+-+
| reserved |  PPN[2]  |  PPN[1]  |  PPN[0]  | RSW |D|A|G|U|X|W|R|V|
+----------+----------+----------+----------+-----+-+-+-+-+-+-+-+-+
     10         26          9          9       2   1 1 1 1 1 1 1 1</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241208022032.png" alt="" /></p>
<p>The <strong>value of the root PTE at index 0x084</strong> is:</p>
<p><code>PTE = 0x0000_0000_2180_0800</code></p>
<p>Here, <code>0x2180_0800</code> represents the physical address of the second-level page table (<code>0x000_0008_6002</code>).</p>
<h3>So the physical address of the root page table is <code>MARKDOWN_HASHc87d52f2199bb22364da98f4d3b3badcMARKDOWN<em>HASH</code>,  the value of the _\</em><code>MARKDOWN_HASH107ca442ee0b4a849f93b3a8b413c0e6MARKDOWN<em>HASH</code>__ th page table entry is __\</em><code>MARKDOWN_HASH18ebe5c91114f31b121dfa7d5b3580f9MARKDOWN<em>HASH</code>____</em>.</h3>
<p>This entry will give us the memory address for the second level page table.</p>
<p>The physical page number of the second-level page table will be <strong>0x000_0008_6002</strong>. Since VPN[1] = 0x11A, and the table is newly allocated, a new third-level page table is created. Its physical page number is <code>0x000_0008_6001</code> .</p>
<h3>The physical address of second-level page table is __<code>MARKDOWN_HASH8727aa770ccbb88cf5a3eb5d793d4d48MARKDOWN<em>HASH</code> \</em>__<em> , and the value of the \</em><code>MARKDOWN_HASHfac244a0d359012391a793a2848ba98aMARKDOWN<em>HASH</code>___th page table entry is _\</em><code>MARKDOWN_HASHe070c8b06083ab8c2db96258ef16e1a9MARKDOWN<em>HASH</code>___\</em>.</h3>
<h3>For the third page table, The physical address of third-level page table is __<code>MARKDOWN_HASH47928025bb8d89cd7517bfd068b60762MARKDOWN<em>HASH</code>____ , and the value of the _\</em><code>MARKDOWN_HASH669cf9d68faa95727095c0573c8ecf54MARKDOWN<em>HASH</code>__th page table entry is _\</em><code>MARKDOWN_HASHd20edeb026a0cbf7f0f153511a4c6a37MARKDOWN<em>HASH</code>___</em>.</h3>
<h3>So the physical address corresponding to the virtual address <code>0x0000_0021_2345_6789</code> is <code>0x00_0000_8600_0789</code>.</h3>
