// Card Animation Manager - Handles all card movement animations
import Phaser from 'phaser';
import { CardProperties } from '../../card.types';

// Animation event types
export interface CardDrawEvent {
  card: CardProperties;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  sourceScale: number;
  targetScale: number;
  sourceRotation?: number;
  targetRotation?: number;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export interface CardMoveEvent {
  card: CardProperties;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  fromScale: number;
  toScale: number;
  fromRotation?: number;
  toRotation?: number;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

export const CARD_ANIMATION_EVENTS = {
  DRAW_CARD: 'cardAnimation:draw',
  MOVE_CARD: 'cardAnimation:move',
  PLAY_CARD: 'cardAnimation:play',
  RETURN_CARD: 'cardAnimation:return',
  SHUFFLE_CARD: 'cardAnimation:shuffle',
  REVEAL_CARD: 'cardAnimation:reveal',
  HIDE_CARD: 'cardAnimation:hide'
} as const;

export class CardAnimationManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private animatingCards: Map<string, Phaser.GameObjects.Image> = new Map();
  private animationQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on(CARD_ANIMATION_EVENTS.DRAW_CARD, this.animateCardDraw, this);
    this.on(CARD_ANIMATION_EVENTS.MOVE_CARD, this.animateCardMove, this);
    this.on(CARD_ANIMATION_EVENTS.PLAY_CARD, this.animateCardPlay, this);
    this.on(CARD_ANIMATION_EVENTS.RETURN_CARD, this.animateCardReturn, this);
    this.on(CARD_ANIMATION_EVENTS.REVEAL_CARD, this.animateCardReveal, this);
    this.on(CARD_ANIMATION_EVENTS.HIDE_CARD, this.animateCardHide, this);
  }

  // =========================================================================
  // PUBLIC ANIMATION METHODS
  // =========================================================================

  drawCard(event: CardDrawEvent): void {
    this.emit(CARD_ANIMATION_EVENTS.DRAW_CARD, event);
  }

  moveCard(event: CardMoveEvent): void {
    this.emit(CARD_ANIMATION_EVENTS.MOVE_CARD, event);
  }

  playCard(event: CardMoveEvent): void {
    this.emit(CARD_ANIMATION_EVENTS.PLAY_CARD, event);
  }

  returnCard(event: CardMoveEvent): void {
    this.emit(CARD_ANIMATION_EVENTS.RETURN_CARD, event);
  }

  revealCard(card: CardProperties, position: { x: number; y: number }, scale: number = 1): void {
    this.emit(CARD_ANIMATION_EVENTS.REVEAL_CARD, { card, position, scale });
  }

  hideCard(card: CardProperties, position: { x: number; y: number }, scale: number = 1): void {
    this.emit(CARD_ANIMATION_EVENTS.HIDE_CARD, { card, position, scale });
  }

  // =========================================================================
  // ANIMATION IMPLEMENTATIONS
  // =========================================================================

  private animateCardDraw(event: CardDrawEvent): void {
    this.queueAnimation(() => this.executeCardDraw(event));
  }

  private animateCardMove(event: CardMoveEvent): void {
    this.queueAnimation(() => this.executeCardMove(event));
  }

  private animateCardPlay(event: CardMoveEvent): void {
    this.queueAnimation(() => this.executeCardPlay(event));
  }

  private animateCardReturn(event: CardMoveEvent): void {
    this.queueAnimation(() => this.executeCardReturn(event));
  }

  private animateCardReveal(event: any): void {
    this.queueAnimation(() => this.executeCardReveal(event));
  }

  private animateCardHide(event: any): void {
    this.queueAnimation(() => this.executeCardHide(event));
  }

  // =========================================================================
  // ANIMATION EXECUTION
  // =========================================================================

  private executeCardDraw(event: CardDrawEvent): void {
    const animationId = `draw_${event.card.id}_${Date.now()}`;
    
    // Create temporary sprite for animation
    const cardSprite = this.scene.add.image(
      event.sourcePosition.x,
      event.sourcePosition.y,
      'kenny_cards', // Assuming atlas name
      event.card.assetKey
    );

    cardSprite.setOrigin(0.5, 0.5);
    cardSprite.setScale(event.sourceScale);
    cardSprite.setDepth(1000); // High depth for animation
    
    if (event.sourceRotation !== undefined) {
      cardSprite.setRotation(event.sourceRotation);
    }

    this.animatingCards.set(animationId, cardSprite);

    // Animate to target
    this.scene.tweens.add({
      targets: cardSprite,
      x: event.targetPosition.x,
      y: event.targetPosition.y,
      scaleX: event.targetScale,
      scaleY: event.targetScale,
      rotation: event.targetRotation || 0,
      duration: event.duration || 500,
      delay: event.delay || 0,
      ease: 'Power2',
      onComplete: () => {
        // Clean up animation sprite
        cardSprite.destroy();
        this.animatingCards.delete(animationId);
        
        // Call completion callback
        if (event.onComplete) {
          event.onComplete();
        }

        this.processNextAnimation();
      }
    });
  }

  private executeCardMove(event: CardMoveEvent): void {
    const animationId = `move_${event.card.id}_${Date.now()}`;
    
    // Create temporary sprite for animation
    const cardSprite = this.scene.add.image(
      event.fromPosition.x,
      event.fromPosition.y,
      'kenny_cards',
      event.card.assetKey
    );

    cardSprite.setOrigin(0.5, 0.5);
    cardSprite.setScale(event.fromScale);
    cardSprite.setDepth(1000);
    
    if (event.fromRotation !== undefined) {
      cardSprite.setRotation(event.fromRotation);
    }

    this.animatingCards.set(animationId, cardSprite);

    // Animate to target
    this.scene.tweens.add({
      targets: cardSprite,
      x: event.toPosition.x,
      y: event.toPosition.y,
      scaleX: event.toScale,
      scaleY: event.toScale,
      rotation: event.toRotation || 0,
      duration: event.duration || 300,
      delay: event.delay || 0,
      ease: 'Power2',
      onComplete: () => {
        cardSprite.destroy();
        this.animatingCards.delete(animationId);
        
        if (event.onComplete) {
          event.onComplete();
        }

        this.processNextAnimation();
      }
    });
  }

  private executeCardPlay(event: CardMoveEvent): void {
    // Play animation with special effects (e.g., slightly larger scale, glow)
    const enhancedEvent = {
      ...event,
      duration: event.duration || 400
    };

    const animationId = `play_${event.card.id}_${Date.now()}`;
    
    const cardSprite = this.scene.add.image(
      event.fromPosition.x,
      event.fromPosition.y,
      'kenny_cards',
      event.card.assetKey
    );

    cardSprite.setOrigin(0.5, 0.5);
    cardSprite.setScale(event.fromScale);
    cardSprite.setDepth(1000);
    
    // Add glow effect for played cards
    cardSprite.setTint(0xffffff);

    this.animatingCards.set(animationId, cardSprite);

    // Animate with slight arc and scaling
    this.scene.tweens.add({
      targets: cardSprite,
      x: event.toPosition.x,
      y: event.toPosition.y - 20, // Slight arc
      scaleX: event.toScale * 1.1, // Slightly larger
      scaleY: event.toScale * 1.1,
      duration: enhancedEvent.duration / 2,
      ease: 'Power2',
      onComplete: () => {
        // Second part of animation - settle to final position
        this.scene.tweens.add({
          targets: cardSprite,
          y: event.toPosition.y,
          scaleX: event.toScale,
          scaleY: event.toScale,
          duration: enhancedEvent.duration / 2,
          ease: 'Bounce',
          onComplete: () => {
            cardSprite.destroy();
            this.animatingCards.delete(animationId);
            
            if (event.onComplete) {
              event.onComplete();
            }

            this.processNextAnimation();
          }
        });
      }
    });
  }

  private executeCardReturn(event: CardMoveEvent): void {
    // Return animation (similar to move but with different easing)
    const returnEvent = {
      ...event,
      duration: event.duration || 350
    };

    this.executeCardMove(returnEvent);
  }

  private executeCardReveal(event: any): void {
    const animationId = `reveal_${event.card.id}_${Date.now()}`;
    
    const cardSprite = this.scene.add.image(
      event.position.x,
      event.position.y,
      'kenny_cards',
      'cardBack_blue2' // Start with back
    );

    cardSprite.setOrigin(0.5, 0.5);
    cardSprite.setScale(event.scale);
    cardSprite.setDepth(1000);

    this.animatingCards.set(animationId, cardSprite);

    // Flip animation
    this.scene.tweens.add({
      targets: cardSprite,
      scaleX: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        // Change to card face
        cardSprite.setFrame(event.card.assetKey);
        
        this.scene.tweens.add({
          targets: cardSprite,
          scaleX: event.scale,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            cardSprite.destroy();
            this.animatingCards.delete(animationId);
            this.processNextAnimation();
          }
        });
      }
    });
  }

  private executeCardHide(event: any): void {
    const animationId = `hide_${event.card.id}_${Date.now()}`;
    
    const cardSprite = this.scene.add.image(
      event.position.x,
      event.position.y,
      'kenny_cards',
      event.card.assetKey
    );

    cardSprite.setOrigin(0.5, 0.5);
    cardSprite.setScale(event.scale);
    cardSprite.setDepth(1000);

    this.animatingCards.set(animationId, cardSprite);

    // Flip to back animation
    this.scene.tweens.add({
      targets: cardSprite,
      scaleX: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        // Change to card back
        cardSprite.setFrame('cardBack_blue2');
        
        this.scene.tweens.add({
          targets: cardSprite,
          scaleX: event.scale,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            cardSprite.destroy();
            this.animatingCards.delete(animationId);
            this.processNextAnimation();
          }
        });
      }
    });
  }

  // =========================================================================
  // ANIMATION QUEUE MANAGEMENT
  // =========================================================================

  private queueAnimation(animationFunction: () => void): void {
    this.animationQueue.push(animationFunction);
    
    if (!this.isProcessingQueue) {
      this.processNextAnimation();
    }
  }

  private processNextAnimation(): void {
    if (this.animationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const nextAnimation = this.animationQueue.shift();
    
    if (nextAnimation) {
      nextAnimation();
    }
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  isCardAnimating(cardId: string): boolean {
    for (const [id] of this.animatingCards) {
      if (id.includes(cardId)) {
        return true;
      }
    }
    return false;
  }

  cancelAllAnimations(): void {
    for (const [id, sprite] of this.animatingCards) {
      sprite.destroy();
    }
    this.animatingCards.clear();
    this.animationQueue.length = 0;
    this.isProcessingQueue = false;
  }

  getQueueLength(): number {
    return this.animationQueue.length;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  override destroy(): void {
    this.cancelAllAnimations();
    this.removeAllListeners();
    super.destroy();
  }
}
