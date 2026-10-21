---
title: "Wireshark 是如何实现抓包的？"
description: "PPT: 为什么wireshark抓不到HTTP My summary web page: BPF与npcap库.drawio Wireshark 是如何实现的 wireshark的总体结构如下图所示。 【wireshark】Wireshark原理分析与二次开发系列 - 赵子清 - 博客园 (cnblogs.com) 抓包 捕获从网络适配器提取包,并将其保存到硬盘上. 访问底层网络适配器需要提升的权限，因此和底层网卡抓包的功能被封装在…"
publishedAt: "2024-10-13 13:17:37"
updatedAt: "2024-12-07 17:32:04"
category: "Computer Network"
tags: ["OS", "Wireshark", "网络"]
draft: false
slug: "wireshark-是如何实现抓包的"
legacySlug: "wireshark-是如何实现抓包的？"
wordpressId: 372
sourceUrl: "https://www.haibinlaiblog.top/index.php/wireshark-%e6%98%af%e5%a6%82%e4%bd%95%e5%ae%9e%e7%8e%b0%e6%8a%93%e5%8c%85%e7%9a%84%ef%bc%9f/"
commentCount: 0
importedFromWordPress: true
---
<p>PPT: <a href="https://www.haibinlaiblog.top/?attachment_id=373" title="为什么wireshark抓不到HTTP">为什么wireshark抓不到HTTP</a></p>
<p>My summary web page: <a href="https://www.haibinlaiblog.top/wp-content/uploads/2024/12/BPF与npcap库.drawio.html">BPF与npcap库.drawio</a></p>
<h1>Wireshark 是如何实现的</h1>
<p>wireshark的总体结构如下图所示。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20240925011458.png" alt="" />
<a href="https://www.cnblogs.com/zzqcn/p/4788777.html">【wireshark】Wireshark原理分析与二次开发系列 - 赵子清 - 博客园 (cnblogs.com)</a></p>
<h2>抓包</h2>
<p>捕获从网络适配器提取包,并将其保存到硬盘上.</p>
<p>访问底层网络适配器需要提升的权限，因此和底层网卡抓包的功能被封装在dumpcap中，这是Wireshark中唯一需要特权执行的程序，代码的其他部分（包括解析器，用户界面等等）只需要普通用户权限。</p>
<p>为了隐藏所有底层的机器依赖性,使用了libpcap/WinPcap库.这此库提供了从多种不同的网络接口 类型(Ethernet, Token Ring,...)上捕获包的通用接口.</p>
<p><a href="https://www.cnblogs.com/zzqcn/p/4823229.html">【wireshark】抓包和文件格式支持 - 赵子清 - 博客园 (cnblogs.com)</a></p>
<p><a href="https://wiki.wireshark.org/libpcap">libpcap - Wireshark Wiki</a></p>
<h2>Npcap 是如何抓包的</h2>
<p>Npcap 实现了 Win10 NPF库，叫做 NPF（Netgroup Packet Filter），该驱动从 Win10 miniport 驱动获取网卡数据实现监控网络数据包的功能（Win10 使用 miniport 驱动控制网卡）。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241013131701.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20240925011700.png" alt="" /></p>
<p><a href="NIC">NIC</a></p>
<p>Document：<a href="https://link.zhihu.com/?target=https%3A//npcap.com/guide/npcap-internals.html%23npcap-internals-driver">https://npcap.com/guide/npcap-i</a>
这篇document非常值得阅读！！！！！！！！</p>
<p>Github: <a href="https://github.com/nmap/npcap">nmap/npcap: Nmap Project's Windows packet capture and transmission library (github.com)</a></p>
<p>NPF具体是怎么做的？
模仿NDIS的filter层：<a href="https://npcap.com/guide/npcap-internals.html#npcap-internals-driver">Npcap internals | Npcap Reference Guide</a></p>
<p>工程上怎么实现的：BPF技术</p>
<h3>Further reading</h3>
<p>The structure of NPF and its filtering engine derive directly from the one of the BSD Packet Filter (BPF), so if you are interested the subject you can read the following papers:</p>
<ul>
<li>
<p>S. McCanne and V. Jacobson, <a href="ftp://ftp.ee.lbl.gov/papers/bpf-usenix93.ps.Z">The BSD Packet Filter: A New Architecture for User-level Packet Capture</a>. Proceedings of the 1993 Winter USENIX Technical Conference (San Diego, CA, Jan. 1993), USENIX.</p>
</li>
<li>
<p>A. Begel, S. McCanne, S.L.Graham, BPF+: <a href="http://www.acm.org/pubs/articles/proceedings/comm/316188/p123-begel/p123-begel.pdf">Exploiting Global Data-flow Optimization in a Generalized Packet Filter Architecture</a>, Proceedings of ACM SIGCOMM '99, pages 123-134, Conference on Applications, technologies, architectures, and protocols for computer communications, August 30 - September 3, 1999, Cambridge, USA</p>
</li>
</ul>
<p><strong>InfoQ：eBPF 是从 BPF 技术扩展⽽来的，您能简要介绍下它的发展历程吗？</strong></p>
<p><strong>陈莉君教授：</strong>最早可以追溯到 1992 年。在 1992 年 USENIX 会议上，论文“The BSD Packet Filter: A New Architecture for User-level Packet Capture”提出了革命性的包过滤机制 BSD Packet Filter（简称为 BPF），这比当时最先进的数据包过滤技术还快 20 倍。这主要得益于 BPF 的两大设计：第一，<a href="https://zhida.zhihu.com/search?content_id=224153103&amp;content_type=Article&amp;match_order=1&amp;q=%E5%86%85%E6%A0%B8%E6%80%81&amp;zhida_source=entity">内核态</a>引入一个新的虚拟机，所有指令都在<a href="https://zhida.zhihu.com/search?content_id=224153103&amp;content_type=Article&amp;match_order=1&amp;q=%E5%86%85%E6%A0%B8%E8%99%9A%E6%8B%9F%E6%9C%BA&amp;zhida_source=entity">内核虚拟机</a>中运行；第二，用户态使用 BPF 字节码来定义过滤表达式，然后传递给内核，由内核虚拟机解释执行。</p>
<p>在 Linux 2.1.75 中，首次引入了 BPF 技术。在 Linux 3.0 中，增加了 BPF 即时编译器，它替换掉了原本性能更差的解释器，进一步优化了 BPF 指令运行的效率。</p>
<p>2014 年，Alexei Starovoitov 将 BPF 扩展为一个通用的虚拟机，也就是 eBPF。eBPF 不仅扩展了寄存器的数量，引入了全新的 BPF 映射存储，还在 4.x 内核中将原本单一的数据包过滤事件逐步扩展到了内核态函数、用户态函数、跟踪点、性能事件（perf_events）以及安全控制等。</p>
<p><strong>eBPF 的诞生是 BPF 技术的一个转折点，使得 BPF 不再仅限于网络栈，而是成为内核的一个顶级子系统。</strong></p>
<p>eBPF，它的全称是“Extended Berkeley Packet Filter”。从名字看，你可能会觉奇怪，似乎它就是一个用来做<a href="https://zhida.zhihu.com/search?content_id=172300535&amp;content_type=Article&amp;match_order=1&amp;q=%E7%BD%91%E7%BB%9C%E6%95%B0%E6%8D%AE%E5%8C%85&amp;zhida_source=entity">网络数据包</a>过滤的模块。</p>
<p>其实这么想也没有错，eBPF 的概念最早源自于 BSD 操作系统中的 BPF（Berkeley Packet Filter），1992 伯克利<a href="https://zhida.zhihu.com/search?content_id=172300535&amp;content_type=Article&amp;match_order=1&amp;q=%E5%AE%9E%E9%AA%8C%E5%AE%A4&amp;zhida_source=entity">实验室</a>的一篇论文 “The BSD Packet Filter: A New Architecture for User-level Packet Capture”。这篇论文描述了，BPF 是如何更加高效灵活地从操作系统内核中抓取网络数据包的。</p>
<p>我们很熟悉的 <a href="https://zhida.zhihu.com/search?content_id=172300535&amp;content_type=Article&amp;match_order=1&amp;q=tcpdump&amp;zhida_source=entity">tcpdump</a> 工具，它就是利用了 BPF 的技术来抓取 Unix 操作系统节点上的<a href="https://zhida.zhihu.com/search?content_id=172300535&amp;content_type=Article&amp;match_order=1&amp;q=%E7%BD%91%E7%BB%9C%E5%8C%85&amp;zhida_source=entity">网络包</a>。Linux 系统中也沿用了 BPF 的技术。</p>
<p>那 BPF 是怎样从内核中抓取数据包的呢？我借用 BPF 论文中的图例来解释一下：</p>
<h4>Main components of Npcap.</h4>
<p>First, a capture system needs to bypass the operating systems's protocol stack in order to access the raw data transiting on the network. This requires a portion running inside the kernel of OS, interacting directly with the network interface drivers. This portion is very system dependent, and in our solution it is realized as a device driver, called Netgroup Packet Filter (NPF); This driver offers basic features like packet capture and injection, as well as more advanced ones like a programmable filtering system and a monitoring engine. The filtering system can be used to restrict a capture session to a subset of the network traffic (e.g. it is possible to capture only the ftp traffic generated by a particular host); the monitoring engine provides a powerful but simple to use mechanism to obtain statistics on the traffic (e.g. it is possible to obtain the network load or the amount of data exchanged between two hosts).</p>
<p>Second, the capture system must export an interface that user-level applications will use to take advantage of the features provided by the kernel driver. Npcap provides two different libraries: and .<code>packet.dll</code><code>wpcap.dll</code></p>
<p>Packet.dll offers a low-level API that can be used to directly access the functions of the driver, with a programming interface independent from the Microsoft OS.</p>
<p>Wpcap.dll exports a more powerful set of high level capture primitives that are compatible with libpcap, the well known Unix capture library. These functions enable packet capture in a manner that is independent of the underlying network hardware and operating system.</p>
<h2>Wincap</h2>
<p>WinPcap是Windows平台下访问网络数据链路层的开源库 ， 该库已达到工业标准的应用要求。WinPcap允许应用程序绕开网络协议栈来捕获与传递网络数据包，并具有额外的有用特性，包括内核层的数据包过滤、一个 网络统计引擎与支持远程数据包捕获。</p>
<p>       什么是 WinPcap</p>
<p>大多数网络应用程序通过被广泛使用的操作系统原语来访 问网络，诸如sockets。操作系统已经处理了底层的细节问题（如协议处理，数据包的封装等），并提供与读写文 件类似的、熟悉的接口，这使得用该方法可以很容易的访问网络中的数据。</p>
<p>然而有些时候，这种“简单的方式”并不能满足任务要求，因为有些应用程序需要直接访问网络中的数据包。也就是说，应用程序需要访问网络中的“原 始”数据包，即没有被操作系统使用网络协议进行处理过的数据包。</p>
<p>WinPcap的目的就是为Win32应用程序提供这种访问方式。WinPcap提供下列功能：</p>
<ul>
<li>捕获原始 数据包，无论是发送到运行WinPcap机器上的数据包，还是在其它主机（ 共享介质 ）上进行交换的数据包</li>
<li>在数据包 分派给应用程序前，根据用户指定的规则过滤数据包</li>
<li>将原始数 据包发送到网络</li>
<li>收集网络流量的统计信息</li>
</ul>
<p><a href="https://blog.csdn.net/cheriselin/article/details/5562736">深度剖析WinPcap之(一)—— WinPcap简介-CSDN博客</a></p>
<h2>3 HTTP Analysis</h2>
<p>HTTP</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241008134708.png" alt="" /></p>
<h1>EOF</h1>
