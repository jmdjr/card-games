// Card System - Main Export Module
export * from './card.types';
export * from './card.definitions';
export * from './deck/deck.manager';

// Quick access exports for common use cases
export { 
  DICE_CARDS, 
  UNO_CARDS, 
  PLAYING_CARDS, 
  SPECIAL_CARDS, 
  ALL_DEFINED_CARDS 
} from './card.definitions';

export { 
  Deck, 
  DeckFactory, 
  GameSession,
  GAME_CONFIGS 
} from './deck/deck.manager';

export {
  CardType,
  CardSuit,
  CardColor,
  CardValue,
  DiceValue
} from './card.types';


/**
 * A Card System for Phaser
 * Cards are individual collections of properties that are used in various games.
 * Piles are any targetable group of cards.
 *  - Piles can be shuffled, drawn from, and manipulated. Piles start off empty.
 * Decks are a Pile of cards, but with a defined starting set of cards.
 *  - Decks are the initial source of cards for a game.
 *  - Decks can recall all cards back to themselves.
 *     - this is done by tracking cards via a discard collection.
 * 
 * Hands are a Pile of cards held by players.
 *  - Hands are the cards that players can see and play.
 *  - Hands can be hidden or revealed.
 * 
 * A Pile, Deck, or Hand should be interchangeable, logically. the only difference
 *  between them is how they are used in a game.  Rules should control how cards are used
 *  between these components.
 *
 * All of these components have UI equivalents that utilize Phaser for rendering.
 * 
 * 
  */