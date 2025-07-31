# Deck UI System

A comprehensive visual representation system for card decks in the Game framework, supporting multiple card types including playing cards, UNO cards, and dice.

## Overview

The Deck UI system provides a complete solution for visually representing card decks with:
- **Multiple Deck Styles**: Standard playing cards, UNO cards, and dice
- **Visual Deck Representation**: Shows stacked cards with configurable appearance
- **Interactive Features**: Click handling, hover effects, and animations
- **Flexible Configuration**: Customizable sizing, positioning, and behavior
- **Asset Integration**: Seamlessly integrates with Kenny Cards asset system

## Quick Start

```typescript
import { createQuickDeckUI } from './deck-ui.examples';

// Create a standard playing card deck
const deckUI = createQuickDeckUI('my-container-id', 'standard', true);

// Create a UNO deck (with top card hidden)
const unoUI = createQuickDeckUI('uno-container', 'uno', false);

// Create a dice set
const diceUI = createQuickDeckUI('dice-container', 'dice', true);
```

## Components

### 1. DeckUIComponent
The main component that renders a visual deck representation.

**Constructor:**
```typescript
new DeckUIComponent(deck: Deck, config: Partial<DeckUIConfig>, containerId?: string)
```

**Key Methods:**
- `render()`: Updates the visual representation
- `on(event, handler)`: Adds event listeners for user interactions
- `attachToContainer(containerId)`: Attaches the component to a DOM element

### 2. DeckUIConfig
Configuration interface for customizing deck appearance and behavior.

**Key Properties:**
- `style`: DeckStyle (STANDARD, UNO, DICE, CUSTOM)
- `orientation`: DeckOrientation (VERTICAL, HORIZONTAL)
- `showTopCard`: boolean - Whether to reveal the top card
- `showCardCount`: boolean - Whether to display card count
- `clickable`: boolean - Whether the deck responds to clicks
- `maxVisibleCards`: number - Maximum cards to show in stack effect
- `width/height`: Deck dimensions in pixels
- `cardOffsetX/Y`: Spacing between stacked cards

### 3. DeckUITypes
Enums and type definitions for deck configuration.

**DeckStyle Options:**
- `STANDARD`: Traditional playing cards
- `UNO`: UNO-style cards
- `DICE`: Dice representation
- `CUSTOM`: User-defined styling

## Features

### Visual Deck Representation
- **Card Stacking**: Shows multiple cards stacked with slight offsets
- **Top Card Display**: Option to show the face of the top card
- **Card Count Badge**: Displays number of remaining cards
- **Empty Deck State**: Special placeholder when deck is empty

### Styling Options
- **Preset Configurations**: Pre-defined styles for different game types
- **Custom Dimensions**: Configurable width and height
- **Orientation Support**: Vertical or horizontal card stacking
- **Responsive Design**: Adapts to different screen sizes

### Interactive Features
- **Click Events**: Handles user clicks for card drawing
- **Hover Effects**: Visual feedback on mouse hover
- **Animation Support**: Smooth transitions for card operations
- **Event System**: Custom event handling for game integration

### Asset Integration
- **Kenny Cards Assets**: Uses kenny_cards.json filename mappings
- **Dynamic Asset Loading**: Automatically loads appropriate card back images
- **Fallback Support**: Graceful handling of missing assets

## Examples

### Basic Standard Deck
```typescript
const deck = DeckFactory.createStandardDeck();
const deckUI = new DeckUIComponent(deck, {
  style: DeckStyle.STANDARD,
  showTopCard: true,
  showCardCount: true,
  clickable: true
}, 'deck-container');

// Handle card draws
deckUI.on('cardClick', () => {
  const drawnCard = deck.drawCard();
  if (drawnCard) {
    console.log('Drew:', drawnCard.displayName);
    deckUI.render();
  }
});
```

### UNO Deck with Hidden Top Card
```typescript
const unoDeck = DeckFactory.createUnoDeck();
const unoUI = new DeckUIComponent(unoDeck, {
  style: DeckStyle.UNO,
  showTopCard: false, // Hide top card for draw pile
  maxVisibleCards: 8,
  orientation: DeckOrientation.VERTICAL
}, 'uno-deck');
```

### Dice Set Display
```typescript
const dice = DeckFactory.createDiceSet();
const diceUI = new DeckUIComponent(dice, {
  style: DeckStyle.DICE,
  orientation: DeckOrientation.HORIZONTAL,
  showCardCount: false, // No count for dice
  clickable: true
}, 'dice-container');

// Handle dice rolling
diceUI.on('cardClick', () => {
  dice.shuffle();
  diceUI.render();
  const result = dice.peek();
  console.log('Rolled:', result?.displayName);
});
```

### Multiple Decks Display
```typescript
import { DeckUIExamples } from './deck-ui.examples';

// Create side-by-side deck display
const deckUIs = DeckUIExamples.createMultipleDeckDisplay('multi-deck-container');
```

## CSS Classes

The component generates HTML with semantic CSS classes for styling:

- `.deck-ui-container`: Main container
- `.deck-card`: Individual card elements
- `.deck-top-card`: The revealed top card
- `.deck-empty`: Empty deck placeholder
- `.deck-card-count`: Card count badge

## Integration

### With Angular Components
```typescript
// In your Angular component
export class GameComponent {
  ngAfterViewInit() {
    const deckUI = createQuickDeckUI('deck-container', 'standard');
    // Component is automatically rendered
  }
}
```

### With Phaser Games
```typescript
// In your Phaser scene
create() {
  // Create deck UI in DOM element
  const deckUI = createQuickDeckUI('phaser-ui-overlay', 'uno');
  
  // Integrate with game events
  deckUI.on('cardClick', () => {
    this.handleCardDraw();
  });
}
```

## Configuration Presets

Pre-defined configurations are available in `DECK_UI_PRESETS`:

- `STANDARD_POKER`: Standard 52-card deck setup
- `UNO_GAME`: UNO deck with appropriate styling
- `DICE_COLLECTION`: Dice set configuration

## File Structure

```
src/app/Game/ui/card/
├── deck-ui.types.ts        # Type definitions and configuration
├── deck-ui.component.ts    # Main UI component implementation
├── deck-ui.component.css   # Styling and animations
├── deck-ui.examples.ts     # Usage examples and utilities
└── README.md              # This documentation
```

## Dependencies

- **Card System**: `../../mechanics/card/` - Card types and deck management
- **Kenny Assets**: `../../assets.data.ts` - Asset filename mappings
- **Phaser Framework**: For game integration (optional)

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Image loading and CSS animations support

## Performance Notes

- Efficiently handles large decks (500+ cards)
- Optimized rendering for smooth animations
- Minimal DOM manipulation for better performance
- Responsive design adapts to viewport changes

## Future Enhancements

- **Card Hand Display**: UI for showing player hands
- **Card Spread View**: Fan-out card display
- **Advanced Animations**: Card flip, slide, and deal animations
- **Touch Gestures**: Mobile-friendly touch interactions
- **Audio Integration**: Sound effects for card operations
