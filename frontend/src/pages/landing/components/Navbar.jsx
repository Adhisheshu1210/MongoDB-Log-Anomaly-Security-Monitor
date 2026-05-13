import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Menu, X } from 'lucide-react';

const NavLink = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={
        'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
        (isActive
          ? 'text-white'
          : 'text-gray-300 hover:text-white')
      }
    >
      {children}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute left-3 right-3 bottom-1 h-[2px] rounded-full bg-cyber-accent"
        />
      )}
    </Link>
  );
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-cyber-accent/10 via-transparent to-cyber-info/10 opacity-0 md:opacity-100" />
      <motion.div
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mt-3 rounded-2xl border border-cyber-border/70 bg-black/20 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,255,136,0.06)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyber-accent/10 border border-cyber-accent/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.18)]">
                  <Activity className="w-6 h-6 text-cyber-accent" />
                </div>
                <div className="leading-tight">
                  <div className="text-white font-semibold text-sm sm:text-base">
                    MongoDB Log Anomaly & Security Monitor
                  </div>
                  <div className="text-xs text-cyber-info/80">AI Observability • SIEM</div>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/">Home</NavLink>
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="btn btn-outline"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </div>

            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-cyber-border bg-cyber-card/30"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="w-5 h-5 text-cyber-info" /> : <Menu className="w-5 h-5 text-cyber-info" />}
            </button>
          </div>
        </div>
      </motion.div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
          className="md:hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="mt-2 rounded-2xl border border-cyber-border/70 bg-black/30 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                to="/login"
                className="btn btn-outline text-center"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-center"
                onClick={() => setOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}

