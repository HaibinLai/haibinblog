---
title: "APAC 2024 Optimization Summary: HPC"
description: "HPC Groups: ZuDong Li (leader) Haibin Lai Benxiang Xiao Zixu Wang Wenhan Tan Wenbo An AI Groups: Yukun Yang Honglie Li Junyu Su Abstract In this report, we detail the optimization efforts conducted on two key applicatio…"
publishedAt: "2024-11-09T18:18:56Z"
updatedAt: "2024-12-04T20:55:15Z"
category: "Computer Science"
categories: ["Computer Science"]
tags: ["HPC", "高性能计算"]
author: "GB"
draft: false
slug: "apac-2024-optimization-report-summary"
legacySlug: "apac-2024-optimization-report-summary"
oldSlugs: []
wordpressId: 412
sourceUrl: "https://www.haibinlaiblog.top/index.php/apac-2024-optimization-report-summary/"
commentCount: 0
viewCount: 1995
likeCount: 0
dislikeCount: 0
showCitation: true
featuredImage: "https://www.haibinlaiblog.top/wp-content/uploads/2024/11/微信截图_20241110022340.jpg"
importedFromWordPress: true
---
<p><strong>HPC Groups:</strong>
ZuDong Li (leader)
Haibin Lai
Benxiang Xiao
Zixu Wang
Wenhan Tan
Wenbo An</p>
<p><strong>AI Groups:</strong>
Yukun Yang
Honglie Li
Junyu Su</p>
<hr />
<h2>Abstract</h2>
<p>In this report, we detail the optimization efforts conducted on two key applications for the APAC2024 competition: HPC HOOMD-blue and AI Llama2. Initially, we performed benchmark tests on both applications, transitioning from a single-node setup to a multi-node, multi-GPU environment. </p>
<p>For <strong>HOOMD-blue</strong>, a high-performance molecular dynamics simulation program, we carried out an in-depth analysis of the source code and implemented several optimizations. These included switching to the HPC-X communication library, applying O3 compiler optimization, fine-tuning UCX parameters, replacing Intel MPI with OpenMPI, adjusting program buffer settings, and employing NUMA-aware scheduling for domain decomposition to enhance performance in a multi-node setup.</p>
<p>In the case of <strong>Llama2</strong>, a large-scale language model used for AI tasks, we built upon benchmark results to profile different batch sizes and optimized performance on A100 GPUs using Tensor Cores. We also optimized the FSDP (Fully Sharded Data Parallel) strategy and parameters, replaced the NCCL communication library with MSCCL for improved multi-GPU communication, and introduced techniques to overlap computation with communication. Additionally, we incorporated faster computational operators to further boost training efficiency.</p>
<p>Through these efforts, we achieved significant performance improvements in both the HPC and AI tasks, deepening our knowledge of high-performance computing optimizations and enhancing our profiling capabilities.</p>
<div STYLE="page-break-after: always;"></div>
<h2>About us</h2>
<p>We are <code>SUSTech 0x01</code> Team:</p>
<p>Under supervision and support of <strong>Centre for Computational Science and Engineering</strong> in SUSTech,  we formed a diverse and experienced award-winning team.</p>
<p>We aim to foster next generation of HPC  talents through actual scientific research and attending international HPC challenges.</p>
<p>At <code>0x01</code>, we have abundant computational resources for student to maximize their practical HPC skills, as well as systematic and cutting-edge training.</p>
<p>![[aff6447a2ffc26efa392151137c1b97.jpg]]</p>
<div STYLE="page-break-after: always;"></div>
<h2>HPC HOOMD-blue</h2>
<h3>Introduction</h3>
<p>![[Pasted image 20241108193032.png]]</p>
<p>HOOMD-blue is a Python package that runs simulations of particle systems.
It performs hard particle Monte Carlo simulations of a variety of shape classes and molecular dynamics simulations of particles with a range of pair, bond, angle, and other potentials. Many features are targeted at the soft matter research community, though the code is general and capable of many types of particle simulations. It has been actively developed since March 2007 and available open source since August 2008. ^[1]</p>
<h3>CPU Task Workload And Benchmark</h3>
<p>The Benchmark needs us to compute WCA potential for the following parameter:</p>
<ul>
<li><strong>Workload</strong>: <a href="https://github.com/glotzerlab/hoomd-benchmarks/tree/trunk?tab=readme-ov-file#simulation-benchmarks">md_pair_wca</a></li>
<li><strong>Number of particles</strong>: <code>200,000</code></li>
<li><strong>Input data</strong>:hard_sphere_200000_1.0_3.gsd</li>
</ul>
<p>HOOMD-Blue Benchmark calculates <strong>WCA potential</strong> for N particles as workload. WCA potential (Weeks-Chandler-Andersen potential) is a potential energy function used to simulate intermolecular interactions. It is simple, computationally eﬃcient and suitable.</p>
<p>$$
U(r) = 4 \epsilon[(\frac{\sigma}{r})^{12} - (\frac{\sigma}{r})^{6}]
$$</p>
<ul>
<li>The WCA potential is commonly used in molecular dynamics simulations, especially when studying physical phenomena such as liquids, gases, and their phase transitions.</li>
<li>It provides higher computational efficiency by removing the attractive part of the potential.</li>
</ul>
<h3>System Architecture</h3>
<p><strong>![[Pasted image 20241108214237.png]]</strong></p>
<p>The system Architecture of HOOMD-blue is shown in the figure. In initialization part, the position and number of particle will be set, then the whole space will be divided into subdomain using a technique called <code>domain decomposition</code>. Then each subdomain will be sent to a MPI worker to a slot, computing forces and communicate with each other with buffer. After computation, they will gather and sent the result using <code>MPI_AllReduce</code> primitive, and do the computation again until reaching the steps and output result.</p>
<h3>Testing Platform</h3>
<p>To test the programme, we use QiMing cluster on SUSTech CCSE. It has 24 CPU cores for each nodes, 64GB Memory and connected with infiniband. </p>
<p>![[Pasted image 20241108214657.png]]</p>
<p>And we also use Gadi, it has 24 CPU cores per node with 192GB Memory and connected with infiniband.
![[Pasted image 20241108214714.png]]</p>
<p>The last cluster we use is NSCC. It has 128 cores per server and 512GB Memory and 100 Gbi infiniband.
![[Pasted image 20241108214730.png]]</p>
<div STYLE="page-break-after: always;"></div>
<h3>Baseline Testing and Analysis</h3>
<p>We test the Baseline of HOOMD in 3 machines with 1,2,4,8 and 16 nodes, and 32 nodes on Gadi and NSCC. As baseline, we use OpenMPI for HOOMD-blue.</p>
<p>![[Pasted image 20241108214914.png]]</p>
<p>We can find that before 4 nodes, the program’s performance scales up as the number of nodes increase. However after 4 nodes, the performance begins to slow down.</p>
<p>So what led to the slow down? We mainly consider on the communication and load imbalance of HOOMD-blue.</p>
<p>We first use Intel Vtune to see what is the bottleneck of the software on multi nodes. However, the profiler can only detect the cpython library and failed to reveal furthur call stack. </p>
<p>![[Pasted image 20241108221429.png]]</p>
<p>So we try to use IPM analysis to find out what happen to the communication.</p>
<p>![[Pasted image 20241108220804.png]]</p>
<p>The IPM analysis shows that the communication time increase from the ratio of 15% to nearly 55%. So the communication time counts for slowing down the performance.</p>
<p>And here the figure shows that different clusters get different communication properties.
![[Pasted image 20241108221043.png]]</p>
<p>And these properties difference may be due to the strategy of MPI_Allreduce that MPI choosing. The figure shows different strategy that OpenMPI choose for different chunk file on <code>MPI_AllReduce</code> Primitive.</p>
<p>![[Pasted image 20241108221059.png]]</p>
<p>As we can see, the OpenMPI will choose different algorithm based on the size and the number of chunk file. When the file is small, a butterfly algorithm for different nodes will be called. When the file is larger and less than MPI Process, a Reduce&amp;Broadcast algorithm will be called. If the number is larger, a Ring algorithm and even a segmented ring algorithm will be called.</p>
<p>So after this profiling, we think it may be the strategy that OpenMPI used may not suits best for the HOOMD communication.</p>
<h3>HPC-X profiling</h3>
<p>To profile this, we use HPC-X to select a better strategy for communication.   HPC-X™ is a comprehensive software package that includes MPI, SHMEM and UPC communications libraries. It integrates <strong>MPI</strong> (specifically <strong>OpenMPI</strong> and <strong>Intel MPI</strong>) to optimize message passing in distributed computing.By only changing that, the performance on QiMing get 413.8% improvement on 16 nodes.</p>
<p>![[Pasted image 20241108222011.png]]</p>
<p>After initiating hcoll, we find all parameters of All_Reduce from hcoll_info.</p>
<p>Here we try to find the best params from 32 nodes with each node 24 nodes:</p>
<pre><code class="language-bash">--mca coll_hcoll_enable 1
--x HCOLL_ENABLE_SHARP=1 (Correlated to Hardware Switch)
--x HCOLL_ALLREDUCE_LB_SUPPORT=0
--x HCOLL_BCOL_P2P_LARGE_ALLREDUCE_ALG=1
--x HCOLL_BCOL_UCX_P2P_HYBRID_SRA_NODE_RADIX=3
--x HCOLL_BCOL_UCX_P2P_HYBRID_SRA_NET_RADIX=2</code></pre>
<p>And now we are trying to select better parameters for HPC-X. We choose SHArP to enable smart switch, P2P_Large AllReduce Algorithm etc.</p>
<p>And here we get another 9% improving with OSHMEM and 8% for MPI.
![[Pasted image 20241108222227.png]]</p>
<p>The performance comparison between HPC-X , IntelMPI and OpenMPI shows that HPC-X delivers superior performance and greater scalability with the same number of cores.
And we hope rebuilding OpenMPI with HPC-X can help us make a better decision on improving the Collective Communication Algorithm.</p>
<p>Here HPC-X gives 29.89% improvement for 32 nodes.
![[Pasted image 20241108222801.png]]
However for NSCC, HPC-X does not get significant improvement in NSCC. It only cause 1.78% improvement for 32 nodes. We gauss that it may be the cause of Hardware like the bandwith limit from infiniband.
![[Pasted image 20241108222843.png]]</p>
<h3>O3 Compilation</h3>
<p>Next we use O3 compiler flags to get 5 more percent optimization. O3 flags will help do optimizations like <strong>Loop unrolling</strong>, <strong>Vectorization</strong> and <strong>Instruction reordering</strong>. Also, we try to use <code>-march=native</code> which would generate code optimized for CPU microarchitecture, enabling features like <strong>AVX2</strong>, <strong>FMA</strong> (Fused Multiply-Add), and other instruction sets on the nodes.</p>
<p>![[Pasted image 20241108222426.png]]</p>
<h2>Optimal UCX params</h2>
<p>A core component of HPC-X is <strong>UCX (Unified Communication X)</strong>, which is a high-performance communication framework that supports multiple network interfaces, including InfiniBand, Ethernet, and other high-speed networks. UCX offers low-latency and high-bandwidth communication, making it suitable for large-scale parallel applications.</p>
<p>UCX_TLS refers to the &quot;Transport Layer Selection&quot; feature in the Unified Communication X (UCX) framework. It allows users to specify which transport protocols UCX should use for communication in a parallel or distributed computing environment.</p>
<p>![[Pasted image 20241108223039.png]]</p>
<p>We test multi combination of UCX_TLS to get better performance. Here we test UCX_TLS in bottleneck scale 16nodes.</p>
<table>
<thead>
<tr>
<th>Params</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>all</td>
<td>use all the available transports</td>
</tr>
<tr>
<td>sm</td>
<td>all shared memory transports</td>
</tr>
<tr>
<td>rc</td>
<td>reliable connection</td>
</tr>
<tr>
<td>ud</td>
<td>unreliable datagram transport</td>
</tr>
<tr>
<td>dc</td>
<td>Mellanox scalable offloaded dynamic con_x0002_nection transport</td>
</tr>
</tbody>
</table>
<p>![[Pasted image 20241108223507.png]]
Here from the figure we find that <code>shm</code> combine with <code>dc_x</code> may best out perform the benchmark with 4740.571( the third one on performance. <code>dc_x</code> in UCX refers to the dynamic connected transport mode, used for reliable, connection-oriented communication between nodes in a distributed system. It utilizes RDMA like InfiniBand  for high-throughput, low-latency communication, with direct memory access and minimal CPU involvement.</p>
<p>However, <code>shm</code> combine with <code>dc_x</code> does not have much improvements in both ompi and hpcx.</p>
<p>![[Pasted image 20241108223615.png]]</p>
<p>And as for NSCC, we test multi combination of UCX_TLS to get better performance.
![[Pasted image 20241108223812.png]]</p>
<p>And the best parameter is <code>shm</code> combine with <code>ud_mlx5</code>. <code>ud_mlx5</code> is a transport mode in UCX that enables connectionless communication (UD) using the Mellanox mlx5 driver, leveraging RDMA capabilities for low-latency, high-throughput data transfer.</p>
<p>Here we get 45.3% performance improvement with ompi and 44.0% with hpcx in 32 nodes. UCX gets high improvement for NSCC cluster with different parameter.</p>
<p>![[Pasted image 20241108223849.png]]</p>
<p>![[Pasted image 20241108224322.png]]</p>
<p>![[Pasted image 20241108224914.png]]</p>
<p>The reason may due to a faster communication between nodes. With less buffer on UCX framework and high affinity with Hardware, the time of <code>MPI_Waitall</code> dropped, and the time in <code>MPI_AllReduce</code> dropped significantly too.
![[Pasted image 20241108224446.png]]</p>
<h3>Better buffer parameters</h3>
<p>Buffer is a params to set the neighbor list buffer distance in hoomd.
The neighbor list recomputes itself more often when buffer is small, and the pair force computation takes more time when buffer is large.</p>
<p>![[Pasted image 20241108224711.png]]</p>
<p>Here we test different buffer across nodes to find out which value of buffer suits best.
![[Pasted image 20241108224726.png]]</p>
<p>![[Pasted image 20241108224934.png]]</p>
<p>![[Pasted image 20241108225039.png]]</p>
<p>![[Pasted image 20241108225053.png]]</p>
<p>![[Pasted image 20241108225105.png]]</p>
<h3>Single Node Optimization Model Formulation</h3>
<p>As we mentioned before, HOOMD-blue use a technique called <code>Domain Decomposition</code> .</p>
<p>Domain decomposition is a technique that divides the simulation space into multiple subdomains (or &quot;domains&quot;), each of which can be independently computed on different processors or computing cores.</p>
<p>When you create the State object in an MPI simulation on more than 1 rank, HOOMD-blue splits the simulation box into <code>k x l x m</code> domains. The product of k, l and m is equal to the number of ranks you execute. The domains are defined by planes that split the box. By default, the planes are evenly spaced and chosen to <strong>minimize the surface area between the domains</strong>.
![[Pasted image 20241108225521.png]]
![[Pasted image 20241108225113.png]]</p>
<p>Computations like pair forces in MD or hard particle overlap checks in HPMC, need to compute interactions with particles from a neighboring domain. This establishes a lower limit on the domain size. For MD, this is the sum of the largest pair potential r_cut and the neighbor list <code>buffer</code> .</p>
<p>So here we have a problem on NUMA node scheduling. As we know the cluster is a NUMA achitecture and the data and computation will be seperate to different computation slot. While when different MPI ranks are communicating, the distance cause by NUMA will lead to communication effort. So how to assign each MPI rank to each slot, so that the communication between different NUMA socket will be minimize?
![[Pasted image 20241108225205.png]]</p>
<p>Here we try to solve the problem with mathematical modeling as following </p>
<h4>Objective</h4>
<p>Minimize the deviation from the target number of neighboring domains on the same NUMA node:
$$
\text{Minimize} \quad (\text{deviation})^2
$$
Where:</p>
<ul>
<li>Deviation is the difference between the actual and target number of neighboring domains on the same NUMA node.
<h4>Constraints</h4>
<ol>
<li><strong>Deviation Constraint:</strong>
$$
\text{deviation} = \sum<em>{i=0}^{P-1} \sum</em>{j=0}^{P-1} \sum_{k=0}^{K-1} \text{adjacency_matrix}[i][j] \cdot x[i, k] \cdot x[j, k] - \text{target}
$$</li>
</ol></li>
</ul>
<ol start="2">
<li>
<p><strong>Each NUMA node can bind at most 16 processes:</strong>
$$
\sum_{i=0}^{P-1} x[i, k] \leq 16 \quad \forall k \in {0, \ldots, K-1}
$$</p>
</li>
<li>
<p><strong>Each process is bound to exactly one NUMA node and two logical cores:</strong>
$$
\sum<em>{k=0}^{K-1} x[i, k] = 1 \quad \forall i \in {0, \ldots, P-1}
$$
$$
\sum</em>{j=0}^{C-1} y[i, j] = 2 \quad \forall i \in {0, \ldots, P-1}
$$</p>
</li>
<li>
<p><strong>Logical cores are paired (hyper-threading):</strong></p>
</li>
</ol>
<p>$$
y[i, j] = y[i, j+1] \quad \forall i \in {0, \ldots, P-1}, \forall j \in {0, 2, 4, \ldots, C-2}
$$</p>
<ol start="5">
<li><strong>NUMA and logical core mapping:</strong></li>
</ol>
<p>$$
\sum_{j \in \text{numa_node_mappings}[k]} y[i, j] = 2 \cdot x[i, k] \quad \forall i \in {0, \ldots, P-1}, \forall k \in {0, \ldots, K-1}
$$</p>
<ol start="6">
<li><strong>Each logical core can bind at most one process:</strong></li>
</ol>
<p>$$
\sum_{i=0}^{P-1} y[i, j] \leq 1 \quad \forall j \in {0, \ldots, C-1}
$$</p>
<ol start="7">
<li><strong>NUMA node usage indicator:</strong></li>
</ol>
<p>$$
z[k] \geq \frac{1}{16} \sum_{i=0}^{P-1} x[i, k] \quad \forall k \in {0, \ldots, K-1}
$$</p>
<h4>Variables</h4>
<ul>
<li>
<p>( $x[i, k]$ ): Binary variable indicating if process ($i$ ) is bound to NUMA node ( $k$ ).</p>
</li>
<li>
<p>( $y[i, j]$ ): Binary variable indicating if process ($i$ ) is bound to logical core ( $j$ ).</p>
</li>
<li>
<p>( $z[k]$ ): Binary variable indicating if NUMA node ( $k$ ) is used.</p>
</li>
</ul>
<p>we use Gurobi, a mathematical programming optimization software for non-linear problems to solve the modeling problem. Then we gengerate new MPI rankfile that will assign the ranks to slot.
![[Pasted image 20241108230134.png]]</p>
<p>This model aims to optimize the binding of processes to NUMA nodes and logical cores within a single node, minimizing the deviation from the target adjacency.</p>
<p>And by scheduling, we make 28.57% improvement for one node on NSCC with 64 ranks. And for 128 ranks we get 7.97% improvement. However sometimes the benchmark will drop down than the baseline. This may because the non-linear model is complicated to solve and a worse scheduling method comes before Gurobi finds better solution.</p>
<p>![[Pasted image 20241108230303.png]]</p>
<p>And since here we get information for different ranks and their neighbors, we believe that our NUMA aware scheduling may extend to multinode with more sufficient learning.</p>
<p>![[Pasted image 20241108230922.png]]</p>
<p>Also, we explore and get some knowledge on PAC, a ICS' 23 paper. It's a scheduler on a NUMA node with different CPUs, which lead to a harder modeling problem. And we think we can furthur explore that part to enhance our understanding on NUMA.</p>
<h3>Summary</h3>
<p>So in summary, we take different optimization on Qiming2.0, Gadi and NSCC. The chart shows our optimization and our future work.
![[Pasted image 20241108230335.png]]</p>
<p>And that will be the end of our HPC profiling.</p>
<div STYLE="page-break-after: always;"></div>
<h2>AI Llama 2</h2>
<p>LitGPT Llama2 is a specialized integration of Llama 2, a powerful language model developed by Meta. With LitGPT, a framework designed to enable fine-tuning and customization of large language models for specific tasks or domains.</p>
<h3>Testing Platform</h3>
<p>![[Pasted image 20241108232359.png]]</p>
<div STYLE="page-break-after: always;"></div>
<h2>Reference</h2>
<p>[1] Anderson, J. A., Glaser, J., and Glotzer, S. C. 2019. HOOMD-blue: A Python package for high-performance molecular dynamics and hard particle Monte Carlo simulations. <em>arXiv preprint arXiv:1308.5587</em>. Retrieved from <a href="https://arxiv.org/abs/1308.5587">https://arxiv.org/abs/1308.5587</a></p>
<p>[2] P. Shamis <em>et al</em>., &quot;UCX: An Open Source Framework for HPC Network APIs and Beyond,&quot; <em>2015 IEEE 23rd Annual Symposium on High-Performance Interconnects</em>, Santa Clara, CA, USA, 2015, pp. 40-43, doi: 10.1109/HOTI.2015.13.</p>
<p>[3] Andi Drebes, Antoniu Pop, Karine Heydemann, Nathalie Drach, and Albert Cohen. 2016. NUMA-aware scheduling and memory allocation for data-flow task-parallel applications. SIGPLAN Not. 51, 8, Article 44 (August 2016), 2 pages. <a href="https://doi.org/10.1145/3016078.2851193">https://doi.org/10.1145/3016078.2851193</a></p>
<p>[4] PAC: Preference-Aware Co-location Scheduling on Heterogeneous NUMAArchitectures To Improve Resource Utilization (ICS 23)</p>
<p>[5] Domain Decomposition. David E. Keyes. Department of Applied Physics &amp; Applied Mathematics Columbia University <a href="https://csweb-prod.cs.princeton.edu/picasso/seminarsF04/Keyes.pdf">Technologies and Tools for High-Performance Distributed Computing</a></p>
<p>[6] An Introduction to Domain Decomposition Methods Algorithms, Theory, and Parallel Implementation. Victorita Dolean, Pierre Jolivet, Frédéric Nataf. <a href="https://www.ljll.fr/nataf/OT144DoleanJolivetNataf_full.pdf">OT144DoleanJolivetNataf_full.pdf</a></p>
<p>[7] Scheduling NUMA-aware workloads. Redhat Document <a href="https://docs.redhat.com/en/documentation/openshift_container_platform/4.14/html/scalability_and_performance/cnf-numa-aware-scheduling#cnf-numa-aware-scheduling">Chapter 9. Scheduling NUMA-aware workloads | Red Hat Product Documentation</a></p>
<p>[8] Andi Drebes, Antoniu Pop, Karine Heydemann, Nathalie Drach, and Albert Cohen. 2016. NUMA-aware scheduling and memory allocation for data-flow task-parallel applications. SIGPLAN Not. 51, 8, Article 44 (August 2016), 2 pages. <a href="https://doi.org/10.1145/3016078.2851193">https://doi.org/10.1145/3016078.2851193</a></p>
<p>[9] NVIDIA A100 Tensor Core GPU Architecture <a href="https://images.nvidia.cn/aem-dam/en-zz/Solutions/data-center/nvidia-ampere-architecture-whitepaper.pdf">nvidia-ampere-architecture-whitepaper.pdf</a></p>
<p>[10] Cowan, M., Maleki, S., Musuvathi, M., Saarikivi, O., and Xiong, Y. 2022. GC3: An Optimizing Compiler for GPU Collective Communication. arXiv:2201.11840 [cs.DC]. <a href="https://arxiv.org/abs/2201.11840">https://arxiv.org/abs/2201.11840</a>.</p>
<p>[11] Zixian Cai, Zhengyang Liu, Saeed Maleki, Madanlal Musuvathi, Todd Mytkowicz, Jacob Nelson, and Olli Saarikivi. 2021. Synthesizing optimal collective algorithms. In Proceedings of the 26th ACM SIGPLAN Symposium on Principles and Practice of Parallel Programming (PPoPP '21). Association for Computing Machinery, New York, NY, USA, 62–75. <a href="https://doi.org/10.1145/3437801.3441620">https://doi.org/10.1145/3437801.3441620</a></p>
<h1>EOF</h1>
