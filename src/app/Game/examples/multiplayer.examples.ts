// Example: Multiplayer Card Game Implementation
import { 
  MultiplayerGameSession, 
  MultiplayerClient, 
  createMultiplayerConfig,
  MultiplayerMode,
  NetworkProtocol,
  PlayerType,
  ClientConfig,
  RoomConfig 
} from '../mechanics/multiplayer';

// =============================================================================
// EXAMPLE 1: LOCAL HOT-SEAT GAME
// =============================================================================

export class LocalCardGame {
  private session: MultiplayerGameSession;

  constructor(gameType: 'poker' | 'uno' | 'blackjack') {
    // Create local multiplayer session
    this.session = new MultiplayerGameSession(
      gameType, 
      ['Player 1', 'Player 2', 'Player 3'],
      MultiplayerMode.LOCAL
    );
  }

  startGame(): void {
    this.session.startGame();
    console.log('Local game started!');
    this.displayGameState();
  }

  private displayGameState(): void {
    const state = this.session.getPublicGameState();
    console.log(`Current player: ${state.currentPlayer}`);
    console.log(`Deck size: ${state.deckSize}`);
    
    // Show current player's hand
    const currentPlayerHand = this.session.getPlayerHand(state.currentPlayer);
    console.log(`Hand: ${currentPlayerHand.map(c => c.displayName).join(', ')}`);
  }

  playCard(cardId: string): void {
    const currentPlayer = this.session.getCurrentTurnPlayer();
    const hand = this.session.getPlayerHand(currentPlayer);
    const card = hand.find(c => c.id === cardId);
    
    if (card) {
      this.session.playCard(currentPlayer, card);
      this.displayGameState();
    }
  }
}

// =============================================================================
// EXAMPLE 2: ONLINE MULTIPLAYER GAME
// =============================================================================

export class OnlineCardGame {
  private session: MultiplayerGameSession;
  private client: MultiplayerClient;

  constructor(
    gameType: 'poker' | 'uno' | 'blackjack',
    playerName: string = 'Player'
  ) {
    // Create online multiplayer configuration
    const config: ClientConfig = createMultiplayerConfig('CASUAL_ONLINE', {
      playerId: `player_${Date.now()}`,
      playerName: playerName,
      serverUrl: 'wss://your-game-server.com/ws'
    });

    this.client = new MultiplayerClient(config);
    this.session = new MultiplayerGameSession(gameType, [], MultiplayerMode.ONLINE);
    
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    await this.session.initializeMultiplayer(this.client.getConfig());
  }

  async createRoom(roomName: string, isPrivate: boolean = false): Promise<string> {
    const roomConfig: Partial<RoomConfig> = {
      name: roomName,
      isPrivate,
      maxPlayers: 4,
      gameRules: {
        turnTimeLimit: 30,
        allowReconnect: true,
        reconnectTimeLimit: 60,
        deckType: 'standard'
      }
    };

    const room = await this.session.createOnlineRoom(roomConfig);
    console.log(`Room created: ${room.name} (ID: ${room.id})`);
    return room.id;
  }

  async joinRoom(roomId: string, password?: string): Promise<void> {
    await this.session.joinOnlineRoom(roomId, password);
    console.log(`Joined room: ${roomId}`);
  }

  async playCard(cardId: string): Promise<void> {
    const currentPlayer = this.session.getCurrentTurnPlayer();
    const hand = this.session.getPlayerHand(currentPlayer);
    const card = hand.find(c => c.id === cardId);
    
    if (card) {
      await this.session.playCard(currentPlayer, card);
    }
  }

  async drawCard(): Promise<void> {
    const currentPlayer = this.session.getCurrentTurnPlayer();
    await this.session.drawCard(currentPlayer);
  }

  async sendChatMessage(message: string): Promise<void> {
    await this.client.sendChatMessage(message);
  }

  private setupEventHandlers(): void {
    this.client.on('connected', () => {
      console.log('Connected to server');
    });

    this.client.on('playerJoined', (player: any) => {
      console.log(`${player.name} joined the game`);
    });

    this.client.on('playerLeft', (playerId: string) => {
      console.log(`Player ${playerId} left the game`);
    });

    this.client.on('chatMessage', (data: any) => {
      console.log(`${data.senderName}: ${data.message}`);
    });

    this.client.on('gameStateSync', (state: any) => {
      console.log('Game state updated');
      this.displayGameState();
    });
  }

  private displayGameState(): void {
    const state = this.session.getPublicGameState();
    console.log('=== GAME STATE ===');
    console.log(`Current turn: ${state.currentPlayer}`);
    console.log(`Turn time remaining: ${this.session.getTurnTimeRemaining()}s`);
    console.log(`Players: ${state.players.map((p: any) => `${p.name} (${p.handSize} cards)`).join(', ')}`);
  }
}

// =============================================================================
// EXAMPLE 3: AI PRACTICE GAME
// =============================================================================

export class AICardGame {
  private session: MultiplayerGameSession;

  constructor(gameType: 'poker' | 'uno' | 'blackjack', playerName: string = 'Human') {
    this.session = new MultiplayerGameSession(gameType, [playerName], MultiplayerMode.AI);
    
    // Add AI opponents
    this.session.addAIPlayer('easy', 'AI Easy');
    this.session.addAIPlayer('medium', 'AI Medium');
    this.session.addAIPlayer('hard', 'AI Hard');
  }

  startGame(): void {
    console.log('Starting AI practice game...');
    this.session.startGame();
    this.displayGameState();
  }

  playCard(cardId: string): void {
    const humanPlayer = this.session.players[0]; // First player is human
    const hand = this.session.getPlayerHand(humanPlayer);
    const card = hand.find(c => c.id === cardId);
    
    if (card) {
      this.session.playCard(humanPlayer, card);
      this.displayGameState();
    }
  }

  private displayGameState(): void {
    const state = this.session.getPublicGameState();
    console.log('=== AI PRACTICE GAME ===');
    console.log(`Current turn: ${state.currentPlayer}`);
    
    state.players.forEach((player: any) => {
      const isAI = player.id.startsWith('ai_');
      console.log(`${player.name}: ${player.handSize} cards ${isAI ? '(AI)' : '(Human)'}`);
    });
  }
}

// =============================================================================
// EXAMPLE 4: TOURNAMENT MODE
// =============================================================================

export class TournamentManager {
  private rooms: Map<string, OnlineCardGame> = new Map();
  private players: Set<string> = new Set();

  async createTournament(
    tournamentName: string, 
    gameType: 'poker' | 'uno' | 'blackjack',
    maxPlayers: number = 32
  ): Promise<void> {
    console.log(`Creating tournament: ${tournamentName}`);
    
    // Create tournament bracket
    const numRounds = Math.ceil(Math.log2(maxPlayers));
    console.log(`Tournament will have ${numRounds} rounds`);

    // Create initial rooms for first round
    const playersPerRoom = 4;
    const numRooms = Math.ceil(maxPlayers / playersPerRoom);
    
    for (let i = 0; i < numRooms; i++) {
      const room = new OnlineCardGame(gameType, `Tournament Room ${i + 1}`);
      await room.initialize();
      
      const roomId = await room.createRoom(`${tournamentName} - Round 1 - Table ${i + 1}`);
      this.rooms.set(roomId, room);
    }
  }

  async addPlayerToTournament(playerName: string): Promise<string | null> {
    if (this.players.has(playerName)) {
      console.log('Player already in tournament');
      return null;
    }

    // Find a room with space
    for (const [roomId, room] of this.rooms) {
      // Check if room has space (simplified)
      this.players.add(playerName);
      await room.joinRoom(roomId);
      return roomId;
    }

    return null;
  }
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// Example 1: Start a local hot-seat game
export function startLocalGame(): void {
  const game = new LocalCardGame('uno');
  game.startGame();
}

// Example 2: Join an online game
export async function joinOnlineGame(playerName: string): Promise<void> {
  const game = new OnlineCardGame('poker', playerName);
  await game.initialize();
  
  // Either create or join a room
  const roomId = await game.createRoom('Poker Night');
  // OR: await game.joinRoom('existing-room-id');
  
  // Start playing
  setTimeout(() => {
    game.playCard('card_hearts_A'); // Play Ace of Hearts
  }, 2000);
}

// Example 3: Practice against AI
export function startAIPractice(): void {
  const game = new AICardGame('blackjack', 'Player');
  game.startGame();
  
  // Simulate some plays
  setTimeout(() => {
    game.playCard('card_spades_K'); // Play King of Spades
  }, 1000);
}

// Example 4: Create a tournament
export async function createPokerTournament(): Promise<void> {
  const tournament = new TournamentManager();
  await tournament.createTournament('Friday Night Poker', 'poker', 16);
  
  // Add players
  await tournament.addPlayerToTournament('Alice');
  await tournament.addPlayerToTournament('Bob');
  await tournament.addPlayerToTournament('Charlie');
}
