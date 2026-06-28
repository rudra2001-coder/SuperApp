import { Route, Routes } from 'react-router-dom';
import UtilitiesOverview from './UtilitiesOverview';
import Base64 from './Base64';
import UUIDGenerator from './UUIDGenerator';
import QRGenerator from './QRGenerator';
import FileHasher from './FileHasher';
import JSONFormatter from './JSONFormatter';
import ColorConverter from './ColorConverter';
import PasswordGenerator from './PasswordGenerator';
import TextCaseConverter from './TextCaseConverter';
import URLEncoder from './URLEncoder';
import UnitConverter from './UnitConverter';
import Timer from './Timer';
import LoremIpsum from './LoremIpsum';
import TextAnalyzer from './TextAnalyzer';
import NumberBaseConverter from './NumberBaseConverter';
import EpochConverter from './EpochConverter';
import RegexTester from './RegexTester';
import PDFToExcel from './PDFToExcel';
import ExcelValidator from './ExcelValidator';

export default function Utilities() {
  return (
    <Routes>
      <Route index element={<UtilitiesOverview />} />
      <Route path="base64" element={<Base64 />} />
      <Route path="uuid" element={<UUIDGenerator />} />
      <Route path="qr" element={<QRGenerator />} />
      <Route path="hasher" element={<FileHasher />} />
      <Route path="json-formatter" element={<JSONFormatter />} />
      <Route path="color-converter" element={<ColorConverter />} />
      <Route path="password" element={<PasswordGenerator />} />
      <Route path="text-case" element={<TextCaseConverter />} />
      <Route path="url-encode" element={<URLEncoder />} />
      <Route path="unit-converter" element={<UnitConverter />} />
      <Route path="timer" element={<Timer />} />
      <Route path="lorem-ipsum" element={<LoremIpsum />} />
      <Route path="text-analyzer" element={<TextAnalyzer />} />
      <Route path="number-base" element={<NumberBaseConverter />} />
      <Route path="epoch-converter" element={<EpochConverter />} />
      <Route path="regex-tester" element={<RegexTester />} />
      <Route path="pdf-to-excel" element={<PDFToExcel />} />
      <Route path="excel-validator" element={<ExcelValidator />} />
    </Routes>
  );
}
