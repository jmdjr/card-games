/**
 * Path.ts
 * Paths are a sequence of indexes. simply a list of numbers.
 * PathSequence is the type.
 * Path is the class that manages a sequence and provides methods to manipulate it.
 * PercentRight and CountRight are utility functions to compare two sequences.
 */

export type PathSequence = number[];
export function PercentRight(guess: PathSequence, actual: PathSequence): number {
  if (guess.length === 0) return 0;
  const maxScore = actual.length * 2;
  const correct = guess.reduce((acc, val, idx) => acc + (val === actual[idx] ? 2 : actual.includes(val) ? 1 : 0), 0);
  return Math.round(correct / maxScore * 100);
}

export function CountRight(guess: PathSequence, actual: PathSequence): number {
  if (guess.length === 0) return 0;
  return guess.reduce((acc, val, idx) => acc + (val === actual[idx] ? 1 : 0), 0);
}
export default class Path {
  static readonly STANDARD_NUM_BUTTONS: number = 9;
  static readonly STANDARD_PATH_LENGTH: number = 5;
  private _path: PathSequence = [];
  private _numButtons: number = Path.STANDARD_NUM_BUTTONS;
  private _pathLength: number = Path.STANDARD_PATH_LENGTH;

  constructor(pathLength: number = Path.STANDARD_PATH_LENGTH, numButtons: number = Path.STANDARD_NUM_BUTTONS) {
    this._pathLength = pathLength;
    this._numButtons = numButtons;
    this.reset(); // Generate a new path on creation
  }

  // Shuffle the buttons indicies in the path.
  public reset(length: number = Path.STANDARD_PATH_LENGTH) {
    this._path = Array
      .from({ length: this._numButtons },
        (_, i) => i)
      .sort(() => Math.random() - 0.5)  // Shuffle the array randomly
      .slice(0, length);      // Take the first `length` elements
  }

  public tryOrder(indexes: PathSequence): boolean {
    if (indexes.length !== this._path.length) {
      return false; // Invalid length
    }

    for (let i = 0; i < indexes.length; i++) {
      if (indexes[i] !== this._path[i]) {
        return false; // Mismatch found
      }
    }
    return true; // All indexes match the path
  }

  print(): string {
    return this._path.join("->");
  }

  public get get(): PathSequence { return this._path; }
}