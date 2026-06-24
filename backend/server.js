const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const dns = require('dns');
const net = require('net');
const whois = require('whois');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ping', (req, res) => {
  const { target, count = 4 } = req.body;
  if (!target) return res.status(400).json({ error: 'Target is required' });
  const cmd = process.platform === 'win32' ? `ping -n ${count} ${target}` : `ping -c ${count} ${target}`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.json({ status: 'unreachable', error: stderr || err.message, output: stdout });
    const lines = stdout.split('\n');
    const times = [];
    lines.forEach(line => {
      const match = line.match(/time[=<](\d+\.?\d*)\s*ms/i);
      if (match) times.push(parseFloat(match[1]));
    });
    const lost = lines.find(l => l.includes('loss')) || '';
    const lossMatch = lost.match(/(\d+)%/);
    res.json({
      status: times.length > 0 ? 'reachable' : 'unreachable',
      sent: count,
      received: times.length,
      loss: lossMatch ? lossMatch[1] + '%' : '0%',
      times,
      min: times.length ? Math.min(...times) : null,
      max: times.length ? Math.max(...times) : null,
      avg: times.length ? (times.reduce((a, b) => a + b, 0) / times.length) : null,
    });
  });
});

app.post('/api/scan-port', async (req, res) => {
  const { target, ports } = req.body;
  if (!target || !ports) return res.status(400).json({ error: 'Target and ports required' });
  const results = [];
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
          results.push({ port, status: 'open' });
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => {
          results.push({ port, status: 'filtered' });
          socket.destroy();
          reject();
        });
        socket.on('error', () => {
          results.push({ port, status: 'closed' });
          reject();
        });
        socket.connect(port, target);
      });
    } catch {}
  }
  res.json({ target, results });
});

app.get('/api/dns', (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'Domain required' });
  const types = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'];
  const results = [];
  let pending = types.length;
  types.forEach(type => {
    dns.resolve(domain, type, (err, addresses) => {
      if (!err && addresses) {
        addresses.forEach(addr => {
          results.push({ type, name: domain, value: typeof addr === 'object' ? JSON.stringify(addr) : String(addr), ttl: 300 });
        });
      }
      pending--;
      if (pending === 0) res.json({ domain, records: results });
    });
  });
});

app.get('/api/whois', (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query required' });
  whois.lookup(query, (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    const lines = data.split('\n').filter(l => l.trim());
    const fields = {};
    lines.forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.substring(0, idx).trim().toLowerCase().replace(/\s+/g, '_');
        const val = line.substring(idx + 1).trim();
        if (!fields[key]) fields[key] = val;
      }
    });
    res.json({ query, data: fields });
  });
});

app.get('/api/traceroute', (req, res) => {
  const { target } = req.query;
  if (!target) return res.status(400).json({ error: 'Target required' });
  const cmd = process.platform === 'win32' ? `tracert -d ${target}` : `traceroute -n ${target}`;
  exec(cmd, { timeout: 30000 }, (err, stdout) => {
    const lines = stdout.split('\n');
    const hops = [];
    lines.forEach(line => {
      const match = line.match(/^\s*(\d+)\s+<?(\d+\.\d+\.\d+\.\d+|\*)\s+/);
      if (match) {
        hops.push({
          hop: parseInt(match[1]),
          ip: match[2] === '*' ? 'Request timed out' : match[2],
          rtt: match[2] === '*' ? '*' : (line.match(/<?(\d+\.?\d*)\s*ms/) || [])[1] || '*',
        });
      }
    });
    res.json({ target, hops });
  });
});

app.get('/api/ip-info', async (req, res) => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    res.json(data);
  } catch {
    try {
      const response = await fetch('https://ip-api.com/json/');
      const data = await response.json();
      res.json({
        ip: data.query,
        city: data.city,
        region: data.regionName,
        country: data.country,
        org: data.isp,
        timezone: data.timezone,
        asn: data.as,
        latitude: data.lat,
        longitude: data.lon,
      });
    } catch {
      res.json({ error: 'Could not fetch IP info' });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SuperApp backend running on port ${PORT}`));
