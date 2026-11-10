import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

export type RealtimeEventType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_STATUS_UPDATED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_RESULT_UPDATED'
  | 'OFFER_ISSUED'
  | 'OFFER_ACCEPTED'
  | 'JOB_CREATED'
  | 'STUDENT_CONSENT_UPDATED'
  | 'STUDENT_ANONYMIZED';

export interface RealtimeMessage {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

class RealtimeEngine {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[WebSocket] Client connected. Total active: ${this.clients.size}`);

      // Send initial welcome/heartbeat ping
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'TalentHub Real-time Stream Active' }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total active: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WebSocket] Error:', err);
        this.clients.delete(ws);
      });
    });

    console.log('[WebSocket] Realtime engine initialized on /ws');
  }

  broadcast(type: RealtimeEventType, payload: any): void {
    if (!this.wss) return;

    const message: RealtimeMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    const data = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          console.error('[WebSocket] Failed to send to client:', err);
        }
      }
    }
  }
}

export const realtime = new RealtimeEngine();

