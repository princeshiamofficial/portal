import React, { useState, useEffect, useRef } from 'react';
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
import Settings from './components/Settings';
import VIPMember from './components/VIPMember';
import StorePage from './components/StorePage';


// Wrapper to handle navigation inside the Layout
const AppContent: React.FC<{
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  customers: Customer[];
  templates: Template[];
  onSaveTemplate: (t: Partial<Template>) => void;
  onDeleteTemplate: (id: number) => void;
  onRestoreTemplate: (id: number) => void;
  onPermanentDeleteTemplate: (id: number) => void;
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
  onUpdateUser: (u: Partial<User>) => void;
  onDeleteCustomer: (id: number) => void;
  systemUsers: any[];
  broadcastTarget: 'Customers' | 'Users';
  setBroadcastTarget: (t: 'Customers' | 'Users') => void;
  broadcastDesignation: string;
  setBroadcastDesignation: (d: string) => void;
  onRestoreDefaults: () => void;
  isInitializing: boolean;
  onRefreshData: () => void;
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
      case '/settings': return View.SETTINGS;
      default: return View.DASHBOARD;
    }
  };

  const handleSetView = (view: View) => {
    navigate(`/${view}`);
  };

  // Validate session on route change
  useEffect(() => {
    if (!props.user) return; // public pages or already logged out

    // Skip validating for public pages if they are matched here (but they usually return early above)
    if (location.pathname.startsWith('/vip') || location.pathname.startsWith('/store')) return;

    const validateSession = async () => {
      const token = localStorage.getItem('fm_token');
      if (!token) {
        props.onLogout();
        return;
      }

      try {
        const res = await fetch('/api/validate-session', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          console.warn("Route validation failed - logging out");
          props.onLogout();
          return;
        }

        if (!res.ok) return; // Ignore other transient server errors

        const data = await res.json();
        if (data && data.valid && data.user) {
          // Check if account is active
          if (data.user.isActive === 0 || data.user.isActive === false) {
            alert("Your account has been deactivated by an administrator.");
            props.onLogout();
            return;
          }

          // Update local user state if role changed
          if (data.user.role !== props.user.role) {
            console.log("Role changed detected, updating session...");
            props.onUpdateUser({ role: data.user.role });
          }
        }
      } catch (e) {
        console.error("Session check error (transient)", e);
        // Do NOT logout on network error
      }
    };
    validateSession();
  }, [location.pathname, props.onLogout, props.user]);

  // Public routes (No Auth required)
  if (location.pathname.startsWith('/vip')) {
    return <VIPMember />;
  }

  if (location.pathname.startsWith('/store')) {
    return <StorePage />;
  }

  if (props.isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 object-contain animate-pulse" />
          </div>
        </div>
        <div className="mt-8 text-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Authenticating</h3>
          <p className="text-slate-400 font-medium text-sm mt-1">Verifying your secure session...</p>
        </div>
      </div>
    );
  }

  if (!props.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Auth onLogin={props.onLogin} />
      </div>
    );
  }

  const isAdmin = props.user?.role?.toLowerCase() === 'admin' || props.user?.role?.toLowerCase() === 'superadmin';
  const filteredTemplates = isAdmin
    ? props.templates.filter(t => !t.title.includes('Birthday') && !t.title.includes('Anniversary'))
    : props.templates;

  // Final filtered list for selection (Broadcast, Special Campaigns) - Exclude Deleted
  const activeTemplates = filteredTemplates.filter(t => !t.deleted);

  return (
    <Layout
      user={props.user}
      activeView={getViewFromPath(location.pathname.substring(1) as View)}
      setView={handleSetView}
      onLogout={props.onLogout}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={props.user} />} />
        <Route path="/customers" element={<Customers customers={props.customers} loading={false} onDelete={props.onDeleteCustomer} user={props.user} />} />
        <Route path="/templates" element={
          <Templates
            templates={filteredTemplates}
            loading={false}
            onSave={props.onSaveTemplate}
            onDelete={props.onDeleteTemplate}
            onRestore={props.onRestoreTemplate}
            onPermanentDelete={props.onPermanentDeleteTemplate}
            onRestoreDefaults={props.onRestoreDefaults}
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
            templates={activeTemplates}
            contacts={props.broadcastContacts}
            wa={props.wa}
            stats={props.broadcastStats}
            onStart={props.onStartBroadcast}
            onImportCSV={props.onImportCSV}
            sending={props.isSending}
            user={props.user}
            systemUsers={props.systemUsers}
            broadcastTarget={props.broadcastTarget}
            setBroadcastTarget={props.setBroadcastTarget}
            broadcastDesignation={props.broadcastDesignation}
            setBroadcastDesignation={props.setBroadcastDesignation}
          />
        } />
        <Route path="/special-campaign" element={
          <SpecialCampaign
            user={props.user}
            templates={activeTemplates}
            settings={props.campaignSettings}
            onUpdateSettings={props.onUpdateCampaignSettings}
            customers={props.customers}
            onRefreshData={props.onRefreshData}
            onRunManual={(tid, cids) => {
              // Logic to run for specific customers if needed
              console.log('Running manual campaign', tid, cids);
            }}
          />
        } />

        <Route path="/settings" element={
          <Settings user={props.user!} onUpdateUser={props.onUpdateUser} />
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('fm_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); // We can be optimistic now

  // Data loaded from server on login
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [wa, setWa] = useState<WhatsAppSession>({
    status: 'none',
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
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [broadcastTarget, setBroadcastTarget] = useState<'Customers' | 'Users'>('Customers');
  const [broadcastDesignation, setBroadcastDesignation] = useState<string>('All');

  // Load session from token on mount
  useEffect(() => {
    const token = localStorage.getItem('fm_token');
    if (token) {
      // Quiet background validation
      fetch('/api/validate-session', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            handleLogout(); // Definitive invalid session
            return;
          }
          if (!res.ok) return; // Ignore other server errors (transient)
          return res.json();
        })
        .then(data => {
          if (data && data.valid && data.user) {
            // Check if de-activated
            if (data.user.isActive === 0 || data.user.isActive === false) {
              alert("Your account has been deactivated.");
              handleLogout();
              return;
            }
            // Update cache/state with fresh data from server
            setUser(data.user);
            localStorage.setItem('fm_user', JSON.stringify(data.user));
          }
        })
        .catch((e) => {
          console.log("Background session validation skipped (network issue)", e);
        });
    }
  }, []);

  // Data Loading Logic
  const fetchData = async () => {
    const token = localStorage.getItem('fm_token');

    // logic: if we have a user in state but no token, we are in an invalid state.
    // However, setUser might be async or we might have just loaded from LS.
    // Ideally we check token existence. If no token, we can't fetch data.
    if (!token) {
      if (user) handleLogout(); // Invalid state: user but no token
      return;
    }

    try {
      const res = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        // Token expired or invalid
        console.warn("Session expired or unauthorized");
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.customers) setCustomers(data.customers);

        if (data.templates) {
          setTemplates(data.templates);
        }

        if (data.campaignSettings) setCampaignSettings(data.campaignSettings);

        const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';
        if (isAdmin) {
          setBroadcastTarget('Users');
          const usersRes = await fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (usersRes.ok) {
            setSystemUsers(await usersRes.json());
          }
        }

        if (data.storeUrl && user && user.storeUrl !== data.storeUrl) {
          setUser(prev => prev ? { ...prev, storeUrl: data.storeUrl } : null);
        }
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  const saveData = async (key: string, value: any) => {
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    try {
      await fetch('/api/data', {
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
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updates };
    setUser(newUser);
    localStorage.setItem('fm_user', JSON.stringify(newUser));


    // Persist branding/store info to server
    const token = localStorage.getItem('fm_token');
    if (token) {
      fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      }).catch(e => console.error("Profile save failed", e));
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('fm_user', JSON.stringify(userData));
    setLoading(false);

    // Load this tenant's data
    fetchData();
  };

  // Handle manual data refresh
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
  };

  const handleSaveTemplate = (template: Partial<Template>) => {
    let newTemplates;
    if (template.id) {
      newTemplates = templates.map(t => t.id === template.id ? { ...t, ...template } as Template : t);
    } else {
      const newTemplate: Template = {
        id: Date.now(),
        title: template.title || '',
        content: template.content || '',
        type: (template.type as any) || 'Personal',
        imageUrl: template.imageUrl,
        videoUrl: template.videoUrl,
        mediaCaption: template.mediaCaption,
        deleted: false
      };
      newTemplates = [...templates, newTemplate];
    }
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };

  const handleDeleteTemplate = (id: number) => {
    const newTemplates = templates.map(t => t.id === id ? { ...t, deleted: true } : t);
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };

  const handleRestoreTemplate = (id: number) => {
    const newTemplates = templates.map(t => t.id === id ? { ...t, deleted: false } : t);
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };

  const handlePermanentDeleteTemplate = (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this template? This cannot be undone.')) return;
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveData('templates', newTemplates);
  };



  const handleDeleteCustomer = async (id: number) => {
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCustomers(customers.filter(c => c.id !== id));
      } else {
        alert('Failed to delete customer');
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleRestoreDefaults = async () => {
    const token = localStorage.getItem('fm_token');
    if (!token) return;

    try {
      const res = await fetch('/api/templates/restore-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Templates have been reset to system defaults successfully!');
        fetchData(); // Refresh list immediately
      } else {
        const err = await res.json();
        alert(`Failed to restore: ${err.message}`);
      }
    } catch (e) {
      console.error("Restore defaults error", e);
      alert('Could not connect to server.');
    }
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

    const checkStatus = async () => {
      const token = localStorage.getItem('fm_token');
      if (!token) return;
      try {
        const res = await fetch('/api/whatsapp/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWa(prev => ({
            ...prev,
            status: data.status === 'connected' ? 'connected' : (data.status === 'connecting' || data.status === 'qr_ready') ? 'connecting' : 'none',
            qr: data.qr,
            user: data.user,
          }));
        }
      } catch (e) { }
    };

    checkStatus(); // Immediate check
    const poll = setInterval(checkStatus, 3000);
    return () => clearInterval(poll);
  }, [user]);

  const handleConnectWA = async () => {
    setWa(prev => ({ ...prev, status: 'connecting' }));
    const token = localStorage.getItem('fm_token');
    await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleLogoutWA = async () => {
    const token = localStorage.getItem('fm_token');
    await fetch('/api/whatsapp/logout', {
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
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            phone: contact.phone,
            message: template?.content
              .replace(/\[name\]/g, contact.name)
              .replace(/\[business\]/g, contact.business || '') || '',
            image: template?.imageUrl,
            video: template?.videoUrl,
            caption: template?.mediaCaption
              ? template.mediaCaption.replace(/\[name\]/g, contact.name).replace(/\[business\]/g, contact.business || '')
              : undefined
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
  };

  // Initially load customers into broadcast contacts
  useEffect(() => {
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

    // Safety check: specific to admin view
    if (isAdmin && broadcastTarget !== 'Users' && systemUsers.length > 0) {
      setBroadcastTarget('Users');
    }

    if ((broadcastTarget === 'Users' || isAdmin) && systemUsers.length > 0) {
      let filteredUsers = systemUsers;
      if (broadcastDesignation !== 'All') {
        filteredUsers = systemUsers.filter(u => u.designation === broadcastDesignation);
      }
      setBroadcastContacts(filteredUsers.map(u => ({
        name: u.name || u.store_name || 'User',
        phone: u.whatsapp || '',
        status: 'Pending',
        business: u.store_name || ''
      })));
    } else {
      setBroadcastContacts(customers.map(c => ({
        name: c.name,
        phone: c.whatsapp,
        status: 'Pending',
        business: user?.storeName || ''
      })));
    }
  }, [customers, systemUsers, broadcastTarget, broadcastDesignation, user]);

  // Removed redundant frontend scheduler - handled by backend cron job for reliability
  useEffect(() => {
    // This effect is now empty as the scheduler has been moved to the server
  }, []);

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
        onRestoreTemplate={handleRestoreTemplate}
        onPermanentDeleteTemplate={handlePermanentDeleteTemplate}
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
        onUpdateUser={handleUpdateUser}
        onDeleteCustomer={handleDeleteCustomer}
        systemUsers={systemUsers}
        broadcastTarget={broadcastTarget}
        setBroadcastTarget={setBroadcastTarget}
        broadcastDesignation={broadcastDesignation}
        setBroadcastDesignation={setBroadcastDesignation}
        onRestoreDefaults={handleRestoreDefaults}
        isInitializing={isInitializing}
        onRefreshData={fetchData}
      />
    </Router>
  );
};

export default App;
