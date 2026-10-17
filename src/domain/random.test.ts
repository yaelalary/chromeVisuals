import { describe, expect, it } from 'vitest'
import { createRandom, createSeed, randomInt } from './random'

describe('createRandom', () => {
  it('produit la même suite pour la même graine', () => {
    const first = createRandom(42)
    const second = createRandom(42)
    expect(Array.from({ length: 5 }, first)).toEqual(Array.from({ length: 5 }, second))
  })

  it('produit des suites différentes pour des graines différentes', () => {
    expect(createRandom(1)()).not.toEqual(createRandom(2)())
  })

  it('reste dans [0, 1[', () => {
    const random = createRandom(7)
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  it('inclut les deux bornes', () => {
    const random = createRandom(3)
    const values = new Set(Array.from({ length: 500 }, () => randomInt(random, 2, 4)))
    expect([...values].sort()).toEqual([2, 3, 4])
  })
})

describe('createSeed', () => {
  it('dérive un entier positif de la source', () => {
    expect(createSeed(() => 0.5)).toBe(500000)
  })
})
