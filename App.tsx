import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Customers from './components/Customers';
import Templates from './components/Templates';
import Devices from './components/Devices';
import Broadcast from './components/Broadcast';
import { View, User, Customer, Template, WhatsAppSession, BroadcastContact, BroadcastStats, SpecialCampaignSettings } from './types.ts';

import Dashboard from './components/Dashboard';
import SpecialCampaign from './components/SpecialCampaign';

// Wrapper to handle navigation inside the Layout
const AppContent: React.FC<{
  user: User | null;
  onLogin: (email: string, storeName: string) => void;
  onLogout: () => void;
  customers: Customer[];
  templates: Template[];
  onSaveTemplate: (t: Partial<Template>) => void;
  onDeleteTemplate: (id: number) => void;
  wa: WhatsAppSession;
  onConnectWA: () => void;
  onLogoutWA: () => void;
  broadcastContacts: BroadcastContact[];
  broadcastStats: BroadcastStats;
  onStartBroadcast: (tid: number) => void;
  onImportCSV: (f: File) => void;
  isSending: boolean;
  campaignSettings: SpecialCampaignSettings;
  onUpdateCampaignSettings: (settings: SpecialCampaignSettings) => void;
}> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map URL paths to our View enum
  const getViewFromPath = (path: string): View => {
    switch (path) {
      case '/dashboard': return View.DASHBOARD;
      case '/customers': return View.CUSTOMERS;
      case '/templates': return View.TEMPLATES;
      case '/devices': return View.DEVICES;
      case '/broadcast': return View.BROADCAST;
      case '/special-campaign': return View.SPECIAL_CAMPAIGN;
      case '/insights': return View.INSIGHTS;
      case '/settings': return View.SETTINGS;
      default: return View.DASHBOARD;
    }
  };

  const handleSetView = (view: View) => {
    navigate(`/${view}`);
  };

  if (!props.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Auth onLogin={props.onLogin} />
      </div>
    );
  }

  return (
    <Layout
      user={props.user}
      activeView={getViewFromPath(location.pathname.substring(1) as View)}
      setView={handleSetView}
      onLogout={props.onLogout}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers customers={props.customers} loading={false} />} />
        <Route path="/templates" element={
          <Templates
            templates={props.templates}
            loading={false}
            onSave={props.onSaveTemplate}
            onDelete={props.onDeleteTemplate}
          />
        } />
        <Route path="/devices" element={
          <Devices
            wa={props.wa}
            onConnect={props.onConnectWA}
            onLogout={props.onLogoutWA}
          />
        } />
        <Route path="/broadcast" element={
          <Broadcast
            templates={props.templates}
            contacts={props.broadcastContacts}
            wa={props.wa}
            stats={props.broadcastStats}
            onStart={props.onStartBroadcast}
            onImportCSV={props.onImportCSV}
            sending={props.isSending}
          />
        } />
        <Route path="/special-campaign" element={
          <SpecialCampaign
            templates={props.templates}
            settings={props.campaignSettings}
            onUpdateSettings={props.onUpdateCampaignSettings}
            customers={props.customers}
            onRunManual={(tid, cids) => {
              // Logic to run for specific customers if needed
              console.log('Running manual campaign', tid, cids);
            }}
          />
        } />
        <Route path="/insights" element={
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fa-solid fa-wand-magic-sparkles text-6xl mb-4 opacity-20"></i>
            <p className="font-bold text-xl">AI Insights Coming Soon</p>
          </div>
        } />
        <Route path="/settings" element={
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fa-solid fa-cog text-6xl mb-4 opacity-20"></i>
            <p className="font-bold text-xl">Settings Coming Soon</p>
          </div>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Data loaded from server on login
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [wa, setWa] = useState<WhatsAppSession>({
    status: 'disconnected',
    qr: null,
    user: undefined
  });

  const [broadcastContacts, setBroadcastContacts] = useState<BroadcastContact[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStats>({ totalSentToday: 1242 });
  const [isSending, setIsSending] = useState(false);
  const [campaignSettings, setCampaignSettings] = useState<SpecialCampaignSettings>({
    birthdayTemplateId: null,
    birthdayActive: false,
    anniversaryTemplateId: null,
    anniversaryActive: false,
    scheduledCampaigns: []
  });

  // Persist user session to localStorage (simple)
  useEffect(() => {
    const savedUser = localStorage.getItem('fm_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedSettings = localStorage.getItem('fm_campaign_settings');
    if (savedSettings) setCampaignSettings(JSON.parse(savedSettings));
  }, []);

  // Data Loading Logic
  const fetchData = async () => {
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3000/api/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customers) setCustomers(data.customers);
        if (data.templates) setTemplates(data.templates);
        if (data.campaignSettings) setCampaignSettings(data.campaignSettings);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  const saveData = async (key: string, value: any) => {
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    try {
      await fetch('http://localhost:3000/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: value })
      });
    } catch (e) { console.error("Save failed", e); }
  };

  const handleUpdateCampaignSettings = (settings: SpecialCampaignSettings) => {
    setCampaignSettings(settings);
    // Persist to server
    saveData('campaignSettings', settings);
    localStorage.setItem('fm_campaign_settings', JSON.stringify(settings));
  };

  const handleLogin = (email: string, storeName: string) => {
    // In a real flow, auth component passes the full user object, but for now we reconstruct or re-fetch
    const token = localStorage.getItem('fm_token');
    // We assume the component or a separate fetch got us the user details roughly
    const newUser: User = {
      email,
      storeName,
      role: 'admin',
      status: 'active',
      // We could decode token to get instanceId if needed, or Auth passes it
    };
    setUser(newUser);
    localStorage.setItem('fm_user', JSON.stringify(newUser));
    setLoading(false);

    // Load this tenant's data
    fetchData();
  };

  // Init data on load if user exists
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fm_user');
  };

  const handleSaveTemplate = (template: Partial<Template>) => {
    let newTemplates;
    if (template.id) {
      newTemplates = templates.map(t => t.id === template.id ? { ...t, ...template } as Template : t);
    } else {
      const newTemplate: Template = {
        id: templates.length + 1, // Simple ID gen, conflict risk in real app
        title: template.title || '',
        content: template.content || '',
        type: template.type || 'Personal'
      };
      newTemplates = [...templates, newTemplate];
    }
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };

  const handleDeleteTemplate = (id: number) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };



  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
      const newContacts: BroadcastContact[] = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          name: parts[0]?.trim() || 'Unknown',
          phone: parts[1]?.trim() || 'No Phone',
          status: 'Pending'
        };
      });
      setBroadcastContacts([...broadcastContacts, ...newContacts]);
    };
    reader.readAsText(file);
  };

  // Poll WhatsApp Status
  useEffect(() => {
    if (!user) return;
    const poll = setInterval(async () => {
      const token = localStorage.getItem('fm_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:3000/api/whatsapp/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWa(prev => ({
            ...prev,
            status: data.status === 'connected' ? 'connected' : data.status === 'connecting' ? 'connecting' : 'none',
            qr: data.qr,
            user: data.user,
          }));
        }
      } catch (e) {
        // silent fail
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [user]);

  const handleConnectWA = async () => {
    setWa(prev => ({ ...prev, status: 'connecting' }));
    const token = localStorage.getItem('fm_token');
    await fetch('http://localhost:3000/api/whatsapp/connect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleLogoutWA = async () => {
    const token = localStorage.getItem('fm_token');
    await fetch('http://localhost:3000/api/whatsapp/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setWa({ status: 'none', qr: null });
  };

  // ... (existing imports/logic)

  const handleStartBroadcast = async (templateId: number) => {
    if (broadcastContacts.length === 0) return alert('Import contacts first');
    setIsSending(true);
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    const template = templates.find(t => t.id === templateId);

    // Process contacts one by one with delay
    for (let i = 0; i < broadcastContacts.length; i++) {
      const contact = broadcastContacts[i];
      if (contact.status === 'Sent') continue;

      try {
        const res = await fetch('http://localhost:3000/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            phone: contact.phone,
            message: template?.content.replace('[name]', contact.name) || 'Hello'
          })
        });

        if (res.ok) {
          setBroadcastContacts(prev => {
            const next = [...prev];
            next[i] = { ...next[i], status: 'Sent' };
            return next;
          });
          setBroadcastStats(prev => ({ totalSentToday: prev.totalSentToday + 1 }));
        } else {
          setBroadcastContacts(prev => {
            const next = [...prev];
            next[i] = { ...next[i], status: 'Failed' };
            return next;
          });
        }
      } catch (e) {
        console.error(e);
      }

      // Random delay (controlled by server too, but client pacing is good UX)
      if (i < broadcastContacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsSending(false);
    alert('Campaign Finished!');
  };

  // Initially load customers into broadcast contacts
  useEffect(() => {
    setBroadcastContacts(customers.map(c => ({
      name: c.name,
      phone: c.whatsapp,
      status: 'Pending'
    })));
  }, [customers]);

  // Auto-run special campaigns check
  useEffect(() => {
    if (!wa || wa.status !== 'connected') return;

    const checkCelebrations = async () => {
      const today = new Date();
      // Format to "DD Month" e.g. "26 January" or "26 Jan"
      const day = today.getDate().toString().padStart(2, '0');
      const month = today.toLocaleString('en-GB', { month: 'short' });
      const todayStr = `${day} ${month}`; // "26 Jan"

      const birthdayTemplate = campaignSettings.birthdayActive ? templates.find(t => t.id === campaignSettings.birthdayTemplateId) : null;
      const anniversaryTemplate = campaignSettings.anniversaryActive ? templates.find(t => t.id === campaignSettings.anniversaryTemplateId) : null;

      let sentCount = 0;

      for (const customer of customers) {
        // Birthday check
        if (birthdayTemplate && customer.dob.toLowerCase().includes(todayStr.toLowerCase())) {
          console.log(`Auto-sending Birthday wish to ${customer.name}`);
          sentCount++;
          // Simulate WhatsApp send delay
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Anniversary check
        if (anniversaryTemplate && customer.anniversaryDate && customer.anniversaryDate.toLowerCase().includes(todayStr.toLowerCase())) {
          console.log(`Auto-sending Anniversary wish to ${customer.name}`);
          sentCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (sentCount > 0) {
        setBroadcastStats(prev => ({ totalSentToday: prev.totalSentToday + sentCount }));
        // In a real app we'd prevent re-sending the same day
      }
    };

    // Run check once on connect or settings change, and set up an interval for scheduled tasks
    const interval = setInterval(checkCelebrations, 60000); // Check every minute
    checkCelebrations();

    return () => clearInterval(interval);
  }, [wa.status, campaignSettings, customers, templates]);

  // Combined logic for auto-campaigns (Birthday, Anniversary, and Scheduled)
  const checkCelebrations = async () => {
    if (!wa || wa.status !== 'connected') return;
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    const today = new Date();
    // Format to "DD Month" e.g. "26 January" or "26 Jan"
    const day = today.getDate().toString().padStart(2, '0');
    const month = today.toLocaleString('en-GB', { month: 'short' });
    const todayStr = `${day} ${month}`; // "26 Jan"

    const birthdayTemplate = campaignSettings.birthdayActive ? templates.find(t => t.id === campaignSettings.birthdayTemplateId) : null;
    const anniversaryTemplate = campaignSettings.anniversaryActive ? templates.find(t => t.id === campaignSettings.anniversaryTemplateId) : null;

    let sentCount = 0;

    // 1. Process Repeater Campaigns (Birthday/Anniversary)
    for (const customer of customers) {
      // Birthday check
      if (birthdayTemplate && customer.dob.toLowerCase().includes(todayStr.toLowerCase())) {
        try {
          console.log(`Auto-sending Birthday wish to ${customer.name}`);
          await fetch('http://localhost:3000/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              phone: customer.whatsapp,
              message: birthdayTemplate.content.replace('[name]', customer.name)
            })
          });
          sentCount++;
        } catch (e) { console.error('Auto-campaign failed', e); }
      }

      // Anniversary check
      if (anniversaryTemplate && customer.anniversaryDate && customer.anniversaryDate.toLowerCase().includes(todayStr.toLowerCase())) {
        try {
          console.log(`Auto-sending Anniversary wish to ${customer.name}`);
          await fetch('http://localhost:3000/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              phone: customer.whatsapp,
              message: anniversaryTemplate.content.replace('[name]', customer.name)
            })
          });
          sentCount++;
        } catch (e) { console.error('Auto-campaign failed', e); }
      }
    }

    // 2. Process One-time Scheduled Campaigns
    const now = new Date();
    let campaignsUpdated = false;
    const updatedCampaigns = [...(campaignSettings.scheduledCampaigns || [])];

    for (let i = 0; i < updatedCampaigns.length; i++) {
      const campaign = updatedCampaigns[i];
      if (campaign.status === 'Pending' && new Date(campaign.scheduledTime) <= now) {
        const template = templates.find(t => t.id === campaign.templateId);
        if (template) {
          console.log(`Starting Scheduled Campaign: ${template.title}`);

          // Send all
          for (const customer of customers) {
            try {
              await fetch('http://localhost:3000/api/whatsapp/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  phone: customer.whatsapp,
                  message: template.content.replace('[name]', customer.name)
                })
              });
              sentCount++;
              // Rate limit
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) { console.error('Scheduled send failed', e); }
          }

          updatedCampaigns[i] = { ...campaign, status: 'Completed' };
          campaignsUpdated = true;
        }
      }
    }

    if (campaignsUpdated) {
      handleUpdateCampaignSettings({
        ...campaignSettings,
        scheduledCampaigns: updatedCampaigns
      });
    }

    if (sentCount > 0) {
      setBroadcastStats(prev => ({ totalSentToday: prev.totalSentToday + sentCount }));
    }
  };

  return (
    <Router>
      <AppContent
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        customers={customers}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        wa={wa}
        onConnectWA={handleConnectWA}
        onLogoutWA={handleLogoutWA}
        broadcastContacts={broadcastContacts}
        broadcastStats={broadcastStats}
        onStartBroadcast={handleStartBroadcast}
        onImportCSV={handleImportCSV}
        isSending={isSending}
        campaignSettings={campaignSettings}
        onUpdateCampaignSettings={handleUpdateCampaignSettings}
      />
    </Router>
  );
};

export default App;
