---
title: "Listening to Tianyin Xu: Notes and Reflections"
description: "This blog is generated from https://www.haibinlaiblog.top/index.php/ting-tianyin-xu-lao-shi-de-bo-ke/ . I am trying to make a bilingual version for the blogs. Maybe it will be online later. Listening to Tianyin Xu: Note…"
publishedAt: "2026-10-06T02:34:16Z"
category: "复盘"
categories: ["复盘"]
tags: ["AI", "GPU", "TLA"]
author: "GB"
draft: false
slug: "listening-to-tianyin-xu-notes-and-reflections"
legacySlug: "listening-to-tianyin-xu-notes-and-reflections"
oldSlugs: []
wordpressId: 1696
sourceUrl: "https://www.haibinlaiblog.top/index.php/listening-to-tianyin-xu-notes-and-reflections/"
commentCount: 1
viewCount: 159
likeCount: 1
dislikeCount: 0
showCitation: true
importedFromWordPress: true
---
<p>This blog is generated from <a href="https://www.haibinlaiblog.top/index.php/ting-tianyin-xu-lao-shi-de-bo-ke/">https://www.haibinlaiblog.top/index.php/ting-tianyin-xu-lao-shi-de-bo-ke/</a> . I am trying to make a bilingual version for the blogs. Maybe it will be online later.</p>
<h1>Listening to Tianyin Xu: Notes and Reflections</h1>
<blockquote>
<p>I first came across Professor Tianyin Xu while browsing faculty websites at different universities. His website was fascinating: it showed me that your interests and academic work could be presented in such a wonderfully hardcore way. Later, when I was in Chicago in 2025, I visited UIUC twice, but he happened to be away both times. I only found out afterward that he was at MSRA. Then I went to MSRA in 2026—and by then he had left again. Haha.</p>
<p>When I stumbled across Yueqiu Dashu’s podcast interview with Tianyin, I watched the whole thing in one sitting. Over two hours, they talked about his PhD applications, the beginning of his PhD and his work with his advisor, his doctoral research, his later experience advising students, stories from industry, his current research, and where AI might be heading. So much of it resonated with me and gave me new things to think about. It left me feeling genuinely happy. In this post, I want to share my reflections alongside the notes I took while watching.</p>
</blockquote>
<p>(Hi Tianyin—if you’re reading this, I’m really glad!)</p>
<p>Podcast video:
<a href="https://www.youtube.com/watch?v=N0QfgZsDBv8">https://www.youtube.com/watch?v=N0QfgZsDBv8</a></p>
<h2>“I Got Rejected by 24 Schools When Applying for a PhD”</h2>
<p>In Tianyin’s first PhD interview, the professor asked him three questions:</p>
<ol>
<li>Why do you want to do a PhD, and what are your career plans?</li>
<li>What are your strengths compared with your peers?</li>
<li>What kind of research do you want to do?</li>
</ol>
<p>None of these questions is technical. But they matter enormously when you are figuring out how to approach your PhD—or, for that matter, your life.</p>
<p>The professor also asked a few other excellent questions: What do you think it takes to become a professor? Does doing good research automatically mean you can be a good professor?</p>
<blockquote>
<p>I hadn’t really thought this through either. But as I listened to Tianyin explain it later, it became clearer: a professor has many other responsibilities, including advising students. That means understanding each student’s context, finding directions that interest them, and building exciting collaborations. As a researcher, you might primarily deal with problems; as a professor, you inevitably deal with people, who are much more complicated. You also need to understand what kind of work you enjoy, what you want to do, and how you approach your work. These themes come up again later in the conversation.</p>
</blockquote>
<p>The professor also asked Tianyin what his advantage was. Tianyin answered: working hard. But the professor said that was the default. Everyone works hard. What, then, is your actual advantage?</p>
<blockquote>
<p>As the later answers suggest, this is a deeply personal question. One part of it is finding what interests you: everyone has some problem they are willing to dig into. For me, I think the first thing is that I am fairly perceptive in what I notice and how I think; sometimes I approach things from a slightly different angle. Second, I think I am good at talking to different kinds of people. I have found that conversations are one of the fastest ways to generate ideas and new perspectives, whether the other person works in the tech industry, in a completely different field, or somewhere else entirely. Maybe dealing with people is one of the basic ways this world works? Third—and I think this matters most—I like thinking ahead: making long-term plans, staying with something, and putting in sustained effort. I believe that things you do over the long run can snowball, bringing greater and greater returns.</p>
</blockquote>
<p>What research do you want to do? What research do you <em>really</em> want to do?</p>
<blockquote>
<p>Hard question. Personally, I find work especially interesting when theory makes a real difference in actual systems.</p>
</blockquote>
<p>These interviews left Tianyin with the impression that research is intensely competitive. How do you win the game? Either do it really well, or don’t do it at all. It really can be that competitive.</p>
<p>After the rejections, he spent a year as a research assistant and “gave it another try,” applying for PhD programs again. YY—Yuanyuan—interviewed him. One conclusion Tianyin drew from that experience was that, in systems research, persistence and a willingness to fail can be enough to get you started as a researcher. (I rather like Tianyin’s combination of “I think I’m a bit slow” and “I’m not afraid of failure.”)</p>
<p>Host: Maybe you’re just a systems guy.</p>
<p>Tianyin: Yes. My advisor, YY, is against the idea of “inspiration”—the apple falling on Newton’s head, for example. As a systems researcher, you should think systematically about the problem in front of you. You have a problem; you work to understand it deeply. There should be a simple, elegant solution, rather than some clever gimmick. And in systems, clever gimmicks rarely work. (This reminds me of some of the off-the-cuff tricks I came up with when I was working on graphs.)</p>
<h2>Research</h2>
<p>Host: Let’s talk about your PhD research. Between your PhD and your years as a professor, you’ve received so many Best Paper awards. Could you tell us about one of those papers?</p>
<p>Tianyin:
PCheck was the second paper of my PhD. It was about fault-tolerant systems, and the faults we studied were configuration errors. Put simply, when a developer starts a program with incorrect settings, problems can be lurking inside the system. But YY asked: Why should a misconfiguration make the system stop working? Why are production systems so bad at handling misconfiguration? Even when someone gets a configuration wrong, can the system recover to some extent? We used fault injection and observed how the systems behaved. One thing we noticed was that, after we injected faults, a system could still look perfectly normal. The faults had not yet been activated, and everything appeared fine. Only when the affected functionality was used did something trigger a failure, turning it into a disaster.</p>
<p>The paper later won a Best Paper award. Of course I appreciated the recognition and was happy about it. But over time I came to think that Best Paper awards are highly random and subjective; they don’t really represent a paper’s value. I find that quite problematic. What is the standard? Sometimes one reviewer simply loves your paper, and that’s it. That is why I would like to see these awards abolished. Do the research you love most.</p>
<p>I think Test of Time awards are a better thing to look at, because good papers naturally stand out over time. But I’m not really a believer in awards. In an ideal environment, you would work on the problems you consider most important.</p>
<blockquote>
<p>The objective function should be to investigate and solve problems, not to accumulate credit of every kind. I have to admit that, in some places, the pursuit of achievement in research reaches a frankly absurd level. My own reasons for doing research are, in part, that I want the satisfaction of solving problems, and that I hope to make something. Perhaps that is simply a personal choice. I don’t have that strong a desire for fame, status, or money. I don’t think there is a right or wrong answer here.</p>
</blockquote>
<p>Back to the paper: what did we learn? Don’t blame users for misconfiguration. If users cannot figure out what is going on, that should be an engineering problem.</p>
<p>One case we encountered came from industry, at a storage company. Someone working remotely had to guess how to configure the system, and a failure could be extremely expensive.</p>
<p>So what was the significance of this paper? First, fixes: helping industry solve problems, because there were so many bugs. Second, a message to open-source developers: think about how people actually use your software. Third, it changed how other people thought. In a seminar with a professor working on security, a student proposed using machine learning to detect configuration errors. Stephen asked: Why not build the system properly in the first place, rather than use ML to detect the errors?</p>
<blockquote>
<p>Something suddenly clicked for me here. When I was in industry, I was always thinking about research oriented toward products or applications, or toward a company’s needs and scaling, because those approaches seemed more practical and more closely connected to the whole “industry–academia–research” ideal. But recently I have started reconsidering the purpose of research itself. Perhaps academic ideas need to be orthogonal to that way of thinking. Rather than asking how to “run our program on 10,000 GPU servers,” perhaps we should ask what an entirely different approach would look like. A professor once asked me to think about what I still couldn’t simply accomplish even if someone handed me 10,000 servers. Thinking this way has deepened my understanding of research. It has also made me pay less attention lately to problems that are already “solved”—for example, I tend to regard something an agent can handle automatically as already solvable.</p>
</blockquote>
<p>Today, our users are no longer just humans. Agents are using these systems too, and they also make mistakes with unfamiliar tools. (User misconfiguration.)</p>
<p>Host: That brings us to your recent blog posts.</p>
<p>Yes. Today’s systems were not originally designed to work with AI agents. One potentially low-cost way to reduce bugs in agent-written systems is to require proofs and have the agents write them. That is also why we introduced TLA+ and TLA+ proof systems. Agents can write all kinds of proofs. But the way agents write things also introduces plenty of bugs. We need to redesign the interfaces of all these systems—how to log in, and so on. Agents are going to become the primary users.</p>
<p>But this is also the biggest opportunity of this era for systems engineers. (Exactly what I thought back in March.) It is good news for systems research. Things that used to be very expensive to build can now be redesigned using agents.</p>
<p>Host: Systems work used to have to follow products and algorithms; the return on investment was too low otherwise. But AI is now developing so quickly that systems researchers are being pushed to think ahead about future AI systems.</p>
<p>Tianyin: In the past, if your work only functioned in a limited set of cases and wasn’t general, reviewers would see that as a problem. Now, if a system works well in one particular area, people think that is valuable. Getting one part genuinely solid can be enough.</p>
<h2>The PhD and the Advisor</h2>
<p>Host: Let’s talk about your advisor, Yuanyuan Zhou. On your website, you call her your “rock star advisor.”</p>
<p>Tianyin: Yes. She taught us so much: how to do research, how to understand a problem deeply, how to think differently. She made me passionate about research. She is very demanding and direct. You probably also know that she has founded several companies, all with very good results. You can feel her drive, and learn from her qualities that matter in both industry and academia.</p>
<blockquote>
<p>I have also watched Yuanyuan Zhou talk about entrepreneurship and shared her talk at a group meeting, although I didn’t leave much of a written record or summary: <a href="https://www.haibinlaiblog.top/index.php/yuanyuan-zhou/">https://www.haibinlaiblog.top/index.php/yuanyuan-zhou/</a></p>
</blockquote>
<p>I feel that my advisor and I were a very good match. She founded three successful companies, and I spent three years listening to her startup stories. At the core were innovation and excellence. Academic research and entrepreneurship have a great deal in common. I picked up many ideas from those stories of building successful companies.</p>
<p><strong>Why did you become a professor at UIUC?</strong></p>
<p>My advisor had wonderful memories of the place. More generally, when I consider an offer, I look at what kind of platform that place would give me. Can I find good mentors and collaborators there? As for choosing academia, I genuinely wanted to be an advisor. (Yes!) That made it a good choice.</p>
<blockquote>
<p>There really is a lot of chance and coincidence in the choices that shape a life.</p>
</blockquote>
<p><strong>What kind of students do you most like working with?</strong></p>
<p>I feel this is a little like asking: What kind of partner are you looking for? Tianyin’s personal view is that it is difficult to know whether two people are a good match or whether things will work out. Perhaps what I hope for is a closer relationship? (Another perspective: advising can involve bias, so try to give students objective advice when thinking about their interests.) Think of teammates in a soccer match, or teammates in CS. An ambitious project requires trust, and everyone has to go all out for the rebound. We are here to win, not just to have fun.</p>
<p>Host: What kind of students would you not want to work with? Tianyin: It is “re”-search, as long as you keep doing the “re.” You can do research even at a startup, although industry may not be able to support the kind of fundamental research associated with “wanghong dengyu.” Research in universities and industry may therefore look different. But if a student’s research interests lie along a genuinely different dimension from the professor’s, the professor might not take them on.</p>
<p>Speaking of industry, Tianyin spent a year at Facebook. There was no systems research group completely detached from production. (Serving production is the most important thing for systems.) The pace of product work was so fast that there was hardly any time to stop and think about what general ideas might be emerging. After the work was done, they reflected on it: what could be improved, and what could be done better? They then brought those lessons together and published them at OSDI.</p>
<blockquote>
<p>This connects to something I have been thinking about recently: compared with industry, what does academia still have left? I ended up with a conclusion that may sound a bit unflattering: academia can “slow down.” Research in industry almost always comes with some practical objective or KPI, and sometimes there simply isn’t much time to stop and think about what actually happened. Of course, plenty of people can move fast and still understand things deeply. But am I one of those people? And what kinds of problems do I enjoy? Seen this way, I don’t think academia has become entirely replaceable. Some people also suggest that AI might sweep through most research with overwhelming ease. I don’t know. My sense is that, with deeper research, there is always some obstacle—cost, direction, interest, or something else. Perhaps research will eventually just become an ordinary profession.</p>
</blockquote>
<p><strong>What should you focus on during the first two years of a PhD? What about in the AI era?</strong></p>
<p>Reading a hundred papers is not good practice. I am against trying to get ideas from papers. Every paper has its own biases, and looking for ideas by reading papers is not a good way to innovate. It is like being fed animal feed.
A better approach, I think, is to develop ideas from real problems. If a problem is important and difficult, you can start investigating it. Don’t just read the limitations section of a Best Paper and decide to work on that. Work on a problem because it is important and hard.</p>
<h2>Doing a PhD in the AI Era</h2>
<p><strong>What should students do when they are just starting a PhD straight out of undergrad?</strong></p>
<p>I think it is the advisor’s job to give them some problems to work on. Getting practical experience alongside more senior students is a good start. Professors are not necessarily working hands-on with students, so tackling difficult problems with senior students can be a useful starting point.</p>
<p><strong>In the AI era, you can create new things simply by continuing to talk to an agent. What does that mean for universities?</strong></p>
<p>An agent is impersonal, and its understanding is not all-encompassing. It can improve our productivity and capabilities in systems work. Have faith in human taste. The future may still be a world led by people. Thinking about what happens after AGI is too far off; it is like thinking about the end of the world. Don’t dwell on it so much. Look just a little way ahead, and use the agents we have today to improve your ability to work and learn.</p>
<blockquote>
<p>Understanding a person is difficult, because a person is made of so many things—not just something as simple as programming. After thinking about this for several months, I believe it firmly: once we stop seeing people as one-dimensional, there are so many colorful experiences and stories to discover. <a href="https://www.haibinlaiblog.top/index.php/%e6%b2%a1%e6%9c%89%e4%ba%ba%e7%b1%bb%e4%ba%86/">https://www.haibinlaiblog.top/index.php/%e6%b2%a1%e6%9c%89%e4%ba%ba%e7%b1%bb%e4%ba%86/</a></p>
</blockquote>
<p>At UIUC, many PhD students also feel anxious about agents. But I don’t feel that way. Figure out what you want to do each day. You don’t need to keep thinking five or ten years into the future. Keep doing research, and make sure you stay open-minded. You need a main thread to follow.</p>
<p><strong>That reminds me: some conferences this year have already received too many papers because of agents. Perhaps papers themselves need to change?</strong></p>
<p>That can be true in particular contexts. But I believe writing papers is important.</p>
<p>If your contribution is an artifact, then perhaps an abstract explaining how to use it really is enough. But much research is about communicating a line of thought. Lamport has said that writing is one of the main processes through which a person comes to understand something clearly.</p>
<p>Learning to write papers is really training yourself to think a problem through. It is not just about communicating with reviewers. More importantly, it helps PhD students figure out what they themselves are doing.</p>
<blockquote>
<p>This is so well put. It also explains why I still write this blog. Expressing something in a structured way really does help you think it through more thoroughly and arrive at a deeper, structured understanding of it. In LLM terms, perhaps it is a bit like doing RL to keep training yourself: you need to do some decoding.</p>
</blockquote>
<p><strong>What do you think about the sheer number of papers at ICLR? Writing papers may benefit the authors, but hasn’t the reviewing system already broken down?</strong></p>
<p>I think the problem is that this system doesn’t scale. The question is how to make a conference, as a “system,” scalable—not to throw away features simply because there are too many requests. There will inevitably be changes. This is a systems research problem. AI will raise the bar. In the past, some work stood out because it required a huge engineering effort or a special skill. AI changes that. A person plus AI is not necessarily better than Terence Tao. But strong people will get stronger, and the very best will get stronger too.</p>
<blockquote>
<p>What a great perspective: think about the peer-review system as a system.</p>
</blockquote>
<p><strong>You’ve won so many awards in systems. How do you view them?</strong></p>
<p>I feel I have just been lucky. Even though I have won fewer awards in recent years, I don’t think the quality of my papers has declined very much.</p>
<p><strong>How do you keep producing good research?</strong></p>
<p>Find good students, and you can produce high-quality work. Then the question is how to help each person learn how to do it.
There may be two separate questions: how to recruit students, and how to advise them.</p>
<p>Tianyin doesn’t seem too worried about this. He looks for rapport and a sense that things click. After all, understanding a student—or any person—is difficult. Think of dating apps: how accurate are they, really?</p>
<p>The central job of an advisor, then, is to help students discover and carry out the research they want to do. A student is not simply someone working under the advisor; the relationship should provide a space for the student’s own growth. Understand the student first, then think about how to help them grow. Draw on experience when choosing problems. Trust students to contribute. Learn how to interact with them, and believe that their contribution is your contribution. All of this takes growth and time spent together.</p>
<p>And understanding a person, then helping that student grow, is something AI finds very difficult.</p>
<p>Fight dragons, not windmills. Help students find a real problem, and find meaning in their research.</p>
<blockquote>
<p>This is a wonderful description of the advisor–student relationship. Every advisor may approach it differently, but the important thing is that it is more a relationship of collaboration and guidance—not simply passively following instructions or doing whatever you are told.</p>
</blockquote>
<p><strong>How do you find real-world problems at UIUC, far from Silicon Valley?</strong></p>
<p>There are only so many fundamental problems. In systems, perhaps we should work on the more fundamental ones.
They may manifest differently in different settings. Reliability, for example, leads to questions about how to deal with asynchrony, concurrency, and nondeterminism.</p>
<p>Start by solving “small problems.” Dig deeply enough, and those supposedly small problems turn out to be big ones.</p>
<p><strong>How do you help a student find such a problem?</strong></p>
<p>Find their interests—whether in theory or in really getting to the bottom of things through hacking—and connect those interests to important real-world problems. Start from empirical cases.</p>
<h2>AI and Operating Systems</h2>
<p><strong>People say your operating systems course at UIUC is excellent. How do you teach it?</strong></p>
<p>Maybe it’s because I tell a few jokes. (Laughs.)
At UIUC, operating systems teaching is split into two courses:</p>
<ol>
<li>Systems programming: process control, <code>malloc</code>, and shells. Foundational training.</li>
<li>Kernel programming: what happens inside the kernel, and how to write kernel code; eBPF.</li>
</ol>
<p>But even after the kernel programming course, fewer than 5% of students will go on to work on operating systems such as Linux. The other 95% will still work on things like AI infrastructure and Kubernetes. So what is the point of an OS course? Why is it valuable? Because kernel hacking and dealing with complexity are central to working on large engineering projects.
Before this course, students’ classes have mostly been about building something from scratch. Now they are learning to work inside a large existing project. That is enormously important, especially when you are dealing with a big company’s codebase. These are some of the most important challenges. If students come away with the confidence to face the dragon, that is the most meaningful thing an OS course can give them. These are courses worth learning properly.</p>
<p>What these courses really teach is a way of thinking about computer engineering.</p>
<blockquote>
<p>This puts the core skill I learned in my own course into the plainest possible words. <a href="https://ncesnext.com/course/8472#review-6308">https://ncesnext.com/course/8472#review-6308</a> The course teaches you to settle down, figure out what is happening inside a large system, and become comfortable finding your way through it.</p>
</blockquote>
<p><strong>But with AI and the shift in people’s attention, the job market for programmers is no longer as large.</strong></p>
<p>I think it will shrink, and there will be fewer simple jobs. But I don’t think operating systems will disappear—or at least, these ways of thinking won’t.</p>
<p><strong>Turning to your research on AI reliability: how much of what humans do can AI now do?</strong></p>
<p>Today, GPT 5.6 sol is already extremely powerful. AI can basically solve all of these things.</p>
<p>The questions are how to do it, and at what cost. AI does not lack capability, but there may still be room for guidance in direction and interests. The human role is to provide that guidance. AI is like a very smart person. Imagine a company with an absurd number of people and an absurd amount of energy: how do you divide up the work and collaborate with all these junior engineers?</p>
<p><strong>But if the smart people spend all their time directing AI and agents, how do junior students become those “people”?</strong></p>
<p>Perhaps learning to go from junior to capable isn’t quite that difficult? Learning used to be human-centric. Now perhaps you can use AI to practice doing research?</p>
<p>Host: Not necessarily. First, you may be so junior that you cannot get much high-quality discussion out of AI. Second, people used to become more capable by working their way up.</p>
<p>Response:</p>
<ol>
<li>Mentorship is still needed. That is why advisors matter.</li>
<li>The market really is shrinking, and I don’t know what to do about that either.</li>
</ol>
<h2>SREGym</h2>
<p><strong>You previously built a benchmark to measure how AI’s capabilities are evolving, right?</strong></p>
<p>Yes: AI SRE, or SREGym. It tests whether AI can handle real operational scenarios. With the latest models, it should be possible to solve about 90% of the problems.</p>
<p>At the end of last year—4.6, 4.8—there was a fundamental leap. The earlier problems could all be solved. Benchmarks are built around AI’s capabilities; having problems that are too hard or too easy is actually the right outcome. This is the challenge benchmarks face right now. (It is also something we have encountered in our own papers.)</p>
<p>What makes a good benchmark? In principle, you could have AI grind through LeetCode. Is LeetCode a good benchmark? It used to be, but perhaps not anymore.</p>
<p>There is also another question: AI is strong in small environments, but is it strong in large ones? We don’t know. One thing to focus on is how to use a small environment to simulate a large one, and whether a simulator can help us find out. If things are too complex, approaches like RL are hard to get off the ground. SRE also needs bugs that arise online, in running systems.</p>
<p>So we built a training ground for AI: how can we simulate production failures? At UIUC, we had students read postmortems of production incidents and then reproduce the failures in small simulated environments.
What we found was that, even though a small environment cannot fully represent a large one, AI still wasn’t all that strong. First, students got a great deal of practice and discovered problems companies were facing. Second, abstracting those problems into small simulators could support RL, as long as the environment helps the model improve its capabilities. Demand for this kind of SRE environment will keep growing.</p>
<p>We need more of these small training grounds for AI!</p>
<blockquote>
<p>This is really inspiring work, and it is genuinely well executed.</p>
</blockquote>
<h2>AI for Formal Methods</h2>
<p><strong>Could you introduce your work on model checking?</strong></p>
<p>We use TLA+, a formal language that can describe a system’s behavior and let us derive properties of that system. We check properties against a model, which helps us debug or examine how the system behaves.</p>
<p>But the question is: how do you express the system in that language? One former PhD student spent a full five years working on this with TLA+. He had to learn it, write a specification and invariants, and develop a very deep understanding of what the system was doing. He was specifying a real system, ZooKeeper, which uses ZAB. He had to learn ZAB and understand how ZooKeeper implements it, then write and refine the model as his understanding evolved. Only after that could he use tools for checking and proofs.</p>
<p>It was five years spent sharpening a single sword: exhausting, but with excellent results. Problems that had remained unresolved for years were finally solved. Unfortunately, the cost was enormous: one PhD student, five years. Today, however, AI needs only five hours. It writes very well and understands the system very well. What remains unresolved is how to model the system in the first place. You have to leave some things out and keep others. That takes the experience of a seasoned practitioner.</p>
<p>The approach is to ask which parts are tricky and which are unlikely to go wrong. A human draws on experience with failures to decide what to model, then guides the AI toward writing those parts. After that, formal methods can be applied. One challenge is reward hacking: AI can produce something that looks good but is not what you actually wanted. You have to understand the process step by step. Many companies are now working on this: AI for formal methods.</p>
<p>Host: So this sounds like a great startup idea.
Yes. AI makes it genuinely possible to apply these methods at scale.</p>
<ol>
<li>The productivity gains are extraordinary. Earlier work has already paved the way. Formal methods used to be so expensive and labor-intensive that only NASA would do them; Silicon Valley couldn’t. Once AI automates the work, the economics can make sense.</li>
<li>You can use mathematical tools to verify the behavior of your system. Debugging finds a problem after something goes wrong; this approach can verify and uncover problems beforehand. Think of EC2 and other services with high reliability requirements, or Azure and AWS. The barrier is getting lower.</li>
<li>Cost depends on what you want to achieve: $2,000, five days—for a proof. Model checking is already available for verification today.</li>
</ol>
<p>AI for formal methods is a very promising idea for both academia and industry.</p>
<p>But I still want to emphasize an issue here. Reliability means that your system’s code agrees with your specification. Yet what are your requirements or specification? What kind of system do the engineers or users actually need? Model checking cannot answer those questions. It can only verify whether the code meets your expectations. Engineers still have to decide what those expectations are.</p>
<p>Host: That sounds like a promising career: helping people solve systems problems. Now it connects with agents as well—using AI tools to help repair systems and build better AI-native ones.</p>
<h2>The Future of AI Systems Research</h2>
<p><strong>What would you like operating systems to become?</strong></p>
<p>Reliable. Eighty percent will be for agents. How can a system tolerate what AI does and give it feedback? Without solving these issues, we cannot solve the ultimate problem.</p>
<p>The principles are already there. Recovery-Oriented Computing, or ROC: David Patterson. Computers will always fail, so we should invest in recovery. The idea was human-oriented. When industrial systems fail, is the problem the hardware or the people? A series of studies found that people, rather than machines, were the most error-prone part. NonStop systems. Empirical studies.</p>
<p>We cannot assume users will never make mistakes. What we need is a way to retry or undo an operation when a user does something wrong.
There was an email server with an undo capability. Then there is microrebooting: when a system encounters an error, restart it. Seventy percent of fixes amount to a restart, but that can be expensive in industry. Can we restart only part of the system instead? (Serverless, or microrebooting.) Now that we are dealing with agents, we can think about how they should operate in these new systems. For example, could we build a system in which every action an agent takes can be undone?</p>
<p>AI systems are developing so quickly. How do I slow down, think something through, and build a system that agents can keep using even as they constantly change? In the past, reliability and safety were less important than performance; we could rely on test cases and insurance. Agents make these issues much more important. On the one hand, agents can write fast code. On the other, they introduce many reliability problems. Those are the problems to solve now: trustworthy AI.</p>
<h2>Internships, Work, and Planning a Life</h2>
<p><strong>Why did you come to the Bay Area?</strong></p>
<p>I never plan three to five years ahead. I only plan for the current year. After six years of work, the university allows a one-academic-year sabbatical. It is a chance to see a different environment and discover good things elsewhere. I talked with Ion Stoica and attended a retreat where students gave presentations and people from both industry and academia came together. Most universities and professors welcome visitors and people on sabbatical. I chose UC Berkeley because its research style is very different. (UIUC and MIT are different too.) There is room for different worldviews and different ways of approaching research. There is no single standard. Academia lets a hundred flowers bloom, and different approaches can all produce something beautiful. You can go to different places, talk to people, and look for things that haven’t been standardized. Those are also things agents find difficult.</p>
<blockquote>
<p>Going to different places and experiencing different styles and ways of doing things is so important. Otherwise, it is all too easy to become a frog at the bottom of a well. I feel this deeply, and I hope to keep going to more places and experiencing more things, so that I can develop a better understanding of myself. I have also always hoped that younger students would venture beyond their home campus for internships and exchanges. These are wonderful opportunities to broaden your horizons and gain access to new information. GPA is a temporary goal; it matters much less once you are out of undergrad. Meaningful long-term goals give you a better chance to build momentum that snowballs. There was also an interesting recent article called “Let Undergraduates Be Undergraduates Again.” Personally, I think you need to find what you want to do and then commit to it wholeheartedly, rather than doing a breadth-first search (BFS), picking up a bit of this and a bit of that without letting anything accumulate.</p>
</blockquote>
<p>You’ve spent time in industry and done internships at places such as NetApp, Meta, and MSRA.</p>
<p><strong>What is the difference between computer science research in industry and in academia?</strong></p>
<p>The essence is the same, but it takes different forms. Academia has fewer resources now, so it needs to do more fundamental work.
Industry research is tested in practice. Its time horizons, impact, style, and goals are different. It depends on what kind of research you are talking about.</p>
<blockquote>
<p>I want to do practical research. I want to imagine the world of the future. (That is the conclusion I have reached from what I’ve been thinking about recently.)</p>
</blockquote>
<p>Host: Junchen thinks that when PhD students go into industry, they shouldn’t go there to do research. They should go to learn from engineers and gain those insights, then see whether that helps them do better research.</p>
<p>Personally, I really encourage internships. I want students to see different systems and different things, work with different people, and do different kinds of work. My first internship was about applying my own paper in industry. Back then, I would often ask colleagues: What are the most important problems in your work? Then I would distill those problems afterward. Academia is no longer where it was in 1970. Industry is now well ahead of academia. Industry publishes one MapReduce paper, and academia follows it with thousands of papers optimizing MapReduce.</p>
<p><strong>Suppose you have two offers: a core engineering role at Google, or a professorship at a top university. How do you choose?</strong></p>
<p>I think that is personal. Finances, interests—there is no formula. You might end up tightening screws in a beautiful system. (Working on a small team inside a big company might not be that exciting.)</p>
<p>But a few things matter most to me:</p>
<p>Key considerations:</p>
<ol>
<li>What can you learn? This matters most. What does this job make you think about? What do you want to do next?</li>
<li>What kind of people do you want to work with? Working with people who are passionate about technology feels different. I want to collaborate with exciting people. There are companies and teams I would join even if they didn’t pay me.</li>
<li>Money. If you’re broke, maybe you just take the job. Haha.</li>
</ol>
<p>In industry, you can do incredibly exciting work, or incredibly boring work. You need to think clearly about what you want. You need to have passion.</p>
<p>Your first job is not your forever job. Keep learning, and you can keep finding better jobs. You have to keep learning. The most important thing is the ability to continue learning. One advantage of academia is that you are constantly doing that. Money and other considerations are less clear-cut. As long as you retain the ability to learn, you will always find a way, wherever you end up. That is something you can trust in a person. Perhaps it is also part of what connects people, and part of what being a student means.</p>
<p><strong>What advice would you give students on developing themselves into good PhD researchers?</strong></p>
<p>I don’t know. It might be bad advice.</p>
<ol>
<li>Find a problem you love. Only when you really enjoy something does it stop feeling exhausting. That is very difficult, but you will find things you love.</li>
<li>Find the right way of doing research for you, whether it is fast or slow.</li>
<li>Keep refining your skill set. Once you know what you are trying to accomplish, you can keep moving toward it.</li>
</ol>
<p>Perhaps better advice comes from mentors. Look at people who grow quickly: have they found mentors who give them timely feedback? Getting that feedback matters, and finding someone willing to invest in you may be the most important thing. These are all lifelong questions about how to keep learning. For example, YY once talked about how, when starting a company, they used an existing technique and went looking for something to apply it to—a hammer looking for a nail. They later realized that this wasn’t a very good idea. A better approach was to observe the most important problems directly: find the nail first, then make a hammer.</p>
<p><strong>How would you advise a student who wants to build practical systems from the very beginning?</strong></p>
<p>That is fine. The same three things still matter. Find the core problem. Don’t focus on papers; focus on the frontier or on things that matter. Find an important problem, and you will be fine. I think creative work is a good thing in all its forms. The key question is whether the place you are in can help you do it.</p>
<blockquote>
<p>Companies really do think very differently from universities.</p>
</blockquote>
<h2>Closing Thoughts</h2>
<p>Host: I’ve heard that when founders start companies, there needs to be a fit between the person and the work: who you are at your core should align with what you are doing. I think today’s conversation has shown us that Tianyin really is a top researcher.</p>
<p>Tianyin: There’s no need to talk about being “top.” If you enjoy doing research, that is already wonderful. (Too modest!)</p>
<blockquote>
<p>I have already shared most of my thoughts on how to view research in today’s AI era, and on how to do it. At the end of this post, I want to give myself an answer to one question: Why do I want to do research?</p>
<p>When I had just started the program, a new classmate asked me why I was doing this PhD. Honestly, my mind went blank. Over the past six months, agents have turned half of computer science upside down. Recently, the sheer power of AI drained away much of my enthusiasm for research. “If our AI overlords can handle it anyway, why should I bother?” I also started getting restless when reading papers. “Industry has more people and more resources. Will there even be any scraps left for me?” I would often stop making progress, or simply sit there watching an agent stream out text, line after line.</p>
<p>I started asking myself again why I wanted to do research. In the end, perhaps the answer is simply that figuring something out is fun. You read someone else’s ideas, and suddenly this thunderbolt of a grand idea hits you: what if we did it a different way? You code like you’re pulling off a bank heist, only to discover that your homemade C4 has blown up in your face. Then there you are at the group meeting, red-faced and sweating over the pile of shit you plotted with Codex and matplotlib, squeezing out one word at a time at the speed of a stalled GPT. The only thing more deafening than “So you did nothing this week?” is the silence of the entire room. Your advisor stops thinking. Your labmates give up on having brains. Finally, someone says, “Well, keep working on it next week,” and you exit the meeting faster than you quit a solo-queue game after going 0–16–0. Beyond all that, writing C++ used to be a source of both pain and joy in my research. But AI hasn’t just taken away the pain of coding. It has taken away the fun too. Now, when I use AI to code, all that is left is a goal and a sense of numbness. A “1.xx× speedup” no longer makes me happy. I’m sure plenty of recent articles express some version of this: agents have taken over our talents, collaborating with agents is the future, and we are all supposed to become boy and girl geniuses, come up with some “Ah A Is Coding” thing, and construct the perfect path through life.</p>
<p>Aureliano, it’s raining in Macondo!</p>
<p>I started thinking about why I had chosen HPC research. At first, I simply thought the field was interesting: it involved low-level systems, while the applications higher up involved science. I had seriously considered—and even planned on—moving from HPC into a PhD in Earth science or astronomy after finishing my undergraduate degree, to do research that might feel “exciting” to me. Later, of course, I realized that HPC was an exciting story in its own right, so here I am. But I think I can still keep doing whatever I want. After I finish, for example, I could go straight into another PhD in Earth science. Or I could just play around with open datasets and an agent, and do something genuinely meaningful.</p>
<p>Yes: once I took the metrics out of research, I started feeling genuinely happy again. That is why I finally decided that my goal for this PhD is to keep living as an ordinary human being. I’ll do what I want. If I want to publish a paper, I’ll publish one. If I want to write a blog, I’ll write one. If I want to graduate and get the hell out, I can go be homeless. Don’t let your GPA or paper count put a fence around your life. I remember a community called “Against the Social Clock,” where people were trying things I thought were wonderful. I think life is a deeply personal thing—which is another way of saying that people are complicated. I don’t want my research or my life to be generated by GPT-Astra. Research is my way of bringing new ideas into this world. (New garbage, too.) And life is simply life: suffering, travel, longing, chocolate, and the first sip of Coke in summer.</p>
</blockquote>
