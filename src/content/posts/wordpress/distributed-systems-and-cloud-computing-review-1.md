---
title: "Distributed Systems and Cloud Computing: Review 1"
description: "This is the self-review pack of Distributed Systems and Cloud Computing. We have lesson 1-5. Lesson 1 Presentation – Effective communication of information rather than of data – Code and number conversion – Transmission…"
publishedAt: "2025-12-30 15:42:51"
updatedAt: "2025-12-30 16:12:00"
category: "Distributed Systems"
tags: []
draft: false
slug: "distributed-systems-and-cloud-computing-review-1"
legacySlug: "distributed-systems-and-cloud-computing-review-1"
wordpressId: 1119
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-systems-and-cloud-computing-review-1/"
commentCount: 0
importedFromWordPress: true
---
<p>This is the self-review pack of Distributed Systems and Cloud Computing. We have lesson 1-5.</p>
<h2>Lesson 1</h2>
<p>Presentation – Effective communication of information rather than of data
– Code and number conversion
– Transmission of sophisticated data structures
– Data compression
• Application
– Electronic mail
– File transfer protocols (ftp)
– virtual terminal protocols (telnet)
– Distributed system (distributed database)
– Client-server
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230152954045.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153136030.png" alt="image.png" /></p>
<h2>Lesson 2</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153102273.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153152483.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153211280.png" alt="image.png" /></p>
<p>什么是中间件！
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153229504.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153247431.png" alt="image.png" /></p>
<p>C/S
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153315062.png" alt="image.png" /></p>
<p>proxy server</p>
<p><strong>“可移动代理（mobile proxy / downloadable proxy）”</strong>，本质是 <strong>RMI + mobile code</strong></p>
<blockquote>
<p>“我想调用这个远程对象，但我本地没有它的 proxy”</p>
</blockquote>
<p>2️⃣ 系统从 <strong>另一个服务器</strong>（不是目标服务本身）<br />
👉 <strong>把 proxy（stub）代码发给 client</strong></p>
<ul>
<li>proxy 是：
<ul>
<li>Java class / bytecode</li>
<li>或其他可执行中间代码</li>
</ul></li>
<li>属于 <strong>mobile code</strong></li>
</ul>
<p>3️⃣ Client 本地 <strong>加载并执行 proxy</strong></p>
<p>4️⃣ Client 调用 proxy 的方法
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153327339.png" alt="image.png" /></p>
<p><strong>“Example mobile code: Applets” 指的就是运行在 client 端的代码</strong>，更准确地说，是<strong>从服务器下载到客户端、并在客户端 JVM 中执行的移动代码（mobile code）</strong>。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153433382.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153446838.png" alt="image.png" /></p>
<ul>
<li><strong>Best-effort</strong>：大家一起抢资源，谁快谁用</li>
<li><strong>QoS</strong>：<strong>我保证你至少 / 至多 / 大概用到多少资源</strong></li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153501861.png" alt="image.png" /></p>
<table>
<thead>
<tr>
<th>指标</th>
<th>含义</th>
<th>例子</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Latency（延迟）</strong></td>
<td>多久能响应</td>
<td>RPC &lt; 10ms</td>
</tr>
<tr>
<td><strong>Throughput（吞吐）</strong></td>
<td>单位时间处理多少</td>
<td>1000 req/s</td>
</tr>
<tr>
<td><strong>Bandwidth（带宽）</strong></td>
<td>传输速率</td>
<td>1 Gbps</td>
</tr>
<tr>
<td><strong>Jitter（抖动）</strong></td>
<td>延迟是否稳定</td>
<td>实时音视频</td>
</tr>
</tbody>
</table>
<p>常见手段：</p>
<ul>
<li>流量分类（traffic classification）</li>
<li>优先级队列（priority queue）</li>
<li>带宽预留（bandwidth reservation）</li>
<li>Rate limiting / shaping</li>
</ul>
<p>目标：<strong>多租户下的 SLA 保证</strong></p>
<ul>
<li>一个用户卡了，不能拖垮其他人</li>
<li>云厂商要“卖承诺”</li>
</ul>
<p>常见说法：</p>
<ul>
<li><strong>SLA（Service Level Agreement）</strong></li>
<li>QoS violation（服务质量违约）</li>
</ul>
<p>典型 QoS 目标</p>
<ul>
<li><strong>Prefill latency &lt; X ms</strong></li>
<li><strong>Decode TPS ≥ Y</strong></li>
<li><strong>P99 latency ≤ Z</strong></li>
<li>不因其他请求导致 OOM 或长尾爆炸</li>
</ul>
<table>
<thead>
<tr>
<th>概念</th>
<th>区别</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>QoS</strong></td>
<td>系统内部的资源/性能保证机制</td>
</tr>
<tr>
<td><strong>SLA</strong></td>
<td>对外承诺（合同级）</td>
</tr>
<tr>
<td><strong>Performance</strong></td>
<td>实际跑得快不快</td>
</tr>
<tr>
<td><strong>Fairness</strong></td>
<td>是否公平，不一定有保证</td>
</tr>
<tr>
<td><strong>Best-effort</strong></td>
<td>没有 QoS</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153809068.png" alt="image.png" /></p>
<h4>System models</h4>
<blockquote>
<p><strong>What are the main entities in the system?</strong><br />
👉 系统里“有什么东西”？</p>
</blockquote>
<ul>
<li>进程 / 线程</li>
<li>节点 / 机器</li>
<li>用户 / 请求</li>
<li>数据对象 / 状态</li>
</ul>
<blockquote>
<p><strong>How do they interact?</strong><br />
👉 它们“怎么交流”？</p>
</blockquote>
<ul>
<li>消息传递 or 共享内存</li>
<li>同步 / 异步</li>
<li>RPC / 流 / 事件</li>
<li>一对一 / 广播 / 组通信</li>
</ul>
<blockquote>
<p><strong>What are the characteristics that affect their behaviour?</strong><br />
👉 哪些因素影响行为？</p>
</blockquote>
<ul>
<li>时钟是否同步？</li>
<li>网络是否可靠？</li>
<li>是否会失败？</li>
<li>是否存在恶意行为？</li>
</ul>
<h3>Interaction, Failure, Security 是“三大基础模型”</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154108492.png" alt="image.png" /></p>
<h3>1️⃣ Interaction Model（交互模型）</h3>
<p>回答问题：</p>
<blockquote>
<p><strong>系统组件如何通信？时间和顺序是否可预测？</strong></p>
</blockquote>
<p>典型分类：</p>
<ul>
<li>同步 / 异步</li>
<li>有界延迟 / 无界延迟</li>
<li>消息是否会丢 / 乱序</li>
</ul>
<p>📌 影响：</p>
<ul>
<li>能否实现共识</li>
<li>是否能设定超时</li>
<li>是否能用锁 / barrier</li>
</ul>
<hr />
<h2>2️⃣ Failure Model（失败模型）</h2>
<p>回答问题：</p>
<blockquote>
<p><strong>系统中“坏事”会坏到什么程度？</strong></p>
</blockquote>
<p>常见失败模型：</p>
<ul>
<li>Crash failure（宕机）</li>
<li>Omission（消息丢失）</li>
<li>Timing failure（超时）</li>
<li>Byzantine failure（恶意行为）</li>
</ul>
<p>📌 不同失败模型 ⇒ 完全不同的算法复杂度<br />
（比如 Paxos vs PBFT）</p>
<hr />
<h2>3️⃣ Security Model（安全模型）</h2>
<p>回答问题：</p>
<blockquote>
<p><strong>系统是否面对攻击者？攻击能力有多强？</strong></p>
</blockquote>
<p>包括：</p>
<ul>
<li>是否有恶意节点</li>
<li>是否能伪造消息</li>
<li>是否窃听 / 篡改</li>
<li>是否支持认证 / 加密</li>
</ul>
<p>📌 决定：</p>
<ul>
<li>是否需要签名</li>
<li>是否需要 PKI</li>
<li>是否需要拜占庭容错</li>
</ul>
<hr />
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153858779.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153911356.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230153922133.png" alt="image.png" /></p>
<h2>Lesson 3</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154314743.png" alt="image.png" /></p>
<p>The functionality encapsulated within each layer is called Protocol.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154331253.png" alt="image.png" /></p>
<p>OSI
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154409310.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154440966.png" alt="image.png" /></p>
<p>一种最基本、最通用的分布式交互协议模式（interaction pattern）
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154501751.png" alt="image.png" /></p>
<p>👉 <strong>Client（请求方） 和 Server（应答方）</strong></p>
<p>哪些模型/协议？</p>
<table>
<thead>
<tr>
<th>实例</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td>RPC</td>
<td>远程过程调用，本质就是 request–reply</td>
</tr>
<tr>
<td>HTTP</td>
<td>请求–响应模型</td>
</tr>
<tr>
<td>gRPC</td>
<td>带强类型的 request–reply</td>
</tr>
<tr>
<td>数据库查询</td>
<td>Query → Result</td>
</tr>
<tr>
<td>LLM API</td>
<td>Prompt → Response</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154543587.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154553778.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154848601.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154604933.png" alt="image.png" /></p>
<p><strong>IP multicast</strong> 是一种 <strong>网络层的一对多（one-to-many）通信机制</strong>：</p>
<blockquote>
<p><strong>发送方只发送一份数据，网络负责把它复制并分发给所有加入该组的接收方。</strong></p>
</blockquote>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230154735972.png" alt="image.png" /></p>
<ul>
<li><strong>Unicast</strong>：一对一（发 N 份给 N 个接收者）</li>
<li><strong>Broadcast</strong>：一对所有（全网都收到）</li>
<li><strong>Multicast</strong>：<strong>一对一组（只给订阅者）</strong> ← IP multicast</li>
</ul>
<hr />
<p>IP multicast 在“哪一层”？</p>
<ul>
<li><strong>网络层（IP 层）</strong></li>
<li>通过 <strong>多播地址</strong> 表示“接收者集合”</li>
<li>网络设备（路由器）在<strong>必要的分叉点复制数据</strong></li>
</ul>
<h2>Lesson 4</h2>
<h3>Distributed Objects and Remote Invocation</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155003788.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155012843.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155028229.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155039597.png" alt="image.png" /></p>
<p><strong>RMI（Remote Method Invocation，远程方法调用）</strong> 是一种分布式系统机制，它允许一个进程像调用本地对象的方法一样，调用运行在另一台机器上的对象方法。RMI 在底层通过 <strong>request–reply</strong> 的通信模式，将方法名和参数序列化后发送到远端，由远端对象执行并把返回结果或异常再传回调用方，从而对程序员隐藏网络通信、数据传输和位置差异等细节。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155100342.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155134236.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155143887.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155157948.png" alt="image.png" /></p>
<h3>“调用语义（invocation semantics）”与“容错机制（fault tolerance）</h3>
<blockquote>
<p>在存在网络与节点故障的情况下，一个远程方法“到底被执行了几次”？</p>
</blockquote>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155222831.png" alt="image.png" /></p>
<h3>1️⃣ Maybe（可能执行，也可能没执行）</h3>
<ul>
<li><strong>不重传请求</strong></li>
<li>出错就直接失败</li>
<li>调用方不知道远端是否真的执行过</li>
</ul>
<p>📌 特点：</p>
<ul>
<li>最弱保证</li>
<li>实现最简单</li>
<li>语义最不安全</li>
</ul>
<p>👉 本地 ≠ 远程 的根本原因就在这里</p>
<h3>2️⃣ At-least-once（至少执行一次）</h3>
<ul>
<li><strong>请求丢了 → 重传</strong></li>
<li>可能 <strong>执行多次</strong></li>
<li>但调用方一定会收到：
<ul>
<li>结果，或</li>
<li>异常</li>
</ul></li>
</ul>
<p>📌 风险：</p>
<ul>
<li><strong>副作用操作会出问题</strong>
<ul>
<li>比如 <code>withdraw(100)</code> 可能扣两次钱</li>
</ul></li>
</ul>
<p>📌 PPT 中的例子：</p>
<ul>
<li><strong>Sun RPC</strong></li>
</ul>
<h3>3️⃣ At-most-once（至多执行一次）</h3>
<ul>
<li><strong>请求可以重传</strong></li>
<li><strong>服务器做重复检测</strong></li>
<li>已执行过的请求：
<ul>
<li>不再重新执行</li>
<li>直接重发上次的 reply</li>
</ul></li>
</ul>
<p>📌 这是最接近“本地调用”的语义<br />
📌 PPT 中的例子：</p>
<ul>
<li><strong>Java RMI</strong></li>
<li><strong>CORBA</strong></li>
</ul>
<table>
<thead>
<tr>
<th>列</th>
<th>在问什么</th>
</tr>
</thead>
<tbody>
<tr>
<td>Retransmit request message</td>
<td>请求丢了要不要重发？</td>
</tr>
<tr>
<td>Duplicate filtering</td>
<td>服务器要不要检测重复请求？</td>
</tr>
<tr>
<td>Re-execute / retransmit reply</td>
<td>重复请求怎么处理？</td>
</tr>
<tr>
<td>Invocation semantics</td>
<td>最终语义保证</td>
</tr>
</tbody>
</table>
<p>how different fault-tolerance mechanisms in RMI (request retransmission, duplicate filtering, and reply retransmission) lead to different invocation semantics: maybe, at-least-once, and at-most-once.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155449197.png" alt="image.png" /></p>
<h3>Proxy</h3>
<p>proxy 不是缓存（cache），而是“远程对象的本地代理（stub / proxy object）”。</p>
<pre><code class="language-java">result = remoteObj.foo(x);</code></pre>
<p>实际发生的是：</p>
<ol>
<li>调用的是 <strong>proxy 的 <code>foo()</code></strong></li>
<li>proxy：
<ul>
<li>序列化方法名 + 参数</li>
<li>通过网络发送 request</li>
</ul></li>
<li>server 执行真正的 <code>foo()</code></li>
<li>返回结果</li>
<li>proxy 反序列化并返回</li>
</ol>
<p>👉 <strong>这就是 “Instead of executing an invocation, it sends a message” 的含义</strong></p>
<table>
<thead>
<tr>
<th>维度</th>
<th>Proxy (RMI)</th>
<th>Cache</th>
</tr>
</thead>
<tbody>
<tr>
<td>是否执行逻辑</td>
<td>❌ 不执行</td>
<td>❌/✅</td>
</tr>
<tr>
<td>是否存结果</td>
<td>❌（默认）</td>
<td>✅</td>
</tr>
<tr>
<td>是否减少网络通信</td>
<td>❌</td>
<td>✅</td>
</tr>
<tr>
<td>目的</td>
<td><strong>透明性</strong></td>
<td><strong>性能</strong></td>
</tr>
<tr>
<td>语义</td>
<td>远程调用</td>
<td>本地副本</td>
</tr>
</tbody>
</table>
<p>一次“看起来像本地方法调用”的 RMI，在系统内部到底是怎么被拆解和执行的。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155901234.png" alt="image.png" /></p>
<blockquote>
<p><strong>RMI 通过 proxy（stub）、remote reference module、communication module 和 server 端的 skeleton/servant，把本地方法调用转化为网络请求并在远端对象上执行。</strong></p>
</blockquote>
<p>它干三件事：</p>
<ol>
<li><strong>区分本地对象引用 vs 远程对象引用</strong></li>
<li><strong>生成 remote object reference</strong>
<ul>
<li>包含：对象 ID、服务器地址、端口等</li>
</ul></li>
<li><strong>创建 proxy（stub）</strong></li>
</ol>
<p>📌 你可以把它理解为：</p>
<blockquote>
<p><strong>“RMI 的对象地址管理 + proxy 工厂”</strong></p>
</blockquote>
<h4>Remote object table</h4>
<ul>
<li>保存：
<ul>
<li>本进程拥有的远程对象</li>
<li>本地 proxy 对应的远程对象引用</li>
</ul></li>
<li>用来做：
<ul>
<li>查找</li>
<li>去重</li>
<li>生命周期管理</li>
</ul></li>
</ul>
<h4>1️⃣ RMI ≠ 魔法</h4>
<ul>
<li>本地调用只是“表象</li>
<li>实际是 <strong>消息传递 + 对象管理</strong></li>
</ul>
<h4>2️⃣ 清晰的职责分离</h4>
<ul>
<li>proxy：接口透明</li>
<li>remote reference module：对象定位</li>
<li>communication module：网络</li>
<li>skeleton：方法分派</li>
<li>servant：业务逻辑</li>
</ul>
<h4>3️⃣ 为后续问题做铺垫</h4>
<ul>
<li>at-most-once 语义</li>
<li>failure handling</li>
<li>garbage collection（分布式）</li>
</ul>
<hr />
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230155852212.png" alt="image.png" /></p>
<p>RMI 是建立在 RPC 之上的、更高层的抽象；RPC 是机制，RMI 是面向对象语义的封装。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160037545.png" alt="image.png" /></p>
<ul>
<li>没有对象、没有状态</li>
<li>调用的是“某台机器上的某个过程”</li>
<li>更贴近 C / 系统编程</li>
</ul>
<p>📌 <strong>RPC：调用一次就完</strong><br />
📌 <strong>RMI：对象长期存在</strong></p>
<p>RMI = RPC + 对象模型 + 远程引用管理</p>
<ul>
<li>RPC：
<ul>
<li>无状态（stateless）</li>
</ul></li>
<li>RMI：
<ul>
<li>对象有 identity</li>
<li>多次调用作用在<strong>同一个远程对象</strong></li>
</ul></li>
</ul>
<table>
<thead>
<tr>
<th>RPC</th>
<th>RMI</th>
</tr>
</thead>
<tbody>
<tr>
<td>实现复杂度</td>
<td>低</td>
<td>高</td>
</tr>
<tr>
<td>语义强度</td>
<td>弱</td>
<td>强</td>
</tr>
<tr>
<td>分布式 GC</td>
<td>❌</td>
<td>✅</td>
</tr>
<tr>
<td>动态 proxy</td>
<td>❌</td>
<td>✅</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>现实系统</th>
<th>更像谁</th>
</tr>
</thead>
<tbody>
<tr>
<td>gRPC</td>
<td>RPC</td>
</tr>
<tr>
<td>Thrift</td>
<td>RPC</td>
</tr>
<tr>
<td>Java RMI</td>
<td>RMI</td>
</tr>
<tr>
<td>CORBA</td>
<td>RMI</td>
</tr>
<tr>
<td>REST</td>
<td>RPC（弱形式）</td>
</tr>
<tr>
<td>LLM API</td>
<td>RPC</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160049761.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160110529.png" alt="image.png" /></p>
<h3>RMI code</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160314883.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160327810.png" alt="image.png" /></p>
<h2>Lesson 5</h2>
<p>indirect communication</p>
<p>在讲 <strong>分布式系统中的“空间耦合（space coupling）”和“时间耦合（time coupling）”</strong>，用一个 <strong>2×2 的分类表</strong> 来系统地理解<strong>通信方式之间的本质差异</strong>。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160358250.png" alt="image.png" /></p>
<h3>1️⃣ 空间耦合（Space coupling）</h3>
<p>关注的是：</p>
<blockquote>
<p><strong>发送方是否需要“知道”接收方是谁/在哪里</strong></p>
</blockquote>
<ul>
<li><strong>空间耦合（Space-coupled）</strong>
<ul>
<li>发送方知道明确的接收者（地址、对象、进程）</li>
</ul></li>
<li><strong>空间解耦（Space-uncoupled）</strong>
<ul>
<li>发送方不知道具体接收者，只是“发出去”</li>
<li>谁接收由系统/中介决定</li>
</ul></li>
</ul>
<hr />
<h3>2️⃣ 时间耦合（Time coupling）</h3>
<p>关注的是：</p>
<blockquote>
<p><strong>发送方和接收方是否必须在同一时间存在</strong></p>
</blockquote>
<ul>
<li><strong>时间耦合（Time-coupled）</strong>
<ul>
<li>发送消息时，接收方必须“在线”</li>
</ul></li>
<li><strong>时间解耦（Time-uncoupled）</strong>
<ul>
<li>发送和接收可以发生在不同时间</li>
<li>接收方可以晚点再出现</li>
</ul></li>
</ul>
<h3>④ 空间解耦 + 时间解耦（右下）</h3>
<p><strong>最解耦、最灵活的通信方式</strong></p>
<p><strong>特性</strong></p>
<ul>
<li>
<p>不知道接收者是谁</p>
</li>
<li>
<p>不要求接收者立即存在</p>
</li>
<li>
<p>双方生命周期完全独立</p>
</li>
</ul>
<p><strong>例子</strong></p>
<ul>
<li>
<p>Publish / Subscribe</p>
</li>
<li>
<p>Message Queue</p>
</li>
<li>
<p>Tuple Space（Linda）</p>
</li>
<li>
<p>大多数<strong>间接通信模型</strong></p>
</li>
</ul>
<p>👉 本质：</p>
<blockquote>
<p>“我只管发，谁来、什么时候收都无所谓”</p>
</blockquote>
<hr />
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160459882.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160517425.png" alt="image.png" /></p>
<p><strong>JGroups</strong> 是一个 <strong>用于构建可靠组通信（group communication）的 Java 中间件库</strong>，常用于 <strong>集群、分布式系统的一致性与成员管理</strong>。
一个让多台节点像“一个组”一样可靠通信的 Java 库，提供 <strong>成员发现、可靠消息广播、顺序保证、故障检测</strong> 等能力。</p>
<p>在分布式系统里，你经常需要：</p>
<ul>
<li>向<strong>一组节点</strong>发送消息（不是点对点）</li>
<li>知道<strong>谁在线、谁宕机</strong></li>
<li>保证消息 <strong>不丢、不乱序（可选）</strong></li>
<li>在节点 <strong>动态加入/离开</strong> 时系统还能正常工作</li>
</ul>
<p>👉 JGroups 把这些<strong>通用而复杂的机制</strong>都封装好了。</p>
<hr />
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160529330.png" alt="image.png" /></p>
<h3>实际中谁在用 jgroup？</h3>
<ul>
<li>
<p><strong>JBoss / WildFly</strong>：集群通信</p>
</li>
<li>
<p><strong>Infinispan</strong>：分布式缓存复制</p>
</li>
<li>
<p><strong>Hazelcast</strong>（早期/类似思想）</p>
</li>
<li>
<p><strong>IP Multicast</strong>：只负责“发”</p>
</li>
<li>
<p><strong>JGroups</strong>：在 multicast 之上 <strong>补齐可靠性、顺序、成员管理</strong></p>
</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160642301.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160651028.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160857886.png" alt="image.png" /></p>
<p><strong>服务发现（Service Discovery）</strong> 是分布式系统中的一种<strong>基础机制</strong>，用来解决：</p>
<blockquote>
<p><strong>在一个节点数量、地址、状态都不断变化的系统里，客户端如何找到“当前可用”的服务实例？</strong></p>
</blockquote>
<p><strong>服务发现 = 自动维护“服务名 → 可用实例地址”的映射机制</strong><br />
让调用方 <strong>不用关心 IP / 端口变化</strong>，只按服务名访问。</p>
<h3>核心组成（3 个角色）</h3>
<h4>1️⃣ 服务注册（Service Registration）</h4>
<p>服务启动时：</p>
<ul>
<li>
<p>向“注册中心”报告：</p>
<blockquote>
<p><strong>我是谁 + 我在哪 + 我还活着</strong></p>
</blockquote>
</li>
</ul>
<p>例如：</p>
<p><code>service = &quot;user-service&quot; address = 10.0.0.12:8080</code></p>
<hr />
<h4>2️⃣ 服务发现（Service Lookup）</h4>
<p>客户端需要调用服务时：</p>
<ul>
<li>
<p>向注册中心查询：</p>
<blockquote>
<p>“user-service 现在有哪些可用实例？”</p>
</blockquote>
</li>
</ul>
<hr />
<h4>3️⃣ 健康检查（Health Check）</h4>
<p>注册中心持续确认：</p>
<ul>
<li>服务是否存活</li>
<li>宕机实例会被<strong>自动剔除</strong></li>
</ul>
<h3>两种主流服务发现模式</h3>
<h4>🅐 客户端发现（Client-side Discovery）</h4>
<p>客户端：</p>
<ol>
<li>查询注册中心</li>
<li>自己做负载均衡</li>
<li>直接调用实例</li>
</ol>
<p>📌 常见于微服务 / RPC 框架</p>
<p><strong>优点</strong></p>
<ul>
<li>灵活</li>
<li>少一跳</li>
</ul>
<p><strong>缺点</strong></p>
<ul>
<li>客户端逻辑复杂</li>
</ul>
<hr />
<h4>🅑 服务端发现（Server-side Discovery）</h4>
<p>客户端：</p>
<ol>
<li>请求一个<strong>固定入口</strong></li>
<li>由网关 / LB 转发到真实服务</li>
</ol>
<p>📌 常见于云原生架构</p>
<p><strong>优点</strong></p>
<ul>
<li>客户端简单</li>
</ul>
<p><strong>缺点</strong></p>
<ul>
<li>多一跳</li>
</ul>
<p>下面这些都是分布式系统里<strong>非常经典的组件</strong>：</p>
<ul>
<li>
<p><strong>ZooKeeper</strong></p>
</li>
<li>
<p><strong>etcd</strong></p>
</li>
<li>
<p><strong>Consul</strong></p>
</li>
<li>
<p><strong>Kubernetes</strong>（内置 Service / DNS）****</p>
</li>
<li>
<p><strong>RPC / RMI</strong><br />
👉 常常<strong>依赖服务发现</strong>来拿到目标地址</p>
</li>
<li>
<p><strong>JGroups</strong><br />
👉 偏向“组通信”，不是典型服务发现</p>
</li>
<li>
<p><strong>消息队列 / Pub-Sub</strong><br />
👉 更进一步，连“找服务”都不需要</p>
</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230160708950.png" alt="image.png" /></p>
