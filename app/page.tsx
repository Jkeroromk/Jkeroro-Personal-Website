import HomeAuth from '@/components/home/HomeAuth'
import HomeLayout from '@/components/home/HomeLayout'
import HomeContent from '@/components/home/HomeContent'
import IntroOverlay from '@/components/intro/IntroOverlay'

/**
 * 首页直接渲染在 /，开场遮罩盖在上面。
 * 遮罩拉开时首页已经画好了，不再有 / → /loading → /home 的三次跳转，
 * 刷新、分享链接、搜索引擎看到的都是真正的首页内容。
 */
export default function Home() {
  return (
    <>
      <div id="jk-home">
        <HomeAuth>
          <HomeLayout>
            <HomeContent />
          </HomeLayout>
        </HomeAuth>
      </div>
      <IntroOverlay />
    </>
  )
}
