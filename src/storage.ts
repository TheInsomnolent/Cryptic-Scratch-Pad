import type { PuzzleState } from './model'

const KEY = 'cryptic-scratch-pad:v1'

export function loadState(): PuzzleState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PuzzleState
    if (!parsed || typeof parsed.clue !== 'string' || !parsed.nodes || !parsed.rootId) return null
    if (!parsed.nodes[parsed.rootId]) return null
    if (!parsed.nodes[parsed.selectedNodeId]) parsed.selectedNodeId = parsed.rootId
    return parsed
  } catch {
    return null
  }
}

export function saveState(state: PuzzleState | null): void {
  try {
    if (state === null) {
      localStorage.removeItem(KEY)
    } else {
      localStorage.setItem(KEY, JSON.stringify(state))
    }
  } catch {
    // storage may be unavailable (private mode); working state stays in memory
  }
}
