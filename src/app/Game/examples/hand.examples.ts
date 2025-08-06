// Example: Simple Hand System Usage (Legacy approach)
// For complete Table system examples, see table.examples.ts
// This file demonstrates basic Hand usage without the Table system

import Phaser from 'phaser';
import { Hand } from '../mechanics/card/hand/hand.manager';
import { DeckFactory } from '../mechanics/card/deck/deck.manager';
import CoreScene from '../scenes/Core.scene';

export class SimpleHandDemoScene extends CoreScene {
  private playerHand!: Hand;
  private deck!: any;

  constructor() {
    super('SimpleHandDemoScene');
  }

  override create(): void {
    this.setupSimpleDemo();
    super.create();
  }

  private setupSimpleDemo(): void {
    // Create a simple hand
    this.playerHand = Hand.createPlayerHand('demo-hand', 'Demo Hand');
    
    // Create a deck
    this.deck = DeckFactory.createStandardDeck();
    this.deck.shuffle();

    // Deal some cards directly to the hand
    for (let i = 0; i < 5; i++) {
      const card = this.deck.drawCard();
      if (card) {
        this.playerHand.addCard(card);
      }
    }

    // Show info
    this.add.text(50, 50, [
      'Simple Hand Demo:',
      `Hand has ${this.playerHand.size()} cards`,
      'This is a basic hand without Table system.',
      'For full Table examples, see table.examples.ts'
    ], {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });

    console.log('Simple hand demo created with', this.playerHand.size(), 'cards');
  }
}

// Example: Creating different types of hands (without Table system)
export function createSimpleHandExamples(): Hand[] {
  const hands: Hand[] = [];

  // Player hand
  const playerHand = Hand.createPlayerHand('player', 'Player Hand');
  hands.push(playerHand);

  // Opponent hand  
  const opponentHand = Hand.createOpponentHand('opponent', 'Opponent Hand');
  hands.push(opponentHand);

  return hands;
}
