---
title: "ASPLOS13 Unikernel: A Special Kernel for Apps in cloud"
description: "login_oct15_02_kantee.pdf Unikernels - Rethinking Cloud Infrastructure Unikernels: library operating systems for the cloud: ACM SIGARCH Computer Architecture News: Vol 41, No 1 (1 条消息) Unikernel: 从不入门到入门 - 知乎 This passa…"
publishedAt: "2025-07-19 00:11:46"
updatedAt: "2025-07-22 03:51:28"
category: "OS"
tags: ["OS"]
draft: false
slug: "asplos13-unikernel-a-special-kernel-for-apps-in-cloud"
legacySlug: "asplos13-unikernel-a-special-kernel-for-apps-in-cloud"
wordpressId: 889
sourceUrl: "https://www.haibinlaiblog.top/index.php/asplos13-unikernel-a-special-kernel-for-apps-in-cloud/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="http://www.fixup.fi/misc/usenix-login-2015/login_oct15_02_kantee.pdf">login_oct15_02_kantee.pdf</a>
<a href="http://unikernel.org/">Unikernels - Rethinking Cloud Infrastructure</a>
<a href="https://dl.acm.org/doi/abs/10.1145/2490301.2451167">Unikernels: library operating systems for the cloud: ACM SIGARCH Computer Architecture News: Vol 41, No 1</a>
<a href="https://zhuanlan.zhihu.com/p/29053035">(1 条消息) Unikernel: 从不入门到入门 - 知乎</a></p>
<p>This passage introduced a new OS kernel: Unikernel. The kernel can only run one apps, and try to make the app running on it and OS itself to be light, secure and fast.</p>
<p>What's the difference between it and microkernel: The single running apps.</p>
<p>Unikernel 镜像都很小，由 MirageOS实现的一个 DNS server 才 184KB，实现的一个 web server 674 KB，小到恐怖的程度。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250718104048347.png" alt="" /></p>
<p>—— In return they offer significant reduction in image sizes, improved efficiency and security, and should reduce operational costs. Unikernel试图抹去现代操作系统带来的一些复杂性。因为“通用”的操作系统（就像任何Linux和Windows的发行版），通常会伴随着带来一些对你的应用来说并不需要的驱动、依赖包、服务、等等，但这些对每一个操作系统来说某种程度上又是必需的。</p>
<h2>Docker VS Unikernel</h2>
<p>Docker</p>
<pre><code class="language-txt">[硬件]
   ⬇
[通用操作系统内核]
   ⬇
[多个容器进程：App + 必要依赖]</code></pre>
<p>Unikernel</p>
<pre><code class="language-txt">[硬件]
   ⬇
[Hypervisor]
   ⬇
[Unikernel：App + 必要的最小内核]</code></pre>
<ul>
<li>只保留运行单个应用所需的最小内核功能；没有多用户、多进程等通用 OS 特性。</li>
<li><strong>运行方式</strong>：生成的单一二进制直接跑在虚拟机（如 Xen/KVM）或裸机（甚至专用硬件）上</li>
</ul>
<p>是 <strong>「应用和最小化内核打包成单二进制」</strong> 的极端专用系统</p>
<h2>Only has one address segement</h2>
<p>A long context with several region.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250718104457565.png" alt="" /></p>
<h2>OS improvement?</h2>
<p>Here use a word from “The Rise and Fall of the Operating System&quot;:</p>
<p>As a result of added I/O device processing power, what else is obsolete in the software/hardware stack? One is tempted to argue that everything is obsolete. The whole hardware/soft ware stack is bifurcated at a seemingly arbitrary position which made sense 30 years ago, but no longer. Your average modern I/O device has more computing power than most continents had 30 years ago. Pretending that it is the same dumb device that needs to be programmed by flipping registers with a sharpened toothpick results in sad programmers and, if not broken, at least suboptimal drivers. Does doing 802.11 really require 30k+ lines of driver code (including comments), 80k+ lines of generic 802.11 support, and a 1 MB firmware to be loaded onto the NIC? For comparison, the entire 4.3BSD kernel from 1986 including all device drivers, TCP/IP, the file system, system calls, and so forth is roughly 100k lines of code. How difficult can it be to join a network and send and receive packets? Could we make do with 1k lines of system-side code and 1.01 MB of firmware?</p>
<p>Therefore, there is no reason to port and cram an operating system into every problem space. Instead, we can split the operating system into the “orchestrating system” (which also has the catchy OS acronym going for it) and the drivers. Both have separate roles. The drivers define what is possible. The orchestrating system defines how the drivers should work and, especially, how they are not allowed to work. The two paths should be investigated relatively independently as opposed to classic systems develop ment where they are deeply intertwined.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250718105049190.png" alt="" /></p>
