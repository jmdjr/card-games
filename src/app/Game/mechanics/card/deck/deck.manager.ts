// Card Game System - Deck Management
import { CardProperties, CardType, CardGameConfig } from '../card.types';
import { 
  ALL_DEFINED_CARDS, 
  DICE_CARDS, 
  UNO_CARDS, 
  PLAYING_CARDS, 
  SPECIAL_CARDS,
  getCardsByType,
  getCardsBySuit,
  getCardsByColor
} from '../card.definitions';
import { Pile } from '../pile/pile.manager';

export class Deck extends Pile {

  // Tracks cards that have been removed from the deck
  private discardPile: CardProperties[] = [];
  
  public readonly name: string;
  public readonly deckType: DECK_TYPE;

  constructor(name: string, deckType: DECK_TYPE, cards: CardProperties[] = []) {
    super();
    this.name = name;
    this.deckType = deckType;
    this.cards = [...cards];
  }

  discard(card: CardProperties): void {
    this.discardPile.unshift(card);
  }

  getTopDiscard(): CardProperties | null {
    return this.discardPile[0] || null;
  }

  reshuffleDiscard(includeTop: boolean = true): void {
    // Keep the top discard card, reshuffle the rest back into deck
    const topDiscard = includeTop ? this.discardPile.shift() : null;
    this.cards.push(...this.discardPile);
    this.discardPile = topDiscard ? [topDiscard] : [];
    this.shuffle();
  }

  discardSize(): number {
    return this.discardPile.length;
  }

  reset(): void {
    this.cards.push(...this.discardPile);
    this.discardPile = [];
  }
}

// =============================================================================
// PREDEFINED DECK FACTORIES
// =============================================================================

export class DeckFactory {
  // Standard 52-card playing deck
  static createStandardDeck(): Deck {
    const deck = new Deck("Standard 52-Card Deck", DECK_TYPE.POKER);
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
    const deck = new Deck("UNO Deck", DECK_TYPE.UNO);
    deck.addCards(UNO_CARDS);
    return deck;
  }

  // Dice set
  static createDiceSet(): Deck {
    const deck = new Deck("Dice Set", DECK_TYPE.DICE_GAME);
    deck.addCards(DICE_CARDS);
    return deck;
  }

  // Custom deck builder
  static createCustomDeck(
    name: string,
    deckType: DECK_TYPE,
    cardTypes: CardType[] = [],
  ): Deck {
    const deck = new Deck(name, deckType);
    
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
export enum DECK_TYPE {
  POKER = 'poker',
  UNO = 'uno',
  DICE_GAME = 'dice_game'
}

export enum GAME_TYPE {
  POKER = 'poker',
  BLACKJACK = 'blackjack',
  UNO = 'uno',
  DICE_GAME = 'dice_game',
}

export const GAME_CONFIGS: { [key in GAME_TYPE]: CardGameConfig } = {
  [GAME_TYPE.POKER]: {
    name: "Poker",
    supportedCardTypes: [CardType.PLAYING_CARD],
    deckSize: 52,
    maxPlayers: 10,
    minPlayers: 2,

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
      hands[player] = this.deck.removeCards(cardsPerPlayer);
    });
    
    return hands;
  }
}
