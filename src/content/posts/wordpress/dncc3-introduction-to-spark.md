---
title: "DnCC3: Introduction to Spark"
description: "In this assignment, we need to use Spark to analyze the Parking dataset. Preparing Install pysark and java pip install pyspark sudo apt-get update sudo apt-get install openjdk-17-jdk export JAVA_HOME=/usr/lib/jvm/java-1…"
publishedAt: "2025-12-30 01:04:24"
updatedAt: "2025-12-30 18:33:17"
category: "Distributed Systems"
tags: []
draft: false
slug: "dncc3-introduction-to-spark"
legacySlug: "dncc3-introduction-to-spark"
wordpressId: 1113
sourceUrl: "https://haibin-blog.vercel.app/index.php/dncc3-introduction-to-spark/"
commentCount: 0
importedFromWordPress: true
---
<p><img src="https://haibin-blog.vercel.app/wp-content/uploads/2025/12/image-1767090779092.png" alt="file" /></p>
<p>In this assignment, we need to use Spark to analyze the Parking dataset.</p>
<h2>Preparing</h2>
<p>Install <code>pysark</code> and <code>java</code></p>
<pre><code class="language-bash">pip install pyspark
sudo apt-get update
sudo apt-get install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH</code></pre>
<p>Init Spark:</p>
<pre><code class="language-python">from pyspark.sql import SparkSession
import os

# java env
os.environ[&quot;JAVA_HOME&quot;] = &quot;/usr/lib/jvm/java-17-openjdk-amd64&quot;

spark = SparkSession.builder.appName(&quot;A3&quot;).getOrCreate()
print(spark)</code></pre>
<h2>Sava as CSV:</h2>
<pre><code class="language-python">import shutil
import os

def save_as_single_csv(df, output_filename):
    tmp_dir = output_filename + &quot;_tmp&quot;

    # 1. Coalesce to 1 partition → ensures only 1 part file
    df.coalesce(1).write.csv(tmp_dir, header=True, mode=&quot;overwrite&quot;)
    # 2. Find generated part file
    part_file = None
    for f in os.listdir(tmp_dir):
        if f.startswith(&quot;part-&quot;) and f.endswith(&quot;.csv&quot;):
            part_file = f
            break
    # 3. Move and rename to desired output filename
    shutil.move(os.path.join(tmp_dir, part_file), output_filename)
    # 4. Delete temp directory
    shutil.rmtree(tmp_dir)</code></pre>
<p>PySpark calls used:</p>
<ul>
<li><code>coalesce(1).write.csv(&quot;r2.csv&quot;, header=True, mode=&quot;overwrite&quot;)</code><br />
to output a single CSV file.</li>
</ul>
<h2>Task1: berthagesfor number in each section</h2>
<pre><code class="language-python">from pyspark.sql import SparkSession
from pyspark.sql.functions import countDistinct

df = spark.read.csv(&quot;parking_data_sz.csv&quot;, header=True)
# Task 1
r1 = df.groupBy(&quot;section&quot;) \
       .agg(countDistinct(&quot;berthage&quot;).alias(&quot;count&quot;))</code></pre>
<p>To compute the number of unique berthages in each section, I loaded the CSV into a Spark DataFrame and applied a <code>groupBy(&quot;section&quot;)</code> followed by <code>countDistinct(&quot;berthage&quot;)</code>. This efficiently aggregates the dataset in parallel and ensures that duplicated berthagesfor entries are not counted.</p>
<p>PySpark calls used:</p>
<ul>
<li><code>spark.read.csv(&quot;parking_data_sz.csv&quot;, header=True)</code><br />
to load the CSV dataset as a DataFrame.</li>
<li><code>groupBy(&quot;section&quot;)</code><br />
to aggregate rows by section.</li>
<li><code>countDistinct(&quot;berthage&quot;)</code><br />
to count unique berth IDs per section.</li>
<li><code>alias(&quot;count&quot;)</code><br />
to rename the aggregated column to <code>count</code>.</li>
</ul>
<h2>Task2: berthagesfor in each section</h2>
<pre><code class="language-python">from pyspark.sql import SparkSession
from pyspark.sql.functions import col

df = spark.read.csv(&quot;parking_data_sz.csv&quot;, header=True)

# Task 2
r2 = df.select(&quot;berthage&quot;, &quot;section&quot;).distinct()</code></pre>
<p>To list all unique berthage–section pairs, I selected the <code>berthage</code> and <code>section</code> columns from the DataFrame and applied <code>distinct()</code>. This removes duplicate rows in the raw data and produces a clean mapping showing which berthages belong to which sections.</p>
<p><strong>PySpark calls used:</strong></p>
<ul>
<li><code>select(&quot;berthage&quot;, &quot;section&quot;)</code><br />
to project only the relevant columns    </li>
<li><code>distinct()</code><br />
to remove duplicate <code>(berthage, section)</code> pairs.</li>
</ul>
<h2>Task3: Average parking time for each section</h2>
<pre><code class="language-python">from pyspark.sql.functions import unix_timestamp, avg

# Filter invalid rows
df_valid = df.filter(unix_timestamp(&quot;out_time&quot;) &gt; unix_timestamp(&quot;in_time&quot;))

# Compute parking time in seconds
df_time = df_valid.withColumn(
    &quot;parking_seconds&quot;,
    unix_timestamp(&quot;out_time&quot;) - unix_timestamp(&quot;in_time&quot;)
)

# Task 3: avg parking time per section
r3 = df_time.groupBy(&quot;section&quot;) \
            .agg(avg(&quot;parking_seconds&quot;).cast(&quot;int&quot;).alias(&quot;avg_parking_time&quot;))</code></pre>
<p>To compute the average parking duration for each section, I first use <code>filter</code> filtered out records where the <code>out_time</code> is earlier than the <code>in_time</code>. </p>
<p>Then, I calculated each vehicle’s parking time by subtracting the corresponding timestamps. </p>
<p>After adding this duration as a new column, I grouped the data by section and applied <code>avg()</code> to obtain the mean parking time in seconds for each section.</p>
<p><strong>PySpark calls used.</strong></p>
<ul>
<li><code>to_timestamp(&quot;in_time&quot;)</code>, <code>to_timestamp(&quot;out_time&quot;)</code><br />
(or <code>unix_timestamp</code>) to parse the time strings into timestamps.</li>
<li><code>filter(unix_timestamp(&quot;out_time&quot;) &gt; unix_timestamp(&quot;in_time&quot;))</code><br />
to remove invalid rows.</li>
<li><code>withColumn(&quot;parking_seconds&quot;, unix_timestamp(&quot;out_time&quot;) - unix_timestamp(&quot;in_time&quot;))</code><br />
to compute per-record parking duration.</li>
<li><code>groupBy(&quot;section&quot;).agg(avg(&quot;parking_seconds&quot;).cast(&quot;int&quot;).alias(&quot;avg_parking_time&quot;))</code><br />
to compute integer average parking time per section.</li>
</ul>
<h2>Task4: Average parking time for each berthage in descending order</h2>
<pre><code class="language-python"># Task 4: avg parking time per berthage
r4 = df_time.groupBy(&quot;berthage&quot;) \
            .agg(avg(&quot;parking_seconds&quot;).cast(&quot;int&quot;).alias(&quot;avg_parking_time&quot;)) \
            .orderBy(col(&quot;avg_parking_time&quot;).desc())
</code></pre>
<p>To compute the average parking time for each berthage, I grouped the preprocessed DataFrame by <code>berthage</code> and applied <code>avg()</code> on the computed parking duration column. The resulting averages were then sorted in descending order by <code>avg_parking_time</code> to highlight berthages with the longest typical parking times.</p>
<p><strong>PySpark calls used.</strong></p>
<ul>
<li><code>groupBy(&quot;berthage&quot;)</code><br />
to aggregate durations by berthage.</li>
<li><code>agg(avg(&quot;parking_seconds&quot;).cast(&quot;int&quot;).alias(&quot;avg_parking_time&quot;))</code><br />
to compute integer average parking time per berth.</li>
<li><code>orderBy(col(&quot;avg_parking_time&quot;).desc())</code><br />
to sort in descending order of average duration.</li>
</ul>
<h2>Task5: Average berthages usage of each section</h2>
<p>For each section, output the total number of berthages in use and the percentage of in-use berthages in that section, in a one-hour interval (e.g. during 09:00:00-10:00:00). “In use” means there is at least one vehicle parked in that berthage in that interval for ANY duration. The time intervals should begin at the start of the first hour that appears in the dataset (for example, if the first entry is at 12:23, the first interval should start from 12:00). The output file should have the columns start_time, end_time, section, count and percentage. The percentage value should be rounded to one decimal place (e.g. 67.8%). The data format of start_time and end_time should match the one in the original dataset “YYYY-MM-DD HH:MM:SS”.</p>
<pre><code class="language-python">from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    to_timestamp, unix_timestamp, date_trunc, sequence, explode,
    countDistinct, count, col, expr, round, concat, lit, date_format
)

# 1. Filter invalid rows
df_ts = df.withColumn(&quot;in_ts&quot;,  to_timestamp(&quot;in_time&quot;)) \
          .withColumn(&quot;out_ts&quot;, to_timestamp(&quot;out_time&quot;))

df_valid = df_ts.filter(col(&quot;out_ts&quot;) &gt; col(&quot;in_ts&quot;))

# 2. preprocess time, construct all full hour_start covered by [in_ts, out_ts)
#    To avoid counting the hour that is exactly the out_ts, use out_ts - 1 SECOND
df_valid = df_valid.withColumn(&quot;out_adj&quot;, expr(&quot;out_ts - INTERVAL 1 SECOND&quot;))

# Each record&#039;s first and last hour_start (truncated to hour)
df_valid = df_valid.withColumn(&quot;start_hour&quot;, date_trunc(&quot;hour&quot;, col(&quot;in_ts&quot;))) \
                   .withColumn(&quot;end_hour&quot;,   date_trunc(&quot;hour&quot;, col(&quot;out_adj&quot;)))

# Generate array of hour_start timestamps covered by [start_hour, end_hour]
df_valid = df_valid.withColumn(
    &quot;hour_start_array&quot;,
    sequence(col(&quot;start_hour&quot;), col(&quot;end_hour&quot;), expr(&quot;INTERVAL 1 HOUR&quot;))
)

# Expand into multiple rows: each row is a (section, berthage, hour_start)
df_expanded = df_valid.select(
    &quot;section&quot;,
    &quot;berthage&quot;,
    explode(col(&quot;hour_start_array&quot;)).alias(&quot;hour_start&quot;)
)

# 3. Calculate total berthage count for each section (global, not time-specific)
section_total = df.select(&quot;section&quot;, &quot;berthage&quot;) \
                  .distinct() \
                  .groupBy(&quot;section&quot;) \
                  .agg(count(&quot;berthage&quot;).alias(&quot;total_berthages&quot;))

# 4. Calculate the number of &quot;in use&quot; berthages (distinct) for each (section, hour_start)
in_use = df_expanded.groupBy(&quot;section&quot;, &quot;hour_start&quot;) \
                    .agg(countDistinct(&quot;berthage&quot;).alias(&quot;count&quot;))

# 5. Calculate percentage + add start_time / end_time fields
r5 = in_use.join(section_total, on=&quot;section&quot;, how=&quot;left&quot;)

r5 = r5.withColumn(
        &quot;percentage_num&quot;,
        round(col(&quot;count&quot;) * 100.0 / col(&quot;total_berthages&quot;), 1)
    ) \
    .withColumn(
        &quot;percentage&quot;,
        concat(col(&quot;percentage_num&quot;).cast(&quot;string&quot;), lit(&quot;%&quot;))
    ) \
    .withColumn(
        &quot;start_time&quot;,
        date_format(col(&quot;hour_start&quot;), &quot;yyyy-MM-dd HH:mm:ss&quot;)
    ) \
    .withColumn(
        &quot;end_time&quot;,
        date_format(expr(&quot;hour_start + INTERVAL 1 HOUR&quot;), &quot;yyyy-MM-dd HH:mm:ss&quot;)
    ) \
    .select(
        &quot;start_time&quot;,
        &quot;end_time&quot;,
        &quot;section&quot;,
        &quot;count&quot;,
        &quot;percentage&quot;
    ) \
    .orderBy(&quot;start_time&quot;, &quot;section&quot;)</code></pre>
<p>To compute the hourly berthage usage for each section, I first preprocessed the dataset by converting the <code>in_time</code> and <code>out_time</code> fields into timestamp columns and filtering out invalid rows where the departure time is earlier than the arrival time. </p>
<p>Because the task requires determining whether a berthage is “in use” during any portion of a given hour, I expanded each parking interval into the list of hour-aligned timestamps it overlaps. Specifically, for every record, I truncated both the entry and adjusted exit times to the nearest hour and generated a sequence of hourly boundaries between them. Exploding this sequence allowed each vehicle to contribute one row per hour in which it was present.</p>
<p>Next, I counted the number of distinct berthages in use for every <code>(section, hour_start)</code> pair. In parallel, I computed the total number of berthages in each section by taking the distinct <code>(section, berthage)</code> combinations in the dataset. Joining these results enabled calculation of the usage percentage per hour as the ratio of occupied berthages to total berthages in that section, rounded to one decimal place as required.</p>
<p>Finally, I formatted each hourly window using <code>start_time</code> and <code>end_time</code> fields matching the dataset’s timestamp style (<code>YYYY-MM-DD HH:MM:SS</code>) and ordered all records by time and section. The final output includes the columns <code>start_time</code>, <code>end_time</code>, <code>section</code>, <code>count</code>, and <code>percentage</code>, providing a clear summary of hourly berthage utilization across all sections.</p>
<p><strong>PySpark calls used.</strong></p>
<ul>
<li><code>withColumn(&quot;in_ts&quot;, to_timestamp(&quot;in_time&quot;))</code>, <code>withColumn(&quot;out_ts&quot;, to_timestamp(&quot;out_time&quot;))</code><br />
to create timestamp columns.</li>
<li><code>filter(col(&quot;out_ts&quot;) &gt; col(&quot;in_ts&quot;))</code><br />
to exclude invalid records.</li>
<li><code>withColumn(&quot;out_adj&quot;, expr(&quot;out_ts - INTERVAL 1 SECOND&quot;))</code><br />
to avoid counting records exactly at the hour boundary in the next interval.</li>
<li><code>date_trunc(&quot;hour&quot;, col(&quot;in_ts&quot;))</code>, <code>date_trunc(&quot;hour&quot;, col(&quot;out_adj&quot;))</code><br />
to align times to the beginning of hours.</li>
<li><code>sequence(col(&quot;start_hour&quot;), col(&quot;end_hour&quot;), expr(&quot;INTERVAL 1 HOUR&quot;))</code><br />
to generate all hour starts covered by each record.</li>
<li><code>explode(&quot;hour_start_array&quot;)</code><br />
to turn each array of hour starts into multiple rows.</li>
<li><code>distinct()</code>, <code>groupBy(&quot;section&quot;).agg(count(&quot;berthage&quot;).alias(&quot;total_berthages&quot;))</code><br />
to compute the total number of berthages per section.</li>
<li><code>groupBy(&quot;section&quot;, &quot;hour_start&quot;).agg(countDistinct(&quot;berthage&quot;).alias(&quot;count&quot;))</code><br />
to count in-use berthages for each section–hour pair.</li>
<li><code>join(section_total, on=&quot;section&quot;, how=&quot;left&quot;)</code><br />
to join in the total berthages.</li>
<li><code>round(col(&quot;count&quot;) * 100.0 / col(&quot;total_berthages&quot;), 1)</code><br />
to compute the percentage.</li>
<li><code>concat(col(&quot;percentage_num&quot;).cast(&quot;string&quot;), lit(&quot;%&quot;))</code><br />
to format the percentage with a <code>%</code> sign.</li>
<li><code>date_format(col(&quot;hour_start&quot;), &quot;yyyy-MM-dd HH:mm:ss&quot;)</code> and <code>expr(&quot;hour_start + INTERVAL 1 HOUR&quot;)</code><br />
to build <code>start_time</code> and <code>end_time</code> strings.</li>
<li><code>orderBy(&quot;start_time&quot;, &quot;section&quot;)</code><br />
to sort the output.</li>
</ul>
<h2>Parking Analysis</h2>
<p>We select the top 3 most frequent sections to do analysis:</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204034506153.png" alt="image.png|750" /></p>
<h2>Here we can see 3 trend:</h2>
<h3><strong>Daily (Diurnal) Parking Patterns</strong></h3>
<p>The plots show a clear <strong>daily cycle</strong> in parking usage. Some sections experience higher occupancy during daytime and lower usage at night, indicating areas dominated by commercial or office activity. Other sections exhibit the opposite trend, with high nighttime usage and lower daytime demand, reflecting residential zones where cars return in the evening.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204040438852.png" alt="image.png|750" /></p>
<p>The December plots reveal that different sections exhibit distinct daily parking behaviors. </p>
<p>Let's take 2 roads as examples.</p>
<p>Chuangye Road <strong>创业路（南油段）</strong>(the first chart) shows a pronounced midday dip: usage drops significantly around noon each day before rising again in the evening. This pattern is characteristic of areas where vehicles leave during daytime—likely due to commuters driving away for work or business—resulting in relatively low occupancy around noon.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204041101082.png" alt="image.png|400" /></p>
<p>In contrast, Haide Street <strong>海德二道</strong> (the No.5 chart) displays the opposite trend. Its usage peaks around midday and remains relatively high throughout the daytime hours. Such behavior suggests that this area functions as a commercial or office zone where vehicles arrive in the morning and stay parked during working hours, leading to higher occupancy around noon. Usage then decreases noticeably in the evening as vehicles leave the area.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204041447139.png" alt="image.png|400" /></p>
<p>These contrasting patterns highlight how parking data reflects the functional differences between neighborhoods: <strong>创业路 behaves more like a residential zone</strong>, while <strong>海德二道 aligns with daytime commercial activity</strong>.</p>
<p>创业路 Chuangye Road Landscape
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204041136959.png" alt="image.png|400" /></p>
<p>It looks like some place to live.</p>
<p>海德二道 Haide Street Landscape
We got Shenzhen bookstore 深圳书城 and several big stores here.
<img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204041747879.png" alt="image.png|400" /></p>
<p>That's why it has high parking utilization during daytime.</p>
<h3><strong>Weekly Variation: Weekdays vs. Weekends</strong></h3>
<p>A consistent weekly pattern is also visible: parking usage tends to increase on weekends and decrease on weekdays. This suggests different behavioral patterns between workdays—when many vehicles leave for commuting—and weekends, when residents stay nearby and overall parking occupancy rises.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204042259107.png" alt="image.png|700" /></p>
<h3><strong>Holiday Effect: Chinese New Year (February 2018)</strong></h3>
<p>Around February 5th, 2018—the period of the Chinese New Year—the usage across all sections drops sharply and remains low for several days. This corresponds to the nationwide travel season when many people return to their hometowns, resulting in significantly reduced parking demand throughout the city.</p>
<p><img src="https://blog-1327458544.cos.ap-guangzhou.myqcloud.com/FinalYear/20251204034119960.png" alt="image.png|600" /></p>
<p>The drawing code (not completed):</p>
<pre><code class="language-python"># 1. Read data
df = pd.read_csv(&quot;r5.csv&quot;)
df[&quot;percentage&quot;] = df[&quot;percentage&quot;].str.replace(&quot;%&quot;, &quot;&quot;).astype(float)
df[&quot;start_time&quot;] = pd.to_datetime(df[&quot;start_time&quot;])

# 2. Select the top 3 most frequent sections
top_sections = (
    df[&quot;section&quot;]
    .value_counts()
    .head(3)
    .index
    .tolist()
)

df_sel = df[df[&quot;section&quot;].isin(top_sections)]
df_sel = df_sel.sort_values([&quot;section&quot;, &quot;start_time&quot;])

# 3. Plot three subplots
fig, axes = plt.subplots(nrows=3, ncols=1, figsize=(16, 12), sharex=True)

if isinstance(axes, np.ndarray):
    axes = axes.flatten().tolist()
else:
    axes = [axes]

for ax, sec in zip(axes, top_sections):
    sub = df_sel[df_sel[&quot;section&quot;] == sec]

    ax.plot(sub[&quot;start_time&quot;], sub[&quot;percentage&quot;], linewidth=1)
    ax.fill_between(sub[&quot;start_time&quot;], sub[&quot;percentage&quot;], alpha=0.3)

    ax.set_ylabel(&quot;Usage (%)&quot;)
    ax.set_title(f&quot;Section: {sec}&quot;)
    ax.grid(True, linestyle=&quot;--&quot;, alpha=0.4)

axes[-1].set_xlabel(&quot;Time&quot;)

plt.show()</code></pre>
<pre><code class="language-python">import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.font_manager as fm
import matplotlib.dates as mdates

# -------- 字体设置 --------
font_path = &quot;/home/haibin/distributed_system/assignment3/static/NotoSansSC-Regular.ttf&quot;
fm.fontManager.addfont(font_path)
plt.rcParams[&quot;font.family&quot;] = &quot;Noto Sans SC&quot;
plt.rcParams[&quot;axes.unicode_minus&quot;] = False
# --------------------------

# 1. Load data
df = pd.read_csv(&quot;r5.csv&quot;)
df[&quot;percentage&quot;] = df[&quot;percentage&quot;].str.replace(&quot;%&quot;, &quot;&quot;).astype(float)
df[&quot;start_time&quot;] = pd.to_datetime(df[&quot;start_time&quot;])

number = 5

# 2. 选择 12 月最常出现的 3 个 section
top_sections = (
    df[&quot;section&quot;]
    .value_counts()
    .head(number)
    .index
    .tolist()
)

# 3. 只保留 2018-12 的数据
df_dec = df[
    (df[&quot;start_time&quot;] &gt;= &quot;2018-12-01&quot;) &amp;
    (df[&quot;start_time&quot;] &lt;  &quot;2018-12-21&quot;)
]

df_sel = df_dec[df_dec[&quot;section&quot;].isin(top_sections)]
df_sel = df_sel.sort_values([&quot;section&quot;, &quot;start_time&quot;])

# 4. 创建子图
fig, axes = plt.subplots(nrows=number, ncols=1, figsize=(24, number * 4), sharex=True)

if isinstance(axes, np.ndarray):
    axes = axes.flatten().tolist()
else:
    axes = [axes]

# ====== 预先算好每天的 0:00 和 12:00 ======
# 所有日期（按天归一化）
all_days = pd.date_range(&quot;2018-12-01&quot;, &quot;2018-12-21&quot;, freq=&quot;D&quot;)
midnights = all_days                # 每天 00:00
noons = all_days + pd.Timedelta(hours=12)  # 每天 12:00
# ======================================

for ax, sec in zip(axes, top_sections):
    sub = df_sel[df_sel[&quot;section&quot;] == sec]

    # 曲线 + 面积
    ax.plot(sub[&quot;start_time&quot;], sub[&quot;percentage&quot;], linewidth=1)
    ax.fill_between(sub[&quot;start_time&quot;], sub[&quot;percentage&quot;], alpha=0.3)

    # 画每天 0:00 的竖线（虚线），用来分隔日期
    for t in midnights:
        ax.axvline(t, linestyle=&quot;--&quot;, alpha=0.2)

    # 画每天 12:00 的竖线（点划线）
    for t in noons:
        ax.axvline(t, linestyle=&quot;:&quot;, alpha=0.2)

    ax.set_ylabel(&quot;Usage (%)&quot;)
    ax.set_title(f&quot;Section: {sec} — 2018年12月&quot;)
    ax.grid(True, linestyle=&quot;--&quot;, alpha=0.4)

# X 轴：日期 + 星期几，比如 12-01\nSat
locator = mdates.DayLocator(interval=1)  # 每天一个刻度
formatter = mdates.DateFormatter(&quot;%m-%d\n%a&quot;)  # 月-日 + 星期（Mon/Tue/...）

for ax in axes:
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(formatter)

axes[-1].set_xlabel(&quot;Time&quot;)

fig.suptitle(f&quot;Parking Usage Percentage in December 2018 (Top {number} Sections)&quot;, fontsize=18)
plt.tight_layout(rect=[0, 0.03, 1, 0.95])
plt.show()
</code></pre>
