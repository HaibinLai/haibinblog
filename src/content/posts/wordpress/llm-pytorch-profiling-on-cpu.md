---
title: "LLM Pytorch Profiling on CPU"
description: "This passage is for my own profile for LLM meta-llama/Llama-3.2-1B We do an indepth analysis for LLM using pytorch profiler and Intel Vtune life is short, but it’s long enough to be foolish import torch from transformer…"
publishedAt: "2025-04-05 06:53:32"
category: "High Performance Computing"
tags: []
draft: false
slug: "llm-pytorch-profiling-on-cpu"
legacySlug: "llm-pytorch-profiling-on-cpu"
wordpressId: 692
sourceUrl: "https://www.haibinlaiblog.top/index.php/llm-pytorch-profiling-on-cpu/"
commentCount: 0
importedFromWordPress: true
---
<p><strong>This passage is for my own profile for LLM meta-llama/Llama-3.2-1B</strong></p>
<p>We do an indepth analysis for LLM using pytorch profiler and Intel Vtune</p>
<h2>life is short, but it’s long enough to be foolish</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041512199.png" alt="" /></p>
<pre><code class="language-python">import torch
from transformers import pipeline
from torch.profiler import profile, record_function, ProfilerActivity
from torch.utils.tensorboard import SummaryWriter  # 用于 TensorBoard 日志

# 设置随机种子以确保结果可重复
torch.manual_seed(123)

# 模型 ID
model_id = &quot;meta-llama/Llama-3.2-1B&quot;

# 创建文本生成 pipeline
print(&quot;Device set to use cpu&quot;)
pipe = pipeline(
    &quot;text-generation&quot;,
    model=model_id,
    torch_dtype=torch.bfloat16,
    device=&quot;cpu&quot;,
    max_new_tokens=256,
)

# 输入提示
prompt = &quot;The key to life is&quot;

# 使用 PyTorch Profiler 分析
with profile(
    activities=[ProfilerActivity.CPU],
    record_shapes=True,
    profile_memory=True,
    with_stack=True,
    on_trace_ready=torch.profiler.tensorboard_trace_handler(&quot;log_dir&quot;)  # 直接写入 TensorBoard 日志
) as prof:
    with record_function(&quot;model_inference&quot;):
        res = pipe(prompt)

# 输出生成结果
print(&quot;Generated text:&quot;, res[0][&quot;generated_text&quot;])

# 打印表格（可选）
print(prof.key_averages().table(sort_by=&quot;cpu_time_total&quot;, row_limit=10))
</code></pre>
<h2>Result analysis</h2>
<pre><code class="language-txt">-----------------------------------------------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------
                                                 Name    Self CPU %      Self CPU   CPU total %     CPU total  CPU time avg       CPU Mem  Self CPU Mem    # of Calls
-----------------------------------------------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------
                                      model_inference        16.49%        3.372s       100.00%       20.442s       20.442s           0 b      -7.37 Gb             1
                                         aten::linear         0.51%     105.276ms        55.05%       11.253s     389.015us     250.22 Mb           0 b         28928
                                         aten::matmul         1.13%     230.398ms        53.50%       10.936s     374.714us     250.25 Mb           0 b         29184
                                             aten::mm        51.54%       10.535s        51.58%       10.545s     364.509us     250.22 Mb     250.22 Mb         28928
                                           aten::sort         4.73%     967.869ms         4.90%        1.003s       3.916ms     375.75 Mb     125.25 Mb           256
                   aten::scaled_dot_product_attention         0.18%      35.865ms         3.51%     717.321ms     175.127us      16.31 Mb    -520.00 Kb          4096
    aten::_scaled_dot_product_flash_attention_for_cpu         2.84%     580.198ms         3.33%     681.456ms     166.371us      16.82 Mb    -100.39 Mb          4096
                                        aten::reshape         0.55%     111.473ms         2.83%     577.555ms      13.673us       4.17 Gb           0 b         42240
                                            aten::cat         1.83%     373.101ms         2.67%     546.518ms      31.923us       1.06 Gb       1.06 Gb         17120
                                             aten::to         0.34%      69.092ms         2.23%     455.568ms       9.413us     226.32 Mb           0 b         48399
-----------------------------------------------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------  ------------
Self CPU time total: 20.442s</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041511686.png" alt="" /></p>
<p><a href="https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/Linear.cpp">pytorch/aten/src/ATen/native/Linear.cpp at main · pytorch/pytorch</a></p>
<pre><code class="language-CPP">Tensor linear(const Tensor&amp; input, const Tensor&amp; weight, const std::optional&lt;Tensor&gt;&amp; bias_opt) {
  // _matmul_impl checks this again later, but _flatten_nd_linear does not work on scalars inputs,
  // so let&#039;s try to catch this here already
  const auto input_dim = input.dim();
  const auto weight_dim = weight.dim();
  TORCH_CHECK(input_dim != 0 &amp;&amp; weight_dim != 0,
              &quot;both arguments to linear need to be at least 1D, but they are &quot;,
              input_dim, &quot;D and &quot;, weight_dim, &quot;D&quot;);

  // See [Note: hacky wrapper removal for optional tensor]
  auto bias = bias_opt.has_value()
    ? c10::MaybeOwned&lt;Tensor&gt;::borrowed(*bias_opt)
    : c10::MaybeOwned&lt;Tensor&gt;::owned(std::in_place);
  if (input.is_mkldnn()) {
    return at::mkldnn_linear(input, weight, *bias);
  }
#if defined(C10_MOBILE)
  if (xnnpack::use_linear(input, weight, *bias)) {
    return xnnpack::linear(input, weight, *bias);
  }
#endif
  if (input_dim == 2 &amp;&amp; bias-&gt;defined()) {
    // Fused op is marginally faster.
    return at::addmm(*bias, input, weight.t());
  }
  if (bias-&gt;defined() &amp;&amp; !input.is_xla()) {
    // Also hit the fused path for contiguous 3D input, if not using xla
    // backend. Reshaping/flattening has some performance implications on xla.
    if (input.is_contiguous() &amp;&amp; input_dim == 3) {
      return _flatten_nd_linear(input, weight, *bias);
    } else if (input.is_contiguous() &amp;&amp; input.layout() == c10::kStrided &amp;&amp; weight.layout() == c10::kStrided &amp;&amp; bias-&gt;dim() == 1) {
      return _flatten_nd_linear(input, weight, *bias);
    } else if (parseLinearFlatten3d() &amp;&amp; input_dim == 3) {
      // If user forces flattening via env var
      const Tensor input_cont = input.contiguous();
      return _flatten_nd_linear(input_cont, weight, *bias);
    }
  }

  // Haibin: matmul!
  auto output = at::matmul(input, weight.t());

  if (bias-&gt;defined()) {
    // for composite compliance use out-of-place version of `add`
    if (isTensorSubclassLike(*bias) ||
        bias-&gt;_fw_grad(/*level*/ 0).defined()) {
      output = at::add(output, *bias);
    } else {
      output.add_(*bias);
    }
  }
  return output;
}</code></pre>
<h2>Mem</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041515122.png" alt="" /></p>
<p>aten::reshape 和 aten::cat 占用大量内存，尝试减少中间张量的创建或复用内存。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041513120.png" alt="" /></p>
<h3>Module</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041514401.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041516957.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041514676.png" alt="" /></p>
<p><a href="https://pytorch.ac.cn/tutorials/intermediate/torchserve_with_ipex.html">https://pytorch.ac.cn/tutorials/intermediate/torchserve_with_ipex.html</a>
<a href="https://pytorch.org/tutorials/intermediate/torchserve_with_ipex.html">https://pytorch.org/tutorials/intermediate/torchserve_with_ipex.html</a></p>
<h2>ATen</h2>
<pre><code class="language-CPP">#pragma once

#include algorithm
#include atomic
#include cstddef
#include exception

#ifdef _OPENMP
#define INTRA_OP_PARALLEL

#include omp.h
#endif

#ifdef _OPENMP
namespace at::internal {
template typename F
inline void invoke_parallel(
    int64_t begin,
    int64_t end,
    int64_t grain_size,
    const F&amp; f) {
  std::atomic_flag err_flag = ATOMIC_FLAG_INIT;
  std::exception_ptr eptr;

#pragma omp parallel
  {
    // choose number of tasks based on grain size and number of threads
    // can&#039;t use num_threads clause due to bugs in GOMP&#039;s thread pool (See
    // #32008)
    int64_t num_threads = omp_get_num_threads();
    if (grain_size &gt; 0) {
      num_threads = std::min(num_threads, divup((end - begin), grain_size));
    }

    int64_t tid = omp_get_thread_num();
    int64_t chunk_size = divup((end - begin), num_threads);
    int64_t begin_tid = begin + tid * chunk_size;
    if (begin_tid &lt; end) {
      try {
        internal::ThreadIdGuard tid_guard(tid);
        f(begin_tid, std::min(end, chunk_size + begin_tid));
      } catch (...) {
        if (!err_flag.test_and_set()) {
          eptr = std::current_exception();
        }
      }
    }
  }
  if (eptr) {
    std::rethrow_exception(eptr);
  }
}
} // namespace at::internal
#endif // _OPENMP</code></pre>
<h2>VTune Profiler</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041520037.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041518129.png" alt="" /></p>
<h3>Lock</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041518264.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041518639.png" alt="" /></p>
<p>This is the most imp function:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041519756.png" alt="" /></p>
<p>From intel x86-64 instruction book:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041519052.png" alt="" /></p>
<p>Instruction Content:  </p>
<ul>
<li><code>f0</code>: This is the machine code for the <code>lock</code> prefix, indicating that the instruction is an atomic operation. It locks the bus or cache to ensure thread safety in a multi-core environment.  </li>
<li><code>0f b1</code>: This is the opcode for <code>cmpxchg</code> (Compare and Exchange), used to compare and swap values.  </li>
<li><code>15 d0 8a 01</code>: This is a 32-bit relative address offset, indicating that the target memory address of the operation is located at the current instruction pointer (RIP) plus <code>0x18ad0</code>.  </li>
<li><code>%edx</code>: The target register, indicating that the value to be compared with the memory value and potentially swapped is stored in the <code>edx</code> register.</li>
</ul>
<h2>Token Generation</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041520480.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041521551.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041521680.png" alt="" /></p>
<h3>NUMA</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041521262.png" alt="" />
Good for 2 core</p>
<h3>BLAS</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041529092.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041529405.png" alt="" /></p>
<p>bound: for loading data from mem to CPU reg
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041529172.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041529400.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041751764.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041751848.png" alt="" /></p>
<h2>Intel</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041752894.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041751831.png" alt="" /></p>
<p>Intel Use DNN as an Example. But what about LLM? Don’t know yet
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504041752426.png" alt="" /></p>
