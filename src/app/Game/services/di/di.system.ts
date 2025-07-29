export type Constructor<T = any> = new (...args: any[]) => T;

export class DIContainer {
  private providers = new Map<string, Constructor>();
  _singletons = new Map<string, any>();

  register<T>(token: string, provider: Constructor<T>) {
    this.providers.set(token, provider);
  }

  resolve<T>(token: string): T {
    if (GlobalContainer._singletons.has(token)) {
      return GlobalContainer._singletons.get(token);
    }

    const provider = this.providers.get(token);
    if (!provider) throw new Error(`No provider for ${token}`);
    
    const instance = new provider();
    GlobalContainer._singletons.set(token, instance);
    return instance;
  }
}

export function InlineResolve<T>(token: string): T {
  return GlobalContainer.resolve<T>(token);
}

export function Inject(token: string) {
  return function (target: any, propertyKey: string) {
    let value: any;
    const getter = function () {
      if (!value) {
        value = GlobalContainer.resolve(token ?? target.constructor.name);
      }
      return value;
    };
    
    Object.defineProperty(target, propertyKey, {
      get: getter,
      enumerable: true,
      configurable: true,
    });
  };
}

export function Register(token?: string) {
  return function (constructor: Constructor) {
    GlobalContainer.register(token ?? constructor.name, constructor);
  };
}


const GlobalContainer = new DIContainer();