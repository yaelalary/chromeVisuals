import { PlaneGeometry } from 'three'
import { createLiquidField } from '../domain/liquid'
import type { FormParams } from '../domain/shapes'

const LIQUID_SIZE = 18
const LIQUID_SEGMENTS = 320

export function buildLiquidGeometry(params: FormParams): PlaneGeometry {
  const heightAt = createLiquidField(params)
  const geometry = new PlaneGeometry(LIQUID_SIZE, LIQUID_SIZE, LIQUID_SEGMENTS, LIQUID_SEGMENTS)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, heightAt(position.getX(i), position.getY(i)))
  }
  geometry.computeVertexNormals()
  return geometry
}
