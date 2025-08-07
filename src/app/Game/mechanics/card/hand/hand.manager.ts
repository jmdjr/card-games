// Hand Manager - A Pile with player-specific display and interaction logic
import { Pile, PileConfig, PILE_EVENTS } from '../pile/pile.manager';
import { CardProperties } from '../card.types';

export interface HandConfig extends PileConfig {
  isPlayerHand: boolean;
  showCardFaces: boolean;
  allowMultiSelect: boolean;
  maxSelectedCards?: number;
  sortOnAdd?: boolean;
}

// Hand Events (extends Pile events)
export const HAND_EVENTS = {
  ...PILE_EVENTS,
  CARD_SELECTED: 'cardSelected',
  CARD_DESELECTED: 'cardDeselected',
  SELECTION_CHANGED: 'selectionChanged',
  HAND_SORTED: 'handSorted'
} as const;

export interface HandSelectionEvent {
  card: CardProperties;
  hand: Hand;
  isSelected: boolean;
  selectedCards: readonly CardProperties[];
  timestamp: number;
}

export interface HandSelectionChangedEvent {
  hand: Hand;
  selectedCards: readonly CardProperties[];
  previousSelection: readonly CardProperties[];
  timestamp: number;
}

export class Hand extends Pile {
  protected override readonly config: HandConfig;
  private selectedCards: Set<string> = new Set();

  constructor(config: HandConfig) {
    super(config);
    this.config = { 
      sortOnAdd: false,
      ...config,
      allowMultiSelect: config.allowMultiSelect ?? true,
      showCardFaces: config.showCardFaces ?? false,
      isPlayerHand: config.isPlayerHand ?? false
    };
  }

  // =========================================================================
  // CARD OPERATIONS WITH AUTO-SORT
  // =========================================================================

  override addCard(card: CardProperties, position?: number): boolean {
    const wasAdded = super.addCard(card, position);
    
    if (wasAdded && this.config.sortOnAdd) {
      this.sortCards();
    }
    
    return wasAdded;
  }

  override addCards(cards: CardProperties[], position?: number): CardProperties[] {
    const addedCards = super.addCards(cards, position);
    
    if (addedCards.length > 0 && this.config.sortOnAdd) {
      this.sortCards();
    }
    
    return addedCards;
  }

  // =========================================================================
  // SELECTION MANAGEMENT
  // =========================================================================

  selectCard(cardId: string): boolean {
    const card = this.findCard(c => c.id === cardId);
    if (!card || this.selectedCards.has(cardId)) {
      return false;
    }

    // Check selection limits
    if (!this.config.allowMultiSelect && this.selectedCards.size > 0) {
      this.clearSelection();
    }

    if (this.config.maxSelectedCards && this.selectedCards.size >= this.config.maxSelectedCards) {
      return false;
    }

    const previousSelection = [...this.selectedCards];
    this.selectedCards.add(cardId);

    const selectionEvent: HandSelectionEvent = {
      card,
      hand: this,
      isSelected: true,
      selectedCards: this.getSelectedCards(),
      timestamp: Date.now()
    };

    const changeEvent: HandSelectionChangedEvent = {
      hand: this,
      selectedCards: this.getSelectedCards(),
      previousSelection: this.cards.filter(c => previousSelection.includes(c.id)),
      timestamp: Date.now()
    };

    this.emit(HAND_EVENTS.CARD_SELECTED, selectionEvent);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, changeEvent);

    return true;
  }

  deselectCard(cardId: string): boolean {
    if (!this.selectedCards.has(cardId)) {
      return false;
    }

    const card = this.findCard(c => c.id === cardId);
    if (!card) return false;

    const previousSelection = [...this.selectedCards];
    this.selectedCards.delete(cardId);

    const selectionEvent: HandSelectionEvent = {
      card,
      hand: this,
      isSelected: false,
      selectedCards: this.getSelectedCards(),
      timestamp: Date.now()
    };

    const changeEvent: HandSelectionChangedEvent = {
      hand: this,
      selectedCards: this.getSelectedCards(),
      previousSelection: this.cards.filter(c => previousSelection.includes(c.id)),
      timestamp: Date.now()
    };

    this.emit(HAND_EVENTS.CARD_DESELECTED, selectionEvent);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, changeEvent);

    return true;
  }

  toggleCardSelection(cardId: string): boolean {
    if (this.selectedCards.has(cardId)) {
      return this.deselectCard(cardId);
    } else {
      return this.selectCard(cardId);
    }
  }

  clearSelection(): void {
    const previousSelection = [...this.selectedCards];
    this.selectedCards.clear();

    if (previousSelection.length > 0) {
      const changeEvent: HandSelectionChangedEvent = {
        hand: this,
        selectedCards: [],
        previousSelection: this.cards.filter(c => previousSelection.includes(c.id)),
        timestamp: Date.now()
      };

      this.emit(HAND_EVENTS.SELECTION_CHANGED, changeEvent);
    }
  }

  selectAll(): void {
    const previousSelection = [...this.selectedCards];
    this.cards.forEach(card => this.selectedCards.add(card.id));

    const changeEvent: HandSelectionChangedEvent = {
      hand: this,
      selectedCards: this.getSelectedCards(),
      previousSelection: this.cards.filter(c => previousSelection.includes(c.id)),
      timestamp: Date.now()
    };

    this.emit(HAND_EVENTS.SELECTION_CHANGED, changeEvent);
  }

  // =========================================================================
  // SELECTION QUERIES
  // =========================================================================

  getSelectedCards(): readonly CardProperties[] {
    return this.cards.filter(card => this.selectedCards.has(card.id));
  }

  getSelectedCardIds(): readonly string[] {
    return [...this.selectedCards];
  }

  isCardSelected(cardId: string): boolean {
    return this.selectedCards.has(cardId);
  }

  getSelectionCount(): number {
    return this.selectedCards.size;
  }

  hasSelection(): boolean {
    return this.selectedCards.size > 0;
  }

  // =========================================================================
  // HAND-SPECIFIC OPERATIONS
  // =========================================================================

  sortCards(compareFn?: (a: CardProperties, b: CardProperties) => number): void {
    const defaultSort = (a: CardProperties, b: CardProperties): number => {
      // Sort by suit first, then by value
      const aSuit = a.data?.['suit'] || '';
      const bSuit = b.data?.['suit'] || '';
      
      if (aSuit !== bSuit) {
        return aSuit.toString().localeCompare(bSuit.toString());
      }
      
      // Handle numeric and face cards
      const aVal = typeof a.data?.['value'] === 'number' ? a.data['value'] : this.getFaceCardValue(a.data?.['value']);
      const bVal = typeof b.data?.['value'] === 'number' ? b.data['value'] : this.getFaceCardValue(b.data?.['value']);
      
      return aVal - bVal;
    };

    this.cards.sort(compareFn || defaultSort);

    this.emit(HAND_EVENTS.HAND_SORTED, { 
      hand: this, 
      cardCount: this.size(),
      timestamp: Date.now() 
    });
    this.emit(PILE_EVENTS.PILE_CHANGED, { pile: this, timestamp: Date.now() });
  }

  private getFaceCardValue(value: any): number {
    if (typeof value === 'number') return value;
    
    const faceValues: { [key: string]: number } = {
      'ace': 1,
      'jack': 11,
      'queen': 12,
      'king': 13
    };
    
    return faceValues[value?.toString().toLowerCase()] || 0;
  }

  playSelectedCards(): CardProperties[] {
    const cardsToPlay = this.getSelectedCards();
    const playedCards: CardProperties[] = [];

    // Remove selected cards from hand
    for (const card of cardsToPlay) {
      const removedCard = this.removeCard(this.findCardIndex(c => c.id === card.id));
      if (removedCard) {
        playedCards.push(removedCard);
      }
    }

    this.clearSelection();
    return playedCards;
  }

  // =========================================================================
  // QUERY OPERATIONS
  // =========================================================================

  getCardsBySuit(suit: string): CardProperties[] {
    return this.cards.filter(card => card.data?.['suit'] === suit);
  }

  getCardsByValue(value: string | number): CardProperties[] {
    return this.cards.filter(card => card.data?.['value'] === value);
  }

  getCardsByType(type: string): CardProperties[] {
    return this.cards.filter(card => card.data?.['type'] === type);
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  static createPlayerHand(id: string, name: string): Hand {
    return new Hand({
      id,
      name,
      isPlayerHand: true,
      showCardFaces: true,
      allowMultiSelect: true,
      maxCards: 20,
      sortOnAdd: true
    });
  }

  static createOpponentHand(id: string, name: string): Hand {
    return new Hand({
      id,
      name,
      isPlayerHand: false,
      showCardFaces: false,
      allowMultiSelect: false,
      maxCards: 20
    });
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  override toString(): string {
    const selectionInfo = this.hasSelection() ? ` (${this.getSelectionCount()} selected)` : '';
    return `Hand(${this.name}): ${this.size()} cards${selectionInfo}`;
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      isPlayerHand: this.config.isPlayerHand,
      showCardFaces: this.config.showCardFaces,
      selectedCards: this.getSelectedCardIds(),
      selectionCount: this.getSelectionCount()
    };
  }
}
