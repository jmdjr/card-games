// Card Definitions - Maps kenny_cards assets to card properties
import { 
  CardType, 
  CardSuit, 
  CardColor, 
  CardValue, 
  DiceValue, 
  CardProperties 
} from './card.types';
import * as KennyCards from '../../../../assets/game/art/kenny_cards/kenny_cards.data';

// =============================================================================
// CARD FACTORY FUNCTIONS
// =============================================================================

function createPlayingCard(
  assetKey: string, 
  suit: CardSuit, 
  value: CardValue, 
  displayName: string
): CardProperties {
  const color = (suit === CardSuit.HEARTS || suit === CardSuit.DIAMONDS) ? CardColor.RED : CardColor.BLACK;
  
  return {
    id: `playing_${suit}_${value}`,
    assetKey,
    type: CardType.PLAYING_CARD,
    suit,
    color,
    value,
    displayName,
    shortName: displayName,
    isPlayable: true,
    isSpecial: false,
    canStack: false
  };
}

function createUnoCard(
  assetKey: string, 
  color: CardColor, 
  value: CardValue, 
  displayName: string,
  isSpecial: boolean = false
): CardProperties {
  return {
    id: `uno_${color}_${value}`,
    assetKey,
    type: CardType.UNO_CARD,
    suit: CardSuit.NONE,
    color,
    value,
    displayName,
    shortName: displayName,
    isPlayable: true,
    isSpecial,
    canStack: isSpecial
  };
}

function createDice(
  assetKey: string, 
  value: DiceValue, 
  displayName: string,
  isDecorated: boolean = false
): CardProperties {
  return {
    id: `dice_${isDecorated ? 'decorated_' : ''}${value}`,
    assetKey,
    type: CardType.DICE,
    suit: CardSuit.NONE,
    color: CardColor.NONE,
    value,
    displayName,
    shortName: displayName,
    isPlayable: true,
    isSpecial: value === DiceValue.EMPTY || value === DiceValue.QUESTION,
    canStack: false
  };
}

function createSpecialCard(
  assetKey: string, 
  type: CardType, 
  displayName: string
): CardProperties {
  return {
    id: `special_${assetKey}`,
    assetKey,
    type,
    suit: CardSuit.NONE,
    color: CardColor.NONE,
    value: CardValue.EMPTY,
    displayName,
    shortName: displayName,
    isPlayable: false,
    isSpecial: true,
    canStack: false
  };
}

// =============================================================================
// CARD DEFINITIONS
// =============================================================================

// DICE CARDS
export const DICE_CARDS: CardProperties[] = [
  // Basic Dice
  createDice(KennyCards.DICE_1, DiceValue.ONE, "Dice 1"),
  createDice(KennyCards.DICE_2, DiceValue.TWO, "Dice 2"),
  createDice(KennyCards.DICE_3, DiceValue.THREE, "Dice 3"),
  createDice(KennyCards.DICE_4, DiceValue.FOUR, "Dice 4"),
  createDice(KennyCards.DICE_5, DiceValue.FIVE, "Dice 5"),
  createDice(KennyCards.DICE_6, DiceValue.SIX, "Dice 6"),
  
  // Decorated Dice
  createDice(KennyCards.DICE_DECORATED_1, DiceValue.ONE, "Decorated Dice 1", true),
  createDice(KennyCards.DICE_DECORATED_2, DiceValue.TWO, "Decorated Dice 2", true),
  createDice(KennyCards.DICE_DECORATED_3, DiceValue.THREE, "Decorated Dice 3", true),
  createDice(KennyCards.DICE_DECORATED_4, DiceValue.FOUR, "Decorated Dice 4", true),
  createDice(KennyCards.DICE_DECORATED_5, DiceValue.FIVE, "Decorated Dice 5", true),
  createDice(KennyCards.DICE_DECORATED_6, DiceValue.SIX, "Decorated Dice 6", true),
  
  // Special Dice
  createDice(KennyCards.DICE_EMPTY, DiceValue.EMPTY, "Empty Dice"),
  createDice(KennyCards.DICE_QUESTION, DiceValue.QUESTION, "Question Dice"),
  createDice(KennyCards.DICE_DECORATED_EMPTY, DiceValue.EMPTY, "Decorated Empty Dice", true),
  createDice(KennyCards.DICE_DECORATED_QUESTION, DiceValue.QUESTION, "Decorated Question Dice", true),
];

// UNO-STYLE COLOR CARDS
export const UNO_CARDS: CardProperties[] = [
  // Green Cards
  createUnoCard(KennyCards.COLOR_GREEN_0, CardColor.GREEN, CardValue.ZERO, "Green 0"),
  createUnoCard(KennyCards.COLOR_GREEN_1, CardColor.GREEN, CardValue.ONE, "Green 1"),
  createUnoCard(KennyCards.COLOR_GREEN_2, CardColor.GREEN, CardValue.TWO, "Green 2"),
  createUnoCard(KennyCards.COLOR_GREEN_3, CardColor.GREEN, CardValue.THREE, "Green 3"),
  createUnoCard(KennyCards.COLOR_GREEN_4, CardColor.GREEN, CardValue.FOUR, "Green 4"),
  createUnoCard(KennyCards.COLOR_GREEN_5, CardColor.GREEN, CardValue.FIVE, "Green 5"),
  createUnoCard(KennyCards.COLOR_GREEN_6, CardColor.GREEN, CardValue.SIX, "Green 6"),
  createUnoCard(KennyCards.COLOR_GREEN_7, CardColor.GREEN, CardValue.SEVEN, "Green 7"),
  createUnoCard(KennyCards.COLOR_GREEN_8, CardColor.GREEN, CardValue.EIGHT, "Green 8"),
  createUnoCard(KennyCards.COLOR_GREEN_9, CardColor.GREEN, CardValue.NINE, "Green 9"),
  createUnoCard(KennyCards.COLOR_GREEN_DRAW, CardColor.GREEN, CardValue.DRAW_TWO, "Green Draw Two", true),
  createUnoCard(KennyCards.COLOR_GREEN_REVERSE, CardColor.GREEN, CardValue.REVERSE, "Green Reverse", true),
  createUnoCard(KennyCards.COLOR_GREEN_SKIP, CardColor.GREEN, CardValue.SKIP, "Green Skip", true),
  
  // Red Cards
  createUnoCard(KennyCards.COLOR_RED_0, CardColor.RED, CardValue.ZERO, "Red 0"),
  createUnoCard(KennyCards.COLOR_RED_1, CardColor.RED, CardValue.ONE, "Red 1"),
  createUnoCard(KennyCards.COLOR_RED_2, CardColor.RED, CardValue.TWO, "Red 2"),
  createUnoCard(KennyCards.COLOR_RED_3, CardColor.RED, CardValue.THREE, "Red 3"),
  createUnoCard(KennyCards.COLOR_RED_4, CardColor.RED, CardValue.FOUR, "Red 4"),
  createUnoCard(KennyCards.COLOR_RED_5, CardColor.RED, CardValue.FIVE, "Red 5"),
  createUnoCard(KennyCards.COLOR_RED_6, CardColor.RED, CardValue.SIX, "Red 6"),
  createUnoCard(KennyCards.COLOR_RED_7, CardColor.RED, CardValue.SEVEN, "Red 7"),
  createUnoCard(KennyCards.COLOR_RED_8, CardColor.RED, CardValue.EIGHT, "Red 8"),
  createUnoCard(KennyCards.COLOR_RED_9, CardColor.RED, CardValue.NINE, "Red 9"),
  createUnoCard(KennyCards.COLOR_RED_DRAW, CardColor.RED, CardValue.DRAW_TWO, "Red Draw Two", true),
  createUnoCard(KennyCards.COLOR_RED_REVERSE, CardColor.RED, CardValue.REVERSE, "Red Reverse", true),
  createUnoCard(KennyCards.COLOR_RED_SKIP, CardColor.RED, CardValue.SKIP, "Red Skip", true),
  
  // Yellow Cards
  createUnoCard(KennyCards.COLOR_YELLOW_0, CardColor.YELLOW, CardValue.ZERO, "Yellow 0"),
  createUnoCard(KennyCards.COLOR_YELLOW_1, CardColor.YELLOW, CardValue.ONE, "Yellow 1"),
  createUnoCard(KennyCards.COLOR_YELLOW_2, CardColor.YELLOW, CardValue.TWO, "Yellow 2"),
  createUnoCard(KennyCards.COLOR_YELLOW_3, CardColor.YELLOW, CardValue.THREE, "Yellow 3"),
  createUnoCard(KennyCards.COLOR_YELLOW_4, CardColor.YELLOW, CardValue.FOUR, "Yellow 4"),
  createUnoCard(KennyCards.COLOR_YELLOW_5, CardColor.YELLOW, CardValue.FIVE, "Yellow 5"),
  createUnoCard(KennyCards.COLOR_YELLOW_6, CardColor.YELLOW, CardValue.SIX, "Yellow 6"),
  createUnoCard(KennyCards.COLOR_YELLOW_7, CardColor.YELLOW, CardValue.SEVEN, "Yellow 7"),
  createUnoCard(KennyCards.COLOR_YELLOW_8, CardColor.YELLOW, CardValue.EIGHT, "Yellow 8"),
  createUnoCard(KennyCards.COLOR_YELLOW_9, CardColor.YELLOW, CardValue.NINE, "Yellow 9"),
  createUnoCard(KennyCards.COLOR_YELLOW_DRAW, CardColor.YELLOW, CardValue.DRAW_TWO, "Yellow Draw Two", true),
  createUnoCard(KennyCards.COLOR_YELLOW_REVERSE, CardColor.YELLOW, CardValue.REVERSE, "Yellow Reverse", true),
  createUnoCard(KennyCards.COLOR_YELLOW_SKIP, CardColor.YELLOW, CardValue.SKIP, "Yellow Skip", true),
  
  // Purple Cards
  createUnoCard(KennyCards.COLOR_PURPLE_0, CardColor.PURPLE, CardValue.ZERO, "Purple 0"),
  createUnoCard(KennyCards.COLOR_PURPLE_1, CardColor.PURPLE, CardValue.ONE, "Purple 1"),
  createUnoCard(KennyCards.COLOR_PURPLE_2, CardColor.PURPLE, CardValue.TWO, "Purple 2"),
  createUnoCard(KennyCards.COLOR_PURPLE_3, CardColor.PURPLE, CardValue.THREE, "Purple 3"),
  createUnoCard(KennyCards.COLOR_PURPLE_4, CardColor.PURPLE, CardValue.FOUR, "Purple 4"),
  createUnoCard(KennyCards.COLOR_PURPLE_5, CardColor.PURPLE, CardValue.FIVE, "Purple 5"),
  createUnoCard(KennyCards.COLOR_PURPLE_6, CardColor.PURPLE, CardValue.SIX, "Purple 6"),
  createUnoCard(KennyCards.COLOR_PURPLE_7, CardColor.PURPLE, CardValue.SEVEN, "Purple 7"),
  createUnoCard(KennyCards.COLOR_PURPLE_8, CardColor.PURPLE, CardValue.EIGHT, "Purple 8"),
  createUnoCard(KennyCards.COLOR_PURPLE_9, CardColor.PURPLE, CardValue.NINE, "Purple 9"),
  createUnoCard(KennyCards.COLOR_PURPLE_DRAW, CardColor.PURPLE, CardValue.DRAW_TWO, "Purple Draw Two", true),
  createUnoCard(KennyCards.COLOR_PURPLE_REVERSE, CardColor.PURPLE, CardValue.REVERSE, "Purple Reverse", true),
  createUnoCard(KennyCards.COLOR_PURPLE_SKIP, CardColor.PURPLE, CardValue.SKIP, "Purple Skip", true),
  
  // Wild Cards
  createUnoCard(KennyCards.COLOR_WILD, CardColor.WILD, CardValue.WILD, "Wild Card", true),
];

// PLAYING CARDS (Traditional 52-card deck)
export const PLAYING_CARDS: CardProperties[] = [
  // Clubs
  createPlayingCard(KennyCards.CARD_CLUBS_A, CardSuit.CLUBS, CardValue.ACE, "Ace of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_02, CardSuit.CLUBS, CardValue.TWO, "2 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_03, CardSuit.CLUBS, CardValue.THREE, "3 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_04, CardSuit.CLUBS, CardValue.FOUR, "4 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_05, CardSuit.CLUBS, CardValue.FIVE, "5 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_06, CardSuit.CLUBS, CardValue.SIX, "6 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_07, CardSuit.CLUBS, CardValue.SEVEN, "7 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_08, CardSuit.CLUBS, CardValue.EIGHT, "8 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_09, CardSuit.CLUBS, CardValue.NINE, "9 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_10, CardSuit.CLUBS, CardValue.TEN, "10 of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_J, CardSuit.CLUBS, CardValue.JACK, "Jack of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_Q, CardSuit.CLUBS, CardValue.QUEEN, "Queen of Clubs"),
  createPlayingCard(KennyCards.CARD_CLUBS_K, CardSuit.CLUBS, CardValue.KING, "King of Clubs"),
  
  // Diamonds
  createPlayingCard(KennyCards.CARD_DIAMONDS_A, CardSuit.DIAMONDS, CardValue.ACE, "Ace of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_02, CardSuit.DIAMONDS, CardValue.TWO, "2 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_03, CardSuit.DIAMONDS, CardValue.THREE, "3 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_04, CardSuit.DIAMONDS, CardValue.FOUR, "4 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_05, CardSuit.DIAMONDS, CardValue.FIVE, "5 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_06, CardSuit.DIAMONDS, CardValue.SIX, "6 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_07, CardSuit.DIAMONDS, CardValue.SEVEN, "7 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_08, CardSuit.DIAMONDS, CardValue.EIGHT, "8 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_09, CardSuit.DIAMONDS, CardValue.NINE, "9 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_10, CardSuit.DIAMONDS, CardValue.TEN, "10 of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_J, CardSuit.DIAMONDS, CardValue.JACK, "Jack of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_Q, CardSuit.DIAMONDS, CardValue.QUEEN, "Queen of Diamonds"),
  createPlayingCard(KennyCards.CARD_DIAMONDS_K, CardSuit.DIAMONDS, CardValue.KING, "King of Diamonds"),

  // Hearts
  createPlayingCard(KennyCards.CARD_HEARTS_A, CardSuit.HEARTS, CardValue.ACE, "Ace of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_02, CardSuit.HEARTS, CardValue.TWO, "2 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_03, CardSuit.HEARTS, CardValue.THREE, "3 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_04, CardSuit.HEARTS, CardValue.FOUR, "4 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_05, CardSuit.HEARTS, CardValue.FIVE, "5 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_06, CardSuit.HEARTS, CardValue.SIX, "6 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_07, CardSuit.HEARTS, CardValue.SEVEN, "7 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_08, CardSuit.HEARTS, CardValue.EIGHT, "8 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_09, CardSuit.HEARTS, CardValue.NINE, "9 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_10, CardSuit.HEARTS, CardValue.TEN, "10 of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_J, CardSuit.HEARTS, CardValue.JACK, "Jack of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_Q, CardSuit.HEARTS, CardValue.QUEEN, "Queen of Hearts"),
  createPlayingCard(KennyCards.CARD_HEARTS_K, CardSuit.HEARTS, CardValue.KING, "King of Hearts"),

  // Spades
  createPlayingCard(KennyCards.CARD_SPADES_A, CardSuit.SPADES, CardValue.ACE, "Ace of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_02, CardSuit.SPADES, CardValue.TWO, "2 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_03, CardSuit.SPADES, CardValue.THREE, "3 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_04, CardSuit.SPADES, CardValue.FOUR, "4 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_05, CardSuit.SPADES, CardValue.FIVE, "5 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_06, CardSuit.SPADES, CardValue.SIX, "6 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_07, CardSuit.SPADES, CardValue.SEVEN, "7 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_08, CardSuit.SPADES, CardValue.EIGHT, "8 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_09, CardSuit.SPADES, CardValue.NINE, "9 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_10, CardSuit.SPADES, CardValue.TEN, "10 of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_J, CardSuit.SPADES, CardValue.JACK, "Jack of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_Q, CardSuit.SPADES, CardValue.QUEEN, "Queen of Spades"),
  createPlayingCard(KennyCards.CARD_SPADES_K, CardSuit.SPADES, CardValue.KING, "King of Spades"),
];

// JOKERS AND SPECIAL CARDS
export const SPECIAL_CARDS: CardProperties[] = [
  // Jokers
  {
    id: 'joker_black',
    assetKey: KennyCards.CARD_JOKER_BLACK,
    type: CardType.JOKER,
    suit: CardSuit.NONE,
    color: CardColor.BLACK,
    value: CardValue.WILD,
    displayName: "Black Joker",
    shortName: "Joker",
    isPlayable: true,
    isSpecial: true,
    canStack: false
  },
  {
    id: 'joker_red',
    assetKey: KennyCards.CARD_JOKER_RED,
    type: CardType.JOKER,
    suit: CardSuit.NONE,
    color: CardColor.RED,
    value: CardValue.WILD,
    displayName: "Red Joker",
    shortName: "Joker",
    isPlayable: true,
    isSpecial: true,
    canStack: false
  },
  
  // Utility Cards
  createSpecialCard(KennyCards.CARD_BACK, CardType.SPECIAL, "Card Back"),
  createSpecialCard(KennyCards.CARD_EMPTY, CardType.SPECIAL, "Empty Card"),
  createSpecialCard(KennyCards.COLOR_BACK, CardType.SPECIAL, "Color Card Back"),
  createSpecialCard(KennyCards.COLOR_EMPTY, CardType.SPECIAL, "Empty Color Card"),
];

// =============================================================================
// MASTER CARD REGISTRY
// =============================================================================

export const ALL_DEFINED_CARDS: CardProperties[] = [
  ...DICE_CARDS,
  ...UNO_CARDS,
  ...PLAYING_CARDS,
  ...SPECIAL_CARDS
];

// Create lookup maps for efficient card retrieval
export const CARDS_BY_ASSET_KEY = new Map<string, CardProperties>();
export const CARDS_BY_ID = new Map<string, CardProperties>();

// Populate lookup maps
ALL_DEFINED_CARDS.forEach(card => {
  CARDS_BY_ASSET_KEY.set(card.assetKey, card);
  CARDS_BY_ID.set(card.id, card);
});

// Helper functions
export function getCardByAssetKey(assetKey: string): CardProperties | undefined {
  return CARDS_BY_ASSET_KEY.get(assetKey);
}

export function getCardById(id: string): CardProperties | undefined {
  return CARDS_BY_ID.get(id);
}

export function getCardsByType(type: CardType): CardProperties[] {
  return ALL_DEFINED_CARDS.filter(card => card.type === type);
}

export function getCardsBySuit(suit: CardSuit): CardProperties[] {
  return ALL_DEFINED_CARDS.filter(card => card.suit === suit);
}

export function getCardsByColor(color: CardColor): CardProperties[] {
  return ALL_DEFINED_CARDS.filter(card => card.color === color);
}
