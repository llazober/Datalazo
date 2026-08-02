import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { EmailList } from '../components/EmailList';
import { EmailDetail } from '../components/EmailDetail';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { useAuth } from '../context/AuthContext';
import { useEmailSocket } from '../hooks/useEmailSocket';

export function Dashboard() {
  const { user } = useAuth();
  useEmailSocket(user?.id);

  return (
    <div className="app-layout">
      <Sidebar />
      <EmailList />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <EmailDetail />
      </div>
      <VoiceAssistant userId={user?.id} />
    </div>
  );
}
