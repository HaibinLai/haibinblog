---
title: "Cache Bypassing"
description: "记录一个技术。文章用GPT生成的。 Cache Bypassing 是一种计算机体系结构中的优化技术，它通过直接将数据从主内存传送到处理器，而绕过处理器的缓存（cache）层级。通常，处理器缓存（如L1、L2缓存）用于减少访问主内存的延迟，但在某些情况下，绕过缓存可能是更高效的选择。 Cache Bypassing的背景 处理器缓存是一个快速的存储层次，用来减少访问主内存的时间。数据通常被加载到缓存中，当处理器需要访问这些数据时，它首…"
publishedAt: "2024-11-22T07:13:52Z"
updatedAt: "2024-12-04T20:55:28Z"
category: "GPU"
categories: ["GPU"]
tags: []
author: "GB"
draft: false
slug: "cache-bypassing"
legacySlug: "cache-bypassing"
oldSlugs: []
wordpressId: 428
sourceUrl: "https://www.haibinlaiblog.top/index.php/cache-bypassing/"
commentCount: 0
viewCount: 1296
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-11/cache-bypassing/body-001-4b7035af1408.webp"
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-11/cache-bypassing.webp"
---
<p>记录一个技术。文章用GPT生成的。</p>
<p><strong>Cache Bypassing</strong> 是一种计算机体系结构中的优化技术，它通过直接将数据从主内存传送到处理器，而绕过处理器的缓存（cache）层级。通常，处理器缓存（如L1、L2缓存）用于减少访问主内存的延迟，但在某些情况下，绕过缓存可能是更高效的选择。</p>
<h3>Cache Bypassing的背景</h3>
<p>处理器缓存是一个快速的存储层次，用来减少访问主内存的时间。数据通常被加载到缓存中，当处理器需要访问这些数据时，它首先检查缓存是否包含所需的数据（称为缓存命中），如果缓存没有所需的数据（缓存未命中），它将从主内存中加载数据。</p>
<p>然而，在某些情况下，<strong>缓存未命中</strong>的代价可能比直接从主内存读取数据更高。尤其是在以下场景中，cache bypassing 可能是有益的：</p>
<ol>
<li>
<p><strong>数据访问模式不局部</strong>：</p>
<ul>
<li>当数据的访问模式不是局部的或者是随机的时，处理器缓存可能不会起到显著的加速作用。对于这种模式，频繁地加载和丢弃缓存数据可能会导致“缓存污染”，反而增加缓存的负担。</li>
</ul>
</li>
<li>
<p><strong>数据块过大</strong>：</p>
<ul>
<li>有时数据块的大小超出了缓存的有效容量。尝试将这样的大块数据加载到缓存中，不仅会占用大量缓存空间，还可能会导致频繁的缓存替换，从而降低性能。</li>
</ul>
</li>
<li>
<p><strong>写入操作的场景</strong>：</p>
<ul>
<li>在某些内存写入密集的操作中，尤其是涉及大规模写入的数据时，缓存并不总是能提供最佳性能。直接绕过缓存进行内存写入可能比将数据加载到缓存再写入主内存更加高效。</li>
</ul>
</li>
<li>
<p><strong>减少缓存同步开销</strong>：</p>
<ul>
<li>在多核处理器中，缓存之间的同步（例如，写回缓存内容）可能会带来额外的延迟。在某些情况下，绕过缓存直接访问主内存可以减少同步操作的负担。</li>
</ul>
</li>
</ol>
<h3>Cache Bypassing的实现方法</h3>
<p>缓存绕过通常可以通过硬件设计或编程技巧来实现。具体的方法包括：</p>
<ol>
<li>
<p><strong>硬件支持的缓存绕过</strong>：</p>
<ul>
<li>某些处理器架构（如某些x86和ARM处理器）提供硬件支持的缓存绕过机制。例如，处理器可能有特定的指令或配置，允许程序直接控制是否将数据加载到缓存中。</li>
</ul>
</li>
<li>
<p><strong>编译器优化</strong>：</p>
<ul>
<li>编译器可能会在编译期间生成特定的指令，来提示处理器绕过缓存。例如，使用一些特定的编译标志或属性来控制内存访问。</li>
</ul>
</li>
<li>
<p><strong>编程接口</strong>：</p>
<ul>
<li>高级语言（如C或C++）也可能提供特定的API，允许程序员显式地指定某些数据应该绕过缓存。例如，在一些体系结构中，可以使用<code>volatile</code>关键字来避免编译器对数据进行缓存优化，或者直接使用特定的内存访问指令来强制数据绕过缓存。</li>
</ul>
</li>
</ol>
<h3>Cache Bypassing的优缺点</h3>
<h4>优势：</h4>
<ol>
<li>
<p><strong>减少缓存污染</strong>：</p>
<ul>
<li>避免将不常访问的数据加载到缓存中，从而减少缓存的替换和污染，保持缓存中的热点数据，提高整体性能。</li>
</ul>
</li>
<li>
<p><strong>提高某些内存访问模式的性能</strong>：</p>
<ul>
<li>对于某些访问模式（如全局性、大块的连续数据读写），绕过缓存可能会比传统的缓存访问更有效。</li>
</ul>
</li>
<li>
<p><strong>减轻缓存同步的负担</strong>：</p>
<ul>
<li>在多核处理器中，绕过缓存可以减少缓存一致性协议所需的开销。</li>
</ul>
</li>
</ol>
<h4>缺点：</h4>
<ol>
<li>
<p><strong>可能增加内存延迟</strong>：</p>
<ul>
<li>如果绕过缓存，处理器将直接访问较慢的主内存，这可能导致更高的延迟，特别是在高速缓存未能有效减少内存访问延迟时。</li>
</ul>
</li>
<li>
<p><strong>更高的编程复杂度</strong>：</p>
<ul>
<li>管理哪些数据应该绕过缓存，哪些不应该，是一个复杂的问题，需要对应用的内存访问模式有深入的了解。过度依赖绕过缓存可能会增加程序的复杂性。</li>
</ul>
</li>
<li>
<p><strong>降低缓存利用率</strong>：</p>
<ul>
<li>不使用缓存的情况下，可能会导致较低的缓存命中率，从而影响整体的计算效率。</li>
</ul>
</li>
</ol>
<h3>使用场景</h3>
<ol>
<li>
<p><strong>大规模数据处理</strong>：</p>
<ul>
<li>对于涉及大量数据并且数据之间访问不局部的算法，如某些科学计算、矩阵运算、图形渲染等，缓存绕过可能有助于提高性能。</li>
</ul>
</li>
<li>
<p><strong>写入密集型应用</strong>：</p>
<ul>
<li>当应用进行大量的内存写入操作时，绕过缓存可能会减少缓存一致性协议的负担，从而提高性能。</li>
</ul>
</li>
<li>
<p><strong>嵌入式系统和实时系统</strong>：</p>
<ul>
<li>在一些低功耗、低延迟要求的嵌入式或实时系统中，可能需要避免缓存引入的延迟。</li>
</ul>
</li>
</ol>
<h3>总结</h3>
<p>Cache Bypassing 是一种优化策略，通过直接访问主内存而绕过处理器缓存，旨在提高某些特定场景下的性能。它适用于数据访问模式不局部、大规模数据处理或写入密集型的任务，但也需要谨慎使用，因为它可能会增加内存延迟，减少缓存利用率，并且增加编程复杂度。在实际应用中，开发者通常需要根据具体的硬件架构和应用需求来决定是否采用缓存绕过技术。</p>
<h1>CUDA Cache Bypassing</h1>
<p>在CUDA编程中，<code>cache bypassing</code>（缓存绕过）是一种优化技术，用于控制数据访问时是否绕过GPU的缓存。这通常在处理具有特定内存访问模式的高性能计算任务时非常有用，比如避免缓存污染，或者减少缓存引起的延迟。</p>
<p>通常来说，CUDA中的缓存机制是通过硬件来管理的，自动决定何时将数据存入缓存以提高访问速度。然而，在某些情况下，开发者希望显式地绕过缓存，以便获得更好的性能。</p>
<h3>1. <strong>使用<code>__ldg</code>指令来绕过L1缓存</strong></h3>
<p><code>__ldg</code>（load global）是一个CUDA内建函数，它告诉CUDA硬件使用只读全局内存访问模式绕过L1缓存，但仍然利用L2缓存。对于那些频繁读取且不常修改的全局数据，使用<code>__ldg</code>可以减少L1缓存的冲突，避免缓存污染。</p>
<p><a href="https://blog.csdn.net/jqw11/article/details/104717743">cude的__ldg使用_cuda ldg指令-CSDN博客</a></p>
<pre><code class="language-cpp">#include &lt;iostream&gt;
#include &lt;cuda_runtime.h&gt;

__global__ void cacheBypassExample(int *d_data, int *d_result) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    // 使用 __ldg 指令绕过 L1 缓存，直接访问 L2 缓存
    d_result[idx] = __ldg(&amp;d_data[idx]);
}

int main() {
    const int size = 1024;
    int h_data[size], h_result[size];

    // 初始化数据
    for (int i = 0; i &lt; size; i++) {
        h_data[i] = i;
    }

    int *d_data, *d_result;

    // 分配设备内存
    cudaMalloc((void**)&amp;d_data, size * sizeof(int));
    cudaMalloc((void**)&amp;d_result, size * sizeof(int));

    // 将数据从主机复制到设备
    cudaMemcpy(d_data, h_data, size * sizeof(int), cudaMemcpyHostToDevice);

    // 调用内核
    cacheBypassExample&lt;&lt;&lt;(size + 255) / 256, 256&gt;&gt;&gt;(d_data, d_result);

    // 将结果从设备复制到主机
    cudaMemcpy(h_result, d_result, size * sizeof(int), cudaMemcpyDeviceToHost);

    // 打印部分结果
    for (int i = 0; i &lt; 10; i++) {
        std::cout &lt;&lt; h_result[i] &lt;&lt; &quot; &quot;;
    }

    // 清理资源
    cudaFree(d_data);
    cudaFree(d_result);

    return 0;
}</code></pre>
<h3>解释</h3>
<ul>
<li><code>__ldg</code>是一个内建函数，它告诉CUDA硬件直接从全局内存读取数据，而不通过L1缓存。它通常用于只读数据（即不经常被修改的数据），这有助于避免L1缓存的冲突和污染。</li>
<li><code>__ldg</code> 仍然会通过L2缓存访问数据，因此这比完全绕过缓存要更有效率。</li>
</ul>
<h3>2. <strong>直接操作共享内存绕过缓存</strong></h3>
<p>在某些情况下，我们可以通过使用共享内存来优化访问模式，从而绕过某些硬件缓存的影响。共享内存是每个块内的线程共享的高带宽、低延迟内存区域。</p>
<pre><code class="language-cpp">__global__ void sharedMemoryCacheBypass(int *d_data, int *d_result) {
    extern __shared__ int shared_data[];

    int idx = threadIdx.x + blockIdx.x * blockDim.x;

    // 将全局内存数据加载到共享内存
    shared_data[threadIdx.x] = d_data[idx];
    __syncthreads();  // 确保所有线程都完成了数据加载

    // 使用共享内存进行计算，避免访问全局内存
    d_result[idx] = shared_data[threadIdx.x];
}

int main() {
    const int size = 1024;
    int h_data[size], h_result[size];

    for (int i = 0; i &lt; size; i++) {
        h_data[i] = i;
    }

    int *d_data, *d_result;
    cudaMalloc((void**)&amp;d_data, size * sizeof(int));
    cudaMalloc((void**)&amp;d_result, size * sizeof(int));

    cudaMemcpy(d_data, h_data, size * sizeof(int), cudaMemcpyHostToDevice);

    // 计算共享内存的大小
    int sharedMemorySize = size * sizeof(int);
    sharedMemoryCacheBypass&lt;&lt;&lt;(size + 255) / 256, 256, sharedMemorySize&gt;&gt;&gt;(d_data, d_result);

    cudaMemcpy(h_result, d_result, size * sizeof(int), cudaMemcpyDeviceToHost);

    for (int i = 0; i &lt; 10; i++) {
        std::cout &lt;&lt; h_result[i] &lt;&lt; &quot; &quot;;
    }

    cudaFree(d_data);
    cudaFree(d_result);

    return 0;
}</code></pre>
<h3>解释</h3>
<ul>
<li>在这个示例中，我们将数据从全局内存加载到共享内存中，避免了多次访问全局内存。</li>
<li>共享内存是每个块内线程共享的，并且不经过L1缓存，因此当你使用共享内存时，可以绕过L1缓存的影响。</li>
</ul>
<h3>3. <strong>缓存优化的建议</strong></h3>
<p>在实际编程中，并不是所有的缓存绕过都能带来性能提升。绕过缓存可能会增加内存访问延迟，特别是在小数据集的情况下。以下是一些性能优化的常见建议：</p>
<ul>
<li><strong>数据局部性</strong>：确保内存访问是连续的，最大化缓存的命中率。</li>
<li><strong>合理使用<code>__ldg</code></strong>：对于不常修改且读取频繁的数据，使用<code>__ldg</code>可以有效减少L1缓存的冲突。</li>
<li><strong>共享内存</strong>：对于每个块内部的线程共享的数据，使用共享内存可以降低全局内存访问带来的延迟。</li>
<li><strong>避免过多的全局内存访问</strong>：减少全局内存访问，避免内存访问瓶颈。</li>
</ul>
<p>总的来说，缓存绕过通常在特定的高性能计算场景中发挥作用，因此在应用这些优化时，需要针对具体的工作负载进行评估和实验。</p>
<h1>EOF</h1>
