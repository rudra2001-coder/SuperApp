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
import HTTPRequester from './HTTPRequester';
import SubdomainDiscovery from './SubdomainDiscovery';
import NetworkCalc from './NetworkCalc';
import ScenarioRunner from './ScenarioRunner';
import NetworkDashboard from './NetworkDashboard';
import SSLMonitor from './SSLMonitor';
import ScanCampaigns from './ScanCampaigns';
import Preferences from './Preferences';

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
      <Route path="http-requester" element={<HTTPRequester />} />
      <Route path="subdomain-discovery" element={<SubdomainDiscovery />} />
      <Route path="network-calc" element={<NetworkCalc />} />
      <Route path="scenario-runner" element={<ScenarioRunner />} />
      <Route path="dashboard" element={<NetworkDashboard />} />
      <Route path="ssl-monitor" element={<SSLMonitor />} />
      <Route path="scan-campaigns" element={<ScanCampaigns />} />
      <Route path="preferences" element={<Preferences />} />
    </Routes>
  );
}
