---
title: "OS Project part I VirtIO, a biref summary"
description: "制作基于VirtIO设备驱动 设备驱动需要做什么？ 设备初始化 从硬件读取数据，将数据传送进内核 读取内核数据，写入硬件 检测和处理设备错误 Intro: 虚拟化 全虚拟化 是指 虚拟化软件 （VMM）遵循硬件的规范，完整模拟硬件逻辑，这种方式对 guest 操作系统是透明的，即 guest 操作系统不需要做任何修改。全虚拟化模拟的设备与硬件设备对于 驱动程序 并无不同。全虚拟化的设备性能较低，因为完全按照硬件的规范来模拟硬件逻辑，这…"
publishedAt: "2024-12-01T11:54:48Z"
updatedAt: "2024-12-04T21:04:57Z"
category: "OS"
categories: ["OS"]
tags: ["CPU", "OS", "System"]
author: "GB"
draft: false
slug: "os-project-part-i-virtio-a-biref-summary"
legacySlug: "os-project-part-i-virtio-a-biref-summary"
oldSlugs: []
wordpressId: 443
sourceUrl: "https://www.haibinlaiblog.top/index.php/os-project-part-i-virtio-a-biref-summary/"
commentCount: 0
viewCount: 2234
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2024/12/微信截图_20241201195421.jpg"
importedFromWordPress: true
---
<h2>制作基于VirtIO设备驱动</h2>
<p>设备驱动需要做什么？</p>
<ol>
<li>设备初始化</li>
<li>从硬件读取数据，将数据传送进内核</li>
<li>读取内核数据，写入硬件</li>
<li>检测和处理设备错误</li>
</ol>
<h2>Intro: 虚拟化</h2>
<ul>
<li><strong>全虚拟化</strong>是指<a href="https://zhida.zhihu.com/search?content_id=230197964&amp;content_type=Article&amp;match_order=1&amp;q=%E8%99%9A%E6%8B%9F%E5%8C%96%E8%BD%AF%E4%BB%B6&amp;zhida_source=entity">虚拟化软件</a>（VMM）遵循硬件的规范，完整模拟硬件逻辑，这种方式对 guest 操作系统是透明的，即 guest 操作系统不需要做任何修改。全虚拟化模拟的设备与硬件设备对于<a href="https://zhida.zhihu.com/search?content_id=230197964&amp;content_type=Article&amp;match_order=1&amp;q=%E9%A9%B1%E5%8A%A8%E7%A8%8B%E5%BA%8F&amp;zhida_source=entity">驱动程序</a>并无不同。全虚拟化的设备性能较低，因为完全按照硬件的规范来模拟硬件逻辑，这样就会导致额外的性能损耗。</li>
<li><strong>半虚拟化</strong>是一种需要需要修改操作系统的虚拟化设备的方式。在虚拟化环境中，操作系统的驱动程序与虚拟设备的交互没必要完全按照硬件设备的规范来实现，<strong>而是可以采用一种更简洁高效的适用于驱动和虚拟设备的交互的协议方式，这种技术就是半虚拟化。Virtio 是一种典型的实现方案，它是基于共享内存的一种<a href="https://zhida.zhihu.com/search?content_id=230197964&amp;content_type=Article&amp;match_order=1&amp;q=%E5%8D%8A%E8%99%9A%E6%8B%9F%E5%8C%96%E6%8A%80%E6%9C%AF&amp;zhida_source=entity">半虚拟化技术</a>，主要思想是将虚拟机的驱动程序和宿主机的模拟设备之间的交互通过共享内存来实现，从而不再使用寄存器等传统的 I/O 方式，</strong> 降低了设备模拟的复杂度，减少了CPU 在 guest 与 host 之间的切换，这样就能够提高虚拟机的 I/O 性能。本文将将详细介绍这种技术。</li>
</ul>
<p>设备的全虚拟化，Guest OS 发出 I/O 请求后，hypervisor 会截获 I/O 请求指令，然后 hypervisor 模拟这些指令的行为。在这种方式下，guest OS 的每个 I/O 请求指令都会造成一次 VMEXIT，这会带来极大的性能开销。</p>
<p>Guest OS 或其中的应用程序通过 virtio 驱动发送 I/O 请求给 virtio 设备，其中 transport 主要用于驱动与设备的通信，基于共享内存实现。这种方式下，多个 I/O 请求才会造成一次 VMEXIT，实现批量 I/O，并且简化了驱动与设备的交互流程，因此性能会有很大提升。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119094319.png" alt="" /></p>
<p>半虚拟化需要将传统的基于物理硬件的 I/O 方式按照 virtio 协议进行改造，这样才能让虚拟机的驱动程序和宿主机的模拟设备进行交互。因此，我们需要了解 I/O 数据在 Linux 存储 I/O 栈中的流动路径，这样才能更好地理解 guest 中的 virtio 驱动如何组织 I/O 请求数据并传递给 virtio 模拟设备，以及模拟设备如何处理数据并通知驱动。</p>
<p>详细例子看 <a href="https://zhuanlan.zhihu.com/p/639301753">Virtio 原理与实现 - 知乎</a> 文件系统</p>
<hr />
<p>前面我们介绍过设备的全虚拟化，Guest OS 发出 I/O 请求后，hypervisor 会截获 I/O 请求指令，然后 hypervisor 模拟这些指令的行为。在这种方式下，guest OS 的每个 I/O 请求指令都会造成一次 VMEXIT，这会带来极大的性能开销。因此，为了提高性能，引入了半虚拟化，即 virtio。</p>
<h2>What is VirtIO</h2>
<p>介绍：<a href="https://blogs.oracle.com/linux/post/introduction-to-virtio">Introduction to VirtIO</a></p>
<p>Formally, VirtIO, or virtual input &amp; output, is an abstraction layer over a host’s devices for virtual machines.</p>
<p>For example, let’s say we have a VM (virtual machine) running on a host and the VM wants to access the internet. The VM doesn’t have its own NIC to access the internet, but the host does. For the VM to access the host’s NIC, and therefore access the internet, a VirtIO device called <em>virtio-net</em> can be created. In a nutshell, it’s main purpose is to send and receive network data to and from the host. In other words, let virtio-net be a liaison for network data between the host and the guest.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119091954.png" alt="" /></p>
<p>Figure 1 above represents, at a high level, the process of a VM requesting and receiving network data from the host. The high level interaction would be something like the following:</p>
<ol>
<li><strong>VM:</strong> I want to go to google.com. Hey virtio-net, can you tell the host to retrieve this webpage for me?</li>
<li><strong>Virtio-net:</strong> Ok. Hey host, can you pull up this webpage for us?</li>
<li><strong>Host:</strong> Ok. I’m grabbing the webpage data now.</li>
<li><strong>Host:</strong> Here’s the requested webpage data.</li>
<li><strong>Virtio-net:</strong> Thanks. Hey VM, here’s that webpage you requested.</li>
</ol>
<h2>VirtIO Architecture</h2>
<p>The architecture of VirtIO has three key parts: front-end drivers, back-end devices, and its VirtQueues &amp; VRings.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119093154.png" alt="" /></p>
<p>Guest Kernel virtio driver -&gt; virtio device (Guest OS以为的硬件) -&gt; Kernel driver -&gt; Hardware Device</p>
<p><strong>SCSI</strong>（Small Computer System Interface）是一种计算机总线标准，广泛用于连接和传输数据至各种外部设备（如硬盘、磁带驱动器、光盘驱动器等）。SCSI 不仅支持硬盘，还能够连接打印机、扫描仪、光盘驱动器等设备，因此它是一个多功能的接口标准。</p>
<h3>VirtIO Micro Architecture:</h3>
<p>必看：<a href="https://www.cs.cmu.edu/~412/lectures/Virtio_2015-10-14.pdf">VirtIO</a></p>
<h4>VirtIO Drivers (Front-End):</h4>
<p>In a typical host and guest setup with VirtIO, VirtIO drivers exist in the guest’s kernel. In the guest’s OS, each VirtIO driver is considered a kernel module. A VirtIO driver’s core responsibilities are:</p>
<ul>
<li>accept I/O requests from user processes</li>
<li>transfer those I/O requests to the corresponding back-end VirtIO device</li>
<li>retrieve completed requests from its VirtIO device counterpart</li>
</ul>
<p>For example, an I/O request from virtio-scsi might be a user wanting to retrieve a document from storage. The virtio-scsi driver accepts the request to retrieve said document and sends the request to the virtio-scsi device (back-end). Once the VirtIO device has completed the request, the document is then made available to the VirtIO driver. The VirtIO driver retrieves the document and makes it available to the user.</p>
<h4>VirtIO Devices (Back-End):</h4>
<p>Also in a typical host and guest setup with VirtIO, VirtIO devices exist in the hypervisor. In figure 2 above and for this document, we’ll be using Qemu as our (type 2) hypervisor. This means that our VirtIO devices will exist inside the Qemu process. A VirtIO device’s core responsibilities are:</p>
<ul>
<li>accept I/O requests from the corresponding front-end VirtIO driver</li>
<li>handle the request by offloading the I/O operations to the host’s physical hardware</li>
<li>make the processed requested data available to the VirtIO driver</li>
</ul>
<p>Returning to the virtio-scsi example; the virtio-scsi driver notifies its device counterpart, letting the device know that it needs to go and retrieve the requested document in storage on actual physical hardware. The virtio-scsi device accepts this request and performs the necessary calls to retrieve the data from the physical hardware. Lastly, the device makes the data available to the driver by putting the retrieved data onto its shared <em>VirtQueue</em>.</p>
<hr />
<h4>VirtQueues:</h4>
<p>Virtqueue 是 virtio 的核心核心数据结构，是 guest 中驱动与 VMM 中的 virtio 设备传输数据的载体，Virtqueue 包含三部分：描述符表（Descriptor Table）、可用环（Available Ring）、已用环（Used Ring）。其关系如下：
<a href="https://zhuanlan.zhihu.com/p/639301753">Virtio 原理与实现 - 知乎</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119094417.png" alt="" /></p>
<p>The key part to the VirtIO architecture is VirtQueues, which are data structures that essentially <strong>assist devices and drivers in performing various VRing operations</strong>. VirtQueues are shared in guest physical memory, meaning that each VirtIO driver &amp; device pair access the same page in RAM. In other words, a driver and device’s VirtQueues are <strong>not</strong> two different regions that are synchronized.</p>
<p>There is a lot of inconsistency online when it comes to the description of a VirtQueue. Some use it synonymously with VRings (or virtio-rings) whereas others describe them separately. This is due to the fact that VRings are the main feature of VirtQueues, as VRings are the actual data structures that facilitate the transfer of data between a VirtIO device and driver. We’ll describe them separately here since there’s a bit more to a VirtQueue than just its VRings alone.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119092410.png" alt="" /></p>
<h4>VRings:</h4>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119092809.png" alt="" /></p>
<p>As we just mentioned, VRings are the main feature of VirtQueues and are the <strong>core data structures that hold the actual data being transferred</strong>. The reason they’re referred to <strong>as “rings” is because it’s essentially an array that wraps back around to the beginning of itself once the last entry was written to</strong>. These VRings are now starting to be referred to as “areas”, but since Qemu still uses the VRing term in its source code we’ll stick with that name here.</p>
<p>Each VirtQueue can have up to, and usually does, three types of VRings (or areas):</p>
<ul>
<li>Descriptor ring (descriptor area)</li>
<li>Available ring (driver area)</li>
<li>Used ring (device area)</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119093840.png" alt="" /></p>
<h4>Descriptor Ring (Descriptor Area):</h4>
<p>The descriptor ring (or descriptor table, descriptor area) is essentially a circular array of <strong>descriptors</strong>, <strong>where a descriptor is a data structure that describes a data buffer</strong>. A descriptor holds the following info about its data buffer:</p>
<ul>
<li><code>addr</code>: guest-physical address</li>
<li><code>len</code>: length of the data buffer</li>
<li><code>flags</code>: flags (<code>NEXT</code>, <code>WRITE</code>, <code>INDIRECT</code>)</li>
<li><code>next</code>: index (in desc. ring) of next chained descriptor</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119092558.png" alt="" /></p>
<p>GPT:
<strong>Virtio ring</strong> 是一种用于虚拟化环境中的通信机制，特别是在虚拟机（VM）和虚拟化主机之间传输数据时，广泛用于高效的 I/O（输入/输出）操作。它是 <strong>Virtio</strong> 技术的一部分，Virtio 本身是一种在虚拟化环境中提供高效虚拟设备驱动程序的标准。Virtio 最初由 <strong>QEMU/KVM</strong> 等开源虚拟化技术开发，旨在提供一种高效且低开销的虚拟设备接口。</p>
<h4>Virtio Ring 的基本概念</h4>
<p>Virtio ring 是 Virtio 设备和主机之间的一种 <strong>环形缓冲区</strong>（ring buffer），用于在虚拟机（guest）和宿主机（host）之间进行数据传输。它是一个双向队列（Producer/Consumer 队列），每一方（生产者或消费者）都通过环形缓冲区来交换数据，允许高效的、非阻塞的通信。</p>
<h4>Virtio Ring 的工作原理</h4>
<p>Virtio ring 的核心结构是一个包含 <strong>描述符</strong>（Descriptor）、<strong>可用队列</strong>（Available Queue）和 <strong>已用队列</strong>（Used Queue）的环形缓冲区。</p>
<ol>
<li>
<p><strong>描述符（Descriptor）</strong>：</p>
<ul>
<li>描述符是环形缓冲区中的元素，用于描述一个 I/O 操作。例如，它可能指示一块内存区域的位置（用于存储输入或输出数据），以及该区域的大小。</li>
<li>描述符本质上是环形缓冲区中的一块内存，操作系统或虚拟机会将要传输的数据放入这些描述符指向的缓冲区中，或者从这些缓冲区中读取数据。</li>
</ul>
</li>
<li>
<p><strong>可用队列（Available Queue）</strong>：</p>
<ul>
<li>该队列由生产者（通常是虚拟机）维护，指示它准备好执行哪些 I/O 操作。</li>
<li>当虚拟机希望通过 Virtio 设备进行 I/O 操作时，它会将一个描述符放入可用队列中，告诉宿主机：“这里有数据要传输”。</li>
<li>该队列包含指向描述符的指针，描述符则指向实际的缓冲区。</li>
</ul>
</li>
<li>
<p><strong>已用队列（Used Queue）</strong>：</p>
<ul>
<li>该队列由消费者（通常是宿主机）维护，表示已经完成的 I/O 操作。</li>
<li>当宿主机完成某个 I/O 操作时，它将填充描述符并把该描述符的状态写入已用队列，表示数据已经传输完成。</li>
<li>在虚拟机中，消费者（例如，虚拟设备驱动）会检查该队列，并获取 I/O 操作的状态信息（如是否成功传输数据）。</li>
</ul>
</li>
<li>
<p><strong>环形缓冲区（Ring Buffer）</strong>：</p>
<ul>
<li>这是一个循环使用的缓冲区，生产者和消费者可以相互访问。生产者在可用队列中插入描述符，而消费者从已用队列中读取结果。</li>
<li>当队列满时，消费者需要等待生产者填充数据，反之亦然。</li>
</ul>
</li>
</ol>
<h5>Virtio Ring 的流程示例</h5>
<p>以网络数据传输为例，假设虚拟机使用 Virtio 网络设备来发送数据包到宿主机，工作流程可能如下：</p>
<ol>
<li>
<p><strong>生产者（虚拟机）操作</strong>：</p>
<ul>
<li>虚拟机的网络驱动程序将要发送的数据放入一个描述符中。</li>
<li>该描述符被插入到虚拟机的 <strong>可用队列</strong> 中，并通知宿主机开始处理这个数据包。</li>
</ul>
</li>
<li>
<p><strong>消费者（宿主机）操作</strong>：</p>
<ul>
<li>宿主机的 Virtio 驱动程序检查可用队列，并从队列中取出描述符。</li>
<li>宿主机处理数据，将数据包发送到物理网络。</li>
<li>一旦数据处理完成，宿主机会将结果（如成功发送的状态）放入 <strong>已用队列</strong> 中。</li>
</ul>
</li>
<li>
<p><strong>虚拟机的确认</strong>：</p>
<ul>
<li>虚拟机的网络驱动程序检查 <strong>已用队列</strong>，并根据已用队列中的信息来确认数据是否成功发送。</li>
<li>如果发送成功，虚拟机驱动程序可以开始下一个数据包的处理。</li>
</ul>
</li>
</ol>
<h5>Virtio Ring 的优势</h5>
<ol>
<li>
<p><strong>高效性</strong>：</p>
<ul>
<li>Virtio ring 设计为一种高效的零拷贝（zero-copy）机制，它通过直接在虚拟机和宿主机的内存之间传递数据，避免了额外的内存拷贝操作。</li>
</ul>
</li>
<li>
<p><strong>低延迟</strong>：</p>
<ul>
<li>因为采用了环形缓冲区的设计，Virtio ring 允许快速的生产者-消费者交替操作，减少了同步延迟。</li>
</ul>
</li>
<li>
<p><strong>支持批量操作</strong>：</p>
<ul>
<li>Virtio ring 允许同时处理多个 I/O 操作。通过将多个描述符放入队列中，虚拟机和宿主机可以批量处理数据，提高了 I/O 操作的吞吐量。</li>
</ul>
</li>
<li>
<p><strong>跨平台兼容性</strong>：</p>
<ul>
<li>Virtio 是一个通用的虚拟化标准，能够支持多种不同的虚拟化平台（如 QEMU/KVM、Virtuozzo、Hyper-V 等），使得不同虚拟化平台之间的兼容性更好。</li>
</ul>
</li>
</ol>
<hr />
<h3>VirtIO 驱动实现原理</h3>
<ol>
<li>初始化 VirtIO Queue （VirtIO启动）</li>
<li>驱动根据 I/O 请求填充 virtqueue （Guest kernel -&gt; VirtIO）</li>
<li>驱动通知设备处理 I/O 请求 (VirtIO -&gt; Host device)</li>
<li>设备处理 I/O 请求 (Host device feed back -&gt; VirtIO)</li>
<li>驱动回收 I/O 请求 (VirtIO -&gt; Guest Kernel，将中断注入 guest)</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119094514.png" alt="" /></p>
<h3>具体的参数配置</h3>
<p><a href="https://docs.oasis-open.org/virtio/virtio/v1.3/csd01/virtio-v1.3-csd01.html">Virtual I/O Device (VIRTIO) Version 1.3</a>
我们可以参照 socket 的配置，然后找到白皮书里对应的设置，然后学习经验</p>
<p>RDMA的经验
Linux中集成
<a href="https://www.spinics.net/lists/linux-rdma/msg108803.html">[RFC] Virtio RDMA — Linux RDMA and InfiniBand development</a></p>
<p>Fuse 文件系统 - Linux
<a href="https://www.man7.org/linux/man-pages/man4/fuse.4.html">fuse(4) - Linux manual page</a></p>
<h2>virtio-gpu</h2>
<p><a href="https://blog.csdn.net/huang987246510/article/details/106254294">VirtIO-GPU —— 2D加速原理分析_c2d gpu-CSDN博客</a>
可以根据这个link看看我们可能的工作，就是写struct，然后传入VirtIO，然后等数据回来，再拿数据</p>
<p>如何拿数据，根据这个文档
<a href="https://www.qemu.org/docs/master/system/devices/virtio-gpu.html">virtio-gpu — QEMU documentation</a></p>
<p>QEMU virtio-gpu device variants come in the following form:</p>
<blockquote>
<ul>
<li>
<p><code>virtio-vga[-BACKEND]</code></p>
</li>
<li>
<p><code>virtio-gpu[-BACKEND][-INTERFACE]</code></p>
</li>
<li>
<p><code>vhost-user-vga</code></p>
</li>
<li>
<p><code>vhost-user-pci</code></p>
</li>
</ul>
</blockquote>
<p><strong>Backends:</strong> QEMU provides a 2D virtio-gpu backend, and two accelerated backends: virglrenderer (‘gl’ device label) and rutabaga_gfx (‘rutabaga’ device label). There is a vhost-user backend that runs the graphics stack in a separate process for improved isolation.</p>
<p><strong>Interfaces:</strong> QEMU further categorizes virtio-gpu device variants based on the interface exposed to the guest. The interfaces can be classified into VGA and non-VGA variants. The VGA ones are prefixed with virtio-vga or vhost-user-vga while the non-VGA ones are prefixed with virtio-gpu or vhost-user-gpu.</p>
<p>The VGA ones always use the PCI interface, but for the non-VGA ones, the user can further pick between MMIO or PCI. For MMIO, the user can suffix the device name with -device, though vhost-user-gpu does not support MMIO. For PCI, the user can suffix it with -pci. Without these suffixes, the platform default will be chosen.</p>
<p>Descriptor：可以被拆开然后拼接到下一层</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119100412.png" alt="" /></p>
<p><a href="https://github.com/Project-HAMi/HAMi-core">Project-HAMi/HAMi-core: HAMi-core compiles libvgpu.so, which ensures hard limit on GPU in container</a></p>
<h2>VirtIO - crypto</h2>
<p><a href="https://wiki.qemu.org/Features/VirtioCrypto">Features/VirtioCrypto - QEMU</a></p>
<p>Use the cryptodev-linux module to test the crypto functions in the guest.</p>
<pre><code>$ git clone [https://github.com/cryptodev-linux/cryptodev-linux.git](https://github.com/cryptodev-linux/cryptodev-linux.git)
$ cd cryptodev-linux
$ make; make install
$ insmod cryptodev.ko
$ cd tests
$ make
$ ./cipher -
requested cipher CRYPTO_AES_CBC, got cbc(aes) with driver virtio_crypto_aes_cbc
AES Test passed
requested cipher CRYPTO_AES_CBC, got cbc(aes) with driver virtio_crypto_aes_cbc
requested cipher CRYPTO_AES_CBC, got cbc(aes) with driver virtio_crypto_aes_cbc
Test passed</code></pre>
<p>A simple benchmark in the cryptodev-linux module (synchronous encryption in the guest and no hardware accelerator in the host)</p>
<pre><code>$ ./speed
 Testing AES-128-CBC cipher:
       Encrypting in chunks of 512 bytes: done. 85.10 MB in 5.00 secs: 17.02 MB/sec
       Encrypting in chunks of 1024 bytes: done. 162.98 MB in 5.00 secs: 32.59 MB/sec
       Encrypting in chunks of 2048 bytes: done. 292.93 MB in 5.00 secs: 58.58 MB/sec
       Encrypting in chunks of 4096 bytes: done. 500.77 MB in 5.00 secs: 100.14 MB/sec
       Encrypting in chunks of 8192 bytes: done. 766.14 MB in 5.00 secs: 153.20 MB/sec
       Encrypting in chunks of 16384 bytes: done. 1.05 GB in 5.00 secs: 0.21 GB/sec
       Encrypting in chunks of 32768 bytes: done. 1.31 GB in 5.00 secs: 0.26 GB/sec
       Encrypting in chunks of 65536 bytes: done. 1.51 GB in 5.00 secs: 0.30 GB/sec</code></pre>
<h2>改Rust</h2>
<p>参考asterinas socket
<a href="https://wiki.qemu.org/Features/VirtioVsock">Features/VirtioVsock - QEMU</a>
<a href="https://github.com/asterinas/asterinas/tree/885950c2a4a65486524ac53e40f6b6515d7ebd3a/kernel/comps/virtio/src/device/socket">asterinas/kernel/comps/virtio/src/device/socket at 885950c2a4a65486524ac53e40f6b6515d7ebd3a · asterinas/asterinas</a>
<a href="https://asterinas.github.io/book/kernel/linux-compatibility.html">Linux Compatibility - The Asterinas Book</a></p>
<p><a href="https://zhuanlan.zhihu.com/p/541259229">网络虚拟化——virtio - 知乎</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/20241119114110.png" alt="" /></p>
<p><a href="https://www.jiqizhixin.com/articles/2024-10-22-10">“星绽”操作系统内核开源：采用Rust语言，兼顾性能与安全 | 机器之心</a></p>
<h1>EOF</h1>
