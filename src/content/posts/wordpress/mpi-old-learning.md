---
title: "MPI: old learning"
description: "Tutorials · MPI Tutorial 其实这个问题背后很有意思。mpi属于hpc领域，和现在的hadoop生态本来就不属于一块。 个人觉得一个技术能否流行起来，主要取决于三点:自身性能，易用性，环境。 性能上，mpi适用于计算密集型，在对计算要求比较高的地方，确实比hadoop/spark用的广，比如机器学习， 生物计算 。但是属于io密集型就不会有优势，很多 大数据 任务属于这种情况。 易用性上，mpi无论是编写和运行环…"
publishedAt: "2025-05-16 02:13:04"
category: "High Performance Computing"
tags: ["HPC", "MPI"]
draft: false
slug: "mpi-old-learning"
legacySlug: "mpi-old-learning"
wordpressId: 769
sourceUrl: "https://www.haibinlaiblog.top/index.php/mpi-old-learning/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="https://mpitutorial.com/tutorials/">Tutorials · MPI Tutorial</a></p>
<p>其实这个问题背后很有意思。mpi属于hpc领域，和现在的hadoop生态本来就不属于一块。</p>
<p>个人觉得一个技术能否流行起来，主要取决于三点:自身性能，易用性，环境。</p>
<p>性能上，mpi适用于计算密集型，在对计算要求比较高的地方，确实比hadoop/spark用的广，比如机器学习，<a href="https://zhida.zhihu.com/search?content_id=18034829&amp;content_type=Answer&amp;match_order=1&amp;q=%E7%94%9F%E7%89%A9%E8%AE%A1%E7%AE%97&amp;zhida_source=entity">生物计算</a>。但是属于io密集型就不会有优势，很多<a href="https://zhida.zhihu.com/search?content_id=18034829&amp;content_type=Answer&amp;match_order=1&amp;q=%E5%A4%A7%E6%95%B0%E6%8D%AE&amp;zhida_source=entity">大数据</a>任务属于这种情况。</p>
<p>易用性上，mpi无论是编写和运行环境都比hadoop<a href="https://zhida.zhihu.com/search?content_id=18034829&amp;content_type=Answer&amp;match_order=1&amp;q=%E7%94%9F%E6%80%81%E5%9C%88&amp;zhida_source=entity">生态圈</a>要求高，这点应该是mpi的短板。</p>
<p>环境上，hadoop生态圈更加完整，从<a href="https://zhida.zhihu.com/search?content_id=18034829&amp;content_type=Answer&amp;match_order=1&amp;q=%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F&amp;zhida_source=entity">文件系统</a>，sql，流式处理等等，mpi也有，但是不够丰富。环境上，最重要的一点就是需要有大公司推动，有小公司创新的地方。这点上hadoop背靠java生态圈，加上各种应用多，可以讲故事的地方多，容易获得资本市场的关注。</p>
<p>综上看出<a href="https://zhida.zhihu.com/search?content_id=18034829&amp;content_type=Answer&amp;match_order=6&amp;q=mpi&amp;zhida_source=entity">mpi</a>只有计算密集任务上有优势，其他都是劣势。</p>
<p>不过随着今天计算，存储，网络三者的性价比在变化，他们所代表的两个领域正在发生融合</p>
<pre><code>/* Initialize and Finalize */
int MPI_Init(int *argc, char ***argv)
int MPI_Finalize()

/* MPI comm size and rank */
int MPI_Comm_size(MPI_Comm comm, int *size)
int MPI_Comm_rank(MPI_Comm comm, int *rank)

/* MPI send and recv */
int MPI_Send(const void *buf, int count, MPI_Datatype datatype, int dest,
             int tag, MPI_Comm comm)
int MPI_Recv(void *buf, int count, MPI_Datatype datatype, int source, int tag,
             MPI_Comm comm, MPI_Status *status)
</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202505061420236.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202505061422290.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/202505061422169.png" alt="" /></p>
