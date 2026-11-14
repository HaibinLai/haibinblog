---
title: "Paper Reading: ICLR15 Explaining and Harnessing Adversarial Examples"
description: "Paper Reading: ICLR15 Explaining and Harnessing Adversarial Examples"
publishedAt: 2026-11-13
updatedAt: 2026-11-13
category: Paper Reading
categories: []
tags: [AI, ML]
language: zh-CN
draft: false
showCitation: true
publisherRevision: 7fa5cc09-b9d5-4353-8289-5cb4fad2421c
---
https://www.haibinlaiblog.top/posts/large-scale-machine-learning-reading-list/

复现的代码仓库： https://github.com/HaibinLai/large-scale-ml-reproduce 实验完全由codex完成，其clone了代码或者用pytorch重现。 

## Explaining and Harnessing Adversarial Examples

ICLR15

这篇文章研究对抗样本。在神经网络里，存在这样一类样本，给它们输入一些专门设计的微小扰动，就可以使网络在对它们的识别上失效。文章提出了为什么出现对抗样本，以及怎么解决和利用对抗样本。

Several machine learning models, including neural networks, consistently misclassify adversarial examples—inputs formed by applying small but intentionally worst-case perturbations to examples from the dataset, such that the perturbed input results in the model outputting an incorrect answer with high confidence.

![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/d9c14714-7807-43ce-b2c0-7770fcef4a42.png)
Examples of one adversarial example. From panda to gibbon, only add with only a 0.007x of noise

之前的研究以为，对抗样本的来源可能是神经网络里的极端非线性、正则化不足（即样本里很小的偏差被非线性函数极度放大造成了识别错误，又或者样本本身在空间里分布有点“边缘”，很容易就迈过边缘线） "extreme nonlinearity of deep neural networks, perhaps combined with insufficient model averaging and insufficient regularization of the purely supervised learning problem"。
但是作者研究发现，哪怕是线性行为，就足以产生对抗样本。 Linear behavior in high-dimensional spaces is sufficient to cause adversarial examples.

**如何在线性中产生对抗样本：积少成多。** 我们给线性模型加上扰动(adversarial perturbation)后，模型分数会因为$w^\top\eta=\sum_i w_i\eta_i.$ 而变化。我们定义扰动 $\eta = \epsilon \operatorname{sign}\left(\nabla_x J(\theta, x, y)\right).$

$$ w^\top\tilde{x} =w^\top(x+\eta) =\underbrace{w^\top x}_{\text{原始分数}} +\underbrace{w^\top\eta}_{\text{扰动造成的分数变化}}. $$


虽然每个 $\eta_i$ 很小，但我们有很多的维度，如果有意选择扰动方向，让各项 $w_i\eta_i$ 都为正，它们就会同向累积。在高维输入中，这个总变化可能很大；如果因此改变了类别分数的相对大小，就可能导致误分类。这也是作者思考的一个想法：Adversarial examples can be explained as a property of high-dimensional dot products. They are a result of models being too linear, rather than too nonlinear.

```python
model.eval()
x = x.detach().clone().requires_grad_(True)

# 计算原始图片的分类损失
logits = model(x)
loss = F.cross_entropy(logits, y)

# 求损失对像素的梯度
grad = torch.autograd.grad(loss, x)[0]

# 沿增加损失的方向修改像素
x_adv = (x + epsilon * grad.sign()).clamp(0, 1).detach()

# 检查预测是否被改变
with torch.no_grad():
    original_pred = logits.argmax(dim=1)
    attacked_pred = model(x_adv).argmax(dim=1)

    success = (original_pred == y) & (attacked_pred != y)
```

这样，我们就可以在损失小的情况下，找到最近的对抗样本。复现实验（Codex完成）：在V100上训练MNIST。我们很容易地生成一个对抗样本。这张图的读法是，越高的y轴softmax logit，模型就会把图片判别为哪张图片。可以看到，扰动幅度 $\epsilon$ 哪怕很小，比如等于1，也会从识别4（紫色线）到9（天蓝色线）
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/ed73c06b-46e2-4b48-b9f5-64410f48ac45.png)

> 值得注意的是，当$\epsilon$ 往负方向只变一点点时，正确的logit（“4”）提升了。这是因为输入图片沿损失下降的方向稍微移动了下，使得模型对这个对抗样本反而更理解了。但是，随着幅度变大，扰动幅度让模型又无法理解样本了。


**如何对抗对抗样本？** 我们知道，对抗样本是在输入改动足够小的条件下，让模型尽可能答错。
$$ \boxed{ \max_{\|\eta\|_\infty\leq\epsilon} J(\theta,x+\eta,y) } $$

一个直观的想法是，我们把“减少对抗样本分析错误”也merge到目标函数里。

If w has n dimensions and the average magnitude of an element of the weight vector is m, then the activation will grow by mn.

在实际的操作中，我们可以从模型的训练开始。
1. **找弱点**：用当前模型的梯度，生成容易让它出错的样本。
2. **补弱点**：把这些样本和原始样本一起训练，要求模型都给出正确标签。
3. **重新找弱点**：模型更新后，再生成新的对抗样本。

即优化之前模型的损失函数，同时优化可能答错的对抗样本的损失函数。

$$ \tilde J(\theta,x,y) = \underbrace{\alpha J(\theta,x,y)}_{\text{正常样本的损失}} + \underbrace{(1-\alpha) \max_{\|\eta\|_\infty\leq\epsilon} J(\theta,x+\eta,y)}_{\text{邻域中最坏样本的损失}}. $$

其中 $0\leq\alpha\leq1$是比例系数，控制两个目标的权重。

```python
input_grad = torch.autograd.grad(clean_loss, x, retain_graph=True)[0]

# FGSM：x_adv = x + ε sign(∇x J)
x_adv = (x + epsilon * input_grad.sign()).clamp(0, 1).detach()

loss = alpha * clean_loss + (1 - alpha) * F.cross_entropy(model(x_adv), y)
```

复现实验（Codex完成）
![image.png](https://haibinblog.s3.us-east-1.amazonaws.com/2026/fe1712d3-74f7-4ba4-8931-e803a8b42102.png)



OpenAI研究  Attacking machine learning with adversarial examples
https://openai.com/index/attacking-machine-learning-with-adversarial-examples/

教你如何在日常中拍出 Adversarial 的照片
https://arxiv.org/abs/1607.02533

在LLM里进行Adversarial攻击
Universal and Transferable Adversarial Attacks on Aligned Language Models
https://arxiv.org/abs/2307.15043
https://arxiv.org/abs/2306.13213

**问题：模型精度越低，产生对抗攻击样本的可能性/难度越大还是越小？** 思考这个问题，是因为从工程上，模型参数和微小扰动都是存储在FP32、BF16等精度下。如果从“只翻转X个bit”的角度讲，精度低的模型可能更容易产生样本；如果从“总的差值不变”的角度想，低精度里变化的位置更少，但是无法推导出因此就无法产生对抗攻击样本。不过论文也提到这样两句观察：“The direction of perturbation, rather than the specific point in space, matters most. Space is not full of pockets of adversarial examples that finely tile the reals like the rational numbers.”，“Because it is the direction that matters most, adversarial perturbations generalize across different clean examples.”。搜索了下以往的研究，感觉没有完全解答我的疑惑。

**问题：有没有一种方法，让模型变成正定的，不容易被攻击的？** 这方面研究已经做了很多，这篇文章也启示了很多后续这方面的研究。比如 https://arxiv.org/pdf/1906.06316  https://proceedings.mlr.press/v97/cohen19c.html https://arxiv.org/abs/1802.04034 还有一个类似问题，**是不是更高维的模型更容易被攻击？**，这跟模型有关。 https://arxiv.org/abs/1706.06083

**问题：论文中提到了RBF kernel，认为“RBF networks are resistant to adversarial examples.”，具体的情况？** 我不知道。
