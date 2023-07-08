export type Color = "b" | "w";

export const otherColor = (c: Color) => (c === "w" ? "b" : "w");
