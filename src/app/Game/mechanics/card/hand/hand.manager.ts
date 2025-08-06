// Core Hand class - Manages a collection of cards for a player or opponent
import { CardProperties } from '../card.types';
import {
  HandConfig,
  HandState,
  HAND_EVENTS
} from './hand.types';
import { Pile } from '../pile/pile.manager';

export class Hand extends Pile {
  private handConfig: HandConfig;
  private selectedCards: CardProperties[] = [];
  private areCardsRevealed: boolean = false;

  constructor(id: string, name: string, config: Partial<HandConfig> = {}) {
    super();
    this.handConfig = this.mergeWithDefaults(id, name, config);
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  private mergeWithDefaults(id: string, name: string, config: Partial<HandConfig>): HandConfig {
    const defaultConfig = {
      maxCards: 10,
      minCards: 0,
      id,
      name,
      isPlayerHand: true,
      showCardFaces: true,
      canDraw: true,
      canPlay: true,
      allowMultiSelect: true,
      ...config
    };

    return defaultConfig;
  }

  // =========================================================================
  // HAND-SPECIFIC CARD OPERATIONS (extending Pile behavior)
  // =========================================================================

  override addCard(card: CardProperties, source: string = 'unknown'): boolean {
    if (this.isFull) {
      return false;
    }

    super.addCard(card);
    
    // Emit hand-specific event
    this.emit(HAND_EVENTS.CARD_ADDED, {
      handId: this.handConfig.id,
      card,
      source,
      handState: this.getHandState()
    });

    return true;
  }

  override addCards(cards: CardProperties[], source: string = 'unknown'): boolean {
    if (this.size() + cards.length > this.handConfig.maxCards) {
      return false;
    }

    for (const card of cards) {
      super.addCard(card);
      
      // Emit event for each card
      this.emit(HAND_EVENTS.CARD_ADDED, {
        handId: this.handConfig.id,
        card,
        source,
        handState: this.getHandState()
      });
    }

    return true;
  }

  removeSpecificCardByRef(card: CardProperties, destination: string = 'unknown'): boolean {
    // Use base class removeSpecificCard method
    const removedCard = this.removeSpecificCard(card.id);
    if (!removedCard) return false;

    // Remove from selected cards if it was selected
    this.deselectCard(removedCard);

    this.emit(HAND_EVENTS.CARD_REMOVED, {
      handId: this.handConfig.id,
      card: removedCard,
      destination,
      handState: this.getHandState()
    });

    return true;
  }

  removeSelectedCards(destination: string = 'unknown'): CardProperties[] {
    const removedCards = [...this.selectedCards];
    
    for (const card of removedCards) {
      const removedCard = this.removeSpecificCard(card.id);
      if (removedCard) {
        this.emit(HAND_EVENTS.CARD_REMOVED, {
          handId: this.handConfig.id,
          card: removedCard,
          destination,
          handState: this.getHandState()
        });
      }
    }

    this.selectedCards = [];
    return removedCards;
  }

  clear(destination: string = 'discard'): CardProperties[] {
    const removedCards = this.getCards();
    
    // Use the base class method to clear cards
    while (!this.isEmpty()) {
      this.removeCard();
    }
    
    this.selectedCards = [];

    for (const card of removedCards) {
      this.emit(HAND_EVENTS.CARD_REMOVED, {
        handId: this.handConfig.id,
        card,
        destination,
        handState: this.getHandState()
      });
    }

    return removedCards;
  }

  // =========================================================================
  // CARD SELECTION
  // =========================================================================

  selectCard(card: CardProperties): boolean {
    const cardExists = this.contains(card.id);
    if (!cardExists) return false;

    const alreadySelected = this.selectedCards.some(c => c.id === card.id);
    if (alreadySelected) return false;

    if (!this.handConfig.allowMultiSelect && this.selectedCards.length > 0) {
      // Clear existing selections for single-select mode
      this.selectedCards = [];
    }

    this.selectedCards.push(card);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: [...this.selectedCards]
    });

    return true;
  }

  deselectCard(card: CardProperties): boolean {
    const selectedIndex = this.selectedCards.findIndex(c => c.id === card.id);
    if (selectedIndex === -1) return false;

    this.selectedCards.splice(selectedIndex, 1);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: [...this.selectedCards]
    });

    return true;
  }

  clearSelection(): void {
    this.selectedCards = [];
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: []
    });
  }

  // =========================================================================
  // HAND ACTIONS
  // =========================================================================

  playSelectedCards(target?: string, cost?: number): boolean {
    if (!this.handConfig.canPlay || this.selectedCards.length === 0) {
      return false;
    }

    const playEvent = {
      handId: this.handConfig.id,
      cards: [...this.selectedCards],
      target,
      cost
    };

    this.emit(HAND_EVENTS.PLAY_CARDS, playEvent);
    return true;
  }

  drawCards(count: number): boolean {
    if (!this.handConfig.canDraw) {
      return false;
    }

    if (this.size() + count > this.handConfig.maxCards) {
      return false;
    }

    const drawEvent = {
      handId: this.handConfig.id,
      count,
      currentSize: this.size()
    };

    this.emit(HAND_EVENTS.DRAW_CARDS, drawEvent);
    return true;
  }

  // =========================================================================
  // VISIBILITY CONTROL
  // =========================================================================

  setCardsRevealed(revealed: boolean): void {
    if (this.areCardsRevealed === revealed) return;

    this.areCardsRevealed = revealed;
    
    const revealEvent = {
      handId: this.handConfig.id,
      revealed
    };

    this.emit(HAND_EVENTS.HAND_REVEALED, revealEvent);
  }

  reveal(): void {
    this.setCardsRevealed(true);
  }

  hide(): void {
    this.setCardsRevealed(false);
  }

  toggleVisibility(): void {
    this.setCardsRevealed(!this.areCardsRevealed);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get selectedCardIds(): string[] {
    return this.selectedCards.map(c => c.id);
  }

  get getSelectedCards(): readonly CardProperties[] {
    return this.selectedCards;
  }

  get isRevealed(): boolean {
    return this.areCardsRevealed;
  }

  get config(): HandConfig {
    return { ...this.handConfig };
  }

  get isFull(): boolean {
    return this.size() >= this.handConfig.maxCards;
  }

  // Expose cards as readonly for UI using method instead of override
  getDisplayCards(): readonly CardProperties[] {
    return this.getAllCards();
  }

  // Expose id and name for UI compatibility
  get id(): string {
    return this.handConfig.id;
  }

  get name(): string {
    return this.handConfig.name;
  }

  get isPlayerHand(): boolean {
    return this.handConfig.isPlayerHand;
  }

  // =========================================================================
  // HAND STATE
  // =========================================================================

  getHandState(): HandState {
    return {
      selectedCards: [...this.selectedCards],
      isAnimating: false, // TODO: Track animation state
      areCardsRevealed: this.areCardsRevealed,
      isFull: this.isFull,
      isEmpty: this.isEmpty()
    };
  }

  // =========================================================================
  // CARD QUERIES
  // =========================================================================

  hasCard(card: CardProperties): boolean {
    return this.contains(card.id);
  }

  isCardSelected(card: CardProperties): boolean {
    return this.selectedCards.some(c => c.id === card.id);
  }

  getCardsBySuit(suit: string): CardProperties[] {
    return this.getAllCards().filter(card => card.suit === suit);
  }

  getCardsByValue(value: string | number): CardProperties[] {
    return this.getAllCards().filter(card => card.value === value);
  }

  // Add missing methods for UI compatibility
  toggleCardSelection(card: CardProperties): boolean {
    if (this.isCardSelected(card)) {
      return this.deselectCard(card);
    } else {
      return this.selectCard(card);
    }
  }

  // =========================================================================
  // CARD MANIPULATION
  // =========================================================================

  sortCards(compareFn?: (a: CardProperties, b: CardProperties) => number): void {
    // Get mutable copy, sort it, then replace cards
    const sortedCards = this.getCards();
    sortedCards.sort(compareFn || ((a, b) => {
      // Default sort: by suit, then by value
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      
      // Handle numeric and face cards
      const aVal = typeof a.value === 'number' ? a.value : this.getFaceCardValue(a.value);
      const bVal = typeof b.value === 'number' ? b.value : this.getFaceCardValue(b.value);
      
      return aVal - bVal;
    }));

    // Clear and re-add sorted cards
    while (!this.isEmpty()) {
      this.removeCard();
    }
    this.addCards(sortedCards);
  }

  private getFaceCardValue(value: string | number): number {
    if (typeof value === 'number') return value;
    
    const faceValues: { [key: string]: number } = {
      'A': 1, 'J': 11, 'Q': 12, 'K': 13
    };
    
    return faceValues[value] || 0;
  }

  // =========================================================================
  // STATIC FACTORY METHODS
  // =========================================================================

  // Static factory methods for compatibility
  static createPlayerHand(id: string, name: string, gameType?: any): Hand {
    return new Hand(id, name, {
      isPlayerHand: true,
      showCardFaces: true,
      canDraw: true,
      canPlay: true,
      allowMultiSelect: true
    });
  }

  static createOpponentHand(id: string, name: string, gameType?: any): Hand {
    return new Hand(id, name, {
      isPlayerHand: false,
      showCardFaces: false,
      canDraw: false,
      canPlay: false,
      allowMultiSelect: false
    });
  }

  // =========================================================================
  // COMPATIBILITY METHODS
  // =========================================================================

  // Method for playing cards
  playCards(cards: CardProperties[]): boolean {
    // Remove the cards from this hand
    for (const card of cards) {
      this.removeSpecificCard(card.id);
    }

    this.emit(HAND_EVENTS.PLAY_CARDS, {
      handId: this.handConfig.id,
      cards: cards
    });

    return true;
  }

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  override destroy(): void {
    this.selectedCards = [];
    this.removeAllListeners();
  }
}
