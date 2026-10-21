---
title: "Can Tensor Cores Benefit Memory-Bound Kernels? (NO!)"
description: "本文学习自 Can Tensor Cores Benefit Memory-Bound Kernels? (NO!) https://dl.acm.org/doi/pdf/10.1145/3725798.3725803 这篇文章提出了一个有点惊人的观点：Tensorcore在面对 memory bound 的kernel/算子时效果并不是很好！文章用优秀的理论公式分析+实验验证了这点。读懂这篇文章，就能懂Roofline model的…"
publishedAt: "2025-11-02 04:08:20"
updatedAt: "2025-11-02 05:38:51"
category: "Paper Reading"
tags: ["GPU", "HPC", "RooflineModel", "Tensorcore"]
draft: false
slug: "can-tensor-cores-benefit-memory-bound-kernels-no"
legacySlug: "can-tensor-cores-benefit-memory-bound-kernels-no"
wordpressId: 1049
sourceUrl: "https://www.haibinlaiblog.top/index.php/can-tensor-cores-benefit-memory-bound-kernels-no/"
commentCount: 0
importedFromWordPress: true
---
<p>本文学习自 Can Tensor Cores Benefit Memory-Bound Kernels? (NO!) <a href="https://dl.acm.org/doi/pdf/10.1145/3725798.3725803">https://dl.acm.org/doi/pdf/10.1145/3725798.3725803</a></p>
<p>这篇文章提出了一个有点惊人的观点：Tensorcore在面对 memory bound 的kernel/算子时效果并不是很好！文章用优秀的理论公式分析+实验验证了这点。读懂这篇文章，就能懂Roofline model的大用处。</p>
<h2>GPU Arch</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251031224723544.png" alt="image.png" /></p>
<h2>Basic knowledge</h2>
<ol>
<li>
<p>Machine Balance
定义为硬件的计算性能P除以硬件的内存带宽：
\B = P / B</p>
</li>
<li>
<p>Roofline Model
operational intensity I 定义为 程序的computational work W 除以 程序的memory traffic Q
I = W / Q</p>
</li>
</ol>
<p>the model calculates attainable performance P as:</p>
<p>P = min(P, BxI)
这个公式能让我们看到程序的性能瓶颈。While operational intensity (I) characterizes a kernel’s computational density, machine balance (B) represents the hardware’s ratio of computational capability to memory bandwidth.</p>
<p>A kernel is compute bound if I &gt; B
A kernel is memory bound if I &lt; B</p>
<p>下图的图2句描述了不同硬件的roofline情况，以及不同的workload比如spmv，gemv，stencil在上面的计算情况
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251031225735319.png" alt="image.png" /></p>
<h2>Workload</h2>
<ol>
<li>Scale ，将矩阵/vector 乘以一个数</li>
</ol>
<p>B = k A</p>
<p>每个元素需要一次load，一次store，一次乘法操作。
W_scale = 1, Q_scale = 2 x D (D 代表data size, 如果是double，D=8)
在double 情况下，  I_scale = W/Q = 1/16, 因此我们经常用scale来测量memory bandwidth</p>
<ol start="2">
<li>SpMV
矩阵乘向量
y = Ax, x is a vector 1 x n, A is R m x n, y is a vector 1 x m</li>
</ol>
<p>对于稠密矩阵乘法GEMV：
W(GEMV) = m x n x 2
Q(GEMV) = (m x n + m + n) x D
I(GEMV) = W / Q, 约等于 2 / D = 1/ 4</p>
<p>对于稀疏矩阵乘法SpMV，可以使用CSR方法将矩阵A进行压缩</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251031235342511.png" alt="image.png" /></p>
<p>可以看到，在CSR作用下，计算强度 I 降到了 2/(D+I) = 1/6</p>
<ol start="3">
<li>Stencil 网格计算
2D stencil
v(i, j) = sum w_p,q x u (i+p, j+q)</li>
</ol>
<p>Q = 2 x D, W = 2 x S, I = S/D</p>
<p>For 2d5pt, S =5, I = 5/8 ( 8 byte load, 5 compute)</p>
<h2>Theoretical Analysis</h2>
<p>Time for compute: </p>
<p>T = W/P</p>
<p>time for memory:</p>
<p>T = Q/B</p>
<p>So </p>
<p>T_mem / T_cmp = (Q/B) / (W/P) = B/I</p>
<p>For memory bound:
T_mem &gt; T_compute
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251102035134413.png" alt="image.png" /></p>
<p>So we can compare overlap VS un-overlap</p>
<h3>Fully overlap</h3>
<p>对于完全overlap的情况：</p>
<p>T = max (T_compute, T_mem, T_others)</p>
<p>since for memory bound kernel, T_mem &gt; T_compute</p>
<p>So Time = max(T_memory, T_others)</p>
<p>it's no use accelerating T computation.</p>
<h3>un-overlap</h3>
<p>对于完全没有overlap情况，tensorcore加速也很小。</p>
<p>the calculate speed up</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251102035252410.png" alt="image.png" /></p>
<p>我个人感觉这里有点问题。你换了TensorCore后，你的machine Balance其实会发生改变的，此时你用了 T_mem / T_cmp = (Q/B) / (W/P) = B/I 这条公式来代换 T_mem，那这里的B（beta）应该是CUDA Core的Balance。</p>
<p>似乎不只是Tensor Core，其实所有的memory bound 的情况都能用这个公式？！</p>
<p><strong>Very possible that speed up less than 2.</strong></p>
<p>Our analysis covers the two extremes of memory-computation overlap. Real-world kernels typically exhibit partial overlap, resulting in speedups between 1× and 1.33× for double precision. Performance differences beyond that would require memory access optimizations, which, we argue, function equally when applied to tensor and CUDA cores since both access data through the register file (As Figure 1 shows).</p>
<h2>Experiments</h2>
<p>So is tensor core not very good in memory bound kernels?</p>
<p>Unfortunately, yes.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251102035839110.png" alt="image.png" /></p>
<p>SCALE: Figure 6 reveals consistent, though modest, performance degradation when using tensor cores compared to CUDA cores. Given that the computational time difference is negligible, this performance gap likely arises from suboptimal memory access patterns associated with tensor core usage on current GPU architectures.</p>
<p>SpMV: Figure 7 demonstrates that for datasets exceeding the L2 cache size, cuSPARSE (CUDA core) outperforms DASP (tensor core) on average. </p>
<p>Stencils: Figure 8 shows that equivalently optimized tensor core implementations generally underperform their CUDA core counterparts. </p>
<p><strong>Summary: While our goal was to verify the theoretical bounds, empirical evaluation reveals that tensor core implementations usually underperform their CUDA core counterparts.</strong></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251102035949828.png" alt="image.png" /></p>
<h2>Conclusion</h2>
<p>Through systematic theoretical and empirical analysis, we demonstrate that leveraging the tensor cores for computation in memorybound kernels fails to deliver sound performance benefits. Our theoretical analysis establishes an upper bound of 1.33× speedup for double-precision memory-bound kernels, while empirical results across SCALE, SpMV, and stencil show that tensor core implementations usually underperform their CUDA core counterparts. While these findings may temper expectations for using tensor cores in memory-bound kernels, efforts leveraging tensor cores still provide valuable insights for the design and utilization of matrix processing units in broader contexts.</p>
