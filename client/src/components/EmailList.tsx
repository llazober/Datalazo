import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Filter, Star, Archive, Trash2, Clock } from 'lucide-react';
import { useEmailStore, type Email, type EmailCategory, type EmailPriority } from '../store/emailStore';
import { api } from '../lib/api';
import { formatDistanceToNow } from '../lib/dateUtils';

const CATEGORIES: EmailCategory[] = ['Customer','Vendor','Accounting','Banking','Personal','Internal','Marketing','Newsletter','Spam','Unknown'];
const PRIORITIES: EmailPriority[] = ['Critical','High','Medium','Low'];

export function EmailList() {
  const { emails, selectedEmail, isLoading, isSyncing, filter, setEmails, setSelectedEmail, setLoading, setSyncing, setFilter } = useEmailStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.priority) params.set('priority', filter.priority);
      const { data } = await api.get(`/api/emails?${params}`);
      setEmails(data.emails);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const syncInbox = async () => {
    setSyncing(true);
    try {
      await api.post('/api/emails/sync');
      await fetchEmails();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { fetchEmails(); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/api/emails/search/query?q=${encodeURIComponent(q)}`);
      setEmails(data.emails);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmails(); }, [filter]);

  const priorityClass = (p?: EmailPriority) => {
    if (!p) return 'badge-low';
    return { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[p] || 'badge-low';
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="email-panel">
      {/* Header */}
      <div className="email-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Inbox</span>
          {unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowFilters(!showFilters)} title="Filter">
            <Filter size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={syncInbox} title="Sync inbox" disabled={isSyncing}>
            <RefreshCw size={14} className={isSyncing ? 'spinning' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <div className="email-search-wrap">
          <Search size={14} className="email-search-icon" />
          <input
            className="email-search"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filter-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <button
              className={`filter-chip ${!filter.priority && !filter.category ? 'active' : ''}`}
              onClick={() => setFilter({})}
            >All</button>
            {PRIORITIES.map(p => (
              <button
                key={p}
                className={`filter-chip ${filter.priority === p ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, priority: filter.priority === p ? undefined : p })}
              >{p}</button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
            {CATEGORIES.slice(0, 6).map(c => (
              <button
                key={c}
                className={`filter-chip ${filter.category === c ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, category: filter.category === c ? undefined : c })}
              >{c}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="empty-state">
            <div className="spinner" />
            <div className="empty-state-title">Loading emails...</div>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📬</div>
            <div className="empty-state-title">No emails found</div>
            <div className="empty-state-sub">Try syncing or changing your filters</div>
            <button className="btn btn-primary btn-sm" onClick={syncInbox}>Sync Inbox</button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {emails.map((email, i) => (
              <motion.div
                key={email.id}
                className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''} ${!email.isRead ? 'unread' : ''}`}
                onClick={() => setSelectedEmail(email)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
              >
                <div className="email-item-from">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.fromName || email.fromEmail}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                    {email.isStarred && <Star size={11} fill="var(--priority-high)" color="var(--priority-high)" />}
                    <span className="email-item-time">{formatDistanceToNow(email.receivedAt)}</span>
                  </div>
                </div>
                <div className="email-item-subject">{email.subject}</div>
                {email.aiSummary && (
                  <div className="email-item-snippet" style={{ color: 'rgba(148,163,184,0.8)', fontStyle: 'italic' }}>
                    {email.aiSummary}
                  </div>
                )}
                <div className="email-item-meta">
                  {email.aiPriority && (
                    <span className={`badge ${priorityClass(email.aiPriority)}`}>{email.aiPriority}</span>
                  )}
                  {email.aiCategory && (
                    <span className="badge badge-category">{email.aiCategory}</span>
                  )}
                  {email.attachments?.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📎 {email.attachments.length}</span>
                  )}
                  {email.hasMeetingRequest && (
                    <span style={{ fontSize: 11, color: 'var(--accent)' }}>📅 Meeting</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
