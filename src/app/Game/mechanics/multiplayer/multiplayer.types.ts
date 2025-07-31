// Multiplayer System - Client Configuration Types

export enum MultiplayerMode {
  LOCAL = 'local',           // Same device, hot-seat style
  ONLINE = 'online',         // Internet-based multiplayer
  LAN = 'lan',              // Local network multiplayer
  AI = 'ai',                // Play against AI opponents
  HYBRID = 'hybrid'         // Mix of human and AI players
}

export enum NetworkProtocol {
  WEBSOCKET = 'websocket',
  WEBRTC = 'webrtc',
  SOCKET_IO = 'socket_io'
}

export enum PlayerType {
  HUMAN_LOCAL = 'human_local',
  HUMAN_REMOTE = 'human_remote',
  AI_EASY = 'ai_easy',
  AI_MEDIUM = 'ai_medium',
  AI_HARD = 'ai_hard',
  SPECTATOR = 'spectator'
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface PlayerConfig {
  id: string;
  name: string;
  type: PlayerType;
  avatar?: string;
  color?: string;
  isHost?: boolean;
  connectionState: ConnectionState;
  lastSeen?: Date;
  
  // AI-specific settings
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  aiPersonality?: 'aggressive' | 'conservative' | 'balanced';
  
  // Network-specific
  networkId?: string;
  latency?: number;
}

export interface RoomConfig {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  password?: string;
  hostId: string;
  
  // Game settings
  gameRules: GameRuleConfig;
  
  // Room state
  isStarted: boolean;
  allowSpectators: boolean;
  spectatorCount: number;
  
  // Network settings
  region?: string;
  serverEndpoint?: string;
}

export interface GameRuleConfig {
  // Universal settings
  turnTimeLimit?: number;        // seconds per turn
  totalGameTimeLimit?: number;   // total game time limit
  allowReconnect: boolean;
  reconnectTimeLimit: number;    // seconds to reconnect
  
  // Game-specific rules (extensible)
  [key: string]: any;
  
  // Common card game rules
  deckType?: 'standard' | 'with_jokers' | 'uno' | 'custom';
  shuffleCount?: number;
  dealerRotation?: boolean;
  
  // UNO-specific
  drawTwoStacking?: boolean;
  jumpInAllowed?: boolean;
  sevenZeroRule?: boolean;
  
  // Poker-specific
  blinds?: { small: number; big: number };
  buyIn?: number;
  
  // Blackjack-specific
  deckCount?: number;
  dealerHitsSoft17?: boolean;
}

export interface ClientConfig {
  // Connection settings
  multiplayerMode: MultiplayerMode;
  networkProtocol: NetworkProtocol;
  serverUrl?: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
  
  // Player settings
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  preferredColor?: string;
  
  // Game preferences
  autoPlay: boolean;
  showAnimations: boolean;
  soundEnabled: boolean;
  chatEnabled: boolean;
  
  // Performance settings
  maxLatency: number;           // ms - kick if exceeded
  compressionEnabled: boolean;
  batchUpdates: boolean;
  updateFrequency: number;      // updates per second
  
  // Security settings
  encryption: boolean;
  authToken?: string;
  
  // Debug settings
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface NetworkMessage {
  type: MessageType;
  timestamp: number;
  senderId: string;
  recipientId?: string;        // undefined = broadcast
  gameId: string;
  sequenceNumber: number;
  data: any;
  
  // Optional reliability
  requiresAck?: boolean;
  retryCount?: number;
}

export enum MessageType {
  // Connection management
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  RECONNECT = 'reconnect',
  
  // Room management
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_UPDATE = 'room_update',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  
  // Game state
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  GAME_PAUSE = 'game_pause',
  GAME_RESUME = 'game_resume',
  GAME_STATE_SYNC = 'game_state_sync',
  
  // Player actions
  PLAYER_ACTION = 'player_action',
  CARD_PLAY = 'card_play',
  CARD_DRAW = 'card_draw',
  TURN_END = 'turn_end',
  
  // Communication
  CHAT_MESSAGE = 'chat_message',
  EMOTE = 'emote',
  
  // System
  ERROR = 'error',
  ACK = 'ack'
}

export interface GameAction {
  type: string;
  playerId: string;
  timestamp: number;
  data: any;
  
  // Validation
  isValid?: boolean;
  validationErrors?: string[];
}

// Preset configurations for different multiplayer scenarios
export const MULTIPLAYER_PRESETS = {
  LOCAL_HOTSEAT: {
    multiplayerMode: MultiplayerMode.LOCAL,
    maxPlayers: 4,
    turnTimeLimit: 0,           // No time limits for local play
    allowReconnect: false,
    showAnimations: true,
    chatEnabled: false
  },
  
  CASUAL_ONLINE: {
    multiplayerMode: MultiplayerMode.ONLINE,
    networkProtocol: NetworkProtocol.WEBSOCKET,
    maxPlayers: 4,
    turnTimeLimit: 30,
    allowReconnect: true,
    reconnectTimeLimit: 60,
    showAnimations: true,
    chatEnabled: true
  },
  
  COMPETITIVE_ONLINE: {
    multiplayerMode: MultiplayerMode.ONLINE,
    networkProtocol: NetworkProtocol.WEBSOCKET,
    maxPlayers: 6,
    turnTimeLimit: 15,
    allowReconnect: true,
    reconnectTimeLimit: 30,
    showAnimations: false,      // Faster gameplay
    chatEnabled: false,         // Reduce distractions
    maxLatency: 200
  },
  
  AI_PRACTICE: {
    multiplayerMode: MultiplayerMode.AI,
    maxPlayers: 4,
    turnTimeLimit: 0,
    aiDifficulties: ['easy', 'medium', 'hard'],
    showAnimations: true,
    chatEnabled: false
  },
  
  LAN_PARTY: {
    multiplayerMode: MultiplayerMode.LAN,
    networkProtocol: NetworkProtocol.WEBRTC,
    maxPlayers: 8,
    turnTimeLimit: 20,
    allowReconnect: true,
    reconnectTimeLimit: 120,    // More generous for LAN
    showAnimations: true,
    chatEnabled: true,
    maxLatency: 50              // Lower latency expected on LAN
  }
};
