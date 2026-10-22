---
title: "构建之法 - 学习笔记"
description: "因为是自己边读边记录的，会有些乱 章节 1 概论 讨论了什么是软件工程，小项目跟公司级别的大项目的区别。各种工程化和管理化的方法。 纸飞机、莱特兄弟的飞机、波音747客机的飞机例子举的非常好，让人对大型软件项目有了更深的理解。 这些天我在调制SGLang的时候，也遇到了类似的问题。LLM Serving已经进入到了一个非常复杂的问题境界，如同当年Oracle和MS Server一样复杂，每个公司都需要特例化部署。而软件的复杂性让整个系…"
publishedAt: "2026-07-09T09:20:16Z"
updatedAt: "2026-07-14T19:02:57Z"
category: "Books Reading"
categories: ["Books Reading"]
tags: []
author: "haibin"
draft: false
slug: "ms-gjzf"
legacySlug: "ms-gjzf"
oldSlugs: ["构建之法-学习笔记"]
wordpressId: 1486
sourceUrl: "https://www.haibinlaiblog.top/index.php/ms-gjzf/"
commentCount: 1
viewCount: 1192
likeCount: 0
dislikeCount: 0
comments: [{"author": "Haibin", "replyTo": "", "content": "最后的点评，我先做了一期moments: https://www.haibinlaiblog.top/index.php/ai-cpu-software-management/"}]
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf.webp"
---
<p>因为是自己边读边记录的，会有些乱</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-001-7312b3726291.webp" alt="image.png" /></p>
<h2>章节 1 概论</h2>
<p>讨论了什么是软件工程，小项目跟公司级别的大项目的区别。各种工程化和管理化的方法。</p>
<p>纸飞机、莱特兄弟的飞机、波音747客机的飞机例子举的非常好，让人对大型软件项目有了更深的理解。</p>
<p>这些天我在调制SGLang的时候，也遇到了类似的问题。LLM Serving已经进入到了一个非常复杂的问题境界，如同当年Oracle和MS Server一样复杂，每个公司都需要特例化部署。而软件的复杂性让整个系统进入到频繁出bug/issue的阶段。</p>
<p>Serving因此需要特例化，因为工程复杂度会随着支持的config越多，而指数般地变的更复杂。在这个时代，M+N的编译器似乎越来越少，HPC里的MxN事情其实越来越多。</p>
<h2>章节2 个人技术和流程</h2>
<p>单元测试</p>
<p>软件作业</p>
<p>技术流程</p>
<p>性能分析的两种方法
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-002-9befa9553561.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-003-997f537e1a54.webp" alt="image.png" /></p>
<p>怎么开发
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-004-421009c07674.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-005-bae4c8ad4c79.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-006-5fb2aefb11c6.webp" alt="image.png" /></p>
<h2>章节3 软件工程师的成长</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-007-a317fdceb18d.webp" alt="image.png" /></p>
<p>挺不错的章节。给大学生讲了公司里发生了什么，就像公司前辈。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-008-9acae165dd02.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-009-df43000f49e0.webp" alt="image.png" /></p>
<p>过早的优化啥一切罪恶的根源</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-010-88988f61023e.webp" alt="image.png" /></p>
<p>工程师在各个编写代码、需求分析、测试等软件过程方面，比大学生有所不同。工程师会更加的稳健。</p>
<p>大学可能可以分为两种。第一种是学生似乎很难超过老师，第二种是学生一定会超越老师。但我目前感觉这些还不明显，因为是概率叠加的事情。但是有些事情是不一样的。</p>
<p>研究一个问题5年，现在的AI似乎没有这样的耐心。这让我觉得难过，也让我怀疑。我们其实高估了自己并低估了AI。当然，两年后可能也不确定了。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-011-af52f45c306d.webp" alt="image.png" /></p>
<p>工程师、学生、科研工作者的区别。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-012-91fe5bacd808.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-013-59f5ae401291.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-014-9be46a9fe8ed.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-015-3f56c6d128dc.webp" alt="image.png" /></p>
<p><a href="https://www.teamten.com/lawrence/writings/norris-numbers.html">https://www.teamten.com/lawrence/writings/norris-numbers.html</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-016-2f756283c1ef.webp" alt="image.png" />
<a href="https://news.cnblogs.com/n/509554/">https://news.cnblogs.com/n/509554/</a></p>
<h2>第4章 两人合作</h2>
<p>讨论了代码规范、审查、反馈。</p>
<pre><code>using namespace std;

int main(){

int arr[4];

arr[0] = 1;
arr[2] = 2;

int b[4] = {4,3,2,3};

}</code></pre>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-017-29036e050ea9.webp" alt="image.png" /></p>
<p>我个人认为反馈真的很重要。尤其是如何汇报负面的事件，这个点简直是生存技能。比如汇报为什么会这样，接下来怎么做。最可怕的点是，如果出现了负面事件，然后你还没有搞明白为什么会这样。这是最糟糕的。那此时会怎么办？</p>
<p>如果对方做了糟糕的事情，怎么评价？</p>
<p>行为和后果：你迟到了，我们错过了演出；请不要在用tab了喵
习惯和动机：你平时都这样，故意耍我；你这都第几次了？？
本质和固有属性：你是一个自私的人；你双非的学生水平真差！</p>
<p>问题是，是否自私、故意的真假不重要，重要的是目前手下的项目能不能推进。</p>
<p>两人结对的另一个重点是平等。这是一个有意思的观察。多人组队一定会出现一个队长，队长和组员天生的任务其实是有点不太一样的，甚至在吃饭时都会有所体现。哎，人类。</p>
<p><strong>不好的习惯</strong></p>
<p>深藏不露者：不告诉别人自己在做什么。</p>
<p>但是，这些是软件工程。更多的，在公司里也有人情世故。不过这方面中国和美国感觉不太一样就是。</p>
<h2>第5章 团队和流程</h2>
<p><strong>团队模式</strong></p>
<p>蜂窝模式：所有人都在抢球
主治医师：首席程序员编写代码，旁边有测试等
明星模式：其中一个人做了大部分的活
社区模式：大家一起做，但是有严格的代码复审和签入质量控制
业余剧团：平时大家平等，关键项目有导演
秘密团队：没有汇报，团队自由非常大
特工团队：一部分人专精棘手紧迫问题
交响乐团：门类齐全、有指挥、练习多次的曲目，出现在大型项目
Jazz：随性发挥
功能团：1-3人一个功能，完成需求
官僚主义：大头目、小头目。如果应用不好，就变成老板驱动</p>
<p>Conway Law：一个机构设计出来的系统，它的体系结构注定会沿用这个机构的内部交流模式</p>
<p>AI-人类，AI-AI 设计的系统，和人类-人类 系统肯定是不一样的。事实确实如此。而最可怕的是，AI会进化，人类也是。同时，“拯救AI coding过的项目”和“新的AI没看懂老AI的代码”这些问题也会涌现出来。人类的成长不是靠反向传播出来的。人类的文字和代码也会进化的。</p>
<p><strong>开发流程</strong>
code and fix：狗屎开发方法
waterfall Model：Managing the Development of Large Software Systems，一步步开发
Rational Unified Process统一流程RUP，不同阶段做什么东西（类似甘特图
老板驱动流程：懂你意思
渐进交付流程：一点点功能实现，然后交付</p>
<h2>第6章 敏捷流程</h2>
<p>尽可能快的完成开发。这听起来是个废话，然而，很多团队并并没有按照他们预想的那样开发成功。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-018-6c96f9b8a336.webp" alt="image.png" /></p>
<p>因为人本质上是人，人也有老婆孩子生活。有时候组员和mentor的目标才不是完成全部事情，而是早点下班。。。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-019-f6f9af857997.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-020-f4604ce1e68f.webp" alt="image.png" />
Scrum</p>
<p>尽可能最快开发出来，用几个sprint</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-021-c41162a9225b.webp" alt="image.png" />
brooks说往错误的项目里加入人手，只会让整个项目更加落后。其实AI也是这样。当时我们加入AI的时候，AI把项目搞的越来越乱。事实是这似乎并非模型的问题，有很大一部分是软件工程项目管理的问题。</p>
<p>我们的开发也是这样，需求在简短的几个meeting中迅速解决了。不过与其说是迅速解决，最大的感谢应该给到AI，不然我们是不可能完成的。</p>
<p>我们可能会花80%的时间在仅仅20%的功能上，这部分功能将成为难点。其实仔细想想也合理。那么这里我们的项目安排就很重要。书里作者给了我们用“测试”为建议。但是，这也在告诉我们，其实很多时候，要做好功能的取舍。这需要经验。</p>
<p>我之前做科研时，一直认为hidden state很重要，后来跟别人讨论，发现hidden state更重要。hidden state是一种，维度很多，平均信息量没有最终层的信息多，但是总信息量大于最终层信息量。这些信息，目前AI还无法学会。比如大型项目管理，与人交流，在代码仓库里踩的坑，行业经验，人生经验，以及人的成长模式。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-022-0b6d634456d5.webp" alt="image.png" /></p>
<p>把我们的开发成果，展示出来，并且最重要的是，展示为什么某些地方慢。我在做研究时，有时候有的地方没能成功，当时，我会习惯的埋藏一些。但是事实是，很多时候，我们只是需要那个状态，“目前到哪里了”，对项目负责人来说，他们喜欢掌控全局。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-023-25b85f28f6f7.webp" alt="image.png" />很重要。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-023-25b85f28f6f7.webp" alt="image.png" /></p>
<p>测试在一个冲刺中，认为可以担负产品负责人的责任</p>
<p>TDD test driven development
XP 极限编程
FDD Feature Driven Design</p>
<p>为什么敏捷开发在后来才来？因为早期的软件项目都是航天等</p>
<p>Hawthorne效应，人对新东西还是喜欢的</p>
<p><strong>18-24个月，是一个项目需求的生存周期，超过，基本可以不做了，因为需求早就变了。</strong>
真是短命啊</p>
<h2>第7章 实战中的软件工程</h2>
<p>真的，这章节讲的神了！如同在微软的工程师分享经验。</p>
<p>保持高质量是有意义的，方便后续的客户和需求扩张</p>
<p><strong>投资是长期的，短平快的工作叫投机，不叫投资</strong></p>
<p>不过，MSF没有提“质量第一”，而是认为解决用户问题第一</p>
<p>MSF工作机制</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-024-5acda28d5059.webp" alt="image.png" />
沟通很重要，并且不是文档的沟通，要完成信息的交流，而不是简单的文字说明。</p>
<p>信任与授权。这是我在公司里得到的最快乐的事情。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-025-91daf2ed4250.webp" alt="image.png" /></p>
<p>一个缺陷从发生到改进，平均实际位12小时，20道工序</p>
<p>事后回顾很重要，这意味着经验的累积和总结。在学习过去的经验时，也要避免让过去的经验妨碍解决现在的问题。在这里，开一个会是很重要的。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-026-c1c635cff65f.webp" alt="image.png" />
比如我在mem文章上的总结。最大的问题在于，我不知道怎么改进。这也是AI问题里最棘手的，跟系统研究比起来。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-027-8f3af8a0485d.webp" alt="image.png" /></p>
<p>嘉豪：保罗在自己的PDP-10机器上编写了8080模拟器，并在上边完成了自己的解释器。随后，他们飞到了MITS公司，演示了自己的解释器。第一次运行自己的解释器时，测试完全正确。MITS公司从工程师们到总经理都惊呆了。保罗回忆道：我自己也非常惊喜，但是我做出了一副“这没啥了不起“的样子。</p>
<p>高强度学习，面对新的bug修复中学习：在开着消防水龙头喝水！</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-028-2306d99c26fe.webp" alt="image.png" /></p>
<p>TFS：</p>
<p>关注文章的hidden state：怎么来的，怎么做的，除了文章文字以外，学到的知识。（关注软件的hidden state）</p>
<p>Cargo Cult：美军的飞机和土著的模仿；小项目团队和大项目的团队</p>
<p>管理学大师认为，我们应该在团队中要消除以数字定义的目标、份额，以及以类目标位基础的管理原则。我们要用管理原则取而代之。</p>
<p>我认为这句话，跟前些天meta的token使用排行可以做例子。纯粹的打榜，背后的hidden state是不知道的。</p>
<p>但是本章节的各种管理经验，对于没有工作经验的学生而言还是太难。单纯依靠书本并不能完全体会到这些经验。</p>
<h2>第8章 需求分析</h2>
<p>秋千图：类似梯度下降一样慢慢分析推导出需求。</p>
<p>AI-native：人类将有一个”电子副脑“，可以在脑机接口等工程下，实现真正的个人能力拓展。</p>
<p>面谈</p>
<p>人类学调查：在《社交网络》电影里，同学问主角：你知道女生C有没有男朋友？主角思考里一会，回去在自己的网站上实现了“你有朋友了吗”这一功能</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-029-225aeba31e43.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-030-34b7b1de4e50.webp" alt="image.png" /></p>
<p>《中国三线城市数字生活》</p>
<p>A/B测试</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-031-3676a299e48b.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-032-e1e34aacf167.webp" alt="image.png" /></p>
<p>Need - Approach - Benefit - Competitors - Delivery
<strong>NABCD方法</strong>
这个blog讲的挺好的
<a href="https://www.cnblogs.com/liangzhilin/p/5462486.html">https://www.cnblogs.com/liangzhilin/p/5462486.html</a></p>
<p>杀手功能 / 外围功能
必要需求/ 辅助需求</p>
<p>有一个4象限。有不同的战略。比如一个闹钟，能显示时间，那就是必要需求，能排版时间+AI规划，可能是杀手功能。我个人测试感觉这个4象限方法不是很好，经常很难快速区分各个需求。</p>
<p>估计项目复杂度和完成天数。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-033-bdd50e066ba6.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-034-a3dba015aa39.webp" alt="image.png" /></p>
<p>Y为实际天数，N为做过类似开发的次数</p>
<p>Y=X+- X/N</p>
<p>McConnell：软件估计的10宗罪
Quora：为什么软件开发周期总是预估的2-3倍</p>
<h2>第9章 项目经理</h2>
<p>软件项目的管理复杂度与人员数量的平方成正比（图论 nx(n-1)/2）
所以需要经理：带领团队，保持团队的平衡</p>
<p>这里MS把PM类似定义为博士生项目leader，负责日常的汇报，也会写一部分代码，做决议，做方案。从这里也可以思考phd的角色定位。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-035-29f2b7e7c6c9.webp" alt="image.png" /></p>
<p>从这点上看，想起来大学时有同学说，我自己技术很差，所以我要去做管理。抛开大家服不服你不谈，不懂技术就去管理真的是一个很可怕的事情，大概率会带翻车团队。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-036-652115622c26.webp" alt="image.png" /></p>
<p>自省能力，随时整理项目中自我的不足</p>
<p>别人布置任务或者我们部署任务的时候，一定要想清楚，这个事情是不是事实，以及我们要怎么应对：
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-037-8a66011199ba.webp" alt="image.png" /></p>
<p>大表哥的指挥，和项目经理是一样的吗？
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-038-5c6586738125.webp" alt="image.png" /></p>
<p>不太一样，项目经理还要完成对上面和外面负责。这听起来真的好难啊</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-039-6dbf05337eeb.webp" alt="image.png" /></p>
<p>MP，SP
快速学习能力，分析管理，专业能力</p>
<p>开正确的会议。会议开始时大家可能心情是平静的，但是离去时大部分是失望、愤怒、不安的，这跟会议的目的、交流的内容都有关。理清事实</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-040-af1c77d7df25.webp" alt="image.png" /></p>
<p>这让我想起我带团队的经历。我带时总会放一个错误：我自己属于HPC了解跟深的leader，而队友可能会年级低。此时很多工作我经常就自己包揽了，自己会过的更疲倦。</p>
<p>这其实是我个人的管理成长问题。人不能总是推脱。因为你总有一天会面对能力暂时不如你的人，然后带领一个团队走向更远。比如带新来的硕士生博士生做论文，你不能指望你每次招来的人都直接不用你指导，这样的话你应该在他手底下干活。还有就是lead一个个项目，这需要时间。
我必须面对这个问题。我目前已经完成了结对编程和合作。未来我需要在向这个方向改变。我会遇到越来越多同学的。</p>
<p>这也就是，追求过程创新。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-041-b8d6e2608282.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-042-9df85618bef1.webp" alt="image.png" /></p>
<h2>第10章 典型用户场景</h2>
<p>记住，我们的软件不是为了所有人服务的。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-043-c8ff1d7b169e.webp" alt="image.png" /></p>
<p>要找到动机。其实这一块最好是要记录行业内的各个经验，单纯的方法论不太能成功。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-044-129a18e86d0c.webp" alt="image.png" /></p>
<p>比如 killer microseconds 的问题，bojie的想法： <a href="https://arxiv.org/abs/2607.02630">https://arxiv.org/abs/2607.02630</a></p>
<p>然后典型用户可能画像会不一样：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-045-cd64517c4f61.webp" alt="image.png" /></p>
<p>use case</p>
<p>用户故事模板</p>
<p>服务质量，长江三峡的例子。非常有互联网时代感！</p>
<p>写文档Spec。有两个问题：第一，怎么把文档写的明白，让其他人来看的时候能读明白你的程序。第二，怎么让文档不过时，让文档足够对抗时间。这个跟设计文档Spec有关，解决方法就是多写，多练习。</p>
<p>FDD: feature driven design，适合对领域没有很多经验的团队。</p>
<h2>第11章 软件设计和实现</h2>
<p>我们有很多分析和设计的工具：</p>
<ul>
<li>UML</li>
<li>控制流</li>
<li>形式化方法</li>
</ul>
<p>实现流程
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-046-a3ec22834c38.webp" alt="image.png" /></p>
<p>实际程序员有多种方法做开发：
封闭开发Leave me alone 。适合做产品demo，原型
daily build 。就像yf分享的那样，底层硬件、算子库、驱动等代码，每天都需要全量跑测试。</p>
<p>在把build纳入工作后，员工的日常工作开发流就会产生。每天牛马如同机器开始工作。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-047-37181d4ac73a.webp" alt="image.png" /></p>
<p>代码环境管理。对你的代码、文档、各种都要求很多。哎，这方面我做的是真的糟糕啊。。。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-048-17006195c95b.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-049-cfb5d55981b6.webp" alt="image.png" />
<a href="https://www.cnblogs.com/marvin/p/TalkFromReflactingCode3000To15.html">https://www.cnblogs.com/marvin/p/TalkFromReflactingCode3000To15.html</a></p>
<p>重构，其实很简单：</p>
<ul>
<li>把基础打牢固</li>
<li>多看点优秀的代码</li>
<li>避免复制粘贴，如果看见重复代码时应该有意识要消灭它</li>
<li>减少对代码生成器的依赖</li>
<li>在处理现有代码时尽量用重构代替重写，在重写之前一定要先重构</li>
<li>尽量让所有的方法都是可测试的</li>
</ul>
<p>如果你坚持这么去做了，一段时间之后感觉自然就出来了。</p>
<p>重构的目的，是让你的代码更为精简、稳定、能够重用，是最大程度的让功能和业务分离。<strong>在重构的过程中，你的阅读代码的能力、写出优秀代码的能力以及系统架构能力都会稳步提升</strong>。你成为一个优秀的程序员将指日可待。</p>
<h2>第12章 用户体验</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-050-ea4e512c5cf1.webp" alt="image.png" /></p>
<p>一些好玩的例子
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-051-e3ff05ca75d8.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-052-22b7974ef63b.webp" alt="image.png" /></p>
<p>以及很经典的动画案例，这个也发生在我的博客开发中。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-053-174bc267e8df.webp" alt="image.png" />
这个比喻很好：“一瓶可乐3块钱，第一口的可乐值2.5”
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-054-8dbfa66daa27.webp" alt="image.png" /></p>
<p>这里讲到，给人的设计里，工具尽可能不同，才会让人更容易使用并且不会犯错。我不禁在思考。如果说，给agent的接口也是这样设计的，是不是也能减少agent理解错误的次数？</p>
<p>很可惜，如果我早两年看这本书，我就可以发paper了：</p>
<p>ICLR25 Oral <a href="https://arxiv.org/abs/2410.08197">https://arxiv.org/abs/2410.08197</a>
NAACL 2025 long paper <a href="https://aclanthology.org/2025.naacl-long.44.pdf">https://aclanthology.org/2025.naacl-long.44.pdf</a>
AAAI 2026 ACE: Automated Creation and Enrichment Framework</p>
<ul>
<li>
<p><strong>API-Bank</strong>, EMNLP 2023：规划、检索、调用 API 的 runnable benchmark。最适合你做 controlled intervention。<br />
<a href="https://aclanthology.org/2023.emnlp-main.187/">ACL Anthology</a></p>
</li>
<li>
<p><strong>ToolLLM / ToolBench</strong>, ICLR 2024 Spotlight：大规模真实 API 使用、API retriever、tool learning。说明 tool selection 是核心问题。<br />
<a href="https://arxiv.org/abs/2307.16789">arXiv</a>, <a href="https://github.com/openbmb/toolbench">GitHub</a></p>
</li>
<li>
<p><strong>BFCL</strong>, ICML 2025：function calling benchmark，适合做第二组泛化实验。<br />
<a href="https://proceedings.mlr.press/v267/patil25a.html">PMLR</a>
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-055-0874d384f738.webp" alt="image.png" /></p>
</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-056-8634fe2afa9d.webp" alt="image.png" /></p>
<p>居中一句话的设计演变
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-057-9064070890ae.webp" alt="image.png" /></p>
<p>”’找不到对象‘是什么意思？“ 我妈问。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-058-a396ac42238d.webp" alt="image.png" /></p>
<p>最狗屎的设计：Iphone的静音会把闹钟也关了。我因此错过了很多很多事情。
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-059-c5a6bec9d4bc.webp" alt="image.png" /></p>
<h2>章节13 软件测试</h2>
<p>永远有的bug发生在奇葩的时刻：</p>
<p>【【1日元股票卖61万股 一天亏损407亿！】日本史上最离谱乌龙指事件 股市交易系统诡异连环Bug 日本股神一天赚22亿！】 <a href="https://www.bilibili.com/video/BV16pVw6GErT/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV16pVw6GErT/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-060-32837f10b0ac.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-061-7b8e9ca7114d.webp" alt="image.png" /></p>
<p>功能测试</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-062-16ac6a07db50.webp" alt="image.png" /></p>
<p>非功能测试
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-063-0a1d06e5be03.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-064-12aaa408ea02.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-065-5a2dded0e294.webp" alt="image.png" />
从前，韩国的国君韩昭侯喝醉睡着了。
负责管理帽子的官员（典冠）看见国君觉得冷，就替国君盖上了一件衣服。韩昭侯醒来以后，很高兴。问身边的人：&quot;是谁给我加的衣服？&quot; 左右回答：&quot;是典冠。&quot; 于是韩昭侯同时处罚了<strong>典衣</strong>和<strong>典冠</strong>两个人。</p>
<p>韩非子借这个故事说明一个法家观点：</p>
<blockquote>
<p><strong>国家必须靠制度，而不是靠人的善意。</strong></p>
</blockquote>
<p>如果人人都可以因为&quot;我是好心&quot;而去做别人的工作，那么最后：</p>
<ul>
<li>谁负责什么就不清楚了；</li>
<li>出了问题没人承担责任；</li>
<li>官员互相干涉，组织秩序混乱。</li>
</ul>
<p>bug还是feature？
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-066-652a7a9d5087.webp" alt="image.png" /></p>
<h2>第14章 质量保证</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-067-5a219dba8081.webp" alt="image.png" /></p>
<p>CMMI 能力成熟度模型集成</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-068-3d3da5e84bb0.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-069-e754a9e74400.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-070-aa5e02f4662d.webp" alt="image.png" /></p>
<p>每天都要跟这些扯皮吗
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-071-d7f40b73a9c5.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-072-0025c36cc03e.webp" alt="image.png" /></p>
<p>测试的工作其实有点不讨好。从代码的例子来说，测试没过，开发的压力就大，而同事的关系就很难搞定。具体例子看：</p>
<p>【【美术界的屎山代码4】美术师能惹多大的祸！奇葩游戏开发史 垃圾游戏团队 最讨厌的程序员 美术屎山代码第四部】 <a href="https://www.bilibili.com/video/BV1mqT16FEj7/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV1mqT16FEj7/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<p>【一個動畫師的日常被懟 遊戲公司 如何面對 職場批評 保持良好的心態 How to be a go off knife meat】 <a href="https://www.bilibili.com/video/BV1na411673M/?share_source=copy_web&amp;vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4">https://www.bilibili.com/video/BV1na411673M/?share_source=copy_web&vd_source=72eac555730ba7e7a64f9fa1d7f2b2d4</a></p>
<h3>我可以跟大家说我做错了，请容我一改。但是这不是找死吗？</h3>
<h3>我痛斥过那些飘在天上的花盆，也对程序组的程序员们大放过厥词。当最终这个项目组里最大的史山，竟然是我自己埋的</h3>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-073-fc76fa7ef01a.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-074-5771271810c9.webp" alt="image.png" /></p>
<h2>章节15 稳定和发布阶段</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-075-84ea61504424.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-076-60df6f04353c.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-077-c172f10c6865.webp" alt="image.png" /></p>
<p>有一篇文章： <a href="https://arxiv.org/html/2510.01514v1">https://arxiv.org/html/2510.01514v1</a> </p>
<p>won't fix 很多情况下，它更像是&quot;当前阶段不处理&quot;，如果未来情况变化（比如更多人反馈、技术条件成熟），是可以重新打开的。</p>
<p>这些问题65%出在提交者身上，项目方认为问题不在项目本身：</p>
<table>
<thead>
<tr>
<th>原因</th>
<th>占比</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>缺乏讨论/无回应</strong></td>
<td>25%</td>
<td>提交的问题太模糊、太复杂，或者提交者后续没有参与讨论，导致无法推进</td>
</tr>
<tr>
<td><strong>用户环境特有</strong></td>
<td>15%</td>
<td>问题只在提交者的特定机器/硬件/配置下出现，无法复现</td>
</tr>
<tr>
<td><strong>外部项目依赖</strong></td>
<td>10%</td>
<td>问题来自项目无法控制的外部依赖，应该由上游项目修复</td>
</tr>
<tr>
<td><strong>重复问题</strong></td>
<td>8%</td>
<td>已有其他 Issue 或 PR 在解决同样的问题</td>
</tr>
<tr>
<td><strong>非英文提交</strong></td>
<td>7%</td>
<td>由于语言障碍，非英文提交的问题几乎肯定会被关闭</td>
</tr>
</tbody>
</table>
<p>这些问题35%是维护者主动做出的决策：</p>
<table>
<thead>
<tr>
<th>原因</th>
<th>占比</th>
<th>说明</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>已有变通方案</strong></td>
<td>14%</td>
<td>虽然问题存在，但已经有令人满意的 workaround，不需要再修</td>
</tr>
<tr>
<td><strong>技术上不支持</strong></td>
<td>11%</td>
<td>修复难度太大、成本太高，或者会增加不必要的复杂度</td>
</tr>
<tr>
<td><strong>没有兴趣/优先级低</strong></td>
<td>9%</td>
<td>维护者或社区对这个问题不感兴趣，认为不值得投入</td>
</tr>
</tbody>
</table>
<p>一些case：</p>
<ul>
<li><strong>&quot;这不是 Bug，是 Feature&quot;</strong>：有些行为虽然看起来奇怪，但确实是设计如此。这种情况下用 <code>wontfix</code> 表示&quot;我们知道这看起来有问题，但这就是预期行为&quot;。</li>
<li><strong>&quot;成本不值得&quot;</strong>：修复一个极小众场景下的微小问题，可能需要重构大量代码，风险收益不成正比。</li>
<li><strong>&quot;等重写&quot;</strong>：比如 Unity 引擎的某些老问题，官方可能计划未来重写整个模块，所以旧代码里的 Bug 就不修了</li>
<li><strong>&quot;只影响旧版本&quot;</strong>：MariaDB 的文档提到，<code>wontfix</code> 常用于&quot;只影响旧版本且不够重要&quot;的 Bug    </li>
</ul>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-078-08c1ccc0e0bc.webp" alt="image.png" /></p>
<h3>ZBB</h3>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-079-414f77c39114.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-080-6a4b312fbc43.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-081-41acc3c535bf.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-082-7f47c1f8a93b.webp" alt="image.png" /></p>
<p>事后团建吃饭：</p>
<p>在我做的几个项目里，好像团建的都比较少：大家熬夜几天交了ddl，出去玩或者休息了。但是我认为，这个吃饭或者简单的聊天是非常重要的事情。让你重新站在高处重新思考你做的史山。</p>
<p>投完SC的第二天，我记得是周三。随后是那天下午还是周四，我就去找老师聊天。讲讲得失，讲讲抛开论文外，抛开糟糕的实验、半人类的写作、残破的代码、别人繁杂的论文外，对这个方向的感触。</p>
<p>我之前说论文其实有一种hidden state，事后诸葛亮会议其实就是挖掘的最重要的时刻。你对hidden state的糟糕记忆还没有被旅游冲淡，你也还没有沉浸在accept的自我狂妄和沾沾自喜中。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-083-c153ce66afb2.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-084-66bc6830822c.webp" alt="image.png" /></p>
<p>风险管理。没有风险，就是最大的风险</p>
<p>乔布斯的分析：dwz.cn/1Iss5G</p>
<h2>第16章 IT行业的创新</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-085-9fd834107e0c.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-086-f792ff16a2af.webp" alt="image.png" /></p>
<p>有趣的想法，关于科研和金钱，其实有点像理论和工程类的研究。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-087-e2b92804668a.webp" alt="image.png" />
坚持很多年，把习以为常的事情坚持下去，才能得到创新。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-088-8d7f3f432ff0.webp" alt="image.png" /></p>
<p>下面的这个故事真的讲的很有趣：</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-089-36f6ad1f3be7.webp" alt="image.png" />
<img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-090-17df7019fcea.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-091-411fdcb7efa9.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-092-9d8455c3e728.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-093-7cf65ad671d3.webp" alt="image.png" /></p>
<p>SWOT分析</p>
<p>一个玩魔方的故事：很多同学热衷于技术和技术的创新，但是当大家在埋头搞技术时，是否注意到自己是在用屁股对着目标用户？</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-094-20a52c7a4e2c.webp" alt="image.png" /></p>
<p>我记得大三上学期期中左右的一天晚上，我刚刚上完操作系统课回实验室休息。yf学长看到我回到我凌乱的桌面，笑着说你这怎么这么多书和生存用品，做科研真是认真努力啊！我笑着说“小作坊小作坊”，实验室大伙顿时绷不住了。</p>
<p>科研其实确实是小作坊，或者说大作坊里的小作坊。又或者，跟电信诈骗挺像的。组里几十个人，但是真正接触用户的就几个：会爬虫和改前端的扒手（找idea），在线发牌的美女（探索方法，这块最关键），微信聊天的狗托（坚持），以及拿着AK顶着他们的老板（动力/push）。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-095-8fc3ca92054f.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-096-1350833c665b.webp" alt="image.png" /></p>
<p>书里的问题 <strong>Q: Why was the Xerox Star not successful?</strong><br />
<strong>A:</strong> The Star 8010 was technologically advanced but suffered from a very high price tag ($16,000 per workstation, equivalent to over $50,000 today) and was part of a larger, expensive system requiring servers and Ethernet. It was marketed towards corporations as a high-end system for professionals, but the market wasn’t ready for such an expensive, radical shift in computing yet. Apple’s Macintosh, launched later at a significantly lower price, found a much wider audience.</p>
<p>Xerox did make an attempt to commercialize these innovations with the Xerox Star, launching in 1981 as a high-tech marvel brimming with features we take for granted today. <strong>However, its steep price and misaligned internal objectives hamstrung its success. Where the Star was encumbered by its system constraints and cost, the Macintosh, debuting three years later at a fraction of the price, successfully captured the public’s imagination and market share.</strong></p>
<p>在那个时代，只有普通人才会用GUI的电脑。但是Xerox电脑价格太高了。同时，加入了太多的新技术（比如以太网），这些都让Xerox电脑最终没有很好的流行起来</p>
<p>Looking back, it’s clear that the researchers at Xerox PARC didn’t just invent pieces of technology; they invented a <em>way</em> of interacting with  <a href="https://techotv.com/the-legendary-tale-of-xerox-parc-where-modern-computing-was-born/#">computers</a> that would define the next fifty years. Their work on the Alto, the GUI, the mouse, and Ethernet wasn’t just incremental improvement; it was a paradigm shift. While Xerox didn’t become the  <a href="https://techotv.com/the-legendary-tale-of-xerox-parc-where-modern-computing-was-born/#">computing</a> superpower many might have expected, the seeds of innovation sown at PARC blossomed into the digital landscape we inhabit today. It’s a story of brilliant minds, ambitious goals, and a legacy that truly changed the world, bit by brilliant bit.</p>
<h2>第17章 人、绩效和职业道德</h2>
<p>很有趣的一章，一般的软件工程书似乎不会谈论这个情况。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-097-8f9729646473.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-098-dee8ea5d986a.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-099-e71cbb413dcc.webp" alt="image.png" />
原则：重大决定由猪定夺。</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-100-6dbae635baf2.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-101-9bcee895d515.webp" alt="image.png" /></p>
<p>与人打交到真难啊！感觉我的学习比写代码要难100倍。写代码对了就对了，错了就错了，这个可怎么办？！</p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-102-c97f3d8d182c.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-103-bd74035ec9d4.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-104-b11eca870b10.webp" alt="image.png" /></p>
<p>半条命源码被盗的故事
<a href="https://wedelphi.com/t/214504/">https://wedelphi.com/t/214504/</a></p>
<h2>最后关于这门课</h2>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-105-7e4e38877f7f.webp" alt="image.png" /></p>
<p><img src="https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-07/ms-gjzf/body-106-aee2122e8f6b.webp" alt="image.png" /></p>
<p>写的真的太好了。对代码、人、公司做出了很生动的讲述。真的是公司入职前的“开工第一课”。如果大二读了这本书，或许我就能对软件行业有更多的理解，在公司里就有更多的想法了。谁知道呢？</p>
<p>我还有很多想说的，尤其是对于AI时代的工程。我最近刚好想对我们学校的软件工程课做点评，可能比较个人主观，还请期待。</p>
