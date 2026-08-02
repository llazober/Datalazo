import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Inbox, Settings, Zap, Users, Calendar, LogOut, Bot, RefreshCw, Database, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmailStore } from '../store/emailStore';
import { api } from '../lib/api';

export function Sidebar() {
  const { user, logout } = useAuth();
  const { emails, isSyncing, setSyncing, setEmails, setLoading } = useEmailStore();
  const navigate = useNavigate();

  const unread = emails.filter(e => !e.isRead && !e.isArchived && !e.isTrashed).length;

  const syncNow = async () => {
    setSyncing(true);
    setLoading(true);
    try {
      await api.post('/api/emails/sync');
      const { data } = await api.get('/api/emails');
      setEmails(data.emails);
    } catch {} finally { setSyncing(false); setLoading(false); }
  };

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Bot size={18} color="#fff" />
        </div>
        <div>
          <div className="logo-text">AI Assistant</div>
          <div className="logo-sub">Executive Email</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="sidebar-section-title">Mail</div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Inbox size={16} /> Inbox
          {unread > 0 && <span className="nav-count">{unread > 99 ? '99+' : unread}</span>}
        </NavLink>

        <div className="sidebar-section-title" style={{ marginTop: 16 }}>Manage</div>
        <NavLink to="/settings/automation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Zap size={16} /> Automation
        </NavLink>
        <NavLink to="/settings/contacts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Users size={16} /> Contacts
        </NavLink>
        <NavLink to="/settings/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Calendar size={16} /> Calendar
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Settings size={16} /> Settings
        </NavLink>

        <div className="sidebar-section-title" style={{ marginTop: 16 }}>Platform</div>
        <a href="https://datalazo.com" target="_blank" rel="noopener noreferrer" className="nav-item" style={{ textDecoration: 'none' }}>
          <Database size={16} /> Datalazo Dashboard <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </a>

        {/* Quick sync */}
        <div className="sidebar-section-title" style={{ marginTop: 16 }}>Actions</div>
        <button className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }} onClick={syncNow} disabled={isSyncing}>
          <RefreshCw size={16} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          {isSyncing ? 'Syncing...' : 'Sync Inbox'}
        </button>
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="user-avatar" />
        ) : (
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.name?.charAt(0) || '?'}
          </div>
        )}
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-email">{user?.email}</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={logout} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
