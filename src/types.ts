import type { DetectResult } from 'package-manager-detector'

export interface ResolveConfig {
  cwd: string
  detect: DetectResult
}
