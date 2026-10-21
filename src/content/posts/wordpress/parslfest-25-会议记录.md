---
title: "ParslFest 25 会议记录"
description: "ParslFest 会议的目标是找到新的idea和设计，以及展示一些用户案例。 Parsl: Parallel Scripting in Python Join our dedicated #parslfest2025 channel on Slack to connect with fellow attendees, ask questions, etc. Not on Parsl Slack yet? Join our space…"
publishedAt: "2025-08-29 21:54:48"
updatedAt: "2025-08-30 02:49:59"
category: "Conference"
tags: ["HPC", "Parsl", "会议"]
draft: false
slug: "parslfest-25-会议记录"
legacySlug: "parslfest-25-会议记录"
wordpressId: 957
sourceUrl: "https://www.haibinlaiblog.top/index.php/parslfest-25-%e4%bc%9a%e8%ae%ae%e8%ae%b0%e5%bd%95/"
commentCount: 0
importedFromWordPress: true
---
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132608190.png" alt="" /></p>
<p>ParslFest</p>
<p>会议的目标是找到新的idea和设计，以及展示一些用户案例。</p>
<p><a href="https://parsl-project.org/parslfest/parslfest2025.html">Parsl: Parallel Scripting in Python</a></p>
<p><strong>Join our dedicated <a href="https://i-links.illinois.edu/?ref=mrgAAJ5ikI7BhsFyyIczA-Vnov0gwv4mAQAAAFJj8DX74HcKGlozTObAtYXXy1foIiUqPwJ6WAQLHBpuFRoX-lcunmbQtWH6BkS7wWug2CpnwMwoqD0A5lhGy6pacdQVgpyFplZXueqPrMFTWuBtCiroqjO1F3TO6w_Fd2jjbJQRN7fqUVITeju8TtFOiRR-eui_5R0DqOqVsIuYLiLAqetUwq6FLU-6L2TFjUZ8GDCJbEy5UDSsRrUCTqY0s8xAgP6sDKk_qDioEpA8Me5IKy-QyklQXy4cgC1Z4A">#parslfest2025</a> channel on Slack</strong>to connect with fellow attendees, ask questions, etc.</p>
<ul>
<li>Not on Parsl Slack yet? <a href="https://i-links.illinois.edu/?ref=mrgAAKpSIDIGyTeZ8y9Sv_y17ExtqoH7AQAAAFJj8DX74HcKGlozTObAtYXXy1foIiUqPwJ6WAQLHBpuFRoX-lcunmbQtWH6BkS7wWug2CpnwMwoqD0A5lhGy6pacdQVgpyFplZXueqPrMFTgD5xRtKO8Nqlx9ws-ESAg7lC0QPCBGdFT-esgFvLe38mosQr3uJl37TCZ7xUXSWz4vw8cpqXLon4eLYXzctOYQS8f3I09VjhJcbrwUdWun0sQ2PRHHBfs2XbQ5wtOzRD">Join our space for free</a>.</li>
</ul>
<p>Below is a high-level overview of the ParslFest program. All talks will be presented over <a href="https://i-links.illinois.edu/?ref=mrgAAD9dZMnFmjG3H9rCPVL1nfFWWmPuAQAAAFJj8DX74HcKGlozTObAtYXXy1foIiUqPwJ6WAQLHBpuFRoX-lcunmbQtWH6BkS7wWug2CpnwMwoqD0A5lhGy6pacdQVgpyFplZXueqPrMFTCx-JV9kzQWvbSDC_NP_GvFSCvsNW2i1UCOkSqAKAlEZ7Tj8W6HEK2VmXhSVzat-CDIQqEpjojLou2v3qQYEYe8ekfNqSG9sCXNT-5AdOPy4AHfI9LqagFHQNNsxLrajM">Zoom</a>, recorded, edited, and uploaded to <a href="https://i-links.illinois.edu/?ref=mrgAAD4sF9Hg6IiLmtPWRxPxfoGDIIvwAQAAAFJj8DX74HcKGlozTObAtYXXy1foIiUqPwJ6WAQLHBpuFRoX-lcunmbQtWH6BkS7wWug2CpnwMwoqD0A5lhGy6pacdQVgpyFplZXueqPrMFTWmjqTohZYq8uaBxJ3qkNxt4izt_-heE1l8TRJMf8VX72UbK57OZMohss_QUo2kBqxMaOJ9JHfdxfvgE3mjnOQEmEp3KMHGfTG3s3z1DOfQLMW_WhZYTXBfvDlarG6_59">Parsl’s YouTube channel</a> for later viewing.</p>
<h2>Starts</h2>
<p>Kyle给本次的会议做了开场</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828131033832.png" alt="" /></p>
<p><strong>Codes, Collaboration, ideas for New Contribution on Parsl</strong></p>
<h2>WARTH: Workload Resilience Across Task Hierarchies in Task-based Parallel Programming Frameworks</h2>
<p>来自Sicheng学姐在CCGRID25发表的工作</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828131224118.png" alt="" /></p>
<p>这份工作做的是TBPP的resilience框架。TBPP是将任务做成DAG执行流程图，随后在多节点上分布式启动。</p>
<p>TBPP以往的常见Resilience处理是Retry和checkpoint机制。这两个机制在DAG的异构执行图的情况下会出现这样的问题：节点间重启动/存储checkpoint时间/资源使用不均（有的节点可能存储100GB，重启动100次）</p>
<p>WARTH框架尝试将整个TBPP执行分解为多层结构的错误，并在对应层中存储logs和checkpoints去减少logs及错误。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828133211201.png" alt="" /></p>
<p>处理事件失败的工作流程</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828133413258.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828131702100.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828131819952.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828131933292.png" alt="" /></p>
<p>问题：
在globus compute里能否使用？毕竟这里边的jobs更多。
Scheduler</p>
<h2>Implementing</h2>
<p>João Gabriel Loureiro de Lima Lembo</p>
<p>冷启动时间优化 Techniques</p>
<p>这份工作研究的是分布式工作里的冷启动的时间优化。</p>
<p>在分布式系统冷启动时，我们的主要workload 是将我们的Jobs的data，codes发布到各个节点上，并完成基础的通信链接。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132155633.png" alt="" /></p>
<p>在尝试的很多优化中，新的数据分发算法得到的性能提升是最多的。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132343473.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132509785.png" alt="" /></p>
<p>实验</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132536360.png" alt="" /></p>
<p>Execution time</p>
<p>warm-start 实验情况</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132739248.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828132940876.png" alt="" /></p>
<h2>Parsl+Globus Compute Integration</h2>
<p>来自科罗拉多大学的 Christopher Harrop</p>
<p>目标是将Parsl系统和Globus Compute系统执行的任务结合在一起，制作一些快速配置的脚本，并尝试进行一定的性能优化</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828133521404.png" alt="" /></p>
<p>为了尝试这个目标，在此之前我们需要配置好一个分布式config系统。现在我们只需要系统自动配置。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828133633518.png" alt="" /></p>
<p>主要工作是完成了 启动脚本及机器管理 的系统。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828134143644.png" alt="" /></p>
<h2>Resilient Solutions for Tomographic Reconstruction</h2>
<p>来自好哥们Hai
这份工作尝试在三维重建这一个workflow里构建一个可靠的分布式系统</p>
<p><a href="https://www.frontiersin.org/journals/high-performance-computing/articles/10.3389/fhpcp.2025.1550855/full">Frontiers | Resilient execution of distributed X-ray image analysis workflows</a></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828134732688.png" alt="" /></p>
<p>Tomographic 多维层析成像</p>
<p><strong>层析成像</strong>又称<strong>断层扫描</strong>、<strong>层析术</strong>，是使用任何类型的穿透波，对物体以分段（sections）或切片（sectioning）形式成像的方法或技术。层析成像所呈现的图像称为<strong>层析成像图</strong>（tomogram）或<strong>断层扫描图</strong>。</p>
<p>整个workflow如下图
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828134752087.png" alt="" /></p>
<p>随着我们的workload数量增加，我们的Failure Frequency变得更高了</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828135007397.png" alt="" /></p>
<p>主要设计是 加入checkpoint机制+节点迁移load balancing。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828135353759.png" alt="" /></p>
<h2>Making DAG-Based Automation Accessible on Android &amp; Low-Power Device</h2>
<p>这份工作尝试在 Android 等低功耗系统上运行DAG执行
2024 Aug -&gt; 2025 Aug
从 Parsl 魔改的prototype</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828135737094.png" alt="" /></p>
<p>主要关注的点：</p>
<p>Offline 优先，尽可能不要发到更多节点上
能耗
Termux ready。这是一个安卓模拟器，可以模拟手机</p>
<p>Plugin：可扩展性</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828140316161.png" alt="" /></p>
<p>主要workflow：parslet启动-&gt;发布到各个节点-&gt;记录和汇总logs -&gt;收集结果</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828140505725.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828140825842.png" alt="" /></p>
<h2>Scientific Data Streaming</h2>
<p>这篇工作是在globus compute上做一个面向科学工作流的高性能流式系统</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141254094.png" alt="" /></p>
<p>目前的科学工作流的数据情况：</p>
<ol>
<li>数据密集：来自天文望远镜等数据数据收集器的数据量是相当大的</li>
<li>高成本：大量的科学计算数据处理需要大量CPU进行支撑，造成成本高</li>
<li>HPC Infra成本：配置环境很累</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141315530.png" alt="" /></p>
<p>SciStream 便是
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141637334.png" alt="" /></p>
<p>目前工作流的缺陷</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141741953.png" alt="" /></p>
<p>工作流演示
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141822724.png" alt="" /></p>
<p>Extensive 实验
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828141957387.png" alt="" /></p>
<h2>Training Neural Networks with Diamond</h2>
<p>Haotian Xie / Zhao Zhang: Training Neural Networks with Diamond</p>
<p>Diamond是一个用于加速AI工作流的HPC系统，Diamond提供了一个UI，你可以轻松的用它将AI工作交到Globus Compute系统中。
<a href="https://docs.diamondhpc.ai/">Introduction – Nextra</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828144325048.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828144400924.png" alt="" /></p>
<p>体验前端
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828144805549.png" alt="" />
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828145010322.png" alt="" /></p>
<h2>A Multifidelity, Multiobjective Optimization Workflow With Parsl</h2>
<p>Laura Walizer: A Multifidelity, Multiobjective Optimization Workflow With Parsl
基于Parsl的多目标优化进化算法</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828145322732.png" alt="" /></p>
<p>多目标优化算法框架
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828145531046.png" alt="" /></p>
<p>Pasl config 配置
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828145812396.png" alt="" />
实验
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828150000563.png" alt="" /></p>
<p>问题：</p>
<ul>
<li>你感觉Parsl用的怎么样？
回答</li>
<li>有点tricky，然后感觉要看一些stack去查bug，有的时候像要搞python practice</li>
</ul>
<h2>Garden: Lessons Learned from Serving AI for Science Models with Globus Compute</h2>
<p>来自好哥们 Will Engler</p>
<p>我们在搭建AI4Sci工程平台时遇到的困难</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828150326338.png" alt="" /></p>
<p>Graden是一个提供Model服务的系统，类似于集成huggingface+部署的AI部署系统，同时其支持很多的科学工作流AI model。</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828150447554.png" alt="" /></p>
<p>Some of my best friends are LLMs.</p>
<p>What does it means for &quot;sharing a model&quot;:
Open weights and metadata
Code for practical inference
Inference code running remotely</p>
<p>我们的回答：a model &quot;ready to run&quot;</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828150833458.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151105102.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151033287.png" alt="" /></p>
<p>非LLM的AI模型仍然没有那么好的支持，科学工作流AI会很好的支持这方面的工作</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151040744.png" alt="" /></p>
<h2>Distributed on-the-fly Training of Neural Network Potentials with Parsl and Colmena</h2>
<p>Michael Tynes, Logan Ward</p>
<p>Mike的笑话每次都让我笑死了</p>
<p>AI-HPC的工作是用AI尝试加速传统的科学数值模拟</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151553319.png" alt="" /></p>
<p>但是很明显的，这种AI很可能是会有acc低的问题，</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151720587.png" alt="" /></p>
<p>听起来不错，让我们把OTF搬入分布式系统，就变成了：</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828151910014.png" alt="" /></p>
<h2>Deploying AI+Simulation Workflows for MOF Design (with Parsl)</h2>
<p>Logan</p>
<p>Logan在Globus待了8年，目前去了Nvidia AI4Sci 部门。</p>
<p>Logan曾经做过自己8年经验分享的组会，
commit on daytime
long career</p>
<p>在Parsl上部署AI模拟的科学工作流</p>
<p>Logan 原本
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828152351470.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828152448877.png" alt="" /></p>
<p>目前我们用 Parsl+MOF(AI)+LAMMPS(HPC) 来尝试科学工作流</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828152544545.png" alt="" /></p>
<p>最大的问题是节点的配置与数据分发。任何事情发到2000节点的超算上，都会行成大问题。</p>
<p>目前两个解决方案是 Proxy Store / 打成CUDA container
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828152822916.png" alt="" /></p>
<h2>Leveraging Parsl for Scalable Data Parsing for AuroraGPT</h2>
<p>Robert Underwood: Leveraging Parsl for Scalable Data Parsing for AuroraGPT</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828153316602.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828153202696.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828153422629.png" alt="" /></p>
<p>在debugging上，我们用了一些多节点的debug和profile工具</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828154036470.png" alt="" /></p>
<p>Lesson learned</p>
<p>fuse task+jobs to reduce scheduling time</p>
<h2>Adaptive Task Management: Enabling Multi-Site Workflows with Globus Compute</h2>
<p>Matt Baughman</p>
<p>来自好哥们Matt!</p>
<p>尝试将多地的工作连接在一起的一个大型分布式框架</p>
<p>ATM是一个分布式框架，主要由Checker, Scheduler, Handler组成
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828154254697.png" alt="" /></p>
<p>Scheduling的组件如图。其他的工作都比较类似了
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828154519457.png" alt="" /></p>
<h2>Deploying Inference Services at ALCF</h2>
<p>Benoit Cote</p>
<p>这是在他们超算内部部署AI推理系统的工程工作</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160129688.png" alt="" /></p>
<p>Argonne硬件。真有钱啊
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160250248.png" alt="" /></p>
<p>推理service例子
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160426677.png" alt="" /></p>
<p>inference推理
<a href="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160613143.png">https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160613143.png</a></p>
<p>目前的模型情况
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828160752845.png" alt="" /></p>
<p>70users, 10 billion tokens generated. 目前 3500token/s</p>
<h2>Globus Compute Past and Future</h2>
<p>Josh Bryan</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828161407119.png" alt="" /></p>
<p>Globus 做了这么几年，基本上做了好多在分布式系统配置及计算上的工作</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828161831301.png" alt="" /></p>
<h2>Globus Compute Serialization Overview</h2>
<p>Chris Janidlo</p>
<p>Globus Compute 序列化的方法介绍</p>
<p><a href="https://docs.google.com/presentation/d/17VxpPSWPic6YGoGs5h5k8QkXAba-_hZzmM9hRC-k0LA/edit?slide=id.p1#slide=id.p1">Compute Serialization - Lightning Talk - Google 幻灯片</a>
PPT很详细，这里不介绍了</p>
<h2>Globus Compute + DataLad: Provenance-Based Workflow Scheduling in Remote Infrastructure</h2>
<p>Pedro Enrique Martinez Fernandez</p>
<p>主要是做在科学工作流的调度</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828163034992.png" alt="" /></p>
<h2>Facilitating Reproducibility Evaluations on HPC with Globus Compute and GitHub Actions</h2>
<p>Valerie Hayot-Sasson</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828163734341.png" alt="" /></p>
<p>很多的科学计算难以复现，我们尝试去做一个自动化的框架，帮助你自动跑程序。
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828163841994.png" alt="" /></p>
<p>这里边有几个问题</p>
<ol>
<li>data</li>
<li>Codes</li>
<li>HPC 环境</li>
</ol>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828165037060.png" alt="" /></p>
<p>目前有各种 logging, data, commits</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828165444679.png" alt="" /></p>
<h2>Deduplicating Billons of Documents for LLM Training</h2>
<p>LSHBloom: Memory-efficient, Extreme-scale Document Deduplication
Arham</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828170007138.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828170241146.png" alt="" /></p>
<h2>Accelerating QMCPy Notebook Tests with Parsl</h2>
<p>Joshua Herman</p>
<p>这是一个Parsl在notebook的使用案例</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828171431986.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250828171525046.png" alt="" /></p>
<p>这哥们非常好玩，有很多有趣的经验和开发经历。</p>
<h1>Day2</h1>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829090326353.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829090740193.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829092055456.png" alt="" /></p>
<h2>OpenCosmo</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829092944243.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829093326216.png" alt="" /></p>
<h2>Spectroscopy Pipeline</h2>
<p>Daniel</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829095105595.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829095926205.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829100336132.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829102233376.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829102402230.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103210861.png" alt="" /></p>
<h2>Model</h2>
<p>Haochen</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103530023.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103610493.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103652191.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103745453.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103852086.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829103947629.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829104033285.png" alt="" /></p>
<h2>Nu Workflow</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829104928615.png" alt="" /></p>
<h2>Agents</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829105255147.png" alt="" /></p>
<h2>Greg</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829105904545.png" alt="" /></p>
<h2>Parsl-Perf</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829110156194.png" alt="" /></p>
<h2>fun proj</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829111820811.png" alt="" /></p>
<p>chmod 770 /stor/substor0/haibin
chmod 770 /stor/substor0/haibin
chmod 770 /stor/substor0/haibin
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829121456559.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829122305181.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829122356196.png" alt="" /></p>
<h2>Yadu: Aurora + Parsl</h2>
<p>10624 Nodes</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250829123536985.png" alt="" /></p>
