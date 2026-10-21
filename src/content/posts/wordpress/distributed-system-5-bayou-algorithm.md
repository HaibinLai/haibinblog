---
title: "Distributed System 5: Bayou Algorithm"
description: "分布式一致性 怎么在弱网情况下保证事件一致性，弱网指的是，只能时不时连接一下。 Bayou [bayou]（1995） Bayou是一篇神奇的论文，在1995年这个互联网还没有普及的时代，就开始讨论分布式系统中弱一致性的问题。Bayou考虑的应用场景是移动设备不具备稳定的网络连接，如何保证这些不具备稳定网络连接的设备组成集群，处理读写操作时，用户看到的数据是合理的。Dynamo [dynamo] （2007） Dynamo也是一个弱一…"
publishedAt: "2025-10-11 10:02:40"
updatedAt: "2026-01-09 18:27:10"
category: "Distributed Systems"
tags: ["Bayou"]
draft: false
slug: "distributed-system-5-bayou-algorithm"
legacySlug: "distributed-system-5-bayou-algorithm"
wordpressId: 1023
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-system-5-bayou-algorithm/"
commentCount: 0
importedFromWordPress: true
---
<h2>分布式一致性</h2>
<p>怎么在弱网情况下保证事件一致性，弱网指的是，只能时不时连接一下。</p>
<p>Bayou [bayou]（1995） Bayou是一篇神奇的论文，在1995年这个互联网还没有普及的时代，就开始讨论分布式系统中弱一致性的问题。Bayou考虑的应用场景是移动设备不具备稳定的网络连接，如何保证这些不具备稳定网络连接的设备组成集群，处理读写操作时，用户看到的数据是合理的。Dynamo [dynamo] （2007） Dynamo也是一个弱一致性的文章。典型应用场景就是购物车，如果两个人在不同地方往不同机器用同一个账号执行加入购物车操作，这两个机器暂时被隔离了，那么是否允许这两个人进行这个操作？如果允许，等之后网络恢复了，怎么处理这个write conflict。</p>
<p>链接：<a href="https://zhuanlan.zhihu.com/p/401743420">https://zhuanlan.zhihu.com/p/401743420</a>
来源：知乎</p>
<h2>Bayou算法</h2>
<p>Bayou 是 1990 年代中期由 Xerox PARC 提出的一个<strong>早期分布式协作数据库系统</strong>（由 Terry、Demers、Pajankar 等人设计），它是后来 <em>eventual consistency</em> 和 CRDT 等思想的先驱之一。<br />
它最初是为了<strong>移动设备和断网协作编辑</strong>场景设计的——在当时笔记本、PDA 之间网络很不稳定，但用户仍希望多个节点能共享、更新同一份数据。</p>
<hr />
<p>Bayou 的目标是：</p>
<blockquote>
<p>在没有中心协调者、网络不可靠甚至分区的情况下，让每个副本都可以独立地读写数据，并最终达成一致。</p>
</blockquote>
<p>它实现的是一种 <strong>弱一致性 / 最终一致性（eventual consistency）</strong> 模型，通过「乐观复制 + update 日志传播 + 应用级冲突解决」来实现。</p>
<p>Bayou 是分布式系统史上非常有启发意义的项目,
方法主要idea是“弱一致 → 稳定一致” 的不断演化。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251230012059953.png" alt="image.png" /></p>
<p>Bayou保证系统是always writable，也就是说client永远可以向server读取或写入数据，并且写完当前副本就立马返回用户。</p>
<p>这里就引发了两个问题，一个是读取的数据可能存在冲突，此时就需要用application定义的冲突解决方法解决冲突。另一个问题是写入的数据只写进了当前副本，没有传播到其他副本上，所以副本之间不是每时每刻一致的。但Bayou保证，他们总有一天会一致，即eventual consistency。不同副本之间通过Anti-entropy进行沟通。为什么叫Anti-entropy呢？Entropy是信息论中的熵，一般熵越大越无序，anti就反，所以anti-entropy就是要反对这种无序，不同副本间通过沟通（communicate）认可一个写顺序，即两个副本对他们要写的数据，写数据的顺序达成一致。至于这两个副本怎么样对拥有的写操作进行排序，使得这个顺序反应了正确的业务逻辑，主要采用lamport logical clock，在这里就不展开了。</p>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2025/10/image-1767028791458.png" alt="file" /></p>
<ol>
<li>
<p>乐观副本控制：先斩后奏的艺术
Bayou 的核心哲学是<strong>“可用性高于一切”。在网络不稳定的环境下，它允许任何副本（Replica）在离线状态下直接接受用户的写请求。这些操作在本地被标记为“临时（Tentative）”</strong>状态并立即生效，用户无需等待网络确认就能继续工作。为了处理可能出现的冲突，每条写操作都自带“检测代码”和“修复代码”：系统在执行时会先检查预设条件（如：这间会议室还没被订走吧？），如果条件不满足，则自动运行修复逻辑（如：帮我订隔壁那间）。</p>
</li>
<li>
<p>反熵（Anti-Entropy）：两两对账的“传声筒”
反熵是 Bayou 实现数据同步的底层协议，它不依赖中心化的广播，而是采用两两握手（Pairwise Exchange）。当任意两个节点建立连接时，它们会互相交换各自保存的写操作日志（Writes）。通过对比“版本向量”，节点能迅速发现对方缺了哪些更新，并将这些增量日志同步过去。这个过程就像两个人在交换笔记，通过不断的双向同步，所有节点的日志最终都会趋于一致，从而消除系统中的“乱序”和“信息差”。</p>
</li>
</ol>
<p>为了保证update正确，每次更新会有一个CSN，本地时间+id
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109181328349.png" alt="image.png" /></p>
<ol start="3">
<li>主节点（Primary Node）：最后的终审裁判
虽然大家都能写，但谁才是“标准答案”？Bayou 引入了主节点（Primary Node）来决定操作的最终顺序。当临时操作通过反熵协议流转到主节点时，主节点会给它分配一个永久的提交序列号（Commit Number）。一旦某个操作被主节点定序，它就从“临时”变成了“确认（Committed）”。其他节点在后续的反熵过程中收到这些确认信息后，会根据序列号重新排列本地日志并撤销/重做（Rollback &amp; Replay）相关操作，确保全球所有副本最终的执行结果完全相同。</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011093259618.png" alt="image.png" /></p>
<h2>Intelligence that can identify and resolve conflicts</h2>
<p>• More like users’ updates: read database, think, change request to eliminate conflict
• Must ensure all nodes resolve conflicts in the same way to keep replicas consistent</p>
<p>Dependency Check &amp; Merge Procedure 不同的副本都可以写数据，那么大概率是会有冲突的，如何定义冲突？发生了冲突怎么解决？这些都是由Application决定的。下面就是一个例子，每当bayou进行一个写操作的时候，都会收到两个用户定义的额外信息dependency check &amp; mergeproc。含义是，server在进行写操作前，先执行dependency check，如果检查发现需要的依赖都可以满足，即application语义下不存在冲突，就可以进行写操作。相反，如果dependency check失败了，就要执行merge procedure，即按照application定义的语义解决冲突。</p>
<hr />
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011094152854.png" alt="image.png" /></p>
<p>开会冲突：</p>
<p>节点X会走A，节点Y会走B
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011094354584.png" alt="image.png" /></p>
<h2>解决冲突的idea：全局日志文件</h2>
<p>大家只要按照全局日志文件执行就可以了（github）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011094432070.png" alt="image.png" /></p>
<h3>全局日志 example</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011094941937.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011094956089.png" alt="image.png" />
马上更新！</p>
<p>idea：所有的一致性是临时的一致性，只有联网了，才能最终同步</p>
<p>tentative write &amp; committed write anti-entropy
在Bayou中，如果副本商量后得到的顺序与本地顺序不一致，原操作需要回滚。比如副本A先执行了transaction 1，副本B先执行了transaction 2，然后副本A与副本B进行anti-entropy，发现这两个transaction应该按照1，2的顺序执行，于是副本A补上刚才没有执行的transaction 2。但副本B由于已经执行了transaction 2，此时就需要回滚，undo transaction 2，然后再执行transaction 1， transaction 2。</p>
<h2>⚙️ 系统机制</h2>
<h3>1. <strong>每个节点都是可读写副本</strong></h3>
<p>所有副本都维护一份完整的数据库拷贝。<br />
每个副本都可以本地执行 <code>write</code> 操作，即使当前离线。更新会被记录成一条 <strong>update log entry</strong>。</p>
<h3>2. <strong>Update 日志的传播</strong></h3>
<p>节点恢复网络连接后，会将自己的更新日志与其他副本进行 <strong>anti-entropy（反熵同步）</strong>，即：</p>
<ul>
<li>
<p>按时间戳或版本号比较日志；</p>
</li>
<li>
<p>互相发送缺失的更新；</p>
</li>
<li>
<p>应用新的更新到本地数据库。</p>
</li>
</ul>
<h3>3. <strong>Tentative 和 Committed 更新</strong></h3>
<p>Bayou 的一个关键特性是区分：</p>
<ul>
<li>
<p><strong>Tentative（暂定）更新</strong>：在本地执行但尚未被所有副本确认；</p>
</li>
<li>
<p><strong>Committed（已提交）更新</strong>：通过某种全局顺序（由“primary replica”决定）确定执行顺序后，才算最终确认。</p>
</li>
</ul>
<p>每个副本都执行相同顺序的 committed 更新，因此最终收敛。</p>
<h3>4. <strong>Conflict Resolution（冲突解决）</strong></h3>
<p>由于更新可能并发、乱序，Bayou 让<strong>应用层提供冲突解决函数</strong>（conflict resolution procedure）：</p>
<ul>
<li>
<p>每条更新都携带一段可执行逻辑，用于检测并解决冲突；</p>
</li>
<li>
<p>例如两个用户修改相同字段时，可以合并、覆盖或提示用户手动解决。</p>
</li>
</ul>
<table>
<thead>
<tr>
<th>特性</th>
<th><strong>Bayou</strong></th>
<th><strong>Git / GitHub</strong></th>
<th>相似点解释</th>
</tr>
</thead>
<tbody>
<tr>
<td>副本模型</td>
<td>每个节点都有完整副本</td>
<td>每个 clone 仓库都是完整副本</td>
<td>都是「多主复制」(multi-master replication)</td>
</tr>
<tr>
<td>写入模型</td>
<td>每个副本都可本地写入（offline update）</td>
<td>本地 <code>commit</code> 可以离线执行</td>
<td>支持离线写、断网提交</td>
</tr>
<tr>
<td>更新传播</td>
<td>Anti-entropy（对比日志、同步缺失更新）</td>
<td><code>git fetch</code> / <code>git pull</code> / <code>push</code></td>
<td>都是基于“日志比对 + 合并”的同步</td>
</tr>
<tr>
<td>冲突解决</td>
<td>应用层函数解决冲突</td>
<td>人工/算法执行 <code>merge</code> / <code>rebase</code></td>
<td>都需要解决并发修改冲突</td>
</tr>
<tr>
<td>最终一致性</td>
<td>最终所有副本日志一致（通过全序 commit）</td>
<td>最终所有分支 commit DAG 一致</td>
<td>异步收敛、不是实时一致</td>
</tr>
<tr>
<td>版本顺序</td>
<td>Tentative → Committed</td>
<td>本地 commit → main branch merge</td>
<td>只有被合并的才是“全局已提交”</td>
</tr>
</tbody>
</table>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011095015548.png" alt="image.png" /></p>
<table>
<thead>
<tr>
<th>特性</th>
<th>Bayou</th>
<th>现代系统类比</th>
</tr>
</thead>
<tbody>
<tr>
<td>副本模型</td>
<td>全对等（每个节点都可写）</td>
<td>DynamoDB, CouchDB</td>
</tr>
<tr>
<td>一致性</td>
<td>最终一致性</td>
<td>Dynamo-style, CRDT</td>
</tr>
<tr>
<td>更新传播</td>
<td>Anti-entropy（日志同步）</td>
<td>Gossip protocol</td>
</tr>
<tr>
<td>冲突处理</td>
<td>应用层自定义函数</td>
<td>CRDT merge、custom resolver</td>
</tr>
<tr>
<td>时间顺序</td>
<td>Tentative → Committed 两级</td>
<td>“causal + total order” hybrid</td>
</tr>
</tbody>
</table>
<p>简而言之，Bayou有以下几个创新点</p>
<ol>
<li>让application自己定冲突检测逻辑和冲突解决逻辑</li>
<li>提高了高可用性，high availability，代价就是弱一致性，即eventual consistency</li>
</ol>
<p>局限性在于，弱一致性的应用场景比较有限，&quot; Only tolerable if humans are main consumers of data&quot;。同时也会存在对primary node的依赖，primary node需要把committed write信息发给所有节点，增加了通信代价。如果primary node宕机了应该是要选择新的primary node，这里的逻辑paper里没有很明确的说。</p>
<h2>Bayou Example</h2>
<p>这里ppt的例子动画已经非常清晰了
<a href="https://www.cs.princeton.edu/courses/archive/fall22/cos418/docs/precept_05_bayouchord.pdf">https://www.cs.princeton.edu/courses/archive/fall22/cos418/docs/precept_05_bayouchord.pdf</a> </p>
<p>子节点负责阶段写入，主节点负责commit。子节点写入后，数据会临时存储在子节点里。所有新写入一开始都是 tentative（暂定的、未最终确认的）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109181738062.png" alt="image.png" /></p>
<p>随后在anti entropy中，主节点会与更新的子节点说话，更新数据
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109181848077.png" alt="image.png" />
此时主节点会让子节点更新已经commit的更新，主节点则会尊重子节点的commit。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109181855274.png" alt="image.png" /></p>
<p>Bayou 的冲突不是“立刻禁止”，而是：</p>
<p>✅ 先接受所有写入
🔁 之后通过重放（rollback + replay）解决冲突</p>
<p>注意，Bayou 的冲突解决是 应用语义级别的，不是存储系统强行决定。比如两个人同时预定10点会议室，解决方法是人定义的。它核心idea是支持乱序插入、回滚重算的“事务日志系统”</p>
<p>随后主节点提交commit
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109181948388.png" alt="image.png" />
之后子节点都会随着这个commit而更新
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109182001515.png" alt="image.png" /></p>
<h2>Summary</h2>
<p>Bayou 在一致性问题上的解决方法，最核心的创新是最终一致性。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109182510659.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20260109182522104.png" alt="image.png" /></p>
