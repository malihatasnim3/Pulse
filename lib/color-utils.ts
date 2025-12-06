export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

export function rgbDistance(
  rgb1: { r: number; g: number; b: number },
  rgb2: { r: number; g: number; b: number }
): number {
  return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
}

export function clusterColors(colors: string[], maxClusters: number = 5): Record<string, number> {
  if (colors.length === 0) return {};

  const colorCounts: Record<string, number> = {};
  const validColors = colors.map((c) => c.trim()).filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c));

  if (validColors.length === 0) return {};

  for (const color of validColors) {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxClusters);

  return Object.fromEntries(sortedColors);
}

export function extractColorsFromAds(ads: any[]): string[] {
  const colors: string[] = [];

  for (const ad of ads) {
    if (ad.ads && Array.isArray(ad.ads)) {
      for (const variant of ad.ads) {
        if (variant.dominant_color) {
          colors.push(variant.dominant_color);
        }
      }
    }
  }

  return colors;
}
