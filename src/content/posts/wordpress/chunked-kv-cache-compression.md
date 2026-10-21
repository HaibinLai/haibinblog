---
title: "Chunked KV-Cache Compression"
description: "A nice paper showing a problem inside the Chunked KV-Cache Compression. https://arxiv.org/pdf/2609.36322 Models like dpskv4 used chunked kv cache compression, it compressed 8 tokens each time into a kv vector to save kv…"
publishedAt: "2026-10-10 04:45:48"
category: "fragments"
tags: ["AI", "KVCache"]
draft: false
slug: "chunked-kv-cache-compression"
legacySlug: "chunked-kv-cache-compression"
wordpressId: 1706
sourceUrl: "https://www.haibinlaiblog.top/index.php/chunked-kv-cache-compression/"
commentCount: 0
importedFromWordPress: true
---
<p>A nice paper showing a problem inside the Chunked KV-Cache Compression. <a href="https://arxiv.org/pdf/2609.36322">https://arxiv.org/pdf/2609.36322</a> Models like dpskv4 used chunked kv cache compression, it compressed 8 tokens each time into a kv vector to save kv memory. However the paper finds a pattern called phase specialization: for example, a token may be preserved well when it falls into 1st token of the 8 token chunks (phase 1), but become degraded if places it in 2nd/phase 2.</p>
<p>(DPSKv4 use sliding window 8 with steps 4. That means for compression, it first compressed 0-7, then 4-11, then 8-15 etc)</p>
<p>To learn what is chunked kv cache compression
<a href="https://arxiv.org/pdf/2502.00299">https://arxiv.org/pdf/2502.00299</a></p>
