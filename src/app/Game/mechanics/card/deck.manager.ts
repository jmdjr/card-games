// Card Game System - Deck Management
import { CardProperties, GameDeck, CardType, CardGameConfig } from './card.types';
import { 
  ALL_DEFINED_CARDS, 
  DICE_CARDS, 
  UNO_CARDS, 
  PLAYING_CARDS, 
  SPECIAL_CARDS,
  getCardsByType,
  getCardsBySuit,
  getCardsByColor
} from './card.definitions';

export class Deck {
  private cards: CardProperties[] = [];
  private discardPile: CardProperties[] = [];
  public readonly name: string;
  public readonly gameType: GAME_TYPE;

  constructor(name: string, gameType: GAME_TYPE, cards: CardProperties[] = []) {
    this.name = name;
    this.gameType = gameType;
    this.cards = [...cards];
  }

  // Basic deck operations
  addCard(card: CardProperties): void {
    this.cards.push(card);
  }

  addCards(cards: CardProperties[]): void {
    this.cards.push(...cards);
  }

  drawCard(): CardProperties | null {
    return this.cards.pop() || null;
  }

  drawCards(count: number): CardProperties[] {
    const drawn: CardProperties[] = [];
    for (let i = 0; i < count && this.cards.length > 0; i++) {
      const card = this.drawCard();
      if (card) drawn.push(card);
    }
    return drawn;
  }

  peek(): CardProperties | null {
    return this.cards[this.cards.length - 1] || null;
  }

  peekMultiple(count: number): CardProperties[] {
    return this.cards.slice(-count);
  }

  // Deck manipulation
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  cut(position?: number): void {
    const cutPoint = position || Math.floor(Math.random() * this.cards.length);
    const topHalf = this.cards.slice(0, cutPoint);
    const bottomHalf = this.cards.slice(cutPoint);
    this.cards = [...bottomHalf, ...topHalf];
  }

  // Discard pile management
  discard(card: CardProperties): void {
    this.discardPile.push(card);
  }

  getTopDiscard(): CardProperties | null {
    return this.discardPile[this.discardPile.length - 1] || null;
  }

  reshuffleDiscard(): void {
    // Keep the top discard card, reshuffle the rest back into deck
    const topDiscard = this.discardPile.pop();
    this.cards.push(...this.discardPile);
    this.discardPile = topDiscard ? [topDiscard] : [];
    this.shuffle();
  }

  // Deck information
  size(): number {
    return this.cards.length;
  }

  discardSize(): number {
    return this.discardPile.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  reset(): void {
    this.cards.push(...this.discardPile);
    this.discardPile = [];
  }

  // Search and filter
  contains(cardId: string): boolean {
    return this.cards.some(card => card.id === cardId);
  }

  findCard(cardId: string): CardProperties | null {
    return this.cards.find(card => card.id === cardId) || null;
  }

  getCards(): CardProperties[] {
    return [...this.cards];
  }

  getCardsByType(type: CardType): CardProperties[] {
    return this.cards.filter(card => card.type === type);
  }
}

// =============================================================================
// PREDEFINED DECK FACTORIES
// =============================================================================

export class DeckFactory {
  // Standard 52-card playing deck
  static createStandardDeck(): Deck {
    const deck = new Deck("Standard 52-Card Deck", GAME_TYPE.POKER);
    deck.addCards(PLAYING_CARDS);
    return deck;
  }

  // Standard deck with jokers
  static createStandardDeckWithJokers(): Deck {
    const deck = DeckFactory.createStandardDeck();
    deck.addCards(SPECIAL_CARDS.filter(card => card.type === CardType.JOKER));
    return deck;
  }

  // UNO deck
  static createUnoDeck(): Deck {
    const deck = new Deck("UNO Deck", GAME_TYPE.UNO);
    deck.addCards(UNO_CARDS);
    return deck;
  }

  // Dice set
  static createDiceSet(): Deck {
    const deck = new Deck("Dice Set", GAME_TYPE.DICE_GAME);
    deck.addCards(DICE_CARDS);
    return deck;
  }

  // Custom deck builder
  static createCustomDeck(
    name: string, 
    gameType: GAME_TYPE, 
    cardTypes: CardType[] = []
  ): Deck {
    const deck = new Deck(name, gameType);
    
    cardTypes.forEach(type => {
      const cards = getCardsByType(type);
      deck.addCards(cards);
    });
    
    return deck;
  }
}

// =============================================================================
// GAME CONFIGURATIONS
// =============================================================================
export enum GAME_TYPE {
  POKER = 'poker',
  BLACKJACK = 'blackjack',
  UNO = 'uno',
  DICE_GAME = 'dice_game',
  DISCARD_PILE = 'discard_pile'
}

export const GAME_CONFIGS: { [key in GAME_TYPE]: CardGameConfig } = {
  [GAME_TYPE.POKER]: {
    name: "Poker",
    supportedCardTypes: [CardType.PLAYING_CARD],
    deckSize: 52,
    maxPlayers: 10,
    minPlayers: 2
  },
  [GAME_TYPE.BLACKJACK]: {
    name: "Blackjack",
    supportedCardTypes: [CardType.PLAYING_CARD],
    deckSize: 52,
    maxPlayers: 7,
    minPlayers: 1
  },

  [GAME_TYPE.UNO]: {
    name: "UNO",
    supportedCardTypes: [CardType.UNO_CARD],
    deckSize: 108,
    maxPlayers: 10,
    minPlayers: 2
  },

  [GAME_TYPE.DICE_GAME]: {
    name: "Dice Game",
    supportedCardTypes: [CardType.DICE],
    deckSize: 16,
    maxPlayers: 6,
    minPlayers: 1
  },

  [GAME_TYPE.DISCARD_PILE]: {
    name: "Discard Pile",
    supportedCardTypes: [CardType.PLAYING_CARD, CardType.UNO_CARD, CardType.JOKER, CardType.SPECIAL],
    deckSize: 0, // Discard pile has no fixed size
    maxPlayers: 1,
    minPlayers: 1
  }
};

// =============================================================================
// GAME SESSION MANAGER
// =============================================================================

export class GameSession {
  public readonly gameConfig: CardGameConfig;
  public readonly deck: Deck;
  public readonly players: string[] = [];
  public currentPlayerIndex: number = 0;
  
  constructor(gameType: GAME_TYPE, playerNames: string[] = []) {
    this.gameConfig = GAME_CONFIGS[gameType];
    if (!this.gameConfig) {
      throw new Error(`Unknown game type: ${gameType}`);
    }
    
    // Validate player count
    if (playerNames.length < this.gameConfig.minPlayers || 
        playerNames.length > this.gameConfig.maxPlayers) {
      throw new Error(
        `Invalid player count. Game requires ${this.gameConfig.minPlayers}-${this.gameConfig.maxPlayers} players`
      );
    }
    
    this.players = [...playerNames];
    this.deck = this.createGameDeck(gameType);
  }

  private createGameDeck(gameType: GAME_TYPE): Deck {
    switch (gameType) {
      case GAME_TYPE.POKER:
      case GAME_TYPE.BLACKJACK:
        return DeckFactory.createStandardDeck();
      case GAME_TYPE.UNO:
        return DeckFactory.createUnoDeck();
      case GAME_TYPE.DICE_GAME:
        return DeckFactory.createDiceSet();
      default:
        return DeckFactory.createCustomDeck(
          `${gameType} deck`, 
          gameType, 
          this.gameConfig.supportedCardTypes
        );
    }
  }
  
  startGame(): void {
    this.deck.shuffle();
    this.currentPlayerIndex = 0;
  }
  
  nextPlayer(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }
  
  getCurrentPlayer(): string {
    return this.players[this.currentPlayerIndex];
  }
  
  dealCards(cardsPerPlayer: number): { [playerName: string]: CardProperties[] } {
    const hands: { [playerName: string]: CardProperties[] } = {};
    
    this.players.forEach(player => {
      hands[player] = this.deck.drawCards(cardsPerPlayer);
    });
    
    return hands;
  }
}
