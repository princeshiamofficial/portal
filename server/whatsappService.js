import { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
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
const reconnectAttempts = {}; // instanceId -> number
const dailyLimits = {}; // instanceId_YYYY-MM-DD -> count
const queues = {}; // instanceId -> []
const isProcessing = {}; // instanceId -> boolean

export const restoreSessions = async () => {
    if (!fs.existsSync(SESSIONS_DIR)) return;

    const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const instanceId = entry.name;
            console.log(`Restoring session for ${instanceId}...`);
            await initializeWhatsApp(instanceId);
        }
    }
};

export const getActiveInstanceIds = () => {
    return Object.keys(sessions).filter(id => connectionStatus[id] === 'connected');
};

export const initializeWhatsApp = async (instanceId, io) => {
    // Ensure session dir exists
    const sessionPath = path.join(SESSIONS_DIR, instanceId);
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA version: ${version.join('.')}, isLatest: ${isLatest}`);

    const socket = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sessions[instanceId] = socket;
    connectionStatus[instanceId] = 'connecting';

    socket.ev.on('connection.update', async (update) => {
        console.log(`[conn ${instanceId}]`, JSON.stringify(update, (k, v) => {
            if (k === 'qr' && v) return v.substring(0, 50) + '...';
            return v;
        }, 2));

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Generate QR code as data URL
            try {
                qrCodes[instanceId] = await QRCode.toDataURL(qr);
                connectionStatus[instanceId] = 'qr_ready';
                if (io) io.emit('whatsapp-status', { instanceId, status: 'qr_ready', qr: qrCodes[instanceId] });
                console.log(`QR Code generated for ${instanceId}`);
            } catch (err) {
                console.error('Failed to generate QR data URL:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed for ${instanceId}. Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                const attempts = reconnectAttempts[instanceId] || 0;
                if (attempts < 5) { // Limit to 5 attempts
                    reconnectAttempts[instanceId] = attempts + 1;
                    const backoff = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff up to 30s
                    console.log(`Reconnecting ${instanceId} in ${backoff}ms (Attempt ${attempts + 1}/5)...`);
                    setTimeout(() => initializeWhatsApp(instanceId, io), backoff);
                } else {
                    console.error(`Max reconnect attempts reached for ${instanceId}. Giving up.`);
                    connectionStatus[instanceId] = 'disconnected';
                    if (io) io.emit('whatsapp-status', { instanceId, status: 'disconnected', qr: null });
                }
            } else {
                reconnectAttempts[instanceId] = 0;
                // Logged out
                connectionStatus[instanceId] = 'disconnected';
                if (io) io.emit('whatsapp-status', { instanceId, status: 'disconnected', qr: null });
                delete sessions[instanceId];
                delete qrCodes[instanceId];
                // Clean up session files if logged out
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`Close reason: ${statusCode || 'unknown'}, error:`, lastDisconnect?.error);
        } else if (connection === 'open') {
            reconnectAttempts[instanceId] = 0;
            console.log(`Checking WhatsApp Connection for ${instanceId}: Connected`);
            connectionStatus[instanceId] = 'connected';
            delete qrCodes[instanceId];
            if (io) io.emit('whatsapp-status', { instanceId, status: 'connected', qr: null });
        }

        if (update.isOnline === false && !qr && connection !== 'open') {
            console.warn(`Stuck? No QR, not open, isOnline false → possible protocol block`);
        }
    });

    socket.ev.on('creds.update', saveCreds);

    //     socket.ev.on('call', async (calls) => {
    //         for (const call of calls) {
    //             if (call.status === 'offer') {
    //                 try {
    //                     console.log(`Received call from ${call.from}, not rejecting.`);
    //                     // await socket.rejectCall(call.id, call.from);
    //                     // await socket.sendMessage(call.from, { text: 'Sorry, this number cannot receive calls. Please send a message instead.' });
    //                 } catch (err) {
    //                     console.error('Error handling call:', err);
    //                 }
    //             }
    //         }
    //     });

    return socket;
};

export const getSessionStatus = (instanceId) => {
    const socket = sessions[instanceId];
    return {
        status: connectionStatus[instanceId] || 'disconnected',
        qr: qrCodes[instanceId] || null,
        user: (connectionStatus[instanceId] === 'connected' && socket?.user) ? {
            id: socket.user.id,
            name: socket.user.name || socket.user.notify || socket.user.vname || socket.authState?.creds?.me?.name
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

const processQueue = async (instanceId) => {
    if (isProcessing[instanceId]) return;
    if (!queues[instanceId] || queues[instanceId].length === 0) return;

    isProcessing[instanceId] = true;
    while (queues[instanceId].length > 0) {
        const { number, content, resolve, reject } = queues[instanceId].shift();
        try {
            await performSend(instanceId, number, content);
            resolve(true);
        } catch (err) {
            console.error(`[Queue] Send error:`, err);
            reject(err);
        }
        // gap between queue items (Anti-ban logic) (Safety Buffer: 3-5s)
        const gapDelay = Math.floor(Math.random() * 2000) + 3000;
        await new Promise(r => setTimeout(r, gapDelay));
    }
    isProcessing[instanceId] = false;
};

export const sendMessage = (instanceId, number, content) => {
    return new Promise((resolve, reject) => {
        if (!queues[instanceId]) queues[instanceId] = [];
        queues[instanceId].push({ number, content, resolve, reject });
        processQueue(instanceId);
    });
};

const performSend = async (instanceId, number, content) => {
    const socket = sessions[instanceId];
    if (!socket || connectionStatus[instanceId] !== 'connected') {
        throw new Error('Session not connected');
    }

    // Daily limit
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `${instanceId}_${today}`;
    if (!dailyLimits[limitKey]) dailyLimits[limitKey] = 0;
    if (dailyLimits[limitKey] >= 500) {
        throw new Error('Daily message limit reached (500 msgs)');
    }
    dailyLimits[limitKey]++;

    // Number Normalization + Validation
    let formattedNumber = number.replace(/\D/g, '');
    if (formattedNumber.length < 10) throw new Error('Invalid phone number length');
    // Basic Country Prefix logic for BD
    if (formattedNumber.length === 11 && formattedNumber.startsWith('01')) {
        formattedNumber = '88' + formattedNumber;
    }
    const jid = formattedNumber + '@s.whatsapp.net';

    // Verify number exists on WhatsApp
    try {
        const [result] = await socket.onWhatsApp(jid);
        if (!result || !result.exists) {
            throw new Error(`Number ${formattedNumber} is not registered on WhatsApp`);
        }
    } catch (err) {
        throw new Error(`Number ${formattedNumber} is not registered on WhatsApp`);
    }

    // Human-like typing (Anti-ban mechanism)
    try {
        await socket.sendPresenceUpdate('composing', jid);
        const typingDelay = Math.floor(Math.random() * 2000) + 1500;
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        await socket.sendPresenceUpdate('paused', jid);

        if (typeof content === 'string') {
            await socket.sendMessage(jid, { text: content });
        } else {
            const { text, image, video, caption } = content;

            if (image) {
                // Media limit ~5MB
                let mime = 'image/jpeg';
                const imageBuffer = image.startsWith('data:')
                    ? Buffer.from(image.split(',')[1], 'base64')
                    : null;
                if (image.startsWith('data:')) {
                    mime = image.split(';')[0].split(':')[1];
                }
                if (imageBuffer && imageBuffer.length > 5 * 1024 * 1024) throw new Error('Image exceeds 5MB limit');

                const imageContent = imageBuffer || { url: image };

                await socket.sendMessage(jid, {
                    image: imageContent,
                    mimetype: mime,
                    caption: caption || text
                });
            } else if (video) {
                // Media limit ~16MB
                let mime = 'video/mp4';
                const videoBuffer = video.startsWith('data:')
                    ? Buffer.from(video.split(',')[1], 'base64')
                    : null;
                if (video.startsWith('data:')) {
                    mime = video.split(';')[0].split(':')[1];
                }
                if (videoBuffer && videoBuffer.length > 16 * 1024 * 1024) throw new Error('Video exceeds 16MB limit');

                const videoContent = videoBuffer || { url: video };

                await socket.sendMessage(jid, {
                    video: videoContent,
                    mimetype: mime,
                    caption: caption || text
                });
            } else {
                await socket.sendMessage(jid, { text: text || '' });
            }
        }
    } catch (error) {
        throw new Error(`Send Error for ${formattedNumber}: ${error.message}`);
    }
};
