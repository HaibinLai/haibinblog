---
title: "xFastTransformer 架构解读"
description: "省流：这东西2年前做的，最麻烦的是文档很少，基本都要从零开始研究代码，考虑时间成本我没有花很多精力。 如果大家想在单机上用CPU推理，也可以试试intel pytorch extension或者llama.cpp。（不过xFt相比他们俩的好处是，它的代码结构也相对比较简单易懂，大家都可以自由选择） 但是目前这个东西没有用计算图优化，它每次计算都要重开openmp并行域，感觉这会出点问题。 Examples — Intel® Exten…"
publishedAt: "2025-06-13 12:57:14"
category: "Frameworks"
tags: ["CPP", "推理引擎"]
draft: false
slug: "xfasttransformer-架构解读"
legacySlug: "xfasttransformer-架构解读"
wordpressId: 861
sourceUrl: "https://haibin-blog.vercel.app/index.php/xfasttransformer-%e6%9e%b6%e6%9e%84%e8%a7%a3%e8%af%bb/"
commentCount: 0
importedFromWordPress: true
---
<p>省流：这东西2年前做的，最麻烦的是文档很少，基本都要从零开始研究代码，考虑时间成本我没有花很多精力。
如果大家想在单机上用CPU推理，也可以试试intel pytorch extension或者llama.cpp。（不过xFt相比他们俩的好处是，它的代码结构也相对比较简单易懂，大家都可以自由选择）</p>
<p>但是目前这个东西没有用计算图优化，它每次计算都要重开openmp并行域，感觉这会出点问题。
<a href="https://intel.github.io/intel-extension-for-transformers/latest/docs/examples.html">Examples — Intel® Extension for Transformers 0.1.dev1+g087056c documentation</a>
<a href="https://intel.github.io/intel-extension-for-transformers/latest/docs/Welcome.html">Intel® Extension for Transformers: Accelerating Transformer-based Models on Intel Platforms — Intel® Extension for Transformers 0.1.dev1+g087056c documentation</a></p>
<h2>介绍文章</h2>
<p><a href="https://www.infoq.cn/article/tgT8OHcDCAhMyDQYewyA">CPU也能玩转LLM：如何使用xFasterTransformer加速百亿级参数大模型_AI&amp;大模型_黄文欢_InfoQ精选文章</a>
<a href="https://zhuanlan.zhihu.com/p/668859852">全球领先的 LLM CPU 解决方案 xFasterTransformer - 知乎</a></p>
<p>github
<a href="https://github.com/intel/xFasterTransformer">intel/xFasterTransformer</a>
官方文档和微信群
<a href="https://github.com/intel/xFasterTransformer/wiki">Home · intel/xFasterTransformer Wiki</a></p>
<p>与Pytorch对比是真的狗，因为Pytorch本身就很烂
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612101640947.png" alt="" /></p>
<p>xFasterTransformer  是英特尔开源的推理框架，其遵循 Apache2.0 许可，为 LLM 在 CPU 平台上的推理加速提供了一种深度优化的解决方案。xFasterTransformer 支持分布式推理，支持单机跨 socket 的分布式部署，也支持多机跨节点的分布式部署。并提供了 C++和 Python 两种 API 接口，涵盖了从上层到底层的接口调用，易于用户使用并将其集成到自有业务框架中。xFasterTransformer 支持 BF16，FP16，INT8，INT4 等多种数据类型及多种 LLM 主流模型，比如 ChatGLM，ChatGLM2/3， Llama/Llama2，Baichuan，QWEN，OPT 以及 SecLLM(YaRN-Llama)等。其框架设计如图 1 所示。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612101728504.png" alt="1749741442526.jpg" /></p>
<h2>优化策略</h2>
<p>根据论文，有这么几个优化</p>
<ol>
<li>分布式推理通信优化，减少通信次数
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612102428638.png" alt="" /></li>
<li>使用MKL/oneDNN加速库</li>
<li>算子融合，针对不同长度的序列采用不同的kernel，保证访存效率最高，采取不同的优化算法来进行优化</li>
<li>-低精度量化和稀疏化</li>
</ol>
<h2>整体架构</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612120225283.png" alt="" /></p>
<p>对比LLM推理的走过的整个结构 （Qwen2.5-32B）
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612130528990.png" alt="" />
大语言模型所有算子逻辑 - 骑虎南下的文章 - 知乎
<a href="https://zhuanlan.zhihu.com/p/1909996866432668841">https://zhuanlan.zhihu.com/p/1909996866432668841</a></p>
<h2>xFt example解读</h2>
<p>我们可以从这个例子开始研究
<a href="https://github.com/intel/xFasterTransformer/blob/main/examples/cpp/README.md">xFasterTransformer/examples/cpp/README.md at main · intel/xFasterTransformer</a></p>
<p>我们可以从它给的example开始研究
<a href="https://github.com/intel/xFasterTransformer/blob/main/examples/cpp/example.cpp">xFasterTransformer/examples/cpp/example.cpp at main · intel/xFasterTransformer</a></p>
<p>在导入模型后，这里我们就开始生成token了：</p>
<pre><code class="language-cpp">for (int i = 0; i &lt; loop; ++i) {
        secondIdCount = 0;

        // New path
        model.set_input(inputs, /*maxLen*/ maxLen, /*numBeams*/ numBeams, /*numBeamHypsToKeep*/ 1,
                /*lenPenalty*/ 1.0,
                /*doEarlyStopping*/ false, /*eosTokenId*/ -1, /*padTokenId*/ -1,
                /*doSample*/ doSample, /*temperature*/ temperature,
                /*topK*/ topK, /*topP*/ topP, /*repetitionPenalty*/ repetitionPenalty);

        std::vector&lt;int&gt; firstIds;
        std::vector&lt;int&gt; secondIds;

        if (!model.isDone()) {
            Timer t(isMaster, &quot;[INFO] First token&quot;);
            firstIds = model.generate();
        }

        Timer timerSecond;
        if (!model.isDone()) {
            secondIds = model.generate();
            secondIdCount++;
        }

        if (isMaster &amp;&amp; streamingOutput) {
            if (!firstIds.empty()) {
                tokenizer-&gt;printResult(firstIds, batchSize, numBeams);
                if (!secondIds.empty()) { tokenizer-&gt;printResult(secondIds, batchSize, numBeams); }
            }
        }

        while (!model.isDone()) {
            auto nextIds = model.generate();
            secondIdCount++;
            if (isMaster &amp;&amp; streamingOutput) { tokenizer-&gt;printResult(nextIds, batchSize, numBeams); }
        }
        if (isMaster &amp;&amp; secondIdCount &gt; 0) {
            auto avgDuration = timerSecond.getTime() / float(secondIdCount);
            std::cout &lt;&lt; std::endl &lt;&lt; &quot;[INFO] Second token time: &quot; &lt;&lt; avgDuration &lt;&lt; &quot; ms&quot; &lt;&lt; std::endl;
        }
        auto result = model.finalize();

        if (isMaster) {
            std::cout &lt;&lt; &quot;\n[INFO] Final output is: &quot; &lt;&lt; std::endl;
            std::vector&lt;std::string&gt; sent = tokenizer-&gt;batchDecode(result, batchSize);
            for (auto str : sent) {
                std::cout &lt;&lt; &quot;==============================================&quot; &lt;&lt; std::endl;
                std::cout &lt;&lt; str &lt;&lt; std::endl;
            }
        }
    }</code></pre>
<p>可以看到，在第一第二个id出来后，模型将不停的调用<code>model.generate()</code>方法生成新的id</p>
<p>总体结构可以用下面这段概括：</p>
<pre><code class="language-cpp">auto nextIds = model.generate();
secondIdCount++;
if (isMaster &amp;&amp; streamingOutput) { tokenizer-&gt;printResult(nextIds, batchSize, numBeams); }</code></pre>
<h3>model.generate</h3>
<p>这段代码在<a href="https://github.com/intel/xFasterTransformer/blob/main/src/models/models.cpp#L834">xFasterTransformer/src/models/models.cpp at main · intel/xFasterTransformer</a></p>
<p><code>Model::generate</code> 函数的目的是根据输入的 token（inputIds）或当前状态，从语言模型中生成下一个 token 或一系列 token。也就是自回归生成（autoregressive generation），即模型逐步生成输出序列。</p>
<pre><code class="language-cpp">// We assume all gen kwargs in the batch are the same
// and all sequences are all prompts(step==0) or all decodes(step&gt;0)
std::vector&lt;int32_t&gt; Model::generate() {

// 这段代码处理了一个特殊情况，即模型没有用自己generate的方法，而是使用了外部的 searcher 对象来生成 token。
    // TODO: Deprecate the following Path
    if (searcher != nullptr) {
        if (inputIds.empty()) {
            printf(&quot;Please set input tokens by model.input().\n&quot;);
            exit(-1);
        }
        if (isNewInput) {
            isNewInput = false;
            return searcher-&gt;getNextToken(inputIds.data(), batchSize, inputIds.size() / batchSize);
        } else {
            return searcher-&gt;getNextToken();
        }
    } else // 模型使用自己的方法生成token
    {
        // TODO
        // Assume that all sequences in the group are all prompts or all decodes.
        // Prepare input data for the decoder.
        std::vector&lt;SequenceMeta *&gt; workingSeqs;
        for (auto x : workingGroup) {
            workingSeqs.push_back(x-&gt;get(0));
            if (x-&gt;getGroupSize() &gt; 1 &amp;&amp; x-&gt;getStep() &gt; 1) {
                for (int32_t i = 1; i &lt; x-&gt;getGroupSize(); i++) {
                    workingSeqs.push_back(x-&gt;get(i));
                }
            }
        }
        std::tuple&lt;float *, int, int&gt; result = decoder-&gt;forward(workingSeqs, false);
        float *outBuf = std::get&lt;0&gt;(result);
        int sampleOffset = std::get&lt;1&gt;(result);
        int sampleSize = std::get&lt;2&gt;(result);

        // Assume all gen kwargs in the batch are the same
        auto &amp;config = workingGroup[0]-&gt;getSamplingMeta()-&gt;config;

        if (config.numBeams != 1) {
            // TODO: BeamSearch
            throw std::logic_error(&quot;Beam Search Method not implemented&quot;);
        } else {

            // Logits processor
            // Repetition penalty
            if (config.repetitionPenalty != 1.0) {
                repetitionPenaltyLogitsProcess(outBuf, sampleOffset, sampleSize, workingGroup);
            }

            std::vector&lt;int&gt; result;

            if (config.doSample) {
                //TODO: samling
                throw std::logic_error(&quot;Sampling Method not implemented&quot;);
            } else {
                // Greedy search
                result = greedySearch(outBuf, sampleOffset, sampleSize, batchSize);
            }

            // Check stop status
            stopCheck(result, workingGroup);

            // Step forward on all seqs
            for (int i = 0; i &lt; workingGroup.size(); i++) {
                workingGroup[i]-&gt;get(0)-&gt;stepForward(result[i]);
            }

            return result;
        }
        throw std::logic_error(&quot;Method not implemented&quot;);
        return {};
    }
}</code></pre>
<h3>准备token</h3>
<pre><code class="language-CPP">        // TODO
        // Assume that all sequences in the group are all prompts or all decodes.
        // Prepare input data for the decoder.
        std::vector&lt;SequenceMeta *&gt; workingSeqs;
        for (auto x : workingGroup) {
            workingSeqs.push_back(x-&gt;get(0));
            if (x-&gt;getGroupSize() &gt; 1 &amp;&amp; x-&gt;getStep() &gt; 1) {
                for (int32_t i = 1; i &lt; x-&gt;getGroupSize(); i++) {
                    workingSeqs.push_back(x-&gt;get(i));
                }
            }
        }</code></pre>
<ul>
<li><strong>功能</strong>：为解码器准备输入数据（workingSeqs），从 workingGroup 中提取序列元数据（SequenceMeta）。</li>
<li><strong>逻辑</strong>：
<ul>
<li>workingGroup 是一个包含多个序列组的容器，每个组可能包含多个序列（可能是为了支持束搜索或多序列生成）。</li>
<li>默认情况下，每个组的第一个序列（x-&gt;get(0)）被添加到 workingSeqs。</li>
<li>如果某个组有多个序列（getGroupSize() &gt; 1）且生成步骤大于 1（getStep() &gt; 1），则将该组中的其他序列也添加到 workingSeqs。</li>
</ul></li>
<li><strong>假设</strong>：代码假设所有序列要么全都是提示（prompt，初始输入），要么全都是解码（decode，已生成部分序列）。</li>
</ul>
<h3>Forward</h3>
<pre><code class="language-CPP">std::tuple&lt;float *, int, int&gt; result = decoder-&gt;forward(workingSeqs, false);
float *outBuf = std::get&lt;0&gt;(result);
int sampleOffset = std::get&lt;1&gt;(result);
int sampleSize = std::get&lt;2&gt;(result);</code></pre>
<ul>
<li><strong>功能</strong>：调用解码器（decoder-&gt;forward）进行前向传播，生成 logits。</li>
<li><strong>输入</strong>：
<ul>
<li>workingSeqs：待处理的序列元数据。</li>
<li>false：可能是控制某些行为的标志（例如是否缓存中间状态）。</li>
</ul></li>
<li><strong>输出</strong>：
<ul>
<li>outBuf：包含 logits 的数组，表示模型对下一个 token 的概率分布。</li>
<li>sampleOffset 和 sampleSize：用于指定 logits 的有效范围（可能是为了处理批处理或序列长度不一致）。</li>
</ul></li>
</ul>
<h3>采样+后处理</h3>
<pre><code class="language-CPP">auto &amp;config = workingGroup[0]-&gt;getSamplingMeta()-&gt;config;

if (config.repetitionPenalty != 1.0) {
    repetitionPenaltyLogitsProcess(outBuf, sampleOffset, sampleSize, workingGroup);
}

std::vector&lt;int&gt; result;
if (config.doSample) {
    throw std::logic_error(&quot;Sampling Method not implemented&quot;);
} else {
    result = greedySearch(outBuf, sampleOffset, sampleSize, batchSize);
}</code></pre>
<p>根据配置选择生成下一个 token 的方法。</p>
<p>logits 是模型在预测下一个单词（或 token）时，给出的“原始分数”。这些分数还没有被转换成概率，所以可以看作是模型对每个可能结果的“偏好”或“信心”。</p>
<p>**- 在 Model::generate 代码中，decoder-&gt;forward 生成了 logits（outBuf），这些 logits 就是模型对每个可能 token 的原始分数。</p>
<ul>
<li>然后，代码通过 greedySearch（贪婪搜索）直接选分数最高的 token，或者在未来可能通过采样（doSample）根据概率随机选一个。</li>
</ul>
<h3>greedy Search</h3>
<p>贪婪搜索是一种简单的策略：<strong>在每个生成步骤中，选择概率最高的下一个词（或 token）</strong>。在代码中，输入的 logits 是模型对每个可能 token 的“分数”，贪婪搜索的任务是找到每个序列中分数最高的 token ID。</p>
<p>其实它的本质是：<strong>多线程找一个数组内的最大值</strong></p>
<p>例如：</p>
<ul>
<li>输入 logits：<code>[2.5, 1.3, 4.7, 0.8]</code>（对应 token ID 0, 1, 2, 3）</li>
<li>
<p>贪婪搜索会选择 4.7 对应的 token ID 2，因为它分数最高。</p>
<p><strong>贪婪搜索的具体流程</strong></p>
</li>
</ul>
<ol>
<li><strong>输入 logits</strong>：
<ul>
<li>logits 是一个大数组，包含 batchSize 个序列的 logits，每个序列有 sampleSize 个分数。</li>
<li>例如，若 batchSize=2, sampleSize=4，logits 可能是：</li>
</ul></li>
</ol>
<pre><code class="language-txt">[2.5, 1.3, 4.7, 0.8,  // 序列 1
 1.1, 3.2, 0.9, 2.8]  // 序列 2</code></pre>
<ol start="2">
<li><strong>并行处理</strong>：
<ul>
<li>如果线程数多，每个序列的 logits 分给多个线程，每线程找局部最大值，然后归约。</li>
<li>如果线程数少，每个序列由一个线程处理，直接找最大值。</li>
</ul></li>
<li><strong>分布式归约</strong>：
<ul>
<li>如果有多个节点（msgerSize &gt; 1），各节点计算的局部最大值通过 allgatherv 收集，找到全局最大值。</li>
</ul></li>
<li><strong>输出</strong>：
<ul>
<li>返回 maxIds，例如 [2, 1]（序列 1 选 token ID 2，序列 2 选 token ID 1）。</li>
</ul></li>
</ol>
<pre><code class="language-CPP">namespace xft {
// Assume all samples have the same sampling params.
std::vector&lt;int&gt; greedySearch(float *logits, int sampleOffset, int sampleSize, int batchSize) {
    TimeLine t(&quot;GreedySearch&quot;);

    Messenger &amp;messenger = Messenger::getInstance();
    int numThreads = 0;
#pragma omp parallel
    {
        int tid = omp_get_thread_num();
        if (tid == 0) { numThreads = omp_get_num_threads(); }
    }

    auto msgerSize = messenger.getSize();

    // Max ID and value for each sample
    std::vector&lt;int&gt; maxIds(batchSize);
    float maxVals[batchSize];

    // Small batch size (each sample can have at least 2 threads)
    if (numThreads / batchSize &gt;= 2) {
        int thrPerSample = numThreads / batchSize;
        int sizePerThr = (sampleSize + thrPerSample - 1) / thrPerSample;
        int maxIndices[batchSize * thrPerSample];
        float maxValues[batchSize * thrPerSample];

        // TODO: if size is small, possible to cause out of boundary
#pragma omp parallel for collapse(2)
        for (int b = 0; b &lt; batchSize; ++b) {
            for (int t = 0; t &lt; thrPerSample; ++t) { // thread index inside the sample
                int start = t * sizePerThr;
                int end = (start + sizePerThr) &gt; sampleSize ? sampleSize : (start + sizePerThr);
                float *p = logits + b * sampleSize;

                int maxIdx = start;
                float maxVal = p[start];
                for (int off = start + 1; off &lt; end; ++off) {
                    if (p[off] &gt; maxVal) {
                        maxVal = p[off];
                        maxIdx = off;
                    }
                }

                // False sharing happens, but since only one time, not avoided
                maxIndices[b * thrPerSample + t] = maxIdx;
                maxValues[b * thrPerSample + t] = maxVal;
            }
        }

        // Local reduction
        for (int i = 0; i &lt; batchSize; ++i) {
            int *pIndices = maxIndices + i * thrPerSample;
            float *pValues = maxValues + i * thrPerSample;
            int maxIdx = pIndices[0];
            float maxVal = pValues[0];
            for (int j = 1; j &lt; thrPerSample; ++j) {
                if (pValues[j] &gt; maxVal) {
                    maxVal = pValues[j];
                    maxIdx = pIndices[j];
                }
            }
            maxIds[i] = maxIdx;
            maxVals[i] = maxVal;
        }
    }

    // Each thread handle one sample (one row)
    else {
#pragma omp parallel for
        for (int i = 0; i &lt; batchSize; ++i) {
            int maxId = 0;
            float *p = logits + i * sampleSize;
            float maxVal = p[0];
            for (int j = 1; j &lt; sampleSize; ++j) {
                if (p[j] &gt; maxVal) {
                    maxVal = p[j];
                    maxId = j;
                }
            }
            maxIds[i] = maxId;
            maxVals[i] = maxVal;
        }
    }

    // Reduce to get the max index (any better method??)
    if (msgerSize &gt; 1) {
        float sendBuf[2 * batchSize];
        float recvBuf[2 * batchSize * msgerSize];

        for (int i = 0; i &lt; batchSize; ++i) {
            sendBuf[2 * i] = (float)(maxIds[i] + sampleOffset);
            sendBuf[2 * i + 1] = maxVals[i];
        }

        std::vector&lt;long unsigned int&gt; recvCount(msgerSize, static_cast&lt;long unsigned int&gt;(2 * batchSize));
        messenger.allgatherv(sendBuf, 2 * batchSize, recvBuf, recvCount);

        for (int i = 0; i &lt; batchSize; ++i) {
            int maxId = (int)(recvBuf[2 * i] + 0.5f);
            float maxVal = recvBuf[2 * i + 1];
            for (int j = 1; j &lt; msgerSize; ++j) {
                if (recvBuf[2 * j * batchSize + 2 * i + 1] &gt; maxVal) {
                    maxVal = recvBuf[2 * j * batchSize + 2 * i + 1];
                    maxId = (int)(recvBuf[2 * j * batchSize + 2 * i] + 0.5f);
                }
            }
            maxIds[i] = maxId;
        }
    }

    return maxIds;
}
</code></pre>
<h2>前向传播</h2>
<p>在刚刚的学习中，我们看到有这段话：
<code>result = decoder-&gt;forward(workingSeqs, false);</code>
它才是整个架构的精髓。</p>
<p><a href="https://github.com/intel/xFasterTransformer/blob/main/src/models/models.cpp#L760">xFasterTransformer/src/models/models.cpp at main · intel/xFasterTransformer</a></p>
<p>这段 Model::forward 函数是语言模型（LLM）推理过程中的一个关键部分，负责执行模型的前向传播，生成 logits（模型对每个可能 token 的原始分数）。它支持单机和分布式环境，并处理批次中的序列（prompt 或 decode）。</p>
<pre><code class="language-CPP">std::tuple&lt;float *, int, int&gt; Model::forward(bool logitsAll) {
    // This forward will sync and gather all logits.
    // Return is a tuple of (logits, totalSeqSize, VocabSize)
    // TODO: Deprecate the following Path
    // Old path reture is (logits, offset, size)
    if (searcher != nullptr) {
        int64_t dims[3] = {batchSize, 1, seqLen};
        return decoder-&gt;forward(inputIds.data(), dims, 0, logitsAll);
    }
    // TODO: checking waiting queue
    if (workingGroup.empty()) {
        printf(&quot;Please input prompt first.\n&quot;);
        exit(-1);
    }
    // Assume that all sequences in the group are all prompts or all decodes.
    // Prepare input data for the decoder.
    std::vector&lt;SequenceMeta *&gt; workingSeqs;
    for (auto x : workingGroup) {
        workingSeqs.push_back(x-&gt;get(0));
        if (x-&gt;getGroupSize() &gt; 1 &amp;&amp; x-&gt;getStep() &gt; 1) {
            for (int32_t i = 1; i &lt; x-&gt;getGroupSize(); i++) {
                workingSeqs.push_back(x-&gt;get(i));
            }
        }
    }

    std::tuple&lt;float *, int, int&gt; result = decoder-&gt;forward(workingSeqs, logitsAll);

    int totalSeqSize = workingSeqs.size();
    if (logitsAll &amp;&amp; workingSeqs[0]-&gt;getStep() == 0) {
        totalSeqSize = 0;
        for (auto x : workingSeqs) {
            totalSeqSize += x-&gt;getInputSeqLen();
        }
    }

    Messenger &amp;messenger = decoder-&gt;getMessenger();
    if (messenger.getSize() &gt; 1) {
        // Sync and gather all logits
        float *outBuf = std::get&lt;0&gt;(result);

        int workers = messenger.getSize();
        int splitSize = vocabSize / workers;
        std::vector&lt;long unsigned int&gt; recvCount(workers);
        std::vector&lt;long unsigned int&gt; splitSizes(workers);
        for (int i = 0; i &lt; workers; i++) {
            splitSizes[i] = splitSize;
            if (i &lt; vocabSize % workers) { splitSizes[i]++; }
            recvCount[i] = splitSizes[i] * totalSeqSize;
        }
        // warning: vocabSize * totalSeqSize may exceed the range of int when seq and batch size is large.
        logits.resize(vocabSize * totalSeqSize);
        logitsRecvBuf.resize(vocabSize * totalSeqSize);
        messenger.allgatherv(outBuf, recvCount[messenger.getRank()], logitsRecvBuf.data(), recvCount);

        // Reorder
        int offset = 0;
        for (int i = 0; i &lt; workers; ++i) {
            for (int j = 0; j &lt; totalSeqSize; ++j) {
                memcpy(logits.data() + (offset + j * vocabSize),
                        logitsRecvBuf.data() + offset * totalSeqSize + j * splitSizes[i],
                        splitSizes[i] * sizeof(float));
            }
            offset += splitSizes[i];
        }

        return std::tuple&lt;float *, int, int&gt;(logits.data(), totalSeqSize, vocabSize);
    } else {
        return std::tuple&lt;float *, int, int&gt;(std::get&lt;0&gt;(result), totalSeqSize, vocabSize);
    }
}</code></pre>
<h3>推理过程图</h3>
<p><a href="https://github.com/intel/xFasterTransformer/blob/bc14a70c5ab33f82f9d5b64ddcf5cff8881cacc5/src/models/common_decoder.h#L72">xFasterTransformer/src/models/common_decoder.h at bc14a70c5ab33f82f9d5b64ddcf5cff8881cacc5 · intel/xFasterTransformer</a></p>
<pre><code class="language-txt">/*
Pipeline parallel and tensor parallel introduction:

  1) MPI_Instances = 16,XFT_PIPELINE_STAGE = 4  =&gt;  ctx-&gt;ppSize = 4, ctx-&gt;tpSize = 4
  2) TP sync by oneCCL(row_comm) or shared_memory
  3) PP sync by MPI MPI_COMM_WORLD

  World Rank:      =&gt; Row Rank:       =&gt; Rank:  tp0 tp1 tp2 tp3
  [ 0,  1,  2,  3,    [ 0, 1, 2, 3];      pp0 [  0,  1,  2,  3];
    4,  5,  6,  7,    [ 0, 1, 2, 3];      pp1 [  0,  1,  2,  3];
    8,  9, 10, 11,    [ 0, 1, 2, 3];      pp2 [  0,  1,  2,  3];
   12, 13, 14, 15];   [ 0, 1, 2, 3];      pp3 [  0,  1,  2,  3];

                                      Prompts
                                         │
            ┌──────────────────┬─────────┴────────┬──────────────────┐
            │                  │                  │                  │
            ▼                  ▼                  ▼                  ▼
       Embedding(PP0)     Embedding(PP0)     Embedding(PP0)     Embedding(PP0)
            │                  │                  │                  │
  PP0       │                  │                  │                  │
  ┌─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┐
  │ TP0     │          TP1     │          TP2     │          TP3     │    layer0-7  │
  │ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐     │
  │ │ OMP            │ │ OMP            │ │ OMP            │ │ OMP            │     │
  │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │     │
  │ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│     │
  │ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘     │
  │ ┌───────┼──────────────────┼─────AllReduce────┼──────────────────┼────────┐     │
  │ └───────┼──────────────────┼──────────────────┼──────────────────┼────────┘     │
  └─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
  PP1       │ MPI Send/Recv    │                  │                  │
  ┌─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┐
  │ TP0     │          TP1     │           TP2    │            TP3   │   layer8-15  │
  │ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐     │
  │ │ OMP            │ │ OMP            │ │ OMP            │ │ OMP            │     │
  │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │     │
  │ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│     │
  │ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘     │
  │ ┌───────┼──────────────────┼─────AllReduce────┼──────────────────┼────────┐     │
  │ └───────┼──────────────────┼──────────────────┼──────────────────┼────────┘     │
  └─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
  PP2       │ MPI Send/Recv    │                  │                  │
  ┌─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┐
  │ TP0     │          TP1     │           TP2    │            TP3   │  layer16-23  │
  │ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐     │
  │ │ OMP            │ │ OMP            │ │ OMP            │ │ OMP            │     │
  │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │     │
  │ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│     │
  │ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘     │
  │ ┌───────┼──────────────────┼─────AllReduce────┼──────────────────┼────────┐     │
  │ └───────┼──────────────────┼──────────────────┼──────────────────┼────────┘     │
  └─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
  PP3       │ MPI Send/Recv    │                  │                  │
  ┌─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┐
  │ TP0     │          TP1     │           TP2    │            TP3   │  layer24-31  │
  │ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐     │
  │ │ OMP            │ │ OMP            │ │ OMP            │ │ OMP            │     │
  │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │ │ │ │ │ │ │ │    │     │
  │ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│ │ ▼ ▼ ▼ ▼ ▼ ▼ ...│     │
  │ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘     │
  │ ┌───────┼──────────────────┼─────AllReduce────┼──────────────────┼────────┐     │
  │ └───────┼──────────────────┼──────────────────┼──────────────────┼────────┘     │
  └─────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
            │                  │                  │                  │
            ▼                  ▼                  ▼                  ▼
       Predictor(PP3)     Predictor(PP3)     Predictor(PP3)     Predictor(PP3)
            │ MPI Send/Recv    │                  │                  │
            ▼                  ▼                  ▼                  ▼
       Searchers(PP0)     Searchers(PP0)     Searchers(PP0)     Searchers(PP0)
            │
            ▼
         Output
*/</code></pre>
<h2>flash attention</h2>
<p><a href="https://github.com/intel/xFasterTransformer/blob/main/src/layers/attention.h#L1121">xFasterTransformer/src/layers/attention.h at main · intel/xFasterTransformer</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250612133204594.png" alt="" /></p>
<pre><code class="language-CPP">    template &lt;typename KVCacheT&gt;
    void flashAttention(DecoderContext *ctx, xft::Matrix&lt;ImT&gt; &amp;query, xft::Matrix&lt;ImT&gt; &amp;key, xft::Matrix&lt;ImT&gt; &amp;value,
            xft::Matrix&lt;ImT&gt; &amp;result, KVCacheTensor&lt;KVCacheT&gt; &amp;presentKey, KVCacheTensor&lt;KVCacheT&gt; &amp;presentValue,
            const float *attnMask, int pastSeqLen) {
        using AttnT = typename AttnTypeSelector&lt;ImT&gt;::type;

        // How many heads this task should do
        int batchSize = ctx-&gt;batchSize;
        int respQHeads = this-&gt;endQHead - this-&gt;startQHead;
        int respKVHeads = this-&gt;endKVHead - this-&gt;startKVHead;
        int headSize = ctx-&gt;attHeadSize;
        int qCols = respQHeads * headSize;
        int kvCols = respKVHeads * headSize;
        int qkvCols = qCols + kvCols * 2;
        float scale = ctx-&gt;attFactor;
        const int groupNum = ctx-&gt;attHeadNum / ctx-&gt;kvHeadNum;

        int totalTokenSize = 0;
        int inputSeqLens[batchSize], pastSeqLens[batchSize];
        for (int i = 0; i &lt; batchSize; ++i) {
            inputSeqLens[i] = ctx-&gt;inputSeqLen;
            pastSeqLens[i] = pastSeqLen;
            totalTokenSize += inputSeqLens[i];
        }

        // TODO: kv dtype conversion for prefixSharing
        AttnT *k, *v;
        int kvStride;
        // convert to AttnT forcely for accelerating purpose
        if constexpr (!std::is_same_v&lt;AttnT, ImT&gt;) {
            kvStride = kvCols * 2;
            AttnT *kvBuf = (AttnT *)SimpleMemPool::instance().getBuffer(
                    &quot;flashKVBuf&quot;, totalTokenSize * kvStride * sizeof(AttnT));
#pragma omp parallel for collapse(2)
            for (uint64_t seq = 0; seq &lt; totalTokenSize; ++seq)
                for (uint64_t i = 0; i &lt; kvCols * 2; i += headSize) {
                    const ImT *srcPtr = key.Data() + seq * qkvCols + i;
                    AttnT *dstPtr = kvBuf + seq * kvStride + i;
                    if constexpr (std::is_same_v&lt;AttnT, bfloat16_t&gt; &amp;&amp; std::is_same_v&lt;ImT, float&gt;) {
                        bfloat16_t::cvt_float_to_bfloat16(srcPtr, dstPtr, headSize);
                    } else if constexpr (std::is_same_v&lt;AttnT, float16_t&gt; &amp;&amp; std::is_same_v&lt;ImT, float&gt;) {
                        float16_t::cvt_float_to_float16(srcPtr, dstPtr, headSize);
                    } else if constexpr (std::is_same_v&lt;AttnT, float&gt; &amp;&amp; std::is_same_v&lt;ImT, bfloat16_t&gt;) {
                        bfloat16_t::cvt_bfloat16_to_float(srcPtr, dstPtr, headSize);
                    } else if constexpr (std::is_same_v&lt;AttnT, float&gt; &amp;&amp; std::is_same_v&lt;ImT, float16_t&gt;) {
                        float16_t::cvt_float16_to_float(srcPtr, dstPtr, headSize);
                    } else {
                        printf(&quot;Not supported Type in Flash Attention yet\n&quot;);
                        exit(-1);
                    }
                }

            k = kvBuf;
            v = kvBuf + kvCols;
        } else {
            kvStride = qkvCols;
            k = key.Data();
            v = value.Data();
        }

        // [batch, src, head, headsize]
        xft::selfScaledDpAttention&lt;ImT, AttnT&gt;(result.Data(), query.Data(), k, v, respQHeads, respKVHeads, headSize,
                result.Stride(), query.Stride(), kvStride, batchSize, inputSeqLens, pastSeqLens, true, alibiSlopes,
                attnMask, scale, ctx-&gt;numThreads,
                [&amp;](int qHeadIdx) { return (this-&gt;startQHead + qHeadIdx) / groupNum - this-&gt;startKVHead; });

        // copy current key/values to cache
        copyKVCache(ctx, key, value, presentKey, presentValue, pastSeqLen);
    }</code></pre>
<ul>
<li><strong>功能</strong>：调用 selfScaledDpAttention 执行 Flash Attention 计算。</li>
<li><strong>关键参数</strong>：
<ul>
<li>query.Data(), k, v：输入 Query、Key、Value 数据。</li>
<li>respQHeads, respKVHeads, headSize：查询头、键/值头数量和头大小。</li>
<li>batchSize, inputSeqLens, pastSeqLens：批次和序列长度信息。</li>
<li>attnMask, scale：注意力掩码和缩放因子。</li>
<li>ctx-&gt;numThreads：并行线程数。</li>
<li><strong>GQA 映射函数</strong>：<code>(int qHeadIdx) { return (this-&gt;startQHead + qHeadIdx) / groupNum - this-&gt;startKVHead; }</code>
<ul>
<li>决定每个查询头（<code>qHeadIdx</code>）对应的键/值头索引。</li>
<li><code>groupNum</code>（<code>attHeadNum</code> / <code>kvHeadNum</code>）实现 GQA 的分组逻辑，例如 8 个查询头分成 2 组，每组 4 个头共享 1 个键/值头。</li>
</ul></li>
</ul></li>
<li><strong>作用</strong>：计算注意力输出，存入 result，支持 GQA 的共享键/值机制。</li>
</ul>
<h2>缩放点积</h2>
<p>selfScaledDpAttention 实现了缩放点积注意力，结合 Flash Attention 和 GQA 的优化，具体功能：</p>
<ol>
<li><strong>计算注意力</strong>：根据输入的 Query（query）、Key（key）、Value（value），生成注意力输出，存入 output。</li>
<li><strong>支持 GQA</strong>：通过 qHeadNum、kvHeadNum 和 headMap 实现查询头分组，减少内存和计算量。</li>
<li><strong>分块计算</strong>：将序列分成小块（srcBlk 和 tgtBlk），减少内存占用。</li>
<li><strong>因果掩码</strong>：支持因果注意力（causal），防止模型看到未来的 token（用于解码）。</li>
<li><strong>并行优化</strong>：使用 OpenMP 多线程和内存池（SimpleMemPool）加速计算。</li>
</ol>
<pre><code class="language-CPP">// scaled dot-product attention: bmm1 + softmax + bmm2
// query key value are all in [*, seqLen, headnum, headsize] order
template &lt;typename T, typename AttnT&gt;
void selfScaledDpAttention(T *output, const T *query, const AttnT *key, const AttnT *value, int qHeadNum, int kvHeadNum,
        int headSize, int oStride, int qStride, int kvStride, int batchSize, const int *inputSeqLens,
        const int *pastSeqLens, bool causal, const float *alibiSlopes, const float *attnMask, const float scale,
        int threadNum, std::function&lt;int(int)&gt; headMap = nullptr) {
    // output = softmax(query * trans(key)) * value
    // causal = True: llama-family, chatglm2; extra alibiSlopes for baichuan
    // causal = False: just chatglm (prefixLLM, 0:startid) need attnMask for now

    // get the max seqLen
    int maxSrcLen = 0, maxTgtLen = 0;
    for (int i = 0; i &lt; batchSize; ++i) {
        maxSrcLen = std::max(maxSrcLen, inputSeqLens[i]);
        maxTgtLen = std::max(maxTgtLen, inputSeqLens[i] + pastSeqLens[i]);
    }
    // compute the seqStartLoc
    int seqStartLoc[batchSize + 1];
    seqStartLoc[0] = 0;
    for (int i = 0; i &lt; batchSize; ++i) {
        seqStartLoc[i + 1] = seqStartLoc[i] + inputSeqLens[i];
    }

    // closest value of power of 2
    int minBlk = (int)std::pow(2, int(std::log2((maxSrcLen + 1) / 2)));
    // Split sequence to make sure a moderate sync frequency and the intermediate
    // result [srcSeq * tgtSeq] in cache. The current block size is derived from practical experience.
    int srcBlk = std::min(256, minBlk);
    int tgtBlk = std::min(512, maxTgtLen);

    int groupNum = qHeadNum / kvHeadNum;

    int numArr = 7;
    int arrStride = (4 + tgtBlk + 2 * headSize) * srcBlk;
    float *thrBuf
            = (float *)SimpleMemPool::instance().getBuffer(&quot;threadBuffers&quot;, sizeof(float) * threadNum * arrStride);
    float **thrPtrBuf
            = (float **)SimpleMemPool::instance().getBuffer(&quot;threadPtrBuffers&quot;, sizeof(float *) * threadNum * numArr);

    float **preSum = thrPtrBuf;
    float **sum = thrPtrBuf + threadNum;
    float **preMax = thrPtrBuf + threadNum * 2;
    float **max = thrPtrBuf + threadNum * 3;
    float **qkArr = thrPtrBuf + threadNum * 4;
    float **expQkvArr = thrPtrBuf + threadNum * 5;
    float **qArr = thrPtrBuf + threadNum * 6;

    for (int i = 0; i &lt; threadNum; ++i) {
        preSum[i] = thrBuf + srcBlk * i;
        sum[i] = thrBuf + srcBlk * threadNum + srcBlk * i;
        preMax[i] = thrBuf + srcBlk * threadNum * 2 + srcBlk * i;
        max[i] = thrBuf + srcBlk * threadNum * 3 + srcBlk * i;
        qkArr[i] = thrBuf + srcBlk * threadNum * 4 + srcBlk * tgtBlk * i;
        expQkvArr[i] = thrBuf + srcBlk * threadNum * (4 + tgtBlk) + srcBlk * headSize * i;
        qArr[i] = thrBuf + srcBlk * threadNum * (4 + tgtBlk + headSize) + srcBlk * headSize * i;
    }

#pragma omp parallel for collapse(3) schedule(dynamic)
    for (uint64_t b = 0; b &lt; batchSize; ++b) {
        for (int h = 0; h &lt; qHeadNum; ++h) {
            for (int m = 0; m &lt; maxSrcLen; m += srcBlk) {
                int srcLen = inputSeqLens[b];
                int tgtLen = inputSeqLens[b] + pastSeqLens[b];
                if (m &gt;= srcLen) { continue; }

                int tid = omp_get_thread_num();
                int qRealBlk = std::min(srcBlk, srcLen - m);
                uint64_t srcOff = seqStartLoc[b] * qStride + h * headSize;
                uint64_t outOff = seqStartLoc[b] * oStride + h * headSize;
                const T *qbuf = query + srcOff + m * qStride;
                AttnT *q = (AttnT *)qArr[tid];
                T *out = output + outOff + m * oStride;

                // reset out
                for (int ii = 0; ii &lt; qRealBlk; ++ii) {
#pragma omp simd
                    for (int jj = 0; jj &lt; headSize; ++jj) {
                        out[ii * oStride + jj] = 0; // reset output
                        q[ii * headSize + jj] = (AttnT)(qbuf[ii * qStride + jj]); // reset output
                    }
                }
                // reset sum
#pragma omp simd
                for (int ii = 0; ii &lt; qRealBlk; ++ii) {
                    preSum[tid][ii] = 0;
                    sum[tid][ii] = 0;
                    preMax[tid][ii] = std::numeric_limits&lt;float&gt;::lowest();
                    max[tid][ii] = std::numeric_limits&lt;float&gt;::lowest();
                }

                int kvHeadIdx = (headMap == nullptr) ? h / groupNum : headMap(h);
                uint64_t tgtOff = seqStartLoc[b] * kvStride + kvHeadIdx * headSize;
                const AttnT *k = key + tgtOff;
                const AttnT *v = value + tgtOff;
                // split the target len dimension
                for (int n = 0; n &lt; tgtLen; n += tgtBlk) {
                    int kvRealBlk = std::min(tgtBlk, tgtLen - n);
                    // mask out. TODO: for prefixLLM
                    if (causal &amp;&amp; m + qRealBlk - 1 &lt; n) {
                        //printf(&quot;Skip bs %d head %d src %d tgt %d\n&quot;, b, h, m, n);
                        break;
                    }

                    const AttnT *kBlk = k + n * kvStride;
                    const AttnT *vBlk = v + n * kvStride;   // 分块注意力计算  功能：将目标序列（Key/Value）分成块（tgtBlk），处理当前块（kBlk, vBlk）。

                    if (causal) { // 因果掩码：如果 causal=true（如 LLaMA 模型），跳过未来的 token（m + qRealBlk - 1 &lt; n）。因果掩码是注意力机制中的一种规则，用来限制模型只能“看到”当前和之前的词，而不能看到未来的词。这在生成文本（像聊天机器人逐字生成回答）时非常重要，因为模型在生成某个词时，不应该“偷看”后面的词，否则就相当于作弊了。
                        // causal=True, build-in mask
                        float headSlope = alibiSlopes != nullptr ? alibiSlopes[h] : 0.0f;
                        DecoderUtil::incrementalTileAttentionCausal(q, kBlk, vBlk, headSlope, m, n, qRealBlk, headSize,
                                kvRealBlk, preSum[tid], sum[tid], preMax[tid], max[tid], scale, qkArr[tid],
                                expQkvArr[tid], out, headSize, kvStride, kvStride, oStride);
                    } else {
                        // causal=False, need mask matrix for now
                        const float *attnMsk = attnMask + seqStartLoc[b] * tgtLen + m * tgtLen + n;
                        DecoderUtil::incrementalTileAttention(q, kBlk, vBlk, attnMsk, qRealBlk, headSize, kvRealBlk,
                                tgtLen, preSum[tid], sum[tid], preMax[tid], max[tid], scale, qkArr[tid], expQkvArr[tid],
                                out, headSize, kvStride, kvStride, oStride);
                    }
                }
            }
        }
    }
    return;
}</code></pre>
<h2>Cross Attention Kernel</h2>
<pre><code class="language-CPP">void crossAttention(bfloat16_t *output, bfloat16_t *query, bfloat16_t *key, bfloat16_t *value, int qHeadNum,
        int kvHeadNum, int headSize, int qStride, int kvStride, int batchSize, int cacheBlkStride, int cacheBlkSize,
        const int *contextSizes, const float scale, const float *alibiSlopes, const void *kcache, const void *vcache,
        int *blockTables, int *blockNums, int *slots) {
    int maxCtxSize = 0;
    int blkOffsets[batchSize]; // offset in blockTables
    int curOff = 0;

    // blocktables dim = 2
    for (int i = 0; i &lt; batchSize; ++i) {
        if (contextSizes[i] &gt; maxCtxSize) { maxCtxSize = contextSizes[i]; }
    }

    int max_block_num = (maxCtxSize + cacheBlkSize - 1) / cacheBlkSize;
    for (int i = 0; i &lt; batchSize; ++i) {
        blkOffsets[i] = curOff;
        curOff += max_block_num;
    }

    int thrScoreSize = (maxCtxSize + 15) / 16 * 16;
    float *scores = (float *)SimpleMemPool::instance().getBuffer(&quot;qkscore&quot;, threadNum * thrScoreSize * sizeof(float));

#pragma omp parallel for collapse(2)
    for (int b = 0; b &lt; batchSize; ++b) {
        for (int i = 0; i &lt; qHeadNum; ++i) {
            int *blkIndices = blockTables + blkOffsets[b];

            // Copy one head of current key to cached keys
            auto dst = (bfloat16_t *)kcache + slots[b] * kvHeadNum * headSize + i * headSize;
            xft::copy(dst, key + i * headSize, headSize);

            // Q * K
            int m = 1;
            int k = headSize;
            int n = contextSizes[b] + 1;
            int lda = qStride;
            int ldb = kvHeadNum * headSize;
            int ldc = n;
            auto A = query + i * headSize;
            auto baseB = (bfloat16_t *)kcache + i * headSize;
            auto C = scores + omp_get_thread_num() * thrScoreSize;

            small_sgemm_bf16bf16f32_b(true, m, n, k, (XDNN_BF16 *)A, lda, (XDNN_BF16 *)baseB, ldb, C, ldc, blkIndices,
                    cacheBlkStride, cacheBlkSize);

            // Softmax(Q * K)
            small_softmax_f32(C, scale, n);

            // Copy current value to cached values
            dst = (bfloat16_t *)vcache + slots[b] * kvHeadNum * headSize + i * headSize;
            xft::copy(dst, value + i * headSize, headSize);

            // Softmax * V
            std::swap(k, n);
            lda = ldc;
            ldb = kvHeadNum * headSize;
            ldc = qHeadNum * headSize;
            baseB = (bfloat16_t *)vcache + i * headSize;
            auto baseC = output + b * ldc + i * headSize;
            small_sgemm_f32bf16bf16_b(false, m, n, k, C, lda, (XDNN_BF16 *)baseB, ldb, (XDNN_BF16 *)baseC, ldc,
                    blkIndices, cacheBlkStride, cacheBlkSize);

        } // end for i
    } // end for b
}
</code></pre>
<h2>small_gemm_transb</h2>
<p>这段代码是一个使用 AVX-512 指令集优化的小型矩阵乘法（GEMM，General Matrix Multiply）实现，专门处理矩阵 B B B 的转置形式（即 $C=A⋅BT C = A \cdot B^T C=A⋅BT$）。矩阵 A A A 是 $M×K M \times K M×K$，矩阵 B B B 是 $N×K N \times K N×K$（由于转置，存储为 K×N K \times N K×N），结果矩阵 C C C 是 <code>M×N M \times N M×N</code>。</p>
<pre><code class="language-CPP">template &lt;typename TA, typename TB, int M, int N&gt;
void small_gemm_transb(const TA *A, const TB *B, float *C, int K, int lda, int ldb, int ldc) {
    // vc[0] vc[1]   ... vc[N-1]
    // vc[N] vc[N+1] ...
    // ..
    // vc[(M-1)*N] ...
    __m512 vc[M * N];

    int vecs = (K + 15) / 16; // vector size in AVX512 计算需要多少个 16 元素块：vecs=⌈K/16⌉ \text{vecs} = \lceil K / 16 \rceil vecs=⌈K/16⌉。
    __mmask16 mask = (K % 16 == 0 ? 0xffff : (1 &lt;&lt; (K % 16)) - 1); // mask for last vector 是一个 16 位掩码，用于控制最后一个向量的有效元素。

    compile_time_for&lt;M * N&gt;::op([&amp;vc](auto i) { vc[i] = _mm512_set1_ps(0); });

    // The last vector is not included
    for (int v = 0; v &lt; vecs - 1; ++v) {
        const TA *pA = A + v * 16;
        const TB *pB = B + v * 16;
        __m512 vb[N];
        __m512 va;

        compile_time_for&lt;M * N&gt;::op([&amp;](auto i) {
            constexpr int idx = i;
            // Load from A when reach to first column in vc matrix
            if constexpr (idx % N == 0) {
                va = xft::load_avx512(pA);
                pA += lda;
            }
            // Load from B when reach to first row in vc matrix
            if constexpr (idx &lt; N) {
                vb[idx] = xft::load_avx512(pB);
                pB += ldb;
            }
            constexpr int col = idx % N;
            vc[idx] = _mm512_fmadd_ps(va, vb[col], vc[idx]);
        });
    }

    // The last vector computing, together with data store
    {
        __m512 vb[N];
        __m512 va;

        const TA *pA = A + (vecs - 1) * 16;
        const TB *pB = B + (vecs - 1) * 16;
        float *pC = C;

        compile_time_for&lt;M * N&gt;::op([&amp;](auto i) {
            constexpr int idx = i;
            if constexpr (idx % N == 0) {
                va = xft::load_avx512(mask, pA);
                pA += lda;
            }
            if constexpr (idx &lt; N) {
                vb[idx] = xft::load_avx512(mask, pB);
                pB += ldb;
            }
            constexpr int col = idx % N;
            vc[idx] = _mm512_fmadd_ps(va, vb[col], vc[idx]); ///使用 FMA（Fused Multiply-Add）指令
            pC[col] = _mm512_reduce_add_ps(vc[idx]);
            // Reach to the row end
            if constexpr (i % N == N - 1) { pC += ldc; }
        });
    }
}</code></pre>
<ul>
<li><strong>向量化</strong>：
<ul>
<li>使用 AVX-512 向量（512 位，16 个浮点数）加速计算。</li>
<li>将 K K K 维度分成多个 16 元素块，逐块处理。</li>
<li>最后一个块使用掩码处理不足 16 的元素。</li>
</ul></li>
<li><strong>优化</strong>：
<ul>
<li>compile_time_for 展开循环，减少运行时开销。</li>
<li>FMA 指令 (_mm512_fmadd_ps) 融合乘法和加法，提高性能。</li>
<li>转置 B B B 减少内存访问的非连续性。</li>
</ul></li>
<li><strong>内存布局</strong>：
<ul>
<li>A A A、B B B、C C C 按行主序存储，步长分别为 lda、ldb、ldc。</li>
<li>B B B 是转置形式，实际存储为 K×N K \times N K×N。</li>
</ul></li>
</ul>
<p><strong>适用场景</strong>：适合小型矩阵（固定 M M M、N N N），模板参数允许编译时优化。</p>
