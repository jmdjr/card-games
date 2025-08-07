import { DeckUIConfig, DeckStyle, PileOrientation } from '../mechanics/card/deck/deck.types';
import { Deck, DeckFactory, DECK_TYPE } from '../mechanics/card/deck/deck.manager';
import Phaser from 'phaser';
import { DeckUI } from '../deck/ui/deck-ui';

/**
 * Example usage of DeckUI in a Phaser scene
 */
export class DeckUIExamples {
  
  /**
   * Example 1: Standard Playing Card Deck in Phaser Scene
   */
  static createStandardDeck(scene: Phaser.Scene, x: number, y: number): DeckUI {
    // Create a standard deck
    const deck = DeckFactory.createStandardDeck();
    
    // Configure the UI
    const config: Partial<DeckUIConfig> = {
      style: DeckStyle.STANDARD,
      maxVisibleCards: 5,
      showTopCard: true,
      showCardCount: true,
      clickable: true
    };
    
    // Create the Phaser deck component
    const deckUI = new DeckUI(scene, x, y, deck, config);

    // Add click handler for drawing cards
    deckUI.on('deckClick', () => {
      deckUI.drawCard().then(drawnCard => {
        if (drawnCard) {
          console.log('Drew card:', drawnCard.displayName);
        }
      });
    });
    
    return deckUI;
  }
  
  /**
   * Example 2: UNO Card Deck
   */
  static createUnoDeck(scene: Phaser.Scene, x: number, y: number): DeckUI {
    const deck = DeckFactory.createUnoDeck();
    
    const config: Partial<DeckUIConfig> = {
      style: DeckStyle.UNO,
      maxVisibleCards: 8,
      showTopCard: false, // Hide top card for UNO draw pile
      showCardCount: true,
      clickable: true,
      orientation: PileOrientation.VERTICAL,
      cardOffsetX: 1,
      cardOffsetY: 2,
      width: 60,
      height: 90
    };
    
    const deckUI = new DeckUI(scene, x, y, deck, config);
    
    // UNO-specific interactions
    deckUI.on('deckClick', () => {
      if (deck.isEmpty()) {
        console.log('UNO deck is empty!');
        return;
      }
      
      deckUI.drawCard().then(card => {
        if (card) {
          console.log('Drew UNO card:', card.displayName);
        }
      });
    });
    
    return deckUI;
  }
  
  /**
   * Example 3: Dice Collection Display
   */
  static createDiceDisplay(scene: Phaser.Scene, x: number, y: number): DeckUI {
    const dice = DeckFactory.createDiceSet();
    
    const config: Partial<DeckUIConfig> = {
      style: DeckStyle.DICE,
      maxVisibleCards: 6, // Show all dice faces
      showTopCard: true,
      showCardCount: false, // Don't show count for dice
      clickable: true,
      orientation: PileOrientation.HORIZONTAL,
      cardOffsetX: 5,
      cardOffsetY: 0,
      width: 50,
      height: 50
    };
    
    const diceUI = new DeckUI(scene, x, y, dice, config);
    
    // Dice rolling interaction
    diceUI.on('deckClick', () => {
      // Shuffle dice and show random result
      diceUI.shuffleDeck().then(() => {
        const rolledDie = dice.peek();
        if (rolledDie) {
          console.log('Rolled:', rolledDie.displayName);
        }
      });
    });
    
    return diceUI;
  }
  
  /**
   * Example 4: Multiple Decks in a Game Scene
   */
  static createGameTableSetup(scene: Phaser.Scene): {
    playerDeck: DeckUI,
    enemyDeck: DeckUI
  } {
    // Player deck (bottom of screen)
    const playerDeck = DeckUI.createPokerDeck(
      scene, 
      100, 
      scene.cameras.main.height - 150, 
      DeckFactory.createStandardDeck()
    );
    
    // Enemy deck (top of screen)
    const enemyDeck = DeckUI.createPokerDeck(
      scene,
      scene.cameras.main.width - 180,
      50,
      DeckFactory.createStandardDeck()
    );
    
    // Set up interactions
    playerDeck.on('deckClick', () => {
      playerDeck.drawCard().then(card => {
        if (card) {
          console.log('Player drew:', card.displayName);
          // Add to discard pile logic here
        }
      });
    });
    
    return { playerDeck, enemyDeck };
  }
  
  /**
   * Example 5: Animated Demo Scene
   */
  static createAnimatedDemo(scene: Phaser.Scene): DeckUI {
    const deck = DeckFactory.createStandardDeck();
    
    const config: Partial<DeckUIConfig> = {
      style: DeckStyle.STANDARD,
      maxVisibleCards: 10,
      showTopCard: true,
      showCardCount: true,
      clickable: true,
      animateCardDraw: true,
      drawAnimationDuration: 500,
      shuffleAnimationDuration: 1000
    };
    
    const deckUI = new DeckUI(scene, 
      scene.cameras.main.width / 2 - 40, 
      scene.cameras.main.height / 2 - 60, 
      deck, 
      config
    );
    
    // Auto-demo: periodically shuffle and draw
    let demoTimer = scene.time.addEvent({
      delay: 3000,
      callback: () => {
        if (deck.isEmpty()) {
          // Reset deck
          const cards = DeckFactory.createStandardDeck().getCards();
          deck.addCards(cards);
          deckUI.refresh();
          console.log('Demo: Deck reset');
        } else if (Math.random() < 0.3) {
          // 30% chance to shuffle
          deckUI.shuffleDeck().then(() => {
            console.log('Demo: Deck shuffled');
          });
        } else {
          // 70% chance to draw
          deckUI.drawCard().then(card => {
            if (card) {
              console.log('Demo: Drew', card.displayName);
            }
          });
        }
      },
      loop: true
    });
    
    // Store timer reference for cleanup
    (deckUI as any).demoTimer = demoTimer;
    
    return deckUI;
  }
}

/**
 * Quick factory functions for Phaser scenes
 */
export function createQuickDeck(
  scene: Phaser.Scene,
  x: number,
  y: number,
  deckType: DeckStyle = DeckStyle.STANDARD,
  showTopCard: boolean = true
): DeckUI {
  let deck: Deck;
  let style: DeckStyle;
  
  switch (deckType) {
    case DeckStyle.UNO:
      deck = DeckFactory.createUnoDeck();
      style = DeckStyle.UNO;
      break;
    case DeckStyle.DICE:
      deck = DeckFactory.createDiceSet();
      style = DeckStyle.DICE;
      break;
    default:
      deck = DeckFactory.createStandardDeck();
      style = DeckStyle.STANDARD;
  }
  
  const config: Partial<DeckUIConfig> = {
    style,
    maxVisibleCards: 5,
    showTopCard,
    showCardCount: true,
    clickable: true,
    animateCardDraw: true,
    drawAnimationDuration: 300
  };
  
  return new DeckUI(scene, x, y, deck, config);
}
