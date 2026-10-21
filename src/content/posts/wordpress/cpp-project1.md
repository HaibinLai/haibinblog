---
title: "CPP Project1 A “Simple” Calculator"
description: "CS205 · C/C++ Programming Project1 Report: A \"Simple\" Calculator PDF 版本： Project1赖海斌 Github: https://github.com/HaibinLai/CS205-CPP-Programing-Project 摘要 在本次 Project 中，我初步用C 实现了一个简单的计算器，可以简单地完成项目需求。 在计算器的输入有效数字小于 8 位时，我…"
publishedAt: "2024-08-27 17:20:19"
updatedAt: "2024-12-05 04:59:32"
category: "CPP"
tags: ["CPP", "内存管理"]
draft: false
slug: "cpp-project1"
legacySlug: "cpp-project1"
wordpressId: 134
sourceUrl: "https://haibin-blog.vercel.app/index.php/cpp-project1/"
commentCount: 0
importedFromWordPress: true
---
<h1><strong>CS205</strong> · <strong>C/C++</strong> <strong>Programming</strong></h1>
<h1><strong>Project1</strong> <strong>Report: A &quot;Simple&quot; Calculator</strong></h1>
<hr />
<p>PDF 版本：<a href="https://haibin-blog.vercel.app/wp-content/uploads/2024/08/Project1赖海斌.pdf" title="Project1赖海斌">Project1赖海斌</a>
Github: <a href="https://github.com/HaibinLai/CS205-CPP-Programing-Project">https://github.com/HaibinLai/CS205-CPP-Programing-Project</a></p>
<h2><strong>摘要</strong></h2>
<p>在本次 Project 中，我初步用C 实现了一个简单的计算器，可以简单地完成项目需求。 在计算器的输入有效数字小于 8 位时，我阅读了 <strong>IEEE</strong> <strong>754</strong> <strong>标准</strong>，使用 double 的加减法进行 运算。在计算器输入数字大于 8 位时，我<strong>借鉴了</strong> <strong>Postgresql</strong> <strong>数据库</strong>中 numeric 的实现方法， 使用<strong>数组</strong>进行精确计算。我注意到<strong>内存泄露</strong>的问题，并构建了一个内存控制检测系统，可以 减少我的内存泄露。另外，我学习了解了 <strong>OpenMP</strong> <strong>与</strong> <strong>CUDA</strong> 编程上，各自写了一个乘法方 法，可惜由于身体原因没能测试性能。除此之外，我了解了大整数乘法等计算器在现代的应 用，比如在密码学中的加密，科学计算等。我也了解了算法，比如 <strong>Karatsuba</strong> 乘法算法。</p>
<p><strong>关键词</strong>：<strong>IEEE754</strong> <strong>Standard;</strong> <strong>Postgresql</strong> <strong>Source</strong> <strong>Code;</strong> <strong>Memory</strong> <strong>Leak;</strong> <strong>OpenMP;</strong> <strong>CUDA;</strong></p>
<h2>Contents</h2>
<p><img src="https://s2.loli.net/2024/08/27/G7XiEnOUjPkBHIs.png" alt="image.png" /></p>
<h2>Part 1: 需求分析</h2>
<p><strong>基本需求：</strong> 处理输入字符串，加减乘除，大数运算和指数运算。初看会觉得很简单，
但是其实里边涵盖了 C 中的字符，数据类型的了解，要应用条件与分支语句，初步探索
指针和 C 特有的内存泄露。除此之外，还有一些算法设计。
<strong>本质：</strong> 了解 C 的基本语法，C 中对字符串及各种数据类型的处理，学习 C 指针，学习用
C 写简单的算法。了解精确计算、科学计算以及大整数乘法的应用，要求我
去了解数值计算领域。</p>
<h2>Part 2: 环境配置/编译</h2>
<p>硬件使用南科大科学与工程计算中心的计算工作站一台，拥有 2CPU 128 核，总内存约
为 500GB。工作站共装配三台 NVIDIA A100 GPU。详见表 2.1，表 2.2。</p>
<table>
<thead>
<tr>
<th>CPU Architecture</th>
<th>x86_64</th>
</tr>
</thead>
<tbody>
<tr>
<td>Model name</td>
<td>AMD EPYC 7773X 64-Core Processor</td>
</tr>
<tr>
<td>CPU family</td>
<td>25</td>
</tr>
<tr>
<td>Thread(s) per core</td>
<td>1</td>
</tr>
<tr>
<td>CPU(s)</td>
<td>128</td>
</tr>
<tr>
<td>Core(s) per socket</td>
<td>64</td>
</tr>
<tr>
<td>CPU max MHz</td>
<td>3527.7339</td>
</tr>
<tr>
<td>CPU min MHz</td>
<td>1500.0000</td>
</tr>
</tbody>
</table>
<p><strong>表2.1 硬件CPU环境</strong></p>
<table>
<thead>
<tr>
<th>GPU name</th>
<th>A100-SXM4-80GB</th>
</tr>
</thead>
<tbody>
<tr>
<td>GPU amount</td>
<td>3</td>
</tr>
<tr>
<td>CUDA Version</td>
<td>12.4</td>
</tr>
<tr>
<td>Driver Version</td>
<td>550.54.14</td>
</tr>
<tr>
<td>Memory</td>
<td>98304MiB</td>
</tr>
</tbody>
</table>
<p><strong>表2.2 硬件GPU环境</strong></p>
<p>服务器内操作系统为最新版Ubuntu 23.04，gcc编译器版本为12.3.0，CUDA版本为12.4，CUDA编译器nvcc版本11.8。详细软件配置见表2.3。</p>
<table>
<thead>
<tr>
<th>Software</th>
<th>Version</th>
</tr>
</thead>
<tbody>
<tr>
<td>Operating System</td>
<td>Ubuntu 23.04</td>
</tr>
<tr>
<td>OS Kernel</td>
<td>Linux H3C1 6.2.0-39-generic</td>
</tr>
<tr>
<td>gcc</td>
<td>(Ubuntu 12.3.0-1ubuntu1~23.04) 12.3.0</td>
</tr>
<tr>
<td>nvcc: NVIDIA (R) Cuda compiler driver</td>
<td>release 11.8, V11.8.89</td>
</tr>
<tr>
<td>Vim</td>
<td>Vi IMproved 9.0 (2022 Jun 28)</td>
</tr>
<tr>
<td>VScode Server</td>
<td>1.87.1</td>
</tr>
<tr>
<td>Math Library</td>
<td>ISO C99</td>
</tr>
<tr>
<td>btop</td>
<td>V1.2.13</td>
</tr>
<tr>
<td>nvitop</td>
<td>1.3.2</td>
</tr>
</tbody>
</table>
<p><strong>表2.3 软件环境</strong></p>
<p>本次Project使用了以下几个C语言库，下表2.4展示了他们的版本和用途。</p>
<table>
<thead>
<tr>
<th>Library</th>
<th>Version</th>
<th style="text-align: center;">Usage</th>
</tr>
</thead>
<tbody>
<tr>
<td>stdio.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">使用标准输入输出函数</td>
</tr>
<tr>
<td>stdlib.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">使用malloc,free函数</td>
</tr>
<tr>
<td>string.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">判断字符串长度，比较</td>
</tr>
<tr>
<td>unistd.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">打开本地txt文件进行计算</td>
</tr>
<tr>
<td>math.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">-lm调用本地C99数学库。仅作为计算器拓展功能使用，本次Project没有详细使用该功能</td>
</tr>
<tr>
<td>omp.h</td>
<td>跟随gcc</td>
<td style="text-align: center;">使用OpenMP实现乘法的并行计算</td>
</tr>
<tr>
<td>gmp.h</td>
<td>6.3.0</td>
<td style="text-align: center;">快速计算大整数乘法库。作为与我写的乘法库的比较，也可作为计算器的辅助功能。</td>
</tr>
<tr>
<td>sodium.h</td>
<td>1.0.18</td>
<td style="text-align: center;">一个大数计算、随机数生成及多种加解密算法生成库。仅作为学习大数乘除法在密码学中的应用，对计算器没有过多作用。</td>
</tr>
<tr>
<td>pbc.h</td>
<td>0.5.14</td>
<td style="text-align: center;">基于GMP数学库的密码学库，在本次Project中仅作为全同态加密方面的了解学习而使用，对计算器没有过多作用。</td>
</tr>
</tbody>
</table>
<p><strong>表2.4 相关库配置</strong></p>
<p>这几个额外安装的库只是作为学习使用，当然也可以作为计算器的一个插件。具体安装都比较简单：</p>
<p>在Linux中安装GMP库可以使用如下命令（测试计算器性能用，可有可无）：</p>
<pre><code class="language-bash">wget https://gmplib.org/download/gmp/gmp-6.3.0.tar.xz

tar -xvzf gmp-6.3.0.tar.xz

cd gmp-6.3.0

./configure

make                # 编译
make check          # 检验
sudo make install   # 安装  </code></pre>
<p>在Linux中安装Sodium库：</p>
<pre><code class="language-bash">wget https://download.libsodium.org/libsodium/releases/libsodium-1.0.18.tar.gz

tar -xvzf libsodium-1.0.18.tar.gz

cd libsodium-1.0.18

./configure

make                # 编译
make check          # 检验
sudo make install   # 安装  </code></pre>
<p>在Linux中安装PBC库（仅作为学习）：</p>
<pre><code class="language-bash">wget https://crypto.stanford.edu/pbc/files/pbc-0.5.14.tar.gz

tar -xvzf pbc-0.5.14.tar.gz

cd pbc-0.5.14

./configure

make                # 编译
make check          # 检验
sudo make install   # 安装
cd /etc/ld.so.conf.d
sudo vi libpbc.conf # 编译好pbc库后，加入libpbc.so.1的路径

cd /etc/ld.so.conf.d &amp;&amp; vim libpbc.conf  # 将 /usr/local/lib 输入到libpbc.conf文件中
sudo ldconfig # 更新cache</code></pre>
<!--more-->
<p>遇到库无法安装的问题，可能是缺少相应的软件，尝试检查g++, m4, flex等软件。</p>
<h3>2.2 编译配置</h3>
<p>注意：由于我是在Linux上进行开发和编译，虽然后来成功移植到我的Windows电脑上，如果编译出现问题，可能的原因是我的计算器中使用的函数在Windows MinGW上可能不是标准C库的一部分。</p>
<p><strong>计算器标准版编译：</strong></p>
<pre><code class="language-bash">gcc src/haibin_calculator.c -lm -o haibinCalculator -fopenmp -lgmp</code></pre>
<p>全部使用了我自己写的功能，可以做到普通加减乘除，大整数加减法和乘法，指数运算。lm表示使用数学库，进行开根号等运算。</p>
<p><strong>更多编译选项：</strong></p>
<p><img src="https://s2.loli.net/2024/08/26/NudhVReAUPSZKgt.png" alt="db237209f44e1195e25f8c349136ee0.png" /></p>
<h2>Part 3: 功能演示</h2>
<h3>1. 小数字加减乘除</h3>
<p>当输入的两个数字有效位数小于8位时，此时计算器会将数字转换为<code>double</code>进行运算。<code>double</code>的精度在 8.85 &times; 10<sup>-15</sup> 时，满足我们的精度需求。同时，在计算除法时，除不尽的结果将保留8位小数。</p>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/26/aCQwWcfHskbySNp.png"
         alt="无法显示图片时显示的文字"
         style="zoom:这里写图片的缩放百分比"/>
    <br>        <!--换行-->
    图3.1 基本加减乘除 <!--标题-->
    </center>
</div>
<h3>2. 大整数加减法，乘法</h3>
<p>当两个数字的有效位数超过 8 位且没有小数和指数 e 时，计算器将自动转换为大整数模
式。计算器将数字转换为 <code>char*</code>并进行类似于数组的加减法，从而实现大整数的加减法和乘
法。大整数除法的实现过于复杂，由于时间紧凑，我就花更多时间放在了自己更想探索的地
方，没有实现除法。</p>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/26/wnvbjhAuks2TGU4.png"
         alt="无法显示图片时显示的文字"
         style="zoom:这里写图片的缩放百分比"/>
    <br>        <!--换行-->
    组图3.2 大整数加减及校验  <!--标题-->
    </center>
</div>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/26/QmZpaz25A8KO31B.png"
         alt="无法显示图片时显示的文字"
         style="zoom:这里写图片的缩放百分比"/>
    <br>        <!--换行-->
    组图 3.3 大整数乘法    <!--标题-->
    </center>
</div>
<blockquote>
<p>由于大整数加减实现时采用的是指针的形式，因此只要内存足够，就可以对超长位数进行加减。这里由于微软计算器已经超限，就没有验证数值。</p>
</blockquote>
<h3>3. 指数运算</h3>
<p>当两个数字都是指数时，将进行指数运算。对于指数乘法，在 e 前的参数采用<code>double</code>
运算，在 e 后的参数使用 <code>double</code> 相加减。除法类似，核心基于 <code>double</code> 的除法。对于加减法，
先将两个数字的指数大小保持一致，e 前的参数采用大整数加减法。</p>
<p><img src="https://s2.loli.net/2024/08/26/CzaWEr5ovYfBPI4.png" alt="image.png" /></p>
<h3>4. 提高性能：CUDA 和 OpenMP</h3>
<p>我们的大整数乘法是用大整数加法和移位实现的，计算复杂度为 O(N ∙ M), M,N 为两个数字
的位数。幸运的是，我们可以使用CUDA与OpenMP，将乘法过程并行化，我们将在后面演示。</p>
<p><img src="https://s2.loli.net/2024/08/26/e4VGch7mxATKwYR.png" alt="image.png" />
<img src="https://s2.loli.net/2024/08/26/GjnUEdPLRgH831Y.png" alt="image.png" /></p>
<h3>5. Human Computer Interaction：人机交互</h3>
<p>支持 Mode2：等待输入模式</p>
<p>如果我们的计算器在调用时没有输入任何参数，计算器将进入另一种模式，它将等待用户的
输入并进行计算。计算的效果与直接调用模式相同。</p>
<p><img src="https://s2.loli.net/2024/08/26/4kgV8QPsj9paKRw.png" alt="image.png" /></p>
<p>-v / --version</p>
<p>打印计算器版本，显示计算器编译时间，并打印世界线常数设定。
<img src="https://s2.loli.net/2024/08/26/PyHFWrgpV7LX9Bo.png" alt="image.png" /></p>
<p>-h / --help 打印五彩斑斓的帮助
<img src="https://s2.loli.net/2024/08/26/2kTzKoSfLW7Viw3.png" alt="image.png" /></p>
<p>-l / --mathlib 打印计算器使用的数学库
<img src="https://s2.loli.net/2024/08/26/gG2AIhuBlYmyTn3.png" alt="image.png" /></p>
<p>cls / clear 调用 system(“clear”) 清空屏幕
<img src="https://s2.loli.net/2024/08/26/cNv6I8FogrX5a9B.png" alt="image.png" /></p>
<p>check 检测计算器内存泄露
<img src="https://s2.loli.net/2024/08/26/3c26J5BACV17kFb.png" alt="image.png" /></p>
<p>cmatrix 调用一个好玩的软件包(sudo apt install cmatrix)，变成黑客帝国，ctrl-c 退出。
<img src="https://s2.loli.net/2024/08/26/cCZpWRGIJsPYd8V.png" alt="image.png" /></p>
<h2>Part 4: 需求实现：路上的困难</h2>
<p>本次 Project 项目结构如下，从 main 函数启动后，根据参数判断模式，判断执行命令。
如果是计算命令，就会凭借数字类型进行具体计算。</p>
<p><img src="https://s2.loli.net/2024/08/26/1DyLIfHTPXF6Jxh.png" alt="image.png" /></p>
<h3>4.1 输入 <code>x</code> 还是 <code>*</code> ?</h3>
<p>我的 Project 开始于对输入的处理。main 函数会根据空格分隔出几个字符串，随后计算
器将判断输入的字符串数量。</p>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/26/B4TUIJGq1kwYNpj.png"
         alt="无法显示图片时显示的文字"
         style="zoom:这里写图片的缩放百分比"/>
    <br>        <!--换行-->
    图 4.1 main 输入判断 <!--标题-->
    </center>
</div>
<p>但是当我输入 <code>3 * 5</code> 时，我发现 <code>argc</code> 变量并不是我想的 4 个。随后进行测试，发现”<code>*</code>”号
会读取当前文件夹下所有的文件作为字符串输入。原来，代表乘法的 ’<code>*</code>’ 号 在 Linux 系统中
会被识别为通配符。</p>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/26/VDJtENI2bjHivkh.png"
         alt="无法显示图片时显示的文字"
         style="zoom:这里写图片的缩放百分比"/>
    <br>        <!--换行-->
    图 4.2 判断 * 输入   <!--标题-->
    </center>
</div>
<p>在经过讨论后，且在老师的同意下，我认为使用 <code>x</code>号相比使用*号然后做各种处理会
更好：</p>
<p>第一，只有输入<code>3 ‘*’ 5</code>才能被专门识别为乘号，但是为了乘号多打两个单引号很麻
烦。如果单纯忽略，只读取最前面的 <code>3</code> 和最后的 <code>5</code>，也感觉非常不妥。</p>
<p>第二，这个问题跟安全有关：不同的用户有不同的目录，如果有人依靠我的计算器输入读取了他文件夹下的所有文件，说不定别人就能通过攻击我的计算器查看到他的文件。
我后来也去查找如何修改这一配置，我们可以去修改 shell 的配置文件，进入<code>~/.bashrc</code>
文件，并用命令： <code>set -o noglob</code> 禁止通配符展开。然而这样的修改变动太大，为了一个计算器得不偿失。</p>
<p>因此使用”<code>x</code>”符号作为乘号。</p>
<h3>4.2 Mode2 的输入</h3>
<p>在 mode2 下，我们要等待用户输入，然后执行相应的计算指令。
<img src="https://s2.loli.net/2024/08/26/wQb4jElIFUTcV8P.png" alt="image.png" /></p>
<p>我一开始用的是 getline 函数，这个函数在 stdio.h 中。但是，当我把这个函数移植到
Windows 的 minGW 时，它显示 Windows 上编译器没有这个函数。我随后用了 fget 函数。</p>
<p><img src="https://s2.loli.net/2024/08/26/pvMOXa4SCj7NcPe.png" alt="image.png" /></p>
<p>采用 fget 函数的代价便是会有长度输入的限制，不过这也让我好奇不同函数他们是怎
么处理输入的。</p>
<p>简书一篇博客 <a href="https://www.jianshu.com/p/73e004f22c1c">C中读入一行字符串的方法</a>讲的挺好的，它对比了scanf，gets和fget三种函数的区别。scanf是非常邪恶的，我们给他长度为6的char数组，然后输入8个char，结果它会在数组后继续填写数字。也就是说，会覆盖我们的内存。而gets的 原理
和 scanf 相同，只有 fget 函数才能保证内存上的安全，并且能读 stdin 和文件。</p>
<h3>4.3 IEEE754: 深入了解浮点数</h3>
<p>刚开始实现计算器时，我发现 matlab 和我的 CASIO 计算器在正常情况下用的都是 <code>double</code>
进行计算。<code>double</code> 真的够精确吗？抱着这个疑惑，我阅读了 <code>double</code> 的标准：IEEE754 。
<img src="https://s2.loli.net/2024/08/26/muKs4jrDe93CFUG.png" alt="1724686850835.jpg" /></p>
<p>在 IEEE754 标准中，正如我们学习的那样，<code>double</code> 是使用 1 位表示正负，另外的位数表示如下图。</p>
<p><img src="https://s2.loli.net/2024/08/26/yfcZWG2sgxB8o6z.png" alt="1724686896365.jpg" /></p>
<p>在此之外，我还发现了一些关于浮点数里有趣的事情。比如浮点数里的 <code>NaNs</code> 是用
1111...11 表示的，当我们使用 <code>0/0</code> 时，会出现这个结果。我想跟除法的运算性质有关。不过，
跟 Infinities 比起来，无限这个数的 N-1 bits of Significand 是 0。另一个有趣的点是浮点数是
区分正零和负零的，跟我们在数字逻辑里的二进制表示整数的方法并不一致。</p>
<p><img src="https://s2.loli.net/2024/08/26/7vPuRkH8cC4Epyr.png" alt="1724686918616.jpg" /></p>
<p>这里还有几个有趣的运算，比如 1 的无穷次方不是 <code>1</code> 而最好是 <code>NaN</code>，但是 0 的 0 次方却
是 <code>1</code> 而不是 <code>NaN</code>。为了引入这个诡异的 Not a Number，标准对待它就像数据库对待 <code>NULL</code> 一
样谨慎。
<img src="https://s2.loli.net/2024/08/26/KDAVR6ulji9HYZP.png" alt="1724686970100.jpg" /></p>
<p>看过标准后，我们这里主要处理的，就是 0/0。在 8 位有效数字下，最大的两者相乘也
是 16 位，我们就可以都用 <code>double</code> 表示。</p>
<p><img src="https://s2.loli.net/2024/08/26/ZYnVzw1O8ToUPve.png" alt="1724687001586.jpg" /></p>
<p>在此以后，面对小运算，我们就可以“偷个懒”，用计算机自带的 <code>double</code> 计算完成运
算。但是，怎么打印出来，成为了我下一个问题。</p>
<h3>4.4 如何精确打印浮点数？</h3>
<p>是的，浮点数其实并不是很好打印。<code>0.1+0.2 = 0.300000004</code>，这本质上涉及到进制的问
题。我们在 10 进制下十分之一是一个有限小数，但是 2 进制下十分之一和五分之一都是无
限不循环小数，而用 <code>double</code> 相加后，自然会产生一个误差。但是，如果我直接打印，
<code>0.1+0.2=0.30000004</code> 很明显是不对的。并且，如果我们直接使用 <code>printf(“%s”,Number)</code>，我们
得到的是保留小数点后 6 位的 <code>double</code> 输出。比如 <code>2.8+3.2 = 6</code>，但是我们的浮点数计算器会
输出 <code>6.000000</code>。</p>
<p><img src="https://s2.loli.net/2024/08/26/WM7vEinpxSPtbTN.png" alt="1724687097297.jpg" /></p>
<p>那么这应该怎么做呢？我设计了一个方法 <code>CountDecimalDigits</code>，使用三指针判断一个数
的有效位数。这个方法将返回 <code>double</code> 的小数里最后一个不是 0 的数的位置。在处理过程中，
我会将 <code>double</code> 临时转换成 <code>char</code> 数组，然后在数组内进行操作。使用了这个方法后，就可以
打印浮点数了。</p>
<p><img src="https://s2.loli.net/2024/08/26/hjgzMRK59ydSamu.png" alt="1724687152499.jpg" /></p>
<p>不过，假如我们算出来的数字与我们的 <code>double</code> 表示方法不一致，<code>printf</code> 是如何快速转换
和打印浮点数的呢？就比如说 <code>2/3=0.66666667</code>，假如保留不同的位数，输出的结尾都会四舍
五入一个 7，这是怎么做到的呢？我去看了文章[5]《如何快速打印浮点数》，大概发现了一
些答案。</p>
<p><img src="https://s2.loli.net/2024/08/26/F8iSHUaxXWRC5JM.png" alt="1724687193339.jpg" /></p>
<p><img src="https://s2.loli.net/2024/08/26/zbkQcdof1HPNXmh.png" alt="1724687208567.jpg" /></p>
<p>在这篇文章里作者提出了一个打印算法，它的操作有点像数学里的牛顿法，每一位都尽
可能贪心地逐步逼近我们的真实值，直到用完 double 里的所有可表示位。文章还进行了有
效性的数学证明与伪代码，我就看了最后的数学证明就溜了。</p>
<p>这项知识很有意思，因为在 java 的时候，我从没有考虑计算机的底层会怎么实现这些打印，我们所度过的每个平凡的算法，也许就是连续发生的奇迹。[[如何精确打印浮点数 文章导读]]</p>
<h3>4.5 Numeric Implementation: 仿 Postgresql 的 numeric.c 实现的大数计算器</h3>
<p>使用 <code>double</code> 时，无法计算大位数的乘法如<code>987654321 x 987654321</code> 。为了计算大数，必须采用新方法。</p>
<p>但是新方法如何完成？我在构思是否可以用数组实现。这时，老师提示我在数据库里，刚好有人实现了这样的精确大数计算。于是，我去查找了 Postgresql 的 source code，专门去研究了它 <code>numeric.c</code> 的实现。不看不知道，一看吓一跳，这 <code>numeric.c</code> 的加减乘除，还有类型转换，Postgresql 竟然写有 12000 行！</p>
<p><img src="https://s2.loli.net/2024/08/27/rDwy1z3Xt2vhWlc.png" alt="1724689761284.jpg" /></p>
<p><img src="https://s2.loli.net/2024/08/27/EbSO6fKv4eqG5DM.png" alt="1724689780630.jpg" /></p>
<p>我将代码复制了下来，顺便把零零散散各种定义，结构体，宏文件也复制下来，看了三
天三夜......我估计总代码量就已经超过 2 万行了。比起我自己的“计算器”，那是真的简单又幼稚啊，“朝菌不知晦朔，蟪蛄不知春秋”，可能说的就是如此吧。</p>
<p>但是幸运的是，在这之中，我找到了 <code>numeric</code> 的方法 <code>add_var</code> 的实现。仔细研究后，我大概明白了它的工作原理。</p>
<p><img src="https://s2.loli.net/2024/08/27/3Utj4GbnkMPQyf8.png" alt="1724689898729.jpg" /></p>
<p>在这里，Postgresql 首先先不管符号，实现了 <code>add_abs</code> 和 <code>sub_abs</code> 方法，在这两个基础方
法内考虑两个正数相加，以及大数剪小数。之后，add 和 sub 分别会考虑正负性，在输出时
加上正负号。另外，在 Postgresql 内所有类型的传输都是依靠结构体进行完成。</p>
<p><img src="https://s2.loli.net/2024/08/27/gNxfYlXAPs3tUiS.png" alt="image.png" /></p>
<p>因此，我依照 Postgresql 的方式，顺利完成了大整数加法和减法的设计。但是乘法怎么
做呢？我继续去读了源代码。具体的思想便是，它会将每个数字单独相乘，然后将结果像矩阵一样竖着相加。</p>
<p><img src="https://s2.loli.net/2024/08/27/XHIadbO7le8Atcs.png" alt="1724689992274.jpg" />
<img src="https://s2.loli.net/2024/08/27/snyeBXGkUjhcD4K.png" alt="1724690010664.jpg" /></p>
<p><img src="https://s2.loli.net/2024/08/27/mv2U3JgyOKRPtxq.png" alt="4023ab3f5d520d4420598bf329d29a0.png" /></p>
<p>这里边它的计算复杂度是 O(n<sup>2</sup>)，使用了两个 for 循环。在第二个 for 循环里，它将我们的矩阵逐步相加。不过这个 <code>A[i] += B * C[i]</code>的公式我可太熟悉了，这不就是我们的并行计算里最标准的并行化算法吗！看来如果想优化，我们可以从这里入手。当然，我猜测考虑到通信成本的问题，在这个第二层的 for 循环搞并行化一定是得不偿失的。大概看完代码后，我实现乘法决定这么实现：对于数 A x B，我们先用 B 中的一位 <code>var_digit</code>分别去乘上 A，也就是用一个数乘一个数组（multiply array x num），然后我们通过 <code>var_digit</code>所在的位数，将我们的结果进行移位（<code>shift</code>），最后把我们的结果加到我们的 <code>result</code> 数组上。这样的操作是和 Postgresql 里的操作基本一致的。</p>
<p><img src="https://s2.loli.net/2024/08/27/axXWZO8iJ4CVLNB.png" alt="1724690147420.jpg" /></p>
<p><img src="https://s2.loli.net/2024/08/27/lVGnmskOaBRXpEr.png" alt="1724690163458.jpg" /></p>
<p>这样，我们就通过 array，实现了大整数的乘法。这里我画了一张实现的图，它阐述了各个
方法之间的关系。</p>
<p><img src="https://s2.loli.net/2024/08/27/GTdLCDmKzZNicvf.png" alt="1724690461967.jpg" /></p>
<p>除法我没有实现，针对除法的整数部分，我们可以直接列竖式移位相减。不过我暂时没有想明白，小数点应该怎么处理。</p>
<div>           <!--块级封装-->
    <center>    <!--将图片和文字居中-->
    <img src="https://s2.loli.net/2024/08/27/tjXMalzy2PS3HVU.png"
         alt="无法显示图片时显示的文字"
         style="zoom:0.60"/>
    <br>        <!--换行-->
    Postgresql 里除法的实现内容 <!--标题-->
    </center>
</div>
<blockquote>
<p>PS： 回过头来看，高精度大整数除法没有想象中的那么困难。我们可以针对我们需求的精度，按照需求精度进行移位。当我们的所需精度都保证在除法的整数部分后，再相除，最后再移位小数点，即可输出对应的结果。因此，<strong>在除法中，精度很重要</strong>。</p>
<p>有很多的除法算法喜欢分成高精度除以低精度(短除法)，高精度除以高精度两种情况并分开实现。两者的区别在于，第一种由于精度较低，在获取完所求的精度后，便可直接退出计算。如300位有效数字除以5位有效数字，其大部分计算算至6-7位即可。</p>
<p>在数值计算除法大致可以分为两类：
<strong>慢速算法</strong>：每步只能确定一位的算法。长除法属于此类，时间复杂度为O(n<sup>2</sup>)。
<strong>快速算法</strong>：每步可以确定多位的算法。牛顿迭代法属于此类，配合用 FFT 实现的乘法，时间复杂度为O(N &times; log N)，其思想为逼近。（FFT的文章：）</p>
</blockquote>
<p>大整数的加减法跟 <code>double</code> 的加减法是不一样的。同样是一个加号，两者在最后的实现操作完全不同。我们是不能直接因为在草稿纸上脑子一动，就理所应当地认为他们的加法是一样的。</p>
<p>这让我想起在上学期的离散数学里老师讲的群环域的知识。<code>double</code> 所表示的数跟加法运算构成阿贝尔群，大整数所表示的数跟加法构成另一个阿贝尔群，这两个群的 基数Cardinality 并不相同：大整数群，也就是整数加法群，是个无限群，基数为&aleph;_0，而 <code>double</code> 的Cardinality 为2<sup>32</sup>，找不到一个在两群之间的单射函数，因而他们是不同构的。不过，是否存在一个函数 f: G-&gt;H ，使得 集合G内元素a,b 有  f(a+b) = f(a) + f(b) ，使得他们构成同态呢？</p>
<p>我们可以用加法群的单位元<code>0</code>来操作，令 <code>f(x) = 0</code>，即可说明。不过，即使他们两者同态，这也不能在算法上说明什么。浮点数中比较致命的事情是精度损失，这是整数加法所没有的。</p>
<h3>4.6 Karatsuba 大整数乘法探究</h3>
<p>有没有比相加然后移位更快的算法？我专门上网找了一下，还真有。知乎的这篇
<a href="https://zhuanlan.zhihu.com/p/144813558">Karatsuba大数乘法算法 - 知乎 (zhihu.com)</a>，就介绍了多种乘法运算。我们刚刚
使用的，仅仅是小学模拟乘法，列竖式相加。而其中使用 FFT 的 Schönhage–Strassen algorithm，
复杂度可以说是已经很少很少！仅仅 <code>O(n logn loglogn)</code>！</p>
<p><img src="https://s2.loli.net/2024/08/27/luTojpvBYfHtJUd.png" alt="image.png" /></p>
<p>至于 Karatsuba 算法，这算是我目前能够理解的算法了。它的核心要义在于，我们以往
的列竖式相加，我们要分别计算 <code>A x D</code> 和 <code>B x C</code>，随后再相加。而他想到了讲这个数变成
<code>(A+B)(C+D)-AC-BD</code>，这样就能用上两边已经运算了的数字，减少了运算次数。假如一个 4 位
数乘 4 位数，我们用小学生办法算要 16 次乘法，而他只要 9 次，这加快了我们的速度。</p>
<p><img src="https://s2.loli.net/2024/08/27/uGPYH7BjR6QtC4J.png" alt="image.png" /></p>
<p>但是，这个算法有个很严重的问题，就是他需要计算对数和指数，这需要新的实现以及
更多的功夫。</p>
<p><img src="https://s2.loli.net/2024/08/27/L94QXUCnsMDAP7I.png" alt="image.png" /></p>
<h2>Part 5: 内存泄露：Java 最高兴的一集</h2>
<p>啊！终于来到了最痛苦的部分。我在这里花费了 4 天 4 夜，也依旧没有解决完这个问题。
这是我有一天看完何泽安学长的 C/C++作业的时候发现的：内存泄露！每当我们在方法里
malloc 时，如果我们不 free 掉这部分内存，那么这部分内存会一直被视为被程序占用，一
直到这个程序终止，这样的话，我们的计算器会随着时间的发展，逐步吃掉我们整个计算机
的内存！
有什么办法可以检测这个问题吗？我找到了一个软件 valgrind，它是一个虚拟 CPU，在
这个虚拟 CPU 上会运行我们的代码，然后检测有没有内存从此消逝了。</p>
<p><img src="https://s2.loli.net/2024/08/27/qbGTOtC5Via43B1.png" alt="image.png" /></p>
<p>我们用 <code>valgrind ./haibinCalcluator 12345 x 123456</code>，去启动我们的计算器。结果发现，我们的计算器光荣地漏掉了 120byte，可能漏掉了 112byte。</p>
<p>我第一次考虑到这个问题时，前面的方法已经实现完成了，我此时只好去重构。而重构的方法也就借鉴了 Postgresql 里的操作：将代表 result 的字符串也输入进来，在 result 上进行操作，而不是在方法内自己 malloc 一个，不然的话返回的时候是无法 free 掉它的。真是伤脑筋！我瞬间感受到 C/C++的弱点：内存不安全！我又一想到可怕的 Windows 和 Postgresql里有几千万行代码，说不定哪行代码就没有实现内存释放 free。重构花去了我很多的时间去调试和修改，写了一个寒假的 java 后，突然遇到这样的情况，我顿时有一种在屎山里遨游的感觉，我顿时懂得了 Oracle 程序员的心理，太狗屎了！</p>
<p><img src="https://s2.loli.net/2024/08/27/MglOfrQ3juXFVaA.png" alt="image.png" /></p>
<p>此时一位明君启发了我。他在他的博客里写明了一种管理内存分配的方法：我们每次要分配一个内存的时候，我们就往一个链表里塞上我们分配内存的指针。在释放时我们将指针从链表中移除。<a href="https://blog.csdn.net/weixin_43308899/article/details/135122404">https://blog.csdn.net/weixin_43308899/article/details/135122404</a></p>
<p><img src="https://s2.loli.net/2024/08/27/WPB8O25NvKh9xJb.png" alt="image.png" /></p>
<p><img src="https://s2.loli.net/2024/08/27/rNH4gD5PFn7Uuyt.png" alt="image.png" /></p>
<p><img src="https://s2.loli.net/2024/08/27/VKuo5wWPQEAsefh.png" alt="image.png" /></p>
<p>通过这样的方法，我们就可以动态控制我们之前分配的指针。为了方便，我自己写了一个 <code>memcheck</code> 和 <code>clearMem</code> 的函数，他们可以随时监控内存泄露和清空已经分配的内存。</p>
<p><img src="https://s2.loli.net/2024/08/27/ekJ7NiXOLxBmMhE.png" alt="image.png" /></p>
<p>经过我们的一番爆改之后，我们的计算器不会出现内存泄露了。</p>
<p><img src="https://s2.loli.net/2024/08/27/CpGvkXzJwYaqh2n.png" alt="image.png" /></p>
<p><img src="https://s2.loli.net/2024/08/27/lLrvdVUMc4EITyB.png" alt="image.png" />
当然，就算是内存泄露了，也没什么问题，我们用 htop 查看我们的计算器占用内存，发现它的占用非常之少，我们可以不管这个内存的泄露。</p>
<h2>Part 6: 并行计算</h2>
<h3>6.1 应用 OpenMP</h3>
<p>我简单使用了一下 OpenMp 来完成乘法的并行化。在这里，我学习了 omp 的基本语法。</p>
<p><code>omp parallel for</code>: 这段 for 循环可以在多核上并行完成</p>
<p><code>shared</code>: 在循环时，本质上每个核会自己有一份参数的 copy。那么为了保证 copy 的一致性，我们就要将它们设为 shared。其实按照道理 default 状态下 result 和 carry 就都是共享状态了。如果想要每个 for 循环的参数都是独立的，我们要加 private。</p>
<p><code>reduction</code>: 规约。我们的计算当中，如果想汇总各个计算核心的结果，我们就要加一个reduction 操作。</p>
<p><img src="https://s2.loli.net/2024/08/27/KAiuV7OpYWZwrqg.png" alt="image.png" /></p>
<h3>6.2 GPU 编程：将浮点计算移植到 CUDA 架构</h3>
<p>在 CUDA 编程中，我们的计算器主要包含两个部分：CPU 上的函数和 GPU 的核函数。GPU 的核函数用 global 表示入口，然后在内部写下函数。只要满足 A = B + C*D 这种矩阵形式，nvcc 在编译时将自动把算法分配到各个核中去执行。</p>
<p><img src="https://s2.loli.net/2024/08/27/GrKvOjmXi1HVP4n.png" alt="image.png" /></p>
<p>而此时 CPU 由于计算的任务主要有 CUDA 负责了，CPU 任务主要就是将我们的参数搬运到 GPU 的内存中去。我们用 cudaMalloc 函数就能完成了。之后，我们再用 NVCC 编译器去编译我们的 haibinCalculator.cu 文件，就能获得我们的大整数乘法计算器了。</p>
<p><code>nvcc -o GPUCalculator src/haibin_calculator_cuda.cu</code></p>
<p><img src="https://s2.loli.net/2024/08/27/3ZYdUV1jrDgA8kw.png" alt="image.png" /></p>
<h2>Part 7: Project中的发现</h2>
<h3>7.1 快速平方根算法背后的秘密</h3>
<p><img src="https://s2.loli.net/2024/08/27/OQqdMBhZUg6i3mE.png" alt="image.png" /></p>
<p>这个算法是一种快速计算浮点数倒数平方根的近似方法，通常被称为&quot;快速平方根&quot;算法。它的起源可以追溯到 Quake III Arena 游戏的源代码，由程序员 John Carmack 在 1999年设计。这个算法以其非常高的性能和相对简单的实现而闻名。</p>
<p>其核心操作为，取出浮点数进行操作，随后使用y=x+b对平方根函数进行近似求解，之后使用牛顿迭代法逼近。</p>
<h3>7.2 大整数乘法 GMP 数学库</h3>
<p>网址：<a href="https://gmplib.org/">https://gmplib.org/</a> </p>
<p>GMP 大数库是 GUN 项目的一部分，它诞生于 1991 年，作为一个任意精度的大整数运算库，它包含了任意精度的整数、浮点数的各种基础运算操作。它是一个 C 语言库，主要应用于密码学应用和研究、互联网安全应用、代数系统、计算代数研究等。</p>
<p>GMP 库运行速度非常快，有网友测试它算 1000!结果不到一秒钟就已经算好，这还包括了输入输出的时间。</p>
<p>GMP 非常的恐怖，里边的历史日志真的从 1991 年开始记录，一直记录到 2023 年。单单是编译安装我都用了 5 分钟，而里边几百上千个文件，就连 Makefile 都有快千行。我又想到，我的计算器比起 Postgresql 已经是小巫见大巫，而这个 GMP 库的计算器又让 Postgresql显得何其渺小。</p>
<p><img src="https://s2.loli.net/2024/08/27/zQPW17DoXEjhVem.png" alt="image.png" /></p>
<h2>结语</h2>
<p>这个简单的计算器，让我感受到 C 语言的不简单。虽然才刚刚开始上手，但是指针，内存管理，多线程，优化等等东西都让我感受到这门语言独有的魅力。我认为语言的学习不是学个语法和单词就结束的，也不是学到分支、循环就结束了。学一门语言，就要学它的优势之处，学它的核心要义，这才是最重要的。</p>
<p>而我的这次体验，让我感受到 C 的基础与重要性。我们现在的各种工具，操作系统，最底层里原来也就是这么简单的事务组合而成。想到这里，我又冒出了那个熟悉的词汇：敬畏。这些代码一点一点的累加，才有了今天的高楼大厦。</p>
<p>另外，这次我的研究其实涉及的范围挺广的，主要是因为我单纯抱着第一步认识的兴趣去研究。为什么我想研究这些？其实也没有什么特别的原因。但是我此时想起了朱光潜《谈美》里的一段话：</p>
<p>“科学和哲学穷到极境，都是要满足求知的欲望。每个哲学家和科学家对于他自己所见到的一点真理（无论它究竟是不是真理）都觉得有趣味，都用一股热忱去欣赏它。“地球绕日运行”，“勾方加股方等于弦方”一类的科学事实，和《密罗斯爱神》或《第九交响曲》一样可以摄魂震魄。科学家去寻求这一类的事实，穷到究竟，也正因为它们可以摄魂震魄。所以科学的活动也还是一种艺术的活动，不但善与美是一体，真与美也并没有隔阂。”</p>
<p>写 C 程序的美感跟 Java 很不一样，但是，我很喜欢。</p>
<h2>Acknowledgement</h2>
<p>感谢肖翊成、马国恒、杨宇坤同学对本次project的支持。</p>
<h2>Reference</h2>
<p>[1] PostgreSQL Global Development Group. (2024.3). PostgreSQL: Documentation: Main Page. Retrieved from <a href="https://doxygen.postgresql.org/">https://doxygen.postgresql.org/</a></p>
<p>[2] GMP Project. (2023.7). GMP, Arithmetic without limitations: The GNU Multiple Precision
Arithmetic Library. Retrieved from <a href="https://gmplib.org/">https://gmplib.org/</a></p>
<p>[3] &quot;IEEE Standard for Binary Floating-Point Arithmetic,&quot; in ANSI/IEEE Std 754-1985 , vol., no., pp.1-20, 12 Oct. 1985, doi: 10.1109/IEEESTD.1985.82928. keywords: {Digital
arithmetic;Standards;binary;Floating-point arithmetic}, </p>
<p>[4] IEEE Standard 754 for Binary Floating-Point Arithmetic. (1997.10). Retrieved from
<a href="https://people.eecs.berkeley.edu/~wkahan/ieee754status/IEEE754.PDF">https://people.eecs.berkeley.edu/~wkahan/ieee754status/IEEE754.PDF</a></p>
<p>[5] Burger, Robert G. and R. Kent Dybvig. “ Printing floating-point numbers quickly and
accurately. ” ACM-SIGPLAN Symposium on Programming Language Design and
Implementation (1996).</p>
<p>[6] CUDA C Programming Guide. Retrived from
<a href="https://docs.nvidia.cn/cuda/cuda-c-programming-guide/contents.html">https://docs.nvidia.cn/cuda/cuda-c-programming-guide/contents.html</a></p>
<p>[7] Using OpenMP with C. Retrived from
<a href="https://curc.readthedocs.io/en/latest/programming/OpenMP-C.html">https://curc.readthedocs.io/en/latest/programming/OpenMP-C.html</a></p>
<h1>EOF</h1>
