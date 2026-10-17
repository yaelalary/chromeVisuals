const SPARKLE_COLOR = '255, 255, 255'
const WAIST_RATIO = 0.14
const GLOW_RATIO = 0.7

/** Étoile à quatre branches façon Y2K, avec un halo doux. */
export function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation = 0): void {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)

  const glow = context.createRadialGradient(0, 0, 0, 0, 0, radius * GLOW_RATIO)
  glow.addColorStop(0, `rgba(${SPARKLE_COLOR}, 0.55)`)
  glow.addColorStop(1, `rgba(${SPARKLE_COLOR}, 0)`)
  context.fillStyle = glow
  context.beginPath()
  context.arc(0, 0, radius * GLOW_RATIO, 0, Math.PI * 2)
  context.fill()

  const waist = radius * WAIST_RATIO
  context.fillStyle = `rgb(${SPARKLE_COLOR})`
  context.beginPath()
  context.moveTo(0, -radius)
  context.quadraticCurveTo(waist, -waist, radius, 0)
  context.quadraticCurveTo(waist, waist, 0, radius)
  context.quadraticCurveTo(-waist, waist, -radius, 0)
  context.quadraticCurveTo(-waist, -waist, 0, -radius)
  context.fill()
  context.restore()
}
