import { CardUI } from "../ui/card.ui";

export enum PileOrientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

// Predefined pile configurations
export const PILE_UI_PRESET = {
  orientation: PileOrientation.VERTICAL,
  width: 32,
  height: 32,
  scale: 3,
  cardOffsetX: 1,
  cardOffsetY: 1,
  maxVisibleCards: 5,
  topCardOffsetX: 1, // Position to the right of deck
  topCardOffsetY: 0,   // Same height as deck
  showTopCard: false,
  showCardCount: true,
  clickable: true,
  hoverEffect: true,
  animateCardDraw: true,
  drawAnimationDuration: 300,
  shuffleAnimationDuration: 800
};

export interface PileUIConfig {
  /** Width of the pile area */
  width: number;
  /** Height of the pile area */
  height: number;
  /** Scale factor for all cards */
  scale: number;
  /** Whether this pile can be interacted with */
  interactive: boolean;
  /** Animation duration for card movements */
  animationDuration: number;
  /** Whether to show shadows for depth */
  showShadows: boolean;
  /** Orientation of the pile */
  orientation: PileOrientation;

  showTopCard: boolean;
  showCardCount: boolean;

  cardOffsetX: number;  // Offset between stacked cards
  cardOffsetY: number;
  maxVisibleCards: number; // Max cards to show in stack effect

  // Top card positioning
  topCardOffsetX: number; // X offset from deck for top card
  topCardOffsetY: number; // Y offset from deck for top card
  topCardScale?: number;  // Optional scale override for top card

  // Animation settings
  animateCardDraw: boolean;
  drawAnimationDuration: number; // milliseconds
  shuffleAnimationDuration: number;

  // Interaction
  clickable: boolean;
  hoverEffect: {
    enabled: boolean;
    liftHeight: number;
    scaleIncrease: number;
  };

  // Styling
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: boolean;
}

export interface CardUITransfer {
  cardUI: CardUI;
  sourcePosition: { x: number; y: number };
}
