import React from 'react';
import { motion } from 'framer-motion';

export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative rounded-2xl border border-cyber-border bg-cyber-card/40 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-accent/10 via-transparent to-cyber-info/10 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 rounded-2xl border border-cyber-accent/20 pointer-events-none" />

      <div className="relative p-5">
        <div className="w-12 h-12 rounded-2xl bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center">
          {Icon && <Icon className="w-6 h-6 text-cyber-accent" />}
        </div>
        <h3 className="mt-4 text-white font-semibold text-lg">{title}</h3>
        <p className="mt-2 text-gray-300 text-sm leading-relaxed">{description}</p>

        <motion.div
          className="mt-5 h-1 w-20 rounded-full bg-cyber-accent"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

