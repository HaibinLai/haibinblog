---
title: "System Research 研究周期"
description: "我们把我们的研究分为了6个周期 节点1：规划 规划project task，建立对该领域的视野 思考目前sota的方向还没有完成的地方 列出可能的project task，针对每个task的竞争程度和发展程度，制定符合个人能力的project task 视野 研究领域：GPM、SM在并行计算、GPU计算中的应用。 静态图sota G2Miner/Mercury 他们很好的用GPU解决的GPU并行来处理静态图的GPM算法 动态图/Con…"
publishedAt: "2025-05-16 14:26:57"
updatedAt: "2025-06-12 06:24:17"
category: "Computer Science"
tags: ["CS", "Research"]
draft: false
slug: "system-research"
legacySlug: "system-research"
wordpressId: 771
sourceUrl: "https://www.haibinlaiblog.top/index.php/system-research/"
commentCount: 0
importedFromWordPress: true
---
<p>我们把我们的研究分为了6个周期</p>
<h2>节点1：规划</h2>
<p>规划project task，建立对该领域的视野
思考目前sota的方向还没有完成的地方
列出可能的project task，针对每个task的竞争程度和发展程度，制定符合个人能力的project task</p>
<h3>视野</h3>
<p>研究领域：GPM、SM在并行计算、GPU计算中的应用。</p>
<p>静态图sota G2Miner/Mercury
他们很好的用GPU解决的GPU并行来处理静态图的GPM算法</p>
<p>动态图/Continuous sota：RapidFlow
他们很好地解决了CSM的问题，将一个数据图转换为无向图，在更新中直接输出新的结果</p>
<h3>思考问题：</h3>
<p>目前来说，LJ等数据集虽然已经达到了千万级别的数据量，但是真实的数据量可能比这个更大。比如蚂蚁的大图数据，有1亿节点，千亿条边，每天人会平均支付3次支付宝，每天更新可能有3亿。那么，在这样的数据量下，可能搜索的时间就会出现一个比较大的问题。这个是可能的真实场景。 从这个角度来看，这些CSM算法就更像是玩具，无法解决这种动态的问题。</p>
<p>然而以往的分布式多节点的系统，更像是直接搜索，而不是在数据结构上进行改进。像Tesseract 这种的，他们虽然做的不错，并行成功，但是其实效果不咋地。</p>
<p>所以，我们目前的发展空间，就是在更大这样的数据量下，查看我们的算法的程度。</p>
<h4>其他工作</h4>
<p>选择符合个人能力的project task</p>
<p>他人用时：1周
我的用时：2月（6月了解科研、paper，9月了解基础知识，如流式系统、数据挖掘、分布式计算）
8月在摆烂</p>
<h2>节点2：明确 failure case</h2>
<p>在新的数据下，跑目前的大数据集
发现failure case</p>
<p>发现一个任务的Technical challenge，回答下面的问题：</p>
<ol>
<li>这个任务的setting有什么特别之处？</li>
<li>这个任务的输入数据有什么特别之处</li>
<li>这个任务的输出有什么特别之处
这可能是希望我们用第一性原理来解答问题，那我想再加一步</li>
<li>这个任务以往的流程，最好的algorithm，跟我们想象的有什么特别之处？</li>
</ol>
<p>setting:
每来一个数据，就要更新，然后更新结果
输入：stream，神奇的流式数据。（有写数据能不能变成batch？
输出：结果
pipeline：在更新中直接输出结果</p>
<p>问题：为什么没有实现并行？
以往看到的CSM好像没有人做这件事情？
是不是这些数据结构都没有实现并行？</p>
<p>他人用时：两周
我们的用时：45天（1个半月）
10月在干的事情：在讨论、摸索进程，在尝试节点3。但是其实这里是很多时候在构想，以及是在给蚂蚁那边谈合作。</p>
<h2>节点3：基于第一型原理的设计解决</h2>
<ol>
<li>分析sota 不work的核心技术原因，技术难点。</li>
<li>列出所有的与该技术难点相关的，可能可以解决该难点的technique（brainstorm）</li>
<li>每天组合不同的pipelines</li>
<li>讨论、讨论、讨论</li>
<li>等待一个最好的pipeline</li>
</ol>
<p>目前已经有了想法，就是在并行情况下实现。
但是还没有想好pipeline怎么实现，我们的并行其实线程数是不足的，但是目前我们的想法是这样
这个pipeline目前肯定是有问题的，但是应该是可以解决的</p>
<h3>GPU</h3>
<p>老三样：load balance，memory，NP hard
老方法：warp centric         DFS        pruning</p>
<p>GPU、多线程方面
warp centric, scheduling，load balance
细粒度线程分配，线程散度--
Hash table，efficiency加速
SIMD，efficiency加速
hybrid search， mem save
two level parallelism两阶段并行，防数据冲突，线程散度--</p>
<p>算法方面
symmetric breaking
pruning</p>
<p>内存方面
多级缓存
DFS搜索
edgellist reduction等压缩
CSR</p>
<p>CSM算法上
辅助数据结构
基于更新的查询</p>
<p>数据结构上
GPMA、Hornet</p>
<p>别人用时：2周
我们的用时：大约10月可能是在做这部分的工作，汇集之前的idea</p>
<h2>节点4：设计验证性实验，初步验证Technical idea，并改进</h2>
<p>SGD Process</p>
<ol>
<li>想出一个idea</li>
<li>通过文献阅读，讨论，提升一个idea</li>
<li>实现idea</li>
<li>设计探索性实验，验证idea</li>
<li>分析实验结果，得到gradient，idea++</li>
</ol>
<p><strong>目前正在实现idea</strong></p>
<h3>目前我们在这里 We are here!</h3>
<p>2024/12/16</p>
<p>别人用时：2个月
我们的目标工作：
将Rapid Flow改成并行
将并行程序改成GPU
将算法从子图匹配拓展到GPM</p>
<h2>节点5： what's your sweet point? Pruning!</h2>
<ol>
<li>论文的demo和application</li>
<li>使用SGD提升idea，将demo、application效果做好</li>
</ol>
<p>别人用时1个月</p>
<h2>节点6： 论文，投稿</h2>
<ol>
<li>story, introduction</li>
<li>baseline methods, ablation studies，确定最优方法版本</li>
<li>pipeline图</li>
<li>写我们的system的method，同时做实验</li>
<li>实验后写论文experiment环节</li>
<li>related work</li>
<li>Review，改intro，method，experiment</li>
<li>abstract，取名字</li>
<li>反复改写</li>
</ol>
<p>别人用时：45天</p>
