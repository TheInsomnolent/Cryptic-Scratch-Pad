import type { PuzzleState, ThoughtNode } from '../model'
import { splitWords } from '../model'

interface Props {
  state: PuzzleState
  onSelect: (nodeId: string) => void
  onBranch: (nodeId: string) => void
  onDelete: (nodeId: string) => void
}

function nodeSummary(state: PuzzleState, node: ThoughtNode): string {
  if (node.answer) return node.answer.toUpperCase()
  const words = splitWords(state.clue)
  const def = node.segments.find((s) => s.type === 'definition')
  if (def) return `def: ${words.slice(def.start, def.end + 1).join(' ')}`
  return 'no answer yet'
}

function TreeNode({
  state,
  nodeId,
  onSelect,
  onBranch,
  onDelete,
}: Props & { nodeId: string }) {
  const node = state.nodes[nodeId]
  if (!node) return null
  const selected = state.selectedNodeId === nodeId
  const wordplays = node.segments.filter((s) => s.type === 'wordplay' && s.wordplayType)

  return (
    <li className="tree-node">
      <div
        className={`node-card springy ${selected ? 'node-selected' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(nodeId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(nodeId)
        }}
      >
        <div className="node-label">{node.label}</div>
        <div className="node-summary">{nodeSummary(state, node)}</div>
        {wordplays.length > 0 && (
          <div className="node-tags">
            {wordplays.map((s) => (
              <span key={s.id} className="tag">
                {s.wordplayType}
              </span>
            ))}
          </div>
        )}
        {selected && (
          <div className="node-actions">
            <button
              type="button"
              className="chip chip-branch"
              onClick={(e) => {
                e.stopPropagation()
                onBranch(nodeId)
              }}
            >
              ⑂ Branch
            </button>
            {node.parentId !== null && (
              <button
                type="button"
                className="chip chip-cancel"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(nodeId)
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      {node.childIds.length > 0 && (
        <ul className="tree-children">
          {node.childIds.map((childId) => (
            <TreeNode
              key={childId}
              state={state}
              nodeId={childId}
              onSelect={onSelect}
              onBranch={onBranch}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Mindmap-style view of every line of thought explored so far. */
export function TreeView(props: Props) {
  return (
    <div className="tree-view">
      <ul className="tree-root">
        <TreeNode {...props} nodeId={props.state.rootId} />
      </ul>
    </div>
  )
}
