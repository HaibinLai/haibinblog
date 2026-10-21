---
title: "为什么Rust cargo在release模式会比debug模式快很多？"
description: "为什么Rust cargo在release模式会比debug模式快很多？ gpt给了一个笼统的答案，我们用矩阵乘法的例子来看看这里边的差异： debug模式中会有precondition check（图2）对程序可能的错误进行检测，这占据了其大部分运行时间，而图3 release模式下没有检查，方法栈也更少。 release模式会使用SIMD，相比图4 debug模式，图5 release模式用了intel SSE指令集中的mmx寄存…"
publishedAt: "2024-09-22T08:15:39Z"
updatedAt: "2024-12-01T11:57:58Z"
category: "OS"
categories: ["OS"]
tags: ["Rust"]
author: "GB"
draft: false
slug: "为什么rust-cargo在release模式会比debug模式快很多"
legacySlug: "为什么rust-cargo在release模式会比debug模式快很多？"
oldSlugs: []
wordpressId: 356
sourceUrl: "https://www.haibinlaiblog.top/index.php/%e4%b8%ba%e4%bb%80%e4%b9%88rust-cargo%e5%9c%a8release%e6%a8%a1%e5%bc%8f%e4%bc%9a%e6%af%94debug%e6%a8%a1%e5%bc%8f%e5%bf%ab%e5%be%88%e5%a4%9a%ef%bc%9f/"
commentCount: 0
viewCount: 840
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2024/09/IMG_6808.jpg"
importedFromWordPress: true
---
<p>为什么Rust cargo在release模式会比debug模式快很多？</p>
<p>gpt给了一个笼统的答案，我们用矩阵乘法的例子来看看这里边的差异：
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/d81120987166e1c7c6a82568bbf01365.jpg" alt="d81120987166e1c7c6a82568bbf01365.jpg" /></p>
<ol>
<li>
<p>debug模式中会有precondition check（图2）对程序可能的错误进行检测，这占据了其大部分运行时间，而图3 release模式下没有检查，方法栈也更少。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/9833001801fef0e96db9026634d06702.jpg" alt="9833001801fef0e96db9026634d06702.jpg" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/1d50cedd20ae270b039d8888f9956136.jpg" alt="1d50cedd20ae270b039d8888f9956136.jpg" /></p>
</li>
<li>
<p>release模式会使用SIMD，相比图4 debug模式，图5 release模式用了intel SSE指令集中的mmx寄存器。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/148fcf536a6c36f725e00b83099df487.jpg" alt="148fcf536a6c36f725e00b83099df487.jpg" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/79cf43362331591d829763ed1c6a1e91.jpg" alt="79cf43362331591d829763ed1c6a1e91.jpg" /></p>
</li>
<li>
<p>实际执行指令更少，图5 release模式循环内指令数比图4 release更少。同时debug模式运行9.6s，CPI 0.289，3GHz速度（图6），指令数为 9.6<em>3g/0.289，图7 release模式指令数0.3</em>2.2g/0.331，指令数更少，这里有condition check和循环优化的多重功劳。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/531a7d4a5291c1c185ff0d9a6a2a3d3f.jpg" alt="531a7d4a5291c1c185ff0d9a6a2a3d3f.jpg" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/38337aea3b3ccce940bbeb282d2fb49c.jpg" alt="38337aea3b3ccce940bbeb282d2fb49c.jpg" /></p>
</li>
</ol>
<p>不过，release模式的rust在运行时间上仍与O3优化后的C程序有差距。Rust的一个劣势在于，在运行过程中调用了一些syscall（图8黄条部分），而C程序除了在linux程序初始化下有与系统交互的libc_start_main函数，其他情况下均在用户态上执行（图9）。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/9f51cdd34ede5076dc72978593cd64c7.jpg" alt="9f51cdd34ede5076dc72978593cd64c7.jpg" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/c1b7cedfb2b44cb28e488745f716b5b5.jpg" alt="c1b7cedfb2b44cb28e488745f716b5b5.jpg" /></p>
