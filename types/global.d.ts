// 类型定义，不触发实际导入
declare global {
  interface Window {
    THREE: any & {
      OrbitControls?: any
    }
    lastMouseX?: number
    lastMouseY?: number
  }
}

export {}

