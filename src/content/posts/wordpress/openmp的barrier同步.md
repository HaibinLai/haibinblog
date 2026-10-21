---
title: "OpenMP的barrier同步"
description: "do_release: if (nested) gomp_barrier_wait (&team->barrier); else gomp_simple_barrier_wait (&pool->threads_dock); /* Decrease the barrier threshold to match the number of threads that should arrive back at the end of thi…"
publishedAt: "2025-05-29 10:27:53"
category: "Micro Topics"
tags: []
draft: false
slug: "openmp的barrier同步"
legacySlug: "openmp的barrier同步"
wordpressId: 823
sourceUrl: "https://www.haibinlaiblog.top/index.php/openmp%e7%9a%84barrier%e5%90%8c%e6%ad%a5/"
commentCount: 0
importedFromWordPress: true
---
<pre><code class="language-CPP"> do_release:
  if (nested)
    gomp_barrier_wait (&amp;team-&gt;barrier);
  else
    gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);

  /* Decrease the barrier threshold to match the number of threads
     that should arrive back at the end of this team.  The extra
     threads should be exiting.  Note that we arrange for this test
     to never be true for nested teams.  If AFFINITY_COUNT is non-zero,
     the barrier as well as gomp_managed_threads was temporarily
     set to NTHREADS + AFFINITY_COUNT.  For NTHREADS &lt; OLD_THREADS_COUNT,
     AFFINITY_COUNT if non-zero will be always at least
     OLD_THREADS_COUNT - NTHREADS.  */
  if (__builtin_expect (nthreads &lt; old_threads_used, 0)
      || __builtin_expect (affinity_count, 0))
    {
      long diff = (long) nthreads - (long) old_threads_used;

      if (affinity_count)
    diff = -affinity_count;

      gomp_simple_barrier_reinit (&amp;pool-&gt;threads_dock, nthreads);

#ifdef HAVE_SYNC_BUILTINS
      __sync_fetch_and_add (&amp;gomp_managed_threads, diff);
#else
      gomp_mutex_lock (&amp;gomp_managed_threads_lock);
      gomp_managed_threads += diff;
      gomp_mutex_unlock (&amp;gomp_managed_threads_lock);
#endif
    }
  if (__builtin_expect (gomp_display_affinity_var, 0))
    {
      if (nested
      || nthreads != old_threads_used
      || force_display)
    {
      gomp_display_affinity_thread (gomp_thread_self (), &amp;thr-&gt;ts,
                    thr-&gt;place);
      if (nested)
        {
          start_data -= nthreads - 1;
          for (i = 1; i &lt; nthreads; ++i)
        {
          gomp_display_affinity_thread (
#ifdef LIBGOMP_USE_PTHREADS
                        start_data-&gt;handle,
#else
                        gomp_thread_self (),
#endif
                        &amp;start_data-&gt;ts,
                        start_data-&gt;place);
          start_data++;
        }
        }
      else
        {
          for (i = 1; i &lt; nthreads; ++i)
        {
          gomp_thread_handle handle
            = gomp_thread_to_pthread_t (pool-&gt;threads[i]);
          gomp_display_affinity_thread (handle, &amp;pool-&gt;threads[i]-&gt;ts,
                        pool-&gt;threads[i]-&gt;place);
        }
        }
    }
    }
  if (__builtin_expect (affinity_thr != NULL, 0)
      &amp;&amp; team-&gt;prev_ts.place_partition_len &gt; 64)
    free (affinity_thr);
}
#endif</code></pre>
<p>你贴出的这段是 <code>gomp_team_start()</code> 的<strong>收尾阶段</strong>，主要在做以下三件事：</p>
<hr />
<h2>✅ 一、同步所有线程：等待子线程启动完成</h2>
<pre><code class="language-c">if (nested)
  gomp_barrier_wait (&amp;team-&gt;barrier);
else
  gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);</code></pre>
<h3>🔍 含义</h3>
<ul>
<li><strong>主线程在这里阻塞，等待所有子线程完成初始化并进入 barrier，同步起来。</strong></li>
<li>如果是嵌套并行（nested），就使用 <code>team-&gt;barrier</code>。</li>
<li>否则（顶层 team），使用 <code>pool-&gt;threads_dock</code>。</li>
</ul>
<p>这是一个 <em>同步屏障（barrier）</em>，<strong>保证主线程和所有工作线程都完成启动再继续后续工作</strong>。</p>
<hr />
<h2>✅ 二、调整 <code>gomp_managed_threads</code> 和 barrier 阈值</h2>
<pre><code class="language-c">if (nthreads &lt; old_threads_used || affinity_count)
{
  long diff = nthreads - old_threads_used;
  if (affinity_count)
    diff = -affinity_count;

  gomp_simple_barrier_reinit (&amp;pool-&gt;threads_dock, nthreads);

  __sync_fetch_and_add (&amp;gomp_managed_threads, diff);
}</code></pre>
<h3>🔍 含义</h3>
<ul>
<li>如果这次需要的线程数少于上次的 <code>old_threads_used</code>，或之前为 affinity 多加了线程，现在要回收。</li>
<li><strong><code>gomp_simple_barrier_reinit()</code>：动态调整 barrier 的阈值</strong>（即需要等待的线程数）。</li>
<li>
<p>同时也更新 <code>gomp_managed_threads</code>（记录当前活跃线程总数）：</p>
<ul>
<li>用 <code>atomic add</code> 或加锁更新。</li>
</ul>
</li>
</ul>
<h3>⚠️ 为什么要减？</h3>
<ul>
<li>有可能线程池中保留了更多线程，但当前 team 只需要一部分。</li>
<li><strong>这些多余线程要主动退出</strong>，否则主线程等待的 barrier 永远达不到目标数。</li>
</ul>
<hr />
<h2>✅ 三、显示线程亲和性（如果需要）</h2>
<pre><code class="language-c">if (gomp_display_affinity_var)
{
  if (nested || nthreads != old_threads_used || force_display)
  {
    gomp_display_affinity_thread(...);
  }
}</code></pre>
<h3>🔍 含义</h3>
<ul>
<li>若 <code>OMP_DISPLAY_AFFINITY=TRUE</code>，就打印每个线程的绑定情况（place 编号）。</li>
<li>这部分只是调试用途，<strong>无功能性影响</strong>。</li>
</ul>
<hr />
<h2>✅ 四、清理大数组（affinity_thr）</h2>
<pre><code class="language-c">if (affinity_thr != NULL &amp;&amp; team-&gt;prev_ts.place_partition_len &gt; 64)
  free (affinity_thr);</code></pre>
<ul>
<li>释放为 place 分配的大数组，避免内存泄漏。</li>
<li><code>place_partition_len &gt; 64</code> 是经验阈值，小数组不释放是为了复用。</li>
</ul>
<hr />
<h2>🔚 总结一句话</h2>
<blockquote>
<p>这一部分的<strong>核心目的是主线程阻塞等待所有线程就绪、同步 barrier，然后根据需要动态调整线程和 barrier 状态，并完成资源清理与调试输出。</strong></p>
</blockquote>
<hr />
<p>如果你需要我把完整启动流程整理成图或伪代码流程我也可以做，告诉我你的偏好。</p>
