import React, { JSX, useEffect, useState } from "react";
import {
  decrementFile,
  getFiles,
  getRanks,
  incrementFile,
  Square,
} from "../models/square";
import { Piece } from "../models/piece";
import {
  findCheckmate,
  findChecks,
  getPlayableSquaresFor,
} from "../engine/Engine";
import { getPieceSprite } from "../sprites/Pieces";
import "../App.css";

const Board = (): JSX.Element => {
  const initBoard = (): { [name: string]: Square } => {
    let s: any = {};
    for (const rank of getRanks().reverse()) {
      for (const file of getFiles()) {
        if (rank === 7) {
          // Black pawns
          s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "p"));
        } else if (rank === 8) {
          // Black minor and major pieces
          if (["a", "h"].includes(file))
            // Rooks
            s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "r"));
          else if (["b", "g"].includes(file))
            // Horseys
            s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "n"));
          else if (["c", "f"].includes(file))
            // Snipers
            s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "b"));
          else if (file === "d")
            // Queen
            s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "q"));
          // King
          else
            s[`${file}${rank}`] = new Square(file, rank, new Piece("b", "k"));
        } else if (rank === 2) {
          // White pawns
          s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "p"));
        } else if (rank === 1) {
          // White minor and major pieces
          if (["a", "h"].includes(file))
            // Rooks
            s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "r"));
          else if (["b", "g"].includes(file))
            // Horseys
            s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "n"));
          else if (["c", "f"].includes(file))
            // Snipers
            s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "b"));
          else if (file === "d")
            // Queen
            s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "q"));
          // King
          else
            s[`${file}${rank}`] = new Square(file, rank, new Piece("w", "k"));
        } else s[`${file}${rank}`] = new Square(file, rank);
      }
    }
    return s;
  };

  const [squares, setSquares] = useState<{ [k: string]: Square }>(initBoard());
  const [whiteToPlay, setWhiteToPlay] = useState<boolean>(true);
  const [playableSquares, setPlayableSquares] = useState<
    Record<string, Square[]>
  >({});
  const [playSourceSquare, setPlaySourceSquare] = useState<Square>();
  const [playDestinationSquare, setPlayDestinationSquare] = useState<Square>();
  const [capturedPieces, setCapturedPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const s = getPlayableSquaresFor(whiteToPlay ? "w" : "b", squares);
    setPlayableSquares(s);
  }, [squares, whiteToPlay]);

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
      !playableSquares[source.name].includes(dest)
    ) {
      return;
    } else {
      play(source, dest);
    }
  };

  const play = (source: Square, dest: Square) => {
    if (!source.piece) return;

    // Check if en passant was taken, then remove taken pawn (not on dest square)
    if (source.piece.type === "p" && dest.allowsEnPassant) {
      console.log("Taking en passant");
      squares[`${dest.file}${source.rank}`].piece = undefined;
    }

    // Clear previous en passant squares
    Object.values(squares).forEach((s) => (s.allowsEnPassant = false));

    // Check if new en passant allowed
    if (source.piece.type === "p" && Math.abs(source.rank - dest.rank) > 1) {
      squares[
        `${source.file}${(source.rank + dest.rank) / 2}`
      ].allowsEnPassant = true;

      console.log(
        "En passant allowed on",
        squares[`${source.file}${(source.rank + dest.rank) / 2}`].name
      );
    }

    // Check for promotion
    if (source.piece.type === "p") {
      if (
        (source.piece.color === "w" && dest.rank === 8) ||
        (source.piece.color === "b" && dest.rank === 1)
      ) {
        source.piece.type = "q";
        source.piece.name = `${source.piece.color}q`;
        console.log("Promoting");
      }
    }

    // Move rook if castling
    if (
      source.piece.type === "k" &&
      incrementFile(source.file) !== dest.file &&
      decrementFile(source.file) !== dest.file
    ) {
      console.log("castling");
      const rank = source.rank;
      if (dest.file === "c") {
        const rook = { ...(squares[`a${rank}`].piece as Piece) };
        rook.hasMoved = true;
        squares[`d${rank}`].piece = rook;
        squares[`a${rank}`].piece = undefined;
      } else if (dest.file === "g") {
        const rook = { ...(squares[`h${rank}`].piece as Piece) };
        rook.hasMoved = true;
        squares[`f${rank}`].piece = rook;
        squares[`h${rank}`].piece = undefined;
      }
    }

    // Move main piece
    if (squares[dest.name].piece) {
      const captured = [...capturedPieces, squares[dest.name].piece as Piece];
      console.log("Captured", captured);
      setCapturedPieces(captured);
    }
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
    setPlaySourceSquare(undefined);
    setPlayDestinationSquare(undefined);
    setWhiteToPlay(!whiteToPlay);
  };

  const CapturedPieces = (props: { pieces: Piece[] }) => {
    console.log("CapturedPieces component props", props.pieces);
    return (
      <div
        style={{
          height: "64px",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        {props.pieces
          .filter((p) => p.type === "p")
          .map((p, index) => {
            const style: React.CSSProperties = {
              height: "64px",
              width: "64px",
              position: "relative",
            };
            if (index) style["right"] = `${32 * index}px`;
            return (
              <img
                key={`${p.name}${index}`}
                alt={p.name}
                src={getPieceSprite(p.name)}
                style={style}
              />
            );
          })}
      </div>
    );
  };

  const getSquareBackgroundStyle = (s: Square) =>
    `radial-gradient(${s.color === "b" ? "#525C75" : "#CEDEFF"}, ${
      s.piece &&
      (playableSquares[playSourceSquare?.name as string] || []).includes(s) &&
      isPlayerToPlay(playSourceSquare)
        ? "#4640FF"
        : playSourceSquare?.name === s.name
        ? "green"
        : s.color === "b"
        ? "#525C75"
        : "#CEDEFF"
    })`;

  return (
    <div style={{ width: "676px", display: "flex", flexWrap: "wrap" }}>
      <CapturedPieces pieces={capturedPieces.filter((p) => p.color === "w")} />
      {Object.values(squares).map((s) => {
        return (
          <div
            key={s.piece ? s.name + "-" + s.piece.name : s.name}
            style={{
              display: "flex",
              height: "84px",
              width: "84px",
              background: getSquareBackgroundStyle(s),
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
              playableSquares[playSourceSquare.name] &&
              playableSquares[playSourceSquare.name].includes(s) &&
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
      <CapturedPieces pieces={capturedPieces.filter((p) => p.color === "b")} />
    </div>
  );
};

export { Board };
