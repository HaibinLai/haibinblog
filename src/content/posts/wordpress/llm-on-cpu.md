---
title: "LLM on CPU 推理流程python源码解析"
description: "其他框架解析： vllm 框架解析： LLM 高速推理框架 vLLM 源代码分析 / vLLM Source Code Analysis - 知乎 vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention | vLLM Blog llama.cpp llama.cpp源码解读--推理流程总览 - 知乎 纯新手教程：用llama.cpp本地部署DeepSeek蒸馏模型 - 知…"
publishedAt: "2025-04-18T03:24:42Z"
updatedAt: "2025-06-11T22:24:32Z"
category: "Frameworks"
categories: ["Frameworks", "High Performance Computing"]
tags: ["CPP", "CPU", "HPC", "LLM", "pytorch"]
author: "GB"
draft: false
slug: "llm-on-cpu"
legacySlug: "llm-on-cpu"
oldSlugs: ["llm-on-cpu-推理源码解析"]
wordpressId: 699
sourceUrl: "https://www.haibinlaiblog.top/index.php/llm-on-cpu/"
commentCount: 0
viewCount: 2843
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2025/04/8ED59E29A10078B5E11BF51F0F76309F.jpg"
importedFromWordPress: true
---
<p>其他框架解析：
vllm 框架解析：<a href="https://zhuanlan.zhihu.com/p/641999400">LLM 高速推理框架 vLLM 源代码分析 / vLLM Source Code Analysis - 知乎</a>
<a href="https://blog.vllm.ai/2023/06/20/vllm.html">vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention | vLLM Blog</a>
llama.cpp <a href="https://zhuanlan.zhihu.com/p/25774381094">llama.cpp源码解读--推理流程总览 - 知乎</a>
<a href="https://zhuanlan.zhihu.com/p/24560784106">纯新手教程：用llama.cpp本地部署DeepSeek蒸馏模型 - 知乎</a></p>
<h2>Source code for pytorch + transformer</h2>
<pre><code class="language-python">import torch
from transformers import pipeline
import time

# 设置随机种子以确保结果可重复
torch.manual_seed(123)

# 模型 ID
model_id = &quot;meta-llama/Llama-3.2-1B&quot;

# 创建文本生成 pipeline
pipe = pipeline(
    &quot;text-generation&quot;,
    model=model_id,
    torch_dtype=torch.bfloat16,  # 使用 bfloat16 节省内存
    device_map=&quot;auto&quot;,          # 自动选择设备（CPU 或 GPU）
    max_new_tokens=256,         # 生成的最大 token 数
)

# 运行模型生成文本
prompt = &quot;The key to life is&quot;
res = pipe(prompt)

# 输出结果和耗时
print(&quot;Generated text:&quot;, res[0][&quot;generated_text&quot;])</code></pre>
<p>LLM推理首先输入一个预设的<strong>prompt</strong>，将其传入模型，生成首个预测的token（首字）。随后进入<strong>自回归</strong>阶段，模型依次利用前一步生成的token，预测下一个token，直至完成整个序列的生成。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171956136.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504172221947.png" alt="" /></p>
<h2>Function stack</h2>
<p>使用pytorch profiler进行观察，得到运行图</p>
<p>从prompt和结果那里插入</p>
<pre><code class="language-python">from torch.profiler import profile, record_function, ProfilerActivity
from torch.utils.tensorboard import SummaryWriter  # 用于 TensorBoard 日志

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
</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171944342.png" alt="" /></p>
<p><strong>调用栈</strong>：从 pipeline.<strong>call</strong> 开始，依次调用分词器（tokenizer.encode）、生成逻辑（generate）、模型前向传播（model.forward），最后解码输出（tokenizer.decode）。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171952497.png" alt="" /></p>
<p>Output 层与Sample 层
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180248242.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180248243.png" alt="" /></p>
<p><a href="https://zhuanlan.zhihu.com/p/1892968719476577436">图文详解LLM inference：LLM模型架构详解 - 知乎</a></p>
<ol>
<li>
<p>模型接收预设的<code>prompt</code>作为输入，通过<code>tokenizer</code>对 prompt 进行<strong>编码</strong>（encode）为<strong>输入 token 序列</strong>。</p>
</li>
<li>
<p>输入 token 首先经过<code>Embedding</code>层，转化为高维度的向量表示（通常称为词向量）。</p>
</li>
<li>
<p>接着，这些向量依次通过多层<code>TransformerBlock</code>，逐层进行特征提取和信息交互，最终生成上下文相关的高维表示。</p>
</li>
<li>
<p>然后，这些表示通过 <code>RMSNorm</code>层进行<strong>归一化</strong>处理，并输入到<code>Output</code>层，计算出预测的 <code>logits</code>。</p>
</li>
<li>
<p>最后，基于 <code>logits</code> 对最后一个 token 进行<strong>采样</strong>，从而得到模型预测的下一个 <strong>token</strong>。</p>
</li>
<li>
<p>重复上述过程，模型将不断地生成下一个 <strong>token</strong>，直到生成预设的<code>end_id</code>或检测到指定的<code>stop_word</code>，从而结束生成流程。</p>
</li>
</ol>
<p><strong>采样（sample）</strong> 有<code>Greedy Search</code>、<code>Temperature Sampling</code>、<code>Top-k</code>、<code>Top-p</code>、<code>Beam Search</code>等多种方式</p>
<h2>各个block</h2>
<p>这里边的transformer block：
<code>TransformerBlock</code> 的核心组件包括两个 <code>RMSNorm</code> 层、一个 <code>Attention</code> 模块和一个 <code>FFN</code>（前馈神经网络）模块，其计算流程如下：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171954011.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504172221797.png" alt="" /></p>
<p>time: 4ms
Norm 200us
Attention 1.28 ms
Norm2 200us
MLP 2.3 ms</p>
<p><a href="https://github.com/meta-llama/llama/blob/main/llama/model.py#L351">llama/llama/model.py at main · meta-llama/llama</a></p>
<pre><code class="language-python">class TransformerBlock(nn.Module):
    def __init__(self, layer_id: int, args: ModelArgs):
        &quot;&quot;&quot;
        Initialize a TransformerBlock.

        Args:
            layer_id (int): Identifier for the layer.
            args (ModelArgs): Model configuration parameters.

        Attributes:
            n_heads (int): Number of attention heads.
            dim (int): Dimension size of the model.
            head_dim (int): Dimension size of each attention head.
            attention (Attention): Attention module.
            feed_forward (FeedForward): FeedForward module.
            layer_id (int): Identifier for the layer.
            attention_norm (RMSNorm): Layer normalization for attention output.
            ffn_norm (RMSNorm): Layer normalization for feedforward output.

        &quot;&quot;&quot;
        super().__init__()
        self.n_heads = args.n_heads
        self.dim = args.dim
        self.head_dim = args.dim // args.n_heads
        self.attention = Attention(args)
        self.feed_forward = FeedForward(
            dim=args.dim,
            hidden_dim=4 * args.dim,
            multiple_of=args.multiple_of,
            ffn_dim_multiplier=args.ffn_dim_multiplier,
        )
        self.layer_id = layer_id
        self.attention_norm = RMSNorm(args.dim, eps=args.norm_eps)
        self.ffn_norm = RMSNorm(args.dim, eps=args.norm_eps)

    def forward(
        self,
        x: torch.Tensor,
        start_pos: int,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor],
    ):
        &quot;&quot;&quot;
        Perform a forward pass through the TransformerBlock.

        Args:
            x (torch.Tensor): Input tensor.
            start_pos (int): Starting position for attention caching.
            freqs_cis (torch.Tensor): Precomputed cosine and sine frequencies.
            mask (torch.Tensor, optional): Masking tensor for attention. Defaults to None.

        Returns:
            torch.Tensor: Output tensor after applying attention and feedforward layers.

        &quot;&quot;&quot;
        h = x + self.attention(
            self.attention_norm(x), start_pos, freqs_cis, mask
        )
        out = h + self.feed_forward(self.ffn_norm(h)) # 图中的block在这里！！
        return out</code></pre>
<p>可以看到用两行代码就干碎了。</p>
<h2>Attention block</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180221550.png" alt="" /></p>
<p>Attention 模块的核心组件主要包含Query、Key、Value 的线性变换以及输出线性投影。计算流程如下:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171953625.png" alt="" /></p>
<pre><code class="language-python">class Attention(nn.Module):
    &quot;&quot;&quot;Multi-head attention module.&quot;&quot;&quot;
    def __init__(self, args: ModelArgs):
        &quot;&quot;&quot;
        Initialize the Attention module.

        Args:
            args (ModelArgs): Model configuration parameters.

        Attributes:
            n_kv_heads (int): Number of key and value heads.
            n_local_heads (int): Number of local query heads.
            n_local_kv_heads (int): Number of local key and value heads.
            n_rep (int): Number of repetitions for local heads.
            head_dim (int): Dimension size of each attention head.
            wq (ColumnParallelLinear): Linear transformation for queries.
            wk (ColumnParallelLinear): Linear transformation for keys.
            wv (ColumnParallelLinear): Linear transformation for values.
            wo (RowParallelLinear): Linear transformation for output.
            cache_k (torch.Tensor): Cached keys for attention.
            cache_v (torch.Tensor): Cached values for attention.

        &quot;&quot;&quot;
        super().__init__()
        self.n_kv_heads = args.n_heads if args.n_kv_heads is None else args.n_kv_heads
        model_parallel_size = fs_init.get_model_parallel_world_size()
        self.n_local_heads = args.n_heads // model_parallel_size
        self.n_local_kv_heads = self.n_kv_heads // model_parallel_size
        self.n_rep = self.n_local_heads // self.n_local_kv_heads
        self.head_dim = args.dim // args.n_heads

        self.wq = ColumnParallelLinear(
            args.dim,
            args.n_heads * self.head_dim,
            bias=False,
            gather_output=False,
            init_method=lambda x: x,
        )
        self.wk = ColumnParallelLinear(
            args.dim,
            self.n_kv_heads * self.head_dim,
            bias=False,
            gather_output=False,
            init_method=lambda x: x,
        )
        self.wv = ColumnParallelLinear(
            args.dim,
            self.n_kv_heads * self.head_dim,
            bias=False,
            gather_output=False,
            init_method=lambda x: x,
        )
        self.wo = RowParallelLinear(
            args.n_heads * self.head_dim,
            args.dim,
            bias=False,
            input_is_parallel=True,
            init_method=lambda x: x,
        )

        self.cache_k = torch.zeros(
            (
                args.max_batch_size,
                args.max_seq_len,
                self.n_local_kv_heads,
                self.head_dim,
            )
        ).cuda()
        self.cache_v = torch.zeros(
            (
                args.max_batch_size,
                args.max_seq_len,
                self.n_local_kv_heads,
                self.head_dim,
            )
        ).cuda()

    def forward(
        self,
        x: torch.Tensor,
        start_pos: int,
        freqs_cis: torch.Tensor,
        mask: Optional[torch.Tensor],
    ):
        &quot;&quot;&quot;
        Forward pass of the attention module.

        Args:
            x (torch.Tensor): Input tensor.
            start_pos (int): Starting position for caching.
            freqs_cis (torch.Tensor): Precomputed frequency tensor.
            mask (torch.Tensor, optional): Attention mask tensor.

        Returns:
            torch.Tensor: Output tensor after attention.

        &quot;&quot;&quot;
        # **输入形状处理**
        bsz, seqlen, _ = x.shape

    # 1. **输入变换** - 通过三个独立的线性层将输入映射到查询（Query）、键（Key）、值（Value）空间。
        xq, xk, xv = self.wq(x), self.wk(x), self.wv(x)

# 2. **`layout`转换
# - 将Q/K/V分别重塑为多头结构，其中：
    # - `n_local_heads`: 查询头数
    # - `n_local_kv_heads`: 键值头数（通常 ≤ 查询头数）
    # - `head_dim`: 每个头的维度
        xq = xq.view(bsz, seqlen, self.n_local_heads, self.head_dim)
        xk = xk.view(bsz, seqlen, self.n_local_kv_heads, self.head_dim)
        xv = xv.view(bsz, seqlen, self.n_local_kv_heads, self.head_dim)

# 3. **应用旋转位置编码**
# - 使用旋转位置编码（Rotary Position Embedding）为Q/K注入位置信息，增强模型的位置感知能力。
        xq, xk = apply_rotary_emb(xq, xk, freqs_cis=freqs_cis)

# **键值缓存更新**
# - **缓存机制**：在自回归生成时，将当前步计算的键值存入缓存，避免重复计算历史token的K/V。
# - `start_pos`表示当前处理的起始位置，适用于流式生成场景。
        self.cache_k = self.cache_k.to(xq)
        self.cache_v = self.cache_v.to(xq)

        self.cache_k[:bsz, start_pos : start_pos + seqlen] = xk
        self.cache_v[:bsz, start_pos : start_pos + seqlen] = xv

# **构建完整的注意力上下文**
        keys = self.cache_k[:bsz, : start_pos + seqlen]  # 获取历史及当前K
        values = self.cache_v[:bsz, : start_pos + seqlen]  # 获取历史及当前V

# **多头重复策略（GQA/MQA）**
# - **Grouped-Query Attention**：  repeat k/v heads if n_kv_heads &lt; n_heads
# - `n_rep = n_local_heads // n_local_kv_heads`，表示每个KV头重复的次数。
        keys = repeat_kv(keys, self.n_rep)  # (bs, cache_len + seqlen, n_local_heads, head_dim)
        values = repeat_kv(values, self.n_rep)  # (bs, cache_len + seqlen, n_local_heads, head_dim)

# **张量转置（调整维度顺序）** - 将多头维度提前，便于后续矩阵运算。
        xq = xq.transpose(1, 2)  # (bs, n_local_heads, seqlen, head_dim)
        keys = keys.transpose(1, 2) # (bs, n_local_heads, cache_len + seqlen, head_dim)
        values = values.transpose(1, 2) # (bs, n_local_heads, cache_len + seqlen, head_dim)

# 4. **注意力得分计算** - 计算Q与K的点积，缩放因子`sqrt(d_k)`防止梯度爆炸。
        scores = torch.matmul(xq, keys.transpose(2, 3)) / math.sqrt(self.head_dim)
        # **注意力掩码处理**
        # - **因果掩码**：在解码时屏蔽未来信息，确保当前位置只能关注前面token。
        # - **填充掩码**：忽略padding token的影响。
        if mask is not None:
            scores = scores + mask  # (bs, n_local_heads, seqlen, cache_len + seqlen)
        # 5. **Softmax归一化** - 对注意力得分进行归一化，转换为概率分布。
        scores = F.softmax(scores.float(), dim=-1).type_as(xq)

        # 6. **加权求和生成上下文向量** - 使用注意力权重对Value加权求和，得到每个位置的上下文表示。
        output = torch.matmul(scores, values)  # (bs, n_local_heads, seqlen, head_dim)

        # 7. **合并多头输出** - 将多头输出拼接回原始形状，准备进行后续处理。
        output = output.transpose(1, 2).contiguous().view(bsz, seqlen, -1)

        # 8. **输出投影** - 通过线性层`wo`将多头输出映射回模型维度。
        return self.wo(output) # 线性层聚合多头信息</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180221550.png" alt="" />
<code>Attention</code> 的计算过程如下：</p>
<ol>
<li><strong>输入变换</strong>：将输入的特征向量 X 通过三组独立的线性层，分别生成 <code>Query</code> ( Q )、<code>Key</code> ( K ) 和 <code>Value</code> ( V )，公式为： xq, xk, xv = self.wq(x), self.wk(x), self.wv(x) ​，其中， WQ ​、 WK ​、 WV ​ 是可学习的权重矩阵。
<pre><code class="language-python"># 1. **输入变换** - 通过三个独立的线性层将输入映射到查询（Query）、键（Key）、值（Value）空间。
    xq, xk, xv = self.wq(x), self.wk(x), self.wv(x) </code></pre></li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180221341.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180223617.png" alt="" /></p>
<p>Matmul 1: 200us
Matmul 2: 71us
Matmul 3: 70us</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180222159.png" alt="" /></p>
<ol start="2">
<li>
<p><strong><code>layout</code>转换：</strong> 将 Query ( Q )、Key ( K ) 和 Value ( V )的的张量布局由[batch_size,seq_len,head_num,d_model]转为 [batch_size,head_num,seq_len,d_model]，这种布局转换是为了适应多头注意力机制的计算需求，将每个头的查询、键和值的维度重新排列，使得计算能够并行处理不同头部的注意力权重，同时提高计算效率。</p>
</li>
<li>
<p><strong>位置编码</strong>：将位置信息加入到 Q 和 K 向量中，以便模型能够捕捉到序列中元素的顺序关系。通过对 Q 和 K 进行位置编码，<code>Transformer</code>模型可以理解输入序列中元素的相对或绝对位置，从而在自注意力机制中更好地处理序列顺序的依赖性。</p>
</li>
<li>
<p><strong>计算注意力得分</strong>：<br />
通过点积操作计算 <code>Query</code> 和 <code>Key</code> 之间的相似度，获得注意力得分矩阵：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504172044277.png" alt="" /></p>
<p>这里， dk ​ 是 <code>Key</code> 的特征维度，用于缩放防止数值过大。</p>
</li>
<li>
<p><strong>归一化得分</strong>：<br />
对得分矩阵应用 Softmax 函数，将其归一化为概率分布： Attention Weights=Softmax(Scores)</p>
</li>
<li>
<p><strong>加权求和</strong>：<br />
使用归一化后的注意力权重对 <code>Value</code> 矩阵进行加权求和，生成上下文表示： Attention Output=Attention Weights⋅V</p>
</li>
<li>
<p><strong><code>layout</code>转换：将</strong>Attention Output 的张量布局从[batch_size,head_num,seq_len,d_model]转为[batch_size,seq_len,head_num,d_model]，这一转换是为了恢复原始序列的顺序，并将多头注意力的输出按序列长度排列，以便后续操作（如拼接或线性变换）能够正确地处理每个头的输出信息。</p>
</li>
<li>
<p><strong>线性投影</strong>：<br />
将多头注意力的输出拼接后，输入线性层进行投影，生成最终的注意力输出： Final Output=Concat(Head1,Head2,…)WO ，​其中， Wo ​ 是线性投影的权重矩阵。</p>
</li>
</ol>
<p>通过这一过程，<code>Attention</code> 模块能够动态聚焦输入序列中不同位置的重要信息，建模长距离依赖关系。</p>
<p><strong>核心特点解析：</strong></p>
<ol>
<li><strong>高效缓存机制</strong>
<ul>
<li>通过维护<code>cache_k</code>和<code>cache_v</code>，避免在自回归生成时重复计算历史token的K/V，显著提升推理效率。</li>
</ul></li>
<li><strong>灵活的多头策略</strong>
<ul>
<li>支持<strong>多查询注意力（MQA）</strong>和<strong>分组查询注意力（GQA）</strong>，通过<code>repeat_kv</code>实现KV头的复用，平衡计算效率和模型表现。</li>
</ul></li>
<li><strong>旋转位置编码（RoPE）</strong>
<ul>
<li>通过绝对位置编码实现相对位置感知，增强模型对位置关系的建模能力。</li>
</ul></li>
<li><strong>并行计算优化</strong>
<ul>
<li>通过矩阵运算并行处理整个序列，充分利用GPU加速。
此实现通过结合现代Transformer模型的多种优化技术，在保证模型表现的同时提升了推理效率。</li>
</ul></li>
</ol>
<h2>在使用huggingface中llama3的源码：</h2>
<pre><code class="language-python">class LlamaAttention(nn.Module):
    &quot;&quot;&quot;Multi-headed attention from &#039;Attention Is All You Need&#039; paper&quot;&quot;&quot;

    def __init__(self, config: LlamaConfig, layer_idx: int):
        super().__init__()
        self.config = config
        self.layer_idx = layer_idx
        self.head_dim = getattr(config, &quot;head_dim&quot;, config.hidden_size // config.num_attention_heads)
        self.num_key_value_groups = config.num_attention_heads // config.num_key_value_heads
        self.scaling = self.head_dim**-0.5
        self.attention_dropout = config.attention_dropout
        self.is_causal = True

        self.q_proj = nn.Linear(
            config.hidden_size, config.num_attention_heads * self.head_dim, bias=config.attention_bias
        )
        self.k_proj = nn.Linear(
            config.hidden_size, config.num_key_value_heads * self.head_dim, bias=config.attention_bias
        )
        self.v_proj = nn.Linear(
            config.hidden_size, config.num_key_value_heads * self.head_dim, bias=config.attention_bias
        )
        self.o_proj = nn.Linear(
            config.num_attention_heads * self.head_dim, config.hidden_size, bias=config.attention_bias
        )

    def forward(
        self,
        hidden_states: torch.Tensor,
        position_embeddings: Tuple[torch.Tensor, torch.Tensor],
        attention_mask: Optional[torch.Tensor],
        past_key_value: Optional[Cache] = None,
        cache_position: Optional[torch.LongTensor] = None,
        **kwargs: Unpack[FlashAttentionKwargs],
    ) -&gt; Tuple[torch.Tensor, Optional[torch.Tensor], Optional[Tuple[torch.Tensor]]]:
        input_shape = hidden_states.shape[:-1]
        hidden_shape = (*input_shape, -1, self.head_dim)

# // load QKV
        query_states = self.q_proj(hidden_states).view(hidden_shape).transpose(1, 2)
        key_states = self.k_proj(hidden_states).view(hidden_shape).transpose(1, 2)
        value_states = self.v_proj(hidden_states).view(hidden_shape).transpose(1, 2)

# ROPE
        cos, sin = position_embeddings
        query_states, key_states = apply_rotary_pos_emb(query_states, key_states, cos, sin)

# KV cache
        if past_key_value is not None:
            # sin and cos are specific to RoPE models; cache_position needed for the static cache
            cache_kwargs = {&quot;sin&quot;: sin, &quot;cos&quot;: cos, &quot;cache_position&quot;: cache_position}
            key_states, value_states = past_key_value.update(key_states, value_states, self.layer_idx, cache_kwargs)

# ATTENTION
        attention_interface: Callable = eager_attention_forward

        if self.config._attn_implementation != &quot;eager&quot;:
            if self.config._attn_implementation == &quot;sdpa&quot; and kwargs.get(&quot;output_attentions&quot;, False):
                logger.warning_once(
                    &quot;`torch.nn.functional.scaled_dot_product_attention` does not support `output_attentions=True`. Falling back to &quot;
                    &#039;eager attention. This warning can be removed using the argument `attn_implementation=&quot;eager&quot;` when loading the model.&#039;
                )
            else:
                attention_interface = ALL_ATTENTION_FUNCTIONS[self.config._attn_implementation]

        attn_output, attn_weights = attention_interface(
            self,
            query_states,
            key_states,
            value_states,
            attention_mask,
            dropout=0.0 if not self.training else self.attention_dropout,
            scaling=self.scaling,
            **kwargs,
        )

        attn_output = attn_output.reshape(*input_shape, -1).contiguous()
        attn_output = self.o_proj(attn_output)
        return attn_output, attn_weights</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180221550.png" alt="" /></p>
<p>其实跟llama自己的实现大差不差。</p>
<p>这段代码定义了一个基于 Llama 模型的多头注意力机制（Multi-Head Attention）的 PyTorch 实现，参考了《Attention Is All You Need》论文。以下是对其推理过程（即 <code>forward</code> 方法）的详细解读，结合代码逐步分析其工作原理和关键点：</p>
<hr />
<h3><strong>1. 代码结构概述</strong></h3>
<p><code>LlamaAttention</code> 是一个 <code>nn.Module</code>，实现了一个 Transformer 的多头注意力层。它支持：</p>
<ul>
<li><strong>分组查询注意力（Grouped-Query Attention, GQA）</strong>：通过 <code>num_key_value_groups</code> 实现，减少键值对头的数量以优化计算。</li>
<li><strong>旋转位置编码（Rotary Positional Embedding, RoPE）</strong>：通过 <code>apply_rotary_pos_emb</code> 融入位置信息。</li>
<li><strong>键值缓存（Key-Value Cache）</strong>：用于加速自回归推理（如生成任务）。</li>
<li><strong>多种注意力实现</strong>：支持 <code>eager</code>（默认逐行计算）、<code>sdpa</code>（PyTorch 的 <code>scaled_dot_product_attention</code>）或 <code>flash</code>（如 FlashAttention 优化）。</li>
</ul>
<p>推理过程发生在 <code>forward</code> 方法中，输入包括：</p>
<ul>
<li><code>hidden_states</code>：输入的隐藏状态张量，形状为 <code>(batch_size, seq_len, hidden_size)</code>。</li>
<li><code>position_embeddings</code>：RoPE 的余弦（cos）和正弦（sin）位置编码。</li>
<li><code>attention_mask</code>：可选的掩码，用于屏蔽某些位置（如填充 token 或因果注意力）。</li>
<li><code>past_key_value</code>：键值缓存，用于自回归推理。</li>
<li><code>cache_position</code>：缓存的位置索引。</li>
<li><code>kwargs</code>：额外参数（如 FlashAttention 的配置）。</li>
</ul>
<p>输出为：</p>
<ul>
<li><code>attn_output</code>：注意力计算后的输出张量，形状为 <code>(batch_size, seq_len, hidden_size)</code>。</li>
<li><code>attn_weights</code>：注意力权重（可选，训练时可能用到）。</li>
</ul>
<hr />
<h3><strong>2. 推理过程逐行解读</strong></h3>
<h4><strong>输入处理</strong></h4>
<pre><code class="language-python">input_shape = hidden_states.shape[:-1]  # (batch_size, seq_len)
hidden_shape = (*input_shape, -1, self.head_dim)  # (batch_size, seq_len, num_heads, head_dim)</code></pre>
<ul>
<li>提取输入张量的形状，<code>input_shape</code> 保存 <code>batch_size</code> 和 <code>seq_len</code>，忽略最后一维（<code>hidden_size</code>）。</li>
<li>定义 <code>hidden_shape</code>，用于将张量重塑为多头格式，其中 <code>-1</code> 会被替换为 <code>num_attention_heads</code> 或 <code>num_key_value_heads</code>。</li>
</ul>
<h4><strong>线性投影</strong></h4>
<pre><code class="language-python">        self.q_proj = nn.Linear(
            config.hidden_size, config.num_attention_heads * self.head_dim, bias=config.attention_bias
        )
        self.k_proj = nn.Linear(
            config.hidden_size, config.num_key_value_heads * self.head_dim, bias=config.attention_bias
        )
        self.v_proj = nn.Linear(
            config.hidden_size, config.num_key_value_heads * self.head_dim, bias=config.attention_bias
        )

query_states = self.q_proj(hidden_states).view(hidden_shape).transpose(1, 2)
key_states = self.k_proj(hidden_states).view(hidden_shape).transpose(1, 2)
value_states = self.v_proj(hidden_states).view(hidden_shape).transpose(1, 2)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180211557.png" alt="" /></p>
<ul>
<li><strong>投影</strong>：通过线性层 <code>q_proj</code>、<code>k_proj</code> 和 <code>v_proj</code>，将输入的 <code>hidden_states</code> 分别映射到查询（Query）、键（Key）和值（Value）张量。
<ul>
<li>查询张量的输出维度：<code>num_attention_heads * head_dim</code>。</li>
<li>键和值张量的输出维度：<code>num_key_value_heads * head_dim</code>（GQA 可能使 <code>num_key_value_heads</code> 小于 <code>num_attention_heads</code>）。</li>
</ul></li>
<li><strong>重塑</strong>：使用 <code>view(hidden_shape)</code> 将张量重塑为 <code>(batch_size, seq_len, num_heads, head_dim)</code>，其中 <code>num_heads</code> 对应于注意力头数。</li>
<li><strong>转置</strong>：通过 <code>transpose(1, 2)</code> 将张量变为 <code>(batch_size, num_heads, seq_len, head_dim)</code>，方便后续按头并行计算注意力。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180211004.png" alt="" /></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180223617.png" alt="" /></p>
<p>Matmul 1: 200us
Matmul 2: 71us
Matmul 3: 70us</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180222159.png" alt="" /></p>
<h4><strong>应用旋转位置编码（RoPE）</strong></h4>
<pre><code class="language-python">cos, sin = position_embeddings
query_states, key_states = apply_rotary_pos_emb(query_states, key_states, cos, sin)</code></pre>
<ul>
<li><code>position_embeddings</code> 是一个包含余弦和正弦值的元组，用于 RoPE。</li>
<li><code>apply_rotary_pos_emb</code> 函数将位置信息融入 <code>query_states</code> 和 <code>key_states</code>，通过旋转操作（基于正弦和余弦）为每个 token 添加位置依赖性。</li>
<li>注意：<code>value_states</code> 不应用 RoPE，因为值张量不直接依赖位置信息。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180209276.png" alt="" />
200us</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180226016.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180227442.png" alt="" /></p>
<h4><strong>键值缓存（Key-Value Cache）</strong></h4>
<pre><code class="language-python">if past_key_value is not None:
    cache_kwargs = {&quot;sin&quot;: sin, &quot;cos&quot;: cos, &quot;cache_position&quot;: cache_position}
    key_states, value_states = past_key_value.update(key_states, value_states, self.layer_idx, cache_kwargs)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180212498.png" alt="" />
Time: 50us</p>
<ul>
<li><strong>作用</strong>：在自回归推理（如语言生成）中，键值缓存存储之前时间步的 <code>key_states</code> 和 <code>value_states</code>，避免重复计算。</li>
<li><strong>更新缓存</strong>：<code>past_key_value.update</code> 将当前时间步的 <code>key_states</code> 和 <code>value_states</code> 追加到缓存中，并返回更新后的键值张量。</li>
<li><strong>参数</strong>：
<ul>
<li><code>sin</code> 和 <code>cos</code>：用于 RoPE 的位置编码。</li>
<li><code>cache_position</code>：指示当前 token 在序列中的位置。</li>
<li><code>layer_idx</code>：标识当前注意力层的索引。</li>
</ul></li>
<li><strong>推理优化</strong>：在生成任务中，模型通常只处理最新 token，缓存允许快速访问历史信息，显著降低计算量。</li>
</ul>
<h4><strong>选择注意力实现</strong></h4>
<pre><code class="language-python">attention_interface: Callable = eager_attention_forward
if self.config._attn_implementation != &quot;eager&quot;:
    if self.config._attn_implementation == &quot;sdpa&quot; and kwargs.get(&quot;output_attentions&quot;, False):
        logger.warning_once(...)
    else:
        attention_interface = ALL_ATTENTION_FUNCTIONS[self.config._attn_implementation]</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180212063.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180216351.png" alt="" />
20 us</p>
<ul>
<li>根据 <code>config._attn_implementation</code>，选择注意力计算方式：
<ul>
<li><code>eager</code>：逐行实现的标准注意力，适合调试或需要输出注意力权重。</li>
<li><code>sdpa</code>：使用 PyTorch 的 <code>scaled_dot_product_attention</code>，性能更高，但不支持 <code>output_attentions=True</code>。</li>
<li><code>flash</code>：使用 FlashAttention 或类似优化，适合大规模模型，效率最高。</li>
</ul></li>
<li>如果选择了 <code>sdpa</code> 但要求输出注意力权重，会回退到 <code>eager</code> 并发出警告。</li>
</ul>
<h4><strong>计算注意力</strong></h4>
<pre><code class="language-python">attn_output, attn_weights = attention_interface(
    self,
    query_states,
    key_states,
    value_states,
    attention_mask,
    dropout=0.0 if not self.training else self.attention_dropout,
    scaling=self.scaling,
    **kwargs,
)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180212063.png" alt="" />
Scaled Dot-product Attention：276 us</p>
<ul>
<li><strong>核心计算</strong>：调用选定的 <code>attention_interface</code> 执行注意力机制：
<ul>
<li><strong>缩放点积</strong>：计算 <code>Q @ K^T / sqrt(head_dim)</code>，得到注意力分数（<code>self.scaling = head_dim**-0.5</code> 用于稳定梯度）。</li>
<li><strong>掩码</strong>：应用 <code>attention_mask</code>（如因果掩码，防止未来 token 影响当前 token）。</li>
<li><strong>Softmax</strong>：将注意力分数归一化为权重。</li>
<li><strong>加权求和</strong>：用注意力权重加权 <code>value_states</code>，得到每头的输出。</li>
</ul></li>
<li><strong>Dropout</strong>：推理时（<code>self.training=False</code>）禁用 dropout，训练时根据 <code>attention_dropout</code> 应用。</li>
<li><strong>输出</strong>：
<ul>
<li><code>attn_output</code>：形状为 <code>(batch_size, num_heads, seq_len, head_dim)</code>，表示注意力结果。</li>
<li><code>attn_weights</code>：注意力权重（可能为 <code>None</code>，依赖实现和配置）。</li>
</ul></li>
</ul>
<h4><strong>输出投影与重塑</strong></h4>
<pre><code class="language-python">        self.o_proj = nn.Linear(
            config.num_attention_heads * self.head_dim, config.hidden_size, bias=config.attention_bias
        )

attn_output = attn_output.reshape(*input_shape, -1).contiguous()
attn_output = self.o_proj(attn_output)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180234039.png" alt="" />
time: 263us</p>
<ul>
<li><strong>重塑</strong>：将 <code>attn_output</code> 从 <code>(batch_size, num_heads, seq_len, head_dim)</code> 变回 <code>(batch_size, seq_len, num_attention_heads * head_dim)</code>。</li>
<li><strong>投影</strong>：通过 <code>o_proj</code> 线性层将注意力输出映射回 <code>hidden_size</code> 维度，得到最终输出，形状为 <code>(batch_size, seq_len, hidden_size)</code>。</li>
<li><strong>contiguous</strong>：确保张量在内存中连续，优化后续操作。</li>
</ul>
<h4><strong>返回结果</strong></h4>
<pre><code class="language-python">return attn_output, attn_weights</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180214796.png" alt="" /></p>
<ul>
<li>返回 <code>attn_output</code>（注意力层输出）和 <code>attn_weights</code>（注意力权重，若计算则返回，否则可能为 <code>None</code>）。</li>
</ul>
<hr />
<h3><strong>3. 推理中的关键优化</strong></h3>
<ol>
<li>
<p><strong>分组查询注意力（GQA）</strong>：</p>
<ul>
<li><code>num_key_value_groups</code> 定义了查询头与键值头之间的分组比例。</li>
<li>减少 <code>num_key_value_heads</code>（键值对头数）降低内存和计算开销，同时保持 <code>num_attention_heads</code>（查询头数）以保留表达能力。</li>
<li>在推理中，这显著减少了键值缓存的内存占用。</li>
</ul>
</li>
<li>
<p><strong>键值缓存</strong>：</p>
<ul>
<li>在自回归推理中，缓存历史键值对避免重复计算。</li>
<li>每次只处理最新 token，缓存将历史信息与当前输入拼接，推理时间从 O(seq_len^2) 降为 O(seq_len)。</li>
</ul>
</li>
<li>
<p><strong>旋转位置编码（RoPE）</strong>：</p>
<ul>
<li>RoPE 通过旋转操作融入位置信息，无需显式位置嵌入，减少参数量。</li>
<li>在推理中，<code>sin</code> 和 <code>cos</code> 可预计算，动态应用于当前 token。</li>
</ul>
</li>
<li>
<p><strong>高效注意力实现</strong>：</p>
<ul>
<li><code>flash</code> 模式（如 FlashAttention）通过融合操作减少 GPU 内存读写，加速推理。</li>
<li><code>sdpa</code> 利用 PyTorch 优化的内核，适合中小规模模型。</li>
<li>选择合适的实现根据硬件和模型规模平衡速度与功能（如是否需要 <code>attn_weights</code>）。</li>
</ul>
</li>
<li>
<p><strong>因果注意力</strong>：</p>
<ul>
<li><code>self.is_causal = True</code> 表明这是一个自回归模型，推理时通过 <code>attention_mask</code> 确保当前 token 只关注之前 token。</li>
</ul>
</li>
</ol>
<hr />
<h3><strong>4. 推理性能分析</strong></h3>
<ul>
<li><strong>计算复杂度</strong>：
<ul>
<li>投影层（<code>q_proj</code>, <code>k_proj</code>, <code>v_proj</code>, <code>o_proj</code>）：O(seq_len * hidden_size^2)。</li>
<li>注意力计算：O(seq_len^2 <em> head_dim </em> num_heads)（无缓存），或 O(seq_len <em> head_dim </em> num_heads)（有缓存）。</li>
<li>GQA 进一步减少键值计算量。</li>
</ul></li>
<li><strong>内存需求</strong>：
<ul>
<li>键值缓存：O(seq_len <em> num_key_value_heads </em> head_dim * num_layers)。</li>
<li>FlashAttention 减少中间张量的内存占用。</li>
</ul></li>
<li><strong>瓶颈</strong>：
<ul>
<li>长序列推理时，缓存内存可能成为瓶颈。</li>
<li>注意力计算（尤其是 <code>eager</code> 模式）可能较慢，推荐 <code>flash</code> 或 <code>sdpa</code>。</li>
</ul></li>
</ul>
<hr />
<p><code>LlamaAttention</code> 的推理过程高效地实现了多头注意力，结合 GQA、RoPE 和键值缓存优化了自回归生成任务的性能。其核心步骤包括投影、位置编码、注意力计算和输出投影，支持多种高效实现（如 FlashAttention）。在推理中，缓存和 GQA 是关键优化点，显著降低计算和内存开销，适合大规模语言模型的部署。</p>
<h2>FFN</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180145560.png" alt="" /></p>
<p>Silu
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180201372.png" alt="" />
matmul
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180207299.png" alt="" /></p>
<p><a href="https://github.com/meta-llama/llama/blob/main/llama/model.py#L307">llama/llama/model.py at main · meta-llama/llama</a></p>
<p>首先，输入通过两个全连接层——<code>gate</code>和<code>up</code>进行初步变换，其中<code>gate</code>的输出经过激活函数（silu）进行非线性变换，与<code>up</code>的输出做点乘，最后再通过<code>down</code>全连接层进行进一步处理。FFN模块的作用是增强模型的表达能力，从而在Transformer架构中捕捉更复杂的特征。</p>
<p>silu 公式：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504172046251.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171955659.png" alt="" /></p>
<pre><code class="language-python">class FeedForward(nn.Module):
    def __init__(
        self,
        dim: int,
        hidden_dim: int,
        multiple_of: int,
        ffn_dim_multiplier: Optional[float],
    ):
        &quot;&quot;&quot;
        Initialize the FeedForward module.

        Args:
            dim (int): Input dimension.
            hidden_dim (int): Hidden dimension of the feedforward layer.
            multiple_of (int): Value to ensure hidden dimension is a multiple of this value.
            ffn_dim_multiplier (float, optional): Custom multiplier for hidden dimension. Defaults to None.

        Attributes:
            w1 (ColumnParallelLinear): Linear transformation for the first layer.
            w2 (RowParallelLinear): Linear transformation for the second layer.
            w3 (ColumnParallelLinear): Linear transformation for the third layer.

        &quot;&quot;&quot;
        super().__init__()
        hidden_dim = int(2 * hidden_dim / 3)
        # custom dim factor multiplier
        if ffn_dim_multiplier is not None:
            hidden_dim = int(ffn_dim_multiplier * hidden_dim)
        hidden_dim = multiple_of * ((hidden_dim + multiple_of - 1) // multiple_of)

        self.w1 = ColumnParallelLinear(
            dim, hidden_dim, bias=False, gather_output=False, init_method=lambda x: x
        )
        self.w2 = RowParallelLinear(
            hidden_dim, dim, bias=False, input_is_parallel=True, init_method=lambda x: x
        )
        self.w3 = ColumnParallelLinear(
            dim, hidden_dim, bias=False, gather_output=False, init_method=lambda x: x
        )

    def forward(self, x):
        return self.w2(F.silu(self.w1(x)) * self.w3(x))</code></pre>
<p>FeedForward 是一个 nn.Module，实现了一个前馈网络，常见于 Transformer 的每个注意力层之后。它的主要特点包括：</p>
<ul>
<li><strong>SwiGLU 激活</strong>：结合 SiLU（Swish）激活函数和门控机制，增强非线性表达能力。</li>
<li><strong>并行线性层</strong>：使用 ColumnParallelLinear 和 RowParallelLinear，支持模型并行（如张量并行），适合分布式训练。</li>
<li><strong>动态隐藏维度</strong>：通过 multiple_of 和 ffn_dim_multiplier 调整隐藏层维度，确保高效计算和内存对齐。</li>
</ul>
<p>代码由两部分组成：</p>
<ol>
<li><strong>init</strong>：初始化模块，定义线性层和隐藏维度。</li>
<li>forward：定义前向传播逻辑，执行 MLP 计算。</li>
</ol>
<p><strong>参数</strong></p>
<pre><code class="language-python">def __init__(
    self,
    dim: int,                    # 输入维度
    hidden_dim: int,            # 隐藏层维度（初始值）
    multiple_of: int,           # 确保隐藏维度是该值的倍数
    ffn_dim_multiplier: Optional[float],  # 可选的隐藏维度缩放因子
):</code></pre>
<ul>
<li>dim：输入和输出的维度，通常等于 Transformer 的 hidden_size（如 4096）。</li>
<li>hidden_dim：隐藏层的初始维度，通常较大（如 4 * dim）。</li>
<li>multiple_of：用于调整隐藏维度，使其成为某个值的倍数（优化内存对齐和计算效率）。</li>
<li>ffn_dim_multiplier：可选的缩放因子，用于自定义隐藏维度。</li>
</ul>
<p><strong>隐藏维度调整</strong></p>
<pre><code class="language-python">hidden_dim = int(2 * hidden_dim / 3)
if ffn_dim_multiplier is not None:
    hidden_dim = int(ffn_dim_multiplier * hidden_dim)
hidden_dim = multiple_of * ((hidden_dim + multiple_of - 1) // multiple_of)</code></pre>
<ul>
<li><strong>初始缩放</strong>：hidden_dim = int(2 * hidden_dim / 3)，将输入的 hidden_dim 缩减到原来的 2/3。这可能是为了适配 SwiGLU 的门控机制，降低计算量。</li>
<li><strong>自定义缩放</strong>：如果提供了 ffn_dim_multiplier，则进一步按该因子调整 hidden_dim。</li>
<li><strong>对齐调整</strong>：通过 multiple_of * ((hidden_dim + multiple_of - 1) // multiple_of)，确保 hidden_dim 是 multiple_of 的倍数。这种对齐优化了 GPU/TPU 上的内存访问和计算效率（例如，适配 SIMD 指令或缓存行）。</li>
</ul>
<p><strong>线性层定义</strong></p>
<pre><code class="language-python">self.w1 = ColumnParallelLinear(
    dim, hidden_dim, bias=False, gather_output=False, init_method=lambda x: x
)
self.w2 = RowParallelLinear(
    hidden_dim, dim, bias=False, input_is_parallel=True, init_method=lambda x: x
)
self.w3 = ColumnParallelLinear(
    dim, hidden_dim, bias=False, gather_output=False, init_method=lambda x: x
)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180205344.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180204041.png" alt="" /></p>
<ul>
<li><strong>线性层</strong>：
<ul>
<li>w1：从 dim 映射到 hidden_dim，用于计算 SwiGLU 的主路径。</li>
<li>w3：从 dim 映射到 hidden_dim，用于计算 SwiGLU 的门控路径。</li>
<li>w2：从 hidden_dim 映射回 dim，生成最终输出。</li>
</ul></li>
<li><strong>并行特性</strong>：
<ul>
<li>ColumnParallelLinear：输入按列分割，适合张量并行，每个进程处理部分输出维度（hidden_dim）。</li>
<li>RowParallelLinear：输入按行分割（hidden_dim），输出在进程间聚合，恢复 dim 维度。</li>
<li>gather_output=False（w1, w3）：输出保留分割状态，减少通信开销。</li>
<li>input_is_parallel=True（w2）：输入已经是并行分割的，匹配 w1 和 w3 的输出。</li>
</ul></li>
<li><strong>无偏置</strong>：bias=False，减少参数量，依赖归一化层（如 LayerNorm）处理偏移。</li>
<li><strong>初始化</strong>：init_method=lambda x: x，保留输入权重（可能在外部统一初始化）。</li>
</ul>
<p>FeedForward 模块中的三个线性层（w1, w2, w3）执行的实际运算是<strong>矩阵乘法</strong>，这是 PyTorch 中 nn.Linear（及其并行变体 ColumnParallelLinear 和 RowParallelLinear）的核心操作。</p>
<p>ColumnParallelLinear</p>
<pre><code>w1_out = x @ w1_weight^T

w3_out = x @ w3_weight^T</code></pre>
<ul>
<li>权重矩阵按 hidden_dim 维度分割到多个设备。</li>
<li>每个设备计算部分输出维度，输出仍为 (batch_size * seq_len, hidden_dim)，但分割存储（gather_output=False）。</li>
</ul>
<p>RowParallelLinear</p>
<pre><code>w2_out = gate_out @ w2_weight^T</code></pre>
<ul>
<li>输入 gate_out 按 hidden_dim 维度分割（与 w1 和 w3 的输出匹配，input_is_parallel=True）。</li>
<li>每个设备计算部分矩阵乘法，结果按 dim 维度聚合，生成完整的 (batch_size * seq_len, dim)。</li>
</ul>
<h2>RMSNorm</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180236374.png" alt="" />
159us
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180236237.png" alt="" /></p>
<ol>
<li>
<p>计算均值
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180238319.png" alt="" /></p>
</li>
<li>
<p>平方根倒数
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180239955.png" alt="" /></p>
</li>
<li>
<p>归一化</p>
</li>
<li>
<p>权重
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180240131.png" alt="" /></p>
</li>
</ol>
<pre><code class="language-python">class RMSNorm(torch.nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x):
        output = self._norm(x.float()).type_as(x)
        return output * self.weight</code></pre>
<h2>整体结构</h2>
<p>为了简化讨论，这里我们采用了MHA（多头注意力）结构的模型作为示例。对于GQA（分组注意力）、MQA（混合注意力）等其他变体模型，也可以通过类似的方法进行类比和分析。</p>
<p>为了简化图示表达，我们对大模型推理过程中常见的张量形状进行了简化表示：</p>
<ul>
<li><strong>Batch Size (B)</strong>：表示每次推理中处理的样本数量。</li>
<li><strong>Sequence Length (S)</strong>：表示每个样本的序列长度，通常是文本的单词或字符数。</li>
<li><strong>Hidden Size (H)</strong>：表示隐藏层的维度，通常与模型的复杂度相关。</li>
<li><strong>Vocabulary Size (V)</strong>：表示模型词汇表的大小，通常决定了词嵌入的维度。</li>
<li><strong>Number of Attention Heads (A)</strong>：表示每层自注意力机制的头数，影响模型的计算量。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504171953681.png" alt="" /></li>
</ul>
<p>Output 层与Sample 层
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180248242.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202504180248243.png" alt="" /></p>
<p>掌握一个模型的架构及优化方法，可以通过类比快速理解并迁移到其他模型上。</p>
<p>要深入了解大型语言模型（LLM）在 CPU 端的推理加速，以及整个系统的调用栈，分析 <code>transformers</code> 库的源码是一个很好的起点，以下是逐步解析调用栈和建议从哪里开始看源码的指南：</p>
<hr />
<h3>1. 理解 <code>pipeline</code> 的调用栈</h3>
<p>在你的代码中，<code>pipe = pipeline(...)</code> 和 <code>res = pipe(prompt)</code> 是核心调用点。以下是 <code>pipeline</code> 的高层调用流程：</p>
<ul>
<li>
<p><strong>pipeline 初始化</strong> (<code>pipeline(&quot;text-generation&quot;, ...)</code>):</p>
<ul>
<li><code>pipeline</code> 会根据任务（<code>text-generation</code>）加载模型和分词器（tokenizer）。</li>
<li>它会调用 <code>AutoModelForCausalLM</code>（或其他适配模型类）来加载 <code>meta-llama/Llama-3.2-1B</code> 模型。</li>
<li>模型会被加载到指定设备（<code>device_map=&quot;auto&quot;</code>），并根据 <code>torch_dtype</code>（如 <code>bfloat16</code>）进行优化。</li>
<li>相关的配置（如 <code>max_new_tokens</code>）会被传递到生成逻辑中。</li>
</ul>
</li>
<li>
<p><strong>推理过程</strong> (<code>pipe(prompt)</code>):</p>
<ul>
<li>输入 <code>prompt</code> 被分词器编码为 token IDs。</li>
<li>编码后的输入被送入模型进行前向传播，生成 logits。</li>
<li>生成逻辑（通常是贪婪搜索、束搜索或采样）根据 logits 选择下一个 token。</li>
<li>重复生成直到达到 <code>max_new_tokens</code> 或遇到终止条件。</li>
<li>最后，生成的 token IDs 被解码为文本输出。</li>
</ul>
</li>
</ul>
<p>整个过程涉及以下组件：</p>
<ul>
<li><strong>分词器</strong>：将文本转为 token IDs。</li>
<li><strong>模型</strong>：执行前向传播，生成 logits。</li>
<li><strong>生成逻辑</strong>：基于 logits 选择 token。</li>
<li><strong>设备管理</strong>：CPU 或 GPU 的张量运算。</li>
</ul>
<hr />
<h3>2. 调用栈的关键点</h3>
<p>以下是 <code>transformers</code> 库中与你的代码相关的调用栈（基于 <code>pipeline</code> 的 <code>text-generation</code> 任务）：</p>
<ol>
<li>
<p><strong><code>pipeline</code> 初始化</strong>:</p>
<ul>
<li>源码位置：<code>transformers/pipelines/__init__.py</code>
<ul>
<li><code>pipeline</code> 函数会根据任务类型（<code>text-generation</code>）选择合适的 pipeline 类（<code>TextGenerationPipeline</code>）。</li>
</ul></li>
<li>源码位置：<code>transformers/pipelines/text_generation.py</code>
<ul>
<li><code>TextGenerationPipeline</code> 初始化时加载模型（<code>AutoModelForCausalLM</code>）和分词器（<code>AutoTokenizer</code>）。</li>
</ul></li>
<li>源码位置：<code>transformers/models/auto/auto_factory.py</code>
<ul>
<li><code>AutoModelForCausalLM.from_pretrained(model_id)</code> 加载预训练模型。</li>
</ul></li>
<li>源码位置：<code>transformers/modeling_utils.py</code>
<ul>
<li><code>from_pretrained</code> 方法处理模型权重加载、设备映射（<code>device_map</code>）和数据类型（<code>torch_dtype</code>）。</li>
</ul></li>
</ul>
</li>
<li>
<p><strong>推理调用</strong> (<code>pipe(prompt)</code>):</p>
<ul>
<li>源码位置：<code>transformers/pipelines/text_generation.py</code>
<ul>
<li><code>TextGenerationPipeline.__call__</code> 方法处理输入 <code>prompt</code>，调用分词器编码和模型生成。</li>
</ul></li>
<li>源码位置：<code>transformers/generation/utils.py</code>
<ul>
<li><code>generate</code> 方法实现生成逻辑（如贪婪搜索、采样等）。</li>
<li>它调用模型的 <code>forward</code> 方法（前向传播）生成 logits。</li>
</ul></li>
<li>源码位置：<code>transformers/models/llama/modeling_llama.py</code>
<ul>
<li>对于 <code>Llama-3.2-1B</code>，<code>LlamaForCausalLM.forward</code> 实现前向传播，计算注意力机制和 MLP 的输出。</li>
</ul></li>
<li>源码位置：<code>torch/nn/modules/*</code>
<ul>
<li>PyTorch 的底层模块（如线性层、注意力机制）在 CPU 上执行张量运算。</li>
</ul></li>
</ul>
</li>
<li>
<p><strong>分词器</strong>:</p>
<ul>
<li>源码位置：<code>transformers/tokenization_utils_base.py</code>
<ul>
<li>分词器的 <code>encode</code> 和 <code>decode</code> 方法处理文本到 token 的转换。</li>
</ul></li>
<li>对于 Llama 模型，分词器通常基于 <code>sentencepiece</code> 或自定义实现。</li>
</ul>
</li>
<li>
<p><strong>设备和数据类型管理</strong>:</p>
<ul>
<li>源码位置：<code>transformers/utils/generic.py</code> 和 <code>accelerate</code> 库
<ul>
<li><code>device_map=&quot;auto&quot;</code> 使用 <code>accelerate</code> 库来分配模型权重到 CPU 或 GPU。</li>
</ul></li>
<li>源码位置：<code>torch/*</code>
<ul>
<li>PyTorch 管理张量的数据类型（<code>bfloat16</code>）和设备（CPU）。</li>
</ul></li>
</ul>
</li>
</ol>
<hr />
<h3>3. 从哪里开始看源码</h3>
<p>为了研究 LLM 在 CPU 端的推理加速，建议按照以下步骤逐步阅读源码，并关注与性能优化的相关部分：</p>
<h4>步骤 1：从 <code>pipeline</code> 入手</h4>
<ul>
<li><strong>文件</strong>：<code>transformers/pipelines/text_generation.py</code>
<ul>
<li>查看 <code>TextGenerationPipeline</code> 的 <code>__call__</code> 方法，了解如何调用分词器和模型。</li>
<li>重点关注 <code>_forward</code> 和 <code>postprocess</code> 方法，它们处理模型推理和输出解码。</li>
</ul></li>
<li><strong>为什么</strong>：<code>pipeline</code> 是高层接口，理解它可以快速把握推理流程的全貌。</li>
</ul>
<h4>步骤 2：深入生成逻辑</h4>
<ul>
<li><strong>文件</strong>：<code>transformers/generation/utils.py</code>
<ul>
<li>查看 <code>GenerationMixin.generate</code> 方法，这是生成 token 的核心逻辑。</li>
<li>关注 <code>greedy_search</code> 或 <code>sample</code> 方法（取决于你的生成配置），它们控制如何从 logits 中选择 token。</li>
</ul></li>
<li><strong>为什么</strong>：生成逻辑涉及多次模型调用，优化这里可以显著提升性能（例如减少前向传播次数）。</li>
</ul>
<h4>步骤 3：研究模型前向传播</h4>
<ul>
<li><strong>文件</strong>：<code>transformers/models/llama/modeling_llama.py</code>
<ul>
<li>查看 <code>LlamaForCausalLM.forward</code> 和 <code>LlamaModel.forward</code> 方法。</li>
<li>关注 <code>LlamaAttention</code>（自注意力机制）和 <code>LlamaMLP</code>（前馈网络），它们是计算密集的部分。</li>
</ul></li>
<li><strong>为什么</strong>：模型的前向传播是推理的性能瓶颈，尤其在 CPU 上。优化注意力机制（例如使用 FlashAttention 或量化）是加速的关键。</li>
</ul>
<h4>步骤 4：检查分词器</h4>
<ul>
<li><strong>文件</strong>：<code>transformers/models/llama/tokenization_llama.py</code>
<ul>
<li>查看分词器的 <code>encode</code> 和 <code>decode</code> 方法。</li>
</ul></li>
<li><strong>为什么</strong>：分词器的效率对预处理和后处理有影响，尤其在处理长序列时。</li>
</ul>
<h4>步骤 5：关注设备和数据类型</h4>
<ul>
<li><strong>文件</strong>：<code>transformers/modeling_utils.py</code> 和 <code>accelerate</code> 库
<ul>
<li>查看 <code>from_pretrained</code> 如何处理 <code>device_map</code> 和 <code>torch_dtype</code>。</li>
<li>如果使用 <code>bfloat16</code>，检查 PyTorch 如何在 CPU 上处理该数据类型（可能需要模拟浮点运算）。</li>
</ul></li>
<li><strong>文件</strong>：<code>torch/nn/modules/*</code>
<ul>
<li>查看 PyTorch 的线性层和注意力实现的底层代码。</li>
</ul></li>
<li><strong>为什么</strong>：CPU 上的张量运算效率直接影响推理速度。优化可能涉及使用更高效的 BLAS 库（如 MKL）或减少内存拷贝。</li>
</ul>
<h4>步骤 6：性能优化点</h4>
<ul>
<li><strong>量化</strong>：<code>transformers</code> 支持 8 位整数（int8）量化，查看 <code>torch.quantization</code> 或 <code>bitsandbytes</code> 集成。</li>
<li><strong>批处理</strong>：检查 <code>pipeline</code> 是否支持批量推理（在 <code>TextGenerationPipeline</code> 中）。</li>
<li><strong>缓存</strong>：Llama 模型使用 KV 缓存（key-value cache）加速自回归生成，查看 <code>past_key_values</code> 的实现。</li>
<li><strong>外部库</strong>：如果需要更底层的优化，考虑阅读 <code>torch</code> 或 <code>onnxruntime</code> 的源码，了解 CPU 上的张量运算。</li>
</ul>
<hr />
<h3>4. 推荐的阅读顺序</h3>
<ol>
<li><strong>高层次</strong>：<code>transformers/pipelines/text_generation.py</code>（理解 <code>pipeline</code> 整体流程）。</li>
<li><strong>生成逻辑</strong>：<code>transformers/generation/utils.py</code>（掌握 token 生成）。</li>
<li><strong>模型细节</strong>：<code>transformers/models/llama/modeling_llama.py</code>（深入前向传播）。</li>
<li><strong>底层运算</strong>：<code>torch/nn/modules/*</code>（优化张量计算）。</li>
<li><strong>加速工具</strong>：<code>accelerate</code> 或 <code>bitsandbytes</code>（研究设备管理和量化）。</li>
</ol>
<hr />
<h3>5. CPU 推理加速的额外建议</h3>
<ul>
<li><strong>量化</strong>：尝试使用 <code>bitsandbytes</code> 或 <code>torch.int8</code> 量化模型，减少内存占用和计算量。</li>
<li><strong>ONNX Runtime</strong>：将模型导出为 ONNX 格式，使用 <code>onnxruntime</code> 在 CPU 上加速推理。</li>
<li><strong>KV 缓存优化</strong>：确保 KV 缓存在 CPU 上高效存储和访问。</li>
<li><strong>并行化</strong>：利用 PyTorch 的 <code>torch.compile</code> 或多线程并行化前向传播。</li>
<li><strong>Profile 性能</strong>：使用 <code>torch.profiler</code> 分析推理的性能瓶颈，找出耗时最多的模块。</li>
</ul>
<hr />
<h3>6. 具体源码路径</h3>
<p>以下是 Hugging Face <code>transformers</code>（假设使用最新版本，如 4.44.0）的关键文件路径（基于 GitHub 仓库 <code>huggingface/transformers</code>）：</p>
<ul>
<li>Pipeline: <code>src/transformers/pipelines/text_generation.py</code></li>
<li>生成逻辑: <code>src/transformers/generation/utils.py</code></li>
<li>Llama 模型: <code>src/transformers/models/llama/modeling_llama.py</code></li>
<li>分词器: <code>src/transformers/models/llama/tokenization_llama.py</code></li>
<li>模型加载: <code>src/transformers/modeling_utils.py</code></li>
</ul>
<p>你可以克隆 <code>transformers</code> 仓库（<code>git clone https://github.com/huggingface/transformers</code>），然后搜索这些文件。</p>
<h2>Summary</h2>
<ul>
<li><strong>调用栈</strong>：从 <code>pipeline.__call__</code> 开始，依次调用分词器（<code>tokenizer.encode</code>）、生成逻辑（<code>generate</code>）、模型前向传播（<code>model.forward</code>），最后解码输出（<code>tokenizer.decode</code>）。</li>
<li><strong>从哪里开始</strong>：建议从 <code>transformers/pipelines/text_generation.py</code> 的 <code>TextGenerationPipeline</code> 开始，逐步深入到 <code>generation/utils.py</code> 和 <code>modeling_llama.py</code>。</li>
<li><strong>加速重点</strong>：关注模型的注意力机制、量化支持和 KV 缓存管理，这些是 CPU 推理的瓶颈。</li>
</ul>
<h2>Pipeline</h2>
<p><a href="https://huggingface.co/docs/transformers/main_classes/pipelines">Pipelines</a></p>
