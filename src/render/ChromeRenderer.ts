import {
  Group,
  HalfFloatType,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type Texture,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { CAMERA_DISTANCE, CAMERA_FOV } from '../domain/camera'
import type { ImagePlacement } from '../domain/imageLayer'
import type { ImageRelief } from '../domain/imageRelief'
import type { EnvironmentSpec, MaterialSpec } from '../domain/looks'
import type { SceneForm } from '../domain/sceneForm'
import type { SymmetryId } from '../domain/symmetry'
import { buildArtwork, disposeArtwork } from './artwork'
import {
  createBackgroundTexture,
  EXPORT_BACKGROUND_RESOLUTION,
  PREVIEW_BACKGROUND_RESOLUTION,
  type BackgroundSpec,
} from './backgroundTexture'
import { ChromeMaterials, type SurfaceFinish } from './ChromeMaterials'
import { buildEnvironmentScene, disposeScene } from './environmentScene'
import { FrameScheduler } from './frameScheduler'
import { buildImageGeometry } from './imageGeometry'
import { createLensPass, setLensEffects } from './lensPass'

const CAMERA_POSITION = new Vector3(0, 0, CAMERA_DISTANCE)
const BLOOM_RADIUS = 0.5
const BLOOM_THRESHOLD = 1
const MULTISAMPLES = 4
const ENVIRONMENT_BLUR = 0.01
const ENVIRONMENT_RESOLUTION = 512
const MIN_RELIEF_DEPTH = 0.001

/**
 * Scène chrome. Les modifications coûteuses (géométrie, matériaux, fond, environnement) sont regroupées
 * par le planificateur : une rafale de réglages ne produit qu'un calcul et un rendu par image affichée.
 */
export class ChromeRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200)
  private readonly controls: OrbitControls
  private readonly composer: EffectComposer
  private readonly bloomPass: UnrealBloomPass
  private readonly lensPass: ShaderPass
  private readonly pmrem: PMREMGenerator
  private readonly materials = new ChromeMaterials()
  private readonly scheduler: FrameScheduler
  private artwork: Group | null = null
  private imageMesh: Mesh | null = null
  private imagePlacement: ImagePlacement | null = null
  private environmentTarget: WebGLRenderTarget | null = null
  private backgroundSpec: BackgroundSpec | null = null
  private backgroundTexture: Texture | null = null
  private size = 1

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(1)
    this.renderer.toneMapping = NeutralToneMapping
    this.renderer.outputColorSpace = SRGBColorSpace
    this.pmrem = new PMREMGenerator(this.renderer)

    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: MULTISAMPLES })
    this.composer = new EffectComposer(this.renderer, target)
    this.composer.setPixelRatio(1)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0, BLOOM_RADIUS, BLOOM_THRESHOLD)
    this.composer.addPass(this.bloomPass)
    this.lensPass = createLensPass()
    this.composer.addPass(this.lensPass)
    this.composer.addPass(new OutputPass())
    this.scheduler = new FrameScheduler(() => this.composer.render())

    this.camera.position.copy(CAMERA_POSITION)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.minDistance = 4
    this.controls.maxDistance = 24
    this.controls.addEventListener('change', () => this.scheduler.requestFrame())
  }

  setForm(form: SceneForm, symmetry: SymmetryId): void {
    this.scheduler.schedule('form', () => {
      this.clearArtwork()
      this.artwork = buildArtwork(form, symmetry, this.materials.form)
      this.scene.add(this.artwork)
    })
  }

  setMaterial(spec: MaterialSpec, tint: string): void {
    this.scheduler.schedule('material', () => this.materials.setLook(spec, tint))
  }

  setSurfaceFinish(finish: SurfaceFinish): void {
    this.scheduler.schedule('finish', () => this.materials.setFinish(finish))
  }

  setImage(relief: ImageRelief | null, options: { mirrored: boolean; withColors: boolean }): void {
    this.scheduler.schedule('image', () => {
      this.clearImage()
      if (!relief) return
      this.materials.setImageColors(options.withColors)
      this.imageMesh = new Mesh(buildImageGeometry(relief, options), this.materials.image)
      this.scene.add(this.imageMesh)
      this.applyImagePlacement()
    })
  }

  setImagePlacement(placement: ImagePlacement): void {
    this.imagePlacement = placement
    this.applyImagePlacement()
    this.scheduler.requestFrame()
  }

  setEnvironment(spec: EnvironmentSpec): void {
    this.scheduler.schedule('environment', () => {
      const environmentScene = buildEnvironmentScene(spec)
      const target = this.pmrem.fromScene(environmentScene, ENVIRONMENT_BLUR, 0.1, 100, { size: ENVIRONMENT_RESOLUTION })
      disposeScene(environmentScene)
      this.environmentTarget?.dispose()
      this.environmentTarget = target
      this.scene.environment = target.texture
    })
  }

  setBackground(spec: BackgroundSpec): void {
    this.backgroundSpec = spec
    this.scheduler.schedule('background', () => this.applyBackground(PREVIEW_BACKGROUND_RESOLUTION))
  }

  setBloom(strength: number): void {
    this.bloomPass.strength = strength
    this.bloomPass.enabled = strength > 0
    this.scheduler.requestFrame()
  }

  setLens(aberration: number, vignette: number): void {
    setLensEffects(this.lensPass, aberration, vignette)
    this.scheduler.requestFrame()
  }

  setSize(pixels: number): void {
    if (pixels === this.size || pixels <= 0) return
    this.scheduler.schedule('size', () => this.resize(pixels))
  }

  setOrbitEnabled(enabled: boolean): void {
    this.controls.enabled = enabled
  }

  resetView(): void {
    this.camera.position.copy(CAMERA_POSITION)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  /** Rend la scène à la taille demandée dans un canvas indépendant, fond en haute définition, puis restaure l'aperçu. */
  capture(pixels: number): HTMLCanvasElement {
    this.scheduler.flush()
    const previewSize = this.size
    this.applyBackground(EXPORT_BACKGROUND_RESOLUTION)
    this.resize(pixels)
    this.composer.render()
    const output = document.createElement('canvas')
    output.width = pixels
    output.height = pixels
    output.getContext('2d')?.drawImage(this.renderer.domElement, 0, 0)
    this.applyBackground(PREVIEW_BACKGROUND_RESOLUTION)
    this.resize(previewSize)
    this.composer.render()
    return output
  }

  dispose(): void {
    this.scheduler.dispose()
    this.controls.dispose()
    this.clearArtwork()
    this.clearImage()
    this.materials.dispose()
    this.environmentTarget?.dispose()
    this.backgroundTexture?.dispose()
    this.pmrem.dispose()
    this.composer.dispose()
    this.renderer.dispose()
  }

  private resize(pixels: number): void {
    this.size = pixels
    this.renderer.setSize(pixels, pixels, false)
    this.composer.setSize(pixels, pixels)
    this.camera.aspect = 1
    this.camera.updateProjectionMatrix()
  }

  private applyBackground(resolution: number): void {
    if (!this.backgroundSpec) return
    this.backgroundTexture?.dispose()
    this.backgroundTexture = createBackgroundTexture(this.backgroundSpec, resolution)
    this.scene.background = this.backgroundTexture
  }

  private applyImagePlacement(): void {
    if (!this.imageMesh || !this.imagePlacement) return
    const { position, width, reliefDepth } = this.imagePlacement
    this.imageMesh.position.set(...position)
    this.imageMesh.scale.set(width, width, Math.max(reliefDepth, MIN_RELIEF_DEPTH))
  }

  private clearImage(): void {
    if (!this.imageMesh) return
    this.imageMesh.geometry.dispose()
    this.scene.remove(this.imageMesh)
    this.imageMesh = null
  }

  private clearArtwork(): void {
    if (!this.artwork) return
    disposeArtwork(this.artwork)
    this.scene.remove(this.artwork)
    this.artwork = null
  }
}
