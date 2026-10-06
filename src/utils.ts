import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'

export async function clearDirectory(dirPath: string): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    // 保留 .git 目录
    if (entry.name === '.git') {
      continue
    }

    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      await rm(fullPath, { recursive: true, force: true })
    }
    else {
      await rm(fullPath, { force: true })
    }
  }
}
