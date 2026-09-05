export function isTextMaterial(filename: string): boolean {
  return /\.(txt|md)$/i.test(filename);
}
