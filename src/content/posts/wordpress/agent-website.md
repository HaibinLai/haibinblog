---
title: "Agent + Website"
description: "WebTactix Semantic Tree-Guided Parallel Multi-Agent Planning for Web Task — 基于语义树引导的并行多代理规划框架。 将任务变成搜索树 Agent并行的BFS去决策完成最佳搜索 任务预处理 将用户请求转换成明确的约束集合，这样可以清晰地检测任务是否完成。 简化观察 (AxTree) 把原始的网页可访问性树转换为简化文本版的 AxTree。 去除重复元素。对重复结构…"
publishedAt: "2026-02-10T01:47:56Z"
updatedAt: "2026-02-10T01:48:07Z"
category: "Frameworks"
categories: ["Frameworks"]
tags: ["LLM"]
author: "GB"
draft: false
slug: "agent-website"
legacySlug: "agent-website"
oldSlugs: []
wordpressId: 1228
sourceUrl: "https://www.haibinlaiblog.top/index.php/agent-website/"
commentCount: 0
viewCount: 1184
likeCount: 3
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-02/agent-website.webp"
---
<h2>WebTactix</h2>
<p><strong>Semantic Tree-Guided Parallel Multi-Agent Planning for Web Task</strong> — 基于语义树引导的并行多代理规划框架。</p>
<ol>
<li>将任务变成搜索树</li>
<li>Agent并行的BFS去决策完成最佳搜索</li>
</ol>
<p><strong>任务预处理</strong>
将用户请求转换成明确的约束集合，这样可以清晰地检测任务是否完成。</p>
<p><strong>简化观察 (AxTree)</strong>
把原始的网页可访问性树转换为简化文本版的 AxTree。
去除重复元素。对重复结构（如评论列表、商品列表）做压缩保留关键信息。</p>
<p>WebTactix 将探索过程组织成一棵树
<strong>节点</strong>：表示网页状态
<strong>边</strong>：代表一个操作计划（点击、输入、判断等）
当执行动作产生新页面时，就会在树上扩展一条边并形成新节点。树上保存的信息被用来指导未来的选择。</p>
<p><strong>静态？？</strong></p>
<p><strong>在当前页面，WebTactix 会：</strong></p>
<ul>
<li>同时展开多个候选操作（比如多个按钮/输入可能）</li>
<li>分配多个规划 agent（智能体）来分别研究每个候选</li>
<li>每个 agent 生成：
<ul>
<li>当前页面的事实摘要</li>
<li>下一步可执行的计划
这个并行设计可以在更广的状态空间中快速找到高质量方向，而不是像普通脚本那样顺序试错。</li>
</ul></li>
</ul>
<p><strong>为了选择最优路径，WebTactix 引入了决策 agent，它根据事实总结信息和候选计划判断：</strong></p>
<ul>
<li>当前哪个分支最有可能解决任务</li>
<li>若某条分支不佳，则：
<ul>
<li><strong>反思 (Reflex)</strong>：在当前节点重新规划</li>
<li><strong>重新选择 (Reselect)</strong>：从其他候选分支继续探索</li>
</ul></li>
</ul>
<p><strong>执行与记忆更新</strong>
选定下一步后：</p>
<ul>
<li>在<strong>并行标签页</strong>执行计划</li>
<li>回放必要的历史操作到对应状态</li>
<li>记录执行结果并写回语义树</li>
<li>包括“部分完成”“数据提取”等优化策略，<br />
以减少冗余浏览和历史干扰。</li>
</ul>
<p>方法流程例子：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260210092216713.png" alt="image.png" />
<strong>无效搜索？？</strong>
<strong>数据的大量涌入？？</strong>
<strong>这个搜索树，tall &amp; skinny?</strong></p>
<p>相比传统网页自动化或脚本依赖式方法，WebTactix 的创新在于：
✔️ 语义树结构 保留探索过程和事实摘要<br />
✔️ 并行智能规划 agent 加速任务探索<br />
✔️ 决策机制 提升选择质量和探索效率<br />
✔️ 任务可检查性与约束形式化 提高可控性<br />
✔️ 通用性强 适用于不同类型任务（登录、筛查、提取等）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260210092156398.png" alt="image.png" /></p>
<p><strong>Agent 本体很薄</strong>，主要做两件事：</p>
<ol>
<li>把“历史轨迹 + 当前观测 + 指令”交给一个 <strong>PromptConstructor</strong> 生成 prompt</li>
<li>调 LLM 拿到文本输出后，把它<strong>解析成可执行 Action</strong>（playwright 或 id-based）
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260210093141504.png" alt="image.png" /></li>
</ol>
<p><strong>Partially Done</strong></p>
<ul>
<li>把“已完成的步骤 + 已确认事实”压缩成更短的摘要</li>
<li>目的：减少长历史干扰、提升信息密度（否则上下文越走越长，LLM 更容易跑偏）</li>
</ul>
<p><strong>Data Extraction</strong></p>
<ul>
<li>需要时反复与页面交互，把结果整理成结构化输出</li>
<li>他们还提到“可选用 Python 做数据处理”，并把这段当成<strong>一次 action</strong>记录回树里</li>
</ul>
<h2>OAgent</h2>
<p><a href="https://github.com/codefuse-ai/Oagent/tree/main">https://github.com/codefuse-ai/Oagent/tree/main</a></p>
<ul>
<li>构建一个能够<strong>智能浏览网页、自动完成任务的代理（Agent）</strong>。</li>
<li>通过大模型结合浏览器自动化技术（如 Playwright），让 Agent 能够“看网页 → 分析 → 执行操作 → 得出结果”。</li>
<li>在 <strong>WebArena 这样的自动化任务评测环境</strong>中达到了 <strong>SOTA（State-of-the-Art，最先进）性能</strong>，在排行榜上取得高分。</li>
</ul>
<p>从 README 和代码结构看，它实现了一个多模块的智能 Agent 流程，大致包括以下部分：</p>
<ol>
<li><strong>Planner 计划模块</strong><br />
根据当前页面信息和任务目标，决定下一步做什么（比如「点击按钮」「填表」等）。</li>
<li><strong>Reflector 反思/反馈模块</strong><br />
分析上一步动作是否成功、是否完成了任务，给 Planner 提供反馈。</li>
<li><strong>Grounder 具体执行定位</strong><br />
是一个视觉语言模型（VLM），根据 Planner 的目标结合屏幕截图输出具体的坐标/操作参数。</li>
<li><strong>Action 执行层</strong><br />
使用 Playwright 等浏览器自动化库实际执行点击、输入、滚动等操作。</li>
<li><strong>Summary 结果总结</strong><br />
最终根据整个执行过程的历史生成最终结果。</li>
</ol>
<p>整个系统形成一个循环：<strong>观察 → 计划 → 定位 → 执行 → 反思 → 再计划</strong>，类似强化学习或智能体的闭环行为。</p>
<h3>核心特点</h3>
<ul>
<li><strong>自动化 Web 操作</strong>：不只是静态解析网页，还可以自动与页面交互。</li>
<li><strong>多角色模型组合</strong>：不同模型负责不同任务，如策略生成、视觉定位等。</li>
<li><strong>可用于 Benchmark 评测</strong>：在 WebArena 这类任务挑战中测试效果。</li>
<li><strong>基于 Agent 设计</strong>：以 Agent 闭环执行任务，而不是单一步骤调用模型。</li>
</ul>
<h3>典型应用场景</h3>
<ul>
<li>自动化完成购物网站流程（填单、搜索、下单等）。</li>
<li>自动测试网页 UI 或功能。</li>
<li>自动信息抓取与填写。</li>
<li>智能模拟用户行为以完成特定任务。
总结来说，这个 Oagent/OpAgent 框架是一个把大模型和浏览器自动化结合起来的智能 Web 操作系统，让 AI 能像人一样通过视觉（截图）观察网页并执行具体操作。</li>
</ul>
<p>玩策略卡牌游戏可以吗哈哈哈？
VLM这里似乎最重要啊
LLM的实验模型都好小</p>
<h2>ColorBrowserAgent: An Intelligent GUI Agent for Complex Long-Horizon Web Automation</h2>
<p><a href="https://github.com/MadeAgents/browser-agent.git">https://github.com/MadeAgents/browser-agent.git</a></p>
<p>长程（long-horizon）网页任务自动化的稳定性和跨站点异构性（site heterogeneity）处理
采用类似 <strong>agent + memory + human-in-the-loop</strong> 的架构来提高长期浏览任务的表现和适应性</p>
<p>🔹 传统自动化（Selenium、Playwright 脚本）通常是明确编写好命令，但 AI agent 能根据高层指令 <strong>智能规划下一步动作</strong>。<br />
🔹 “长程稳定性” 指 agent 在执行多步骤任务（例如购买流程、问答检索等）时不掉链子，而且对不同网站结构有更好适应性。<br />
🔹 加入<strong>人类反馈循环（Human-in-the-Loop）</strong> 提升处理异构站点的能力。</p>
<p>Collaborative Autonomy（协作式自治）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260210094438661.png" alt="image.png" /></p>
<p>1️⃣ 长任务不稳定（Long-Horizon Instability）</p>
<ul>
<li>真实网页任务往往要几十步
→ 本质：<strong>context window 不够 + 无长期记忆</strong></li>
</ul>
<p>2️⃣ 网站差异太大（Site Heterogeneity）</p>
<ul>
<li>每个网站逻辑都不一样</li>
<li>LLM 没“常识”
→ 不微调基本搞不定</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260210094458489.png" alt="image.png" /></p>
<p>每一步都调用一个 LLM：
<code>总结：现在做到哪了？</code></p>
<h2>WebArena</h2>
<p>WebArena is a standalone, self-hostable web environment for building autonomous agents. WebArena creates websites from four popular categories with functionality and data mimicking their real-world equivalents. To emulate human problem-solving, WebArena also embeds tools and knowledge resources as independent websites. WebArena introduces a benchmark on interpreting high-level realistic natural language command to concrete web-based interactions. We provide annotated programs designed to programmatically validate the functional correctness of each task.</p>
<p>一个用于<strong>训练和评估自动化智能体在真实网页环境中完成任务的模拟平台</strong>。</p>
