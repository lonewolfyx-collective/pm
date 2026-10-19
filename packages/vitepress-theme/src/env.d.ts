/// <reference types="vite/client" />

declare module '@localSearchIndex' {
  const searchIndex: Record<string, () => Promise<{ default: string }>>
  export default searchIndex
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}
