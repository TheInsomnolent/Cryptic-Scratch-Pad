// Core data model and pure state-transition logic for the scratch pad.
// Kept free of React so it can be unit tested in isolation.

export type SegmentType = 'definition' | 'wordplay' | 'junk'

export const WORDPLAY_TYPES = [
  'anagram',
  'hidden word',
  'acrostic',
  'charade',
  'container',
  'reversal',
  'deletion',
  'homophone',
  'double definition',
  '&lit',
  'spoonerism',
  'letter selection',
  'abbreviation',
  'other',
] as const

export type WordplayType = (typeof WORDPLAY_TYPES)[number]

export interface Segment {
  id: string
  /** inclusive word index of the first word in the segment */
  start: number
  /** inclusive word index of the last word in the segment */
  end: number
  type: SegmentType
  wordplayType?: WordplayType
  /** partial solution / working notes for this segment */
  partial?: string
}

export interface ThoughtNode {
  id: string
  parentId: string | null
  label: string
  segments: Segment[]
  /** proposed answer for this line of thought */
  answer: string
  childIds: string[]
}

export interface PuzzleState {
  clue: string
  /** e.g. "(5,4)" letter enumeration */
  enumeration: string
  rootId: string
  nodes: Record<string, ThoughtNode>
  selectedNodeId: string
}

let counter = 0
export function makeId(): string {
  counter += 1
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`
}

export function splitWords(clue: string): string[] {
  return clue.trim().split(/\s+/).filter(Boolean)
}

export function createPuzzle(clue: string, enumeration = ''): PuzzleState {
  const rootId = makeId()
  const root: ThoughtNode = {
    id: rootId,
    parentId: null,
    label: 'Start',
    segments: [],
    answer: '',
    childIds: [],
  }
  return {
    clue,
    enumeration,
    rootId,
    nodes: { [rootId]: root },
    selectedNodeId: rootId,
  }
}

function cloneNodeShallow(node: ThoughtNode): ThoughtNode {
  return {
    ...node,
    segments: node.segments.map((s) => ({ ...s })),
    childIds: [...node.childIds],
  }
}

/**
 * Adds a segment covering the inclusive word range [start, end].
 * Any existing segments that overlap the new range are trimmed or removed
 * so that each word belongs to at most one segment.
 */
export function addSegment(
  state: PuzzleState,
  nodeId: string,
  start: number,
  end: number,
  type: SegmentType,
): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const [lo, hi] = start <= end ? [start, end] : [end, start]

  const kept: Segment[] = []
  for (const seg of node.segments) {
    if (seg.end < lo || seg.start > hi) {
      kept.push({ ...seg })
      continue
    }
    // overlapping: keep non-overlapping remainders
    if (seg.start < lo) {
      kept.push({ ...seg, id: makeId(), end: lo - 1 })
    }
    if (seg.end > hi) {
      kept.push({ ...seg, id: makeId(), start: hi + 1 })
    }
  }
  kept.push({ id: makeId(), start: lo, end: hi, type })
  kept.sort((a, b) => a.start - b.start)

  const next = cloneNodeShallow(node)
  next.segments = kept
  return { ...state, nodes: { ...state.nodes, [nodeId]: next } }
}

export function removeSegment(state: PuzzleState, nodeId: string, segmentId: string): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const next = cloneNodeShallow(node)
  next.segments = next.segments.filter((s) => s.id !== segmentId)
  return { ...state, nodes: { ...state.nodes, [nodeId]: next } }
}

export function updateSegment(
  state: PuzzleState,
  nodeId: string,
  segmentId: string,
  patch: Partial<Pick<Segment, 'type' | 'wordplayType' | 'partial'>>,
): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const next = cloneNodeShallow(node)
  next.segments = next.segments.map((s) => (s.id === segmentId ? { ...s, ...patch } : s))
  return { ...state, nodes: { ...state.nodes, [nodeId]: next } }
}

export function setAnswer(state: PuzzleState, nodeId: string, answer: string): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const next = cloneNodeShallow(node)
  next.answer = answer
  return { ...state, nodes: { ...state.nodes, [nodeId]: next } }
}

export function setLabel(state: PuzzleState, nodeId: string, label: string): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const next = cloneNodeShallow(node)
  next.label = label
  return { ...state, nodes: { ...state.nodes, [nodeId]: next } }
}

/**
 * Branches the given node: creates a child that starts as a deep copy of the
 * parent's working (segments + answer), so the user can explore a "what if".
 */
export function branchNode(state: PuzzleState, nodeId: string, label = 'What if…'): PuzzleState {
  const node = state.nodes[nodeId]
  if (!node) return state
  const childId = makeId()
  const child: ThoughtNode = {
    id: childId,
    parentId: nodeId,
    label,
    segments: node.segments.map((s) => ({ ...s, id: makeId() })),
    answer: node.answer,
    childIds: [],
  }
  const parent = cloneNodeShallow(node)
  parent.childIds.push(childId)
  return {
    ...state,
    nodes: { ...state.nodes, [nodeId]: parent, [childId]: child },
    selectedNodeId: childId,
  }
}

function collectDescendants(state: PuzzleState, nodeId: string, acc: string[] = []): string[] {
  acc.push(nodeId)
  const node = state.nodes[nodeId]
  if (node) {
    for (const childId of node.childIds) collectDescendants(state, childId, acc)
  }
  return acc
}

/** Deletes a node and its entire subtree. The root cannot be deleted. */
export function deleteNode(state: PuzzleState, nodeId: string): PuzzleState {
  if (nodeId === state.rootId) return state
  const node = state.nodes[nodeId]
  if (!node) return state
  const doomed = new Set(collectDescendants(state, nodeId))
  const nodes: Record<string, ThoughtNode> = {}
  for (const [id, n] of Object.entries(state.nodes)) {
    if (doomed.has(id)) continue
    nodes[id] = { ...cloneNodeShallow(n), childIds: n.childIds.filter((c) => !doomed.has(c)) }
  }
  const selectedNodeId = doomed.has(state.selectedNodeId)
    ? (node.parentId ?? state.rootId)
    : state.selectedNodeId
  return { ...state, nodes, selectedNodeId }
}

export function selectNode(state: PuzzleState, nodeId: string): PuzzleState {
  if (!state.nodes[nodeId]) return state
  return { ...state, selectedNodeId: nodeId }
}

/** Returns the segment (if any) containing the given word index. */
export function segmentAt(node: ThoughtNode, wordIndex: number): Segment | undefined {
  return node.segments.find((s) => wordIndex >= s.start && wordIndex <= s.end)
}
