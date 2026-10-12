'use client'

/**
 * SocialLinksTab — 后台编辑首页的社交媒体链接（可以分类）
 * 改完点「保存」一次提交（分类、增、删、改、排序、隐藏），首页刷新就能看到，不用改代码。
 */

import { Share2 } from 'lucide-react'
import { PLATFORMS, getPlatform, MAX_SOCIAL_LINKS } from '@/lib/social-platforms'
import GroupedItemsEditor from './GroupedItemsEditor'

const toPreviewItem = (link) => {
  const { Icon, hover } = getPlatform(link.platform)
  return { key: link._key, name: link.name || '—', Icon, hover }
}

export default function SocialLinksTab() {
  return (
    <GroupedItemsEditor
      title="Social Links"
      noun="link"
      apiPath="/api/social-links"
      bodyKey="links"
      iconField="platform"
      iconLabel="Platform"
      options={PLATFORMS}
      getOption={getPlatform}
      withUrl
      maxItems={MAX_SOCIAL_LINKS}
      newItem={() => ({ platform: 'website', name: 'Website', url: 'https://', visible: true })}
      emptyIcon={Share2}
      toPreviewItem={toPreviewItem}
    />
  )
}
