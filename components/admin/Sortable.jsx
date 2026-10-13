'use client'

/**
 * 后台通用的拖拽排序（只用 framer-motion，不额外装包）。
 *
 * 效果：按住拖动时条目跟手、稍微浮起；经过别的条目时，其他条目实时让位（弹簧动画）；
 * 松手后条目弹回新位置，然后才调用 onReorder(from, to) 保存一次。
 * 支持列表（axis="y"）和网格（axis="grid"），鼠标和触屏都能用。
 *
 * 用法：
 *   <SortableList items={tracks} getKey={(t) => t.id} onReorder={onReorder} axis="y">
 *     {(track, index) => (
 *       <SortableItem key={track.id} id={track.id} className="...">
 *         <SortableHandle><GripVertical /></SortableHandle>
 *         ...
 *       </SortableItem>
 *     )}
 *   </SortableList>
 *
 * 默认只能按住 SortableHandle 拖（不影响输入框、按钮，手机上也不挡页面滚动）；
 * 网格卡片可以给 SortableItem 加 dragFromAnywhere，整张卡都能拖。
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'

export const LAYOUT_SPRING = { type: 'spring', stiffness: 500, damping: 40, mass: 0.9 }

// 两次换位之间至少隔这么久，避免条目还在让位动画里时被反复判定、来回抖
const SWAP_COOLDOWN_MS = 110

const ListContext = createContext(null)
const ItemContext = createContext(null)

const moveKey = (keys, key, toIndex) => {
  const from = keys.indexOf(key)
  if (from < 0 || from === toIndex) return keys
  const next = [...keys]
  next.splice(from, 1)
  next.splice(toIndex, 0, key)
  return next
}

export function SortableList({ items, getKey = (item) => item.id, onReorder, axis = 'y', className = '', children }) {
  const keys = items.map(getKey)
  const signature = keys.join('\u0000')

  const [order, setOrder] = useState(keys)
  const [draggingKey, setDraggingKey] = useState(null)
  const orderRef = useRef(order)
  const nodes = useRef(new Map())
  const containerRef = useRef(null)
  const lockUntil = useRef(0)

  orderRef.current = order

  // 外面的数据变了（保存成功、增删、刷新）就跟上；拖动中不打断
  useEffect(() => {
    if (!draggingKey) setOrder(signature ? signature.split('\u0000') : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const register = useCallback((key, el) => {
    if (el) nodes.current.set(key, el)
    else nodes.current.delete(key)
  }, [])

  const start = useCallback((key) => {
    setDraggingKey(key)
    lockUntil.current = 0
    document.body.classList.add('select-none')
  }, [])

  const move = useCallback((key, event) => {
    const now = performance.now()
    if (now < lockUntil.current) return
    const current = orderRef.current
    const from = current.indexOf(key)
    const dragged = nodes.current.get(key)
    if (from < 0 || !dragged) return

    let to = -1

    if (axis === 'grid') {
      // 网格：指针落在哪张卡上，就换到哪张卡的位置
      const point = event?.touches?.[0] ?? event
      if (point?.clientX == null) return
      for (let i = 0; i < current.length; i++) {
        if (i === from) continue
        const el = nodes.current.get(current[i])
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (point.clientX > r.left && point.clientX < r.right && point.clientY > r.top && point.clientY < r.bottom) {
          to = i
          break
        }
      }
    } else {
      // 列表：拖动条目的中线越过相邻条目的中线就换位（高度不一样也不会来回跳）
      const d = dragged.getBoundingClientRect()
      const center = d.top + d.height / 2
      for (let i = from + 1; i < current.length; i++) {
        const el = nodes.current.get(current[i])
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (center > r.top + r.height / 2) to = i
        else break
      }
      if (to === -1) {
        for (let i = from - 1; i >= 0; i--) {
          const el = nodes.current.get(current[i])
          if (!el) continue
          const r = el.getBoundingClientRect()
          if (center < r.top + r.height / 2) to = i
          else break
        }
      }
    }

    if (to !== -1 && to !== from) {
      lockUntil.current = now + SWAP_COOLDOWN_MS
      setOrder(moveKey(current, key, to))
    }
  }, [axis])

  const end = useCallback((key) => {
    setDraggingKey(null)
    document.body.classList.remove('select-none')
    const from = keys.indexOf(key)
    const to = orderRef.current.indexOf(key)
    if (from >= 0 && to >= 0 && from !== to) onReorder?.(from, to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, onReorder])

  useEffect(() => () => document.body.classList.remove('select-none'), [])

  const byKey = useMemo(() => {
    const map = new Map()
    items.forEach((item) => map.set(getKey(item), item))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // 按本地顺序渲染；万一有新条目还没进本地顺序，接在后面
  const ordered = order.filter((k) => byKey.has(k)).map((k) => byKey.get(k))
  for (const k of keys) if (!order.includes(k)) ordered.push(byKey.get(k))

  const value = useMemo(
    () => ({ axis, draggingKey, register, start, move, end, containerRef }),
    [axis, draggingKey, register, start, move, end],
  )

  return (
    <ListContext.Provider value={value}>
      <div ref={containerRef} className={className}>
        <AnimatePresence initial={false}>
          {ordered.map((item, index) => children(item, index))}
        </AnimatePresence>
      </div>
    </ListContext.Provider>
  )
}

export function SortableItem({
  id,
  className = '',
  draggingClassName = '',
  dragFromAnywhere = false,
  initial = { opacity: 0, y: -6 },
  animate = { opacity: 1, y: 0 },
  exit = { opacity: 0, scale: 0.96, transition: { duration: 0.16 } },
  transition,
  style,
  children,
  ...rest
}) {
  const list = useContext(ListContext)
  const controls = useDragControls()
  const ref = useRef(null)
  const isDragging = list.draggingKey === id
  const someoneDragging = list.draggingKey !== null

  useEffect(() => {
    list.register(id, ref.current)
    return () => list.register(id, null)
  }, [id, list.register]) // eslint-disable-line react-hooks/exhaustive-deps

  const itemContext = useMemo(() => ({ controls, isDragging }), [controls, isDragging])

  return (
    <ItemContext.Provider value={itemContext}>
      <motion.div
        ref={ref}
        layout="position"
        drag={list.axis === 'grid' ? true : 'y'}
        dragControls={controls}
        dragListener={dragFromAnywhere}
        dragSnapToOrigin
        dragMomentum={false}
        onDragStart={() => list.start(id)}
        onDrag={(event) => list.move(id, event)}
        onDragEnd={() => list.end(id)}
        whileDrag={{ scale: list.axis === 'grid' ? 1.04 : 1.015 }}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ layout: LAYOUT_SPRING, scale: { type: 'spring', stiffness: 600, damping: 32 }, ...transition }}
        style={{ position: 'relative', zIndex: isDragging ? 50 : undefined, ...style }}
        data-dragging={isDragging || undefined}
        className={`${className} ${isDragging ? `!shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)] ${draggingClassName}` : ''} ${someoneDragging && !isDragging ? 'pointer-events-none' : ''} ${
          dragFromAnywhere ? 'cursor-grab active:cursor-grabbing select-none' : ''
        }`}
        {...rest}
      >
        {children}
      </motion.div>
    </ItemContext.Provider>
  )
}

export function SortableHandle({ className = '', label = 'Drag to reorder', children }) {
  const { controls } = useContext(ItemContext)
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        e.preventDefault()
        controls.start(e)
      }}
      style={{ touchAction: 'none' }}
      className={`cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {children}
    </button>
  )
}
