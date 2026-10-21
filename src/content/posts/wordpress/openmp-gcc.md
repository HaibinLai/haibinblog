---
title: "OpenMP在gcc里是如何启动的？"
description: "图片未显示锁竞争（Lock Contention = 0s），表明 PyTorch 或 MKL 可能绕过 GOMP 的全局任务锁，使用原子操作或分区任务。 /* This structure is used to communicate across pthread_create. */ struct gomp_thread_start_data { void (*fn) (void *); void *fn_data; struct…"
publishedAt: "2025-05-23T09:42:20Z"
updatedAt: "2025-05-23T09:42:38Z"
category: "Compilers"
categories: ["Compilers"]
tags: ["OpenMP"]
author: "GB"
draft: false
slug: "openmp-gcc"
legacySlug: "openmp-gcc"
oldSlugs: ["openmp在gcc里是如何启动的？"]
wordpressId: 806
sourceUrl: "https://www.haibinlaiblog.top/index.php/openmp-gcc/"
commentCount: 0
viewCount: 745
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<ul>
<li>
<ul>
<li>图片未显示锁竞争（Lock Contention = 0s），表明 PyTorch 或 MKL 可能绕过 GOMP 的全局任务锁，使用原子操作或分区任务。</li>
</ul>
</li>
</ul>
<pre><code class="language-CPP">/* This structure is used to communicate across pthread_create.  */

struct gomp_thread_start_data
{
  void (*fn) (void *);
  void *fn_data;
  struct gomp_team_state ts;
  struct gomp_task *task;
  struct gomp_thread_pool *thread_pool;
  unsigned int place;
  unsigned int num_teams;
  unsigned int team_num;
  bool nested;
  pthread_t handle;
};

/* This function is a pthread_create entry point.  This contains the idle
   loop in which a thread waits to be called up to become part of a team.  */

static void *
gomp_thread_start (void *xdata)
{
  struct gomp_thread_start_data *data = xdata;
  struct gomp_thread *thr;
  struct gomp_thread_pool *pool;
  void (*local_fn) (void *);
  void *local_data;

#if defined HAVE_TLS || defined USE_EMUTLS
  thr = &amp;gomp_tls_data;
#else
  struct gomp_thread local_thr;
  thr = &amp;local_thr;
#endif
  gomp_sem_init (&amp;thr-&gt;release, 0);

  /* Extract what we need from data.  */
  local_fn = data-&gt;fn;
  local_data = data-&gt;fn_data;
  thr-&gt;thread_pool = data-&gt;thread_pool;
  thr-&gt;ts = data-&gt;ts;
  thr-&gt;task = data-&gt;task;
  thr-&gt;place = data-&gt;place;
  thr-&gt;num_teams = data-&gt;num_teams;
  thr-&gt;team_num = data-&gt;team_num;
#ifdef GOMP_NEEDS_THREAD_HANDLE
  thr-&gt;handle = data-&gt;handle;
#endif
#if !(defined HAVE_TLS || defined USE_EMUTLS)
  pthread_setspecific (gomp_tls_key, thr);
#endif

  thr-&gt;ts.team-&gt;ordered_release[thr-&gt;ts.team_id] = &amp;thr-&gt;release;

  /* Make thread pool local. */
  pool = thr-&gt;thread_pool;

  if (data-&gt;nested)
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      gomp_barrier_wait (&amp;team-&gt;barrier);

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);
      gomp_barrier_wait_last (&amp;team-&gt;barrier);
    }
  else
    {
      pool-&gt;threads[thr-&gt;ts.team_id] = thr;

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);
      do
    {
      struct gomp_team *team = thr-&gt;ts.team;
      struct gomp_task *task = thr-&gt;task;

      local_fn (local_data);
      gomp_team_barrier_wait_final (&amp;team-&gt;barrier);
      gomp_finish_task (task);

      gomp_simple_barrier_wait (&amp;pool-&gt;threads_dock);

      local_fn = thr-&gt;fn;
      local_data = thr-&gt;data;
      thr-&gt;fn = NULL;
    }
      while (local_fn);
    }

  gomp_sem_destroy (&amp;thr-&gt;release);
  pthread_detach (pthread_self ());
  thr-&gt;thread_pool = NULL;
  thr-&gt;task = NULL;
  return NULL;
}
#endif</code></pre>
<ul>
<li><strong>适用场景</strong>：线程属于顶级并行区域，通常与线程池关联。</li>
<li>
<p><strong>流程</strong>：</p>
<ol>
<li><strong>注册线程</strong>：将当前线程存储到线程池的 threads 数组中，索引为 team_id。</li>
<li><strong>初始屏障</strong>：调用 gomp_simple_barrier_wait，等待线程池中的所有线程到达 threads_dock 屏障。</li>
<li><strong>循环执行任务</strong>：
<ul>
<li>执行 local_fn(local_data)，运行分配的并行任务。</li>
<li>调用 gomp_team_barrier_wait_final，等待团队完成任务。</li>
<li>调用 gomp_finish_task，清理任务状态。</li>
<li>再次调用 gomp_simple_barrier_wait，等待线程池分配新任务。</li>
<li>更新 local_fn 和 local_data 从 thr-&gt;fn 和 thr-&gt;data（可能由线程池分配新任务）。</li>
<li>如果 local_fn 非空，循环继续；否则退出。</li>
</ul></li>
</ol>
<ul>
<li><strong>线程池重用</strong>：非嵌套线程在完成任务后不立即退出，而是等待线程池分配新任务，体现了 OpenMP 的线程池优化。</li>
</ul>
</li>
</ul>
<pre><code class="language-CPP">static inline void
gomp_simple_barrier_wait (gomp_simple_barrier_t *bar)
{
  gomp_barrier_wait (&amp;bar-&gt;bar);
}</code></pre>
<pre><code class="language-CPP">void
gomp_barrier_wait (gomp_barrier_t *barrier)
{
  gomp_barrier_wait_end (barrier, gomp_barrier_wait_start (barrier));
}</code></pre>
<pre><code class="language-cpp">void
gomp_barrier_wait_end (gomp_barrier_t *bar, gomp_barrier_state_t state)
{
  unsigned int n;

  if (state &amp; BAR_WAS_LAST)
    {
      n = --bar-&gt;arrived;
      if (n &gt; 0)
    {
      do
        gomp_sem_post (&amp;bar-&gt;sem1);
      while (--n != 0);
      gomp_sem_wait (&amp;bar-&gt;sem2);
    }
      gomp_mutex_unlock (&amp;bar-&gt;mutex1);
    }
  else
    {
      gomp_mutex_unlock (&amp;bar-&gt;mutex1);
      gomp_sem_wait (&amp;bar-&gt;sem1);

#ifdef HAVE_SYNC_BUILTINS
      n = __sync_add_and_fetch (&amp;bar-&gt;arrived, -1);
#else
      gomp_mutex_lock (&amp;bar-&gt;mutex2);
      n = --bar-&gt;arrived;
      gomp_mutex_unlock (&amp;bar-&gt;mutex2);
#endif

      if (n == 0)
    gomp_sem_post (&amp;bar-&gt;sem2);
    }
}</code></pre>
