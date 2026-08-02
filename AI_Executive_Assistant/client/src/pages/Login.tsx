import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Mic, Mail, Zap, Calendar, Shield } from 'lucide-react';

export function Login() {
  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const features = [
    { icon: '🎙️', title: 'Voice-First', desc: 'Manage email hands-free' },
    { icon: '🤖', title: 'AI Powered', desc: 'GPT-4o drafts replies' },
    { icon: '📅', title: 'Calendar', desc: 'Auto meeting scheduling' },
    { icon: '⚡', title: 'Automation', desc: 'Smart email rules' },
  ];

  return (
    <div className="login-page">
      {/* Background glows */}
      <div className="login-bg-glow" style={{ width: 400, height: 400, background: 'rgba(99,102,241,0.08)', top: '10%', left: '10%' }} />
      <div className="login-bg-glow" style={{ width: 300, height: 300, background: 'rgba(34,211,238,0.06)', bottom: '15%', right: '15%' }} />

      <motion.div
        className="login-card glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          animate={{ boxShadow: ['0 0 30px rgba(99,102,241,0.3)', '0 0 60px rgba(99,102,241,0.5)', '0 0 30px rgba(99,102,241,0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Bot size={28} color="#fff" />
        </motion.div>

        <h1 className="login-title">AI Executive Assistant</h1>
        <p className="login-sub">Your intelligent, voice-first email companion</p>

        {/* Google Sign In */}
        <button className="login-btn-google" onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Features */}
        <div className="login-features">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="login-feature"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <div className="login-feature-icon">{f.icon}</div>
              <div className="login-feature-title">{f.title}</div>
              <div className="login-feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
          🔒 Your emails never leave your account. AI processes locally via your API keys.
        </p>
      </motion.div>
    </div>
  );
}
