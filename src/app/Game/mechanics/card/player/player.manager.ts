// Player - Represents a participant in the game
import Phaser from 'phaser';
import { Table } from '../table/table.manager';
import { Pile } from '../pile/pile.manager';
import { CardProperties } from '../card.types';

export interface PlayerConfig {
  id: string;
  name: string;
  isHuman: boolean;
  avatar?: string;
  color?: number;
}

export const PLAYER_EVENTS = {
  // Action events
  ACTION_REQUESTED: 'player:actionRequested',
  ACTION_COMPLETED: 'player:actionCompleted',
  ACTION_FAILED: 'player:actionFailed',
  
  // Card events
  CARDS_PLAYED: 'player:cardsPlayed',
  CARDS_DRAWN: 'player:cardsDrawn',
  
  // Hand events
  HAND_REVEALED: 'player:handRevealed',
  HAND_HIDDEN: 'player:handHidden',
  
  // Turn events
  TURN_STARTED: 'player:turnStarted',
  TURN_ENDED: 'player:turnEnded',
  
  // State events
  READY_STATE_CHANGED: 'player:readyStateChanged'
} as const;

export interface PlayerAction {
  type: 'play' | 'draw' | 'pass' | 'reveal' | 'hide' | 'custom';
  sourceId?: string;
  targetId?: string;
  cards?: CardProperties[];
  context?: any;
}

export class Player extends Phaser.Events.EventEmitter {
  private config: PlayerConfig;
  private table?: Table;
  private piles: Map<string, Pile> = new Map();
  private isReady: boolean = false;
  private isActive: boolean = false;

  constructor(config: PlayerConfig) {
    super();
    this.config = config;
  }

  // =========================================================================
  // TABLE INTERACTION
  // =========================================================================

  joinTable(table: Table): void {
    if (this.table) {
      this.leaveTable();
    }
    
    this.table = table;
    table.addPlayer(this.config.id, this);
    
    // Listen to table events relevant to this player
    this.setupTableEventListeners();
  }

  leaveTable(): void {
    if (this.table) {
      this.table.removePlayer(this.config.id);
      this.cleanupTableEventListeners();
      this.table = undefined;
    }
  }

  private setupTableEventListeners(): void {
    if (!this.table) return;

    this.table.on('table:turnChanged', (event: any) => {
      if (event.currentPlayer === this.config.id) {
        this.startTurn();
      } else if (event.previousPlayer === this.config.id) {
        this.endTurn();
      }
    });
  }

  private cleanupTableEventListeners(): void {
    if (this.table) {
      this.table.off('table:turnChanged');
    }
  }

  // =========================================================================
  // PILE MANAGEMENT
  // =========================================================================

  addPile(pileId: string, pile: Pile): void {
    this.piles.set(pileId, pile);
    
    // Register pile with table if we're at a table
    if (this.table) {
      this.table.registerPile(`${this.config.id}_${pileId}`, pile as Pile);
    }
  }

  removePile(pileId: string): void {
    const pile = this.piles.get(pileId);
    if (pile && this.table) {
      this.table.unregisterPile(`${this.config.id}_${pileId}`);
    }
    this.piles.delete(pileId);
  }

  getPile(pileId: string): Pile | undefined {
    return this.piles.get(pileId);
  }

  getAllPiles(): Pile[] {
    return Array.from(this.piles.values());
  }

  // =========================================================================
  // PLAYER ACTIONS (Event-driven through table)
  // =========================================================================

  requestAction(action: PlayerAction): boolean {
    if (!this.table) {
      console.warn('Player not at a table, cannot perform action');
      return false;
    }

    this.emit(PLAYER_EVENTS.ACTION_REQUESTED, {
      playerId: this.config.id,
      action
    });

    return this.executeAction(action);
  }

  private executeAction(action: PlayerAction): boolean {
    switch (action.type) {
      case 'play':
        return this.playCards(action);
      case 'draw':
        return this.drawCards(action);
      case 'reveal':
        return this.revealPile(action);
      case 'hide':
        return this.hidePile(action);
      case 'pass':
        return this.pass();
      default:
        return this.handleCustomAction(action);
    }
  }

  private playCards(action: PlayerAction): boolean {
    if (!this.table || !action.sourceId || !action.targetId || !action.cards) {
      return false;
    }

    const source = this.table.getPile(action.sourceId);
    const target = this.table.getPile(action.targetId);

    if (!source || !target) {
      this.emit(PLAYER_EVENTS.ACTION_FAILED, {
        playerId: this.config.id,
        action,
        reason: 'Invalid source or target pile'
      });
      return false;
    }

    // Request transfer through table (event-driven)
    const success = this.table.requestTransfer(source, action.cards, target, {
      playerId: this.config.id,
      actionType: 'play'
    });

    if (success) {
      this.emit(PLAYER_EVENTS.CARDS_PLAYED, {
        playerId: this.config.id,
        cards: action.cards,
        source: action.sourceId,
        target: action.targetId
      });
    }

    return success;
  }

  private drawCards(action: PlayerAction): boolean {
    if (!this.table || !action.sourceId || !action.targetId) {
      return false;
    }

    const source = this.table.getPile(action.sourceId);
    const target = this.table.getPile(action.targetId);

    if (!source || !target) {
      return false;
    }

    // For drawing, we don't specify cards - we draw from the top
    const cardsToDraw = action.cards || [];
    if (cardsToDraw.length === 0) {
      // Draw one card from top
      const topCard = (source as any).peek();
      if (topCard) {
        cardsToDraw.push(topCard);
      }
    }

    const success = this.table.requestTransfer(source, cardsToDraw, target, {
      playerId: this.config.id,
      actionType: 'draw'
    });

    if (success) {
      this.emit(PLAYER_EVENTS.CARDS_DRAWN, {
        playerId: this.config.id,
        cards: cardsToDraw,
        source: action.sourceId,
        target: action.targetId
      });
    }

    return success;
  }

  private revealPile(action: PlayerAction): boolean {
    // Pile revealing is not a card transfer, so handle directly
    const pileId = action.sourceId || 'main';
    const pile = this.getPile(pileId);

    if (pile && 'reveal' in pile) {
      (pile as any).reveal();
      this.emit(PLAYER_EVENTS.HAND_REVEALED, {
        playerId: this.config.id,
        pileId
      });
      return true;
    }

    return false;
  }

  private hidePile(action: PlayerAction): boolean {
    const pileId = action.sourceId || 'main';
    const pile = this.getPile(pileId);

    if (pile && 'hide' in pile) {
      (pile as any).hide();
      this.emit(PLAYER_EVENTS.HAND_HIDDEN, {
        playerId: this.config.id,
        pileId
      });
      return true;
    }

    return false;
  }

  private pass(): boolean {
    // Pass turn - let table know we're done
    if (this.table) {
      this.endTurn();
      return true;
    }
    return false;
  }

  private handleCustomAction(action: PlayerAction): boolean {
    // Override in subclasses for game-specific actions
    this.emit(PLAYER_EVENTS.ACTION_REQUESTED, {
      playerId: this.config.id,
      action
    });
    return true;
  }

  // =========================================================================
  // TURN MANAGEMENT
  // =========================================================================

  private startTurn(): void {
    this.isActive = true;
    this.emit(PLAYER_EVENTS.TURN_STARTED, {
      playerId: this.config.id
    });
  }

  private endTurn(): void {
    this.isActive = false;
    this.emit(PLAYER_EVENTS.TURN_ENDED, {
      playerId: this.config.id
    });
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  setReady(ready: boolean): void {
    if (this.isReady !== ready) {
      this.isReady = ready;
      this.emit(PLAYER_EVENTS.READY_STATE_CHANGED, {
        playerId: this.config.id,
        isReady: ready
      });
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

  get isHuman(): boolean {
    return this.config.isHuman;
  }

  get ready(): boolean {
    return this.isReady;
  }

  get active(): boolean {
    return this.isActive;
  }

  get currentTable(): Table | undefined {
    return this.table;
  }

  get handCount(): number {
    return this.piles.size;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(): void {
    this.leaveTable();
    this.piles.clear();
    this.removeAllListeners();
  }
}
