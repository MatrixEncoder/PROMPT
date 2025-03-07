import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Lock, Search, AlertTriangle } from 'lucide-react';

export function HomePage({ onGetStarted }: { onGetStarted: () => void }) {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-blue-400" />,
      title: "URL Analysis",
      description: "Scan websites for potential security vulnerabilities and risks"
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-400" />,
      title: "Log Analysis",
      description: "Detect suspicious patterns and security threats in log files"
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-blue-400" />,
      title: "Code Analysis",
      description: "Identify security vulnerabilities in your source code"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,0.7),rgba(17,24,39,1))]" />
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="flex items-center justify-center mb-6"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Shield className="w-16 h-16 text-blue-500" />
            </motion.div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              SHASTRA
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your advanced security vulnerability analysis toolkit. Protect your systems with powerful scanning and detection capabilities.
            </p>
            <motion.button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center space-x-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}