# Customer Relations Hub

A multi-tenant customer relationship management system with WhatsApp integration and automated campaigns.

## Features

- **Multi-tenancy**: Isolated data and WhatsApp sessions for each tenant.
- **WhatsApp Integration**: Connect your WhatsApp account to send broadcast messages and automated greetings.
- **Automated Campaigns**: Send birthday and anniversary wishes automatically.
- **Dashboard**: Track your customers, messages sent, and connection status.
- **Admin Panel**: Manage users, plans, and system templates.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (via Lucide/Custom styles), React Router.
- **Backend**: Express, MySQL (XAMPP compatible).
- **Communication**: @whiskeysockets/baileys for WhatsApp Web API.

## Setup

1. **Prerequisites**:
   - Node.js (v18+)
   - MySQL (e.g., XAMPP)

2. **Installation**:
   ```bash
   npm install
   ```

3. **Database**:
   - Start MySQL.
   - The application will automatically create the `foodmode` database and required tables on first run.
   - Default credentials are `host: 127.0.0.1`, `user: root`, `password: ""`.

4. **Running the App**:
   - Backend: `node server/index.js`
   - Frontend: `npm run dev`

5. **Production**:
   - Build: `npm run build`
   - Run server: `node server/index.js` (serves the `dist` folder)

## Deployment

For detailed instructions on hosting this application on **CyberPanel**, see [DEPLOYMENT_CYBERPANEL.md](./DEPLOYMENT_CYBERPANEL.md).

## License
MIT
