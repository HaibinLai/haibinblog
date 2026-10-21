---
title: "Pytorch ATen Matmul CPU 算子解析"
description: "在上一期 https://www.haibinlaiblog.top/index.php/llm-on-cpu/ ， 我们探讨了各个LLM的具体结构，今天我们就来探寻这些结构/算子的底层实现。 上一期我们探讨的架构：LLM各阶段的代码在pytorch的实现 Pytorch调用栈解析 所以你这边就能看到Pytorch的调用核心逻辑了。它会先决定做什么算子，什么数据。然后回call_impl，此时它会根据之前的config（比如用GPU还…"
publishedAt: "2025-06-12 06:10:47"
category: "Frameworks"
tags: ["pytorch"]
draft: false
slug: "pytorch-aten-matmul-cpu-算子解析"
legacySlug: "pytorch-aten-matmul-cpu-算子解析"
wordpressId: 846
sourceUrl: "https://www.haibinlaiblog.top/index.php/pytorch-aten-matmul-cpu-%e7%ae%97%e5%ad%90%e8%a7%a3%e6%9e%90/"
commentCount: 0
importedFromWordPress: true
---
<p>在上一期 <a href="https://www.haibinlaiblog.top/index.php/llm-on-cpu/">https://www.haibinlaiblog.top/index.php/llm-on-cpu/</a> ， 我们探讨了各个LLM的具体结构，今天我们就来探寻这些结构/算子的底层实现。</p>
<p>上一期我们探讨的架构：LLM各阶段的代码在pytorch的实现
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250611165121785.png" alt="" /></p>
<h2>Pytorch调用栈解析</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250611165028351.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250611170718675.png" alt="" /></p>
<p>所以你这边就能看到Pytorch的调用核心逻辑了。它会先决定做什么算子，什么数据。然后回call_impl，此时它会根据之前的config（比如用GPU还是CPU，有多少线程/SM）,然后调用具体的一个底层实现。</p>
<p>引用一句话：
要学习ATen其实非常简单，在<code>aten</code>目录里面乱扒乱翻一通，挨个文件夹都点开瞅两眼，把所有的<code>README.md</code>都读一遍，就会发现，实际上ATen的算符是怎么定义的，实际上，已经在<code>aten/src/ATen/README.md</code>文件中，进行了非常详细的说明。</p>
<p><a href="https://pytorch.org/cppdocs/">PyTorch C++ API — PyTorch main documentation</a></p>
<p>• <strong>ATen: The foundational tensor and mathematical operation library on which all else is built.</strong></p>
<p><strong>ATen is fundamentally a tensor library, on top of which almost all other Python and C++ interfaces in PyTorch are built. It provides a core <code>Tensor</code> class, on which many hundreds of operations are defined. Most of these operations have both CPU and GPU implementations, to which the <code>Tensor</code> class will dynamically dispatch based on its type. A small example of using ATen could look as follows:</strong></p>
<p>huggingface example:</p>
<pre><code class="language-python">import torch
from transformers import pipeline
import time

model_id = &quot;meta-llama/Llama-3.2-1B&quot;
torch.manual_seed(123)

pipe = pipeline(
    &quot;text-generation&quot;,
    model=model_id,
    torch_dtype=torch.bfloat16,
    device_map=&quot;auto&quot;,
    max_new_tokens=256,
)

start = time.time()
res = pipe(&quot;The key to life is&quot;)</code></pre>
<h2>ATen Matmul 解析</h2>
<p><a href="https://github.com/hughperkins/pytorch-pytorch/blob/c902f1cf980eef27541f3660c685f7b59490e744/aten/src/ATen/native/NativeFunctions.cpp#L361">pytorch-pytorch/aten/src/ATen/native/NativeFunctions.cpp at c902f1cf980eef27541f3660c685f7b59490e744 · hughperkins/pytorch-pytorch</a></p>
<pre><code class="language-CPP">/*
Matrix product of two Tensors.
The behavior depends on the dimensionality of the Tensors as follows:
- If both Tensors are 1-dimensional, the dot product (scalar) is returned.
- If both arguments are 2-dimensional, the matrix-matrix product is returned.
- If the first argument is 1-dimensional and the second argument is 2-dimensional,
  a 1 is prepended to its dimension for the purpose of the matrix multiply.
  After the matrix multiply, the prepended dimension is removed.
- If the first argument is 2-dimensional and the second argument is 1-dimensional,
  the matrix-vector product is returned.
- If both arguments are at least 1-dimensional and at least one argument is
  N-dimensional (where N &gt; 2), then a batched matrix multiply is returned.  If the first
  argument is 1-dimensional, a 1 is prepended to its dimension for the purpose of the
  batched matrix multiply and removed after.  If the second argument is 1-dimensional, a
  1 is appended to its dimension for the purpose of the batched matrix multiple and removed after.
  The non-matrix (i.e. batch) dimensions are broadcasted (and thus
  must be broadcastable).  For example, if tensor1 is a (j x 1 x n x m) Tensor
  and tensor2 is a (k x m x p) Tensor, the returned tensor will be an (j x k x n x p) Tensor.
*/
Tensor matmul(const Tensor &amp; tensor1, const Tensor &amp; tensor2) {
  auto dim_tensor1 = tensor1.dim();
  auto dim_tensor2 = tensor2.dim();

  if (dim_tensor1 == 1 &amp;&amp; dim_tensor2 == 1) {
    return tensor1.dot(tensor2);
  } else if (dim_tensor1 == 2 &amp;&amp; dim_tensor2 == 1) {
    return tensor1.mv(tensor2);
  } else if (dim_tensor1 == 1 &amp;&amp; dim_tensor2 == 2) {
    return tensor1.unsqueeze(0).mm(tensor2).squeeze_(0);
  } else if (dim_tensor1 == 2 &amp;&amp; dim_tensor2 == 2) {
    return tensor1.mm(tensor2);
  } else if (dim_tensor1 &gt;= 3 &amp;&amp; (dim_tensor2 == 1 || dim_tensor2 == 2)) {
    // optimization: use mm instead of bmm by folding tensor1&#039;s batch into
    // its leading matrix dimension.

    Tensor t2 = dim_tensor2 == 1 ? tensor2.unsqueeze(-1) : tensor2;
    auto size1 = tensor1.sizes();
    auto size2 = t2.sizes();
    std::vector&lt;int64_t&gt; output_size;
    output_size.insert(output_size.end(), size1.begin(), size1.end() - 1);
    output_size.insert(output_size.end(), size2.end() - 1, size2.end());

    // fold the batch into the first dimension
    Tensor t1 = tensor1.contiguous().view({-1, size1[size1.size() - 1]});

    auto output = t1.mm(t2).view(output_size);
    if (dim_tensor2 == 1) {
      output = output.squeeze(-1);
    }
    return output;
  } else if ((dim_tensor1 &gt;= 1 &amp;&amp; dim_tensor2 &gt;= 1) &amp;&amp; (dim_tensor1 &gt;= 3 || dim_tensor2 &gt;= 3)) {
    // We are multiplying b1 x n x m1 by x2 x m2 x p (where b1 can be a list);
    // we track m1 vs m2 separately even though they must match for nicer error messages
    int64_t n = dim_tensor1 &gt; 1 ? tensor1.size(-2) : 1;
    int64_t m1 = tensor1.size(-1);
    IntList batch_tensor1(tensor1.sizes().data(), std::max&lt;int64_t&gt;(dim_tensor1 - 2, 0));
    int64_t m2 = dim_tensor2 &gt; 1 ? tensor2.size(-2) : 1;
    int64_t p = tensor2.size(-1);
    IntList batch_tensor2(tensor2.sizes().data(), std::max&lt;int64_t&gt;(dim_tensor2 - 2, 0));

    // expand the batch portion (i.e. cut off matrix dimensions and expand rest)
    std::vector&lt;int64_t&gt; expand_batch_portion = infer_size(batch_tensor1, batch_tensor2);

    std::vector&lt;int64_t&gt; tensor1_expand_size(expand_batch_portion);
    tensor1_expand_size.insert(tensor1_expand_size.end(), {n, m1});

    std::vector&lt;int64_t&gt; tensor2_expand_size(expand_batch_portion);
    tensor2_expand_size.insert(tensor2_expand_size.end(), {m2, p});

    int expand_batch_product = std::accumulate(expand_batch_portion.begin(), expand_batch_portion.end(),
                                               1, std::multiplies&lt;int64_t&gt;());

    std::vector&lt;int64_t&gt; tensor1_bmm_view({expand_batch_product});
    tensor1_bmm_view.insert(tensor1_bmm_view.end(), {n, m1});

    std::vector&lt;int64_t&gt; tensor2_bmm_view({expand_batch_product});
    tensor2_bmm_view.insert(tensor2_bmm_view.end(), {m2, p});

    // flatten expanded batches
    Tensor tensor1_expanded = tensor1.expand(tensor1_expand_size).contiguous().view(tensor1_bmm_view);
    Tensor tensor2_expanded = tensor2.expand(tensor2_expand_size).contiguous().view(tensor2_bmm_view);

    Tensor output = tensor1_expanded.bmm(tensor2_expanded);

    // reshape batches back into result
    std::vector&lt;int64_t&gt; total_expansion(expand_batch_portion);
    total_expansion.insert(total_expansion.end(), {n, p});
    return maybeSqueeze(output.view(total_expansion), dim_tensor1, dim_tensor2);
  }

  runtime_error(&quot;both arguments to matmul need to be at least 1D, but they are %dD and %dD&quot;,
                dim_tensor1, dim_tensor2);

}</code></pre>
<p>是的，这段代码是 <strong>PyTorch (ATen)</strong> 中实现 <code>matmul</code> 操作的一部分，用于处理各种维度下的张量矩阵乘法。这是 <code>torch.matmul()</code> 的底层 C++ 实现，它通过判断输入张量维度的组合情况，选择对应的乘法逻辑并进行必要的维度扩展、变形等处理。</p>
<p>📌 <strong>主要逻辑简述：</strong></p>
<p>这个函数根据两个输入 <code>tensor1</code> 和 <code>tensor2</code> 的维度组合，选择不同的矩阵乘法策略：</p>
<p>✅ <strong>1. 一维 × 一维（向量点积）：</strong></p>
<pre><code class="language-cpp">if (dim_tensor1 == 1 &amp;&amp; dim_tensor2 == 1)
  return tensor1.dot(tensor2);</code></pre>
<ul>
<li><code>tensor1.shape = (N)</code>, <code>tensor2.shape = (N)</code></li>
<li>
<p>返回一个标量（dot product）。</p>
<p>✅ <strong>2. 二维 × 一维（矩阵-向量乘）：</strong></p>
<pre><code class="language-cpp">else if (dim_tensor1 == 2 &amp;&amp; dim_tensor2 == 1)
return tensor1.mv(tensor2);</code></pre>
</li>
<li><code>tensor1.shape = (M, N)</code>, <code>tensor2.shape = (N)</code></li>
<li>返回 <code>(M)</code> 向量。</li>
</ul>
<p>✅ <strong>3. 一维 × 二维（向量 × 矩阵）：</strong></p>
<pre><code class="language-cpp">else if (dim_tensor1 == 1 &amp;&amp; dim_tensor2 == 2)
  return tensor1.unsqueeze(0).mm(tensor2).squeeze_(0);</code></pre>
<ul>
<li><code>tensor1.shape = (N)</code>, <code>tensor2.shape = (N, P)</code></li>
<li>
<p>添加 batch 维 <code>(1, N)</code>，进行乘法后 squeeze 得到 <code>(P)</code>。</p>
<p>✅ <strong>4. 二维 × 二维（普通矩阵乘法）：</strong></p>
<pre><code class="language-cpp">else if (dim_tensor1 == 2 &amp;&amp; dim_tensor2 == 2)
return tensor1.mm(tensor2);</code></pre>
</li>
<li><code>tensor1.shape = (M, N)</code>, <code>tensor2.shape = (N, P)</code></li>
<li>
<p>返回 <code>(M, P)</code>。</p>
<p>✅ <strong>5. 高维 × 一维/二维（优化路径，使用 mm 而非 bmm）：</strong></p>
<pre><code class="language-cpp">else if (dim_tensor1 &gt;= 3 &amp;&amp; (dim_tensor2 == 1 || dim_tensor2 == 2)) {
...
// batch 折叠成第一维，使用 mm 而不是 bmm
}</code></pre>
</li>
<li>将 <code>tensor1</code> 的前几维 flatten 成 batch，再用 <code>mm</code> 计算，后 reshape。</li>
<li>
<p>比如 <code>tensor1: (B1 x B2 x N x M)</code>, <code>tensor2: (M)</code> → flatten 成 <code>(B1*B2, N, M)</code>，计算后 reshape 回 <code>(B1, B2, N)</code>。</p>
<p>✅ <strong>6. 通用的 batched matmul（高维广播+批量 bmm）：</strong></p>
<pre><code class="language-cpp">else if ((dim_tensor1 &gt;= 1 &amp;&amp; dim_tensor2 &gt;= 1) &amp;&amp; (dim_tensor1 &gt;= 3 || dim_tensor2 &gt;= 3)) {
...
// 广播 + 展平 + bmm + reshape
}</code></pre>
<p>🚩主要处理：</p>
</li>
<li>对 batch 维（除最后两个维度）进行广播。</li>
<li>张量 reshape 成 <code>(B, N, M)</code> 和 <code>(B, M, P)</code>，用 <code>bmm</code> 计算。</li>
<li>
<p>然后 reshape 成 <code>(batch_dims..., N, P)</code>。</p>
<p>✅ <strong>7. 错误处理：</strong></p>
<pre><code class="language-cpp">runtime_error(&quot;both arguments to matmul need to be at least 1D...&quot;);</code></pre>
</li>
<li>如果两个张量维度都小于 1，报错。</li>
</ul>
<h2>💡小结：这个函数做了什么？</h2>
<p>它是 <code>torch.matmul()</code> 在 ATen 层的 <strong>多维泛化实现</strong>，核心职责是：</p>
<ul>
<li>判断输入张量的维度模式；</li>
<li>自动扩展维度（如 unsqueeze）；</li>
<li>自动广播 batch 维；</li>
<li>选择合适的底层乘法函数（dot, mv, mm, bmm）；</li>
<li>在乘法前后 reshape 或 squeeze 以满足输出维度预期；</li>
<li>提供错误提示。</li>
</ul>
<h2>ATen 底层计算方法</h2>
<p><a href="https://github.com/pytorch/pytorch/blob/e3cf73ee4948468b5bd60b03df637f2986c108fd/aten/src/ATen/native/cpu/ReducedPrecisionFloatGemvFastPathKernel.cpp#L437">pytorch/aten/src/ATen/native/cpu/ReducedPrecisionFloatGemvFastPathKernel.cpp at e3cf73ee4948468b5bd60b03df637f2986c108fd · pytorch/pytorch</a></p>
<pre><code class="language-CPP">#if COMPILER_SUPPORTS_BF16_TARGET
TARGET_ARM_BF16_ATTRIBUTE float
dot_with_fp32_arith_bfdot(const BFloat16* vec1, const BFloat16* vec2, int64_t len) {
  auto reduced_sum = dot_with_fp32_arith_main_loop_bfdot(vec1, vec2, len);
  DOT_WITH_FP32_ARITH_TAIL_AFTER_MAIN_LOOP_BODY(_bfdot);
}
#endif // COMPILER_SUPPORTS_BF16_TARGET

float bf16_dot_with_fp32_arith(const at::BFloat16* vec1, const at::BFloat16* vec2, int64_t len) {
#if COMPILER_SUPPORTS_BF16_TARGET
  if (cpuinfo_has_arm_bf16()) {
    return dot_with_fp32_arith_bfdot(vec1, vec2, len);
  } else
#endif // COMPILER_SUPPORTS_BF16_TARGET
  {
    return dot_with_fp32_arith_no_bfdot(vec1, vec2, len);
  }
}

C10_ALWAYS_INLINE TARGET_ARM_BF16_ATTRIBUTE auto
dot_with_fp32_arith_main_loop_bfdot(
    const BFloat16* vec1,
    const BFloat16* vec2,
    int64_t len) {
  vec::VectorizedN&lt;float, kF32RegistersPerIteration&gt; sum(0);
  const auto len_aligned = len &amp; ~(kF32ElementsPerIteration - 1);
  for (int j = 0; j &lt; len_aligned ; j += kF32ElementsPerIteration) {
    const auto* vec1_ = vec1 + j;
    const auto* vec2_ = vec2 + j;
    ForcedUnrollTargetBFloat16&lt;kF32RegisterPairsPerIteration&gt;{}([vec1_, vec2_, &amp;sum](auto k)
                                                                C10_ALWAYS_INLINE_ATTRIBUTE TARGET_ARM_BF16_ATTRIBUTE {
      dot_with_fp32_arith_main_inner_loop_bfdot(vec1_, vec2_, sum, k);
    });
  }
  return reduce(sum);
}
#endif // COMPILER_SUPPORTS_BF16_TARGET

TARGET_ARM_BF16_ATTRIBUTE C10_ALWAYS_INLINE void
dot_with_fp32_arith_main_inner_loop_bfdot(
    const BFloat16* vec1,
    const BFloat16* vec2,
    vec::VectorizedN&lt;float, kF32RegistersPerIteration&gt;&amp; sum,
    int registerPairIndex) {
  // NOTE[Intrinsics in bfdot variant]: We can&#039;t use
  // vec::Vectorized&lt;BFloat16&gt;::loadu here because linux-aarch64 GCC
  // inexplicably can&#039;t convert Vectorized&lt;BFloat16&gt; to
  // bfloat16x8_t. I suspect a bug or incomplete
  // __attribute__((target)) implementation. Intrinsics should be fine
  // because we&#039;re using vbfdotq_f32 below anyway.
  const auto temp_vec1 = vld1q_bf16(
      reinterpret_cast&lt;const bfloat16_t*&gt;(
          &amp;vec1[registerPairIndex * vec::Vectorized&lt;BFloat16&gt;::size()]));
  const auto temp_vec2 = vld1q_bf16(
      reinterpret_cast&lt;const bfloat16_t*&gt;(
          &amp;vec2[registerPairIndex * vec::Vectorized&lt;BFloat16&gt;::size()]));
  sum[registerPairIndex] =
    vbfdotq_f32(sum[registerPairIndex], temp_vec1, temp_vec2);
}
</code></pre>
<table>
<thead>
<tr>
<th>内容</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td>操作类型</td>
<td>BFloat16 向量点积（dot product）</td>
</tr>
<tr>
<td>累加精度</td>
<td>Float32 精度累加（即更高精度累积）</td>
</tr>
<tr>
<td>使用硬件指令</td>
<td><code>vbfdotq_f32</code>（ARM SIMD BF16 点积指令）</td>
</tr>
<tr>
<td>多寄存器处理</td>
<td>使用 <code>VectorizedN</code> 同时处理多个寄存器对</td>
</tr>
<tr>
<td>展开策略</td>
<td>强制循环展开，减少分支，增强流水</td>
</tr>
</tbody>
</table>
<pre><code class="language-CPP">template &lt;typename T&gt;
C10_ALWAYS_INLINE float
dot_with_fp32_arith_no_bfdot(const T* vec1, const T* vec2, int64_t len) {
  auto reduced_sum = dot_with_fp32_arith_main_loop_no_bfdot(vec1, vec2, len);
  DOT_WITH_FP32_ARITH_TAIL_AFTER_MAIN_LOOP_BODY(_no_bfdot);
}
#undef DOT_WITH_FP32_ARITH_TAIL_AFTER_MAIN_LOOP_BODY

float fp16_dot_with_fp32_arith(const Half* vec1, const Half* vec2, int64_t len) {
  return dot_with_fp32_arith_no_bfdot(vec1, vec2, len);
}

template &lt;typename T&gt;
C10_ALWAYS_INLINE auto
dot_with_fp32_arith_main_loop_no_bfdot(
    const T* vec1,
    const T* vec2,
    int64_t len) {
  vec::VectorizedN&lt;float, kF32RegistersPerIteration&gt; sum(0);
  const auto len_aligned = len &amp; ~(kF32ElementsPerIteration - 1);
  for (int j = 0; j &lt; len_aligned ; j += kF32ElementsPerIteration) {
    const auto* vec1_ = vec1 + j;
    const auto* vec2_ = vec2 + j;
    c10::ForcedUnroll&lt;kF32RegisterPairsPerIteration&gt;{}([vec1_, vec2_, &amp;sum](auto k) C10_ALWAYS_INLINE_ATTRIBUTE {
      dot_with_fp32_arith_main_inner_loop_no_bfdot(vec1_, vec2_, sum, k);
    });
  }
  return reduce(sum);
}</code></pre>
<p>那么这里就是ATen 矩阵乘法最低层的实现了。可以看到这里它会导入数据，然后调用一个核心kernel
你可能好奇，那我缺的这个数据谁给我补啊？是这样的，他们会在计算前提前分好数据，然后进行计算</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250611170513080.png" alt="" /></p>
<h2>开始并行的代码：Parallel_for</h2>
<p>是的，这里就像是OpenMP分配的情况</p>
<p>parallel_for
<a href="https://github.com/pytorch/pytorch/blob/e3cf73ee4948468b5bd60b03df637f2986c108fd/aten/src/ATen/Parallel-inl.h#L10">pytorch/aten/src/ATen/Parallel-inl.h at e3cf73ee4948468b5bd60b03df637f2986c108fd · pytorch/pytorch</a></p>
<pre><code class="language-CPP">template &lt;class F&gt;
inline void parallel_for(
    const int64_t begin,
    const int64_t end,
    const int64_t grain_size,
    const F&amp; f) {
  TORCH_INTERNAL_ASSERT_DEBUG_ONLY(grain_size &gt;= 0);
  if (begin &gt;= end) {
    return;
  }

#ifdef INTRA_OP_PARALLEL
  at::internal::lazy_init_num_threads();
  const auto numiter = end - begin;
  const bool use_parallel =
      (numiter &gt; grain_size &amp;&amp; numiter &gt; 1 &amp;&amp; !at::in_parallel_region() &amp;&amp;
       at::get_num_threads() &gt; 1);
  if (!use_parallel) {
    internal::ThreadIdGuard tid_guard(0);
    c10::ParallelGuard guard(true);
    f(begin, end);
    return;
  }

  internal::invoke_parallel(
      begin, end, grain_size, [&amp;](int64_t begin, int64_t end) {
        c10::ParallelGuard guard(true);
        f(begin, end);
      });
#else
  internal::ThreadIdGuard tid_guard(0);
  c10::ParallelGuard guard(true);
  f(begin, end);
#endif
}</code></pre>
<p>internal
<a href="https://github.com/pytorch/pytorch/blob/e3cf73ee4948468b5bd60b03df637f2986c108fd/aten/src/ATen/ParallelNative.cpp">pytorch/aten/src/ATen/ParallelNative.cpp at e3cf73ee4948468b5bd60b03df637f2986c108fd · pytorch/pytorch</a></p>
<pre><code class="language-CPP">void invoke_parallel(
  const int64_t begin,
  const int64_t end,
  const int64_t grain_size,
  const std::function&lt;void(int64_t, int64_t)&gt;&amp; f) {
  at::internal::lazy_init_num_threads();

  size_t num_tasks = 0, chunk_size = 0;
  std::tie(num_tasks, chunk_size) =
      internal::calc_num_tasks_and_chunk_size(begin, end, grain_size);

  struct {
    std::atomic_flag err_flag = ATOMIC_FLAG_INIT;
    std::exception_ptr eptr;
    std::mutex mutex;
    std::atomic_size_t remaining{0};
    std::condition_variable cv;
  } state;

  auto task = [f, &amp;state, begin, end, chunk_size]
      (size_t task_id) {
    int64_t local_start = static_cast&lt;int64_t&gt;(begin + task_id * chunk_size);
    if (local_start &lt; end) {
      int64_t local_end = std::min(end, static_cast&lt;int64_t&gt;(chunk_size + local_start));
      try {
        ParallelRegionGuard guard(static_cast&lt;int&gt;(task_id));
        f(local_start, local_end);
      } catch (...) {
        if (!state.err_flag.test_and_set()) {
          state.eptr = std::current_exception();
        }
      }
    }
    {
      std::unique_lock&lt;std::mutex&gt; lk(state.mutex);
      if (--state.remaining == 0) {
        state.cv.notify_one();
      }
    }
  };
  state.remaining = num_tasks;
  _run_with_pool(std::move(task), num_tasks);

  // Wait for all tasks to finish.
  {
    std::unique_lock&lt;std::mutex&gt; lk(state.mutex);
    if (state.remaining != 0) {
      state.cv.wait(lk);
    }
  }
  if (state.eptr) {
    std::rethrow_exception(state.eptr);
  }
}

} // namespace internal
</code></pre>
<pre><code class="language-CPP">// Run lambda function `fn` over `task_id` in [0, `range`) with threadpool.
// `fn` will be called with params: task_id.
static void _run_with_pool(const std::function&lt;void(size_t)&gt;&amp; fn, size_t range) {
#ifndef C10_MOBILE
  for (const auto i : c10::irange(1, range)) {
    _get_intraop_pool().run([fn, i]() { fn(i); });
  }
  // Run the first task on the current thread directly.
  fn(0);
#else
  caffe2::PThreadPool* const pool = caffe2::pthreadpool();
  TORCH_INTERNAL_ASSERT(pool, &quot;Invalid thread pool!&quot;);

  pool-&gt;run(
    // PThreadPool::run() is blocking.  A std::function [const] reference to
    // this lambda cannot go out of scope before PThreadPool::run() returns.
    [&amp;fn](const size_t task_id) {
      fn(task_id);
    }, range);
#endif // C10_MOBILE
}</code></pre>
