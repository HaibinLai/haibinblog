---
title: "OS: Virtual Memory"
description: "Author: Haibin Lai 12211612 OS: Virtual Memory - Haibin's blog Q1 Address Translation Explain how do the CPU hardware and the operating system cooperate in the procedure of address translation. Ans: The hardware-based a…"
publishedAt: "2024-12-01 19:49:48"
updatedAt: "2024-12-05 05:05:13"
category: "OS"
tags: ["OS", "System"]
draft: false
slug: "os-virtual-memory"
legacySlug: "os-virtual-memory"
wordpressId: 438
sourceUrl: "https://www.haibinlaiblog.top/index.php/os-virtual-memory/"
commentCount: 0
importedFromWordPress: true
---
<p>Author:
Haibin Lai
12211612</p>
<p><a href="https://www.haibinlaiblog.top/index.php/os-virtual-memory/">OS: Virtual Memory - Haibin's blog</a></p>
<h2>Q1 Address Translation</h2>
<p>Explain how do the CPU hardware and the operating system cooperate in the procedure of address translation.</p>
<h3>Ans:</h3>
<p>The hardware-based address translation is for the virtualization of memory. We want programs on computer can only access its own memory space and protect each program from affecting each other.</p>
<p>For every program, they though their address space starts from 0 to 16KB, contains all the memory reference. So the hardware and OS should make the memory space transparent to every program.</p>
<p>To ensure that, <em>the CPU hardware</em> provide 4 important feature: MMU, base and bounds regs, exception trigger, privileged mode and instruction.</p>
<p><strong>Memory Management Unit</strong> (MMU) is to help transform the program virtual memory space to the real physical space. And CPU provides <strong>base and bounds</strong> register to make sure that the program's access is in its memory. If the program has a wild pointer that try to access illegal memory space like OS or other program's space, a <strong>exception</strong> will trigger. What's more, the base and bounds register should be priviledged that only OS can handle them. So, a <strong>privileged mode</strong> and <strong>privileged instruction</strong> that change the register should be provided.</p>
<p>As for <em>OS</em>, we need to implement 3 essential thing to ensure address translation: Memory management, base and bounds regs management, exception handler.</p>
<p>For memory management, OS should remember where the program allocate the memory. OS should maintain a <strong>free list</strong> for memory management. When creating a process, OS will find a free physical space for process, then point out that this place is occupied. Also, when the process is terminated, the place becomes free again. Also, OS should <strong>remember the base and bounds register</strong> for every process, storing them in PCB. So that even though in context switch the former base and bounds reg are flushed, they still are stored in OS's PCB. As for exception, when an exception raised by hardware, OS can handle this fault like killing the process to prevent others from malicious process.</p>
<h2>Q2 Segmentation and Paging</h2>
<p>Read Chapter 16 ”( ( <a href="https://pages.cs.wisc.edu/~remzi/OSTEP/vm-segmentation.pdf">https://pages.cs.wisc.edu/~remzi/OSTEP/vm-segmentation.pdf</a>) and chapter 18 <a href="https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf">https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf</a> ) of “Three Easy Pieces” and compare segmentation and paging. Your answer should cover all aspects (e.g., size of chunks, management of free space, context switch overhead, fragmentation, status bits and protection bits, etc.) and compare them side-by-side.</p>
<h3>Ans</h3>
<h4>Segmentation</h4>
<p>The idea of virtual memory is solved by the cooperation of OS and Hardware. However, a new problems comes out. Simply using base and bounds register will waste a lot of unused memory in program.</p>
<pre><code class="language-txt">|-------|
|  code |
|       |
| heap  |
| free  |
| free  |
| stack |
|-------|</code></pre>
<p>To do that, a basic idea is to give every heap, code and stack a base and bounds register, that is segement register. Segement register contains the base address, size, growth direction and protect bits. But this allocation is coarse-grained.</p>
<p>To support multiple segement, we need a segement table to maintain all the segements' status, so that it can handle fragmentation. And for the memory that is release, we need to coalescing the free space and new release space. So how to schedule a divide plan for fast and lease segement is essential, which we can use best fit, worst fit and first fit etc. For coalescing, we have binary buddy allocator algorithm to allocate memory to program.</p>
<h4>Paging</h4>
<p>Another method to control memory space is to divide space into fixed length segement ---- paging.</p>
<p>Paging has high flexibility. We can provide abstract whatever the process use address space and we don't need to consider the growth of stack and heap. To maintain pages, we need a page table to store all the address translation. </p>
<p>Here, a virtual address contains virtual page number VPN and offset. The offset is not changed, and VPN will transform into PFN.</p>
<pre><code>offset   = VirtualAddress &amp; OFFSET_MASK
PhysAddr = (PFN &lt;&lt; SHIFT) | offset

// Extract the VPN from the virtual address
VPN = (VirtualAddress &amp; VPN_MASK) &gt;&gt; SHIFT

// Form the address of the page-table entry (PTE)
PTEAddr = PTBR + (VPN * sizeof(PTE))

// Fetch the PTE
PTE = AccessMemory(PTEAddr)

// Check if process can access the page
if (PTE.Valid == False)
    RaiseException(SEGMENTATION_FAULT)
else if (CanAccess(PTE.ProtectBits) == False)
    RaiseException(PROTECTION_FAULT)
else
    // Access is OK: form physical address and fetch it
    offset = VirtualAddress &amp; OFFSET_MASK
    PhysAddr = (PTE.PFN &lt;&lt; PFN_SHIFT) | offset
    Register = AccessMemory(PhysAddr)</code></pre>
<h3>Summary Table</h3>
<table>
<thead>
<tr>
<th><strong>Aspect</strong></th>
<th><strong>Segmentation</strong></th>
<th><strong>Paging</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Chunk Size</strong></td>
<td>Variable size (logical segments)</td>
<td>Fixed size (e.g., 4 KB pages)</td>
</tr>
<tr>
<td><strong>Free Space Management</strong></td>
<td>More complex, prone to external fragmentation. Use algorithm like binary buddy allocator to accerlate and manage it</td>
<td>Simpler, no external fragmentation, but internal fragmentation can occur in pages</td>
</tr>
<tr>
<td><strong>Context Switch Overhead</strong></td>
<td>Higher, due to segment table management. OS must must load the segment table for the incoming process.</td>
<td>Lower, mainly involves page table updates. Requires loading the page table of the incoming process.</td>
</tr>
<tr>
<td><strong>Fragmentation</strong></td>
<td>External fragmentation is main concern</td>
<td>Internal fragmentation may occur</td>
</tr>
<tr>
<td><strong>Utilization</strong></td>
<td>Fine-grained (per segment)</td>
<td>Coarse-grained (per page)</td>
</tr>
<tr>
<td><strong>Address Translation Mechanism</strong></td>
<td>Segment number + offset, uses segment table</td>
<td>Page number + offset, uses page table</td>
</tr>
<tr>
<td><strong>Implementation </strong></td>
<td>More complex, requires managing variable-sized chunks</td>
<td>Simpler, fixed-size pages reduce complexity</td>
</tr>
<tr>
<td><strong>Flexibility</strong></td>
<td>More flexible in terms of memory use</td>
<td>Less flexible due to fixed page size</td>
</tr>
<tr>
<td><strong>Protection bits and Status bits</strong></td>
<td>present/absent, read, write, execute permissions</td>
<td>present, modified; enabling control over access permissions at the page level</td>
</tr>
</tbody>
</table>
<h2>Q3 Virtual Page address</h2>
<p>Consider a system with the following specifications: </p>
<p>46-bit virtual address space
Page size of 8 KBytes
Page table entry size of 4 Bytes
Every page table is required to fit into a single page </p>
<p>How many levels of page tables would be required to map the entire virtual address space? </p>
<p>Please document the format of a virtual address under this translation scheme. Briefly explain your rationale.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201223751.png" alt="" /></p>
<h3>Answer</h3>
<p>Virtual address space is 46 bit with $2^{13}$ Bytes Page size, so
$$
Number \ of \ Page = 2^{46} / 2^{13} = 2 ^{33}
$$</p>
<p>Page table entry size is 4 Bytes, so
$$
\ Entries \ number \ per \ page \ table = (Page \ size) / (PTE \ size) = 2^{13} / 4
= 2^{11} $$
For the level 1 page table it can match $2^{11}$ entries. And each sublevel also need maps $2^{11}$ entries.
$$
Number \ of \ Level = 2^{33} / 2^{11} = 3
$$
So, the format of a virtual address is:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201225349.png" alt="" /></p>
<h2>Q4 Virtual Address Space</h2>
<p>Consider a system with following specifications: </p>
<p>Both virtual address space and physical address are 32bits.
Page table entry size of 4Bytes </p>
<p>(a) Suppose it uses 1-level page table, the format of the translation scheme is
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201225436.png" alt="" />
What is the page size? What is the maximum page table size?
$$
Page \ size = 2^{12} \ bytes = 4096 \ bytes
$$
Maximum page table size:
$$
Maximum \ page \ table \ size = 2^{20} \times 4 \ bytes = 4 MB
$$</p>
<p>(b) Suppose it uses 2-level page table, the format of the translation scheme is</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201225450.png" alt="" />
Please write down the 1-st level page number and its offset in decimal (base 10) of virtual address 0xC302C302 (base 16).
Please write down the 2-nd level page number and its offset in decimal (base 10) of virtual address 0xEC6666AB (base16)</p>
<p>0xC302C302 = b'<strong>1100 0011 00</strong>00 0010 1100 0011 0000 0010</p>
<p>So 1-st level page numver:
Page index: b'1100 0011 00  = 780 (decimal)</p>
<p>Page offset: b'0011 0000 0010 (binary) = 770 (decimal)</p>
<hr />
<p>0xEC6666AB = b'1110 1100 01<strong>10 0110 0110</strong> 0110 1010 1011
Page index: b'10 0110 0110 (binary)
Page offset: b'0110 1010 1011 (binary) = 1707</p>
<h2>Q5 Buddy System Allocator</h2>
<p>Please use the <code>buddy_system_allocator</code> crate to do allocation and deallocation, here are the recommended initialization, and corresponding alloc and dealloc functions:</p>
<pre><code class="language-Rust">let mut allocator: buddy_system_allocator::FrameAllocator&lt;32&gt; = buddy_system_allocator::FrameAllocator::new();
allocator.add_frame(0, 64);

let base = allocator.alloc(4).unwrap();
allocator.dealloc(base, 4);</code></pre>
<p>Steps: </p>
<ol>
<li>allocate 4 frames </li>
<li>allocate 4 frames </li>
<li>deallocate the 4 frames in step 2 </li>
<li>allocate 8 frames </li>
<li>allocate 2 <strong>frames</strong></li>
</ol>
<p>Output the starting and ending addresses of the frames allocated in steps 1, 2, 4, and 5, and take a screenshot. Please provide detailed explanations for each allocation. Output template</p>
<pre><code class="language-txt">[Step 1 allocation] start: {}, end: {}.
[Step 2 allocation] start: {}, end: {}.
[Step 4 allocation] start: {}, end: {}.
[Step 5 allocation] start: {}, end: {}.</code></pre>
<h3>Ans</h3>
<p>Ref: OSTEP 17<a href="https://pages.cs.wisc.edu/~remzi/OSTEP/vm-freespace.pdf">single.dvi</a></p>
<p>In such a system, free memory is first conceptually thought of as one
big space of size $2^N$. When a request for memory is made, the search for
free space recursively divides free space by two until a block that is big
enough to accommodate the request is found (and a further split into two
would result in a space that is toosmall). At this point, the requested
block is returned to the user.</p>
<pre><code class="language-txt">[Step 1 allocation] start: 0, end: 4.
[Step 2 allocation] start: 4, end: 8.
[Step 4 allocation] start: 8, end: 16.
[Step 5 allocation] start: 4, end: 6.</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232139.png" alt="" /></p>
<p>allocation 1:
<code>[Step 1 allocation] start: 0, end: 4. </code>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232639.png" alt="" /></p>
<p>Allocation 2:
<code>[Step 2 allocation] start: 4, end: 8. </code>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232629.png" alt="" /></p>
<p>Allocation 3:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232639.png" alt="" /></p>
<p>Step 4 allocate 8 frames
<code>[Step 4 allocation] start: 8, end: 16. </code>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232757.png" alt="" /></p>
<p>Step 5 allocate 2 <strong>frames</strong>
<code>[Step 5 allocation] start: 4, end: 6.</code>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241201232915.png" alt="" /></p>
<h1>EOF</h1>
