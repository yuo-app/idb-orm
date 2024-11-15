export function selectFields<T extends object, K extends keyof T>(
  obj: T,
  fields: K[],
): T extends object ? T : Pick<T, K> {
  if (fields.length === 0)
    return obj as any
  return fields.reduce((acc, field) => {
    acc[field] = obj[field]
    return acc
  }, {} as Pick<T, K>) as any
}

// from: https://github.com/supabase/supabase-js/blob/4c7f57197c0109b9393080db5971543347a6397a/src/lib/helpers.ts#L4-L10
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
