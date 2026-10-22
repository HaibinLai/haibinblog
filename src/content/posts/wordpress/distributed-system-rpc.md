---
title: "Distributed System 1: RPC"
description: "This is a course taught in SUSTech 2025 Fall by Prof. Zhuozhao Li. RPC 为什么要有RPC 因为我们不想socket编程 Goal: Easy-to-program network communication that makes client-server communication transparent RPC 要解决的问题 异构 Failure 性能 For…"
publishedAt: "2025-09-17T03:20:38Z"
updatedAt: "2025-10-11T02:01:35Z"
category: "Distributed Systems"
categories: ["Distributed Systems"]
tags: ["rpc"]
author: "GB"
draft: false
slug: "distributed-system-rpc"
legacySlug: "distributed-system-rpc"
oldSlugs: []
wordpressId: 981
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-system-rpc/"
commentCount: 0
viewCount: 691
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc.webp"
---
<p>This is a course taught in SUSTech 2025 Fall by Prof. Zhuozhao Li. </p>
<h1>RPC</h1>
<h2>为什么要有RPC</h2>
<p>因为我们不想socket编程
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-001-0a5322b90142.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-002-54ca7850d1bb.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-003-c169417cc0bf.webp" alt="" />
Goal: Easy-to-program network communication that makes
client-server communication transparent</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-004-103d78d1fcee.webp" alt="" /></p>
<h2>RPC 要解决的问题</h2>
<ol>
<li>异构</li>
<li>Failure</li>
<li>性能
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-005-4aea589e1acd.webp" alt="" /></li>
</ol>
<p>For a remote procedure call, a remote machine may:
• Run process written in a different language
• Represent data types using different sizes
• Use a different byte ordering (endianness)
• Represent floating point numbers differently
• Have different data alignment requirements
• e.g., 4-byte type begins only on 4-byte memory boundary</p>
<h2>RPC的example</h2>
<p>注意，RPC的底层不一定是一定要tcp，udp也可以
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-006-5ff83d8bea57.webp" alt="" /></p>
<p>RPC 是一种远程调用的协议</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-007-f81b66455280.webp" alt="" /></p>
<h2>Fault Tolerance</h2>
<p>为什么会 错误？</p>
<ol>
<li>Client may crash and reboot
<ol start="2">
<li>Packets may be dropped
• Some individual packet loss in the Internet
• Broken routing results in many lost packets</li>
<li>Server may crash and reboot</li>
<li>Network or server might just be very slow</li>
</ol></li>
</ol>
<p>gRPC: 用Http实现的RPC，是一种计算范式</p>
<h3>至少一次机制</h3>
<p>在分布式系统里，<strong>“至少一次 (at-least-once)”</strong> 是一种消息投递或任务执行的<strong>交付语义 (delivery semantics)</strong>。它主要用于描述在消息队列、事件流系统、RPC 调用、或者分布式作业调度中，系统如何保证一条消息最终被处理。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-008-74bbf132f9b2.webp" alt="" /></p>
<h3>三种常见交付语义</h3>
<ol>
<li><strong>至多一次 (at-most-once)</strong>
<ul>
<li>消息最多被处理一次，可能丢失，但不会重复。</li>
<li>优点：延迟低，性能好。</li>
<li>缺点：可能丢数据。</li>
</ul></li>
</ol>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-008-74bbf132f9b2.webp" alt="" /></p>
<ol start="2">
<li><strong>至少一次 (at-least-once)</strong>
<ul>
<li>消息保证<strong>最终会被处理</strong>，但可能被处理<strong>多次</strong>（即重复）。</li>
<li>典型实现：失败重试机制。如果处理失败或超时，消息会被重新投递，直到确认成功。</li>
<li>缺点：需要应用层自己处理<strong>幂等性 (idempotence)</strong>，否则会出现重复处理的问题。</li>
<li>解决方案是用一个独立id</li>
</ul></li>
</ol>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-009-69fa17c6fbbf.webp" alt="" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-010-b6ec92b7928c.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-011-6921a87e4cfe.webp" alt="" /></p>
<p>这里有可能id数量会太大，一种解决方案是discarding server state</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-012-e8905b6a9f13.webp" alt="" /></p>
<ol start="3">
<li><strong>恰好一次 (exactly-once)</strong>
<ul>
<li>消息保证<strong>不丢失且只处理一次</strong>。</li>
<li>实现复杂，常需要事务、日志或两阶段提交，性能开销较大。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-013-4f26ef3f750c.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-014-6069962d2dd7.webp" alt="" /></li>
</ul></li>
</ol>
<h3>举个例子</h3>
<ul>
<li><strong>Kafka</strong> 默认提供 <strong>at-least-once</strong> 语义。消费者如果处理失败或崩溃，broker 会再次投递消息 → 消息一定能被处理，但可能被消费多次。</li>
<li><strong>分布式 RPC 重试</strong>：如果客户端调用服务超时，可能会重试 → 服务端其实已经执行过一次，重试时就会再次执行 → 至少一次。</li>
</ul>
<h2>At least once 至少读一次</h2>
<p>这个场景面对的是读取数据的情况</p>
<h2>Summary</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/distributed-system-rpc/body-015-4be553b9e49a.webp" alt="" /></p>
