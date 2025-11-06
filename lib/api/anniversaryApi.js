/**
 * Anniversary API 调用函数
 */

export const anniversaryApi = {
  /**
   * 获取背景图列表和位置
   */
  async getBackground() {
    const response = await fetch('/api/anniversary/background')
    if (!response.ok) {
      throw new Error(`Failed to fetch background: ${response.status}`)
    }
    const data = await response.json()
    return {
      backgroundImages: Array.isArray(data.backgroundImages) ? data.backgroundImages : [],
      imagePositions: data.imagePositions || {},
    }
  },

  /**
   * 添加新背景图
   */
  async addBackground(backgroundImage) {
    const response = await fetch('/api/anniversary/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backgroundImage }),
    })

    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
      }
      throw new Error(errorData.error || errorData.message || `Failed to add background (${response.status})`)
    }

    const data = await response.json()
    return {
      backgroundImages: Array.isArray(data.backgroundImages) ? data.backgroundImages : [],
      imagePositions: data.imagePositions || {},
    }
  },

  /**
   * 更新图片位置
   */
  async updatePosition(imageUrl, imageOffsetX, imageOffsetY) {
    const response = await fetch('/api/anniversary/background', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl,
        imageOffsetX,
        imageOffsetY,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      backgroundImages: Array.isArray(data.backgroundImages) ? data.backgroundImages : [],
      imagePositions: data.imagePositions || {},
    }
  },

  /**
   * 删除背景图
   */
  async deleteBackground(imageUrl) {
    const response = await fetch('/api/anniversary/background', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    })

    if (!response.ok) {
      throw new Error('Failed to delete background image')
    }

    const data = await response.json()
    return {
      backgroundImages: Array.isArray(data.backgroundImages) ? data.backgroundImages : [],
      imagePositions: data.imagePositions || {},
    }
  },
}

