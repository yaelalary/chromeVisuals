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
import type { BackgroundStyleId } from '../domain/backgrounds'
import { CAMERA_DISTANCE, CAMERA_FOV } from '../domain/camera'
import type { ImagePlacement } from '../domain/imageLayer'
import type { ImageRelief } from '../domain/imageRelief'
import type { EnvironmentSpec, MaterialSpec } from '../domain/looks'
import type { SceneForm } from '../domain/sceneForm'
import type { SymmetryId } from '../domain/symmetry'
import { buildArtwork, disposeArtwork } from './artwork'
import type { BackgroundColors } from './backgroundPainters'
import { createBackgroundTexture } from './backgroundTexture'
import { ChromeMaterials, type SurfaceFinish } from './ChromeMaterials'
import { buildEnvironmentScene, disposeScene } from './environmentScene'
import { buildImageGeometry } from './imageGeometry'
import { createLensPass, setLensEffects } from './lensPass'

const CAMERA_POSITION = new Vector3(0, 0, CAMERA_DISTANCE)
const BLOOM_RADIUS = 0.5
const BLOOM_THRESHOLD = 1
const MULTISAMPLES = 4
const ENVIRONMENT_BLUR = 0.01
const ENVIRONMENT_RESOLUTION = 512
const MIN_RELIEF_DEPTH = 0.001

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
  private artwork: Group | null = null
  private imageMesh: Mesh | null = null
  private imagePlacement: ImagePlacement | null = null
  private environmentTarget: WebGLRenderTarget | null = null
  private backgroundTexture: Texture | null = null
  private size = 1
  private frameRequest = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(1)
    this.renderer.toneMapping = NeutralToneMapping
    this.renderer.outputColorSpace = SRGBColorSpace
    this.pmrem = new PMREMGenerator(this.renderer)

    this.camera.position.copy(CAMERA_POSITION)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.minDistance = 4
    this.controls.maxDistance = 24
    this.controls.addEventListener('change', () => this.requestRender())

    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: MULTISAMPLES })
    this.composer = new EffectComposer(this.renderer, target)
    this.composer.setPixelRatio(1)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0, BLOOM_RADIUS, BLOOM_THRESHOLD)
    this.composer.addPass(this.bloomPass)
    this.lensPass = createLensPass()
    this.composer.addPass(this.lensPass)
    this.composer.addPass(new OutputPass())
  }

  setForm(form: SceneForm, symmetry: SymmetryId): void {
    this.clearArtwork()
    this.artwork = buildArtwork(form, symmetry, this.materials.form)
    this.scene.add(this.artwork)
    this.requestRender()
  }

  setMaterial(spec: MaterialSpec, tint: string): void {
    this.materials.setLook(spec, tint)
    this.requestRender()
  }

  setSurfaceFinish(finish: SurfaceFinish): void {
    this.materials.setFinish(finish)
    this.requestRender()
  }

  setImage(relief: ImageRelief | null, options: { mirrored: boolean; withColors: boolean }): void {
    this.clearImage()
    if (relief) {
      this.materials.setImageColors(options.withColors)
      this.imageMesh = new Mesh(buildImageGeometry(relief, options), this.materials.image)
      this.scene.add(this.imageMesh)
      this.applyImagePlacement()
    }
    this.requestRender()
  }

  setImagePlacement(placement: ImagePlacement): void {
    this.imagePlacement = placement
    this.applyImagePlacement()
    this.requestRender()
  }

  setEnvironment(spec: EnvironmentSpec): void {
    const environmentScene = buildEnvironmentScene(spec)
    const target = this.pmrem.fromScene(environmentScene, ENVIRONMENT_BLUR, 0.1, 100, { size: ENVIRONMENT_RESOLUTION })
    disposeScene(environmentScene)
    this.environmentTarget?.dispose()
    this.environmentTarget = target
    this.scene.environment = target.texture
    this.requestRender()
  }

  setBackground(style: BackgroundStyleId, colors: BackgroundColors, seed: number): void {
    this.backgroundTexture?.dispose()
    this.backgroundTexture = createBackgroundTexture(style, colors, seed)
    this.scene.background = this.backgroundTexture
    this.requestRender()
  }

  setBloom(strength: number): void {
    this.bloomPass.strength = strength
    this.bloomPass.enabled = strength > 0
    this.requestRender()
  }

  setLens(aberration: number, vignette: number): void {
    setLensEffects(this.lensPass, aberration, vignette)
    this.requestRender()
  }

  setSize(pixels: number): void {
    if (pixels === this.size || pixels <= 0) return
    this.resize(pixels)
    this.requestRender()
  }

  setOrbitEnabled(enabled: boolean): void {
    this.controls.enabled = enabled
  }

  resetView(): void {
    this.camera.position.copy(CAMERA_POSITION)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  /** Rend la scène à la taille demandée dans un canvas indépendant, puis restaure l'aperçu. */
  capture(pixels: number): HTMLCanvasElement {
    const previewSize = this.size
    this.resize(pixels)
    this.composer.render()
    const output = document.createElement('canvas')
    output.width = pixels
    output.height = pixels
    output.getContext('2d')?.drawImage(this.renderer.domElement, 0, 0)
    this.resize(previewSize)
    this.composer.render()
    return output
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest)
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

  private requestRender(): void {
    if (this.frameRequest) return
    this.frameRequest = requestAnimationFrame(() => {
      this.frameRequest = 0
      this.composer.render()
    })
  }
}
