import { Route, Routes } from 'react-router-dom';
import NetworkOverview from './NetworkOverview';
import Ping from './Ping';
import PortScanner from './PortScanner';
import DNSLookup from './DNSLookup';
import Whois from './Whois';
import Traceroute from './Traceroute';
import IPInfo from './IPInfo';
import MikrotikChecker from './MikrotikChecker';
import HTTPHeaders from './HTTPHeaders';
import SSLChecker from './SSLChecker';
import SNMPChecker from './SNMPChecker';

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
      <Route path="mikrotik" element={<MikrotikChecker />} />
      <Route path="http-headers" element={<HTTPHeaders />} />
      <Route path="ssl-cert" element={<SSLChecker />} />
      <Route path="snmp" element={<SNMPChecker />} />
    </Routes>
  );
}
