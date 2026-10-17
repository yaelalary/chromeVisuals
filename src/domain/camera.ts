export const CAMERA_DISTANCE = 10
export const CAMERA_FOV = 35

/** Demi-largeur du cadre visible, en unités 3D, à une profondeur donnée (caméra par défaut, de face). */
export function frameHalfExtentAt(depth: number): number {
  return (CAMERA_DISTANCE - depth) * Math.tan((CAMERA_FOV * Math.PI) / 360)
}
