// Phaser-based Hand UI Component - Visual representation of a card hand
import Phaser from 'phaser';
import {
  HandUIConfig,
  HandUIState,
  CardPosition,
  CardUISprite,
  HandUIClickEvent,
  HandLayout,
  CardRevealStyle,
  HAND_UI_EVENTS,
  HAND_UI_PRESETS
} from '../hand/ui/hand-ui.types';
import { CardProperties } from '../card.types';
import { Hand } from '../hand/hand.manager';
import { HAND_EVENTS } from '../hand/hand.types';
import { ASSET_ATLAS } from '../../../assets.data';
import * as KennyCards from '../../../../../assets/game/art/kenny_cards/kenny_cards.data';
import { CardAnimationManager, CARD_ANIMATION_EVENTS } from './animations';

export class HandUI extends Phaser.GameObjects.Container {
  private config: HandUIConfig;
  private uiState: HandUIState;
  private hand: Hand;
  private cardSprites: CardUISprite[] = [];
  private backgroundGraphics: Phaser.GameObjects.Graphics | null = null;
  private isAnimating: boolean = false;

  static Events = HAND_UI_EVENTS;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    hand: Hand,
    config: Partial<HandUIConfig> = {}
  ) {
    super(scene, x, y);

    this.hand = hand;
    this.config = this.mergeWithDefaults(config);
    this.uiState = this.initializeState();

    // Add to scene
    scene.add.existing(this);

    // Initialize the visual representation
    this.createHandVisuals();
    this.setupInteractions();
    this.bindHandEvents();

    // Make container interactive
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.config.width, this.config.height),
      Phaser.Geom.Rectangle.Contains
    );
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  private mergeWithDefaults(config: Partial<HandUIConfig>): HandUIConfig {
    const defaultConfig = this.hand.isPlayerHand ? HAND_UI_PRESETS.POKER : HAND_UI_PRESETS.OPPONENT;
    return {
      ...defaultConfig,
      ...config
    } as HandUIConfig;
  }

  private initializeState(): HandUIState {
    return {
      displayedCards: [...this.hand.cards],
      selectedCards: [...this.hand.selectedCards],
      isAnimating: false,
      areCardsRevealed: this.config.showCardFaces,
      cardPositions: [],
      isHovered: false
    };
  }

  private bindHandEvents(): void {
    this.hand.on(HAND_EVENTS.CARD_ADDED, this.onCardAdded, this);
    this.hand.on(HAND_EVENTS.CARD_REMOVED, this.onCardRemoved, this);
    this.hand.on(HAND_EVENTS.SELECTION_CHANGED, this.onSelectionChanged, this);
    this.hand.on(HAND_EVENTS.HAND_REVEALED, this.onHandRevealed, this);
  }

  // =========================================================================
  // VISUAL CREATION
  // =========================================================================

  private createHandVisuals(): void {
    this.clearVisuals();
    this.createBackground();
    this.createCardSprites();
    this.calculateCardPositions();
    this.positionCards();
  }

  private createBackground(): void {
    if (!this.config.interactive) return;

    this.backgroundGraphics = this.scene.add.graphics();
    this.backgroundGraphics.fillStyle(0x00ff00, 0.1);
    this.backgroundGraphics.fillRoundedRect(
      -10, -10, 
      this.config.width + 20, 
      this.config.height + 20, 
      10
    );
    this.add(this.backgroundGraphics);
  }

  private createCardSprites(): void {
    this.cardSprites = [];

    this.uiState.displayedCards.forEach((card, index) => {
      const cardSprite = this.scene.add.image(0, 0, ASSET_ATLAS, this.getCardFrame(card));
      cardSprite.setOrigin(0.5, 0.5);
      cardSprite.setScale(this.config.scale);
      cardSprite.setDepth(index);

      if (this.config.showShadows) {
        cardSprite.setTintFill(0x000000, 0.1);
      }

      if (this.config.interactive && this.config.allowSelection) {
        cardSprite.setInteractive();
        cardSprite.on('pointerdown', () => this.onCardClicked(card));
        
        if (this.config.hoverEffect.enabled) {
          cardSprite.on('pointerover', () => this.onCardHover(card, true));
          cardSprite.on('pointerout', () => this.onCardHover(card, false));
        }
      }

      this.add(cardSprite);

      const cardUISprite: CardUISprite = {
        card,
        sprite: cardSprite,
        targetPosition: { card, x: 0, y: 0, rotation: 0, depth: index, selected: false },
        isAnimating: false
      };

      if (this.config.showSelectionIndicators && this.config.allowSelection) {
        const indicator = this.scene.add.graphics();
        indicator.lineStyle(3, this.config.selectionColor, 1);
        indicator.strokeRoundedRect(
          -cardSprite.displayWidth / 2,
          -cardSprite.displayHeight / 2,
          cardSprite.displayWidth,
          cardSprite.displayHeight,
          8
        );
        indicator.setVisible(false);
        this.add(indicator);
        cardUISprite.selectionIndicator = indicator;
      }

      this.cardSprites.push(cardUISprite);
    });
  }

  private getCardFrame(card: CardProperties): string {
    if (this.uiState.areCardsRevealed) {
      return card.assetKey;
    } else {
      return KennyCards.CARD_BACK;
    }
  }

  // =========================================================================
  // LAYOUT CALCULATIONS
  // =========================================================================

  private calculateCardPositions(): void {
    this.uiState.cardPositions = [];
    const cardCount = this.uiState.displayedCards.length;

    if (cardCount === 0) return;

    switch (this.config.layout) {
      case HandLayout.FAN:
        this.calculateFanPositions();
        break;
      case HandLayout.LINE:
        this.calculateLinePositions();
        break;
      case HandLayout.GRID:
        this.calculateGridPositions();
        break;
      case HandLayout.PILE:
        this.calculatePilePositions();
        break;
      case HandLayout.ARC:
        this.calculateArcPositions();
        break;
    }
  }

  private calculateFanPositions(): void {
    const cardCount = this.uiState.displayedCards.length;
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    this.uiState.displayedCards.forEach((card, index) => {
      const progress = cardCount > 1 ? index / (cardCount - 1) : 0.5;
      const angle = -this.config.fanAngle / 2 + progress * this.config.fanAngle;
      
      const x = centerX + Math.sin(angle) * this.config.fanRadius * 0.3;
      const y = centerY + Math.cos(angle) * this.config.fanRadius * 0.1;
      
      this.uiState.cardPositions.push({
        card,
        x,
        y,
        rotation: angle,
        depth: index,
        selected: this.hand.isCardSelected(card)
      });
    });
  }

  private calculateLinePositions(): void {
    const cardCount = this.uiState.displayedCards.length;
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const totalWidth = (cardCount - 1) * this.config.cardSpacing;
    const startX = centerX - totalWidth / 2;

    this.uiState.displayedCards.forEach((card, index) => {
      this.uiState.cardPositions.push({
        card,
        x: startX + index * this.config.cardSpacing,
        y: centerY,
        rotation: 0,
        depth: index,
        selected: this.hand.isCardSelected(card)
      });
    });
  }

  private calculateGridPositions(): void {
    const cardCount = this.uiState.displayedCards.length;
    const cols = Math.ceil(Math.sqrt(cardCount));
    const rows = Math.ceil(cardCount / cols);
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const spacingX = this.config.cardSpacing;
    const spacingY = this.config.cardSpacing;

    this.uiState.displayedCards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = centerX + (col - (cols - 1) / 2) * spacingX;
      const y = centerY + (row - (rows - 1) / 2) * spacingY;

      this.uiState.cardPositions.push({
        card,
        x,
        y,
        rotation: 0,
        depth: index,
        selected: this.hand.isCardSelected(card)
      });
    });
  }

  private calculatePilePositions(): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    this.uiState.displayedCards.forEach((card, index) => {
      this.uiState.cardPositions.push({
        card,
        x: centerX + index * 2,
        y: centerY + index * 2,
        rotation: (Math.random() - 0.5) * 0.1,
        depth: index,
        selected: this.hand.isCardSelected(card)
      });
    });
  }

  private calculateArcPositions(): void {
    const cardCount = this.uiState.displayedCards.length;
    const centerX = this.config.width / 2;
    const centerY = this.config.height;
    const radius = this.config.fanRadius;

    this.uiState.displayedCards.forEach((card, index) => {
      const progress = cardCount > 1 ? index / (cardCount - 1) : 0.5;
      const angle = Math.PI + progress * this.config.fanAngle;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.uiState.cardPositions.push({
        card,
        x,
        y,
        rotation: angle - Math.PI / 2,
        depth: index,
        selected: this.hand.isCardSelected(card)
      });
    });
  }

  // =========================================================================
  // CARD POSITIONING & ANIMATION
  // =========================================================================

  private positionCards(animate: boolean = false): void {
    this.cardSprites.forEach((cardUISprite, index) => {
      const position = this.uiState.cardPositions[index];
      if (!position) return;

      cardUISprite.targetPosition = position;

      if (animate && !cardUISprite.isAnimating) {
        this.animateCardToPosition(cardUISprite);
      } else {
        cardUISprite.sprite.setPosition(position.x, position.y);
        cardUISprite.sprite.setRotation(position.rotation);
        cardUISprite.sprite.setDepth(position.depth);
      }

      if (cardUISprite.selectionIndicator) {
        cardUISprite.selectionIndicator.setPosition(position.x, position.y);
        cardUISprite.selectionIndicator.setVisible(position.selected);
      }
    });
  }

  private animateCardToPosition(cardUISprite: CardUISprite): void {
    cardUISprite.isAnimating = true;
    const position = cardUISprite.targetPosition;

    this.scene.tweens.add({
      targets: cardUISprite.sprite,
      x: position.x,
      y: position.y,
      rotation: position.rotation,
      duration: this.config.animationDuration,
      ease: 'Power2',
      onComplete: () => {
        cardUISprite.isAnimating = false;
        cardUISprite.sprite.setDepth(position.depth);
      }
    });

    if (cardUISprite.selectionIndicator) {
      this.scene.tweens.add({
        targets: cardUISprite.selectionIndicator,
        x: position.x,
        y: position.y,
        duration: this.config.animationDuration,
        ease: 'Power2'
      });
    }
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  private setupInteractions(): void {
    if (!this.config.interactive) return;

    this.on('pointerdown', this.onHandClicked, this);
    
    if (this.config.hoverEffect.enabled) {
      this.on('pointerover', this.onHandHovered, this);
      this.on('pointerout', this.onHandUnhovered, this);
    }
  }

  private onCardClicked(card: CardProperties): void {
    if (!this.config.allowSelection) return;

    const wasSelected = this.hand.isCardSelected(card);
    this.hand.toggleCardSelection(card);

    const clickEvent: HandUIClickEvent = {
      handId: this.hand.id,
      card,
      position: { x: this.input!.localX, y: this.input!.localY },
      clickType: 'single',
      selectionChanged: wasSelected !== this.hand.isCardSelected(card)
    };

    this.emit(HAND_UI_EVENTS.CARD_CLICKED, clickEvent);
  }

  private onCardHover(card: CardProperties, isHovering: boolean): void {
    const cardUISprite = this.cardSprites.find(cs => cs.card.id === card.id);
    if (!cardUISprite || cardUISprite.isAnimating) return;

    if (isHovering) {
      this.scene.tweens.add({
        targets: cardUISprite.sprite,
        y: cardUISprite.targetPosition.y - this.config.hoverEffect.liftHeight,
        scaleX: this.config.scale * (1 + this.config.hoverEffect.scaleIncrease),
        scaleY: this.config.scale * (1 + this.config.hoverEffect.scaleIncrease),
        duration: 150,
        ease: 'Power2'
      });
    } else {
      this.scene.tweens.add({
        targets: cardUISprite.sprite,
        y: cardUISprite.targetPosition.y,
        scaleX: this.config.scale,
        scaleY: this.config.scale,
        duration: 150,
        ease: 'Power2'
      });
    }

    this.emit(HAND_UI_EVENTS.CARD_HOVERED, { card, isHovering });
  }

  private onHandClicked(): void {
    const clickEvent: HandUIClickEvent = {
      handId: this.hand.id,
      position: { x: this.input!.localX, y: this.input!.localY },
      clickType: 'single'
    };

    this.emit(HAND_UI_EVENTS.HAND_CLICKED, clickEvent);
  }

  private onHandHovered(): void {
    this.uiState.isHovered = true;
  }

  private onHandUnhovered(): void {
    this.uiState.isHovered = false;
  }

  // Hand event handlers
  private async onCardAdded(event: any): Promise<void> {
    this.uiState.displayedCards = [...this.hand.cards];
    this.createCardSprites();
    this.calculateCardPositions();
    this.positionCards(true);
  }

  private async onCardRemoved(event: any): Promise<void> {
    this.uiState.displayedCards = [...this.hand.cards];
    this.calculateCardPositions();
    this.positionCards(true);
  }

  private onSelectionChanged(event: any): void {
    this.uiState.selectedCards = [...event.selectedCards];
    
    this.cardSprites.forEach(cardUISprite => {
      if (cardUISprite.selectionIndicator) {
        const isSelected = this.hand.isCardSelected(cardUISprite.card);
        cardUISprite.selectionIndicator.setVisible(isSelected);
        cardUISprite.targetPosition.selected = isSelected;
      }
    });
  }

  private onHandRevealed(event: any): void {
    if (event.revealed) {
      this.revealCards();
    } else {
      this.hideCards();
    }
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  async revealCards(style: CardRevealStyle = CardRevealStyle.FLIP): Promise<void> {
    if (this.uiState.areCardsRevealed) return;

    this.isAnimating = true;
    this.uiState.areCardsRevealed = true;

    const revealPromises = this.cardSprites.map((cardUISprite, index) => {
      return new Promise<void>(resolve => {
        const delay = index * 100;

        this.scene.time.delayedCall(delay, () => {
          if (style === CardRevealStyle.FLIP) {
            this.animateCardFlip(cardUISprite, true, resolve);
          } else {
            cardUISprite.sprite.setFrame(cardUISprite.card.assetKey);
            resolve();
          }
        });
      });
    });

    await Promise.all(revealPromises);
    this.isAnimating = false;
    this.emit(HAND_UI_EVENTS.CARDS_REVEALED, { handId: this.hand.id });
  }

  async hideCards(style: CardRevealStyle = CardRevealStyle.FLIP): Promise<void> {
    if (!this.uiState.areCardsRevealed) return;

    this.isAnimating = true;
    this.uiState.areCardsRevealed = false;

    const hidePromises = this.cardSprites.map((cardUISprite, index) => {
      return new Promise<void>(resolve => {
        const delay = index * 50;

        this.scene.time.delayedCall(delay, () => {
          if (style === CardRevealStyle.FLIP) {
            this.animateCardFlip(cardUISprite, false, resolve);
          } else {
            cardUISprite.sprite.setFrame(KennyCards.CARD_BACK);
            resolve();
          }
        });
      });
    });

    await Promise.all(hidePromises);
    this.isAnimating = false;
    this.emit(HAND_UI_EVENTS.CARDS_HIDDEN, { handId: this.hand.id });
  }

  private animateCardFlip(cardUISprite: CardUISprite, reveal: boolean, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: cardUISprite.sprite,
      scaleX: 0,
      duration: this.config.animationDuration / 2,
      ease: 'Power2',
      onComplete: () => {
        const frame = reveal ? cardUISprite.card.assetKey : KennyCards.CARD_BACK;
        cardUISprite.sprite.setFrame(frame);
        
        this.scene.tweens.add({
          targets: cardUISprite.sprite,
          scaleX: this.config.scale,
          duration: this.config.animationDuration / 2,
          ease: 'Power2',
          onComplete
        });
      }
    });
  }

  refresh(): void {
    this.uiState.displayedCards = [...this.hand.cards];
    this.uiState.selectedCards = [...this.hand.selectedCards];
    this.createHandVisuals();
  }

  updateConfig(newConfig: Partial<HandUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.refresh();
  }

  setLayout(layout: HandLayout): void {
    this.config.layout = layout;
    this.calculateCardPositions();
    this.positionCards(true);
    this.emit(HAND_UI_EVENTS.LAYOUT_CHANGED, { layout });
  }

  getCenterPosition(): { x: number; y: number } {
    return {
      x: this.x + this.config.width / 2,
      y: this.y + this.config.height / 2
    };
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  private clearVisuals(): void {
    this.removeAll(true);
    this.cardSprites.forEach(cardUISprite => {
      if (cardUISprite.sprite) cardUISprite.sprite.destroy();
      if (cardUISprite.selectionIndicator) cardUISprite.selectionIndicator.destroy();
    });
    this.cardSprites = [];
    this.backgroundGraphics = null;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get handId(): string {
    return this.hand.id;
  }

  get handName(): string {
    return this.hand.name;
  }

  get isPlayerHand(): boolean {
    return this.hand.isPlayerHand;
  }

  get cardCount(): number {
    return this.uiState.displayedCards.length;
  }

  get isAnimatingCards(): boolean {
    return this.isAnimating;
  }

  override destroy(): void {
    this.hand.off(HAND_EVENTS.CARD_ADDED, this.onCardAdded, this);
    this.hand.off(HAND_EVENTS.CARD_REMOVED, this.onCardRemoved, this);
    this.hand.off(HAND_EVENTS.SELECTION_CHANGED, this.onSelectionChanged, this);
    this.hand.off(HAND_EVENTS.HAND_REVEALED, this.onHandRevealed, this);

    this.clearVisuals();
    super.destroy();
    this.removeAllListeners();
  }

  // =========================================================================
  // STATIC FACTORY METHODS
  // =========================================================================

  static createPlayerHandUI(scene: Phaser.Scene, x: number, y: number, hand: Hand): HandUI {
    const handUI = new HandUI(scene, x, y, hand, HAND_UI_PRESETS.POKER);
    return handUI;
  }

  static createOpponentHandUI(scene: Phaser.Scene, x: number, y: number, hand: Hand): HandUI {
    const handUI = new HandUI(scene, x, y, hand, HAND_UI_PRESETS.OPPONENT);
    return handUI;
  }

  static createDealerHandUI(scene: Phaser.Scene, x: number, y: number, hand: Hand): HandUI {
    const handUI = new HandUI(scene, x, y, hand, HAND_UI_PRESETS.BLACKJACK);
    return handUI;
  }
}
