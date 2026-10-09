/** Backend `questionImage` is an emoji today and may become an image URL later: support both. */
export function questionImageSrc(value: string | null): string | null {
  if (!value) return null;
  if (/^(https?:)?\/\/|^\//.test(value)) return value;
  const size = [...value].length > 4 ? 90 : 170;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><text x="300" y="230" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${size}" fill="#6b38d4">${value}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
