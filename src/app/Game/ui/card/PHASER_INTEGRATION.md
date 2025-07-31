# Phaser Deck UI System - Integration Guide

## 🎯 Migration to Phaser

The deck UI system has been successfully migrated to use **Phaser.js** instead of DOM manipulation, providing better performance and native game engine integration.

## 📱 New Phaser Component

### `PhaserDeckUIComponent`
- **Location**: `phaser-deck-ui.component.ts`
- **Extends**: `Phaser.GameObjects.Container`
- **Integration**: Direct Phaser scene integration

### Quick Integration

```typescript
// In your Phaser scene
import { createQuickPhaserDeckUI } from '../ui/card/deck-ui.examples';

create() {
  // Create deck UIs directly in the scene
  const standardDeck = createQuickPhaserDeckUI(this, 100, 100, 'standard', true);
  const unoDeck = createQuickPhaserDeckUI(this, 300, 100, 'uno', false);
  const diceSet = createQuickPhaserDeckUI(this, 500, 100, 'dice', true);
}
```

## 🎮 Core Scene Integration

The deck UI is now automatically demonstrated in `core_scene.ts`:

```typescript
// Demo deck UIs are created automatically
const standardDeck = createQuickPhaserDeckUI(this, 100, 100, 'standard', true);
const unoDeck = createQuickPhaserDeckUI(this, 300, 100, 'uno', false);
const diceSet = createQuickPhaserDeckUI(this, 500, 100, 'dice', true);
```

## 🎨 Visual Features

### Phaser Advantages
- **Native Rendering**: Uses Phaser's WebGL renderer
- **Texture Atlas**: Direct integration with kenny_cards.png atlas
- **Smooth Animations**: Phaser's built-in tween system
- **Interactive Events**: Phaser's pointer input system
- **Depth Management**: Automatic z-ordering

### Visual Elements
- **Card Stack**: Layered sprites with proper depth
- **Top Card Display**: Revealed card with green border
- **Card Count Badge**: Circular text display
- **Empty State**: Graphics-based placeholder
- **Hover Effects**: Scale and lift animations

## 🔧 Configuration

Same configuration options as before, but now applied to Phaser sprites:

```typescript
const config: Partial<DeckUIConfig> = {
  style: DeckStyle.STANDARD,
  maxVisibleCards: 8,
  showTopCard: true,
  showCardCount: true,
  clickable: true,
  animateCardDraw: true,
  drawAnimationDuration: 500,
  shuffleAnimationDuration: 1000,
  cardOffsetX: 2,
  cardOffsetY: 3,
  width: 80,
  height: 120
};
```

## 🎬 Enhanced Animations

### Card Draw Animation
```typescript
// Smooth card flying effect with Phaser tweens
deckUI.drawCard().then(card => {
  console.log('Drew:', card.displayName);
});
```

### Shuffle Animation
```typescript
// Multiple random movements with synchronized completion
deckUI.shuffleDeck().then(() => {
  console.log('Shuffle complete!');
});
```

## 🎯 Ready to Use!

The Phaser deck UI system provides exactly what you requested:
- ✅ **Phaser.js Integration**: Native game engine rendering
- ✅ **Visual Deck Representation**: Shows card stacks with backs
- ✅ **Top Card Option**: Configurable revealed card display
- ✅ **Kenny Cards Assets**: Uses existing asset system
- ✅ **Multiple Card Types**: Standard, UNO, and dice support
- ✅ **Interactive Features**: Click handling and animations

Run the project to see the deck UIs in action on the core scene!
