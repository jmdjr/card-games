import { cardsCanBeAdded, cardsCanBeRemoved } from '../card.events';
import { CardProperties, CardType } from '../card.types';


export class Pile extends Phaser.Events.EventEmitter implements cardsCanBeAdded, cardsCanBeRemoved {
  protected cards: CardProperties[] = [];

  // Basic deck operations
  addCard(card: CardProperties): void {
    this.cards.push(card);
  }

  addCards(cards: CardProperties[]): void {
    this.cards.push(...cards);
  }

  removeCard(): CardProperties | null {
    return this.cards.pop() || null;
  }

  removeCards(count: number): CardProperties[] {
    const removed: CardProperties[] = [];
    for (let i = 0; i < count && this.cards.length > 0; i++) {
      const card = this.removeCard();
      if (card) removed.push(card);
    }
    return removed;
  }

  peek(): CardProperties | null {
    return this.cards[this.cards.length - 1] || null;
  }

  peekMultiple(count: number): CardProperties[] {
    return this.cards.slice(-count);
  }

  // Deck manipulation
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  cut(position?: number): void {
    const cutPoint = position || Math.floor(Math.random() * this.cards.length);
    const topHalf = this.cards.slice(0, cutPoint);
    const bottomHalf = this.cards.slice(cutPoint);
    this.cards = [...bottomHalf, ...topHalf];
  }

  // Deck information
  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  // Search and filter
  contains(cardId: string): boolean {
    return this.cards.some(card => card.id === cardId);
  }

  findCard(cardId: string): CardProperties | null {
    return this.cards.find(card => card.id === cardId) || null;
  }

  getCards(): CardProperties[] {
    return [...this.cards];
  }

  getCardsByType(type: CardType): CardProperties[] {
    return this.cards.filter(card => card.type === type);
  }
}
