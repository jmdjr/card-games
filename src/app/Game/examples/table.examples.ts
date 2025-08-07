// Example: Table System Usage Demo
// Demonstrates the complete event-driven Table system with Players, Deck, Hands, and Discard Pile

import Phaser from 'phaser';
import { Table, TABLE_EVENTS, Player, CardTransferRequest } from '../mechanics/card/table/table.manager';
import { Hand, HAND_EVENTS, HandSelectionChangedEvent } from '../mechanics/card/hand/hand.manager';
import { Deck, DeckFactory } from '../mechanics/card/deck/deck.manager';
import { Pile, PILE_EVENTS, PileCardEvent } from '../mechanics/card/pile/pile.manager';
import { DeckUI } from '../mechanics/card/ui/deck.ui';
import { HandUI } from '../mechanics/card/ui/hand.ui';
import { HandLayout } from '../mechanics/card/hand/hand.types';
import { CardUI } from '../mechanics/card/ui/card.ui';
import CoreScene from '../scenes/Core.scene';
import { PileUI } from '../mechanics/card/ui/pile.ui';

export class TableDemoScene extends CoreScene {
  private table!: Table;
  private players: Player[] = [];
  private deck!: Deck;
  private discardPile!: Pile;
  private hands: Hand[] = [];
  
  // UI Components
  private deckUI!: DeckUI;
  private discardPileUI!: PileUI;
  private playerHandUIs: HandUI[] = [];
  private topDiscardCard: CardUI | null = null;

  // Table positions
  private readonly TABLE_POSITION = { x: 400, y: 300 };
  private readonly DECK_POSITION = { x: 400, y: 300 };
  private readonly DISCARD_POSITION = { x: 480, y: 300 };
  private readonly RADIUS = 150;
  private readonly BOTTOM = this.DECK_POSITION.y + this.RADIUS;
  private readonly LEFT = this.DECK_POSITION.x - this.RADIUS;
  private readonly TOP = this.DECK_POSITION.y - this.RADIUS;
  private readonly RIGHT = this.DECK_POSITION.x + this.RADIUS;
  
  private readonly PLAYER_POSITIONS = [
    { x: this.DECK_POSITION.x, y: this.BOTTOM, name: 'South Player' },  // Bottom (revealed to player)
    { x: this.LEFT, y: this.DECK_POSITION.y, name: 'West Player' },   // Left
    { x: this.DECK_POSITION.x, y: this.TOP, name: 'North Player' },  // Top
    { x: this.RIGHT, y: this.DECK_POSITION.y, name: 'East Player' }    // Right
  ];

  constructor() {
    super('TableDemoScene');
  }

  override create(): void {
    this.setupTable();
    this.setupPlayers();
    this.setupPiles();
    this.setupUI();
    this.setupEventListeners();

    // Start the demo sequence
    this.time.delayedCall(1000, () => {
      this.dealInitialCards();
      this.setupControls();
    }, [], this);

    super.create();
  }

  private setupTable(): void {
    this.table = new Table({
      id: 'demo-table',
      name: 'Demo Poker Table',
      maxPlayers: 4,
      gameType: 'poker'
    });
    console.log('Table created:', this.table.name);
  }

  private setupPlayers(): void {
    // Create 4 players and hands
    for (let i = 0; i < 4; i++) {
      const position = this.PLAYER_POSITIONS[i];
      
      // Create player object
      const player: Player = {
        id: `player-${i}`,
        name: position.name,
        isHuman: i === 0,
        piles: new Map()
      };
      
      // Create a hand for each player
      const hand = new Hand({
        id: `hand-${i}`,
        name: `${position.name} Hand`,
        maxCards: 10,
        isPlayerHand: i === 0,
        showCardFaces: i === 0,
        allowMultiSelect: i === 0
      });

      // Add hand to player's piles
      player.piles.set(`hand-${i}`, hand);
      
      // Register player with table
      this.table.addPlayer(player);
      this.players.push(player);
      this.hands.push(hand);

      console.log(`Created ${position.name} with hand`);
    }
  }

  private setupPiles(): void {
    // Create deck
    this.deck = DeckFactory.createStandardDeck();
    this.deck.shuffle();
    
    // Create discard pile
    this.discardPile = new Pile({
      id: 'discard',
      name: 'Discard Pile'
    });
    
    // Register piles with table
    this.table.registerPile('deck', this.deck);
    this.table.registerPile('discard', this.discardPile);

    console.log('Deck and discard pile created and registered');
  }

  private setupUI(): void {
    // Create deck UI
    this.deckUI = new DeckUI(
      this,
      this.DECK_POSITION.x,
      this.DECK_POSITION.y,
      this.deck,
      {
        showCardCount: true
      }
    );

    // Create discard pile UI
    this.discardPileUI = new PileUI(
      this,
      this.DISCARD_POSITION.x,
      this.DISCARD_POSITION.y,
      this.discardPile,
      {
        showCardCount: true
      }
    );

    // Create hand UIs for each player
    this.hands.forEach((hand, index) => {
      const position = this.PLAYER_POSITIONS[index];
      
      const handUI = new HandUI(
        this,
        position.x,
        position.y,
        hand,
        {
          layout: HandLayout.FAN,
          interactive: index === 0,
          showCardFaces: index === 0
        }
      );

      this.playerHandUIs.push(handUI);
    });

    // Add table background
    const tableGraphics = this.add.rectangle(400, 300, 700, 500, 0x006600);
    tableGraphics.setDepth(-1);
    tableGraphics.setOrigin(0.5);
    tableGraphics.setName('TableBackground');

    // Add labels
    this.add.text(this.DECK_POSITION.x, this.DECK_POSITION.y - 80, 'DECK', {
      fontSize: '32pt',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(this.DISCARD_POSITION.x, this.DISCARD_POSITION.y - 80, 'DISCARD', {
      fontSize: '32pt',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }

  private setupEventListeners(): void {
    console.log('Setting up event listeners for table and piles...');
    
    // Listen to table events
    this.table.on(TABLE_EVENTS.TRANSFER_REQUESTED, (event: CardTransferRequest) => {
      console.log('🔔 Table: Card transfer REQUESTED:', event);
      this.handleCardTransferRequested(event);
    });

    this.table.on(TABLE_EVENTS.TRANSFER_COMPLETED, (event: CardTransferRequest) => {
      console.log('✅ Table: Card transfer COMPLETED:', event);
    });

    this.table.on(TABLE_EVENTS.TRANSFER_BLOCKED, (event: CardTransferRequest) => {
      console.log('❌ Table: Card transfer BLOCKED:', event);
    });

    // Listen to deck events
    this.deck.on(PILE_EVENTS.CARD_REMOVED, (event: PileCardEvent) => {
      console.log('🃏 Deck: Card removed:', event.card.displayName);
    });

    // Listen to hand events for the human player
    const humanHand = this.hands[0]; // First hand is human player
    
    humanHand.on(PILE_EVENTS.CARD_ADDED, (event: PileCardEvent) => {
      console.log('🖐️ Human hand: Card added:', event.card.displayName);
    });

    humanHand.on(HAND_EVENTS.SELECTION_CHANGED, (event: HandSelectionChangedEvent) => {
      console.log('👆 Human hand: Selection changed:', event.selectedCards.length + ' cards');
    });

    // Listen to discard pile events
    this.discardPile.on(PILE_EVENTS.CARD_ADDED, (event: PileCardEvent) => {
      console.log('🗑️ Discard: Card added:', event.card.displayName);
    });

    console.log('Event listeners setup complete');
  }

  private handleCardTransferRequested(event: CardTransferRequest): void {
    // Get the CardUI for the card that's about to be transferred, before it gets moved
    const sourceUI = this.findUIForPile(event.source);
    const targetUI = this.findUIForPile(event.target);
    
    if (sourceUI && targetUI) {
      // Find the CardUI for the card that's about to be transferred
      const cardUI = sourceUI.findCardUI(event.card.id);
      if (cardUI) {
        // Remove the CardUI from the DeckUI temporarily for animation
        sourceUI.removeCardUI(cardUI);
        
        // Animate the existing CardUI from source to target
        this.animateCardTransfer(cardUI, sourceUI, targetUI);
      }
    }
  }

  private findUIForPile(pile: Pile): PileUI | null {
    if (pile === this.deck) return this.deckUI;
    if (pile === this.discardPile) return this.discardPileUI;
    
    // Check if it's one of the hand piles
    const handIndex = this.hands.indexOf(pile as Hand);
    if (handIndex >= 0) {
      return this.playerHandUIs[handIndex];
    }
    
    return null;
  }

  private animateCardTransfer(cardUI: CardUI, sourceUI: PileUI, targetUI: PileUI): void {
    cardUI.setPosition(sourceUI.x, sourceUI.y);

    // Animate from source to target position
    this.tweens.add({
      targets: cardUI,
      x: targetUI.x,
      y: targetUI.y,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // After animation, the target UI should handle the card through its pile events
        // The CardUI will be managed by the target pile UI now
        targetUI.addCardUI(cardUI);
      }
    });
  }

  private async dealInitialCards(): Promise<void> {
    console.log('Starting to deal cards using table system...');
    
    // Deal 5 cards to each player in turn using table transfer system
    for (let round = 0; round < 5; round++) {
      for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
        const player = this.players[playerIndex];
        const hand = this.hands[playerIndex];
        
        await this.dealCardToPlayerUsingTable(player, hand, playerIndex * 50);
      }
    }

    // Deal one card to discard pile and reveal it
    this.time.delayedCall(500, () => {
      const card = this.deck.peek();
      if (card) {
        this.handleCardTransferRequested({
          source: this.deck,
          target: this.discardPile,
          card,
          context: { reason: 'initial discard' }
        });
      }
    });
  }

  private async dealCardToPlayerUsingTable(player: Player, targetHand: Hand, delay: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(delay, () => {
        // Get the top card from deck for transfer
        const card = this.deck.peek();
        if (card) {
          // Execute the transfer through table
          const success = this.table.requestCardTransfer(this.deck, targetHand, card, { 
            reason: 'deal',
            playerId: player.id 
          });
          
          if (success) {
            console.log(`Dealt ${card.displayName} to ${player.name}`);
          } else {
            console.log(`Failed to deal card to ${player.name}`);
          }
        }
        resolve();
      });
    });
  }

  private updateUI(): void {
    // The UI will automatically update through event listeners in the new system
    // No manual refresh needed as PileUI responds to pile events
    console.log('UI updated through event system');
  }

  private setupControls(): void {
    // Add instruction text
    this.add.text(50, 550, [
      'Table System Demo Controls:',
      'SPACE: Deal another round of cards',
      'D: Draw card to human player',
      'P: Play selected cards from human player',
      'R: Reveal/Hide human player cards',
      'S: Shuffle deck'
    ], {
      fontSize: '28pt',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      wordWrap: { width: 600 }
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.dealRoundOfCards();
    });

    this.input.keyboard?.on('keydown-D', () => {
      const humanHand = this.hands[0]; // First hand is human player's hand
      const card = this.deck.peek();
      if (card) {
        const success = this.table.requestCardTransfer(this.deck, humanHand, card, { reason: 'draw' });
        if (success) {
          console.log(`Drew ${card.displayName} for human player`);
        }
      }
    });

    this.input.keyboard?.on('keydown-P', () => {
      const humanHand = this.hands[0]; // First hand is human player's hand
      const selectedCards = humanHand.getSelectedCards(); // Call as method
      
      if (selectedCards.length > 0) {
        // Play cards to discard pile
        selectedCards.forEach(card => {
          const success = this.table.requestCardTransfer(humanHand, this.discardPile, card, { reason: 'play' });
          if (success) {
            console.log(`Played ${card.displayName} to discard`);
          }
        });
        humanHand.clearSelection();
        this.updateUI();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      const humanHand = this.hands[0]; // First hand is human player's hand
      // Toggle visibility is not available in new API, skip this functionality
      console.log('Visibility toggle not implemented in new API');
    });

    this.input.keyboard?.on('keydown-S', () => {
      this.deck.shuffle();
      console.log('Deck shuffled');
    });
  }

  private dealRoundOfCards(): void {
    // Deal one card to each player
    this.hands.forEach((hand, index) => {
      this.time.delayedCall(index * 100, () => {
        const card = this.deck.peek();
        if (card) {
          const success = this.table.requestCardTransfer(this.deck, hand, card, { reason: 'deal round' });
          if (success) {
            console.log(`Dealt ${card.displayName} to ${this.players[index].name}`);
          }
        }
      });
    });
  }
}

// Example: Creating a complete table setup
export function createTableExample(): Table {
  const table = new Table({
    id: 'example-table',
    name: 'Example Poker Table',
    maxPlayers: 4,
    gameType: 'poker'
  });
  
  // Create players
  const playerConfigs = [
    { id: 'player1', name: 'Alice', isHuman: true },
    { id: 'player2', name: 'Bob', isHuman: false },
    { id: 'player3', name: 'Charlie', isHuman: false },
    { id: 'player4', name: 'Diana', isHuman: false }
  ];

  // Give each player a hand
  playerConfigs.forEach((config, index) => {
    const player: Player = {
      id: config.id,
      name: config.name,
      isHuman: config.isHuman,
      piles: new Map()
    };
    
    const hand = new Hand({
      id: `hand-${index}`,
      name: `${config.name}'s Hand`,
      maxCards: 10,
      isPlayerHand: config.isHuman,
      showCardFaces: config.isHuman,
      allowMultiSelect: config.isHuman
    });
    
    player.piles.set(`hand-${index}`, hand);
    table.addPlayer(player);
  });

  // Create and register deck
  const deck = DeckFactory.createStandardDeck();
  deck.shuffle();
  table.registerPile('deck', deck);

  // Create and register discard pile
  const discardPile = new Pile({
    id: 'discard',
    name: 'Discard Pile'
  });
  table.registerPile('discard', discardPile);

  console.log('Example table created with 4 players, deck, and discard pile');
  return table;
}

// Example: Different table configurations
export function createDifferentTableExamples(): Table[] {
  const tables: Table[] = [];

  // Poker table
  const pokerTable = new Table({
    id: 'poker-table',
    name: 'Poker Table',
    maxPlayers: 6,
    gameType: 'poker'
  });
  const pokerDeck = DeckFactory.createStandardDeck();
  pokerTable.registerPile('deck', pokerDeck);
  tables.push(pokerTable);

  // UNO table  
  const unoTable = new Table({
    id: 'uno-table',
    name: 'UNO Table',
    maxPlayers: 4,
    gameType: 'uno'
  });
  const unoDeck = DeckFactory.createUnoDeck();
  unoTable.registerPile('deck', unoDeck);
  tables.push(unoTable);

  // Blackjack table
  const blackjackTable = new Table({
    id: 'blackjack-table',
    name: 'Blackjack Table',
    maxPlayers: 5,
    gameType: 'blackjack'
  });
  const blackjackDeck = DeckFactory.createStandardDeck();
  blackjackTable.registerPile('deck', blackjackDeck);
  tables.push(blackjackTable);

  return tables;
}
