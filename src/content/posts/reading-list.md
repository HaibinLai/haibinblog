---
title: Reading list
description: "A reading list on scalable learning, practical ML systems, and LLM systems."
publishedAt: 2026-11-08
updatedAt: 2026-11-08
category: Research
categories: []
tags: [reading-list, machine-learning, LLM-systems]
language: en
draft: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-11/reading-list/d470d771aec8c869b1b366bbfd3297ef-2bef43fe12d8.jpg"
showCitation: true
---
# Reading list

## Module 1: Foundations of scalable learning

### SGD and machine learning

- [Optimization Methods for Large-Scale Machine Learning](https://arxiv.org/abs/1606.04838). SIAM Review.

### Optimizers beyond SGD

- [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980). ICLR.
- [Muon: An Optimizer for Hidden Layers in Neural Networks](https://kellerjordan.github.io/posts/muon/). Blog post.
- [On the Importance of Initialization and Momentum in Deep Learning](https://proceedings.mlr.press/v28/sutskever13.html). ICML.
- [Adaptive Subgradient Methods for Online Learning and Stochastic Optimization](https://jmlr.org/papers/v12/duchi11a.html). JMLR.
- [On the Convergence of Adam and Beyond](https://arxiv.org/abs/1904.09237). ICLR.
- [Shampoo: Preconditioned Stochastic Tensor Optimization](https://arxiv.org/abs/1802.09568). ICML.

### Parallel training in distributed SGD

- [Large Scale Distributed Deep Networks](https://proceedings.neurips.cc/paper_files/paper/2012/file/6aca97005c68f1206823815f66102863-Paper.pdf). NeurIPS.
- [Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour](https://arxiv.org/abs/1706.02677). arXiv.
- [Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent](https://arxiv.org/abs/1106.5730). NeurIPS.
- [Scaling Distributed Machine Learning with the Parameter Server](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/li_mu). OSDI.
- [Can Decentralized Algorithms Outperform Centralized Algorithms?](https://arxiv.org/abs/1705.09056). NeurIPS.
- [Local SGD Converges Fast and Communicates Little](https://arxiv.org/abs/1805.09767). ICLR.

### Optimizer efficiency at scale (memory, communication, mixed precision)

- [Mixed Precision Training](https://arxiv.org/abs/1710.03740). ICLR.
- [QSGD: Communication-Efficient SGD via Gradient Quantization and Encoding](https://arxiv.org/abs/1610.02132). NeurIPS.
- [GaLore: Memory-Efficient LLM Training by Gradient Low-Rank Projection](https://arxiv.org/abs/2403.03507). ICML.
- [Training Deep Nets with Sublinear Memory Cost](https://arxiv.org/abs/1604.06174). arXiv.
- [signSGD: Compressed Optimisation for Non-Convex Problems](https://arxiv.org/abs/1802.04434). ICML.
- [Deep Gradient Compression](https://arxiv.org/abs/1712.01887). ICLR.

### Scaling bottlenecks in distributed SGD

- [An Empirical Model of Large-Batch Training](https://arxiv.org/abs/1812.06162). arXiv.
- [Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM](https://arxiv.org/abs/2104.04473). SC.
- [Measuring the Effects of Data Parallelism on Neural Network Training](https://arxiv.org/abs/1811.03600). JMLR.
- [Roofline: An Insightful Visual Performance Model for Multicore Architectures](https://doi.org/10.1145/1498765.1498785). CACM.
- [PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377). SOSP.
- [Large Batch Optimization for Deep Learning: Training BERT in 76 Minutes](https://arxiv.org/abs/1904.00962). ICLR.

## Module 2: Practical ML systems beyond accuracies

### Federated and collaborative learning

- [Communication-Efficient Learning of Deep Networks from Decentralized Data](https://arxiv.org/abs/1602.05629). AISTATS.
- [Towards Federated Learning at Scale: System Design](https://arxiv.org/abs/1902.01046). MLSys.
- [Federated Optimization in Heterogeneous Networks](https://arxiv.org/abs/1812.06127). MLSys.
- [Deep Leakage from Gradients](https://arxiv.org/abs/1906.08935). NeurIPS.

### ML pipeline in practice and model compression

- [Hidden Technical Debt in Machine Learning Systems](https://papers.nips.cc/paper/5656-hidden-technical-debt-in-machine-learning-systems). NeurIPS.
- [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531). arXiv.
- [Deep Compression](https://arxiv.org/abs/1510.00149). ICLR.
- [Challenges in Deploying Machine Learning: A Survey of Case Studies](https://arxiv.org/abs/2011.09926). ACM Computing Surveys.
- [The Lottery Ticket Hypothesis](https://arxiv.org/abs/1803.03635). ICLR.

### Random hashing in large-scale ML

- [Feature Hashing for Large Scale Multitask Learning](https://arxiv.org/abs/0902.2206). ICML.
- [An Improved Data Stream Summary: The Count-Min Sketch and its Applications](https://doi.org/10.1016/j.jalgor.2003.12.001). J. Algorithms.
- [Compressing Neural Networks with the Hashing Trick](https://arxiv.org/abs/1504.04788). ICML.
- [SLIDE: In Defense of Smart Algorithms over Hardware Acceleration for Large-Scale Deep Learning Systems](https://arxiv.org/abs/1903.03129). MLSys.
- [Reformer: The Efficient Transformer](https://arxiv.org/abs/2001.04451). ICLR.

### Robustness, distribution shift, and privacy

- [Towards Deep Learning Models Resistant to Adversarial Attacks](https://arxiv.org/abs/1706.06083). ICLR.
- [WILDS: A Benchmark of in-the-Wild Distribution Shifts](https://arxiv.org/abs/2012.07421). ICML.
- [Deep Learning with Differential Privacy](https://arxiv.org/abs/1607.00133). CCS.
- [Certified Adversarial Robustness via Randomized Smoothing](https://arxiv.org/abs/1902.02918). ICML.
- [Extracting Training Data from Large Language Models](https://arxiv.org/abs/2012.07805). USENIX Security.

## Module 3: LLM systems in practice

### LLM pipeline, language models and transformers

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762). NeurIPS.
- [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). NeurIPS.
- [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf). OpenAI tech report.
- [BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805). NAACL.

### Data selection, labeling, and infrastructure


- [DataComp-LM: In Search of the Next Generation of Training Sets for Language Models](https://arxiv.org/abs/2406.11794). NeurIPS D&B.
- [DoReMi: Optimizing Data Mixtures Speeds Up Language Model Pretraining](https://arxiv.org/abs/2305.10429). NeurIPS.
- [Dolma: An Open Corpus of Three Trillion Tokens](https://arxiv.org/abs/2402.00159). ACL.
- [Data Selection for Language Models via Importance Resampling](https://arxiv.org/abs/2302.03169). NeurIPS.
- [Beyond Neural Scaling Laws: Beating Power Law Scaling via Data Pruning](https://arxiv.org/abs/2206.14486). NeurIPS.
- [Prioritized Training on Points that are Learnable, Worth Learning, and Not Yet Learnt](https://arxiv.org/abs/2206.07137). ICML.
- [Selection via Proxy: Efficient Data Selection for Deep Learning](https://arxiv.org/abs/1906.11829). ICLR.
- [Snorkel: Rapid Training Data Creation with Weak Supervision](https://arxiv.org/abs/1711.10160). VLDB.

### Optimizers and distributed training for language models

- [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135). NeurIPS.
- [Muon is Scalable for LLM Training](https://arxiv.org/abs/2502.16982). arXiv.
- [Fantastic Pretraining Optimizers and Where to Find Them](https://arxiv.org/abs/2509.02046). ICLR.

### Supervised finetuning and RL

- [Training Language Models to Follow Instructions with Human Feedback](https://arxiv.org/abs/2203.02155). NeurIPS.
- [Direct Preference Optimization: Your Language Model is Secretly a Reward Model](https://arxiv.org/abs/2305.18290). NeurIPS.
- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948). arXiv.
- [Finetuned Language Models Are Zero-Shot Learners](https://arxiv.org/abs/2109.01652). ICLR.
- [LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685). ICLR.
- [Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741). NeurIPS.

### Efficient inference for language models

- [Efficiently Scaling Transformer Inference](https://arxiv.org/abs/2211.05102). MLSys.
- [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192). ICML.
- [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104). NeurIPS.
- [Scaling LLM Test-Time Compute Optimally Can Be More Effective than Scaling Model Parameters](https://arxiv.org/abs/2408.03314). ICLR.

### Multi-agent systems: overview and applications

- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629). ICLR.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents). Blog post.
- [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657). arXiv.
