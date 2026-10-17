import {
  DoubleSide,
  Group,
  HalfFloatType,
  Mesh,
  MeshPhysicalMaterial,
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
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { CAMERA_DISTANCE, CAMERA_FOV } from '../domain/camera'
import type { EnvironmentSpec, MaterialSpec } from '../domain/looks'
import type { SceneForm } from '../domain/sceneForm'
import { createGradientTexture } from './backgroundTexture'
import { buildEnvironmentScene, disposeScene } from './environmentScene'
import { buildLiquidGeometry } from './liquidGeometry'
import { buildStrokeGeometry } from './strokeGeometry'

const CAMERA_POSITION = new Vector3(0, 0, CAMERA_DISTANCE)
const BLOOM_RADIUS = 0.5
const BLOOM_THRESHOLD = 1
const MULTISAMPLES = 4
const ENVIRONMENT_BLUR = 0.01
const ENVIRONMENT_RESOLUTION = 512
const LIQUID_TILT = -0.3
const LIQUID_DEPTH = -1.5

type FormBuilder<K extends SceneForm['kind']> = (form: Extract<SceneForm, { kind: K }>, material: MeshPhysicalMaterial) => Mesh[]

const FORM_BUILDERS: { [K in SceneForm['kind']]: FormBuilder<K> } = {
  strokes: (form, material) => form.strokes.map((stroke) => new Mesh(buildStrokeGeometry(stroke), material)),
  surface: (form, material) => {
    const mesh = new Mesh(buildLiquidGeometry(form.params), material)
    mesh.rotation.x = LIQUID_TILT
    mesh.position.z = LIQUID_DEPTH
    return [mesh]
  },
}

function buildForm(form: SceneForm, material: MeshPhysicalMaterial): Mesh[] {
  const builder = FORM_BUILDERS[form.kind] as FormBuilder<SceneForm['kind']>
  return builder(form, material)
}

export class ChromeRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200)
  private readonly controls: OrbitControls
  private readonly composer: EffectComposer
  private readonly bloomPass: UnrealBloomPass
  private readonly pmrem: PMREMGenerator
  private readonly material = new MeshPhysicalMaterial({ side: DoubleSide })
  private readonly artwork = new Group()
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

    this.scene.add(this.artwork)

    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: MULTISAMPLES })
    this.composer = new EffectComposer(this.renderer, target)
    this.composer.setPixelRatio(1)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0, BLOOM_RADIUS, BLOOM_THRESHOLD)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(new OutputPass())
  }

  setForm(form: SceneForm): void {
    this.clearArtwork()
    const meshes = buildForm(form, this.material)
    if (meshes.length > 0) this.artwork.add(...meshes)
    this.requestRender()
  }

  setMaterial(spec: MaterialSpec, tint: string): void {
    this.material.setValues({
      metalness: spec.metalness,
      roughness: spec.roughness,
      clearcoat: spec.clearcoat,
      clearcoatRoughness: 0.04,
      iridescence: spec.iridescence,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [120, 900],
      transmission: spec.transmission,
      ior: spec.ior,
      thickness: spec.thickness,
      envMapIntensity: spec.envIntensity,
    })
    this.material.color.set(tint)
    this.material.needsUpdate = true
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

  setBackground(top: string, bottom: string): void {
    this.backgroundTexture?.dispose()
    this.backgroundTexture = createGradientTexture(top, bottom)
    this.scene.background = this.backgroundTexture
    this.requestRender()
  }

  setBloom(strength: number): void {
    this.bloomPass.strength = strength
    this.bloomPass.enabled = strength > 0
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
    this.material.dispose()
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

  private clearArtwork(): void {
    for (const child of [...this.artwork.children]) {
      if (child instanceof Mesh) child.geometry.dispose()
      this.artwork.remove(child)
    }
  }

  private requestRender(): void {
    if (this.frameRequest) return
    this.frameRequest = requestAnimationFrame(() => {
      this.frameRequest = 0
      this.composer.render()
    })
  }
}
