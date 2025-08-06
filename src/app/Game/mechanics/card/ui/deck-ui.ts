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
import { CardProperties } from '../card.types';
import { Deck, DECK_TYPE } from '../deck/deck.manager';
import { ASSET_ATLAS } from '../../../assets.data';
import { CardUI } from './card.ui';

export class DeckUI extends Phaser.GameObjects.Container {
  private config: DeckUIConfig;
  private deckState: DeckUIState;
  private deckData: Deck;
  private cardSprites: CardUI[] = [];
  private topCardSprite: CardUI | null = null;
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

    this.deckData = deck;
    this.config = this.mergeWithDefaults(config);
    this.deckState = this.initializeState();

    // Add to scene
    scene.add.existing(this);

    // Initialize the visual representation
    this.createDeckVisuals();
    this.setupInteractions();
    const rect = this.scene.add.rectangle(0, 0, this._configedWidth(), this._configedHeight(), 0x00ff00, 0.5);
    // Make container interactive
    this.setInteractive(
      rect.getBounds(),
      Phaser.Geom.Rectangle.Contains
    );

    rect.setPosition(this.x, this.y);
    rect.setVisible(false);
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  private mergeWithDefaults(config: Partial<DeckUIConfig>): DeckUIConfig {
    const preset = DECK_UI_PRESETS[this.deckData.deckType];
    return {
      ...preset,
      ...config
    } as DeckUIConfig;
  }

  private initializeState(): DeckUIState {
    return {
      cardCount: this.deckData.size(),
      topCard: this.config.showTopCard ? this.deckData.peek() : null,
      isShuffling: false,
      isDrawing: false,
      isEmpty: this.deckData.isEmpty(),
      position: { x: 0, y: 0 },
      rotation: 0
    };
  }

  // =========================================================================
  // VISUAL CREATION
  // =========================================================================

  private createDeckVisuals(): void {
    this.clearVisuals();

    // Check if deck should appear empty (when top card is revealed and it's the last/only card)
    const shouldShowEmptyDeck = this.deckState.isEmpty || 
      (this.config.showTopCard && this.deckState.topCard && this.deckState.cardCount === 1);

    if (shouldShowEmptyDeck) {
      this.createEmptyDeckVisual();
    } else {
      this.createCardStack();
    }

    // Always create top card visual if configured and available
    if (this.config.showTopCard && this.deckState.topCard) {
      this.createTopCardVisual();
    }

    if (this.config.showCardCount) {
      this.createCardCountDisplay();
    }
  }

  private createCardStack(): void {
    const cardsToShow = Math.min(this.deckState.cardCount, this.config.maxVisibleCards);

    const cardDatas = this.deckData.peekMultiple(cardsToShow);
    for (let i = 0; i < cardsToShow; i++) {
      const offsetX = i * this.config.cardOffsetX;
      const offsetY = i * this.config.cardOffsetY;

      const cardSprite = this.scene.add.image(offsetX, offsetY, ASSET_ATLAS, cardDatas[i].backAssetKey);
      cardSprite.setOrigin(0.5, 0.5);
      cardSprite.setScale(this.config.scale);
      cardSprite.setDepth(i);

      // Add subtle shadow effect for depth
      if (this.config.shadow && i > 0) {
        cardSprite.setTintFill(0x000000, 0.1);
      }

      this.add(cardSprite);
      this.cardSprites.push(cardSprite);
    }

    // If we should show the top card and we have cards, use the last card sprite as the top card
    if (this.config.showTopCard && this.deckState.topCard && this.cardSprites.length > 0) {
      this.topCardSprite = this.cardSprites[this.cardSprites.length - 1];
      this.topCardSprite.setDepth(this.config.maxVisibleCards + 1); // Ensure it's on top
    }
  }

  private _configedWidth(): number {
    return this.config.width * this.config.scale;
  }
  private _configedHeight(): number {
    return this.config.height * this.config.scale;
  }

  private createTopCardVisual(): void {
    if (!this.deckState.topCard || !this.topCardSprite) return;

    // The top card sprite is already positioned correctly from createCardStack()
    // We just need to animate the reveal if configured
    if (this.config.animateCardDraw) {
      this.animateTopCardReveal(this.deckState.topCard);
    } else {
      // If no animation, move to final position and show the card face immediately
      this.topCardSprite.setPosition(this.config.topCardOffsetX, this.config.topCardOffsetY);
      const cardScale = this.config.topCardScale || this.config.scale;
      this.topCardSprite.setScale(cardScale);
      this.topCardSprite.setFrame(this.deckState.topCard.assetKey);
    }
  }

  private animateTopCardReveal(card: CardProperties): void {
    if (!this.topCardSprite) return;

    // Use the configured scale for the top card
    const cardScale = this.config.topCardScale || this.config.scale;
    const finalX = this.config.topCardOffsetX;
    const finalY = this.config.topCardOffsetY;

    // Start with card back, then move and flip to reveal
    this.scene.time.delayedCall(500, () => { // Small delay before revealing
      if (!this.topCardSprite) return;

      // Phase 1: Move to final position while starting to flip
      this.scene.tweens.add({
        targets: this.topCardSprite,
        x: finalX,
        y: finalY,
        scaleX: 0, // Compress horizontally during movement
        scaleY: cardScale, // Scale to final size
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (!this.topCardSprite) return;
          
          // Change to card face at the midpoint of flip
          this.topCardSprite.setFrame(card.assetKey);
          
          // Phase 2: Complete the flip (expand back to final scale)
          this.scene.tweens.add({
            targets: this.topCardSprite,
            scaleX: cardScale,
            duration: 200,
            ease: 'Power2'
          });
        }
      });
    });
  }

  private async animateTopCardHide(): Promise<void> {
    return new Promise(resolve => {
      if (!this.topCardSprite) {
        resolve();
        return;
      }

      this.isAnimating = true;

      // Calculate the correct deck position to animate back to
      // This should be the top of the card stack where this sprite originally was
      const cardIndex = this.cardSprites.indexOf(this.topCardSprite);
      const targetX = cardIndex * this.config.cardOffsetX;
      const targetY = cardIndex * this.config.cardOffsetY;

      // Phase 1: Start reverse flip (compress horizontally)
      this.scene.tweens.add({
        targets: this.topCardSprite,
        scaleX: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          if (!this.topCardSprite) return;
          
          // Change to card back at the midpoint of flip
          const cardData = this.deckData.peek() as CardProperties;
          this.topCardSprite.setFrame(cardData?.backAssetKey ?? deckData.backAssetKey);
          
          // Phase 2: Move back to deck while completing flip
          this.scene.tweens.add({
            targets: this.topCardSprite,
            x: targetX,
            y: targetY,
            scaleX: this.config.scale, // Back to original scale
            scaleY: this.config.scale,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              // Reset the depth back to its original position in the stack
              if (this.topCardSprite) {
                this.topCardSprite.setDepth(cardIndex);
                this.topCardSprite = null; // Clear reference but don't destroy the sprite
              }
              
              this.isAnimating = false;
              resolve();
            }
          });
        }
      });
    });
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
      deckId: this.deckData.name,
      clickType: 'single',
      position: { x: this.input!.localX, y: this.input!.localY }
    };

    this.emit(DeckUI.Events.DECK_CLICK, clickEvent);
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

    const card = this.deckData.removeCard();
    if (!card) return null;

    if (this.config.animateCardDraw) {
      // If there's a revealed top card, hide it first, then animate it moving away
      if (this.topCardSprite && this.config.showTopCard) {
        // Hide the revealed top card first
        await this.hideTopCard();
        // Then animate the draw from the deck stack
        await this.animateCardDrawAndFlip(card);
      } else {
        // Otherwise animate from the deck stack normally
        await this.animateCardDrawAndFlip(card);
      }
    }

    this.updateState();
    this.refresh();

    const drawEvent: CardDrawEvent = {
      card,
      remainingCards: this.deckData.size(),
      deckId: this.deckData.name
    };

    this.emit(DeckUI.Events.CARD_DRAWN, drawEvent);
    return card;
  }

  async shuffleDeck(): Promise<void> {
    if (this.isAnimating) return;

    this.deckData.shuffle();

    if (this.config.shuffleAnimationDuration > 0) {
      await this.animateShuffle();
    }

    this.updateState();
    this.refresh();
    this.emit(DeckUI.Events.DECK_SHUFFLED, { deckId: this.deckData.name });
  }

  async revealTopCard(): Promise<CardProperties | null> {
    if (this.isAnimating) return null;

    const topCard = this.deckData.peek();
    if (!topCard) return null;

    // Update state to show top card
    this.deckState.topCard = topCard;
    
    if (!this.topCardSprite && this.config.showTopCard) {
      // Create the top card sprite if it doesn't exist
      this.createTopCardVisual();
    } else if (this.topCardSprite) {
      // Animate revealing the existing top card
      this.animateTopCardReveal(topCard);
    }

    return topCard;
  }

  async hideTopCard(): Promise<void> {
    if (this.isAnimating || !this.topCardSprite) return;

    if (this.config.animateCardDraw) {
      await this.animateTopCardHide();
    } else {
      // Instantly hide without animation - reset to original position and frame
      if (this.topCardSprite) {
        const cardIndex = this.cardSprites.indexOf(this.topCardSprite);
        this.topCardSprite.setPosition(cardIndex * this.config.cardOffsetX, cardIndex * this.config.cardOffsetY);
        this.topCardSprite.setScale(this.config.scale);
        this.topCardSprite.setFrame(this.deckData.peek()?.backAssetKey || '');
        this.topCardSprite.setDepth(cardIndex);
        this.topCardSprite = null; // Clear reference but don't destroy
      }
    }

    // Update state
    this.deckState.topCard = null;
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

  private async animateCardDrawAndFlip(card: CardProperties): Promise<void> {
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

      // Move card to center of screen for flip animation
      const centerX = this.scene.cameras.main.centerX;
      const centerY = this.scene.cameras.main.centerY;
      
      // Phase 1: Move card to center and scale up
      this.scene.tweens.add({
        targets: topCard,
        x: centerX - (this._configedWidth() / 2),
        y: centerY - (this._configedHeight() / 2),
        scaleX: this.config.scale * 1.5,
        scaleY: this.config.scale * 1.5,
        duration: this.config.drawAnimationDuration * 0.3,
        ease: 'Power2',
        onComplete: () => {
          // Phase 2: First half of flip (compress horizontally to simulate rotation)
          this.scene.tweens.add({
            targets: topCard,
            scaleX: 0,
            duration: this.config.drawAnimationDuration * 0.2,
            ease: 'Power2',
            onComplete: () => {
              // Change to card face at the midpoint of flip
              topCard.setFrame(card.assetKey);
              
              // Phase 3: Second half of flip (expand back to normal)
              this.scene.tweens.add({
                targets: topCard,
                scaleX: this.config.scale * 1.5,
                duration: this.config.drawAnimationDuration * 0.2,
                ease: 'Power2',
                onComplete: () => {
                  // Phase 4: Pause to show the card
                  this.scene.time.delayedCall(this.config.drawAnimationDuration * 0.3, () => {
                    // Phase 5: Fade out or move to final position
                    this.scene.tweens.add({
                      targets: topCard,
                      alpha: 0,
                      scaleX: this.config.scale * 0.5,
                      scaleY: this.config.scale * 0.5,
                      y: topCard.y - 100,
                      duration: this.config.drawAnimationDuration * 0.3,
                      ease: 'Power2',
                      onComplete: () => {
                        this.isAnimating = false;
                        this.deckState.isDrawing = false;
                        resolve();
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    });
  }

  // private async animateTopCardDraw(card: CardProperties): Promise<void> {
  //   return new Promise(resolve => {
  //     this.isAnimating = true;
  //     this.deckState.isDrawing = true;

  //     if (!this.topCardSprite) {
  //       this.isAnimating = false;
  //       this.deckState.isDrawing = false;
  //       resolve();
  //       return;
  //     }

  //     // Move the revealed top card to center of screen for flip animation
  //     const centerX = this.scene.cameras.main.centerX;
  //     const centerY = this.scene.cameras.main.centerY;
      
  //     // Phase 1: Move card to center and scale up
  //     this.scene.tweens.add({
  //       targets: this.topCardSprite,
  //       x: centerX - (this._configedWidth() / 2),
  //       y: centerY - (this._configedHeight() / 2),
  //       scaleX: this.config.scale * 1.5,
  //       scaleY: this.config.scale * 1.5,
  //       duration: this.config.drawAnimationDuration * 0.4,
  //       ease: 'Power2',
  //       onComplete: () => {
  //         // Phase 2: Pause to show the card (it's already revealed)
  //         this.scene.time.delayedCall(this.config.drawAnimationDuration * 0.3, () => {
  //           // Phase 3: Fade out or move to final position
  //           this.scene.tweens.add({
  //             targets: this.topCardSprite,
  //             alpha: 0,
  //             scaleX: this.config.scale * 0.5,
  //             scaleY: this.config.scale * 0.5,
  //             y: this.topCardSprite!.y - 100,
  //             duration: this.config.drawAnimationDuration * 0.3,
  //             ease: 'Power2',
  //             onComplete: () => {
  //               // Remove the old top card sprite
  //               if (this.topCardSprite) {
  //                 this.topCardSprite.destroy();
  //                 this.topCardSprite = null;
  //               }
                
  //               this.isAnimating = false;
  //               this.deckState.isDrawing = false;
  //               resolve();
  //             }
  //           });
  //         });
  //       }
  //     });
  //   });
  // }

  private async animateShuffle(): Promise<void> {
    return new Promise(resolve => {
      this.isAnimating = true;
      this.deckState.isShuffling = true;
      // this.topCardSprite?.setFrame(this.getBackFrameName());
      this.topCardSprite?.setVisible(false);

      const totalDuration = this.config.shuffleAnimationDuration;
      const shufflePhases = 3; // Number of random movements
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
    this.deckState.cardCount = this.deckData.size();
    this.deckState.isEmpty = this.deckData.isEmpty();
    this.deckState.topCard = this.config.showTopCard ? this.deckData.peek() : null;
  }

  private clearVisuals(): void {
    console.log('Clearing deck visuals');
    this.removeAll(true);
    this.cardSprites = [];
    
    // Only clear topCardSprite if it wasn't already destroyed in animation
    if (this.topCardSprite && this.topCardSprite.scene) {
      this.topCardSprite = null;
    }
    
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
  static createPokerDeck(scene: Phaser.Scene, x: number, y: number, deck: Deck): DeckUI {
    return new DeckUI(scene, x, y, deck, DECK_UI_PRESETS[DECK_TYPE.POKER]);
  }

  static createUnoDeck(scene: Phaser.Scene, x: number, y: number, deck: Deck): DeckUI {
    return new DeckUI(scene, x, y, deck, DECK_UI_PRESETS[DECK_TYPE.UNO]);
  }

  static createDiceSet(scene: Phaser.Scene, x: number, y: number, deck: Deck): DeckUI {
    return new DeckUI(scene, x, y, deck, DECK_UI_PRESETS[DECK_TYPE.DICE_GAME]);
  }
}
