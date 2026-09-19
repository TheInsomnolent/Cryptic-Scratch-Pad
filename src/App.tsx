import { useEffect, useState } from 'react'
import './App.css'
import { ClueView } from './components/ClueView'
import { SegmentPanel } from './components/SegmentPanel'
import { TreeView } from './components/TreeView'
import type { PuzzleState, Segment, SegmentType } from './model'
import {
  addSegment,
  branchNode,
  createPuzzle,
  deleteNode,
  removeSegment,
  selectNode,
  setAnswer,
  setLabel,
  updateSegment,
} from './model'
import { loadState, saveState } from './storage'

function ClueForm({ onStart }: { onStart: (clue: string, enumeration: string) => void }) {
  const [clue, setClue] = useState('')
  const [enumeration, setEnumeration] = useState('')
  return (
    <form
      className="clue-form springy-in"
      onSubmit={(e) => {
        e.preventDefault()
        if (clue.trim()) onStart(clue.trim(), enumeration.trim())
      }}
    >
      <h1 className="app-title">Cryptic Scratch Pad</h1>
      <p className="tagline">Sketch out your solve, one thought at a time.</p>
      <label className="field">
        <span className="field-label">Clue</span>
        <textarea
          value={clue}
          onChange={(e) => setClue(e.target.value)}
          placeholder="e.g. Poorly lit deserted street, initially, in port (7)"
          rows={3}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Enumeration (optional)</span>
        <input
          type="text"
          value={enumeration}
          onChange={(e) => setEnumeration(e.target.value)}
          placeholder="e.g. (7) or (5,4)"
        />
      </label>
      <button type="submit" className="primary-btn">
        Start solving
      </button>
    </form>
  )
}

export default function App() {
  const [state, setState] = useState<PuzzleState | null>(() => loadState())
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  if (!state) {
    return (
      <main className="app">
        <ClueForm onStart={(clue, enumeration) => setState(createPuzzle(clue, enumeration))} />
      </main>
    )
  }

  const node = state.nodes[state.selectedNodeId] ?? state.nodes[state.rootId]
  const selectedSegment: Segment | null =
    node.segments.find((s) => s.id === selectedSegmentId) ?? null

  function handleAddSegment(start: number, end: number, type: SegmentType) {
    setState((s) => (s ? addSegment(s, s.selectedNodeId, start, end, type) : s))
  }

  function handleNewClue() {
    if (window.confirm('Start a new clue? Your current working will be discarded.')) {
      setState(null)
      setSelectedSegmentId(null)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">Cryptic Scratch Pad</h1>
        <button type="button" className="chip" onClick={handleNewClue}>
          New clue
        </button>
      </header>

      <section className="panel">
        <div className="clue-line">
          <span className="clue-text">{state.clue}</span>
          {state.enumeration && <span className="enumeration">{state.enumeration}</span>}
        </div>
        <div className="node-context">
          Working on: <strong>{node.label}</strong>
        </div>
        <ClueView
          clue={state.clue}
          node={node}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={setSelectedSegmentId}
          onAddSegment={handleAddSegment}
        />
        {selectedSegment && (
          <SegmentPanel
            clue={state.clue}
            segment={selectedSegment}
            onUpdate={(patch) =>
              setState((s) =>
                s ? updateSegment(s, s.selectedNodeId, selectedSegment.id, patch) : s,
              )
            }
            onRemove={() => {
              setState((s) => (s ? removeSegment(s, s.selectedNodeId, selectedSegment.id) : s))
              setSelectedSegmentId(null)
            }}
            onClose={() => setSelectedSegmentId(null)}
          />
        )}
      </section>

      <section className="panel">
        <label className="field">
          <span className="field-label">Thought label</span>
          <input
            type="text"
            value={node.label}
            onChange={(e) =>
              setState((s) => (s ? setLabel(s, s.selectedNodeId, e.target.value) : s))
            }
            placeholder="e.g. anagram of “deserted street”"
          />
        </label>
        <label className="field">
          <span className="field-label">Proposed answer {state.enumeration}</span>
          <input
            type="text"
            className="answer-input"
            value={node.answer}
            onChange={(e) =>
              setState((s) => (s ? setAnswer(s, s.selectedNodeId, e.target.value) : s))
            }
            placeholder="ANSWER"
            autoCapitalize="characters"
          />
        </label>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Solution tree</h2>
          <p className="hint">
            Branch a node to test an alternative line of thought — the branch starts as a copy you
            can rework.
          </p>
        </div>
        <TreeView
          state={state}
          onSelect={(id) => {
            setState((s) => (s ? selectNode(s, id) : s))
            setSelectedSegmentId(null)
          }}
          onBranch={(id) => {
            setState((s) => (s ? branchNode(s, id) : s))
            setSelectedSegmentId(null)
          }}
          onDelete={(id) => {
            if (window.confirm('Delete this branch and everything under it?')) {
              setState((s) => (s ? deleteNode(s, id) : s))
              setSelectedSegmentId(null)
            }
          }}
        />
      </section>
    </main>
  )
}
