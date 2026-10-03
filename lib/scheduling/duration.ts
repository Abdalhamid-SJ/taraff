export function sumDurationMinutes(durationsMinutes: number[]): number {
  return durationsMinutes.reduce((sum, minutes) => sum + minutes, 0);
}
