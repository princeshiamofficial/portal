
export enum View {
    DASHBOARD = 'dashboard',
    CUSTOMERS = 'customers',
    TEMPLATES = 'templates',
    DEVICES = 'devices',
    BROADCAST = 'broadcast',
    SPECIAL_CAMPAIGN = 'special-campaign',
    INSIGHTS = 'insights',
    SETTINGS = 'settings'
}

export interface User {
    storeName: string;
    email: string;
    role: string;
    status?: string;
    instanceId?: string;
    logo?: string;
    memberId?: string;
    storeUrl?: string;
}

export interface Customer {
    id: number;
    customer_id: string;
    name: string;
    occupation: string;
    dob: string;
    anniversaryDate?: string;
    address: string;
    whatsapp: string;
}

export interface Template {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    type: 'Personal' | 'System' | 'Promotion';
    is_hidden?: boolean;
    deleted?: boolean;
}

export interface WhatsAppSession {
    status: 'none' | 'connecting' | 'connected';
    qr: string | null;
    user?: {
        name: string;
        id: string;
    };
}

export interface BroadcastContact {
    name: string;
    phone: string;
    status: 'Pending' | 'Sent' | 'Failed';
    business?: string;
}

export interface BroadcastStats {
    totalSentToday: number;
}
export interface ScheduledCampaign {
    id: number;
    templateId: number;
    scheduledTime: string; // ISO string
    status: 'Pending' | 'Completed' | 'Cancelled';
    targetRole?: string;
}

export interface SpecialCampaignSettings {
    birthdayTemplateId: number | null;
    birthdayActive: boolean;
    anniversaryTemplateId: number | null;
    anniversaryActive: boolean;
    scheduledCampaigns: ScheduledCampaign[];
    lastRunDate?: string; // YYYY-MM-DD to track daily runs
}
