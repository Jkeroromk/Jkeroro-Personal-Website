/**
 * 轻量 Markdown 渲染（聊天用）
 * 支持：段落、标题、无序/有序列表、引用、代码块、行内代码、粗体、斜体、链接、裸链接
 * 只生成 React 元素，不用 dangerouslySetInnerHTML，模型输出里的 HTML 会按纯文本显示。
 * 对流式输出中途不完整的语法（比如只有一半的 ** 或 ```）容错。
 */

import React from 'react'

type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; level: number; text: string }
  | { type: 'ul' | 'ol'; items: string[]; start?: number }
  | { type: 'quote'; text: string }
  | { type: 'code'; lang: string; code: string }

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 代码块（未闭合时吃到结尾，适配流式输出）
    const fence = line.match(/^\s*```(\w*)\s*$/)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) buf.push(lines[i++])
      i++ // 跳过结束 ```
      blocks.push({ type: 'code', lang: fence[1], code: buf.join('\n') })
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'h', level: heading[1].length, text: heading[2] })
      i++
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''))
      blocks.push({ type: 'quote', text: buf.join('\n') })
      continue
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && (/^\s*[-*•]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*[-*•]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*[-*•]\s+/, ''))
        else items[items.length - 1] += ' ' + lines[i].trim()
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    const ol = line.match(/^\s*(\d+)[.)]\s+/)
    if (ol) {
      const items: string[] = []
      while (i < lines.length && (/^\s*\d+[.)]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        else items[items.length - 1] += ' ' + lines[i].trim()
        i++
      }
      blocks.push({ type: 'ol', items, start: Number(ol[1]) })
      continue
    }

    // 普通段落：连续的非空、非特殊行
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      buf.push(lines[i++])
    }
    blocks.push({ type: 'p', text: buf.join('\n') })
  }

  return blocks
}

const INLINE_RE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\s][^*\n]*\*)|(\[[^\]\n]+\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<>()（）。，、]+)/g

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let n = 0
  INLINE_RE.lastIndex = 0

  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const k = `${keyPrefix}-${n++}`
    const tok = m[0]

    if (m[1]) {
      out.push(
        <code key={k} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.88em] text-white/90">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (m[2] || m[3]) {
      out.push(
        <strong key={k} className="font-semibold text-white">
          {renderInline(tok.slice(2, -2), k)}
        </strong>
      )
    } else if (m[4]) {
      out.push(<em key={k}>{renderInline(tok.slice(1, -1), k)}</em>)
    } else if (m[5]) {
      const label = tok.slice(1, tok.indexOf(']('))
      out.push(
        <a key={k} href={m[6]} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2 hover:text-sky-200">
          {label}
        </a>
      )
    } else if (m[7]) {
      out.push(
        <a key={k} href={tok} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2 hover:text-sky-200 break-all">
          {tok}
        </a>
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))

  // 段落内换行保留
  return out.flatMap((node, idx) =>
    typeof node === 'string'
      ? node.split('\n').flatMap((part, j, arr) => (j < arr.length - 1 ? [part, <br key={`${keyPrefix}-br-${idx}-${j}`} />] : [part]))
      : [node]
  )
}

export default function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <div className="space-y-3 break-words">
      {blocks.map((b, i) => {
        const k = `b${i}`
        switch (b.type) {
          case 'h':
            return (
              <p key={k} className={`font-semibold text-white ${b.level <= 2 ? 'text-[1.05em]' : ''}`}>
                {renderInline(b.text, k)}
              </p>
            )
          case 'ul':
            return (
              <ul key={k} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-[0.7em] h-1 w-1 flex-shrink-0 rounded-full bg-white/50" />
                    <span className="min-w-0">{renderInline(it, `${k}-${j}`)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={k} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="flex-shrink-0 tabular-nums text-white/50">{(b.start ?? 1) + j}.</span>
                    <span className="min-w-0">{renderInline(it, `${k}-${j}`)}</span>
                  </li>
                ))}
              </ol>
            )
          case 'quote':
            return (
              <blockquote key={k} className="border-l-2 border-white/25 pl-3 text-white/70">
                {renderInline(b.text, k)}
              </blockquote>
            )
          case 'code':
            return (
              <pre key={k} className="modern-scrollbar overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[12.5px] leading-relaxed text-white/85">
                <code>{b.code}</code>
              </pre>
            )
          default:
            return <p key={k}>{renderInline(b.text, k)}</p>
        }
      })}
    </div>
  )
}
