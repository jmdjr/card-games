// Multiplayer Session Integration
import { GameSession, Deck } from '../card/deck.manager';
import { CardProperties } from '../card/card.types';
import { MultiplayerClient } from './client.manager';
import { 
  ClientConfig, 
  PlayerConfig, 
  RoomConfig, 
  MultiplayerMode, 
  PlayerType,
  MULTIPLAYER_PRESETS 
} from './multiplayer.types';

export class MultiplayerGameSession extends GameSession {
  private multiplayerClient: MultiplayerClient | null = null;
  private playerHands: Map<string, CardProperties[]> = new Map();
  private gameState: 'waiting' | 'playing' | 'paused' | 'finished' = 'waiting';
  private currentTurnPlayerId: string = '';
  private turnTimeRemaining: number = 0;
  private turnTimer: NodeJS.Timeout | null = null;

  constructor(
    gameType: string, 
    playerNames: string[] = [],
    private multiplayerMode: MultiplayerMode = MultiplayerMode.LOCAL
  ) {
    super(gameType, playerNames);
    this.setupMultiplayerHandlers();
  }

  // =========================================================================
  // MULTIPLAYER SETUP
  // =========================================================================

  async initializeMultiplayer(config: ClientConfig): Promise<void> {
    this.multiplayerClient = new MultiplayerClient(config);
    this.setupMultiplayerEventHandlers();
    
    if (config.multiplayerMode !== MultiplayerMode.LOCAL) {
      await this.multiplayerClient.connect();
    }
  }

  async createOnlineRoom(roomConfig: Partial<RoomConfig>): Promise<RoomConfig> {
    if (!this.multiplayerClient) {
      throw new Error('Multiplayer not initialized');
    }

    const room = await this.multiplayerClient.createRoom({
      ...roomConfig,
      gameType: this.gameConfig.name.toLowerCase(),
      gameRules: {
        turnTimeLimit: 30,
        allowReconnect: true,
        reconnectTimeLimit: 60,
        deckType: 'standard',
        shuffleCount: 7,
        dealerRotation: true,
        ...roomConfig.gameRules
      }
    });

    return room;
  }

  async joinOnlineRoom(roomId: string, password?: string): Promise<void> {
    if (!this.multiplayerClient) {
      throw new Error('Multiplayer not initialized');
    }

    await this.multiplayerClient.joinRoom(roomId, password);
  }

  // =========================================================================
  // GAME FLOW OVERRIDE
  // =========================================================================

  override startGame(): void {
    super.startGame();
    this.gameState = 'playing';
    this.currentTurnPlayerId = this.players[this.currentPlayerIndex];
    
    // Deal initial cards based on game type
    const cardsPerPlayer = this.getInitialCardCount();
    const hands = this.dealCards(cardsPerPlayer);
    
    // Store hands for multiplayer management
    Object.entries(hands).forEach(([playerId, cards]) => {
      this.playerHands.set(playerId, cards);
    });

    this.startTurnTimer();
    this.broadcastGameState();
  }

  override nextPlayer(): void {
    super.nextPlayer();
    this.currentTurnPlayerId = this.players[this.currentPlayerIndex];
    this.startTurnTimer();
    this.broadcastGameState();
  }

  // =========================================================================
  // MULTIPLAYER ACTIONS
  // =========================================================================

  async playCard(playerId: string, card: CardProperties): Promise<boolean> {
    // Validate it's the player's turn
    if (playerId !== this.currentTurnPlayerId) {
      throw new Error('Not your turn');
    }

    // Validate player has the card
    const playerHand = this.playerHands.get(playerId);
    if (!playerHand || !playerHand.find(c => c.id === card.id)) {
      throw new Error('Card not in hand');
    }

    // Validate move is legal (game-specific logic would go here)
    if (!this.isValidPlay(card, playerId)) {
      throw new Error('Invalid play');
    }

    // Execute the play
    this.removeCardFromHand(playerId, card);
    this.deck.discard(card);

    // Check for win condition
    if (this.checkWinCondition(playerId)) {
      this.endGame(playerId);
      return true;
    }

    // Broadcast to all players
    this.broadcastPlayerAction('PLAY_CARD', playerId, { card });
    
    // Continue game flow
    this.nextPlayer();
    return true;
  }

  async drawCard(playerId: string): Promise<CardProperties | null> {
    if (playerId !== this.currentTurnPlayerId) {
      throw new Error('Not your turn');
    }

    const card = this.deck.drawCard();
    if (card) {
      this.addCardToHand(playerId, card);
      this.broadcastPlayerAction('DRAW_CARD', playerId, { card: this.isCardVisible(card, playerId) ? card : null });
    }

    return card;
  }

  async endTurn(playerId: string): Promise<void> {
    if (playerId !== this.currentTurnPlayerId) {
      throw new Error('Not your turn');
    }

    this.stopTurnTimer();
    this.broadcastPlayerAction('END_TURN', playerId, {});
    this.nextPlayer();
  }

  // =========================================================================
  // AI INTEGRATION
  // =========================================================================

  addAIPlayer(difficulty: 'easy' | 'medium' | 'hard', name?: string): void {
    const aiId = `ai_${Date.now()}`;
    const aiPlayer: PlayerConfig = {
      id: aiId,
      name: name || `AI Player (${difficulty})`,
      type: difficulty === 'easy' ? PlayerType.AI_EASY : 
            difficulty === 'medium' ? PlayerType.AI_MEDIUM : PlayerType.AI_HARD,
      connectionState: 'connected' as any,
      aiDifficulty: difficulty,
      aiPersonality: 'balanced'
    };

    this.players.push(aiId);
    this.playerHands.set(aiId, []);
  }

  private async processAITurn(playerId: string): Promise<void> {
    const playerConfig = this.getPlayerConfig(playerId);
    if (!playerConfig || !playerConfig.type.startsWith('ai_')) return;

    // Simulate AI thinking time
    const thinkingTime = this.getAIThinkingTime(playerConfig.aiDifficulty!);
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    // Get AI decision
    const decision = this.getAIDecision(playerId, playerConfig);
    
    switch (decision.action) {
      case 'PLAY_CARD':
        await this.playCard(playerId, decision.card);
        break;
      case 'DRAW_CARD':
        await this.drawCard(playerId);
        break;
      case 'END_TURN':
        await this.endTurn(playerId);
        break;
    }
  }

  private getAIThinkingTime(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 2000 + Math.random() * 3000;   // 2-5 seconds
      case 'medium': return 1000 + Math.random() * 2000; // 1-3 seconds
      case 'hard': return 500 + Math.random() * 1000;    // 0.5-1.5 seconds
      default: return 1500;
    }
  }

  private getAIDecision(playerId: string, config: PlayerConfig): any {
    // Simplified AI decision making - would be much more sophisticated in practice
    const hand = this.playerHands.get(playerId) || [];
    const topDiscard = this.deck.getTopDiscard();
    
    // Try to play a card
    for (const card of hand) {
      if (this.isValidPlay(card, playerId)) {
        return { action: 'PLAY_CARD', card };
      }
    }
    
    // If can't play, draw a card
    if (!this.deck.isEmpty()) {
      return { action: 'DRAW_CARD' };
    }
    
    // End turn if nothing else to do
    return { action: 'END_TURN' };
  }

  // =========================================================================
  // GAME STATE MANAGEMENT
  // =========================================================================

  private broadcastGameState(): void {
    if (!this.multiplayerClient || this.multiplayerMode === MultiplayerMode.LOCAL) {
      return;
    }

    const gameState = this.getPublicGameState();
    // Broadcast would happen here to all connected players
    // this.multiplayerClient.broadcastGameState(gameState);
  }

  private broadcastPlayerAction(action: string, playerId: string, data: any): void {
    if (!this.multiplayerClient || this.multiplayerMode === MultiplayerMode.LOCAL) {
      return;
    }

    // Broadcast player action to all other players
    // this.multiplayerClient.broadcastPlayerAction(action, playerId, data);
  }

  getPublicGameState(): any {
    return {
      gameType: this.gameConfig.name,
      currentPlayer: this.currentTurnPlayerId,
      turnTimeRemaining: this.turnTimeRemaining,
      deckSize: this.deck.size(),
      discardTop: this.deck.getTopDiscard(),
      players: this.players.map(playerId => ({
        id: playerId,
        name: playerId,
        handSize: this.playerHands.get(playerId)?.length || 0,
        isCurrentPlayer: playerId === this.currentTurnPlayerId
      })),
      gameState: this.gameState
    };
  }

  getPlayerGameState(playerId: string): any {
    const publicState = this.getPublicGameState();
    return {
      ...publicState,
      hand: this.playerHands.get(playerId) || [],
      isYourTurn: playerId === this.currentTurnPlayerId
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private setupMultiplayerHandlers(): void {
    // Set up any initial multiplayer-specific handlers
  }

  private setupMultiplayerEventHandlers(): void {
    if (!this.multiplayerClient) return;

    this.multiplayerClient.on('playerJoined', (player: PlayerConfig) => {
      this.onPlayerJoined(player);
    });

    this.multiplayerClient.on('playerLeft', (playerId: string) => {
      this.onPlayerLeft(playerId);
    });

    this.multiplayerClient.on('gameStateSync', (state: any) => {
      this.onGameStateSync(state);
    });
  }

  private onPlayerJoined(player: PlayerConfig): void {
    if (!this.players.includes(player.id)) {
      this.players.push(player.id);
      this.playerHands.set(player.id, []);
    }
  }

  private onPlayerLeft(playerId: string): void {
    const index = this.players.indexOf(playerId);
    if (index > -1) {
      this.players.splice(index, 1);
      this.playerHands.delete(playerId);
      
      // Adjust current player index if needed
      if (this.currentPlayerIndex >= this.players.length) {
        this.currentPlayerIndex = 0;
      }
    }
  }

  private onGameStateSync(state: any): void {
    // Sync game state from server
    this.gameState = state.gameState;
    this.currentPlayerIndex = this.players.indexOf(state.currentPlayer);
    this.currentTurnPlayerId = state.currentPlayer;
    this.turnTimeRemaining = state.turnTimeRemaining;
  }

  private startTurnTimer(): void {
    this.stopTurnTimer();
    
    const roomConfig = this.multiplayerClient?.getCurrentRoom();
    const timeLimit = roomConfig?.gameRules.turnTimeLimit;
    
    if (timeLimit && timeLimit > 0) {
      this.turnTimeRemaining = timeLimit;
      
      this.turnTimer = setInterval(() => {
        this.turnTimeRemaining--;
        
        if (this.turnTimeRemaining <= 0) {
          this.onTurnTimeout();
        }
      }, 1000);
    }
  }

  private stopTurnTimer(): void {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  private onTurnTimeout(): void {
    this.stopTurnTimer();
    
    // Force end turn for current player
    const currentPlayer = this.getPlayerConfig(this.currentTurnPlayerId);
    
    if (currentPlayer?.type.startsWith('ai_')) {
      // AI should make a quick decision
      this.processAITurn(this.currentTurnPlayerId);
    } else {
      // Human player times out - auto-end turn or draw card
      this.endTurn(this.currentTurnPlayerId);
    }
  }

  private removeCardFromHand(playerId: string, card: CardProperties): void {
    const hand = this.playerHands.get(playerId);
    if (hand) {
      const index = hand.findIndex(c => c.id === card.id);
      if (index > -1) {
        hand.splice(index, 1);
      }
    }
  }

  private addCardToHand(playerId: string, card: CardProperties): void {
    const hand = this.playerHands.get(playerId);
    if (hand) {
      hand.push(card);
    }
  }

  private isValidPlay(card: CardProperties, playerId: string): boolean {
    // Game-specific validation logic would go here
    // This is a simplified version
    return true;
  }

  private checkWinCondition(playerId: string): boolean {
    const hand = this.playerHands.get(playerId);
    return hand ? hand.length === 0 : false;
  }

  private endGame(winnerId: string): void {
    this.gameState = 'finished';
    this.stopTurnTimer();
    this.broadcastPlayerAction('GAME_END', winnerId, { winner: winnerId });
  }

  private isCardVisible(card: CardProperties, playerId: string): boolean {
    // Determine if card should be visible to player
    // In most games, players can only see their own cards
    return true;
  }

  private getInitialCardCount(): number {
    // Game-specific initial card count
    switch (this.gameConfig.name.toLowerCase()) {
      case 'uno': return 7;
      case 'poker': return 5;
      case 'blackjack': return 2;
      default: return 5;
    }
  }

  private getPlayerConfig(playerId: string): PlayerConfig | null {
    // This would typically come from the multiplayer client
    return null;
  }

  // Public getters
  getMultiplayerMode(): MultiplayerMode {
    return this.multiplayerMode;
  }

  getPlayerHand(playerId: string): CardProperties[] {
    return this.playerHands.get(playerId) || [];
  }

  getCurrentTurnPlayer(): string {
    return this.currentTurnPlayerId;
  }

  getTurnTimeRemaining(): number {
    return this.turnTimeRemaining;
  }

  getGameState(): string {
    return this.gameState;
  }
}
