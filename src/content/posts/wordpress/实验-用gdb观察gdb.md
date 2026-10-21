---
title: "[WIP] 实验：用gdb观察gdb"
description: "Can I use gdb to observe gdb? I always forget how gdb was made. for me, I went though the website on stackoverflow of Zhihu serveral times only for this question, and I always forget everything about ptrace . And I thin…"
publishedAt: "2025-01-05 11:07:18"
updatedAt: "2025-01-07 08:36:11"
category: "OS"
tags: ["OS"]
draft: false
slug: "实验-用gdb观察gdb"
legacySlug: "实验：用gdb观察gdb"
wordpressId: 566
sourceUrl: "https://www.haibinlaiblog.top/index.php/%e5%ae%9e%e9%aa%8c%ef%bc%9a%e7%94%a8gdb%e8%a7%82%e5%af%9fgdb/"
commentCount: 0
importedFromWordPress: true
---
<h2>Can I use gdb to observe gdb?</h2>
<p>I always forget how gdb was made. for me, I went though the website on stackoverflow of Zhihu serveral times only for this question, and I always forget everything about <code>ptrace</code>. And I think it's annoying me, since I am just hanging around on the same field. So one day a crazy and funny idea comes to me: </p>
<p>Can I use gdb to observe gdb?</p>
<p>That was a great idea! I am going to do that!</p>
<h2>how gdb was made?</h2>
<p>If you know <code>ptrace</code> well, you can skip to next section!</p>
<p><code>ptrace</code> is a great syscall, it can provide many infomation that we want for a process in Linux, and gdb was built upon it. Here I make a simple program</p>
<pre><code class="language-C">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;sys/ptrace.h&gt;
#include &lt;sys/wait.h&gt;
#include &lt;unistd.h&gt;
#include &lt;sys/user.h&gt;
#include &lt;sys/reg.h&gt;

int main() {

    pid_t child_pid = fork();

    if (child_pid == 0) {
        printf(&quot;Child process starting &#039;aaa&#039;...\n&quot;);
        ptrace(PTRACE_TRACEME, 0, NULL, NULL);
        execl(&quot;./pTrace&quot;, &quot;pTrace&quot;, NULL);
        perror(&quot;execl failed&quot;);
        exit(EXIT_FAILURE);
    } else {
        int status;
        waitpid(child_pid, &amp;status, 0);
        while (1) {
            if (WIFEXITED(status)) {
                printf(&quot;Child process terminated normally.\n&quot;);
                break;
            }
            long rax = ptrace(PTRACE_PEEKUSER, child_pid, 8 * RAX, NULL);
            if (rax == -1) {
                perror(&quot;ptrace failed&quot;);
                break;
            }
            printf(&quot;Child process RAX register value: %lx\n&quot;, rax);

            ptrace(PTRACE_CONT, child_pid, NULL, NULL);
            waitpid(child_pid, &amp;status, 0);
        }
        ptrace(PTRACE_DETACH, child_pid, NULL, NULL);
        waitpid(child_pid, &amp;status, 0);
    }
    return 0;
}</code></pre>
<p>⚠️upload failed, check dev console</p>
<p>⚠️upload failed, check dev console
⚠️upload failed, check dev console</p>
<p>下载：
lib</p>
<pre><code class="language-bash">wget https://gcc.gnu.org/pub/gcc/infrastructure/mpfr-4.1.0.tar.bz2
wget https://gcc.gnu.org/pub/gcc/infrastructure/gmp-6.2.1.tar.bz2
wget https://gcc.gnu.org/pub/gcc/infrastructure/mpc-1.2.1.tar.gz</code></pre>
<p>gdb
<a href="https://ftp.gnu.org/gnu/gdb/">Index of /gnu/gdb</a></p>
<pre><code class="language-bash">wget https://ftp.gnu.org/gnu/gdb/gdb-15.2.tar.xz</code></pre>
<p>编译：</p>
<p>gmp</p>
<p>位置：</p>
<pre><code>/home/haibin/experiment/GMP/install

1.
    ./configure --prefix=$(pwd)
    /home/haibin/experiment/GMP/

2. make

3. make install</code></pre>
<p>mpfr</p>
<pre><code class="language-bash">./configure --prefix=$(pwd) --with-gmp-include=/home/haibin/experiment/gmp-6.2.1/include --with-gmp-lib=/home/haibin/experiment/gmp-6.2.1/lib</code></pre>
<p>mpc</p>
<pre><code class="language-bash">tar -xvzf mpc-1.2.1.tar.gz
cd mpc-1.2.1/

./configure --prefix=$(pwd) \
    --with-gmp-include=/home/haibin/experiment/gmp-6.2.1/include \
    --with-gmp-lib=/home/haibin/experiment/gmp-6.2.1/lib \
    --with-mpfr-include=/home/haibin/experiment/mpfr-4.1.0/include \
    --with-mpfr-lib=/home/haibin/experiment/mpfr-4.1.0/lib \

make
make install</code></pre>
<pre><code>export LD_LIBRARY_PATH=$(pwd)/gmp-6.2.1/lib:$(pwd)/mpfr-4.1.0/lib:$(pwd)/mpc-1.2.1/lib:$LD_LIBRARY_PATH</code></pre>
<p>编译好这些lib后，我们可以编译自己的gdb</p>
<pre><code class="language-bash">./configure --with-gmp=/home/haibin/experiment/gmp-6.2.1/ --with-mpfr=/home/haibin/experiment/mpfr-4.1.0</code></pre>
<p>随后，</p>
<pre><code class="language-bash">./
gdb ./gdb</code></pre>
<pre><code>2316    in rtld.c
(gdb) n 500
[Thread debugging using libthread_db enabled]
Using host libthread_db library &quot;/lib/x86_64-linux-gnu/libthread_db.so.1&quot;.
Single stepping until exit from function _dl_start_user,
which has no line number information.
Cannot find bounds of current function
(gdb) n 500
Cannot find bounds of current function
(gdb) n 500
Cannot find bounds of current function
(gdb) n 500
Cannot find bounds of current function
(gdb) s
Cannot find bounds of current function
(gdb) continue
Continuing.
[Detaching after vfork from child process 1011434]
GNU gdb (Ubuntu 9.2-0ubuntu1~20.04.2) 9.2
Copyright (C) 2020 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later &lt;http://gnu.org/licenses/gpl.html&gt;
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type &quot;show copying&quot; and &quot;show warranty&quot; for details.
This GDB was configured as &quot;x86_64-linux-gnu&quot;.
Type &quot;show configuration&quot; for configuration details.
For bug reporting instructions, please see:
&lt;http://www.gnu.org/software/gdb/bugs/&gt;.
Find the GDB manual and other documentation resources online at:
    &lt;http://www.gnu.org/software/gdb/documentation/&gt;.

For help, type &quot;help&quot;.
Type &quot;apropos word&quot; to search for commands related to &quot;word&quot;.
(gdb) </code></pre>
<p>⚠️upload failed, check dev console
⚠️upload failed, check dev console
⚠️upload failed, check dev console</p>
