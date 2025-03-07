import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Download, FileText, FileCode, Table } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface AnalysisProps {
  results: string[];
  showResults: boolean;
  onDownload: (format: 'txt' | 'html' | 'csv') => void;
}

export function Analysis({ results, showResults, onDownload }: AnalysisProps) {
  return (
    <AnimatePresence>
      {showResults && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Analysis Results</h3>
            <div className="flex space-x-2">
              <DownloadButton
                icon={<FileText className="w-4 h-4" />}
                label="Bug Report"
                onClick={() => onDownload('txt')}
              />
              <DownloadButton
                icon={<FileCode className="w-4 h-4" />}
                label="HTML Report"
                onClick={() => onDownload('html')}
              />
              <DownloadButton
                icon={<Table className="w-4 h-4" />}
                label="CSV Report"
                onClick={() => onDownload('csv')}
              />
            </div>
          </div>
          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700/50 backdrop-blur rounded-lg p-4 flex items-start space-x-3 border border-gray-600"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-200">{result}</p>
                  <SyntaxHighlighter
                    language="javascript"
                    style={atomOneDark}
                    className="mt-2 rounded"
                  >
                    {`// Example vulnerable code\nfunction unsafeOperation() {\n  eval(userInput); // Potential security risk\n}`}
                  </SyntaxHighlighter>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DownloadButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center space-x-1 bg-gray-700/50 hover:bg-gray-600/50 text-sm px-3 py-1 rounded-lg transition-colors"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}