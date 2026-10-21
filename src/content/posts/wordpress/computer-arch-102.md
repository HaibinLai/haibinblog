---
title: "Computer Arch 102"
description: "项目 从计算机课堂的5级流水线进一步进阶，制作更强大的CPU。 github: https://github.com/HaibinLai/simple-CPU.git 使用指令集：RISC-V 多发射（Superscalar） Superscalar（超标量）是指 CPU 在一个时钟周期里，不再只发射（issue）一条指令，而是同时发射多条彼此独立的指令到不同执行单元。例如一个现代 CPU 可能同时执行整数加法、浮点乘法、load/s…"
publishedAt: "2026-05-07 17:30:14"
category: "Architecture"
tags: ["CPU", "RISC-V"]
draft: false
slug: "computer-arch-102"
legacySlug: "computer-arch-102"
wordpressId: 1381
sourceUrl: "https://haibin-blog.vercel.app/index.php/computer-arch-102/"
commentCount: 0
importedFromWordPress: true
---
<h2>项目</h2>
<p>从计算机课堂的5级流水线进一步进阶，制作更强大的CPU。</p>
<p>github: <a href="https://github.com/HaibinLai/simple-CPU.git">https://github.com/HaibinLai/simple-CPU.git</a></p>
<p>使用指令集：RISC-V</p>
<h3>多发射（Superscalar）</h3>
<p>Superscalar（超标量）是指 CPU 在一个时钟周期里，不再只发射（issue）一条指令，而是同时发射多条彼此独立的指令到不同执行单元。例如一个现代 CPU 可能同时执行整数加法、浮点乘法、load/store 等不同操作。核心目标是提升 IPC（Instructions Per Cycle）。为了做到这一点，CPU 需要能够分析指令之间是否存在依赖关系，并动态寻找可以并行执行的指令。比如 Intel、AMD 的现代 CPU 通常都是 4-wide、6-wide 甚至更宽的 superscalar 架构。</p>
<blockquote>
<p>Intel/AMD 现代 CPU 通常是 4-wide、6-wide 甚至更宽的 superscalar 架构。</p>
</blockquote>
<p>本项目实现的是 <strong>2-wide（双发射）</strong> 前端，slot0/slot1 同时取两条相邻指令并经 IFQ 缓冲，再按配对规则发射到后端。</p>
<ul>
<li>双 PC 取指（<code>pc</code> / <code>pc+4</code>）与双指令读 IMEM：cpu_top.v</li>
<li>IFQ（双 push / 双 pop）：ifq.v，例化点 cpu_top.v</li>
<li>Slot1 配对门控（<code>id2_issue_slot1</code>，要求 ALU-only、无依赖等）：cpu_top.v</li>
<li>关键信号：<code>pc_plus4</code> / <code>pc_plus8</code> / <code>if_id_valid0/1</code> / <code>push_valid_0/1</code> / <code>id1_is_alu_only</code></li>
</ul>
<hr />
<h3>乱序执行（Out-of-Order Execution, OoO）</h3>
<p>乱序执行是现代 CPU 提高利用率的核心技术之一。它允许 CPU 不按照程序原本的顺序执行指令，而是优先执行“已经准备好”的指令。比如某条 load 指令正在等待内存返回数据（可能要几百 cycles），CPU 不会傻等，而是继续执行后面那些不依赖它的指令。这样可以隐藏长延迟，提高流水线利用率。需要注意的是，虽然内部执行顺序乱了，但 CPU 最终仍然必须保证程序对外的结果与原始顺序一致（precise state）。</p>
<blockquote>
<p>CPU 不按程序原本顺序执行指令，而优先执行已经准备好的指令。</p>
</blockquote>
<p>本项目目前是 <strong>in-order 后端 + OoO 基础设施</strong> 的过渡阶段：rename + ROB 已经就位，但还没有独立的乱序 issue 阶段。后端仍按 PC 顺序发射，但通过 ROB 保证最终对外顺序一致（precise state）。</p>
<ul>
<li>ROB 提供顺序提交、乱序写回的容器：rob.v</li>
<li>Rename 提供 ptag 化解假依赖：rename.v</li>
<li>路径规划文档：2issue-implementation-plan.md</li>
</ul>
<hr />
<h3>Speculative Execution（推测执行）</h3>
<p>推测执行是 CPU 在“不确定未来是否正确”的情况下提前执行指令。最典型的场景是 branch prediction（分支预测）：CPU 猜测 if/else 会走哪条路径，然后提前执行对应路径上的指令。如果猜对了，就节省了大量等待时间；如果猜错了，则回滚错误执行的结果并重新执行正确路径。现代深流水 CPU 非常依赖 speculative execution，否则 branch stall 会让流水线大量空闲。著名的 Spectre 漏洞，本质上就是 speculative execution 带来的侧信道问题。</p>
<blockquote>
<p>最典型的场景是 branch prediction：CPU 猜测分支走哪条路径，提前执行；猜错则回滚。</p>
</blockquote>
<ul>
<li>BPU 模块（2-way BTB + GShare BHT + GHR）：bpu.v
<ul>
<li>BTB / BHT 存储：bpu.v</li>
<li>IF 阶段产出 <code>pred_taken</code> / <code>pred_target</code>：bpu.v</li>
<li>EX 阶段反馈训练（更新 BHT/BTB/GHR）：bpu.v</li>
</ul></li>
<li>误预测回滚（<code>ex_redirect</code> → 注入 NOP + 重定向 PC）：cpu_top.v</li>
<li>关键信号：<code>pred_taken</code>、<code>pred_target</code>、<code>ghr</code>、<code>btb0_valid/btb1_valid</code>、<code>bht[]</code>、<code>upd_valid</code>、<code>upd_taken</code></li>
</ul>
<hr />
<h3>Register Renaming（寄存器重命名）</h3>
<p>寄存器重命名用于消除“假依赖（false dependency）”。程序里虽然只有有限个架构寄存器（如 x86 的 rax/rbx），但 CPU 内部实际上有更多“物理寄存器（physical registers）”。CPU 会把逻辑寄存器动态映射到新的物理寄存器上。例如：</p>
<pre><code class="language-asm">mov r1, ...
add r1, ...</code></pre>
<p>表面上两条指令都写 r1，但 CPU 可以把它们映射到不同物理寄存器，从而避免无意义的写后写（WAW）或写后读（WAR）冲突。这样可以让更多指令并行执行。register renaming 是 OoO CPU 的基础技术之一。</p>
<blockquote>
<p>把逻辑寄存器动态映射到更多物理寄存器，消除 WAW/WAR 这种&quot;假依赖&quot;。</p>
</blockquote>
<p>本项目用 <strong>48 个物理寄存器（ptag 0–47，6-bit）</strong>：ptag 0–31 与架构寄存器一一固定映射，ptag 32–47 由 free list 动态分配给推测写。</p>
<ul>
<li>Rename 模块（双槽 s0/s1 同时分配）：rename.v
<ul>
<li>存储：<code>map[32]</code>（speculative RAT，ARF→ptag）、<code>arch_map[32]</code>（RRAT，已提交映射，用于 flush 恢复）、<code>busy[48]</code>、free list <code>fl_mem[16]</code>：rename.v</li>
<li>双槽组合查 + bundle 内前递：rename.v</li>
<li>Free list 头尾指针 / 分配 vs commit 释放：rename.v</li>
</ul></li>
<li>关键信号：<code>map[]</code> / <code>arch_map[]</code> / <code>fl_head</code> / <code>fl_tail</code> / <code>fl_cnt</code> / <code>s0_rd_ptag_new</code> / <code>s0_rd_ptag_old</code> / <code>s1_rd_ptag_new</code> / <code>s1_rd_ptag_old</code> / <code>stall</code></li>
</ul>
<hr />
<h3>Tomasulo Algorithm（Tomasulo 算法）</h3>
<p>Tomasulo 是 IBM 在 1960s 提出的经典动态调度算法，是现代 OoO CPU 的理论基础之一。它的核心思想是：通过 reservation stations（保留站）和寄存器重命名，让指令在操作数准备好后自动执行，而不必严格按照程序顺序等待。它能动态跟踪数据依赖，并通过广播结果（Common Data Bus）唤醒后续指令。相比早期 scoreboard 方法，Tomasulo 能更好地解决 WAR/WAW hazard。现代 CPU 虽然实现已经复杂很多，但本质思想仍然来自 Tomasulo。</p>
<blockquote>
<p>通过 reservation stations + 寄存器重命名，让指令在操作数 ready 时自动执行；通过 CDB 广播结果唤醒后续指令。</p>
</blockquote>
<p><strong>本项目当前没有实现 Tomasulo</strong>（没有 reservation station，没有 CDB wakeup）。它走的是更简单的 <strong>显式 forwarding + load-use stall</strong> 路线：</p>
<ul>
<li>操作数前递（4 优先级 MUX，从最近的生产者取值）：forwarding.v</li>
<li>冒险检测（load-use 等）：hazard.v</li>
</ul>
<p>未来要做真正的 OoO 后端时，Tomasulo 风格的 RS + wakeup 是要补的核心结构。</p>
<hr />
<h3>ROB（Reorder Buffer，重排序缓冲区）</h3>
<p>ROB 是现代 OoO CPU 用来“恢复程序顺序”的关键结构。虽然 CPU 内部会乱序执行，但最终必须按程序顺序提交（commit）结果，否则异常、中断、错误恢复会完全混乱。ROB 会记录每条指令的执行状态、目标寄存器、结果等信息。指令可以乱序执行，但只有当它之前的所有指令都完成后，它才能按顺序 commit。ROB 保证了 precise exception（精确异常）和程序可见状态的一致性。可以理解为：</p>
<blockquote>
<p>OoO 是&quot;乱着干活&quot;，ROB 是&quot;按顺序交卷&quot;。</p>
</blockquote>
<p>本项目实现的是 <strong>16 条目环形 ROB（tag 0–15，4-bit）</strong>，支持双分配、双写回、双提交，并支持全 flush 与 partial flush。</p>
<ul>
<li>ROB 模块：rob.v
<ul>
<li>条目存储（<code>valid_q[] / done_q[] / pc_q[] / rd_q[] / result_q[] / is_store_q[] / ptag_new_q[] / ptag_old_q[]</code>）：rob.v</li>
<li>分配（<code>alloc_tag_0/1</code>，移动 <code>tail_ptr</code>）：rob.v</li>
<li>顺序提交头视图（<code>commit_valid_X = valid_q[head_X] &amp;&amp; done_q[head_X]</code>）：rob.v</li>
<li>写回置 <code>done</code>、commit 弹出、flush / flush_partial：rob.v</li>
</ul></li>
<li>关键信号：<code>valid_q[]</code> / <code>done_q[]</code> / <code>head_ptr</code> / <code>tail_ptr</code> / <code>cnt</code> / <code>alloc_tag_0/1</code> / <code>commit_valid_0/1</code> / <code>commit_result_0/1</code> / <code>flush</code> / <code>flush_partial</code></li>
<li>配合 Rename：每条进 ROB 时同时记 <code>ptag_new</code>（新分配的目标 ptag）和 <code>ptag_old</code>（被该 rd 覆盖的旧 ptag）；commit 时把 <code>arch_map[rd] ← ptag_new</code> 并把 <code>ptag_old</code> 还回 free list，从而做到 precise state。</li>
</ul>
<h2>Benchmark</h2>
<table>
<thead>
<tr>
<th>benchmark</th>
<th>CPI</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>memcpy_64w</strong></td>
<td><strong>1.546</strong></td>
</tr>
<tr>
<td><strong>bsort_16</strong></td>
<td><strong>1.820</strong></td>
</tr>
<tr>
<td><strong>crc32_64b</strong></td>
<td><strong>1.941</strong></td>
</tr>
<tr>
<td><strong>bsearch_64</strong></td>
<td>1.918</td>
</tr>
<tr>
<td>dotprod_32</td>
<td>1.927</td>
</tr>
<tr>
<td>matmul_4x4</td>
<td>1.890</td>
</tr>
<tr>
<td>fib_20</td>
<td>1.805</td>
</tr>
<tr>
<td>popcount_64</td>
<td>1.738</td>
</tr>
<tr>
<td>sum_1_to_100</td>
<td>2.995</td>
</tr>
</tbody>
</table>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/2026/05/20260507172916198.png" alt="4ca87b06a87cac1cbcc5f13d17489cd6.jpg|140" /></p>
