/**
 * 首页 Tech Stack 的分组逻辑。
 * 数据库里每一项存一个 category 字符串，按顺序排；首页按第一次出现的顺序分组显示。
 */

export const MAX_CATEGORY_LENGTH = 40

export interface Group<T> {
  title: string
  items: T[]
}

export function groupByCategory<T extends { category?: string | null }>(items: T[]): Group<T>[] {
  const groups: Group<T>[] = []
  const byTitle = new Map<string, Group<T>>()
  for (const item of items) {
    const title = (item.category ?? '').trim()
    let group = byTitle.get(title)
    if (!group) {
      group = { title, items: [] }
      byTitle.set(title, group)
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

/** 校验并清理分类名：去掉首尾空格，最长 40 个字符；空字符串表示不分类 */
export function cleanCategory(value: unknown): string | null {
  if (value == null) return ''
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > MAX_CATEGORY_LENGTH ? null : trimmed
}
