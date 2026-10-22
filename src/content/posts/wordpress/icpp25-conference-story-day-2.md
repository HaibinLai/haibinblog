---
title: "ICPP25 Conference story: Day 2"
description: "Anne Elster, \"Parallel Computing and Geophysical Forecasting\" Professor Anne C. Elster Norwegian Univ. of Science and Technology Center for Geophysical Forecasting University of Texas at Austin Geophysical forecasting o…"
publishedAt: "2025-09-16T10:06:44Z"
category: "Academic"
categories: ["Academic"]
tags: ["HPC", "ICPP"]
author: "GB"
draft: false
slug: "icpp25-conference-story-day-2"
legacySlug: "icpp25-conference-story-day-2"
oldSlugs: []
wordpressId: 978
sourceUrl: "https://www.haibinlaiblog.top/index.php/icpp25-conference-story-day-2/"
commentCount: 0
viewCount: 1470
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2025-09/icpp25-conference-story-day-2.webp"
---
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916173910299.png" alt="16d4a3b80eb7a9b440a92e21425f314b.jpg" /></p>
<h2>Anne Elster, &quot;Parallel Computing and Geophysical Forecasting&quot;</h2>
<p>Professor Anne C. Elster Norwegian Univ. of Science and Technology Center for Geophysical Forecasting University of Texas at Austin</p>
<p>Geophysical forecasting offers the opportunity to leverage some of the cutting-edge technologies from the oil and gas sector to improve, for instance, <strong>geohazard monitoring and forecasting sudden events along roads and railways</strong>. This also includes the use of new methods for monitoring and mapping life and geophysical events at sea and near the seabed. Modern seismic sensors and DAS (Distributed Acoustic Sensing) systems also generate <strong>vast datasets</strong> we will need <strong>both AI and parallel computing techniques to fully make use of</strong>. These tasks thus offer many interesting research challenges related to parallel and distributed computing over the next several years.</p>
<p>This talk will highlight some of the ongoing work my group and colleagues are involved in at The Center for Geophysical Forecasting at NTNU. This includes discussing some of our work related to utilizing AI and HPC techniques such as autotuning and combining real experimentation with modeling and vice versa, and how these can impact applications.</p>
<p>They are developing a good <strong>Geophysical Forecasting</strong> software using OpenMP and CUDA. And they accerlate the running time from 4 hour to  6 seconds (?)</p>
<p>Their software running result:</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250910114607806.png" alt="da8faa30e085147901787717d2e015d4.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250910115955138.png" alt="234726e52270ce413547e75467e85ec0.jpg" /></p>
<p><strong>Smoothed Particle Hydrodynamics</strong></p>
<p>Some of the main computational methods they used is SPH:
SPH simulation -&gt; Smoothed Particle Hydrodynamics（光滑粒子流体动力学方法 in Chinese）</p>
<p><strong>How it works</strong></p>
<ul>
<li>Imagine each particle has a <strong>“smoothing kernel”</strong> (like a soft sphere around it).</li>
<li>Physical quantities (like density or pressure) at any point are computed by taking a <strong>weighted average</strong> of nearby particles inside this kernel.</li>
<li>The fluid equations (mass, momentum, energy conservation) are rewritten in terms of <strong>particle interactions</strong>.</li>
</ul>
<p>So the particles move according to physics, and together they behave like a continuous fluid.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250910115258021.png" alt="" /></p>
<p><strong>Full Waveform Inversion</strong></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250910120501303.png" alt="9d74e6203f904d8bc0850449abad2ae3.jpg" /></p>
<p><strong>Full Waveform Inversion (FWI)</strong> is a <strong>computational method in geophysics</strong> used to create very detailed images of the Earth’s subsurface.</p>
<ul>
<li>Input: Seismic data (waves recorded after they travel through the Earth).</li>
<li>Output: A high-resolution model of underground properties (like velocity, density, etc.).</li>
</ul>
<p>It’s widely used in <strong>oil &amp; gas exploration</strong>, <strong>earthquake studies</strong>, and <strong>geothermal energy research</strong>.</p>
<p><strong>How it works</strong></p>
<ol>
<li><strong>Start with a guess</strong>: Assume an initial Earth model (e.g., velocity distribution).</li>
<li><strong>Simulate waves</strong>: Use numerical methods (like finite differences) to compute how seismic waves would travel through this model.</li>
<li><strong>Compare with real data</strong>: Compare the simulated seismic waveforms with the actual recorded seismic signals.</li>
<li><strong>Update the model</strong>: Adjust the Earth model to reduce the difference (the <em>misfit</em>).</li>
<li><strong>Iterate</strong>: Repeat the process until simulated and real data match closely.</li>
</ol>
<p><strong>AI+HPC</strong></p>
<p>That's a little close to Lucas' jobs! </p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250910120804966.png" alt="0a3fffa5a36f14920fbeee5359b90d74.jpg" /></p>
<h2>Industry Session: Max Chung, Supermicro</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916173928869.png" alt="67d0906feca018b6b6f2bea983debf62.jpg" /></p>
<p>Max introduce what supermicro are selling
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916173947238.png" alt="ea64b6f9e5c9cbab9dac1c32cbe504c1.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174019635.png" alt="e552174f1e2aea69555c4b694a07cca4.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174031269.png" alt="eeaad663eab720160351bb584b95649c.jpg" /></p>
<p>How much is their NVLink speed:
200GB/s for RDMA</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174113346.png" alt="dedc833ed8ae6693d32b9421b9eb8919.jpg" /></p>
<p>CXL still lack of scenario</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174151050.png" alt="aeb5b7fe05e3494583a8c8a237ebb25c.jpg" /></p>
<p><strong>How do you know that how many power do you want?</strong>
Run HPL to measure the full power</p>
<p><strong>How to control power on each node?</strong>
On board Hardware:
BMC
PDU: power distribution unit</p>
<h2>break</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174331626.png" alt="" /></p>
<h2>Paper Session 7: Architecture</h2>
<p>Toucan</p>
<p>Chairman: Taisuke Boku</p>
<h3>LLaMCAT: Optimizing Large Language Model Inference with Cache Arbitration and Throttling </h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174632036.png" alt="d83368d6d765ba9dfe3dba2c45411027.jpg" /></p>
<p>We introduce LLaMCAT, a novel approach to optimize the LLC for LLM inference. <strong>LLaMCAT combines Miss Status Holding Register (MSHR)- and load balance-aware cache arbitration with thread throttling to address stringent bandwidth demands and minimize cache stalls in KV Cache access.</strong> We also propose a hybrid simulation framework integrating analytical models with cycle-level simulators via memory traces, balancing architecture detail and efficiency.</p>
<p><strong>Problem</strong></p>
<p>LLM decoding is memory bound.</p>
<p>We found that decoding here they only utilize LLC well, but for the first level Cache, that's not very good</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174656269.png" alt="4fd3ad7b91630a17052d8839d3381144.jpg" /></p>
<p><strong>Key Pain</strong>
Miss Handling Arch contention stalls even hit traffic</p>
<p>LLC is shared among CPU cores / GPU cores.</p>
<p>GQA reduces but not eliminates memory-boundedness</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174708236.png" alt="3355149b7e74b45533891683eace1e4b.jpg" /></p>
<p>Cache has 2 bandwidth
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174718604.png" alt="d91513d3c60bed12549b1717bb15d8fb.jpg" /></p>
<p>upstream bandwidth (SRAM bandwidth)
downstream bandwidth (more related to the miss handling throughput)
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174727243.png" alt="8caf9e7d079be7ea1e5c9e0d3ff1e240.jpg" /></p>
<p>Main Design
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174759368.png" alt="332ac9fe7ff09d3aba1a0410cb83c306.jpg" /></p>
<p>Contribution
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174818728.png" alt="91a3305d006d31b41b895920d16b0216.jpg" /></p>
<p><strong>Power Capping of GPU Servers for Machine Learning Inference Optimization</strong> </p>
<p>OSU Mayuan</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174830919.png" alt="a7beda5f960a218446258867c8f87c68.jpg" /></p>
<p>Data center analysis system
server lab</p>
<p>Scene: AI on datacenter</p>
<p>Power capping technique
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174843270.png" alt="88bb06a5c564c70a8e138b4a69f0c039.jpg" /></p>
<p>Dynamic Voltage and Frequency Scaling
DVFS</p>
<p><strong>Solution</strong>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174903051.png" alt="40a07e5b9d4d97b7ad9bc5b40c1c575e.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916174915459.png" alt="cdbde9e68476c7e21427e37c8bc9d89e.jpg" /></p>
<h2>Noon</h2>
<p>A good part I didn't listen:</p>
<p>Efficient Cross-Datacenter Congestion Control with Fast Control Loops</p>
<p>Paper Session 10: Programming Environment
<strong>Design and Optimization of GPU-Aware MPI Allreduce Using Direct Sendrecv Communication</strong>
<strong>Optimizing NumPy with SVE Acceleration on ARM Architectures</strong>
<strong>pyGinkgo: A Sparse Linear Algebra Operator Framework for Python</strong> </p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175211988.png" alt="4572c9e1062e6fbfcf56a878509cff64.jpg" /></p>
<p>afternoon 下午</p>
<p>Online Paper Session 8
Zoom online session
<strong>SmartBlock: Adaptive Block Floating Point Quantization for Efficient DNN Acceleration</strong>
Design of Interposer Interconnection Network Based on High-Radix Interposer Routers
<strong>Automated FPGA Accelerator Generation Framework for Transformers with Dataflow Optimization</strong> </p>
<h2>Paper Session 8: Multidisciplinary</h2>
<p>Now come to my part!</p>
<h3>Performant Unified GPU Kernels for Portable Singular Value Computation Across Hardware and Precision</h3>
<p>From MIT</p>
<p>They try to profile GPU kernel on computation for different GPU, on singular value</p>
<p><strong>ParaCOSM: A Parallel Framework for Continuous Subgraph Matching</strong> </p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175452795.png" alt="39c9c1e99b88eb7f960b7191799f1761.jpg" /></p>
<p>Full video:</p>
<p>【ICPP25 当高频交易遇上图计算】 <a href="https://www.bilibili.com/video/BV1njHhzbEAT/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV1njHhzbEAT/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<p><strong>Thievory: Graph Processing with Multi-GPU Memory Stealing</strong> </p>
<p>Paper Session 11: System Architecture and System Software
<strong>PTWalker: Cache-Efficient Random Walks via Alternating Dual-Subgraph Walker Updating</strong>
<strong>Accelerating an Electromagnetic Simulation via Memory-Constrained Task-Based Load Balancing</strong>
<strong>Leave No One Behind: Fair and Efficient Tiered Memory Management for Multi-Applications</strong> </p>
<p>Online Paper Session 9
Zoom online session
<strong>SINA: Accelerating Time Synchronization in Large-Scale Network Simulation Using In-Network Allreduce</strong>
<strong>Optimizing Direct Convolutions on High-Performance Multi-Core DSPs</strong>
<strong>SpeedSketch: An Ultra-Fast Sketch Generation and Delta Encoding Framework for Delta Compression</strong> </p>
<p>Online ICPP Paper session</p>
<h2>Paper Session 9: AI in Computing &amp; Performance</h2>
<p>Toucan
<strong>Auto-Stencil: Performance-Driven Stencil Optimization with Hardware Feedback for LLMs</strong>
From Qinghua HPC-Science Team</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175743754.png" alt="ed8067cf760edec6864892347646bb25.jpg" /></p>
<p><strong>Solving Extended Flexible Job Shop Scheduling Problems with Deep Reinforcement Learning</strong>
<strong>Architecture-Aware Models of AI Engines for High-Performance Matrix Matrix Multiplication</strong> </p>
<p>Onsite Paper</p>
<h2>Paper Session 12: Algorithms &amp; Performance</h2>
<p>Macaw</p>
<h3>Deadline-Aware Scheduling of Mixed-Criticality Tasks</h3>
<p>Maxime focus on an AI4Sci Software: ALCF, to do scheduling works on different CPU nodes.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175813143.png" alt="2281578525aa5ea51d30667af080097c.jpg" /></p>
<p>Now they are good for using DP linear scheduling, but on multiple CPU, it's NP hard.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175825033.png" alt="218a07d64a9705360dafa1e5794ab2a1.jpg" /></p>
<p>So maxime use a greedy algorithm:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916175835217.png" alt="9689c51f4d459a2831ce7d1cb535d01f.jpg" /></p>
<h3>Fast Exact Diameter Computation of Sparse Graphs</h3>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180208357.png" alt="533a8913d15842e52fb3b5487f5be11c.jpg" /></p>
<p><strong>Joint Prediction and Matching for Computing Resource Exchange Platforms</strong> </p>
<h2>Wonderful Night</h2>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180306946.png" alt="f786b1d82c7eb803d57e53135c0e6a14.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180318445.png" alt="20e26aa76646feea694f8fd7db57dda5.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180359283.png" alt="ce671ed3f54de9698c9fd0cb4b92a0ab.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180346471.png" alt="9c5fbc4fb8ae769cdb217f375a47fde2.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180502786.png" alt="b1f9ee56787818e75816956f2a98b4b0.jpg" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250916180517314.png" alt="3881cf8d8f77455bc167823185df8b92.jpg" /></p>
<p>Just have a great day and a great conference!!</p>
