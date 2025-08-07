// Deck Manager - A Pile that starts with cards and provides deck-specific operations
import { Pile, PileConfig, PILE_EVENTS } from '../pile/pile.manager';
import { CardProperties } from '../card.types';
import { ALL_DEFINED_CARDS, PLAYING_CARDS, DICE_CARDS, UNO_CARDS } from '../card.definitions';

export enum DECK_TYPE {
  STANDARD = 'standard',
  DICE = 'dice', 
  UNO = 'uno',
  CUSTOM = 'custom'
}

export enum GAME_TYPE {
  POKER = 'poker',
  UNO = 'uno',
  BLACKJACK = 'blackjack',
  CUSTOM = 'custom'
}

export interface DeckConfig extends PileConfig {
  deckType: DECK_TYPE;
  includeJokers?: boolean;
  autoShuffle?: boolean;
}

// Deck Events (extends Pile events)
export const DECK_EVENTS = {
  ...PILE_EVENTS,
  DECK_CREATED: 'deckCreated',
  DECK_RESET: 'deckReset',
  CARD_DRAWN: 'cardDrawn',
  CARDS_DRAWN: 'cardsDrawn'
} as const;

export interface DeckCardDrawnEvent {
  card: CardProperties;
  deck: Deck;
  remainingCards: number;
  timestamp: number;
}

export interface DeckCardsDrawnEvent {
  cards: CardProperties[];
  deck: Deck;
  remainingCards: number;
  timestamp: number;
}

export class Deck extends Pile {
  public readonly deckType: DECK_TYPE;
  private readonly originalCards: CardProperties[];
  protected override readonly config: DeckConfig;

  constructor(config: DeckConfig, initialCards?: CardProperties[]) {
    super(config);
    this.deckType = config.deckType;
    this.config = { autoShuffle: true, includeJokers: false, ...config };
    
    // Set up initial cards
    if (initialCards) {
      this.originalCards = [...initialCards];
    } else {
      this.originalCards = this.getDefaultCardsForType(config.deckType);
    }
    
    // Add initial cards to pile
    this.addCards([...this.originalCards]);
    
    // Auto shuffle if configured
    if (this.config.autoShuffle) {
      this.shuffle();
    }

    this.emit(DECK_EVENTS.DECK_CREATED, { 
      deck: this, 
      cardCount: this.size(),
      deckType: this.deckType,
      timestamp: Date.now() 
    });
  }

  // =========================================================================
  // DECK-SPECIFIC OPERATIONS
  // =========================================================================

  draw(): CardProperties | null {
    const card = this.removeCard(); // Remove from top
    
    if (card) {
      const event: DeckCardDrawnEvent = {
        card,
        deck: this,
        remainingCards: this.size(),
        timestamp: Date.now()
      };
      
      this.emit(DECK_EVENTS.CARD_DRAWN, event);
    }
    
    return card;
  }

  drawMultiple(count: number): CardProperties[] {
    const drawnCards: CardProperties[] = [];
    
    for (let i = 0; i < count && !this.isEmpty(); i++) {
      const card = this.removeCard();
      if (card) {
        drawnCards.push(card);
      }
    }

    if (drawnCards.length > 0) {
      const event: DeckCardsDrawnEvent = {
        cards: drawnCards,
        deck: this,
        remainingCards: this.size(),
        timestamp: Date.now()
      };
      
      this.emit(DECK_EVENTS.CARDS_DRAWN, event);
    }

    return drawnCards;
  }

  reset(): void {
    this.clear();
    this.addCards([...this.originalCards]);
    
    if (this.config.autoShuffle) {
      this.shuffle();
    }

    this.emit(DECK_EVENTS.DECK_RESET, { 
      deck: this, 
      cardCount: this.size(),
      timestamp: Date.now() 
    });
  }

  // =========================================================================
  // DECK FACTORY METHODS
  // =========================================================================

  private getDefaultCardsForType(deckType: DECK_TYPE): CardProperties[] {
    switch (deckType) {
      case DECK_TYPE.STANDARD:
        return [...PLAYING_CARDS]; // Add jokers if configured
      case DECK_TYPE.DICE:
        return [...DICE_CARDS];
      case DECK_TYPE.UNO:
        return [...UNO_CARDS];
      case DECK_TYPE.CUSTOM:
      default:
        return [];
    }
  }

  static createStandardDeck(config?: Partial<DeckConfig>): Deck {
    return new Deck({
      id: config?.id || 'standard-deck',
      name: config?.name || 'Standard Playing Cards',
      deckType: DECK_TYPE.STANDARD,
      ...config
    });
  }

  static createDiceDeck(config?: Partial<DeckConfig>): Deck {
    return new Deck({
      id: config?.id || 'dice-deck',
      name: config?.name || 'Dice Cards',
      deckType: DECK_TYPE.DICE,
      ...config
    });
  }

  static createUnoDeck(config?: Partial<DeckConfig>): Deck {
    return new Deck({
      id: config?.id || 'uno-deck', 
      name: config?.name || 'UNO Cards',
      deckType: DECK_TYPE.UNO,
      ...config
    });
  }

  static createCustomDeck(cards: CardProperties[], config?: Partial<DeckConfig>): Deck {
    return new Deck({
      id: config?.id || 'custom-deck',
      name: config?.name || 'Custom Deck',
      deckType: DECK_TYPE.CUSTOM,
      ...config
    }, cards);
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  getOriginalCards(): readonly CardProperties[] {
    return [...this.originalCards];
  }

  getOriginalCardCount(): number {
    return this.originalCards.length;
  }

  override toString(): string {
    return `Deck(${this.name}): ${this.size()}/${this.getOriginalCardCount()} cards`;
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      deckType: this.deckType,
      originalCardCount: this.getOriginalCardCount(),
      remainingCards: this.size()
    };
  }
}

// Export factory class for convenience
export class DeckFactory {
  static createStandardDeck(): Deck {
    return Deck.createStandardDeck();
  }

  static createDiceDeck(): Deck {
    return Deck.createDiceDeck();
  }

  static createUnoDeck(): Deck {
    return Deck.createUnoDeck();
  }

  static createCustomDeck(cards: CardProperties[]): Deck {
    return Deck.createCustomDeck(cards);
  }
}
