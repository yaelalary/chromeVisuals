import { BufferGeometry, Group, Mesh, type Material } from 'three'
import type { SceneForm } from '../domain/sceneForm'
import { SYMMETRIES, type SymmetryId } from '../domain/symmetry'
import { buildLiquidGeometry } from './liquidGeometry'
import { buildStrokeGeometry } from './strokeGeometry'

const LIQUID_TILT = -0.3
const LIQUID_DEPTH = -1.5

type FormBuilder<K extends SceneForm['kind']> = (form: Extract<SceneForm, { kind: K }>, material: Material) => Mesh[]

const FORM_BUILDERS: { [K in SceneForm['kind']]: FormBuilder<K> } = {
  strokes: (form, material) => form.strokes.map((stroke) => new Mesh(buildStrokeGeometry(stroke), material)),
  surface: (form, material) => {
    const mesh = new Mesh(buildLiquidGeometry(form.params), material)
    mesh.rotation.x = LIQUID_TILT
    mesh.position.z = LIQUID_DEPTH
    return [mesh]
  },
}

function buildMeshes(form: SceneForm, material: Material): Mesh[] {
  const builder = FORM_BUILDERS[form.kind] as FormBuilder<SceneForm['kind']>
  return builder(form, material)
}

/** Motif 3D, répété selon la symétrie : les copies partagent la géométrie de l'original. */
export function buildArtwork(form: SceneForm, symmetry: SymmetryId, material: Material): Group {
  const meshes = buildMeshes(form, material)
  const root = new Group()
  SYMMETRIES[symmetry].transforms.forEach((transform, index) => {
    const copy = new Group()
    copy.scale.set(transform.mirrorX ? -1 : 1, transform.mirrorY ? -1 : 1, 1)
    copy.rotation.z = transform.rotation
    for (const mesh of meshes) copy.add(index === 0 ? mesh : mesh.clone())
    root.add(copy)
  })
  return root
}

export function disposeArtwork(root: Group): void {
  const geometries = new Set<BufferGeometry>()
  root.traverse((object) => {
    if (object instanceof Mesh) geometries.add(object.geometry)
  })
  geometries.forEach((geometry) => geometry.dispose())
}
