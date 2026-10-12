'use client'

/**
 * TechStackTab — 后台编辑首页的 Tech Stack（可以分类）
 * 改完点「保存」一次提交（分类、增、删、改、排序、隐藏），首页刷新就能看到，不用改代码。
 * 图标从 lib/tech-icons.ts 里选；要加新图标在那个文件里加一项。
 */

import { Layers } from 'lucide-react'
import { TECH_ICONS, getTechIcon, MAX_TECH_ITEMS } from '@/lib/tech-icons'
import GroupedItemsEditor from './GroupedItemsEditor'

const toPreviewItem = (item) => {
  const { Icon, hover } = getTechIcon(item.icon)
  return { key: item._key, name: item.name || '—', Icon, hover }
}

export default function TechStackTab() {
  return (
    <GroupedItemsEditor
      title="Tech Stack"
      noun="item"
      apiPath="/api/tech-stack"
      bodyKey="items"
      iconField="icon"
      iconLabel="Icon"
      options={TECH_ICONS}
      getOption={getTechIcon}
      maxItems={MAX_TECH_ITEMS}
      newItem={() => ({ icon: 'other', name: '', visible: true })}
      emptyIcon={Layers}
      toPreviewItem={toPreviewItem}
    />
  )
}
