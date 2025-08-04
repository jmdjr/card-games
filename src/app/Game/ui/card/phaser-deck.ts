// Phaser-based Deck UI Component - Visual representation of a card deck
import Phaser, { Tweens } from 'phaser';
import {
  DeckUIConfig,
  DeckUIState,
  CardDrawEvent,
  DeckClickEvent,
  DeckStyle,
  DeckOrientation,
  DECK_UI_PRESETS
} from './deck-ui.types';
import { CardProperties } from '../../mechanics/card/card.types';
import { Deck, GAME_TYPE } from '../../mechanics/card/deck.manager';
import { ASSET_ATLAS } from '../../assets.data';
import * as KennyCards from '../../../../assets/game/art/kenny_cards/kenny_cards.data';


export class PhaserDeck extends Phaser.GameObjects.Container {
  private config: DeckUIConfig;
  private deckState: DeckUIState;
  private deck: Deck;
  private cardSprites: Phaser.GameObjects.Image[] = [];
  private topCardSprite: Phaser.GameObjects.Image | null = null;
  private cardCountText: Phaser.GameObjects.Text | null = null;
  private emptyDeckGraphics: Phaser.GameObjects.Graphics | null = null;
  static Events = {
    CARD_DRAWN: 'cardDrawn',
    DECK_SHUFFLED: 'deckShuffled',
    DECK_CLICK: 'deckClick'
  };

  // Animation tracking
  private isAnimating: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    deck: Deck,
    config: Partial<DeckUIConfig> = {}
  ) {
    super(scene, x, y);

    this.deck = deck;
    this.config = this.mergeWithDefaults(config);
    this.deckState = this.initializeState();

    // Add to scene
    scene.add.existing(this);

    // Initialize the visual representation
    this.createDeckVisuals();
    this.setupInteractions();
    const debug = new Phaser.Geom.Rectangle(0, 0, this._configedWidth(), this._configedHeight());

    // Make container interactive
    this.setInteractive(
      debug,
      Phaser.Geom.Rectangle.Contains
    );
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  private mergeWithDefaults(config: Partial<DeckUIConfig>): DeckUIConfig {
    const preset = DECK_UI_PRESETS[this.deck.gameType];
    return {
      ...preset,
      ...config
    } as DeckUIConfig;
  }

  private initializeState(): DeckUIState {
    return {
      cardCount: this.deck.size(),
      topCard: this.config.showTopCard ? this.deck.peek() : null,
      isShuffling: false,
      isDrawing: false,
      isEmpty: this.deck.isEmpty(),
      position: { x: 0, y: 0 },
      rotation: 0
    };
  }

  // =========================================================================
  // VISUAL CREATION
  // =========================================================================

  private createDeckVisuals(): void {
    this.clearVisuals();

    if (this.deckState.isEmpty) {
      this.createEmptyDeckVisual();
    } else {
      this.createCardStack();

      if (this.config.showTopCard && this.deckState.topCard) {
        this.createTopCardVisual();
      }
    }

    if (this.config.showCardCount) {
      this.createCardCountDisplay();
    }
  }

  private createCardStack(): void {
    const cardsToShow = Math.min(this.deckState.cardCount, this.config.maxVisibleCards);
    const backFrameName = this.getBackFrameName();

    for (let i = 0; i < cardsToShow; i++) {
      const offsetX = i * this.config.cardOffsetX;
      const offsetY = i * this.config.cardOffsetY;

      const cardSprite = this.scene.add.image(offsetX, offsetY, ASSET_ATLAS, backFrameName);
      cardSprite.setOrigin(0, 0);
      cardSprite.setScale(this.config.scale);
      cardSprite.setDepth(i);

      // Add subtle shadow effect for depth
      if (this.config.shadow && i > 0) {
        cardSprite.setTintFill(0x000000, 0.1);
      }

      this.add(cardSprite);
      this.cardSprites.push(cardSprite);
    }
  }

  private _configedWidth(): number {
    return this.config.width * this.config.scale;
  }
  private _configedHeight(): number {
    return this.config.height * this.config.scale;
  }

  private createTopCardVisual(): void {
    if (!this.deckState.topCard) return;

    const offsetX = (this.config.maxVisibleCards * this.config.cardOffsetX) + 10;
    const offsetY = this.config.maxVisibleCards * this.config.cardOffsetY;

    this.topCardSprite = this.scene.add.image(offsetX, offsetY, ASSET_ATLAS, this.deckState.topCard.assetKey);
    this.topCardSprite.setOrigin(0, 0);
    this.topCardSprite.setScale(this.config.scale); // Scale up for visibility
    this.topCardSprite.setDepth(this.config.maxVisibleCards + 1);

    // Add green border to indicate it's the revealed card
    // const borderGraphics = this.scene.add.graphics();
    // borderGraphics.lineStyle(3, 0x4CAF50);
    // borderGraphics.strokeRect(offsetX - 2, offsetY - 2, (this._configedWidth() + 4), (this._configedHeight() + 4));
    // borderGraphics.setDepth(this.config.maxVisibleCards);

    this.add([this.topCardSprite]);
  }

  private createEmptyDeckVisual(): void {
    this.emptyDeckGraphics = this.scene.add.graphics();
    this.emptyDeckGraphics.lineStyle(2, 0xcccccc, 1);
    this.emptyDeckGraphics.strokeRect(0, 0, this._configedWidth(), this._configedHeight());

    // Add dashed effect
    for (let i = 0; i < this._configedWidth(); i += 10) {
      this.emptyDeckGraphics.lineBetween(i, 0, i + 5, 0);
      this.emptyDeckGraphics.lineBetween(i, this._configedHeight(), i + 5, this._configedHeight());
    }

    for (let i = 0; i < this._configedHeight(); i += 10) {
      this.emptyDeckGraphics.lineBetween(0, i, 0, i + 5);
      this.emptyDeckGraphics.lineBetween(this._configedWidth(), i, this._configedWidth(), i + 5);
    }

    // Add "Empty" text
    const emptyText = this.scene.add.text(
      this._configedWidth() / 2,
      this._configedHeight() / 2,
      'Empty',
      {
        fontSize: '32pt',
        color: '#999999',
        align: 'center'
      }
    );
    emptyText.setOrigin(0.5);

    this.add([this.emptyDeckGraphics, emptyText]);
  }

  private createCardCountDisplay(): void {
    const countX = this.config.width / 2;
    const countY = this.config.height + 15;

    // Background circle
    const countBg = this.scene.add.graphics();
    countBg.fillStyle(0x000000, 0.7);
    countBg.fillCircle(countX, countY, 28);

    this.cardCountText = this.scene.add.text(countX, countY, this.deckState.cardCount.toString(), {
      fontSize: '28pt',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    });
    this.cardCountText.setOrigin(0.5);

    this.add([countBg, this.cardCountText]);
  }

  private getBackFrameName(): string {
    // Map deck styles to kenny_cards frame names
    switch (this.config.style) {
      case DeckStyle.UNO:
        return KennyCards.COLOR_BACK; // or appropriate UNO back
      case DeckStyle.DICE:
        return KennyCards.DICE_DECORATED_QUESTION; // Use dice as "back" for dice sets
      case DeckStyle.STANDARD:
      default:
        return KennyCards.CARD_BACK; // Standard playing card back
    }
  }

  // =========================================================================
  // INTERACTIONS
  // =========================================================================

  private setupInteractions(): void {
    if (!this.config.clickable) return;

    this.on('pointerdown', this.handlePointerDown, this);
    this.on('pointerup', this.handlePointerUp, this);

    if (this.config.hoverEffect) {
      this.on('pointerover', this.handlePointerOver, this);
      this.on('pointerout', this.handlePointerOut, this);
    }
  }

  private handlePointerDown(): void {
    if (this.isAnimating || this.deckState.isEmpty) return;

    // Visual feedback - slightly scale down
    this.setScale(0.98);
  }

  private handlePointerUp(): void {
    if (this.isAnimating) return;

    // Reset scale
    this.setScale(1);

    if (this.deckState.isEmpty) return;

    const clickEvent: DeckClickEvent = {
      deckId: this.deck.name,
      clickType: 'single',
      position: { x: this.input!.localX, y: this.input!.localY }
    };

    this.emit(PhaserDeck.Events.DECK_CLICK, clickEvent);
  }

  private handlePointerOver(): void {
    if (this.isAnimating || this.deckState.isEmpty) return;

    // Hover effect - lift cards slightly
    this.cardSprites.forEach((sprite, index) => {
      this.scene.tweens.add({
        targets: sprite,
        y: sprite.y - (index * 3),
        scaleX: this.config.scale * 1.1,
        scaleY: this.config.scale * 1.1,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  private handlePointerOut(): void {
    if (this.isAnimating) return;

    // Reset hover effect
    this.cardSprites.forEach((sprite, index) => {
      this.scene.tweens.add({
        targets: sprite,
        y: index * this.config.cardOffsetY,
        scaleX: this.config.scale,
        scaleY: this.config.scale,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  // =========================================================================
  // DECK OPERATIONS
  // =========================================================================

  async drawCard(): Promise<CardProperties | null> {
    if (this.isAnimating || this.deckState.isEmpty) return null;

    const card = this.deck.drawCard();
    if (!card) return null;

    if (this.config.animateCardDraw) {
      await this.animateCardDraw();
    }

    this.updateState();
    this.refresh();

    const drawEvent: CardDrawEvent = {
      card,
      remainingCards: this.deck.size(),
      deckId: this.deck.name
    };

    this.emit(PhaserDeck.Events.CARD_DRAWN, drawEvent);
    return card;
  }

  async shuffleDeck(): Promise<void> {
    if (this.isAnimating) return;

    this.deck.shuffle();

    if (this.config.shuffleAnimationDuration > 0) {
      await this.animateShuffle();
    }

    this.updateState();
    this.refresh();
    this.emit(PhaserDeck.Events.DECK_SHUFFLED, { deckId: this.deck.name });
  }

  // =========================================================================
  // ANIMATIONS
  // =========================================================================

  private async animateCardDraw(): Promise<void> {
    return new Promise(resolve => {
      this.isAnimating = true;
      this.deckState.isDrawing = true;

      const topCard = this.cardSprites[this.cardSprites.length - 1];
      if (!topCard) {
        this.isAnimating = false;
        this.deckState.isDrawing = false;
        resolve();
        return;
      }

      // Animate card flying away
      this.scene.tweens.add({
        targets: topCard,
        x: topCard.x + 200,
        y: topCard.y - 100,
        rotation: 0.3,
        scaleX: 0.8,
        scaleY: 0.8,
        alpha: 0,
        duration: this.config.drawAnimationDuration,
        ease: 'Power2',
        onComplete: () => {
          this.isAnimating = false;
          this.deckState.isDrawing = false;
          resolve();
        }
      });
    });
  }

  private async animateShuffle(): Promise<void> {
    return new Promise(resolve => {
      this.isAnimating = true;
      this.deckState.isShuffling = true;
      // this.topCardSprite?.setFrame(this.getBackFrameName());
      this.topCardSprite?.setVisible(false);

      const totalDuration = this.config.shuffleAnimationDuration;
      const shufflePhases = 6; // Number of random movements
      const phaseDuration = totalDuration / (shufflePhases); // +2 for settle time

      const performShufflePhase = () => {
        // Random shuffle movements for this phase
        const phasePromises = this.cardSprites.map((sprite, index) => {
          return new Promise<void>(phaseResolve => {
            const originalX = index * this.config.cardOffsetX;
            const originalY = index * this.config.cardOffsetY;

            const tweenChain: any[] = [];
            for (let i = 0; i < shufflePhases; i++) {
              const randomX = (Math.random() - 0.5) * 30; // Reduced range for more controlled movement
              const randomY = (Math.random() - 0.5) * 50;
              const randomRotation = (Math.random() - 0.5) * 0.5;
              tweenChain.push(
                this.scene.tweens.create({
                  targets: sprite,
                  x: sprite.x + randomX,
                  y: sprite.y + randomY,
                  rotation: randomRotation,
                  duration: phaseDuration,
                  ease: 'Sine.easeInOut',
                }));
              tweenChain.push(
                this.scene.tweens.create({
                  targets: sprite,
                  x: originalX,
                  y: originalY,
                  rotation: 0,
                  duration: phaseDuration * 2, // Take a bit longer to settle
                  ease: 'Back.easeOut',
                })
              );
            }

            this.scene.tweens.chain({
              tweens: tweenChain,
              onComplete: () => phaseResolve()
            });
          });
        });

        Promise.all(phasePromises).then(() => {
          // Small delay between phases for visual effect
          this.isAnimating = false;
          this.deckState.isShuffling = false;
          resolve();
        });
      };

      // Start the shuffle animation
      performShufflePhase();
    });
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  private updateState(): void {
    this.deckState.cardCount = this.deck.size();
    this.deckState.isEmpty = this.deck.isEmpty();
    this.deckState.topCard = this.config.showTopCard ? this.deck.peek() : null;
  }

  private clearVisuals(): void {
    console.log('Clearing deck visuals');
    this.removeAll(true);
    this.cardSprites = [];
    this.topCardSprite = null;
    this.cardCountText = null;
    this.emptyDeckGraphics = null;
  }

  refresh(): void {
    this.updateState();
    this.createDeckVisuals();
  }

  updateConfig(newConfig: Partial<DeckUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.refresh();
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  getDeckState(): DeckUIState {
    return { ...this.deckState };
  }

  getConfig(): DeckUIConfig {
    return { ...this.config };
  }

  override destroy(): void {
    super.destroy();
    this.removeAllListeners();
  }

  // Static factory methods for common deck types
  static createPokerDeck(scene: Phaser.Scene, x: number, y: number, deck: Deck): PhaserDeck {
    return new PhaserDeck(scene, x, y, deck, DECK_UI_PRESETS[GAME_TYPE.POKER]);
  }

  static createUnoDeck(scene: Phaser.Scene, x: number, y: number, deck: Deck): PhaserDeck {
    return new PhaserDeck(scene, x, y, deck, DECK_UI_PRESETS[GAME_TYPE.UNO]);
  }

  static createDiceSet(scene: Phaser.Scene, x: number, y: number, deck: Deck): PhaserDeck {
    return new PhaserDeck(scene, x, y, deck, DECK_UI_PRESETS[GAME_TYPE.DICE_GAME]);
  }

  static createDiscardPile(scene: Phaser.Scene, x: number, y: number, deck: Deck): PhaserDeck {
    return new PhaserDeck(scene, x, y, deck, DECK_UI_PRESETS[GAME_TYPE.DISCARD_PILE]);
  }
}
