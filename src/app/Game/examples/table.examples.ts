// Example: Table System Usage Demo
// Demonstrates the complete event-driven Table system with Players, Deck, Hands, and Discard Pile

import Phaser from 'phaser';
import { Table, TABLE_EVENTS } from '../mechanics/card/table/table.manager';
import { Player } from '../mechanics/card/player/player.manager';
import { Hand } from '../mechanics/card/hand/hand.manager';
import { DeckFactory } from '../mechanics/card/deck/deck.manager';
import { Pile } from '../mechanics/card/pile/pile.manager';
import { DeckUI } from '../mechanics/card/ui/deck.ui';
import { HandUI } from '../mechanics/card/ui/hand.ui';
import { HandLayout } from '../mechanics/card/hand/hand.types';
import { CardUI } from '../mechanics/card/ui/card.ui';
import CoreScene from '../scenes/Core.scene';
import { CardProperties } from '../mechanics/card/card.types';

export class TableDemoScene extends CoreScene {
  private table!: Table;
  private players: Player[] = [];
  private deck!: any; // Deck instance
  private discardPile!: Pile;
  
  // UI Components
  private deckUI!: DeckUI;
  private discardPileUI!: Phaser.GameObjects.Container;
  private playerHandUIs: HandUI[] = [];
  private topDiscardCard: CardUI | null = null;

  // Table positions
  private readonly SCREEN_CENTER = { x: 400, y: 300 };
  private readonly DECK_POSITION = { x: 320, y: 300 };
  private readonly DISCARD_POSITION = { x: 480, y: 300 };
  private readonly PLAYER_POSITIONS = [
    { x: 400, y: 500, name: 'South Player' },  // Bottom (revealed to player)
    { x: 100, y: 300, name: 'West Player' },   // Left
    { x: 400, y: 100, name: 'North Player' },  // Top
    { x: 700, y: 300, name: 'East Player' }    // Right
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
    // Create 4 players with hands
    for (let i = 0; i < 4; i++) {
      const position = this.PLAYER_POSITIONS[i];
      const player = new Player({
        id: `player-${i}`,
        name: position.name,
        isHuman: i === 0
      });
      
      // Create a hand for each player
      const hand = new Hand(`hand-${i}`, `${position.name} Hand`, {
        maxCards: 10,
        isPlayerHand: i === 0, // First player (bottom) is the human player
        showCardFaces: i === 0, // Only show human player's cards
        allowMultiSelect: i === 0
      });

      // Add hand to player
      player.addPile(`hand-${i}`, hand);
      
      // Register player with table
      this.table.addPlayer(`player-${i}`, player);
      this.players.push(player);

      console.log(`Created ${position.name} with hand`);
    }
  }

  private setupPiles(): void {
    // Create deck
    this.deck = DeckFactory.createStandardDeck();
    this.deck.shuffle();
    
    // Create discard pile
    this.discardPile = new Pile();
    
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
        scale: 0.6,
        showCardCount: true
      }
    );

    // Create discard pile UI container
    this.discardPileUI = this.add.container(this.DISCARD_POSITION.x, this.DISCARD_POSITION.y);

    // Create hand UIs for each player
    this.players.forEach((player, index) => {
      const position = this.PLAYER_POSITIONS[index];
      const hand = player.getPile(`hand-${index}`) as Hand; // Get the hand
      
      const handUI = new HandUI(
        this,
        position.x,
        position.y,
        hand,
        {
          layout: index === 0 ? HandLayout.FAN : HandLayout.LINE, // Fan for human player, line for others
          scale: 0.5,
          width: 300,
          interactive: index === 0, // Only human player can interact
          showCardFaces: index === 0 // Only show human player's cards
        }
      );

      this.playerHandUIs.push(handUI);
    });

    // Add table background
    const tableGraphics = this.add.graphics();
    tableGraphics.fillStyle(0x006600); // Green table
    tableGraphics.fillRoundedRect(50, 50, 700, 500, 20);
    tableGraphics.setDepth(-1);

    // Add labels
    this.add.text(this.DECK_POSITION.x, this.DECK_POSITION.y - 80, 'DECK', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(this.DISCARD_POSITION.x, this.DISCARD_POSITION.y - 80, 'DISCARD', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }

  private setupEventListeners(): void {
    // Listen to table events
    this.table.on(TABLE_EVENTS.COMPLETE_TRANSFER, (event) => {
      console.log('Card transfer completed:', event);
      this.updateUI();
    });

    this.table.on(TABLE_EVENTS.CANCEL_TRANSFER, (event) => {
      console.log('Card transfer failed:', event);
    });

    // Listen to hand events for the human player
    const humanPlayer = this.players[0];
    const humanHand = humanPlayer.getPile('hand-0') as Hand;
    
    humanHand.on('cardAdded', (event) => {
      console.log('Human player received card:', event.card.displayName);
    });

    humanHand.on('selectionChanged', (event) => {
      console.log('Human player selection:', event.selectedCards.length + ' cards');
    });
  }

  private async dealInitialCards(): Promise<void> {
    console.log('Starting to deal cards...');
    
    // Deal 5 cards to each player in turn
    for (let round = 0; round < 5; round++) {
      for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
        const player = this.players[playerIndex];
        const hand = player.getPile(`hand-${playerIndex}`); // Get the hand
        
        await this.dealCardToPlayer(player, hand!, round * 200 + playerIndex * 50);
      }
    }

    // Deal one card to discard pile and reveal it
    this.time.delayedCall(5 * 200 + 4 * 50 + 500, () => {
      this.dealToDiscardPile();
    });

    // Reveal top deck card
    this.time.delayedCall(5 * 200 + 4 * 50 + 1000, () => {
      this.revealTopDeckCard();
    });
  }

  private async dealCardToPlayer(player: Player, targetHand: any, delay: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(delay, () => {
        // Draw card from deck and add to hand
        const card = this.deck.drawCard();
        if (card) {
          targetHand.addCard(card);
          console.log(`Dealt ${card.displayName} to ${player.name}`);
        }
        resolve();
      });
    });
  }

  private dealToDiscardPile(): void {
    const card = this.deck.drawCard();
    if (card) {
      this.discardPile.addCard(card);
      console.log(`Dealt ${card.displayName} to discard pile`);
      
      // Show the discard card
      this.time.delayedCall(200, () => {
        this.showDiscardCard(card);
      });
    }
  }

  private showDiscardCard(card: CardProperties): void {
    if (this.topDiscardCard) {
      this.topDiscardCard.destroy();
    }

    this.topDiscardCard = new CardUI(
      this,
      0, 0,
      card,
      {
        scale: 0.6,
        showFace: true,
        interactive: false
      }
    );

    this.discardPileUI.add(this.topDiscardCard);
  }

  private revealTopDeckCard(): void {
    console.log('Revealing top deck card...');
    this.deckUI.revealTopCard();
  }

  private updateUI(): void {
    // Update hand UIs to reflect new cards
    this.playerHandUIs.forEach((handUI, index) => {
      handUI.refresh();
    });

    // Update discard pile display
    const topDiscard = this.discardPile.peek();
    if (topDiscard && !this.topDiscardCard) {
      this.showDiscardCard(topDiscard);
    }
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
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });

    // Keyboard controls
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.dealRoundOfCards();
    });

    this.input.keyboard?.on('keydown-D', () => {
      const humanPlayer = this.players[0];
      const humanHand = humanPlayer.getPile('hand-0');
      const card = this.deck.drawCard();
      if (card && humanHand) {
        humanHand.addCard(card);
        console.log(`Drew ${card.displayName} for human player`);
      }
    });

    this.input.keyboard?.on('keydown-P', () => {
      const humanPlayer = this.players[0];
      const humanHand = humanPlayer.getPile('hand-0') as Hand;
      const selectedCards = humanHand.getSelectedCards;
      
      if (selectedCards.length > 0) {
        // Play cards to discard pile
        selectedCards.forEach(card => {
          humanHand.removeSpecificCard(card.id);
          this.discardPile.addCard(card);
          console.log(`Played ${card.displayName} to discard`);
        });
        humanHand.clearSelection();
        this.updateUI();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      const humanHand = this.players[0].getPile('hand-0') as Hand;
      humanHand.toggleVisibility();
      this.playerHandUIs[0].refresh();
    });

    this.input.keyboard?.on('keydown-S', () => {
      this.deck.shuffle();
      console.log('Deck shuffled');
    });
  }

  private dealRoundOfCards(): void {
    // Deal one card to each player
    this.players.forEach((player, index) => {
      const hand = player.getPile(`hand-${index}`);
      this.time.delayedCall(index * 100, () => {
        const card = this.deck.drawCard();
        if (card && hand) {
          hand.addCard(card);
          console.log(`Dealt ${card.displayName} to ${player.name}`);
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
    const player = new Player(config);
    const hand = new Hand(`hand-${index}`, `${config.name}'s Hand`, {
      maxCards: 10,
      isPlayerHand: config.isHuman
    });
    player.addPile(`hand-${index}`, hand);
    table.addPlayer(config.id, player);
  });

  // Create and register deck
  const deck = DeckFactory.createStandardDeck();
  deck.shuffle();
  table.registerPile('deck', deck);

  // Create and register discard pile
  const discardPile = new Pile();
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
