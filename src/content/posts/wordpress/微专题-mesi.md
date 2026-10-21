---
title: "微专题：MESI"
description: "全知乎最详细的并发研究之CPU缓存一致性协议(MESI)有这一篇就够了！ - 知乎 多核CPU多级缓存一致性协议MESI 多核CPU的情况下有多个一级缓存，如何保证缓存内部数据的一致,不让系统数据混乱。这里就引出了一个一致性的协议MESI。 MESI协议 缓存状态 MESI 是指4中状态的首字母。每个Cache line有4个状态，可用2个bit表示，它们分别是： 缓存行（Cache line）:缓存存储数据的单元。 状态 描述 监听…"
publishedAt: "2025-05-22 07:00:05"
updatedAt: "2025-05-22 07:07:21"
category: "Micro Topics"
tags: []
draft: false
slug: "微专题-mesi"
legacySlug: "微专题：mesi"
wordpressId: 800
sourceUrl: "https://haibin-blog.vercel.app/index.php/%e5%be%ae%e4%b8%93%e9%a2%98%ef%bc%9amesi/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="https://zhuanlan.zhihu.com/p/467782159">全知乎最详细的并发研究之CPU缓存一致性协议(MESI)有这一篇就够了！ - 知乎</a></p>
<h2>多核CPU多级缓存一致性协议MESI</h2>
<ul>
<li>多核CPU的情况下有多个一级缓存，如何保证缓存内部数据的一致,不让系统数据混乱。这里就引出了一个一致性的协议MESI。</li>
</ul>
<h3><a href="https://zhida.zhihu.com/search?content_id=192082418&amp;content_type=Article&amp;match_order=1&amp;q=MESI%E5%8D%8F%E8%AE%AE&amp;zhida_source=entity">MESI协议</a>缓存状态</h3>
<ul>
<li>MESI 是指4中状态的首字母。每个Cache line有4个状态，可用2个bit表示，它们分别是：</li>
</ul>
<blockquote>
<p>缓存行（Cache line）:缓存存储数据的单元。</p>
</blockquote>
<table>
<thead>
<tr>
<th>状态</th>
<th>描述</th>
<th>监听任务</th>
</tr>
</thead>
<tbody>
<tr>
<td>M 修改 (Modified)</td>
<td>该Cache line有效，数据被修改了，和内存中的数据不一致，数据只存在于本Cache中。</td>
<td>缓存行必须时刻监听所有试图读该缓存行相对就主存的操作，这种操作必须在缓存将该缓存行写回主存并将状态变成S（共享）状态之前被延迟执行。</td>
</tr>
<tr>
<td>E 独享、互斥 (Exclusive)</td>
<td>该Cache line有效，数据和内存中的数据一致，数据只存在于本Cache中。</td>
<td>缓存行也必须监听其它缓存读主存中该缓存行的操作，一旦有这种操作，该缓存行需要变成S（共享）状态。</td>
</tr>
<tr>
<td>S 共享 (Shared)</td>
<td>该Cache line有效，数据和内存中的数据一致，数据存在于很多Cache中。</td>
<td>缓存行也必须监听其它缓存使该缓存行无效或者独享该缓存行的请求，并将该缓存行变成无效（Invalid）。</td>
</tr>
<tr>
<td>I 无效 (Invalid)</td>
<td>该Cache line无效。</td>
<td>无</td>
</tr>
</tbody>
</table>
<p>状态转换：</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250521175828179.png" alt="" /></p>
<p>示例场景：读取
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250521175851648.png" alt="" /></p>
<h2>MESI导致的最大问题：同步 时延</h2>
<p>缓存的一致性消息传递是要时间的，这就使其切换时会产生延迟。当一个缓存被切换状态时其他缓存收到消息完成各自的切换并且发出回应消息这么一长串的时间中CPU都会等待所有缓存响应完成。可能出现的阻塞都会导致各种各样的性能问题和稳定性问题。</p>
<h3><strong>CPU切换状态阻塞解决-存储缓存（<a href="https://zhida.zhihu.com/search?content_id=195538802&amp;content_type=Article&amp;match_order=1&amp;q=Store+Bufferes&amp;zhida_source=entity">Store Bufferes</a>）</strong></h3>
<p>比如你需要修改本地缓存中的一条信息，那么你必须将I（无效）状态通知到其他拥有该缓存数据的CPU缓存中，并且等待确认。等待确认的过程会阻塞处理器，这会降低处理器的性能。应为这个等待远远比一个指令的执行时间长的多。</p>
<h3><strong>Store Bufferes</strong></h3>
<p>为了避免这种CPU运算能力的浪费，Store Bufferes被引入使用。处理器把它想要写入到主存的值写到缓存，然后继续去处理其他事情。当所有失效确认（Invalidate Acknowledge）都接收到时，数据才会最终被提交。这么做有两个风险</p>
<h3><strong>Store Bufferes的风险</strong></h3>
<p>第一、就是处理器会尝试从存储缓存（Store buffer）中读取值，但它还没有进行提交。这个的解决方案称为Store Forwarding，它使得加载的时候，如果存储缓存中存在，则进行返回。第二、保存什么时候会完成，这个并没有任何保证。</p>
