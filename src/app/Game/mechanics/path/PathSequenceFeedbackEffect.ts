import { PathSequence } from "./path";

export interface PSFeedbackConfig {
  graphicSize: number; // Size of the feedback graphic
  startDelay: number; // Delay before starting the animation
  duration: number; // Duration of the animation
}
export class PathSequenceFeedbackEffect {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Arc;
  private activeTween?: Phaser.Tweens.Tween;

  // Default configuration for the feedback effect
  private _config: PSFeedbackConfig = {
    graphicSize: 32,
    startDelay: 300,
    duration: 100
  };

  constructor(scene: Phaser.Scene, config?: PSFeedbackConfig ) {
    this._config = { ...this._config, ...config };
    this.scene = scene;
    this.graphics = scene.add.circle(0, 0, this._config.graphicSize, 0xFFFFFF);
    this.graphics.setAlpha(0);
  }
  
  // Gets the latest configuration for the feedback effect
  // This is a copy and can not be modified directly using this method.
  public get config(): PSFeedbackConfig {
    return structuredClone(this._config);
  }

  // Runs animation to visualize the path sequence feedback
  // solution: the correct path sequence
  // guess: the user's guessed path sequence
  // positions: the positions of all the buttons
  public async run(solution: PathSequence, guess: PathSequence, positions: Phaser.Math.Vector2[]) {
    if (this.activeTween) {
      this.activeTween.stop();
    }

    // Helper to animate a single segment and return a Promise that resolves when done
    const animateSegment = (i: number): Promise<void> => {
      return new Promise((resolve) => {
        if (i >= guess.length) {
          resolve();
          return;
        }
        let color = 0xFF0000; // Default: red
        if (solution[i] === guess[i]) {
          color = 0x00FF00; // Green: correct value and position
        } else if (solution.includes(guess[i])) {
          color = 0xFFFF00; // Yellow: value exists, wrong position
        }
        const startPos = positions[guess[i]];

        this.graphics.setPosition(startPos.x, startPos.y);
        this.graphics.fillColor = color;
        this.graphics.alpha = 0;

        this.activeTween = this.scene.tweens.add({
          targets: this.graphics,
          alpha: 1,
          duration: this._config.duration,
          delay: this._config.startDelay,
          yoyo: 1,
          onComplete: () => {
            resolve();
          }
        });
      });
    };

    // Sequentially animate all segments
    for (let i = 0; i < guess.length; i++) {
      await animateSegment(i);
    }
  }

  public reset() {
    if (this.activeTween) {
      this.activeTween.stop();
    }
    this.graphics.setAlpha(0);
  }

  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}