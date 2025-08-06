# Card Hand System

A comprehensive hand management system for card games built with Phaser.js and TypeScript. This system provides both core hand logic and visual UI representation with animations.

## Features

### Core Hand Management
- **Card Storage**: Store and manage collections of cards with configurable limits
- **Selection System**: Single and multi-card selection with event-driven architecture
- **Play/Draw Events**: Trigger events when cards are played or drawn from deck
- **Boundary Conditions**: Handle empty/full hand states gracefully
- **Event-Driven**: Comprehensive event system for all hand interactions

### Visual UI System
- **Multiple Layouts**: Fan, Line, Grid, Pile, and Arc arrangements
- **Card Animations**: Smooth transitions, reveals, and positioning
- **Player vs Opponent**: Different configurations for revealed vs hidden cards
- **Interactive**: Click to select, hover effects, and visual feedback
- **Responsive**: Automatic layout calculations and adaptive spacing

## Quick Start

### Basic Hand Creation

```typescript
import { Hand, HandUI, HandLayout } from '../mechanics/card/hand';

// Create a player hand (cards revealed)
const playerHand = Hand.createPlayerHand('player-1', 'Player Hand', 'POKER');

// Create an opponent hand (cards hidden)
const opponentHand = Hand.createOpponentHand('opponent-1', 'Opponent', 'POKER');

// Add cards to the hand
playerHand.addCard(someCard);
playerHand.addCard(anotherCard);
```

### Basic UI Setup

```typescript
// Create visual representation in a Phaser scene
const playerHandUI = HandUI.createPlayerHandUI(scene, 400, 500, playerHand);
const opponentHandUI = HandUI.createOpponentHandUI(scene, 400, 100, opponentHand);

// Listen to UI events
playerHandUI.on('card:clicked', (event) => {
  console.log('Card clicked:', event.card.displayName);
});
```

## Hand Types and Configurations

### Preset Hand Types

The system includes several preset configurations for different game types:

- **POKER**: 5-7 card limit, multi-selection enabled, fan layout
- **UNO**: 7 card limit, single selection, line layout  
- **BLACKJACK**: 21 card limit, no selection, line layout
- **OPPONENT**: Hidden cards, no interaction, line layout

### Custom Configuration

```typescript
const customHand = new Hand('custom-id', 'Custom Hand', {
  maxCards: 10,
  allowSelection: true,
  allowMultiSelection: false,
  isPlayerHand: true,
  autoSort: true,
  gameType: 'POKER'
});
```

## Visual Layouts

### Fan Layout
Cards arranged in a fan pattern - ideal for poker-style games where you want to see all cards clearly.

```typescript
handUI.setLayout(HandLayout.FAN);
```

### Line Layout  
Cards arranged in a straight line - good for UNO or when space is limited.

```typescript
handUI.setLayout(HandLayout.LINE);
```

### Grid Layout
Cards arranged in a grid pattern - useful for large hands or inventory-style displays.

```typescript
handUI.setLayout(HandLayout.GRID);
```

### Other Layouts
- **PILE**: Stacked with slight offsets - for discard piles
- **ARC**: Curved arrangement - for dramatic effect

## Event System

### Hand Events (Core Logic)

```typescript
import { HAND_EVENTS } from '../mechanics/card/hand';

hand.on(HAND_EVENTS.CARD_ADDED, (event) => {
  console.log('Card added:', event.addedCard);
});

hand.on(HAND_EVENTS.PLAY_CARDS, (event) => {
  console.log('Cards played:', event.playedCards);
});

hand.on(HAND_EVENTS.SELECTION_CHANGED, (event) => {
  console.log('Selection changed:', event.selectedCards);
});
```

### UI Events (Visual Interactions)

```typescript
import { HAND_UI_EVENTS } from '../mechanics/card/hand';

handUI.on(HAND_UI_EVENTS.CARD_CLICKED, (event) => {
  console.log('Card clicked:', event.card);
});

handUI.on(HAND_UI_EVENTS.CARDS_REVEALED, (event) => {
  console.log('Cards revealed');
});
```

## Core Methods

### Hand Management
- `addCard(card)` - Add a card to the hand
- `removeCard(card)` - Remove a specific card
- `playCards(cards)` - Play selected cards (triggers event)
- `drawCards(count, source)` - Draw cards from a source
- `clear()` - Remove all cards

### Selection System
- `selectCard(card)` - Select a specific card
- `deselectCard(card)` - Deselect a specific card
- `toggleCardSelection(card)` - Toggle selection state
- `clearSelection()` - Deselect all cards
- `selectAll()` - Select all cards

### UI Controls
- `revealCards()` - Show card faces with animation
- `hideCards()` - Hide card faces with animation
- `setLayout(layout)` - Change visual layout
- `refresh()` - Rebuild visual representation

## Animation System

The hand UI includes smooth animations for:

- **Card Reveals**: Flip animation when showing/hiding cards
- **Selection**: Visual feedback when cards are selected
- **Positioning**: Smooth transitions when layout changes
- **Hover Effects**: Cards lift and scale on mouse over

### Animation Configuration

```typescript
const handUI = new HandUI(scene, x, y, hand, {
  animationDuration: 300,
  hoverEffect: {
    enabled: true,
    liftHeight: 20,
    scaleIncrease: 0.1
  }
});
```

## Game Type Differences

### Player Hands
- Cards are revealed (face up)
- Interactive selection enabled
- Hover effects and animations
- Fan or line layout typically

### Opponent Hands  
- Cards are hidden (face down)
- No interaction allowed
- Compact line layout
- Can be revealed programmatically

## Requirements

- **Phaser.js**: 3.x for scene and game object management
- **TypeScript**: For type safety and interfaces
- **Card System**: Requires the card mechanics system for CardProperties

## File Structure

```
hand/
├── index.ts              # Main exports
├── hand.types.ts         # All interfaces, events, and presets (consolidated)
├── hand.manager.ts       # Hand class implementation  
└── ui/
    └── hand-ui.ts        # HandUI class implementation
```

## Integration Example

```typescript
// In your Phaser scene
class GameScene extends Phaser.Scene {
  private playerHand: Hand;
  private playerHandUI: HandUI;
  
  create() {
    // Create the hand logic
    this.playerHand = Hand.createPlayerHand('player', 'Player', 'POKER');
    
    // Create the visual representation
    this.playerHandUI = HandUI.createPlayerHandUI(
      this, 400, 500, this.playerHand
    );
    
    // Handle interactions
    this.playerHandUI.on(HAND_UI_EVENTS.CARD_CLICKED, (event) => {
      // Game logic here
    });
  }
}
```

## Next Steps

1. **Integration**: Connect with your deck system for card dealing
2. **Game Logic**: Implement specific game rules and validation
3. **Multiplayer**: Extend for network synchronization
4. **Styling**: Customize visual appearance and animations
5. **Mobile**: Add touch controls and responsive layouts
