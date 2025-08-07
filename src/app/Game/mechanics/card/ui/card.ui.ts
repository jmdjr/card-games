
// CardUI - Encapsulates all visual representation and behavior for a single card
import Phaser from 'phaser';
import { CardProperties } from '../card.types';
import { ASSET_ATLAS } from '../../../assets.data';

export interface CardUIConfig {
  scale?: number;
  interactive?: boolean;
  showFace?: boolean;
  depth?: number;
  rotation?: number;
  alpha?: number;
  tint?: number;
}

export class CardUI extends Phaser.GameObjects.Image {
  private cardData: CardProperties;
  private config: CardUIConfig;
  private _showingFace: boolean = false;
  private _isAnimating: boolean = false;

  get id(): string {
    return this.cardData.id;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    card: CardProperties,
    config: CardUIConfig = {}
  ) {
    // Start with card back by default - use card's backAssetKey or blank string (will cause visual artifact if not set)
    const backAsset = card.backAssetKey || '';
    super(scene, x, y, ASSET_ATLAS, backAsset);
    
    this.cardData = card;
    this.config = {
      scale: 3,
      interactive: false,
      showFace: false,
      depth: 0,
      rotation: 0,
      alpha: 1,
      ...config
    };

    this.setupCard();
    scene.add.existing(this);
  }

  private setupCard(): void {
    this.setOrigin(0.5, 0.5);
    this.setScale(this.config.scale || 1);
    this.setDepth(this.config.depth || 0);
    this.setRotation(this.config.rotation || 0);
    this.setAlpha(this.config.alpha || 1);
    
    if (this.config.tint) {
      this.setTint(this.config.tint);
    }

    if (this.config.showFace) {
      this.showFace();
    }

    if (this.config.interactive) {
      this.setInteractive();
    }
  }

  // =========================================================================
  // CARD STATE MANAGEMENT
  // =========================================================================

  showFace(): void {
    this.setFrame(this.cardData.assetKey);
    this._showingFace = true;
  }

  showBack(): void {
    const backAsset = this.cardData.backAssetKey || '';
    this.setFrame(backAsset);
    this._showingFace = false;
  }

  flip(): void {
    if (this._showingFace) {
      this.showBack();
    } else {
      this.showFace();
    }
  }

  isShowingFace(): boolean {
    return this._showingFace;
  }

  // =========================================================================
  // ANIMATIONS
  // =========================================================================

  async animateFlip(duration: number = 300): Promise<void> {
    if (this._isAnimating) return;

    return new Promise(resolve => {
      this._isAnimating = true;

      // Phase 1: Compress horizontally
      this.scene.tweens.add({
        targets: this,
        scaleX: 0,
        duration: duration / 2,
        ease: 'Power2',
        onComplete: () => {
          // Change frame at midpoint
          this.flip();
          
          // Phase 2: Expand back
          this.scene.tweens.add({
            targets: this,
            scaleX: this.config.scale || 1,
            duration: duration / 2,
            ease: 'Power2',
            onComplete: () => {
              this._isAnimating = false;
              resolve();
            }
          });
        }
      });
    });
  }

  async animateMoveTo(
    x: number, 
    y: number, 
    duration: number = 300,
    options: {
      scale?: number;
      rotation?: number;
      alpha?: number;
      ease?: string;
    } = {}
  ): Promise<void> {
    if (this._isAnimating) return;

    return new Promise(resolve => {
      this._isAnimating = true;

      const tweenConfig: any = {
        targets: this,
        x,
        y,
        duration,
        ease: options.ease || 'Power2',
        onComplete: () => {
          this._isAnimating = false;
          resolve();
        }
      };

      if (options.scale !== undefined) tweenConfig.scaleX = tweenConfig.scaleY = options.scale;
      if (options.rotation !== undefined) tweenConfig.rotation = options.rotation;
      if (options.alpha !== undefined) tweenConfig.alpha = options.alpha;

      this.scene.tweens.add(tweenConfig);
    });
  }

  async animateScale(scale: number, duration: number = 200): Promise<void> {
    if (this._isAnimating) return;

    return new Promise(resolve => {
      this._isAnimating = true;

      this.scene.tweens.add({
        targets: this,
        scaleX: scale,
        scaleY: scale,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this._isAnimating = false;
          resolve();
        }
      });
    });
  }

  async animateFadeOut(duration: number = 300): Promise<void> {
    if (this._isAnimating) return;

    return new Promise(resolve => {
      this._isAnimating = true;

      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this._isAnimating = false;
          resolve();
        }
      });
    });
  }

  async animateFadeIn(duration: number = 300): Promise<void> {
    if (this._isAnimating) return;

    return new Promise(resolve => {
      this._isAnimating = true;

      this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this._isAnimating = false;
          resolve();
        }
      });
    });
  }

  // =========================================================================
  // GETTERS & SETTERS
  // =========================================================================

  get card(): CardProperties {
    return this.cardData;
  }

  get isAnimating(): boolean {
    return this._isAnimating;
  }

  updateCard(card: CardProperties): void {
    this.cardData = card;
    if (this._showingFace) {
      this.setFrame(card.assetKey);
    } else {
      const backAsset = card.backAssetKey || '';
      this.setFrame(backAsset);
    }
  }

  updateConfig(newConfig: Partial<CardUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupCard();
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  setCardDepth(depth: number): void {
    this.setDepth(depth);
    this.config.depth = depth;
  }

  setCardScale(scale: number): void {
    this.setScale(scale);
    this.config.scale = scale;
  }

  setCardRotation(rotation: number): void {
    this.setRotation(rotation);
    this.config.rotation = rotation;
  }

  setCardAlpha(alpha: number): void {
    this.setAlpha(alpha);
    this.config.alpha = alpha;
  }

  // Apply shadow effect for depth perception
  setShadowEffect(enabled: boolean, intensity: number = 0.3): void {
    if (enabled) {
      this.setTint(Phaser.Display.Color.GetColor(
        255 * (1 - intensity),
        255 * (1 - intensity),
        255 * (1 - intensity)
      ));
    } else {
      this.clearTint();
    }
  }
}