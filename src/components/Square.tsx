import { getPieceSprite } from "../sprites/Pieces";
import { Square } from "../models/square";

interface SquareProps {
  square: Square;
  sourcePlayable: boolean;
  destPlayable: Square[];
  onDrag: (s: Square) => void;
  onDragEnter: (s: Square) => void;
  onDrop: () => void;
}

export const SquareComp = ({
  square,
  sourcePlayable,
  destPlayable,
  onDrag,
  onDragEnter,
  onDrop,
}: SquareProps): JSX.Element => {
  return (
    <div
      style={{
        display: "flex",
        height: "100px",
        width: "100px",
        backgroundColor: square.color === "b" ? "#444444" : "#DDDDDD",
        padding: "auto",
      }}
      onDragEnter={() => onDragEnter(square)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {square.piece && (
        <img
          alt={square.color}
          src={getPieceSprite(square.piece.name)}
          style={{ margin: "auto", width: "100%" }}
          draggable={true}
          onDragStart={(event) => {
            if (sourcePlayable) {
              onDrag(square);
              event.stopPropagation();
              return;
            }
          }}
          onDragEnd={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onDrop();
          }}
          onDrop={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
        />
      )}
      {destPlayable.includes(square) && (
        <div
          style={{
            margin: "auto",
            width: "64px",
            height: "64px",
            borderRadius: "32px",
            backgroundColor: "blue",
          }}
        >
          OUI
        </div>
      )}
    </div>
  );
};
