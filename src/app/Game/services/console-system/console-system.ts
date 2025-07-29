import { InlineResolve, Register } from "../di/di.system";

export type CommandHandler = (args: string[], game: Phaser.Scene) => string | Promise<string>;

export interface ConsoleCommand {
  description: string;
  handler: CommandHandler;
}

export const CONSOLE_COMMANDS: Map<string, ConsoleCommand> = new Map([
  ['help', {
    description: 'List available commands',
    handler: () => Object.entries(CONSOLE_COMMANDS)
      .map(([cmd, { description }]) => `${cmd}: ${description}`).join('\n')
  }],
  ['echo', {
    description: 'Echo input',
    handler: (args) => args.join(' ')
  }],
  ['state', {
    description: 'Display game state',
    handler: (_, game) => JSON.stringify(game.data ? game.data.getAll() : {}, null, 2)
  }],
  ['set', {
    description: 'Set game state variable. Usage: set key value',
    handler: (args, game) => {
      if (args.length < 2) return 'Usage: set key value';
      if (game.data) game.data.set(args[0], args.slice(1).join(' '));
      return `Set ${args[0]}`;
    }
  }]
]);

export function ConsoleCommand(commandName: string, description: string) {
  return function (context: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Register the command
    CONSOLE_COMMANDS.set(commandName ?? propertyKey, {
      description,
      handler: descriptor.value
    });
  }
}

@Register(ConsoleSystem.name)
export class ConsoleSystem {
  private enable_console_ui_visibility: boolean = false;

  @ConsoleCommand('exit', 'Exits the console')
  static hideConsoleUI() {
    const instance = InlineResolve<ConsoleSystem>(ConsoleSystem.name);
    instance.enable_console_ui_visibility = false;
  }

  showConsoleUI() {
    this.enable_console_ui_visibility = true;
  }

  getConsoleUIStatus(): boolean {
    return this.enable_console_ui_visibility;
  }
}