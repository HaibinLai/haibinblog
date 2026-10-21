---
title: "Pytorch Intro: Everything you want to know"
description: "Pytorch 本质是和python完全不一样的东西。然后这东西本质是拿来训练模型的，其他的事情它干的一般般的。 学习链接 官方教程 Welcome to PyTorch Tutorials — PyTorch Tutorials 2.7.0+cu126 documentation Learning PyTorch with Examples — PyTorch Tutorials 2.7.0+cu126 documentation…"
publishedAt: "2025-06-11 05:09:54"
category: "Machine Learning"
tags: ["ML", "pytorch"]
draft: false
slug: "pytorch-intro-everything-you-want-to-know"
legacySlug: "pytorch-intro-everything-you-want-to-know"
wordpressId: 838
sourceUrl: "https://haibin-blog.vercel.app/index.php/pytorch-intro-everything-you-want-to-know/"
commentCount: 0
importedFromWordPress: true
---
<p>Pytorch 本质是和python完全不一样的东西。然后这东西本质是拿来训练模型的，其他的事情它干的一般般的。</p>
<h2>学习链接</h2>
<p>官方教程
<a href="https://docs.pytorch.org/tutorials/">Welcome to PyTorch Tutorials — PyTorch Tutorials 2.7.0+cu126 documentation</a>
<a href="https://docs.pytorch.org/tutorials/beginner/pytorch_with_examples.html">Learning PyTorch with Examples — PyTorch Tutorials 2.7.0+cu126 documentation</a>
他人的教程
<a href="https://zhuanlan.zhihu.com/p/413062581">【深度学习】60题PyTorch简易入门指南，做技术的弄潮儿 - 知乎</a></p>
<h2>数据集导入</h2>
<h3>MNIST</h3>
<pre><code class="language-python">import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets
from torchvision.transforms import ToTensor

# 导入
# Download training data from open datasets.
training_data = datasets.FashionMNIST(
    root=&quot;data&quot;,
    train=True,
    download=True,
    transform=ToTensor(),
)

# Download test data from open datasets.
test_data = datasets.FashionMNIST(
    root=&quot;data&quot;,
    train=False,
    download=True,
    transform=ToTensor(),
)

# Create data loaders.
train_dataloader = DataLoader(training_data, batch_size=batch_size)
test_dataloader = DataLoader(test_data, batch_size=batch_size)

for X, y in test_dataloader:
    print(f&quot;Shape of X [N, C, H, W]: {X.shape}&quot;)
    print(f&quot;Shape of y: {y.shape} {y.dtype}&quot;)
    break</code></pre>
<h3>CIFAR10</h3>
<pre><code class="language-python">trainset = torchvision.datasets.CIFAR10(root=&#039;../data&#039;, train=True, download=True, transform=transform_train)
trainloader = torch.utils.data.DataLoader(trainset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)

testset = torchvision.datasets.CIFAR10(root=&#039;../data&#039;, train=False, download=True, transform=transform_test)
testloader = torch.utils.data.DataLoader(testset, batch_size=100, shuffle=False, num_workers=2)</code></pre>
<h3>可视化+预处理</h3>
<p>其实我们大部分的工作都是在这个层面做，所以听起来很蠢。</p>
<p><a href="https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html">Datasets &amp; DataLoaders — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<pre><code class="language-python">import torch
from torch.utils.data import Dataset
from torchvision import datasets
from torchvision.transforms import ToTensor
import matplotlib.pyplot as plt

training_data = datasets.FashionMNIST(
    root=&quot;data&quot;,
    train=True,
    download=True,
    transform=ToTensor()
)

test_data = datasets.FashionMNIST(
    root=&quot;data&quot;,
    train=False,
    download=True,
    transform=ToTensor()
)

labels_map = {
    0: &quot;T-Shirt&quot;,
    1: &quot;Trouser&quot;,
    2: &quot;Pullover&quot;,
    3: &quot;Dress&quot;,
    4: &quot;Coat&quot;,
    5: &quot;Sandal&quot;,
    6: &quot;Shirt&quot;,
    7: &quot;Sneaker&quot;,
    8: &quot;Bag&quot;,
    9: &quot;Ankle Boot&quot;,
}
figure = plt.figure(figsize=(8, 8))
cols, rows = 3, 3
for i in range(1, cols * rows + 1):
    sample_idx = torch.randint(len(training_data), size=(1,)).item()
    img, label = training_data[sample_idx]
    figure.add_subplot(rows, cols, i)
    plt.title(labels_map[label])
    plt.axis(&quot;off&quot;)
    plt.imshow(img.squeeze(), cmap=&quot;gray&quot;)
plt.show()</code></pre>
<p>ToTensor<a href="https://docs.pytorch.org/tutorials/beginner/basics/transforms_tutorial.html#totensor">data</a></p>
<p><a href="https://pytorch.org/vision/stable/transforms.html#torchvision.transforms.ToTensor">ToTensor</a> converts a PIL image or NumPy <code>ndarray</code> into a <code>FloatTensor</code>. and scales the image’s pixel intensity values in the range<code>[0.,1.]</code></p>
<p><strong>Lambda Transforms</strong></p>
<p>Lambda transforms apply any user-defined lambda function. Here, we define a function to turn the integer into a one-hot encoded tensor. It first creates a zero tensor of size 10 (the number of labels in our dataset) and calls <a href="https://pytorch.org/docs/stable/generated/torch.Tensor.scatter_.html">scatter_</a> which assigns a <code>value=1</code> on the index as given by the label <code>y</code>.</p>
<pre><code class="language-python">target_transform = Lambda(lambda y: torch.zeros(
    10, dtype=torch.float).scatter_(dim=0, index=torch.tensor(y), value=1))</code></pre>
<h2>Tensorboard</h2>
<p><a href="https://docs.pytorch.org/tutorials/intermediate/tensorboard_tutorial.html">Visualizing Models, Data, and Training with TensorBoard — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<p>In the <a href="https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html">60 Minute Blitz</a>, we show you how to load in data, feed it through a model we define as a subclass of <code>nn.Module</code>, train this model on training data, and test it on test data. To see what’s happening, we print out some statistics as the model is training to get a sense for whether training is progressing. However, we can do much better than that: PyTorch integrates with TensorBoard, a tool designed for visualizing the results of neural network training runs. This tutorial illustrates some of its functionality, using the <a href="https://github.com/zalandoresearch/fashion-mnist">Fashion-MNIST dataset</a> which can be read into PyTorch using torchvision.datasets.</p>
<h2>Tensor 张量</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/blitz/tensor_tutorial.html">Tensors — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<pre><code class="language-python">from torch.utils.tensorboard import SummaryWriter

# default `log_dir` is &quot;runs&quot; - we&#039;ll be more specific here
writer = SummaryWriter(&#039;runs/fashion_mnist_experiment_1&#039;)

# get some random training images
dataiter = iter(trainloader)
images, labels = next(dataiter)

# create grid of images
img_grid = torchvision.utils.make_grid(images)

# show images
matplotlib_imshow(img_grid, one_channel=True)

# write to tensorboard
writer.add_image(&#039;four_fashion_mnist_images&#039;, img_grid)</code></pre>
<pre><code class="language-bash">tensorboard --logdir=runs</code></pre>
<p>Projector!</p>
<pre><code class="language-python"># helper function
def select_n_random(data, labels, n=100):
    &#039;&#039;&#039;
    Selects n random datapoints and their corresponding labels from a dataset
    &#039;&#039;&#039;
    assert len(data) == len(labels)

    perm = torch.randperm(len(data))
    return data[perm][:n], labels[perm][:n]

# select random images and their target indices
images, labels = select_n_random(trainset.data, trainset.targets)

# get the class labels for each image
class_labels = [classes[lab] for lab in labels]

# log embeddings
features = images.view(-1, 28 * 28)
writer.add_embedding(features,
                    metadata=class_labels,
                    label_img=images.unsqueeze(1))
writer.close()</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610153605156.png" alt="" /></p>
<h3>tracking</h3>
<pre><code class="language-python"># helper functions

def images_to_probs(net, images):
    &#039;&#039;&#039;
    Generates predictions and corresponding probabilities from a trained
    network and a list of images
    &#039;&#039;&#039;
    output = net(images)
    # convert output probabilities to predicted class
    _, preds_tensor = torch.max(output, 1)
    preds = np.squeeze(preds_tensor.numpy())
    return preds, [F.softmax(el, dim=0)[i].item() for i, el in zip(preds, output)]

def plot_classes_preds(net, images, labels):
    &#039;&#039;&#039;
    Generates matplotlib Figure using a trained network, along with images
    and labels from a batch, that shows the network&#039;s top prediction along
    with its probability, alongside the actual label, coloring this
    information based on whether the prediction was correct or not.
    Uses the &quot;images_to_probs&quot; function.
    &#039;&#039;&#039;
    preds, probs = images_to_probs(net, images)
    # plot the images in the batch, along with predicted and true labels
    fig = plt.figure(figsize=(12, 48))
    for idx in np.arange(4):
        ax = fig.add_subplot(1, 4, idx+1, xticks=[], yticks=[])
        matplotlib_imshow(images[idx], one_channel=True)
        ax.set_title(&quot;{0}, {1:.1f}%\n(label: {2})&quot;.format(
            classes[preds[idx]],
            probs[idx] * 100.0,
            classes[labels[idx]]),
                    color=(&quot;green&quot; if preds[idx]==labels[idx].item() else &quot;red&quot;))
    return fig

running_loss = 0.0
for epoch in range(1):  # loop over the dataset multiple times

    for i, data in enumerate(trainloader, 0):

        # get the inputs; data is a list of [inputs, labels]
        inputs, labels = data

        # zero the parameter gradients
        optimizer.zero_grad()

        # forward + backward + optimize
        outputs = net(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        if i % 1000 == 999:    # every 1000 mini-batches...

            # ...log the running loss
            writer.add_scalar(&#039;training loss&#039;,
                            running_loss / 1000,
                            epoch * len(trainloader) + i)

            # ...log a Matplotlib Figure showing the model&#039;s predictions on a
            # random mini-batch
            writer.add_figure(&#039;predictions vs. actuals&#039;,
                            plot_classes_preds(net, inputs, labels),
                            global_step=epoch * len(trainloader) + i)
            running_loss = 0.0
print(&#039;Finished Training&#039;)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610153622198.png" alt="" /></p>
<h3>学习张量</h3>
<p>Hello, Tensor!</p>
<pre><code class="language-python">import torch
import numpy as np

# 1. init from num
data = [[1, 2],[3, 4]]
x_data = torch.tensor(data)

# 2. init from numpy
np_array = np.array(data)
x_np = torch.from_numpy(np_array)

# 3. another tensor
x_ones = torch.ones_like(x_data) # retains the properties of x_data
print(f&quot;Ones Tensor: \n {x_ones} \n&quot;)

x_rand = torch.rand_like(x_data, dtype=torch.float) # overrides the datatype of x_data
print(f&quot;Random Tensor: \n {x_rand} \n&quot;)

# 4. Random
shape = (2,3,)
rand_tensor = torch.rand(shape)
ones_tensor = torch.ones(shape)
zeros_tensor = torch.zeros(shape)

print(f&quot;Random Tensor: \n {rand_tensor} \n&quot;)
print(f&quot;Ones Tensor: \n {ones_tensor} \n&quot;)
print(f&quot;Zeros Tensor: \n {zeros_tensor}&quot;)</code></pre>
<h3>Tensor 的内部var</h3>
<p>形状等</p>
<pre><code class="language-python">tensor = torch.rand(3,4)

print(f&quot;Shape of tensor: {tensor.shape}&quot;)
print(f&quot;Datatype of tensor: {tensor.dtype}&quot;)
print(f&quot;Device tensor is stored on: {tensor.device}&quot;)</code></pre>
<p>有1200个算子供君选择：<a href="https://docs.pytorch.org/docs/stable/torch.html">torch — PyTorch 2.7 documentation</a>
Over 1200 tensor operations, including arithmetic, linear algebra, matrix manipulation (transposing, indexing, slicing), sampling and more are comprehensively described <a href="https://pytorch.org/docs/stable/torch.html">here</a>.</p>
<p>合并张量：</p>
<pre><code class="language-python">t1 = torch.cat([tensor, tensor, tensor], dim=1)
print(t1)</code></pre>
<h3>计算</h3>
<pre><code class="language-python"># This computes the matrix multiplication between two tensors. y1, y2, y3 will have the same value
# ``tensor.T`` returns the transpose of a tensor
y1 = tensor @ tensor.T
y2 = tensor.matmul(tensor.T)

y3 = torch.rand_like(y1)
torch.matmul(tensor, tensor.T, out=y3)

# This computes the element-wise product. z1, z2, z3 will have the same value
z1 = tensor * tensor
z2 = tensor.mul(tensor)

z3 = torch.rand_like(tensor)
torch.mul(tensor, tensor, out=z3)</code></pre>
<p><strong>Single-element tensors</strong> If you have a one-element tensor, for example by aggregating all values of a tensor into one value, you can convert it to a Python numerical value using <code>item()</code>:</p>
<pre><code class="language-python">agg = tensor.sum()
agg_item = agg.item()
print(agg_item, type(agg_item))</code></pre>
<p><strong>In-place operations</strong> Operations that store the result into the operand are called in-place. They are denoted by a <code>_</code> suffix. For example: <code>x.copy_(y)</code>, <code>x.t_()</code>, will change <code>x</code>.</p>
<pre><code class="language-python">print(f&quot;{tensor} \n&quot;)
tensor.add_(5)
print(tensor)</code></pre>
<pre><code class="language-txt">tensor([[1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.],
        [1., 0., 1., 1.]])

tensor([[6., 5., 6., 6.],
        [6., 5., 6., 6.],
        [6., 5., 6., 6.],
        [6., 5., 6., 6.]])</code></pre>
<p>Tensors on the CPU and NumPy arrays can share their underlying memory locations, and changing one will change the other</p>
<p><strong>back to numpy</strong></p>
<pre><code class="language-python">t = torch.ones(5)
print(f&quot;t: {t}&quot;)
n = t.numpy()
print(f&quot;n: {n}&quot;)</code></pre>
<pre><code class="language-txt">t: tensor([1., 1., 1., 1., 1.])
n: [1. 1. 1. 1. 1.]</code></pre>
<pre><code class="language-python">t.add_(1)
print(f&quot;t: {t}&quot;)
print(f&quot;n: {n}&quot;)</code></pre>
<pre><code class="language-txt">t: tensor([2., 2., 2., 2., 2.])
n: [2. 2. 2. 2. 2.]</code></pre>
<p>array to tensor</p>
<pre><code class="language-python">n = np.ones(5)
t = torch.from_numpy(n)

np.add(n, 1, out=n)
print(f&quot;t: {t}&quot;)
print(f&quot;n: {n}&quot;)</code></pre>
<pre><code class="language-txt">t: tensor([2., 2., 2., 2., 2.], dtype=torch.float64)
n: [2. 2. 2. 2. 2.]</code></pre>
<h2>神经网络层</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html">Build the Neural Network — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<p>NLP models &amp; layers
<a href="https://docs.pytorch.org/tutorials/intermediate/nlp_from_scratch_index.html">NLP from Scratch — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<pre><code class="language-python">import os
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else &quot;cpu&quot;
print(f&quot;Using {device} device&quot;)</code></pre>
<p>Define the class:</p>
<pre><code class="language-python">class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(28*28, 512),
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU(),
            nn.Linear(512, 10),
        )

    def forward(self, x):
        x = self.flatten(x)
        logits = self.linear_relu_stack(x)
        return logits</code></pre>
<pre><code class="language-python">model = NeuralNetwork().to(device)
print(model)</code></pre>
<pre><code class="language-txt">NeuralNetwork(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (linear_relu_stack): Sequential(
    (0): Linear(in_features=784, out_features=512, bias=True)
    (1): ReLU()
    (2): Linear(in_features=512, out_features=512, bias=True)
    (3): ReLU()
    (4): Linear(in_features=512, out_features=10, bias=True)
  )
)</code></pre>
<pre><code class="language-python">X = torch.rand(1, 28, 28, device=device)
logits = model(X)
pred_probab = nn.Softmax(dim=1)(logits)
y_pred = pred_probab.argmax(1)
print(f&quot;Predicted class: {y_pred}&quot;)</code></pre>
<h4>nn.Flatten</h4>
<p>We initialize the <a href="https://pytorch.org/docs/stable/generated/torch.nn.Flatten.html">nn.Flatten</a> layer to convert each 2D 28x28 image into a contiguous array of 784 pixel values ( the minibatch dimension (at dim=0) is maintained).</p>
<pre><code class="language-python">flatten = nn.Flatten()
flat_image = flatten(input_image)
print(flat_image.size())</code></pre>
<h4>nn.Linear</h4>
<p>The <a href="https://pytorch.org/docs/stable/generated/torch.nn.Linear.html">linear layer</a> is a module that applies a linear transformation on the input using its stored weights and biases.</p>
<pre><code class="language-python">layer1 = nn.Linear(in_features=28*28, out_features=20)
hidden1 = layer1(flat_image)
print(hidden1.size())</code></pre>
<h4>nn.ReLU</h4>
<p>Non-linear activations are what create the complex mappings between the model’s inputs and outputs. They are applied after linear transformations to introduce <em>nonlinearity</em>, helping neural networks learn a wide variety of phenomena.
In this model, we use <a href="https://pytorch.org/docs/stable/generated/torch.nn.ReLU.html">nn.ReLU</a> between our linear layers, but there’s other activations to introduce non-linearity in your model.</p>
<pre><code class="language-python">print(f&quot;Before ReLU: {hidden1}\n\n&quot;)
hidden1 = nn.ReLU()(hidden1)
print(f&quot;After ReLU: {hidden1}&quot;)</code></pre>
<h4>nn.Sequential</h4>
<p><a href="https://pytorch.org/docs/stable/generated/torch.nn.Sequential.html">nn.Sequential</a> is an ordered container of modules. The data is passed through all the modules in the same order as defined. You can use sequential containers to put together a quick network like <code>seq_modules</code>.</p>
<pre><code class="language-python">seq_modules = nn.Sequential(
    flatten,
    layer1,
    nn.ReLU(),
    nn.Linear(20, 10)
)
input_image = torch.rand(3,28,28)
logits = seq_modules(input_image)</code></pre>
<h4>nn.Softmax</h4>
<p>The last linear layer of the neural network returns logits - raw values in<code>[-infty, infty]</code> - which are passed to the <a href="https://pytorch.org/docs/stable/generated/torch.nn.Softmax.html">nn.Softmax</a> module. The logits are scaled to values [0, 1] representing the model’s predicted probabilities for each class. <code>dim</code> parameter indicates the dimension along which the values must sum to 1.</p>
<pre><code class="language-python">softmax = nn.Softmax(dim=1)
pred_probab = softmax(logits)</code></pre>
<h4>Model Params</h4>
<p>Many layers inside a neural network are <em>parameterized</em>, i.e. have associated weights and biases that are optimized during training. Subclassing <code>nn.Module</code> automatically tracks all fields defined inside your model object, and makes all parameters accessible using your model’s <code>parameters()</code> or <code>named_parameters()</code> methods.</p>
<p>In this example, we iterate over each parameter, and print its size and a preview of its values.</p>
<pre><code class="language-python">print(f&quot;Model structure: {model}\n\n&quot;)

for name, param in model.named_parameters():
    print(f&quot;Layer: {name} | Size: {param.size()} | Values : {param[:2]} \n&quot;)</code></pre>
<pre><code class="language-txt">Model structure: NeuralNetwork(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (linear_relu_stack): Sequential(
    (0): Linear(in_features=784, out_features=512, bias=True)
    (1): ReLU()
    (2): Linear(in_features=512, out_features=512, bias=True)
    (3): ReLU()
    (4): Linear(in_features=512, out_features=10, bias=True)
  )
)

Layer: linear_relu_stack.0.weight | Size: torch.Size([512, 784]) | Values : tensor([[ 0.0234,  0.0034, -0.0202,  ..., -0.0088, -0.0105,  0.0194],
        [-0.0330,  0.0198,  0.0253,  ..., -0.0193,  0.0315,  0.0338]],
       device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)

Layer: linear_relu_stack.0.bias | Size: torch.Size([512]) | Values : tensor([-0.0254,  0.0035], device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)

Layer: linear_relu_stack.2.weight | Size: torch.Size([512, 512]) | Values : tensor([[-0.0382, -0.0342, -0.0422,  ...,  0.0037,  0.0401, -0.0393],
        [ 0.0317, -0.0257, -0.0345,  ..., -0.0333, -0.0069,  0.0142]],
       device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)

Layer: linear_relu_stack.2.bias | Size: torch.Size([512]) | Values : tensor([-0.0265, -0.0096], device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)

Layer: linear_relu_stack.4.weight | Size: torch.Size([10, 512]) | Values : tensor([[ 0.0208,  0.0163,  0.0114,  ...,  0.0172,  0.0008,  0.0140],
        [-0.0098, -0.0260, -0.0226,  ...,  0.0136,  0.0085,  0.0082]],
       device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)

Layer: linear_relu_stack.4.bias | Size: torch.Size([10]) | Values : tensor([ 0.0129, -0.0352], device=&#039;cuda:0&#039;, grad_fn=&lt;SliceBackward0&gt;)</code></pre>
<p><a href="https://docs.pytorch.org/docs/stable/nn.html">torch.nn — PyTorch 2.7 documentation</a></p>
<h2>模型 Models</h2>
<p> we create a class that inherits from <a href="https://pytorch.org/docs/stable/generated/torch.nn.Module.html">nn.Module</a>. We define the layers of the network in the <code>__init__</code> function and specify how data will pass through the network in the <code>forward</code> function. To accelerate operations in the neural network, we move it to the <a href="https://pytorch.org/docs/stable/torch.html#accelerators">accelerator</a> such as CUDA, MPS, MTIA, or XPU. If the current accelerator is available, we will use it. Otherwise, we use the CPU.
 </p>
<pre><code class="language-python">device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else &quot;cpu&quot;
print(f&quot;Using {device} device&quot;)

# Define model
class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(28*28, 512),
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU(),
            nn.Linear(512, 10)
        )

    def forward(self, x):
        x = self.flatten(x)
        logits = self.linear_relu_stack(x)
        return logits

model = NeuralNetwork().to(device)  # init model and put it into device
print(model)</code></pre>
<p>输出：</p>
<pre><code class="language-txt">Using cuda device
NeuralNetwork(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (linear_relu_stack): Sequential(
    (0): Linear(in_features=784, out_features=512, bias=True)
    (1): ReLU()
    (2): Linear(in_features=512, out_features=512, bias=True)
    (3): ReLU()
    (4): Linear(in_features=512, out_features=10, bias=True)
  )
)</code></pre>
<h3>1. LeNet</h3>
<pre><code class="language-python">import torch
import torch.nn as nn

class LeNet(nn.Module):
    def __init__(self):
        super(LeNet, self).__init__()
        self.conv_stack = nn.Sequential(
            nn.Conv2d(1, 6, kernel_size=5, stride=1, padding=2),  # 1x32x32 -&gt; 6x28x28
            nn.ReLU(),
            nn.AvgPool2d(kernel_size=2, stride=2),  # 6x28x28 -&gt; 6x14x14
            nn.Conv2d(6, 16, kernel_size=5, stride=1),  # 6x14x14 -&gt; 16x10x10
            nn.ReLU(),
            nn.AvgPool2d(kernel_size=2, stride=2),  # 16x10x10 -&gt; 16x5x5
        )
        self.fc_stack = nn.Sequential(
            nn.Flatten(),
            nn.Linear(16 * 5 * 5, 120),  # 16x5x5 = 400 -&gt; 120
            nn.ReLU(),
            nn.Linear(120, 84),
            nn.ReLU(),
            nn.Linear(84, 10),  # 10 classes
        )

    def forward(self, x):
        x = self.conv_stack(x)
        logits = self.fc_stack(x)
        return logits

# Example usage
device = torch.device(&quot;cuda&quot; if torch.cuda.is_available() else &quot;cpu&quot;)
model = LeNet().to(device)
print(model)</code></pre>
<pre><code class="language-python">import torch
import torch.nn as nn
import torch.nn.functional as F

class Net(nn.Module):

    def __init__(self):  # 这里要放有参数的层
        super(Net, self).__init__()
        # 1 input image channel, 6 output channels, 5x5 square convolution
        # kernel
        self.conv1 = nn.Conv2d(1, 6, 5)
        self.conv2 = nn.Conv2d(6, 16, 5)
        # an affine operation: y = Wx + b
        self.fc1 = nn.Linear(16 * 5 * 5, 120)  # 5*5 from image dimension
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, input):  # 这里要放对参数操作的层
        # Convolution layer C1: 1 input image channel, 6 output channels,
        # 5x5 square convolution, it uses RELU activation function, and
        # outputs a Tensor with size (N, 6, 28, 28), where N is the size of the batch
        c1 = F.relu(self.conv1(input))
        # Subsampling layer S2: 2x2 grid, purely functional,
        # this layer does not have any parameter, and outputs a (N, 6, 14, 14) Tensor
        s2 = F.max_pool2d(c1, (2, 2))
        # Convolution layer C3: 6 input channels, 16 output channels,
        # 5x5 square convolution, it uses RELU activation function, and
        # outputs a (N, 16, 10, 10) Tensor
        c3 = F.relu(self.conv2(s2))
        # Subsampling layer S4: 2x2 grid, purely functional,
        # this layer does not have any parameter, and outputs a (N, 16, 5, 5) Tensor
        s4 = F.max_pool2d(c3, 2)
        # Flatten operation: purely functional, outputs a (N, 400) Tensor
        s4 = torch.flatten(s4, 1)
        # Fully connected layer F5: (N, 400) Tensor input,
        # and outputs a (N, 120) Tensor, it uses RELU activation function
        f5 = F.relu(self.fc1(s4))
        # Fully connected layer F6: (N, 120) Tensor input,
        # and outputs a (N, 84) Tensor, it uses RELU activation function
        f6 = F.relu(self.fc2(f5))
        # Gaussian layer OUTPUT: (N, 84) Tensor input, and
        # outputs a (N, 10) Tensor
        output = self.fc3(f6)
        return output

net = Net()
print(net)</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610152512019.png" alt="" /></p>
<h3>Transformer</h3>
<pre><code class="language-python">import torch
import torch.nn as nn

class TransformerClassifier(nn.Module):
    def __init__(self, vocab_size, d_model=512, nhead=8, num_layers=2, num_classes=2):
        super(TransformerClassifier, self).__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoder = nn.Parameter(torch.randn(1, 100, d_model))  # Max seq len = 100
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.fc = nn.Linear(d_model, num_classes)

    def forward(self, x):
        # x: [batch_size, seq_len] (token indices)
        x = self.embedding(x) + self.pos_encoder[:, :x.size(1), :]  # Add positional encoding
        x = self.transformer_encoder(x)  # [batch_size, seq_len, d_model]
        x = x.mean(dim=1)  # Pool over sequence length
        logits = self.fc(x)  # [batch_size, num_classes]
        return logits

# Example usage
device = torch.device(&quot;cuda&quot; if torch.cuda.is_available() else &quot;cpu&quot;)
model = TransformerClassifier(vocab_size=10000).to(device)
print(model)</code></pre>
<h3>AlexNet</h3>
<pre><code class="language-python">import torch
import torch.nn as nn

class AlexNet(nn.Module):
    def __init__(self, num_classes=1000):
        super(AlexNet, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=11, stride=4, padding=2),  # 3x224x224 -&gt; 64x55x55
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2),  # 64x55x55 -&gt; 64x27x27
            nn.Conv2d(64, 192, kernel_size=5, padding=2),  # 64x27x27 -&gt; 192x27x27
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2),  # 192x27x27 -&gt; 192x13x13
            nn.Conv2d(192, 384, kernel_size=3, padding=1),  # 192x13x13 -&gt; 384x13x13
            nn.ReLU(inplace=True),
            nn.Conv2d(384, 256, kernel_size=3, padding=1),  # 384x13x13 -&gt; 256x13x13
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, kernel_size=3, padding=1),  # 256x13x13 -&gt; 256x13x13
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2),  # 256x13x13 -&gt; 256x6x6
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(p=0.5),
            nn.Linear(256 * 6 * 6, 4096),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.5),
            nn.Linear(4096, 4096),
            nn.ReLU(inplace=True),
            nn.Linear(4096, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# Example usage
device = torch.device(&quot;cuda&quot; if torch.cuda.is_available() else &quot;cpu&quot;)
model = AlexNet(num_classes=1000).to(device)
print(model)</code></pre>
<h3>ResNet18</h3>
<p>ResNet18之所以叫“18”，是因为它的网络架构包含18个带权重的层（即卷积层和全连接层）。</p>
<pre><code class="language-python">import torch
import torch.nn as nn
import torch.nn.functionl as F

#定义残差块ResBlock
class ResBlock(nn.Module):
    def __init__(self, inchannel, outchannel, stride=1):
        super(ResBlock, self).__init__()
        #这里定义了残差块内连续的2个卷积层
        self.left = nn.Sequential(
            nn.Conv2d(inchannel, outchannel, kernel_size=3, stride=stride, padding=1, bias=False),
            nn.BatchNorm2d(outchannel),
            nn.ReLU(inplace=True),
            nn.Conv2d(outchannel, outchannel, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(outchannel)
        )
        self.shortcut = nn.Sequential()
        if stride != 1 or inchannel != outchannel:
            #shortcut，这里为了跟2个卷积层的结果结构一致，要做处理
            self.shortcut = nn.Sequential(
                nn.Conv2d(inchannel, outchannel, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(outchannel)
            )

    def forward(self, x):
        out = self.left(x)
        #将2个卷积层的输出跟处理过的x相加，实现ResNet的基本结构
        out = out + self.shortcut(x)
        out = F.relu(out)

        return out

class ResNet(nn.Module):
    def __init__(self, ResBlock, num_classes=10):
        super(ResNet, self).__init__()
        self.inchannel = 64
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )
        self.layer1 = self.make_layer(ResBlock, 64, 2, stride=1)
        self.layer2 = self.make_layer(ResBlock, 128, 2, stride=2)
        self.layer3 = self.make_layer(ResBlock, 256, 2, stride=2)
        self.layer4 = self.make_layer(ResBlock, 512, 2, stride=2)
        self.fc = nn.Linear(512, num_classes)
    #这个函数主要是用来，重复同一个残差块
    def make_layer(self, block, channels, num_blocks, stride):
        strides = [stride] + [1] * (num_blocks - 1)
        layers = []
        for stride in strides:
            layers.append(block(self.inchannel, channels, stride))
            self.inchannel = channels
        return nn.Sequential(*layers)

    def forward(self, x):
        #在这里，整个ResNet18的结构就很清晰了
        out = self.conv1(x)
        out = self.layer1(out)
        out = self.layer2(out)
        out = self.layer3(out)
        out = self.layer4(out)
        out = F.avg_pool2d(out, 4)
        out = out.view(out.size(0), -1)
        out = self.fc(out)
        return out</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610143704831.png" alt="" /></p>
<h3>UNet</h3>
<pre><code class="language-python">import ddpm
from PIL import Image
from torchvision import transforms
import torch
from torch import nn
import matplotlib.pyplot as plt
import numpy as np

image = Image.open(&quot;giraffe.jpg&quot;)

image_size = 128
transform = transforms.Compose([
    transforms.Resize(image_size),
    transforms.CenterCrop(image_size),
    transforms.PILToTensor(),
    transforms.ConvertImageDtype(torch.float),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
])

x_start = transform(image).unsqueeze(0)

diffusion_linear = ddpm.Diffusion(noise_steps=500)
diffusion_cosine = ddpm.Diffusion(noise_steps=500,beta_schedule=&#039;cosine&#039;)

plt.figure(figsize=(16, 8))
for idx, t in enumerate([0, 50, 100, 200, 499]):
    x_noisy,_ = diffusion_linear.q_sample(x_start, t=torch.tensor([t])) # 使用q_sample去生成x_t
    x_noisy2,_ = diffusion_cosine.q_sample(x_start,t=torch.tensor([t])) # [1,3,128,128]
    noisy_image = (x_noisy.squeeze().permute(1, 2, 0) + 1) * 127.5  # 我们的x_t被裁剪到（-1，1）,所以+1后乘以127.5
    noisy_img2 = (x_noisy2.squeeze().permute(1,2,0)+1)*127.5 # # [128,128,3] -&gt; (0,2)
    noisy_image = noisy_image.numpy().astype(np.uint8)
    noisy_img2 = noisy_img2.numpy().astype(np.uint8)
    plt.subplot(2, 5, 1 + idx)
    plt.imshow(noisy_image)
    plt.axis(&quot;off&quot;)
    plt.title(f&quot;t={t}&quot;)
    plt.subplot(2, 5, 6+idx)
    plt.imshow(noisy_img2)
    plt.axis(&#039;off&#039;)
plt.figtext(0.5, 0.95, &#039;Linear Beta Schedule&#039;, ha=&#039;center&#039;, fontsize=16)  # 在第一行上方添加大标题
plt.figtext(0.5, 0.48, &#039;Cosine Beta Schedule&#039;, ha=&#039;center&#039;, fontsize=16)  # 在第二行上方添加大标题
plt.savefig(&#039;temp_img/add_noise_process.png&#039;)

class SelfAttention(nn.Module):
    def __init__(self,channels):
        super().__init__()
        self.channels = channels
        self.mha = nn.MultiheadAttention(channels, 4, batch_first=True)
        self.ln = nn.LayerNorm([channels])
        self.ff = nn.Sequential(
            nn.LayerNorm([channels]),
            nn.Linear(channels,channels),
            nn.GELU(),
            nn.Linear(channels,channels)
            )

    def forward(self,x):
        B,C,H,W = x.shape
        x = x.reshape(-1,self.channels,H*W).swapaxes(1,2)
        x_ln = self.ln(x)
        attention_value = self.mha(x_ln)
        attention_value = attention_value + x
        attention_value = self.ff(attention_value)+ attention_value
        return attention_value.swapaxes(1,2).view(-1,self.channels,H,W)

class DoubleConv(nn.Module):
    def __init__(self,in_c,out_c,mid_c=None,residual=False):
        super().__init__()
        self.residual = residual
        if mid_c is None:
            mid_c = out_c
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_c,mid_c,kernel_size=3,padding=1),
            nn.GroupNorm(1,mid_c),
            nn.GELU(),
            nn.Conv2d(mid_c,out_c,kernel_size=3,padding=1),
            nn.GroupNorm(1,mid_c)
            )
        if in_c != out_c:
            self.shortcut = nn.Conv2d(in_c,out_c,kernel_size=1)
        else:
            self.shortcut = nn.Identity()

    def forward(self,x):
        if self.residual:
            return F.gelu(self.shortcut(x)+self.double_conv(x))
        else:
            return F.gelu(self.double_conv(x))

class Down(nn.Module):
    def __init__(self,in_c,out_c,emb_dim=256):
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2) # kernel_size=2, stride default equal to k
            DoubleConv(in_c,out_c,residual=True),
            DoubleConv(out_c,out_c)
            )
        self.emb_layer = nn.Sequential(
            nn.SiLU(),
            nn.Linear(emb_dim,out_c)
            )

    def forward(self,x,t):
        x = self.maxpool_conv(x)
        emb = self.emb_layer(t)[:,:,None,None].repeat(1,1,x.shape[-2],x.shape[-1])
        # 扩维后，在最后两维重复h和w次，此时和x的尺寸相同
        return x+emb

class Up(nn.Module):
    def __init__(self,in_c,out_c,emb_dim=256):
        self.up =  nn.UpSample(scale_factor=2,mode=&#039;bilinear&#039;, align_corner=True)
        self.conv = nn.Sequential(
            nn.Conv2d(in_c,in_c,residual=True),
            nn.Conv2d(in_c,out_c)
            )
        self.emb_layer = nn.Sequential(
            nn.SiLU(),
            nn.Linear(emb_dim,out_c)
            )

    def forward(self,x,skip_x, t):
        x = self.up(x)
        x = torch.cat([x,skip_x],dim=1)
        x = self.conv(x)
        emb = self.emb_layer(t)[:,:,None,None].repeat(1,1,x.shape[-2],x.shape[-1])
        return x + emb

class UNet(nn.Module):
    def __init__(self,in_c, out_c, time_dim=256, device=&#039;cuda&#039;):
        super().__init__()
        self.device = device
        self.time_dim = time_dim
        self.inc = DoubleConv(c_in, 64)
        self.down1 = Down(64, 128)
        self.sa1 = SelfAttention(128)
        self.down2 = Down(128, 256)
        self.sa2 = SelfAttention(256)
        self.down3 = Down(256, 512)
        self.sa3 = SelfAttention(512)

        self.bot1 = DoubleConv(512, 512)
        self.bot2 = DoubleConv(512, 512)
        self.bot3 = DoubleConv(512, 256)

        self.up1 = Up(512, 128)
        self.sa4 = SelfAttention(128)
        self.up2 = Up(256, 64)
        self.sa5 = SelfAttention(64)
        self.up3 = Up(128, 64)
        self.sa6 = SelfAttention(64)
        self.outc = nn.Conv2d(64, c_out, kernel_size=1)

    def pos_encoding(self,t,channels):
        freq = 1.0/(10000**torch.arange(0,channels,2,device=self.device).float()/channels)
        args = t[:,None].float()*freq[None]
        embedding = torch.cat([torch.sin(args), torch.cos(args)],dim=-1)
        if channels % 2 != 0:
            embedding = torch.cat([embedding,torch.zeros_like(embedding[:,:1])],dim=-1)
        return embeddig

    def forward(self,x,t):
        t = self.pos_encoding(t,self.time_dim)
        x1 = self.inc(x)
        x2 = self.down1(x1, t)
        x2 = self.sa1(x2)
        x3 = self.down2(x2, t)
        x3 = self.sa2(x3)
        x4 = self.down3(x3, t)
        x4 = self.sa3(x4)

        x4 = self.bot1(x4)
        x4 = self.bot2(x4)
        x4 = self.bot3(x4)

        x = self.up1(x4, x3, t)
        x = self.sa4(x)
        x = self.up2(x, x2, t)
        x = self.sa5(x)
        x = self.up3(x, x1, t)
        x = self.sa6(x)
        output = self.outc(x)
        return output

    def linear_beta_schedule(self):
        scale = 1000/self.noise_steps
        beta_start = self.beta_start*scale
        beta_end = self.beta_end*scale
        return torch.linspace(beta_start, beta_end, self.noise_steps)

    def cosine_beta_schedule(self,s=0.008):
        &quot;&quot;&quot;
        as proposed in Improved ddpm paper;
        &quot;&quot;&quot;
        steps = self.noise_steps + 1
        x = torch.linspace(0, self.noise_steps, steps, dtype=torch.float64) # 从0到self.noise_steps
        alphas_cumprod = torch.cos(((x / self.noise_steps) + s) / (1 + s) * math.pi * 0.5) ** 2
        alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
        betas = 1 - (alphas_cumprod[1:] / alphas_cumprod[:-1]) # alpha_cumprod包含了noise_steps+1个值，则alpha_t是第一个到最后一个；alpha_{t-1}是第0个到倒数第二个（第0个为0）
        return torch.clip(betas, 0, 0.999) # 不大于0.999

class Diffusion:
    def __init__(self, noise_steps=1000, beta_start=1e-4, beta_end=0.02, img_size=256, beta_schedule=&#039;linear&#039;,device=&quot;cuda&quot;):
        self.noise_steps = noise_steps
        self.beta_start = beta_start
        self.beta_end = beta_end
        self.img_size = img_size
        self.device = device
        if beta_schedule == &#039;linear&#039;:
            self.beta = self.linear_beta_schedule().to(device)
        elif beta_schedule == &#039;cosine&#039;:
            self.beta = self.cosine_beta_schedule().to(device)
        else:
            raise ValueError(f&#039;Unknown beta schedule {beta_schedule}&#039;)

        # all parameters
        self.alpha = 1. - self.beta
        self.alpha_hat = torch.cumprod(self.alpha, dim=0)
        self.alpha_hat_prev = F.pad(self.alpha_hat[:-1],(1,0),value=1.)
        self.sqrt_alpha_hat = torch.sqrt(self.alpha_hat)
        self.sqrt_one_minus_alpha_hat = torch.sqrt(1.-self.alpha_hat)
        self.sqrt_recip_alpha_hat = torch.sqrt(1./self.alpha_hat) # 用于估计x_0，估计x_0后用于计算p(x_{t-1}|x_t) 均值
        self.sqrt_recip_minus_alpha_hat = torch.sqrt(1./self.alpha_hat-1)
        self.posterior_variance = (self.beta*(1.-self.alpha_hat_prev)/(1.-self.alpha_hat)) # 用于计算p(x_{t-1}|x_t)的方差
        self.posterior_mean_coef1 = (self.beta * torch.sqrt(self.alpha_hat_prev) / (1.0 - self.alphas_hat)) # 用于计算p(x_{t-1}|x_t)的均值
        self.posterior_mean_coef2 = ((1.0 - self.alphas_hat_prev)* torch.sqrt(self.alphas)/ (1.0 - self.alphas_hat))

    def _extract(self,arr,t,x_shape):
        # 根据timestep t从arr中提取对应元素并变形为x_shape
        bs = x_shape[0]
        out = arr.to(t.device).gather(0,t).float()
        out = out.reshape(bs,*((1,)*(len(x_shape)-1))) # reshape为(bs,1,1,1)
        return out

    def q_sample(self, x, t, noise=None):
        # q(x_t|x_0)
        if noise is None:
            Ɛ = torch.randn_like(x)
        sqrt_alpha_hat = self._extract(self.sqrt_alpha_hat,t,x.shape)
        sqrt_one_minus_alpha_hat = self._extract(self.sqrt_one_minus_alpha_hat,t,x.shape)
        return sqrt_alpha_hat * x + sqrt_one_minus_alpha_hat * Ɛ, Ɛ

    def q_posterior_mean_variance(self,x,x_t,t):
        # calculate mean and variance of q(x_{t-1}|x_t,x_0), we send parameters x0 and x_t into this function
        # in fact we use this function to predict p(x_{t-1}|x_t)&#039;s mean and variance by sending x_t, \hat x_0, t
        posterior_mean =  (
            self._extract(self.posterior_mean_coef1,t,x.shape) * x
            + self._extract(self.posterior_mean_coef2,t,x.shape) * x_t
        )
        posterior_variance = (self.posterior_variance,t,x.shape)
        return posterior_mean, posterior_variance

    def estimate_x0_from_noise(self,x_t,t,noise):
        # \hat x_0
        return (self._extract(self.sqrt_recip_alpha_hat,t,x_t.shape)*x_t + self._extract(self.sqrt_recip_minus_alpha_hat,t,x_t.shape)*noise)

    def p_mean_variance(self,model,x_t,t,clip_denoised=True):
        pred_noise = model(x_t,t)
        x_recon = self.estimate_x0_from_noise(x_t,t,pred_noise)
        if clip_denoised:
            x_recon = torch.clamp(x_recon,min=-1.,max=1.)
        p_mean,p_var = self.q_posterior_mean_variance(x_recon,x_t,t)
        return p_mean,p_var

    def p_sample(self, model, x_t, t, clip_denoised=True):
        logging.info(f&quot;Sampling {n} new images....&quot;)
        model.eval()
        with torch.no_grad():
            p_mean,p_var = self.p_mean_variance(model,x_t,t,clip_denoised=clip_denoised)
            noise = torch.randn_like(x_t)
            nonzero_mask = ((t!=0).float().view(-1,*([1]*len(x_t.shape)-1))) # 当t!=0时为1，否则为0
            pred_img = p_mean + nonzero_mask*(torch.sqrt(p_var))*noise
        return pred_img

    def p_sample_loop(self,model,shape):
        model.eval()
        with torch.no_grad():
            bs = shape[0]
            device = next(model.parameters()).to(device)
            img = torch.randn(shape,device=device)
            imgs = []
            for i in tqdm(reversed(range(0,self.noise_steps)),desc=&#039;sampling loop time step&#039;,total=self.noise_steps):
                img = self.p_sample(model,img,torch.full((bs,),i,device=device,dtype=torch.long)) # 从T到0
                imgs.append(img)
        return imgs

    @torch.no_grad()
    def sample(self,model,img_size,bs=8,channels=3):
        return self.p_sample_loop(model,(bs,channels,img_size,img_size))

def train(args):
    setup_logging(args.run_name)
    device = args.device
    dataloader = get_data(args)
    model = UNet().to(device)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr)
    mse = nn.MSELoss()
    diffusion = Diffusion(img_size=args.image_size, device=device)
    logger = SummaryWriter(os.path.join(&quot;runs&quot;, args.run_name))
    l = len(dataloader)

    for epoch in range(args.epochs):
        logging.info(f&quot;Starting epoch {epoch}:&quot;)
        pbar = tqdm(dataloader)
        for i, (images, _) in enumerate(pbar):
            images = images.to(device)
            t = diffusion.sample_timesteps(images.shape[0]).to(device)
            x_t, noise = diffusion.q_sample(images, t)
            predicted_noise = model(x_t, t)
            loss = mse(noise, predicted_noise)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            pbar.set_postfix(MSE=loss.item())
            logger.add_scalar(&quot;MSE&quot;, loss.item(), global_step=epoch * l + i)

        sampled_images = diffusion.sample(model, n=images.shape[0])
        save_images(sampled_images, os.path.join(&quot;results&quot;, args.run_name, f&quot;{epoch}.jpg&quot;))
        torch.save(model.state_dict(), os.path.join(&quot;models&quot;, args.run_name, f&quot;ckpt.pt&quot;))

def launch():
    import argparse
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    args.run_name = &quot;DDPM_Uncondtional&quot;
    args.epochs = 500
    args.batch_size = 12
    args.image_size = 64
    args.dataset_path = r&quot;C:\Users\dome\datasets\landscape_img_folder&quot;
    args.device = &quot;cuda&quot;
    args.lr = 3e-4
    train(args)

if __name__ == &#039;__main__&#039;:
    launch()</code></pre>
<p><a href="https://github.com/HaibinLai/Bike-sharing-or-Uber/tree/9afceaf7e1acf6acc23e82ea5d73877448548878">HaibinLai/Bike-sharing-or-Uber at 9afceaf7e1acf6acc23e82ea5d73877448548878</a></p>
<h3>RNN</h3>
<pre><code class="language-python">import torch
import torch.nn as nn
import random
from logging import getLogger
from libcity.model import loss
from libcity.model.abstract_traffic_state_model import AbstractTrafficStateModel

class RNN(AbstractTrafficStateModel):
    def __init__(self, config, data_feature):
        super().__init__(config, data_feature)
        self._scaler = self.data_feature.get(&#039;scaler&#039;)
        self.num_nodes = self.data_feature.get(&#039;num_nodes&#039;, 1)
        self.feature_dim = self.data_feature.get(&#039;feature_dim&#039;, 1)
        self.output_dim = self.data_feature.get(&#039;output_dim&#039;, 1)

        self.input_window = config.get(&#039;input_window&#039;, 1)
        self.output_window = config.get(&#039;output_window&#039;, 1)
        self.device = config.get(&#039;device&#039;, torch.device(&#039;cpu&#039;))
        self._logger = getLogger()
        self._scaler = self.data_feature.get(&#039;scaler&#039;)

        self.rnn_type = config.get(&#039;rnn_type&#039;, &#039;RNN&#039;)
        self.hidden_size = config.get(&#039;hidden_size&#039;, 64)
        self.num_layers = config.get(&#039;num_layers&#039;, 1)
        self.dropout = config.get(&#039;dropout&#039;, 0)
        self.bidirectional = config.get(&#039;bidirectional&#039;, False)
        self.teacher_forcing_ratio = config.get(&#039;teacher_forcing_ratio&#039;, 0)
        if self.bidirectional:
            self.num_directions = 2
        else:
            self.num_directions = 1
        self.input_size = self.num_nodes * self.feature_dim

        self._logger.info(&#039;You select rnn_type {} in RNN!&#039;.format(self.rnn_type))
        if self.rnn_type.upper() == &#039;GRU&#039;:
            self.rnn = nn.GRU(input_size=self.input_size, hidden_size=self.hidden_size,
                              num_layers=self.num_layers, dropout=self.dropout,
                              bidirectional=self.bidirectional)
        elif self.rnn_type.upper() == &#039;LSTM&#039;:
            self.rnn = nn.LSTM(input_size=self.input_size, hidden_size=self.hidden_size,
                               num_layers=self.num_layers, dropout=self.dropout,
                               bidirectional=self.bidirectional)
        elif self.rnn_type.upper() == &#039;RNN&#039;:
            self.rnn = nn.RNN(input_size=self.input_size, hidden_size=self.hidden_size,
                              num_layers=self.num_layers, dropout=self.dropout,
                              bidirectional=self.bidirectional)
        else:
            raise ValueError(&#039;Unknown RNN type: {}&#039;.format(self.rnn_type))
        self.fc = nn.Linear(self.hidden_size * self.num_directions, self.num_nodes * self.output_dim)

    def forward(self, batch):
        src = batch[&#039;X&#039;].clone()  # [batch_size, input_window, num_nodes, feature_dim]
        target = batch[&#039;y&#039;]  # [batch_size, output_window, num_nodes, feature_dim]
        src = src.permute(1, 0, 2, 3)  # [input_window, batch_size, num_nodes, feature_dim]
        target = target.permute(1, 0, 2, 3)  # [output_window, batch_size, num_nodes, output_dim]

        batch_size = src.shape[1]
        src = src.reshape(self.input_window, batch_size, self.num_nodes * self.feature_dim)
        # src = [self.input_window, batch_size, self.num_nodes * self.feature_dim]
        outputs = []
        for i in range(self.output_window):
            # src: [input_window, batch_size, num_nodes * feature_dim]
            out, _ = self.rnn(src)
            # out: [input_window, batch_size, hidden_size * num_directions]
            out = self.fc(out[-1])
            # out: [batch_size, num_nodes * output_dim]
            out = out.reshape(batch_size, self.num_nodes, self.output_dim)
            # out: [batch_size, num_nodes, output_dim]
            outputs.append(out.clone())
            if self.output_dim &lt; self.feature_dim:  # output_dim可能小于feature_dim
                out = torch.cat([out, target[i, :, :, self.output_dim:]], dim=-1)
            # out: [batch_size, num_nodes, feature_dim]
            if self.training and random.random() &lt; self.teacher_forcing_ratio:
                src = torch.cat((src[1:, :, :], target[i].reshape(
                    batch_size, self.num_nodes * self.feature_dim).unsqueeze(0)), dim=0)
            else:
                src = torch.cat((src[1:, :, :], out.reshape(
                    batch_size, self.num_nodes * self.feature_dim).unsqueeze(0)), dim=0)
        outputs = torch.stack(outputs)
        # outputs = [output_window, batch_size, num_nodes, output_dim]
        return outputs.permute(1, 0, 2, 3)

    def calculate_loss(self, batch):
        y_true = batch[&#039;y&#039;]
        y_predicted = self.predict(batch)
        y_true = self._scaler.inverse_transform(y_true[..., :self.output_dim])
        y_predicted = self._scaler.inverse_transform(y_predicted[..., :self.output_dim])
        return loss.masked_mae_torch(y_predicted, y_true, 0)

    def predict(self, batch):
        return self.forward(batch)</code></pre>
<h3>ConvGCN</h3>
<pre><code class="language-python">from libcity.model import loss
from libcity.model.abstract_traffic_state_model import AbstractTrafficStateModel
import torch.nn.functional as F
import math
import torch
import torch.nn as nn
from torch.nn.parameter import Parameter
from torch.nn.modules.module import Module

&quot;&quot;&quot;
输入流入和流出的2维数据
&quot;&quot;&quot;

class GraphConvolution(Module):
    def __init__(self, in_features, out_features, device, bias=True):
        super(GraphConvolution, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weight = Parameter(torch.FloatTensor(in_features, out_features).to(device))  # FloatTensor建立tensor
        if bias:
            self.bias = Parameter(torch.FloatTensor(1, out_features, 1, 1)).to(device)
        else:
            self.register_parameter(&#039;bias&#039;, None)
        self.reset_parameters()

    # 初始化权重
    def reset_parameters(self):
        stdv = 1. / math.sqrt(self.weight.size(0))
        self.weight.data.uniform_(-stdv, stdv)
        if self.bias is not None:
            self.bias.data.uniform_(-stdv, stdv)

    def forward(self, input, adjT):
        # print(&#039;input.shape:&#039;, input.shape)
        # print(&#039;self.weight.shape:&#039;, self.weight.shape)
        support = torch.einsum(&quot;ijkl, jm-&gt;imkl&quot;, [input, self.weight])
        # print(&#039;support.shape:&#039;, support.shape)
        # print(&#039;adjT.shape:&#039;, adjT.shape)
        output = torch.einsum(&quot;ak, ijkl-&gt;ijal&quot;, [adjT, support])
        # print(&#039;output.shape:&#039;, output.shape)
        # print(&#039;self.bias.shape:&#039;, self.bias.shape)
        if self.bias is not None:
            return output + self.bias
        else:
            return output

class GCN(nn.Module):
    def __init__(self, input_size, hidden_size, output_size, device):
        super(GCN, self).__init__()

        self.gc1 = GraphConvolution(input_size, hidden_size, device)
        self.gc2 = GraphConvolution(hidden_size, output_size, device)

    def forward(self, x, adj):
        x = F.relu(self.gc1(x, adj))
        x = self.gc2(x, adj)
        return x

class CONVGCN(AbstractTrafficStateModel):
    def __init__(self, config, data_feature):
        super().__init__(config, data_feature)
        self.device = config.get(&#039;device&#039;, torch.device(&#039;cpu&#039;))
        self._scaler = self.data_feature.get(&#039;scaler&#039;)
        self.adj_mx = torch.tensor(self.data_feature.get(&#039;adj_mx&#039;), device=self.device)
        self.num_nodes = self.data_feature.get(&#039;num_nodes&#039;, 1)
        for i in range(self.num_nodes):
            self.adj_mx[i, i] = 1
        self.feature_dim = self.data_feature.get(&#039;feature_dim&#039;, 1)  # 输入维度
        self.output_dim = self.data_feature.get(&#039;output_dim&#039;, 1)  # 输出维度
        # self._logger = getLogger()
        self.conv_depth = config.get(&#039;conv_depth&#039;, 5)
        self.conv_height = config.get(&#039;conv_height&#039;, 3)
        self.hidden_size = config.get(&#039;hidden_size&#039;, 16)
        self.time_lag = config.get(&#039;time_lag&#039;, 1)
        self.output_window = config.get(&#039;output_window&#039;, 1)

        self.gc = GCN(
            (self.time_lag-1) * 3,
            self.hidden_size,
            self.conv_depth * self.conv_height,
            self.device
        )
        self.Conv = nn.Conv3d(
            in_channels=self.num_nodes,
            out_channels=self.num_nodes,
            kernel_size=3,
            stride=(1, 1, 1),
            padding=(1, 1, 1)
        )
        self.relu = nn.ReLU()
        self.fc = nn.Linear(
            self.num_nodes * self.conv_depth * self.conv_height * self.feature_dim,
            self.num_nodes * self.output_window * self.output_dim
        )

    def forward(self, batch):

        x = batch[&#039;X&#039;]
        out = self.gc(x, self.adj_mx)
        # print(&#039;gc_output:&#039;, out.shape)
        out = torch.reshape(
            out,
            (-1, self.num_nodes, self.conv_depth, self.conv_height, self.feature_dim)
        )
        # print(&#039;conv_in:&#039;, out.shape)
        out = self.relu(self.Conv(out))
        # print(&#039;conv_out:&#039;, out.shape)

        out = out.view(-1, self.num_nodes * self.conv_depth * self.conv_height * self.feature_dim)
        out = self.fc(out)
        out = torch.reshape(out, [-1, self.output_window, self.num_nodes, self.output_dim])
        return out

    def predict(self, batch):
        return self.forward(batch)

    def calculate_loss(self, batch):
        y_true = batch[&#039;y&#039;]
        y_predicted = self.predict(batch)
        # print(&#039;size of y_true:&#039;, y_true.shape)
        # print(&#039;size of y_predict:&#039;, y_predicted.shape)
        y_true = self._scaler.inverse_transform(y_true[..., :self.output_dim])
        y_predicted = self._scaler.inverse_transform(y_predicted[..., :self.output_dim])
        return loss.masked_mse_torch(y_predicted, y_true, 0)</code></pre>
<h2>自动微分</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html">Automatic Differentiation with torch.autograd — PyTorch Tutorials 2.7.0+cu126 documentation</a>
<a href="https://docs.pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html">A Gentle Introduction to torch.autograd — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<pre><code class="language-python">import torch

x = torch.ones(5)  # input tensor
y = torch.zeros(3)  # expected output
w = torch.randn(5, 3, requires_grad=True)
b = torch.randn(3, requires_grad=True)
z = torch.matmul(x, w)+b
loss = torch.nn.functional.binary_cross_entropy_with_logits(z, y)</code></pre>
<p>Conceptually, autograd keeps a record of data (tensors) &amp; all executed operations (along with the resulting new tensors) in a directed acyclic graph (DAG) consisting of <a href="https://pytorch.org/docs/stable/autograd.html#torch.autograd.Function">Function</a> objects. In this DAG, leaves are the input tensors, roots are the output tensors. By tracing this graph from roots to leaves, you can automatically compute the gradients using the chain rule.
In a forward pass, autograd does two things simultaneously:</p>
<ul>
<li>run the requested operation to compute a resulting tensor, and</li>
<li>maintain the operation’s <em>gradient function</em> in the DAG.</li>
</ul>
<p>The backward pass kicks off when <code>.backward()</code> is called on the DAG root. <code>autograd</code> then:</p>
<ul>
<li>computes the gradients from each <code>.grad_fn</code>,</li>
<li>accumulates them in the respective tensor’s <code>.grad</code> attribute, and</li>
<li>using the chain rule, propagates all the way to the leaf tensors.</li>
</ul>
<p>Below is a visual representation of the DAG in our example. In the graph, the arrows are in the direction of the forward pass. The nodes represent the backward functions of each operation in the forward pass. The leaf nodes in blue represent our leaf tensors <code>a</code> and <code>b</code>.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610151537762.png" alt="" />
By default, all tensors with <code>requires_grad=True</code> are tracking their computational history and support gradient computation. However, there are some cases when we do not need to do that, for example, when we have trained the model and just want to apply it to some input data, i.e. we only want to do <em>forward</em> computations through the network. We can stop tracking computations by surrounding our computation code with <code>torch.no_grad()</code> block:</p>
<pre><code class="language-python">z = torch.matmul(x, w)+b
print(z.requires_grad) # True

with torch.no_grad():
    z = torch.matmul(x, w)+b
print(z.requires_grad) # False</code></pre>
<p><a href="https://docs.pytorch.org/docs/stable/notes/autograd.html">Autograd mechanics — PyTorch 2.7 documentation</a></p>
<pre><code class="language-python">import torch

# 创建张量，启用梯度追踪
x = torch.tensor(2.0, requires_grad=True)
y = x**2 + 3*x + 1  # 前向计算

# 反向传播
y.backward()

# 梯度存储在 x.grad 中
print(x.grad)  # 输出：dy/dx = 2x + 3 = 2*2 + 3 = 7</code></pre>
<h2>训练</h2>
<p>To train a model, we need a <a href="https://pytorch.org/docs/stable/nn.html#loss-functions">loss function</a> and an <a href="https://pytorch.org/docs/stable/optim.html">optimizer</a>.</p>
<pre><code class="language-python">loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=1e-3)</code></pre>
<p>In a single training loop, the model makes predictions on the training dataset (fed to it in batches), and backpropagates the prediction error to adjust the model’s parameters.</p>
<pre><code class="language-python"># 查看size
batch_size = 64

def train(dataloader, model, loss_fn, optimizer):
    size = len(dataloader.dataset)
    model.train() # Set the model to training mode
    for batch, (X, y) in enumerate(dataloader):
        X, y = X.to(device), y.to(device) # put data into device

        # Compute prediction error
        pred = model(X)
        loss = loss_fn(pred, y) # the loss func we init

        # Backpropagation
        loss.backward()
        optimizer.step() # how much we should step
        optimizer.zero_grad()

        if batch % 100 == 0:
            loss, current = loss.item(), (batch + 1) * len(X)
            print(f&quot;loss: {loss:&gt;7f}  [{current:&gt;5d}/{size:&gt;5d}]&quot;)</code></pre>
<h2>测试Test &amp; Eval</h2>
<pre><code class="language-python">def test(dataloader, model, loss_fn):
    size = len(dataloader.dataset)
    num_batches = len(dataloader)
    model.eval()
    test_loss, correct = 0, 0
    with torch.no_grad():
        for X, y in dataloader:
            X, y = X.to(device), y.to(device)
            pred = model(X)
            test_loss += loss_fn(pred, y).item()
            correct += (pred.argmax(1) == y).type(torch.float).sum().item()
    test_loss /= num_batches
    correct /= size
    print(f&quot;Test Error: \n Accuracy: {(100*correct):&gt;0.1f}%, Avg loss: {test_loss:&gt;8f} \n&quot;)</code></pre>
<p>The training process is conducted over several iterations (<em>epochs</em>). During each epoch, the model learns parameters to make better predictions. We print the model’s accuracy and loss at each epoch; we’d like to see the accuracy increase and the loss decrease with every epoch.</p>
<pre><code class="language-python">epochs = 5
for t in range(epochs):
    print(f&quot;Epoch {t+1}\n-------------------------------&quot;)
    train(train_dataloader, model, loss_fn, optimizer)
    test(test_dataloader, model, loss_fn)
print(&quot;Done!&quot;)</code></pre>
<pre><code class="language-python">def train_loop(dataloader, model, loss_fn, optimizer):
    size = len(dataloader.dataset)
    # Set the model to training mode - important for batch normalization and dropout layers
    # Unnecessary in this situation but added for best practices
    model.train()
    for batch, (X, y) in enumerate(dataloader):
        # Compute prediction and loss
        pred = model(X)
        loss = loss_fn(pred, y)

        # Backpropagation
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        if batch % 100 == 0:
            loss, current = loss.item(), batch * batch_size + len(X)
            print(f&quot;loss: {loss:&gt;7f}  [{current:&gt;5d}/{size:&gt;5d}]&quot;)

def test_loop(dataloader, model, loss_fn):
    # Set the model to evaluation mode - important for batch normalization and dropout layers
    # Unnecessary in this situation but added for best practices
    model.eval()
    size = len(dataloader.dataset)
    num_batches = len(dataloader)
    test_loss, correct = 0, 0

    # Evaluating the model with torch.no_grad() ensures that no gradients are computed during test mode
    # also serves to reduce unnecessary gradient computations and memory usage for tensors with requires_grad=True
    with torch.no_grad():
        for X, y in dataloader:
            pred = model(X)
            test_loss += loss_fn(pred, y).item()
            correct += (pred.argmax(1) == y).type(torch.float).sum().item()

    test_loss /= num_batches
    correct /= size
    print(f&quot;Test Error: \n Accuracy: {(100*correct):&gt;0.1f}%, Avg loss: {test_loss:&gt;8f} \n&quot;)</code></pre>
<p>不同的fig
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610153816952.png" alt="" /></p>
<h2>保存模型 &amp; 加载模型</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/basics/saveloadrun_tutorial.html">Save and Load the Model — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<pre><code class="language-python">torch.save(model.state_dict(), &quot;model.pth&quot;)
print(&quot;Saved PyTorch Model State to model.pth&quot;)</code></pre>
<pre><code class="language-python">model = NeuralNetwork().to(device)
model.load_state_dict(torch.load(&quot;model.pth&quot;, weights_only=True))</code></pre>
<p>This model can now be used to make predictions.</p>
<pre><code class="language-python">classes = [
    &quot;T-shirt/top&quot;,
    &quot;Trouser&quot;,
    &quot;Pullover&quot;,
    &quot;Dress&quot;,
    &quot;Coat&quot;,
    &quot;Sandal&quot;,
    &quot;Shirt&quot;,
    &quot;Sneaker&quot;,
    &quot;Bag&quot;,
    &quot;Ankle boot&quot;,
]

model.eval()
x, y = test_data[0][0], test_data[0][1]
with torch.no_grad():
    x = x.to(device)
    pred = model(x)
    predicted, actual = classes[pred[0].argmax(0)], classes[y]
    print(f&#039;Predicted: &quot;{predicted}&quot;, Actual: &quot;{actual}&quot;&#039;)</code></pre>
<h2>如何用Profiler profile并且优化</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/profiler.html">Profiling your PyTorch Module — PyTorch Tutorials 2.7.0+cu126 documentation</a>
<a href="https://docs.pytorch.org/docs/stable/autograd.html#profiler">Automatic differentiation package - torch.autograd — PyTorch 2.7 documentation</a></p>
<p><a href="https://docs.pytorch.org/tutorials/intermediate/pinmem_nonblock.html">A guide on good usage of non_blocking and pin_memory() in PyTorch — PyTorch Tutorials 2.7.0+cu126 documentation</a></p>
<p>Optimizing the transfer of tensors from the CPU to the GPU can be achieved through asynchronous transfers and memory pinning. However, there are important considerations:</p>
<ul>
<li>Using <code>tensor.pin_memory().to(device, non_blocking=True)</code> can be up to twice as slow as a straightforward <code>tensor.to(device)</code>.</li>
<li>Generally, <code>tensor.to(device, non_blocking=True)</code> is an effective choice for enhancing transfer speed.</li>
<li>While <code>cpu_tensor.to(&quot;cuda&quot;, non_blocking=True).mean()</code> executes correctly, attempting <code>cuda_tensor.to(&quot;cpu&quot;, non_blocking=True).mean()</code> will result in erroneous outputs.</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610153941999.png" alt="" /></p>
<h2>Holistic Trace Analysis</h2>
<p><a href="https://docs.pytorch.org/tutorials/beginner/hta_intro_tutorial.html">Introduction to Holistic Trace Analysis — PyTorch Tutorials 2.7.0+cu126 documentation</a>
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/N2025/20250610160532663.png" alt="" /></p>
<p>Kernel Duration Distribution<a href="https://docs.pytorch.org/tutorials/beginner/hta_intro_tutorial.html#kernel-duration-distribution">KDD</a></p>
<p>The second dataframe returned by <a href="https://hta.readthedocs.io/en/latest/source/api/trace_analysis_api.html#hta.trace_analysis.TraceAnalysis.get_gpu_kernel_breakdown">get_gpu_kernel_breakdown</a> contains duration summary statistics for each kernel. In particular, this includes the count, min, max, average, standard deviation, sum, and kernel type for each kernel on each rank.</p>
<h2>分布式机器学习</h2>
<p>pipe
<a href="https://docs.pytorch.org/docs/stable/distributed.pipelining.html">Pipeline Parallelism — PyTorch 2.7 documentation</a></p>
<p>FSDP
<a href="https://docs.pytorch.org/docs/stable/fsdp.html">FullyShardedDataParallel — PyTorch 2.7 documentation</a></p>
<p>Checkpoint
<a href="https://docs.pytorch.org/docs/stable/checkpoint.html">torch.utils.checkpoint — PyTorch 2.7 documentation</a></p>
<p>DDP
<a href="https://docs.pytorch.org/docs/stable/ddp_comm_hooks.html">DDP Communication Hooks — PyTorch 2.7 documentation</a></p>
<h3>AI 编译器</h3>
<p><a href="https://docs.pytorch.org/docs/stable/torch.compiler.html">torch.compiler — PyTorch 2.7 documentation</a></p>
