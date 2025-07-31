// Multiplayer Client Manager
import { 
  ClientConfig, 
  PlayerConfig, 
  RoomConfig, 
  NetworkMessage, 
  MessageType, 
  MultiplayerMode, 
  NetworkProtocol, 
  ConnectionState,
  PlayerType,
  GameAction 
} from './multiplayer.types';
import { CardProperties } from '../card/card.types';
import { GameSession } from '../card/deck.manager';

export class MultiplayerClient {
  private config: ClientConfig;
  private connection: WebSocket | RTCPeerConnection | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private currentRoom: RoomConfig | null = null;
  private players: Map<string, PlayerConfig> = new Map();
  private messageQueue: NetworkMessage[] = [];
  private sequenceNumber: number = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: ClientConfig) {
    this.config = config;
    this.setupEventHandlers();
  }

  // =========================================================================
  // CONNECTION MANAGEMENT
  // =========================================================================

  async connect(serverUrl?: string): Promise<void> {
    const url = serverUrl || this.config.serverUrl;
    if (!url) throw new Error('Server URL not provided');

    this.connectionState = ConnectionState.CONNECTING;
    this.emit('connectionStateChanged', this.connectionState);

    try {
      switch (this.config.networkProtocol) {
        case NetworkProtocol.WEBSOCKET:
          await this.connectWebSocket(url);
          break;
        case NetworkProtocol.WEBRTC:
          await this.connectWebRTC(url);
          break;
        case NetworkProtocol.SOCKET_IO:
          await this.connectSocketIO(url);
          break;
      }

      this.connectionState = ConnectionState.CONNECTED;
      this.startHeartbeat();
      this.emit('connected');
      
    } catch (error) {
      this.connectionState = ConnectionState.ERROR;
      this.emit('connectionError', error);
      throw error;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnectTimer();
    
    if (this.connection) {
      if (this.connection instanceof WebSocket) {
        this.connection.close();
      } else if (this.connection instanceof RTCPeerConnection) {
        this.connection.close();
      }
      this.connection = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    this.emit('disconnected');
  }

  private async connectWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        this.connection = ws;
        this.setupWebSocketHandlers(ws);
        resolve();
      };
      
      ws.onerror = (error) => reject(error);
    });
  }

  private async connectWebRTC(signalingUrl: string): Promise<void> {
    // WebRTC implementation would go here
    // This is a simplified version - real implementation would need signaling server
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    this.connection = pc;
    // Additional WebRTC setup...
  }

  private async connectSocketIO(url: string): Promise<void> {
    // Socket.IO implementation would go here
    throw new Error('Socket.IO not implemented yet');
  }

  // =========================================================================
  // ROOM MANAGEMENT
  // =========================================================================

  async createRoom(roomConfig: Partial<RoomConfig>): Promise<RoomConfig> {
    const message: NetworkMessage = {
      type: MessageType.JOIN_ROOM,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: '',
      sequenceNumber: this.getNextSequenceNumber(),
      data: {
        action: 'create',
        roomConfig: {
          name: roomConfig.name || `${this.config.playerName}'s Room`,
          gameType: roomConfig.gameType || 'poker',
          maxPlayers: roomConfig.maxPlayers || 4,
          isPrivate: roomConfig.isPrivate || false,
          hostId: this.config.playerId,
          ...roomConfig
        }
      }
    };

    return this.sendMessage(message);
  }

  async joinRoom(roomId: string, password?: string): Promise<void> {
    const message: NetworkMessage = {
      type: MessageType.JOIN_ROOM,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: roomId,
      sequenceNumber: this.getNextSequenceNumber(),
      data: {
        action: 'join',
        roomId,
        password,
        playerInfo: {
          id: this.config.playerId,
          name: this.config.playerName,
          type: PlayerType.HUMAN_REMOTE,
          avatar: this.config.playerAvatar,
          connectionState: ConnectionState.CONNECTED
        }
      }
    };

    await this.sendMessage(message);
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    const message: NetworkMessage = {
      type: MessageType.LEAVE_ROOM,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: { playerId: this.config.playerId }
    };

    await this.sendMessage(message);
    this.currentRoom = null;
    this.players.clear();
  }

  // =========================================================================
  // GAME ACTIONS
  // =========================================================================

  async playCard(card: CardProperties): Promise<void> {
    if (!this.currentRoom) throw new Error('Not in a room');

    const action: GameAction = {
      type: 'PLAY_CARD',
      playerId: this.config.playerId,
      timestamp: Date.now(),
      data: { card }
    };

    const message: NetworkMessage = {
      type: MessageType.PLAYER_ACTION,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: action
    };

    await this.sendMessage(message);
  }

  async drawCard(): Promise<void> {
    if (!this.currentRoom) throw new Error('Not in a room');

    const action: GameAction = {
      type: 'DRAW_CARD',
      playerId: this.config.playerId,
      timestamp: Date.now(),
      data: {}
    };

    const message: NetworkMessage = {
      type: MessageType.PLAYER_ACTION,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: action
    };

    await this.sendMessage(message);
  }

  async endTurn(): Promise<void> {
    if (!this.currentRoom) throw new Error('Not in a room');

    const message: NetworkMessage = {
      type: MessageType.TURN_END,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: { playerId: this.config.playerId }
    };

    await this.sendMessage(message);
  }

  // =========================================================================
  // COMMUNICATION
  // =========================================================================

  async sendChatMessage(message: string, recipientId?: string): Promise<void> {
    if (!this.currentRoom || !this.config.chatEnabled) return;

    const chatMessage: NetworkMessage = {
      type: MessageType.CHAT_MESSAGE,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      recipientId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: {
        message,
        senderName: this.config.playerName
      }
    };

    await this.sendMessage(chatMessage);
  }

  async sendEmote(emoteType: string): Promise<void> {
    if (!this.currentRoom) return;

    const emoteMessage: NetworkMessage = {
      type: MessageType.EMOTE,
      timestamp: Date.now(),
      senderId: this.config.playerId,
      gameId: this.currentRoom.id,
      sequenceNumber: this.getNextSequenceNumber(),
      data: {
        emoteType,
        senderName: this.config.playerName
      }
    };

    await this.sendMessage(emoteMessage);
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  private async sendMessage(message: NetworkMessage): Promise<any> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      this.messageQueue.push(message);
      throw new Error('Not connected to server');
    }

    if (this.connection instanceof WebSocket) {
      this.connection.send(JSON.stringify(message));
    }

    // Return promise that resolves when response is received
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 5000);

      const handler = (response: any) => {
        if (response.sequenceNumber === message.sequenceNumber) {
          clearTimeout(timeout);
          resolve(response.data);
        }
      };

      this.once('messageResponse', handler);
    });
  }

  private setupWebSocketHandlers(ws: WebSocket): void {
    ws.onmessage = (event) => {
      try {
        const message: NetworkMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    ws.onclose = () => {
      this.handleDisconnection();
    };

    ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private handleMessage(message: NetworkMessage): void {
    switch (message.type) {
      case MessageType.ROOM_UPDATE:
        this.handleRoomUpdate(message.data);
        break;
      case MessageType.PLAYER_JOINED:
        this.handlePlayerJoined(message.data);
        break;
      case MessageType.PLAYER_LEFT:
        this.handlePlayerLeft(message.data);
        break;
      case MessageType.GAME_STATE_SYNC:
        this.handleGameStateSync(message.data);
        break;
      case MessageType.CHAT_MESSAGE:
        this.emit('chatMessage', message.data);
        break;
      case MessageType.EMOTE:
        this.emit('emote', message.data);
        break;
      case MessageType.ERROR:
        this.emit('error', message.data);
        break;
    }

    this.emit('messageReceived', message);
  }

  private handleRoomUpdate(data: any): void {
    this.currentRoom = data.room;
    this.emit('roomUpdated', this.currentRoom);
  }

  private handlePlayerJoined(data: any): void {
    const player: PlayerConfig = data.player;
    this.players.set(player.id, player);
    this.emit('playerJoined', player);
  }

  private handlePlayerLeft(data: any): void {
    const playerId = data.playerId;
    this.players.delete(playerId);
    this.emit('playerLeft', playerId);
  }

  private handleGameStateSync(data: any): void {
    this.emit('gameStateSync', data);
  }

  private handleDisconnection(): void {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.emit('disconnected');
    
    if (this.config.reconnectAttempts > 0) {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    let attempts = 0;
    
    this.reconnectTimer = setInterval(async () => {
      if (attempts >= this.config.reconnectAttempts) {
        this.stopReconnectTimer();
        this.emit('reconnectFailed');
        return;
      }

      attempts++;
      this.connectionState = ConnectionState.RECONNECTING;
      this.emit('connectionStateChanged', this.connectionState);

      try {
        await this.connect();
        this.stopReconnectTimer();
        
        // Rejoin room if we were in one
        if (this.currentRoom) {
          await this.joinRoom(this.currentRoom.id);
        }
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift()!;
          await this.sendMessage(message);
        }
        
      } catch (error) {
        console.error(`Reconnect attempt ${attempts} failed:`, error);
      }
    }, 3000); // Try every 3 seconds
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        const heartbeat: NetworkMessage = {
          type: MessageType.HEARTBEAT,
          timestamp: Date.now(),
          senderId: this.config.playerId,
          gameId: this.currentRoom?.id || '',
          sequenceNumber: this.getNextSequenceNumber(),
          data: {}
        };
        
        this.sendMessage(heartbeat).catch(() => {
          // Heartbeat failed, connection might be lost
          this.handleDisconnection();
        });
      }
    }, this.config.heartbeatInterval * 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private getNextSequenceNumber(): number {
    return ++this.sequenceNumber;
  }

  private setupEventHandlers(): void {
    // Initialize event handler map
    this.eventHandlers = new Map();
  }

  // Event system
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  once(event: string, handler: Function): void {
    const wrappedHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // Getters
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getCurrentRoom(): RoomConfig | null {
    return this.currentRoom;
  }

  getPlayers(): PlayerConfig[] {
    return Array.from(this.players.values());
  }

  getConfig(): ClientConfig {
    return { ...this.config };
  }

  // Config updates
  updateConfig(updates: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
