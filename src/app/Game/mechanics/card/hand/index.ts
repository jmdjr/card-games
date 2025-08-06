// Hand System - Main Export File
// Comprehensive hand management system for card games

// Core Hand System
export { Hand } from './hand.manager';
export * from './hand.types';

// Hand UI System
export { HandUI } from '../ui/hand-ui';
export * from '../ui/hand-ui.types';

// Re-export important types for convenience
export type {
  HandConfig,
  HandState,
  PlayCardsEvent,
  DrawCardsEvent
} from './hand.types';
export type {
  HandUIConfig,
  HandUIState,
  CardPosition,
  CardRevealStyle,
  HandUIClickEvent
} from '../ui/hand-ui.types';
export {
  HandLayout
} from '../ui/hand-ui.types';

// Re-export constants
export { HAND_EVENTS } from './hand.types';
export { HAND_UI_EVENTS, HAND_UI_PRESETS } from '../ui/hand-ui.types';
