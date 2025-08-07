// Table - Main game controller that manages interaction between piles and players
import Phaser from 'phaser';
import { CardProperties } from '../card.types';
import { Pile, PILE_EVENTS } from '../pile/pile.manager';
import { Deck } from '../deck/deck.manager';

export interface TableConfig {
  id: string;
  name: string;
  maxPlayers: number;
  gameType: string;
  rules?: any;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  piles: Map<string, Pile>;
}

export interface CardTransferRequest {
  source: Pile;
  target: Pile;
  card: CardProperties;
  context?: any;
}

export const TABLE_EVENTS = {
  // Card transfer events
  TRANSFER_REQUESTED: 'table:transferRequested',
  TRANSFER_COMPLETED: 'table:transferCompleted',
  TRANSFER_BLOCKED: 'table:transferBlocked',
  
  // Player events
  PLAYER_JOINED: 'table:playerJoined',
  PLAYER_LEFT: 'table:playerLeft',
  
  // Game state events
  GAME_STARTED: 'table:gameStarted',
  GAME_ENDED: 'table:gameEnded',
  TURN_CHANGED: 'table:turnChanged',
  
  // Rule validation events
  RULE_VIOLATED: 'table:ruleViolated',
  ACTION_BLOCKED: 'table:actionBlocked'
} as const;

export class Table extends Phaser.Events.EventEmitter {
  private config: TableConfig;
  private piles: Map<string, Pile> = new Map();
  private players: Map<string, Player> = new Map();
  private gameState: 'waiting' | 'active' | 'paused' | 'ended' = 'waiting';
  private currentPlayer?: string;

  constructor(config: TableConfig) {
    super();
    this.config = config;
    this.setupEventListeners();
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  private setupEventListeners(): void {
    // The table listens for transfer requests and validates them
    this.on(TABLE_EVENTS.TRANSFER_REQUESTED, this.handleTransferRequest, this);
  }

  // =========================================================================
  // PILE MANAGEMENT
  // =========================================================================

  registerPile(id: string, pile: Pile): void {
    this.piles.set(id, pile);
    
    // Listen to pile events to track game state
    this.setupPileEventListeners(id, pile);
    
    console.log(`Pile ${id} (${pile.name}) registered with table`);
  }

  unregisterPile(id: string): void {
    const pile = this.piles.get(id);
    if (pile) {
      this.cleanupPileEventListeners(pile);
      this.piles.delete(id);
      console.log(`Pile ${id} unregistered from table`);
    }
  }

  getPile(id: string): Pile | undefined {
    return this.piles.get(id);
  }

  getAllPiles(): Pile[] {
    return Array.from(this.piles.values());
  }

  private setupPileEventListeners(id: string, pile: Pile): void {
    // Listen to pile events for game logic
    pile.on(PILE_EVENTS.CARD_ADDED, (event) => {
      console.log(`Card added to pile ${id}:`, event);
    });

    pile.on(PILE_EVENTS.CARD_REMOVED, (event) => {
      console.log(`Card removed from pile ${id}:`, event);
    });

    pile.on(PILE_EVENTS.PILE_SHUFFLED, (event) => {
      console.log(`Pile ${id} was shuffled`);
    });

    pile.on(PILE_EVENTS.CARDS_ORGANIZED, (event) => {
      console.log(`Pile ${id} was organized`);
    });
  }

  private cleanupPileEventListeners(pile: Pile): void {
    pile.removeAllListeners();
  }

  // =========================================================================
  // CARD TRANSFER SYSTEM
  // =========================================================================

  /**
   * Request to transfer a card from one pile to another
   * This validates the transfer before allowing it
   */
  requestCardTransfer(source: Pile, target: Pile, card: CardProperties, context?: any): boolean {
    const transferRequest: CardTransferRequest = {
      source,
      target, 
      card,
      context
    };

    // Emit transfer request - rules can block this
    this.emit(TABLE_EVENTS.TRANSFER_REQUESTED, transferRequest);

    // Validate the transfer
    if (this.validateCardTransfer(transferRequest)) {
      return this.executeCardTransfer(transferRequest);
    } else {
      this.emit(TABLE_EVENTS.TRANSFER_BLOCKED, {
        reason: 'Transfer not allowed by game rules',
        transferRequest
      });
      return false;
    }
  }

  private handleTransferRequest(request: CardTransferRequest): void {
    // Game rules would hook into this method
    // For now, we allow all valid transfers
    console.log(`Transfer requested: ${request.card.displayName} from ${request.source.name} to ${request.target.name}`);
  }

  private validateCardTransfer(request: CardTransferRequest): boolean {
    // Check if source has the card
    const sourceHasCard = request.source.findCard(c => c.id === request.card.id) !== undefined;
    if (!sourceHasCard) {
      console.warn(`Source pile ${request.source.name} does not contain card ${request.card.displayName}`);
      return false;
    }

    // Check if target can accept the card
    // Note: maxCards checking would need to be exposed via a public method on Pile
    // For now, just check if it's a reasonable size (game rules can override this)
    if (request.target.size() >= 100) { // Arbitrary large limit
      console.warn(`Target pile ${request.target.name} is at capacity`);
      return false;
    }

    return true;
  }

  private executeCardTransfer(request: CardTransferRequest): boolean {
    try {
      // Remove card from source
      const removedCard = request.source.removeSpecificCard(request.card);
      if (!removedCard) {
        console.error(`Failed to remove card ${request.card.displayName} from ${request.source.name}`);
        return false;
      }

      // Add card to target
      request.target.addCard(removedCard);

      // Emit completion event
      this.emit(TABLE_EVENTS.TRANSFER_COMPLETED, {
        source: request.source,
        target: request.target,
        card: removedCard,
        context: request.context
      });

      console.log(`Successfully transferred ${removedCard.displayName} from ${request.source.name} to ${request.target.name}`);
      return true;

    } catch (error) {
      console.error('Transfer failed:', error);
      this.emit(TABLE_EVENTS.ACTION_BLOCKED, {
        reason: error instanceof Error ? error.message : 'Unknown error',
        transferRequest: request
      });
      return false;
    }
  }

  // =========================================================================
  // PLAYER MANAGEMENT
  // =========================================================================

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    
    // Register all player's piles with the table
    player.piles.forEach((pile, pileId) => {
      this.registerPile(`${player.id}-${pileId}`, pile);
    });

    this.emit(TABLE_EVENTS.PLAYER_JOINED, { player });
    console.log(`Player ${player.name} joined the table`);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      // Unregister all player's piles
      player.piles.forEach((pile, pileId) => {
        this.unregisterPile(`${player.id}-${pileId}`);
      });

      this.players.delete(playerId);
      this.emit(TABLE_EVENTS.PLAYER_LEFT, { player });
      console.log(`Player ${player.name} left the table`);
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // =========================================================================
  // GAME STATE MANAGEMENT
  // =========================================================================

  startGame(): void {
    if (this.gameState === 'waiting' && this.players.size > 0) {
      this.gameState = 'active';
      this.emit(TABLE_EVENTS.GAME_STARTED, { 
        tableId: this.config.id,
        playerCount: this.players.size 
      });
      console.log(`Game started on table ${this.config.name}`);
    }
  }

  endGame(): void {
    this.gameState = 'ended';
    this.emit(TABLE_EVENTS.GAME_ENDED, { 
      tableId: this.config.id 
    });
    console.log(`Game ended on table ${this.config.name}`);
  }

  pauseGame(): void {
    if (this.gameState === 'active') {
      this.gameState = 'paused';
    }
  }

  resumeGame(): void {
    if (this.gameState === 'paused') {
      this.gameState = 'active';
    }
  }

  setCurrentPlayer(playerId: string): void {
    const previousPlayer = this.currentPlayer;
    this.currentPlayer = playerId;
    this.emit(TABLE_EVENTS.TURN_CHANGED, { 
      currentPlayer: playerId,
      previousPlayer 
    });
    console.log(`Turn changed to player ${playerId}`);
  }

  // =========================================================================
  // CONVENIENCE METHODS
  // =========================================================================

  /**
   * Deal cards from a deck to players' hands
   */
  dealCardsToPlayers(deckId: string, handPileId: string, cardsPerPlayer: number): void {
    const deck = this.getPile(deckId) as Deck;
    if (!deck) {
      console.error(`Deck ${deckId} not found`);
      return;
    }

    this.players.forEach(player => {
      const hand = player.piles.get(handPileId);
      if (hand) {
        for (let i = 0; i < cardsPerPlayer; i++) {
          const card = deck.peek();
          if (card) {
            this.requestCardTransfer(deck, hand, card, { context: 'dealing' });
          }
        }
      }
    });
  }

  /**
   * Shuffle a pile by ID
   */
  shufflePile(pileId: string): void {
    const pile = this.getPile(pileId);
    if (pile) {
      pile.shuffle();
    }
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get state(): string {
    return this.gameState;
  }

  get playerCount(): number {
    return this.players.size;
  }

  get pileCount(): number {
    return this.piles.size;
  }

  get currentPlayerId(): string | undefined {
    return this.currentPlayer;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(): void {
    // Clean up all piles
    this.piles.forEach(pile => this.cleanupPileEventListeners(pile));
    this.piles.clear();
    
    // Clean up players
    this.players.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log(`Table ${this.config.name} destroyed`);
  }
}
