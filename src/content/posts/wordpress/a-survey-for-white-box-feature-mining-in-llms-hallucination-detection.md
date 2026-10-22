---
title: "A Survey for White-Box Feature Mining in LLMs' Hallucination Detection"
description: "White-Box Feature Mining for Hallucination Detection in Large Language Models This post is adapted from my CS306 Data Mining course report. The original PDF version is available here: data_mining_personal.pdf . Abstract…"
publishedAt: "2026-08-09T17:49:30Z"
updatedAt: "2026-08-09T19:12:57Z"
category: "Academic"
categories: ["Academic"]
tags: ["big data", "data mining"]
author: "GB"
draft: false
slug: "a-survey-for-white-box-feature-mining-in-llms-hallucination-detection"
legacySlug: "a-survey-for-white-box-feature-mining-in-llms-hallucination-detection"
oldSlugs: []
wordpressId: 1580
sourceUrl: "https://www.haibinlaiblog.top/index.php/a-survey-for-white-box-feature-mining-in-llms-hallucination-detection/"
commentCount: 0
viewCount: 1087
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-08/a-survey-for-white-box-feature-mining-in-llms-hallucination-detection.webp"
---
<h1>White-Box Feature Mining for Hallucination Detection in Large Language Models</h1>
<blockquote>
<p>This post is adapted from my CS306 Data Mining course report. The original PDF version is available here: <a href="https://raw.githubusercontent.com/HaibinLai/detect-AI-generated-text/main/reports/data_mining_personal.pdf">data_mining_personal.pdf</a>.</p>
</blockquote>
<h2>Abstract</h2>
<p>Large language models (LLMs) have shown strong generation ability in question answering, summarization, code generation, and multi-step reasoning. However, they may produce fluent but factually incorrect, contextually inconsistent, or logically unsupported content, a phenomenon commonly known as hallucination. Because hallucinations are often hidden inside well-formed and confident natural language, keyword matching and hand-written rules are unreliable. This report studies the scientific problem of how data mining techniques can transform a model's internal generation traces into compact features for hallucination detection. We focus on white-box detection, in which the detector accesses internal signals produced during generation, including attention maps, hidden activations, logits, and predictive entropy. We argue that attention weights are a particularly informative signal: the ratio of attention placed on the input context versus the model's own generated tokens reflects whether a claim is grounded in evidence. We analyze the main challenges of white-box mining, namely high-dimensional and weakly interpretable internal tensors, the gap between token-level uncertainty and semantic hallucination, fine-grained localization in long-form text, and cross-model transferability. We then review representative attention-based, hidden-state, and logit-entropy methods, and show how they can be unified through an anomaly-detection view that localizes hallucinations to specific sentences or tokens. Finally, we propose a white-box framework that mines multi-layer attention and internal-state features for hallucination risk scoring and evidence attribution.</p>
<p><strong>Keywords:</strong> large language models, hallucination detection, white-box detection, attention weights, internal states, anomaly detection</p>
<h2>Introduction</h2>
<p><strong>Table 1. Taxonomy of hallucination detection methods by detector access</strong></p>
<table>
<thead>
<tr>
<th>Type</th>
<th>Detection idea</th>
<th>Observed signal</th>
<th>Representative work</th>
</tr>
</thead>
<tbody>
<tr>
<td>White-box</td>
<td>Attention mining</td>
<td>Attention maps</td>
<td>[15, 17, 16]</td>
</tr>
<tr>
<td>White-box</td>
<td>Hidden states</td>
<td>Activations</td>
<td>[14, 20, 21]</td>
</tr>
<tr>
<td>White-box</td>
<td>Logits / entropy</td>
<td>Output distribution</td>
<td>[10]</td>
</tr>
<tr>
<td>Black-box (resource-free)</td>
<td>Self-consistency</td>
<td>Multiple samples</td>
<td>[11, 31]</td>
</tr>
<tr>
<td>Black-box (resource-free)</td>
<td>Cross-examination</td>
<td>Generated answers</td>
<td>[3]</td>
</tr>
<tr>
<td>Black-box (resource)</td>
<td>Knowledge / retrieval</td>
<td>Atomic facts</td>
<td>[12, 32]</td>
</tr>
</tbody>
</table>
<p>Language models are powerful and widely used [1, 2]. But even the best LLMs often generate text that is factually wrong or nonsensical [3, 4, 5]. This problem is called hallucination [6]. In LLMs, a hallucination is text that reads fluently but does not match the intended meaning, the facts, the logic, or the context [7]. Such errors are especially harmful in high-stakes domains such as medicine, law, and finance, where one fabricated fact can mislead users [8]. What makes the problem hard is precisely this surface plausibility: a hallucinated claim is usually a small, locally incorrect span embedded in an otherwise correct and grammatical passage [9], so it cannot be caught by keyword matching or simple lexical rules.</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/detect-AI-generated-text/main/blog/assets/data_mining_personal/whitebox_framework.png" alt="White-box attention-centered feature mining workflow|800" /></p>
<p><em>Figure 1. A white-box, attention-centered feature mining workflow for LLM hallucination detection. A single forward pass yields attention, hidden-state, and logit signals; per-sentence features are fused and scored by anomaly detection.</em></p>
<p>A growing body of work tries to detect hallucinations automatically. A useful way to organize these methods is by how fine-grained the unit of judgment is and what information the detector observes. Rather than validating a whole sentence at once, recent approaches first identify the key concepts, such as named entities and keyphrases, that carry the factual content of a response, and treat them as the candidates most likely to be hallucinated [10]. They then estimate how uncertain the model is about each candidate. When the model has access to logit outputs, the token-level probabilities of a concept give a direct signal: a low probability on even a single token of an entity (for example, an unfamiliar surname) is strong evidence that the model is guessing, whereas averaging the probabilities tends to wash out this signal [10]. Such uncertainty scores act as cheap, generation-time indicators that can flag suspicious spans before an expensive external check is run.</p>
<p>Existing hallucination detection methods can be broadly organized by the information available to the detector, as summarized in Table 1. <em>White-box</em> methods access internal generation signals, including attention maps, hidden activations, logits, and layer-wise representations, and mine them into features that indicate whether a generated claim is grounded. <em>Black-box</em> methods observe only inputs and outputs: zero-resource variants exploit repeated sampling, self-consistency, and LLM-as-a-judge evaluation, whereas non-zero-resource variants compare generated claims against retrieved documents, external databases, or knowledge graphs [11, 12]. Black-box detectors are flexible and apply even to closed commercial models, but they act only after generation and cannot observe the model's internal uncertainty; white-box detectors are finer-grained and need only a single forward pass, at the cost of requiring access to model weights. Some recent benchmarks further split off a <em>gray-box</em> category for methods that read only output probabilities or logits without internal states [13]; for clarity we keep these under white-box, since they still rely on model-internal signals.</p>
<p>This report therefore focuses on white-box hallucination detection. In white-box settings, the detector can access internal model signals produced during generation, including hidden activations, logits, predictive entropy, attention maps, gradients, and layer-wise representations. These signals provide a richer view of how the model selects tokens, stores factual knowledge, attends to input context, and balances parametric knowledge against external evidence. From a data mining perspective, the key challenge is to transform these high-dimensional internal traces into compact, interpretable, and transferable features for hallucination detection.</p>
<h2>Core Scientific Question</h2>
<p>The core scientific question studied in this report is:</p>
<blockquote>
<p>In open-domain scenarios where absolute ground truth is unavailable or expensive to annotate, how can we mine inconsistencies among LLM outputs, generation distributions, internal states, and external knowledge in order to automatically identify, localize, and explain semantic hallucinations?</p>
</blockquote>
<p>This question has two levels. The first is detection: deciding whether a generated passage contains hallucinated content. The second is attribution: identifying which sentence, entity relation, or reasoning step is suspicious, and returning evidence that can support human review. Detection determines whether a system can issue timely warnings, while attribution determines whether the system can be trusted and improved in real applications.</p>
<h2>Research Challenges</h2>
<p>We focus on the challenges of mining a model's internal generation traces, rather than on external evaluation. Four difficulties stand out for white-box hallucination detection.</p>
<p><strong>Table 2. Comparison of white-box feature families</strong></p>
<table>
<thead>
<tr>
<th>Feature family</th>
<th>Internal signal</th>
<th>Strength</th>
<th>Limitation</th>
</tr>
</thead>
<tbody>
<tr>
<td>Attention mining</td>
<td>Per-head lookback ratio, attention map [15, 17, 16]</td>
<td>Single forward pass; localizes ungrounded spans; transfers across model sizes</td>
<td>Needs open weights; head selection matters</td>
</tr>
<tr>
<td>Hidden states</td>
<td>EigenScore, layer contrast, probes, subspaces, layer dynamics [14, 20, 21, 22, 23, 24, 25, 26, 27, 28]</td>
<td>Dense semantics; supports activation-level anomaly localization</td>
<td>High memory cost; architecture-specific</td>
</tr>
<tr>
<td>Logits / entropy</td>
<td>Predictive entropy, confidence [10]</td>
<td>Cheap; available even with limited access</td>
<td>Token uncertainty <code class="mathjax-inline language-mathjax">\neq</code> hallucination</td>
</tr>
</tbody>
</table>
<h3>High-Dimensional and Weakly Interpretable Internal Signals</h3>
<p>During generation, an LLM produces logits, attention weights, hidden states, and token probabilities at every layer and every head. These signals form high-dimensional tensors with complex layer-wise dependencies, and they cannot be read directly as human-understandable hallucination indicators. For example, a single response of about <code class="mathjax-inline language-mathjax">512</code> tokens from Qwen3.6-27B (27B parameters, 64 layers, of which 16 use gated full attention with 24 query heads, hidden size <code class="mathjax-inline language-mathjax">5120</code>, vocabulary <code class="mathjax-inline language-mathjax">248320</code>) already induces on the order of <code class="mathjax-inline language-mathjax">16\cdot24\cdot T^2\approx1.0\times10^{8}</code> attention weights and <code class="mathjax-inline language-mathjax">L\,T\,d\approx1.7\times10^{8}</code> hidden-state values. INSIDE shows that internal states still retain useful information for hallucination detection [14], but the challenge, illustrated in Figure 2, is to compress these hundreds of millions of raw scalars into a handful of stable, low-dimensional, and interpretable mining features.</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/detect-AI-generated-text/main/blog/assets/data_mining_personal/highdim_internal_signals.png" alt="High-dimensional internal signals are compressed into compact features" /></p>
<p><em>Figure 2. One forward pass of Qwen3.6-27B yields on the order of <code class="mathjax-inline language-mathjax">10^8</code> attention and hidden-state scalars, which must be compressed into a few interpretable features.</em></p>
<h3>Token-Level Uncertainty Is Not Hallucination</h3>
<p>A natural idea is to treat high predictive entropy or low token probability as a hallucination signal. However, open-ended language admits many valid expressions, so a high-entropy token is often only stylistic variation rather than a factual error. Conversely, a model can be confidently wrong and assign high probability to a fabricated entity. The challenge is to design features that separate harmless surface uncertainty from genuine factual or contextual hallucination, for example by contrasting attention to evidence against attention to self-generated tokens.</p>
<h3>Error Dilution and Fine-Grained Localization</h3>
<p>LLM hallucination is usually not random noise. It is often a local error embedded in an otherwise fluent paragraph, such as a single wrong birth year, affiliation, or publication title in an otherwise correct biography. Passage-level scores are diluted by the overall fluency of the text. Effective white-box detection therefore requires mapping internal features back to specific sentences, entities, or tokens, and then applying local anomaly discovery to flag the exact suspicious span.</p>
<h3>Cross-Model Transfer and Access Constraints</h3>
<p>White-box features depend on architecture-specific quantities, so a detector trained on one model may transfer poorly to another model family with different depth, head count, or attention behavior. Moreover, attention and activation signals are only available for open-weight models; closed commercial APIs expose neither, which limits applicability. A practical white-box detector must therefore aim for features that are as model-agnostic as possible and degrade gracefully when only partial internal access is available.</p>
<h2>White-Box Technical Directions</h2>
<p>A survey of hallucination detection groups white-box features into five types: hidden-layer activations, logits, entropy, attention weights, and gradients [7]. We organize them into three feature families and then describe how anomaly detection turns these features into a localized hallucination decision.</p>
<h3>Attention-Based Mining</h3>
<p>Attention weights directly record where the model looks when generating each token. The central hypothesis, formalized by Lookback Lens, is that contextual hallucination is related to how much an LLM attends to the provided context versus its own previously generated tokens [15]. Let <code class="mathjax-inline language-mathjax">a_{t,i}^{(l,h)}</code> be the attention weight from the token generated at step <code class="mathjax-inline language-mathjax">t</code> to position <code class="mathjax-inline language-mathjax">i</code> in attention head <code class="mathjax-inline language-mathjax">h</code> of layer <code class="mathjax-inline language-mathjax">l</code>. According to Lookback Lens [15], splitting the positions into the context span <code class="mathjax-inline language-mathjax">C</code> and the already-generated span <code class="mathjax-inline language-mathjax">G</code>, the lookback ratio of one head is defined as</p>
<pre><code class="language-katex">\displaystyle
\mathrm{LR}_t^{(l,h)}
=
\dfrac{\displaystyle\sum_{i\in C} a_{t,i}^{(l,h)}}
{\displaystyle\sum_{i\in C} a_{t,i}^{(l,h)}+\displaystyle\sum_{j\in G} a_{t,j}^{(l,h)}}.</code></pre>
<p>Stacking <code class="mathjax-inline language-mathjax">\mathrm{LR}_t^{(l,h)}</code> over all layers and heads gives a feature vector for token <code class="mathjax-inline language-mathjax">t</code>; averaging over a span gives a sentence-level feature. A low ratio means the model is &quot;talking to itself&quot; instead of grounding on evidence, which signals higher hallucination risk. Notably, a simple linear classifier on lookback-ratio features matches a much richer hidden-state detector and even transfers from a 7B model to a 13B model without retraining [15].</p>
<p>Beyond a single ratio, the shape of the attention map carries information. LLM-Check analyzes the attention map of a single response to design lightweight detection scores that need no repeated sampling [16]. For retrieval-augmented generation, ReDeEP uses mechanistic interpretability to decouple the contribution of external context from parametric knowledge, combining attention weights with logits to detect when the model ignores retrieved evidence [17]. It frames detection causally, treating parametric knowledge and external context as mutually confounding factors and explicitly separating their contributions instead of mixing them as plain token-probability uncertainty does. Useful attention-derived statistics include attention entropy (how diffuse the attention is), the attention mass placed on entity tokens, and the evidence coverage (whether some context spans receive almost no attention from any head). AggTruth aggregates per-head attention scores over the context to obtain a single contextual-faithfulness statistic that is cheap to compute at generation time [18], while spectral analysis of the attention maps treats their eigenvalue spectrum as a feature, capturing global structure that a single ratio misses [19]. By contrasting attention to evidence against attention to self-generated tokens, this family directly addresses Challenge 3.2: it separates harmless surface uncertainty from genuinely ungrounded content. The transferability of the lookback ratio across model sizes also mitigates Challenge 3.4.</p>
<h3>Hidden States and Activations</h3>
<p>Hidden activations encode the dense semantics that logits lose after token decoding. According to INSIDE [14], this can be exploited by computing the EigenScore, which uses the eigenvalues of the covariance matrix of several responses' embeddings to measure semantic self-consistency in the dense representation space. DoLa observes that factual knowledge is more concentrated in deeper layers, and contrasts the projections of shallow and deep layers into the vocabulary space to expose content that deviates from the model's internal knowledge [20]. Rateike et al. take an explicit anomaly view: they run statistical tests on the activation distributions of hallucinated versus faithful text and locate the anomalous activation units, together with the input features that trigger them [21].</p>
<p>A second line treats the hidden states as a feature space to be probed or clustered. Supervised probes such as SAPLMA train a classifier on input-output hidden states to predict whether a statement is true [22], while MIND removes the labeling cost by learning the probe from generation-time states in an unsupervised, real-time setting [23]. Subspace methods instead look for a truthfulness direction: CCS finds a contrast-consistent direction from paired hidden states without supervision [24], and HaloScope estimates a hallucination-related subspace from unlabeled generations and fits a classifier on the induced membership [25]. SEP further shows that semantic entropy can be approximated by a probe on the hidden states of a single generation, avoiding repeated sampling [26]. Finally, dynamics-guided features track how representations evolve: PRISM uses prompt-guided hidden states to improve cross-domain transfer [27], and ICR Probe builds scores from cross-layer hidden-state updates together with attention maps [28], linking this family back to the attention signals of Section 4.1. By compressing high-dimensional hidden states into a single scalar (EigenScore) or a small set of anomalous units, this family responds to Challenge 3.1, turning raw internal tensors into compact and interpretable features.</p>
<h3>Logits and Predictive Entropy</h3>
<p>The most accessible white-box signal is the output distribution. Following standard uncertainty estimation for language generation [5], a simple token-level measure is predictive entropy</p>
<pre><code class="language-katex">H_t=-\sum_{v\in V} p(v \mid x, y_{\lt t}) \log p(v \mid x, y_{\lt t}),</code></pre>
<p>where <code class="mathjax-inline language-mathjax">V</code> is the vocabulary. Rising entropy near important entity tokens suggests the model is uncertain about the corresponding fact. Varshney et al. use such low-confidence signals to detect and then mitigate hallucinations during generation, validating low-probability spans before the error propagates [10]. Because long sequences accumulate more low-probability terms, length-normalized log-probability is commonly used so that comparisons across spans of different length remain fair. Recent work refines this raw uncertainty: Semantic Energy aggregates the energy of the output distribution over semantically equivalent answers, separating confident errors from harmless lexical variation better than plain entropy [29], and a Fast Fourier Transform of the per-layer probability signals along the token axis exposes periodic patterns that distinguish faithful from hallucinated spans [30].</p>
<h3>Anomaly Detection for Localization</h3>
<p>The three feature families above can be unified through a common data-mining pattern. Each sentence (or atomic span) is represented by a multi-level feature vector that concatenates attention statistics, hidden-state summaries, and entropy or confidence values:</p>
<pre><code class="language-katex">\mathbf{z}_s=\big[\,\overline{\mathrm{LR}}_s,\; H^{\max}_s,\; \operatorname{EigenScore}_s,\; \operatorname{conf}^{\operatorname{ent}}_s,\;\ldots\,\big].</code></pre>
<p>Treating most generated sentences as &quot;normal,&quot; hallucinated spans appear as outliers in this feature space. Unsupervised detectors such as isolation forest, local outlier factor, or density-based clustering can then score and rank spans, while a lightweight supervised classifier can be trained when labels are available. This view directly answers the localization requirement of Challenge 3.3: instead of one passage-level score, the detector returns the precise sentence or token where the internal signals look abnormal, so a local error is no longer diluted by the overall fluency of the passage. Compared with purely black-box methods, white-box mining offers finer localization and needs only a single forward pass, at the cost of requiring model access and careful feature selection.</p>
<h2>Proposed White-Box Method</h2>
<p>Based on the above analysis, this report proposes an attention-centered white-box framework, as shown in Figure 1. With a single forward pass, the first stage segments the response into sentences and entity spans and records the attention maps, hidden states, and logits aligned to each span. The second stage mines features per span: per-head lookback ratios and attention entropy from the attention branch, EigenScore and layer-contrast scores from the hidden-state branch, and predictive entropy and length-normalized confidence from the logit branch. The third stage feeds the concatenated feature vector <code class="mathjax-inline language-mathjax">\mathbf{z}_s</code> into an anomaly detector (isolation forest or LOF when labels are scarce, or a lightweight classifier when labels exist) to produce a sentence- or token-level hallucination risk.</p>
<p>The goal is not only higher accuracy, but also interpretable localization. For every high-risk span, the system reports the dominant internal signal behind the alert, for example a collapsed lookback ratio, an outlier activation unit, or abnormally high entropy on an entity token. This design keeps the detector itself transparent rather than turning it into another opaque black box.</p>
<p>Experiments can be conducted on open-domain question answering, biography generation, and summarization. Evaluation data can be drawn from TruthfulQA, FActScore, or manually constructed fact-checking datasets. Detection performance can be measured by accuracy, recall, F1, and AUC. Localization performance can be measured by sentence-level or atomic-fact-level F1. Explanation quality can be evaluated by evidence coverage and agreement with human reviewers.</p>
<p>False positives and false negatives should be evaluated separately. In high-risk domains such as medicine and law, recall should be prioritized because severe hallucinations should not be missed. In everyday writing assistance, precision may matter more because frequent false alarms can interrupt the user experience.</p>
<h2>Conclusion</h2>
<p>LLM hallucination detection is fundamentally a data mining problem over a model's internal generation traces. Surface text similarity alone cannot reliably find factual errors hidden inside fluent language. This report focused on white-box mining, and argued that attention weights, especially the ratio of attention to context versus self-generated tokens, are a compact and transferable signal for whether a claim is grounded. By combining attention, hidden-state, and logit features under a shared anomaly-detection view, the detector can localize hallucinations at the sentence or token level and report the internal signal behind each alert. Future work should further address cross-model transfer of attention features, low-cost long-form detection, and the reliability of the detector itself, so that LLMs can be used more safely in high-stakes applications.</p>
<h2>References</h2>
<ol>
<li>Ouyang, Long et al.. (2022). <em>Training Language Models to Follow Instructions with Human Feedback</em>. Advances in Neural Information Processing Systems.</li>
<li>OpenAI. (2023). <em>GPT-4 Technical Report</em>. arXiv preprint arXiv:2303.08774.</li>
<li>Cohen, Roi et al.. (2023). <em>LM vs LM: Detecting Factual Errors via Cross Examination</em>. arXiv preprint arXiv:2305.13281.</li>
<li>Ren, Jie et al.. (2023). <em>Out-of-Distribution Detection and Selective Generation for Conditional Language Models</em>. The Eleventh International Conference on Learning Representations.</li>
<li>Kuhn, Lorenz et al.. (2023). <em>Semantic Uncertainty: Linguistic Invariances for Uncertainty Estimation in Natural Language Generation</em>. The Eleventh International Conference on Learning Representations.</li>
<li>Ji, Ziwei et al.. (2023). <em>Survey of Hallucination in Natural Language Generation</em>. ACM Computing Surveys. DOI: 10.1145/3571730.</li>
<li>Li, Zituo et al.. (2026). <em>Survey of Hallucination Detection Methods for Large Language Models</em>. Journal of Computer Research and Development. DOI: 10.7544/issn1000-1239.202550069.</li>
<li>Lin, Stephanie et al.. (2022). <em>TruthfulQA: Measuring How Models Mimic Human Falsehoods</em>. Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics. DOI: 10.18653/v1/2022.acl-long.229.</li>
<li>Huang, Lei et al.. (2025). <em>A Survey on Hallucination in Large Language Models: Principles, Taxonomy, Challenges, and Open Questions</em>. ACM Transactions on Information Systems. DOI: 10.1145/3703155.</li>
<li>Varshney, Neeraj et al.. (2023). <em>A Stitch in Time Saves Nine: Detecting and Mitigating Hallucinations of LLMs by Validating Low-Confidence Generation</em>. arXiv preprint arXiv:2307.03987.</li>
<li>Manakul, Potsawee et al.. (2023). <em>SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models</em>. Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing. DOI: 10.18653/v1/2023.emnlp-main.557.</li>
<li>Min, Sewon et al.. (2023). <em>FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation</em>. Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing. DOI: 10.18653/v1/2023.emnlp-main.741.</li>
<li>Li, Xinyi et al.. (2026). <em>OpenHalDet: A Unified Benchmark for Hallucination Detection across Diverse Generation Scenarios</em>. arXiv preprint arXiv:2606.06959.</li>
<li>Chen, Chao et al.. (2024). <em>INSIDE: LLMs' Internal States Retain the Power of Hallucination Detection</em>. The Twelfth International Conference on Learning Representations.</li>
<li>Chuang, Yung-Sung et al.. (2024). <em>Lookback Lens: Detecting and Mitigating Contextual Hallucinations in Large Language Models Using Only Attention Maps</em>. Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing.</li>
<li>Sriramanan, Gaurang et al.. (2024). <em>LLM-Check: Investigating Detection of Hallucinations in Large Language Models</em>. Advances in Neural Information Processing Systems.</li>
<li>Sun, Zhongxiang et al.. (2024). <em>ReDeEP: Detecting Hallucination in Retrieval-Augmented Generation via Mechanistic Interpretability</em>. arXiv preprint arXiv:2410.11414.</li>
<li>Matys, Piotr et al.. (2025). <em>AggTruth: Contextual Hallucination Detection using Aggregated Attention Scores in LLMs</em>. arXiv preprint arXiv:2506.18628.</li>
<li>Binkowski, Jakub et al.. (2025). <em>Hallucination Detection in LLMs Using Spectral Features of Attention Maps</em>. arXiv preprint arXiv:2502.17598.</li>
<li>Chuang, Yung-Sung et al.. (2024). <em>DoLa: Decoding by Contrasting Layers Improves Factuality in Large Language Models</em>. The Twelfth International Conference on Learning Representations.</li>
<li>Rateike, Miriam et al.. (2023). <em>Weakly Supervised Detection of Hallucinations in LLM Activations</em>. Advances in Neural Information Processing Systems.</li>
<li>Azaria, Amos and Mitchell, Tom. (2023). <em>The Internal State of an LLM Knows When It's Lying</em>. Findings of the Association for Computational Linguistics: EMNLP 2023.</li>
<li>Su, Weihang et al.. (2024). <em>Unsupervised Real-Time Hallucination Detection based on the Internal States of Large Language Models</em>. Findings of the Association for Computational Linguistics: ACL 2024.</li>
<li>Burns, Collin et al.. (2023). <em>Discovering Latent Knowledge in Language Models Without Supervision</em>. The Eleventh International Conference on Learning Representations.</li>
<li>Du, Xuefeng et al.. (2024). <em>HaloScope: Harnessing Unlabeled LLM Generations for Hallucination Detection</em>. Advances in Neural Information Processing Systems.</li>
<li>Kossen, Jannik et al.. (2024). <em>Semantic Entropy Probes: Robust and Cheap Hallucination Detection in LLMs</em>. arXiv preprint arXiv:2406.15927.</li>
<li>Zhang, Fujie et al.. (2024). <em>Prompt-Guided Internal States for Hallucination Detection of Large Language Models</em>. arXiv preprint arXiv:2411.04847.</li>
<li>Zhang, Zhenliang et al.. (2025). <em>ICR Probe: Tracking Hidden State Dynamics for Reliable Hallucination Detection in LLMs</em>. Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics.</li>
<li>Ma, Huan et al.. (2025). <em>Semantic Energy: Detecting LLM Hallucination Beyond Entropy</em>. arXiv preprint arXiv:2508.14496.</li>
<li>Li, Jinxin et al.. (2025). <em>LLM Hallucination Detection: A Fast Fourier Transform Method Based on Hidden Layer Temporal Signals</em>. arXiv preprint arXiv:2509.13154.</li>
<li>Farquhar, Sebastian et al.. (2024). <em>Detecting hallucinations in large language models using semantic entropy</em>. Nature. DOI: 10.1038/s41586-024-07421-0.</li>
<li>Lewis, Patrick et al.. (2020). <em>Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks</em>. Advances in Neural Information Processing Systems.</li>
</ol>
