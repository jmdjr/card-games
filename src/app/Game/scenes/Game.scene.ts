import { DeckUI } from "../mechanics/card/ui/deck-ui";
import { createQuickDeck, DeckUIExamples } from "../mechanics/card/ui/deck-ui.examples";
import { DeckStyle, DeckClickEvent } from "../mechanics/card/ui/deck-ui.types";
import CoreScene from "./Core.scene";


export class GameScene extends CoreScene {
  constructor() {
    super("GameScene");

    this.addUI('', () => {
      // Demo: Create example deck UIs
      const standardDeck = createQuickDeck(this, 100, 100, DeckStyle.STANDARD, true);
      const unoDeck = createQuickDeck(this, 300, 100, DeckStyle.UNO, false);
      const diceSet = createQuickDeck(this, 500, 100, DeckStyle.DICE, true);
      DeckUIExamples.createAnimatedDemo(this);
      console.log('Demo deck UIs created:', { standardDeck, unoDeck, diceSet });

      standardDeck.on(DeckUI.Events.DECK_CLICK, async (event: DeckClickEvent) => {
        await standardDeck.shuffleDeck();
      });
    });
  }
}