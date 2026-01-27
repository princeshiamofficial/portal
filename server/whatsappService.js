import makeWASocket, { DisconnectReason, useMultiFileAuthState, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSIONS_DIR = path.join(__dirname, 'sessions');

// In-memory storage for active sockets and QR codes
const sessions = {}; // instanceId -> socket
const qrCodes = {}; // instanceId -> qr string
const connectionStatus = {}; // instanceId -> 'connecting' | 'connected' | 'disconnected'

export const initializeWhatsApp = async (instanceId, io) => {
    // Ensure session dir exists
    const sessionPath = path.join(SESSIONS_DIR, instanceId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sessions[instanceId] = socket;
    connectionStatus[instanceId] = 'connecting';

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log('Connection Update:', JSON.stringify(update, null, 2));

        if (qr) {
            // Generate QR code as data URL
            qrCodes[instanceId] = await QRCode.toDataURL(qr);
            connectionStatus[instanceId] = 'qr_ready';
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed for ${instanceId}. Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                initializeWhatsApp(instanceId, io);
            } else {
                // Logged out
                connectionStatus[instanceId] = 'disconnected';
                delete sessions[instanceId];
                delete qrCodes[instanceId];
                // Clean up session files if logged out
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
        } else if (connection === 'open') {
            console.log(`Checking WhatsApp Connection for ${instanceId}: Connected`);
            connectionStatus[instanceId] = 'connected';
            delete qrCodes[instanceId];
        }
    });

    socket.ev.on('creds.update', saveCreds);

    return socket;
};

export const getSessionStatus = (instanceId) => {
    const socket = sessions[instanceId];
    return {
        status: connectionStatus[instanceId] || 'disconnected',
        qr: qrCodes[instanceId] || null,
        user: (connectionStatus[instanceId] === 'connected' && socket?.user) ? {
            id: socket.user.id,
            name: socket.user.name || socket.user.notify || socket.user.vname
        } : undefined
    };
};

export const logoutSession = async (instanceId) => {
    const socket = sessions[instanceId];
    if (socket) {
        await socket.logout();
        delete sessions[instanceId];
        delete qrCodes[instanceId];
        connectionStatus[instanceId] = 'disconnected';
        return true;
    }
    return false;
};

export const sendMessage = async (instanceId, number, message) => {
    const socket = sessions[instanceId];
    if (!socket || connectionStatus[instanceId] !== 'connected') {
        throw new Error('Session not connected');
    }

    // Format number (strip symbols, ensure suffix)
    const formattedNumber = number.replace(/\D/g, '') + '@s.whatsapp.net';

    // Add random delay (ban mitigation)
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    await socket.sendMessage(formattedNumber, { text: message });
};
