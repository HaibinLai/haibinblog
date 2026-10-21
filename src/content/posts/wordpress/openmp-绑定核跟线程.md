---
title: "OpenMP 绑定核跟线程"
description: "for (; i < nthreads; ++i) { int err; start_data->ts.place_partition_off = thr->ts.place_partition_off; start_data->ts.place_partition_len = thr->ts.place_partition_len; start_data->place = 0; if ( (gomp_places_list != N…"
publishedAt: "2025-05-29T02:18:23Z"
category: "Micro Topics"
categories: ["Micro Topics"]
tags: []
author: "GB"
draft: false
slug: "openmp-绑定核跟线程"
legacySlug: "openmp-绑定核跟线程"
oldSlugs: []
wordpressId: 821
sourceUrl: "https://www.haibinlaiblog.top/index.php/openmp-%e7%bb%91%e5%ae%9a%e6%a0%b8%e8%b7%9f%e7%ba%bf%e7%a8%8b/"
commentCount: 0
viewCount: 694
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<pre><code class="language-CPP">  for (; i &lt; nthreads; ++i)
    {
      int err;

      start_data-&gt;ts.place_partition_off = thr-&gt;ts.place_partition_off;
      start_data-&gt;ts.place_partition_len = thr-&gt;ts.place_partition_len;
      start_data-&gt;place = 0;
      if ( (gomp_places_list != NULL, 0))
        {
      switch (bind)
        {
        case omp_proc_bind_true:
        case omp_proc_bind_close:
          if (k == s)
        {
          ++p;
          if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
          k = 1;
          if (i == nthreads - rest)
            s = 1;
        }
          else
        ++k;
          break;
        case omp_proc_bind_master:
          break;
        case omp_proc_bind_spread:
          if (k == 0)
        {
          /* T &lt;= P.  */
          if (p &lt; rest)
            p += s + 1;
          else
            p += s;
          if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
          start_data-&gt;ts.place_partition_off = p;
          if (p &lt; rest)
            start_data-&gt;ts.place_partition_len = s + 1;
          else
            start_data-&gt;ts.place_partition_len = s;
        }
          else
        {
          /* T &gt; P.  */
          if (k == s)
            {
              ++p;
              if (p == (team-&gt;prev_ts.place_partition_off
                + team-&gt;prev_ts.place_partition_len))
            p = team-&gt;prev_ts.place_partition_off;
              k = 1;
              if (i == nthreads - rest)
            s = 1;
            }
          else
            ++k;
          start_data-&gt;ts.place_partition_off = p;
          start_data-&gt;ts.place_partition_len = 1;
        }
          break;
        }
      start_data-&gt;place = p + 1;
      if (affinity_thr != NULL &amp;&amp; pool-&gt;threads[i] != NULL)
        continue;
      gomp_init_thread_affinity (attr, p);
    }</code></pre>
<p>这段代码是 <code>gomp_team_start()</code> 中为新线程进行 <strong>place 绑定（affinity placement）</strong> 的关键部分。它的核心作用是：<strong>根据 OpenMP 的 <code>proc_bind</code> 策略，为每个新线程分配合适的 CPU 运行位置（place），并初始化线程亲和性（thread affinity）</strong>。</p>
<hr />
<h3>✅ 主要功能概览</h3>
<p>对于每个线程 <code>i ∈ [old_threads_used, nthreads)</code>：</p>
<ol>
<li>
<p><strong>默认继承 place_partition 信息</strong>：</p>
<pre><code class="language-c">start_data->ts.place_partition_off = thr->ts.place_partition_off;
start_data->ts.place_partition_len = thr->ts.place_partition_len;
start_data->place = 0;</code></pre>
</li>
<li>
<p><strong>如果启用了 place 列表（<code>gomp_places_list != NULL</code>）</strong>，则根据 <code>proc_bind</code> 策略重新计算 place 绑定：</p>
<pre><code class="language-c">switch (bind) {
 case omp_proc_bind_true:
 case omp_proc_bind_close:
 case omp_proc_bind_master:
 case omp_proc_bind_spread:</code></pre>
</li>
<li>
<p><strong>计算当前线程应绑定的 place 编号 <code>p</code>，并更新其线程结构体中的 <code>place_partition_off/len</code></strong>。</p>
</li>
<li>
<p><strong>最终调用 <code>gomp_init_thread_affinity(attr, p)</code> 完成线程 affinity 设置</strong>。</p>
</li>
</ol>
<hr />
<h3>🔧 各个 <code>bind</code> 策略解释</h3>
<table>
<thead>
<tr>
<th>策略名</th>
<th>行为说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>omp_proc_bind_master</code></td>
<td>所有线程使用与 master 相同的 place，默认不更改 <code>p</code>。</td>
</tr>
<tr>
<td><code>omp_proc_bind_true</code> / <code>close</code></td>
<td>尽量将线程绑定到紧密相邻的 place，通过 <code>k</code> 和 <code>s</code> 控制周期性换组。</td>
</tr>
<tr>
<td><code>omp_proc_bind_spread</code></td>
<td>尽量将线程均匀分布到不同 place，尤其在线程数 &gt; place 数时将 place 拆分为单线程。</td>
</tr>
</tbody>
</table>
<hr />
<h3>🧠 核心变量含义</h3>
<table>
<thead>
<tr>
<th>变量名</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>p</code></td>
<td>当前 place 编号，表示线程应该被分配的 CPU core group 索引</td>
</tr>
<tr>
<td><code>k</code></td>
<td>当前在某个 place 上放了几个线程</td>
</tr>
<tr>
<td><code>s</code></td>
<td>每个 place 应分配多少线程（基本值）</td>
</tr>
<tr>
<td><code>rest</code></td>
<td>多余线程个数，用于在部分 place 上分配 <code>s+1</code> 个线程</td>
</tr>
<tr>
<td><code>start_data-&gt;place</code></td>
<td>最终分配给线程的逻辑编号（place id + 1）</td>
</tr>
</tbody>
</table>
<hr />
<h3>✅ 特别判断：是否需要创建新线程</h3>
<pre><code class="language-c">if (affinity_thr != NULL &amp;&amp; pool-&gt;threads[i] != NULL)
  continue;</code></pre>
<p>如果 affinity 线程池中已经有复用线程，就跳过 <code>pthread_create</code>，表示线程池线程可被复用，不需要新建。</p>
<hr />
<h3>🔚 总结一句话</h3>
<blockquote>
<p>这一段代码的主要作用是：<strong>根据不同的 <code>proc_bind</code> 策略计算每个线程应绑定的 CPU place，并调用亲和性设置函数实现线程绑定</strong>，从而实现 OpenMP 的线程拓扑感知调度。</p>
</blockquote>
