---
title: "从零开始造一颗 RISC-V CPU（一）：项目总览与流水线基础"
description: "从零开始造一颗 RISC-V CPU（一）：项目总览与流水线基础 系列博客第 1 篇 —— 介绍整个项目的动机、架构全貌、8 级流水线设计以及关键的 hazard 处理。 项目地址： https://github.com/HaibinLai/simple-CPU/tree/main/docs 为什么要自己造 CPU？ 每年的计算机组成原理课，都有一个调bug到想死的大作业： 用 Verilog 实现一颗 RISC-V CPU 。今天我…"
publishedAt: "2026-06-07T06:13:11Z"
category: "Architecture"
categories: ["Architecture"]
tags: ["CPU"]
author: "GB"
draft: false
slug: "从零开始造一颗-risc-v-cpu(一)-项目总览与流水线基础"
legacySlug: "从零开始造一颗-risc-v-cpu（一）：项目总览与流水线基础"
oldSlugs: []
wordpressId: 1396
sourceUrl: "https://www.haibinlaiblog.top/index.php/%e4%bb%8e%e9%9b%b6%e5%bc%80%e5%a7%8b%e9%80%a0%e4%b8%80%e9%a2%97-risc-v-cpu%ef%bc%88%e4%b8%80%ef%bc%89%ef%bc%9a%e9%a1%b9%e7%9b%ae%e6%80%bb%e8%a7%88%e4%b8%8e%e6%b5%81%e6%b0%b4%e7%ba%bf%e5%9f%ba%e7%a1%80/"
commentCount: 0
viewCount: 616
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<h1>从零开始造一颗 RISC-V CPU（一）：项目总览与流水线基础</h1>
<blockquote>
<p>系列博客第 1 篇 —— 介绍整个项目的动机、架构全貌、8 级流水线设计以及关键的 hazard 处理。</p>
</blockquote>
<p>项目地址：<a href="https://github.com/HaibinLai/simple-CPU/tree/main/docs">https://github.com/HaibinLai/simple-CPU/tree/main/docs</a></p>
<hr />
<h2>为什么要自己造 CPU？</h2>
<p>每年的计算机组成原理课，都有一个调bug到想死的大作业：<strong>用 Verilog 实现一颗 RISC-V CPU</strong>。今天我决定试试一个不一样的方式——让 <strong>AI agent来主导整个 CPU 的设计与实现</strong>，我负责提出需求、审查代码、做关键决策。</p>
<p>从最基础的5级流水线开始，agent 逐步迭代出了 8 级双发射流水线、TAGE 分支预测、2-way set-associative Cache，以及完整的 Tomasulo+ROB 乱序执行引擎。所有 RTL 代码、测试脚本、benchmark 汇编程序，均由 agent 编写，我来指定方向和验收结果。</p>
<p>最终的成果是一颗 <strong>4,754 行 RTL</strong> 的 dual-issue superscalar CPU：</p>
<table>
<thead>
<tr>
<th>特性</th>
<th>实现</th>
</tr>
</thead>
<tbody>
<tr>
<td>ISA</td>
<td>RV32I（40 条指令）</td>
</tr>
<tr>
<td>流水线</td>
<td>8 级：IF → ID1 → ID2 → EX1 → EX2 → AGU → MEM → WB</td>
</tr>
<tr>
<td>发射宽度</td>
<td>2-wide（slot0 全功能 + slot1 ALU/load/store/branch）</td>
</tr>
<tr>
<td>分支预测</td>
<td>TAGE-2L + 2-way BTB</td>
</tr>
<tr>
<td>Cache</td>
<td>I$/D$ 各 2KB，2-way set-associative，4 words/line</td>
</tr>
<tr>
<td>MMIO</td>
<td>UART TX @ <code>0x10000000</code></td>
</tr>
<tr>
<td>验证</td>
<td>15 benchmarks + 2000 case 指令测试 + micro tests 全 PASS</td>
</tr>
</tbody>
</table>
<p>这个系列将记录整个设计过程中的关键决策和知识点。第一篇从全局视角出发，介绍项目的架构全貌和流水线基础。</p>
<h3>人机协作模式</h3>
<p>整个开发过程采用了一种<strong>&quot;人类架构师 + AI 工程师&quot;</strong>的协作模式：</p>
<table>
<thead>
<tr>
<th>角色</th>
<th>职责</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>我（人类）</strong></td>
<td>提出功能需求、决定架构方向、审查关键设计、跑测试验收</td>
</tr>
<tr>
<td><strong>Agent（GitHub Copilot）</strong></td>
<td>编写全部 Verilog RTL、Python 工具链、测试用例、debug 修复</td>
</tr>
</tbody>
</table>
<p>典型的工作流是这样的：我说&quot;把 BPU 升级到 TAGE&quot;，agent 就会分析现有代码、设计 TAGE 结构、写出 RTL、连线到 cpu_top、跑回归测试确认 PASS。如果测试失败，agent 自己分析波形和日志定位问题并修复，直到全部通过。</p>
<p>这种模式下，<strong>agent 的代码产出速度非常快</strong>（几分钟内可以完成一个完整 feature），但<strong>架构决策的质量仍然取决于人类的判断</strong>——比如选择 Tomasulo 而非 Scoreboard、RS 深度设为 8 而非 4、TAGE 用 2 级而非 3 级，这些 tradeoff 需要对体系结构有理解才能做好。</p>
<hr />
<h2>项目整体结构</h2>
<pre><code>cpu20/
├── rtl/
│   ├── core/         # CPU 核心逻辑
│   │   ├── cpu_top.v     # 顶层流水线（1,436 行）
│   │   ├── bpu.v         # 分支预测单元 TAGE-2L（394 行）
│   │   ├── control.v     # 译码与控制信号
│   │   ├── forwarding.v  # 前递网络
│   │   ├── hazard.v      # 冒险检测
│   │   ├── ifq.v         # 指令取指队列（186 行）
│   │   ├── alu.v         # 32-bit ALU
│   │   ├── imm_gen.v     # 立即数生成
│   │   └── ...
│   └── mem/
│       ├── imem.v        # I-Cache 2-way SA
│       └── dmem.v        # D-Cache 2-way SA, dual-port
├── tb/
│   ├── tb_cpu.v          # Testbench（统计 CPI/分支/Cache 等）
│   └── programs/         # 测试程序 .hex
├── tools/
│   ├── asm.py            # 汇编器（支持 label、putchar）
│   ├── gen_benchmarks.py # Benchmark 生成
│   └── run_benchmarks.py # 自动化运行与统计
└── docs/</code></pre>
<p>整个项目使用 <strong>Icarus Verilog</strong> 仿真，<strong>Python</strong> 生成测试用例和收集性能数据，开发全程在 macOS 上完成。所有代码由 AI agent 在 VS Code 中通过 GitHub Copilot agent mode 编写和调试。</p>
<hr />
<h2>选择 RV32I</h2>
<p>RISC-V 是一个开放的指令集架构。选择 RV32I base integer 子集，是因为它：</p>
<ul>
<li><strong>足够小</strong>：只有 40 条指令，decode 逻辑简洁</li>
<li><strong>足够完整</strong>：支持 ALU、分支、load/store、跳转，能运行任意整数程序</li>
<li><strong>正交设计</strong>：opcode 字段对齐规整，非常适合硬件实现</li>
</ul>
<p>RV32I 的指令格式一共 6 种（R/I/S/B/U/J），每条指令固定 32 位宽。这对流水线的 decode 阶段非常友好——不需要像 x86 那样处理变长指令。</p>
<pre><code>R-type:  [funct7 | rs2 | rs1 | funct3 | rd | opcode]
I-type:  [    imm[11:0]  | rs1 | funct3 | rd | opcode]
S-type:  [imm[11:5]| rs2 | rs1 | funct3 | imm[4:0] | opcode]
B-type:  [imm bits | rs2 | rs1 | funct3 | imm bits | opcode]
U-type:  [        imm[31:12]          | rd | opcode]
J-type:  [        imm bits            | rd | opcode]</code></pre>
<p>在 <code>defines.v</code> 中，所有 opcode 都被定义为宏常量：</p>
<pre><code class="language-verilog">`define OP_LUI     7&#039;b0110111
`define OP_AUIPC   7&#039;b0010111
`define OP_JAL     7&#039;b1101111
`define OP_JALR    7&#039;b1100111
`define OP_BRANCH  7&#039;b1100011
`define OP_LOAD    7&#039;b0000011
`define OP_STORE   7&#039;b0100011
`define OP_IMM     7&#039;b0010011
`define OP_REG     7&#039;b0110011
`define OP_SYSTEM  7&#039;b1110011</code></pre>
<hr />
<h2>8 级流水线</h2>
<p>经典教科书上的 RISC 流水线是 5 级（IF → ID → EX → MEM → WB）。</p>
<h3>从 5 级到 8 级的演进</h3>
<table>
<thead>
<tr>
<th>阶段</th>
<th>5 级</th>
<th>8 级</th>
<th>拆分原因</th>
</tr>
</thead>
<tbody>
<tr>
<td>IF</td>
<td>✅</td>
<td>✅</td>
<td>取指</td>
</tr>
<tr>
<td>ID</td>
<td>1 级</td>
<td><strong>ID1 + ID2</strong></td>
<td>ID1 做指令缓冲和对齐（IFQ），ID2 做译码+读寄存器</td>
</tr>
<tr>
<td>EX</td>
<td>1 级</td>
<td><strong>EX1 + EX2</strong></td>
<td>拆分 ALU 与地址生成，降低关键路径延迟</td>
</tr>
<tr>
<td>MEM</td>
<td>1 级</td>
<td><strong>AGU + MEM</strong></td>
<td>地址生成单独一级，MEM 纯做存储器访问</td>
</tr>
<tr>
<td>WB</td>
<td>✅</td>
<td>✅</td>
<td>写回</td>
</tr>
</tbody>
</table>
<p>拆分的核心考虑是：</p>
<ol>
<li>
<p><strong>降低关键路径</strong>：5 级流水线的 EX 阶段同时做 ALU 计算和分支判断，路径太长。拆成 EX1（ALU + 分支）和 EX2（结果缓冲）后，单级延迟更短，有利于提高时钟频率。</p>
</li>
<li>
<p><strong>为双发射铺路</strong>：ID1 引入 IFQ（指令取指队列），可以缓冲多条指令，为 ID2 阶段的双发射配对提供基础。IFQ 深度为 4，每周期最多 push 2 条、pop 2 条。</p>
</li>
<li>
<p><strong>AGU 独立</strong>：地址生成（rs1 + offset）与数据存储器读写分离，使 store 数据的前递和 load 的符号扩展逻辑更清晰。</p>
</li>
</ol>
<h3>8 级流水线全景</h3>
<pre><code>                         ┌─ slot0: EX1 → EX2 → AGU → MEM → WB
 IF → ID1 → ID2(decode) ┤
                         └─ slot1: EX1b → WB (1-cycle shortcut)</code></pre>
<ul>
<li><strong>IF</strong>：PC 生成 + I-Cache 读取 + 分支预测查询</li>
<li><strong>ID1</strong>：指令推入 IFQ，BPU 结果跟随指令一起入队</li>
<li><strong>ID2</strong>：从 IFQ 弹出 1~2 条指令，译码、读寄存器、冒险检测、配对判定</li>
<li><strong>EX1</strong>：ALU 计算、分支/跳转解析、分支预测验证</li>
<li><strong>EX2</strong>：EX 结果缓冲，为 AGU 提供稳定的输入</li>
<li><strong>AGU</strong>：访存地址生成（load/store 的 base + offset）</li>
<li><strong>MEM</strong>：D-Cache 读写，load 数据符号/零扩展</li>
<li><strong>WB</strong>：结果写回寄存器堆</li>
</ul>
<hr />
<h2>流水线的核心挑战：Hazard 处理</h2>
<p>流水线的性能优势来自指令重叠执行，但这也引入了三类冒险（hazard）：</p>
<h3>1. 数据冒险（Data Hazard）</h3>
<p>最常见的是 <strong>RAW（Read After Write）</strong> 冒险：后面的指令需要读取前面指令尚未写回的结果。</p>
<pre><code>ADD  x1, x2, x3    # 写 x1
SUB  x4, x1, x5    # 读 x1 —— 此时 ADD 还在 EX 阶段，x1 尚未更新</code></pre>
<h4>前递（Forwarding）</h4>
<p>解决方案是<strong>前递网络</strong>（<code>forwarding.v</code>）：直接把 EX/AGU/MEM 阶段计算好的结果旁路回 ID 阶段使用的操作数，无需等到 WB 写回。</p>
<p>我们的前递网络有 <strong>4 级优先级</strong>，对 rs1 和 rs2 分别独立选择：</p>
<table>
<thead>
<tr>
<th>优先级</th>
<th>来源</th>
<th>信号前缀</th>
</tr>
</thead>
<tbody>
<tr>
<td>最高</td>
<td>EX1→EX2 级间</td>
<td><code>ex_mem_*</code></td>
</tr>
<tr>
<td>次高</td>
<td>EX2→AGU 级间</td>
<td><code>ex2_agu_*</code></td>
</tr>
<tr>
<td>再次</td>
<td>AGU→MEM 级间</td>
<td><code>agu_mem_*</code></td>
</tr>
<tr>
<td>最低</td>
<td>MEM→WB 级间</td>
<td><code>mem_wb_*</code></td>
</tr>
</tbody>
</table>
<pre><code class="language-verilog">// forwarding.v 中的优先级逻辑（rs1 为例）
if (ex_mem_reg_write &amp;&amp; ex_mem_rd == id_rs1)
    fwd_a = 2&#039;b01;      // 从 EX 前递
else if (ex2_agu_reg_write &amp;&amp; ex2_agu_rd == id_rs1)
    fwd_a = 2&#039;b10;      // 从 AGU 前递
else if (agu_mem_reg_write &amp;&amp; agu_mem_rd == id_rs1)
    fwd_a = 2&#039;b11;      // 从 MEM 前递
else
    fwd_a = 2&#039;b00;      // 无前递，使用寄存器值</code></pre>
<h4>Load-Use Stall</h4>
<p>有一种情况前递也解决不了：<strong>load-use 冒险</strong>。Load 指令的数据要到 MEM 阶段才能从 D-Cache 读出，但紧随其后的指令在 EX 阶段就需要用到这个值——差了一个周期，无法前递。</p>
<pre><code>LW   x1, 0(x2)     # MEM 阶段才拿到 x1 的值
ADD  x3, x1, x4    # EX 阶段就需要 x1 —— 必须 stall 1 拍</code></pre>
<p><code>hazard.v</code> 检测这种情况并插入一个 bubble：</p>
<pre><code class="language-verilog">// 两级 load-use 检测
wire hazard_id_ex  = id_ex_mem_read
                   &amp;&amp; ((id_use_rs1 &amp;&amp; id_ex_rd == id_rs1)
                    || (id_use_rs2 &amp;&amp; id_ex_rd == id_rs2));

wire hazard_ex_agu = ex_agu_mem_read
                   &amp;&amp; ((id_use_rs1 &amp;&amp; ex_agu_rd == id_rs1)
                    || (id_use_rs2 &amp;&amp; ex_agu_rd == id_rs2));

assign stall = hazard_id_ex || hazard_ex_agu;</code></pre>
<p>注意 <code>id_use_rs1</code> / <code>id_use_rs2</code> 信号用于精确过滤——像 <code>LUI</code> 这种不使用源寄存器的指令不会触发虚假 stall。</p>
<h3>2. 控制冒险（Control Hazard）</h3>
<p>分支/跳转指令需要到 <strong>EX1 阶段</strong> 才能解析目标地址和方向。如果预测错误，已经进入流水线的后续指令都是无效的，需要 flush。</p>
<p>在 8 级流水线中，一次分支 misprediction 会浪费 <strong>3~4 个周期</strong>（从 IF 到 EX1 的流水线深度）。这就是为什么分支预测对性能至关重要——后续博客会详细讨论 TAGE 预测器。</p>
<h3>3. 结构冒险（Structural Hazard）</h3>
<p>当两条指令需要同时使用同一个硬件资源时产生。在我们的设计中：</p>
<ul>
<li><strong>寄存器堆</strong>：有足够多的读写端口，不会冲突</li>
<li><strong>D-Cache</strong>：提供双端口（Port A 读写 + Port B 只读），slot0 和 slot1 可以同时访存</li>
<li><strong>ALU</strong>：slot0 和 slot1 各有独立的 ALU 实例</li>
</ul>
<p>因此结构冒险在本设计中基本不存在。</p>
<hr />
<h2>双发射（Dual-Issue）简介</h2>
<p>单发射 CPU 的 IPC 上限是 1.0。要突破这个限制，需要每周期发射多条指令。我们的 CPU 在 ID2 阶段同时从 IFQ 弹出两条指令：</p>
<ul>
<li><strong>Slot0</strong>（主通道）：支持所有指令类型</li>
<li><strong>Slot1</strong>（辅助通道）：支持 ALU、load、store、branch</li>
</ul>
<p>配对条件由 ID2 阶段检查：</p>
<ol>
<li>Slot1 指令类型必须是 ALU/load/store/branch（不能是 JAL/JALR/ECALL）</li>
<li>两条指令之间无 RAW 依赖（slot0 的 rd ≠ slot1 的 rs1/rs2）</li>
<li>两条指令之间无 WAW 冲突（rd 不同）</li>
<li>没有 load-use 冒险阻塞</li>
</ol>
<p>实测数据中，<code>memcpy_64w</code>（连续 LW/SW 对）的双发射率最高达 <strong>73%</strong>，而分支密集的 <code>sum_1_to_100</code> 只有 34%。详细的双发射设计和 pair-block 分析将在第 2 篇中展开。</p>
<hr />
<h2>Benchmark 一览</h2>
<p>为了验证 CPU 的正确性和衡量性能，我们构建了一套完整的 benchmark 套件：</p>
<table>
<thead>
<tr>
<th>Benchmark</th>
<th>特点</th>
<th style="text-align: right;">Cycles</th>
<th style="text-align: right;">CPI</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>fib_20</code></td>
<td>纯寄存器循环</td>
<td style="text-align: right;">157</td>
<td style="text-align: right;">1.81</td>
</tr>
<tr>
<td><code>memcpy_64w</code></td>
<td>连续 LW/SW</td>
<td style="text-align: right;">401</td>
<td style="text-align: right;">1.53</td>
</tr>
<tr>
<td><code>bsort_16</code></td>
<td>嵌套循环 + 条件交换</td>
<td style="text-align: right;">1,515</td>
<td style="text-align: right;">1.80</td>
</tr>
<tr>
<td><code>crc32_64b</code></td>
<td>位操作密集</td>
<td style="text-align: right;">4,348</td>
<td style="text-align: right;">1.86</td>
</tr>
<tr>
<td><code>dhrystone_lite</code></td>
<td>字符串/函数调用/分支</td>
<td style="text-align: right;">7,546</td>
<td style="text-align: right;">1.84</td>
</tr>
<tr>
<td><code>coremark_lite</code></td>
<td>链表 + 状态机 + CRC16</td>
<td style="text-align: right;">2,984</td>
<td style="text-align: right;">1.62</td>
</tr>
<tr>
<td><code>qsort_32</code></td>
<td>快排 + 显式栈</td>
<td style="text-align: right;">7,515</td>
<td style="text-align: right;">1.93</td>
</tr>
<tr>
<td><code>sieve_256</code></td>
<td>Eratosthenes 筛法</td>
<td style="text-align: right;">4,996</td>
<td style="text-align: right;">2.43</td>
</tr>
<tr>
<td><code>hello_uart</code></td>
<td>MMIO 输出字符串</td>
<td style="text-align: right;">105</td>
<td style="text-align: right;">2.76</td>
</tr>
</tbody>
</table>
<blockquote>
<p>注：以上数据来自 main 分支（in-order dual-issue）。feature/ooo 分支（out-of-order）的 CPI 显著更低，6/9 benchmarks 达到 CPI &lt; 1.0。</p>
</blockquote>
<p>所有 benchmark 的 hex 文件由 Python 汇编器 (<code>asm.py</code>) 生成，支持 label 解析、<code>li</code> 伪指令、<code>putchar</code>/<code>puts</code> MMIO 输出等功能。</p>
<hr />
<h2>小结</h2>
<p>这一篇介绍了项目的全貌：</p>
<ul>
<li><strong>8 级流水线</strong>：IF → ID1 → ID2 → EX1 → EX2 → AGU → MEM → WB</li>
<li><strong>三类冒险处理</strong>：前递网络（4 级优先级）、load-use stall、分支 flush</li>
<li><strong>双发射基础</strong>：slot0 全功能 + slot1 辅助通道</li>
<li><strong>验证体系</strong>：15 benchmarks + 200 随机回归</li>
</ul>
<p>后续文章将深入每个子系统：</p>
<table>
<thead>
<tr>
<th>篇目</th>
<th>主题</th>
</tr>
</thead>
<tbody>
<tr>
<td>第 2 篇</td>
<td>双发射设计 — IFQ、配对规则、pair-block 分析</td>
</tr>
<tr>
<td>第 3 篇</td>
<td>分支预测 — 从 Bimodal 到 TAGE</td>
</tr>
<tr>
<td>第 4 篇</td>
<td>Cache 层次 — 2-way SA I$/D$</td>
</tr>
<tr>
<td>第 5 篇</td>
<td>乱序执行 — Tomasulo + ROB</td>
</tr>
<tr>
<td>第 6 篇</td>
<td>验证与性能 — Benchmark 结果分析</td>
</tr>
</tbody>
</table>
<hr />
<p><em>项目地址：<a href="https://github.com/HaibinLai/simple-CPU">github.com/HaibinLai/simple-CPU</a></em></p>
