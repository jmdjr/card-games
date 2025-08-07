// Base Pile UI Component - Visual representation responding to Pile events
import Phaser from 'phaser';
import { Pile, PILE_EVENTS } from '../pile/pile.manager';
import { CardUI } from './card.ui';
import { CardProperties } from '../card.types';

export interface PileUIConfig {
  scale: number;
  width: number;
  height: number;
  interactive: boolean;
  showCardCount: boolean;
  maxVisibleCards: number;
  cardOffsetX: number;
  cardOffsetY: number;
  animationDuration: number;
  debug: boolean;
}

export interface CardUITransfer {
  cardUI: CardUI;
  card: CardProperties;
  sourcePosition: { x: number; y: number };
}

export class PileUI extends Phaser.GameObjects.Container {
  protected config: PileUIConfig;
  protected pile: Pile;
  protected cardUIs: CardUI[] = [];
  protected isAnimating: boolean = false;
  
  // UI Elements
  protected emptyPileGraphics?: Phaser.GameObjects.Graphics;
  protected pileText?: Phaser.GameObjects.Text;
  protected debugBounds?: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pile: Pile,
    config: Partial<PileUIConfig> = {}
  ) {
    super(scene, x, y);

    this.pile = pile;
    this.config = this.mergeWithDefaults(config);

    // Add to scene
    scene.add.existing(this);

    // Bind pile events
    this.bindPileEvents();

    // Create initial visuals
    this.createPileVisuals();

    // Make interactive if configured
    if (this.config.interactive) {
      this.setupInteractivity();
    }
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  protected mergeWithDefaults(config: Partial<PileUIConfig>): PileUIConfig {
    return {
      scale: 3,
      interactive: false,
      showCardCount: true,
      maxVisibleCards: 5,
      cardOffsetX: 2,
      cardOffsetY: 2,
      animationDuration: 300,
      debug: false,
      height: 50,
      width: 80,
      ...config
    };
  }

  protected createPileVisuals(): void {
    this.createEmptyPileGraphics();
    if (this.config.showCardCount) {
      this.createCardCountText();
    }
    if (this.config.debug) {
      this.createDebugBounds();
    }
  }

  protected createEmptyPileGraphics(): void {
    this.emptyPileGraphics = this.scene.add.graphics();
    this.emptyPileGraphics.lineStyle(2, 0x888888, 0.5);
    this.emptyPileGraphics.fillStyle(0x000000, 0.1);
    const width = this._configedWidth();
    const height = this._configedHeight();
    this.emptyPileGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    this.emptyPileGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    this.add(this.emptyPileGraphics);
    this.updateEmptyPileVisibility();
  }

  protected createCardCountText(): void {
    if (!this.pileText) {
      this.pileText = this.scene.add.text(0, 100, this.getCardCountText(), {
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      });
      this.pileText.setOrigin(0.5);
      this.add(this.pileText);
    }
  }

  protected createDebugBounds(): void {
    this.debugBounds = this.scene.add.rectangle(0, 0, 120, 160, 0x00ff00, 0.2);
    this.debugBounds.setStrokeStyle(2, 0x00ff00);
    this.add(this.debugBounds);
  }
  
  private _configedWidth(): number {
    return this.config.width * this.config.scale;
  }
  private _configedHeight(): number {
    return this.config.height * this.config.scale;
  }

  protected setupInteractivity(): void {
    const rect = this.scene.add.rectangle(0, 0, this._configedWidth(), this._configedHeight(), 0x00ff00, 0.5);
    this.setInteractive(
      rect.getBounds(),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(rect);

    this.on('pointerdown', this.onPileClick, this);
    this.on('pointerover', this.onPileHover, this);
    this.on('pointerout', this.onPileOut, this);
  }

  // =========================================================================
  // EVENT BINDING
  // =========================================================================

  protected bindPileEvents(): void {
    this.pile.on(PILE_EVENTS.CARD_ADDED, this.onCardAdded, this);
    this.pile.on(PILE_EVENTS.CARD_REMOVED, this.onCardRemoved, this);
    this.pile.on(PILE_EVENTS.CARDS_ADDED, this.onCardsAdded, this);
    this.pile.on(PILE_EVENTS.CARDS_REMOVED, this.onCardsRemoved, this);
    this.pile.on(PILE_EVENTS.PILE_SHUFFLED, this.onPileShuffled, this);
    this.pile.on(PILE_EVENTS.CARDS_ORGANIZED, this.onCardsOrganized, this);
    this.pile.on(PILE_EVENTS.PILE_CLEARED, this.onPileCleared, this);
    this.pile.on(PILE_EVENTS.PILE_CHANGED, this.onPileChanged, this);
  }

  protected unbindPileEvents(): void {
    this.pile.off(PILE_EVENTS.CARD_ADDED, this.onCardAdded, this);
    this.pile.off(PILE_EVENTS.CARD_REMOVED, this.onCardRemoved, this);
    this.pile.off(PILE_EVENTS.CARDS_ADDED, this.onCardsAdded, this);
    this.pile.off(PILE_EVENTS.CARDS_REMOVED, this.onCardsRemoved, this);
    this.pile.off(PILE_EVENTS.PILE_SHUFFLED, this.onPileShuffled, this);
    this.pile.off(PILE_EVENTS.CARDS_ORGANIZED, this.onCardsOrganized, this);
    this.pile.off(PILE_EVENTS.PILE_CLEARED, this.onPileCleared, this);
    this.pile.off(PILE_EVENTS.PILE_CHANGED, this.onPileChanged, this);
  }

  // =========================================================================
  // PILE EVENT HANDLERS
  // =========================================================================

  protected onCardAdded(event: any): void {
    // Subclasses should implement specific behavior
    this.updateDisplay();
  }

  protected onCardRemoved(event: any): void {
    // Subclasses should implement specific behavior
    this.updateDisplay();
  }

  protected onCardsAdded(event: any): void {
    this.updateDisplay();
  }

  protected onCardsRemoved(event: any): void {
    this.updateDisplay();
  }

  protected onPileShuffled(event: any): void {
    this.animateShuffleEffect();
    this.updateDisplay();
  }

  protected onPileCleared(event: any): void {
    this.clearAllCardUIs();
    this.updateDisplay();
  }

  protected onPileChanged(event: any): void {
    this.updateDisplay();
  }

  // =========================================================================
  // CARDUI MANAGEMENT
  // =========================================================================

  addCardUI(cardUI: CardUI): void {
    this.cardUIs.push(cardUI);
    this.add(cardUI);
    this.updateDisplay();
  }

  removeCardUI(cardUI: CardUI): boolean {
    const index = this.cardUIs.indexOf(cardUI);
    if (index !== -1) {
      this.cardUIs.splice(index, 1);
      this.remove(cardUI);
      this.updateDisplay();
      return true;
    }
    return false;
  }

  findCardUI(cardId: string): CardUI | undefined {
    return this.cardUIs.find(cardUI => cardUI.card.id === cardId);
  }

  clearAllCardUIs(): void {
    this.cardUIs.forEach(cardUI => {
      this.remove(cardUI);
      // Don't destroy - let the table manage CardUI lifecycle
    });
    this.cardUIs = [];
    this.updateDisplay();
  }

  // =========================================================================
  // CARDUI TRANSFER SYSTEM
  // =========================================================================

  acceptCardUI(transfer: CardUITransfer): Promise<void> {
    const { cardUI, card, sourcePosition } = transfer;
    
    // Add to this pile's visual container
    this.addCardUI(cardUI);
    
    // Animate from source position to target position
    return this.animateCardUIToPosition(cardUI, sourcePosition);
  }

  releaseCardUI(cardId: string): CardUITransfer | null {
    const cardUI = this.findCardUI(cardId);
    const card = this.pile.findCard(c => c.id === cardId);
    
    if (!cardUI || !card) return null;

    const transfer: CardUITransfer = {
      cardUI,
      card,
      sourcePosition: { 
        x: this.x + cardUI.x, 
        y: this.y + cardUI.y 
      }
    };

    // Remove from this pile's visuals (but don't destroy)
    this.removeCardUI(cardUI);
    
    return transfer;
  }

  // =========================================================================
  // ANIMATION HELPERS
  // =========================================================================

  protected animateCardUIToPosition(cardUI: CardUI, sourcePosition: { x: number; y: number }): Promise<void> {
    return new Promise(resolve => {
      if (this.isAnimating) {
        resolve();
        return;
      }

      this.isAnimating = true;

      // Calculate target position within this container
      const targetPosition = this.calculateCardPosition(this.cardUIs.length - 1);

      // Start animation from source position
      cardUI.setPosition(sourcePosition.x - this.x, sourcePosition.y - this.y);
      
      this.scene.tweens.add({
        targets: cardUI,
        x: targetPosition.x,
        y: targetPosition.y,
        duration: this.config.animationDuration,
        ease: 'Power2',
        onComplete: () => {
          this.isAnimating = false;
          resolve();
        }
      });
    });
  }

  protected animateShuffleEffect(): void {
    if (this.cardUIs.length === 0) return;

    this.cardUIs.forEach((cardUI, index) => {
      this.scene.tweens.add({
        targets: cardUI,
        x: cardUI.x + Phaser.Math.Between(-10, 10),
        y: cardUI.y + Phaser.Math.Between(-10, 10),
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    });
  }

  // =========================================================================
  // LAYOUT CALCULATION (Override in subclasses)
  // =========================================================================

  protected calculateCardPosition(index: number): { x: number; y: number } {
    // Default: simple stack layout
    return {
      x: index * this.config.cardOffsetX,
      y: index * this.config.cardOffsetY
    };
  }

  // =========================================================================
  // DISPLAY UPDATES
  // =========================================================================

  protected updateDisplay(): void {
    this.updateEmptyPileVisibility();
    this.updateCardCountText();
    this.updateCardPositions();
  }

  protected updateEmptyPileVisibility(): void {
    if (this.emptyPileGraphics) {
      this.emptyPileGraphics.setVisible(true || this.pile.isEmpty());
    }
  }

  protected updateCardCountText(): void {
    if (this.pileText) {
      this.pileText.setText(this.getCardCountText());
    }
  }

  protected get maxVisibleCardsToShow(): number {
    return Math.min(this.config.maxVisibleCards, this.pile.size());
  }

  protected updateCardPositions(): void {
    const minVisibleIndex = Math.max(0, this.cardUIs.length - this.maxVisibleCardsToShow);
    this.cardUIs.forEach((cardUI, index) => {
      if (index < minVisibleIndex) {
        cardUI.setVisible(false);
      } else {
        const position = this.calculateCardPosition(index);
        cardUI.setPosition(position.x, position.y);
        cardUI.setDepth(index);
      }
    });
  }

  protected getCardCountText(): string {
    return this.pile.size().toString();
  }

  // =========================================================================
  // INTERACTION HANDLERS (Override in subclasses)
  // =========================================================================

  protected onPileClick(pointer: Phaser.Input.Pointer): void {
    console.log(`Pile ${this.pile.name} clicked`);
  }

  protected onPileHover(pointer: Phaser.Input.Pointer): void {
    // Override in subclasses
  }

  protected onPileOut(pointer: Phaser.Input.Pointer): void {
    // Override in subclasses
  }

  protected onCardsOrganized(event: any): void {
    // Default implementation - reorganize card positions
    this.updateCardPositions();
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get cardCount(): number {
    return this.pile.size();
  }

  get isEmpty(): boolean {
    return this.pile.isEmpty();
  }

  get isInteractive(): boolean {
    return this.config.interactive;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(fromScene?: boolean): void {
    this.unbindPileEvents();
    this.clearAllCardUIs();
    super.destroy(fromScene);
  }
}
