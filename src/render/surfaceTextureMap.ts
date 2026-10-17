import { DataTexture, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from 'three'
import { heightToNormalMap, TEXTURE_RESOLUTION, textureHeights, type SurfaceTextureId } from '../domain/surfaceTextures'

/** Carte de normales répétable pour une texture de surface, ou null pour une surface lisse. */
export function createNormalMap(id: SurfaceTextureId): DataTexture | null {
  const heights = textureHeights(id)
  if (!heights) return null
  const texture = new DataTexture(heightToNormalMap(heights, TEXTURE_RESOLUTION), TEXTURE_RESOLUTION, TEXTURE_RESOLUTION, RGBAFormat)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
