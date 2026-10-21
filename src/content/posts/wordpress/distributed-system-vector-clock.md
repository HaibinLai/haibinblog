---
title: "Distributed System 3: Vector Clock"
description: "Review: Time is important in Distributed, for determine sequence. But we can't find a sync time for everyone. Vector Clock Lamport didn't solve: Solution: use a vector clock 两个向量一样：同一个事件 一个向量小于另一个向量：所有元素都小于等于，但是不能全部等于 并…"
publishedAt: "2025-10-11 09:59:19"
updatedAt: "2025-10-11 10:01:48"
category: "Distributed Systems"
tags: ["Distributed System"]
draft: false
slug: "distributed-system-vector-clock"
legacySlug: "distributed-system-vector-clock"
wordpressId: 1012
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-system-vector-clock/"
commentCount: 0
importedFromWordPress: true
---
<p>Review:</p>
<p>Time is important in Distributed, for determine sequence.
But we can't find a sync time for everyone.</p>
<h2>Vector Clock</h2>
<p>Lamport didn't solve:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011081500807.png" alt="image.png" /></p>
<p>Solution:
use a vector clock</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011081531201.png" alt="image.png" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011081631284.png" alt="image.png" />
两个向量一样：同一个事件
一个向量小于另一个向量：所有元素都小于等于，但是不能全部等于</p>
<p>并发事件：中间有的元素小，有的元素大，如a和e</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011081942766.png" alt="image.png" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251011082115749.png" alt="image.png" /></p>
<p>Lamport 和 vector 区别：有多个数可以处理因果关系</p>
<p>The reading paper is Lamport's paper about Lamport time. He introduced the main idea in last class and gave a formal mathematical proof on the theorem.
<a href="https://lamport.azurewebsites.net/pubs/pubs.html#time-clocks">https://lamport.azurewebsites.net/pubs/pubs.html#time-clocks</a></p>
<h2>现实设计隐藏了这些idea</h2>
<p>用 <strong>Kafka</strong> 做“全序多播（Totally-Ordered Multicast）”时，核心认知是：</p>
<ul>
<li>
<p><strong>Kafka 只保证“分区内（partition-local）顺序”</strong>，不保证跨分区的全局顺序。</p>
</li>
<li>
<p>想要“所有副本都按同一顺序交付”，最简单且工程可行的是：<strong>用单分区主题</strong>，并让<strong>每个副本用不同的 consumer group</strong> 订阅同一主题（这样每个副本都会收到全部消息且顺序一致）。</p>
</li>
</ul>
<p>下面给你一套可直接跑的 Java 示例（纯 Kafka 客户端，不用 Streams），演示如何实现一个<strong>小规模可用</strong>的“全序多播”：</p>
<hr />
<h1>方案 A（简单可靠，适合中小规模）</h1>
<p><strong>单分区主题 = 全局全序</strong></p>
<ul>
<li>
<p>创建主题时 <code>--partitions 1</code>，Kafka 天然保证该分区内的严格顺序。</p>
</li>
<li>
<p>为了“多播”（每个副本都收到消息），<strong>每个副本使用不同 group.id</strong>（或直接 <code>assign</code>）订阅同一个主题。</p>
</li>
<li>
<p>为了可靠性与幂等：生产端开 <strong>幂等 + 事务</strong>；消费端用 <code>isolation.level=read_committed</code>。</p>
</li>
</ul>
<h3>1) 创建主题（命令行）</h3>
<pre><code class="language-bash">kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic totord-demo \
  --partitions 1 \
  --replication-factor 3</code></pre>
<h3>2) 生产者（全序广播）</h3>
<pre><code class="language-java">// File: ToProducer.java
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.serialization.StringSerializer;
import java.util.Properties;
import java.util.Scanner;

public class ToProducer {
  public static void main(String[] args) {
    Properties p = new Properties();
    p.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, &quot;localhost:9092&quot;);
    p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

    // 全序 &amp; 可靠性关键参数
    p.put(ProducerConfig.ACKS_CONFIG, &quot;all&quot;);
    p.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, &quot;true&quot;);
    p.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1); // 保序
    p.put(ProducerConfig.RETRIES_CONFIG, Integer.toString(Integer.MAX_VALUE));
    // 事务：保证“只读到已提交的消息”
    p.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, &quot;totord-producer-1&quot;);

    try (KafkaProducer&lt;String,String&gt; producer = new KafkaProducer&lt;&gt;(p);
         Scanner scanner = new Scanner(System.in)) {
      producer.initTransactions();
      System.out.println(&quot;Type lines to multicast (Ctrl-D/Ctrl-Z to end)…&quot;);
      while (scanner.hasNextLine()) {
        String line = scanner.nextLine();
        producer.beginTransaction();
        // 单分区主题：不需要 key 也全序；若要做“每发送方可追踪”，可用 key=senderId
        ProducerRecord&lt;String,String&gt; rec = new ProducerRecord&lt;&gt;(&quot;totord-demo&quot;, null, line);
        producer.send(rec).get(); // 阻塞拿到结果，进一步保证局部程序顺序
        producer.commitTransaction();
        System.out.println(&quot;Sent: &quot; + line);
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}</code></pre>
<h3>3) 消费者（每个副本都看到相同顺序）</h3>
<pre><code class="language-java">// File: ToConsumer.java
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import java.time.Duration;
import java.util.*;

public class ToConsumer {
  public static void main(String[] args) {
    // 每个副本用不同 group.id（或传参），以“多播”效果：所有副本都能消费到全部消息
    String group = args.length &gt; 0 ? args[0] : &quot;totord-replica-&quot; + UUID.randomUUID();

    Properties c = new Properties();
    c.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, &quot;localhost:9092&quot;);
    c.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
    c.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
    c.put(ConsumerConfig.GROUP_ID_CONFIG, group);

    // 只读取已提交的事务消息，避免“脏读”
    c.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, &quot;read_committed&quot;);

    // 手动提交，交付后再提交，贴近“交付 = 可见”的模型
    c.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, &quot;false&quot;);
    // 避免重平衡造成并发处理混乱（小样例中也可忽略）
    c.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, &quot;earliest&quot;);

    try (KafkaConsumer&lt;String,String&gt; consumer = new KafkaConsumer&lt;&gt;(c)) {
      consumer.subscribe(Collections.singletonList(&quot;totord-demo&quot;));
      System.out.println(&quot;Replica group: &quot; + group + &quot; started.&quot;);
      while (true) {
        ConsumerRecords&lt;String,String&gt; records = consumer.poll(Duration.ofMillis(500));
        for (ConsumerRecord&lt;String,String&gt; r : records) {
          // Kafka 对“同一分区”的消息天然按 offset 顺序回放
          System.out.printf(&quot;Delivered (p=%d, off=%d): %s%n&quot;, r.partition(), r.offset(), r.value());
          // 在这里做你的“应用交付”
        }
        consumer.commitSync();
      }
    }
  }
}</code></pre>
<p>运行：</p>
<pre><code class="language-bash"># 终端1（生产者）
javac ToProducer.java &amp;&amp; java ToProducer

# 终端2（副本1）
javac ToConsumer.java &amp;&amp; java ToConsumer replica-A

# 终端3（副本2）
java ToConsumer replica-B</code></pre>
<p>你会看到 <strong>replica-A</strong> 和 <strong>replica-B</strong> 的输出顺序完全一致（因为单分区）。</p>
<hr />
<h2>常见问答</h2>
<p><strong>Q1：吞吐会不会受限？</strong><br />
会。<strong>单分区</strong>是实现“全局全序”的简单方式，但吞吐受限于该分区的单 leader。</p>
<ul>
<li>如果吞吐不够，可<strong>增大消息大小/批量（linger.ms、batch.size）</strong>，或<strong>加机器提高 broker I/O</strong>。</li>
<li>真要更大规模的“全局全序”，请看方案 B。</li>
</ul>
<p><strong>Q2：崩溃&amp;重启后会乱序吗？</strong><br />
不会。Kafka 用偏移量（offset）严格线性化分区日志。启用 <strong>幂等 + acks=all + 事务</strong>，消费者 <code>read_committed</code>，即可获得“端到端一次性可见”的效果（Exactly-Once 语义在 Streams 下最完整，这里是最小化示例）。</p>
<p><strong>Q3：多个发送者并发发送，会不会互相打乱？</strong><br />
不会超出“全序日志”的定义——所有消息在该分区内被一个<strong>统一的顺序</strong>线性化。你不需要 Lamport 时钟；Kafka 的分区日志就是“全局序列”。</p>
<hr />
<h1>方案 B（要更大吞吐又想“全局全序”）</h1>
<p>Kafka <strong>没有</strong>原生“跨分区全局顺序”。常见工程做法：</p>
<ol>
<li>
<p><strong>Sequencer 单分区</strong>：</p>
<ul>
<li>多生产者先写到一个<strong>高并发输入主题（多分区）</strong>；</li>
<li>一个“排序器（sequencer）服务”<strong>从所有分区读取</strong>，为每条消息分配<strong>全局序号</strong>，然后<strong>写入一个单分区“有序主题”</strong>。</li>
<li>消费端只读“有序主题”。</li>
<li>本质上还是单分区瓶颈，但把入口与排序解耦，利于扩展和管控。</li>
</ul>
</li>
<li>
<p><strong>业务可分片</strong>：</p>
<ul>
<li>如果业务允许“按 key 独立全序”，那就<strong>按 key 分区</strong>（Kafka 天生保证“同 key 同分区”顺序）。</li>
<li>再配合上层聚合逻辑实现“跨 key 的最终一致”。</li>
</ul>
</li>
<li>
<p><strong>共识/日志复制系统</strong>：</p>
<ul>
<li>将“全局全序”交给专门的<strong>共识层</strong>（如 Raft/Paxos 的日志），Kafka 作为复制与分发层；</li>
<li>复杂度提升，但可实现强一致下的大规模全序。</li>
</ul>
</li>
</ol>
<hr />
<h2>小结</h2>
<ul>
<li><strong>要“所有副本看到同一顺序”</strong>：<strong>单分区主题 + 每个副本不同 group</strong> 就能实现，最简单稳定。</li>
<li><strong>要“全局全序 + 高吞吐”</strong>：需要 <strong>Sequencer/共识层</strong> 之类的额外架构；Kafka 本身不保跨分区顺序。</li>
<li><strong>你不需要显式 Lamport</strong>：Kafka 的分区日志天然就是一个“全序日志”。</li>
</ul>
<p>如果你想继续，我可以把上面的 <strong>Sequencer 模式</strong> 也配一版最小可运行的 Java 原型（一个消费者融合多分区、写到单分区“ordered”主题），你选择更贴近你场景的那版即可。</p>
