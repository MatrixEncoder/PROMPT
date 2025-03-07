import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-700"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              SHASTRA
            </h1>
          </motion.div>
          <p className="text-gray-400">Security Vulnerability Analysis Tool</p>
        </div>
      </div>
    </motion.header>
  );
}