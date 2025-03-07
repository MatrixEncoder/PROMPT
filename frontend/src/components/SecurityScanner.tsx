import React, { useState } from 'react';

interface Vulnerability {
  type: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  fix?: string;
}

const API_BASE = 'http://localhost:8000/api';

const SecurityScanner: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'code' | 'url' | 'logs'>('code');
  const [codeInput, setCodeInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [logInput, setLogInput] = useState('');
  const [results, setResults] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'code' as const, name: 'Code Analysis' },
    { id: 'url' as const, name: 'URL Analysis' },
    { id: 'logs' as const, name: 'Log Analysis' }
  ];

  const scanCode = async () => {
    if (!codeInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scan/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning code:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scan/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanLogs = async () => {
    if (!logInput.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scan/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logInput })
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelStyles = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':
        return {
          container: 'bg-red-50 border-red-200',
          badge: 'bg-red-100 text-red-800'
        };
      case 'High':
        return {
          container: 'bg-orange-50 border-orange-200',
          badge: 'bg-orange-100 text-orange-800'
        };
      case 'Medium':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'Low':
        return {
          container: 'bg-green-50 border-green-200',
          badge: 'bg-green-100 text-green-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Security Scanner</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-4 py-2 rounded-lg ${
                currentTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Code Scanner */}
      {currentTab === 'code' && (
        <div className="space-y-4">
          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-64 p-4 border rounded-lg font-mono"
          />
          <button
            onClick={scanCode}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan Code'}
          </button>
        </div>
      )}

      {/* URL Scanner */}
      {currentTab === 'url' && (
        <div className="space-y-4">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL to scan..."
            className="w-full p-4 border rounded-lg"
          />
          <button
            onClick={scanUrl}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan URL'}
          </button>
        </div>
      )}

      {/* Log Scanner */}
      {currentTab === 'logs' && (
        <div className="space-y-4">
          <textarea
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            placeholder="Paste your logs here..."
            className="w-full h-64 p-4 border rounded-lg font-mono"
          />
          <button
            onClick={scanLogs}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan Logs'}
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Scan Results</h2>
          <div className="space-y-4">
            {results.map((vuln, index) => {
              const styles = getRiskLevelStyles(vuln.risk_level);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${styles.container}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{vuln.type}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge}`}>
                      {vuln.risk_level}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{vuln.description}</p>
                  {vuln.fix && (
                    <div className="bg-white p-3 rounded border">
                      <p className="font-mono text-sm">{vuln.fix}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityScanner;
