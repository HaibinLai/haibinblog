---
title: "已弃坑：oneDNN架构解读"
description: "PS：这玩意已经不更新了，intel 放弃了哈哈哈哈哈哈哈。 https://zhuanlan.zhihu.com/p/20510564015 oneDNN是Intel开源的深度学习加速库，其前身为MKLDNN，对于Intel自家硬件（CPU以及GPU），oneDNN对神经网络算子的计算过程进行了针对性的优化处理，从而显著提升了神经网络算子在Intel硬件下的计算速度。在训练侧，oneDNN已作为第三方工具被目前几乎所有的主流训练框架…"
publishedAt: "2025-06-17 14:34:01"
updatedAt: "2025-06-17 14:42:45"
category: "Frameworks"
tags: []
draft: false
slug: "已弃坑-onednn架构解读"
legacySlug: "已弃坑：onednn架构解读"
wordpressId: 872
sourceUrl: "https://www.haibinlaiblog.top/index.php/%e5%b7%b2%e5%bc%83%e5%9d%91%ef%bc%9aonednn%e6%9e%b6%e6%9e%84%e8%a7%a3%e8%af%bb/"
commentCount: 0
importedFromWordPress: true
---
<p>PS：这玩意已经不更新了，intel 放弃了哈哈哈哈哈哈哈。</p>
<p><a href="https://zhuanlan.zhihu.com/p/20510564015">https://zhuanlan.zhihu.com/p/20510564015</a></p>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/06/image-1750142537486.png" alt="file" /></p>
<p>oneDNN是Intel开源的深度学习加速库，其前身为MKLDNN，对于Intel自家硬件（CPU以及GPU），oneDNN对神经网络算子的计算过程进行了针对性的优化处理，从而显著提升了神经网络算子在Intel硬件下的计算速度。在训练侧，oneDNN已作为第三方工具被目前几乎所有的主流训练框架（TensorFlow、PyTorch、MXNet等）集成；在推理侧，其是OpenVINO的后端，并也经常作为第三方推理加速库被其它工程调用。</p>
<h2>学习链接</h2>
<p>github
<a href="https://github.com/uxlfoundation/oneDNN">uxlfoundation/oneDNN: oneAPI Deep Neural Network Library (oneDNN)</a>
开发手册
<a href="https://uxlfoundation.github.io/oneDNN/index.html">oneAPI Deep Neural Network Library (oneDNN) Developer Guide and Reference — oneDNN v3.9.0 documentation</a></p>
<ul>
<li><a href="https://uxlfoundation.github.io/oneDNN">oneDNN Developer Guide and Reference</a> explains the programming model, supported functionality, implementation details, and includes annotated examples.</li>
<li><a href="https://uxlfoundation.github.io/oneDNN/group_dnnl_api.html">API Reference</a> provides a comprehensive reference of the library API.</li>
<li><a href="https://github.com/uxlfoundation/oneDNN/releases">Release Notes</a> explains the new features, performance optimizations, and improvements implemented in each version of oneDNN.</li>
</ul>
<p>一些资料
<a href="https://www.intel.cn/content/www/cn/zh/developer/tools/oneapi/onednn-documentation.html">Intel® oneAPI Deep Neural Network Library Documentation</a>
<a href="https://zhuanlan.zhihu.com/p/377293205">基于oneDNN的ResNet50推理速度优化 - 知乎</a>
<a href="https://pytorch.ac.cn/blog/accelerating-inference/">在 x86-64 机器上使用 oneDNN Graph 加速推理 | PyTorch - PyTorch 深度学习库</a></p>
<h2>编译搭建</h2>
<p>参照<a href="https://uxlfoundation.github.io/oneDNN/dev_guide_build.html">Build from Source — oneDNN v3.9.0 documentation</a></p>
<pre><code class="language-bash">git clone https://github.com/uxlfoundation/oneDNN.git
cd oneDNN
cd build &amp;&amp; cmake ..
cmake --build .</code></pre>
<p>在编译后你可以在 <code>oneDNN/build/examples</code> 里找到对应的可执行文件。</p>
<h2>start from example</h2>
<p><a href="https://github.com/uxlfoundation/oneDNN/blob/main/examples/tutorials/matmul/cpu_sgemm_and_matmul.cpp">oneDNN/examples/tutorials/matmul/cpu_sgemm_and_matmul.cpp at main · uxlfoundation/oneDNN</a></p>
<p>对应的可执行文件在 <code>oneDNN/build/examples</code> 底下的 <code>cpu-tutorials-matmul-sgemm-and-matmul-cpp</code></p>
<p>intel的文本是又臭又长，还找不到下手的点。我们还是一样，从例子开始。
我们从sgemm开始学习。</p>
<pre><code class="language-CPP">void init_vector(std::vector&lt;float&gt; &amp;v) {
    std::mt19937 gen;
    std::uniform_real_distribution&lt;float&gt; u(-1, 1);

    for (auto &amp;e : v)
        e = u(gen);
}

void sgemm_and_matmul_with_params(char transA, char transB, int64_t M,
        int64_t N, int64_t K, float alpha, float beta) {
    if (beta != fixed_beta)
        throw std::logic_error(&quot;Run-time beta is not yet supported.&quot;);

    // Allocate and initialize matrices
    std::vector&lt;float&gt; A(M * K);
    init_vector(A); // 初始化矩阵A

    std::vector&lt;float&gt; B(K * N);
    init_vector(B); // 初始化矩阵B

    std::vector&lt;float&gt; C_sgemm(M * N);
    init_vector(C_sgemm); // 初始化矩阵C

    std::vector&lt;float&gt; C_dynamic_matmul = C_sgemm;

    // Prepare leading dimensions
    int64_t lda = tolower(transA) == &#039;n&#039; ? K : M;
    int64_t ldb = tolower(transB) == &#039;n&#039; ? N : K;
    int64_t ldc = N;

    // 1. Execute sgemm
    for (int run = 0; run &lt; number_of_runs; ++run)
        dnnl_sgemm(transA, transB, M, N, K, alpha, A.data(), lda, B.data(), ldb,
                beta, C_sgemm.data(), ldc);

    // 2.a Create dynamic MatMul
    auto dynamic_matmul = dynamic_matmul_create();
    // 2.b Execute
    for (int run = 0; run &lt; number_of_runs; ++run)
        dynamic_matmul_execute(dynamic_matmul, transA, transB, M, N, K, alpha,
                A.data(), lda, B.data(), ldb, beta, C_dynamic_matmul.data(),
                ldc);

    int rc = 0;
    rc |= compare_vectors(
            C_sgemm, C_dynamic_matmul, K, &quot;Compare SGEMM vs dynamic MatMul&quot;);
    if (rc) throw std::logic_error(&quot;The resulting matrices diverged too much.&quot;);
}

void sgemm_and_matmul() {
    sgemm_and_matmul_with_params(&#039;N&#039;, &#039;T&#039;, 10, 20, 30, 1.1f, fixed_beta);
}

int main(int argc, char **argv) {
    return handle_example_errors({engine::kind::cpu}, sgemm_and_matmul);
}</code></pre>
<p>我们先看 <code>dnnl_sgemm(transA, transB, M, N, K, alpha, A.data(), lda, B.data(), ldb, beta, C_sgemm.data(), ldc);</code>
<a href="https://github.com/uxlfoundation/oneDNN/blob/9136964f8cc9e9c8a3ef4e3d38eee1baff68ccc4/src/common/gemm.cpp#L97">oneDNN/src/common/gemm.cpp at 9136964f8cc9e9c8a3ef4e3d38eee1baff68ccc4 · uxlfoundation/oneDNN</a></p>
<pre><code class="language-CPP">dnnl_status_t dnnl_sgemm(char transa, char transb, dim_t M, dim_t N, dim_t K,
        float alpha, const float *A, dim_t lda, const float *B, const dim_t ldb,
        float beta, float *C, dim_t ldc) {
#if DNNL_CPU_RUNTIME != DNNL_RUNTIME_NONE
    status_t status = dnnl_success;
    MAYBE_VERBOSE(status, &quot;f32&quot;, &quot;f32&quot;, &quot;f32&quot;,
            MAYBE_RUN_STACK_CHECKER(dnnl_sgemm, cpu::extended_sgemm, &amp;transb,
                    &amp;transa, &amp;N, &amp;M, &amp;K, &amp;alpha, B, &amp;ldb, A, &amp;lda, &amp;beta, C,
                    &amp;ldc, nullptr, false));
    return status;
#else
    return dnnl::impl::status::unimplemented;
#endif
}</code></pre>
<p>它会调用 <code>cpu::extended_sgemm</code>，在 <a href="https://github.com/uxlfoundation/oneDNN/blob/9136964f8cc9e9c8a3ef4e3d38eee1baff68ccc4/src/cpu/gemm/gemm.cpp#L107">oneDNN/src/cpu/gemm/gemm.cpp at 9136964f8cc9e9c8a3ef4e3d38eee1baff68ccc4 · uxlfoundation/oneDNN</a></p>
<pre><code class="language-CPP">dnnl_status_t extended_sgemm(const char *transa, const char *transb,
        const dim_t *M, const dim_t *N, const dim_t *K, const float *alpha,
        const float *A, const dim_t *lda, const float *B, const dim_t *ldb,
        const float *beta, float *C, const dim_t *ldc, const float *bias,
        const bool force_jit_nocopy_gemm) {
    dnnl_status_t status = check_gemm_input(transa, transb, M, N, K, A, lda, B,
            ldb, C, ldc, alpha, beta, bias != nullptr);
    if (status != dnnl_success) return status;

#ifdef USE_CBLAS
    if (!force_jit_nocopy_gemm &amp;&amp; utils::one_of(*transa, &#039;n&#039;, &#039;N&#039;, &#039;t&#039;, &#039;T&#039;)
            &amp;&amp; utils::one_of(*transb, &#039;n&#039;, &#039;N&#039;, &#039;t&#039;, &#039;T&#039;)) {
        bool trA = *transa == &#039;t&#039; || *transa == &#039;T&#039;;
        bool trB = *transb == &#039;t&#039; || *transb == &#039;T&#039;;
        CBLAS_TRANSPOSE Cblas_trA = trA ? CblasTrans : CblasNoTrans;
        CBLAS_TRANSPOSE Cblas_trB = trB ? CblasTrans : CblasNoTrans;
        cblas_sgemm(CblasColMajor, Cblas_trA, Cblas_trB, *M, *N, *K, *alpha, A,
                *lda, B, *ldb, *beta, C, *ldc);
        if (bias) {
            // Add bias if necessary (bias is applied to columns of C)
            dim_t incx = 1, incy = 1;
            parallel_nd(*N, [&amp;](dim_t n) {
                dim_t offset = n * (*ldc);
                cblas_saxpy(*M, 1.0, bias, incx, C + offset, incy);
            });
        }
        msan_unpoison_matrix(C, *M, *N, *ldc, sizeof(*C));
        return dnnl_success;
    }
#endif

#if DNNL_X64 &amp;&amp; !__BUILD_GEMM_NONE
    if (mayiuse(sse41)) {
        float *dummy_ao = nullptr;
        float *dummy_bo = nullptr;
        auto status = gemm_driver(transa, transb, bias ? &quot;C&quot; : nullptr, M, N, K,
                alpha, A, lda, dummy_ao, B, ldb, dummy_bo, beta, C, ldc, bias,
                force_jit_nocopy_gemm);
        if (status != status::unimplemented) return status;
    }
#endif

    return ref_gemm&lt;float&gt;(
            transa, transb, M, N, K, alpha, A, lda, B, ldb, beta, C, ldc, bias);
}</code></pre>
<p>怎么在用cblas .......</p>
<p>那我们对比的呢：</p>
<pre><code class="language-CPP">    // 2.a Create dynamic MatMul
    auto dynamic_matmul = dynamic_matmul_create();
    // 2.b Execute
    for (int run = 0; run &lt; number_of_runs; ++run)
        dynamic_matmul_execute(dynamic_matmul, transA, transB, M, N, K, alpha,
                A.data(), lda, B.data(), ldb, beta, C_dynamic_matmul.data(),
                ldc);</code></pre>
<pre><code class="language-CPP">// Create a _dynamic_ MatMul primitive that can work with arbitrary shapes
// and alpha parameters.
// Warning: current limitation is that beta parameter should be known in
// advance (use fixed_beta).
matmul dynamic_matmul_create() {
    // We assume that beta is known at the primitive creation time
    float beta = fixed_beta;

    memory::dims a_shape = {DNNL_RUNTIME_DIM_VAL, DNNL_RUNTIME_DIM_VAL};
    memory::dims b_shape = {DNNL_RUNTIME_DIM_VAL, DNNL_RUNTIME_DIM_VAL};
    memory::dims c_shape = {DNNL_RUNTIME_DIM_VAL, DNNL_RUNTIME_DIM_VAL};

    memory::dims a_strides = {DNNL_RUNTIME_DIM_VAL, DNNL_RUNTIME_DIM_VAL};
    memory::dims b_strides = {DNNL_RUNTIME_DIM_VAL, DNNL_RUNTIME_DIM_VAL};
    memory::dims c_strides = {DNNL_RUNTIME_DIM_VAL, 1};

    memory::desc a_md(a_shape, memory::data_type::f32, a_strides);
    memory::desc b_md(b_shape, memory::data_type::f32, b_strides);
    memory::desc c_md(c_shape, memory::data_type::f32, c_strides);

    // Create attributes (to handle alpha dynamically and beta if necessary)
    primitive_attr attr;
    attr.set_scales_mask(DNNL_ARG_WEIGHTS, /* mask */ 0);
    if (beta != 0.f) {
        post_ops po;
        po.append_sum(beta);
        attr.set_post_ops(po);
    }

    // Create a MatMul primitive
    matmul::primitive_desc matmul_pd(eng(), a_md, b_md, c_md, attr);
    return matmul(matmul_pd);
}

// Execute a _dynamic_ MatMul primitive created earlier. All the parameters are
// passed at a run-time (except for beta which has to be specified at the
// primitive creation time due to the current limitation).
void dynamic_matmul_execute(matmul &amp;matmul_p, char transA, char transB,
        int64_t M, int64_t N, int64_t K, float alpha, const float *A,
        int64_t lda, const float *B, int64_t ldb, float beta, float *C,
        int64_t ldc) {
    using dims = memory::dims;

    if (beta != fixed_beta)
        throw std::logic_error(&quot;Run-time beta is not yet supported.&quot;);

    // Translate transA and transB
    dims a_strides = tolower(transA) == &#039;n&#039; ? dims {lda, 1} : dims {1, lda};
    dims b_strides = tolower(transB) == &#039;n&#039; ? dims {ldb, 1} : dims {1, ldb};

    // Wrap raw pointers into oneDNN memories (with proper shapes)
    memory A_m({{M, K}, memory::data_type::f32, a_strides}, eng(), (void *)A);
    memory B_m({{K, N}, memory::data_type::f32, b_strides}, eng(), (void *)B);
    memory C_m({{M, N}, memory::data_type::f32, {ldc, 1}}, eng(), (void *)C);

    // Prepare oneDNN memory for alpha
    memory alpha_m({{1}, memory::data_type::f32, {1}}, eng(), &amp;alpha);

    // Execute the MatMul primitive
    stream s(eng());
    matmul_p.execute(s,
            {{DNNL_ARG_SRC, A_m}, {DNNL_ARG_WEIGHTS, B_m}, {DNNL_ARG_DST, C_m},
                    {DNNL_ARG_ATTR_SCALES | DNNL_ARG_WEIGHTS, alpha_m}});
    s.wait();
}
</code></pre>
<table>
<thead>
<tr>
<th>实现点</th>
<th>技术细节</th>
</tr>
</thead>
<tbody>
<tr>
<td>动态 shape</td>
<td>使用 <code>DNNL_RUNTIME_DIM_VAL</code> 占位，实际 shape 在 memory 创建时提供</td>
</tr>
<tr>
<td>动态 alpha</td>
<td>使用 <code>set_scales_mask()</code> + runtime <code>alpha_m</code> memory</td>
</tr>
<tr>
<td>beta</td>
<td>只能固定在 primitive 创建阶段，通过 <code>post_ops.append_sum(beta)</code> 实现</td>
</tr>
<tr>
<td>A/B 的转置</td>
<td>使用 <code>strides</code> 控制内存布局来间接实现转置</td>
</tr>
<tr>
<td>高效执行</td>
<td>创建好 matmul primitive 后可多次执行，避免重复编译</td>
</tr>
<tr>
<td>支持动态 batch</td>
<td>也可以加上 <code class="kb-btn">DNNL_RUNTIME_DIM_VAL, M, K</code> 来支持动态批次矩阵乘法</td>
</tr>
</tbody>
</table>
<ul>
<li><strong>缓存多个 primitive 实例</strong>
<ul>
<li>比如根据 <code>(transA, transB, beta)</code> 组合缓存不同 primitive；</li>
<li>每次选择对应的 primitive 执行。</li>
</ul></li>
<li><strong>构造 higher-level dispatch wrapper</strong>
<ul>
<li>手动判断 transpose、beta 等参数；</li>
<li>动态创建 memory::desc 和 primitive_attr。</li>
</ul></li>
<li><strong>用 brgemm（batch-reduce GEMM）自己写 kernel</strong>
<ul>
<li>如果你需要更细粒度的动态控制，例如动态 tile、大量 shape 变动等，可以直接使用 <code>brgemm</code> 接口自行调度。</li>
</ul></li>
</ul>
<h2>传统DNN kernel</h2>
<h3>s8x8s32 计算学习</h3>
<p>这段代码实现的是 oneDNN 中用于 <strong>int8 量化 GEMM</strong> 的一项关键计算：<code>compensation</code> 补偿向量的生成。它主要用于：</p>
<blockquote>
<p><strong>修正 int8 点积时带来的零点偏移（zero-point offset）误差</strong>，尤其是量化 B 矩阵为 <code>int8</code>，而 A 矩阵乘以 B 后结果要校正偏置时。</p>
</blockquote>
<pre><code class="language-CPP">namespace dnnl {
namespace impl {
namespace cpu {
namespace ppc64 {

dnnl_status_t cblas_gemm_s8x8s32_ppc64(int ATflag, int BTflag,
        char const *offsetc, dim_t m, dim_t n, dim_t k, float alpha,
        int8_t const *A, dim_t lda, int8_t const *ao, uint8_t const *B,
        dim_t ldb, uint8_t const *bo, int *C, float beta, dim_t ldc,
        int const *co, int flipB_flag) {

    int m_cap, n_cap, k_cap;
    m_cap = (m + 3) &amp; (~3);
    n_cap = (n + 3) &amp; (~3);
    k_cap = (k + 3) &amp; (~3);

    if ((*ao != 0) || (*bo != 0)) {
        short *Ashort, *AP, *APraw;
        short *Bshort, *BP, *BPraw;
        int a_size = lda * (ATflag ? m - 1 : k - 1) + (ATflag ? k : m);
        int b_size = ldb * (BTflag ? k - 1 : n - 1) + (BTflag ? n : k);
        Ashort = (short *)malloc(a_size * sizeof(short), 4096);
        Bshort = (short *)malloc(b_size * sizeof(short), 4096);
        if (utils::any_null(Ashort, Bshort)) {
            free(Ashort);
            free(Bshort);
            return dnnl_out_of_memory;
        }
        for (int i = 0; i &lt; a_size; ++i)
            Ashort[i] = ((short)A[i]) - (short)*ao;
        if (flipB_flag) {
            const int8_t *Bflip = (const int8_t *)B;
            const int8_t *bo_flip = (const int8_t *)bo;
            for (int i = 0; i &lt; b_size; ++i)
                Bshort[i] = ((short)(Bflip[i])) - (short)*bo_flip;
        } else {
            for (int i = 0; i &lt; b_size; ++i)
                Bshort[i] = ((short)B[i]) - (short)*bo;
        }
        APraw = (short *)malloc((m_cap * k_cap + 15) * sizeof(short), 4096);
        BPraw = (short *)malloc((k_cap * n_cap + 15) * sizeof(short), 4096);
        if (utils::any_null(APraw, BPraw)) {
            free(Ashort);
            free(Bshort);
            free(APraw);
            free(BPraw);
            return dnnl_out_of_memory;
        }
        AP = (short *)((((unsigned long)APraw) + 15) &amp; (~15));
        BP = (short *)((((unsigned long)BPraw) + 15) &amp; (~15));
        if (ATflag)
            pack_N16_16bit(k, m, Ashort, lda, AP);
        else
            pack_T16_16bit(k, m, Ashort, lda, AP);
        if (BTflag)
            pack_T8_16bit(k, n, Bshort, ldb, BP);
        else
            pack_N8_16bit(k, n, Bshort, ldb, BP);
        gemm_kernel_16bit(m, n, k, (float)alpha, AP, BP, C, beta, ldc);
        free(Ashort);
        free(Bshort);
        free(APraw);
        free(BPraw);
    } else {
        int8_t *AP, *APraw;
        uint8_t *BP, *BPraw;
        APraw = (int8_t *)malloc((m_cap * k_cap + 3) * sizeof(uint8_t), 4096);
        BPraw = (uint8_t *)malloc((k_cap * n_cap + 3) * sizeof(int8_t), 4096);
        if (utils::any_null(APraw, BPraw)) {
            free(APraw);
            free(BPraw);
            return dnnl_out_of_memory;
        }
        AP = (int8_t *)((((unsigned long)APraw) + 3) &amp; (~3));
        BP = (uint8_t *)((((unsigned long)BPraw) + 3) &amp; (~3));
        if (ATflag)
            pack_N16_8bit(k, m, A, lda, AP);
        else
            pack_T16_8bit(k, m, A, lda, AP);
        if (flipB_flag) {
            int b_size = ldb * (BTflag ? k - 1 : n - 1) + (BTflag ? n : k);
            uint8_t *Bflip = (uint8_t *)malloc(b_size * sizeof(uint8_t), 4096);
            if (utils::any_null(Bflip)) {
                free(APraw);
                free(BPraw);
                free(Bflip);
                return dnnl_out_of_memory;
            }
            for (int i = 0; i &lt; b_size; ++i)
                Bflip[i] = B[i] ^ 0x80;
            if (BTflag)
                pack_T8_8bit(k, n, Bflip, ldb, BP);
            else
                pack_N8_8bit(k, n, Bflip, ldb, BP);
            free(Bflip);
        } else {
            if (BTflag)
                pack_T8_8bit(k, n, B, ldb, BP);
            else
                pack_N8_8bit(k, n, B, ldb, BP);
        }
        gemm_kernel_8bit(m, n, k, (float)alpha, AP, BP, C, beta, ldc);
        if (flipB_flag) {
            int *comparray = (int *)malloc(m * sizeof(int), 4096);
            if (utils::any_null(comparray)) {
                free(APraw);
                free(BPraw);
                free(comparray);
                return dnnl_out_of_memory;
            }
            for (int i = 0; i &lt; m; ++i)
                comparray[i] = 0;
            if (ATflag) {
                for (int i = 0; i &lt; m; ++i) {
                    int ca = 0;
                    const int8_t *at = &amp;A[lda * i];
                    for (int j = 0; j &lt; k; ++j) {
                        ca += (int)*at++;
                    }
                    comparray[i] = ca;
                }
            } else {
                for (int j = 0; j &lt; k; ++j) {
                    int *ca = comparray;
                    const int8_t *at = &amp;A[lda * j];
                    for (int i = 0; i &lt; m; ++i) {
                        *ca++ += (int)*at++;
                    }
                }
            }
            for (int i = 0; i &lt; m; ++i) {
                comparray[i] = cpu::q10n::out_round&lt;int32_t&gt;(
                        cpu::q10n::saturate&lt;int32_t&gt;(
                                ((double)comparray[i]) * alpha * -128.0));
            }
            for (int j = 0; j &lt; n; ++j) {
                int *ca = comparray;
                int *ct = &amp;C[ldc * j];
                for (int i = 0; i &lt; m; ++i) {
                    *ct++ += *ca++;
                }
            }
            free(comparray);
        }
        free(APraw);
        free(BPraw);
    }
    if (*offsetc == &#039;F&#039; || *offsetc == &#039;f&#039;)
        for (int i = 0; i &lt; n; ++i)
            for (int j = 0; j &lt; m; ++j)
                C[ldc * i + j] += co[0];
    if (*offsetc == &#039;R&#039; || *offsetc == &#039;r&#039;)
        for (int i = 0; i &lt; n; ++i)
            for (int j = 0; j &lt; m; ++j)
                C[ldc * i + j] += co[i];
    if (*offsetc == &#039;C&#039; || *offsetc == &#039;c&#039;)
        for (int i = 0; i &lt; n; ++i)
            for (int j = 0; j &lt; m; ++j)
                C[ldc * i + j] += co[j];

    return dnnl_success;
}

} // namespace ppc64
} // namespace cpu
} // namespace impl
} // namespace dnnl</code></pre>
<p>gemm_kernel_8bit</p>
<table>
<thead>
<tr>
<th>优化维度</th>
<th>具体手段</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>量化偏移处理</strong></td>
<td>支持 A/B 矩阵的 <code>zero_point</code> 偏移 (<code>ao</code>, <code>bo</code>)</td>
</tr>
<tr>
<td><strong>内存对齐优化</strong></td>
<td><code>malloc(..., 4096)</code> + 手动 pointer 对齐（16-byte 或 4-byte）</td>
</tr>
<tr>
<td><strong>打包（packing）</strong></td>
<td>手动实现数据 layout 转换（<code>pack_T/N_*bit</code>）提升 cache 局部性</td>
</tr>
<tr>
<td><strong>低精度转高精度</strong></td>
<td>将 <code>int8/uint8</code> 转为 <code>int16</code> 再计算，提高精度避免溢出</td>
</tr>
<tr>
<td><strong>缓存补偿计算</strong></td>
<td>用 <code>comparray</code> 计算 compensation bias，避免 kernel 中处理</td>
</tr>
<tr>
<td><strong>B 矩阵符号翻转</strong></td>
<td>用 <code>flipB_flag</code> + <code>Bflip = B ^ 0x80</code> 实现 signed-&gt;unsigned trick</td>
</tr>
<tr>
<td><strong>通道广播补偿</strong></td>
<td>支持 <code>offsetc</code> 里的 row/col/full 偏移广播（<code>co[]</code> 加法）</td>
</tr>
</tbody>
</table>
<p>优化：</p>
<table>
<thead>
<tr>
<th>类别</th>
<th>优化点</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>内存</strong></td>
<td>对齐 + 页内分配</td>
<td>手动 pointer 对齐提升 SIMD 执行效率</td>
</tr>
<tr>
<td><strong>layout</strong></td>
<td>手动打包</td>
<td>避免 kernel 内处理复杂 layout</td>
</tr>
<tr>
<td><strong>精度</strong></td>
<td>int8 -&gt; int16</td>
<td>避免溢出/溢精问题</td>
</tr>
<tr>
<td><strong>量化</strong></td>
<td>zero-point 补偿预处理</td>
<td>移出主 kernel 的判断逻辑</td>
</tr>
<tr>
<td><strong>补偿项</strong></td>
<td>A row sum <em> -128 </em> alpha</td>
<td>支持 flipB trick 的额外补偿</td>
</tr>
<tr>
<td><strong>广播支持</strong></td>
<td><code>offsetc</code> 实现</td>
<td>符合 Intel GEMM 偏移格式</td>
</tr>
<tr>
<td><strong>数据翻转</strong></td>
<td><code>B ^ 0x80</code></td>
<td>uint8 视作 int8 的 SIMD trick</td>
</tr>
</tbody>
</table>
<h3>超级kernel</h3>
<p><a href="https://github.com/uxlfoundation/oneDNN/blob/main/src/cpu/ppc64/ppc64_gemm_s8x8s32.hpp#L2244">oneDNN/src/cpu/ppc64/ppc64_gemm_s8x8s32.hpp at main · uxlfoundation/oneDNN</a></p>
<pre><code class="language-CPP">void gemm_kernel_8bit(dim_t m, dim_t n, dim_t k, float alpha, int8_t *A,
        uint8_t *B, int32_t *C, float beta, dim_t ldc) {
    int32_t i;
    int32_t m_cap = (m + 3) &amp; ~3;
    int32_t n_cap = (n + 3) &amp; ~3;
    int32_t k_cap = (k + 3) &amp; ~3;
    int32_t m_skip;
    int32_t n_skip = (n &amp; 8) != (n_cap &amp; 8);
    int32_t fastpath;
    v4si_t result[4], result_i[4], result_t[4];
    vec_t swizA = {0, 1, 2, 3, 16, 17, 18, 19, 4, 5, 6, 7, 20, 21, 22, 23};
    vec_t swizB
            = {8, 9, 10, 11, 24, 25, 26, 27, 12, 13, 14, 15, 28, 29, 30, 31};
    vec_t swizC = {0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23};
    vec_t swizD
            = {8, 9, 10, 11, 12, 13, 14, 15, 24, 25, 26, 27, 28, 29, 30, 31};
    fastpath = ((alpha == 1.0) &amp;&amp; (beta == 0.0));

    /* Loop for multiples of 8 */
    i = n_cap &gt;&gt; 3;
    while (i) {
        int32_t j;
        int32_t *CO;
        int8_t *AO;
        CO = C;
        C += ldc &lt;&lt; 3;
        AO = A;
        PREFETCH1(A, 128);
        PREFETCH1(A, 256);
        /* Loop for m &gt;= 16. */
        j = m_cap &gt;&gt; 4;
        m_skip = (m &gt;&gt; 4) != (m_cap &gt;&gt; 4);
        while (j) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0, acc1, acc2, acc3, acc4, acc5, acc6, acc7;
            SET_ACC_ZERO8();
            int32_t l;
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[0], rowB[1]);
                MMA(&amp;acc2, rowA[1], rowB[0]);
                MMA(&amp;acc3, rowA[1], rowB[1]);
                MMA(&amp;acc4, rowA[2], rowB[0]);
                MMA(&amp;acc5, rowA[2], rowB[1]);
                MMA(&amp;acc6, rowA[3], rowB[0]);
                MMA(&amp;acc7, rowA[3], rowB[1]);
                rowA += 4;
                rowB += 2;
            }

            if (fastpath) {
                SAVE_ACC_ABSC(&amp;acc0, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND_ABSC(&amp;acc1, 0);
                } else {
                    SAVE_ACC1_ABSC(&amp;acc1, 0);
                }
                CO += 4;
                SAVE_ACC_ABSC(&amp;acc2, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND_ABSC(&amp;acc3, 0);
                } else {
                    SAVE_ACC1_ABSC(&amp;acc3, 0);
                }
                CO += 4;
                SAVE_ACC_ABSC(&amp;acc4, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND_ABSC(&amp;acc5, 0);
                } else {
                    SAVE_ACC1_ABSC(&amp;acc5, 0);
                }
                CO += 4;
                if (((j == 1) &amp;&amp; m_skip) || ((i == 1) &amp;&amp; n_skip)) {
                    if ((j == 1) &amp;&amp; m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc6);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc7);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = result_t[0][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = result_t[1][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = result_t[2][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = result_t[3][ii];
                    } else {
                        SAVE_ACC_ABSC(&amp;acc6, 0);
                        SAVE_ACC1_COND_ABSC(&amp;acc7, 0);
                    }
                } else {
                    SAVE_ACC_ABSC(&amp;acc6, 0);
                    SAVE_ACC1_ABSC(&amp;acc7, 0);
                }
            } else {
                SAVE_ACC(&amp;acc0, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND(&amp;acc1, 0);
                } else {
                    SAVE_ACC1(&amp;acc1, 0);
                }
                CO += 4;
                SAVE_ACC(&amp;acc2, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND(&amp;acc3, 0);
                } else {
                    SAVE_ACC1(&amp;acc3, 0);
                }
                CO += 4;
                SAVE_ACC(&amp;acc4, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND(&amp;acc5, 0);
                } else {
                    SAVE_ACC1(&amp;acc5, 0);
                }
                CO += 4;
                if (((j == 1) &amp;&amp; m_skip) || ((i == 1) &amp;&amp; n_skip)) {
                    if ((j == 1) &amp;&amp; m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc6);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = beta * CO[0 * ldc + ii]
                                + alpha * result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = beta * CO[1 * ldc + ii]
                                    + alpha * result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = beta * CO[2 * ldc + ii]
                                    + alpha * result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = beta * CO[3 * ldc + ii]
                                    + alpha * result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc7);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = beta * CO[4 * ldc + ii]
                                + alpha * result_t[0][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = beta * CO[5 * ldc + ii]
                                        + alpha * result_t[1][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = beta * CO[6 * ldc + ii]
                                        + alpha * result_t[2][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = beta * CO[7 * ldc + ii]
                                        + alpha * result_t[3][ii];
                    } else {
                        SAVE_ACC(&amp;acc6, 0);
                        SAVE_ACC1_COND(&amp;acc7, 0);
                    }
                } else {
                    SAVE_ACC(&amp;acc6, 0);
                    SAVE_ACC1(&amp;acc7, 0);
                }
            }
            CO += 4;
            AO += (k_cap &lt;&lt; 4);
            BO += (k_cap &lt;&lt; 3);
            --j;
        }

        if (m_skip) goto endloop8;

        m_skip = (m &amp; 8) != (m_cap &amp; 8);

        if (m_cap &amp; 8) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0, acc1, acc2, acc3;
            SET_ACC_ZERO4();
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            int32_t l;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[0], rowB[1]);
                MMA(&amp;acc2, rowA[1], rowB[0]);
                MMA(&amp;acc3, rowA[1], rowB[1]);
                rowA += 2;
                rowB += 2;
            }

            if (fastpath) {
                SAVE_ACC_ABSC(&amp;acc0, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND_ABSC(&amp;acc1, 0);
                } else {
                    SAVE_ACC1_ABSC(&amp;acc1, 0);
                }
                CO += 4;
                if (m_skip || ((i == 1) &amp; n_skip)) {
                    if (m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc2);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc3);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = result_t[0][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = result_t[1][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = result_t[2][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = result_t[3][ii];
                    } else {
                        SAVE_ACC_ABSC(&amp;acc2, 0);
                        SAVE_ACC1_COND_ABSC(&amp;acc3, 0);
                    }
                } else {
                    SAVE_ACC_ABSC(&amp;acc2, 0);
                    SAVE_ACC1_ABSC(&amp;acc3, 0);
                }
            } else {
                SAVE_ACC(&amp;acc0, 0);
                if ((i == 1) &amp;&amp; n_skip) {
                    SAVE_ACC1_COND(&amp;acc1, 0);
                } else {
                    SAVE_ACC1(&amp;acc1, 0);
                }
                CO += 4;
                if (m_skip || ((i == 1) &amp; n_skip)) {
                    if (m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc2);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = beta * CO[0 * ldc + ii]
                                + alpha * result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = beta * CO[1 * ldc + ii]
                                    + alpha * result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = beta * CO[2 * ldc + ii]
                                    + alpha * result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = beta * CO[3 * ldc + ii]
                                    + alpha * result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc3);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = beta * CO[4 * ldc + ii]
                                + alpha * result_t[0][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = beta * CO[5 * ldc + ii]
                                        + alpha * result_t[1][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = beta * CO[6 * ldc + ii]
                                        + alpha * result_t[2][ii];
                        if ((i &gt; 1) || (!n_skip) || (n_cap &amp; 4)
                                || (n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = beta * CO[7 * ldc + ii]
                                        + alpha * result_t[3][ii];
                    } else {
                        SAVE_ACC(&amp;acc2, 0);
                        SAVE_ACC1_COND(&amp;acc3, 0);
                    }
                } else {
                    SAVE_ACC(&amp;acc2, 0);
                    SAVE_ACC1(&amp;acc3, 0);
                }
            }
            CO += 4;
            AO += (k_cap &lt;&lt; 3);
            BO += (k_cap &lt;&lt; 3);
        }

        if (m_skip) goto endloop8;

        m_skip = (m &amp; 4) != (m_cap &amp; 4);

        if (m_cap &amp; 4) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0, acc1;
            __builtin_mma_xxsetaccz(&amp;acc0);
            __builtin_mma_xxsetaccz(&amp;acc1);
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            int32_t l = 0;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[0], rowB[1]);
                rowA += 1;
                rowB += 2;
            }

            if (fastpath) {
                if (m_skip || ((i == 1) &amp; n_skip)) {
                    if (m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc0);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc1);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = result_t[0][ii];
                        if ((i == 1) &amp; n_skip) {
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 3)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[5 * ldc + ii] = result_t[1][ii];
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 2)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[6 * ldc + ii] = result_t[2][ii];
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 1)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[7 * ldc + ii] = result_t[3][ii];
                        } else {
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = result_t[1][ii];
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = result_t[2][ii];
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = result_t[3][ii];
                        }
                    } else {
                        SAVE_ACC_ABSC(&amp;acc0, 0);
                        SAVE_ACC1_COND_ABSC(&amp;acc1, 0);
                    }
                } else {
                    SAVE_ACC_ABSC(&amp;acc0, 0);
                    SAVE_ACC1_ABSC(&amp;acc1, 0);
                }
            } else {
                if (m_skip || ((i == 1) &amp; n_skip)) {
                    if (m_skip) {
                        int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc0);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + ii]
                                = beta * CO[0 * ldc + ii]
                                + alpha * result_t[0][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = beta * CO[1 * ldc + ii]
                                    + alpha * result_t[1][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = beta * CO[2 * ldc + ii]
                                    + alpha * result_t[2][ii];
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = beta * CO[3 * ldc + ii]
                                    + alpha * result_t[3][ii];
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc1);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[4 * ldc + ii]
                                = beta * CO[4 * ldc + ii]
                                + alpha * result_t[0][ii];
                        if ((i == 1) &amp; n_skip) {
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 3)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[5 * ldc + ii] = beta * CO[5 * ldc + ii]
                                            + alpha * result_t[1][ii];
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 2)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[6 * ldc + ii] = beta * CO[6 * ldc + ii]
                                            + alpha * result_t[2][ii];
                            if ((n_cap &amp; 4) || (n_cap - n) &lt; 1)
                                for (ii = 0; ii &lt; count; ++ii)
                                    CO[7 * ldc + ii] = beta * CO[7 * ldc + ii]
                                            + alpha * result_t[3][ii];
                        } else {
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[5 * ldc + ii] = beta * CO[5 * ldc + ii]
                                        + alpha * result_t[1][ii];
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[6 * ldc + ii] = beta * CO[6 * ldc + ii]
                                        + alpha * result_t[2][ii];
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[7 * ldc + ii] = beta * CO[7 * ldc + ii]
                                        + alpha * result_t[3][ii];
                        }
                    } else {
                        SAVE_ACC(&amp;acc0, 0);
                        SAVE_ACC1_COND(&amp;acc1, 0);
                    }
                } else {
                    SAVE_ACC(&amp;acc0, 0);
                    SAVE_ACC1(&amp;acc1, 0);
                }
            }
            CO += 4;
            AO += (k_cap &lt;&lt; 2);
            BO += (k_cap &lt;&lt; 3);
        }

    endloop8:
        B += k_cap &lt;&lt; 3;
        i -= 1;
    }

    if (n_cap &amp; 4) {
        int32_t j;
        int32_t *CO;
        int8_t *AO;
        CO = C;
        C += ldc &lt;&lt; 2;
        AO = A;
        int32_t n_skip = (n != n_cap);
        /* Loop for m &gt;= 32. */
        m_skip = (m &gt;&gt; 5) != (m_cap &gt;&gt; 5);
        for (j = 0; j &lt; (m_cap &gt;&gt; 5); j++) {
            uint8_t *BO = B;
            int8_t *A1 = AO + (16 * k_cap);
            v4si_t *rowC;
            __vector_quad acc0, acc1, acc2, acc3, acc4, acc5, acc6, acc7;
            SET_ACC_ZERO8();
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowA1 = (vec_t *)A1;
            vec_t *rowB = (vec_t *)BO;
            int32_t l;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[1], rowB[0]);
                MMA(&amp;acc2, rowA[2], rowB[0]);
                MMA(&amp;acc3, rowA[3], rowB[0]);
                MMA(&amp;acc4, rowA1[0], rowB[0]);
                MMA(&amp;acc5, rowA1[1], rowB[0]);
                MMA(&amp;acc6, rowA1[2], rowB[0]);
                MMA(&amp;acc7, rowA1[3], rowB[0]);
                rowA += 4;
                rowA1 += 4;
                rowB += 1;
            }

            if (fastpath) {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND_ABSC(&amp;acc0, 0);
                    SAVE_ACC_COND_ABSC(&amp;acc1, 4);
                    SAVE_ACC_COND_ABSC(&amp;acc2, 8);
                    SAVE_ACC_COND_ABSC(&amp;acc3, 12);
                    SAVE_ACC_COND_ABSC(&amp;acc4, 16);
                    SAVE_ACC_COND_ABSC(&amp;acc5, 20);
                    SAVE_ACC_COND_ABSC(&amp;acc6, 24);
                    if ((j == (m_cap &gt;&gt; 5) - 1) &amp;&amp; m_skip) {
                        int32_t ii;
                        int32_t count = 4 - (m_cap - m);
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc7);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + 28 + ii]
                                = result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 28 + ii] = result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 28 + ii] = result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 28 + ii] = result_t[3][ii];
                    } else {
                        SAVE_ACC_COND_ABSC(&amp;acc7, 28);
                    }
                    CO += 32;
                } else {
                    SAVE_ACC_ABSC(&amp;acc0, 0);
                    SAVE_ACC_ABSC(&amp;acc1, 4);
                    CO += 8;
                    SAVE_ACC_ABSC(&amp;acc2, 0);
                    SAVE_ACC_ABSC(&amp;acc3, 4);
                    CO += 8;
                    SAVE_ACC_ABSC(&amp;acc4, 0);
                    SAVE_ACC_ABSC(&amp;acc5, 4);
                    CO += 8;
                    SAVE_ACC_ABSC(&amp;acc6, 0);
                    SAVE_ACC_ABSC(&amp;acc7, 4);
                    CO += 8;
                }
            } else {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND(&amp;acc0, 0);
                    SAVE_ACC_COND(&amp;acc1, 4);
                    SAVE_ACC_COND(&amp;acc2, 8);
                    SAVE_ACC_COND(&amp;acc3, 12);
                    SAVE_ACC_COND(&amp;acc4, 16);
                    SAVE_ACC_COND(&amp;acc5, 20);
                    SAVE_ACC_COND(&amp;acc6, 24);
                    if ((j == (m_cap &gt;&gt; 5) - 1) &amp;&amp; m_skip) {
                        int32_t ii;
                        int32_t count = 4 - (m_cap - m);
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc7);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + 28 + ii]
                                = beta * CO[0 * ldc + 28 + ii]
                                + alpha * result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 28 + ii]
                                        = beta * CO[1 * ldc + 28 + ii]
                                        + alpha * result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 28 + ii]
                                        = beta * CO[2 * ldc + 28 + ii]
                                        + alpha * result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 28 + ii]
                                        = beta * CO[3 * ldc + 28 + ii]
                                        + alpha * result_t[3][ii];
                    } else {
                        SAVE_ACC_COND(&amp;acc7, 28);
                    }
                    CO += 32;
                } else {
                    SAVE_ACC(&amp;acc0, 0);
                    SAVE_ACC(&amp;acc1, 4);
                    CO += 8;
                    SAVE_ACC(&amp;acc2, 0);
                    SAVE_ACC(&amp;acc3, 4);
                    CO += 8;
                    SAVE_ACC(&amp;acc4, 0);
                    SAVE_ACC(&amp;acc5, 4);
                    CO += 8;
                    SAVE_ACC(&amp;acc6, 0);
                    SAVE_ACC(&amp;acc7, 4);
                    CO += 8;
                }
            }
            AO += k_cap &lt;&lt; 5;
            BO += k_cap &lt;&lt; 2;
        }

        if (m_skip) goto endloop4;

        m_skip = (m &amp; 16) != (m_cap &amp; 16);

        if (m_cap &amp; 16) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0, acc1, acc2, acc3;
            SET_ACC_ZERO4();
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            int32_t l;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[1], rowB[0]);
                MMA(&amp;acc2, rowA[2], rowB[0]);
                MMA(&amp;acc3, rowA[3], rowB[0]);
                rowA += 4;
                rowB += 1;
            }

            if (fastpath) {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND_ABSC(&amp;acc0, 0);
                    SAVE_ACC_COND_ABSC(&amp;acc1, 4);
                    SAVE_ACC_COND_ABSC(&amp;acc2, 8);
                    if (m_skip) {
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc3);
                        SWIZZLE_4x4 int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[0 * ldc + 12 + ii] = result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 12 + ii] = result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 12 + ii] = result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 12 + ii] = result_t[3][ii];
                    } else {
                        SAVE_ACC_COND_ABSC(&amp;acc3, 12);
                    }
                    CO += 16;
                } else {
                    SAVE_ACC_ABSC(&amp;acc0, 0);
                    SAVE_ACC_ABSC(&amp;acc1, 4);
                    CO += 8;
                    SAVE_ACC_ABSC(&amp;acc2, 0);
                    SAVE_ACC_ABSC(&amp;acc3, 4);
                    CO += 8;
                }
            } else {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND(&amp;acc0, 0);
                    SAVE_ACC_COND(&amp;acc1, 4);
                    SAVE_ACC_COND(&amp;acc2, 8);
                    if (m_skip) {
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc3);
                        SWIZZLE_4x4 int32_t count = 4 - (m_cap - m);
                        int32_t ii;
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[0 * ldc + 12 + ii] = beta * CO[0 * ldc + 12 + ii]
                                    + alpha * result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 12 + ii]
                                        = beta * CO[1 * ldc + 12 + ii]
                                        + alpha * result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 12 + ii]
                                        = beta * CO[2 * ldc + 12 + ii]
                                        + alpha * result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 12 + ii]
                                        = beta * CO[3 * ldc + 12 + ii]
                                        + alpha * result_t[3][ii];
                    } else {
                        SAVE_ACC_COND(&amp;acc3, 12);
                    }
                    CO += 16;
                } else {
                    SAVE_ACC(&amp;acc0, 0);
                    SAVE_ACC(&amp;acc1, 4);
                    CO += 8;
                    SAVE_ACC(&amp;acc2, 0);
                    SAVE_ACC(&amp;acc3, 4);
                    CO += 8;
                }
            }
            AO += k_cap &lt;&lt; 4;
            BO += k_cap &lt;&lt; 2;
        }

        if (m_skip) goto endloop4;

        m_skip = (m &amp; 8) != (m_cap &amp; 8);

        if (m_cap &amp; 8) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0, acc1;
            __builtin_mma_xxsetaccz(&amp;acc0);
            __builtin_mma_xxsetaccz(&amp;acc1);
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            int32_t l;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                MMA(&amp;acc1, rowA[1], rowB[0]);
                rowA += 2;
                rowB += 1;
            }

            if (fastpath) {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND_ABSC(&amp;acc0, 0);
                    if (m_skip) {
                        int32_t ii;
                        int32_t count = 4 - (m_cap - m);
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc1);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + 4 + ii]
                                = result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 4 + ii] = result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 4 + ii] = result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 4 + ii] = result_t[3][ii];
                    } else {
                        SAVE_ACC_COND_ABSC(&amp;acc1, 4);
                    }
                } else {
                    SAVE_ACC_ABSC(&amp;acc0, 0);
                    SAVE_ACC_ABSC(&amp;acc1, 4);
                }
            } else {
                if (m_skip || n_skip) {
                    SAVE_ACC_COND(&amp;acc0, 0);
                    if (m_skip) {
                        int32_t ii;
                        int32_t count = 4 - (m_cap - m);
                        __builtin_mma_disassemble_acc((void *)result, &amp;acc1);
                        SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii)
                                CO[0 * ldc + 4 + ii]
                                = beta * CO[0 * ldc + 4 + ii]
                                + alpha * result_t[0][ii];
                        if ((n_cap - n) &lt; 3)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[1 * ldc + 4 + ii]
                                        = beta * CO[1 * ldc + 4 + ii]
                                        + alpha * result_t[1][ii];
                        if ((n_cap - n) &lt; 2)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[2 * ldc + 4 + ii]
                                        = beta * CO[2 * ldc + 4 + ii]
                                        + alpha * result_t[2][ii];
                        if ((n_cap - n) &lt; 1)
                            for (ii = 0; ii &lt; count; ++ii)
                                CO[3 * ldc + 4 + ii]
                                        = beta * CO[3 * ldc + 4 + ii]
                                        + alpha * result_t[3][ii];
                    } else {
                        SAVE_ACC_COND(&amp;acc1, 4);
                    }
                } else {
                    SAVE_ACC(&amp;acc0, 0);
                    SAVE_ACC(&amp;acc1, 4);
                }
            }
            CO += 8;
            AO += k_cap &lt;&lt; 3;
            BO += k_cap &lt;&lt; 2;
        }

        if (m_skip) goto endloop4;

        m_skip = (m &amp; 4) != (m_cap &amp; 4);

        if (m_cap &amp; 4) {
            uint8_t *BO = B;
            v4si_t *rowC;
            __vector_quad acc0;
            __builtin_mma_xxsetaccz(&amp;acc0);
            int32_t l;
            vec_t *rowA = (vec_t *)AO;
            vec_t *rowB = (vec_t *)BO;
            for (l = 0; l &lt; k_cap / 4; l++) {
                MMA(&amp;acc0, rowA[0], rowB[0]);
                rowA += 1;
                rowB += 1;
            }

            if (fastpath) {
                if (m_skip || n_skip) {
                    int32_t count = 4 - (m_cap - m);
                    int32_t ii;
                    __builtin_mma_disassemble_acc((void *)result, &amp;acc0);
                    SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii) CO[0 * ldc + ii]
                            = result_t[0][ii];
                    if ((n_cap - n) &lt; 3)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = result_t[1][ii];
                    if ((n_cap - n) &lt; 2)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = result_t[2][ii];
                    if ((n_cap - n) &lt; 1)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = result_t[3][ii];
                } else {
                    SAVE_ACC_ABSC(&amp;acc0, 0);
                }
            } else {
                if (m_skip || n_skip) {
                    int32_t count = 4 - (m_cap - m);
                    int32_t ii;
                    __builtin_mma_disassemble_acc((void *)result, &amp;acc0);
                    SWIZZLE_4x4 for (ii = 0; ii &lt; count; ++ii) CO[0 * ldc + ii]
                            = beta * CO[0 * ldc + ii] + alpha * result_t[0][ii];
                    if ((n_cap - n) &lt; 3)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[1 * ldc + ii] = beta * CO[1 * ldc + ii]
                                    + alpha * result_t[1][ii];
                    if ((n_cap - n) &lt; 2)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[2 * ldc + ii] = beta * CO[2 * ldc + ii]
                                    + alpha * result_t[2][ii];
                    if ((n_cap - n) &lt; 1)
                        for (ii = 0; ii &lt; count; ++ii)
                            CO[3 * ldc + ii] = beta * CO[3 * ldc + ii]
                                    + alpha * result_t[3][ii];
                } else {
                    SAVE_ACC(&amp;acc0, 0);
                }
            }
            CO += 4;
            AO += k_cap &lt;&lt; 2;
            BO += k_cap &lt;&lt; 2;
        }

    endloop4:
        B += k_cap &lt;&lt; 2;
    }
    return;
}</code></pre>
<p><strong>这kernel，写的也太带派了</strong></p>
<table>
<thead>
<tr>
<th>优化技术</th>
<th>描述</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td>维度填充</td>
<td>将矩阵维度 <code>m</code>、<code>n</code>、<code>k</code> 填充到 4 的倍数（<code>m_cap</code>, <code>n_cap</code>, <code>k_cap</code>），使用位运算 <code>(m + 3) &amp; ~3</code>。</td>
<td>确保数据对齐，优化矢量化操作，减少边界处理复杂性。</td>
</tr>
<tr>
<td>快速路径优化</td>
<td>当 <code>alpha == 1.0</code> 且 <code>beta == 0.0</code> 时，跳过缩放操作，直接存储结果。</td>
<td>减少浮点运算，提高性能，适用于常见矩阵乘法场景。</td>
</tr>
<tr>
<td>矢量化与 MMA 指令</td>
<td>使用硬件支持的矩阵乘累加（MMA）指令（如 <code>__builtin_mma_xxsetaccz</code>, <code>MMA</code>）并行计算。</td>
<td>高效执行 8 位整型矩阵乘累加，最大化硬件并行能力。</td>
</tr>
<tr>
<td>数据重排（Swizzling）</td>
<td>使用 <code>swizA</code>, <code>swizB</code>, <code>swizC</code>, <code>swizD</code> 等向量重排数据，配合 <code>SWIZZLE_4x4</code> 宏。</td>
<td>匹配 MMA 指令的内存布局，提高数据访问效率。</td>
</tr>
<tr>
<td>分块处理</td>
<td>将矩阵划分为 16、8、4 行或列的子块，分别处理。</td>
<td>适配硬件寄存器和指令限制，提升计算效率。</td>
</tr>
<tr>
<td>边界处理</td>
<td>使用 <code>m_skip</code>, <code>n_skip</code> 和条件存储（如 <code>SAVE_ACC_COND</code>）处理非对齐维度。</td>
<td>确保非对齐矩阵的正确性，避免覆盖无关数据。</td>
</tr>
<tr>
<td>预取（Prefetching）</td>
<td>使用 <code>PREFETCH1</code> 宏（如 <code>PREFETCH1(A, 128)</code>）提前加载数据到缓存。</td>
<td>减少内存访问延迟，提高缓存命中率。</td>
</tr>
</tbody>
</table>
<p>在本例中，可以看到oneDNN的不足</p>
<ol>
<li>它的核心在于primitive，即以单个算子为核心的运算。oneDNN没法直接通过一个primitive处理复杂的神经网络（例如MLP中多个matmul和中间的运算）。单个primitive中能处理的算子组合通常是一个复杂操作（例如conv或者matmul），然后在输出接上简单运算（例如relu，bias等等）</li>
<li>用户需要手动将计算图划分成不同primitive的组合。例如将<code>conv, batch norm, relu, conv batch norm, bias</code>划分为<code>conv+batch norm+relu</code>和<code>conv+batch norm+bias</code>。这需要用户非常熟悉oneDNN的API操作，与它的能力限制。</li>
<li>oneDNN要求复杂算子后连接的简单算子之间的连接关系不能太复杂，简单来说在一个primitive中，基本上只能处理单一线性的图。例如对于以下这个带简单分叉的计算图，oneDNN比较难实现通过单个primitive进行表达</li>
</ol>
<h2>都什么时代了，还在玩传统kernel!</h2>
<h2>oneDNN Graph Compiler</h2>
<p><a href="https://arxiv.org/pdf/2301.01333">Microsoft Word - oneDNNGraphCompiler-CGO-Final-For-Publish - V2 - Copy</a>
<a href="https://zhuanlan.zhihu.com/p/20510564015">再见Graph Compiler：AI编译器4年开发经历总结与思考 - 知乎</a></p>
<p>它结合了传统编译器优化技术和专家调优的微内核（microkernel），用于生成高性能的深度神经网络（DNN）计算图代码</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250617004433069.png" alt="" /></p>
<ul>
<li><strong>oneDNN Graph Compiler 设计</strong>：
<ul>
<li><strong>混合方法</strong>：结合编译器优化（如循环转换、操作融合）和专家调优的微内核（如 gemm_kernel_8bit 这样的矩阵乘法内核），生成高性能代码。</li>
<li><strong>两级中间表示（IR）</strong>：
<ul>
<li><strong>Graph IR</strong>：保留 DNN 操作语义，支持图级优化（如低精度转换、常量权重预处理、操作融合、内存布局传播）。</li>
<li><strong>Tensor IR</strong>：接近 C 语言语义，表示多维数组操作，支持低级代码生成、循环合并和内存缓冲区优化。</li>
</ul></li>
<li><strong>模板与微内核</strong>：
<ul>
<li>使用基于模板的代码生成方法，直接采用专家调优的算法和微内核（如批处理 GEMM 微内核），避免复杂的编译器循环转换。</li>
<li>微内核（如 gemm_kernel_8bit）针对硬件寄存器和 L1 缓存优化，处理小块张量计算。</li>
</ul></li>
<li><strong>操作融合</strong>：
<ul>
<li><strong>细粒度融合</strong>：将内存密集型操作（如 ReLU、数据重排）融合到计算密集型操作（如矩阵乘法）中，使用模板中的“锚点”（anchor）插入融合操作。</li>
<li><strong>粗粒度融合</strong>：合并多个操作的并行循环，减少同步开销，提升数据局部性。</li>
</ul></li>
</ul></li>
<li><strong>优化技术</strong>（与 gemm_kernel_8bit 相关）：
<ul>
<li><strong>低精度计算</strong>：支持 Int8 计算（如 gemm_kernel_8bit 中的 8 位整型矩阵乘法），通过分解量化和去量化操作为基本运算（如加法、乘法），减少计算和内存带宽需求。</li>
<li><strong>常量权重预处理</strong>：识别常量权重（如神经网络权重），在编译时生成预处理函数，运行时重用，减少重复计算。</li>
<li><strong>内存布局优化</strong>：通过传播优化的块布局（如 gemm_kernel_8bit 中的 swizA 和 swizB 重排），适配硬件指令（如 MMA）的数据需求。</li>
<li><strong>内存缓冲区重用</strong>：通过生命周期分析重用临时缓冲区，减少内存占用，优化缓存局部性。</li>
<li><strong>分块与并行化</strong>：将矩阵划分为适配缓存和寄存器的小块（如 gemm_kernel_8bit 中的 MB, NB, KB），并使用多核并行循环。</li>
</ul></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250617004450272.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250617004513333.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250617004832584.png" alt="" />
<a href="https://zhuanlan.zhihu.com/p/550602254">深入了解 oneDNN 神经网络计算图编译模块 – oneDNN Graph Compiler 第13篇 编译运行Tensor IR - 知乎</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250617011641325.png" alt="" /></p>
