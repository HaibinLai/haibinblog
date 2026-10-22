---
title: "gcc是如何实现OpenMP parallel for的"
description: "学习网页 本次我们主要会聚焦team.c 和loop.c: gcc/libgomp/loop.c at master · gcc-mirror/gcc gcc/libgomp/team.c at master · gcc-mirror/gcc OpenMP For Construct dynamic 调度方式实现原理和源码分析 - 一无是处的研究僧 - 博客园 TL; DR TL;DR： 大概idea就是，先分块，后并行。并行的模块我…"
publishedAt: "2025-06-02T11:15:05Z"
category: "Compilers"
categories: ["Compilers"]
tags: []
author: "GB"
draft: false
slug: "gcc是如何实现openmp-parallel-for的"
legacySlug: "gcc是如何实现openmp-parallel-for的"
oldSlugs: []
wordpressId: 827
sourceUrl: "https://www.haibinlaiblog.top/index.php/gcc%e6%98%af%e5%a6%82%e4%bd%95%e5%ae%9e%e7%8e%b0openmp-parallel-for%e7%9a%84/"
commentCount: 0
viewCount: 1157
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84.webp"
---
<h2>学习网页</h2>
<p>本次我们主要会聚焦team.c 和loop.c:
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/loop.c#L40">gcc/libgomp/loop.c at master · gcc-mirror/gcc</a>
<a href="https://github.com/gcc-mirror/gcc/blob/master/libgomp/team.c#L170">gcc/libgomp/team.c at master · gcc-mirror/gcc</a></p>
<p><a href="https://www.cnblogs.com/Chang-LeHung/p/17089310.html">OpenMP For Construct dynamic 调度方式实现原理和源码分析 - 一无是处的研究僧 - 博客园</a></p>
<h2>TL; DR</h2>
<p>TL;DR： 大概idea就是，先分块，后并行。并行的模块我们上节课已经学习过了</p>
<h2>例子与入口API</h2>
<p>整体结构：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-001-57a6b51a9367.webp" alt="" />
<strong>for这里主要分为两个层。API层和Execute func层。GCC在看到你的代码后，会在API层里选择适合你的代码的API层。随后他们将统一调动execute func层</strong>，其内部又有多层的逻辑（后面会分析）。</p>
<p>我们先从cpp的matmul讲起</p>
<pre><code class="language-CPP">#include &lt;omp.h&gt;
#include &lt;iostream&gt;
#include &lt;vector&gt;

void matrix_multiply(const std::vector&lt;std::vector&lt;double&gt;&gt;&amp; A,
                    const std::vector&lt;std::vector&lt;double&gt;&gt;&amp; B,
                    std::vector&lt;std::vector&lt;double&gt;&gt;&amp; C,
                    int rows_A, int cols_A, int cols_B) {
    #pragma omp parallel for
    for (int i = 0; i &lt; rows_A; ++i) {
        for (int j = 0; j &lt; cols_B; ++j) {
            double sum = 0.0;
            for (int k = 0; k &lt; cols_A; ++k) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
}

int main() {
    int rows_A = 100, cols_A = 100, cols_B = 100;
    std::vector&lt;std::vector&lt;double&gt;&gt; A(rows_A, std::vector&lt;double&gt;(cols_A, 1.0));
    std::vector&lt;std::vector&lt;double&gt;&gt; B(cols_A, std::vector&lt;double&gt;(cols_B, 1.0));
    std::vector&lt;std::vector&lt;double&gt;&gt; C(rows_A, std::vector&lt;double&gt;(cols_B, 0.0));

    double start_time = omp_get_wtime();
    matrix_multiply(A, B, C, rows_A, cols_A, cols_B);
    double end_time = omp_get_wtime();

    std::cout &lt;&lt; &quot;Time taken: &quot; &lt;&lt; end_time - start_time &lt;&lt; &quot; seconds\n&quot;;
    return 0;
}</code></pre>
<p>循环虽然外部写了循环100次，但是内部 <code>for (int i = 0; i &lt; rows_A; ++i)</code> <code>for (int j = 0; j &lt; cols_B; ++j)</code>没有写的情况下，大部分时候编译器会认为这是运行时决定，会把这个<code>for</code> 变为 <code>GOMP_parallel_loop_runtime_start</code> （欢迎大家debug）（就算不是也没关系，其他的几个实现都是大同小易的）：</p>
<pre><code class="language-CPP">void
GOMP_parallel_loop_runtime_start (void (*fn) (void *), void *data,
                  unsigned num_threads, long start, long end,
                  long incr)
{
  struct gomp_task_icv *icv = gomp_icv (false);
  gomp_parallel_loop_start (fn, data, num_threads, start, end, incr,
                icv-&gt;run_sched_var &amp; ~GFS_MONOTONIC,
                icv-&gt;run_sched_chunk_size, 0);
}</code></pre>
<p>这只是一个暴露在外的API（icv上节课也讲了，是debug标记）。其内部实现是：</p>
<pre><code class="language-CPP">/* The GOMP_parallel_loop_* routines pre-initialize a work-share construct
   to avoid one synchronization once we get into the loop.  */

static void
gomp_parallel_loop_start (void (*fn) (void *), void *data,
              unsigned num_threads, long start, long end,
              long incr, enum gomp_schedule_type sched,
              long chunk_size, unsigned int flags)
{
  struct gomp_team *team;

  num_threads = gomp_resolve_num_threads (num_threads, 0);
  team = gomp_new_team (num_threads);
  gomp_loop_init (&amp;team-&gt;work_shares[0], start, end, incr, sched, chunk_size);
  gomp_team_start (fn, data, num_threads, flags, team, NULL);
}</code></pre>
<p>我们看到这段有这么几个流程：</p>
<ol>
<li>确定线程数 <code>gomp_resolve_num_threads(num_threads, 0)</code></li>
<li>创建team（并行域内的线程组）<code>gomp_new_team (num_threads)</code></li>
<li>划分数据 <code>gomp_loop_init (&amp;team-&gt;work_shares[0], start, end, incr, sched, chunk_size)</code></li>
<li>启动线程 <code>gomp_team_start (fn, data, num_threads, flags, team, NULL)</code></li>
</ol>
<p>我们在上集已经解说了 <strong>确定线程数</strong>和<strong>启动线程</strong> 这两个函数，大家看完后大概就能对这两个函数能理解了 <a href="https://zhuanlan.zhihu.com/p/1911416379376108381">gcc是怎么实现OpenMP的？ - 知乎</a>。简单来说，他们的逻辑就是：</p>
<ol>
<li>线程数由我们自己输入（N）确定或者由系统最大的线程数量确定</li>
<li>启动线程时，是用一个for循环，不停pthread_create创建线程，每个新线程将执行我们的并行函数（这里这个并行函数叫subfunction）</li>
</ol>
<p>那我们继续，在此之前，我们回顾一下team的结构，which 我们已经在上集解说了 。但我们可以再复习一遍：</p>
<pre><code class="language-CPP">struct gomp_taskgroup
{
  _Bool in_taskgroup_wait;
  int num_children;
} l;
struct gomp_team
{
  int task_queue;
  int task_running_count;
};
struct gomp_thread
{
  struct gomp_team_state ts;
  struct gomp_task task;
} extern __thread a;

enum gomp_schedule_type
{
  GFS_RUNTIME, // runtime 调度方式
  GFS_STATIC,    // static  调度方式
  GFS_DYNAMIC, // dynamic 调度方式
  GFS_GUIDED,    // guided  调度方式
  GFS_AUTO     // auto    调度方式
};</code></pre>
<p><code>struct gomp_team</code> 是 OpenMP 用来表示一个 <strong>并行区域内线程组（team）</strong> 的数据结构，它记录了所有线程的公共状态，如：</p>
<ul>
<li>所有线程共享的循环调度信息（work_share）</li>
<li>tasking 状态（task_queue、task_running_count）</li>
<li>barrier、lock、cancel 状态等同步信息</li>
</ul>
<p>每次你执行<code>#pragma omp parallel num_threads(N)</code>，OpenMP 就会创建一个新的 <code>gomp_team</code> 对象，并把当前线程（通常是主线程）和新创建的工作线程组织成一个 team。（听起来很像CUDA里warp的概念）</p>
<p>接下来我们看看OpenMP是怎么创建team的，我把注释表在下面了（部分基于GPT4o）：</p>
<pre><code class="language-CPP">/* Create a new team data structure.  */

struct gomp_team *
gomp_new_team (unsigned nthreads)
{
  struct gomp_team *team;
  int i;

  team = get_last_team (nthreads); // 尝试复用已有 team（线程池复用），节省开销。

// 若没有可复用的 team，就用堆分配新内存（注意末尾为每线程附加结构预留了空间）
  if (team == NULL)
    {
      size_t extra = sizeof (team-&gt;ordered_release[0])
             + sizeof (team-&gt;implicit_task[0]); //`ordered_release[]`：用于支持 `#pragma omp ordered`， `implicit_task[]`：每个线程的默认 task
#ifdef GOMP_USE_ALIGNED_WORK_SHARES
      team = gomp_aligned_alloc (__alignof (struct gomp_team),
                 sizeof (*team) + nthreads * extra);

#else
      team = team_malloc (sizeof (*team) + nthreads * extra);
#endif

// 初始化用于线程同步的 barrier 和锁
#ifndef HAVE_SYNC_BUILTINS
      gomp_mutex_init (&amp;team-&gt;work_share_list_free_lock);
#endif
      gomp_barrier_init (&amp;team-&gt;barrier, nthreads);
      gomp_mutex_init (&amp;team-&gt;task_lock);

      team-&gt;nthreads = nthreads;
    }

// - 初始化主线程的循环分配结构 `work_shares[0]`。
// `work_shares_to_free` 指向当前活动的 work_share。
  team-&gt;work_share_chunk = 8;
#ifdef HAVE_SYNC_BUILTINS
  team-&gt;single_count = 0;
#endif
  team-&gt;work_shares_to_free = &amp;team-&gt;work_shares[0];
  gomp_init_work_share (&amp;team-&gt;work_shares[0], 0, nthreads);

  team-&gt;work_shares[0].next_alloc = NULL;
  team-&gt;work_share_list_free = NULL;

// - 构建一个简单的 free list 池，用于后续分配嵌套循环时快速分配新的 `work_share`。
  team-&gt;work_share_list_alloc = &amp;team-&gt;work_shares[1];
  for (i = 1; i &lt; 7; i++)
    team-&gt;work_shares[i].next_free = &amp;team-&gt;work_shares[i + 1];
  team-&gt;work_shares[i].next_free = NULL;

// 初始化 `ordered` 结构，供 `#pragma omp ordered` 使用。
  gomp_sem_init (&amp;team-&gt;master_release, 0);
  team-&gt;ordered_release = (void *) &amp;team-&gt;implicit_task[nthreads];
  team-&gt;ordered_release[0] = &amp;team-&gt;master_release;

// 初始化任务队列和任务状态计数器，为 task 构造器准备好。
  priority_queue_init (&amp;team-&gt;task_queue);
  team-&gt;task_count = 0;
  team-&gt;task_queued_count = 0;
  team-&gt;task_running_count = 0;
  team-&gt;work_share_cancelled = 0;
  team-&gt;team_cancelled = 0;

  team-&gt;task_detach_count = 0;

  return team;
}</code></pre>
<p>OpenMP 运行时会调用这个函数，为当前并行区域的执行准备所有共享状态，包括：</p>
<ul>
<li>线程数量</li>
<li>工作划分信息</li>
<li>barrier 和锁</li>
<li>task 队列</li>
<li>ordered 结构</li>
<li>工作共享结构 work_shares（用于 for 循环）</li>
</ul>
<p>下面是这个函数的调用逻辑</p>
<ol>
<li>reuse old team / 新建 new team</li>
<li>初始化锁（后续同步会使用）</li>
<li>初始化 work shares</li>
<li>创建task queues
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-002-1c3bb0fb3116.webp" alt="" /></li>
</ol>
<table>
<thead>
<tr>
<th>字段</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>work_shares</code></td>
<td><code>gomp_team</code> 中保存 <code>for</code> 循环调度信息的缓存数组</td>
</tr>
<tr>
<td><code>gomp_work_share</code></td>
<td>描述某一个 <code>for</code> 循环的调度状态：范围、策略、当前进度等</td>
</tr>
<tr>
<td><code>team-&gt;work_shares[0]</code></td>
<td>当前 active 并行 for 循环对应的调度器</td>
</tr>
<tr>
<td>使用方式</td>
<td>每个线程在执行前调用 <code>GOMP_loop_*_next()</code> 从中获取 chunk</td>
</tr>
</tbody>
</table>
<h3>work_share</h3>
<p><a href="https://www.cs.rice.edu/~la5/doc/ligbomp-doc/d9/dc6/structgomp__work__share.html">Libgomp: gomp_work_share Struct Reference</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-003-b9360a5c8e24.webp" alt="" /></p>
<p>在 <code>libgomp</code> 中，<code>work_share</code> 是一个用于<strong>协调线程间工作划分</strong>的数据结构。<br />
当你使用 <code>#pragma omp for</code> 等语句时，OpenMP 会创建一个 <code>work_share</code> 结构体，它<strong>记录循环的区间、步长、调度策略</strong>等内容，<strong>供所有线程共享</strong>，实现<strong>合理分工与同步</strong>。</p>
<p>在并行循环中，我们要把一个大的迭代区间分给多个线程执行。<br />
这个分工要满足几个要求：</p>
<ul>
<li><strong>线程不能抢重复任务</strong></li>
<li><strong>支持不同调度策略（static/dynamic/guided）</strong></li>
<li><strong>能检测循环是否结束</strong></li>
<li><strong>支持有序执行（ordered）</strong></li>
</ul>
<p>所以，OpenMP 为每一个 <code>parallel for</code> 语句都构造一个 <code>gomp_work_share</code>，用它来协调线程之间的分工和同步。</p>
<pre><code class="language-CPP">struct gomp_work_share
{
  /* This member records the SCHEDULE clause to be used for this construct.
     The user specification of &quot;runtime&quot; will already have been resolved.
     If this is a SECTIONS construct, this value will always be DYNAMIC.  */
  enum gomp_schedule_type sched;

  int mode;

  union {
    struct {
      /* This is the chunk_size argument to the SCHEDULE clause.  */
      long chunk_size;
      /* This is the iteration end point.  If this is a SECTIONS construct,
     this is the number of contained sections.  */
      long end;
      /* This is the iteration step.  If this is a SECTIONS construct, this
     is always 1.  */
      long incr;
    };

    struct {
      unsigned long long chunk_size_ull;
      unsigned long long end_ull;
      unsigned long long incr_ull;
    };
  };

  union {
    unsigned *ordered_team_ids;
    struct gomp_doacross_work_share *doacross;
  };

  /* This is the number of threads that have registered themselves in
     the circular queue ordered_team_ids.  */
  unsigned ordered_num_used;

  /* This is the team_id of the currently acknowledged owner of the ordered
     section, or -1u if the ordered section has not been acknowledged by
     any thread.  This is distinguished from the thread that is *allowed*
     to take the section next.  */
  unsigned ordered_owner;
  unsigned ordered_cur;

  /* This is a chain of allocated gomp_work_share blocks, valid only
     in the first gomp_work_share struct in the block.  */
  struct gomp_work_share *next_alloc;

  /* This lock protects the update of the following members.  */
#ifdef GOMP_USE_ALIGNED_WORK_SHARES
  gomp_mutex_t lock __attribute__((aligned (64)));
#else
  char pad[64 - offsetof (struct gomp_work_share_1st_cacheline, pad)];
  gomp_mutex_t lock;
#endif

  /* This is the count of the number of threads that have exited the work
     share construct.  If the construct was marked nowait, they have moved on
     to other work; otherwise they&#039;re blocked on a barrier.  The last member
     of the team to exit the work share construct must deallocate it.  */
  unsigned threads_completed;

  union {
    /* This is the next iteration value to be allocated.  */
    long next;
    unsigned long long next_ull;
    void *copyprivate;
  };

  union {
    gomp_ptrlock_t next_ws;
    struct gomp_work_share *next_free;
  };

  uintptr_t *task_reductions;
  unsigned inline_ordered_team_ids[0];
};</code></pre>
<h4>字段解释：</h4>
<p>首先是主角：</p>
<pre><code class="language-c">struct gomp_work_share</code></pre>
<p>它表示 <strong>一个工作共享（work-sharing）构造的状态</strong>，比如：</p>
<ul>
<li><code>#pragma omp for</code></li>
<li><code>#pragma omp sections</code></li>
<li><code>#pragma omp single</code></li>
</ul>
<p>每个 <code>parallel</code> 区域内的工作共享语句会对应创建一个这样的结构，供 team 中所有线程共享。它控制任务分配、同步（如 <code>ordered</code>）、调度策略等。</p>
<p><strong>1️⃣ 调度信息相关</strong></p>
<pre><code class="language-c">enum gomp_schedule_type sched;
int mode;</code></pre>
<ul>
<li><code>sched</code>: 调度策略，如 <code>static</code>, <code>dynamic</code>, <code>guided</code> 等。</li>
<li>
<p><code>mode</code>: 一般用于标志当前的执行模式，例如 ordered/nowait 启用情况。</p>
<p><strong>2️⃣ 迭代参数</strong></p>
</li>
</ul>
<pre><code class="language-c">union {
  struct {
    long chunk_size;
    long end;
    long incr;
  };
  struct {
    unsigned long long chunk_size_ull;
    unsigned long long end_ull;
    unsigned long long incr_ull;
  };
};</code></pre>
<ul>
<li>存储循环的基本信息：chunk 大小、终止条件、增量</li>
<li>
<p>使用 <code>union</code> 是为了支持 <code>long</code> 与 <code>unsigned long long</code> 两种精度循环</p>
<p><strong>3️⃣ <code>ordered</code> 相关同步机制</strong></p>
</li>
</ul>
<pre><code class="language-c">union {
  unsigned *ordered_team_ids;
  struct gomp_doacross_work_share *doacross;
};
unsigned ordered_num_used;
unsigned ordered_owner;
unsigned ordered_cur;</code></pre>
<p>这些字段用于 <code>ordered</code> 区块的线程顺序控制：</p>
<ul>
<li><code>ordered_team_ids</code>: 环形队列，记录哪些线程进入过 ordered 区块</li>
<li><code>ordered_owner</code>: 当前“被认可”的线程 ID</li>
<li><code>ordered_cur</code>: 当前应该进入 ordered 区块的线程位置</li>
<li><code>doacross</code>: 是 OpenMP 5.0 引入的跨迭代依赖控制（不常用）</li>
</ul>
<p><strong>4️⃣ work share 内存管理链表</strong></p>
<pre><code class="language-c">struct gomp_work_share *next_alloc;</code></pre>
<ul>
<li>用于连接一批 <code>gomp_work_share</code>，每次 <code>for</code> 语句进入都会新建一个。</li>
<li>每个 <code>team</code> 通常维护一个 <code>work_shares[]</code> 数组做池化。</li>
</ul>
<p><strong>5️⃣ 锁 + 线程完成计数</strong></p>
<pre><code class="language-c">gomp_mutex_t lock;
unsigned threads_completed;</code></pre>
<ul>
<li><code>lock</code>: 控制访问如 <code>next</code> 等共享字段，防止数据竞争</li>
<li>
<p><code>threads_completed</code>: 统计完成循环的线程数</p>
<ul>
<li>如果不是 <code>nowait</code>，就等所有线程结束后回收资源</li>
</ul>
<p><strong>6️⃣ 迭代分配/Copyprivate 数据</strong></p>
</li>
</ul>
<pre><code class="language-c">union {
  long next;
  unsigned long long next_ull;
  void *copyprivate;
};</code></pre>
<ul>
<li><code>next</code>/<code>next_ull</code>: 下一个待分配的迭代值（用于 dynamic、guided）</li>
<li>
<p><code>copyprivate</code>: 用于 <code>single copyprivate</code> 的数据传递</p>
<p><strong>7️⃣ 链接字段（下一个工作共享）</strong></p>
</li>
</ul>
<pre><code class="language-c">union {
  gomp_ptrlock_t next_ws;
  struct gomp_work_share *next_free;
};</code></pre>
<ul>
<li><code>next_ws</code>: 链接下一个 <code>work_share</code>（同一个线程块里的多个循环）</li>
<li>
<p><code>next_free</code>: 表示这个结构回收到 free list 中</p>
<p><strong>8️⃣ 任务归约与 inline ordered cache</strong></p>
</li>
</ul>
<pre><code class="language-c">uintptr_t *task_reductions;
unsigned inline_ordered_team_ids[0];</code></pre>
<ul>
<li><code>task_reductions</code>: 支持 <code>task reduction</code> 特性（OpenMP 4.0+）</li>
<li><code>inline_ordered_team_ids[0]</code>: 小 team 可以用这个数组避免动态分配</li>
</ul>
<table>
<thead>
<tr>
<th>功能</th>
<th>字段</th>
</tr>
</thead>
<tbody>
<tr>
<td>调度策略控制</td>
<td><code>sched</code>, <code>chunk_size</code>, <code>end</code></td>
</tr>
<tr>
<td>任务划分迭代控制</td>
<td><code>next</code>, <code>incr</code></td>
</tr>
<tr>
<td>ordered 执行支持</td>
<td><code>ordered_team_ids</code>, <code>ordered_owner</code> 等</td>
</tr>
<tr>
<td>同步与线程完成</td>
<td><code>lock</code>, <code>threads_completed</code></td>
</tr>
<tr>
<td>结构生命周期管理</td>
<td><code>next_alloc</code>, <code>next_ws</code></td>
</tr>
<tr>
<td>高效内存布局</td>
<td><code>inline_ordered_team_ids[0]</code></td>
</tr>
</tbody>
</table>
<h4>总结（for work_share）</h4>
<p>在 OpenMP 的并行区域中，当执行到一个 <code>#pragma omp for</code> 语句时，<strong>GCC 的 libgomp 会为这个 for 循环分配并初始化一个新的 <code>gomp_work_share</code> 结构体</strong>，用于：</p>
<ul>
<li>保存这个循环的调度方式（schedule）</li>
<li>保存迭代范围（start, end, increment）</li>
<li>保存 chunk 大小（chunk_size）</li>
<li>管理 <code>next</code> 字段，用于多个线程领取迭代任务</li>
<li>管理 ordered 区域的执行顺序</li>
<li>管理 task reduction（如果有）</li>
<li>跟踪有多少线程完成了工作共享块</li>
<li>链接下一个 work_share</li>
</ul>
<table>
<thead>
<tr>
<th>特性</th>
<th><code>gomp_work_share</code> 的作用</th>
</tr>
</thead>
<tbody>
<tr>
<td>一对一</td>
<td>每个 <code>#pragma omp for</code> → 一个 <code>gomp_work_share</code></td>
</tr>
<tr>
<td>多线程共享</td>
<td>所有线程都访问这个结构体分配任务</td>
</tr>
<tr>
<td>生命周期</td>
<td>循环执行完后被最后一个线程释放或缓存</td>
</tr>
</tbody>
</table>
<p>举个例子：</p>
<pre><code class="language-CPP">#pragma omp parallel
{
    #pragma omp for schedule(dynamic)
    for (int i = 0; i &lt; 1000; ++i)
        work(i);
}</code></pre>
<ul>
<li>当线程进入 <code>#pragma omp for</code>，调用 <code>GOMP_parallel_loop_start()</code> 或 <code>GOMP_loop_runtime_start()</code>；</li>
<li>然后会通过 <code>gomp_loop_init()</code> 创建并初始化一个新的 <code>gomp_work_share</code>；</li>
<li>所有线程通过这个共享的 <code>work_share</code> 结构体，从 <code>next</code> 处动态领取迭代区间。</li>
</ul>
<p>举2个例子：</p>
<pre><code class="language-CPP">#pragma omp parallel
{
    #pragma omp for
    for (int i = 0; i &lt; 100; ++i) { ... }

    #pragma omp for
    for (int j = 0; j &lt; 200; ++j) { ... }
}</code></pre>
<ul>
<li>这里会创建 <strong>两个独立的 <code>gomp_work_share</code></strong> 实例；</li>
<li>它们通过 <code>team-&gt;work_share_list_alloc</code> 和 <code>work_shares[i].next_alloc</code> 进行管理和缓存复用。</li>
</ul>
<hr />
<h2>loop init</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-004-2fb387f7d49a.webp" alt="" /></p>
<p>在我们初始化work_share的配置后，接下来我们就要对loop 初始化了。具体大家看源码及注释。
我们这里的重点是，初始化了chunk_size</p>
<p>详细解析见 dynamic 调度方式分析 一节：
<a href="https://www.cnblogs.com/Chang-LeHung/p/17089310.html">OpenMP For Construct dynamic 调度方式实现原理和源码分析 - 一无是处的研究僧 - 博客园</a></p>
<pre><code class="language-CPP">/* Initialize the given work share construct from the given arguments.  */

static inline void
gomp_loop_init (struct gomp_work_share *ws, long start, long end, long incr,
        enum gomp_schedule_type sched, long chunk_size)
{
// 1.设置调度方式和循环参数
  ws-&gt;sched = sched;
  ws-&gt;chunk_size = chunk_size;  // 在这里初始化了chunk_size

// 2. **处理循环是否为空（Zero Iteration）**
  ws-&gt;end = ((incr &gt; 0 &amp;&amp; start &gt; end) || (incr &lt; 0 &amp;&amp; start &lt; end))
        ? start : end;
// 3.设置步长和下一个迭代开始点
  ws-&gt;incr = incr;
  ws-&gt;next = start;

// 4. 如果是 dynamic 调度，还要处理 chunk 和溢出保护
  if (sched == GFS_DYNAMIC)
    {
      ws-&gt;chunk_size *= incr;

#ifdef HAVE_SYNC_BUILTINS
      {
    /* For dynamic scheduling prepare things to make each iteration
       faster.  */
    struct gomp_thread *thr = gomp_thread ();
    struct gomp_team *team = thr-&gt;ts.team;
    long nthreads = team ? team-&gt;nthreads : 1;

    if (__builtin_expect (incr &gt; 0, 1))
      {
        /* Cheap overflow protection.  */
        if (__builtin_expect ((nthreads | ws-&gt;chunk_size)
                  &gt;= 1UL &lt;&lt; (sizeof (long)
                         * __CHAR_BIT__ / 2 - 1), 0))
          ws-&gt;mode = 0;
        else
          ws-&gt;mode = ws-&gt;end &lt; (LONG_MAX
                    - (nthreads + 1) * ws-&gt;chunk_size);
      }
    /* Cheap overflow protection.  */
    else if (__builtin_expect ((nthreads | -ws-&gt;chunk_size)
                   &gt;= 1UL &lt;&lt; (sizeof (long)
                          * __CHAR_BIT__ / 2 - 1), 0))
      ws-&gt;mode = 0;
    else
      ws-&gt;mode = ws-&gt;end &gt; (nthreads + 1) * -ws-&gt;chunk_size - LONG_MAX;
      }
#endif
    }
}
</code></pre>
<p>一句话总结就是：</p>
<p><code>gomp_loop_init()</code> 就是把 for 循环的调度信息（<code>start/end/incr/sched/chunk</code>）规范化并填入 <code>work_share</code> 结构体，供后面多个线程安全、快速地并发领取迭代区间使用。</p>
<p><strong>举个例子：</strong></p>
<p>比如你写的代码是：</p>
<pre><code class="language-c">#pragma omp parallel for schedule(dynamic, 5)
for (int i = 0; i &lt; 20; ++i)
  work(i);</code></pre>
<p>进入并行区域后会发生：</p>
<ol>
<li>
<p>调用 <code>gomp_new_team()</code> 分配 team；</p>
</li>
<li>
<p>team 中的 <code>work_shares[0]</code> 被 <code>gomp_loop_init()</code> 初始化为：</p>
<pre><code class="language-c">ws->sched = GFS_DYNAMIC
ws->chunk_size = 5
ws->incr = 1
ws->next = 0
ws->end = 20</code></pre>
</li>
<li>
<p>后续多个线程竞争性从 <code>ws-&gt;next</code> 开始领取 <code>chunk_size</code> 大小的区间；</p>
</li>
<li>
<p><code>ws-&gt;mode</code> 如果满足条件，则动态领取时会走快速路径。</p>
</li>
</ol>
<h3>如果不写chunk_size，这边应该是多少？</h3>
<p>不同的调度不一样</p>
<table>
<thead>
<tr>
<th>调度方式（schedule）</th>
<th>默认 <code>chunk_size</code></th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>static</code></td>
<td>自动均分整个迭代空间</td>
<td>编译时根据线程数 <code>n</code> 和总迭代数 <code>N</code> 直接分成 <code>n</code> 份</td>
</tr>
<tr>
<td><code>dynamic</code></td>
<td><code>chunk_size = 1</code></td>
<td>每个线程每次领取 1 个迭代</td>
</tr>
<tr>
<td><code>guided</code></td>
<td>动态变化（见下面）</td>
<td>初始大块，逐渐缩小</td>
</tr>
<tr>
<td><code>auto/runtime</code></td>
<td>取决于运行时设置</td>
<td>环境变量或实现默认值</td>
</tr>
</tbody>
</table>
<h2>对于dynamic调度</h2>
<p>这里以 <code>schedule(dynamic, chunk_size)</code> 为例，看看线程是如何处理 chunk 的：</p>
<p><strong>（1）共享数据结构：<code>gomp_work_share</code></strong></p>
<ul>
<li>
<p>所有线程共享一个 <code>gomp_work_share ws</code>；</p>
</li>
<li>
<p><code>ws-&gt;next</code> 是一个原子变量，表示“下一次可以被领取的起点”。</p>
<p><strong>（2）每个线程执行时，会调用 <code>gomp_iter_dynamic_next</code></strong>
这个函数会：</p>
</li>
<li>
<p>加锁（或用 atomic 操作）读取 <code>ws-&gt;next</code>；</p>
</li>
<li>
<p>给当前线程分配一段区间 <code>[start, start + chunk_size)</code>；</p>
</li>
<li>
<p>然后更新 <code>ws-&gt;next += chunk_size</code>；</p>
</li>
<li>
<p>如果超出 <code>ws-&gt;end</code>，说明任务全部分配完了，线程就退出循环。</p>
</li>
</ul>
<h3>（3）例子：schedule(dynamic, 3)</h3>
<pre><code class="language-c">#pragma omp parallel for schedule(dynamic, 3)
for (int i = 0; i &lt; 10; ++i)
  work(i);</code></pre>
<p>线程领取过程如下（假设 3 个线程）：</p>
<table>
<thead>
<tr>
<th>第几次领取</th>
<th>线程 ID</th>
<th>获得区间</th>
<th><code>next</code> 更新为</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>T0</td>
<td>[0, 3)</td>
<td>3</td>
</tr>
<tr>
<td>2</td>
<td>T1</td>
<td>[3, 6)</td>
<td>6</td>
</tr>
<tr>
<td>3</td>
<td>T2</td>
<td>[6, 9)</td>
<td>9</td>
</tr>
<tr>
<td>4</td>
<td>T0</td>
<td>[9, 10)</td>
<td>10</td>
</tr>
</tbody>
</table>
<p>注意：最后一段可能不足 <code>chunk_size</code>，线程会自动裁剪。</p>
<hr />
<h2>✅ 总结一下</h2>
<ul>
<li>
<p>如果你不指定 <code>chunk_size</code>，那：</p>
<ul>
<li><code>static</code>：默认均分；</li>
<li><code>dynamic</code>：默认 <code>chunk_size = 1</code>；</li>
</ul>
</li>
<li>
<p>chunk 是每个线程从共享的 <code>gomp_work_share</code> 中动态“抢”出来的；</p>
</li>
<li>
<p>抢任务的函数最终是通过 <code>gomp_iter_dynamic_next()</code> 类似函数完成的；</p>
</li>
<li>
<p>为了加速这种调度，OpenMP 实现（如 libgomp）会为 dynamic 准备 fast path（比如 <code>ws-&gt;mode</code>）避免频繁加锁。</p>
</li>
</ul>
<h2>但如果是 <code>schedule(static)</code>，就不是这样了！</h2>
<h3>不加锁、不抢任务，原因是：</h3>
<ul>
<li><strong>静态分配</strong>意味着 <strong>每个线程在一开始就知道它自己的任务区间</strong>；</li>
<li>所以根本 <strong>不需要共享更新 <code>ws-&gt;next</code></strong>，也就 <strong>不需要加锁</strong>；</li>
<li><code>work_share</code> 在这里的作用是存储共享参数（例如 <code>start/end/incr</code>），但每个线程的起始索引是 <strong>预先计算好的</strong>。</li>
</ul>
<h3>调度总结</h3>
<table>
<thead>
<tr>
<th>调度方式</th>
<th>是否加锁</th>
<th>是否动态更新 <code>ws-&gt;next</code></th>
<th>线程何时知道任务区间</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>static</code></td>
<td>❌ 否</td>
<td>❌ 否</td>
<td>✅ 编译/运行时立即知道</td>
</tr>
<tr>
<td><code>static,chunk</code></td>
<td>❌ 否</td>
<td>❌ 否</td>
<td>✅ 由 <code>tid</code> 和 <code>chunk</code> 算出</td>
</tr>
<tr>
<td><code>dynamic</code></td>
<td>✅ 是</td>
<td>✅ 是</td>
<td>⏳ 运行时从 <code>work_share</code> 领取</td>
</tr>
<tr>
<td><code>guided</code></td>
<td>✅ 是</td>
<td>✅ 是</td>
<td>⏳ 每次都动态计算领取大小</td>
</tr>
</tbody>
</table>
<h3>示例（static vs dynamic）</h3>
<h3><code>schedule(static, 2)</code>，4线程：</h3>
<pre><code class="language-c">#pragma omp parallel for schedule(static, 2)
for (int i = 0; i &lt; 8; ++i)
  work(i);</code></pre>
<table>
<thead>
<tr>
<th>线程 ID</th>
<th>分配的迭代（静态）</th>
</tr>
</thead>
<tbody>
<tr>
<td>T0</td>
<td>i = 0,1</td>
</tr>
<tr>
<td>T1</td>
<td>i = 2,3</td>
</tr>
<tr>
<td>T2</td>
<td>i = 4,5</td>
</tr>
<tr>
<td>T3</td>
<td>i = 6,7</td>
</tr>
</tbody>
</table>
<p>🟢 每个线程一启动就知道要干哪两项，直接干，不抢任务、不加锁。</p>
<hr />
<h3><code>schedule(dynamic, 2)</code>，4线程：</h3>
<pre><code class="language-c">#pragma omp parallel for schedule(dynamic, 2)
for (int i = 0; i &lt; 8; ++i)
  work(i);</code></pre>
<table>
<thead>
<tr>
<th>步骤</th>
<th>哪个线程拿了哪个 chunk</th>
<th><code>next</code></th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>T0 拿到 i = 0,1</td>
<td>2</td>
</tr>
<tr>
<td>2</td>
<td>T1 拿到 i = 2,3</td>
<td>4</td>
</tr>
<tr>
<td>3</td>
<td>T2 拿到 i = 4,5</td>
<td>6</td>
</tr>
<tr>
<td>4</td>
<td>T3 拿到 i = 6,7</td>
<td>8</td>
</tr>
</tbody>
</table>
<p>🟡 每个线程在干完后要<strong>加锁或原子操作更新</strong> <code>next</code>。</p>
<h2>gomp_iter_dynamic_next</h2>
<p><a href="https://github.com/gcc-mirror/gcc/blob/02a6f9a0df149bbc06e3bbb20be4dde199225296/libgomp/iter.c#L184">gcc/libgomp/iter.c at 02a6f9a0df149bbc06e3bbb20be4dde199225296 · gcc-mirror/gcc</a></p>
<p>这里是对dynamic调用的学习（static的就直接是静态分配了）</p>
<p>这个函数的目的是：</p>
<blockquote>
<p>在 <code>schedule(dynamic)</code> 模式下，每个线程调用它来 <strong>从 <code>gomp_work_share</code> 结构中领取下一个可用的迭代区间</strong>（start, end）。</p>
</blockquote>
<p>线程之间通过原子操作来并发更新 <code>ws-&gt;next</code>，确保不会重复领取任务。</p>
<p>这里的函数流程图大致可以看为：</p>
<pre><code>Input: gomp_work_share ws (包含 end, chunk, incr, mode, next)

                ▼
     是否开启快速模式？ (ws-&gt;mode)
                ▼
         Yes               No
          ▼                 ▼
原子加 chunk，获得 tmp    使用 CAS 死循环尝试更新 ws-&gt;next
          ▼                 ▼
      if tmp &gt;= end       if 成功更新
          ▼                 ▼
       return false      设置 *pstart = start
          ▼                 设置 *pend = nend
       else                return true
  设置 *pstart = tmp
  设置 *pend = min(tmp + chunk, end)
  return true
</code></pre>
<pre><code class="language-CPP">bool
gomp_iter_dynamic_next (long *pstart, long *pend)
{
  struct gomp_thread *thr = gomp_thread ();
  struct gomp_work_share *ws = thr-&gt;ts.work_share;
  long start, end, nend, chunk, incr;

  end = ws-&gt;end;
  incr = ws-&gt;incr;
  chunk = ws-&gt;chunk_size;

  if (__builtin_expect (ws-&gt;mode, 1))
    {
    // 可以使用 `__sync_fetch_and_add` 进行快速原子加法，这种模式非常快。
      long tmp = __sync_fetch_and_add (&amp;ws-&gt;next, chunk);
      if (incr &gt; 0){
          if (tmp &gt;= end)
            return false;
          nend = tmp + chunk;
          if (nend &gt; end)
            nend = end;
          *pstart = tmp;
          *pend = nend;
          return true;
      }
      else{
          if (tmp &lt;= end)
            return false;
          nend = tmp + chunk;
          if (nend &lt; end)
            nend = end;
          *pstart = tmp;
          *pend = nend;
          return true;
      }
    }

// `mode = 0`：说明有可能涉及到整型溢出，要使用较慢的 CAS 死循环逻辑，手动比较并交换 `ws-&gt;next`。
  start = __atomic_load_n (&amp;ws-&gt;next, MEMMODEL_RELAXED);
  while (1)
    {
      long left = end - start;
      long tmp;

      if (start == end)
    return false;

      if (incr &lt; 0)
    {
      if (chunk &lt; left)
        chunk = left;
    }
      else
    {
      if (chunk &gt; left)
        chunk = left;
    }
      nend = start + chunk;

      tmp = __sync_val_compare_and_swap (&amp;ws-&gt;next, start, nend);
      if (__builtin_expect (tmp == start, 1))
    break;

      start = tmp;
    }

  *pstart = start;
  *pend = nend;
  return true;
}
#endif /* HAVE_SYNC_BUILTINS */</code></pre>
<table>
<thead>
<tr>
<th>变量名</th>
<th>含义</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>ws-&gt;next</code></td>
<td>当前尚未被线程领取的迭代起点（线程通过它来“抢任务”）</td>
</tr>
<tr>
<td><code>chunk</code></td>
<td>每次领取的任务块大小</td>
</tr>
<tr>
<td><code>incr</code></td>
<td>步长（正负表示正向或逆向迭代）</td>
</tr>
<tr>
<td><code>mode</code></td>
<td>表示是否可以走“快速路径”（前提是没有溢出风险）</td>
</tr>
<tr>
<td><code>pstart</code>/<code>pend</code></td>
<td>输出参数，线程拿到的 <code>[start, end)</code> 区间</td>
</tr>
</tbody>
</table>
<h3>线程同步靠什么？</h3>
<ul>
<li><strong><code>ws-&gt;next</code> 是核心状态变量</strong></li>
<li>所有线程共享它</li>
<li>使用 <code>__sync_fetch_and_add</code> 或 <code>__sync_val_compare_and_swap</code> 来实现原子更新</li>
</ul>
<table>
<thead>
<tr>
<th>特性</th>
<th>static</th>
<th>dynamic</th>
</tr>
</thead>
<tbody>
<tr>
<td>分配时机</td>
<td>一次性预分配</td>
<td>每个线程运行时动态领取</td>
</tr>
<tr>
<td>线程同步</td>
<td>不需要同步</td>
<td>需要原子操作（如 <code>fetch_add</code>）</td>
</tr>
<tr>
<td>开销</td>
<td>非常小</td>
<td>相对较高</td>
</tr>
<tr>
<td>适合场景</td>
<td>每次迭代时间大致相同</td>
<td>每次迭代时间不均，需负载均衡</td>
</tr>
<tr>
<td>数据结构</td>
<td>线程只读 <code>work_share</code></td>
<td>所有线程并发修改 <code>work_share-&gt;next</code></td>
</tr>
</tbody>
</table>
<pre><code>#pragma omp for schedule(static[, chunk])
            │
            ▼
   gomp_parallel_loop_start()
            │
            ▼
   gomp_loop_static_start()
       │
       ├── gomp_work_share_start()
       │     └── gomp_work_share_init()
       │
       ├── gomp_loop_init()            ← 初始化调度参数
       │
       └── gomp_iter_static_next()     ← 第一次获取迭代段
            │
            ▼
       后续每次调度也会继续调用 gomp_iter_static_next()</code></pre>
<h2>static中chunk的设置</h2>
<p><a href="https://github.com/gcc-mirror/gcc/blob/02a6f9a0df149bbc06e3bbb20be4dde199225296/libgomp/iter.c#L58">gcc/libgomp/iter.c at 02a6f9a0df149bbc06e3bbb20be4dde199225296 · gcc-mirror/gcc</a></p>
<p>源码的注释已经很清晰了，大家可以看看</p>
<pre><code class="language-CPP">/* This function implements the STATIC scheduling method.  The caller should
   iterate *pstart &lt;= x &lt; *pend.  Return zero if there are more iterations
   to perform; nonzero if not.  Return less than 0 if this thread had
   received the absolutely last iteration.  */

int
gomp_iter_static_next (long *pstart, long *pend)
{
  struct gomp_thread *thr = gomp_thread ();
  struct gomp_team *team = thr-&gt;ts.team;
  struct gomp_work_share *ws = thr-&gt;ts.work_share;
  unsigned long nthreads = team ? team-&gt;nthreads : 1;

  if (thr-&gt;ts.static_trip == -1)
    return -1;

  /* Quick test for degenerate teams and orphaned constructs.  */
  if (nthreads == 1)
    {
      *pstart = ws-&gt;next;
      *pend = ws-&gt;end;
      thr-&gt;ts.static_trip = -1;
      return ws-&gt;next == ws-&gt;end;
    }

  /* We interpret chunk_size zero as &quot;unspecified&quot;, which means that we
     should break up the iterations such that each thread makes only one
     trip through the outer loop.  */
  if (ws-&gt;chunk_size == 0)
    {
      unsigned long n, q, i, t;
      unsigned long s0, e0;
      long s, e;

      if (thr-&gt;ts.static_trip &gt; 0)
    return 1;
        // 如果这里我们发现chunk_size是0，说明是静态调度，我们将手动计算每一个线程要做的工作
      /* Compute the total number of iterations.  */
      s = ws-&gt;incr + (ws-&gt;incr &gt; 0 ? -1 : 1);
      n = (ws-&gt;end - ws-&gt;next + s) / ws-&gt;incr;
      i = thr-&gt;ts.team_id;

      /* Compute the &quot;zero-based&quot; start and end points.  That is, as
         if the loop began at zero and incremented by one.  */
      q = n / nthreads;
      t = n % nthreads;
      if (i &lt; t)
    {
      t = 0;
      q++;
    }
      s0 = q * i + t;
      e0 = s0 + q;

      /* Notice when no iterations allocated for this thread.  */
      if (s0 &gt;= e0)
    {
      thr-&gt;ts.static_trip = 1;
      return 1;
    }

      /* Transform these to the actual start and end numbers.  */
      s = (long)s0 * ws-&gt;incr + ws-&gt;next;
      e = (long)e0 * ws-&gt;incr + ws-&gt;next;

      *pstart = s;
      *pend = e;
      thr-&gt;ts.static_trip = (e0 == n ? -1 : 1);
      return 0;
    }
  else
    {
      unsigned long n, s0, e0, i, c;
      long s, e;

      /* Otherwise, each thread gets exactly chunk_size iterations
     (if available) each time through the loop.  */

      s = ws-&gt;incr + (ws-&gt;incr &gt; 0 ? -1 : 1);
      n = (ws-&gt;end - ws-&gt;next + s) / ws-&gt;incr;
      i = thr-&gt;ts.team_id;
      c = ws-&gt;chunk_size;

      /* Initial guess is a C sized chunk positioned nthreads iterations
     in, offset by our thread number.  */
      s0 = (thr-&gt;ts.static_trip * nthreads + i) * c;
      e0 = s0 + c;

      /* Detect overflow.  */
      if (s0 &gt;= n)
    return 1;
      if (e0 &gt; n)
    e0 = n;

      /* Transform these to the actual start and end numbers.  */
      s = (long)s0 * ws-&gt;incr + ws-&gt;next;
      e = (long)e0 * ws-&gt;incr + ws-&gt;next;

      *pstart = s;
      *pend = e;

      if (e0 == n)
    thr-&gt;ts.static_trip = -1;
      else
    thr-&gt;ts.static_trip++;
      return 0;
    }
}
</code></pre>
<p>这段函数 <code>gomp_iter_static_next()</code> 是 GCC OpenMP Runtime 中 <strong><code>static</code> 调度策略（<code>schedule(static)</code>）的核心实现</strong>，用于为当前线程分配它的下一段迭代区间（<code>[pstart, pend)</code>）。它是 <code>#pragma omp for</code> 中 <code>schedule(static[, chunk_size])</code> 的具体执行逻辑。</p>
<blockquote>
<p>计算当前线程（<code>thr-&gt;ts.team_id</code>）在 <code>static</code> 策略下，应当处理哪一段迭代区间 <code>[pstart, pend)</code>。</p>
</blockquote>
<p>它内部根据 <code>chunk_size</code> 是否为 <code>0</code>（未指定）分为两种处理策略：</p>
<hr />
<h3>✅ 情况一：<code>chunk_size == 0</code>（用户没指定）</h3>
<p>🧮 策略：<strong>每个线程平均分一次任务，不再参与调度</strong></p>
<p>即：</p>
<pre><code class="language-c">#pragma omp for schedule(static)  // 没写chunk_size</code></pre>
<p>每个线程只处理 <strong>一段连续的区间</strong>，不再往 work_share 里“多次领取任务”。分配逻辑如下：</p>
<h4>🧾 步骤解释：</h4>
<pre><code class="language-c">s = ws-&gt;incr + (ws-&gt;incr &gt; 0 ? -1 : 1);
n = (ws-&gt;end - ws-&gt;next + s) / ws-&gt;incr;</code></pre>
<ol>
<li>
<p>计算总的迭代次数 <code>n</code>。</p>
</li>
<li>
<p>让每个线程均分：<code>q = n / nthreads;</code>，然后前面 <code>t</code> 个线程各多一个任务。</p>
</li>
<li>
<p>当前线程是 <code>i = thr-&gt;ts.team_id</code>，它就会得到从 <code>s0</code> 到 <code>e0</code> 的迭代。</p>
</li>
</ol>
<p>最终再映射回真实循环起始值（不是从 0 开始）：</p>
<pre><code class="language-c">s = (long)s0 * ws-&gt;incr + ws-&gt;next;
e = (long)e0 * ws-&gt;incr + ws-&gt;next;</code></pre>
<hr />
<h3>✅ 情况二：<code>chunk_size &gt; 0</code>（用户指定）</h3>
<p>🧮 策略：<strong>每个线程每次从循环里“领一份 chunk”</strong></p>
<p>即：</p>
<pre><code class="language-c">#pragma omp for schedule(static, 2)</code></pre>
<p>每个线程可能进入多次，每次拿 <code>chunk_size</code> 个迭代任务。OpenMP runtime 维护一个私有的 <code>static_trip</code> 表示第几次领取任务。</p>
<pre><code class="language-c">s0 = (thr-&gt;ts.static_trip * nthreads + i) * c;
e0 = s0 + c;</code></pre>
<p>这个策略其实模拟一个全局静态分配的调度，只不过每个线程每次固定步长地从自己的起点继续领活。</p>
<table>
<thead>
<tr>
<th>阶段</th>
<th>函数</th>
<th>作用</th>
</tr>
</thead>
<tbody>
<tr>
<td>初始化 loop</td>
<td><code>gomp_loop_static_start()</code></td>
<td>每个线程第一次分配循环任务</td>
</tr>
<tr>
<td>初始化调度元数据</td>
<td><code>gomp_loop_init()</code></td>
<td>设置 <code>start</code>, <code>end</code>, <code>incr</code>, <code>chunk_size</code> 等</td>
</tr>
<tr>
<td>每次领任务</td>
<td><code>gomp_iter_static_next()</code></td>
<td>每个线程每次“领”一段 <code>[start, end)</code> 迭代</td>
</tr>
</tbody>
</table>
<h2>chunk_size的设置</h2>
<p><a href="https://github.com/gcc-mirror/gcc/blob/02a6f9a0df149bbc06e3bbb20be4dde199225296/libgomp/icv.c#L86">gcc/libgomp/icv.c at 02a6f9a0df149bbc06e3bbb20be4dde199225296 · gcc-mirror/gcc</a>
回归原始，我们最初的chunk_size是从<code>icv-&gt;run_sched_chunk_size</code> 传下来的。
而icv里确定的方式，依旧是根据调度方式确定：</p>
<pre><code class="language-CPP">void omp_set_schedule (omp_sched_t kind, int chunk_size)
{
  struct gomp_task_icv *icv = gomp_icv (true);
  switch (kind &amp; ~omp_sched_monotonic)
    {
    case omp_sched_static:
      if (chunk_size &lt; 1)
    chunk_size = 0;
      icv-&gt;run_sched_chunk_size = chunk_size;
      break;
    case omp_sched_dynamic:
    case omp_sched_guided:
      if (chunk_size &lt; 1)
    chunk_size = 1;
      icv-&gt;run_sched_chunk_size = chunk_size;
      break;
    case omp_sched_auto:
      break;
    default:
      return;
    }
  icv-&gt;run_sched_var = kind;
}</code></pre>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-005-0a7e4354423d.webp" alt="" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-06/gcc%E6%98%AF%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0openmp-parallel-for%E7%9A%84/body-006-2b9655c7083e.webp" alt="" /></p>
<hr />
<h2>启动线程</h2>
<p><a href="https://zhuanlan.zhihu.com/p/1911416379376108381">gcc是怎么实现OpenMP的？ - 知乎</a></p>
<p>team_start我们上集也解析了，这集我们就不解析了。</p>
