// Core Pile Manager - Foundation for all card collections with event emission
import Phaser from 'phaser';
import { CardProperties } from '../card.types';

export interface PileConfig {
  id: string;
  name: string;
  maxCards?: number;
  allowDuplicates?: boolean;
}

// Pile Events
export const PILE_EVENTS = {
  CARD_ADDED: 'cardAdded',
  CARD_REMOVED: 'cardRemoved', 
  CARDS_ADDED: 'cardsAdded',
  CARDS_REMOVED: 'cardsRemoved',
  PILE_SHUFFLED: 'pileShuffled',
  PILE_CLEARED: 'pileCleared',
  CARDS_ORGANIZED: 'cardsOrganized',
  PILE_CHANGED: 'pileChanged'
} as const;

export interface PileCardEvent {
  card: CardProperties;
  pile: Pile;
  position: number;
  timestamp: number;
}

export interface PileCardsEvent {
  cards: CardProperties[];
  pile: Pile;
  positions: number[];
  timestamp: number;
}

export class Pile extends Phaser.Events.EventEmitter {
  public readonly id: string;
  public readonly name: string;
  protected readonly config: PileConfig;
  
  // The cards currently in this pile (bottom to top order)
  protected cards: CardProperties[] = [];
  
  constructor(config: PileConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.config = { allowDuplicates: true, ...config };
  }

  // =========================================================================
  // CORE CARD OPERATIONS WITH EVENTS
  // =========================================================================

  addCard(card: CardProperties, position?: number): boolean {
    // Validate if card can be added
    if (!this.canAddCard(card)) {
      return false;
    }

    // Add card at position (default: top)
    const insertPosition = position ?? this.cards.length;
    this.cards.splice(insertPosition, 0, card);

    // Emit events
    const event: PileCardEvent = {
      card,
      pile: this,
      position: insertPosition,
      timestamp: Date.now()
    };
    
    this.emit(PILE_EVENTS.CARD_ADDED, event);
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    
    return true;
  }

  addCards(cards: CardProperties[], position?: number): CardProperties[] {
    const addedCards: CardProperties[] = [];
    const insertPosition = position ?? this.cards.length;

    cards.forEach((card, index) => {
      if (this.canAddCard(card)) {
        this.cards.splice(insertPosition + index, 0, card);
        addedCards.push(card);
      }
    });

    if (addedCards.length > 0) {
      const event: PileCardsEvent = {
        cards: addedCards,
        pile: this,
        positions: addedCards.map((_, index) => insertPosition + index),
        timestamp: Date.now()
      };
      
      this.emit(PILE_EVENTS.CARDS_ADDED, event);
      this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    }

    return addedCards;
  }

  removeCard(position?: number): CardProperties | null {
    if (this.isEmpty()) return null;

    // Remove from position (default: top)
    const removePosition = position ?? this.cards.length - 1;
    const card = this.cards.splice(removePosition, 1)[0];

    if (card) {
      const event: PileCardEvent = {
        card,
        pile: this,
        position: removePosition,
        timestamp: Date.now()
      };
      
      this.emit(PILE_EVENTS.CARD_REMOVED, event);
      this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    }

    return card || null;
  }

  removeCards(count: number, position?: number): CardProperties[] {
    const removedCards: CardProperties[] = [];
    const removePosition = position ?? this.cards.length - count;

    for (let i = 0; i < count && this.cards.length > 0; i++) {
      const card = this.cards.splice(removePosition, 1)[0];
      if (card) {
        removedCards.push(card);
      }
    }

    if (removedCards.length > 0) {
      const event: PileCardsEvent = {
        cards: removedCards,
        pile: this,
        positions: removedCards.map((_, index) => removePosition + index),
        timestamp: Date.now()
      };
      
      this.emit(PILE_EVENTS.CARDS_REMOVED, event);
      this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    }

    return removedCards;
  }

  /**
   * Remove a specific card by its ID
   * @param cardId - ID of the card to remove
   * @returns The removed card or null if not found
   */
  removeSpecificCard(card: CardProperties): CardProperties | null {
    const cardIndex = this.cards.findIndex(c => c === card);
    if (cardIndex === -1) return null;

    this.cards.splice(cardIndex, 1);
    
    if (card) {
      const event: PileCardEvent = {
        card,
        pile: this,
        position: cardIndex,
        timestamp: Date.now()
      };
      
      this.emit(PILE_EVENTS.CARD_REMOVED, event);
      this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    }

    return card;
  }

  // =========================================================================
  // PILE OPERATIONS
  // =========================================================================

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }

    this.emit(PILE_EVENTS.PILE_SHUFFLED, { pile: this, timestamp: Date.now() });
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
  }

  /**
   * Organize cards in the pile using a custom sorting function
   * @param compareFn - Comparison function to determine order
   */
  organize(compareFn?: (a: CardProperties, b: CardProperties) => number): void {
    this.cards.sort(compareFn);

    this.emit(PILE_EVENTS.CARDS_ORGANIZED, { pile: this, timestamp: Date.now() });
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
  }

  /**
   * Move a card to a specific position in the pile
   * @param cardId - ID of the card to move
   * @param targetIndex - Target index (0-based)
   */
  moveCard(cardId: string, targetIndex: number): boolean {
    const currentIndex = this.cards.findIndex(card => card.id === cardId);
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= this.cards.length) {
      return false;
    }

    const [card] = this.cards.splice(currentIndex, 1);
    this.cards.splice(targetIndex, 0, card);

    this.emit(PILE_EVENTS.CARDS_ORGANIZED, { pile: this, timestamp: Date.now() });
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
    
    return true;
  }

  clear(): CardProperties[] {
    const clearedCards = [...this.cards];
    this.cards = [];

    this.emit(PILE_EVENTS.PILE_CLEARED, { 
      pile: this, 
      cards: clearedCards, 
      timestamp: Date.now() 
    });
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });

    return clearedCards;
  }

  // =========================================================================
  // QUERY OPERATIONS
  // =========================================================================

  peek(position?: number): CardProperties | null {
    if (this.isEmpty()) return null;
    const peekPosition = position ?? this.cards.length - 1;
    return this.cards[peekPosition] || null;
  }

  peekMultiple(count: number, fromTop: boolean = true): CardProperties[] {
    if (fromTop) {
      return this.cards.slice(-count);
    } else {
      return this.cards.slice(0, count);
    }
  }

  getAllCards(): readonly CardProperties[] {
    return [...this.cards];
  }

  getCardAt(position: number): CardProperties | null {
    return this.cards[position] || null;
  }

  findCard(predicate: (card: CardProperties) => boolean): CardProperties | null {
    return this.cards.find(predicate) || null;
  }

  findCardIndex(predicate: (card: CardProperties) => boolean): number {
    return this.cards.findIndex(predicate);
  }

  hasCard(cardId: string): boolean {
    return this.cards.some(card => card.id === cardId);
  }

  // =========================================================================
  // STATE QUERIES
  // =========================================================================

  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  isFull(): boolean {
    return this.config.maxCards ? this.cards.length >= this.config.maxCards : false;
  }

  canAddCard(card: CardProperties): boolean {
    if (this.isFull()) return false;
    if (!this.config.allowDuplicates && this.hasCard(card.id)) return false;
    return true;
  }

  canAddCards(cards: CardProperties[]): boolean {
    return cards.every(card => this.canAddCard(card));
  }

  // =========================================================================
  // TRANSFER OPERATIONS
  // =========================================================================

  transferCardTo(targetPile: Pile, cardId?: string): CardProperties | null {
    let card: CardProperties | null;

    if (cardId) {
      const cardIndex = this.findCardIndex(c => c.id === cardId);
      if (cardIndex === -1) return null;
      card = this.removeCard(cardIndex);
    } else {
      card = this.removeCard(); // Remove from top
    }

    if (card && targetPile.addCard(card)) {
      return card;
    }

    // If transfer failed, add card back
    if (card) {
      this.addCard(card);
    }

    return null;
  }

  transferCardsTo(targetPile: Pile, count: number): CardProperties[] {
    const cardsToTransfer = this.peekMultiple(count);
    const transferredCards: CardProperties[] = [];

    for (const card of cardsToTransfer) {
      const transferredCard = this.transferCardTo(targetPile, card.id);
      if (transferredCard) {
        transferredCards.push(transferredCard);
      } else {
        break; // Stop if any transfer fails
      }
    }

    return transferredCards;
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  override toString(): string {
    return `Pile(${this.name}): ${this.size()} cards`;
  }

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      cardCount: this.size(),
      cards: this.cards.map(card => ({
        id: card.id,
        displayName: card.displayName
      }))
    };
  }
}
