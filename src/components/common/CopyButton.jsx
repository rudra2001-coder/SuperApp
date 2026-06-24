import { useState } from 'react';

export default function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  return (
    <button className="btn-secondary btn-sm" onClick={handleCopy}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}
