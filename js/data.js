/**
 * NetPro 40 - Computer Network Fundamentals & Troubleshooting Master Class
 * Authored by Imran Hussain
 * 
 * Strict Curriculum Structure:
 * - Phase 1: 1 to 20 Topics (Foundations & Core Protocols)
 * - Phase 2: 21 to 30 Topics (Transport, Security & Infrastructure - 10 topics)
 * - Phase 3: 31 to 40 Topics (Diagnostics & Enterprise Troubleshooting - 10 topics)
 */

const NETPRO_PHASES = [
  {
    id: "phase1",
    phaseNum: 1,
    title: "Phase 1: Foundation & Core Protocols",
    range: "Topics 01 – 20",
    topicCount: 20,
    badge: "20 Topics",
    desc: "Networking architecture, OSI 7-Layer, TCP/IP, IPv4/IPv6, Subnetting, CIDR, DNS, DHCP, and ARP."
  },
  {
    id: "phase2",
    phaseNum: 2,
    title: "Phase 2: Transport, Security & Infrastructure",
    range: "Topics 21 – 30",
    topicCount: 10,
    badge: "10 Topics",
    desc: "Well-known ports, HTTP/HTTPS, SSH, VPN tunnels, Firewalls, Reverse Proxies, and Load Balancers."
  },
  {
    id: "phase3",
    phaseNum: 3,
    title: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    range: "Topics 31 – 40",
    topicCount: 10,
    badge: "10 Topics",
    desc: "Systematic 7-step diagnostics, Ping, Traceroute, DNS debugging, Netstat, Wireshark, and TCPDump."
  }
];

const NETPRO_TOPICS = [
  // ================= PHASE 1: TOPICS 1 TO 20 =================
  {
    num: 1,
    id: "day1",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "What is Networking?",
    tag: "Architecture",
    readTime: "12 min",
    desc: "Network definition, transmission mediums, peer-to-peer vs client-server topologies, and enterprise network design principles.",
    keyTakeaway: "A computer network is a collection of interconnected devices that share resources and communicate using standardized protocols over physical or wireless media."
  },
  {
    num: 2,
    id: "day2",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "LAN, WAN & Internet Architecture",
    tag: "Topology",
    readTime: "14 min",
    desc: "Local Area Networks, Wide Area Networks, MAN, PAN, edge routing, autonomous systems, and how the global Internet interconnects.",
    keyTakeaway: "LANs operate within bounded physical spaces with high throughput and low latency, whereas WANs traverse broad geographic spans using ISPs and Autonomous Systems (AS)."
  },
  {
    num: 3,
    id: "day3",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Network Devices (Hub, Switch, Router)",
    tag: "Hardware",
    readTime: "16 min",
    desc: "Layer 1 hubs, Layer 2 intelligent switches, Layer 3 multi-protocol routers, broadcast vs collision domains, and ASICs.",
    keyTakeaway: "Hubs repeat all signals (single collision domain); switches segment collision domains using MAC tables; routers segment broadcast domains using IP routing tables."
  },
  {
    num: 4,
    id: "day4",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "OSI 7-Layer Reference Model",
    tag: "Core Model",
    readTime: "20 min",
    desc: "Complete breakdown of Physical, Data Link, Network, Transport, Session, Presentation, and Application layers with data units (PDU).",
    keyTakeaway: "The OSI model provides an architectural framework to isolate network communication into 7 distinct abstraction layers from physical bits up to application software."
  },
  {
    num: 5,
    id: "day5",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "TCP/IP Protocol Suite",
    tag: "Core Model",
    readTime: "15 min",
    desc: "The 4-layer DoD Internet architecture, protocol encapsulation, decapsulation headers, and direct comparison with the OSI model.",
    keyTakeaway: "The TCP/IP model compresses communication into 4 practical layers: Network Access, Internet (IP), Transport (TCP/UDP), and Application (HTTP/DNS/SSH)."
  },
  {
    num: 6,
    id: "day6",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "MAC Address & Layer 2 Framing",
    tag: "Data Link",
    readTime: "14 min",
    desc: "48-bit hardware identifiers, OUI vendor prefixes, Ethernet frames, preamble, CRC checks, and switch MAC learning tables (CAM).",
    keyTakeaway: "Every Network Interface Card has a globally unique 48-bit MAC address. Switches inspect source MACs to populate CAM tables and forward frames by destination MAC."
  },
  {
    num: 7,
    id: "day7",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "IP Addressing Fundamentals",
    tag: "Network Layer",
    readTime: "15 min",
    desc: "Logical host addressing, network vs host portion, dotted decimal notation, and binary conversion essentials.",
    keyTakeaway: "IP addresses provide logical layer 3 routing identifiers. Every IP comprises a Network ID (which subnet) and a Host ID (which specific device)."
  },
  {
    num: 8,
    id: "day8",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "IPv4 Architecture & Header Format",
    tag: "Addressing",
    readTime: "18 min",
    desc: "32-bit address space, IPv4 packet header fields (TTL, Protocol, Checksum, Flags, Fragmentation), and MTU limits.",
    keyTakeaway: "An IPv4 header is typically 20 bytes long and carries critical fields like Time to Live (TTL) to prevent infinite routing loops, and Protocol number (6 for TCP, 17 for UDP)."
  },
  {
    num: 9,
    id: "day9",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "IPv6 Basics & Next-Gen Addressing",
    tag: "IPv6",
    readTime: "18 min",
    desc: "128-bit hex addresses, address compression rules, SLAAC auto-configuration, unicast, multicast, anycast, and dual-stack migration.",
    keyTakeaway: "IPv6 provides 3.4 x 10^38 addresses, eliminating NAT dependency, embedding mandatory IPsec capabilities, and replacing ARP with Neighbor Discovery Protocol (NDP)."
  },
  {
    num: 10,
    id: "day10",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Public vs Private IP (RFC 1918)",
    tag: "Addressing",
    readTime: "13 min",
    desc: "Routable public IPs, non-routable private address blocks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and loopback ranges.",
    keyTakeaway: "RFC 1918 reserves three private address spaces that are dropped by Internet routers and require NAT to access public networks."
  },
  {
    num: 11,
    id: "day11",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Subnet Mask & Network Boundaries",
    tag: "Subnetting",
    readTime: "16 min",
    desc: "Default classful masks (Class A, B, C), bitwise ANDing operations, and determining network and broadcast addresses.",
    keyTakeaway: "A subnet mask determines which bits belong to the network and which to hosts. Bitwise ANDing between an IP and its mask produces the Network ID."
  },
  {
    num: 12,
    id: "day12",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "CIDR (Classless Inter-Domain Routing)",
    tag: "Subnetting",
    readTime: "15 min",
    desc: "Elimination of classful routing, slash notation (/24, /27, /30), prefix aggregation, and route summarization.",
    keyTakeaway: "CIDR replaced rigid Class A/B/C boundaries with flexible prefix lengths (/n), dramatically slowing IPv4 depletion and reducing global routing table size."
  },
  {
    num: 13,
    id: "day13",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Subnetting Step-by-Step",
    tag: "Subnetting",
    readTime: "22 min",
    desc: "The powers-of-two formula (2^s subnets, 2^h-2 hosts), custom subnetting shortcuts, and point-to-point /30 and /31 links.",
    keyTakeaway: "To subnet: identify required hosts, determine host bits h such that 2^h - 2 >= hosts, calculate borrowed subnet bits s, and find block size 256 - mask."
  },
  {
    num: 14,
    id: "day14",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Default Gateway & First-Hop Forwarding",
    tag: "Routing",
    readTime: "14 min",
    desc: "How hosts forward packets outside local subnets, ARP requests to gateway MAC, and FHRP protocols (HSRP, VRRP).",
    keyTakeaway: "When a target IP is off-subnet, the host encapsulates the IP packet into a frame addressed to the Layer 2 MAC address of its Default Gateway router."
  },
  {
    num: 15,
    id: "day15",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "DNS (Domain Name System)",
    tag: "Services",
    readTime: "18 min",
    desc: "Recursive vs authoritative resolvers, root nameservers, TLDs, DNS record types (A, AAAA, CNAME, MX, TXT, PTR), and DNS caching.",
    keyTakeaway: "DNS acts as the phonebook of the Internet, translating human-friendly domain names (techfin.com) into IP addresses across a hierarchical tree."
  },
  {
    num: 16,
    id: "day16",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "DHCP (Dynamic Host Configuration)",
    tag: "Services",
    readTime: "16 min",
    desc: "The DORA negotiation process (Discover, Offer, Request, Acknowledge), DHCP leases, scopes, reservation, and relay agents.",
    keyTakeaway: "DHCP automates network setup via DORA: Discover (broadcast), Offer (unicast/broadcast), Request (client chooses), Acknowledge (server locks lease)."
  },
  {
    num: 17,
    id: "day17",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "ARP (Address Resolution Protocol)",
    tag: "Protocols",
    readTime: "15 min",
    desc: "Resolving IP addresses to MAC hardware addresses, ARP cache tables, gratuitous ARP, and ARP poisoning prevention.",
    keyTakeaway: "ARP bridges Layer 3 logical IPs to Layer 2 physical MACs. Devices broadcast 'Who has this IP?' and the target responds with its MAC address."
  },
  {
    num: 18,
    id: "day18",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "NAT (Network Address Translation)",
    tag: "Protocols",
    readTime: "17 min",
    desc: "Static NAT, Dynamic NAT, Port Address Translation (PAT / NAT Overload), translation tables, and private IP masquerading.",
    keyTakeaway: "PAT (NAT Overload) maps thousands of internal private IP:port pairs to a single external public IP by tracking source port translations."
  },
  {
    num: 19,
    id: "day19",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "Routing Fundamentals & Routing Tables",
    tag: "Routing",
    readTime: "19 min",
    desc: "Static routing vs Dynamic protocols (OSPF, BGP, RIP), longest prefix match algorithms, metric calculations, and administrative distance.",
    keyTakeaway: "Routers always select the route with the Longest Prefix Match (most specific subnet mask), tie-breaking by lowest Administrative Distance."
  },
  {
    num: 20,
    id: "day20",
    phase: 1,
    phaseTitle: "Phase 1: Foundation & Core Protocols",
    title: "TCP vs UDP Comparison",
    tag: "Transport",
    readTime: "18 min",
    desc: "Connection-oriented reliable delivery vs connectionless low-latency datagrams, flow control, sliding window, and use-cases.",
    keyTakeaway: "TCP guarantees ordered, loss-free delivery via 3-way handshakes and acknowledgments; UDP trades reliability for raw speed and minimal header overhead."
  },

  // ================= PHASE 2: TOPICS 21 TO 30 =================
  {
    num: 21,
    id: "day21",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "Common Network Ports & Services",
    tag: "Ports",
    readTime: "14 min",
    desc: "Well-known ports (0-1023), registered ports, ephemeral ports, HTTP 80, HTTPS 443, SSH 22, DNS 53, DHCP 67/68, and RDP 3389.",
    keyTakeaway: "Ports act as multiplexing endpoints that direct incoming network packets to the exact running daemon application on the operating system."
  },
  {
    num: 22,
    id: "day22",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "HTTP & HTTPS Protocols",
    tag: "Application",
    readTime: "17 min",
    desc: "Stateless request/response cycle, HTTP methods (GET, POST, PUT, DELETE), status codes (2xx, 3xx, 4xx, 5xx), and TLS/SSL encryption.",
    keyTakeaway: "HTTPS wraps cleartext HTTP inside TLS encryption, authenticating server identity via X.509 digital certificates and establishing session ciphers."
  },
  {
    num: 23,
    id: "day23",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "FTP & SFTP File Transfer",
    tag: "Application",
    readTime: "13 min",
    desc: "Cleartext FTP active vs passive modes, dual-channel control/data connections, and SSH-encrypted SFTP architecture.",
    keyTakeaway: "Legacy FTP transmits credentials in plaintext across separate control (21) and data (20) channels, whereas SFTP runs entirely through a single secure SSH stream (port 22)."
  },
  {
    num: 24,
    id: "day24",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "SSH (Secure Shell) Protocol",
    tag: "Security",
    readTime: "16 min",
    desc: "Asymmetric public-key cryptography, Diffie-Hellman key exchange, symmetric session ciphers, and secure remote command access.",
    keyTakeaway: "SSH provides tamper-proof terminal shell access using asymmetric public key pairs for authentication and negotiated symmetric keys for fast encryption."
  },
  {
    num: 25,
    id: "day25",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "Email Protocols (SMTP, POP3, IMAP)",
    tag: "Application",
    readTime: "15 min",
    desc: "Mail submission via SMTP (port 25/587), local mailbox retrieval via POP3 (110/995), multi-device sync via IMAP (143/993).",
    keyTakeaway: "SMTP pushes messages between mail servers; POP3 downloads and deletes from server; IMAP synchronizes folders and flags across multiple devices simultaneously."
  },
  {
    num: 26,
    id: "day26",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "ICMP (Internet Control Message Protocol)",
    tag: "Protocols",
    readTime: "15 min",
    desc: "Network error messaging, Echo Request (Type 8) and Echo Reply (Type 0), Destination Unreachable (Type 3), and Time Exceeded (Type 11).",
    keyTakeaway: "ICMP is a companion protocol to IP used for diagnostic signaling and error feedback. Diagnostic utilities like Ping and Traceroute rely directly on ICMP messages."
  },
  {
    num: 27,
    id: "day27",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "VPN (Virtual Private Networks)",
    tag: "Security",
    readTime: "18 min",
    desc: "Site-to-site vs remote-access tunnels, IPsec encapsulation (AH, ESP), WireGuard, OpenVPN, and enterprise secure tunnels.",
    keyTakeaway: "VPNs create encrypted tunnels over untrusted networks. IPsec Encapsulating Security Payload (ESP) delivers confidentiality, authentication, and anti-replay protection."
  },
  {
    num: 28,
    id: "day28",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "Firewalls (Stateful vs Stateless)",
    tag: "Security",
    readTime: "18 min",
    desc: "Packet filtering rules, stateful connection tracking tables, Next-Gen Firewalls (NGFW), deep packet inspection (DPI), and WAF.",
    keyTakeaway: "Stateless firewalls evaluate packets in isolation based on static ACLs; stateful firewalls track bidirectional connection sessions (ESTABLISHED/RELATED state)."
  },
  {
    num: 29,
    id: "day29",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "Proxy Servers (Forward & Reverse)",
    tag: "Infrastructure",
    readTime: "16 min",
    desc: "Client-side forward proxies for caching and filtering vs server-side reverse proxies (Nginx, HAProxy) for SSL termination and security.",
    keyTakeaway: "Forward proxies protect and anonymize clients visiting the web; reverse proxies stand in front of backend servers for SSL offloading, caching, and load balancing."
  },
  {
    num: 30,
    id: "day30",
    phase: 2,
    phaseTitle: "Phase 2: Transport, Security & Infrastructure",
    title: "Load Balancers (Layer 4 vs Layer 7)",
    tag: "Infrastructure",
    readTime: "17 min",
    desc: "Traffic distribution algorithms (Round Robin, Least Connections, IP Hash), health checks, high availability, and session persistence.",
    keyTakeaway: "Layer 4 load balancers route blindly by IP:port with blazing throughput; Layer 7 balancers inspect HTTP URLs, headers, and cookies for intelligent application routing."
  },

  // ================= PHASE 3: TOPICS 31 TO 40 =================
  {
    num: 31,
    id: "day31",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Ping Troubleshooting Mastery",
    tag: "Diagnostics",
    readTime: "15 min",
    desc: "ICMP troubleshooting workflows, diagnosing packet loss, RTT latency jitter, custom buffer sizing, and MTU discovery.",
    keyTakeaway: "Ping validates Layer 3 reachability. Testing ping against 127.0.0.1 confirms TCP/IP stack; default gateway confirms local link; public IP confirms routing."
  },
  {
    num: 32,
    id: "day32",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Traceroute & Path Analysis",
    tag: "Diagnostics",
    readTime: "16 min",
    desc: "TTL increment mechanism, identifying routing loops, intermediate hop timeouts, asymmetric routing, and mtr diagnostics.",
    keyTakeaway: "Traceroute sends packets with incremental TTL values starting at 1. Each intermediate router decrements TTL to 0 and returns an ICMP Time Exceeded message."
  },
  {
    num: 33,
    id: "day33",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "IP Configuration Tools (ipconfig / ip / ifconfig)",
    tag: "Diagnostics",
    readTime: "15 min",
    desc: "Inspecting adapter configurations, releasing/renewing DHCP leases, viewing gateway addresses, and interface status flags.",
    keyTakeaway: "Diagnostic baseline starts at the host interface. Command `ipconfig /all` or `ip addr show` reveals IP, subnet, MAC, gateway, and DHCP lease status."
  },
  {
    num: 34,
    id: "day34",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "DNS Troubleshooting (nslookup & dig)",
    tag: "Diagnostics",
    readTime: "16 min",
    desc: "Testing DNS resolution against custom DNS servers (8.8.8.8, 1.1.1.1), querying specific record types (MX, TXT), and flushing DNS cache.",
    keyTakeaway: "When IP ping works but domain ping fails, the root cause is DNS. Using `nslookup domain 8.8.8.8` isolate local DNS configuration from upstream authoritative errors."
  },
  {
    num: 35,
    id: "day35",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Port Troubleshooting (netstat, telnet, nc)",
    tag: "Diagnostics",
    readTime: "17 min",
    desc: "Viewing active TCP listening sockets, identifying process IDs (PID), verifying firewall port access using Netcat and Telnet.",
    keyTakeaway: "`netstat -ano` identifies listening TCP sockets and mapped process IDs. Tools like `nc -zv host port` or `Test-NetConnection` confirm firewall port openness."
  },
  {
    num: 36,
    id: "day36",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Routing Table Troubleshooting (route / ip route)",
    tag: "Diagnostics",
    readTime: "16 min",
    desc: "Analyzing default routes (0.0.0.0/0), local subnet routes, metric prioritization, and debugging unreachable gateways.",
    keyTakeaway: "Host or router communication fails if a route to the destination is missing. `route print` or `ip route` shows which adapter and gateway handle destination subnets."
  },
  {
    num: 37,
    id: "day37",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Firewall Diagnostics & Rule Testing",
    tag: "Diagnostics",
    readTime: "17 min",
    desc: "Detecting dropped packets, checking iptables/nftables chains, inspecting Windows Defender Firewall logs, and security rule audits.",
    keyTakeaway: "Firewall drops silently swallow SYN packets without sending RST. Reviewing security logs and testing SYN connectivity confirms ACL blocking."
  },
  {
    num: 38,
    id: "day38",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "End-to-End Network Connectivity Methodology",
    tag: "Workflow",
    readTime: "20 min",
    desc: "The 7-step systematic troubleshooting model from Layer 1 physical cable checks up to Layer 7 application diagnostics.",
    keyTakeaway: "Follow the systematic OSI bottom-up model: 1. Physical cable/link -> 2. MAC/VLAN link -> 3. IP/Gateway -> 4. TCP Port reachability -> 7. Application response."
  },
  {
    num: 39,
    id: "day39",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "Wireshark Packet Analysis Deep Dive",
    tag: "Packet Capture",
    readTime: "24 min",
    desc: "Live interface packet capturing, display vs capture filters, analyzing TCP 3-way handshakes, finding retransmissions, and SSL handshakes.",
    keyTakeaway: "Wireshark provides definitive packet-level truth. Analyzing SYN, SYN-ACK, ACK sequences, retransmissions, and window sizes diagnoses root causes with 100% accuracy."
  },
  {
    num: 40,
    id: "day40",
    phase: 3,
    phaseTitle: "Phase 3: Diagnostics & Enterprise Troubleshooting",
    title: "TCPDump Command-Line Packet Sniffing",
    tag: "Packet Capture",
    readTime: "22 min",
    desc: "Capturing packets directly on headless Linux servers, filtering by host and port, writing .pcap files, and real-time network debugging.",
    keyTakeaway: "On production headless Linux servers without GUI, `tcpdump -nn -i eth0 port 443 -w capture.pcap` provides surgical command-line packet sniffing capabilities."
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NETPRO_PHASES, NETPRO_TOPICS };
}
