import { useState, useRef, useEffect } from 'react';
import CopyButton from '../../components/common/CopyButton';

const PROMPT = 'C:\\Users\\Admin>';

const QUICK_COMMANDS = [
  { cmd: 'ping', label: 'Ping', args: '8.8.8.8', icon: '📶' },
  { cmd: 'ping -t', label: 'Ping (Continuous)', args: '8.8.8.8', icon: '🔄' },
  { cmd: 'tracert', label: 'Tracert', args: 'google.com', icon: '🗺️' },
  { cmd: 'pathping', label: 'PathPing', args: 'google.com', icon: '📊' },
  { cmd: 'nslookup', label: 'NSLookup', args: 'google.com', icon: '🔍' },
  { cmd: 'nslookup -type=mx', label: 'MX Lookup', args: 'google.com', icon: '📧' },
  { cmd: 'netstat', label: 'Netstat', args: '', icon: '🔌' },
  { cmd: 'ipconfig', label: 'IPConfig', args: '', icon: '🖥️' },
  { cmd: 'arp -a', label: 'ARP Table', args: '', icon: '📋' },
];

function simulateNetstat() {
  const connections = [
    { proto: 'TCP', local: '192.168.1.100:54321', foreign: '142.250.80.46:443', state: 'ESTABLISHED' },
    { proto: 'TCP', local: '192.168.1.100:54322', foreign: '104.16.132.229:443', state: 'ESTABLISHED' },
    { proto: 'TCP', local: '192.168.1.100:54323', foreign: '151.101.1.140:443', state: 'ESTABLISHED' },
    { proto: 'TCP', local: '192.168.1.100:54324', foreign: '198.252.206.25:80', state: 'TIME_WAIT' },
    { proto: 'TCP', local: '0.0.0.0:135', foreign: '0.0.0.0:0', state: 'LISTENING' },
    { proto: 'TCP', local: '0.0.0.0:445', foreign: '0.0.0.0:0', state: 'LISTENING' },
    { proto: 'TCP', local: '0.0.0.0:3389', foreign: '0.0.0.0:0', state: 'LISTENING' },
    { proto: 'UDP', local: '0.0.0.0:5353', foreign: '*:*', state: '' },
    { proto: 'UDP', local: '0.0.0.0:1900', foreign: '*:*', state: '' },
  ];
  let out = '\nActive Connections\n\n  Proto  Local Address          Foreign Address        State\n';
  connections.forEach(c => {
    out += `  ${c.proto}     ${c.local.padEnd(22)} ${c.foreign.padEnd(22)} ${c.state}\n`;
  });
  out += `\n  Total active: ${connections.filter(c => c.state === 'ESTABLISHED').length} established, ${connections.length} total\n`;
  return out;
}

function simulateIPConfig() {
  return `
Windows IP Configuration

Ethernet adapter Ethernet0:
   Connection-specific DNS Suffix  . : local
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1

Wireless LAN adapter Wi-Fi:
   Connection-specific DNS Suffix  . : 
   IPv4 Address. . . . . . . . . . . : 192.168.1.101
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1

Tunnel adapter Teredo:
   IPv6 Address. . . . . . . . . . . : 2001:0:9d38:6abd:3c:3e1a:3f57:fffe
   Link-local IPv6 Address . . . . . : fe80::3c:3e1a:3f57:fffe%5
   Default Gateway . . . . . . . . . : ::
`;
}

function simulateARP() {
  return `
Interface: 192.168.1.100 --- 0xa
  Internet Address      Physical Address      Type
  192.168.1.1           00-14-22-01-23-45     dynamic
  192.168.1.102         00-1a-2b-3c-4d-5e     dynamic
  192.168.1.103         00-1c-2d-3e-4f-50     dynamic
  192.168.1.104         00-1e-2f-30-41-52     dynamic
  224.0.0.2             01-00-5e-00-00-02     static
  224.0.0.22            01-00-5e-00-00-16     static
  239.255.255.250       01-00-5e-7f-ff-fa     static

  Total ARP entries: 7
`;
}

function simulatePing(host, count = 4, continuous = false) {
  const ip = host.match(/^\d+\.\d+\.\d+\.\d+$/) ? host : `${host} (${[192, 168, 1, Math.floor(Math.random() * 254) + 1].join('.')})`;
  let out = `\nPinging ${ip} with 32 bytes of data:\n\n`;
  let received = 0;
  let times = [];
  const total = continuous ? 10 : count;
  for (let i = 0; i < total; i++) {
    const lost = Math.random() > 0.9;
    if (lost) {
      out += `  Request timed out.\n`;
    } else {
      const ms = (10 + Math.random() * 90).toFixed(1);
      const ttl = Math.floor(50 + Math.random() * 70);
      out += `  Reply from ${ip}: bytes=32 time=${ms}ms TTL=${ttl}\n`;
      received++;
      times.push(parseFloat(ms));
    }
  }
  const loss = ((total - received) / total * 100).toFixed(0);
  out += `\n  Ping statistics for ${ip}:\n`;
  out += `    Packets: Sent = ${total}, Received = ${received}, Lost = ${total - received} (${loss}% loss),\n`;
  if (times.length > 0) {
    out += `  Approximate round trip times in milli-seconds:\n`;
    out += `    Minimum = ${Math.min(...times).toFixed(1)}ms, Maximum = ${Math.max(...times).toFixed(1)}ms, Average = ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}ms\n`;
  }
  return out;
}

function simulateTracert(host) {
  const hops = [
    { hop: 1, ip: '192.168.1.1', ms: '1ms', name: 'router.local' },
    { hop: 2, ip: '10.0.0.1', ms: '3ms', name: 'isp-gw-01.isp.net' },
    { hop: 3, ip: '72.14.204.1', ms: '8ms', name: '72.14.204.1' },
    { hop: 4, ip: '74.125.37.165', ms: '12ms', name: '209.85.252.1' },
    { hop: 5, ip: '216.58.194.94', ms: '15ms', name: 'lhr25s41-in-f94.1e100.net' },
    { hop: 6, ip: '142.250.80.46', ms: '16ms', name: 'lhr25s46-in-f14.1e100.net' },
    { hop: 7, ip: host.match(/^\d+\.\d+\.\d+\.\d+$/) ? host : '142.250.80.46', ms: '16ms', name: host },
  ];
  let out = `\nTracing route to ${host} [${hops[hops.length - 1].ip}]\nover a maximum of 30 hops:\n\n`;
  hops.forEach(h => {
    const stars = Math.random() > 0.8 ? '  *  *  *' : `  ${h.ms}  ${h.ms}  ${h.ms}`;
    out += `  ${h.hop.toString().padEnd(3)}${stars}  ${h.name} [${h.ip}]\n`;
  });
  out += `\n  Trace complete.\n`;
  return out;
}

function simulatePathPing(host) {
  let out = `\nComputing statistics for ${host}...\n`;
  out += `  ${new Array(50).fill('.').join('')}\n\n`;
  out += `  Source to Here   This Node/Link\n`;
  out += `  Hop  RTT    Lost/Sent = Pct  Lost/Sent = Pct  Address\n`;
  out += `   0                           100/100 = 100%   |\n`;
  const hops = ['router.local [192.168.1.1]', 'isp-gw.isp.net [10.0.0.1]', 'core1.isp.net [72.14.204.1]', 'lhr25s41-in-f14.1e100.net [142.250.80.46]'];
  hops.forEach((h, i) => {
    const rtt = (5 + Math.random() * 20).toFixed(0);
    const loss = Math.random() > 0.85 ? Math.floor(Math.random() * 20) : 0;
    out += `  ${(i + 1).toString().padEnd(4)}${rtt.padStart(4)}ms  ${(100 - loss).toString().padStart(3)}/100 = ${loss}%    ${(100 - loss).toString().padStart(3)}/100 = ${loss}%    ${h}\n`;
  });
  out += `\n  Trace complete.\n`;
  return out;
}

function simulateNSLookup(host, type = '') {
  const ips = [[192, 168, 1, 1], [8, 8, 8, 8], [1, 1, 1, 1]];
  const ip = ips[Math.floor(Math.random() * ips.length)].join('.');
  let out = `\n  Server:  dns.google\n  Address:  8.8.8.8\n\n`;
  out += `  Name:    ${host}\n`;
  out += `  Address: ${ip}\n`;
  if (type === 'mx') {
    out += `\n  ${host}  MX preference = 10, mail exchanger = alt1.${host}\n`;
    out += `  ${host}  MX preference = 20, mail exchanger = alt2.${host}\n`;
    out += `  ${host}  MX preference = 30, mail exchanger = alt3.${host}\n`;
  }
  if (type === 'all') {
    out += `\n  ${host}  AAAA IPv6 Address = 2001:db8::1\n`;
    out += `  ${host}  TXT Record = "v=spf1 include:_spf.google.com ~all"\n`;
    out += `  ${host}  NS Record = ns1.${host}\n`;
  }
  return out;
}

function executeCommand(input) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return { output: '', clear: false };

  if (trimmed === 'cls' || trimmed === 'clear') return { output: '', clear: true };

  if (trimmed === 'help') {
    return {
      output: `
Available commands:
  ping <host>           Test reachability and latency
  ping -t <host>        Continuous ping (Ctrl+C to stop)
  tracert <host>        Trace route to destination
  pathping <host>       Route tracing with latency stats
  nslookup <host>       DNS lookup
  nslookup -type=mx <host>  MX record lookup
  netstat               Display active network connections
  ipconfig              Show IP configuration
  arp -a                Show ARP cache table
  cls or clear          Clear screen
  help                  Show this message
`,
    };
  }

  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  if (cmd === 'ping') {
    const continuous = parts.includes('-t');
    const host = continuous ? parts.filter(p => p !== 'ping' && p !== '-t').join(' ') : args;
    return { output: simulatePing(host || '8.8.8.8', 4, continuous) };
  }

  if (cmd === 'tracert') {
    return { output: simulateTracert(args || 'google.com') };
  }

  if (cmd === 'pathping') {
    return { output: simulatePathPing(args || 'google.com') };
  }

  if (cmd === 'nslookup') {
    const mxIdx = parts.indexOf('-type=mx');
    const host = (mxIdx >= 0 ? parts.filter((p, i) => i !== 0 && i !== mxIdx).join(' ') : args) || 'google.com';
    return { output: simulateNSLookup(host, mxIdx >= 0 ? 'mx' : '') };
  }

  if (cmd === 'netstat') {
    return { output: simulateNetstat() };
  }

  if (cmd === 'ipconfig') {
    return { output: simulateIPConfig() };
  }

  if (cmd === 'arp') {
    return { output: simulateARP() };
  }

  return { output: `\n  '${cmd}' is not recognized as an internal or external command,\n  operable program or batch file.\n` };
}

export default function CMDConsole() {
  const [lines, setLines] = useState([
    { text: 'Microsoft Windows [Version 10.0.19045.3803]', type: 'info' },
    { text: '(c) Microsoft Corporation. All rights reserved.', type: 'info' },
    { text: '', type: 'info' },
    { text: `${PROMPT} Type 'help' for available commands.`, type: 'input' },
    { text: '', type: 'info' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [target, setTarget] = useState('');
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  const run = (cmd) => {
    const commandLine = cmd || input.trim();
    if (!commandLine) return;

    const newLines = [...lines, { text: `${PROMPT} ${commandLine}`, type: 'input' }];
    const result = executeCommand(commandLine);

    if (result.clear) {
      setLines([
        { text: 'Microsoft Windows [Version 10.0.19045.3803]', type: 'info' },
        { text: '(c) Microsoft Corporation. All rights reserved.', type: 'info' },
        { text: '', type: 'info' },
        { text: `${PROMPT} `, type: 'input' },
      ]);
    } else {
      const outputLines = result.output.split('\n').filter(l => l !== undefined).map(text => ({ text, type: 'output' }));
      if (!cmd) {
        setHistory([commandLine, ...history].slice(0, 50));
      }
      setLines([...newLines, ...outputLines]);
    }

    if (!cmd) {
      setInput('');
      setHistoryIdx(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      run();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) { setHistoryIdx(-1); setInput(''); return; }
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setInput(history[idx]);
    }
  };

  const quickRun = (cmd, args) => {
    const fullCmd = args ? `${cmd} ${args}` : cmd;
    setInput(fullCmd);
    setTimeout(() => run(fullCmd), 50);
  };

  const clearConsole = () => {
    setLines([
      { text: 'Microsoft Windows [Version 10.0.19045.3803]', type: 'info' },
      { text: '(c) Microsoft Corporation. All rights reserved.', type: 'info' },
      { text: '', type: 'info' },
      { text: `${PROMPT} `, type: 'input' },
    ]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>💻 CMD Network Console</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={target} onChange={e => setTarget(e.target.value)}
            placeholder="Default target (e.g. 8.8.8.8)" style={{ width: 200, fontSize: 12, padding: '6px 10px' }} />
          <button className="btn-secondary btn-sm" onClick={clearConsole} style={{ height: 32 }}>🔄 Clear</button>
          <CopyButton text={lines.map(l => l.text).join('\n')} label="Copy Log" />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_COMMANDS.map((qc, i) => (
            <button key={i} className="btn-secondary btn-sm"
              onClick={() => quickRun(qc.cmd, target || qc.args)}
              style={{ fontSize: 11, padding: '4px 10px' }}>
              {qc.icon} {qc.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          background: '#0c0c0c', color: '#c0c0c0', fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Courier New", monospace',
          fontSize: 13, lineHeight: 1.5, minHeight: 500, maxHeight: 600, overflowY: 'auto',
          padding: '16px 20px',
        }} ref={outputRef} onClick={() => document.getElementById('cmd-input')?.focus()}>
          {lines.map((line, i) => (
            <div key={i} style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              color: line.type === 'input' ? '#e6db74' : line.type === 'output' ? '#c0c0c0' : '#888',
              marginBottom: 1,
            }}>{line.text || '\u00A0'}</div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <span style={{ color: '#e6db74', whiteSpace: 'pre' }}>{PROMPT} </span>
            <input id="cmd-input" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown} autoFocus spellCheck={false}
              style={{
                background: 'transparent', border: 'none', color: '#c0c0c0', outline: 'none',
                fontFamily: 'inherit', fontSize: 'inherit', flex: 1, padding: 0,
                caretColor: '#c0c0c0',
              }} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
        Type commands at the prompt or use quick buttons above. ↑/↓ for command history.
      </div>
    </div>
  );
}
