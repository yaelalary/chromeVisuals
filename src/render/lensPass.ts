import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

const ABERRATION_SPREAD = 0.025
const VIGNETTE_INNER = 0.3
const VIGNETTE_OUTER = 0.75

/** Effets d'objectif : aberration chromatique radiale et vignettage. */
const LensShader = {
  name: 'LensShader',
  uniforms: {
    tDiffuse: { value: null },
    aberration: { value: 0 },
    vignette: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float aberration;
    uniform float vignette;
    varying vec2 vUv;
    void main() {
      vec2 fromCenter = vUv - 0.5;
      vec2 shift = fromCenter * aberration * ${ABERRATION_SPREAD.toFixed(3)};
      vec4 base = texture2D(tDiffuse, vUv);
      float red = texture2D(tDiffuse, vUv + shift).r;
      float blue = texture2D(tDiffuse, vUv - shift).b;
      float fade = 1.0 - vignette * smoothstep(${VIGNETTE_INNER.toFixed(2)}, ${VIGNETTE_OUTER.toFixed(2)}, length(fromCenter));
      gl_FragColor = vec4(vec3(red, base.g, blue) * fade, base.a);
    }
  `,
}

export function createLensPass(): ShaderPass {
  const pass = new ShaderPass(LensShader)
  pass.enabled = false
  return pass
}

export function setLensEffects(pass: ShaderPass, aberration: number, vignette: number): void {
  pass.uniforms.aberration.value = aberration
  pass.uniforms.vignette.value = vignette
  pass.enabled = aberration > 0 || vignette > 0
}
