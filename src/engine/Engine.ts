import {
  decrementFile,
  decrementRank,
  File,
  incrementFile,
  incrementRank,
  Rank,
  Square,
} from "../models/square";
import { Color, otherColor } from "../models/basic";

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

export const getPlayableSquaresFor = (
  color: Color,
  squares: { [name: string]: Square }
): Record<string, Square[]> => {
  const playableSquares: Record<string, Square[]> = {};
  const pieces: Record<Color, Square[]> = {
    w: Object.values(squares).filter((s) => s.piece?.color === "w"),
    b: Object.values(squares).filter((s) => s.piece?.color === "b"),
  };

  // Register squares reachable by other, for castling purposes
  const king = pieces[color].find((s) => s.piece?.type === "k")?.piece;
  if (king && !king.hasMoved) {
    for (const s of pieces[otherColor(color)]) {
      const opponentSquares = getReachableSquares(s, squares);
      opponentSquares.forEach((s) => (s.reachableBy[otherColor(color)] = true));
    }
  }
  // Get playable squares for current player
  for (const s of pieces[color]) {
    const playable = getPlayableSquares(s, squares);
    playable.forEach((s) => (s.playableBy[color] = true));
    playableSquares[s.name] = playable;
  }

  return playableSquares;
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
  const color = source.piece.color;
  const playableSquares = [];

  // White pawns move by increasing ranks, black by decreasing
  const rankMovement = color === "w" ? incrementRank : decrementRank;

  // Find first movement square
  const singleMoveSquare =
    squares[`${source.file}${rankMovement(source.rank)}`];
  if (singleMoveSquare && !singleMoveSquare.piece) {
    playableSquares.push(singleMoveSquare);
    // If pawn hasn't moved yet, allow double square moves
    if (!source.piece.hasMoved) {
      const doubleMoveSquare =
        squares[
          `${source.file}${rankMovement(rankMovement(source.rank) as Rank)}`
        ];
      if (doubleMoveSquare && !doubleMoveSquare.piece)
        playableSquares.push(doubleMoveSquare);
    }
  }

  // Find pieces on squares that can be taken diagonally
  const capturableSquares = [
    squares[`${incrementFile(source.file)}${rankMovement(source.rank)}`],
    squares[`${decrementFile(source.file)}${rankMovement(source.rank)}`],
  ].filter(
    (s) =>
      (s?.piece && s.piece?.color === otherColor(color)) || s?.allowsEnPassant
  );
  playableSquares.push(...capturableSquares);

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
  const castleSquares: Square[] = [];
  if (!king.piece || king.piece?.hasMoved || king.piece?.inCheck)
    return castleSquares;

  const color: Color = king.piece.color;
  const other: Color = otherColor(color);
  const rank: Rank = color === "w" ? 1 : 8;

  const aRook = squares[`a${rank}`].piece;
  const hRook = squares[`h${rank}`].piece;

  // Queen side castling
  if (
    aRook &&
    !aRook.hasMoved &&
    !squares[`b${rank}`].piece &&
    !squares[`c${rank}`].piece &&
    !squares[`d${rank}`].piece &&
    !squares[`c${rank}`].reachableBy[other] &&
    !squares[`d${rank}`].reachableBy[other]
  ) {
    castleSquares.push(squares[`c${rank}`]);
  }

  // King side castling
  if (
    hRook &&
    !hRook.hasMoved &&
    !squares[`f${rank}`].piece &&
    !squares[`g${rank}`].piece &&
    !squares[`f${rank}`].reachableBy[other] &&
    !squares[`g${rank}`].reachableBy[other]
  ) {
    castleSquares.push(squares[`g${rank}`]);
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

// Expects a king in check as first argument
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
