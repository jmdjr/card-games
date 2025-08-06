// Card Game System - Type Definitions
export enum CardType {
  DICE = 'dice',
  UNO_CARD = 'uno_card',
  PLAYING_CARD = 'playing_card',
  JOKER = 'joker',
  SPECIAL = 'special'
}

export enum CardSuit {
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds',
  HEARTS = 'hearts',
  SPADES = 'spades',
  NONE = 'none'
}

export enum CardColor {
  RED = 'red',
  BLACK = 'black',
  GREEN = 'green',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  WILD = 'wild',
  NONE = 'none'
}

export enum CardValue {
  // Numeric values
  ZERO = 0,
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  
  // Face cards
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14,
  
  // Special UNO cards
  DRAW_TWO = 20,
  REVERSE = 21,
  SKIP = 22,
  WILD = 23,
  WILD_DRAW_FOUR = 24,
  
  // Special states
  EMPTY = 99,
  QUESTION = 98,
  BACK = 97
}

export enum DiceValue {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  EMPTY = 0,
  QUESTION = -1
}

export interface CardProperties {
  // Core identification
  id: string;
  assetKey: string; // The kenny_cards filename
  backAssetKey?: string; // The kenny_cards back filename.
  
  // Card categorization
  type: CardType;
  suit: CardSuit;
  color: CardColor;
  value: CardValue | DiceValue;
  
  // Display properties
  displayName: string;
  shortName: string;
  
  // Game mechanics
  isPlayable: boolean;
  isSpecial: boolean;
  canStack: boolean;
  
  // Additional metadata
  description?: string;

  // extended properties for custom games
  data?: {
    [key in string]: any; 
  };
  gameRules?: {
    [gameName: string]: any;
  };
}

export interface CardGameConfig {
  name: string;
  supportedCardTypes: CardType[];
  deckSize: number;
  maxPlayers: number;
  minPlayers: number;
}
