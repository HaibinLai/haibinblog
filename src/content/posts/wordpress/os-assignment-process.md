---
title: "OS Assignment: Process"
description: "Author: Haibin Lai Student ID: 12211612 1 Three \"Easy\" Pieces 1.1 Three Easy pieces of Operating System: Virtualization Concurrency Persistence Explain: Virtualization means OS will make a high level abstraction on the…"
publishedAt: "2024-10-24T14:43:55Z"
updatedAt: "2024-12-01T11:57:52Z"
category: "OS"
categories: ["OS"]
tags: ["OS", "Process", "进程"]
author: "GB"
draft: false
slug: "os-assignment-process"
legacySlug: "os-assignment-process"
oldSlugs: []
wordpressId: 377
sourceUrl: "https://www.haibinlaiblog.top/index.php/os-assignment-process/"
commentCount: 0
viewCount: 2078
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-001-9ab76d7acc77.webp"
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process.webp"
---
<p>Author: Haibin Lai
Student ID: 12211612</p>
<h2>1 Three &quot;Easy&quot; Pieces</h2>
<h3>1.1</h3>
<p>Three Easy pieces of Operating System:</p>
<ol>
<li><strong>Virtualization</strong></li>
<li><strong>Concurrency</strong></li>
<li><strong>Persistence</strong></li>
</ol>
<p>Explain:</p>
<p><strong>Virtualization</strong> means OS will make a high level <strong>abstraction</strong> on the computer hardware like CPU, memory, disk, network etc. Also, OS can provide isolation on resource using techniques like VM to make a higher utilization on resource and enhance the safety of the system.</p>
<p><strong>Concurrency</strong> means OS can provide the ability of handling multi jobs/process. OS can provide multi thread and multi process to let computer do different jobs at the same time. Also, OS needs to handle the problem in data competing and dead lock.</p>
<p><strong>Persistence</strong> means OS can hold the data after the system is shut down. By using file system and storage system, OS can save the data to disk and manage them for a long period.</p>
<h3>1.2</h3>
<p>How do 3 easy pieces map to the chapters ?</p>
<p><strong>Virtualization</strong>:</p>
<ol>
<li>
<p>Virtualize tasks:
Process
Direct Execution</p>
</li>
<li>
<p>Scheduling
CPU Scheduling
Multi-level Feedback
Multi-CPU Scheduling</p>
</li>
<li>
<p>Virtualize Main Memory
Address Spaces
Address Translation
Segmentation
Free Space Management</p>
</li>
<li>
<p>Virtualize Disk space
Paging
Translation Lookaside Buffers
Advanced Page Tables
Swapping Mechanisms
Swapping Policies
Complete VM Systems</p>
</li>
</ol>
<p><strong>Concurrency</strong>:</p>
<ol>
<li>
<p>How to create concurrency:
Threads</p>
</li>
<li>
<p>How to manage concurrency's conflicts and atomoic controls to files:
Locks
Condition Variables
Semaphores</p>
</li>
<li>
<p>How to handle concurrency problems in dead locks and event-loop etc.
Bug
Event based concurrency</p>
</li>
</ol>
<p><strong>Persistence</strong>:</p>
<ol>
<li>
<p>How to read and write in persistent storage hardware
I/O Devices
Hard Disk Drives
RAID</p>
</li>
<li>
<p>How to organize files in storage
Files and Directories
Fast File System</p>
</li>
<li>
<p>Modern Storage systems and file safety protection systems
FSCK and journaling
Log-structured File system
Flash-based SSDs
Data Integrity and Protection</p>
</li>
<li>
<p>Distributed Systems and Modern Storage Systems
Distributed Systems
NFS
AFS</p>
</li>
</ol>
<h2>2. Context Switch</h2>
<p>What happens during <strong>context switch</strong>?</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-002-9ab76d7acc77.webp" alt="contextSw2itch.png" /></p>
<p>Context Switch is a mechanism in Operating System that allows CPU to change its working tasks &amp; processes. It happens in the following details:</p>
<ol>
<li>Firstly, the kernel process would gain control by interruption like timer interrupt. Then the states in Process 1,which include the Program counter, CPU register and stated in PCB_1, will be saved into memory, and then it will turn into kernel mode.</li>
<li>The OS kernel will handle the interruption, and call switch() syscall. In the syscall, first OS will save the PCB_1 in memory.</li>
<li>Then OS will schedule a new process or keep on calling the process 1. In scheduling policy, it will go through the PCB blocks and select a new process using policy like FIFO.</li>
<li>After the scheduler finds a new process 2, it will load it from process table, and get its kernel stack address, then the trap will return.</li>
<li>After that, the regs in CPU will change to regs for process 2. Next CPU will move to user mode and begin to run process 2.  </li>
</ol>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-003-05197632a6de.webp" alt="" /></p>
<h3>关于课本图的调研</h3>
<p>注：我们看课本中的这张图，为什么会同时存在Process Table和Kernel Stack？课本是基于xv6代码给出的结果。</p>
<p>在一篇stackoverflow的提问中，高赞的一个回答是这样描述的：
<a href="https://stackoverflow.com/questions/67955845/during-a-context-switch-does-the-os-use-pcb-or-kernel-stack-to-restore-register">operating system - During a context switch, does the OS use PCB or kernel stack to restore registers? - Stack Overflow</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-004-60d0ada7ada5.webp" alt="" /></p>
<p>简单而言，就是Process Table里的PCB存储的esp栈指针，其指向的是Kernel Stack中 B进程存储寄存器信息的位置。随后中断trap退出，OS会从Kernel里拿出剩余B寄存器的位置信息，同时恢复B进程的esp。</p>
<p>那么这是xv6的想法。其他OS是怎么想的呢？</p>
<h4>OS为什么要有一个内核栈？</h4>
<p>在与冼学长讨论后，他找到了一份资料《PRINCIPLES OF I/O HARDWARE》，里边记录了OS中断时的操作：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-005-4985c8befcb3.webp" alt="" /></p>
<p>文中循序渐进地提到三种idea，：</p>
<ol>
<li>放入内部寄存器中，这样OS触手可得。但是我们的中断处理器无法感知这种操作，甚至会覆写这些寄存器。</li>
<li>既然寄存器有问题，我们可以使用栈来保持我们的信息，在需要的时候再拿出来。但是，如果我们目前是一个 User Process，它使用 User Stack，那么这样操作可能会 &quot;cause a fatal error&quot;。我学习了一下，这个问题主要是因为，OS也可以有权限检查和内核保护机制，不仅”用户不能碰OS“，并且“OS最好也别碰用户”，在这种情况下，确实不是很好。另一个可怕的事情是，User Stack是有大小的。一般的，一旦用户栈用尽，就会page fault，然后OS给它分个新的。但是如果是在context switch 中有这个问题，那我们多余的寄存器也无法存储了。</li>
<li>所以，我们可能需要一个新的栈：Kernel Stack，用来存储这些寄存器。不过这里也提到，这样做的缺点就是MMU会改变，并且缓存、TLB也会改变，这会使性能下降。</li>
</ol>
<h4>发散话题：能不能加速context switch？</h4>
<p>既然这里性能会下降，有没有什么办法可以加速它？我在这边好像找到的文章不多，可能是我的搜索方向的问题。但是在加速连续频繁的sys_call上，osdi还是有两篇不错的文章。（对不起，这里我跑题了，<strong>我后面的两篇文章都在加速像switch()的syscall上而不是switch本身上</strong>。</p>
<p>一篇是23年的Userspace Bypass，它将一些用户空间的函数放在内核空间执行。在工程上实现了一个UB的东西
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-006-269167767747.webp" alt="" /></p>
<p>下面是他的大致框架。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-007-7f8c1f67738c.webp" alt="" /></p>
<p>从效果来看，这篇文章没有打过eBPF。它也在这里边进行了探讨，一是eBPF并非图灵完备，另一方面开发的难度也比较大。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-008-0310ecc848b8.webp" alt="" /></p>
<p>当然，说到eBPF，那肯定是得提22年OSDI的Best Paper，XRP: In-Kernel Storage Functions with eBPF。它用eBPF技术实现了数据库在磁盘访问上的加速</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-009-73bb8bdbe4ac.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-010-2e0253129c28.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-011-6fc16f3b689f.webp" alt="" /></p>
<p>虽然这一切跟我们的上下文切换关系不是很大，但是能看到的是，如果我们原本的进程在用户空间，那么在上下文切换时，我们也可以减去这个User Space到Kernel Space 的时延。但是在Stack方面的工作，我没有找到。</p>
<h4>不同体系结构上都一样吗？</h4>
<p>学长给的另一篇Intel的x86 文档里，有一个trap机制。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-012-5d676e2619fa.webp" alt="1729775795916.png" /></p>
<p>这里，x86针对不同的OS，有两种应对方式，一种是在lower privilege level的情况下，Stack switch发生（这里应该可以对应用户空间进程切换到Kernel Space的情况）。在同级中断的情况下，如在内核进程切换，程序将EFLAGS，CS，EIP寄存器存入当前栈中。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-013-b634b8db2958.webp" alt="" /></p>
<p>对应的，我们去查了下ARM架构下的操作。在ARM架构下，OS的这种中断主要是软中断，依靠SWI实现。（我们这里查了ARM Architecture Manual，有1万4千多页，但是找了快一个小时都没有找到，有点遗憾地放弃了。这里边涉及到很多硬件对OS的检测，比如我们刚刚说的检测内核函数对用户空间的访问什么的，但是跟具体的上下文切换没有太大的联系，真的很遗憾）</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-014-2c0f60461fbd.webp" alt="d321697144fd75e0dabe8b0d28ee029.png" /></p>
<p>这篇博客中，提到了ARM的内核栈，用户栈的想法。
<a href="https://www.cnblogs.com/zengjianrong/p/11974351.html">ARM64的内核栈、用户栈、寄存器上下文 - black_man - 博客园</a></p>
<p>我想这种上下文切换中栈的实现主要是跟OS而非硬件有关，因为在这些文章和博客中，OS才是对存储栈这个问题上的解决者。同样的，在xv6的RISC-V版本中，有人也指出了其内核栈的创建代码：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-015-9f5a92a448ce.webp" alt="" /></p>
<p><a href="https://zhuanlan.zhihu.com/p/624607389">XV6：操作系统组成 - 知乎</a></p>
<h4>OSTD上是怎么完成上下文切换的？</h4>
<p>学长提到OSTD里的上下文切换具体实现在ostd/src/arch/riscv/trap/trap.S 的trap_entry里。</p>
<p>一开始先保存所有的寄存器（除sp栈指针，它过一会单独处理
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-016-870caa46db35.webp" alt="" /></p>
<p>现在单独处理栈指针：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-017-18e144bba5e7.webp" alt="" /></p>
<hr />
<h2>3. fork() exit()</h2>
<p>Read slides “L03 Processes” and answer the following questions: </p>
<p>(1) Explain what happens when the kernel handles the fork() system call (hint: your answer should include the system call mechanism, PCB, address space, CPU scheduler, context switch, return values of the system call).</p>
<ol>
<li>
<p>System call mechanism: After calling <code>fork()</code>, OS will enter the kernel mode using instruction like <code>ecall</code>,  then OS will start to handle the call.</p>
</li>
<li>
<p>PCB: In this system call, a new PCB is created for child process, except for pid, the other value are the same with parent process.</p>
</li>
<li>
<p>Address space: A new address space will be assigned to child process with the same virtual address. If the OS uses <code>Copy-on-Write</code> strategy,  it will not copy all the file in father process as soon as child is created. Instead, when any of the process want to change the variable, it will create for child at that time.</p>
</li>
<li>
<p>CPU scheduler: Then, both father and child process are in ready status. Waiting for CPU schedule them.</p>
</li>
<li>
<p>Context switch: The OS will end its system call, and take the process to run which scheduler determined. </p>
</li>
<li>
<p>Return values of the system call: the parent process will get the child process' pid from system call, and the child will get 0.</p>
</li>
</ol>
<p>(2) Explain what happens when the kernel handles the exit() system call (hint: your answer should include discussion on the zombie state and how it is related to the wait() system call).</p>
<ol>
<li>System call: When a child process calls <code>exit()</code>,  OS enter the kernel mode, and then it knows that child process is going to end.</li>
<li>Kernel will free <strong>most of</strong> the kernel-space memory and the files open by process. Then frees everything on the user space memory.</li>
<li>However the <strong>PCB</strong> will not be removed, which make the process a zombie state. Then it will be assigned with &quot;<strong>Terminated</strong>&quot;, the kernel will refresh the process states as &quot;<strong>Zombie</strong>&quot;.</li>
<li>If the parent process has called <code>wait()</code> before, the kernel will find the parent using child process'  <code>struct proc_struct *parent</code> in its PCB. Then it will wake parent process to handle the rest of the kernel space memory created by child process.</li>
<li>If the child process also has its own children, they will be <code>reparent</code> to process 1 (Init Process).</li>
</ol>
<h2>4. Life cycle of a process</h2>
<p>Describe the life cycle of a process (hint: explain the reasons for process state transitions).</p>
<h4>New</h4>
<p>When a process is newly created from <code>fork</code> and <code>exec</code>, it will go to this init state. </p>
<h4>Ready</h4>
<p>When the OS has created the complete PCB and information for the process, the process will enter the Ready state from New state. Here the process will go into a waiting queue that waits for scheduler to schedule.</p>
<h4>Running</h4>
<p>When the scheduler decide the process to run, it enters the Running state. Here it occupies the CPU resouce and other resouce it wants. </p>
<p>When running, a timer interupt may happen to call context switch for scheduler to reschedule the process. the scheduler may choose the process again or choose another process. At this monment, the process will go back to Ready state. Also, this incident will happen if process calls <code>sleep</code>.</p>
<p>When the process wants resource like memory, files, I/O, process and etc, it will enter the Blocked status. </p>
<h4>Blocked / Wait</h4>
<p>The process will get into Blocked status once the process want some resouce. When the OS gets the resource for the process, it will again into the Ready state and ready for scheduler to call it into running.</p>
<h4>Exit / Terminated</h4>
<p>When the process finish its job or a fatal error happens, the process will enter into exit state and be terminated like the procedure of <code>exit()</code> we have talked above.</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/os-assignment-process/body-018-9f76badd6538.webp" alt="" /></p>
<hr />
<h2>Acknowledgement</h2>
<p>感谢周思呈学姐在上下文切换内核栈问题和ARM架构上给于我的帮助与指导，感谢冼晋毅学长在ostd和x86问题上的精心准备，这让我非常惊喜。</p>
