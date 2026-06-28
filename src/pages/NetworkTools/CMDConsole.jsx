import { useState, useRef, useEffect, useCallback } from 'react';
import CopyButton from '../../components/common/CopyButton';

const DEFAULT_PROMPT = 'C:\\Users\\Admin>';

const ALL_COMMANDS = [
  { cmd: 'ping', args: '<host>', desc: 'Test reachability and latency', icon: '📶', cat: 'Network' },
  { cmd: 'ping -t', args: '<host>', desc: 'Continuous ping until stopped', icon: '🔄', cat: 'Network' },
  { cmd: 'tracert', args: '<host>', desc: 'Trace route to destination', icon: '🗺️', cat: 'Network' },
  { cmd: 'pathping', args: '<host>', desc: 'Route tracing with packet loss stats', icon: '📊', cat: 'Network' },
  { cmd: 'nslookup', args: '<host>', desc: 'DNS address lookup', icon: '🔍', cat: 'Network' },
  { cmd: 'nslookup -type=mx', args: '<host>', desc: 'DNS MX record lookup', icon: '📧', cat: 'Network' },
  { cmd: 'nslookup -type=all', args: '<host>', desc: 'All DNS records', icon: '📋', cat: 'Network' },
  { cmd: 'netstat', args: '', desc: 'Display active network connections', icon: '🔌', cat: 'Network' },
  { cmd: 'netstat -b', args: '', desc: 'Connections with executable names', icon: '⚙️', cat: 'Network' },
  { cmd: 'ipconfig', args: '', desc: 'Show IP configuration', icon: '🖥️', cat: 'Network' },
  { cmd: 'ipconfig /all', args: '', desc: 'Detailed IP config', icon: '📄', cat: 'Network' },
  { cmd: 'arp -a', args: '', desc: 'Show ARP cache table', icon: '📋', cat: 'Network' },
  { cmd: 'route print', args: '', desc: 'Show routing table', icon: '🗺️', cat: 'Network' },
  { cmd: 'net view', args: '', desc: 'List network resources', icon: '📁', cat: 'Network' },
  { cmd: 'systeminfo', args: '', desc: 'OS and hardware info', icon: '💻', cat: 'System' },
  { cmd: 'hostname', args: '', desc: 'Display computer name', icon: '🏷️', cat: 'System' },
  { cmd: 'net users', args: '', desc: 'List user accounts', icon: '👤', cat: 'System' },
  { cmd: 'whoami', args: '', desc: 'Current user name', icon: '🆔', cat: 'System' },
  { cmd: 'ver', args: '', desc: 'Windows version', icon: '📌', cat: 'System' },
  { cmd: 'date /t', args: '', desc: 'Current date', icon: '📅', cat: 'System' },
  { cmd: 'time /t', args: '', desc: 'Current time', icon: '⏰', cat: 'System' },
  { cmd: 'echo', args: '<text>', desc: 'Display text with variable expansion (%username%)', icon: '🖊️', cat: 'Text' },
  { cmd: 'echo %var%', args: '', desc: 'Display environment variable value', icon: '📝', cat: 'Text' },
  { cmd: 'set', args: '', desc: 'Show all environment variables', icon: '📋', cat: 'Text' },
  { cmd: 'set VAR=value', args: '', desc: 'Set a temporary environment variable', icon: '✏️', cat: 'Text' },
  { cmd: 'type', args: '<file>', desc: 'Display contents of a text file', icon: '📄', cat: 'Text' },
  { cmd: 'more', args: '<file>', desc: 'Display file page by page', icon: '📑', cat: 'Text' },
  { cmd: 'find', args: '"text" <file>', desc: 'Search for text in a file', icon: '🔎', cat: 'Text' },
  { cmd: 'dir', args: '', desc: 'List files in current directory', icon: '📂', cat: 'Text' },
  { cmd: 'cd', args: '<path>', desc: 'Change current directory', icon: '📁', cat: 'Text' },
  { cmd: 'color', args: '<hex>', desc: 'Change terminal colors (e.g. color 0a)', icon: '🎨', cat: 'Text' },
  { cmd: 'prompt', args: '<text>', desc: 'Change the command prompt', icon: '💬', cat: 'Text' },
  { cmd: 'cls', args: '', desc: 'Clear the screen', icon: '🔄', cat: 'System' },
  { cmd: 'help', args: '', desc: 'Show this help', icon: '❓', cat: 'System' },
];

const QUICK_FAVORITES = [
  { cmd: 'ping', args: '8.8.8.8', label: '📶 Ping' },
  { cmd: 'ping -t', args: '8.8.8.8', label: '🔄 Ping -t' },
  { cmd: 'tracert', args: 'google.com', label: '🗺️ Tracert' },
  { cmd: 'pathping', args: 'google.com', label: '📊 PathPing' },
  { cmd: 'nslookup', args: 'google.com', label: '🔍 DNS' },
  { cmd: 'ipconfig', args: '', label: '🖥️ IPConfig' },
  { cmd: 'netstat', args: '', label: '🔌 Netstat' },
  { cmd: 'systeminfo', args: '', label: '💻 System' },
  { cmd: 'echo', args: 'Hello World! %username%', label: '🖊️ Echo' },
  { cmd: 'set', args: '', label: '📋 Env Vars' },
  { cmd: 'type', args: 'readme.txt', label: '📄 Readme' },
  { cmd: 'dir', args: '', label: '📂 Dir' },
];

const SIMULATED_FILES = {
  'readme.txt': `Welcome to the CMD Network Console!
=====================================
A Windows-style command terminal for network diagnostics.

Quick start:
  - Type 'help' to see all commands
  - Use Tab to autocomplete commands
  - Up/Down arrows for command history
  - Use & to chain commands: ping 8.8.8.8 & ipconfig

Network commands:
  ping, tracert, pathping, nslookup, netstat, ipconfig

Text commands:
  echo, set, type, find, dir, cd, color, prompt

File system:
  C:\\Users\\Admin> dir
  C:\\Users\\Admin> type readme.txt
  C:\\Users\\Admin> type config.ini
  C:\\Users\\Admin> type hosts

System info:
  systeminfo, hostname, whoami, ver, net users

  Happy networking!`,
  'config.ini': `[network]
hostname = DESKTOP-PC
domain = WORKGROUP
dns_primary = 8.8.8.8
dns_secondary = 1.1.1.1
dhcp_enabled = true
ip_address = 192.168.1.100
subnet_mask = 255.255.255.0
gateway = 192.168.1.1

[services]
http_proxy = disabled
firewall = enabled
remote_desktop = enabled
file_sharing = enabled

[logging]
level = INFO
max_size_mb = 50
path = C:\\Logs\\network.log

[monitoring]
ping_interval = 30
alert_on_loss = true
alert_email = admin@example.com`,
  'hosts': `# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# localhost name resolution is handled within DNS itself.
127.0.0.1       localhost
::1             localhost
192.168.1.10    dev-server.local
192.168.1.20    staging.local
10.0.0.1        gateway.local
# Blocked sites
127.0.0.1       ads.example.com
127.0.0.1       tracker.example.com`,
  'network.log': `[2024-01-15 09:15:23] INFO  Network interface Ethernet0 connected
[2024-01-15 09:15:23] INFO  DHCP lease obtained: 192.168.1.100
[2024-01-15 09:15:24] INFO  DNS configured: 8.8.8.8, 1.1.1.1
[2024-01-15 09:15:30] INFO  Ping to 8.8.8.8: 12ms TTL=117
[2024-01-15 09:15:35] INFO  Ping to 8.8.8.8: 14ms TTL=117
[2024-01-15 09:16:00] WARN  Ping to 8.8.8.8: Request timed out
[2024-01-15 09:16:05] INFO  Ping to 8.8.8.8: 15ms TTL=117
[2024-01-15 09:17:00] INFO  SSL certificate check for google.com: valid (45 days remaining)
[2024-01-15 09:18:00] INFO  Traceroute to google.com: 7 hops, 16ms avg
[2024-01-15 09:20:00] INFO  System health check: OK (CPU 23%, RAM 8.2/16GB)`,
  'notes.txt': `=== Network Notes ===
Server IPs:
  Web:     10.0.0.10:80
  API:     10.0.0.11:443
  DB:      10.0.0.12:3306
  DNS:     10.0.0.1:53

Credentials (stored in vault):
  Admin:   admin / ********
  Monitor: monitor / ********

Scheduled Tasks:
  Backup:    Daily at 02:00
  Health:    Every 15 min
  SSL Check: Weekly on Monday`,
  'script.bat': `@echo off
REM Network diagnostic script
echo ================================
echo Network Diagnostics
echo ================================
echo.
echo Checking IP configuration...
ipconfig
echo.
echo Testing connectivity...
ping 8.8.8.8
echo.
echo Checking DNS resolution...
nslookup google.com
echo.
echo ================================
echo Diagnostics complete.
pause`,
};

const ENV_VARIABLES = {
  '%username%': 'Admin', '%computername%': 'DESKTOP-A7B3C2', '%userdomain%': 'WORKGROUP',
  '%os%': 'Windows_NT', '%processor_architecture%': 'AMD64', '%number_of_processors%': '8',
  '%systemdrive%': 'C:', '%systemroot%': 'C:\\Windows', '%windir%': 'C:\\Windows',
  '%temp%': 'C:\\Users\\Admin\\AppData\\Local\\Temp', '%tmp%': 'C:\\Users\\Admin\\AppData\\Local\\Temp',
  '%path%': 'C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\',
  '%date%': new Date().toLocaleDateString('en-US'),
  '%time%': new Date().toLocaleTimeString(),
  '%random%': () => Math.floor(Math.random() * 10000).toString(),
};

function getCwd(path) { return `C:\\Users\\Admin${path || ''}>`; }

function expandVars(text) {
  return text.replace(/%\w+%/gi, match => {
    const v = ENV_VARIABLES[match.toLowerCase()];
    if (typeof v === 'function') return v();
    if (typeof v === 'string') return v;
    const custom = userEnv[match.toLowerCase()];
    return custom !== undefined ? custom : match;
  });
}

let userEnv = {};

function simulatePing(host, continuous) {
  const ip = host.match(/^\d+\.\d+\.\d+\.\d+$/) ? host : `${host} [${[192, 168, Math.floor(Math.random() * 255), Math.floor(Math.random() * 254) + 1].join('.')}]`;
  let out = `\nPinging ${ip} with 32 bytes of data:\n\n`;
  let received = 0; const times = [];
  const total = continuous ? 8 : 4;
  for (let i = 0; i < total; i++) {
    if (Math.random() > 0.9) { out += '  Request timed out.\n'; } else {
      const ms = (5 + Math.random() * 95).toFixed(1);
      const ttl = Math.floor(50 + Math.random() * 70);
      out += `  Reply from ${ip}: bytes=32 time=${ms}ms TTL=${ttl}\n`;
      received++; times.push(parseFloat(ms));
    }
  }
  const loss = ((total - received) / total * 100).toFixed(0);
  out += `\n  Ping statistics for ${ip}:\n    Packets: Sent = ${total}, Received = ${received}, Lost = ${total - received} (${loss}% loss),\n`;
  if (times.length) out += `  Approximate round trip times:\n    Minimum = ${Math.min(...times).toFixed(1)}ms, Maximum = ${Math.max(...times).toFixed(1)}ms, Average = ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}ms\n`;
  return out;
}

function simulateTracert(host) {
  const lastIp = [142, 250, 80, Math.floor(Math.random() * 254) + 1].join('.');
  const hops = [
    { hop: 1, ip: '192.168.1.1', ms: '1ms', name: 'router.local' },
    { hop: 2, ip: '10.0.0.1', ms: '3ms', name: 'isp-gw-01.isp.net' },
    { hop: 3, ip: '72.14.204.1', ms: '8ms', name: '72.14.204.1' },
    { hop: 4, ip: '74.125.37.165', ms: '12ms', name: '209.85.252.1' },
    { hop: 5, ip: '216.58.194.94', ms: '15ms', name: 'lhr25s41-in-f94.1e100.net' },
    { hop: 6, ip: lastIp, ms: '16ms', name: 'lhr25s46-in-f14.1e100.net' },
    { hop: 7, ip: lastIp, ms: '16ms', name: host },
  ];
  let out = `\nTracing route to ${host} [${lastIp}]\nover a maximum of 30 hops:\n\n`;
  hops.forEach(h => {
    const r1 = (1 + Math.random() * 5).toFixed(0); const r2 = (1 + Math.random() * 5).toFixed(0); const r3 = (1 + Math.random() * 5).toFixed(0);
    out += `  ${h.hop.toString().padEnd(3)}  ${r1.padStart(4)}ms   ${r2.padStart(4)}ms   ${r3.padStart(4)}ms  ${h.name} [${h.ip}]\n`;
  });
  out += '\n  Trace complete.\n';
  return out;
}

function simulatePathPing(host) {
  let out = `\nComputing statistics for ${host}...\n  ${new Array(50).fill('.').join('')}\n\n  Source to Here   This Node/Link\n  Hop  RTT    Lost/Sent = Pct  Lost/Sent = Pct  Address\n`;
  const hops = ['router.local [192.168.1.1]', 'isp-gw.isp.net [10.0.0.1]', 'core1.isp.net [72.14.204.1]', 'lhr25s41-in-f14.1e100.net [142.250.80.46]'];
  hops.forEach((h, i) => {
    const rtt = (5 + Math.random() * 20).toFixed(0); const loss = Math.random() > 0.85 ? Math.floor(Math.random() * 20) : 0;
    out += `  ${(i + 1).toString().padEnd(4)}${rtt.padStart(4)}ms  ${(100 - loss).toString().padStart(3)}/100 = ${loss}%    ${(100 - loss).toString().padStart(3)}/100 = ${loss}%    ${h}\n`;
  });
  return out;
}

function simulateNSLookup(host, type) {
  const ip = [8, 8, 8, Math.floor(Math.random() * 254) + 1].join('.');
  let out = `\n  Server:  dns.google\n  Address:  8.8.8.8\n\n  Name:    ${host}\n  Address: ${ip}\n`;
  if (type === 'mx') out += `\n  ${host}  MX preference = 10, mail exchanger = mail.${host}\n  ${host}  MX preference = 20, mail exchanger = alt2.${host}\n`;
  if (type === 'all') out += `\n  ${host}  AAAA IPv6 Address = 2001:db8::1\n  ${host}  TXT Record = "v=spf1 include:_spf.google.com ~all"\n  ${host}  NS Record = ns1.${host}\n`;
  return out;
}

function simulateNetstat(bFlag) {
  const conns = [
    { p: 'TCP', l: '192.168.1.100:54321', f: '142.250.80.46:443', s: 'ESTABLISHED', exe: 'chrome.exe' },
    { p: 'TCP', l: '192.168.1.100:54322', f: '104.16.132.229:443', s: 'ESTABLISHED', exe: 'chrome.exe' },
    { p: 'TCP', l: '192.168.1.100:54323', f: '151.101.1.140:443', s: 'ESTABLISHED', exe: 'firefox.exe' },
    { p: 'TCP', l: '192.168.1.100:54324', f: '198.252.206.25:80', s: 'TIME_WAIT', exe: 'curl.exe' },
    { p: 'TCP', l: '0.0.0.0:135', f: '0.0.0.0:0', s: 'LISTENING', exe: 'svchost.exe' },
    { p: 'TCP', l: '0.0.0.0:445', f: '0.0.0.0:0', s: 'LISTENING', exe: 'System' },
    { p: 'TCP', l: '0.0.0.0:3389', f: '0.0.0.0:0', s: 'LISTENING', exe: 'svchost.exe' },
    { p: 'UDP', l: '0.0.0.0:5353', f: '*:*', s: '', exe: 'svchost.exe' },
    { p: 'UDP', l: '0.0.0.0:1900', f: '*:*', s: '', exe: 'svchost.exe' },
  ];
  let out = '\nActive Connections\n\n';
  out += bFlag ? '  Proto  Local Address          Foreign Address        State           PID\n' : '  Proto  Local Address          Foreign Address        State\n';
  conns.forEach(c => {
    if (bFlag) out += `  ${c.p}     ${c.l.padEnd(22)} ${c.f.padEnd(22)} ${c.s.padEnd(15)} [${c.exe}]\n`;
    else out += `  ${c.p}     ${c.l.padEnd(22)} ${c.f.padEnd(22)} ${c.s}\n`;
  });
  out += `\n  ${conns.filter(c => c.s === 'ESTABLISHED').length} established, ${conns.length} total connections\n`;
  return out;
}

function simulateIPConfig(all) {
  let out = '\nWindows IP Configuration\n\n  Ethernet adapter Ethernet0:\n     Connection-specific DNS Suffix  . : local\n     IPv4 Address. . . . . . . . . . : 192.168.1.100\n     Subnet Mask . . . . . . . . . . : 255.255.255.0\n     Default Gateway . . . . . . . . : 192.168.1.1\n';
  if (all) out += '     DHCP Enabled. . . . . . . . . : Yes\n     DHCP Server. . . . . . . . . . : 192.168.1.1\n     Lease Obtained. . . . . . . . . : Today 09:15:23\n     Lease Expires . . . . . . . . . : Tomorrow 09:15:23\n     DNS Servers . . . . . . . . . . : 8.8.8.8, 1.1.1.1\n     Physical Address. . . . . . . . : 00-14-22-AB-CD-EF\n';
  out += '\n  Wireless LAN adapter Wi-Fi:\n     IPv4 Address. . . . . . . . . : 192.168.1.101\n     Subnet Mask . . . . . . . . . : 255.255.255.0\n     Default Gateway . . . . . . . : 192.168.1.1\n';
  return out;
}

function simulateARP() {
  return '\n  Interface: 192.168.1.100 --- 0xa\n    Internet Address      Physical Address      Type\n    192.168.1.1           00-14-22-01-23-45     dynamic\n    192.168.1.102         00-1a-2b-3c-4d-5e     dynamic\n    192.168.1.103         00-1c-2d-3e-4f-50     dynamic\n    192.168.1.104         00-1e-2f-30-41-52     dynamic\n    224.0.0.2             01-00-5e-00-00-02     static\n    239.255.255.250       01-00-5e-7f-ff-fa     static\n\n    Total ARP entries: 6\n';
}

function simulateSystemInfo() {
  const mem = (4 + Math.floor(Math.random() * 12)).toString();
  const free = Math.floor(parseInt(mem) * (0.3 + Math.random() * 0.4)).toString();
  return `\n  Host Name:                 DESKTOP-${Math.random().toString(36).substring(2, 6).toUpperCase()}\n  OS Name:                   Microsoft Windows 10 Pro\n  OS Version:                10.0.19045.${Math.floor(3000 + Math.random() * 1000)}\n  System Manufacturer:       Gigabyte Technology Co., Ltd.\n  System Model:              Z790 AORUS MASTER\n  System Type:               x64-based PC\n  Processor(s):              1 Processor(s) Installed. [Intel64 ~${(2 + Math.random() * 3).toFixed(1)}GHz]\n  Total Physical Memory:     ${mem},${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)} MB\n  Available Physical Memory: ${free},${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)} MB\n  Domain:                    WORKGROUP\n  Time Zone:                 UTC${Math.random() > 0.5 ? '+' : '-'}0${Math.floor(Math.random() * 12)}\n`;
}

function simulateRoutePrint() {
  return '\n  ===========================================================================\n  Interface List\n    1...00-14-22-ab-cd-ef ...... Intel(R) Ethernet Controller I225-V\n    2...00-1a-2b-3c-4d-5e ...... Intel(R) Wi-Fi 6E AX211 160MHz\n  ===========================================================================\n  IPv4 Route Table\n  ===========================================================================\n  Active Routes:\n  Network Destination        Netmask          Gateway       Interface  Metric\n            0.0.0.0          0.0.0.0      192.168.1.1   192.168.1.100     15\n        127.0.0.0        255.0.0.0         On-link     127.0.0.1      331\n      192.168.1.0    255.255.255.0         On-link   192.168.1.100     15\n     192.168.1.100  255.255.255.255         On-link   192.168.1.100     15\n        224.0.0.0        240.0.0.0         On-link   192.168.1.100     15\n  ===========================================================================\n  Persistent Routes:\n    None\n';
}

function simulateDir(path) {
  const files = [
    { name: 'readme.txt', size: '1.2 KB', date: '2024-01-15', time: '09:15', attr: 'A' },
    { name: 'config.ini', size: '0.8 KB', date: '2024-01-14', time: '10:30', attr: 'A' },
    { name: 'hosts', size: '1.5 KB', date: '2024-01-10', time: '14:22', attr: 'A' },
    { name: 'network.log', size: '4.7 KB', date: '2024-01-15', time: '12:00', attr: 'A' },
    { name: 'notes.txt', size: '0.6 KB', date: '2024-01-12', time: '16:45', attr: 'A' },
    { name: 'script.bat', size: '0.4 KB', date: '2024-01-13', time: '11:20', attr: 'A' },
  ];
  let out = `\n Volume in drive C has no label.\n Volume Serial Number is ${Math.random().toString(16).substring(2, 10).toUpperCase()}\n\n Directory of ${path || 'C:\\Users\\Admin'}\n\n`;
  files.forEach(f => out += `  ${f.date}  ${f.time}    ${f.attr}    ${f.size.padStart(8)}  ${f.name}\n`);
  out += `\n  Total Files Listed: ${files.length}\n  File(s)    ${files.reduce((s, f) => s + parseFloat(f.size), 0).toFixed(1)} KB\n  Dir(s)     ${(10 + Math.random() * 90).toFixed(1)} GB free\n`;
  return out;
}

const CMD_LIST = ALL_COMMANDS.map(c => c.cmd);

function executeCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) return { output: '', clear: false };
  if (trimmed === 'cls' || trimmed === 'clear') return { output: '', clear: true };

  if (trimmed === 'help') {
    const cats = ['Network', 'System', 'Text'];
    let out = '\n  Available commands:\n';
    cats.forEach(cat => {
      out += `\n  ─── ${cat} ─────────────────────────────────────────────\n`;
      ALL_COMMANDS.filter(c => c.cat === cat).forEach(c =>
        out += `  ${c.cmd.padEnd(25)} ${c.desc.padEnd(50)} ${c.icon}\n`
      );
    });
    out += '\n  Tips:\n    Tab ↹  Autocomplete commands\n    ↑/↓    Command history\n    &      Chain commands: ipconfig & ping 8.8.8.8\n    %var%  Variable expansion: echo %username%\n    color 0a  Green on black terminal\n    prompt Change prompt text\n';
    return { output: out };
  }

  if (trimmed.includes('&')) {
    const parts = trimmed.split('&').map(s => s.trim()).filter(Boolean);
    let combined = '';
    for (const p of parts) { const r = executeCommand(p); if (r.clear) { combined = ''; continue; } combined += r.output + '\n'; }
    return { output: combined };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  const firstArg = parts[1];

  if (cmd === 'ping') {
    const continuous = parts.includes('-t');
    const host = continuous ? parts.filter(p => p !== 'ping' && p !== '-t').join(' ') : args;
    return { output: simulatePing(host || '8.8.8.8', continuous) };
  }
  if (cmd === 'tracert') return { output: simulateTracert(args || 'google.com') };
  if (cmd === 'pathping') return { output: simulatePathPing(args || 'google.com') };
  if (cmd === 'nslookup') {
    const mx = parts.includes('-type=mx'); const all = parts.includes('-type=all');
    const host = parts.filter(p => !p.startsWith('-') && p !== 'nslookup').join(' ') || 'google.com';
    return { output: simulateNSLookup(host, mx ? 'mx' : all ? 'all' : '') };
  }
  if (cmd === 'netstat') return { output: simulateNetstat(parts.includes('-b')) };
  if (cmd === 'ipconfig') return { output: simulateIPConfig(parts.includes('/all')) };
  if (cmd === 'arp') return { output: simulateARP() };
  if (cmd === 'systeminfo') return { output: simulateSystemInfo() };
  if (cmd === 'hostname') return { output: `\n  DESKTOP-${Math.random().toString(36).substring(2, 6).toUpperCase()}\n` };
  if (cmd === 'route' && parts.includes('print')) return { output: simulateRoutePrint() };
  if (cmd === 'date') return { output: `\n  The current date is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` };
  if (cmd === 'time') return { output: `\n  The current time is: ${new Date().toLocaleTimeString()}\n` };
  if (cmd === 'ver') return { output: '\n  Microsoft Windows [Version 10.0.19045.3803]\n' };

  if (cmd === 'whoami') return { output: `\n  ${ENV_VARIABLES['%userdomain%']}\\${ENV_VARIABLES['%username%']}\n` };
  if (cmd === 'net') {
    if (parts.includes('view')) return { output: '\n  Server Name            Remark\n  \\\\DESKTOP-PC\n  \\\\NAS-SERVER           Media Storage\n  \\\\PRINTER-OFFICE       HP LaserJet Pro\n' };
    if (parts.includes('users')) return { output: '\n  User accounts for \\\\DESKTOP\n\n  Administrator            Guest                    Admin\n  The command completed successfully.\n' };
    return { output: '\n  NET [ VIEW | USERS | FILE | SHARE | USE | LOCALGROUP | GROUP | CONFIG | TIME ]\n' };
  }

  if (cmd === 'echo') {
    if (!args) return { output: '\n  ECHO is on.\n' };
    const expanded = expandVars(args);
    return { output: `\n  ${expanded}\n` };
  }

  if (cmd === 'set') {
    if (!args) {
      let out = '\n';
      Object.entries(ENV_VARIABLES).forEach(([k, v]) => {
        if (typeof v === 'function') v = v();
        const name = k.replace(/%/g, '');
        out += `  ${name.padEnd(30)} = ${v}\n`;
      });
      Object.entries(userEnv).forEach(([k, v]) => {
        const name = k.replace(/%/g, '');
        out += `  ${name.padEnd(30)} = ${v}\n`;
      });
      return { output: out };
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const varName = trimmed.substring(4, eqIdx).trim().toLowerCase();
      const varValue = trimmed.substring(eqIdx + 1).trim();
      if (varName) { userEnv[`%${varName}%`] = expandVars(varValue); return { output: `\n  ${varName}=${userEnv[`%${varName}%`]}\n` }; }
    }
    return { output: `\n  Environment variable not found\n` };
  }

  if (cmd === 'type' || cmd === 'more') {
    const fileName = args.toLowerCase();
    for (const [key, content] of Object.entries(SIMULATED_FILES)) {
      if (key.toLowerCase() === fileName || fileName.includes(key.toLowerCase())) {
        return { output: `\n${content}\n` };
      }
    }
    if (SIMULATED_FILES[fileName]) return { output: `\n${SIMULATED_FILES[fileName]}\n` };
    return { output: `\n  The system cannot find the file specified.\n  ${getCwd()}(can't open "${args}")\n` };
  }

  if (cmd === 'find') {
    const quotedMatch = trimmed.match(/"([^"]+)"/);
    const searchTerm = quotedMatch ? quotedMatch[1] : (firstArg || '');
    const fileArg = quotedMatch ? parts.slice(parts.indexOf(quotedMatch[0]) + 1).join(' ') : parts.slice(2).join(' ');
    const fileName = fileArg || 'readme.txt';
    if (!searchTerm) return { output: '\n  FIND: Parameter format not correct\n' };
    for (const [key, content] of Object.entries(SIMULATED_FILES)) {
      if (key.toLowerCase() === fileName.toLowerCase() || fileName.toLowerCase().includes(key.toLowerCase())) {
        const lines = content.split('\n');
        const matches = lines.filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()));
        if (matches.length === 0) return { output: `\n  Searching ${key}...\n  FIND: No match found for "${searchTerm}"\n` };
        let out = `\n  Searching ${key}...\n  ---------- ${key} ----------\n`;
        matches.forEach(l => out += `  ${l.replace(searchTerm, `\x1b[1m${searchTerm}\x1b[0m`)}\n`);
        out += `\n  ${matches.length} line(s) matched\n`;
        return { output: out };
      }
    }
    return { output: `\n  FIND: Cannot open ${fileArg || 'file'}\n` };
  }

  if (cmd === 'dir') return { output: simulateDir(args || 'C:\\Users\\Admin') };

  if (cmd === 'cd' || cmd === 'chdir') {
    if (!args || args === '\\' || args === '/' || args === 'C:\\') return { output: '' };
    if (args === '..') return { output: '' };
    if (args === '.' || args === '~') return { output: '' };
    return { output: '' };
  }

  if (cmd === 'color') {
    const valid = args.match(/^[0-9a-f]{2}$/i);
    if (!valid) return { output: '\n  Sets the default console foreground and background colors.\n  COLOR [attr]\n    attr       Specifies color attribute of console output.\n    0 = Black    8 = Gray\n    1 = Blue     9 = Light Blue\n    2 = Green    A = Light Green\n    3 = Aqua     B = Light Aqua\n    4 = Red      C = Light Red\n    5 = Purple   D = Light Purple\n    6 = Yellow   E = Light Yellow\n    7 = White    F = Bright White\n  Example: COLOR 0A (black background, green text)\n' };
    return { output: '', color: args.toUpperCase() };
  }

  if (cmd === 'prompt') {
    if (args) {
      const newPrompt = expandVars(args);
      return { output: '', prompt: newPrompt.includes('>') ? newPrompt : `${newPrompt}>` };
    }
    return { output: '\n  PROMPT [text]\n    text    Specifies a new command prompt.\n  Type PROMPT /? for existing formats.\n' };
  }

  return { output: `\n  '${cmd}' is not recognized as an internal or external command,\n  operable program or batch file.\n` };
}

export default function CMDConsole() {
  const [lines, setLines] = useState([
    { text: 'Microsoft Windows [Version 10.0.19045.3803]', t: 'info' },
    { text: '(c) Microsoft Corporation. All rights reserved.', t: 'info' },
    { text: '', t: 'info' },
    { text: `${DEFAULT_PROMPT} Type 'help' for available commands.`, t: 'input' },
    { text: '', t: 'info' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [target, setTarget] = useState('');
  const [fontSize, setFontSize] = useState(13);
  const [showHelp, setShowHelp] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [termColors, setTermColors] = useState(['#0c0c0c', '#c0c0c0']);
  const [cwd, setCwd] = useState('C:\\Users\\Admin');
  const [scrollLocked, setScrollLocked] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  const isAtBottom = useCallback(() => {
    const el = outputRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
      setAtBottom(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    setAtBottom(isAtBottom());
  }, [isAtBottom]);

  useEffect(() => {
    if (!scrollLocked && atBottom && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, scrollLocked, atBottom]);

  const linesAbove = outputRef.current
    ? Math.round((outputRef.current.scrollHeight - outputRef.current.scrollTop - outputRef.current.clientHeight) / 20)
    : 0;

  const run = useCallback((cmd) => {
    const commandLine = cmd || input.trim();
    if (!commandLine) return;
    const newLines = [...lines, { text: `${prompt} ${commandLine}`, t: 'prompt' }];
    const result = executeCommand(commandLine);

    if (result.clear) {
      setLines([{ text: 'Microsoft Windows [Version 10.0.19045.3803]', t: 'info' }, { text: '(c) Microsoft Corporation. All rights reserved.', t: 'info' }, { text: '', t: 'info' }, { text: `${prompt} `, t: 'prompt' }]);
    } else if (result.color) {
      setTermColors(['#0c0c0c', `#${result.color[1]}${result.color[1]}${result.color[1]}`]);
    } else if (result.prompt) {
      setPrompt(result.prompt);
    } else {
      const outputLines = result.output.split('\n').filter(l => l !== undefined).map(text => ({ text, t: 'output' }));
      if (!cmd) setHistory(h => [commandLine, ...h].slice(0, 50));
      setLines([...newLines, ...outputLines]);
    }

    if (cmd === 'cd' || cmd === 'chdir') {
      if (commandLine.includes('..')) setCwd('C:\\Users');
      else if (commandLine.includes('\\') || commandLine.includes('/')) setCwd(`C:\\${args || ''}`);
    }

    if (!cmd) { setInput(''); setHistoryIdx(-1); }
  }, [input, lines, prompt]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { run(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.toLowerCase();
      const match = CMD_LIST.find(c => c.startsWith(partial));
      if (match && match !== partial) setInput(match + ' ');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx); setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) { setHistoryIdx(-1); setInput(''); return; }
      setHistoryIdx(historyIdx - 1); setInput(history[historyIdx - 1]);
    }
  };

  const quickRun = (cmd, args) => { const full = args ? `${cmd} ${args}` : cmd; setInput(full); setTimeout(() => run(full), 80); };

  const exportLog = () => {
    const text = lines.map(l => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `cmd-log-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const lastCmdCount = lines.filter(l => l.t === 'prompt' && l.text.includes('>')).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>💻 CMD Network Console</h2>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>{lastCmdCount} cmds</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cwd}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={target} onChange={e => setTarget(e.target.value)}
            placeholder="Target host..." style={{ width: 130, fontSize: 12, padding: '6px 10px' }} />
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="range" min={10} max={20} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: 50 }} />
            {fontSize}px
          </label>
          <button className="btn-secondary btn-sm" onClick={() => setShowHelp(!showHelp)} style={{ height: 30 }}>{showHelp ? '✕' : '❓'}</button>
          <button className="btn-secondary btn-sm" onClick={exportLog} style={{ height: 30 }}>📥</button>
        </div>
      </div>

      {showHelp && (
        <div className="card" style={{ marginBottom: 12, maxHeight: 260, overflowY: 'auto', fontSize: 12 }}>
          {['Network', 'System', 'Text'].map(cat => (
            <div key={cat}>
              <div style={{ fontWeight: 700, fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 6px', marginTop: 4 }}>{cat}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                {ALL_COMMANDS.filter(c => c.cat === cat).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => { const a = c.args.replace(/<|>/g, '').split(' ')[0] || ''; quickRun(c.cmd, a || (c.args ? '8.8.8.8' : '')); }}>
                    <span>{c.icon}</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 11 }}>{c.cmd}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {QUICK_FAVORITES.map((qc, i) => (
            <button key={i} className="btn-secondary btn-sm"
              onClick={() => quickRun(qc.cmd, target || qc.args)}
              style={{ fontSize: 10, padding: '3px 8px' }}>
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .cmd-scroll::-webkit-scrollbar { width: 8px; }
        .cmd-scroll::-webkit-scrollbar-track { background: #0c0c0c; }
        .cmd-scroll::-webkit-scrollbar-thumb { background: #2d2d44; border-radius: 4px; }
        .cmd-scroll::-webkit-scrollbar-thumb:hover { background: #3d3d55; }
        .cmd-scroll { scroll-behavior: smooth; }
      `}</style>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 10, position: 'relative' }}>
        <div style={{
          position: 'absolute', right: 12, bottom: 12, zIndex: 10,
          display: 'flex', gap: 4, alignItems: 'center',
        }}>
          {!atBottom && (
            <button onClick={scrollToBottom}
              style={{ background: 'rgba(45,45,68,0.9)', border: 'none', color: '#c0c0c0', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
              ▼ Scroll to bottom
            </button>
          )}
          <button onClick={() => setScrollLocked(!scrollLocked)}
            title={scrollLocked ? 'Unlock scrolling (auto-scroll to bottom)' : 'Lock scrolling (pause auto-scroll)'}
            style={{
              background: scrollLocked ? 'rgba(239,71,111,0.3)' : 'rgba(45,45,68,0.9)',
              border: `1px solid ${scrollLocked ? 'var(--danger)' : 'transparent'}`,
              color: scrollLocked ? '#ef476f' : '#c0c0c0',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            }}>
            {scrollLocked ? '🔒 Locked' : '🔓 Auto'}
          </button>
        </div>
        <div className="cmd-scroll" style={{
          background: `linear-gradient(180deg, #1a1a2e 0%, ${termColors[0]} 100%)`,
          color: termColors[1], fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Courier New", monospace',
          fontSize, lineHeight: 1.6, minHeight: 520, maxHeight: 620, overflowY: 'auto',
          padding: '14px 18px',
        }} ref={outputRef} onScroll={handleScroll} onClick={() => inputRef.current?.focus()}>
          {lines.map((line, i) => (
            <div key={i} style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 1,
              color: line.t === 'prompt' ? '#f8f8f2' : line.t === 'input' ? '#e6db74' : line.t === 'info' ? '#6272a4' : termColors[1],
            }}>{line.text || '\u00A0'}</div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <span style={{ color: '#f8f8f2', whiteSpace: 'pre' }}>{prompt} </span>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown} autoFocus spellCheck={false}
              style={{
                background: 'transparent', border: 'none', color: '#e6db74', outline: 'none',
                fontFamily: 'inherit', fontSize: 'inherit', flex: 1, padding: 0,
                caretColor: '#e6db74',
              }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>Tab ↹ · ↑↓ · &amp; chaining · %var% expansion · color · prompt</span>
        <CopyButton text={lines.map(l => l.text).join('\n')} label="Copy" />
      </div>
    </div>
  );
}
