// Core Hand class - Manages a collection of cards for a player or opponent
import Phaser from 'phaser';
import { CardProperties } from '../card.types';
import {
  HandConfig,
  HandState,
  HAND_EVENTS,
  DEFAULT_HAND_CONFIGS
} from './hand.types';
import { GAME_TYPE } from '../deck/deck.manager';
import { Pile } from '../pile/pile.manager';

export class Hand extends Pile {
  private handConfig: HandConfig;

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

  private initializeState(): HandState {
    return {
      selectedCards: [],
      isAnimating: false,
      areCardsRevealed: this.handConfig.showCardFaces,
      isFull: false,
      isEmpty: true
    };
  }

  // =========================================================================
  // CARD MANAGEMENT
  // =========================================================================

  /**
   * Add a card to this hand
   */
  addCard(card: CardProperties, source: string = 'unknown'): boolean {
    if (this.handState.isFull) {
      console.warn(`Hand ${this.handConfig.name} is full, cannot add card`);
      return false;
    }

    this.handState.cards.push(card);
    this.updateState();

    const addEvent: CardAddedEvent = {
      handId: this.handConfig.id,
      card,
      source
    };

    this.emit(HAND_EVENTS.CARD_ADDED, addEvent);
    return true;
  }

  /**
   * Add multiple cards to this hand
   */
  addCards(cards: CardProperties[], source: string = 'unknown'): boolean {
    if (this.handState.cardCount + cards.length > this.handConfig.maxCards) {
      console.warn(`Hand ${this.handConfig.name} cannot fit ${cards.length} more cards`);
      return false;
    }

    cards.forEach(card => {
      this.handState.cards.push(card);
      
      const addEvent: CardAddedEvent = {
        handId: this.handConfig.id,
        card,
        source
      };

      this.emit(HAND_EVENTS.CARD_ADDED, addEvent);
    });

    this.updateState();
    return true;
  }

  /**
   * Remove a specific card from this hand
   */
  removeCard(card: CardProperties, destination: string = 'unknown'): boolean {
    const cardIndex = this.handState.cards.findIndex(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );

    if (cardIndex === -1) {
      console.warn(`Card not found in hand ${this.handConfig.name}`);
      return false;
    }

    const removedCard = this.handState.cards.splice(cardIndex, 1)[0];
    
    // Remove from selection if selected
    this.deselectCard(removedCard);
    
    this.updateState();

    const removeEvent: CardRemovedEvent = {
      handId: this.handConfig.id,
      card: removedCard,
      destination
    };

    this.emit(HAND_EVENTS.CARD_REMOVED, removeEvent);
    return true;
  }

  /**
   * Remove multiple cards from this hand
   */
  removeCards(cards: readonly CardProperties[], destination: string = 'unknown'): boolean {
    const removedCards: CardProperties[] = [];

    for (const card of cards) {
      const cardIndex = this.handState.cards.findIndex(c => 
        c.id === card.id || (c.suit === card.suit && c.value === card.value)
      );

      if (cardIndex !== -1) {
        const removedCard = this.handState.cards.splice(cardIndex, 1)[0];
        removedCards.push(removedCard);
        this.deselectCard(removedCard);

        const removeEvent: CardRemovedEvent = {
          handId: this.handConfig.id,
          card: removedCard,
          destination
        };

        this.emit(HAND_EVENTS.CARD_REMOVED, removeEvent);
      }
    }

    this.updateState();
    return removedCards.length === cards.length;
  }

  /**
   * Clear all cards from this hand
   */
  clear(): CardProperties[] {
    const removedCards = [...this.handState.cards];
    this.handState.cards = [];
    this.handState.selectedCards = [];
    this.updateState();

    removedCards.forEach(card => {
      const removeEvent: CardRemovedEvent = {
        handId: this.handConfig.id,
        card,
        destination: 'cleared'
      };

      this.emit(HAND_EVENTS.CARD_REMOVED, removeEvent);
    });

    return removedCards;
  }

  // =========================================================================
  // CARD SELECTION
  // =========================================================================

  /**
   * Select a card in this hand
   */
  selectCard(card: CardProperties): boolean {
    if (!this.handConfig.canPlay) return false;

    const cardExists = this.handState.cards.some(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );

    if (!cardExists) return false;

    const alreadySelected = this.handState.selectedCards.some(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );

    if (alreadySelected) return false;

    if (!this.handConfig.allowMultiSelect && this.handState.selectedCards.length > 0) {
      // Clear previous selection if multi-select is disabled
      this.handState.selectedCards = [];
    }

    this.handState.selectedCards.push(card);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: [...this.handState.selectedCards]
    });

    return true;
  }

  /**
   * Deselect a card in this hand
   */
  deselectCard(card: CardProperties): boolean {
    const selectedIndex = this.handState.selectedCards.findIndex(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );

    if (selectedIndex === -1) return false;

    this.handState.selectedCards.splice(selectedIndex, 1);
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: [...this.handState.selectedCards]
    });

    return true;
  }

  /**
   * Clear all card selections
   */
  clearSelection(): void {
    this.handState.selectedCards = [];
    this.emit(HAND_EVENTS.SELECTION_CHANGED, {
      handId: this.handConfig.id,
      selectedCards: []
    });
  }

  /**
   * Toggle selection of a card
   */
  toggleCardSelection(card: CardProperties): boolean {
    const isSelected = this.handState.selectedCards.some(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );

    if (isSelected) {
      return this.deselectCard(card);
    } else {
      return this.selectCard(card);
    }
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Play the currently selected cards
   */
  async playSelectedCards(target?: string, context?: any): Promise<boolean> {
    if (!this.handConfig.canPlay || this.handState.selectedCards.length === 0) {
      return false;
    }

    return this.playCards(this.handState.selectedCards, target, context);
  }

  /**
   * Play specific cards from this hand
   */
  async playCards(cards: readonly CardProperties[], target?: string, context?: any): Promise<boolean> {
    if (!this.handConfig.canPlay || cards.length === 0) {
      return false;
    }

    // Check if all cards exist in this hand
    const allCardsExist = cards.every(card => 
      this.handState.cards.some(c => 
        c.id === card.id || (c.suit === card.suit && c.value === card.value)
      )
    );

    if (!allCardsExist) {
      console.warn('Some cards do not exist in this hand');
      return false;
    }

    const playEvent: PlayCardsEvent = {
      handId: this.handConfig.id,
      cards: [...cards],
      target,
      context,
      cancellable: true
    };

    // Emit the event and wait for potential cancellation
    const eventResult = this.emit(HAND_EVENTS.PLAY_CARDS, playEvent);

    // If event was not cancelled, remove the cards
    if (eventResult !== false && playEvent.cancellable) {
      this.removeCards(cards, target || 'played');
      this.clearSelection();
      return true;
    }

    return false;
  }

  /**
   * Request to draw cards from a source
   */
  async drawCards(count: number, source: string): Promise<boolean> {
    if (!this.handConfig.canDraw || count <= 0) {
      return false;
    }

    if (this.handState.cardCount + count > this.handConfig.maxCards) {
      console.warn(`Hand ${this.handConfig.name} cannot draw ${count} cards - would exceed maximum`);
      return false;
    }

    const drawEvent: DrawCardsEvent = {
      handId: this.handConfig.id,
      count,
      source,
      cancellable: true
    };

    // Emit the event and let external handlers manage the actual card transfer
    return this.emit(HAND_EVENTS.DRAW_CARDS, drawEvent) !== false;
  }

  /**
   * Reveal or hide all cards in this hand
   */
  setCardsRevealed(revealed: boolean): void {
    if (this.handState.areCardsRevealed === revealed) return;

    this.handState.areCardsRevealed = revealed;

    const revealEvent: HandRevealEvent = {
      handId: this.handConfig.id,
      revealed
    };

    this.emit(HAND_EVENTS.HAND_REVEALED, revealEvent);
  }

  /**
   * Toggle card revelation
   */
  toggleCardReveal(): void {
    this.setCardsRevealed(!this.handState.areCardsRevealed);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get id(): string {
    return this.handConfig.id;
  }

  get name(): string {
    return this.handConfig.name;
  }

  get cards(): readonly CardProperties[] {
    return this.handState.cards;
  }

  get selectedCards(): readonly CardProperties[] {
    return this.handState.selectedCards;
  }

  get cardCount(): number {
    return this.handState.cardCount;
  }

  get isEmpty(): boolean {
    return this.handState.isEmpty;
  }

  get isFull(): boolean {
    return this.handState.isFull;
  }

  get isPlayerHand(): boolean {
    return this.handConfig.isPlayerHand;
  }

  get areCardsRevealed(): boolean {
    return this.handState.areCardsRevealed;
  }

  get canPlay(): boolean {
    return this.handConfig.canPlay;
  }

  get canDraw(): boolean {
    return this.handConfig.canDraw;
  }

  get config(): HandConfig {
    return { ...this.handConfig };
  }

  get state(): HandState {
    return { ...this.handState };
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Check if this hand contains a specific card
   */
  hasCard(card: CardProperties): boolean {
    return this.handState.cards.some(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );
  }

  /**
   * Check if a card is currently selected
   */
  isCardSelected(card: CardProperties): boolean {
    return this.handState.selectedCards.some(c => 
      c.id === card.id || (c.suit === card.suit && c.value === card.value)
    );
  }

  /**
   * Get cards by suit
   */
  getCardsBySuit(suit: string): CardProperties[] {
    return this.handState.cards.filter(card => card.suit === suit);
  }

  /**
   * Get cards by value
   */
  getCardsByValue(value: number): CardProperties[] {
    return this.handState.cards.filter(card => card.value === value);
  }

  /**
   * Sort cards in hand by value or suit
   */
  sortCards(by: 'value' | 'suit' = 'value'): void {
    this.handState.cards.sort((a, b) => {
      if (by === 'suit') {
        return a.suit.localeCompare(b.suit) || (a.value as number) - (b.value as number);
      } else {
        return (a.value as number) - (b.value as number) || a.suit.localeCompare(b.suit);
      }
    });
  }

  /**
   * Update hand configuration
   */
  updateConfig(newConfig: Partial<HandConfig>): void {
    this.handConfig = { ...this.handConfig, ...newConfig };
    this.updateState();
  }

  // =========================================================================
  // STATIC FACTORY METHODS
  // =========================================================================

  static createPlayerHand(id: string, name: string, gameType: GAME_TYPE): Hand {
    const defaultConfig = DEFAULT_HAND_CONFIGS[gameType]; // Default fallback
    return new Hand(id, name, {
      ...defaultConfig,
      isPlayerHand: true,
      showCardFaces: true
    });
  }

  static createOpponentHand(id: string, name: string, gameType: GAME_TYPE): Hand {
    const defaultConfig = DEFAULT_HAND_CONFIGS[gameType]; // Default fallback
    return new Hand(id, name, {
      ...defaultConfig,
      isPlayerHand: false,
      showCardFaces: false
    });
  }

  override destroy(): void {
    this.removeAllListeners();
    this.handState.cards = [];
    this.handState.selectedCards = [];
  }
}
