import { useState } from 'react'
import type { SegmentType, ThoughtNode } from '../model'
import { segmentAt, splitWords } from '../model'

interface Props {
  clue: string
  node: ThoughtNode
  onAddSegment: (start: number, end: number, type: SegmentType) => void
  onSelectSegment: (segmentId: string | null) => void
  selectedSegmentId: string | null
}

const TYPE_LABELS: Record<SegmentType, string> = {
  definition: 'Definition',
  wordplay: 'Wordplay',
  junk: 'Junk',
}

/**
 * Renders the clue as tappable words. Tap a word to anchor a selection, tap
 * another word to extend it, then choose a section type to mark the range.
 * Tapping a word inside an existing segment selects that segment instead.
 */
export function ClueView({ clue, node, onAddSegment, onSelectSegment, selectedSegmentId }: Props) {
  const words = splitWords(clue)
  const [anchor, setAnchor] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)

  const selLo = anchor !== null && focus !== null ? Math.min(anchor, focus) : null
  const selHi = anchor !== null && focus !== null ? Math.max(anchor, focus) : null

  function tapWord(i: number) {
    const seg = segmentAt(node, i)
    if (anchor === null) {
      if (seg) {
        // toggle segment selection
        onSelectSegment(seg.id === selectedSegmentId ? null : seg.id)
        return
      }
      setAnchor(i)
      setFocus(i)
      onSelectSegment(null)
    } else {
      setFocus(i)
    }
  }

  function commit(type: SegmentType) {
    if (selLo === null || selHi === null) return
    onAddSegment(selLo, selHi, type)
    setAnchor(null)
    setFocus(null)
  }

  function cancel() {
    setAnchor(null)
    setFocus(null)
  }

  return (
    <div className="clue-view">
      <div className="clue-words" role="listbox" aria-label="Clue words">
        {words.map((word, i) => {
          const seg = segmentAt(node, i)
          const inSelection = selLo !== null && selHi !== null && i >= selLo && i <= selHi
          const classes = ['word']
          if (seg) {
            classes.push(`seg-${seg.type}`)
            if (i === seg.start) classes.push('seg-start')
            if (i === seg.end) classes.push('seg-end')
            if (seg.id === selectedSegmentId) classes.push('seg-selected')
          }
          if (inSelection) classes.push('selecting')
          return (
            <button
              key={i}
              type="button"
              className={classes.join(' ')}
              onClick={() => tapWord(i)}
              aria-pressed={inSelection || seg?.id === selectedSegmentId}
            >
              {word}
            </button>
          )
        })}
      </div>
      {anchor !== null ? (
        <div className="type-picker springy-in">
          <span className="type-picker-hint">Mark selection as:</span>
          {(Object.keys(TYPE_LABELS) as SegmentType[]).map((t) => (
            <button key={t} type="button" className={`chip chip-${t}`} onClick={() => commit(t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
          <button type="button" className="chip chip-cancel" onClick={cancel}>
            Cancel
          </button>
        </div>
      ) : (
        <p className="hint">
          Tap a word to start highlighting, tap another to extend. Tap a highlighted word to edit
          its section.
        </p>
      )}
    </div>
  )
}
