const colors = [
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#673AB7", // Deep Purple
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#03A9F4", // Light Blue
  "#009688", // Teal
  "#4CAF50", // Green
  "#8BC34A", // Light Green
  "#FFC107", // Amber
  "#FF9800", // Orange
  "#795548", // Brown
  "#607D8B", // Blue Grey
];

export function getAvatarColor(text = "") {
  if (!text) return colors[0];

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}