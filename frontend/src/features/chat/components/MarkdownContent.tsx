import { cn } from '@/lib/utils'

interface Props {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: Props) {
  const blocks = parseBlocks(content)
  return (
    <div className={cn('chat-md space-y-2.5', className)}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'spacer' }

// ── Parser ────────────────────────────────────────────────────────────────────

function parseBlocks(raw: string): Block[] {
  // Normalize: strip trailing spaces, collapse 3+ blank lines to 2
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // ── Code block ──────────────────────────────────────────────────
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') })
      i++
      continue
    }

    // ── HR — render as nothing (just ignore) ───────────────────────
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      i++
      continue
    }

    // ── Heading ─────────────────────────────────────────────────────
    const hm = line.match(/^(#{1,3})\s+(.+)/)
    if (hm) {
      blocks.push({ type: 'heading', level: Math.min(hm[1].length, 3) as 1|2|3, text: hm[2] })
      i++
      continue
    }

    // ── Blockquote ──────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      const qLines: string[] = [line.slice(2)]
      i++
      while (i < lines.length && lines[i].startsWith('> ')) {
        qLines.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'blockquote', text: qLines.join('\n') })
      continue
    }

    // ── Table ───────────────────────────────────────────────────────
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      // Pipe-split that handles leading/trailing pipes
      const splitRow = (r: string): string[] => {
        const trimmed = r.trim().replace(/^\|/, '').replace(/\|$/, '')
        return trimmed.split('|').map(c => c.trim())
      }

      const headers = splitRow(line)
      i += 2 // skip separator row
      const rows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      if (headers.length > 0) {
        blocks.push({ type: 'table', headers, rows })
      }
      continue
    }

    // ── Unordered list ──────────────────────────────────────────────
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // ── Ordered list ─────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // ── Blank line ───────────────────────────────────────────────────
    if (line.trim() === '') {
      i++
      continue
    }

    // ── Paragraph ────────────────────────────────────────────────────
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s|[-*•]\s|\d+\.\s|```|> |[-*_]{3,}\s*$)/.test(lines[i]) &&
      !lines[i].includes('|')
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
    }
  }

  return blocks
}

// ── Inline formatting ─────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} className="font-semibold text-text">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={idx} className="italic text-text-2">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={idx} className="bg-surface3 text-accent px-1.5 py-0.5 rounded text-[12px] font-mono">
          {part.slice(1, -1)}
        </code>
      )
    const lm = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (lm)
      return (
        <a key={idx} href={lm[2]} target="_blank" rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-[#30e887] transition-colors">
          {lm[1]}
        </a>
      )
    return <span key={idx}>{part}</span>
  })
}

// ── Block renderer ────────────────────────────────────────────────────────────

const HEADING_ICONS: Record<number, string> = { 1: '◆', 2: '◇', 3: '›' }

function renderBlock(block: Block, key: number): React.ReactNode {
  switch (block.type) {

    case 'heading': {
      const styles: Record<number, string> = {
        1: 'text-[15px] font-bold text-text',
        2: 'text-[14px] font-semibold text-text',
        3: 'text-[13.5px] font-semibold text-text-2',
      }
      const iconColor: Record<number, string> = {
        1: 'text-accent',
        2: 'text-accent/70',
        3: 'text-text-3',
      }
      return (
        <div key={key} className="flex items-center gap-2 pt-1">
          <span className={`text-[10px] flex-shrink-0 ${iconColor[block.level]}`}>
            {HEADING_ICONS[block.level]}
          </span>
          <p className={styles[block.level]}>{renderInline(block.text)}</p>
        </div>
      )
    }

    case 'paragraph':
      return (
        <p key={key} className="text-[13.5px] leading-relaxed text-text">
          {renderInline(block.text)}
        </p>
      )

    case 'ul':
      return (
        <ul key={key} className="space-y-1.5 pl-0.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
              <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              <span className="text-text">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol key={key} className="space-y-1.5 pl-0.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
              <span className="min-w-[22px] h-5 rounded-md bg-accent-dim text-accent text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-text">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'code':
      return (
        <div key={key} className="rounded-xl overflow-hidden border border-border mt-1">
          {block.lang && (
            <div className="bg-surface3 px-3.5 py-1.5 text-[10px] font-mono text-accent uppercase tracking-widest border-b border-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              {block.lang}
            </div>
          )}
          <pre className="bg-[#0d1117] px-4 py-3.5 text-[12.5px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            <code>{block.text}</code>
          </pre>
        </div>
      )

    case 'blockquote':
      return (
        <div key={key} className="flex gap-3 bg-accent-dim border border-accent/25 rounded-xl px-4 py-3 mt-0.5">
          <div className="w-0.5 bg-accent rounded-full flex-shrink-0 self-stretch" />
          <p className="text-[13px] text-text-2 leading-relaxed italic">
            {renderInline(block.text)}
          </p>
        </div>
      )

    case 'table':
      return (
        <div key={key} className="overflow-x-auto rounded-xl border border-border mt-1">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface3 border-b border-border">
                {block.headers.map((h, ci) => (
                  <th key={ci} className="px-4 py-2.5 text-left font-semibold text-text whitespace-nowrap">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={`border-t border-border ${ri % 2 === 1 ? 'bg-surface2/50' : ''} hover:bg-surface2 transition-colors`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-2.5 text-text-2 ${ci === 0 ? 'font-medium text-text' : ''}`}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'spacer':
      return <div key={key} className="h-1" />

    default:
      return null
  }
}
