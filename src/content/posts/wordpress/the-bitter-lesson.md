---
title: "The bitter lesson"
description: "https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf Most AI research has been conducted as if the computation available to the agent were constant (in which case leveraging human knowledge would be one of t…"
publishedAt: "2026-10-06T00:51:48Z"
updatedAt: "2026-10-06T00:52:59Z"
category: "fragments"
categories: ["fragments"]
tags: ["AI", "GPU", "Hardware"]
author: "GB"
draft: false
slug: "the-bitter-lesson"
legacySlug: "the-bitter-lesson"
oldSlugs: []
wordpressId: 1692
sourceUrl: "https://www.haibinlaiblog.top/index.php/the-bitter-lesson/"
commentCount: 0
viewCount: 96
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<p><a href="https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf">https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf</a></p>
<p>Most AI research has been conducted as if the computation available to the agent were constant (in which case leveraging human knowledge would be one of the only ways to improve performance) but, over a slightly longer time than a typical research project, massively more computation inevitably becomes available.</p>
<p>很多 AI 研究默认“算力是固定的”，但从更长时间尺度看，算力其实一直在快速增长（比如摩尔定律和GPU）。这个错误的默认前提，会让研究者偏向错误的研究方向。</p>
<p>比如说国际象棋。我们曾经加了很多人类的思考。但是最后，深蓝依靠的是大规模搜索战胜的人类。</p>
<p>Also important was the use of learning by self play to learn a value function (as it was in many other games and even in chess, although learning did not play a big role in the 1997 program that first beat a world champion). Learning by self play, and learning in general, is like search in that it enables massive computation to be brought to bear. Search and learning are the two most important classes of techniques for utilizing massive amounts of computation in AI research. In computer Go, as in computer chess, researchers' initial effort was directed towards utilizing human understanding (so that less search was needed) and only much later was much greater success had by embracing search and learning.</p>
<p>Sutton 举围棋的例子。围棋的自我学习其实也类似一种搜索（Learning by self play, and learning in general, is like search in that it enables massive computation to be brought to bear.）</p>
<p>In computer vision, there has been a similar pattern. Early methods conceived of vision as searching for edges, or generalized cylinders, or in terms of SIFT features. But today all this is discarded. Modern deep-learning neural networks use only the notions of convolution and certain kinds of invariances, and perform much better.</p>
<hr />
<p>We have to learn the bitter lesson that building in how we think we think does not work in the long run. </p>
<p>The bitter lesson is based on the historical observations that
1) AI researchers have often tried to build knowledge into their agents,
2) this always helps in the short term, and is personally satisfying to the researcher, but
3) in the long run it plateaus and even inhibits further progress, and
4) <strong>breakthrough progress eventually arrives by an opposing approach based on scaling computation by search and learning.</strong> The eventual success is tinged with bitterness, and often incompletely digested, because it is success over a favored, human-centric approach.</p>
<p>One thing that should be learned from the bitter lesson is the great power of general purpose methods, of methods that continue to scale with increased computation even as the available computation becomes very great. <strong>The two methods that seem to scale arbitrarily in this way are search and learning</strong></p>
<p>可以和之前的the hardware lottery联想起来。有了更强的硬件，才能有更强更快的智能。那问题是，如果硬件和系统增长放缓，我们的智能会放缓吗？</p>
<p>工业界在做的东西，其实比学术界又快又好。把他们弄成large scale，把他们弄在新硬件上。把他们弄出新机制。</p>
<p>想做什么就做什么！
GTASA，但是其实我生活中也没怎么出去探索过
我觉得人们会开始欣赏和思考，人是怎么样的。人文注意会重新来的。到底什么是人。人其实是复杂的。这是我的一生和我的phd，它不是由GPT-Astra生成。因为生活就是生活，它由苦难，巧克力，旅行和思念组成。</p>
<p>机器正在成为思考的主力，智能正在成为一种规模化的商品。<a href="https://mp.weixin.qq.com/s/Y5Nkt0CIyTzivPDOa15bew">https://mp.weixin.qq.com/s/Y5Nkt0CIyTzivPDOa15bew</a></p>
<p>什么是无用的话，就是他讲了后你自己没有思考的话。</p>
