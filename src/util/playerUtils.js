export const isAbsentPlayer = (player) =>
  (player?.name ?? "").trim().toUpperCase() === "!ABSENT";