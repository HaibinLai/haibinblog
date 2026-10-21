---
title: "SIGCOMM07 How to read a paper"
description: "How to read a paper | ACM SIGCOMM Computer Communication Review 没想到真有这种神奇文章，讲怎么读文章。很好，我就用你的方法来读你的文章。 S. Keshav教授写了这篇paper分享了自己多年来阅读论文的经验——即 \"three-pass\"方法 。它的关键思想是拿到一篇paper不要直接开始从头读到尾，而是分三遍去阅读。每一遍都有明确的目标，是一个 循序渐进 的过程。 第…"
publishedAt: "2025-08-05T22:36:57Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["SIGCOMM"]
author: "GB"
draft: false
slug: "sigcomm07-how-to-read-a-paper"
legacySlug: "sigcomm07-how-to-read-a-paper"
oldSlugs: []
wordpressId: 926
sourceUrl: "https://www.haibinlaiblog.top/index.php/sigcomm07-how-to-read-a-paper/"
commentCount: 1
viewCount: 1405
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<p><a href="https://dl.acm.org/doi/abs/10.1145/1273445.1273458">How to read a paper | ACM SIGCOMM Computer Communication Review</a></p>
<p>没想到真有这种神奇文章，讲怎么读文章。很好，我就用你的方法来读你的文章。</p>
<p>S. Keshav教授写了这篇paper分享了自己多年来阅读论文的经验——即<strong>&quot;three-pass&quot;方法</strong>。它的关键思想是拿到一篇paper不要直接开始从头读到尾，而是分三遍去阅读。每一遍都有明确的目标，是一个<strong>循序渐进</strong>的过程。</p>
<p>第一遍（略读）要对paper有一个大致的了解；
第二遍（批判地读）要掌握paper的主要内容，可以忽略部分细节；
第三遍（复现式阅读）则要深入地理解全文。</p>
<p>体验：效果不错，我会把它纳入到我的学习体系中，并且我发现它刚好可以适配我的BFS-DFS理论体系。</p>
<h2>First Pass</h2>
<p>The first pass is a quick scan to get a bird’s-eye view of the paper. You can also decide whether you need to do any more passes. This pass should take about five to ten minutes and consists of the following steps</p>
<ol>
<li>Carefully read the title, abstract, and introduction </li>
<li>Read the section and sub-section headings, but ignore everything else </li>
<li>Read the conclusions</li>
<li>Glance over the references, mentally ticking off the ones you’ve already read </li>
</ol>
<p>At the end of the first pass, you should be able to answer the five Cs: </p>
<ol>
<li>Category: What type of paper is this? A measure ment paper? An analysis of an existing system? A description of a research prototype? </li>
<li>Context: Which other papers is it related to? Which theoretical bases were used to analyze the problem? </li>
<li>Correctness: Do the assumptions appear to be valid? </li>
<li>Contributions: What are the paper’s main contribu tions? </li>
<li>Clarity: Is the paper well written?</li>
</ol>
<p>Using this information, you may choose not to read fur ther. This could be because the paper doesn’t interest you, or you don’t know enough about the area to understand the paper, or that the authors make invalid assumptions. The first pass is adequate for papers that aren’t in your research area, but may someday prove relevant. <strong>Incidentally, when you write a paper, you can expect most reviewers (and readers) to make only one pass over it</strong>. Take care to choose coherent section and sub-section titles and to write concise and comprehensive abstracts. <strong>If a reviewer cannot understand the gist after one pass, the paper will likely be rejected; if a reader cannot understand the high lights of the paper after five minutes, the paper will likely never be read.</strong></p>
<h2>Second Pass</h2>
<ol>
<li>Look carefully at the figures, diagrams and other illus trations in the paper. Pay special attention to graphs. Are the axes properly labeled? Are results shown with error bars, so that conclusions are statistically sig nificant? Common mistakes like these will separate rushed, shoddy work from the truly excellent.</li>
<li>Remember to mark relevant unread references for fur ther reading (this is a good way to learn more about the background of the paper).</li>
</ol>
<p>The second pass should take up to an hour. After this pass, you should be able to grasp the content of the paper. You should be able to summarize the main thrust of the pa per, with supporting evidence, to someone else. This level of detail is appropriate for a paper in which you are interested, but does not lie in your research speciality.</p>
<p><strong>Sometimes you won’t understand a paper even at the end of the second pass.</strong> This may be because the subject matter is new to you, with unfamiliar terminology and acronyms. Or the authors may use a proof or experimental technique that you don’t understand, so that the bulk of the pa per is incomprehensible. The paper may be poorly written with unsubstantiated assertions and numerous forward ref erences. Or it could just be that it’s late at night and you’re tired. You can now choose to: (a) set the paper aside, hoping you don’t need to understand the material to be successful in your career, (b) return to the paper later, perhaps after reading background material or (c) persevere and go on to the third pass.</p>
<h2>Third Pass</h2>
<p>To fully understand a paper, particularly if you are re viewer, requires a third pass. The key to the third pass is to attempt to virtually re-implement the paper: that is, making the same assumptions as the authors, re-create the work. By comparing this re-creation with the actual paper, you can easily identify not only a paper’s innovations, but also its hidden failings and assumptions. </p>
<p>This pass requires great attention to detail. You should identify and challenge every assumption in every statement. Moreover, you should think about how you yourself would present a particular idea. This comparison of the actual with the virtual lends a sharp insight into the proof and presentation techniques in the paper and you can very likely add this to your repertoire of tools. During this pass, you should also jot down ideas for future work. </p>
<p><strong>This pass can take about four or five hours for beginners, and about an hour for an experienced reader.</strong> At the end of this pass, you should be able to reconstruct the entire structure of the paper from memory, as well as be able to identify its strong and weak points. In particular, you should be able to pinpoint implicit assumptions, missing citations to relevant work, and potential issues with experimental or analytical techniques.</p>
<h2>经验</h2>
<p>关于如何做survey，目前由于很多工作都有blog，有各种工作，我认为当时他的经验有点局限了（看google scholar等等），一方面工作很多，同时我们时间不够。</p>
<p>我认为还是以学习基本知识+学习前置paper+看talk为主。</p>
<p>I’ve used this approach for the last 15 years to read con ference proceedings, write reviews, do background research, and to quickly review papers before a discussion. This dis ciplined approach prevents me from drowning in the details before getting a bird’s-eye-view. It allows me to estimate the amount of time required to review a set of papers. <strong>More over, I can adjust the depth of paper evaluation depending on my needs and how much time I have.</strong></p>
<h2>如何写一篇system的review？</h2>
<p><a href="https://people.inf.ethz.ch/troscoe/pubs/review-writing.pdf">review-writing.pdf</a></p>
<p>These notes arose from a conversation with Rebecca Isaacs about how to review papers. She asked me to write some notes that the 2007 SOSP Shadow Program Committee might find helpful. </p>
<p>It is a bit presumptuous to claim to know how to write a good review for a systems con ference. In particular, I'm inherently unqualified to say whether I write good reviews or not, other than that I continue to be asked to be on the occasional PC. I think I write better reviews now than I did when I was younger and less experienced, and some of the mistakes I've tried to avoid in recent years are tackled here. </p>
<p>Consequently, these notes should be read as, firstly, a description of how I aspire to write reviews, and secondly, as a discussion of the kind of review I would like to receive from a PC. Although they're written in an imperative style, they're not intended to be prescriptive.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250805163249011.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250805163257700.png" alt="" /></p>
<ol start="6">
<li>Add a new layer: 高效调度引擎，这样不回python</li>
<li>一次性跑2个token：问题多多，mem开销</li>
<li>只launch 一次cuda graph，能不能复用</li>
<li>Overlap 900us launch?</li>
</ol>
<p>.</p>
