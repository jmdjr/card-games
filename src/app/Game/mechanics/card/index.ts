/**
 * A Card System for Phaser
 * Cards are individual collections of properties that are used in various games.
 * Piles are any targetable group of cards.
 *  - Piles can be shuffled, drawn from, and manipulated. Piles start off empty.
 * Decks are a Pile of cards, but with a defined starting set of cards.
 *  - Decks are the initial source of cards for any game.
 *  - Decks can recall all cards back to themselves.
 *     - this is done by tracking cards via a discard collection.
 *     - Decks must emit a global event to recall all cards.
 * 
 * Hands are a Pile of cards.
 *  - Hands can be hidden or revealed.
 * 
 * A Pile, Deck, or Hand should be interchangeable, logically. the only difference
 *  between them is how they are used in a game.  Rules should control how cards are used
 *  between these components.
 * 
 * Tables are the shared space where hands, decks, and piles can interact.
 *  - Tables manage the overall game state and flow.
 *  - Tables can enforce rules about how cards can be played between hands and piles.
 * 
 * Players are the participants in the game, usually each having a hand associated with them, but not always.
 *  - Players are tracked by the table, and use the table to emit events related to their actions.
 *  - 
 * 
 * All of these components have UI equivalents that utilize Phaser for rendering.
 *  - UI components listen to events from the core components to update their display accordingly.
 *  - The PileUI renders as an empty pile by default, but shows cards when they are added.
 *  - The DeckUI generates the CardUI components that will move around the table, between various other piles.
 *  - The HandUI renders the cards in various layouts (fan, spread, grid, etc) and handles user interaction.
 */

// Card System - Main Export Module
export * from './card.types';
export * from './card.definitions';
export * from './card.events';

// Core Components
export * from './pile';
export * from './deck/deck.manager';
export * from './hand';
export * from './table';
export * from './player';

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
