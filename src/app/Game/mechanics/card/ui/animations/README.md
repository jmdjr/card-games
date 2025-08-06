# Card Animation System

A centralized, event-driven animation manager that handles all card movement animations independently of source or target components.

## Overview

The Card Animation Manager decouples animation logic from individual components (decks, hands, etc.) and provides a unified system for animating card movements with proper scaling, positioning, and timing.

## Key Features

- **Event-Driven**: Uses events to trigger animations, allowing loose coupling
- **Source/Target Agnostic**: Works with any source and target positions/scales
- **Queued Animations**: Manages animation sequences to prevent conflicts
- **Automatic Scaling**: Handles scale transitions from source to target
- **Multiple Animation Types**: Draw, move, play, return, reveal, hide

## Architecture

### CardAnimationManager
Central manager that:
- Listens for animation events
- Creates temporary sprites for animations
- Manages animation queue
- Handles cleanup

### Animation Events
```typescript
CARD_ANIMATION_EVENTS = {
  DRAW_CARD: 'cardAnimation:draw',      // Card drawn from source to hand
  MOVE_CARD: 'cardAnimation:move',      // Basic card movement
  PLAY_CARD: 'cardAnimation:play',      // Card played with special effects
  RETURN_CARD: 'cardAnimation:return',  // Card returned to source
  REVEAL_CARD: 'cardAnimation:reveal',  // Card flip to face
  HIDE_CARD: 'cardAnimation:hide'       // Card flip to back
}
```

## Usage

### Basic Setup (CoreScene)
```typescript
export default class CoreScene extends Phaser.Scene {
  protected cardAnimationManager: CardAnimationManager;
  
  create() {
    this.cardAnimationManager = new CardAnimationManager(this);
    // ... other setup
  }
}
```

### Draw Animation
```typescript
// Draw card from deck to hand
this.cardAnimationManager.drawCard({
  card: drawnCard,
  sourcePosition: { x: 100, y: 300 },    // Deck position
  targetPosition: { x: 400, y: 500 },    // Hand position
  sourceScale: 1.0,                      // Deck scale
  targetScale: 0.8,                      // Hand scale
  duration: 500,
  delay: 0,
  onComplete: () => {
    // Add card to hand after animation
    this.playerHand.addCard(drawnCard);
  }
});
```

### Play Animation
```typescript
// Play card from hand to play area
this.cardAnimationManager.playCard({
  card: playedCard,
  fromPosition: { x: 400, y: 500 },      // Hand position
  toPosition: { x: 400, y: 300 },        // Play area
  fromScale: 0.8,                        // Hand scale
  toScale: 1.0,                          // Play area scale
  duration: 400,
  onComplete: () => {
    // Handle card played logic
  }
});
```

### Move Animation
```typescript
// Basic card movement
this.cardAnimationManager.moveCard({
  card: someCard,
  fromPosition: { x: 100, y: 100 },
  toPosition: { x: 200, y: 200 },
  fromScale: 1.0,
  toScale: 1.0,
  duration: 300
});
```

### Reveal/Hide Animations
```typescript
// Reveal card (flip to face)
this.cardAnimationManager.revealCard(card, { x: 400, y: 300 }, 1.0);

// Hide card (flip to back)
this.cardAnimationManager.hideCard(card, { x: 400, y: 300 }, 1.0);
```

## Integration with Existing Components

### HandUI Integration
HandUI components automatically connect to the CardAnimationManager when created through factory methods:

```typescript
// Automatically connects to scene.cardAnimationManager if available
const playerHandUI = HandUI.createPlayerHandUI(scene, x, y, hand);
```

### Manual Integration
```typescript
const handUI = new HandUI(scene, x, y, hand);
handUI.setAnimationManager(scene.cardAnimationManager);
```

## Animation Types

### Draw Animation
- **Purpose**: Card moving from source (deck) to target (hand)
- **Effects**: Position and scale transition
- **Use Case**: Dealing cards, drawing from deck

### Play Animation  
- **Purpose**: Card played from hand to play area
- **Effects**: Arc movement, temporary scale increase, bounce effect
- **Use Case**: Playing cards in games

### Move Animation
- **Purpose**: Basic card movement between positions
- **Effects**: Smooth position and scale transition
- **Use Case**: Reorganizing cards, returning cards

### Return Animation
- **Purpose**: Card returning to original position
- **Effects**: Similar to move but with specific easing
- **Use Case**: Cancelled plays, card returns

### Reveal Animation
- **Purpose**: Flip card from back to face
- **Effects**: Scale flip with frame change
- **Use Case**: Revealing hidden cards

### Hide Animation
- **Purpose**: Flip card from face to back
- **Effects**: Scale flip with frame change
- **Use Case**: Hiding cards from opponents

## Animation Queue

The system includes a queue to prevent animation conflicts:

```typescript
// Check if card is currently animating
if (manager.isCardAnimating(cardId)) {
  // Handle accordingly
}

// Get current queue length
const queueLength = manager.getQueueLength();

// Cancel all animations if needed
manager.cancelAllAnimations();
```

## Event Handling

Components can listen for animation completion:

```typescript
cardAnimationManager.on(CARD_ANIMATION_EVENTS.DRAW_CARD, (event) => {
  console.log('Card draw animation started:', event.card.displayName);
});
```

## Benefits

1. **Decoupling**: Animations are separated from game logic
2. **Reusability**: Same animation system works for any card movement
3. **Consistency**: All animations use the same timing and easing
4. **Performance**: Temporary sprites prevent UI component conflicts
5. **Flexibility**: Easy to customize animations per game type
6. **Queue Management**: Prevents overlapping animations

## Future Enhancements

- Custom easing functions per animation type
- Particle effects for special cards
- Sound integration
- Animation presets for different game types
- Batch animation support for multiple cards
- 3D rotation effects
