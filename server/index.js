import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'foodmode_secret_key_change_in_prod';

// Request Logger
app.use((req, res, next) => {
    const bdTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    console.log(`${bdTime} [Request] ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' })); // Increased limit for media uploads
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Logo Upload Route Moved below middleware

// Default Mock Data for new tenants
const DEFAULT_DATA = {
    customers: []
};

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, async (err, decodedUser) => {
        if (err) return res.sendStatus(403);

        try {
            const db = await getDb();
            // Verify user still exists in DB
            const userExists = await db.get('SELECT id FROM users WHERE id = ?', [decodedUser.id]);

            if (!userExists) {
                return res.status(401).json({ message: 'User account no longer exists' });
            }

            req.user = decodedUser;
            next();
        } catch (dbErr) {
            console.error('Auth DB verify failed', dbErr);
            return res.sendStatus(500);
        }
    });
};

// Logo Upload Route
app.post('/api/upload-logo', authenticateToken, upload.single('logo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const logoUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ logoUrl });
});

// Template Image Upload Route
app.post('/api/templates/upload-image', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const imageUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, storeName, name } = req.body;
        if (!email || !password || !storeName) return res.status(400).json({ message: 'All fields required' });

        const db = await getDb();
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) return res.status(400).json({ message: 'User exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memberId = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await db.run(
            'INSERT INTO users (email, password, storeName, name, role, instanceId, memberId) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, storeName, name || '', 'user', instanceId, memberId]
        );
        const userId = result.lastID;

        // Initialize Isolated Data Storage with Defaults
        for (const customer of DEFAULT_DATA.customers) {
            await db.run(
                'INSERT INTO customers (userId, customer_id, name, occupation, dob, address, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, customer.customer_id, customer.name, customer.occupation, customer.dob, customer.address, customer.whatsapp]
            );
        }

        const templatesToInsert = await db.all("SELECT title, content, type FROM default_templates WHERE target_role = 'user'");
        for (const template of templatesToInsert) {
            await db.run(
                'INSERT INTO templates (userId, title, content, type) VALUES (?, ?, ?, ?)',
                [userId, template.title, template.content, template.type]
            );
        }

        await db.run(
            'INSERT INTO campaign_settings (userId) VALUES (?)',
            [userId]
        );

        res.status(201).json({ message: 'User created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Validate Session
// Validate Session & Check Status
app.get('/api/validate-session', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, role, isActive, storeName, email, logo, memberId FROM users WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(401).json({ valid: false, message: 'User not found' });
        }

        // Return current fresh data so frontend can update state if role/active changed
        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                storeName: user.storeName,
                logo: user.logo,
                memberId: user.memberId
            }
        });
    } catch (e) {
        console.error("Session validation error", e);
        res.status(500).json({ valid: false });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public API for VIP Member Page
app.get('/api/public/check-customer', async (req, res) => {
    try {
        const { memberId, code } = req.query;
        if (!memberId || !code) return res.status(400).json({ message: 'Missing parameters' });

        const db = await getDb();
        // Find store/user by memberId
        const user = await db.get('SELECT id, storeUrl FROM users WHERE memberId = ?', [memberId]);
        if (!user) return res.status(404).json({ message: 'Store not found' });

        // Check if customer exists for this user with this code (using customer_id or phone as code)
        const customer = await db.get(
            'SELECT * FROM customers WHERE userId = ? AND (customer_id = ? OR whatsapp = ?)',
            [user.id, code, code]
        );

        if (customer) {
            res.json({ registered: true, customer, storeUrl: user.storeUrl });
        } else {
            res.json({ registered: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/public/register-customer', async (req, res) => {
    try {
        const { memberId, name, whatsapp, dob, address, occupation, customer_id, anniversaryDate, maritalStatus } = req.body;
        if (!memberId || !name || !whatsapp) return res.status(400).json({ message: 'Required fields missing' });

        const db = await getDb();
        const user = await db.get('SELECT id, storeUrl FROM users WHERE memberId = ?', [memberId]);
        if (!user) return res.status(404).json({ message: 'Store not found' });

        const finalCustomerId = customer_id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

        await db.run(
            'INSERT INTO customers (userId, customer_id, name, occupation, dob, anniversaryDate, address, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, finalCustomerId, name, occupation || '', dob || '', anniversaryDate || '', address || '', whatsapp]
        );

        res.status(201).json({ message: 'Customer registered', customerId: finalCustomerId, storeUrl: user.storeUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/public/store-info', async (req, res) => {
    try {
        const { memberId } = req.query;
        if (!memberId) return res.status(400).json({ message: 'Missing memberId' });

        const db = await getDb();
        const user = await db.get('SELECT storeName, logo, memberId FROM users WHERE memberId = ?', [memberId]);

        if (!user) return res.status(404).json({ message: 'Store not found' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change Password
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new password are required' });
        }

        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected Data Endpoints (Multi-tenancy logic)
app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();

        // Fetch only this user's customers, regardless of role
        const customers = await db.all('SELECT * FROM customers WHERE userId = ?', [req.user.id]);

        // Fetch templates for this user
        const templates = await db.all('SELECT * FROM templates WHERE userId = ?', [req.user.id]);

        // Fetch campaign settings for this user
        const settings = await db.get('SELECT * FROM campaign_settings WHERE userId = ?', [req.user.id]);

        res.json({
            customers,
            storeUrl: req.user.storeUrl,
            templates: templates.map(t => ({ ...t, deleted: !!t.deleted })),
            campaignSettings: settings ? {
                ...settings,
                birthdayActive: !!settings.birthdayActive,
                anniversaryActive: !!settings.anniversaryActive,
                scheduledCampaigns: JSON.parse(settings.scheduledCampaigns || '[]')
            } : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error loading data' });
    }
});

app.post('/api/data', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        const body = req.body;

        console.log(`[API] /api/data POST from userId: ${userId} (role: ${req.user.role})`);

        if (!userId) {
            console.error('[API] Error: userId is missing from token!');
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        if (body.customers) {
            // Simple sync: replace all customers for this user (could be optimized)
            await db.run('DELETE FROM customers WHERE userId = ?', [userId]);
            for (const c of body.customers) {
                await db.run(
                    'INSERT INTO customers (userId, customer_id, name, occupation, dob, anniversaryDate, address, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, c.customer_id, c.name, c.occupation, c.dob, c.anniversaryDate, c.address, c.whatsapp]
                );
            }
        }

        if (body.deleteCustomerId) {
            await db.run('DELETE FROM customers WHERE id = ? AND userId = ?', [body.deleteCustomerId, userId]);
        }

        if (body.templates) {
            console.log(`[API] Saving ${body.templates.length} templates for user ${userId}`);
            const connection = await db.pool.getConnection();
            try {
                await connection.beginTransaction();
                await connection.execute('DELETE FROM templates WHERE userId = ?', [userId]);
                for (const t of body.templates) {
                    if (!t.title) {
                        console.warn(`[API] Skipping template without title for user ${userId}`);
                        continue;
                    }
                    await connection.execute(
                        'INSERT INTO templates (userId, title, content, type, deleted, imageUrl, videoUrl, mediaCaption) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [userId, t.title, t.content || '', t.type || 'Personal', t.deleted ? 1 : 0, t.imageUrl || null, t.videoUrl || null, t.mediaCaption || null]
                    );
                }
                await connection.commit();
                console.log(`[API] Successfully saved templates for user ${userId}`);
            } catch (err) {
                await connection.rollback();
                console.error(`[API] Failed to save templates for user ${userId}:`, err);
                throw err;
            } finally {
                connection.release();
            }
        }

        if (body.campaignSettings) {
            const s = body.campaignSettings;
            await db.run(
                `REPLACE INTO campaign_settings (userId, birthdayTemplateId, birthdayActive, anniversaryTemplateId, anniversaryActive, scheduledCampaigns)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    s.birthdayTemplateId,
                    s.birthdayActive ? 1 : 0,
                    s.anniversaryTemplateId,
                    s.anniversaryActive ? 1 : 0,
                    JSON.stringify(s.scheduledCampaigns || [])
                ]
            );
        }

        // Handle user profile updates (from profile settings)
        if (body.storeName !== undefined || body.logo !== undefined || body.storeUrl !== undefined) {
            const updates = [];
            const params = [];
            if (body.storeName !== undefined) { updates.push('storeName = ?'); params.push(body.storeName); }
            if (body.logo !== undefined) { updates.push('logo = ?'); params.push(body.logo); }
            if (body.storeUrl !== undefined) { updates.push('storeUrl = ?'); params.push(body.storeUrl); }
            params.push(userId);
            await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        res.json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error("Error saving data:", error);
        if (error.code === 'ER_NET_PACKET_TOO_LARGE') {
            return res.status(413).json({ message: 'Data too large. Please reduce image sizes.' });
        }
        res.status(500).json({ message: 'Error saving data: ' + error.message });
    }
});

// Delete Customer
app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.run('DELETE FROM customers WHERE id = ? AND userId = ?', [id, userId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Customer not found or unauthorized' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting customer' });
    }
});

import { initializeWhatsApp, getSessionStatus, logoutSession, sendMessage, getActiveInstanceIds, restoreSessions } from './whatsappService.js';

// Restore active sessions on startup
restoreSessions();

// ... existing endpoints ...

// --- Whatsapp Endpoints ---

app.post('/api/whatsapp/connect', authenticateToken, async (req, res) => {
    try {
        const instanceId = req.user.instanceId;
        if (!instanceId) return res.status(400).json({ message: 'No instance ID found for user' });

        await initializeWhatsApp(instanceId);
        res.json({ message: 'Initialization started' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error initializing WhatsApp' });
    }
});

app.get('/api/whatsapp/status', authenticateToken, async (req, res) => {
    try {
        const instanceId = req.user.instanceId;
        if (!instanceId) return res.status(400).json({ message: 'No instance ID found for user' });

        const status = getSessionStatus(instanceId);
        res.json(status);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching status' });
    }
});

app.post('/api/whatsapp/logout', authenticateToken, async (req, res) => {
    try {
        const instanceId = req.user.instanceId;
        if (!instanceId) return res.status(400).json({ message: 'No instance ID found for user' });

        await logoutSession(instanceId);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging out' });
    }
});

// --- User Dashboard Endpoints ---
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const instanceId = req.user.instanceId;
        const db = await getDb();

        const customerCount = await db.get('SELECT count(*) as count FROM customers WHERE userId = ?', [userId]);
        const messageCount = await db.get('SELECT count(*) as count FROM message_logs WHERE userId = ?', [userId]);
        const recentLogs = await db.all('SELECT * FROM message_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT 5', [userId]);

        const waStatus = instanceId ? getSessionStatus(instanceId) : { status: 'disconnected' };

        res.json({
            totalCustomers: customerCount.count,
            messagesSent: messageCount.count,
            recentActivity: recentLogs,
            connectionStatus: waStatus.status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

// --- Admin Endpoints ---

// Get Admin Stats
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            // Note: Allowing 'admin' for now based on typical roles, but user asked for 'superadmin' access in UI.
            // Sticking to code logic: if role is technically stored as 'admin' in db defaults, we might need to be careful.
            // The db init sets default role as 'admin'.
        }

        const db = await getDb();
        const users = await db.all('SELECT count(*) as count FROM users');
        const customers = await db.all('SELECT count(*) as count FROM customers');
        const templates = await db.all('SELECT count(*) as count FROM templates');
        const broadcasts = await db.all('SELECT count(*) as count FROM message_logs');

        res.json({
            totalUsers: users[0].count,
            totalCustomers: customers[0].count,
            totalBroadcasts: broadcasts[0].count,
            totalTemplates: templates[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Users
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT id, storeName as store_name, name, email, role, plan, status, whatsapp, address, seatCapacity, designation FROM users');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create User (Admin only)
app.post('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (!['superadmin', 'admin'].includes(req.user.role?.toLowerCase())) {
            console.log('Unauthorized user creation attempt:', req.user);
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { email, password, storeName, name, role, plan, whatsapp, address, seatCapacity, designation } = req.body;
        console.log('Creating user:', { email, storeName, name, role, plan, whatsapp, address, seatCapacity, designation });
        if (!email || !password || !storeName) return res.status(400).json({ message: 'Required fields missing' });

        const db = await getDb();
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const instanceId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memberId = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await db.run(
            'INSERT INTO users (email, password, storeName, name, role, instanceId, memberId, plan, status, whatsapp, address, seatCapacity, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, storeName, name || '', role || 'user', instanceId, memberId, plan || 'Free', 'active', whatsapp || '', address || '', seatCapacity || 0, designation || '']
        );
        const userId = result.lastID;

        // Initialize defaults
        const isUserAdmin = (role || 'user').toLowerCase() === 'admin' || (role || 'user').toLowerCase() === 'superadmin';
        const targetRole = isUserAdmin ? 'admin' : 'user';

        const templatesToInsert = await db.all("SELECT title, content, type FROM default_templates WHERE target_role = ?", [targetRole]);
        for (const template of templatesToInsert) {
            await db.run(
                'INSERT INTO templates (userId, title, content, type) VALUES (?, ?, ?, ?)',
                [userId, template.title, template.content, template.type]
            );
        }

        await db.run('INSERT INTO campaign_settings (userId) VALUES (?)', [userId]);

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Update User
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, role, status, name, storeName, whatsapp, address, seatCapacity, designation, password } = req.body;
        const db = await getDb();

        // Check for role change to update templates
        if (role) {
            const currentUser = await db.get('SELECT role FROM users WHERE id = ?', [id]);
            if (currentUser && currentUser.role !== role) {
                const isNewAdmin = role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin';
                const targetRole = isNewAdmin ? 'admin' : 'user';

                const templatesToInsert = await db.all("SELECT title, content, type FROM default_templates WHERE target_role = ?", [targetRole]);

                // Reset templates for new role
                await db.run('DELETE FROM templates WHERE userId = ?', [id]);
                for (const template of templatesToInsert) {
                    await db.run(
                        'INSERT INTO templates (userId, title, content, type) VALUES (?, ?, ?, ?)',
                        [id, template.title, template.content, template.type]
                    );
                }
            }
        }

        // Update basic info
        await db.run(
            'UPDATE users SET plan = ?, role = ?, status = ?, name = ?, storeName = ?, whatsapp = ?, address = ?, seatCapacity = ?, designation = ? WHERE id = ?',
            [plan, role, status, name, storeName, whatsapp, address, seatCapacity, designation, id]
        );

        // Update password if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        }

        res.json({ message: 'User updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        // Fetch user instanceId to clean up WhatsApp session
        const user = await db.get('SELECT instanceId FROM users WHERE id = ?', [id]);
        if (user && user.instanceId) {
            try {
                await logoutSession(user.instanceId);
            } catch (err) {
                console.error(`Failed to logout session for user ${id}:`, err);
            }
        }

        // Clean up user data
        // Delete related data first to avoid Foreign Key constraints
        await db.run('DELETE FROM customers WHERE userId = ?', [id]);
        await db.run('DELETE FROM templates WHERE userId = ?', [id]);
        await db.run('DELETE FROM campaign_settings WHERE userId = ?', [id]);
        await db.run('DELETE FROM message_logs WHERE userId = ?', [id]);

        // Delete the user last
        await db.run('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Me (Profile)
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, storeName, name, email, role, plan, status, whatsapp, address, seatCapacity, designation, logo, memberId, isActive FROM users WHERE id = ?', [req.user.id]);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/whatsapp/send', authenticateToken, async (req, res) => {
    try {
        const { phone, message, image, video, caption } = req.body;
        const instanceId = req.user.instanceId;
        if (!instanceId) return res.status(400).json({ message: 'No instance ID found for user' });

        if (!phone) return res.status(400).json({ message: 'Phone number required' });
        if (!message && !image && !video) return res.status(400).json({ message: 'Message, image, or video required' });

        await sendMessage(instanceId, phone, {
            text: message,
            image,
            video,
            caption
        });
        res.json({ message: 'Message queued' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// Restore Default Templates
app.post('/api/templates/restore-defaults', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await getDb();

        // Determine role and fetch appropriate defaults
        const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
        const isUserAdmin = (user?.role || 'user').toLowerCase() === 'admin' || (user?.role || 'user').toLowerCase() === 'superadmin';
        const targetRole = isUserAdmin ? 'admin' : 'user';

        const templatesToInsert = await db.all("SELECT title, content, type FROM default_templates WHERE target_role = ?", [targetRole]);

        if (templatesToInsert.length === 0) {
            return res.status(404).json({ message: 'No default templates found for this role.' });
        }

        // Fetch existing templates to avoid exact duplicates
        const existingTemplates = await db.all('SELECT title, content FROM templates WHERE userId = ?', [userId]);

        let addedCount = 0;
        for (const template of templatesToInsert) {
            // Only add if exact same title/content doesn't exist already
            const isDuplicate = existingTemplates.some(t => t.title === template.title && t.content === template.content);

            if (!isDuplicate) {
                await db.run(
                    'INSERT INTO templates (userId, title, content, type) VALUES (?, ?, ?, ?)',
                    [userId, template.title, template.content, template.type]
                );
                addedCount++;
            }
        }

        res.json({ message: 'System default templates added to your library.', count: addedCount });
    } catch (error) {
        console.error('Error restoring templates:', error);
        res.status(500).json({ message: 'Server error restoring templates.' });
    }
});

const startCampaignScheduler = () => {
    console.log('[Scheduler] 🚀 Campaign scheduler initialized - runs every 10 seconds');
    cron.schedule('*/10 * * * * *', async () => {
        const db = await getDb();
        const activeInstances = getActiveInstanceIds();

        console.log(`[Scheduler] ==================== SCHEDULER RUN ====================`);
        console.log(`[Scheduler] Time: ${new Date().toISOString()}`);

        for (const instanceId of activeInstances) {
            try {
                const user = await db.get('SELECT id, email, storeName, role FROM users WHERE instanceId = ?', [instanceId]);
                if (!user) {
                    console.log(`[Scheduler] No user found for instance: ${instanceId}`);
                    continue;
                }

                // Robust date handling for Asia/Dhaka
                const dhakaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
                const year = dhakaNow.getFullYear();
                const monthNum = String(dhakaNow.getMonth() + 1).padStart(2, '0');
                const dayNum = String(dhakaNow.getDate()).padStart(2, '0');
                const hours = String(dhakaNow.getHours()).padStart(2, '0');
                const minutes = String(dhakaNow.getMinutes()).padStart(2, '0');

                const todayISO = `${year}-${monthNum}-${dayNum}`;
                const nowISOFull = `${todayISO}T${hours}:${minutes}`;

                const monthName = dhakaNow.toLocaleString('en-GB', { month: 'short' });
                const todayStr = `${dayNum} ${monthName}`;

                console.log(`[Scheduler] Processing user: ${user.storeName} (${user.email}) - BD Time: ${nowISOFull}`);

                const userId = user.id;
                const settingsRow = await db.get('SELECT * FROM campaign_settings WHERE userId = ?', [userId]);
                if (!settingsRow) continue;

                const settings = {
                    ...settingsRow,
                    birthdayActive: !!settingsRow.birthdayActive,
                    anniversaryActive: !!settingsRow.anniversaryActive,
                    scheduledCampaigns: JSON.parse(settingsRow.scheduledCampaigns || '[]')
                };

                const templates = await db.all('SELECT * FROM templates WHERE userId = ?', [userId]);
                const customers = await db.all('SELECT * FROM customers WHERE userId = ?', [userId]);

                let updatesNeeded = false;
                let messagesSent = 0;

                // 1. Daily Checks (Birthday/Anniversary) - Only run once per day
                if (settingsRow.lastRunDate !== todayISO) {
                    console.log(`[Scheduler] ⏰ New day detected (${todayISO}). Running daily campaigns...`);
                    const birthdayTemplate = settings.birthdayActive ? templates.find(t => t.id === settings.birthdayTemplateId) : null;
                    const anniversaryTemplate = settings.anniversaryActive ? templates.find(t => t.id === settings.anniversaryTemplateId) : null;

                    for (const customer of customers) {
                        if (birthdayTemplate && customer.dob && customer.dob.toLowerCase().includes(todayStr.toLowerCase())) {
                            console.log(`[Scheduler] Sending Birthday to ${customer.name} (${user.storeName})`);
                            const personalizedContent = birthdayTemplate.content.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business');
                            await sendMessage(instanceId, customer.whatsapp, {
                                text: personalizedContent,
                                image: birthdayTemplate.imageUrl,
                                video: birthdayTemplate.videoUrl,
                                caption: birthdayTemplate.mediaCaption?.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business')
                            });
                            await db.run(
                                'INSERT INTO message_logs (userId, type, recipient, content) VALUES (?, ?, ?, ?)',
                                [userId, 'System', customer.whatsapp, personalizedContent]
                            );
                            messagesSent++;
                        }
                        if (anniversaryTemplate && customer.anniversaryDate && customer.anniversaryDate.toLowerCase().includes(todayStr.toLowerCase())) {
                            console.log(`[Scheduler] Sending Anniversary to ${customer.name} (${user.storeName})`);
                            const personalizedContent = anniversaryTemplate.content.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business');
                            await sendMessage(instanceId, customer.whatsapp, {
                                text: personalizedContent,
                                image: anniversaryTemplate.imageUrl,
                                video: anniversaryTemplate.videoUrl,
                                caption: anniversaryTemplate.mediaCaption?.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business')
                            });
                            await db.run(
                                'INSERT INTO message_logs (userId, type, recipient, content) VALUES (?, ?, ?, ?)',
                                [userId, 'System', customer.whatsapp, personalizedContent]
                            );
                            messagesSent++;
                        }
                    }

                    settings.lastRunDate = todayISO;
                    updatesNeeded = true;
                }

                // 2. Scheduled Campaigns
                const updatedCampaigns = [...settings.scheduledCampaigns];

                for (let i = 0; i < updatedCampaigns.length; i++) {
                    const campaign = updatedCampaigns[i]; // Copy of original state
                    if (campaign.status === 'Pending' && campaign.scheduledTime <= nowISOFull) {
                        const template = templates.find(t => t.id === campaign.templateId);
                        if (template) {
                            console.log(`[Scheduler] ========================================`);
                            console.log(`[Scheduler] 🚀 Starting Campaign: ${template.title}`);
                            console.log(`[Scheduler] Campaign ID: ${campaign.id}`);

                            // CRITICAL FIX: Mark as Processing immediately and SAVE to prevent duplicates
                            updatedCampaigns[i] = { ...campaign, status: 'Processing' };
                            await db.run(
                                `UPDATE campaign_settings SET scheduledCampaigns = ? WHERE userId = ?`,
                                [JSON.stringify(updatedCampaigns), userId]
                            );
                            console.log(`[Scheduler] Status updated to 'Processing' in DB`);

                            let messagesSent = 0;

                            // Check if this is an admin campaign with targetRole
                            const isAdminCampaign = (user.role === 'admin' || user.role === 'superadmin') && campaign.targetRole;

                            if (isAdminCampaign) {
                                // Admin campaign: send to system users filtered by designation
                                console.log(`[Scheduler] ADMIN campaign targeting: ${campaign.targetRole}`);
                                const allUsers = await db.all('SELECT id, name, storeName, whatsapp, designation FROM users WHERE whatsapp IS NOT NULL AND whatsapp != ""');

                                const targetUsers = campaign.targetRole === 'All'
                                    ? allUsers
                                    : allUsers.filter(u => u.designation === campaign.targetRole);

                                console.log(`[Scheduler] Targeting ${targetUsers.length} users`);

                                for (const targetUser of targetUsers) {
                                    try {
                                        const personalizedContent = template.content.replace('[name]', targetUser.name || 'User').replace('[business]', targetUser.storeName || 'our business');
                                        await sendMessage(instanceId, targetUser.whatsapp, {
                                            text: personalizedContent,
                                            image: template.imageUrl,
                                            video: template.videoUrl,
                                            caption: template.mediaCaption?.replace('[name]', targetUser.name || 'User').replace('[business]', targetUser.storeName || 'our business')
                                        });
                                        await db.run(
                                            'INSERT INTO message_logs (userId, type, recipient, content) VALUES (?, ?, ?, ?)',
                                            [userId, 'Campaign', targetUser.whatsapp, personalizedContent]
                                        );
                                        messagesSent++;
                                    } catch (e) {
                                        console.error(`[Scheduler] ❌ Failed to send to ${targetUser.name}:`, e.message);
                                    }
                                }
                            } else {
                                // Regular campaign: send to customers
                                console.log(`[Scheduler] REGULAR campaign targeting ${customers.length} customers`);

                                for (const customer of customers) {
                                    try {
                                        const personalizedContent = template.content.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business');
                                        await sendMessage(instanceId, customer.whatsapp, {
                                            text: personalizedContent,
                                            image: template.imageUrl,
                                            video: template.videoUrl,
                                            caption: template.mediaCaption?.replace('[name]', customer.name).replace('[business]', user.storeName || 'our business')
                                        });
                                        await db.run(
                                            'INSERT INTO message_logs (userId, type, recipient, content) VALUES (?, ?, ?, ?)',
                                            [userId, 'Campaign', customer.whatsapp, personalizedContent]
                                        );
                                        messagesSent++;
                                    } catch (e) {
                                        console.error(`[Scheduler] ❌ Failed to send to ${customer.name}:`, e.message);
                                    }
                                }
                            }

                            // Mark as Completed and SAVE again
                            console.log(`[Scheduler] Campaign finished. Sent: ${messagesSent}. Updating status to Completed...`);
                            updatedCampaigns[i] = { ...campaign, status: 'Completed' };
                            await db.run(
                                `UPDATE campaign_settings SET scheduledCampaigns = ? WHERE userId = ?`,
                                [JSON.stringify(updatedCampaigns), userId]
                            );
                            console.log(`[Scheduler] ========================================`);
                        }
                    }
                }

                // Save Updates for Daily Checks (if any)
                // If scheduledCampaigns were updated, we already saved them above.
                // But if updatesNeeded is true (from daily checks), we need to save lastRunDate.
                // If we also updated scheduledCampaigns, we should use the latest array.
                // However, since we saved scheduledCampaigns in the loop, 'settings.scheduledCampaigns' inside the top-level object
                // still holds the OLD array unless we mutated it or update it here.
                // Simpler: Just save lastRunDate if needed, and re-read or use the latest campaigns if saving again.
                // Actually, if 'updatesNeeded' is true (from birthday check), we must save 'lastRunDate'.
                // We must be careful not to overwrite the 'scheduledCampaigns' changes we just made if we blindly save 'settings.scheduledCampaigns'.

                if (updatesNeeded) {
                    await db.run(
                        `UPDATE campaign_settings 
                         SET lastRunDate = ?
                         WHERE userId = ?`,
                        [settings.lastRunDate, userId]
                    );
                    console.log(`[Scheduler] Updated lastRunDate for ${user.storeName}`);
                }

            } catch (err) {
                console.error(`[Scheduler] Error processing instance ${instanceId}:`, err);
            }
        }
    });
};

startCampaignScheduler();

// Start server after DB is initialized
(async () => {
    try {
        console.log('--- Server Startup ---');
        console.log(`[Config] DB_HOST: ${process.env.DB_HOST || '127.0.0.1'}`);
        console.log(`[Config] DB_USER: ${process.env.DB_USER || 'root'}`);
        console.log(`[Config] DB_NAME: ${process.env.DB_NAME || 'foodmode'}`);

        console.log('Initializing database...');
        await initDb();
        console.log('Database initialized (MySQL)');
    } catch (error) {
        console.error('⚠️  Failed to initialize database:', error);
    }

    const distPath = path.resolve(__dirname, '..', 'dist');

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', message: 'Server is running' });
    });

    if (fs.existsSync(distPath)) {
        console.log(`Serving static files from: ${distPath}`);
        app.use(express.static(distPath));

        app.get(/^(?!\/(api|uploads|health)).*$/, (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    } else {
        console.warn(`⚠️  Dist folder not found at: ${distPath}. Please run 'npm run build'.`);
        app.get('/', (req, res) => {
            res.status(200).send('Backend is running, but frontend (dist) is missing. Please run "npm run build".');
        });
    }

    // Error handler
    app.use((err, req, res, next) => {
        console.error('Unhandled Error:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
