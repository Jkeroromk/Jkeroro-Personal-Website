'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_TECH_STACK, getTechIcon } from '@/lib/tech-icons';
import { groupByCategory } from '@/lib/link-groups';
import IconGroups from '@/components/interactive/IconGroups';

// Tech Stack 在后台 Tech Stack 里编辑（可以分类），存在数据库里。
// 先用本地缓存（上次拿到的）瞬间渲染，没有缓存就用默认那份，再去接口拿最新的。
const CACHE_KEY = 'jk:tech-stack';

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

const Stack = () => {
  const [items, setItems] = useState(DEFAULT_TECH_STACK);

  useEffect(() => {
    const cached = readCache();
    if (cached) setItems(cached);

    let cancelled = false;
    fetch('/api/tech-stack')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setItems(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* 存储不可用就算了 */ }
      })
      .catch(() => { /* 接口失败就继续用缓存/默认 */ });
    return () => { cancelled = true; };
  }, []);

  const groups = groupByCategory(items.filter((item) => item.visible !== false)).map((group) => ({
    title: group.title,
    items: group.items.map(({ id, icon, name }, i) => {
      const { Icon, hover } = getTechIcon(icon);
      return { key: id || `${icon}-${i}`, name, Icon, hover };
    }),
  }));

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col items-center mt-16 w-full">
      <h1 className="text-white font-extrabold text-2xl">Tech Stack</h1>
      <IconGroups groups={groups} className="mt-8" />
    </div>
  );
};

export default Stack;
