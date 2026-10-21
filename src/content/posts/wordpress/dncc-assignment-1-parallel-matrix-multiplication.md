---
title: "DnCC Assignment 1: Parallel Matrix Multiplication"
description: "https://github.com/HaibinLai/Distributed-and-Cloud-Computing.git 【分布与云计算 - DnCC 复习】 https://www.bilibili.com/video/BV1eovaBTEW9/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4 Setup Compile We can use…"
publishedAt: "2025-12-30 01:00:45"
updatedAt: "2025-12-30 18:29:36"
category: "Distributed Systems"
tags: []
draft: false
slug: "dncc-assignment-1-parallel-matrix-multiplication"
legacySlug: "dncc-assignment-1-parallel-matrix-multiplication"
wordpressId: 1108
sourceUrl: "https://haibin-blog.vercel.app/index.php/dncc-assignment-1-parallel-matrix-multiplication/"
commentCount: 0
importedFromWordPress: true
---
<p><a href="https://github.com/HaibinLai/Distributed-and-Cloud-Computing.git">https://github.com/HaibinLai/Distributed-and-Cloud-Computing.git</a></p>
<p>【分布与云计算 - DnCC 复习】 <a href="https://www.bilibili.com/video/BV1eovaBTEW9/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV1eovaBTEW9/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<p><img src="https://haibin-blog.vercel.app/wp-content/uploads/2025/12/image-1767090453255.png" alt="file" /></p>
<h2>Setup</h2>
<p><strong>Compile</strong></p>
<p>We can use <code>OpenMPI</code> or <code>Intel MPI</code> to compile and run the code.</p>
<p>To use <code>OpenMPI</code>, we can install it from official website:
<a href="https://www.open-mpi.org/software/ompi/v5.0/">https://www.open-mpi.org/software/ompi/v5.0/</a></p>
<p>For ubuntu user it can install using apt.</p>
<pre><code class="language-bash">sudo apt install openmpi-bin libopenmpi-dev</code></pre>
<p>To use <code>Intel MPI</code>, you can use the following command after installing from <code>Intel MPI</code> <a href="https://www.intel.com/content/www/us/en/developer/tools/oneapi/base-toolkit-download.html">https://www.intel.com/content/www/us/en/developer/tools/oneapi/base-toolkit-download.html</a></p>
<pre><code class="language-bash"># source /path/to/intel/setvars.sh # if use
mpicc mpi_matrix_base.c -o mpi_matmul</code></pre>
<p><strong>Run the code</strong></p>
<pre><code class="language-bash">mpirun -np 4 ./mpi_matmul</code></pre>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922222519238.png" width="80%">
</div>
<h2>Program Design</h2>
<p>The process of the program is shown as following:</p>
<ol>
<li>Init matrix data.</li>
<li>Do data distribution to every workers using <code>MPI_Scatterv</code> and <code>MPI_Bcast</code>.</li>
<li>For each workers and root, receive and compute the data</li>
<li>Use <code>MPI_Gatherv</code> to collect the result
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922201843034.png" alt="image.png" /></li>
</ol>
<p>We spilt matrix A and do computation with B:</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922231902156.png" width="60%">
</div>
<p>And it provides the correct result since we can do it mathematically:
$$AB= \begin{bmatrix} A^{(1)}\ A^{(2)}\ \vdots\ A^{(P)} \end{bmatrix} B = \begin{bmatrix} A^{(1)}B\ A^{(2)}B\ \vdots\ A^{(P)}B \end{bmatrix}=\;\begin{bmatrix} C^{(1)}\ C^{(2)}\ \vdots\ C^{(P)} \end{bmatrix}=C\;$$</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922232414942.png" alt="image.png" /></p>
<h3>Init</h3>
<p>Warning: if the size is greater than 512, it will cause fault. To solve this, a optimal solution is to assign them on heap by using <code>malloc</code>.</p>
<pre><code class="language-CPP">int rank, mpiSize;
double a[MAT_SIZE][MAT_SIZE],      /* matrix A to be multiplied */
         b[MAT_SIZE][MAT_SIZE],       /* matrix B to be multiplied */
         c[MAT_SIZE][MAT_SIZE],       /* result matrix C */
         bfRes[MAT_SIZE][MAT_SIZE];   /* brute force result bfRes */

/* You need to intialize MPI here */
MPI_Init(&amp;argc, &amp;argv);
MPI_Comm_rank(MPI_COMM_WORLD, &amp;rank);
MPI_Comm_size(MPI_COMM_WORLD, &amp;mpiSize);</code></pre>
<h3>Communication</h3>
<p>We use <code>MPI_Scatterv</code> to separate matrix A, and use <code>MPI_Bcast</code> to send matrix B to each process.</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922230538579.png" width="45%">
</div>
<p>The Broadcast code is shown as following.</p>
<ol>
<li>Broadcast matrix B.</li>
<li>Calculate number of elements and offsets of A for each processes.</li>
<li>Each process inits buffer <code>A_local</code> and <code>C_local</code> for receiving data and computation.</li>
<li>Broadcast matrix A.</li>
</ol>
<pre><code class="language-c">/* Send matrix data to the worker tasks */
MPI_Bcast(&amp;b[0][0], MAT_SIZE*MAT_SIZE, MPI_DOUBLE, 0, MPI_COMM_WORLD);

// split A by row
int rows_per_proc = MAT_SIZE / mpiSize;
int rem = MAT_SIZE % mpiSize;
int offset = 0;
for (int p = 0; p &lt; mpiSize; p++) {
    int rows = rows_per_proc + (p &lt; rem ? 1 : 0);
    sendcounts[p] = rows * MAT_SIZE;     // number of elements
    displs[p]     = offset * MAT_SIZE;   // displacement (in elements)
    offset += rows;
}
myrows = sendcounts[rank] / MAT_SIZE;

// each process&#039;s local buffer
double *A_local = malloc((size_t)myrows * MAT_SIZE * sizeof(double));
double *C_local = calloc((size_t)myrows * MAT_SIZE, sizeof(double));

// distribute rows of A
MPI_Scatterv(&amp;a[0][0], sendcounts, displs, MPI_DOUBLE,
    A_local, myrows*MAT_SIZE, MPI_DOUBLE,
    0, MPI_COMM_WORLD);</code></pre>
<p><strong>Why we use <code>MPI_Scatterv</code>:</strong>
<code>MPI_Scatter</code> distributes equal-sized chunks of data from the root to all processes, so every process receives the same number of elements.<br />
<code>MPI_Scatterv</code> is more flexible: <strong>it allows variable-sized chunks</strong>, using <code>sendcounts</code> and <code>displs</code> to specify how much data each process gets and where it starts in the buffer.</p>
<p>Since  we may not divide all the data equally (like for N=500, process_num=8), there must have a process take extra computation.</p>
<h3>Local Computation</h3>
<p>Same as single thread computation.</p>
<pre><code class="language-CPP">/* Compute its own piece */
for (int i = 0; i &lt; myrows; i++) {
    for (int k = 0; k &lt; MAT_SIZE; k++) {
        double a_k = A_local[i*MAT_SIZE + k];
        for (int j = 0; j &lt; MAT_SIZE; j++) {
            C_local[i*MAT_SIZE + j] += a_k * b[k][j];
        }
    }
}</code></pre>
<h3>Gather the result</h3>
<p>We use <code>MPI_Gatherv</code> to collect result to matrix c. The reason for using <code>MPI_Gatherv</code> rather than <code>MPI_Gather</code> is the same as <code>MPI_Scatterv</code>.</p>
<pre><code class="language-CPP">MPI_Gatherv(C_local, myrows*MAT_SIZE, MPI_DOUBLE,
    &amp;c[0][0], sendcounts, displs, MPI_DOUBLE,
    0, MPI_COMM_WORLD);</code></pre>
<h2>Experiments</h2>
<h3>Testbed</h3>
<p>We conducted the evaluation on a machine with an Intel(R) Xeon(R) Gold 5320 CPU (52 physical cores / 104 threads), 128 GB of memory, running Ubuntu 22.04 with <code>OpenMPI</code> 4.0.3 version.</p>
<h3>Strong Scaling Analysis</h3>
<p>Here we do the experiments to see the relationships between the number of processes in MPI and the running time.</p>
<p>We run it locally with 1, 2, 4, 8, 16 and 32 processes with $N=500$ matrix size.</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922233559711.png" width="50%">
</div>
<p>We can see that as the number of processes rises, the speedup ratio gets lower than the ideal linear speedup.</p>
<p>We use Amdahl's Law to analysis. </p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922233150230.png" width="45%">
</div>
<p>The speedup of a parallel program is limited by the fraction of the code that remains sequential. Even if most of the computation can be parallelized, the serial portion and communication overhead prevent achieving ideal linear scaling. In our case, using 32 processes cannot give 32× acceleration because synchronization, data distribution, and non-parallelizable parts dominate at higher process counts. Thus, the law predicts diminishing returns as the number of processes increases.</p>
<h3>Using intel ipm profiler to profile MPI time</h3>
<p>We use following variable to initiate intel mpi profiler:</p>
<pre><code class="language-bash">source /path/to/intel/setvars.sh
export I_MPI_STATS=5
mpirun -np 4 ./matmul # run the mpi program
aps --report /path/to/report</code></pre>
<p>We can see that the whole program use 1.29s (from <code>main</code> function, matrix init to <code>return 0</code>), among <code>MPI_Bcast</code>, <code>MPI_Scatterv</code>, <code>MPI_Gatherv</code>, we can see that <code>MPI_Bcast</code> rank 1st for this 3 functions (This is obvious, since we use <code>MPI_Bcast</code> to separate matrix B).</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922225609156.png" width="60%">
</div>
<h3>Time Comparison for different Matrix Size</h3>
<p>Here we do the experiments to test the time of brute-force algorithm and MPI implementation as the matrix size N changes.</p>
<p>We test $N = {10, 50, 100, 250, 500}$ with process from 1,2,4,8,16,32. </p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923012530882.png" width="55%">
</div>
<p>baseline</p>
<pre><code class="language-txt">baseline = {
    10: 0.000004,
    50: 0.000580,
    100: 0.004633,
    250: 0.057622,
    500: 0.455162,
}</code></pre>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923014025925.png" width="95%">
</div>
<p>We can see that for single thread, the MPI program needs more time than baseline brute force matmul. While as the processes number goes up, for large matrix size like N=250, N=500, we gain some performance. <strong>But since the synchronization overhead rises up as the number of process rise up, we see performance slow down. (like N=250, p=32, we get less speedup)</strong></p>
<p>As for single thread MPI program, they still have some overhead on MPI and data movement. We can see this from assembly:</p>
<pre><code>mpigcc -g -S -fverbose-asm -masm=intel mpi_matrix_base.c -o run_asm</code></pre>
<p>For example, we can see the asm code for <code>MPI_Scatterv</code>, here the compiler will let the program to save its register data and call <code>MPI_Scatterv@PLT</code> from runtime library, which cause some overhead.</p>
<pre><code class="language-asm"># mpi_matrix_base.c:83:       MPI_Scatterv(&amp;a[0][0], sendcounts, displs, MPI_DOUBLE,
    .loc 1 83 7
    mov eax, DWORD PTR -8000124[rbp]    # tmp243, myrows
    imul    edi, eax, 500   # _34, tmp243,
    mov rcx, QWORD PTR -8000048[rbp]    # tmp244, A_local
    mov rdx, QWORD PTR -8000088[rbp]    # tmp245, displs
    mov rsi, QWORD PTR -8000096[rbp]    # tmp246, sendcounts
    lea rax, -8000016[rbp]  # tmp247,
    sub rsp, 8  #,
    push    1140850688  #
    push    0   #
    push    1275070475  #
    mov r9d, edi    #, _34
    mov r8, rcx #, tmp244
    mov ecx, 1275070475 #,
    mov rdi, rax    #, tmp247
    call    MPI_Scatterv@PLT    #
    add rsp, 32 #,</code></pre>
<h3>Docker execution result</h3>
<p>My docker file struct:</p>
<pre><code class="language-txt">.
├─ Dockerfile
├─ docker-compose.yml
├─ entrypoint.sh
├─ work/                 # /workspace
│  ├─ matmul
│  ├─ hosts
│  └─ ssh/               </code></pre>
<p>download ubuntu 22.04 image from <a href="https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/">https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/</a></p>
<pre><code class="language-bash"># ubuntu-base-22.04.5-base-amd64.tar.gz:
wget https://cdimage.ubuntu.com/ubuntu-base/releases/22.04/release/ubuntu-base-22.04-base-amd64.tar.gz</code></pre>
<p>import as docker image</p>
<pre><code class="language-bash">cat ubuntu-base-22.04-base-amd64.tar.gz | sudo docker import - ubuntu:22.04</code></pre>
<p>build my container:</p>
<pre><code class="language-bash">ssh-keygen -t rsa -b 4096 -N &quot;&quot; -f work/ssh/id_rsa
docker compose up -d --build</code></pre>
<p>From this ubuntu linux image, we further build a docker image with <code>openssh</code> and <code>openmpi</code>.</p>
<pre><code class="language-Dockerfile">FROM ubuntu:22.04

# OpenMPI &amp; OpenSSH
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update &amp;&amp; \
    apt-get install -y --no-install-recommends \
      build-essential openmpi-bin libopenmpi-dev \
      openssh-server openssh-client ca-certificates sudo &amp;&amp; \
    rm -rf /var/lib/apt/lists/*

# mpi User
RUN useradd -ms /bin/bash mpi &amp;&amp; echo &quot;mpi ALL=(ALL) NOPASSWD:ALL&quot; &gt;&gt; /etc/sudoers

# SSH
RUN mkdir -p /var/run/sshd
RUN sed -ri &#039;s/^#?PasswordAuthentication .*/PasswordAuthentication no/&#039; /etc/ssh/sshd_config &amp;&amp; \
    sed -ri &#039;s/^#?PermitRootLogin .*/PermitRootLogin no/&#039; /etc/ssh/sshd_config &amp;&amp; \
    echo &quot;PubkeyAuthentication yes&quot; &gt;&gt; /etc/ssh/sshd_config

WORKDIR /workspace
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh &amp;&amp; chown -R mpi:mpi /workspace

# USER mpi
ENTRYPOINT [&quot;bash&quot;, &quot;/entrypoint.sh&quot;]
# ENTRYPOINT [&quot;/entrypoint.sh&quot;]</code></pre>
<p>In <code>docker-compose.yml</code> file, we let <code>./work</code> map to <code>/workspace</code> inside docker nodes.</p>
<pre><code class="language-yaml">version: &quot;3.8&quot;

services:
  node1:
    build: .
    container_name: node1
    hostname: node1
    networks: [cluster]
    volumes:
      - ./work:/workspace
    ports:
      - &quot;2201:22&quot;

  node2:
    build: .
    container_name: node2
    hostname: node2
    networks: [cluster]
    volumes:
      - ./work:/workspace
    ports:
      - &quot;2202:22&quot;

  node3:
    build: .
    container_name: node3
    hostname: node3
    networks: [cluster]
    volumes:
      - ./work:/workspace
    ports:
      - &quot;2203:22&quot;

networks:
  cluster:
    driver: bridge</code></pre>
<p>In <code>entrypoint.sh</code>, we let each nodes connect to each other with <code>ssh</code>.</p>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

user=mpi
home=/home/$user

if [ &quot;$(id -u)&quot; != &quot;0&quot; ]; then
  echo &quot;This entrypoint must run as root.&quot;
  exit 1
fi

mkdir -p /etc/ssh
ssh-keygen -A

mkdir -p &quot;$home/.ssh&quot; /var/run/sshd /workspace/ssh
chmod 700 &quot;$home/.ssh&quot;

if [ ! -f /workspace/ssh/id_rsa ]; then
  ssh-keygen -t rsa -b 4096 -N &quot;&quot; -f /workspace/ssh/id_rsa
fi
cp /workspace/ssh/id_rsa{,.pub} &quot;$home/.ssh/&quot;
cat /workspace/ssh/id_rsa.pub &gt;&gt; &quot;$home/.ssh/authorized_keys&quot;

cat &gt; &quot;$home/.ssh/config&quot; &lt;&lt;EOF
Host *
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  LogLevel ERROR
EOF

chown -R $user:$user &quot;$home/.ssh&quot;
chmod 600 &quot;$home/.ssh&quot;/*

# 3) sshd
/usr/sbin/sshd

# 4) mpi user
exec su - $user -c &quot;cd /workspace &amp;&amp; tail -f /dev/null&quot;</code></pre>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923032909478.png%0A" width="70%">
</div>
<p>We enter node1 as user <code>mpi</code></p>
<pre><code class="language-bash">sudo docker exec -it -u mpi node1 /bin/bash</code></pre>
<p>And we compile the code and run it:</p>
<pre><code class="language-bash">sudo mpicc mpi_matrix_base.c  -o matmul
mpirun --oversubscribe -np 8   --hostfile /workspace/hosts   --mca plm_rsh_agen
t &quot;ssh -l mpi&quot;   -mca btl_tcp_if_include eth0   ./matmul 500</code></pre>
<p>Then we can see <code>Result is correct.</code>:</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923034757293.png%0A" width="90%">
</div>
<p>Cheers!</p>
<hr />
<h2>Some possible Optimizations on Matmul</h2>
<h3>Better Matmul</h3>
<p>We can optimize matmul using:</p>
<ol>
<li>matrix tilling</li>
<li>SIMD instructions like <code>AVX512</code>, or matmul instructions like <code>Intel AMX</code></li>
<li>Loop unrolling</li>
<li>MPI+OpenMP hybrid running </li>
</ol>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923021308354.png" width="40%">
</div>
<p>I implemented 1,2,3 and OpenMP for a matmul program in my CPP Programming Project, feel free to see my report (unfortunately it's still in Chinese, I plan to translate them in English in the future):
<a href="https://github.com/HaibinLai/CS205-CPP-Programing-Project/tree/main/Project3">https://github.com/HaibinLai/CS205-CPP-Programing-Project/tree/main/Project3</a></p>
<p>If you are interested in my optimization in Matmul, feel free to visit some of my projects blogs:</p>
<p>本科生能做并行计算hpc吗？ - 笑到猝死的家伙的回答 - 知乎
<a href="https://www.zhihu.com/question/657927103/answer/1896769963135578670">https://www.zhihu.com/question/657927103/answer/1896769963135578670</a></p>
<h3>Compute-Communication Overlapping</h3>
<p>In the previous program, we first distribute all the data to each of the processes, then we do the computation. But here a performance issue rises: when the memory is busy transferring data (if the processes do transfer process using DMA or NIC), the CPU Computing part is idle.</p>
<p>So one of the idea is to do overlapping. After getting all the data, we may use async MPI api like <code>MPI_Isend</code> with a technique call <strong>double buffer</strong> as the following figure shows:</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922220431022.png" width="40%">
</div>
<p>So when the CPU workers are calculating the part, we can <strong>let MPI to prefetch the next data blocks</strong>  from root process.</p>
<pre><code class="language-CPP">int cur = 0, next = 1;

compute_and_communicate_first_block(...);

for (int t = 1; t &lt; T; ++t) {
  // init next blocks and calculate val &quot;cur&quot; and &quot;next&quot;
  calc_count_displs_for_block(t, ...);
  MPI_Iscatterv(&amp;A[0][0], countsA_blk, displsA_blk, MPI_DOUBLE,
                Ablk[next], rows_t*N_local, MPI_DOUBLE, 0, MPI_COMM_WORLD);

  // Compute (Overlap with Iscatterv)
  compute_block(Ablk[cur], B, Cblk[cur], rows_cur, N);

  // wait until Ablk[next] is ready
  MPI_Wait(&amp;rq_scatter, MPI_STATUS_IGNORE);

  // collect data
  MPI_Igatherv(Cblk[cur], rows_cur*N, MPI_DOUBLE,
               &amp;C[0][0], countsC_blk_cur, displsC_blk_cur, MPI_DOUBLE, 0, MPI_COMM_WORLD);

  // swap buffer
  int tmp = cur; cur = next; next = tmp;

  // test if Igatherv complete
  MPI_Wait(&amp;rq_gather, MPI_STATUS_IGNORE);
}</code></pre>
<p>Runtime graph:</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250922221444754.png" width="70%">
</div>
<p>I have done this on GPU Matmul before, if you are interested, feel free to see my Optimization for SGEMM in GPU
<a href="https://github.com/HaibinLai/SUSTech-HGEMM">https://github.com/HaibinLai/SUSTech-HGEMM</a></p>
<h2>MPI</h2>
<p>I learn MPI programming on my second year of undergraduate, when I was participating in Supercomputing Challenge Competition. Last year on a competition called APAC HPC-AI, my job is to optimize an HPC software call Hoomd-blue. Hoomd-blue simulates chemical molecular on distributed systems using MPI primitives like <code>MPI_Allreduce</code>.</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923015148718.png" width="70%">
</div>
<p><code>OpenMPI</code> uses different algorithm to do <code>MPI_AllReduce</code>, like butterfly algorithm, reduce+broadcast algorithm, Ring algorithm etc.</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923015401400.png" width="70%">
</div>
<p>I optimize MPI with different parameters and how the program utilizes MPI.</p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923015714707.png" width="70%">
</div>
<hr />
<p>Before the 1990s, parallel computers used many different message-passing libraries (such as PVM, NX, and Express), each with its own interface and limitations. To address the lack of a unified standard, the MPI Forum was established in 1992, bringing together researchers from academia and industry. In 1994, the first MPI standard was released, which quickly became the de-facto communication standard for high-performance computing.</p>
<!--more-->
<p>Professor Jack Dongarra played a key role in this history. He emphasized that MPI must serve as a solid communication layer for scientific computing libraries, and he actively helped bridge the gap between academic research and industrial implementations, ensuring MPI’s rapid adoption.</p>
<p>I was fortunate to meet Professor Dongarra in person and take a photo with him. For me, this moment felt like connecting directly with the history of parallel computing. </p>
<div align="center">
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20250923014604979.png" width="50%">
</div>
