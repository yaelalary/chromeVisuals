export type Random = () => number

const MAX_SEED = 1_000_000

export function createRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomBetween(random: Random, min: number, max: number): number {
  return min + random() * (max - min)
}

export function randomInt(random: Random, min: number, max: number): number {
  return Math.floor(randomBetween(random, min, max + 1))
}

export function randomSign(random: Random): number {
  return random() < 0.5 ? -1 : 1
}

export function createSeed(source: Random = Math.random): number {
  return Math.floor(source() * MAX_SEED)
}
