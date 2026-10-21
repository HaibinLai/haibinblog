---
title: "OSDI25 Neutrino"
description: "MSRA内部讲座 CPU 稳定了很多年，GPU一直没有稳定 Pytorch.zero(4096,4096) 居然花了很多时间！ 持久性内核的sched cost反而小 越小的kernel反而比大kernel schedule时间长 用户能自己写prompt ebpf 拿包工具（它的好处在于用户可以自己写C/C++来提取包） 抓住两个核心common 指令可以靠插桩实现 计算时间 找地址 ebpf如果看cublas，是能找到ptx pr…"
publishedAt: "2025-07-30 01:44:36"
category: "Paper Reading"
tags: ["GPU", "msra", "osdi"]
draft: false
slug: "osdi25-neutrino"
legacySlug: "osdi25-neutrino"
wordpressId: 912
sourceUrl: "https://www.haibinlaiblog.top/index.php/osdi25-neutrino/"
commentCount: 0
importedFromWordPress: true
---
<p>MSRA内部讲座</p>
<p>CPU 稳定了很多年，GPU一直没有稳定</p>
<p>Pytorch.zero(4096,4096)</p>
<p>居然花了很多时间！</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725021017587.png" alt="" /></p>
<p>持久性内核的sched cost反而小</p>
<p>越小的kernel反而比大kernel schedule时间长</p>
<p>用户能自己写prompt</p>
<p>ebpf 拿包工具（它的好处在于用户可以自己写C/C++来提取包）</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725021225762.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725021559697.png" alt="" /></p>
<h2>抓住两个核心common</h2>
<p>指令可以靠插桩实现</p>
<h3>计算时间</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725021951332.png" alt="" /></p>
<h3>找地址</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725022048842.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725023000290.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725023410302.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725024009526.png" alt="" /></p>
<p>ebpf如果看cublas，是能找到ptx</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725025108220.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725025251520.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725025503271.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725030314047.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725030804219.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250725031358388.png" alt="" /></p>
<p>profile还是有很多可以去探索的</p>
