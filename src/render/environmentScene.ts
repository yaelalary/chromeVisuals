import {
  BackSide,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
} from 'three'
import type { EnvironmentSpec, LightPanelSpec } from '../domain/looks'

const DOME_RADIUS = 50

const domeVertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const domeFragmentShader = /* glsl */ `
  uniform vec3 sky;
  uniform vec3 horizon;
  uniform vec3 ground;
  varying vec3 vDirection;
  void main() {
    float height = vDirection.y;
    vec3 color = height > 0.0
      ? mix(horizon, sky, smoothstep(0.0, 0.22, height))
      : mix(horizon, ground, smoothstep(0.0, 0.18, -height));
    gl_FragColor = vec4(color, 1.0);
  }
`

function createDome(spec: EnvironmentSpec): Mesh {
  const material = new ShaderMaterial({
    uniforms: {
      sky: { value: new Color(spec.sky) },
      horizon: { value: new Color(spec.horizon) },
      ground: { value: new Color(spec.ground) },
    },
    vertexShader: domeVertexShader,
    fragmentShader: domeFragmentShader,
    side: BackSide,
    depthWrite: false,
  })
  return new Mesh(new SphereGeometry(DOME_RADIUS, 64, 32), material)
}

function createPanel(panel: LightPanelSpec): Mesh {
  const material = new MeshBasicMaterial({
    color: new Color(panel.color).multiplyScalar(panel.intensity),
    side: DoubleSide,
  })
  const mesh = new Mesh(new PlaneGeometry(...panel.size), material)
  mesh.position.set(...panel.position)
  mesh.lookAt(0, 0, 0)
  return mesh
}

export function buildEnvironmentScene(spec: EnvironmentSpec): Scene {
  const scene = new Scene()
  scene.add(createDome(spec), ...spec.panels.map(createPanel))
  return scene
}

export function disposeScene(scene: Scene): void {
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      object.material.dispose()
    }
  })
}
