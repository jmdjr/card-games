export type SetEventHandler<T> = (context: T) => any;

export interface IButtonSetEvents<T> { 
  down: SetEventHandler<SetEventHandler<T>>;
  over: SetEventHandler<SetEventHandler<T>>;
  out: SetEventHandler<SetEventHandler<T>>;
  up: SetEventHandler<SetEventHandler<T>>;
  click: SetEventHandler<SetEventHandler<T>>;
}

export class ButtonSetEvents<T> implements IButtonSetEvents<T> {
  _down: SetEventHandler<T>;
  _over: SetEventHandler<T>;
  _out: SetEventHandler<T>;
  _up: SetEventHandler<T>;
  _click: SetEventHandler<T>;

  down = (context: SetEventHandler<T>) => {
    this._down = context;
    return this;
  };
  over = (context: SetEventHandler<T>) => {
    this._over = context;
    return this;
  };
  out = (context: SetEventHandler<T>) => {
    this._out = context;
    return this;
  };
  up = (context: SetEventHandler<T>) => {
    this._up = context;
    return this;
  };
  click = (context: SetEventHandler<T>) => {
    this._click = context;
    return this;
  };
}

export interface IButtonEventSetter<T> {
  get set() : IButtonSetEvents<T>;
}