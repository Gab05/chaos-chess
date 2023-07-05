import { JSX, useEffect, useState } from "react";
import {
  decrementFile,
  getFiles,
  getRanks,
  incrementFile,
  incrementRank,
  Square,
} from "../models/square";
import { Piece } from "../models/piece";
import {
  findCheckmate,
  findChecks,
  getPlayableSquares,
} from "../engine/Engine";
import { getPieceSprite } from "../sprites/Pieces";
import "../App.css";

const Board = (): JSX.Element => {
  const initBoard = (): { [name: string]: Square } => {
    let s: any = {};
    for (const rank of getRanks().reverse()) {
      for (const file of getFiles()) {
        if (rank === 7)
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "p"));
        else if (rank === 8 && ["a", "h"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "r"));
        else if (rank === 8 && ["b", "g"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "n"));
        else if (rank === 8 && ["c", "f"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "b"));
        else if (rank === 8 && file === "d")
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "q"));
        else if (rank === 8 && file === "e")
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "k"));
        else if (rank === 2)
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "p"));
        else if (rank === 1 && ["a", "h"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "r"));
        else if (rank === 1 && ["b", "g"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "n"));
        else if (rank === 1 && ["c", "f"].includes(file))
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "b"));
        else if (rank === 1 && file === "d")
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "q"));
        else if (rank === 1 && file === "e")
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "k"));
        else s[`${file}${rank}`] = new Square(file, rank);
      }
    }
    return s;
  };

  const [squares, setSquares] = useState<{ [k: string]: Square }>(initBoard());
  const [whiteToPlay, setWhiteToPlay] = useState<boolean>(true);
  const [playableSquares, setPlayableSquares] = useState<string[]>([]);
  const [playSourceSquare, setPlaySourceSquare] = useState<Square>();
  const [playDestinationSquare, setPlayDestinationSquare] = useState<Square>();

  useEffect(() => {
    if (playSourceSquare)
      setPlayableSquares(
        getPlayableSquares(playSourceSquare, squares).map((s) => s.name)
      );
  }, [playSourceSquare, squares]);

  const isPlayerToPlay = (s?: Square): boolean => {
    if (!s) return false;
    if (!!s.piece) {
      if (
        (s.piece.color === "w" && whiteToPlay) ||
        (s.piece.color === "b" && !whiteToPlay)
      ) {
        return true;
      }
    }
    return false;
  };

  const verifyPlay = (): void => {
    const source: Square | undefined = playSourceSquare;
    const dest: Square | undefined = playDestinationSquare;

    if (
      !source ||
      !source.piece ||
      !dest ||
      !isPlayerToPlay(source) ||
      !playableSquares.includes(dest.name)
    ) {
      return;
    } else {
      play(source, dest);
    }
  };

  const play = (source: Square, dest: Square) => {
    if (!source.piece) return;

    // Check if en passant was taken
    if (source.piece.type === "p" && dest.allowsEnPassant) {
      squares[`${dest.file}${source.rank}`].piece = undefined;
    }

    // Clear previous en passant squares
    Object.values(squares).forEach((s) => (s.allowsEnPassant = false));

    // Check if new en passant allowed
    if (source.piece.type === "p" && Math.abs(source.rank - dest.rank) > 1) {
      squares[
        `${source.file}${(source.rank + dest.rank) / 2}`
      ].allowsEnPassant = true;
    }

    // Check for promotion
    if (source.piece.type === "p") {
      if (
        (source.piece.color === "w" && dest.rank === 8) ||
        (source.piece.color === "b" && dest.rank === 1)
      ) {
        source.piece.type = "q";
        source.piece.name = `${source.piece.color}q`;
      }
    }

    // Move rook if castling
    if (
      source.piece.type === "k" &&
      incrementFile(source.file) !== dest.file &&
      decrementFile(source.file) !== dest.file
    ) {
      if (dest.name === "c1") {
        squares["d1"].piece = squares["a1"].piece;
        squares["a1"].piece = undefined;
      }
      if (dest.name === "g1") {
        squares["f1"].piece = squares["h1"].piece;
        squares["h1"].piece = undefined;
      }
      if (dest.name === "c8") {
        squares["d8"].piece = squares["a8"].piece;
        squares["a8"].piece = undefined;
      }
      if (dest.name === "g8") {
        squares["f8"].piece = squares["h8"].piece;
        squares["h8"].piece = undefined;
      }
    }

    // Move main piece
    squares[dest.name].piece = { ...source.piece, hasMoved: true };
    squares[source.name].piece = undefined;

    // Clear previous checks
    Object.values(squares).forEach((s) => {
      if (s.piece) s.piece.inCheck = false;
    });

    // Check for checks ;) ;) ;)
    const [king] = findChecks(squares);
    if (king && king.piece && squares[king.name]) {
      (squares[king.name].piece as Piece).inCheck = true;

      if (findCheckmate(king, squares)) console.log("MATE");
    }

    // Update state
    setSquares({ ...squares });
    setPlayableSquares([]);
    setPlaySourceSquare(undefined);
    setPlayDestinationSquare(undefined);
    setWhiteToPlay(!whiteToPlay);
  };

  return (
    <div style={{ width: "800px", display: "flex", flexWrap: "wrap" }}>
      {Object.values(squares).map((s) => {
        return (
          <div
            key={s.piece ? s.name + "-" + s.piece.name : s.name}
            style={{
              display: "flex",
              height: "100px",
              width: "100px",
              background: `radial-gradient(${
                s.color === "b" ? "#525C75" : "#CEDEFF"
              }, ${
                s.piece &&
                playableSquares.find((square) => square === s.name) &&
                isPlayerToPlay(playSourceSquare)
                  ? "#4640FF"
                  : playSourceSquare?.name === s.name
                  ? "green"
                  : s.color === "b"
                  ? "#525C75"
                  : "#CEDEFF"
              })`,
              padding: "auto",
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setPlayDestinationSquare(s)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              verifyPlay();
            }}
          >
            {s.piece && (
              <img
                alt={s.piece.name}
                src={getPieceSprite(s.piece.name)}
                style={{
                  margin: "auto",
                  width: "100%",
                  cursor: isPlayerToPlay(s) ? "grab" : "initial",
                  animation:
                    s.piece && s.piece.inCheck
                      ? "Spin infinite 0.7s linear"
                      : "",
                }}
                draggable={isPlayerToPlay(s)}
                onClick={() => {
                  setPlaySourceSquare(s);
                }}
                onDragStart={() => {
                  setPlaySourceSquare(s);
                }}
              />
            )}
            {playSourceSquare &&
              playableSquares.includes(s.name) &&
              isPlayerToPlay(playSourceSquare) &&
              !s.piece && (
                <div
                  style={{
                    margin: "auto",
                    width: "36px",
                    height: "36px",
                    opacity: 0.6,
                    borderRadius: "32px",
                    backgroundColor: "blue",
                  }}
                />
              )}
          </div>
        );
      })}
    </div>
  );
};

export { Board };
