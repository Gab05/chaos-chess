import { Color } from "./basic";
import { Piece } from "./piece";

export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const getFiles = (): File[] => ["a", "b", "c", "d", "e", "f", "g", "h"];
export const getRanks = (): Rank[] => [1, 2, 3, 4, 5, 6, 7, 8];

export const incrementRank = (rank?: Rank): Rank | undefined =>
  rank && rank < 8 ? getRanks().at(getRanks().indexOf(rank) + 1) : undefined;
export const decrementRank = (rank?: Rank): Rank | undefined =>
  rank && rank > 1 ? getRanks().at(getRanks().indexOf(rank) - 1) : undefined;

export const incrementFile = (file?: File): File | undefined =>
  file && file !== "h"
    ? getFiles().at(getFiles().indexOf(file) + 1)
    : undefined;
export const decrementFile = (file?: File): File | undefined =>
  file && file !== "a"
    ? getFiles().at(getFiles().indexOf(file) - 1)
    : undefined;

export const computeSquareColor = (file: File, rank: Rank): Color => {
  return (getFiles().indexOf(file) + getRanks().indexOf(rank)) % 2 === 0
    ? "b"
    : "w";
};

export class Square {
  public file: File;
  public rank: Rank;
  public name: string;
  public color: Color;
  public piece?: Piece;
  public allowsEnPassant: boolean;
  public reachableBy: Record<Color, boolean>;
  public playableBy: Record<Color, boolean>;

  constructor(file: File, rank: Rank, piece?: Piece) {
    this.file = file;
    this.rank = rank;
    this.name = `${file}${rank}`;
    this.color = computeSquareColor(file, rank);
    this.piece = piece;
    this.allowsEnPassant = false;
    this.reachableBy = { b: false, w: false };
    this.playableBy = { b: false, w: false };
  }
}
