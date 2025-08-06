// Table - Main game controller that manages interaction between piles, hands, decks, and players
import Phaser from 'phaser';
import { CardProperties } from '../card.types';
import { StartTransferCardsEvent, CompleteTransferCardsEvent, cardsCanBeAdded, cardsCanBeRemoved } from '../card.events';
import { Pile } from '../pile/pile.manager';

export interface TableConfig {
  id: string;
  name: string;
  maxPlayers: number;
  gameType: string;
  rules?: any;
}

export const TABLE_EVENTS = {
  // Card transfer events
  START_TRANSFER: 'table:startTransfer',
  COMPLETE_TRANSFER: 'table:completeTransfer',
  CANCEL_TRANSFER: 'table:cancelTransfer',
  
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
  private players: Map<string, any> = new Map(); // Will be properly typed when Player is created
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
    // Listen for transfer requests from any pile
    this.on(TABLE_EVENTS.START_TRANSFER, this.handleStartTransfer, this);
  }

  // =========================================================================
  // PILE MANAGEMENT
  // =========================================================================

  registerPile(id: string, pile: Pile): void {
    this.piles.set(id, pile);
    
    // Set up event forwarding from pile to table
    // Piles emit events to the table, table decides if they're allowed
    this.setupPileEventForwarding(id, pile);
  }

  unregisterPile(id: string): void {
    const pile = this.piles.get(id);
    if (pile) {
      // Clean up event listeners
      pile.removeAllListeners();
      this.piles.delete(id);
    }
  }

  getPile(id: string): Pile | undefined {
    return this.piles.get(id);
  }

  getAllPiles(): Pile[] {
    return Array.from(this.piles.values());
  }

  private setupPileEventForwarding(id: string, pile: Pile): void {
    // When a pile wants to transfer cards, it emits to the table
    // The table validates and coordinates the transfer
    pile.on('transfer:request', (event: any) => {
      this.requestTransfer(event.source, event.cards, event.target, event.context);
    });
  }

  // =========================================================================
  // CARD TRANSFER SYSTEM (Core functionality)
  // =========================================================================

  /**
   * Request to transfer cards from one pile to another
   * This is the main method all card movements go through
   */
  requestTransfer(
    source: cardsCanBeRemoved, 
    cards: CardProperties[], 
    target: cardsCanBeAdded, 
    context?: any
  ): boolean {
    const transferEvent: StartTransferCardsEvent = {
      source,
      cards,
      target,
      context,
      cancellable: true
    };

    // Emit start transfer event - rules can cancel this
    this.emit(TABLE_EVENTS.START_TRANSFER, transferEvent);

    // If not cancelled, perform the transfer
    if (transferEvent.cancellable) {
      return this.executeTransfer(transferEvent);
    }

    return false;
  }

  private handleStartTransfer(event: StartTransferCardsEvent): void {
    // This is where game rules would be applied
    // For now, we'll allow all transfers
    // Rules engine would hook into this method
    
    // Example rule checking:
    if (!this.validateTransfer(event)) {
      event.cancellable = false;
      this.emit(TABLE_EVENTS.ACTION_BLOCKED, {
        reason: 'Transfer not allowed by game rules',
        event
      });
    }
  }

  private validateTransfer(event: StartTransferCardsEvent): boolean {
    // Basic validation - can be extended with game-specific rules
    
    // Check if source has the cards
    const sourceHasCards = event.cards.every(card => {
      if ('contains' in event.source) {
        return (event.source as any).contains(card.id);
      }
      return true; // Assume valid if we can't check
    });

    if (!sourceHasCards) {
      return false;
    }

    // Check if target can accept cards (could check limits, types, etc.)
    // This would be implemented based on specific game rules

    return true;
  }

  private executeTransfer(event: StartTransferCardsEvent): boolean {
    try {
      // Remove cards from source
      const removedCards: CardProperties[] = [];
      for (const card of event.cards) {
        if ('findCard' in event.source && 'removeSpecificCard' in event.source) {
          const foundCard = (event.source as any).findCard(card.id);
          if (foundCard) {
            (event.source as any).removeSpecificCard(card.id);
            removedCards.push(foundCard);
          }
        } else {
          // Fallback to basic removal if specific removal not available
          const removed = event.source.removeCard();
          if (removed) {
            removedCards.push(removed);
          }
        }
      }

      // Add cards to target
      event.target.addCards(removedCards);

      // Emit completion event
      const completeEvent: CompleteTransferCardsEvent = {
        source: event.source,
        cards: removedCards,
        target: event.target,
        context: event.context
      };

      this.emit(TABLE_EVENTS.COMPLETE_TRANSFER, completeEvent);

      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      this.emit(TABLE_EVENTS.CANCEL_TRANSFER, {
        event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // =========================================================================
  // PLAYER MANAGEMENT
  // =========================================================================

  addPlayer(playerId: string, player: any): void {
    this.players.set(playerId, player);
    this.emit(TABLE_EVENTS.PLAYER_JOINED, { playerId, player });
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.emit(TABLE_EVENTS.PLAYER_LEFT, { playerId, player });
    }
  }

  getPlayer(playerId: string): any {
    return this.players.get(playerId);
  }

  getAllPlayers(): any[] {
    return Array.from(this.players.values());
  }

  // =========================================================================
  // GAME STATE MANAGEMENT
  // =========================================================================

  startGame(): void {
    if (this.gameState === 'waiting') {
      this.gameState = 'active';
      this.emit(TABLE_EVENTS.GAME_STARTED, { tableId: this.config.id });
    }
  }

  endGame(): void {
    this.gameState = 'ended';
    this.emit(TABLE_EVENTS.GAME_ENDED, { tableId: this.config.id });
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
    this.currentPlayer = playerId;
    this.emit(TABLE_EVENTS.TURN_CHANGED, { 
      currentPlayer: playerId,
      previousPlayer: this.currentPlayer 
    });
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

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(): void {
    // Clean up all piles
    this.piles.forEach(pile => pile.removeAllListeners());
    this.piles.clear();
    
    // Clean up players
    this.players.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
  }
}
