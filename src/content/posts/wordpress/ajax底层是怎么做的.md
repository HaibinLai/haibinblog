---
title: "Ajax底层是怎么做的"
description: "省流：HTTP通信+XML数据结构 AJAX（Asynchronous JavaScript and XML）的底层原理涉及浏览器与服务器之间的异步通信。AJAX 的关键在于通过 JavaScript 实现网页的异步请求，而不需要重新加载整个页面。它使得网页可以在不干扰用户操作的情况下，部分更新页面内容。其底层原理主要涉及以下几个方面： 1. XMLHttpRequest 对象 XMLHttpRequest （XHR）是 AJAX 的…"
publishedAt: "2025-01-05 10:56:18"
category: "Computer Network"
tags: ["Network", "网络", "计算机网络"]
draft: false
slug: "ajax底层是怎么做的"
legacySlug: "ajax底层是怎么做的"
wordpressId: 562
sourceUrl: "https://haibin-blog.vercel.app/index.php/ajax%e5%ba%95%e5%b1%82%e6%98%af%e6%80%8e%e4%b9%88%e5%81%9a%e7%9a%84/"
commentCount: 0
importedFromWordPress: true
---
<p>省流：HTTP通信+XML数据结构</p>
<p>AJAX（Asynchronous JavaScript and XML）的底层原理涉及浏览器与服务器之间的异步通信。AJAX 的关键在于通过 JavaScript 实现网页的异步请求，而不需要重新加载整个页面。它使得网页可以在不干扰用户操作的情况下，部分更新页面内容。其底层原理主要涉及以下几个方面：</p>
<h3>1. <strong>XMLHttpRequest 对象</strong></h3>
<ul>
<li>
<p><code>XMLHttpRequest</code>（XHR）是 AJAX 的核心组成部分。它是一个浏览器提供的 API，用于在客户端与服务器之间发送请求，并处理服务器响应的数据。</p>
</li>
<li>
<p><strong>创建和初始化请求：</strong></p>
<ul>
<li>使用 <code>XMLHttpRequest</code> 对象，你可以向服务器发起 HTTP 请求（如 GET、POST、PUT、DELETE 等），并设置请求的目标 URL。</li>
<li>通过 <code>open()</code> 方法初始化请求，指定请求类型、URL 和异步标志（通常是 <code>true</code>，表示异步请求）。</li>
</ul>
</li>
<li>
<p><strong>发送请求：</strong></p>
<ul>
<li>使用 <code>send()</code> 方法发送请求。对于 GET 请求，<code>send()</code> 通常没有参数；而对于 POST 请求，<code>send()</code> 方法通常会传递请求体数据（如表单数据或 JSON 数据）。</li>
</ul>
</li>
<li>
<p><strong>接收响应：</strong></p>
<ul>
<li>一旦服务器响应了请求，<code>XMLHttpRequest</code> 对象会触发 <code>onreadystatechange</code> 或 <code>onload</code> 事件，在事件的回调函数中处理返回的数据。</li>
<li>响应数据可以通过 <code>responseText</code>（文本数据）或 <code>responseXML</code>（XML 数据）属性访问。</li>
</ul>
</li>
</ul>
<h3>2. <strong>异步通信</strong></h3>
<ul>
<li>
<p><strong>异步请求：</strong> AJAX 的核心优势之一是它的异步性。与传统的同步请求不同，AJAX 的请求是非阻塞的。浏览器在发送请求后，不会等待服务器响应，而是继续执行后续代码。只有在服务器响应并完成时，回调函数才会被触发，从而处理返回的数据。</p>
</li>
<li>
<p><strong>事件驱动：</strong> 通过监听 <code>onreadystatechange</code> 或 <code>onload</code> 事件，JavaScript 可以异步处理响应，避免了页面的刷新和用户体验的中断。<code>readyState</code> 状态和 <code>status</code> 状态码是用来判断请求和响应的状态。</p>
</li>
<li>
<p><strong>无页面刷新：</strong> 异步获取数据并更新页面内容时，浏览器并不刷新整个页面。只需修改网页的局部内容，从而提升用户体验。网页可以更加流畅地与服务器交互，避免了整个页面的重载。</p>
</li>
</ul>
<h3>3. <strong>HTTP 请求和响应</strong></h3>
<p>AJAX 本质上还是基于 HTTP 协议进行请求和响应的。这意味着它的底层依赖于浏览器通过 HTTP 协议与服务器进行通信。在底层，AJAX 请求的处理逻辑和普通的浏览器请求是相同的，区别在于：</p>
<ul>
<li>
<p><strong>HTTP 请求：</strong> <code>XMLHttpRequest</code> 发送 HTTP 请求时，可以设置请求方法（如 GET、POST 等）和请求头（如 Content-Type 等）。</p>
</li>
<li>
<p><strong>HTTP 响应：</strong> 服务器通过 HTTP 协议返回数据，AJAX 根据返回的状态码（如 200 表示成功，404 表示未找到，500 表示服务器错误等）处理响应数据。常见的响应数据格式包括纯文本（Text）、JSON 数据、XML 数据等。</p>
</li>
</ul>
<h3>4. <strong>JavaScript 事件和回调函数</strong></h3>
<p>AJAX 使用事件驱动的方式与服务器交互。当 AJAX 请求发出后，浏览器继续执行后续代码，不会阻塞。在服务器响应时，事件（如 <code>onreadystatechange</code> 或 <code>onload</code>）被触发，并通过回调函数处理服务器返回的数据。</p>
<ul>
<li>
<p><strong>回调函数的执行：</strong> 一旦 HTTP 请求完成，AJAX 会通过回调函数通知应用程序，并在回调中对响应数据进行处理（如解析 JSON 数据、更新页面内容等）。</p>
</li>
<li>
<p><strong>同步 vs 异步：</strong> <code>XMLHttpRequest</code> 允许同步和异步两种方式。异步请求是 AJAX 的关键特性，但也可以通过将 <code>open()</code> 方法的第三个参数设置为 <code>false</code> 来创建同步请求。然而，通常情况下，异步请求是首选。</p>
</li>
</ul>
<h3>5. <strong>跨域问题（CORS）</strong></h3>
<p>由于同源策略，浏览器会限制从一个域发出的请求访问另一个域的资源。AJAX 请求默认只能访问与当前页面同源的服务器（即协议、域名和端口都相同）。但有时需要从其他域加载数据，这就涉及到 <strong>跨域请求</strong>。</p>
<ul>
<li>
<p><strong>CORS（跨域资源共享）</strong>：通过设置服务器的 <code>Access-Control-Allow-Origin</code> 等 HTTP 响应头，服务器可以允许跨域请求。这是现代浏览器和服务器端实现 AJAX 请求跨域的主要机制。</p>
</li>
<li>
<p><strong>JSONP（JSON with Padding）</strong>：对于一些老旧的跨域解决方案，JSONP 通过动态创建 <code>&lt;script&gt;</code> 标签来实现跨域请求。它是一种利用 JavaScript 跨域加载数据的技术，但现在已经逐渐被 CORS 取代。</p>
</li>
</ul>
<h3>6. <strong>响应的数据格式</strong></h3>
<p>AJAX 通常处理以下几种类型的响应数据：</p>
<ul>
<li><strong>文本数据（Text）</strong>：这是最常见的格式，可以通过 <code>responseText</code> 属性访问。它通常是一个字符串，可以是 HTML、纯文本或其他格式。</li>
<li><strong>JSON 数据（JSON）</strong>：AJAX 很常用来处理 JSON 格式的数据，尤其在 Web 应用程序中。JSON 格式便于与 JavaScript 对象互相转换，因此是 Web 开发中最常用的数据格式之一。</li>
<li><strong>XML 数据（XML）</strong>：虽然名称中有 “XML” 字样，但 AJAX 也支持通过 <code>responseXML</code> 处理 XML 数据。不过，JSON 格式比 XML 更轻量、更易用，因此 JSON 已成为现代开发的首选数据格式。</li>
</ul>
<h3>7. <strong>浏览器的事件循环机制</strong></h3>
<p>浏览器的事件循环机制保证了在执行异步操作时，JavaScript 引擎不会被阻塞。请求通过事件队列处理，当事件完成时，回调函数就会被放入 JavaScript 运行时环境（即调用栈）进行执行。</p>
<h3>总结</h3>
<p>AJAX 的底层原理基于以下几个核心要素：</p>
<ol>
<li><strong>XMLHttpRequest</strong> 对象：用于发送 HTTP 请求并接收响应。</li>
<li><strong>异步通信</strong>：通过非阻塞的方式处理请求和响应，保证用户界面不会被锁定。</li>
<li><strong>HTTP 请求和响应</strong>：通过标准的 HTTP 协议与服务器交换数据。</li>
<li><strong>JavaScript 事件和回调机制</strong>：通过事件和回调函数处理响应数据，实现异步操作。</li>
<li><strong>跨域问题（CORS）</strong>：跨域请求需要通过 CORS 或 JSONP 等技术解决。</li>
</ol>
<p>通过这些机制，AJAX 能够实现动态、无需刷新页面即可更新内容的 Web 应用体验。****</p>
<p>HTML、CSS 和 JavaScript 是现代网页的三大核心技术，它们分别负责网页的结构、样式和行为。它们的结合让我们能够创建丰富且交互性强的网站。下面我将详细介绍这三种技术的作用以及浏览器如何渲染它们的过程。</p>
<h3>1. HTML（超文本标记语言）</h3>
<p>HTML 是网页的结构语言。它定义了网页的内容和结构，使用一系列的标签（如 <code>&lt;div&gt;</code>、<code>&lt;p&gt;</code>、<code>&lt;a&gt;</code> 等）来表示不同的网页元素。HTML 本身不涉及样式或行为，它只负责网页内容的布局。</p>
<h4>作用：</h4>
<ul>
<li>定义网页的结构和内容。</li>
<li>用标签（元素）标识网页上的不同部分，比如标题、段落、图片、链接等。</li>
</ul>
<h3>2. CSS（层叠样式表）</h3>
<p>CSS 是网页的样式表，用来控制网页的外观和布局。它与 HTML 配合工作，主要定义网页元素的样式，比如颜色、字体、间距、对齐方式等。</p>
<h4>作用：</h4>
<ul>
<li>设置 HTML 元素的样式。</li>
<li>控制网页布局（如 Flexbox 和 Grid）。</li>
<li>使网页更具美观性和响应式设计（适应不同设备的屏幕）。</li>
</ul>
<h3>3. JavaScript</h3>
<p>JavaScript 是一种编程语言，用于为网页添加互动性和动态行为。它可以改变网页的内容、响应用户的输入、控制动画、与服务器进行通信等。</p>
<h4>作用：</h4>
<ul>
<li>动态修改 HTML 内容。</li>
<li>响应用户事件（如点击按钮、鼠标移动、键盘输入等）。</li>
<li>与服务器通信（如通过 AJAX 或 Fetch API）。</li>
</ul>
<h3>浏览器如何渲染 HTML、CSS 和 JavaScript？</h3>
<p>浏览器渲染网页的过程可以分为几个阶段：</p>
<h4>1. <strong>解析 HTML：构建 DOM 树</strong></h4>
<ul>
<li>浏览器首先读取 HTML 文件，将其解析成 <strong>DOM（文档对象模型）树</strong>。DOM 是一个树状结构，每个 HTML 元素都成为树中的一个节点。</li>
<li>例如，<code>&lt;html&gt;</code> 标签是根节点，<code>&lt;body&gt;</code> 和其他元素是子节点。</li>
</ul>
<h4>2. <strong>解析 CSS：构建 CSSOM 树</strong></h4>
<ul>
<li>浏览器会读取和解析页面中的 CSS 文件或内嵌的 CSS 样式，构建 <strong>CSSOM（CSS对象模型）树</strong>，这是一种描述页面样式的树结构。</li>
<li>CSSOM 与 DOM 树合并，形成渲染树。渲染树的每个节点对应页面中可见的部分。</li>
</ul>
<h4>3. <strong>合成渲染树：计算布局和绘制</strong></h4>
<ul>
<li>合并后的渲染树会帮助浏览器计算每个可见元素的位置、大小（即“布局”），这就是浏览器的 <strong>布局阶段</strong>。</li>
<li>计算出每个元素的具体位置后，浏览器会将它们绘制到屏幕上。这是 <strong>绘制阶段</strong>。</li>
</ul>
<h4>4. <strong>执行 JavaScript</strong></h4>
<ul>
<li>JavaScript 的代码会在浏览器解析 HTML 时被加载和执行，通常是在 HTML 被解析的过程中或者在 DOM 完成构建后。</li>
<li>JavaScript 代码可以操作 DOM 和 CSSOM，动态修改页面内容、样式或触发事件。JavaScript 可能会在渲染过程中对页面做出修改，这会导致页面的重排（Reflow）或重绘（Repaint）。</li>
</ul>
<h4>5. <strong>重排与重绘</strong></h4>
<ul>
<li><strong>重排（Reflow）</strong>：当 JavaScript 或 CSS 修改了元素的布局或结构时，浏览器需要重新计算这些元素的大小和位置。例如，改变元素的大小、隐藏元素等。</li>
<li><strong>重绘（Repaint）</strong>：当仅改变元素的外观（如颜色、背景等），但不影响布局时，浏览器需要重新绘制这些元素。</li>
</ul>
<h3>浏览器渲染的流程总结：</h3>
<ol>
<li><strong>解析 HTML</strong>：构建 DOM 树。</li>
<li><strong>解析 CSS</strong>：构建 CSSOM 树。</li>
<li><strong>合并 DOM 和 CSSOM</strong>：构建渲染树。</li>
<li><strong>计算布局</strong>：为每个元素计算位置和大小。</li>
<li><strong>绘制元素</strong>：将元素渲染到屏幕上。</li>
<li><strong>执行 JavaScript</strong>：如果有，动态修改页面内容或样式。</li>
</ol>
<h3>浏览器渲染优化：</h3>
<p>现代浏览器通常会采取一系列的优化策略，以提高网页的渲染效率，比如：</p>
<ul>
<li><strong>异步加载 JavaScript</strong>：通过 <code>async</code> 或 <code>defer</code> 属性，避免阻塞页面的渲染过程。</li>
<li><strong>请求合并与缓存</strong>：减少重复请求，提高页面加载速度。</li>
<li><strong>渲染管道优化</strong>：避免不必要的重排和重绘，提高响应速度。</li>
</ul>
<h3>小结：</h3>
<ul>
<li><strong>HTML</strong> 定义网页的结构和内容。</li>
<li><strong>CSS</strong> 控制网页的外观和布局。</li>
<li><strong>JavaScript</strong> 增加页面的交互性和动态行为。</li>
</ul>
<p>浏览器通过解析 HTML 和 CSS 构建 DOM 树和 CSSOM 树，然后合并它们形成渲染树，接着计算布局并绘制到屏幕上。JavaScript 则在页面加载或交互过程中起到动态修改页面内容和样式的作用。</p>
