export interface ListItem {
  id: string;
  text: string;
  context: any;
}

export interface ScrollingListConfig {
  // Position and dimensions
  x: number;
  y: number;
  width: number;
  height: number;
  itemHeight: number;

  // Visual styling
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  itemPadding?: number;

  // Item colors
  itemBackgroundColor?: number;
  itemSelectedColor?: number;
  itemHoverColor?: number;

  // Scrolling behavior
  scrollSpeed?: number;
  wheelScrollMultiplier?: number;
  momentumFriction?: number;
  momentumCutoff?: number;

  // Selection behavior
  selectVelocityCutoff?: number;

  // Scroll bar styling
  scrollBar?: {
    width?: number;
    trackColor?: number;
    thumbColor?: number;
    margin?: number;
    minThumbHeight?: number;
    show?: boolean;
  };
}

export class ScrollingListBox extends Phaser.GameObjects.Container {
  /**
   * Removes all items from the list and resets scroll position and selection.
   */
  public clearItems(): void {
    this.items = [];
    this.maxScrollY = 0;
    this.scrollY = 0;
    this.selectedIndex = -1;
    this.updateVisibleItems();
    this.contentContainer.setY(0);
    this.updateScrollBar();
  }
  private config: ScrollingListConfig;
  private items: ListItem[] = [];
  private itemContainers: Phaser.GameObjects.Container[] = [];
  private contentContainer: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private maskShape: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private isDragging: boolean = false;
  private isDraggingScrollBar: boolean = false;
  private lastPointerY: number = 0;
  private velocity: number = 0;
  private scrollBar: Phaser.GameObjects.Rectangle;
  private scrollThumb: Phaser.GameObjects.Rectangle;
  private selectedIndex: number = -1;
  private onItemSelected?: (item: ListItem, index: number) => void;
  private onItemClicked?: (item: ListItem, index: number) => void;

  constructor(scene: Phaser.Scene, config: ScrollingListConfig) {
    super(scene, config.x, config.y);

    this.config = {
      // Visual styling defaults
      backgroundColor: 0x333333,
      borderColor: 0x666666,
      borderWidth: 2,
      itemPadding: 10,

      // Item colors defaults
      itemBackgroundColor: 0x222222,
      itemSelectedColor: 0x4444ff,
      itemHoverColor: 0x444444,

      // Scrolling behavior defaults
      scrollSpeed: 5,
      wheelScrollMultiplier: 0.5,
      momentumFriction: 0.95,
      momentumCutoff: 0.1,

      // Selection behavior defaults
      selectVelocityCutoff: 0.5,

      // Override with user config
      ...config
    };

    this.config.scrollBar = {
      width: 10,
      trackColor: 0x555555,
      thumbColor: 0x888888,
      margin: 2,
      minThumbHeight: 20,
      show: true,
      ...(config.scrollBar || {})
    }

    this.config.textStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      ...config.textStyle
    },

    this.setName('scrollingListBox_main');
    this.init();
  }
  /**
   * Returns the current number of items in the list.
   */
  public countItems(): number {
    return this.items.length;
  }

  private init(): void {
    // Create background
    this.background = new Phaser.GameObjects.Rectangle(
      this.scene,
      0, 0,
      this.config.width,
      this.config.height,
      this.config.backgroundColor
    );
    this.background.setStrokeStyle(this.config.borderWidth!, this.config.borderColor!);
    this.background.setOrigin(0, 0);
    this.background.setName('scrollingListBox_background');
    this.add(this.background);

    // Create content container that will hold all items
    this.contentContainer = new Phaser.GameObjects.Container(this.scene, 0, 0);
    this.contentContainer.setName('scrollingListBox_contentContainer');
    this.add(this.contentContainer);

    // Create mask for scrolling content
    this.maskShape = new Phaser.GameObjects.Graphics(this.scene);
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(0, 0, this.config.width, this.config.height);
    this.maskShape.setPosition(this.x, this.y);
    this.maskShape.setName('scrollingListBox_mask');
    this.maskShape.setVisible(false); // Hide the mask shape itself
    // Add mask to scene so it can be used for masking
    this.scene.add.existing(this.maskShape);

    const mask = this.maskShape.createGeometryMask();
    this.contentContainer.setMask(mask);

    // Create scroll bar
    this.createScrollBar();

    // Setup input events
    this.setupInputEvents();

    // Add to scene after all initialization is complete
    this.scene.add.existing(this);
  }

  override setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    this.maskShape?.setPosition(x, y);
    return this;
  }

  private createScrollBar(): void {
    const sb = this.config.scrollBar;
    if (!sb?.show) {
      return; // Don't create scrollbar if disabled
    }

    const scrollBarX = this.config.width - sb.width! - sb.margin!;

    // Scroll bar track
    this.scrollBar = new Phaser.GameObjects.Rectangle(
      this.scene,
      scrollBarX,
      sb.margin!,
      sb.width!,
      this.config.height - (sb.margin! * 2),
      sb.trackColor!
    );
    this.scrollBar.setOrigin(0, 0);
    this.scrollBar.setName('scrollingListBox_scrollBarTrack');
    this.add(this.scrollBar);

    // Scroll thumb
    this.scrollThumb = new Phaser.GameObjects.Rectangle(
      this.scene,
      scrollBarX,
      sb.margin!,
      sb.width!,
      sb.minThumbHeight!,
      sb.thumbColor!
    );
    this.scrollThumb.setOrigin(0, 0);
    this.scrollThumb.setInteractive();
    this.scrollThumb.setName('scrollingListBox_scrollBarThumb');
    this.add(this.scrollThumb);

    // Scroll thumb events
    this.scrollThumb.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Prevent background drag when dragging scroll thumb
      pointer.event.stopPropagation();
      this.isDragging = true;
      this.isDraggingScrollBar = true;
      this.lastPointerY = pointer.y;
      this.velocity = 0;
    });

    this.updateScrollBar();
  }

  private setupInputEvents(): void {
    this.background.setInteractive();

    // Mouse wheel scrolling
    this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
      if (this.getBounds().contains(pointer.x, pointer.y)) {
        this.scroll(deltaY * this.config.wheelScrollMultiplier!);
      }
    });

    // Touch/drag scrolling - only handle on background
    this.background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.isDraggingScrollBar = false;
      this.lastPointerY = pointer.y;
      this.velocity = 0;
    });

    // Use scene-level pointermove to ensure we catch all movement
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaY = pointer.y - this.lastPointerY;
        // Invert delta for content dragging (not scroll bar)
        const scrollDelta = this.isDraggingScrollBar ? deltaY : -deltaY;
        this.velocity = scrollDelta; // Set velocity BEFORE scrolling
        this.scroll(scrollDelta);
        this.lastPointerY = pointer.y;
      }
    });

    // Use scene-level pointerup to ensure we catch release anywhere
    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
      this.isDraggingScrollBar = false;
    });
  }

  private scroll(deltaY: number): void {
    this.scrollY += deltaY;
    this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);

    // Move the content container to create scrolling effect
    this.contentContainer.setY(-this.scrollY);
    this.updateScrollBar();
  }

  private updateVisibleItems(): void {
    // Clear existing items
    this.contentContainer.removeAll(true);
    this.itemContainers = [];

    // Create all items and add them to the content container
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemY = i * this.config.itemHeight;

      const itemContainer = this.createItemContainer(item, i, itemY);
      this.itemContainers.push(itemContainer);
      this.contentContainer.add(itemContainer);
    }
  }

  private createItemContainer(item: ListItem, index: number, yPosition: number): Phaser.GameObjects.Container {
    // Create container without adding to scene - we'll add it to contentContainer instead
    const container = new Phaser.GameObjects.Container(this.scene, 0, yPosition);
    container.setName(`scrollingListBox_itemContainer_${index}`);

    // Item background
    const itemWidth = this.config.scrollBar?.show ?
      this.config.width - this.config.scrollBar?.width! - this.config.scrollBar?.margin! :
      this.config.width;

    const itemBg = new Phaser.GameObjects.Rectangle(
      this.scene,
      0, 0,
      itemWidth, // Account for scroll bar if enabled
      this.config.itemHeight,
      index === this.selectedIndex ? this.config.itemSelectedColor! : this.config.itemBackgroundColor!
    );
    itemBg.setOrigin(0, 0);
    itemBg.setAlpha(0.7);
    itemBg.setName(`scrollingListBox_itemBackground_${index}`);
    container.add(itemBg);

    // Item text
    const text = new Phaser.GameObjects.Text(
      this.scene,
      this.config.itemPadding!,
      this.config.itemHeight / 2,
      item.text,
      this.config.textStyle!
    );
    text.setOrigin(0, 0.5);
    text.setName(`scrollingListBox_itemText_${index}`);
    container.add(text);

    // Make the entire item background interactive
    itemBg.setInteractive();

    // Click handler - handle both clicks and drag initiation
    itemBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Store initial position to detect if this is a click or drag
      this.lastPointerY = pointer.y;
      this.velocity = 0;
      // Also initiate dragging from items (content drag, not scroll bar)
      this.isDragging = true;
      this.isDraggingScrollBar = false;
    });

    itemBg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // Only trigger selection if pointer hasn't moved much (was a click, not drag)
      const deltaY = Math.abs(pointer.y - this.lastPointerY);
      if (deltaY < 5 && Math.abs(this.velocity) < this.config.selectVelocityCutoff!) {
        this.selectItem(index);
        if (this.onItemClicked) {
          this.onItemClicked(this.items[index], index);
        }
      }
    });

    // Hover effects
    itemBg.on('pointerover', () => {
      if (index !== this.selectedIndex) {
        itemBg.setFillStyle(this.config.itemHoverColor!);
      }
    });

    itemBg.on('pointerout', () => {
      if (index !== this.selectedIndex) {
        itemBg.setFillStyle(this.config.itemBackgroundColor!);
      }
    });

    return container;
  }

  private updateScrollBar(): void {
    const sb = this.config.scrollBar;
    if (!sb?.show || !this.scrollBar || !this.scrollThumb) {
      return; // Don't update if scrollbar is disabled or not created
    }

    const totalContentHeight = this.items.length * this.config.itemHeight;

    if (totalContentHeight > this.config.height) {
      // Content is scrollable - show normal scrollbar behavior
      const thumbHeight = Math.max(
        sb.minThumbHeight!,
        (this.config.height / totalContentHeight) * this.config.height
      );

      const availableThumbSpace = this.config.height - thumbHeight - (sb.margin! * 2);
      const thumbY = this.maxScrollY > 0 ?
        (this.scrollY / this.maxScrollY) * availableThumbSpace : 0;

      this.scrollThumb.setSize(sb.width!, thumbHeight);
      this.scrollThumb.setPosition(
        this.config.width - sb.width! - sb.margin!,
        thumbY + sb.margin!
      );
      this.scrollThumb.setInteractive(); // Enable interaction
    } else {
      // Content fits entirely - show full-height thumb but disable interaction
      const thumbHeight = this.config.height - (sb.margin! * 2);
      this.scrollThumb.setSize(sb.width!, thumbHeight);
      this.scrollThumb.setPosition(
        this.config.width - sb.width! - sb.margin!,
        sb.margin!
      );
      this.scrollThumb.disableInteractive(); // Disable interaction when no scrolling needed
    }

    // Always show both track and thumb when scrollbar is enabled
    this.scrollBar.setVisible(true);
    this.scrollThumb.setVisible(true);
  }

  // Public methods
  public setItems(items: ListItem[]): void {
    this.items = items;
    this.maxScrollY = Math.max(0, (items.length * this.config.itemHeight) - this.config.height);
    this.scrollY = 0;
    this.selectedIndex = -1;
    this.updateVisibleItems();
    this.contentContainer.setY(-this.scrollY);
    this.updateScrollBar();
  }

  public addItem(item: ListItem): void {
    this.items.push(item);
    this.maxScrollY = Math.max(0, (this.items.length * this.config.itemHeight) - this.config.height);
    this.updateVisibleItems();
    this.updateScrollBar();
  }

  public removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.maxScrollY = Math.max(0, (this.items.length * this.config.itemHeight) - this.config.height);

      // Adjust scroll position if we're now beyond the new max scroll
      if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY;
        this.contentContainer.setY(-this.scrollY);
      }

      if (this.selectedIndex === index) {
        this.selectedIndex = -1;
      } else if (this.selectedIndex > index) {
        this.selectedIndex--;
      }
      this.updateVisibleItems();
      this.updateScrollBar();
    }
  }

  public selectItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      const oldSelectedIndex = this.selectedIndex;
      this.selectedIndex = index;

      // Update visual state of items without recreating them
      this.updateItemVisualState(oldSelectedIndex);
      this.updateItemVisualState(this.selectedIndex);

      if (this.onItemSelected) {
        this.onItemSelected(this.items[index], index);
      }
    }
  }

  private updateItemVisualState(index: number): void {
    if (index >= 0 && index < this.itemContainers.length) {
      const container = this.itemContainers[index];
      const itemBg = container.list[0] as Phaser.GameObjects.Rectangle; // First child is the background

      if (itemBg) {
        const color = index === this.selectedIndex ? this.config.itemSelectedColor! : this.config.itemBackgroundColor!;
        itemBg.setFillStyle(color);
      }
    }
  }

  public scrollToItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      const targetY = index * this.config.itemHeight;
      this.scrollY = Phaser.Math.Clamp(targetY, 0, this.maxScrollY);
      this.contentContainer.setY(-this.scrollY);
      this.updateScrollBar();
    }
  }

  public getSelectedItem(): ListItem | null {
    return this.selectedIndex >= 0 ? this.items[this.selectedIndex] : null;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public onItemSelect(callback: (item: ListItem, index: number) => void): void {
    this.onItemSelected = callback;
  }

  public onItemClick(callback: (item: ListItem, index: number) => void): void {
    this.onItemClicked = callback;
  }

  public override update(): void {
    // Apply momentum scrolling
    if (!this.isDragging && Math.abs(this.velocity) > this.config.momentumCutoff!) {
      this.scroll(this.velocity);
      this.velocity *= this.config.momentumFriction!;
    }
  }

  public override destroy(): void {
    this.maskShape.destroy();
    super.destroy();
  }
}
