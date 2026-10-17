export interface Option<T extends string | number> {
  value: T
  label: string
}

export interface Swatch<T extends string> extends Option<T> {
  imageUrl?: string
  description?: string
}

export function optionsFrom<T extends string>(catalog: Record<T, { label: string }>): Option<T>[] {
  return (Object.keys(catalog) as T[]).map((value) => ({ value, label: catalog[value].label }))
}
