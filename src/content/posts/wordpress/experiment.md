---
title: "Experiment"
description: "Run on WSL Setup WSL X11 environment Run the image # load asterinas 0.11.0 docker load -i .\\asterinas.tar # run the image with X11 forwarding sudo docker run -it --privileged -v $(pwd)/asterinas:/root/asterinas -e DISPL…"
publishedAt: "2025-01-12 23:48:11"
updatedAt: "2025-01-13 16:00:00"
category: "OS"
tags: ["OS"]
draft: false
slug: "experiment"
legacySlug: "experiment"
wordpressId: 593
sourceUrl: "https://haibin-blog.vercel.app/index.php/experiment/"
commentCount: 0
importedFromWordPress: true
---
<h2>Run on WSL</h2>
<h3>Setup WSL X11 environment</h3>
<p>Run the image</p>
<pre><code class="language-bash"># load asterinas 0.11.0
docker load -i .\asterinas.tar

# run the image with X11 forwarding
sudo docker run -it --privileged -v $(pwd)/asterinas:/root/asterinas -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix asterinas/asterinas:0.11.0</code></pre>
<p>Get X11 library</p>
<pre><code class="language-bash">sudo apt update
sudo apt-get install libghc-x11-dev # get x11 lib</code></pre>
<h3>X11 Test</h3>
<p>Here we provide a simple example from <a href="https://blog.csdn.net/tianziczj/article/details/6601959">https://blog.csdn.net/tianziczj/article/details/6601959</a> to test if X11 works on WSL:</p>
<pre><code class="language-C">#include &lt;X11/Xlib.h&gt;
#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;string.h&gt;

int main(void) {
   Display *d;
   Window w;
   XEvent e;
   char *msg = &quot;Hello, World!&quot;;
   int s;

   d = XOpenDisplay(NULL);
   if (d == NULL) {
      fprintf(stderr, &quot;Cannot open display\n&quot;);
      exit(1);
   }

   s = DefaultScreen(d);
   w = XCreateSimpleWindow(d, RootWindow(d, s), 100, 100, 500,500, 1,
                           777215, 111111);
               printf(&quot;BlackPixel(d, s) is %d\n&quot;,(int)BlackPixel(d, s));
               printf(&quot;WhitePixel(d, s) is %d\n&quot;,(int)WhitePixel(d, s));
   XSelectInput(d, w, ExposureMask | KeyPressMask);
   XMapWindow(d, w);

   while (1) {
      XNextEvent(d, &amp;e);
      if (e.type == Expose) {
         XFillRectangle(d, w, DefaultGC(d, s), 20, 20, 10, 10);
         XDrawString(d, w, DefaultGC(d, s), 10, 50, msg, strlen(msg));
      }
      if (e.type == KeyPress)
         break;
   }

   XCloseDisplay(d);
   return 0;
}</code></pre>
<p>Compile it using X11 library:</p>
<pre><code class="language-bash">gcc hello_x11.c -o HelloX11 -lX11</code></pre>
<p>if it works well, it will output a screen with &quot;hello world&quot;:
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202501122334946.png" alt="a091ddae8f24749bb2bbd8d4314c342.png" /></p>
<h3>Extra: X11 Debug</h3>
<ol>
<li>vscode</li>
</ol>
<pre><code class="language-bash">MoTTY X11 proxy: Unsupported authorisation protocol
Cannot open display</code></pre>
<h3>Qemu Recompilation</h3>
<p>To enable graphic in Qemu, we need to recompile the qemu simulator for asterinas.</p>
<pre><code># get qemu source code
wget https://download.qemu.org/qemu-8.2.1.tar.xz
tar xf qemu-8.2.1.tar.xz
cd qemu-8.2.1

# ensure necessary package for qemu
sudo apt install libgtk-3-dev
sudo apt install libglib2.0-dev
sudo apt install ninja-build

# configure qemu display
 ./configure \
    --target-list=x86_64-softmmu \
    --prefix=/usr/local/qemu \
    --enable-slirp \
    --enable-gtk \

# compile and build
make -j$(nproc)
make install</code></pre>
<p>This configuration will enable GTK.</p>
<p>GTK is a <a href="http://en.wikipedia.org/wiki/Widget_toolkit">widget toolkit</a>. Each user interface created by GTK consists of widgets. GTK (formerly known as GIMP Toolkit and GTK+) is a free and open-source, cross-platform widget toolkit for creating graphical user interfaces (GUIs). It is licensed under the terms of the GNU Lesser General Public License, allowing both free and proprietary software to use it. It is one of the most popular toolkits for the Wayland and X11 window systems.</p>
<p>User Networking (SLiRP) is the default networking backend for QEMU that provides a full TCP/IP stack within QEMU </p>
<h3>Test GTK Window on Asterinas</h3>
<pre><code class="language-bash">cd asterinas
make build
make run</code></pre>
<p>And we can see the qemu is starting using a GTK Window.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202501131556119.png" alt="271b5791bdda282e7ff4332ec2e17d9.png" /></p>
<p>Then, it will appear with all screen green:</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202501131557311.png" alt="9c34773ee6cccfcd92c3279364fe6ea.png" /></p>
<p>This is because
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202501131558856.png" alt="" /></p>
<h2>Reference</h2>
<p>GTK
<a href="https://askubuntu.com/questions/1309029/qemu-display-gtk-and-display-sdl-not-available-ubuntu-20-04-1-lts">QEMU -display gtk and -display sdl not available | Ubuntu 20.04.1 LTS - Ask Ubuntu</a></p>
