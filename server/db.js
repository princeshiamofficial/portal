import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

let pool;

const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'foodmode',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

export async function initDb() {
    // 1. Create Database if it doesn't exist
    try {
        const conn = await mysql.createConnection({
            host: DB_CONFIG.host,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
        });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        try {
            await conn.query('SET GLOBAL max_allowed_packet=67108864'); // 64MB
            console.log('Checked/Updated MySQL max_allowed_packet to 64MB');
        } catch (e) {
            console.warn('Warning: Could not set max_allowed_packet (might limit large file uploads):', e.message);
        }

        await conn.end();
    } catch (e) {
        console.error("Error checking/creating database:", e);
        console.error("⚠️  Please ensure XAMPP MySQL is running and the credentials are correct (Default: root, no password).");
    }

    // 2. Initialize Pool
    if (!pool) {
        pool = mysql.createPool(DB_CONFIG);
    }

    const db = await getDb();

    // 3. Create Tables
    // Users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password TEXT,
            storeName TEXT,
            name TEXT,
            role VARCHAR(50) DEFAULT 'admin',
            plan VARCHAR(50) DEFAULT 'Free',
            status VARCHAR(50) DEFAULT 'active',
            instanceId TEXT,
            logo LONGTEXT,
            memberId VARCHAR(50),
            storeUrl TEXT,
            whatsapp VARCHAR(50),
            address TEXT,
            seatCapacity INT,
            designation TEXT,
            isActive TINYINT DEFAULT 1
        )
    `);

    // Migrations for users (try/catch for duplicate column errors)
    try { await db.exec(`ALTER TABLE users ADD COLUMN name TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'admin'`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN instanceId TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN logo LONGTEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN memberId VARCHAR(50)`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN storeUrl TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'Free'`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN whatsapp VARCHAR(50)`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN address TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN seatCapacity INT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN designation TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE users ADD COLUMN isActive TINYINT DEFAULT 1`); } catch (e) { }


    // Backfill memberId
    const usersWithoutMemberId = await db.all('SELECT id FROM users WHERE memberId IS NULL');
    for (const u of usersWithoutMemberId) {
        const memberId = Math.floor(100000 + Math.random() * 900000).toString();
        await db.run('UPDATE users SET memberId = ? WHERE id = ?', [memberId, u.id]);
    }

    // Customers table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT,
            customer_id VARCHAR(50),
            name TEXT,
            occupation TEXT,
            dob VARCHAR(50),
            anniversaryDate VARCHAR(50),
            address TEXT,
            whatsapp VARCHAR(50),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Templates table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT,
            title TEXT,
            content TEXT,
            imageUrl LONGTEXT,
            videoUrl LONGTEXT,
            mediaCaption TEXT,
            type VARCHAR(50),
            deleted TINYINT DEFAULT 0,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    try { await db.exec(`ALTER TABLE templates ADD COLUMN deleted TINYINT DEFAULT 0`); } catch (e) { }
    try { await db.exec(`ALTER TABLE templates MODIFY COLUMN deleted TINYINT DEFAULT 0`); } catch (e) { }

    try { await db.exec(`ALTER TABLE templates ADD COLUMN imageUrl LONGTEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE templates MODIFY COLUMN imageUrl LONGTEXT`); } catch (e) { }

    try { await db.exec(`ALTER TABLE templates ADD COLUMN videoUrl LONGTEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE templates MODIFY COLUMN videoUrl LONGTEXT`); } catch (e) { }

    try { await db.exec(`ALTER TABLE templates ADD COLUMN mediaCaption TEXT`); } catch (e) { }
    try { await db.exec(`ALTER TABLE templates MODIFY COLUMN mediaCaption TEXT`); } catch (e) { }

    // Campaign Settings table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS campaign_settings (
            userId INT PRIMARY KEY,
            birthdayTemplateId INT,
            birthdayActive TINYINT DEFAULT 0,
            anniversaryTemplateId INT,
            anniversaryActive TINYINT DEFAULT 0,
            scheduledCampaigns LONGTEXT,
            lastRunDate VARCHAR(20),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Migration for lastRunDate in campaign_settings
    try { await db.exec(`ALTER TABLE campaign_settings ADD COLUMN lastRunDate VARCHAR(20)`); } catch (e) { }

    // Message Logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS message_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT,
            type VARCHAR(50),
            recipient VARCHAR(50),
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Default Templates Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS default_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title TEXT,
            content TEXT,
            type VARCHAR(50) DEFAULT 'System',
            target_role VARCHAR(20) -- 'admin' or 'user'
        )
    `);

    // Fix Charset for existing tables (to support emojis)
    try {
        await db.exec(`ALTER DATABASE \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE templates CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE campaign_settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE message_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.exec(`ALTER TABLE default_templates CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } catch (e) {
        console.warn("[Migration] Charset conversion warning (can usually be ignored):", e.message);
    }

    // Seed Default Superadmin
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@colorhutbd.com']);
    if (!existingAdmin) {
        console.log('Seeding default superadmin...');
        const hashedPassword = await bcrypt.hash('C0l0rHu7@456', 10);
        await db.run(
            `INSERT INTO users (email, password, storeName, name, role, plan, status, memberId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['admin@colorhutbd.com', hashedPassword, 'FoodMode Admin', 'Super Admin', 'superadmin', 'Pro', 'active', '000001']
        );
    }

    // Seed Default Templates if empty
    const existingDefaults = await db.all('SELECT count(*) as count FROM default_templates');
    if (existingDefaults[0].count === 0) {
        console.log('Seeding default templates...');
        const initialTemplates = [
            // Admin Templates
            { title: "👋 Welcome to Foodmode", content: "Welcome to Foodmode, [name]! 🎊 We are thrilled to have [business] onboard. Your account is now active and ready to use. Login to get started!", role: 'admin' },
            { title: "🚀 Product Update", content: "Hey [name]! 🌟 We've just released some exciting new features for [business]. Login to your dashboard to explore the latest tools and grow your brand!", role: 'admin' },
            { title: "🗓 Subscription Renewal", content: "Hi [name], your subscription for [business] is expiring soon. Continue managing your customer relations seamlessly by renewing today. Tap below to proceed! 💳", role: 'admin' },
            { title: "⭐ Exclusive Pro Offer", content: "Hi [name]! 🎁 Special Offer for [business]! Upgrade to our Pro plan today and get a 20% discount for the next 3 months. Unlock advanced analytics and grow faster!", role: 'admin' },
            { title: "🛠 Service Maintenance", content: "Hi [name], we'll be performing a quick system update tonight at 2 AM. 🕒 Foodmode services for [business] will be briefly unavailable. Thanks for your patience!", role: 'admin' },
            { title: "📄 Invoice Generated", content: "Hello [name]! 📑 Your monthly invoice for [business] has been generated and is now available in your dashboard. Thank you for partnering with Foodmode!", role: 'admin' },
            { title: "📊 Insight Report", content: "Hi [name], your weekly performance report for [business] is ready! 📈 Check out how many new customers you've gained this week in your dashboard.", role: 'admin' },

            // User Templates
            { title: "🎉 Birthday Greeting", content: "Happy Birthday [name]! 🎂 We hope you have a fantastic day. As a special treat, enjoy 15% OFF your next visit at [business]. Show this message at the counter! 🎁", role: 'user' },
            { title: "💑 Anniversary Wish", content: "Happy Anniversary [name]! ❤️ Wishing you both a lifetime of happiness. Celebrate your special day with a complimentary dessert on us at [business]! 🥂", role: 'user' },
            { title: "🚀 Monthly Promotion", content: "Hey [name]! 🌟 New month, new treats at [business]! Visit us this week and get a 'Buy 1 Get 1' deal on all our signature items. Can't wait to see you! 🍔", role: 'user' },
            { title: "⭐ Feedback Request", content: "Hi [name], thank you for visiting [business] recently! 🙏 We'd love to hear about your experience. Reply to this message with your rating (1-5) and get 10% off your next order! 📝", role: 'user' },
            { title: "🛍️ Flash Sale Alert", content: "FLASH SALE! ⚡ Only for today at [business], [name]! Get 30% flat discount on everything in store. Valid until 9 PM tonight. Don't miss out! 🏃‍♂️💨", role: 'user' },
            { title: "👋 Welcome Message", content: "Welcome to [business] VIP family, [name]! 🎊 You're now on the list for exclusive deals and early access to our events. Stay tuned! ✨", role: 'user' },
            { title: "💔 We Miss You", content: "Hi [name], it's been a while! 🥺 We miss seeing you around at [business]. Come visit us this weekend and your first drink is on the house! ☕ See you soon!", role: 'user' }
        ];

        for (const t of initialTemplates) {
            await db.run(
                'INSERT INTO default_templates (title, content, type, target_role) VALUES (?, ?, ?, ?)',
                [t.title, t.content, 'System', t.role]
            );
        }
    }

    console.log('Database initialized (MySQL)');
    return db;
}

export async function getDb() {
    if (!pool) {
        pool = mysql.createPool(DB_CONFIG);
    }

    // Return SQLite-compatible adapter
    return {
        all: async (sql, params) => {
            const [rows] = await pool.execute(sql, params);
            return rows;
        },
        get: async (sql, params) => {
            const [rows] = await pool.execute(sql, params);
            return rows[0];
        },
        run: async (sql, params) => {
            const [result] = await pool.execute(sql, params);
            return { lastID: result.insertId, changes: result.affectedRows };
        },
        exec: async (sql) => {
            await pool.query(sql);
        },
        // Direct access if needed
        pool
    };
}
