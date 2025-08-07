// Deck UI Component - Visual representation of a Deck extending PileUI
import Phaser from 'phaser';
import { PileUI, PileUIConfig, CardUITransfer } from './pile.ui';
import { Deck, DECK_EVENTS } from '../deck/deck.manager';
import { CardUI } from './card.ui';

export interface DeckUIConfig extends PileUIConfig {
  showTopCard: boolean;
  enableDrawing: boolean;
  dealAnimation: boolean;
}

export class DeckUI extends PileUI {
  protected override config: DeckUIConfig;
  protected override pile: Deck;
  private topCardUI?: CardUI;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    deck: Deck,
    config: Partial<DeckUIConfig> = {}
  ) {
    super(scene, x, y, deck, config);
    this.bindDeckEvents();
    this.createInitialCardUIs();
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  protected override mergeWithDefaults(config: Partial<DeckUIConfig>): DeckUIConfig {
    const baseConfig = super.mergeWithDefaults(config);
    return {
      ...baseConfig,
      showTopCard: true,
      enableDrawing: true,
      dealAnimation: true,
      interactive: true,
      ...config
    } as DeckUIConfig;
  }

  private createInitialCardUIs(): void {
    // Create CardUI for all cards in the deck (invisible initially)
    this.pile.getAllCards().forEach((card, index) => {
      const cardUI = new CardUI(this.scene, 0, 0, card, {
        showFace: false,
        interactive: false
      });
      
      cardUI.setVisible(index >= this.pile.size() - this.config.maxVisibleCards);
      this.addCardUI(cardUI);
    });

    this.updateTopCard();
  }

  private bindDeckEvents(): void {
    this.pile.on(DECK_EVENTS.CARD_DRAWN, this.onCardDrawn, this);
    this.pile.on(DECK_EVENTS.CARDS_DRAWN, this.onCardsDrawn, this);
    this.pile.on(DECK_EVENTS.PILE_SHUFFLED, this.onDeckShuffled, this);
    this.pile.on(DECK_EVENTS.DECK_RESET, this.onDeckReset, this);
  }

  // =========================================================================
  // DECK EVENT HANDLERS
  // =========================================================================

  private onCardDrawn(event: any): void {
    const { card } = event;
    this.updateDisplay();
    this.updateTopCard();
  }

  private onCardsDrawn(event: any): void {
    const { cards } = event;
    this.updateDisplay();
    this.updateTopCard();
  }

  private onDeckShuffled(event: any): void {
    this.animateShuffleEffect();
    this.updateTopCard();
  }

  private onDeckReset(event: any): void {
    this.clearAllCardUIs();
    this.createInitialCardUIs();
  }

  // =========================================================================
  // CARD MANAGEMENT
  // =========================================================================

  private updateTopCard(): void {
    const topCard = this.pile.peek();
    
    if (topCard && this.config.showTopCard) {
      this.topCardUI = this.findCardUI(topCard.id);
      if (this.topCardUI) {
        this.topCardUI.setDepth(this.config.maxVisibleCards + 1);
      }
    } else {
      this.topCardUI = undefined;
    }
  }

  // =========================================================================
  // DRAWING OPERATIONS
  // =========================================================================

  drawCard(): CardUI | null {
    if (!this.config.enableDrawing || this.pile.isEmpty()) {
      return null;
    }

    const card = this.pile.draw();
    if (!card) return null;

    const cardUI = this.findCardUI(card.id);
    if (cardUI) {
      this.removeCardUI(cardUI);
      return cardUI;
    }

    return null;
  }

  createCardUIForTransfer(): CardUITransfer | null {
    const drawnCardUI = this.drawCard();
    if (!drawnCardUI) return null;

    return {
      cardUI: drawnCardUI,
      card: drawnCardUI.card,
      sourcePosition: { 
        x: this.x + drawnCardUI.x, 
        y: this.y + drawnCardUI.y 
      }
    };
  }

  // =========================================================================
  // LAYOUT OVERRIDE
  // =========================================================================

  protected override calculateCardPosition(index: number): { x: number; y: number } {
    // Stack layout with slight offset for depth effect
    const visibleIndex = Math.min(index, this.config.maxVisibleCards - 1);
    return {
      x: visibleIndex * this.config.cardOffsetX,
      y: visibleIndex * this.config.cardOffsetY
    };
  }

  protected override updateCardPositions(): void {
    super.updateCardPositions();
    
    // Only show the top few cards
    this.cardUIs.forEach((cardUI, index) => {
      const shouldBeVisible = index >= this.cardUIs.length - this.config.maxVisibleCards;
      cardUI.setVisible(shouldBeVisible);
    });
  }

  // =========================================================================
  // INTERACTION OVERRIDE
  // =========================================================================

  protected override onPileClick(pointer: Phaser.Input.Pointer): void {
    if (this.config.enableDrawing && !this.pile.isEmpty()) {
      const transfer = this.createCardUIForTransfer();
      if (transfer) {
        // Emit event for external handling
        this.emit('cardDrawnFromDeck', {
          transfer,
          deck: this.pile,
          timestamp: Date.now()
        });
      }
    }
  }

  protected override onPileHover(pointer: Phaser.Input.Pointer): void {
    if (this.config.enableDrawing && !this.pile.isEmpty() && this.topCardUI) {
      this.topCardUI.setTint(0xcccccc);
    }
  }

  protected override onPileOut(pointer: Phaser.Input.Pointer): void {
    if (this.topCardUI) {
      this.topCardUI.clearTint();
    }
  }

  // =========================================================================
  // DISPLAY OVERRIDE
  // =========================================================================

  protected override getCardCountText(): string {
    return `${this.pile.size()}`;
  }

  // =========================================================================
  // DECK-SPECIFIC OPERATIONS
  // =========================================================================

  shuffleDeck(): void {
    this.pile.shuffle();
  }

  resetDeck(): void {
    this.pile.reset();
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(fromScene?: boolean): void {
    this.pile.off(DECK_EVENTS.CARD_DRAWN, this.onCardDrawn, this);
    this.pile.off(DECK_EVENTS.CARDS_DRAWN, this.onCardsDrawn, this);
    this.pile.off(DECK_EVENTS.PILE_SHUFFLED, this.onDeckShuffled, this);
    this.pile.off(DECK_EVENTS.DECK_RESET, this.onDeckReset, this);
    super.destroy(fromScene);
  }
}
