---
title: "Distributed System 2: Time"
description: "不同的机器需要同步 分布式实时操作系统研究的是 如何在分布式多节点环境中，提供确定性调度、时间同步、实时通信与容错机制，从而保证关键任务的 deadline 被满足 。它既是操作系统的研究热点，也与工业控制、车联网、航空航天等应用紧密相关。 下面的图片是： 分布式系统需要同步 同步非常困难 我们是无法完全同步的，只能尽力同步 网络时间协议： Cristian's algorithm 我们很不幸，是无法给每个设备装GPS的 GPS贵 G…"
publishedAt: "2025-09-17 11:23:32"
updatedAt: "2025-10-11 10:01:40"
category: "Distributed Systems"
tags: ["time"]
draft: false
slug: "distributed-system-time"
legacySlug: "distributed-system-time"
wordpressId: 983
sourceUrl: "https://haibin-blog.vercel.app/index.php/distributed-system-time/"
commentCount: 0
importedFromWordPress: true
---
<p>不同的机器需要同步</p>
<p>分布式实时操作系统研究的是 <strong>如何在分布式多节点环境中，提供确定性调度、时间同步、实时通信与容错机制，从而保证关键任务的 deadline 被满足</strong>。它既是操作系统的研究热点，也与工业控制、车联网、航空航天等应用紧密相关。</p>
<p>下面的图片是：</p>
<ol>
<li>分布式系统需要同步</li>
<li>同步非常困难
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917084359990.png" alt="" />
我们是无法完全同步的，只能尽力同步</li>
</ol>
<h2>网络时间协议： Cristian's algorithm</h2>
<p>我们很不幸，是无法给每个设备装GPS的</p>
<ol>
<li>GPS贵</li>
<li>GPS在室内还是做不了</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917084723438.png" alt="" /></p>
<h2>idea: 用一个服务器来同步</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917084938992.png" alt="" /></p>
<p>idea是收集：</p>
<ol>
<li>客户端发出请求的时间</li>
<li>服务器接受请求的时间</li>
<li>服务器发送请求的时间</li>
<li>客户端接受请求的时间</li>
</ol>
<p>然后估算真实时间是：</p>
<p>$T = T3 + 0.5\delta$</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917090309282.png" alt="" /></p>
<p>不同的时间延迟，每32678震动/32670次震动计数为1秒，都会有问题</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917090432437.png" alt="" /></p>
<h2>分布式系统：我们只区分顺序，不记录时延 Logical Time: Lamport clocks</h2>
<p>两个人交钱，然后会搞错</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091051577.png" alt="" /></p>
<h3>RFC 677 “The Maintenance of Duplicate Databases” (1975)</h3>
<p>“To the extent that the communication paths can be made reliable, and the clocks used by the processes kept close to synchrony, the probability of seemingly strange behavior can be made very small. <strong>However, the distributed nature of the system dictates that this probability can never be zero.</strong>”</p>
<h3>Lamport 只要逻辑意义时间</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091228289.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091500334.png" alt="" /></p>
<h3>并发顺序</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091556306.png" alt="" /></p>
<p>给每一个机器设置为一个Lamport 时钟
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091809507.png" alt="" /></p>
<p>如果新的数据来了，就更新
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917091838869.png" alt="" /></p>
<p>那A和D怎么办呢？
我们的解决办法是手动定义一个偏序关系，要么是C(a) &lt; C(b)，要么是两者相等时，线程数小的优先发生
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917092039771.png" alt="" /></p>
<h2>逻辑时间example</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917092451823.png" alt="" /></p>
<p>注意：这里 a，b的真实时间跟Lamport时间没什么太大关系了</p>
<ol>
<li>C(a) &lt; C(b) 不能推导出 a -&gt; b （哪怕Lamport time在后边，也不能推断）</li>
<li>但是，if C(a) &lt; C(b) then b -&gt; a 是不可能的，只能是 a -&gt;b 或者 a||b</li>
<li>如果a||b，我们什么都不知道</li>
</ol>
<p>Lamport Clock是不能推断因果关系</p>
<p>Lamport 可以让事件遵循一个顺序</p>
<h3>修正</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917094138160.png" alt="" /></p>
<p>我们必须要等$事件执行完成后，在ack后再发回%符号
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917094241955.png" alt="" /></p>
<p>我们保证了：事件执行的一致性！
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917094652711.png" alt="" /></p>
<h2>Vector Clock</h2>
<p>我们可以发现 Lamport 逻辑时钟算法中每个进程只拥有自己的本地时间，没有其他进程的时间，导致无法描述事件的因果关系。如果每个进程都能够知道其他所有进程的时间，是否就能够得到事件的因果关系了呢？为此，有人提出了向量时钟算法，在 Lamport 逻辑时钟的基础上进行了改良，提出了一种在分布式系统中描述事件因果关系的算法。</p>
<p>可能有人会有疑问：向量时钟到底有什么用呢？举一个常见的工程应用：数据冲突检测。分布式系统中数据一般存在多个副本，多个副本可能被同时更新，这会引起副本间数据不一致，此时冲突检测就非常重要。<strong>基于向量时钟我们可以获得任意两个事件的顺序关系，结果要么是有因果关系（先后顺序），要么是没有因果关系（同时发生）。</strong>通过向量时钟，我们能够识别到如果两个数据更新操作是同时发生的关系，那么说明出现了数据冲突。后面我们会详细说明相关的实现。</p>
<p><a href="https://zhuanlan.zhihu.com/p/56886156">(1 条消息) 分布式系统：向量时钟 - 知乎</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250917095209093.png" alt="" /></p>
