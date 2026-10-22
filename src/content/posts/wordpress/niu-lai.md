---
title: "牛来"
description: "目前我认为三个Agent和人类最后的困难：long context，持续学习，稀缺数据点。 爱上问题，而不是爱上方法。 做一个MVP。 金字塔的叙事。 https://www.normaltech.ai/p/what-will-be-left-for-us-to-work 原来是 LLM 生成文本啊，不知道的还以为是把输入剁成一堆拿大量文本统计出的最常见字符串组合的词元，高频组合各占一个词元而生僻词拆成更小的子词元，查询一张几万行的大…"
publishedAt: "2026-08-31T15:44:23Z"
category: "fragments"
categories: ["fragments"]
tags: ["AI"]
author: "GB"
draft: false
slug: "niu-lai"
legacySlug: "niu-lai"
oldSlugs: []
wordpressId: 1653
sourceUrl: "https://www.haibinlaiblog.top/index.php/niu-lai/"
commentCount: 0
viewCount: 230
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-08/niu-lai.webp"
---
<p>目前我认为三个Agent和人类最后的困难：long context，持续学习，稀缺数据点。</p>
<p>爱上问题，而不是爱上方法。
做一个MVP。
金字塔的叙事。</p>
<p><a href="https://www.normaltech.ai/p/what-will-be-left-for-us-to-work">https://www.normaltech.ai/p/what-will-be-left-for-us-to-work</a></p>
<p>原来是 LLM 生成文本啊，不知道的还以为是把输入剁成一堆拿大量文本统计出的最常见字符串组合的词元，高频组合各占一个词元而生僻词拆成更小的子词元，查询一张几万行的大对照表把每个词元换成几千维的数字串每一层除以各元素的均方根，下面把每串数字各与三个不同的矩阵相乘变出 QKV 三个值，在 Q 和 K 上按各自的位置乘一个旋转矩阵把位置信息融合进去，所有的位置用 Q、K 两两点积再除以根号 d_k 把数值压回正常量级，算完先把当前位置后面的未来词元全部用负无穷遮住，再用 softmax 把分数归一化按权重把 V 加权混合成新的数字串，并行跑好几个头再横向拼在一起，再乘一个 W_O 输出投影矩阵线性变换，把结果通过残差加回原来的数字串，省得十几层下来原始信息洗没梯度也传不回去。再过一遍 RMSNorm，扔进一个先把维度扩到约八除以三倍再缩回来的两层矩阵变换里，中间把输入拆两路一路过 SiLu 激活一路不过逐元素相乘，再把结果加回去。这个流程叠几十次，乘一个把几千维压成词表大小的矩阵，过一遍 softmax 变成概率分布，拿温度决定分布宽窄，再或者只保留分数前 k 个，把后面直接归零，或者搞核采样从高到低累加，超过阈值 p 就砍掉后面，只留核心。然后，按这个分布随机选择一个词元，选完把它接到输入后面接着跑下一轮，每层每个注意力头把之前所有步骤的 KV 都留在显存里。新词元算自己一行 Q 跟存好的 K 点积，全程一直循环直到选到那个 eos 的特殊词元，把每次选择的词元拼到一起组合成为最终输出文本呢。</p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260831234331377.png" alt="8a3dbd918d3467327e04ffdd17a43f6a.jpg" /></p>
<p><img src="https://haibinblog.s3.us-east-1.amazonaws.com/%7Byear%7D/%7Bmonth%7D/%7BfullName%7D/20260831234302122.png" alt="77b3ea08c3b1107849fa53e247e24549.jpg" /></p>
