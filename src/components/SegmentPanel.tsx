import type { Segment, SegmentType, WordplayType } from '../model'
import { WORDPLAY_TYPES, splitWords } from '../model'

interface Props {
  clue: string
  segment: Segment
  onUpdate: (patch: Partial<Pick<Segment, 'type' | 'wordplayType' | 'partial'>>) => void
  onRemove: () => void
  onClose: () => void
}

const TYPE_LABELS: Record<SegmentType, string> = {
  definition: 'Definition',
  wordplay: 'Wordplay',
  junk: 'Junk',
}

/** Detail editor for a single highlighted section of the clue. */
export function SegmentPanel({ clue, segment, onUpdate, onRemove, onClose }: Props) {
  const words = splitWords(clue)
  const text = words.slice(segment.start, segment.end + 1).join(' ')

  return (
    <div className={`segment-panel springy-in panel-${segment.type}`}>
      <div className="segment-panel-head">
        <span className="segment-text">“{text}”</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close section">
          ✕
        </button>
      </div>

      <div className="chip-row">
        {(Object.keys(TYPE_LABELS) as SegmentType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`chip chip-${t} ${segment.type === t ? 'chip-active' : ''}`}
            onClick={() => onUpdate({ type: t })}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {segment.type === 'wordplay' && (
        <div className="wordplay-types">
          <span className="field-label">Wordplay type</span>
          <div className="chip-row wrap">
            {WORDPLAY_TYPES.map((wt) => (
              <button
                key={wt}
                type="button"
                className={`chip chip-small ${segment.wordplayType === wt ? 'chip-active' : ''}`}
                onClick={() =>
                  onUpdate({
                    wordplayType: segment.wordplayType === wt ? undefined : (wt as WordplayType),
                  })
                }
              >
                {wt}
              </button>
            ))}
          </div>
        </div>
      )}

      {segment.type !== 'junk' && (
        <label className="field">
          <span className="field-label">Partial solution / working</span>
          <input
            type="text"
            value={segment.partial ?? ''}
            placeholder={segment.type === 'definition' ? 'e.g. a kind of bird…' : 'e.g. TERN from “...intern...”'}
            onChange={(e) => onUpdate({ partial: e.target.value })}
          />
        </label>
      )}

      <button type="button" className="chip chip-cancel" onClick={onRemove}>
        Remove highlight
      </button>
    </div>
  )
}
