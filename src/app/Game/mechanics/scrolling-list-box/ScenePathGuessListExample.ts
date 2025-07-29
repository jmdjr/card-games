import { ScrollingListBox, ListItem } from "./ScrollingListBox";

// Example usage class

export class PathGuessListExample extends Phaser.Scene {
  private listBox: ScrollingListBox;
  private itemCounter: number = 10; // Start at 10 since we have 10 initial items

  constructor() {
    super('PathGuessListExample');
  }

  preload() { }

  init() {
  }

  create() {
    // Create the scrolling list box
    this.listBox = new ScrollingListBox(this, {
      x: 100,
      y: 100,
      width: 300,
      height: 400,
      itemHeight: 50,
      backgroundColor: 0x1a1a1a,
      borderColor: 0x4a4a4a,
      borderWidth: 2,
      textStyle: {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial'
      },
      itemPadding: 15
    });

    // Sample data
    const sampleItems: ListItem[] = [
      { id: '1', text: 'Pattern Guess #1: ⚫⚪⚫', context: { pattern: [1, 2, 3] } },
      { id: '2', text: 'Pattern Guess #2: ⚪⚫⚪', context: { pattern: [4, 5, 6] } },
      { id: '3', text: 'Pattern Guess #3: ⚫⚫⚪', context: { pattern: [7, 8, 9] } },
      { id: '4', text: 'Pattern Guess #4: ⚪⚪⚫', context: { pattern: [1, 4, 7] } },
      { id: '5', text: 'Pattern Guess #5: ⚫⚪⚫', context: { pattern: [2, 5, 8] } },
      { id: '6', text: 'Pattern Guess #6: ⚪⚫⚪', context: { pattern: [3, 6, 9] } },
      { id: '7', text: 'Pattern Guess #7: ⚫⚫⚫', context: { pattern: [1, 5, 9] } },
      { id: '8', text: 'Pattern Guess #8: ⚪⚪⚪', context: { pattern: [3, 5, 7] } },
      { id: '9', text: 'Pattern Guess #9: ⚫⚪⚫', context: { pattern: [1, 3, 7, 9] } },
      { id: '10', text: 'Pattern Guess #10: ⚪⚫⚪', context: { pattern: [2, 4, 6, 8] } }
    ];

    this.listBox.setItems(sampleItems);

    // Event handlers
    this.listBox.onItemSelect((item, index) => {
      console.log(`Selected item ${index}: ${item.text}`);
    });

    this.listBox.onItemClick((item, index) => {
      console.log(`Clicked item ${index}: ${item.text}`);
      // You could trigger pattern replay here
    });

    // Instructions
    const titleText = this.add.text(100, 50, 'Scrolling List Box Demo', {
      fontSize: '24px',
      color: '#ffffff'
    });
    titleText.setName('demo_titleText');

    const featuresText = this.add.text(420, 100, 'Features:\n• Mouse wheel scroll\n• Touch/drag scroll\n• Click to select\n• Momentum scrolling\n• Scroll bar\n• Hover effects', {
      fontSize: '14px',
      color: '#cccccc',
      lineSpacing: 5
    });
    featuresText.setName('demofeaturesText');

    // Add buttons for dynamic item management
    this.createButtons();
  }

  override update(time: number, delta: number) {
    this.listBox.update();
  }

  private createButtons(): void {
    // Add Item button
    const addButton = this.add.rectangle(420, 300, 120, 40, 0x4a4a4a);
    addButton.setStrokeStyle(2, 0x666666);
    addButton.setInteractive();
    addButton.setName('demo_addButton');

    const addButtonText = this.add.text(420, 300, 'Add Item', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    addButtonText.setOrigin(0.5, 0.5);
    addButtonText.setName('demo_addButtonText');

    addButton.on('pointerdown', () => {
      this.addNewItem();
    });

    addButton.on('pointerover', () => {
      addButton.setFillStyle(0x555555);
    });

    addButton.on('pointerout', () => {
      addButton.setFillStyle(0x4a4a4a);
    });

    // Remove Item button
    const removeButton = this.add.rectangle(420, 360, 120, 40, 0x4a4a4a);
    removeButton.setStrokeStyle(2, 0x666666);
    removeButton.setInteractive();
    removeButton.setName('demo_removeButton');

    const removeButtonText = this.add.text(420, 360, 'Remove Item', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    removeButtonText.setOrigin(0.5, 0.5);
    removeButtonText.setName('demo_removeButtonText');

    removeButton.on('pointerdown', () => {
      this.removeLastItem();
    });

    removeButton.on('pointerover', () => {
      removeButton.setFillStyle(0x555555);
    });

    removeButton.on('pointerout', () => {
      removeButton.setFillStyle(0x4a4a4a);
    });
  }

  private addNewItem(): void {
    this.itemCounter++;
    const patterns = [
      [1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9],
      [1, 5, 9], [3, 5, 7], [1, 3, 7, 9], [2, 4, 6, 8], [1, 2, 4, 5]
    ];
    const symbols = ['⚫', '⚪', '🔴', '🔵', '🟡', '🟢'];

    // Generate random pattern display
    const patternDisplay = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]
    ).join('');

    // Generate random pattern data
    const patternData = patterns[Math.floor(Math.random() * patterns.length)];

    const newItem: ListItem = {
      id: this.itemCounter.toString(),
      text: `Pattern Guess #${this.itemCounter}: ${patternDisplay}`,
      context: { pattern: patternData }
    };

    this.listBox.addItem(newItem);
    console.log(`Added item: ${newItem.text}`);
  }

  private removeLastItem(): void {
    const items = this.listBox.getSelectedIndex();
    const totalItems = this.listBox['items'].length; // Access private property for demo

    if (totalItems > 0) {
      const lastIndex = totalItems - 1;
      this.listBox.removeItem(lastIndex);
      console.log(`Removed item at index ${lastIndex}`);
    } else {
      console.log('No items to remove');
    }
  }
}
