import { DoubleSide, MeshPhysicalMaterial, type DataTexture } from 'three'
import type { MaterialSpec } from '../domain/looks'
import { seamlessRepeat, SURFACE_TEXTURES, type SurfaceTextureId } from '../domain/surfaceTextures'
import { clamp } from '../domain/vector'
import { createNormalMap } from './surfaceTextureMap'

export interface SurfaceFinish {
  textureId: SurfaceTextureId
  strength: number
  scale: number
}

const BASE_CLEARCOAT_ROUGHNESS = 0.04
const ANISOTROPY_ROTATION = Math.PI / 2

/**
 * Matériaux chrome du motif et de l'image : ambiance, teinte et texture de surface réunies.
 * Les shaders ne sont réévalués que si la carte de relief ou les couleurs d'image changent ;
 * three.js gère lui-même l'activation de la transmission, de l'irisation ou du vernis.
 */
export class ChromeMaterials {
  readonly form = new MeshPhysicalMaterial({ side: DoubleSide })
  readonly image = new MeshPhysicalMaterial({ side: DoubleSide })
  private spec: MaterialSpec | null = null
  private tint = '#ffffff'
  private finish: SurfaceFinish = { textureId: 'smooth', strength: 0, scale: 1 }
  private normalMap: DataTexture | null = null
  private appliedNormalMap: DataTexture | null = null
  private imageColors = false

  setLook(spec: MaterialSpec, tint: string): void {
    this.spec = spec
    this.tint = tint
    this.apply()
  }

  setFinish(finish: SurfaceFinish): void {
    if (finish.textureId !== this.finish.textureId) {
      this.normalMap?.dispose()
      this.normalMap = createNormalMap(finish.textureId)
    }
    this.finish = finish
    this.apply()
  }

  setImageColors(enabled: boolean): void {
    this.imageColors = enabled
    this.apply()
  }

  dispose(): void {
    this.form.dispose()
    this.image.dispose()
    this.normalMap?.dispose()
  }

  private apply(): void {
    const spec = this.spec
    if (!spec) return
    const texture = SURFACE_TEXTURES[this.finish.textureId]
    const strength = this.normalMap ? this.finish.strength : 0
    this.normalMap?.repeat.set(...seamlessRepeat(this.finish.scale))
    const shaderChanged = this.appliedNormalMap !== this.normalMap || this.image.vertexColors !== this.imageColors

    for (const material of [this.form, this.image]) {
      material.setValues({
        metalness: spec.metalness,
        roughness: clamp(spec.roughness + texture.roughness * strength, 0, 1),
        clearcoat: spec.clearcoat,
        clearcoatRoughness: clamp(BASE_CLEARCOAT_ROUGHNESS + texture.roughness * strength * 0.5, 0, 1),
        iridescence: spec.iridescence,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [120, 900],
        transmission: spec.transmission,
        ior: spec.ior,
        thickness: spec.thickness,
        envMapIntensity: spec.envIntensity,
        anisotropy: texture.anisotropy * strength,
        anisotropyRotation: ANISOTROPY_ROTATION,
        normalMap: this.normalMap,
        clearcoatNormalMap: this.normalMap,
      })
      material.normalScale.setScalar(strength * texture.relief)
      material.clearcoatNormalScale.setScalar(strength * texture.relief)
      material.color.set(this.tint)
      if (shaderChanged) material.needsUpdate = true
    }
    this.image.vertexColors = this.imageColors
    this.appliedNormalMap = this.normalMap
  }
}
