import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const SECRET_KEY = 'foodmode_secret_key_change_in_prod';
const USERS_FILE = path.join(__dirname, 'users.json');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

app.use(cors());
app.use(bodyParser.json());

// Default Mock Data for new tenants
const DEFAULT_DATA = {
    customers: [
        {
            id: 1,
            customer_id: "CUST-001",
            name: "John Doe (Example)",
            occupation: "New Customer",
            dob: "01 Jan, 1990",
            address: "123 Example St",
            whatsapp: "+1 (555) 000-0000"
        }
    ],
    templates: [
        {
            id: 1,
            title: "Welcome Greeting",
            content: "Hi [name], welcome!",
            type: "System"
        }
    ],
    campaignSettings: {
        birthdayTemplateId: null,
        birthdayActive: false,
        anniversaryTemplateId: null,
        anniversaryActive: false,
        scheduledCampaigns: []
    }
};

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Helper: Read Users
const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, '[]');
        return [];
    }
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
};

// Helper: Write Users
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Helper: User Data Path
const getUserDataPath = (userId) => path.join(DATA_DIR, `${userId}.json`);

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, storeName } = req.body;
        if (!email || !password || !storeName) return res.status(400).json({ message: 'All fields required' });

        const users = readUsers();
        if (users.find(u => u.email === email)) return res.status(400).json({ message: 'User exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now();

        // Generate isolated instance ID for WhatsApp (Evolution/Baileys concept)
        const instanceId = `instance_${userId}_${Math.random().toString(36).substr(2, 9)}`;

        const newUser = {
            id: userId,
            email,
            password: hashedPassword,
            storeName,
            role: 'admin',
            instanceId // This assigns the specific WhatsApp instance to this tenant
        };

        // Initialize Isolated Data Storage
        fs.writeFileSync(getUserDataPath(userId), JSON.stringify(DEFAULT_DATA, null, 2));

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ message: 'User created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = readUsers();
        const user = users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, instanceId: user.instanceId },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        const { password: _, ...cleanUser } = user;
        res.json({ token, user: cleanUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected Data Endpoints (Multi-tenancy logic)
app.get('/api/data', authenticateToken, (req, res) => {
    try {
        const dataPath = getUserDataPath(req.user.id);
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json(DEFAULT_DATA);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error loading data' });
    }
});

app.post('/api/data', authenticateToken, (req, res) => {
    try {
        const dataPath = getUserDataPath(req.user.id);
        // Merge existing data with updates
        let currentData = DEFAULT_DATA;
        if (fs.existsSync(dataPath)) {
            currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }

        const newData = { ...currentData, ...req.body };
        fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));

        res.json({ message: 'Data saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving data' });
    }
});

import { initializeWhatsApp, getSessionStatus, logoutSession, sendMessage } from './whatsappService.js';

// ... existing code ...

// WhatsApp Endpoints
app.get('/api/whatsapp/status', authenticateToken, (req, res) => {
    if (!req.user.instanceId) return res.status(400).json({ message: 'No instance ID found for user' });
    const status = getSessionStatus(req.user.instanceId);
    res.json(status);
});

app.post('/api/whatsapp/connect', authenticateToken, async (req, res) => {
    if (!req.user.instanceId) return res.status(400).json({ message: 'No instance ID found for user' });
    try {
        await initializeWhatsApp(req.user.instanceId);
        res.json({ message: 'Initialization started' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to start session' });
    }
});

app.post('/api/whatsapp/logout', authenticateToken, async (req, res) => {
    if (!req.user.instanceId) return res.status(400).json({ message: 'No instance ID found for user' });
    await logoutSession(req.user.instanceId);
    res.json({ message: 'Logged out' });
});

app.post('/api/whatsapp/send', authenticateToken, async (req, res) => {
    if (!req.user.instanceId) return res.status(400).json({ message: 'No instance ID found for user' });
    const { phone, message } = req.body;

    if (!phone || !message) return res.status(400).json({ message: 'Phone and message required' });

    try {
        await sendMessage(req.user.instanceId, phone, message);
        res.json({ status: 'sent' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message || 'Failed to send' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
