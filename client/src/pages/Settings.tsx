import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Zap, Users, Bot, Volume2, Plus, Trash2, Check } from 'lucide-react';
import { api } from '../lib/api';

export function Settings() {
  return (
    <div className="settings-grid">
      <SettingsNav />
      <Routes>
        <Route path="/" element={<ApiKeysSection />} />
        <Route path="/automation" element={<AutomationSection />} />
        <Route path="/contacts" element={<ContactsSection />} />
        <Route path="/voice" element={<VoiceSection />} />
      </Routes>
    </div>
  );
}

function SettingsNav() {
  const navigate = useNavigate();
  const items = [
    { path: '/settings', label: 'API Keys', icon: Key, exact: true },
    { path: '/settings/automation', label: 'Automation', icon: Zap },
    { path: '/settings/contacts', label: 'Contacts', icon: Users },
    { path: '/settings/voice', label: 'Voice', icon: Volume2 },
  ];

  return (
    <div className="settings-nav">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Inbox
      </button>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 12px', marginBottom: 8 }}>Settings</div>
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/settings'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <Icon size={15} /> {label}
        </NavLink>
      ))}
    </div>
  );
}

// ── API Keys Section ──────────────────────────────────────
function ApiKeysSection() {
  const [configs, setConfigs] = useState<Array<{ key: string; value: string; hasValue: boolean; updatedAt: string }>>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const KEY_LABELS: Record<string, { label: string; hint: string }> = {
    openai_api_key: { label: 'OpenAI API Key', hint: 'sk-proj-...' },
    google_client_id: { label: 'Google Client ID', hint: 'xxx.apps.googleusercontent.com' },
    google_client_secret: { label: 'Google Client Secret', hint: 'GOCSPX-...' },
    google_cloud_project_id: { label: 'Google Cloud Project ID', hint: 'my-project-id (for Pub/Sub)' },
  };

  useEffect(() => {
    api.get('/api/config').then(({ data }) => setConfigs(data.configs || []));
  }, []);

  const save = async (key: string) => {
    if (!edits[key]?.trim()) return;
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await api.put(`/api/config/${key}`, { value: edits[key] });
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
      setEdits(e => ({ ...e, [key]: '' }));
      const { data } = await api.get('/api/config');
      setConfigs(data.configs || []);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to save');
    }
    setSaving(s => ({ ...s, [key]: false }));
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title"><Key size={18} /> API Configuration</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Configure your API keys below. Values are stored securely in the database and masked in the UI.
        </p>

        {Object.entries(KEY_LABELS).map(([key, { label, hint }]) => {
          const config = configs.find(c => c.key === key);
          return (
            <div className="settings-card" key={key}>
              <div className="form-field">
                <label className="form-label">{label}</label>
                {config?.hasValue && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Current: {config.value} · Last updated: {new Date(config.updatedAt).toLocaleDateString()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    type="password"
                    placeholder={config?.hasValue ? 'Enter new value to update...' : hint}
                    value={edits[key] || ''}
                    onChange={e => setEdits(ed => ({ ...ed, [key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && save(key)}
                    style={{ letterSpacing: edits[key] ? '2px' : 'normal' }}
                  />
                  <button
                    className={`btn ${saved[key] ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => save(key)}
                    disabled={saving[key] || !edits[key]?.trim()}
                  >
                    {saved[key] ? <Check size={14} /> : saving[key] ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Automation Section ────────────────────────────────────
function AutomationSection() {
  const [rules, setRules] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', triggerType: 'sender', triggerValue: '', action: 'archive', actionValue: '' });

  useEffect(() => {
    api.get('/api/automation').then(({ data }) => setRules(data.rules || []));
  }, []);

  const create = async () => {
    try {
      const { data } = await api.post('/api/automation', form);
      setRules(r => [...r, data.rule]);
      setShowNew(false);
      setForm({ name: '', triggerType: 'sender', triggerValue: '', action: 'archive', actionValue: '' });
    } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const toggle = async (rule: any) => {
    await api.patch(`/api/automation/${rule.id}`, { ...rule, isActive: !rule.isActive });
    setRules(r => r.map(x => x.id === rule.id ? { ...x, isActive: !x.isActive } : x));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    await api.delete(`/api/automation/${id}`);
    setRules(r => r.filter(x => x.id !== id));
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} /> Automation Rules</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(!showNew)}><Plus size={14} /> New Rule</button>
        </div>

        {showNew && (
          <div className="settings-card" style={{ marginBottom: 16, borderColor: 'var(--border-active)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Rule</div>
            <div className="form-field">
              <label className="form-label">Rule Name</label>
              <input className="form-input" placeholder="e.g. Archive newsletters" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-field">
                <label className="form-label">Trigger</label>
                <select className="form-input" value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}>
                  <option value="sender">Sender contains</option>
                  <option value="subject_contains">Subject contains</option>
                  <option value="category">Category is</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Value</label>
                <input className="form-input" placeholder="e.g. newsletter@..." value={form.triggerValue} onChange={e => setForm(f => ({ ...f, triggerValue: e.target.value }))} />
              </div>
              <div className="form-field">
                <label className="form-label">Action</label>
                <select className="form-input" value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
                  <option value="archive">Archive</option>
                  <option value="delete">Delete</option>
                  <option value="label">Apply Label</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={create}>Create Rule</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        )}

        {rules.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-title">No automation rules</div>
            <div className="empty-state-sub">Create rules to automatically handle emails</div>
          </div>
        ) : (
          rules.map(rule => (
            <div className="settings-card" key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  When <strong style={{ color: 'var(--text-secondary)' }}>{rule.triggerType}</strong> contains &ldquo;{rule.triggerValue}&rdquo; → <strong style={{ color: 'var(--text-secondary)' }}>{rule.action}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Executed {rule.executionCount || 0} times</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${rule.isActive ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggle(rule)}
                  title={rule.isActive ? 'Disable' : 'Enable'}
                >
                  {rule.isActive ? 'Active' : 'Inactive'}
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(rule.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Contacts Section ──────────────────────────────────────
function ContactsSection() {
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/contacts').then(({ data }) => setContacts(data.contacts || []));
  }, []);

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title"><Users size={18} /> Frequent Contacts</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Customize how the AI addresses each contact when drafting replies.
        </p>
        {contacts.slice(0, 20).map(c => (
          <div className="settings-card" key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
              {(c.name || c.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name || c.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email} · {c.emailCount} emails</div>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Greet: <strong>{c.preferredGreeting}</strong></span>
              <span>Close: <strong>{c.preferredClosing}</strong></span>
              <span>Style: <strong>{c.communicationStyle}</strong></span>
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No contacts yet</div>
            <div className="empty-state-sub">Contacts are added automatically as you receive emails</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Voice Section ─────────────────────────────────────────
function VoiceSection() {
  const [prefs, setPrefs] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/config/preferences').then(({ data }) => setPrefs(data.preferences || {}));
  }, []);

  const save = async () => {
    await api.put('/api/config/preferences', { preferences: prefs });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title"><Volume2 size={18} /> Voice Settings</div>
        <div className="settings-card">
          <div className="form-field">
            <label className="form-label">Preferred Signature</label>
            <textarea className="form-input" rows={3} placeholder="Your email signature..." value={prefs.defaultSignature || ''} onChange={e => setPrefs((p: any) => ({ ...p, defaultSignature: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label className="form-label">Default Greeting</label>
              <input className="form-input" value={prefs.defaultGreeting || 'Hi'} onChange={e => setPrefs((p: any) => ({ ...p, defaultGreeting: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Default Closing</label>
              <input className="form-input" value={prefs.defaultClosing || 'Best regards'} onChange={e => setPrefs((p: any) => ({ ...p, defaultClosing: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Voice Speed ({prefs.voiceSpeed || 1.0}x)</label>
            <input type="range" min="0.5" max="2" step="0.1" value={prefs.voiceSpeed || 1.0} onChange={e => setPrefs((p: any) => ({ ...p, voiceSpeed: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
          </div>
          <button className={`btn ${saved ? 'btn-primary' : 'btn-ghost'}`} onClick={save}>
            {saved ? <><Check size={14} /> Saved!</> : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
