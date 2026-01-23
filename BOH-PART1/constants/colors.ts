const tintColorLight = "#2f95dc";

export const BRAND_COLORS = {
  HQ: '#FFD700', // Gold
  Parq: '#50C878', // Emerald
  Casper: '#FFFF00', // Yellow
  MindStudio: '#C0C0C0', // Silver
};

export const PRIORITY_COLORS = {
  urgent: '#FF4136', // Red
  medium: '#FFDC00', // Yellow
  flexible: '#2ECC40', // Green
};

export const STATUS_COLORS = {
  good: '#2ECC40', // Green
  bottleneck: '#FFDC00', // Yellow
  critical: '#FF4136', // Red
};

export default {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#fff",
    background: "#121212",
    tint: "#FFD700",
    tabIconDefault: "#666",
    tabIconSelected: "#FFD700",
  },
};