// Hand System - Main Export File
// Comprehensive hand management system for card games

// Core Hand System
export { Hand } from './hand.manager';
export * from './hand.types';

// Hand UI System
export { HandUI } from '../ui/hand.ui';

// Re-export important types for convenience
export type {
  HandConfig,
  HandState,
  HandUIConfig,
  HandUIState,
  CardPosition,
  CardRevealStyle,
  HandUIClickEvent
} from './hand.types';

// Re-export enums
export {
  HandLayout
} from './hand.types';

// Re-export constants
export { HAND_EVENTS, HAND_UI_EVENTS, HAND_UI_PRESETS } from './hand.types';
