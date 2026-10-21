---
title: "MoonshotAI: Sharing for VibeCoding Examples and Debug Techniques"
description: "Vibe coding Meetup北京场｜VibeCoding案例和Debug技巧 https://www.douyin.com/video/7543627062267923747 这个视频记录了月之暗面Kimi对vibe coding的分享。 软件工程： 没有银弹 -> AI? 现在AI可以跑几十分钟，处理大量的数据+代码 windsurf 收购 Claude Code | Cursor | Windsurf | Copilot…"
publishedAt: "2025-12-04 04:43:44"
updatedAt: "2025-12-12 17:31:45"
category: "Academic"
tags: []
draft: false
slug: "sharing-for-vibecoding"
legacySlug: "sharing-for-vibecoding"
wordpressId: 1083
sourceUrl: "https://www.haibinlaiblog.top/index.php/sharing-for-vibecoding/"
commentCount: 0
importedFromWordPress: true
---
<h2>Vibe coding</h2>
<p>Meetup北京场｜VibeCoding案例和Debug技巧
<a href="https://www.douyin.com/video/7543627062267923747">https://www.douyin.com/video/7543627062267923747</a></p>
<p>这个视频记录了月之暗面Kimi对vibe coding的分享。</p>
<p>软件工程：
没有银弹 -&gt; AI?
现在AI可以跑几十分钟，处理大量的数据+代码</p>
<p>windsurf 收购
Claude Code | Cursor | Windsurf | Copilot</p>
<p>google甚至已经开始考察vibe coding的技巧</p>
<p>报告：目前的使用AI的程序员，目前使用了更长的时间：拿去摸鱼，吐token
Fun：二次元手游抽卡，抽正确的</p>
<h3>vibe coding 例子</h3>
<p>面向海外的AI产品的推广（AI）
公司里都没有工程师：直接就是用AI去做产品
记者：搞一个算法的问题（说明Yan Gu要失业了）
产品经理：用AI参与，减少摩擦（言语不对、语气）
brainstorm
win95 全部AI生成</p>
<h2>Context Caching 存储</h2>
<p>将文本存储，方便我们后续的计算，
对输出不是很长的场景很重要
Mooncake，大模型缓存的技术</p>
<h3>RAG 压缩和剪枝</h3>
<p>标准化的RAG SDK，可以把很多数据汇总给我们的模型
生成的代码没有可维护性，但是如果接偶了，AI又不懂了
这个是这几个月AI的情况（太nb了）</p>
<p>Claude markdown，当前工程是什么样的状态，压缩工程
Post，知识库，书籍、喂给模型 RAG技术
从这点上看，只要LLM还是会出现遗忘和非线形注意力，基本上RAG还是很重要的（当然其实我猜线形注意力，也可能会出现一些问题）</p>
<p>模型要读取更大量的信息，然后产生跟准确的事情</p>
<h2>multi agent</h2>
<p>复杂的场景其实适合多人开会去解决</p>
<p>同时并行是一种很重要的事情</p>
<p>十几个AI做费马大定理的证明：几十个引理的DAG的证明</p>
<p>多智能体的工厂</p>
<h2>Prompt 结构化</h2>
<p>将output输出为json format可以提升
此时现在已经可以作为json mode
可以link / 标准化</p>
