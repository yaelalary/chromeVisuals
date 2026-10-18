import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FrameScheduler } from './frameScheduler'

let frames: FrameRequestCallback[] = []

beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
})

afterEach(() => vi.unstubAllGlobals())

function runFrame(): void {
  const pending = frames
  frames = []
  for (const callback of pending) callback(0)
}

describe('FrameScheduler', () => {
  it('n’exécute que la dernière demande pour une même clé', () => {
    const calls: number[] = []
    const scheduler = new FrameScheduler()
    for (let i = 0; i < 30; i++) scheduler.schedule('couleur', () => calls.push(i))
    expect(calls).toEqual([])
    runFrame()
    expect(calls).toEqual([29])
  })

  it('ne demande qu’un seul rafraîchissement pour plusieurs tâches', () => {
    const scheduler = new FrameScheduler()
    scheduler.schedule('a', () => undefined)
    scheduler.schedule('b', () => undefined)
    expect(frames).toHaveLength(1)
  })

  it('exécute les tâches puis le rendu final', () => {
    const order: string[] = []
    const scheduler = new FrameScheduler(() => order.push('rendu'))
    scheduler.schedule('fond', () => order.push('fond'))
    scheduler.schedule('matière', () => order.push('matière'))
    runFrame()
    expect(order).toEqual(['fond', 'matière', 'rendu'])
  })

  it('peut tout exécuter immédiatement, par exemple avant un export', () => {
    const calls: string[] = []
    const scheduler = new FrameScheduler()
    scheduler.schedule('fond', () => calls.push('fond'))
    scheduler.flush()
    expect(calls).toEqual(['fond'])
    runFrame()
    expect(calls).toEqual(['fond'])
  })

  it('n’exécute plus rien après dispose', () => {
    const calls: string[] = []
    const scheduler = new FrameScheduler()
    scheduler.schedule('fond', () => calls.push('fond'))
    scheduler.dispose()
    scheduler.flush()
    expect(calls).toEqual([])
  })
})
