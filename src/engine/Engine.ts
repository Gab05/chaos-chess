import {
  decrementFile,
  decrementRank,
  File,
  incrementFile,
  incrementRank,
  Rank,
  Square,
} from "../models/square";
import { Color } from "../models/basic";

export const getPlayableSquares = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  return filterOutMovesThatLeaveInCheck(
    source,
    squares,
    getReachableSquares(source, squares)
  );
};

export const getAllReachableSquares = (
  squares: { [name: string]: Square },
  color: Color | undefined = undefined,
  includeKing: boolean = true
) => {
  const reachableSquares: { [name: string]: Square } = {};

  if (!color) {
    // Get squares for both color pieces
    for (const s of Object.values(squares).filter((s) => s.piece)) {
      if (s.piece?.type === "k" && !includeKing) continue;
      const pieceReachableSquares = getReachableSquares(s, squares);
      pieceReachableSquares.forEach((s) => (reachableSquares[s.name] = s));
    }
  } else if (color === "w") {
    // Get squares reachable by white pieces
    for (const s of Object.values(squares).filter(
      (s) => s.piece && s.piece.color === "w"
    )) {
      if (s.piece?.type === "k" && !includeKing) continue;
      const pieceReachableSquares = getReachableSquares(s, squares);
      pieceReachableSquares.forEach((s) => (reachableSquares[s.name] = s));
    }
  } else {
    // Get squares reachable by black pieces
    for (const s of Object.values(squares).filter(
      (s) => s.piece && s.piece.color === "b"
    )) {
      if (s.piece?.type === "k" && !includeKing) continue;
      const pieceReachableSquares = getReachableSquares(s, squares);
      pieceReachableSquares.forEach((s) => (reachableSquares[s.name] = s));
    }
  }

  return Object.values(reachableSquares);
};

export const getReachableSquares = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  if (!source.piece) return [];
  const playableSquares: Square[] = [];
  switch (source.piece.type) {
    case "p":
      playableSquares.push(...getPlayableSquaresForPawn(source, squares));
      break;
    case "n":
      playableSquares.push(...getPlayableSquaresForKnight(source, squares));
      break;
    case "b":
      playableSquares.push(...getPlayableSquaresForBishop(source, squares));
      break;
    case "r":
      playableSquares.push(...getPlayableSquaresForRook(source, squares));
      break;
    case "q":
      playableSquares.push(...getPlayableSquaresForQueen(source, squares));
      break;
    case "k":
      playableSquares.push(...getPlayableSquaresForKing(source, squares));
      break;
  }

  return playableSquares;
};

const getPlayableSquaresForPawn = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  if (!source.piece) return [];

  const playableSquares = [];
  // White pawns go forward in ranks
  if (source.piece?.color === "w") {
    // Find first forward square
    const singleMoveSquare =
      squares[`${source.file}${incrementRank(source.rank)}`];
    if (singleMoveSquare && !singleMoveSquare.piece)
      playableSquares.push(singleMoveSquare);

    // If pawn hasn't moved yet and singleMove is allowed, allow double square moves
    if (!source.piece.hasMoved && singleMoveSquare && !singleMoveSquare.piece) {
      const doubleMoveSquare =
        squares[
          `${source.file}${incrementRank(incrementRank(source.rank) as Rank)}`
        ];
      if (doubleMoveSquare && !doubleMoveSquare.piece)
        playableSquares.push(doubleMoveSquare);
    }

    // Find pieces on squares that can be taken diagonally
    const capturableSquares = [
      squares[`${incrementFile(source.file)}${incrementRank(source.rank)}`],
      squares[`${decrementFile(source.file)}${incrementRank(source.rank)}`],
    ].filter((s) => (s?.piece && s.piece?.color === "b") || s?.allowsEnPassant);
    playableSquares.push(...capturableSquares);
  }
  // Black pawn go backwards in ranks
  else {
    // Find first forward square
    const singleMoveSquare =
      squares[`${source.file}${decrementRank(source.rank)}`];

    if (singleMoveSquare && !singleMoveSquare.piece)
      playableSquares.push(singleMoveSquare);

    // If pawn hasn't moved yet and singleMove is allowed, allow double square moves
    if (!source.piece.hasMoved && singleMoveSquare && !singleMoveSquare.piece) {
      const doubleMoveSquare =
        squares[
          `${source.file}${decrementRank(decrementRank(source.rank) as Rank)}`
        ];
      if (doubleMoveSquare && !doubleMoveSquare.piece)
        playableSquares.push(doubleMoveSquare);
    }

    // Find pieces on squares that can be taken diagonally
    const capturableSquares = [
      squares[`${incrementFile(source.file)}${decrementRank(source.rank)}`],
      squares[`${decrementFile(source.file)}${decrementRank(source.rank)}`],
    ].filter(
      (s) => (s?.piece && s?.piece?.color === "w") || s?.allowsEnPassant
    );
    playableSquares.push(...capturableSquares);
  }

  return playableSquares;
};

const getPlayableSquaresForKnight = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  if (!source.piece) return [];
  const { file, rank } = source;
  return [
    squares[`${incrementFile(incrementFile(file))}${incrementRank(rank)}`],
    squares[`${incrementFile(incrementFile(file))}${decrementRank(rank)}`],
    squares[`${decrementFile(decrementFile(file))}${incrementRank(rank)}`],
    squares[`${decrementFile(decrementFile(file))}${decrementRank(rank)}`],
    squares[`${incrementFile(file)}${incrementRank(incrementRank(rank))}`],
    squares[`${incrementFile(file)}${decrementRank(decrementRank(rank))}`],
    squares[`${decrementFile(file)}${incrementRank(incrementRank(rank))}`],
    squares[`${decrementFile(file)}${decrementRank(decrementRank(rank))}`],
  ]
    .filter((s) => !!s)
    .filter((s) => (s.piece ? s.piece.color !== source.piece?.color : true));
};

const getPlayableSquaresForBishop = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  if (!source.piece) return [];
  return getPlayableSquaresOnDiagonals(source, squares);
};

const getPlayableSquaresForRook = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  if (!source.piece) return [];
  return getPlayableSquaresOnLines(source, squares);
};

const getPlayableSquaresForQueen = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  return [
    ...getPlayableSquaresOnDiagonals(source, squares),
    ...getPlayableSquaresOnLines(source, squares),
  ];
};

const getPlayableSquaresForKing = (
  source: Square,
  squares: { [name: string]: Square }
): Square[] => {
  const castleSquares: Square[] = [];
  if (!source.piece?.hasMoved)
    castleSquares.push(...findCastleSquares(source, squares));

  return [
    ...castleSquares,
    squares[`${incrementFile(source.file)}${incrementRank(source.rank)}`],
    squares[`${incrementFile(source.file)}${decrementRank(source.rank)}`],
    squares[`${incrementFile(source.file)}${source.rank}`],
    squares[`${source.file}${incrementRank(source.rank)}`],
    squares[`${source.file}${decrementRank(source.rank)}`],
    squares[`${decrementFile(source.file)}${source.rank}`],
    squares[`${decrementFile(source.file)}${incrementRank(source.rank)}`],
    squares[`${decrementFile(source.file)}${decrementRank(source.rank)}`],
  ]
    .filter((s) => !!s)
    .filter((s) => (s.piece ? s.piece.color !== source.piece?.color : true));
};

const getPlayableSquaresOnDiagonals = (
  s: Square,
  squares: { [name: string]: Square }
): Square[] => {
  return [
    ...loopOnPlayableSquares(s, squares, incrementFile, incrementRank),
    ...loopOnPlayableSquares(s, squares, decrementFile, incrementRank),
    ...loopOnPlayableSquares(s, squares, incrementFile, decrementRank),
    ...loopOnPlayableSquares(s, squares, decrementFile, decrementRank),
  ].filter((s) => !!s);
};

const getPlayableSquaresOnLines = (
  s: Square,
  squares: { [name: string]: Square }
): Square[] => {
  return [
    ...loopOnPlayableSquares(s, squares, incrementFile, (rank) => rank),
    ...loopOnPlayableSquares(s, squares, decrementFile, (rank) => rank),
    ...loopOnPlayableSquares(s, squares, (file) => file, incrementRank),
    ...loopOnPlayableSquares(s, squares, (file) => file, decrementRank),
  ].filter((s) => !!s);
};

const loopOnPlayableSquares = (
  s: Square,
  squares: { [name: string]: Square },
  fileMovement: (file: File) => File | undefined,
  rankMovement: (rank: Rank) => Rank | undefined
): Square[] => {
  if (!s.piece) return [];
  const playableSquares = [];
  let file = s.file;
  let rank = s.rank;
  let last = false;
  let current = squares[`${fileMovement(file)}${rankMovement(rank)}`];

  while (current && !last) {
    const next =
      squares[`${fileMovement(current.file)}${rankMovement(current.rank)}`];
    if (!next) last = true;

    if (!current.piece) {
      playableSquares.push(current);
    }
    if (current.piece) {
      if (current.piece?.color !== s.piece.color) playableSquares.push(current);
      last = true;
    }

    file = fileMovement(file) as File;
    rank = rankMovement(rank) as Rank;
    current = next;
  }

  return playableSquares;
};

const findCastleSquares = (
  king: Square,
  squares: { [name: string]: Square }
): Square[] => {
  const { b1, c1, d1, f1, g1, b8, c8, d8, f8, g8 } = squares;
  const castleSquares: Square[] = [];
  if (!king.piece || king.piece?.hasMoved || king.piece?.inCheck)
    return castleSquares;

  if (king.piece.color === "w") {
    const aRook = squares["a1"].piece;
    const hRook = squares["h1"].piece;
    if (aRook && !aRook.hasMoved && !b1.piece && !c1.piece && !d1.piece) {
      const opponentSquares = getAllReachableSquares(squares, "b", false);
      if (
        !opponentSquares.find((s) =>
          [b1, c1, d1].map((sq) => sq.name).includes(s.name)
        )
      ) {
        castleSquares.push(c1);
      }
    }
    if (hRook && !hRook.hasMoved && !f1.piece && !g1.piece) {
      const opponentSquares = getAllReachableSquares(squares, "b", false);
      if (
        !opponentSquares.find((s) =>
          [f1, g1].map((sq) => sq.name).includes(s.name)
        )
      ) {
        castleSquares.push(g1);
      }
    }
  } else {
    const aRook = squares["a8"].piece;
    const hRook = squares["h8"].piece;
    if (aRook && !aRook.hasMoved && !b8.piece && !c8.piece && !d8.piece) {
      const opponentSquares = getAllReachableSquares(squares, "w", false);
      if (
        !opponentSquares.find((s) =>
          [b8, c8, d8].map((sq) => sq.name).includes(s.name)
        )
      ) {
        castleSquares.push(c8);
      }
    }
    if (hRook && !hRook.hasMoved && !f8.piece && !g8.piece) {
      const opponentSquares = getAllReachableSquares(squares, "w", false);
      if (
        !opponentSquares.find((s) =>
          [f8, g8].map((sq) => sq.name).includes(s.name)
        )
      ) {
        castleSquares.push(g8);
      }
    }
  }
  return castleSquares;
};

// Returns the king in check at index 0, then pieces that give the check
export const findChecks = (squares: { [name: string]: Square }): Square[] => {
  const checks = [];
  for (const s of Object.values(squares).filter((s) => s.piece)) {
    for (const target of getPlayableSquares(s, squares)) {
      if (
        target.piece &&
        target.piece.type === "k" &&
        target.piece.color !== s.piece?.color
      ) {
        if (!checks.length) checks.push(target);
        checks.push(s);
      }
    }
  }
  return checks;
};

export const findCheckmate = (
  king: Square,
  squares: { [name: string]: Square }
): boolean => {
  const playerPlayableMoves = [];
  Object.values(squares)
    .filter((s) => s.piece && s.piece.color === king.piece?.color)
    .forEach((s) => {
      const playableSquares = getPlayableSquares(s, squares);
      playerPlayableMoves.push(...playableSquares);
    });
  return !playerPlayableMoves.length;
};

const filterOutMovesThatLeaveInCheck = (
  s: Square,
  squares: { [name: string]: Square },
  playableSquares: Square[]
): Square[] => {
  const illegalMoves: Square[] = [];

  for (const playSquare of playableSquares) {
    const tempSquares: { [name: string]: Square } = JSON.parse(
      JSON.stringify(squares)
    );
    tempSquares[`${playSquare.file}${playSquare.rank}`].piece = s.piece;
    tempSquares[`${s.file}${s.rank}`].piece = undefined;

    const opponentSquares = Object.values(tempSquares).filter(
      (sq) => sq.piece && sq.piece?.color !== s.piece?.color
    );

    for (const opponentSquare of opponentSquares) {
      const attackedSquares = getReachableSquares(opponentSquare, tempSquares);
      if (!attackedSquares.length) continue;
      if (attackedSquares.find((sq) => sq.piece && sq.piece.type === "k"))
        illegalMoves.push(playSquare);
    }
  }

  return playableSquares.filter((s) => !illegalMoves.includes(s));
};
