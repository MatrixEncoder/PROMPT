import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Link, FileText, Code, Upload, Download } from 'lucide-react';
import { Analysis } from './components/Analysis';
import { Header } from './components/Header';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { HomePage } from './components/HomePage';

interface Vulnerability {
  type: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  fix?: string;
}

function App() {
  const [showHomePage, setShowHomePage] = useState(true);
  const [activeTab, setActiveTab] = useState<'url' | 'log' | 'code'>('url');
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Vulnerability[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setAnalyzing(true);
    setShowResults(false);
    
    try {
      const endpoint = activeTab === 'url' 
        ? '/api/scan/url'
        : activeTab === 'log'
        ? '/api/scan/logs'
        : '/api/scan/code';

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [activeTab === 'url' ? 'url' : activeTab === 'log' ? 'logs' : 'code']: input
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Analysis error:', error);
      setResults([{
        type: 'Error',
        risk_level: 'High',
        description: 'Failed to analyze. Please try again.',
      }]);
      setShowResults(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInput(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInput(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleExport = (format: 'html' | 'csv' | 'bug') => {
    if (!results.length) return;

    let content = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = `security-scan-${timestamp}`;
    let type = 'text/plain';

    switch (format) {
      case 'html':
        content = `
<!DOCTYPE html>
<html>
<head>
  <title>Security Scan Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .vulnerability { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 0.5rem; }
    .critical { border-color: #ef4444; background-color: #fee2e2; }
    .high { border-color: #f97316; background-color: #ffedd5; }
    .medium { border-color: #eab308; background-color: #fef9c3; }
    .low { border-color: #22c55e; background-color: #dcfce7; }
    .risk-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
    .fix-code { background: #1f2937; color: #fff; padding: 1rem; border-radius: 0.375rem; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Security Scan Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  ${results.map(vuln => `
    <div class="vulnerability ${vuln.risk_level.toLowerCase()}">
      <h3>${vuln.type}</h3>
      <span class="risk-badge">${vuln.risk_level}</span>
      <p>${vuln.description}</p>
      ${vuln.fix ? `<div class="fix-code">${vuln.fix}</div>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
        filename += '.html';
        type = 'text/html';
        break;

      case 'csv':
        content = 'Type,Risk Level,Description,Fix\n';
        content += results.map(vuln => 
          `"${vuln.type}","${vuln.risk_level}","${vuln.description.replace(/"/g, '""')}","${(vuln.fix || '').replace(/"/g, '""')}"`
        ).join('\n');
        filename += '.csv';
        type = 'text/csv';
        break;

      case 'bug':
        content = results.map(vuln => `
Bug Title: ${vuln.type}
Risk Level: ${vuln.risk_level}
Description: ${vuln.description}
${vuln.fix ? `\nRemediation:\n${vuln.fix}` : ''}
-------------------
`).join('\n');
        filename += '.txt';
        break;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showHomePage) {
    return <HomePage onGetStarted={() => setShowHomePage(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      <BackgroundAnimation />
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-gray-700"
          >
            <div className="flex space-x-4 mb-6">
              <TabButton
                active={activeTab === 'url'}
                onClick={() => {
                  setActiveTab('url');
                  setInput('');
                  setResults([]);
                  setShowResults(false);
                }}
                icon={<Link />}
                label="URL Analysis"
              />
              <TabButton
                active={activeTab === 'log'}
                onClick={() => {
                  setActiveTab('log');
                  setInput('');
                  setResults([]);
                  setShowResults(false);
                }}
                icon={<FileText />}
                label="Log Analysis"
              />
              <TabButton
                active={activeTab === 'code'}
                onClick={() => {
                  setActiveTab('code');
                  setInput('');
                  setResults([]);
                  setShowResults(false);
                }}
                icon={<Code />}
                label="Code Analysis"
              />
            </div>

            <motion.div
              layout
              className="space-y-4"
            >
              <div 
                className="relative"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {(activeTab === 'log' || activeTab === 'code') && (
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept={activeTab === 'log' ? '.log,.txt' : '.js,.ts,.py,.java,.cpp'}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-700/50 backdrop-blur rounded-lg p-4 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload or drag & drop {activeTab === 'log' ? 'log' : 'code'} file</span>
                    </motion.button>
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Enter ${activeTab === 'url' ? 'URLs' : activeTab === 'log' ? 'log content' : 'code'} to analyze...`}
                  className="w-full h-40 bg-gray-700/50 backdrop-blur rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-600"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={analyzing || !input.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
              >
                {analyzing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                <span>{analyzing ? 'Analyzing...' : 'Analyze'}</span>
              </motion.button>

              {showResults && results.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Scan Results</h2>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExport('html')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>HTML Report</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExport('csv')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>CSV Report</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExport('bug')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Bug Report</span>
                      </motion.button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {results.map((vuln, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          vuln.risk_level === 'Critical' ? 'bg-red-50/10 border-red-500/50' :
                          vuln.risk_level === 'High' ? 'bg-orange-50/10 border-orange-500/50' :
                          vuln.risk_level === 'Medium' ? 'bg-yellow-50/10 border-yellow-500/50' :
                          'bg-green-50/10 border-green-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{vuln.type}</h3>
                          <span 
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              vuln.risk_level === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              vuln.risk_level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              vuln.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {vuln.risk_level}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{vuln.description}</p>
                        {vuln.fix && (
                          <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                            <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{vuln.fix}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 backdrop-blur'
      }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

export default App;