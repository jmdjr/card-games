import { CardProperties } from "./card.types";

export interface cardsCanBeAdded {
  addCard(card: CardProperties): void;
  addCards(cards: CardProperties[]): void;
}

export interface cardsCanBeRemoved {
  removeCard(): CardProperties | null;
  removeCards(count: number): CardProperties[];
}

// the event emitted when cards are starting to be transferred from one pile to another
// this event can be cancelled to prevent the transfer
export interface StartTransferCardsEvent {
  /** The pile that is playing cards */
  source: cardsCanBeRemoved;
  /** The cards being played, should be guaranteed that they can be removed from the source */
  cards: CardProperties[];
  /** Target location for the cards */
  target: cardsCanBeAdded;

  /** Additional context for the play action */
  context?: any;
  /** Whether this event can be cancelled */
  cancellable: boolean;
}

// the event emitted when cards have been successfully transferred from one pile to another
export interface CompleteTransferCardsEvent {
  /** The pile that played cards */
  source: cardsCanBeRemoved;
  /** The cards that were played */
  cards: CardProperties[];
  /** Target location for the cards */
  target: cardsCanBeAdded;

  /** Additional context for the play action */
  context?: any;
}

export interface HandRevealEvent {
  /** The hand being revealed/hidden */
  handId: string;
  /** Whether cards are being revealed or hidden */
  revealed: boolean;
}

export interface HandClickEvent {
  /** The hand that was clicked */
  handId: string;
  /** The specific card that was clicked (if any) */
  card?: CardProperties;
  /** Click position relative to hand */
  position: { x: number; y: number };
  /** Type of click interaction */
  clickType: 'single' | 'double' | 'right';
}
