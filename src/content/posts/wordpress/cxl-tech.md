---
title: "CXL技术：历史、技术与展望"
description: "Research on the CXL Memory CXL (Compute Express Link) 技术是一种基于PCIe IO的缓存一致性互联标准, 其旨在提供主机处理器与加速器、内存缓冲器和智能 I/O 设备之间的高带宽、低延迟连接。 CXL在延迟和带宽方面比传统的远程直接内存访问（RDMA）技术有所改进，基于 CXL 内存的存算分离架构的趋势会继续，更多标准化和生态开发会出来。但在处理高并发和高吞吐量任务时，与本地内存相…"
publishedAt: "2025-05-13T21:53:05Z"
updatedAt: "2025-05-13T21:54:50Z"
category: "High Performance Computing"
categories: ["High Performance Computing"]
tags: ["CXL", "HPC"]
author: "GB"
draft: false
slug: "cxl-tech"
legacySlug: "cxl-tech"
oldSlugs: ["cxl技术：历史、技术与展望"]
wordpressId: 765
sourceUrl: "https://www.haibinlaiblog.top/index.php/cxl-tech/"
commentCount: 0
viewCount: 2490
likeCount: 3
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech.webp"
---
<h2>Research on the CXL Memory</h2>
<p>CXL (Compute Express Link) 技术是一种基于PCIe IO的缓存一致性互联标准, 其旨在提供主机处理器与加速器、内存缓冲器和智能 I/O 设备之间的高带宽、低延迟连接。</p>
<p>CXL在延迟和带宽方面比传统的远程直接内存访问（RDMA）技术有所改进，基于 CXL 内存的存算分离架构的趋势会继续，更多标准化和生态开发会出来。但在处理高并发和高吞吐量任务时，与本地内存相比仍有很大差距。随着技术的不断发展和市场的不断成熟，创新的内存管理和调度策略将使 CXL 内存成为云计算领域的关键角色，大幅提高性能和效率。  </p>
<h2>Motivation &amp; 现有内存的挑战</h2>
<p>在数据中心内，我们面临三个主要内存挑战：</p>
<ol>
<li><strong>内存层级中的延迟差距</strong>：直接附加的 DRAM 和固态硬盘（SSD）存储之间存在三个数量级的延迟差距。当处理器耗尽直接附加内存的容量时，必须依赖 SSD，导致处理器等待时间（延迟）增加，显著影响计算性能。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-001-bc9a66aa73bf.webp" alt="" /></li>
</ol>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-002-e0b9ac6a3a36.webp" alt="" /></p>
<ol start="2">
<li>
<p><strong>多核处理器核心数增长与内存带宽不匹配</strong>：多核处理器的核心数增长速度远超主内存通道的扩展速度。超过一定数量的核心会因内存带宽不足而无法充分利用，导致添加更多核心的收益递减。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-003-8c72b342d3bf.webp" alt="acd63ba9541b4e7b960c681d5d1ddca5.webp" /></p>
</li>
<li>
<p><strong>加速计算中的内存资源浪费</strong>：随着加速计算的普及，加速器（如GPU、FPGA）通常配备自己的直接附加内存，导致内存资源未被充分利用或闲置（孤立内存），造成资源浪费。</p>
</li>
</ol>
<p><strong>所以，我们需要一个协议，把所有的内存统一起来，这样，他们的速度虽然比直接访问DRAM内存慢，但是比传统的固态SDD快。</strong></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-004-ccb9b6bc59d8.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-005-455afee3e6f4.webp" alt="7cc9c629b3154c0ba336ca7d3f645898.webp" /></p>
<p>CXL technology offers a novel approach to addressing the memory challenges in data centers. By utilizing CXL memory, a new layer of memory is created between DRAM and SSD, bridging the significant gap in bandwidth and latency. This effectively unleashes the potential of multi core processors by providing them with more efficient access to memory resources.</p>
<p>Compute Express Link (CXL) 就是一种开放行业标准互连技术，旨在提供主机处理器与加速器、内存缓冲器和智能 I/O 设备之间的高带宽、低延迟连接。</p>
<p>CXL technology offers a novel approach to addressing the memory challenges in data centers. By utilizing CXL memory, a new layer of memory is created between DRAM and SSD, bridging the significant gap in bandwidth and latency. This effectively unleashes the potential of multi core processors by providing them with more efficient access to memory resources.</p>
<h2><strong>CXL技术发展历史</strong></h2>
<ul>
<li><strong>发展历程</strong>：CXL 自 2019 年推出以来，经历了 1.0、2.0 和 3.0 三个主要版本迭代。2022 年，英特尔发布支持 CXL 的第四代 Xeon CPU，三星和 SK 海力士推出 CXL 内存原型产品，推动了其应用发展。</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-006-5db4c5b1e748.webp" alt="36eb172a1efa4d86aca662274fb6e0bc.webp" /></p>
<p>CXL1.0/1.1 可归纳为“直连”，也就是让主机CPU可以直接访问PCIe设备的内存，具体分为三个子协议：CXL.io用于设备注册发现、CXL.cache用于设备访问CPU内存、CXL.mem 用于CPU访问设备内存。这可达到主机内存扩充的目的。</p>
<p>CXL2.0 可归纳为“池化”，就是让多个主机CPU和多个设备可通过一个CXL Switch硬件连接在一起，可以相互访问，在较小延迟影响的前提下提供高容量大带宽。这可达到内存池化的目的。</p>
<p>CXL3.0 可归纳为Fabric，可以让多个Switch形成级联结构，支持更复杂的结构。这可以达到“软件定义内存”的目的，此处借用了“软件定义网络”的概念</p>
<ul>
<li><strong>主要特点</strong>：
<ul>
<li><strong>高带宽、低延迟</strong>：CXL 提供比传统 RDMA（远程直接内存访问）更高的带宽和更低的延迟，适用于大数据和 AI 模型等高内存需求场景。</li>
<li><strong>内存扩展与池化</strong>：支持内存容量扩展和内存池化架构，提升数据中心资源利用率。</li>
<li><strong>缓存一致性</strong>：CXL 3.0/3.1 支持内存共享，硬件自动管理多节点间的缓存一致性，简化分布式共享内存（DSM）架构。</li>
</ul></li>
</ul>
<h2><strong>CXL 内存的应用形式</strong></h2>
<p>文中介绍了 CXL 内存的两种主要产品形式：</p>
<ul>
<li>
<p><strong>内存扩展（Memory Expansion）</strong>：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-007-93a2054eb609.webp" alt="" /></p>
<ul>
<li><strong>架构</strong>：通过 CXL.io 协议进行设备发现和初始化，通过 CXL.mem 协议处理内存读写请求。支持 E3.S 和 EDSFF 规范的内存扩展模块。</li>
<li><strong>应用</strong>：在单一计算节点内扩展内存容量，满足大规模数据处理和复杂计算任务需求（如大型 AI 模型和高性能计算）。</li>
<li><strong>虚拟化支持</strong>：QEMU/KVM 支持将 CXL 内存分配给虚拟机，作为独立 NUMA 节点，与本地内存统一寻址，但需智能调度热/冷数据以优化性能。</li>
</ul>
</li>
<li>
<p><strong>内存池化（Memory Pooling）</strong>：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-008-b52dfe8c466a.webp" alt="" /></p>
<ul>
<li><strong>架构</strong>：通过 CXL 交换机连接多个主机（Root Ports），支持多逻辑设备（MLD）或单逻辑设备的内存池化。</li>
<li><strong>优势</strong>：集中管理多个节点的内存资源，实现动态分配和优化利用，降低延迟，提升系统可扩展性和灵活性。</li>
<li><strong>实例</strong>：2023 年 Flash Memory Summit 上，三星、MemVerge 和 H3 展示了 2TB 池化 CXL 内存系统，支持 8 个主机按需使用内存，并配备可视化、分层和动态分配软件。</li>
</ul>
</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-009-eb2622afcd05.webp" alt="v2-27d93ed14b6b7f122b0f2efe80c56484_r.jpg" /></p>
<p>在图示的例子中，D1的所有内存都被分配给了H1；D2一部分内存被分给了H1，一部分给了H3。假设过了一段时间，H3可以通过HOT Remove释放一些内存，释放的内存可以通过HOT Add给到H1。MLD的分配颗粒度更小，更加灵活。需要注意的是，MLD的LD设备2.0定义，最多只能16个。</p>
<p>MLD的精细颗粒度调度给云服务器典型应用提供了极大的灵活性，VMM可以根据调度VM的使用情况，灵活调度资源，达到按需分配的目标。MLD虽好，但并不是所有CXL设备都可以做成MLD。因为显而易见的原因，只有Type 3这种纯内存扩展才能是MLD，而GPGPU和DPU等等加速器只能SLD。</p>
<h2><strong>CXL 的应用</strong></h2>
<p>目前看来全新的机会包括，1）系统层的内存管理软件，以及2）应用层内存即服务，其余的均为现有系统的优化增强。</p>
<p><strong>系统层的内存管理软件</strong>
先从系统软件层面看，由于CXL需要支持这么复杂内存共享结构，必须有一套新软件支撑，包括三个机会：</p>
<ol>
<li>内存调度管理器；</li>
<li>内存高级数据特性，包括内存压缩、快照、克隆、备份等；</li>
<li>内存安全防护；</li>
</ol>
<p>CXL 内存在带宽和延迟上优于 RDMA，但与本地内存仍有差距，需通过智能调度和优化弥补。不同比例的DDR+CXL效果不一样:
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-010-aaf1bf25c471.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-011-0f14ca18e9c0.webp" alt="" /></p>
<p>不同的拓扑也有调度的优化空间.</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-012-879c00c02227.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-013-9bce69a92c49.webp" alt="" /></p>
<p><strong>应用层内存即服务</strong>
池化内存容量大、粒度细、分配灵活，直接衍生出“内存即服务”模式，这个是利好云厂商的。</p>
<p>云厂商卖内存通常有以下痛点：</p>
<ol>
<li>内存必须绑定计算实例售卖</li>
<li>内存售卖粒度较粗</li>
<li>内存无法超卖</li>
<li>售卖的内存大部分闲置，内存利用率低</li>
</ol>
<p>在内存池化场景下，云厂商可以提供内存PaaS API服务，只卖内存给应用；也可以细粒度按需分配，收费更灵活，同时可以超卖内存，并将平常闲置的内存进行更高效的利用。</p>
<p>也可以用来加速LLM</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-014-dc4c3ba24d32.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-05/cxl-tech/body-015-10393a678601.webp" alt="" />
<a href="https://dl.acm.org/doi/10.1109/SC41406.2024.00100">Efficient Tensor Offloading for Large Deep-Learning Model Training based on Compute Express Link | Proceedings of the International Conference for High Performance Computing, Networking, Storage, and Analysis</a></p>
<p>调查发现，在微软Azure，有高达25%的内存都是闲置的，有50%的虚拟机使用的内存占比仅为50%。谷歌也类似，谷歌服务器集群中DRAM内存平均利用率约为40%，这将是巨大的机会</p>
<ul>
<li><strong>实例</strong>：阿里巴巴云于 2023 年推出 10TB CXL 内存池化产品，Pond 计划在 Microsoft Azure 上部署 CXL 内存池。</li>
</ul>
<h2><strong>挑战与发展趋势</strong></h2>
<ul>
<li><strong>挑战</strong>：
<ul>
<li><strong>生态兼容性</strong>：需与现有硬件（处理器、操作系统）和软件（虚拟化、API）无缝集成。</li>
<li><strong>资源管理</strong>：高并发场景下，需智能调度热/冷数据以缩小与本地内存的性能差距。</li>
<li><strong>数据一致性</strong>：多节点共享环境中，需新协议和算法确保数据一致性和高效同步。</li>
</ul></li>
<li>
<p><strong>发展趋势</strong>：</p>
<ul>
<li><strong>标准化与优化</strong>：随着云计算需求增长，CXL 硬件和软件将向标准化和性能优化方向发展。</li>
<li><strong>计算-存储分离架构</strong>：基于 CXL 的解耦架构逐渐被行业认可，市场成熟度提升。</li>
<li><strong>广泛采用</strong>：通过技术创新和生态发展，CXL 内存有望成为云计算和数据中心的关键技术，提升性能和效率。</li>
</ul>
<p><strong>总结</strong>
CXL 技术通过高带宽、低延迟的互连，解决了数据中心内存容量和访问效率的瓶颈，支持内存扩展和池化，适用于大数据、AI 模型和高性能计算场景。尽管性能仍需优化，但其在分布式共享内存和计算-存储分离架构中的潜力使其成为未来云计算的重要技术方向。</p>
</li>
</ul>
<h2>参考</h2>
<p>CXL 2.0会极大地改变服务器业态 <a href="https://zhuanlan.zhihu.com/p/526411925">https://zhuanlan.zhihu.com/p/526411925</a>
CXL是什么，有什么新的机会 <a href="https://developer.aliyun.com/article/1117134">https://developer.aliyun.com/article/1117134</a>
CXL的实际应用的想法 <a href="https://zhuanlan.zhihu.com/p/553321200">https://zhuanlan.zhihu.com/p/553321200</a>
CXL协议记录 <a href="https://zhuanlan.zhihu.com/p/426525531">https://zhuanlan.zhihu.com/p/426525531</a></p>
<p>X. Lin, J. Peng, R. Liu and X. Gao, &quot;Research on the CXL Memory,&quot; 2024 IEEE 6th Advanced Information Management, Communicates, Electronic and Automation Control Conference (IMCEC), Chongqing, China, 2024, pp. 1428-1432, doi: 10.1109/IMCEC59810.2024.10575852. </p>
<p>Jianbo Wu, Jie Liu, Gokcen Kestor, Roberto Gioiosa, Dong Li, and Andres Marquez. 2024. Performance Study of CXL Memory Topology. In Proceedings of the International Symposium on Memory Systems (MEMSYS '24). Association for Computing Machinery, New York, NY, USA, 172–177. <a href="https://doi.org/10.1145/3695794.3695809">https://doi.org/10.1145/3695794.3695809</a></p>
<p>Architectural and System Implications of CXL-enabled Tiered Memory <a href="https://arxiv.org/abs/2503.17864#:~:text=In%20this%20paper%2C%20we%20investigate%20the%20architectural%20implications,processor%20designs%20optimized%20for%20%28relatively%29%20uniform%20memory%20latency.">[2503.17864] Architectural and System Implications of CXL-enabled Tiered Memory</a></p>
<p>Efficient Tensor Offloading for Large Deep-Learning Model Training based on Compute Express
<a href="https://dl.acm.org/doi/10.1109/SC41406.2024.00100">Efficient Tensor Offloading for Large Deep-Learning Model Training based on Compute Express Link | Proceedings of the International Conference for High Performance Computing, Networking, Storage, and Analysis</a></p>
