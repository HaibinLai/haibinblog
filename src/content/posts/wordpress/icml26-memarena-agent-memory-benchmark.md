---
title: "ICML26 Memarena Agent Memory Benchmark"
description: "一句话总结：这篇文章揭示了当前 LLM 智能体在处理长期、复杂交互任务时记忆能力的不足，并提供了一个更具挑战性的评估平台来推动该领域的进步 已有benchmark的特点 Large language model (LLM) agents have two complementary core capabilities: the ability to memorize task-relevant knowledge over time…"
publishedAt: "2026-06-18 14:13:00"
category: "Academic"
tags: ["Agents", "ICML"]
draft: false
slug: "icml26-memarena-agent-memory-benchmark"
legacySlug: "icml26-memarena-agent-memory-benchmark"
wordpressId: 1424
sourceUrl: "https://www.haibinlaiblog.top/index.php/icml26-memarena-agent-memory-benchmark/"
commentCount: 1
importedFromWordPress: true
---
<p>一句话总结：这篇文章揭示了当前 LLM 智能体在处理长期、复杂交互任务时记忆能力的不足，并提供了一个更具挑战性的评估平台来推动该领域的进步</p>
<h2>已有benchmark的特点</h2>
<p>Large language model (LLM) agents have two complementary core capabilities: the ability to memorize task-relevant knowledge over time (memorization) and the ability to act through interaction with an environment (action) (Hu et al., 2025b). However, existing evaluations of LLM agents with memory typically isolate and assess only one aspect. The first class of benchmarks focuses on evaluating memorization through recall or retrieval over static long-context inputs in question answering or summarization settings.</p>
<p>In these setups, agents are required to memorize provided conversations or text chunks, and are evaluated on whether they can recall specific information through downstream QA tasks.</p>
<p>现有的记忆评估通常将“记忆能力”与“行动能力”割裂开来。一类基准仅测试对过去对话的静态回溯（如 LoCoMo），另一类则侧重于单次会话中的行动（如 WebArena），无法反映现实中智能体<strong>需要通过互动获取记忆并用其指导未来决策的复杂场景</strong></p>
<p>However, despite being effective at measuring factual recall, such benchmarks do not involve agentic decisionmaking, environment dynamics, or action-dependent consequences. As a result, although contemporary memory systems achieve near-saturated performance on these benchmarks, it remains unclear whether such gains meaningfully translate to improved performance for LLM agents operating in goal-driven, interactive settings.</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/2026/02/20260226232107805.png" alt="image.png" /></p>
<p>To this end, we introduce MEMORYARENA, a unified evaluation gym for benchmarking the usefulness of agent memory using multi-session, interdependent agentic tasks. MEMORYARENA consists of human-crafted tasks with interdependent subtasks, where later actions are underspecified unless agents correctly track task-relevant information from prior sessions. We instantiate MEMORYARENA across four domains, including (1) bundled web shopping, (2) preference constrained group travel planning, (3) progressive information searching, and (4) sequential formal reasoning over math and physical problems. Each task spans long horizons (with an average of 57 action steps) and produces extended reasoning traces with more than 40k tokens. Table 1 compares MEMORYARENA with existing memory and agent benchmarks along key dimensions.</p>
<p>该基准包含四个具有<strong>严格因果依赖关系</strong>的任务领域，要求智能体必须记住早期会话的信息才能完成后续任务 ：</p>
<ul>
<li><strong>组合网络购物（Bundled Web Shopping）：</strong> 智能体需要购买一系列相关的产品（如相机机身和镜头），后续购买必须符合之前购买产品的兼容性约束（如品牌、接口匹配） 。</li>
<li><strong>偏好受限的团体旅行规划（Group Travel Planning）：</strong> 智能体为多人规划行程，新加入的旅行者会提出与已有成员相关的偏好（如“我想住比某人等级高两级的酒店”），要求智能体精准记忆之前的规划细节 。</li>
<li><strong>渐进式网络搜索（Progressive Web Search）：</strong> 用户不断增加新的限制条件，智能体需在多步搜索中不断积累并融合信息，最终答案必须满足所有历史约束 。</li>
<li><strong>序列化正式推理（Sequential Formal Reasoning）：</strong> 提取自真实的数学和物理研究论文，智能体需要利用之前推导出的引理或定义来解决后续更复杂的理论证明问题 。</li>
</ul>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/2026/02/20260226232544740.png" alt="image.png" /></p>
<h2>多会话任务</h2>
<p>该研究将多会话任务视为<strong>部分可观测马尔可夫决策过程（POMDP）</strong></p>
<p><strong>特别之处：</strong> 它量化了智能体由于记忆偏差导致的“信念漂移（Belief Drift）”——<strong>随着任务深度增加，微小的记忆错误会不断累积，最终导致下游决策彻底失败</strong> 。
small errors in the agent’s implicit state estimate accumulate across sessions and eventually dominate downstream decisions, as shown in Figure 3.</p>
<p>和bw讨论了下，POMDP这个定义概括感觉怪怪的。因为agent会根据错误去修正。但是查了下，这是yaoshunyu提出的，可能当时也是简单的建模。</p>
<p>一共有三种agent：long context; Agent+Memory; Agent+RAG</p>
<p>Agents with Long-context buffers (Long-Context Agent) which append verbatim interaction history directly before the prompt before each subtask without explicit abstraction or consolidation, working as an incontext memory. We include GPT-5.1-mini, GPT-4.1-mini, and Gemini-3-flash, Claude-Sonnet-4.5. Agents with External Memory, where the agents maintain an external memory with learned or curated mechanisms for information abstraction, consolidation, and retrieval. We include four mainstream agents with external memory: MemGPT (Packer et al., 2023), Mem0 and its graph version Mem0-g (Chhikara et al., 2025), and ReasoningBank (Ouyang et al., 2025). Agents with Retrieval-augmented generation (RAG) systems, which use an indexed document store to store past information and then access it via retrieval. We consider different retrieval methods, including BM25, an embeddingbased RAG method that retrieves based on semantic similarity (using OpenAI text-embedding-3-small), and two structured RAG approaches, MemoRAG (Qian et al., 2025) and GraphRAG (Edge et al., 2024), in our evaluation.
<img src="https://haibinblog.s3.us-east-1.amazonaws.com/2026/02/20260226233233265.png" alt="image.png" /></p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/2026/02/20260226234729155.png" alt="image.png" /></p>
