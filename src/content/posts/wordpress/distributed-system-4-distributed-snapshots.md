---
title: "Distributed System 4: Chandy-Lamport Algorithm"
description: "Snapshots: save the data 我们想要捕捉系统在某一时刻 TTT 的 一致全局状态 ，包括： 每个进程的本地状态； 每条通道上的消息状态（即“正在飞”的消息）。 常见应用场景： 检查点恢复（Checkpoint / Rollback Recovery） 检测全局死锁 检测全局不变式（如是否所有账户加和为常数） 调试 / 稳定状态检测（如终止检测） 问题是： 在分布式系统中没有全局时钟，进程之间的消息异步传递，我们无…"
publishedAt: "2025-10-11T02:00:10Z"
updatedAt: "2026-01-09T09:49:24Z"
category: "Distributed Systems"
categories: ["Distributed Systems"]
tags: ["Snapshots"]
author: "GB"
draft: false
slug: "distributed-system-4-distributed-snapshots"
legacySlug: "distributed-system-4-distributed-snapshots"
oldSlugs: ["distributed-system-5-distributed-snapshots"]
wordpressId: 1014
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-system-4-distributed-snapshots/"
commentCount: 0
viewCount: 889
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots.webp"
---
<p>Snapshots: save the data </p>
<p>我们想要捕捉系统在某一时刻 TTT 的<strong>一致全局状态</strong>，包括：</p>
<ul>
<li>每个进程的本地状态；</li>
<li>每条通道上的消息状态（即“正在飞”的消息）。</li>
</ul>
<p>常见应用场景：</p>
<ul>
<li>检查点恢复（Checkpoint / Rollback Recovery）</li>
<li>检测全局死锁</li>
<li>检测全局不变式（如是否所有账户加和为常数）</li>
<li>调试 / 稳定状态检测（如终止检测）</li>
</ul>
<p>问题是：</p>
<blockquote>
<p>在分布式系统中没有全局时钟，进程之间的消息异步传递，我们无法在同一“时间点”同时拍照。</p>
</blockquote>
<p>这就是<strong>一致快照问题（Consistent Snapshot Problem）</strong>。</p>
<p>比如：</p>
<ul>
<li>P1 在 10:01 拍照；</li>
<li>P2 在 10:02 拍照；</li>
<li>如果中间有消息在传递，这两个快照组合起来可能<strong>不是系统的真实状态</strong>。</li>
</ul>
<p><strong>Target: markdown every 圈 in the process:</strong>
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-001-ab5a2fc81de5.webp" alt="image.png" /></p>
<h3>Design1: 只取两个进程</h3>
<p>Problem：那你在通信信道里的数据就丢失了
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-002-d65a52f65b75.webp" alt="image.png" /></p>
<h3>Design2: P先存，然后发给Q存</h3>
<p>问题：可能G还在通信中，你只复制成功了Y，会丢数据或者多数据
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-003-d343fd935617.webp" alt="image.png" /></p>
<h3>Idea：设置一个marker消息做同步</h3>
<p>这就是Chandy-Lamport Algorithm</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-004-e956af474913.webp" alt="image.png" /></p>
<h2>Chandy-Lamport Algorithm</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-005-07c0c8d914a8.webp" alt="image.png" /></p>
<p>事件：Q收到 marker，此时又发送O到P</p>
<p>他要做：
<strong>把PQ channel 记录为空</strong> （防止记Y造成duplicate）
<strong>Snapshot {R, P, B}</strong></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-006-555696734933.webp" alt="image.png" /></p>
<p>再发送一次marker，到P后，根据之前的状态，可以同步，确定 channel(Q,P) = {O}
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-007-d4d87e5771c9.webp" alt="image.png" />
我们是不用记录同一个准确真实时间的快照，而是记录逻辑意义上的时间</p>
<h4>importance: 两个人，只会有一个channel是空的</h4>
<p>自己推理下</p>
<ol>
<li>发送Y</li>
<li>marker {G}</li>
<li>发送marker</li>
<li>Q发送B，O</li>
<li>此时Q应该记录{Y,R,P}，因为之前没记录成功过</li>
</ol>
<p>1.如果先marker，那么Y一定会在P={Y,G}
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-008-d1fed86c287b.webp" alt="image.png" /></p>
<h2>3个人</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-009-3dc4eb167fcb.webp" alt="image.png" /></p>
<ol>
<li>marker先从T开始 T={}</li>
<li>T发送marker给P，Q。</li>
<li>在发送途中，P发送R给Q，Q发送P给P</li>
<li>两个marker并行的到了（同时循序），并且记录，P={G,Y}, Q={B,O}</li>
<li>此时P和R终于到了，然后marker从P到Q，从Q到P</li>
<li>marker记录，就会得出 chan(P,Q)=R chan(Q,P)=P</li>
</ol>
<p>如果加两个channel，就可以记录出这个情况
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-010-3954f8b3fefd.webp" alt="image.png" /></p>
<p>Chandy-Lamport (1985) 的算法通过一种<strong>异步标记协议（marker protocol）</strong>解决了上面的两个问题：</p>
<ol>
<li><strong>快照启动者发送一个 marker（标记消息）；</strong></li>
<li><strong>每个节点收到 marker 时：</strong>
<ul>
<li>若是第一次收到 marker → 记录本地状态；</li>
<li>对每条输入通道：
<ul>
<li>在收到 marker 之前到达的消息属于通道状态；</li>
<li>收到 marker 后的消息属于快照之后的新状态；</li>
</ul></li>
<li>然后把 marker 广播出去。</li>
</ul></li>
</ol>
<p>通过这种方式：</p>
<ul>
<li>不需要全局时钟；</li>
<li>保证每个消息要么属于“已发送未收”的通道状态，要么已被计入接收方状态；</li>
<li>得到的快照是一致的（即不违反因果关系）。</li>
</ul>
<table>
<thead>
<tr>
<th>分类</th>
<th>问题</th>
<th>核心原因</th>
</tr>
</thead>
<tbody>
<tr>
<td>理论问题</td>
<td>没有全局时间，无法同步拍照</td>
<td>分布式异步性</td>
</tr>
<tr>
<td>状态一致性问题</td>
<td>消息可能被遗漏或重复</td>
<td>发送与接收时刻不匹配</td>
</tr>
<tr>
<td>实践问题</td>
<td>网络不可靠、系统规模大</td>
<td>真实系统限制</td>
</tr>
<tr>
<td>解决思路</td>
<td>标记协议（marker）、逻辑时钟、差分快照</td>
<td>保证一致性、减少开销</td>
</tr>
</tbody>
</table>
<p>当然在真实世界中：</p>
<table>
<thead>
<tr>
<th>问题</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>消息重复 / 丢失</strong></td>
<td>实际网络不是可靠 FIFO 通道，需要额外机制（序号或确认）确保 marker 不丢失</td>
</tr>
<tr>
<td><strong>高负载系统的状态膨胀</strong></td>
<td>拍快照可能占用大量内存 / 网络带宽，需要增量快照或差分快照</td>
</tr>
<tr>
<td><strong>与应用状态交错</strong></td>
<td>进程状态和通道状态可能不同步，尤其是在多线程或异步 I/O 环境下</td>
</tr>
<tr>
<td><strong>一致性与性能权衡</strong></td>
<td>频繁快照会拖慢系统性能；延迟快照则可能增加恢复时间</td>
</tr>
<tr>
<td><strong>多快照并发</strong></td>
<td>多个控制器（coordinator）同时触发 snapshot，需区分不同 marker 实例（常用唯一标识符）</td>
</tr>
<tr>
<td><strong>非 FIFO 通道</strong></td>
<td>原算法假设 FIFO 通道；若通道乱序，需记录额外因果信息（如 Vector Clock）</td>
</tr>
</tbody>
</table>
<h2>快照存储所有事情/过多事情</h2>
<p>事情会被Lamport存
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-10/distributed-system-4-distributed-snapshots/body-011-cc853abd10dd.webp" alt="image.png" /></p>
<p>这个PPT是整个事情的形象版本
<a href="https://www.cs.princeton.edu/courses/archive/fall22/cos418/docs/precept_04_distributedsnapshots.pdf">https://www.cs.princeton.edu/courses/archive/fall22/cos418/docs/precept_04_distributedsnapshots.pdf</a></p>
