---
title: "HPL 浮点数理论性能与实际性能相差6倍问题"
description: "HPL 为什么是6 dispatch https://www.nextplatform.com/2021/03/26/deep-dive-into-amds-milan-epyc-7003-architecture/ https://www.nextplatform.com/wp-content/uploads/2021/03/amd-milan-epyc-zen2-versus-zen3.jpg AMD Zen4 发布会： http…"
publishedAt: "2024-10-24 22:53:05"
updatedAt: "2024-11-05 22:16:53"
category: "Computer Science"
tags: ["HPC", "HPL", "高性能计算"]
draft: false
slug: "hpl-浮点数理论性能与实际性能相差6倍问题"
legacySlug: "hpl-浮点数理论性能与实际性能相差6倍问题"
wordpressId: 382
sourceUrl: "https://haibin-blog.vercel.app/index.php/hpl-%e6%b5%ae%e7%82%b9%e6%95%b0%e7%90%86%e8%ae%ba%e6%80%a7%e8%83%bd%e4%b8%8e%e5%ae%9e%e9%99%85%e6%80%a7%e8%83%bd%e7%9b%b8%e5%b7%ae6%e5%80%8d%e9%97%ae%e9%a2%98/"
commentCount: 0
importedFromWordPress: true
---
<p>HPL</p>
<p>为什么是6</p>
<p><img src="https://haibin-blog.vercel.app/wp-content/uploads/2024/10/image-1730816166519.png" alt="file" /></p>
<p>dispatch </p>
<p><a href="https://www.nextplatform.com/2021/03/26/deep-dive-into-amds-milan-epyc-7003-architecture/">https://www.nextplatform.com/2021/03/26/deep-dive-into-amds-milan-epyc-7003-architecture/</a></p>
<p><a href="https://www.nextplatform.com/wp-content/uploads/2021/03/amd-milan-epyc-zen2-versus-zen3.jpg">https://www.nextplatform.com/wp-content/uploads/2021/03/amd-milan-epyc-zen2-versus-zen3.jpg</a></p>
<p>AMD Zen4 发布会：<a href="https://www.bilibili.com/video/BV1B84y1v7nW/?spm_id_from=333.337.search-card.all.click&amp;vd_source=4871cfa497362c1a843af2ecff18ab7f">https://www.bilibili.com/video/BV1B84y1v7nW/?spm_id_from=333.337.search-card.all.click&vd_source=4871cfa497362c1a843af2ecff18ab7f</a></p>
<p><a href="http://www.nextplatform.com/wp-content/uploads/2021/03/amd-milan-epyc-ipc-versus-intel-xeon-sp.jpg">http://www.nextplatform.com/wp-content/uploads/2021/03/amd-milan-epyc-ipc-versus-intel-xeon-sp.jpg</a></p>
<p><a href="https://wangzhou.github.io/%E8%B6%85%E6%A0%87%E9%87%8F%E5%A4%84%E7%90%86%E5%99%A8%E6%8C%87%E4%BB%A4%E5%8F%91%E5%B0%84%E7%9A%84%E5%9F%BA%E6%9C%AC%E9%80%BB%E8%BE%91/">超标量处理器指令发射的基本逻辑 | Sherlock's blog</a></p>
<p>3000页长文
<a href="https://www.amd.com/content/dam/amd/en/documents/processor-tech-docs/programmer-references/24593.pdf">AMD64 Architecture Programmer’s Manual, Volume 2: System Programming</a></p>
<p><a href="http://aida64.helpmax.net/en/benchmark-guide/fpu-vp8/">FPU VP8 | Aida64</a></p>
