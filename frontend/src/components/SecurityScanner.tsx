import React, { useState } from 'react';

interface Vulnerability {
  id: string;
  type: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  location?: string;
  lineNumbers?: number[];
  fix?: string;
  references?: string[];
  cwe?: string;
}

interface ScanResult {
  vulnerabilities: Vulnerability[];
  scanType: string;
  timestamp: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

const API_BASE = 'http://localhost:8000/api';

const SecurityScanner: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'code' | 'url' | 'logs'>('code');
  const [codeInput, setCodeInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [logInput, setLogInput] = useState('');
  const [results, setResults] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('javascript');

  const tabs = [
    { id: 'code' as const, name: 'Code Analysis' },
    { id: 'url' as const, name: 'URL Analysis' },
    { id: 'logs' as const, name: 'Log Analysis' }
  ];

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' },
    { value: 'ruby', label: 'Ruby' }
  ];

  const scanCode = async () => {
    if (!codeInput.trim()) {
      setError('Please enter code to scan');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/scan/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: codeInput,
          language: language,
          options: {
            deepScan: true,
            includeLineNumbers: true,
            includeCWE: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning code:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan code');
    } finally {
      setLoading(false);
    }
  };

  const scanUrl = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL to scan');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(urlInput);
    } catch (e) {
      setError('Please enter a valid URL');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/scan/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: urlInput,
          options: {
            checkHeaders: true,
            checkCookies: true,
            checkCsp: true,
            scanDepth: 'deep',
            includeScreenshot: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning URL:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan URL');
    } finally {
      setLoading(false);
    }
  };

  const scanLogs = async () => {
    if (!logInput.trim()) {
      setError('Please enter logs to scan');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/scan/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: logInput,
          options: {
            detectCredentials: true,
            detectIps: true,
            detectPii: true,
            detectSecrets: true,
            includeContext: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error scanning logs:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan logs');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelStyles = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':
        return {
          container: 'bg-red-50 border-red-200',
          badge: 'bg-red-100 text-red-800',
          icon: '⚠️'
        };
      case 'High':
        return {
          container: 'bg-orange-50 border-orange-200',
          badge: 'bg-orange-100 text-orange-800',
          icon: '🔴'
        };
      case 'Medium':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: '🟠'
        };
      case 'Low':
        return {
          container: 'bg-green-50 border-green-200',
          badge: 'bg-green-100 text-green-800',
          icon: '🟢'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'ℹ️'
        };
    }
  };
  
  const handleScan = () => {
    switch(currentTab) {
      case 'code':
        scanCode();
        break;
      case 'url':
        scanUrl();
        break;
      case 'logs':
        scanLogs();
        break;
    }
  };
  
  const handleDownloadReport = () => {
    if (!results) return;
    
    const report = JSON.stringify(results, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-scan-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Advanced Security Scanner</h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                setResults(null);
                setError(null);
              }}
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
          <div className="flex items-center space-x-4 mb-2">
            <label className="font-medium">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 border rounded-md"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-64 p-4 border rounded-lg font-mono"
          />
        </div>
      )}

      {/* URL Scanner */}
      {currentTab === 'url' && (
        <div className="space-y-4">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL to scan (e.g., https://example.com)"
            className="w-full p-4 border rounded-lg"
          />
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
        </div>
      )}
      
      {/* Common Scan Button */}
      <div className="mt-4 flex space-x-4">
        <button
          onClick={handleScan}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </span>
          ) : (
            `Scan ${currentTab === 'code' ? 'Code' : currentTab === 'url' ? 'URL' : 'Logs'}`
          )}
        </button>
        
        {results && (
          <button
            onClick={handleDownloadReport}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            Download Report
          </button>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="mt-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Scan Summary</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold">{results.summary.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                <div className="text-2xl font-bold text-red-700">{results.summary.critical}</div>
                <div className="text-sm text-red-500">Critical</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                <div className="text-2xl font-bold text-orange-700">{results.summary.high}</div>
                <div className="text-sm text-orange-500">High</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-center">
                <div className="text-2xl font-bold text-yellow-700">{results.summary.medium}</div>
                <div className="text-sm text-yellow-500">Medium</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                <div className="text-2xl font-bold text-green-700">{results.summary.low}</div>
                <div className="text-sm text-green-500">Low</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Scan completed at: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>

          <h2 className="text-2xl font-semibold">Vulnerability Details</h2>
          
          <div className="space-y-4">
            {results.vulnerabilities.map((vuln) => {
              const styles = getRiskLevelStyles(vuln.risk_level);
              return (
                <div
                  key={vuln.id}
                  className={`p-4 rounded-lg border ${styles.container}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="mr-2">{styles.icon}</span>
                      {vuln.type}
                      {vuln.cwe && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {vuln.cwe}
                        </span>
                      )}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge}`}>
                      {vuln.risk_level}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{vuln.description}</p>
                  
                  {vuln.location && (
                    <div className="mb-3">
                      <div className="font-medium text-gray-700">Location:</div>
                      <div className="bg-gray-100 p-2 rounded font-mono text-sm">
                        {vuln.location}
                        {vuln.lineNumbers && vuln.lineNumbers.length > 0 && (
                          <span className="ml-2 text-gray-500">
                            (Line{vuln.lineNumbers.length > 1 ? 's' : ''}: {vuln.lineNumbers.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {vuln.fix && (
                    <div className="mb-3">
                      <div className="font-medium text-gray-700">Recommended Fix:</div>
                      <div className="bg-white p-3 rounded border mt-1">
                        <pre className="font-mono text-sm whitespace-pre-wrap">{vuln.fix}</pre>
                      </div>
                    </div>
                  )}
                  
                  {vuln.references && vuln.references.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-700">References:</div>
                      <ul className="list-disc list-inside text-blue-600">
                        {vuln.references.map((ref, idx) => (
                          <li key={idx} className="text-sm mt-1">
                            <a href={ref} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {ref}
                            </a>
                          </li>
                        ))}
                      </ul>
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