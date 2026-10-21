---
title: "How can lscpu get Cache size"
description: "Since Operating System corporate little with Cache, How can lscpu knows the size of them? The CPUID Explorer: Part 2 Answer: CPUID Register From CPUID register! CPUID is an instruction in x86 and x86-64 processors that…"
publishedAt: "2024-12-13 22:49:15"
updatedAt: "2024-12-13 22:53:06"
category: "OS"
tags: ["CPU", "Linux", "OS"]
draft: false
slug: "how-can-lscpu-get-cache-size"
legacySlug: "how-can-lscpu-get-cache-size"
wordpressId: 543
sourceUrl: "https://www.haibinlaiblog.top/index.php/how-can-lscpu-get-cache-size/"
commentCount: 0
importedFromWordPress: true
---
<p>Since Operating System corporate little with Cache, How can <code>lscpu</code> knows the size of them?</p>
<p><a href="http://www.flounder.com/cpuid_explorer2.htm#CPUID(0x80000002)">The CPUID Explorer: Part 2</a></p>
<h2>Answer: CPUID Register</h2>
<p>From CPUID register!</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202412132244932.png" alt="" /></p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/New/202412132244608.png" alt="" /></p>
<p><strong>CPUID</strong> is an instruction in x86 and x86-64 processors that provides detailed information about the CPU, such as its manufacturer, model, features, and supported instruction sets. This instruction allows software (e.g., operating systems, utilities, and applications) to query the processor for its capabilities and characteristics, enabling better optimization, compatibility checks, and hardware-specific decisions.</p>
<h3>Key Features of CPUID:</h3>
<ol>
<li>
<p><strong>Processor Identification</strong>: The CPUID instruction returns information about the CPU's vendor (Intel, AMD, etc.), model number, family, and stepping, which helps identify the specific processor in use.</p>
</li>
<li>
<p><strong>Supported Features and Instructions</strong>: CPUID also reports the availability of specific processor features, such as MMX, SSE, AVX, virtualization support (Intel VT-x, AMD-V), and others. This helps software to determine which CPU features are available and adjust its behavior accordingly.</p>
</li>
<li>
<p><strong>Performance Optimization</strong>: By detecting which instructions the CPU supports, software can optimize itself by using the most efficient instruction sets (e.g., using AVX if supported, or falling back to older instruction sets if not).</p>
</li>
</ol>
<h3>How CPUID Works:</h3>
<p>The CPUID instruction produces output in multiple registers:</p>
<ul>
<li><strong>EAX</strong>: Contains a value that specifies the function number being called and also returns information about the processor’s version and family.</li>
<li><strong>EBX, ECX, EDX</strong>: Contain flags and information regarding supported features, capabilities, and the CPU’s capabilities (e.g., whether it supports SSE, AVX, and other instruction sets).</li>
<li>The output of CPUID is often interpreted as bit flags, where each bit represents whether a specific feature is supported.</li>
</ul>
<h3>Common Uses of CPUID:</h3>
<ol>
<li>
<p><strong>Hardware Detection</strong>: Operating systems and applications can use CPUID to detect the hardware features of the CPU, allowing for hardware-specific optimizations. For example, a program may check if the CPU supports AVX (Advanced Vector Extensions) and use AVX instructions for improved performance if available.</p>
</li>
<li>
<p><strong>Virtualization Support Detection</strong>: CPUID can be used to detect if the CPU supports virtualization technologies (like Intel VT-x or AMD-V). This is crucial for virtualization software (such as VMware or VirtualBox) to function properly.</p>
</li>
<li>
<p><strong>Compatibility Checks</strong>: Some software checks the CPUID output to ensure that the CPU meets the minimum requirements for running certain applications. For instance, games or software that require a specific feature set may verify the CPU's capabilities via CPUID.</p>
</li>
</ol>
<h3>Example of CPUID Output:</h3>
<p>If you execute the CPUID instruction, the following is a simplified example of what might be returned:</p>
<ul>
<li><strong>EAX</strong>: The family, model, and stepping of the processor (for example, it may indicate that you have an Intel Core i7-7700K).</li>
<li><strong>EBX, ECX, EDX</strong>: Feature flags indicating whether certain instructions or capabilities are supported (e.g., SSE, AVX, Hyper-Threading, or virtualization support).</li>
</ul>
<p>In summary, CPUID is a vital tool for determining the capabilities of the processor, enabling software to adapt to different hardware and leverage the full potential of the CPU.</p>
<h3>Reference</h3>
<p><a href="https://blog.csdn.net/wangnanwlw/article/details/142773504">https://blog.csdn.net/wangnanwlw/article/details/142773504</a></p>
<p><a href="https://github.com/util-linux/util-linux/blob/master/sys-utils/lscpu.c">https://github.com/util-linux/util-linux/blob/master/sys-utils/lscpu.c</a></p>
<p><a href="https://www.cnblogs.com/aozhejin/p/15955554.html">https://www.cnblogs.com/aozhejin/p/15955554.html</a></p>
<p><a href="https://blog.csdn.net/chengyq116/article/details/80009786">https://blog.csdn.net/chengyq116/article/details/80009786</a></p>
<p><a href="https://www.ichenfu.com/2020/12/17/cpuinfo-model-name/">https://www.ichenfu.com/2020/12/17/cpuinfo-model-name/</a></p>
<p><a href="https://blog.csdn.net/bianchengxiaoma/article/details/139808852#:~:text=lscpu%20%E6%98%AF%E4%B8%80%E4%B8%AA%E5%9C%A8%20Linux%E7%B3%BB%E7%BB%9F%20%E4%B8%AD%E7%94%A8%E4%BA%8E%E6%98%BE%E7%A4%BACPU%E6%9E%B6%E6%9E%84%E4%BF%A1%E6%81%AF%E7%9A%84%E5%91%BD%E4%BB%A4%E3%80%82%20%E5%AE%83%E5%B1%9E%E4%BA%8E%20util-linux%20%E8%BD%AF%E4%BB%B6%E5%8C%85%EF%BC%8C%E5%B9%B6%E6%8F%90%E4%BE%9B%E4%BA%86%E5%85%B3%E4%BA%8ECPU%E7%9A%84%E8%AF%A6%E7%BB%86%E7%A1%AC%E4%BB%B6%E4%BF%A1%E6%81%AF%EF%BC%8C%E5%A6%82CPU%E6%95%B0%E9%87%8F%E3%80%81%E7%BA%BF%E7%A8%8B%E6%95%B0%E3%80%81%E6%A0%B8%E5%BF%83%E6%95%B0%E3%80%81%E7%BC%93%E5%AD%98%E9%85%8D%E7%BD%AE%E3%80%81CPU%E5%9E%8B%E5%8F%B7%E7%AD%89%E3%80%82%20%E8%BF%99%E4%BA%9B%E6%95%B0%E6%8D%AE%E5%9C%A8%E6%95%B0%E6%8D%AE%E5%A4%84%E7%90%86%E5%92%8C%E5%88%86%E6%9E%90%E4%B8%AD%E8%87%B3%E5%85%B3%E9%87%8D%E8%A6%81%EF%BC%8C%E5%9B%A0%E4%B8%BA%E5%AE%83%E4%BB%AC%E7%9B%B4%E6%8E%A5%E5%BD%B1%E5%93%8D%E7%A8%8B%E5%BA%8F%E7%9A%84%E6%89%A7%E8%A1%8C%E6%95%88%E7%8E%87%E5%92%8C%E7%B3%BB%E7%BB%9F%E7%9A%84%E6%95%B4%E4%BD%93,%2Fproc%2Fcpuinfo%20%E3%80%81%20%2Fsys%2Fdevices%2Fsystem%2Fcpu%2F%20%E7%AD%89%E7%B3%BB%E7%BB%9F%E6%96%87%E4%BB%B6%E6%9D%A5%E8%8E%B7%E5%8F%96CPU%E7%9A%84%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF%EF%BC%8C%E5%B9%B6%E5%B0%86%E8%BF%99%E4%BA%9B%E4%BF%A1%E6%81%AF%E4%BB%A5%E6%98%93%E8%AF%BB%E7%9A%84%E6%A0%BC%E5%BC%8F%E5%B1%95%E7%A4%BA%E7%BB%99%E7%94%A8%E6%88%B7%E3%80%82%20%E4%BB%A5%E4%B8%8B%E6%98%AF%20lscpu%20%E5%91%BD%E4%BB%A4%E7%9A%84%E4%B8%80%E4%BA%9B%E4%B8%BB%E8%A6%81%E7%89%B9%E7%82%B9%E5%92%8C%E5%8F%82%E6%95%B0%EF%BC%9A%20%E8%AF%A6%E7%BB%86%E5%85%A8%E9%9D%A2%EF%BC%9A%E6%8F%90%E4%BE%9BCPU%E7%9A%84%E8%AF%A6%E7%BB%86%E7%A1%AC%E4%BB%B6%E4%BF%A1%E6%81%AF%EF%BC%8C%E5%8C%85%E6%8B%AC%E5%9E%8B%E5%8F%B7%E3%80%81%E6%9E%B6%E6%9E%84%E3%80%81%E7%BC%93%E5%AD%98%E3%80%81%E7%BA%BF%E7%A8%8B%E5%92%8C%E6%A0%B8%E5%BF%83%E9%85%8D%E7%BD%AE%E7%AD%89%E3%80%82">Linux: lscpu</a></p>
