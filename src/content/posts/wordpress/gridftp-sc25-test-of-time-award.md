---
title: "GridFTP: SC25 Test of Time Award"
description: "How to move massive data from server to client? How to serve multiple users around the world to use the compute machine? This technology was not invented in cloud computing, but grid computing. And this is the paper pub…"
publishedAt: "2025-10-10 21:07:29"
category: "Paper Reading"
tags: ["Cloud", "grid computing", "HPC", "Network"]
draft: false
slug: "gridftp-sc25-test-of-time-award"
legacySlug: "gridftp-sc25-test-of-time-award"
wordpressId: 1003
sourceUrl: "https://haibin-blog.vercel.app/index.php/gridftp-sc25-test-of-time-award/"
commentCount: 0
importedFromWordPress: true
---
<p><strong>How to move massive data from server to client? How to serve multiple users around the world to use the compute machine? </strong></p>
<p>This technology was not invented in cloud computing, but grid computing. And this is the paper published at SC05: The Globus Striped GridFTP Framework and Server.</p>
<h2>SC25 ToT Award</h2>
<p><strong>From SC25 website:</strong>
<a href="https://sc25.supercomputing.org/2025/10/lasting-innovation-in-data-movement-sc25-test-of-time-award/">https://sc25.supercomputing.org/2025/10/lasting-innovation-in-data-movement-sc25-test-of-time-award/</a></p>
<p>The SC25 Test of Time (ToT) committee is pleased to announce that <a href="https://ieeexplore.ieee.org/document/1560006"><em>The Globus Striped GridFTP Framework and Server</em></a> by William Allcock, John Bresnahan, Rajkumar Kettimuthu, Michael Link, Catalin Dumitrescu, Ioan Raicu, and Ian Foster has been selected as the winner of this year’s award.</p>
<p>First published at SC05, this important paper addressed one of the central challenges in supercomputing at the time: <strong>how to move very large amounts of data both reliably and securely, without sacrificing performance.</strong> The authors’ solution, the <strong>striped GridFTP framework</strong>, made it possible for multiple servers and clients to work together in parallel, significantly increasing the scale and speed of transfers. At the time, these capabilities allowed data to move at rates far beyond what existing tools could support, while also serving thousands of users simultaneously.</p>
<p>The influence of this work has been profound. For nearly two decades, GridFTP provided the foundation for scientific discovery in many fields: enabling the movement of telescope sky survey data, supporting analysis from large particle accelerators, and helping transfer vast genomic datasets. It became a trusted and widely adopted tool for the global research community—well before today’s cloud-based approaches were available.</p>
<p><strong>Reflecting on the award, SC25 Test of Time Award Chair Bill Gropp shared:</strong></p>
<p><strong>“The Globus Striped GridFTP paper represents a milestone in data movement for computational science. Its approach has been widely adopted and remains a critical part of the community’s infrastructure. Few technologies have had such a lasting impact, and this paper represents perfectly what our Test of Time Award is all about.”</strong></p>
<p>Paper link:
<a href="https://www.globus.org/sites/default/files/gridftp_final.pdf">https://www.globus.org/sites/default/files/gridftp_final.pdf</a></p>
<h2>Introduction</h2>
<p>The GridFTP extensions to the File Transfer Protocol define a general-purpose mechanism for secure, reliable, high-performance data movement.</p>
<p>The early 2000s saw a rapid increase in data volume and network capacity. However, moving large datasets across wide-area networks (WANs) was technically challenging due to:</p>
<ul>
<li>The need to exploit <strong>parallelism</strong> in storage, networks, and interfaces.</li>
<li>Dealing with <strong>firewalls, heterogeneous systems, and frequent failures</strong>.</li>
<li><strong>TCP's inefficiency</strong> on high-bandwidth, high-latency links.</li>
<li>The complexity of managing <strong>end-to-end performance</strong> across diverse devices</li>
</ul>
<p>The authors chose to implement the <strong>GridFTP protocol</strong>, an extension of FTP, for its:</p>
<ul>
<li>Separation of control and data channels (enabling third-party transfers).</li>
<li>Well-defined extension mechanism.</li>
<li>Added features like striping, parallel streams, and partial file transfer.</li>
</ul>
<h2>Problem background</h2>
<ul>
<li>
<p>随着存储系统数据量和广域网带宽的快速增长，跨广域网高效、可靠地传输大规模数据变得日益重要。</p>
</li>
<li>
<p>传统FTP协议在性能、安全性和扩展性方面存在局限，无法满足高性能计算和大规模分布式系统的需求。</p>
</li>
</ul>
<p>For example, the NSF TeraGrid network links large clusters and storage systems at nine sites with a network providing up to 30 Gbit/s end-to-end. In principle, we should be able to move data across this network at more than 3 Gbyte/s, or 10 Tbyte/hr.</p>
<p><strong>In practice, the orchestration of such transfers is technically challenging.</strong> One key issue is the frequent need to exploit parallelism in multiple dimensions, including (depending on context) storage systems, network interfaces, and backbone network trunks. Another is dealing with failures of various sorts. Firewalls, parallel file systems, and other specialized devices can also cause difficulties, as can the need to transform data before and/or after transfer. For these and other reasons, rapid, efficient, and robust wide area end-to-end transport requires the management of complex systems at multiple levels. For example, in recent work, we required 32 hosts connected at 1 Gbit/s to drive a 30 Gbit/s connection.</p>
<h2>Protocol Design</h2>
<p><strong>Key Features</strong></p>
<ul>
<li><strong>Striping &amp; Parallelism</strong>: Data can be distributed across multiple servers (striping) and transferred using multiple parallel TCP streams to saturate high-speed links.</li>
<li><strong>OA/Security</strong>: Robust authentication using GSS-API (with GSI and Kerberos bindings) for both control and data channels, which is critical for third-party transfers.</li>
<li><strong>Third-Party Control</strong>: Allows a client to initiate and manage a transfer between two remote servers.</li>
<li><strong>Reliability</strong>: Supports restartable transfers from the point of failure.</li>
</ul>
<p>GridFTP 是对标准FTP的扩展，增加了以下关键特性：</p>
<ul>
<li><strong>第三方控制传输</strong></li>
<li><strong>GSS-API 认证</strong>（控制通道与数据通道）</li>
<li><strong>并行TCP流</strong>+<strong>条纹化传输</strong>（多服务器并行传输）+ <strong>部分文件传输</strong></li>
<li><strong>可靠与可恢复传输</strong></li>
</ul>
<p>The core innovation is the <strong>modular framework</strong>, which consists of three logical components:</p>
<ul>
<li><strong>Protocol Interpreters (PIs)</strong>: Handle the control channel communication (client and server).</li>
<li><strong>Data Transfer Process (DTP)</strong>: Handles the actual data movement. It is itself decomposed into a pipeline of three modules:
<ul>
<li><strong>Data Access Module</strong>: Interfaces with storage (e.g., POSIX files, HPSS).</li>
<li><strong>Data Processing Module</strong>: Performs server-side processing (e.g., compression).</li>
<li><strong>Data Channel Protocol Module</strong>: Manages the network protocol (using the Globus XIO system).</li>
</ul></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251010205932219.png" alt="image.png" /></p>
<p>Globus GridFTP 系统采用<strong>模块化、可扩展的架构</strong>，主要包括三个组件：</p>
<ol>
<li><strong>协议解释器（PI）</strong>：处理控制通道命令。</li>
<li><strong>数据传输进程（DTP）</strong>：负责实际的数据读写和传输。</li>
<li><strong>DTP 内部模块</strong>：
<ul>
<li><strong>数据访问模块</strong>：读写本地或远程存储。</li>
<li><strong>数据处理模块</strong>：支持服务器端数据转换（如压缩）。</li>
<li><strong>数据通道协议模块</strong>：处理网络传输协议（如TCP）。</li>
</ul></li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251010205950443.png" alt="image.png" /></p>
<h2>Experiment</h2>
<p>speeds of 27.3 Gbit/s memory-to-memory and 17 Gbit/s disk-to-disk over a 60 millisecond round trip time, 30Gbit/s network</p>
<p>In another experiment, we show that the server can support 1800 concurrent clients without excessive load.</p>
<ul>
<li>在WAN环境中，内存到内存传输可达 <strong>27.3 Gbit/s</strong>，磁盘到磁盘传输可达 <strong>17 Gbit/s</strong>。</li>
<li>系统支持 <strong>1800个并发客户端</strong>，表现出良好的可扩展性。</li>
</ul>
<p>Globus Striped GridFTP 是一个<strong>高性能、模块化、可扩展</strong>的数据传输框架，适用于大规模、高并发的科学计算和数据密集型应用。其设计兼顾了性能、安全性和灵活性，为构建下一代数据管理工具提供了坚实基础。</p>
