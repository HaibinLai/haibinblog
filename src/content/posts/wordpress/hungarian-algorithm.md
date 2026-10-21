---
title: "Hungarian Algorithm"
description: "Hungarian Algorithm Algorithm Design and Analysis (H) Assignment 5 Name: 赖海斌 SID: 12211612 Abstract In this assignment we try to analyze Hungarian algorithm. It’s an efficient algorithm for solving the min-cost max-matc…"
publishedAt: "2024-08-23 23:43:04"
updatedAt: "2024-12-07 18:16:34"
category: "Graph"
tags: ["图论", "算法", "计算机科学"]
draft: false
slug: "hungarian-algorithm"
legacySlug: "hungarian-algorithm"
wordpressId: 88
sourceUrl: "https://www.haibinlaiblog.top/index.php/hungarian-algorithm/"
commentCount: 0
importedFromWordPress: true
---
<h1>Hungarian Algorithm</h1>
<h2>Algorithm Design and Analysis (H)  Assignment 5</h2>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2024/08/ADA-Assignment5-Haibin-Lai.001.png" alt="" /></p>
<p>Name: 赖海斌</p>
<p>SID: 12211612</p>
<h2>Abstract</h2>
<p>In this assignment we try to analyze Hungarian algorithm. It’s an efficient algorithm for solving the min-cost max-matching problem in a bipartite graph. It finds a min-cost perfect matching in O(n^3) time.</p>
<p><a href="https://www.haibinlaiblog.top/wp-content/uploads/2024/08/ADA-Assignment5-Haibin-Lai.docx" title="ADA Assignment5 Haibin Lai">ADA Assignment5 Haibin Lai</a>
<a href="https://www.haibinlaiblog.top/wp-content/uploads/2024/08/ADA-Assignment5-Haibin-Lai.docx" title="ADA Assignment5 Haibin Lai">docx</a></p>
<h2>Pseudocode for Hungarian algorithm</h2>
<pre><code class="language-python"> def hungarian(node)
 {
  Count =0;
   for i from 1 to n
    if (dfs\_findPath)
      Count ++;
   return Count ;
 }

def  dfs_findPath(node start)
{   node = start;
    for (search every edge that node    connect）{
    node *To* = the other node that connect to the edge
        if（we haven’t visited *To*）
            Set *To* into visited;
        if (*To* hasn’t been bipartite or *To* can be matched to *now*)
            Match *To*，*now*
    return true;    // we can find a path
}
    //Can not find
    return false；
}</code></pre>
<h2>Core idea and critical procedures</h2>
<p>The core idea of this algorithm is to gradually construct the maximum matching by continuously searching for augmenting paths. It’s like GS algo to get every node a match then match better like greedy.</p>
<p>In the Hungarian algorithm, an <strong>augmenting path</strong> is a special path that starts from an unmatched vertex in the current matching and extends by alternately traversing unmatched and matched edges until reaching another unmatched vertex. The length of an augmenting path should be odd because it must begin and end with unmatched vertices.</p>
<p>Hungarian algorithm first search and Discover augmenting paths in the problem. Starting from an unmatched vertex, the algorithm searches by alternately traversing unmatched and matched edges until it reaches another unmatched vertex. It can increase the size of the current matching.</p>
<p>Then Hungarian algorithm Utilizes augmenting paths to update the matching. Once an augmenting path is found, the Hungarian algorithm utilizes it to improve the current matching by updating the edges along the augmenting path.</p>
<p>As we can see from the Pseudocode, the algorithm follows these critical steps:</p>
<ol>
<li>
<p><strong>Initialization</strong>: Mark all edges as unmatched.</p>
</li>
<li>
<p><strong>Traverse unmatched left vertices</strong>: For each unmatched left vertex, attempt to find an augmenting path to find augmenting routes.</p>
</li>
<li>
<p><strong>Find augmenting paths</strong>: Start from the current unmatched left vertex and try to match the right vertices one by one. If a right vertex is already matched, recursively look for adjacent unmatched vertices until an unmatched right vertex is found or no new unmatched vertex can be found.</p>
</li>
<li>
<p><strong>Match edges on the augmenting path</strong>: Match or unmatch edges on the augmenting path to increase the number of unmatched left vertices.</p>
</li>
<li>
<p><strong>Repeat</strong> steps 2 and 4 until no augmenting path can be found.</p>
</li>
</ol>
<p>Ultimately, the Hungarian algorithm can find the maximum matching in a bipartite graph.</p>
<h2>Correctness, running time, and space complexity of the algorithm</h2>
<p>Hungarian algorithm uses the feature of augmenting paths to reach correctness.</p>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2024/08/ADA-Assignment5-Haibin-Lai.002.png" alt="" /></p>
<p>As shown in the diagram, Path 6 is one of the augmenting paths of Graph 5. It can be observed that starting from the unmatched vertex 9, it sequentially follows the edges ( (9, 4) ) -&gt; ( (4, 8) ) -&gt; ( (8, 1) ) -&gt; ( (1, 6) ) -&gt; ( (6, 1) ) to reach the unmatched vertex 1. Clearly, this is an augmenting path.</p>
<p>We can identify some characteristics of augmenting paths:</p>
<ol>
<li><strong>An augmenting path always consists of an odd number of edges.</strong> </li>
</ol>
<p>This is trivial since we need to start from a unmatch node and end in unmatch node with crossing unmatch edge and match edge one by one.</p>
<ol start="2">
<li><strong> In an augmenting path, the number of unmatched edges is always one more than the number of matched edges.</strong> </li>
</ol>
<p>We can proof this since it starts from an unmatched vertex and ends at another unmatched vertex, traversing alternately matched and unmatched edges.</p>
<p>This actually demonstrates the significance of augmenting paths. If an augmenting path is found, by swapping the roles of unmatched vertices and matched edges, the number of matched edges increases by one. This process continues until no augmenting path can be found. </p>
<p>So every time we run one finding on the algorithm, we will find that a new pair every time.</p>
<p>Consequently, the total number of matched edges in the entire graph is maximized, which means the maximum matching of the bipartite graph is achieved. So the algo become correct.</p>
<p><img src="https://www.haibinlaiblog.top/wp-content/uploads/2024/08/ADA-Assignment5-Haibin-Lai.003.png" alt="" /></p>
<h3>Time Complexity:   <strong>O(VE)</strong></h3>
<p>The implementation of the Hungarian algorithm is based on the vertex set. In each iteration, a vertex ( node ) is chosen as the starting point to search for augmenting paths. Searching for augmenting paths requires traversing all edges in the edge set ( E ), which can be done using DFS or BFS. Regardless of the method chosen, the time complexity remains ( O(E) ).</p>
<p>Each vertex can only be selected once in the Hungarian algorithm since we will mark them. Therefore, the overall time complexity of the algorithm is O(VE) .</p>
<h3>Space Complexity: <strong>O(V+E)</strong></h3>
<p>We need to store the vertex and edge into array. Also, our match is O(E), our visited array is O(V). So in total we have O(V+E) space complexity.</p>
<p>Formulate a max-cost max-matching problem as a min-cost perfect-matching problem</p>
<p>First, let's define the min-cost perfect-matching problem. In a min-cost perfect-matching problem, we aim to find a matching in a bipartite graph that minimizes the total cost while ensuring that each vertex is incident to exactly one edge.</p>
<p>Now, to formulate the max-cost max-matching problem as a min-cost perfect-matching problem, we follow these steps:</p>
<p><strong>Negate</strong> the Costs: Negate the costs of all edges in the graph. This converts the max-cost problem into a min-cost problem.</p>
<p><strong>Add Dummy Vertices</strong>: If necessary, add dummy vertices and edges with zero cost to ensure that the number of vertices on both sides of the bipartite graph is equal. This step ensures that a perfect matching can be found.</p>
<p><strong>Find</strong> the Min-Cost Perfect Matching: Use Hungarian algorithm to find the minimum-cost perfect matching in the modified graph.</p>
<p><strong>Reverse</strong> the Costs back: If necessary, reverse the sign of the costs in the obtained matching to obtain the max-cost matching in the original graph.</p>
<p><strong>Explanation of Correctness:</strong></p>
<p>Negating the Costs: By negating the costs, we convert the max-cost problem into a min-cost problem. This is based on the principle that finding the min-cost matching in the modified graph is equivalent to finding the max-cost matching in the original graph.</p>
<p><strong>Adding Dummy Vertices</strong>: Adding dummy vertices ensures that a perfect matching can be found, which is necessary for the min-cost perfect-matching problem. These dummy vertices and edges do not affect the final matching's cost in the original graph. And we are benefit from its num since some finding in Hungary cannot pass Negate if we don’t add.</p>
<p>Finding the Min-Cost Perfect Matching: Then we get the problem of Hungary can solve. So we can just use it. </p>
<p>After that, by transforming the max-cost max-matching problem into a min-cost perfect-matching problem and applying standard algorithms for min-cost perfect matching, we can effectively solve the original problem.</p>
<h2>Reference</h2>
<p>[1] OI WIKI <a href="https://oi-wiki.org/graph/graph-matching/bigraph-weight-match/">https://oi-wiki.org/graph/graph-matching/bigraph-weight-match/</a></p>
<p>[2] Algo intro <a href="https://www.cnblogs.com/purinliang/p/14501584.html">https://www.cnblogs.com/purinliang/p/14501584.html</a></p>
<p>[3] Intro &amp; code <a href="https://xiexuewu.github.io/view/150.html">https://xiexuewu.github.io/view/150.html</a></p>
<p>[4] The Dynamic Hungarian Algorithm for the Assignment Problem with Changing Costs</p>
<p>G. Ayorkor Korsah, Anthony (Tony) Stentz, and M. Bernardine Dias</p>
<p>Tech. Report, CMU-RI-TR-07-27, Robotics Institute, Carnegie Mellon University, July, 2007</p>
