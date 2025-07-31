// Multiplayer System - Main Export Module
export * from './multiplayer.types';
export * from './client.manager';
export * from './multiplayer.session';

// Quick access exports
export { 
  MultiplayerMode, 
  NetworkProtocol, 
  PlayerType, 
  ConnectionState,
  MULTIPLAYER_PRESETS 
} from './multiplayer.types';

export { MultiplayerClient } from './client.manager';
export { MultiplayerGameSession } from './multiplayer.session';

// Utility function to create preset configurations
import { MULTIPLAYER_PRESETS } from './multiplayer.types';

export function createMultiplayerConfig(
  preset: keyof typeof MULTIPLAYER_PRESETS,
  overrides: any = {}
): any {
  return {
    ...MULTIPLAYER_PRESETS[preset],
    ...overrides
  };
}
