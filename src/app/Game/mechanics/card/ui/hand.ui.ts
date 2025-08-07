// Hand UI Component - Visual representation of a Hand extending PileUI
import Phaser from 'phaser';
import { PileUI, PileUIConfig, CardUITransfer } from './pile.ui';
import { Hand, HAND_EVENTS } from '../hand/hand.manager';
import { CardUI } from './card.ui';
import { HandLayout } from '../hand';

export interface HandUIConfig extends PileUIConfig {
  layout: HandLayout;
  fanAngle: number;
  cardSpacing: number;
  showCardFaces: boolean;
  allowSelection: boolean;
  maxHandSize: number;
  selectionHighlight: boolean;
}

export class HandUI extends PileUI {
  protected override config: HandUIConfig;
  protected override pile: Hand;
  
  // Hand-specific visual elements
  private selectedCardUIs: Set<CardUI> = new Set();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    hand: Hand,
    config: Partial<HandUIConfig> = {}
  ) {
    super(scene, x, y, hand, config);
    this.pile = hand;
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  protected override mergeWithDefaults(config: Partial<HandUIConfig>): HandUIConfig {
    const baseConfig = super.mergeWithDefaults(config);
    return {
      ...baseConfig,
      layout: 'fan',
      fanAngle: 45,
      cardSpacing: 60,
      showCardFaces: true,
      allowSelection: true,
      maxHandSize: 10,
      selectionHighlight: true,
      ...config
    } as HandUIConfig;
  }

  protected override setupInteractivity(): void {
    super.setupInteractivity();
    
    // Enable individual card interactions if allowed
    if (this.config.allowSelection) {
      this.enableCardSelection();
    }
  }

  // =========================================================================
  // CARD SELECTION
  // =========================================================================

  private enableCardSelection(): void {
    // Card selection will be handled through card click events
    // This is set up when cards are added to the hand
  }

  private onCardClick(cardUI: CardUI): void {
    if (!this.config.allowSelection) return;

    if (this.selectedCardUIs.has(cardUI)) {
      this.deselectCard(cardUI);
    } else {
      this.selectCard(cardUI);
    }
  }

  private selectCard(cardUI: CardUI): void {
    this.selectedCardUIs.add(cardUI);
    
    if (this.config.selectionHighlight) {
      this.highlightCard(cardUI, true);
    }

    // Emit selection event
    this.emit('cardSelected', { cardUI, card: cardUI.card });
  }

  private deselectCard(cardUI: CardUI): void {
    this.selectedCardUIs.delete(cardUI);
    
    if (this.config.selectionHighlight) {
      this.highlightCard(cardUI, false);
    }

    // Emit deselection event
    this.emit('cardDeselected', { cardUI, card: cardUI.card });
  }

  private highlightCard(cardUI: CardUI, highlight: boolean): void {
    const targetY = highlight ? cardUI.y - 20 : this.calculateCardPosition(this.cardUIs.indexOf(cardUI)).y;
    
    this.scene.tweens.add({
      targets: cardUI,
      y: targetY,
      duration: 200,
      ease: 'Power2'
    });
  }

  // =========================================================================
  // CARDUI MANAGEMENT OVERRIDE
  // =========================================================================

  override addCardUI(cardUI: CardUI): void {
    super.addCardUI(cardUI);
    
    // Set up card interactions
    if (this.config.allowSelection) {
      cardUI.setInteractive();
      cardUI.on('pointerdown', () => this.onCardClick(cardUI));
    }

    // Show face if configured
    if (this.config.showCardFaces) {
      cardUI.showFace();
    }
  }

  override removeCardUI(cardUI: CardUI): boolean {
    // Remove from selection if selected
    this.selectedCardUIs.delete(cardUI);
    
    // Remove event listeners
    cardUI.off('pointerdown');
    
    return super.removeCardUI(cardUI);
  }

  // =========================================================================
  // LAYOUT CALCULATION OVERRIDE
  // =========================================================================

  protected override calculateCardPosition(index: number): { x: number; y: number } {
    const totalCards = this.cardUIs.length;
    
    switch (this.config.layout) {
      case 'fan':
        return this.calculateFanPosition(index, totalCards);
      case 'line':
        return this.calculateLinePosition(index, totalCards);
      case 'grid':
        return this.calculateGridPosition(index, totalCards);
      default:
        return super.calculateCardPosition(index);
    }
  }

  private calculateFanPosition(index: number, totalCards: number): { x: number; y: number } {
    if (totalCards === 1) {
      return { x: 0, y: 0 };
    }

    const centerIndex = (totalCards - 1) / 2;
    const angleStep = this.config.fanAngle / Math.max(1, totalCards - 1);
    const angle = (index - centerIndex) * angleStep;
    
    const radius = 150;
    const x = Math.sin(Phaser.Math.DegToRad(angle)) * radius;
    const y = Math.cos(Phaser.Math.DegToRad(angle)) * radius * 0.3;
    
    return { x, y };
  }

  private calculateLinePosition(index: number, totalCards: number): { x: number; y: number } {
    const centerIndex = (totalCards - 1) / 2;
    const x = (index - centerIndex) * this.config.cardSpacing;
    
    return { x, y: 0 };
  }

  private calculateGridPosition(index: number, totalCards: number): { x: number; y: number } {
    const cardsPerRow = Math.ceil(Math.sqrt(totalCards));
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    
    const x = (col - (cardsPerRow - 1) / 2) * this.config.cardSpacing;
    const y = row * 120; // Card height spacing
    
    return { x, y };
  }

  // =========================================================================
  // EVENT HANDLERS OVERRIDE
  // =========================================================================

  protected override onCardAdded(event: any): void {
    super.onCardAdded(event);
    
    // Hand-specific behavior when card added
    if (this.cardUIs.length > this.config.maxHandSize) {
      console.warn(`Hand exceeds maximum size: ${this.cardUIs.length}/${this.config.maxHandSize}`);
    }
  }

  protected override onCardRemoved(event: any): void {
    super.onCardRemoved(event);
    
    // Update layout after card removal
    this.updateCardPositions();
  }

  protected override onCardsOrganized(event: any): void {
    super.onCardsOrganized(event);
    
    // Clear selections when hand is reorganized
    this.clearSelection();
  }

  // =========================================================================
  // HAND-SPECIFIC METHODS
  // =========================================================================

  getSelectedCards(): CardUI[] {
    return Array.from(this.selectedCardUIs);
  }

  clearSelection(): void {
    this.selectedCardUIs.forEach(cardUI => {
      this.highlightCard(cardUI, false);
    });
    this.selectedCardUIs.clear();
  }

  organizeByValue(): void {
    this.pile.organize((a, b) => {
      const aVal = a.data?.['value'] || 0;
      const bVal = b.data?.['value'] || 0;
      return Number(aVal) - Number(bVal);
    });
  }

  organizeBySuit(): void {
    this.pile.organize((a, b) => {
      const aSuit = a.data?.['suit'] || '';
      const bSuit = b.data?.['suit'] || '';
      return aSuit.localeCompare(bSuit);
    });
  }

  // =========================================================================
  // INTERACTION HANDLERS OVERRIDE
  // =========================================================================

  protected override onPileClick(pointer: Phaser.Input.Pointer): void {
    // Hand-specific click behavior
    if (this.isEmpty) {
      console.log(`Hand ${this.pile.name} is empty`);
    } else {
      console.log(`Hand ${this.pile.name} has ${this.cardCount} cards`);
    }
  }

  protected override onPileHover(pointer: Phaser.Input.Pointer): void {
    // Optional hover effects for hand
  }

  protected override onPileOut(pointer: Phaser.Input.Pointer): void {
    // Clean up hover effects
  }
}
