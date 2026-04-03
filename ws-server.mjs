/**
 * Minimal WebSocket broadcast server — Angular 21 Signals Demo
 * ─────────────────────────────────────────────────────────────
 * Run:  node ws-server.mjs
 * Req:  npm install --save-dev ws   (one-time)
 *
 * Behaviours:
 *  • Accepts any number of browser clients
 *  • Broadcasts every inbound message to ALL connected clients
 *  • Stamps messages with serverTimestamp + clientCount
 *  • Sends a heartbeat system message every 10 s (server → client push demo)
 *  • Logs connections / disconnections to stdout
 */

import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 4201);
const HOST = process.env.HOST ?? '0.0.0.0';
const wss  = new WebSocketServer({ host: HOST, port: PORT });

/** @type {Set<import('ws').WebSocket>} */
const clients = new Set();

// ── Helpers ──────────────────────────────────────────────────────────────────

function broadcast(message) {
  const raw = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) client.send(raw);
  }
}

/** Build a server-originated system message */
function systemMsg(text) {
  return {
    type:            'system',
    payload:         { text, clientCount: clients.size },
    timestamp:       new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    clientCount:     clients.size,
  };
}

// ── Connection handler ────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[+] Client connected  | total: ${clients.size}`);

  // Welcome the new client only (unicast)
  ws.send(JSON.stringify(systemMsg(`Welcome! ${clients.size} client(s) online.`)));

  // Announce to everyone else (broadcast)
  if (clients.size > 1) {
    for (const other of clients) {
      if (other !== ws && other.readyState === 1) {
        other.send(JSON.stringify(systemMsg(`A new user joined. ${clients.size} online.`)));
      }
    }
  }

  // ── Inbound message handler ─────────────────────────────────────────────
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Enrich with server metadata, then broadcast to ALL clients
      // (including the sender — so the sender sees their own message echoed back,
      //  which is the standard pattern for correctness with multi-tab scenarios)
      const enriched = {
        ...msg,
        serverTimestamp: new Date().toISOString(),
        clientCount:     clients.size,
      };

      broadcast(enriched);
      console.log(`[→] ${msg.type} from ${msg.payload?.author ?? 'server'}: ${JSON.stringify(msg.payload)}`);
    } catch {
      ws.send(JSON.stringify(systemMsg('Invalid JSON — message ignored.')));
    }
  });

  // ── Disconnect handler ──────────────────────────────────────────────────
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[-] Client left       | total: ${clients.size}`);
    broadcast(systemMsg(`A user disconnected. ${clients.size} client(s) online.`));
  });

  ws.on('error', (err) => console.error('[!] WS error:', err.message));
});

// ── Server-push heartbeat ────────────────────────────────────────────────────
setInterval(() => {
  if (clients.size > 0) {
    broadcast(systemMsg(`Heartbeat — ${clients.size} client(s) connected.`));
  }
}, 10_000);

// ── Notification push — server → client, no client action required ───────────
// Demonstrates pure server-initiated push. NotificationService receives these
// via messagesOfType<NotificationPayload>('notification') and updates its signal.

const MOCK_NOTIFICATIONS = [
  { title: 'Deployment complete',   message: 'v2.4.1 was deployed to production.',          severity: 'success' },
  { title: 'PR review requested',   message: 'Alice requested your review on #142.',        severity: 'info'    },
  { title: 'High memory usage',     message: 'Server RAM at 87% — consider scaling up.',   severity: 'warning' },
  { title: 'Pipeline failed',       message: 'Build #318 failed on the lint step.',         severity: 'error'   },
  { title: 'New team member',       message: 'Carol White joined the Angular 21 project.',  severity: 'info'    },
  { title: 'Task overdue',          message: '"Write component tests" is past its due date.', severity: 'warning' },
  { title: 'Tests passed',          message: 'All 142 unit tests passed successfully.',     severity: 'success' },
];

let notifIndex = 0;

setInterval(() => {
  if (clients.size === 0) return;

  const template  = MOCK_NOTIFICATIONS[notifIndex % MOCK_NOTIFICATIONS.length];
  notifIndex++;

  const notification = {
    type:            'notification',
    payload: {
      id:       `notif-${Date.now()}`,
      title:    template.title,
      message:  template.message,
      severity: template.severity,
    },
    timestamp:       new Date().toISOString(),
    serverTimestamp: new Date().toISOString(),
    clientCount:     clients.size,
  };

  broadcast(notification);
  console.log(`[🔔] notification → ${template.severity}: ${template.title}`);
}, 7_000);

console.log(`✔ WebSocket server running on ws://localhost:${PORT}`);
console.log('  Ctrl+C to stop\n');
