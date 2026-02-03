# CyberPanel Deployment Guide: FoodMode Portal

This guide outlines the steps to deploy the application on a CyberPanel server with OpenLiteSpeed.

### 1. CyberPanel Initial Setup
1.  **Create Website:** Go to *Websites > Create Website*.
2.  **Create Database:** Go to *Databases > Create Database*. Save your **DB Name**, **User**, and **Password**.
3.  **Setup Node.js App:** Go to *Websites > List Websites > Manage > Setup Node.js App*.
    *   **App Port:** `3000` (Or match your environment configuration).
    *   **App Startup File:** `server/index.js`.

### 2. Code & Build (SSH)
Connect to your server via SSH and navigate to your website root:
```bash
cd /home/yourdomain.com/public_html
git clone https://github.com/princeshiamofficial/portal.git .
npm install
npm run build
```

### 3. Database Configuration
1.  **Environment Variables:** Create a `.env` file in your root folder:
    ```env
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    JWT_SECRET=your_secure_random_string
    ```
2.  **Fix Media Limits (phpMyAdmin):** 
    Run this SQL in phpMyAdmin to allow large image/video templates:
    ```sql
    ALTER TABLE templates MODIFY COLUMN imageUrl LONGTEXT;
    ALTER TABLE templates MODIFY COLUMN videoUrl LONGTEXT;
    ALTER TABLE templates MODIFY COLUMN mediaCaption LONGTEXT;
    ```

### 4. MySQL Server Configuration (CRITICAL)
To prevent "Data too long" errors for media templates, you must increase the MySQL packet size.
1.  Open config: `nano /etc/my.cnf`
2.  Add to the bottom:
    ```ini
    [mysqld]
    max_allowed_packet = 128M
    ```
3.  Restart: `systemctl restart mariadb`

### 5. Process Management (PM2)
Ensure your backend stays online even after crashes or reboots:
```bash
npm install -g pm2
pm2 start server/index.js --name "foodmode-backend"
pm2 save
pm2 startup
```

### 6. Web Server Upload Limits
Go to **Website Manage > vHost Conf** and add this to handle large media uploads:
```nginx
lsapi_max_request_body_size 100M
```
*Restart OpenLiteSpeed after saving.*
