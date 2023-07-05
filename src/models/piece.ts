import { Color } from "./basic";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export const getPieceFullName = (type: PieceType): string =>
  ({
    p: "Pawn",
    b: "Bishop",
    n: "Knight",
    r: "Rook",
    q: "Queen",
    k: "King",
  }[type]);

export class Piece {
  public type: PieceType;
  public color: Color;
  public name: string;
  public hasMoved: boolean;
  public inCheck: boolean;

  constructor(color: Color, type: PieceType) {
    this.color = color;
    this.type = type;
    this.name = `${color}${type}`;
    this.hasMoved = false;
    this.inCheck = false;
  }
}
