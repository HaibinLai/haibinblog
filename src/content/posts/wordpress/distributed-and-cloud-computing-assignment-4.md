---
title: "Distributed and Cloud Computing Assignment 4"
description: "Feedback Feedback to Learner 12/30/25 3:55 PM 82+5=87 (extra: 0) > Summary: As we demonstrated in the lab, you should pre-assign labels and taints to cluster nodes using Kind config YAML. Other parts are all perfect! >…"
publishedAt: "2026-01-06T20:32:26Z"
updatedAt: "2026-01-06T20:34:44Z"
category: "Distributed Systems"
categories: ["Distributed Systems"]
tags: ["Distributed System"]
author: "GB"
draft: false
slug: "distributed-and-cloud-computing-assignment-4"
legacySlug: "distributed-and-cloud-computing-assignment-4"
oldSlugs: []
wordpressId: 1140
sourceUrl: "https://www.haibinlaiblog.top/index.php/distributed-and-cloud-computing-assignment-4/"
commentCount: 0
viewCount: 859
likeCount: 0
dislikeCount: 0
showCitation: true
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2026-01/distributed-and-cloud-computing-assignment-4.webp"
---
<h2>Feedback</h2>
<pre><code class="language-txt">Feedback to Learner
12/30/25 3:55 PM
82+5=87 (extra: 0)

> Summary: As we demonstrated in the lab, you should pre-assign labels and taints to cluster nodes using Kind config YAML. Other parts are all perfect!

> T0 - K8s Resource
1. Container: no pod ip env, but it&#039;s probably okay to infer from socket.gethostbyname (-0) from my test it worked so you will have the points

> T0 - Report
2. recommended to use declarative approach rather than imperative to update image version tag: this avoids unexpected drift between your maintained desired states of your infra and the actual states (-0 to be nice)
3. nice analysis with figures!

> T1 - Kind
4. no labels applied (-15)
5. no taints applied (-3)
6. check the instructions: we require you to &quot;pre-assign&quot; them to the cluster nodes and we have showed you examples during the lab

> T1 - Report
7. you mentioned the order as 2 -&gt; 3 -&gt; 4 -&gt; 5 -&gt; 1, which is not correct, should be 2/3 -&gt; 1 -&gt; 4/5 if toleration is applied (-0 since your table indicates your answer and it is more important for me to grade)
8. when you gradually scale out, it might be better to wait for a bit so there will not be multiple pods with AGE=0s in the result, making it a bit clearer and easier to verify (-0 to be nice)

> Bonus
9. MPI - larger matrix sizes: this is a hard choice. When more memory is consumed for matrix data and processes, the program is easier to encounter segmentation fault.
10. Parallel BFS / MP impl with MPI: Yes, Parallel BFS is a nice option we have considered at the beginning of the semester but did not have time to rollout our A1 (+5) For MP with MPI, maybe this is not very straightforward since we have already mentioned their main difference in the lab - where the data is and how the data is distributed. Some students suggest implementing MPI from scratch, which sounds better but of couse, difficult (we will discuss a bit later)
11. NCCL &amp; Kookkos: sounds like a nice extension of HPC-relevant content! (+0 since you&#039;ve reached max bonus)
12. A2 listing APIs: they are clearly mentioned in the instructions PDF.
13. benchmark A2: really enjoy your experiments with hey and the course selection analysis. Will consider in the future so the students have more concrete stuff to write about their experiments! (+0 since you&#039;ve reached max bonus)
14. A3 paper reading: nice idea and we will consider doing this in the future (+0 since you&#039;ve reached max bonus)
15. A3 self-checking: an easy way is to compare the results with a pure python impl.
16. FaaS + K8s: in K8s, serverless functions may be similar to the Job concept; actually, we have planned to extend A4 to include a FaaS + IaC task in the future (+0)
17. very nice blog you have there! It makes me sad for 5s as now all the assignments are public for future students, but why not? you have good designs and nice experiments to share with other learners over the internet, which is cool. no worries, it will just take me a bit more time to think about other interesting assignments within the same topic. Keep up with your work!</code></pre>
<p>Haibin Lai
12211612</p>
<p>In this assignment, we built a k8s cluster.</p>
<h2>Install k8s</h2>
<pre><code class="language-bash">curl -LO &quot;https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl&quot;
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl</code></pre>
<p>(If you don't have the root access, use the following command to install it)</p>
<pre><code class="language-bash">chmod +x kubectl
mkdir -p ~/.local/bin
mv ./kubectl ~/.local/bin/kubectl</code></pre>
<p>Install <code>kind</code></p>
<pre><code class="language-bash">mkdir -p ~/.local/bin
curl -Lo ~/.local/bin/kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ~/.local/bin/kind
echo &#039;export PATH=&quot;$HOME/.local/bin:$PATH&quot;&#039; &gt;&gt; ~/.bashrc
source ~/.bashrc</code></pre>
<h2>Task 0</h2>
<h3>Change Flask Server</h3>
<p>We design a server than can send its pod name, pod IP, and node name.</p>
<p>Also, according to the blog <a href="https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-terminating-with-grace">https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-terminating-with-grace</a> ,  k8s will send SIGTEM signal when shutdown. So we add <code>handle_sigterm</code> function to shutdown the server gracefully.</p>
<pre><code class="language-python">from flask import Flask
import os
import socket
import signal
import sys

app = Flask(__name__)

# ---- Graceful Shutdown ----
def handle_sigterm(signum, frame):
    print(&quot;Received SIGTERM, shutting down gracefully...&quot;)
    sys.exit(0)

# SIGTERM
signal.signal(signal.SIGTERM, handle_sigterm)

@app.route(&quot;/&quot;)
def hello():
    pod_name = os.getenv(&quot;POD_NAME&quot;, socket.gethostname())
    node_name = os.getenv(&quot;NODE_NAME&quot;, &quot;unknown-node&quot;)

    # Pod IP
    try:
        pod_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        pod_ip = &quot;unknown-ip&quot;

    return (
        f&quot;Hello from pod={pod_name}, &quot;
        f&quot;ip={pod_ip}, &quot;
        f&quot;node={node_name}!\n&quot;
    )

@app.route(&quot;/chat/&lt;username&gt;&quot;)
def chat(username):
    return f&quot;Hello {username}! Greetings from Kubernetes pod.\n&quot;

if __name__ == &quot;__main__&quot;:
    port = int(os.getenv(&quot;FLASK_PORT&quot;, 5000))
    app.run(host=&quot;0.0.0.0&quot;, port=port)
</code></pre>
<p>Dockerfile:</p>
<pre><code class="language-bash">FROM python:3-slim

WORKDIR /app

COPY requirements.txt app.py ./
RUN pip3 install --no-cache-dir -r requirements.txt

CMD [ &quot;python&quot;, &quot;app.py&quot; ]</code></pre>
<p>build the image of the modified Python Flask server via Dockerfile:</p>
<pre><code class="language-bash">docker build -t flask-app:1.0.0 .</code></pre>
<h3>Create cluster</h3>
<p>Kind cluster configuration:
kind-config.yaml:</p>
<pre><code class="language-txt"># a 4-node k8s cluster (1 control plane + 3 worker nodes)
# t0/kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
  - role: worker</code></pre>
<p>A 4-node cluster (1 control plane + 3 worker nodes).</p>
<p>The <code>flask-dep</code> Deployment defines a desired state of four Flask pods, each running the container image <code>flask-app:1.0.0</code>. Kubernetes continuously maintains this state by creating, replacing, or rescheduling pods as needed. Environment variables <code>POD_NAME</code> and <code>NODE_NAME</code> are injected via the Downward API so that each pod can report its identity and runtime location.</p>
<p>K8s resource configuration</p>
<pre><code class="language-txt">apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask-dep
spec:
  replicas: 4
  selector:
    matchLabels:
      app: flask
  template:
    metadata:
      labels:
        app: flask
    spec:
      containers:
      - name: flask
        image: flask-app:1.0.0  # image name
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5000
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
---
apiVersion: v1
kind: Service
metadata:
  name: flask-svc
spec:
  selector:
    app: flask
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP</code></pre>
<p>The <code>flask-svc</code> Service exposes all pods labeled <code>app=flask</code> under a single stable virtual endpoint. It load-balances incoming traffic across the four pod replicas using kube-proxy, giving the client a unified access point while abstracting away pod IP changes.</p>
<p>Use command <code>kind create cluster --name a4 --config kind-config.yaml</code> to create the cluster.</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kind create cluster --name a4 --config kind-config.yaml
Creating cluster &quot;a4&quot; ...
 ✓ Ensuring node image (kindest/node:v1.30.0) 🖼
 ✓ Preparing nodes 📦 📦 📦 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
 ✓ Joining worker nodes 🚜
Set kubectl context to &quot;kind-a4&quot;
You can now use your cluster with:

kubectl cluster-info --context kind-a4

Have a question, bug, or feature request? Let us know! https://kind.sigs.k8s.io/#community 🙂
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kubectl get nodes
NAME               STATUS   ROLES           AGE   VERSION
a4-control-plane   Ready    control-plane   34s   v1.30.0
a4-worker          Ready    &lt;none&gt;          15s   v1.30.0
a4-worker2         Ready    &lt;none&gt;          15s   v1.30.0
a4-worker3         Ready    &lt;none&gt;          14s   v1.30.0</code></pre>
<h3>load the image</h3>
<pre><code class="language-txt">kind load docker-image flask-app:1.0.0 --name a4</code></pre>
<pre><code class="language-txt">kubectl describe nodes | grep -i image</code></pre>
<p>Load my local docker images into the Kind cluster nodes.</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kind load docker-image flask-app:1.0.0 --name a4
Image: &quot;flask-app:1.0.0&quot; with ID &quot;sha256:3ae216d03526d0f294123acba1462b08fa15db6052533ae9580ab82aa3c6e5cd&quot; not yet present on node &quot;a4-control-plane&quot;, loading...
Image: &quot;flask-app:1.0.0&quot; with ID &quot;sha256:3ae216d03526d0f294123acba1462b08fa15db6052533ae9580ab82aa3c6e5cd&quot; not yet present on node &quot;a4-worker2&quot;, loading...
Image: &quot;flask-app:1.0.0&quot; with ID &quot;sha256:3ae216d03526d0f294123acba1462b08fa15db6052533ae9580ab82aa3c6e5cd&quot; not yet present on node &quot;a4-worker&quot;, loading...
Image: &quot;flask-app:1.0.0&quot; with ID &quot;sha256:3ae216d03526d0f294123acba1462b08fa15db6052533ae9580ab82aa3c6e5cd&quot; not yet present on node &quot;a4-worker3&quot;, loading...
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kubectl describe nodes | grep -i image
  OS Image:                   Debian GNU/Linux 12 (bookworm)
  OS Image:                   Debian GNU/Linux 12 (bookworm)
  OS Image:                   Debian GNU/Linux 12 (bookworm)
  OS Image:                   Debian GNU/Linux 12 (bookworm)
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kubectl apply -f t0.yaml
deployment.apps/flask-dep created
service/flask-svc created
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kubectl get pods -o wide
NAME                         READY   STATUS    RESTARTS   AGE   IP           NODE         NOMINATED NODE   READINESS GATES
flask-dep-75d4749db4-k9mql   1/1     Running   0          8s    10.244.1.2   a4-worker    &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-knjx7   1/1     Running   0          8s    10.244.3.2   a4-worker3   &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-ll2ts   1/1     Running   0          8s    10.244.2.2   a4-worker2   &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-vjqc8   1/1     Running   0          8s    10.244.3.3   a4-worker3   &lt;none&gt;           &lt;none&gt;</code></pre>
<h3>Testing</h3>
<p>Send multiple requests to the exposed service to test the modified root API.</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/codebase/t0$ kubectl run curl-pod --image=curlimages/curl:8.10.1 --restart=Never -it -- sh
All commands and output from this session will be recorded in container logs, including credentials and sensitive information passed through the command prompt.
If you don&#039;t see a command prompt, try pressing enter.
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-knjx7, ip=10.244.3.2, node=a4-worker3!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-ll2ts, ip=10.244.2.2, node=a4-worker2!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-vjqc8, ip=10.244.3.3, node=a4-worker3!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-knjx7, ip=10.244.3.2, node=a4-worker3!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-k9mql, ip=10.244.1.2, node=a4-worker!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-ll2ts, ip=10.244.2.2, node=a4-worker2!
~ $ curl flask-svc:5000/
Hello from pod=flask-dep-75d4749db4-ll2ts, ip=10.244.2.2, node=a4-worker2!</code></pre>
<p>The worker is changing. In this setup, the client only talks to the Kubernetes Service <code>flask-svc</code> instead of individual pods. The Service is implemented as a virtual IP (ClusterIP) and a set of backend endpoints, each corresponding to one running pod in the <code>flask-dep</code> deployment.</p>
<p>When the <code>curl-pod</code> sends HTTP requests to <code>flask-svc:5000</code>, kube-proxy on the node intercepts the traffic and performs load balancing at L4 (TCP). For each incoming connection, kube-proxy selects one of the healthy pod IPs (e.g., <code>10.244.1.2</code>, <code>10.244.2.2</code>, <code>10.244.3.2</code>, <code>10.244.3.3</code>) and forwards the request to that pod.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207010545777.png" alt="image.png" />
<a href="https://kubernetes.io/docs/reference/networking/virtual-ips/">https://kubernetes.io/docs/reference/networking/virtual-ips/</a></p>
<p>As a result, even though the client always uses the same Service address, different requests are handled by different pod instances across multiple worker nodes. The sequence of responses we observed shows that the Service distributes traffic across all four pods in a roughly round-robin / random fashion, without any session stickiness. Some pods may handle multiple consecutive requests simply due to the probabilistic nature of the load-balancing decision.</p>
<h3>Manually kill one server pod</h3>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4$ kubectl get pods -o wide
NAME                         READY   STATUS      RESTARTS   AGE     IP           NODE         NOMINATED NODE   READINESS GATES
curl-pod                     0/1     Completed   0          3h13m   10.244.1.3   a4-worker    &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-k9mql   1/1     Running     0          3h16m   10.244.1.2   a4-worker    &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-knjx7   1/1     Running     0          3h16m   10.244.3.2   a4-worker3   &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-ll2ts   1/1     Running     0          3h16m   10.244.2.2   a4-worker2   &lt;none&gt;           &lt;none&gt;
flask-dep-75d4749db4-vjqc8   1/1     Running     0          3h16m   10.244.3.3   a4-worker3   &lt;none&gt;           &lt;none&gt;</code></pre>
<p>Kill a pod:</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4$ kubectl delete pod  flask-dep-75d4749db4-knjx7

pod &quot;flask-dep-75d4749db4-knjx7&quot; deleted from default namespace
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4$ kubectl get pods -w
NAME                         READY   STATUS      RESTARTS   AGE
curl-pod                     0/1     Completed   0          3h13m
flask-dep-75d4749db4-jfhbd   1/1     Running     0          5s
flask-dep-75d4749db4-k9mql   1/1     Running     0          3h16m
flask-dep-75d4749db4-ll2ts   1/1     Running     0          3h16m
flask-dep-75d4749db4-vjqc8   1/1     Running     0          3h16m</code></pre>
<p>Immediately after deletion, kubectl get pods -w showed that the pod transitioned to the Terminating state and, almost at the same time, a new pod with a different name was created and scheduled to one of the worker nodes. From kubectl describe rs, we can see that the ReplicaSet associated with the deployment continuously enforces the desired replica count (spec.replicas = 4). Once it detects that one replica is missing, it automatically creates a replacement pod.</p>
<p>In other words, the client-facing Service and Deployment remain unaffected: the Service still has four backend endpoints, and new requests can be transparently routed to the newly created pod. This demonstrates Kubernetes’ built-in self-healing capability, where the control plane automatically recovers from individual pod failures without any manual intervention on the application side.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207031016940.png" alt="image.png" /></p>
<h3>Add new API</h3>
<pre><code class="language-python"># greet-with-info API
@app.route(&quot;/chat/&lt;username&gt;&quot;)
def chat(username):
    pod_name = os.getenv(&quot;POD_NAME&quot;, socket.gethostname())
    node_name = os.getenv(&quot;NODE_NAME&quot;, &quot;unknown-node&quot;)

    return (
        f&quot;Hello {username}! &quot;
        f&quot;This response is served by pod={pod_name} on node={node_name}.\n&quot;
    )</code></pre>
<pre><code class="language-bash">docker build -t flask-app:1.0.1 .
kind load docker-image flask-app:1.0.1 --name a4</code></pre>
<p>After extending the Flask server with the <code>greet-with-info</code> API (<code>/chat/{username}</code>), we built a new container image <code>flask-app:1.0.1</code> and rolled out the update by changing the image of the existing deployment</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/reference_demo/revproxy_nginx/flask_app$ kubectl set image deployment/flask-dep flask=flask-app:1.0.1
deployment.apps/flask-dep image updated
(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/reference_demo/revproxy_nginx/flask_app$ kubectl rollout status deployment/flask-dep
deployment &quot;flask-dep&quot; successfully rolled out</code></pre>
<p>During the rollout, <code>kubectl rollout status</code> and <code>kubectl describe deployment</code> show that Kubernetes gradually replaces the old pods with new ones. Internally, the deployment controller manages two ReplicaSets: the old one (using <code>flask-app:1.0.0</code>) and the new one (using <code>flask-app:1.0.1</code>). The controller scales up the new ReplicaSet while scaling down the old one, ensuring that the number of available replicas stays within the limits defined by <code>maxUnavailable</code> and <code>maxSurge</code>.</p>
<p>We can see the update info using <code>kubectl describe deployment flask-dep </code></p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/reference_demo/revproxy_nginx/flask_app$ kubectl describe deployment flask-dep
Name:                   flask-dep
Namespace:              default
CreationTimestamp:      Sat, 06 Dec 2025 15:34:08 +0000
Labels:                 &lt;none&gt;
Annotations:            deployment.kubernetes.io/revision: 2
Selector:               app=flask
Replicas:               4 desired | 4 updated | 4 total | 4 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=flask
  Containers:
   flask:
    Image:      flask-app:1.0.1
    Port:       5000/TCP
    Host Port:  0/TCP
    Environment:
      POD_NAME:     (v1:metadata.name)
      NODE_NAME:    (v1:spec.nodeName)
    Mounts:        &lt;none&gt;
  Volumes:         &lt;none&gt;
  Node-Selectors:  &lt;none&gt;
  Tolerations:     &lt;none&gt;
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  flask-dep-75d4749db4 (0/0 replicas created)
NewReplicaSet:   flask-dep-5f84f494bf (4/4 replicas created)
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  12s   deployment-controller  Scaled up replica set flask-dep-5f84f494bf to 1
  Normal  ScalingReplicaSet  12s   deployment-controller  Scaled down replica set flask-dep-75d4749db4 to 3 from 4
  Normal  ScalingReplicaSet  12s   deployment-controller  Scaled up replica set flask-dep-5f84f494bf to 2 from 1
  Normal  ScalingReplicaSet  11s   deployment-controller  Scaled down replica set flask-dep-75d4749db4 to 2 from 3
  Normal  ScalingReplicaSet  11s   deployment-controller  Scaled up replica set flask-dep-5f84f494bf to 3 from 2
  Normal  ScalingReplicaSet  11s   deployment-controller  Scaled down replica set flask-dep-75d4749db4 to 1 from 2
  Normal  ScalingReplicaSet  11s   deployment-controller  Scaled up replica set flask-dep-5f84f494bf to 4 from 3
  Normal  ScalingReplicaSet  10s   deployment-controller  Scaled down replica set flask-dep-75d4749db4 to 0 from 1</code></pre>
<p>In our case, the deployment uses the default rolling update strategy, where <code>maxUnavailable</code> and <code>maxSurge</code> are both 25%. With 4 desired replicas, this means that at most <strong>1 pod can be unavailable</strong> during the update, and Kubernetes is allowed to temporarily create <strong>up to 1 extra pod</strong> above the desired replica count. Concretely, the deployment may briefly run 5 pods (old + new) when scaling up, and then reduce back to 4 pods as old ones are terminated. This behavior is reflected in the events:</p>
<ul>
<li>[old=4, new=0] → [old=4, new=1] → [old=3, new=1]</li>
<li>→ [old=3, new=2] → [old=2, new=2]</li>
<li>→ [old=2, new=3] → [old=1, new=3]</li>
<li>→ [old=1, new=4] → [old=0, new=4]</li>
</ul>
<p>After the rollout completed, sending requests to <code>/chat/{username}</code> through the Service confirmed that the new API was live and being served by the updated pods. This shows that the rolling update mechanism can upgrade the application version <strong>without downtime</strong>, while respecting the availability constraints specified by <code>maxUnavailable</code> and <code>maxSurge</code>.</p>
<p><img src="https://kubernetes.io/docs/tutorials/kubernetes-basics/public/images/module_06_rollingupdates4.svg" alt="" />
<a href="https://kubernetes.io/zh-cn/docs/tutorials/kubernetes-basics/update/update-intro/">https://kubernetes.io/zh-cn/docs/tutorials/kubernetes-basics/update/update-intro/</a></p>
<p>Verify the API that changed:</p>
<pre><code class="language-txt">(base) cc@taskflow01:~/Distributed-and-Cloud-Computing/assignment4/assignment_4/reference_demo/revproxy_nginx/flask_app$ kubectl run curl-pod2 --image=curlimages/curl:8.10.1 --restart=Never -it -- sh
All commands and output from this session will be recorded in container logs, including credentials and sensitive information passed through the command prompt.
If you don&#039;t see a command prompt, try pressing enter.
~ $ curl flask-svc:5000/chat/haibin
Hello haibin! This response is served by pod=flask-dep-5f84f494bf-h4wrm on node=a4-worker.</code></pre>
<p>we can see that we have <code>This response is served by pod=flask-dep-5f84f494bf-h4wrm on node=a4-worker.</code>, this is changed in our version 1.0.1</p>
<p>So API now changed.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207030951512.png" alt="image.png" /></p>
<hr />
<p>To delete the cluster a4:</p>
<pre><code class="language-bash">kind delete cluster --name a4</code></pre>
<h2>Task 1</h2>
<p>Use Kind to create a 6-node cluster (1 control plane + 5 worker nodes). Write the cluster configurations to a YAML file.</p>
<table>
<thead>
<tr>
<th>Workers</th>
<th>Label</th>
<th>Taint</th>
</tr>
</thead>
<tbody>
<tr>
<td>worker1</td>
<td>usage=normal</td>
<td>N/A</td>
</tr>
<tr>
<td>worker2</td>
<td>usage=normal, capability=powerful</td>
<td>N/A</td>
</tr>
<tr>
<td>worker3</td>
<td>usage=normal, capability=powerful</td>
<td>taint: class=vip</td>
</tr>
<tr>
<td>worker4</td>
<td>usage=backup</td>
<td>N/A</td>
</tr>
<tr>
<td>worker5</td>
<td>usage=backup</td>
<td>N/A</td>
</tr>
</tbody>
</table>
<p>For kind-config.yaml:</p>
<pre><code class="language-txt">kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
  - role: worker
  - role: worker
  - role: worker</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207170735087.png" alt="image.png" /></p>
<p>And define kind-config.yaml:</p>
<p>We can see <code>Pod Anti-Affinity：every replica should in diff nodes</code> and <code>② Node Affinity</code>.</p>
<pre><code class="language-txt"># 1 deployment - 1~5 pod replicas - 1 flask server per pod
# 1 service to expose the deployment above
# constraints:
# pod anti-affinity: pod replicas distributed to different nodes
# preferred weighted node affinity: (1) powerful nodes; (2) non-backup nodes; (3) backup nodes
# (EXTRA) how to deploy pods to nodes with taints?
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flask-dep-t1
spec:
  replicas: 1          # start from 1
  selector:
    matchLabels:
      app: flask-t1
  template:
    metadata:
      labels:
        app: flask-t1
    spec:
      containers:
      - name: flask
        image: flask-app:1.0.1      # images
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5000
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName

      # ① Pod Anti-Affinity：every replica should in diff nodes
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - flask-t1
            topologyKey: &quot;kubernetes.io/hostname&quot;

        # ② Node Affinity
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          # choose powerful nodes first
          - weight: 100
            preference:
              matchExpressions:
              - key: capability
                operator: In
                values:
                - powerful
          # second, choose normal nodes
          - weight: 50
            preference:
              matchExpressions:
              - key: usage
                operator: In
                values:
                - normal
          # choose backup nodes（worker4 / worker5）
          - weight: 10
            preference:
              matchExpressions:
              - key: usage
                operator: In
                values:
                - backup

      # ③ Tolerations：allow Pod schedule into class=vip:NoSchedule 的 worker3
      tolerations:
      - key: &quot;class&quot;
        operator: &quot;Equal&quot;
        value: &quot;vip&quot;
        effect: &quot;NoSchedule&quot;
---
apiVersion: v1
kind: Service
metadata:
  name: flask-svc-t1
spec:
  selector:
    app: flask-t1
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP</code></pre>
<p>Note: tolerations <code>Tolerations：allow Pod schedule into class=vip:NoSchedule 的 worker3</code> allow us to deploy replicas to the node with vip nodes (node3 here in this example). If we don't add these lines, we can't deploy to node3.</p>
<pre><code class="language-txt">      tolerations:
      - key: &quot;class&quot;
        operator: &quot;Equal&quot;
        value: &quot;vip&quot;
        effect: &quot;NoSchedule&quot;</code></pre>
<p>Add Labels to the nodes:</p>
<pre><code class="language-bash">kubectl label node a4t1-worker        usage=normal
kubectl label node a4t1-worker2       usage=normal capability=powerful
kubectl label node a4t1-worker3       usage=normal capability=powerful
kubectl label node a4t1-worker4       usage=backup
kubectl label node a4t1-worker5       usage=backup</code></pre>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207170848135.png" alt="image.png" /></p>
<p>Add no schedule config to the nodes.</p>
<pre><code class="language-bash">kubectl taint nodes a4t1-worker3 class=vip:NoSchedule</code></pre>
<p>This command attaches a taint with key <code>class</code>, value <code>vip</code>, and effect <code>NoSchedule</code> to the node. Semantically, it tells the Kubernetes scheduler:<br />
<strong>“Do not schedule any pods on this node unless they explicitly tolerate <code>class=vip</code>.”</strong><br />
In other words, <code>a4t1-worker3</code> becomes a restricted “VIP” node. Only pods that define a matching toleration (e.g., with <code>key=class</code>, <code>value=vip</code>, <code>effect=NoSchedule</code>) are eligible to be placed on this node. All other pods will be rejected by the scheduler for this node and must be placed elsewhere.</p>
<p>Now, according to the schedule yaml file and the labels, we can see the priority of which node will be deployed sequentially (node scale as 2 -&gt; 3 -&gt;  4 -&gt; 5 -&gt; 1):</p>
<table>
<thead>
<tr>
<th>Node</th>
<th>capability</th>
<th>usage</th>
<th>Scores</th>
</tr>
</thead>
<tbody>
<tr>
<td>worker2</td>
<td>powerful</td>
<td>normal</td>
<td>100 + 50 = <strong>150</strong></td>
</tr>
<tr>
<td>worker3 (+taint)</td>
<td>powerful</td>
<td>normal</td>
<td>100 + 50 = <strong>150</strong></td>
</tr>
<tr>
<td>worker</td>
<td>normal</td>
<td>normal</td>
<td>50</td>
</tr>
<tr>
<td>worker4</td>
<td>backup</td>
<td>backup</td>
<td>10</td>
</tr>
<tr>
<td>worker5</td>
<td>backup</td>
<td>backup</td>
<td>10</td>
</tr>
</tbody>
</table>
<p>The ordering of node assignments follows directly from the combination of (1) preferred node affinity weights, (2) pod anti-affinity constraints, and (3) toleration of the VIP taint on worker3. First, the scheduler chooses the two powerful nodes because they yield the highest weighted scores. Then, anti-affinity prevents placing multiple replicas on the same node, so the third pod falls back to the only remaining normal node. Finally, the two backup nodes are selected last due to their lowest affinity weight. This results in the five pods being placed across all five workers in descending priority order: powerful → normal → backup.</p>
<p><strong>Pod scheduling analysis with taints, tolerations, and affinity.</strong><br />
Starting from the updated <code>flask-dep-t1</code> deployment, I gradually scaled the number of replicas from 1 up to 5 using:</p>
<pre><code class="language-bash">kubectl scale deployment flask-dep-t1 --replicas=N
kubectl get pods -o wide</code></pre>
<p>For replicas = 2, the two pods were scheduled to a4t1-worker2 and a4t1-worker3:</p>
<pre><code class="language-bash">flask-dep-t1-6c56d5dbb8-4gzrn   1/1     Running   0          21s   10.244.1.2   a4t1-worker2
flask-dep-t1-6c56d5dbb8-d8m69   1/1     Running   0          4s    10.244.4.2   a4t1-worker3  </code></pre>
<p>This behavior matches the preferred node affinity configuration: the scheduler first tries to place pods on nodes labeled capability=powerful (i.e., a4t1-worker2 and a4t1-worker3). Although a4t1-worker3 has the taint class=vip:NoSchedule, the pods in this deployment define a matching toleration for class=vip, so they are allowed to run on that node.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207171309038.png" alt="image.png" /></p>
<p>As I further increased the replica count to 3, 4, and finally 5, the new pods were scheduled onto the remaining worker nodes:</p>
<ul>
<li>The third pod was placed on <code>a4t1-worker</code> (labeled <code>usage=normal</code>),</li>
<li>The fourth and fifth pods were placed on <code>a4t1-worker4</code> and <code>a4t1-worker5</code> (both labeled <code>usage=backup</code>).<br />
Throughout this process, the <strong>pod anti-affinity</strong> rule ensured that each replica was placed on a different node, so no two <code>flask-dep-t1</code> pods share the same worker. Once all five replicas became <code>Running</code>, the final placement used <strong>all five worker nodes exactly once</strong>, respecting both the anti-affinity constraint and the node affinity preferences (powerful nodes first, then normal, and finally backup nodes), while the toleration allowed one pod to be scheduled on the tainted VIP node <code>a4t1-worker3</code>.</li>
</ul>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251207171558840.png" alt="image.png" />
(as you can see, here we first have node3, then node1, node4 and lastly node5)</p>
<p>And just as we mentioned, if we don't add Tolerations rules, we can't add replica to node3.</p>
<h2>Advice on Future Cloud Computing Lab</h2>
<p><strong>About MPI:</strong> </p>
<p>The tutorial is very good! If we can use some figures in Slides to show the algorithms of some communication primitives, that would be better.</p>
<p>The assignment 1 for MPI is good. But the matrix computation sizes is a little small. We can use larger matrix like 4096x4096. </p>
<p>I would like to share some of the workload if you want to make the assignment harder: implement a MPI-based parallel BFS algorithms. And there will be many ways to finish it. Also, try to use MPI to implement a Map Reduce would also be hard. Since there are problems like fault tolerance, large communication overhead, load imbalance etc. (That maybe too hard since it's like MIT 6.824)</p>
<p>we may introduce some of the communication library like NCCL, Kokkos. Some of the primitives use similar algorithms in MPI, like Ring-Allreduce.</p>
<p><strong>About Stores:</strong></p>
<p>The tutorial on GraphQL and OpenAPI is very good. I think the Lab did best on giving a tutorial to us!</p>
<p>Actually I'm pretty enjoy this assignments. Everything is very good. And in the lab we maybe can tell students to list the full API first. (I think during a Lab the TA said that, didn't they?)</p>
<p>We should add some benchmark tutorial in the Lab! (Like using <code>hey</code> to benchmark our website, that's fantastic)</p>
<p><strong>About Spark:</strong></p>
<p>The tutorial on Hadoop and Spark is very good. And the documents provided to us also very useful!</p>
<p>Some of the radical thought: maybe we can try to read the paper during the Lab. That would be amazing.</p>
<p><a href="https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf">https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf</a>
<a href="https://pages.cs.wisc.edu/~akella/CS838/F15/838-CloudPapers/hdfs.pdf">https://pages.cs.wisc.edu/~akella/CS838/F15/838-CloudPapers/hdfs.pdf</a></p>
<p>Amazing assignments. And it's really fun to analyze the data and get some conclusion on them. But it would be good if we can do some self checking to see if we are getting the right data.</p>
<p><strong>About K8s:</strong></p>
<p>Wonderful tutorial and assignments, since we are using K8s in industries. </p>
<p>And we can also give some deeper taste on Function as a Service. Try to use K8s to run a FaaS service. That would be cool!</p>
<h3>Some of my learning records</h3>
<p>I am also learning CSE5020 Advanced Distributed Systems this semester (just self-taking the class &amp; self learning), and some of my recording is on my blog. Feel free to see them :)
<a href="https://www.haibinlaiblog.top/">https://www.haibinlaiblog.top/</a></p>
<p>I am also fascinated in recording everything I see during my studies, like papers, news, blogs, and some travel fun stories. It's really great to post them on a self learning space.</p>
