---
title: SC 26 文章选读
description: SC 26 文章选读
publishedAt: 2026-11-23
updatedAt: 2026-11-23
category: Paper Reading
categories: []
tags:
  - Systems
  - SC
  - HPC
  - AI-Infra
draft: false
cardImage: https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-11/sc-26-wen-zhang-xuan-du/screenshot-2026-11-24-123817-238-04ba7edf3b59.png
showCitation: true
publisherRevision: 8cd96431-8676-42ba-be11-93357f6d4026
---

最近我有点难过，有点疑惑。我在思考做研究的目的，是否又回到之前思考的那样，追随自己原本的兴趣？在SC碰到了很多的新老朋友，感觉收获很多，不过旅游就没有很多了，毕竟都在Chicago。看看后面有机会再分享下。
## TileFlow

https://sc26.conference-program.com/presentation/?id=pap724&sess=sess204&utm_source=chatgpt.com

TileFlow: Data-Movement-Centric Optimization for Irregular GEMM on Matrix-Unit CPUs

这篇文章研究的是CPU上LLM推理里的GEMM加速。Irregular GEMM指的是里 长条 的矩阵乘法

Irregular general matrix multiplication (GEMM), where one or more dimensions are small, is common in emerging workloads including LLM inference and vector search. On mod ern CPUs with matrix units (e.g., Intel AMX), irregular GEMMs are data-movement bound: limited reuse and fragmented accesses make packing overhead and cross-NUMA traffic dominate ex ecution.

TileFlow takes a data movement-centric approach to address this mismatch via (1) a fine-grained packing–compute pipeline that performs on-demand packing and overlaps memory access with computation at micro kernel granularity, and (2) a placement-aware task assignment strategy that reduces cross-NUMA traffic under both NUMA local allocation and page interleaving, while preserving the existing memory placement policy. On two AMX-enabled CPUs, TileFlow achieves average speedups of 1.36×, 1.47×, and 1.39× on irregular GEMMs, Llama3-8B inference, and approximate nearest neighbor search, respectively

优化方法：1. 一个overlap访存和计算的kernel，用上Intel AMX
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/69ed1c0a-b850-4880-904a-5a2e00fad347.png)

2. NUMA 分块layout，Page Interleaving
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/9ce4408d-d8ad-404f-aba5-b40dfd6d5f74.png)

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/38419d23-7321-47f5-a7e4-9f2e95bbeccb.png)


做的很接近。估计还是看看写作。



## FastInfer

https://sc26.conference-program.com/presentation/?id=pap357&sess=sess204&utm_source=chatgpt.com


This paper proposes FastInfer, a new sparse LLM inference framework in the low-to-moderate sparsity regime. FastInfer introduces **a novel thread-centric encoding paradigm that rethinks sparse computation on Tensor Core Units from the perspective of per thread register requirements.** Based on this, we design the TFBE format, which enables low-overhead operand reconstruction. FastInfer integrates an affinity-aware data-movement mechanism and a triple-stage pipeline to better exploit modern GPU features and improve pipeline utilization. Compared with the state-of the-art SpInfer, FastInfer achieves geometric-mean speedups of 1.52× (up to 2.1×) for sparse kernels and 1.27× (up to 1.42×) for end-to-end sparse inference on H100.

针对剪枝后的LLM推理，本质还是在加速稀疏。

文章的主要技术应该还是用细粒度的线程管理对Tensor Core来做加速

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/a982bcb0-b8ea-4fcb-86ac-53bc05203392.png)

针对thread的加速技术，用bitmap的技术其实在之前graph加速领域的paper挺常见的。

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/4c5b2eac-e7e7-4ba8-980c-525e706c7aa6.png)
这张图讲的是 TFBE（Thread-Fragment Bitmap Encoding）：把稀疏矩阵数据按“线程最终需要哪些寄存器片段”来存，方便线程在运行时取回自己的操作数。目的是一个线程所需的稀疏数据集中存放。这样重建操作数时，它读取自己的位图和连续的值即可，减少跨 16 个 sub-block 查找数据的开销。位图只负责说明“哪里有值”，`Offset` 和 `Value` 则负责说明“值从哪里取、具体是多少”。更详细可以看GPT。

一个特制的SpMM Kernels
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/cadfee0d-8d92-4022-9857-c5470d3e43aa.png)


三级流水线。

FastInfer 让数据搬运、稀疏操作数重建（OR）和 WGMMA 计算同时推进。图 10 展示了这条三级流水线。

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/d55c488b-3346-4eb8-b6b9-0dcacd574bf0.png)

|        | 执行者               | 工作                                                |
| ------ | ----------------- | ———————————————————————— |
| **S0** | Warp 0，Producer   | 把压缩的 TFBE tile 和激活搬到共享内存                          |
| **S1** | Warp 1–4，Consumer | 做 OR：根据上一张图的位图、Offset 和 Value，重建寄存器中的稀疏 Operand A |
| **S2** | Warp 1–4，Consumer | 发出 WGMMA，用重建的 A 和共享内存中的激活 Operand B 计算            |


## Ultra-Low-Bit Quantized Models

https://sc26.conference-program.com/presentation/?id=pap858&sess=sess204&utm_source=chatgpt.com

The advent of ultra-low-bit LLM models, approach ing the perplexity and task accuracy of their full-precision counterparts, is ushering in a new era of LLM inference.

> is ushering in a new era of LLM inference 好词好句。

We first implement 2-bit microkernels for modern CPUs, achieving close-to-roofline performance. We integrate these microkernels into LLM inference pipelines and present end-to-end results with **2-bit models**, outperforming the state-of-the-art (SOTA) bitnet.cpp runtime by 2.2×, and deliver up to 7× speedup over 16-bit inference. We extend this work to Intel Xe2 GPUs where we implement mixed-precision 2-bit kernels, and show their performance to be close-to-optimal. Integrated into the vLLM framework, these kernels deliver up to 6.7× speedup over the 16-bit end-to-end pipeline across a range of models and Xe2 GPUs, thus pushing the envelope of LLM inference.

把 BF16 权重变成 2-bit，理论上权重数据量可降到约 **1/8**。这对逐 token 生成尤其有吸引力：小 batch 的矩阵向量乘法常常在等待读取权重。但压缩后还要解包、量化激活、执行乘法、还原输出；如果这些步骤太慢，省下的内存流量就换不成实际速度。

- **CPU：设计适合计算指令的权重布局。** 作者预先把 2-bit 权重排成 _VNNI4-interleaved_ 格式，使运行时能用少量移位、掩码和字节重排，把权重展开成 int8，随即用 VNNI 点积指令计算。重点是降低“解包后才能计算”的代价。
- **Intel Xe2 GPU：把转换融合进 GEMM。** Xe2 能原生执行 `int2 × int8 → int32`。面对模型实际使用的 BF16 激活，内核在寄存器中将激活量化为 int8、执行 DPAS、再把结果还原为 BF16，避免为每一步单独启动 GPU 内核。
- **接入完整推理框架。** CPU 方案接入 PyTorch-TPP，GPU 方案作为量化插件接入 vLLM；论文既测微内核，也测逐 token 生成的端到端吞吐量。

有CPU/GPU加速的对比。但是仔细看研究的design，应该是一个传统的研究，见下面研究的贡献。

We designed and implemented 2-bit GEMM kernels tailored for CPUs with AVX2 ISA. 
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/68af14d4-adf4-4c55-abeb-de397a3299f4.png)

We designed and implemented novel mixed precision GEMM kernels targeting Intel Xe2 GPUs. 
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/4c9d4e17-ecd9-48de-90bc-c5998a3803e3.png)


We integrated these ultra-low-bit GEMM kernels in SOTA end-to-end inference pipelines (PyTorch-TPP for CPU, vLLM for GPU).

We compare the CPU performance with the GPU 2-bit in ference within bitnet.cpp, which includes CUDA-optimized 2-bit kernels.


有趣的事情是，这个2bit kernel在CPU上都是mem bound，后面论文也讲到他们kernel打满了带宽。但是唯一的问题是，模型太小了。
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/fa689938-5e12-48d1-813f-20df80a59822.png)
> “To understand these results, we derive simple performance models.”
> “To alleviate this unpacking bottleneck”
> “the runtime efficiency for deploying ultra-low-bit models remains under-explored”

我们测试过更大的模型。
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/5c660f74-d065-456d-ae52-5e40a344c80d.png)




## BaGuaLu-2

https://sc26.conference-program.com/presentation/?id=pap287&sess=sess211

应该是场内非常火热的一篇paper，很多朋友都过来听了。

大概意思是，MoE 训练时 token 会动态地分配给专家，会让各 GPU 需要保存的激活量忽高忽低。BaGuaLu-2 在运行时按 micro-batch 调整显存使用策略，既应对偶发尖峰，也尽量保住平时的训练吞吐。

DescriptionFine-grained Mixture-of-Experts (MoE) is the de facto architecture for scaling large language models. However, dynamic expert load imbalance causes severe memory fluctuations, degrading training efficiency. Existing systems rely on static memory provisioning: they either over-provision, leaving GPU memory idle during normal execution, or under-provision, inviting out-of-memory crashes and costly manual rollbacks when load spikes occur.  
  
To address these challenges, we propose BaGuaLu-2, a large-scale MoE training system that eliminates this dilemma through flexible provisioning. By transforming memory allocation from a static, one-time tuning choice into a continuous and fine-grained control, BaGuaLu-2 grants exact activation memory on demand for each training batch. Furthermore, it offsets any dynamic management overhead through system optimizations. BaGuaLu-2 demonstrates exceptional scalability, training a model with 1,040 billion parameters across 12,288 GPUs while sustaining over 2 EFlops at 35% MFU. Compared with state-of-the-art systems, BaGuaLu-2 delivers 1.14× and 1.13× average throughput improvements over Megatron-Kwai and AdaPipe, respectively.

其实这个事情在今年上半年的时候在工业界我听过一些聊天，当时他们就在想用类似的方法去解决。很高兴能看到有比较成熟的方案出来。

传统系统通常在开训前选定激活显存策略：
- **预留得保守：**尖峰来时不容易 OOM，但平时做了过多重计算或卸载，浪费性能。
- **预留得激进：**平时跑得快，专家负载突然偏斜时却可能 OOM、重启。

论文观察到，明显的路由负载尖峰出现在训练里，此时我们给大量token训练过程中。因此，一直为最坏情况付费很不划算。（MoE的稀疏带来的2-8定律）因为 MoE 路由由当前 token 决定。偶尔一个 micro-batch 会把更多 token 送到同一 GPU 上的专家，使该 GPU 必须保存更多激活；而流水线已经保留着其他 micro-batch 的激活。这次额外增长叠加在原本就很高的占用上，就可能越过显存上限。

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/3e3c6c43-63ed-46de-9027-b684c53b8fcf.png)


BaGuaLu-2 怎么做：

1. 建立时间与显存的成本模型。它用每个算子的执行时间变化 \(\Delta t\) 和激活显存变化 \(\Delta m\) 估计整次迭代的显存曲线，判断何时会超过 GPU 容量。
2. 运行时分配 micro-batch 显存预算。根据当前路由负载和流水线阶段，决定哪些激活直接保存、哪些重计算、卸载到 CPU 或降低精度。目标是在不超过显存上限的条件下，尽量减少额外时间。
3. 把额外工作藏进流水线空隙。重计算和卸载本身会变慢。系统交错安排相邻 micro-batch 的前向、反向、卸载与恢复操作，让计算流和通信流尽可能重叠。论文图 7 很直观：先把超过显存上限的曲线压下来，再通过交错执行缩短被拉长的运行时间。

其实和我们最近做的一个方法比较接近，先根据trace去建模和推测，随后，在运行时进行预算分配，尽可能“削峰填谷”。
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/60e33543-9db6-458d-96d5-e170086f52fe.png)


BaGuaLu-2 需要决定何时重计算、卸载或量化激活。如图 5， 把这个决定变成两个可比较的量：曲线的高度对应显存压力，横向的长度对应执行时间。后续策略就是在显存峰值不超过设备容量的前提下，尽量少增加执行时间。
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/777a9705-8261-48b3-89ff-2588119d249d.png)

图5 BaGuaLu-2 的激活显存成本模型。

| 子图                  | 描述的层级                 | 读图方法                                                                                |
| ------------------- | --------------------- | ————————————————————————————————————————— |
| **(a) Operator**    | 单个算子                  | 用 \((\Delta t,\Delta m)\) 表示：运行花多久、让需保存的激活显存增加或减少多少。蓝色前向算子通常使曲线上升；红色反向算子释放激活，使曲线下降。 |
| **(b) Micro-batch** | 一个 micro-batch 内的一串算子 | 把各算子的变化接起来，得到较细的显存曲线；再用一个较简单的三角形概括前向累积显存、反向释放显存的过程。                                 |
| **(c) Iteration**   | 流水线中的多个 micro-batch   | **Warmup** 只有前向，激活不断堆积；**1F1B 稳态**前向增加、反向释放，曲线在较高水平上下波动；**Cooldown** 主要做反向，显存逐渐降下来。 |

削峰填谷：
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/e625e555-b07e-4be2-8d0b-1181eb2d291d.png)


作者在最多 **12,288 张 GPU** 上评估约 **1 万亿参数**的 MoE 配置，报告总吞吐 **2.012 EFLOPS**、约 **35% MFU**；相对所测的 Megatron-Kuai 和 AdaPipe，平均训练吞吐分别提高 **1.14×** 和 **1.13×**。显存预测的平均误差报告为 **1.56%**。

预测率很高。其实我们能看到，在LLM train和inference的过程里，很多指标和性能都是可预测的。主要的问题是，我们能拿他们做什么？这篇文章给了一个很好的解答。当然，另一个这篇文章的亮点，自然是万卡集群的优化。他们在万卡上应该踩了论文外更多的坑。


**问题：** 为什么少数迭代会冲出平常的显存峰值？

为什么会出现尖峰这样的pattern？我感觉是不是有机会从MoE可解释等方向能挖掘出来。
