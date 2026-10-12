'use client'

/**
 * 首页 Social Links / Tech Stack 共用的分组图标网格。
 * 每组：分类标题（两侧渐变细线）+ 图标网格（图标下面常驻名字）。
 * 悬停时图标翻转一圈、放大一点、变成品牌色，沿用原来 Tech Stack 的效果。
 * 后台的预览也用这个组件，保证看到的和首页一样。
 *
 * groups: [{ title, items: [{ key, name, Icon, hover, href? }] }]
 */

const IconTile = ({ item, compact }) => {
  const { Icon, name, hover, href } = item
  const content = (
    <>
      <Icon
        size={compact ? 22 : 28}
        aria-hidden="true"
        className={`text-white transition-[transform,color] duration-500 ease-out group-hover:[transform:rotateY(360deg)_scale(1.2)] motion-reduce:transition-none motion-reduce:group-hover:transform-none ${hover}`}
      />
      <span
        className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-semibold text-white/80 group-hover:text-white text-center leading-tight transition-colors`}
      >
        {name}
      </span>
    </>
  )

  const className = `group flex flex-col items-center gap-2.5 ${compact ? 'w-14' : 'w-[88px]'} py-1 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4`

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}

const IconGroups = ({ groups, compact = false, className = '' }) => {
  const visibleGroups = groups.filter((g) => g.items.length > 0)
  if (visibleGroups.length === 0) return null

  return (
    <div className={`flex flex-col items-center w-full ${compact ? 'gap-6' : 'gap-10'} ${className}`}>
      {visibleGroups.map((group, i) => (
        <section key={`${group.title}-${i}`} className="w-full max-w-[600px]" aria-label={group.title || undefined}>
          {group.title && (
            <div className={`flex items-center gap-4 px-4 ${compact ? 'mb-3' : 'mb-6'}`}>
              <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
              <h3 className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} font-bold text-white/90 tracking-wide whitespace-nowrap`}>
                {group.title}
              </h3>
              <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          )}
          <ul className={`flex flex-wrap justify-center ${compact ? 'gap-x-3 gap-y-3' : 'gap-x-2 gap-y-6 sm:gap-x-4'} px-2`}>
            {group.items.map((item) => (
              <li key={item.key} className="flex justify-center" style={{ perspective: 400 }}>
                <IconTile item={item} compact={compact} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default IconGroups
