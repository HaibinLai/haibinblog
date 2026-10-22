---
title: "ICPP24 Grace Hopper GPU中的系统内存管理"
description: "文章链接： Harnessing Integrated CPU-GPU System Memory for HPC: a first look into Grace Hopper NVIDIA Grace Hopper 与 NVLink Fusion 架构对异构并行计算优化的影响 - William的文章 - 知乎 https://zhuanlan.zhihu.com/p/1911971133923754274 Grace Hoppe…"
publishedAt: "2025-08-30T04:15:43Z"
updatedAt: "2025-08-30T04:27:58Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["GH200", "GPU", "ICPP", "异构计算"]
author: "GB"
draft: false
slug: "icpp24-grace-hopper-gpu中的系统内存管理"
legacySlug: "icpp24-grace-hopper-gpu中的系统内存管理"
oldSlugs: []
wordpressId: 965
sourceUrl: "https://www.haibinlaiblog.top/index.php/icpp24-grace-hopper-gpu%e4%b8%ad%e7%9a%84%e7%b3%bb%e7%bb%9f%e5%86%85%e5%ad%98%e7%ae%a1%e7%90%86/"
commentCount: 0
viewCount: 1849
likeCount: 2
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/icpp24-grace-hopper-gpu%E4%B8%AD%E7%9A%84%E7%B3%BB%E7%BB%9F%E5%86%85%E5%AD%98%E7%AE%A1%E7%90%86.webp"
---
<p>文章链接：<a href="https://dl.acm.org/doi/pdf/10.1145/3673038.3673110">Harnessing Integrated CPU-GPU System Memory for HPC: a first look into Grace Hopper</a>
NVIDIA Grace Hopper 与 NVLink Fusion 架构对异构并行计算优化的影响 - William的文章 - 知乎
<a href="https://zhuanlan.zhihu.com/p/1911971133923754274">https://zhuanlan.zhihu.com/p/1911971133923754274</a></p>
<p>Grace Hopper Superchip 通过 NVLink Chip-to-Chip (C2C) 互连技术，将专为 AI 和 HPC 优化的 Grace CPU 与强大的 Hopper GPU 紧密集成，实现了高带宽、低延迟的缓存一致性内存共享。这种设计显著缓解了传统 PCIe 总线带来的数据传输限制，简化了编程模型，并提高了整体系统效率。凭借 NVLink-C2C 和一致性统一内存 ，传统意义上关于“CPU 数据”和“GPU 数据”的严格区分变得模糊。对于异构系统而言，“数据局部性”的含义也因此被重新定义。它不再仅仅关乎数据存储在哪块物理内存中，而更多地关乎数据在被任一处理器需要时是否能够被高效访问。高带宽使得 CPU 内存对于许多工作负载而言，成为了 GPU 内存的一个可行扩展。<strong>在这种架构中，CPU 与 GPU 共享一个统一的虚拟内存空间（即系统内存），而地址翻译由硬件加速完成，无需显式数据拷贝。</strong></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829230456625.png" alt="" /></p>
<h2>Harnessing Integrated CPU-GPU System Memory for HPC: a first look into Grace Hopper</h2>
<p>这篇文章是对NVIDIA Grace Hopper Superchip（一个集成了ARM CPU和H100 GPU的系统）的首次深入研究，重点探讨其集成CPU-GPU系统内存管理在高性能计算（HPC）中的应用。该系统通过硬件加速的统一内存解决方案（如缓存一致的NVLink-C2C互连和共享系统页表）来解决传统CPU-GPU内存管理的局限性，例如显式数据拷贝、统一虚拟内存（UVM）的页故障开销和迁移瓶颈。</p>
<h3>主要内容和方法</h3>
<ul>
<li><strong>背景介绍</strong>：解释了Grace Hopper的内存子系统，包括两级内存架构（CPU的480GB LPDDR5X和GPU的96GB HBM3）、NVLink-C2C互连的缓存一致性和地址翻译服务（ATS）。比较了系统分配内存（使用malloc()等标准API，依赖单一系统页表）和CUDA managed内存（使用cudaMallocManaged()，依赖CPU和GPU的双页表）。</li>
<li><strong>实验设置</strong>：在Grace Hopper平台上测试六个代表性HPC应用，包括Qiskit量子体积模拟器（处理30-34量子比特）、Rodinia基准套件的五个应用（needle、pathfinder、bfs、hotspot、srad）。这些应用覆盖规则、不规则和混合访问模式。作者开发了内存剖析工具，并使用NVIDIA工具（如Nsight Systems和Nsight Compute）监控内存利用、页故障和迁移。</li>
<li><strong>关键分析</strong>：
<ul>
<li><strong>集成页表的影响</strong>：研究第一触碰策略（first-touch policy）、页表条目初始化、系统页大小（4KB vs 64KB）和页迁移机制。</li>
<li><strong>性能比较</strong>：在内存内和内存超订阅场景下，比较系统分配内存、CUDA managed内存与传统显式拷贝版本。系统分配内存在大多数情况下表现更好，尤其是CPU初始化数据的情景，因为它避免了昂贵的页故障处理，转而使用缓存线级远程访问。</li>
<li><strong>页迁移评估</strong>：对比系统内存的自动访问计数器迁移（基于硬件计数器）和managed内存的按需迁移。针对迭代访问模式的应用（如SRAD），自动迁移可优化性能。</li>
</ul></li>
<li><strong>发现与优化</strong>：
<ul>
<li>系统分配内存适用于大多数用例，需要最小移植努力，但对GPU侧初始化敏感（页表初始化开销大）。</li>
<li>增加系统页大小（到64KB）可显著降低初始化和迁移开销，尤其在量子模拟中（ speedup达4x）。</li>
<li>识别优化策略，如预填充页表（使用cudaHostRegister或人工循环）、调整迁移阈值和预取（cudaMemPrefetchAsync）。</li>
<li>结果显示，系统分配内存在避免读/写放大和简化内存管理方面优于managed内存，尤其在超订阅场景。</li>
</ul></li>
</ul>
<h2>研究背景</h2>
<p>好的，我来给你简单介绍一下 <strong>统一虚拟内存（UVM）</strong> 和 <strong>数据对象卸载</strong>：</p>
<h3>统一虚拟内存（UVM, Unified Virtual Memory）</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829102746813.png" alt="" />
<a href="https://arxiv.org/pdf/2411.05309v1#:~:text=To%20ease%20programma-bility%2C%20programming%20abstractions%20such%20as%20unified,the%20data%20on%20demand%20as%20it%20is%20accessed.">https://arxiv.org/pdf/2411.05309v1</a></p>
<ul>
<li><strong>概念</strong>：由 NVIDIA 等提出的一种软硬件协同机制，把 <strong>CPU 内存和 GPU 内存抽象成一个统一的地址空间</strong>。</li>
<li><strong>作用</strong>：应用程序可以像在单一内存里一样访问数据，而不需要显式调用 <code>cudaMemcpy</code> 之类的拷贝接口。</li>
<li><strong>优点</strong>：
<ol>
<li>编程模型简化，开发者不必手动管理 CPU-GPU 数据传输。</li>
<li>透明的内存迁移，程序访问时自动触发数据搬运。</li>
</ol></li>
<li><strong>缺点</strong>：
<ul>
<li>遇到 GPU 缺页时，<strong>页面迁移开销很大</strong>；</li>
<li>页粒度管理导致 <strong>读写放大</strong>；</li>
<li>数据频繁往返 CPU 与 GPU，会受限于 <strong>带宽与延迟瓶颈</strong>。</li>
</ul></li>
</ul>
<h3>数据对象卸载（Data Object Offloading），来自 ZeRO-Offload</h3>
<ul>
<li><strong>概念</strong>：通过分析应用，将部分大对象（如模型参数、稀疏矩阵、模拟数据块）放到 <strong>CPU 内存</strong>，只在需要时拷贝到 GPU。
简而言之，ZeRO‑Offload 将以下内容卸载至 CPU：</li>
<li><strong>梯度（Gradients）</strong></li>
<li><strong>优化器状态（Optimizer States）</strong></li>
<li><strong>优化器计算（Optimizer Computation）</strong></li>
</ul>
<p>而保留在 GPU 上的是：</p>
<ul>
<li><strong>模型参数</strong></li>
<li><strong>前向和反向传播计算</strong></li>
</ul>
<p>这样的划分基于最优策略，能够在最大限度节省 GPU 内存的同时，控制 CPU 计算与通信开销，使整体训练效率不下降。</p>
<h3>两种方法总结</h3>
<table>
<thead>
<tr>
<th>特性</th>
<th>【自动挡】OpenVM（UVM）</th>
<th>【手动挡】数据对象卸载（ZeRO-Offload）</th>
</tr>
</thead>
<tbody>
<tr>
<td>卸载对象</td>
<td>基于页级别的 CPU–GPU 统一虚拟内存</td>
<td>梯度、优化器状态与计算，从 GPU 卸载至 CPU</td>
</tr>
<tr>
<td>编程难度</td>
<td>自动，不需改代码</td>
<td>仅需修改 DeepSpeed 配置，模型无需重构</td>
</tr>
<tr>
<td>性能方式</td>
<td>页迁移与交换，存在开销与读写放大问题</td>
<td>优化通信和计算，尽量减少 CPU–GPU 数据移动</td>
</tr>
<tr>
<td>内存提升能力</td>
<td>有限</td>
<td>单 GPU 支持训练模型规模提升约 10 倍，支持数十亿参数</td>
</tr>
<tr>
<td>可扩展性</td>
<td>一般有限</td>
<td>支持线性扩展至多 GPU，多 GPU 联合训练规模提升明显</td>
</tr>
</tbody>
</table>
<p>尽管这些方案各有优点，<strong>但也存在一些会影响性能和易用性的局限性</strong>。<br />
例如，UVM 在 GPU 中处理缺页时会产生较大的开销，并且由于基于页的交换机制，还会导致读写放大问题。<br />
数据对象卸载则需要离线分析和应用重构，从而限制了方案的通用性。<br />
此外，这两种方案的性能都受到 CPU 与 GPU 之间数据传输瓶颈的制约，因为通信延迟和带宽限制会阻碍整体执行速度。</p>
<h2>本文贡献</h2>
<p>英伟达 <strong>Grace Hopper Superchip</strong> 的推出为解决现有方案的局限性带来了新的机遇。
该系统通过 <strong>缓存一致性互联（NVLink-C2C, chip-to-chip）</strong> 将一颗 ARM CPU 与一颗 Nvidia H100 GPU 连接在一起。在这种架构中，CPU 与 GPU 共享一个统一的虚拟内存空间（即系统内存），而地址翻译由硬件加速完成，无需显式数据拷贝。</p>
<p>这种设计使应用开发者能够在 <strong>透明的统一内存模型</strong> 下管理 CPU 与 GPU 内存，而数据传输则由硬件负责，分为两个层次：</p>
<ol>
<li><strong>缓存行粒度的直接远程访问</strong>；</li>
<li><strong>启发式驱动的页迁移</strong>。</li>
</ol>
<p>通过引入 <strong>缓存行级别访问</strong> 和 <strong>地址转换服务（ATS）</strong>（允许对 CPU 和 GPU 所有内存分配进行完全访问），系统内存消除了传统 UVM 中的缺页处理开销，并显著减少了内存迁移的需求。与 UVM 将虚拟内存空间拆分为系统页表与 GPU 页表不同，系统内存采用 <strong>单一的系统级页表</strong>，由 CPU 与 GPU 共享。</p>
<p>目前对 Grace Hopper 上这种 <strong>CPU–GPU 一致性系统内存</strong> 的研究仍然有限，尤其在 <strong>内存分配策略、内存管理机制以及页迁移开销</strong> 等方面的理解不足。而这些因素对开发者和研究人员来说至关重要，因为它们决定了如何充分利用这一首个 <strong>硬件加速的统一内存系统</strong>。</p>
<p>因此，本文旨在填补这一空白，通过对比 <strong>系统内存</strong> 与现有 <strong>托管内存（managed memory, UVM）</strong> 的表现，评估其在六个代表性 HPC 应用中的性能影响。这些应用包括前沿的 Qiskit 量子计算机模拟器、<strong>图计算应用</strong>和科学计算应用，从而为未来 CPU-GPU 平台上的统一内存优化提供参考。</p>
<h2>Grace Hopper Superchip 的内存子系统</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829114739912.png" alt="" /></p>
<p>我们介绍 <strong>Grace Hopper Superchip 的内存子系统</strong>，重点关注在单一共享 CPU–GPU 内存域内的硬件与操作系统（OS）层面的内存管理。我们进一步讨论该内存系统如何通过两种统一内存管理方案暴露给程序员：<strong>系统分配内存（system-allocated memory）</strong> 和 <strong>CUDA 托管内存（CUDA managed memory）</strong>。</p>
<p>Grace Hopper 系统采用 <strong>两层内存架构</strong>，CPU 与 GPU 各自配备独立的物理内存：</p>
<ul>
<li><strong>Grace CPU</strong>：连接 <strong>480 GB LPDDR5X 内存</strong>；</li>
<li><strong>Hopper GPU</strong>：配备 <strong>96 GB HBM3 内存</strong>；
二者通过 <strong>Nvidia NVLink-C2C 互联</strong>相连。CPU到GPU的连接带宽由传统PCIE GEN5 128GB/s带宽升级为C2C link带来的<strong>900GB/s</strong>，提升<strong>7</strong>倍。</li>
</ul>
<p>该双层内存系统以 <strong>两个非一致内存访问（NUMA）节点</strong> 的形式对外呈现，使 CPU 与 GPU 可以无缝访问彼此的内存。</p>
<h3>2.1.2 系统级地址转换</h3>
<p>在 Grace Hopper 内存系统中，Grace CPU 包含一个特殊的硬件单元 —— <strong>系统内存管理单元（SMMU）</strong> [21]，其定义来源于 Arm 的 <strong>SMMUv3 规范</strong>。SMMU 负责通过执行页表遍历，将虚拟地址转换为物理地址。与传统 MMU 相比，SMMU 额外支持来自 GPU 的虚拟到物理地址转换请求。</p>
<p>图 1 展示了 Grace Hopper 系统中一次虚拟地址访问的工作流程（假设该虚拟–物理映射已缓存于 GPU TLB 中，且数据驻留于 CPU 内存）：</p>
<ol>
<li>GPU 线程访问某个虚拟地址；</li>
<li>该数据未命中 GPU 的缓存层级，产生一次缓存未命中；</li>
<li>GPU TLB 中查找虚拟–物理地址映射，由于已缓存，直接命中；</li>
<li>GMMU 通过 NVLink-C2C 互联发起 <strong>DMA（直接内存访问）</strong>，以缓存行粒度进行传输；</li>
<li>数据从 CPU 内存中读取并返回 GPU；</li>
<li>访问完成，数据被缓存到 GPU 的常规缓存层级中。</li>
</ol>
<p>与 Grace Hopper 之前的系统（依赖 GPU 缺页处理来访问 CPU 内存）相比，这种新方法有两个主要改进：</p>
<ul>
<li><strong>第一</strong>，GPU 访问 CPU 内存时不再总是触发 GPU 缺页；</li>
<li><strong>第二</strong>，缺页由 <strong>SMMU</strong> 生成，并可直接由操作系统的缺页处理机制处理，从而简化了整体流程。</li>
</ul>
<table>
<thead>
<tr>
<th><strong>特性</strong></th>
<th><strong>传统 UVM</strong></th>
<th><strong>Grace Hopper 系统分配内存</strong></th>
<th><strong>Grace Hopper CUDA 管理内存</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>MMU 数量</strong></td>
<td>两个（CPU MMU 和 GPU GMMU）</td>
<td>主要依赖 SMMU，GMMU 辅助（仅处理 TLB）</td>
<td>两个（SMMU 和 GMMU），但 SMMU 更主导</td>
</tr>
<tr>
<td><strong>页表</strong></td>
<td>双页表（CPU 系统页表 + GPU 专属页表，2MB）</td>
<td>单一系统页表（4KB 或 64KB）</td>
<td>双页表（系统页表 + GPU 专属页表，2MB）</td>
</tr>
<tr>
<td><strong>页故障处理</strong></td>
<td>GPU 页故障由 CUDA 驱动和 OS 协作处理，软件开销高</td>
<td>SMMU 和 OS 直接处理，GPU 无传统页故障</td>
<td>GPU 页故障仍由 CUDA 驱动处理，但 ATS 优化翻译</td>
</tr>
<tr>
<td><strong>数据访问</strong></td>
<td>通过 PCIe 传输，需页面迁移，带宽低（~32GB/s）</td>
<td>NVLink-C2C 直接访问（缓存线粒度，~375GB/s），无需强制迁移</td>
<td>NVLink-C2C 支持直接访问，页面迁移仍需 CUDA 驱动</td>
</tr>
<tr>
<td><strong>页面迁移</strong></td>
<td>按需迁移（on-demand），依赖 CUDA 驱动，软件干预多</td>
<td>自动访问计数器迁移，硬件驱动，透明高效</td>
<td>按需迁移 + 预取（显式/隐式），部分依赖 CUDA 驱动</td>
</tr>
<tr>
<td><strong>缓存一致性</strong></td>
<td>无硬件级缓存一致性，依赖软件同步</td>
<td>NVLink-C2C 提供硬件级缓存一致性</td>
<td>NVLink-C2C 提供缓存一致性，减少同步开销</td>
</tr>
</tbody>
</table>
<p>因此GH200这里省去了OS层的开销，并对内存拷贝、一致性进行了优化。</p>
<h3>2.1.3 Grace Hopper 的内存管理</h3>
<p>Grace Hopper 系统使用 <strong>两张不同的页表</strong>：</p>
<ol>
<li>
<p><strong>系统级页表（System-wide Page Table）</strong></p>
<ul>
<li>位于 CPU 内存，由操作系统直接管理；</li>
<li>OS 创建并维护页表项（PTE）；</li>
<li>SMMU 使用该页表，为 CPU（当用户应用需要时）和 GPU（通过 NVLink-C2C 请求时）提供虚拟–物理地址转换；</li>
<li>页框可物理驻留在 CPU 或 GPU 内存中；</li>
<li>页大小由操作系统层定义，并受 CPU 架构限制（Grace CPU 下为 4 KB 或 64 KB）。</li>
</ul>
</li>
<li>
<p><strong>GPU 独占页表（GPU-exclusive Page Table）</strong></p>
<ul>
<li>从前代 GPU 沿用，位于 GPU 内存，仅 GPU 可访问；</li>
<li>存储 <code>cudaMalloc</code> 分配的内存，以及当物理数据驻留在 GPU 内存时的 <code>cudaMallocManaged</code> 分配；</li>
<li>页大小为 2 MB。</li>
</ul>
</li>
</ol>
<p>因此，CPU MMU是主管，GPU MMU只管GPU，然后GPU MMU干不了时，就叫CPU MMU来干。</p>
<p>在本文中，我们重点研究那些数据既可以驻留在 CPU 也可以驻留在 GPU 内存中的分配方式，即 <strong>系统分配内存（system-allocated memory）</strong> 和 <strong>CUDA 托管内存（CUDA managed memory）</strong>。</p>
<h3>性能评估</h3>
<p>我们通过基准测试评估该内存架构的性能：</p>
<ul>
<li>使用 <strong>STREAM benchmark</strong> 测得内存带宽：
<ul>
<li>GPU HBM3 内存：<strong>3.4 TB/s</strong>（理论峰值 4 TB/s）；</li>
<li>CPU LPDDR5X 内存：<strong>486 GB/s</strong>（理论峰值 500 GB/s）[20]。</li>
</ul></li>
<li>使用 <strong>Comm|Scope benchmark [23]</strong> 测得 NVLink-C2C 互联性能：
<ul>
<li>主机到设备（H2D）：<strong>375 GB/s</strong>；</li>
<li>设备到主机（D2H）：<strong>297 GB/s</strong>；</li>
<li>理论带宽：450 GB/s。</li>
</ul></li>
</ul>
<h3>2.1.1 NVLink-C2C 互联</h3>
<p>在 Grace Hopper 系统中，CPU 或 GPU 可以通过 NVLink-C2C 直接访问对方的物理内存：</p>
<ul>
<li><strong>缓存行粒度传输</strong>：CPU 端最小 64B，GPU 端最小 128B；</li>
<li><strong>透明缓存</strong>：访问的数据会被透明地缓存到两处理器的缓存层级中（如图 1 所示）；</li>
<li><strong>缓存一致性</strong>：CPU 与 GPU 的缓存保持完全一致；</li>
<li><strong>支持原子操作</strong>：允许跨处理器原子读写与修改物理内存位置；</li>
<li><strong>协议</strong>：基于 Arm 的 AMBA CHI 协议实现，硬件级支持，用户无需干预。</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829230436760.png" alt="" /></p>
<p>✅ 总结：
Grace Hopper 内存系统通过 <strong>NVLink-C2C 互联</strong>、<strong>SMMU 支持的系统级页表</strong> 以及 <strong>硬件加速的虚拟–物理地址转换</strong>，实现了统一的 CPU–GPU 内存域。相比传统的托管内存（UVM），该方案减少了 GPU page fault 处理开销，并支持缓存行粒度的透明远程访问，大幅优化了 CPU–GPU 协同内存管理的效率。</p>
<h3>System-Allocated Memory</h3>
<ol>
<li>
<p><strong>系统分配内存的基本概念</strong>
使用标准<code>malloc()</code>分配内存，依赖系统页表；延迟物理内存映射，支持超订阅；采用第一触碰策略，首次访问触发页故障并映射物理页。</p>
<ol start="2">
<li>
<p><strong>GPU访问流程</strong>
GPU首次访问触发TLB未命中，ATS-TBU发送翻译请求至SMMU；SMMU处理页表遍历和故障，更新页表指向GPU内存；后续通过NVLink-C2C直接DMA访问。</p>
</li>
<li>
<p><strong>自动访问计数器迁移</strong>
硬件计数器跟踪GPU访问次数；超过阈值（默认256）触发中断；驱动程序决定迁移页面至GPU内存，优化高频访问性能，透明执行。</p>
</li>
</ol>
</li>
</ol>
<h3>2.3 CUDA Managed Memory</h3>
<ol>
<li>
<p><strong>基本概念</strong>
通过 <code>cudaMallocManaged()</code> 分配内存，提供 CPU-GPU 共享虚拟地址空间，依赖 CUDA 运行时和双页表（CPU 系统页表和 GPU 2MB 页表），首次访问触发物理内存映射。</p>
</li>
<li>
<p><strong>按需页面迁移</strong>
GPU 访问未驻留页面触发页故障，页面从 CPU 迁移到 GPU（或反向），ATS 提供硬件级地址翻译，降低开销。</p>
</li>
<li>
<p><strong>推测性预取</strong>
通过显式（<code>cudaMemPrefetchAsync</code>）或隐式（GPU 预取器）方式预迁移页面，减少页故障开销，尽管 Grace Hopper 的直接访问能力可能降低其必要性。</p>
</li>
</ol>
<h3>两种分配方式总结</h3>
<table>
<thead>
<tr>
<th><strong>特性</strong></th>
<th><strong>cudaMalloc</strong></th>
<th><strong>malloc</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>分配位置</strong></td>
<td>GPU 物理内存（HBM3，96GB）</td>
<td>CPU（LPDDR5X，480GB）或 GPU 物理内存，取决于首次触碰</td>
</tr>
<tr>
<td><strong>页表</strong></td>
<td>GPU 专属页表（2MB 页面）</td>
<td>系统级页表（4KB 或 64KB 页面，由 OS 定义）</td>
</tr>
<tr>
<td><strong>管理方式</strong></td>
<td>CUDA 运行时和 GPU 驱动管理</td>
<td>操作系统管理，依赖 SMMU 进行地址翻译</td>
</tr>
<tr>
<td><strong>数据访问</strong></td>
<td>仅 GPU 直接访问，CPU 需显式 <code>cudaMemcpy</code></td>
<td><strong>CPU 和 GPU 共享虚拟地址，GPU 可通过 NVLink-C2C 直接访问 CPU 内存</strong></td>
</tr>
<tr>
<td><strong>页故障</strong></td>
<td>无页故障，内存直接分配在 GPU</td>
<td>首次触碰触发页故障，由 OS 和 SMMU 处理，映射至 CPU 或 GPU 内存</td>
</tr>
<tr>
<td><strong>NVLink-C2C 交互</strong></td>
<td>用于显式数据传输（H2D 375GB/s，D2H 297GB/s），不利用缓存一致性</td>
<td>利用缓存一致性，GPU 以缓存线粒度（CPU 64B，GPU 128B）直接访问 CPU 内存</td>
</tr>
<tr>
<td><strong>页面迁移</strong></td>
<td>无自动迁移，需显式管理数据移动</td>
<td>自动访问计数器迁移（默认阈值 256 次），高频页面从 CPU 迁移至 GPU</td>
</tr>
<tr>
<td><strong>性能特点</strong></td>
<td>GPU 内存访问高效（HBM3 带宽 3.4TB/s），但数据拷贝增加开销</td>
<td>适合超订阅场景，减少页故障和拷贝开销，初始化敏感（GPU 侧较慢）</td>
</tr>
<tr>
<td><strong>适用场景</strong></td>
<td>GPU 密集型、小数据集、传统 CUDA 应用</td>
<td>HPC 应用、大数据集、需最小移植努力的 CPU-GPU 协同任务</td>
</tr>
<tr>
<td><strong>局限性</strong></td>
<td>内存容量受限（96GB），显式管理复杂</td>
<td>GPU 侧初始化可能因页表更新导致延迟，需优化（如预填充页表）</td>
</tr>
</tbody>
</table>
<h2>总结</h2>
<p>这篇文章的核心内容是对 NVIDIA Grace Hopper Superchip 的 CPU-GPU 集成内存管理机制的首次深入研究，重点探讨其统一内存系统在高性能计算（HPC）中的表现。文章详细分析了两种内存管理方式：系统分配内存（System-Allocated Memory，基于 malloc() 和单一系统页表）和 CUDA 管理内存（CUDA Managed Memory，基于 cudaMallocManaged() 和双页表）。通过六个代表性 HPC 应用（包括 Qiskit 量子模拟器和 Rodinia 基准套件），作者研究了内存分配、页面迁移、首次触碰策略和页面大小对性能的影响，揭示了 Grace Hopper 的硬件特性（如 NVLink-C2C 缓存一致互连和 SMMU 地址翻译）如何减少页故障开销、优化数据访问。实验表明，系统分配内存在大多数场景下性能优于管理内存，尤其是 CPU 初始化场景，且需最少代码修改，同时提出优化策略如调整页面大小和预取机制以进一步提升性能。</p>
<p>文章剩下部分为详细实验，测量这些优化对性能的影响。</p>
