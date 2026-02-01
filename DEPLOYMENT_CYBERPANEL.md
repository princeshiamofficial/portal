# Deploying Foodmode to CyberPanel

This guide provides step-by-step instructions for hosting the **Foodmode Customer Relations Hub** on a server running **CyberPanel** (OpenLiteSpeed).

---

## 1. Prerequisites
- A server with **CyberPanel** installed.
- **Node.js** installed on the server (v18 or higher recommended).
- A domain/subdomain pointed to your server IP.

---

## 2. Create the Website in CyberPanel
1. Log in to your CyberPanel dashboard.
2. Navigate to **Websites** > **Create Website**.
3. Select its Package, Owner, and enter your **Domain Name**.
4. Set **PHP version** to any (Node treats this differently, but select a stable one like 7.4/8.1 for compatibility).
5. Check **SSL** and **OpenLiteSpeed** options.
6. Click **Create Website**.

---

## 3. Setup the Database
1. Go to **Databases** > **Create Database**.
2. Select your domain.
3. Enter Database Name: `foodmode`.
4. Enter Username and a strong Password.
5. **Note these credentials** for the next step.

---

## 4. Upload and Prepare the Code
You can use the File Manager or Git.

### Using Git (Recommended)
1. In CyberPanel, go to **Websites** > **List Websites** > **Manage** (for your domain).
2. Click on **Git Repo** (if you have the official plugin) or use the terminal.
3. If using terminal:
   ```bash
   cd /home/yourdomain.com/public_html
   git clone https://github.com/princeshiamofficial/portal.git .
   ```

### Using File Manager
1. Upload the zip of the project.
2. Extract it into `/home/yourdomain.com/public_html`.

---

## 5. Install Dependencies and Build
1. Open the **Terminal** in your domain's management page or SSH into the server.
2. Navigate to the project root:
   ```bash
   cd /home/yourdomain.com/public_html
   ```
3. Install packages:
   ```bash
   npm install
   ```
4. Build the frontend:
   ```bash
   npm run build
   ```
   *This creates the `dist` folder which the server will serve.*

---

## 6. Configure Environment Variables
1. Create a `.env` file in the root directory:
   ```bash
   nano .env
   ```
2. Add the following content (update with your database credentials):
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=foodmode
   JWT_SECRET=your_random_secure_secret_key
   ```
3. Save and exit (CTRL+O, ENTER, CTRL+X).

---

## 7. Setup the Node.js Application
CyberPanel uses **Phusion Passenger** to run Node.js apps.

1. Go to **Websites** > **List Websites** > **Manage**.
2. Click on **Setup Node.js App** (or use the **App Setup** section).
3. **Application Root**: `/home/yourdomain.com/public_html`
4. **Application URL**: `yourdomain.com`
5. **Application Startup File**: `server/index.js`
6. Click **Create**.

### Alternative: Using Reverse Proxy (Recommended for performance)
If the Node.js App selector is not available:
1. Start your app using **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name foodmode
   pm2 save
   pm2 startup
   ```
2. In CyberPanel, go to **Websites** > **Manage** > **Rewrite Rules**.
3. Add a proxy rule to forward traffic to port 3000:
   ```
   REWRITERULE ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
   ```
4. Click **Save Rewrite Rules**.

---

## 8. Final Checks
1. **Permissions**: Ensure user `lsuser:lsgroup` (or similar) owns the files.
   ```bash
   chown -R youruser:youruser /home/yourdomain.com/public_html
   ```
2. **Logs**: Check for errors if the site doesn't load.
   ```bash
   pm2 logs foodmode
   ```
3. **SSL**: Ensure you have issued the SSL via CyberPanel to enable HTTPS.

---

## Troubleshooting
- **Database Connection**: Ensure the MySQL service is running in CyberPanel's **Service Status**.
- **Port Conflict**: If port 3000 is used, change the `PORT` in `.env` and update the proxy rule.
- **Node Version**: If `npm install` fails, check `node -v`. Use `nvm` to upgrade if necessary.
