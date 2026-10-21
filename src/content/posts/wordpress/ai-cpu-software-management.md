---
title: "AI与项目复杂度"
description: "5月份我曾经让Claude Opus 4.7自己做一个CPU。在当时我以为做一个5级流水线CPU是它的极限，没想到Opus在3轮对话下就完成了RV32I 5级流水线的实现和测试，完美完成了大二的计组project。 于是我就让它在后台慢慢跑了200轮交互，并且分析了它的日志。Opus先后完成了更多级的流水线、多发射、乱序执行、分支预测、多级缓存。我按照每个turn里agent做的主要工作，将turn分为了 代码实现impl，plan…"
publishedAt: "2026-07-21 18:05:24"
updatedAt: "2026-07-21 18:18:26"
category: "fragments"
tags: ["CPU"]
draft: false
slug: "ai-cpu-software-management"
legacySlug: "ai-cpu-software-management"
wordpressId: 1505
sourceUrl: "https://www.haibinlaiblog.top/index.php/ai-cpu-software-management/"
commentCount: 0
importedFromWordPress: true
---
<p>5月份我曾经让Claude Opus 4.7自己做一个CPU。在当时我以为做一个5级流水线CPU是它的极限，没想到Opus在3轮对话下就完成了RV32I 5级流水线的实现和测试，完美完成了大二的计组project。</p>
<p>于是我就让它在后台慢慢跑了200轮交互，并且分析了它的日志。Opus先后完成了更多级的流水线、多发射、乱序执行、分支预测、多级缓存。我按照每个turn里agent做的主要工作，将turn分为了 代码实现impl，plan design，测试validation等多个类型。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260721180231543.png" alt="23532b145478e1e40675f3399f16890b.png|400" /></p>
<p>从图中可以看到，对于简单或者可以单独进行模块测试的设计，比如开始的5级流水，TAGE，cache，agent基本只要impl coding并进行test就行了。对于复杂或者影响全局的work比如OoO，agent需要更多时间做plan、debug和integration。随着系统越来越复杂，Agent 在代码实现的turn次数增加，每次真正修改的代码却越来越少，设计、调试和集成上的时间也增加了。</p>
<p>AI 可以提升写代码的效率，但永远不能消除软件工程的系统复杂度。在上学期的软件工程课里，很多同学都说，自己的codex和cc可以轻松完成一整个project，根本不需要人的任何管理。我好奇，课程项目里的网站，是属于“5级流水线”，还是“乱序执行”？</p>
<p>对于简单的toy project，AI可以一次性生成，并且会越来越强。但是对于复杂的project，软件工程里保持项目可理解、可验证和可维护，依旧是重要的话题。这部分内容最近AI也在学习，AI的项目管理也在增强，驱动自己写出更好的代码。</p>
<p>项目代码： <a href="https://github.com/HaibinLai/simple-CPU.git">https://github.com/HaibinLai/simple-CPU.git</a></p>
