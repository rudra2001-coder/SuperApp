import { Route, Routes } from 'react-router-dom';
import NetworkOverview from './NetworkOverview';
import Ping from './Ping';
import PortScanner from './PortScanner';
import DNSLookup from './DNSLookup';
import Whois from './Whois';
import Traceroute from './Traceroute';
import IPInfo from './IPInfo';

export default function NetworkTools() {
  return (
    <Routes>
      <Route index element={<NetworkOverview />} />
      <Route path="ping" element={<Ping />} />
      <Route path="port-scanner" element={<PortScanner />} />
      <Route path="dns-lookup" element={<DNSLookup />} />
      <Route path="whois" element={<Whois />} />
      <Route path="traceroute" element={<Traceroute />} />
      <Route path="ip-info" element={<IPInfo />} />
    </Routes>
  );
}
