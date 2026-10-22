---
title: "OSDI25 XSched"
description: "scheduling for XPUs 在XPU上实现抢占式调度 CPU的抢占式调度 抢占式调度（Preemptive Scheduling）是一种 操作系统调度策略 ，核心思想是： 当有更高优先级或更紧急的任务需要运行时，操作系统可以 立即中断当前正在运行的任务 ，把 CPU 资源“抢”过来给那个更高优先级的任务。 XPU XPU: FPGA, NPU, GPU 目前在XPU上做了很多的任务 但是好像没有什么调度 Opps: 抽象成…"
publishedAt: "2025-08-12T03:45:56Z"
category: "Paper Reading"
categories: ["Paper Reading"]
tags: ["GPU", "osdi", "XPU"]
author: "GB"
draft: false
slug: "osdi25-xsched"
legacySlug: "osdi25-xsched"
oldSlugs: []
wordpressId: 937
sourceUrl: "https://www.haibinlaiblog.top/index.php/osdi25-xsched/"
commentCount: 0
viewCount: 1136
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-08/osdi25-xsched.webp"
---
<p>scheduling for XPUs</p>
<p><strong>在XPU上实现抢占式调度</strong></p>
<h2>CPU的抢占式调度</h2>
<p>抢占式调度（Preemptive Scheduling）是一种<strong>操作系统调度策略</strong>，核心思想是：</p>
<blockquote>
<p>当有更高优先级或更紧急的任务需要运行时，操作系统可以<strong>立即中断当前正在运行的任务</strong>，把 CPU 资源“抢”过来给那个更高优先级的任务。</p>
</blockquote>
<h2>XPU</h2>
<p>XPU: FPGA, NPU, GPU</p>
<p>目前在XPU上做了很多的任务
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811211223039.png" alt="" /></p>
<p>但是好像没有什么调度</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811210800121.png" alt="" /></p>
<h2>Opps: 抽象成任务</h2>
<p>他们在交任务时有硬件queue
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811211548028.png" alt="" /></p>
<h2>Design: XQueue</h2>
<p>所以我们可以用一层抽象来表示我们的任务。XQueue就是一个任务Queue</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811211859813.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811212701456.png" alt="" /></p>
<p>我们在任务层和硬件层中间加一层调度层，来实现我们的抢占式调度方案
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811215547228.png" alt="" /></p>
<h2>Design：多层级的阻断方法</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811213023451.png" alt="" /></p>
<p>Level 1 阻断CPU-XPU的任务提交
用纯软件cpp实现</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811213206124.png" alt="" /></p>
<p>Level 2 把Hardware Queue 跟硬件阻断
用instruct实现
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811213511967.png" alt="" /></p>
<p>Level 3 阻断运行时的程序
用GPU trap handler/用时间片轮询的GPU，时间片=0
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811214121186.png" alt="" /></p>
<h2>实验</h2>
<p>用两个进程，来向队列里发，来看时延</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250811215419417.png" alt="" /></p>
