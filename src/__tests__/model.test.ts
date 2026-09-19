import { describe, expect, it } from 'vitest'
import {
  addSegment,
  branchNode,
  createPuzzle,
  deleteNode,
  removeSegment,
  segmentAt,
  selectNode,
  setAnswer,
  splitWords,
  updateSegment,
} from '../model'

const CLUE = 'Poorly lit deserted street initially in port'

describe('splitWords', () => {
  it('splits on whitespace and ignores extra spaces', () => {
    expect(splitWords('  a  b\tc ')).toEqual(['a', 'b', 'c'])
  })

  it('returns empty array for blank input', () => {
    expect(splitWords('   ')).toEqual([])
  })
})

describe('createPuzzle', () => {
  it('creates a root node with no segments', () => {
    const state = createPuzzle(CLUE, '(7)')
    expect(state.clue).toBe(CLUE)
    expect(state.enumeration).toBe('(7)')
    const root = state.nodes[state.rootId]
    expect(root.parentId).toBeNull()
    expect(root.segments).toEqual([])
    expect(state.selectedNodeId).toBe(state.rootId)
  })
})

describe('addSegment', () => {
  it('adds a segment covering a word range', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 0, 1, 'definition')
    const root = state.nodes[state.rootId]
    expect(root.segments).toHaveLength(1)
    expect(root.segments[0]).toMatchObject({ start: 0, end: 1, type: 'definition' })
  })

  it('normalises reversed ranges', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 3, 1, 'wordplay')
    expect(state.nodes[state.rootId].segments[0]).toMatchObject({ start: 1, end: 3 })
  })

  it('removes fully-overlapped segments', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 2, 3, 'wordplay')
    state = addSegment(state, state.rootId, 1, 4, 'definition')
    const segs = state.nodes[state.rootId].segments
    expect(segs).toHaveLength(1)
    expect(segs[0]).toMatchObject({ start: 1, end: 4, type: 'definition' })
  })

  it('trims partially-overlapped segments so each word has one section', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 0, 4, 'wordplay')
    state = addSegment(state, state.rootId, 2, 3, 'definition')
    const segs = state.nodes[state.rootId].segments
    expect(segs.map((s) => [s.start, s.end, s.type])).toEqual([
      [0, 1, 'wordplay'],
      [2, 3, 'definition'],
      [4, 4, 'wordplay'],
    ])
  })

  it('does not mutate the previous state', () => {
    const state = createPuzzle(CLUE)
    addSegment(state, state.rootId, 0, 1, 'junk')
    expect(state.nodes[state.rootId].segments).toEqual([])
  })
})

describe('segment editing', () => {
  it('updates the wordplay type and partial solution', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 1, 3, 'wordplay')
    const segId = state.nodes[state.rootId].segments[0].id
    state = updateSegment(state, state.rootId, segId, {
      wordplayType: 'anagram',
      partial: 'STREETLED?',
    })
    const seg = state.nodes[state.rootId].segments[0]
    expect(seg.wordplayType).toBe('anagram')
    expect(seg.partial).toBe('STREETLED?')
  })

  it('removes a segment', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 0, 1, 'junk')
    const segId = state.nodes[state.rootId].segments[0].id
    state = removeSegment(state, state.rootId, segId)
    expect(state.nodes[state.rootId].segments).toEqual([])
  })

  it('finds the segment at a word index', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 2, 4, 'wordplay')
    const root = state.nodes[state.rootId]
    expect(segmentAt(root, 3)?.type).toBe('wordplay')
    expect(segmentAt(root, 0)).toBeUndefined()
  })
})

describe('branching', () => {
  it('creates a child that copies segments and answer, and selects it', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 0, 1, 'definition')
    state = setAnswer(state, state.rootId, 'seaport')
    state = branchNode(state, state.rootId, 'what if anagram')
    const root = state.nodes[state.rootId]
    expect(root.childIds).toHaveLength(1)
    const child = state.nodes[root.childIds[0]]
    expect(child.parentId).toBe(state.rootId)
    expect(child.label).toBe('what if anagram')
    expect(child.answer).toBe('seaport')
    expect(child.segments).toHaveLength(1)
    expect(child.segments[0].id).not.toBe(root.segments[0].id)
    expect(state.selectedNodeId).toBe(child.id)
  })

  it('edits on the branch do not affect the parent', () => {
    let state = createPuzzle(CLUE)
    state = addSegment(state, state.rootId, 0, 1, 'definition')
    state = branchNode(state, state.rootId)
    const childId = state.selectedNodeId
    state = addSegment(state, childId, 0, 1, 'wordplay')
    expect(state.nodes[state.rootId].segments[0].type).toBe('definition')
    expect(state.nodes[childId].segments[0].type).toBe('wordplay')
  })
})

describe('deleteNode', () => {
  it('deletes a node and its whole subtree, reselecting the parent', () => {
    let state = createPuzzle(CLUE)
    state = branchNode(state, state.rootId, 'A')
    const aId = state.selectedNodeId
    state = branchNode(state, aId, 'A1')
    const a1Id = state.selectedNodeId
    state = deleteNode(state, aId)
    expect(state.nodes[aId]).toBeUndefined()
    expect(state.nodes[a1Id]).toBeUndefined()
    expect(state.nodes[state.rootId].childIds).toEqual([])
    expect(state.selectedNodeId).toBe(state.rootId)
  })

  it('refuses to delete the root', () => {
    const state = createPuzzle(CLUE)
    expect(deleteNode(state, state.rootId)).toBe(state)
  })
})

describe('selectNode', () => {
  it('selects existing nodes and ignores unknown ids', () => {
    let state = createPuzzle(CLUE)
    state = branchNode(state, state.rootId)
    const childId = state.selectedNodeId
    state = selectNode(state, state.rootId)
    expect(state.selectedNodeId).toBe(state.rootId)
    expect(selectNode(state, 'nope').selectedNodeId).toBe(state.rootId)
    state = selectNode(state, childId)
    expect(state.selectedNodeId).toBe(childId)
  })
})
