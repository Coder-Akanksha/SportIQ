/**
 * AI Vision WebSocket Client
 * Manages low-latency bidirectional real-time video streaming with the Python AI Engine.
 * Sends camera frames at 30 FPS and receives live 3D pose, kinematics, and telemetry metrics.
 */

class AIWebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.messageListeners = new Set();
    this.statusListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 6;
    this.reconnectTimer = null;
    this.desiredActive = false;
  }

  getWebSocketUrl() {
    if (typeof window !== 'undefined') {
      const loc = window.location;
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      // In local dev, direct connection to port 8000 avoids any proxy buffering
      if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
        return `${proto}//${loc.hostname}:8000/ws/stream`;
      }
      return `${proto}//${loc.host}/ws/stream`;
    }
    return 'ws://localhost:8000/ws/stream';
  }

  connect() {
    this.desiredActive = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    this.notifyStatus('connecting');

    try {
      const url = this.getWebSocketUrl();
      console.log(`[AI Vision WebSocket] Connecting to ${url}...`);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[AI Vision WebSocket] Connected to Python AI stream.');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageListeners.forEach((fn) => {
            try {
              fn(data);
            } catch (err) {
              console.error('[AI Vision WebSocket] Listener error:', err);
            }
          });
        } catch (e) {
          console.error('[AI Vision WebSocket] JSON parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[AI Vision WebSocket] Connection error:', err.message || 'Check if Python AI engine (port 8000) is running.');
        this.notifyStatus('error');
      };

      this.ws.onclose = () => {
        console.log('[AI Vision WebSocket] Connection closed.');
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus('disconnected');
        if (this.desiredActive) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[AI Vision WebSocket] Setup failed:', err);
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus('error');
      if (this.desiredActive) {
        this.scheduleReconnect();
      }
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 5000);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected && this.desiredActive) {
          this.connect();
        }
      }, delay);
    }
  }

  sendFrame(imageBase64, sportType = 'basketball', dominantSide = 'right') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        image_base64: imageBase64,
        sport_type: sportType,
        dominant_side: dominantSide,
        render_trajectory: false, // Explicitly disable manual drawing / trajectory trails on screen
        render_hud: false         // React renders its own sleek high-tech HUD
      }));
      return true;
    }
    return false;
  }

  onMessage(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected ? 'connected' : (this.isConnecting ? 'connecting' : 'disconnected'));
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus(status) {
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (e) {
        // ignore
      }
    });
  }

  disconnect() {
    this.desiredActive = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyStatus('disconnected');
  }
}

export const aiWebSocket = new AIWebSocketClient();
export default aiWebSocket;
