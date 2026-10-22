---
title: "A Standard for the Transmission of IP Datagrams on Avian Carriers"
description: "基于信鸽的IP网络传输 This protocol is in RFC 1149 version https://datatracker.ietf.org/doc/html/rfc1149 A Standard for the Transmission of IP Datagrams on Avian Carriers Status of this Memo This memo describes an experimental me…"
publishedAt: "2024-10-29T13:18:10Z"
updatedAt: "2024-11-05T14:10:48Z"
category: "Computer Network"
categories: ["Computer Network"]
tags: ["IP", "计算机网络"]
author: "GB"
draft: false
slug: "a-standard-for-the-transmission-of-ip-datagrams-on-avian-carriers"
legacySlug: "a-standard-for-the-transmission-of-ip-datagrams-on-avian-carriers"
oldSlugs: []
wordpressId: 388
sourceUrl: "https://www.haibinlaiblog.top/index.php/a-standard-for-the-transmission-of-ip-datagrams-on-avian-carriers/"
commentCount: 0
viewCount: 1260
likeCount: 1
dislikeCount: 9
showCitation: true
featuredImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/a-standard-for-the-transmission-of-ip-datagrams-on-avian-carriers/body-001-0e9b3182e426.webp"
importedFromWordPress: true
cardImage: "https://raw.githubusercontent.com/HaibinLai/image-backend/main/2024-10/a-standard-for-the-transmission-of-ip-datagrams-on-avian-carriers.webp"
---
<p>基于信鸽的IP网络传输
This protocol is in RFC 1149 version
<a href="https://datatracker.ietf.org/doc/html/rfc1149">https://datatracker.ietf.org/doc/html/rfc1149</a></p>
<h2>A Standard for the Transmission of IP Datagrams on Avian Carriers</h2>
<h3>Status of this Memo</h3>
<p>This memo describes an experimental method for the encapsulation of
IP datagrams in avian carriers.  This specification is primarily
useful in Metropolitan Area Networks.  This is an experimental, not
recommended standard.  Distribution of this memo is unlimited.</p>
<h3>Overview and Rational</h3>
<p>Avian carriers can provide high delay, low throughput, and low
altitude service.  The connection topology is limited to a single
point-to-point path for each carrier, used with standard carriers,
but many carriers can be used without significant interference with
each other, outside of early spring.  This is because of the 3D ether
space available to the carriers, in contrast to the 1D ether used by
IEEE802.3.  The carriers have an intrinsic collision avoidance
system, which increases availability.  Unlike some network
technologies, such as packet radio, communication is not limited to
line-of-sight distance.  Connection oriented service is available in
some cities, usually based upon a central hub topology.</p>
<h3>Frame Format</h3>
<p>The IP datagram is printed, on a small scroll of paper, in
hexadecimal, with each octet separated by whitestuff and blackstuff.
The scroll of paper is wrapped around one leg of the avian carrier.
A band of duct tape is used to secure the datagram's edges.  The
bandwidth is limited to the leg length.  The MTU is variable, and
paradoxically, generally increases with increased carrier age.  A
typical MTU is 256 milligrams.  Some datagram padding may be needed.</p>
<p>Upon receipt, the duct tape is removed and the paper copy of the
datagram is optically scanned into a electronically transmittable
form.</p>
<h3>Discussion</h3>
<p>Multiple types of service can be provided with a prioritized pecking
order.  An additional property is built-in worm detection and
eradication.  Because IP only guarantees best effort delivery, loss
of a carrier can be tolerated.  With time, the carriers are self-</p>
<p>Waitzman                                                        [Page 1]</p>
<p>RFC 1149             IP Datagrams on Avian Carriers         1 April 1990</p>
<p>regenerating.  While broadcasting is not specified, storms can cause
data loss.  There is persistent delivery retry, until the carrier
drops.  Audit trails are automatically generated, and can often be
found on logs and cable trays.</p>
<p>Security Considerations</p>
<p>Security is not generally a problem in normal operation, but special
measures must be taken (such as data encryption) when avian carriers
are used in a tactical environment.</p>
<p>Author's Address</p>
<p>David Waitzman
BBN Systems and Technologies Corporation
BBN Labs Division
10 Moulton Street
Cambridge, MA 02238</p>
<p>Phone: (617) 873-4323</p>
<p>EMail: dwaitzman@BBN.COM</p>
