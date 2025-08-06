// Example: Hand System Usage Demo
// Demonstrates how to create and use hands with UI in a Phaser scene

import Phaser from 'phaser';
import { Hand, HandUI, HAND_EVENTS, HAND_UI_EVENTS, HandLayout } from '../mechanics/card/hand';
import { DeckFactory, GAME_TYPE } from '../mechanics/card/deck/deck.manager';
import { DeckUI } from '../mechanics/card/ui/deck-ui';
import CoreScene from '../scenes/Core.scene';
import { CardAnimationManager } from '../mechanics/card/ui/animations';

export class HandDemoScene extends CoreScene {
  private playerHand!: Hand;
  private opponentHand!: Hand;
  private playerHandUI!: HandUI;
  private opponentHandUI!: HandUI;
  private cardAnimationManager!: CardAnimationManager;

  constructor() {
    super('HandDemoScene');
  }

  override create(): void {
    this.cardAnimationManager = new CardAnimationManager(this);
    this.setupHands();
    this.setupHandUIs();

    this.time.delayedCall(1000, () => {
      this.dealInitialCards();
      this.setupControls();
    }, [], this);

    super.create();
  }

  private setupHands(): void {
    // Create player hand (cards will be revealed)
    this.playerHand = Hand.createPlayerHand('player-hand', 'Player Hand', GAME_TYPE.POKER);

    // Create opponent hand (cards will be hidden)
    this.opponentHand = Hand.createOpponentHand('opponent-hand', 'Opponent Hand', GAME_TYPE.POKER);

    // Listen to hand events
    this.playerHand.on(HAND_EVENTS.PLAY_CARDS, (event) => {
      console.log('Player played cards:', event.playedCards);
    });

    this.playerHand.on(HAND_EVENTS.SELECTION_CHANGED, (event) => {
      console.log('Player selection changed:', event.selectedCards.length, 'cards selected');
    });
  }

  private setupHandUIs(): void {
    // Create player hand UI at bottom of screen (fanned layout)
    this.playerHandUI = HandUI.createPlayerHandUI(
      this,
      400, 
      500,
      this.playerHand
    );

    // Create opponent hand UI at top of screen (line layout, cards hidden)
    this.opponentHandUI = HandUI.createOpponentHandUI(
      this,
      400,
      100,
      this.opponentHand
    );

    // Listen to UI events
    this.playerHandUI.on(HAND_UI_EVENTS.CARD_CLICKED, (event) => {
      console.log('Card clicked:', event.card.displayName);
    });

    this.playerHandUI.on(HAND_UI_EVENTS.CARDS_REVEALED, () => {
      console.log('Player cards revealed');
    });
  }

  private async dealInitialCards(): Promise<void> {
    const deck = DeckUI.createPokerDeck(
          this, 
          100, 
          this.cameras.main.height - 150, 
          DeckFactory.createStandardDeck()
        );
    
    // Deal 5 cards to each player using the animation manager
    for (let i = 0; i < 5; i++) {
      const playerCard = await deck.drawCard();
      const opponentCard = await deck.drawCard();

      if (playerCard) {
        // Animate card draw to player hand
        this.cardAnimationManager.drawCard({
          card: playerCard,
          sourcePosition: { x: 100, y: this.cameras.main.height - 150 },
          targetPosition: this.playerHandUI.getCenterPosition(),
          sourceScale: 1.0,
          targetScale: 0.8,
          duration: 500,
          delay: i * 200,
          onComplete: () => {
            this.playerHand.addCard(playerCard);
          }
        });
      }
      
      if (opponentCard) {
        // Animate card draw to opponent hand
        this.cardAnimationManager.drawCard({
          card: opponentCard,
          sourcePosition: { x: 100, y: this.cameras.main.height - 150 },
          targetPosition: this.opponentHandUI.getCenterPosition(),
          sourceScale: 1.0,
          targetScale: 0.6,
          duration: 500,
          delay: i * 200 + 100, // Slight offset from player cards
          onComplete: () => {
            this.opponentHand.addCard(opponentCard);
          }
        });
      }
    }
  }

  private setupControls(): void {
    // Add instruction text
    this.add.text(50, 50, [
      'Hand System Demo Controls:',
      'Click cards to select/deselect',
      'SPACE: Play selected cards',
      'R: Reveal opponent cards',
      'H: Hide opponent cards',
      'F: Switch to fan layout',
      'L: Switch to line layout',
      'G: Switch to grid layout'
    ], {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-SPACE', () => {
      const selectedCards = this.playerHand.selectedCards;
      if (selectedCards.length > 0) {
        this.playerHand.playCards(selectedCards);
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      this.opponentHandUI.revealCards();
    });

    this.input.keyboard?.on('keydown-H', () => {
      this.opponentHandUI.hideCards();
    });

    this.input.keyboard?.on('keydown-F', () => {
      this.playerHandUI.setLayout(HandLayout.FAN);
    });

    this.input.keyboard?.on('keydown-L', () => {
      this.playerHandUI.setLayout(HandLayout.LINE);
    });

    this.input.keyboard?.on('keydown-G', () => {
      this.playerHandUI.setLayout(HandLayout.GRID);
    });
  }
}

// Example: Creating different types of hands
export function createHandExamples(): void {
  // Poker hand with selection
  const pokerHand = Hand.createPlayerHand('poker', 'Poker Hand', GAME_TYPE.POKER);

  // UNO hand with different limits
  const unoHand = Hand.createPlayerHand('uno', 'UNO Hand', GAME_TYPE.UNO);

  // Opponent hand (hidden)
  const opponentHand = Hand.createOpponentHand('opponent', 'Opponent', GAME_TYPE.POKER);

  console.log('Created example hands:', {
    poker: pokerHand.name,
    uno: unoHand.name,
    opponent: opponentHand.name
  });
}

// Example: Hand UI Factory Methods
export function createHandUIExamples(scene: Phaser.Scene): HandUI[] {
  const playerHand = Hand.createPlayerHand('demo-player', 'Demo Player', GAME_TYPE.POKER);
  const opponentHand = Hand.createOpponentHand('demo-opponent', 'Demo Opponent', GAME_TYPE.POKER);
  
  return [
    HandUI.createPlayerHandUI(scene, 400, 500, playerHand),
    HandUI.createOpponentHandUI(scene, 400, 100, opponentHand),
    HandUI.createDealerHandUI(scene, 400, 300, playerHand)
  ];
}
