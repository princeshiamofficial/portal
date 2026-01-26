import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Customers from './components/Customers';
import Templates from './components/Templates';
import Devices from './components/Devices';
import Broadcast from './components/Broadcast';
import { View, User, Customer, Template, WhatsAppSession, BroadcastContact, BroadcastStats } from './types.ts';

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
        <Route path="/special-campaign" element={<SpecialCampaign />} />
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

  // Mock data for demonstration
  const [customers] = useState<Customer[]>([
    {
      id: 1,
      customer_id: "CUST-001",
      name: "Alexander Pierce",
      occupation: "Software Architect",
      dob: "12 May, 1992",
      anniversaryDate: "15 June, 2018",
      address: "24 Carbon St, Silicon Valley, CA",
      whatsapp: "+1 (555) 012-3456"
    },
    {
      id: 2,
      customer_id: "CUST-002",
      name: "Sarah Jenkins",
      occupation: "Marketing Director",
      dob: "28 Feb, 1988",
      anniversaryDate: "20 Sept, 2015",
      address: "15 Golden Gate Ave, San Francisco, CA",
      whatsapp: "+1 (555) 987-6543"
    },
    {
      id: 3,
      customer_id: "CUST-003",
      name: "Michael Chen",
      occupation: "Restaurant Owner",
      dob: "05 Sept, 1995",
      address: "88 Dragon Way, Seattle, WA",
      whatsapp: "+1 (555) 456-7890"
    },
    {
      id: 4,
      customer_id: "CUST-004",
      name: "Emma Wilson",
      occupation: "Interior Designer",
      dob: "30 Nov, 1990",
      anniversaryDate: "10 Dec, 2020",
      address: "42 Pine Street, Portland, OR",
      whatsapp: "+1 (555) 234-5678"
    }
  ]);

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      title: "Welcome Greeting",
      content: "Hi [name], thank you for choosing FoodMode! How can we help you today?",
      type: "System"
    },
    {
      id: 2,
      title: "Birthday Wish",
      content: "Happy Birthday [name]! Enjoy a 20% discount on your next visit as a gift from us.",
      type: "Promotion"
    },
    {
      id: 3,
      title: "Order Confirmation",
      content: "Your order has been received, [name]. It will be ready in 20 minutes!",
      type: "Personal"
    }
  ]);

  const [wa, setWa] = useState<WhatsAppSession>({
    status: 'connected', // Mock as connected initially for broadcast demo
    qr: null,
    user: {
      name: "Master Branch Admin",
      id: "1234567890:1@s.whatsapp.net"
    }
  });

  const [broadcastContacts, setBroadcastContacts] = useState<BroadcastContact[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStats>({ totalSentToday: 1242 });
  const [isSending, setIsSending] = useState(false);

  // Persist user session to localStorage (simple)
  useEffect(() => {
    const savedUser = localStorage.getItem('fm_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (email: string, storeName: string) => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const newUser: User = { email, storeName, role: 'admin', status: 'active' };
      setUser(newUser);
      localStorage.setItem('fm_user', JSON.stringify(newUser));
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fm_user');
  };

  const handleSaveTemplate = (template: Partial<Template>) => {
    if (template.id) {
      setTemplates(templates.map(t => t.id === template.id ? { ...t, ...template } as Template : t));
    } else {
      const newTemplate: Template = {
        id: templates.length + 1,
        title: template.title || '',
        content: template.content || '',
        type: template.type || 'Personal'
      };
      setTemplates([...templates, newTemplate]);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleConnectWA = () => {
    setWa({ status: 'connecting', qr: null });
    // Simulate QR generation
    setTimeout(() => {
      setWa({
        status: 'connecting',
        qr: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=foodmode-wa-mock-connection'
      });

      // Simulate successful scan after 10 seconds
      setTimeout(() => {
        setWa({
          status: 'connected',
          qr: null,
          user: { name: "John Admin", id: "1234567890:1@s.whatsapp.net" }
        });
      }, 8000);
    }, 1500);
  };

  const handleLogoutWA = () => {
    setWa({ status: 'none', qr: null });
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

  const handleStartBroadcast = async (templateId: number) => {
    if (broadcastContacts.length === 0) return alert('Import contacts first');
    setIsSending(true);

    // Process contacts one by one with delay
    for (let i = 0; i < broadcastContacts.length; i++) {
      const contact = broadcastContacts[i];

      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBroadcastContacts(prev => {
        const next = [...prev];
        next[i] = { ...next[i], status: 'Sent' };
        return next;
      });

      setBroadcastStats(prev => ({ totalSentToday: prev.totalSentToday + 1 }));

      // Random delay between messages (simulated)
      if (i < broadcastContacts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
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
      />
    </Router>
  );
};

export default App;
