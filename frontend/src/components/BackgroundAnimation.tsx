import React from 'react';
import { motion } from 'framer-motion';

export function BackgroundAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,0.7),rgba(17,24,39,1))]" />
      
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-blue-500/10 rounded-full"
          style={{
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}