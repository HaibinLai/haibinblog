---
title: "GNU OpenMP是怎么结束的"
description: "gcc/libgomp/config/posix/simple-bar.h at 4e47e2f833732c5d9a3c3e69dc753f99b3a56737 · gcc-mirror/gcc gcc/libgomp/parallel.c at e2bf0b3910de7e65363435f0a7fa606e2448a677 · gcc-mirror/gcc void GOMP_parallel_end (void) { stru…"
publishedAt: "2025-06-04 01:18:35"
category: "Micro Topics"
tags: []
draft: false
slug: "gnu-openmp是怎么结束的"
legacySlug: "gnu-openmp是怎么结束的"
wordpressId: 835
sourceUrl: "https://www.haibinlaiblog.top/index.php/gnu-openmp%e6%98%af%e6%80%8e%e4%b9%88%e7%bb%93%e6%9d%9f%e7%9a%84/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="https://github.com/gcc-mirror/gcc/blob/4e47e2f833732c5d9a3c3e69dc753f99b3a56737/libgomp/config/posix/simple-bar.h#L58">gcc/libgomp/config/posix/simple-bar.h at 4e47e2f833732c5d9a3c3e69dc753f99b3a56737 · gcc-mirror/gcc</a></p>
<p><a href="https://github.com/gcc-mirror/gcc/blob/e2bf0b3910de7e65363435f0a7fa606e2448a677/libgomp/parallel.c#L138">gcc/libgomp/parallel.c at e2bf0b3910de7e65363435f0a7fa606e2448a677 · gcc-mirror/gcc</a></p>
<pre><code class="language-CPP">void
GOMP_parallel_end (void)
{
  struct gomp_task_icv *icv = gomp_icv (false);
  if (__builtin_expect (icv-&gt;thread_limit_var != UINT_MAX, 0))
    {
      struct gomp_thread *thr = gomp_thread ();
      struct gomp_team *team = thr-&gt;ts.team;
      unsigned int nthreads = team ? team-&gt;nthreads : 1;
      gomp_team_end ();
      if (nthreads &gt; 1)
    {
      /* If not nested, there is just one thread in the
         contention group left, no need for atomicity.  */
      if (thr-&gt;ts.team == NULL)
        thr-&gt;thread_pool-&gt;threads_busy = 1;
      else
        {
#ifdef HAVE_SYNC_BUILTINS
          __sync_fetch_and_add (&amp;thr-&gt;thread_pool-&gt;threads_busy,
                    1UL - nthreads);
#else
          gomp_mutex_lock (&amp;gomp_managed_threads_lock);
          thr-&gt;thread_pool-&gt;threads_busy -= nthreads - 1;
          gomp_mutex_unlock (&amp;gomp_managed_threads_lock);
#endif
        }
    }
    }
  else
    gomp_team_end ();
}
ialias (GOMP_parallel_end)</code></pre>
<p><code>GOMP_parallel_end()</code> 是 GNU OpenMP（libgomp）用于结束一个 <code>parallel</code> 区域的核心函数。它的主要功能是拆解线程 team，回收资源，并更新线程池的使用情况。下面我将详细解释这个函数的逻辑，以及它是如何结束 parallel region 的。</p>
<hr />
<h2>🔧 函数功能总览</h2>
<pre><code class="language-c">void GOMP_parallel_end(void)</code></pre>
<p>该函数用于标志一个 OpenMP <code>parallel</code> 区域的结束。其核心职责包括：</p>
<ol>
<li>
<p><strong>判断是否启用了 <code>thread_limit</code>：</strong></p>
<ul>
<li>如果设置了 <code>thread_limit</code>（即 <code>icv-&gt;thread_limit_var != UINT_MAX</code>），则需要额外处理线程池的 <code>threads_busy</code> 字段。</li>
</ul>
</li>
<li>
<p><strong>调用 <code>gomp_team_end()</code>：</strong></p>
<ul>
<li>回收线程 team、清理相关数据结构，完成同步。</li>
</ul>
</li>
<li>
<p><strong>更新 <code>threads_busy</code>（仅当启用 thread_limit）：</strong></p>
<ul>
<li>如果 <code>nthreads &gt; 1</code>，则更新 <code>threads_busy</code>，即“当前线程池中仍处于忙状态的线程数”。</li>
</ul>
</li>
</ol>
<hr />
<h2>📜 分步骤详解</h2>
<h3>1️⃣ 获取当前线程的 ICV（Implicit Control Variables）</h3>
<pre><code class="language-c">struct gomp_task_icv *icv = gomp_icv(false);</code></pre>
<ul>
<li>获取当前线程的控制变量（如 <code>thread_limit</code>）。</li>
<li><code>false</code> 表示不为 task 创建新的 ICV。</li>
</ul>
<hr />
<h3>2️⃣ 检查是否设置了 <code>thread_limit</code></h3>
<pre><code class="language-c">if (__builtin_expect (icv-&gt;thread_limit_var != UINT_MAX, 0))</code></pre>
<ul>
<li>如果 <code>thread_limit_var</code> 设置了上限（即不是默认的 <code>UINT_MAX</code>），需要进行额外的线程池状态更新。</li>
<li>这种情况常出现在 <code>OMP_THREAD_LIMIT=n</code> 的环境变量设定下。</li>
</ul>
<hr />
<h3>3️⃣ 调用 <code>gomp_team_end()</code>：拆解线程团队</h3>
<pre><code class="language-c">gomp_team_end();</code></pre>
<ul>
<li>
<p>这是线程区域结束的核心函数，负责：</p>
<ul>
<li>等待所有 worker thread 完成任务；</li>
<li>清理 <code>struct gomp_team</code> 数据结构；</li>
<li>重置当前线程的 team 状态。</li>
</ul>
</li>
</ul>
<h3>4️⃣ 更新线程池的忙碌线程数</h3>
<pre><code class="language-c">if (nthreads &gt; 1) {
  if (thr-&gt;ts.team == NULL)
    thr-&gt;thread_pool-&gt;threads_busy = 1;
  else {
    __sync_fetch_and_add(&amp;thr-&gt;thread_pool-&gt;threads_busy, 1UL - nthreads);
  }
}</code></pre>
<h4>✅ 情况 1：当前线程不再处于 nested team 中</h4>
<pre><code class="language-c">if (thr-&gt;ts.team == NULL)
  thr-&gt;thread_pool-&gt;threads_busy = 1;</code></pre>
<ul>
<li>说明已经退回最外层线程，线程池只剩这个线程在执行（即主线程）。</li>
</ul>
<h4>🔄 情况 2：还在嵌套并行中</h4>
<pre><code class="language-c">__sync_fetch_and_add(&amp;thr-&gt;thread_pool-&gt;threads_busy, 1UL - nthreads);</code></pre>
<ul>
<li>原子操作减少线程池中繁忙线程的计数。</li>
<li>如果不支持原子指令，则使用互斥锁手动更新。</li>
</ul>
<hr />
<h3>5️⃣ 默认情况（无 thread_limit）</h3>
<pre><code class="language-c">else
  gomp_team_end();</code></pre>
<ul>
<li>如果没有启用 <code>thread_limit</code>，只需调用 <code>gomp_team_end()</code>，无需修改线程池状态。</li>
</ul>
<hr />
<h2>🧠 小结：GNU OpenMP 如何结束 parallel region？</h2>
<ol>
<li><code>GOMP_parallel_end()</code> 被主线程调用，表明 parallel region 结束。</li>
<li>它通过 <code>gomp_team_end()</code>：
<ul>
<li>等待所有线程完成；（原子更新）</li>
<li>销毁 team 数据结构；</li>
<li>重置线程状态。</li>
</ul></li>
<li>如果启用了 <code>thread_limit</code>，还会更新线程池中活跃线程数量 <code>threads_busy</code>，以便合理安排后续线程复用。</li>
</ol>
<hr />
<p>如果你正在研究 libgomp 的线程池管理或嵌套并行行为（特别是 <code>thread_limit</code> 和 <code>proc_bind</code>），这部分逻辑与 <code>GOMP_parallel_start()</code> 和 <code>gomp_team_start()</code> 紧密配合，值得一起分析。</p>
<p>需要我进一步剖析 <code>gomp_team_end()</code> 的具体行为，或解释如何从调用到回收线程资源的完整流程吗？</p>
