// 数据管理工具类
export interface AlbumImage {
  id: string
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export interface MusicTrack {
  id: string
  title: string
  subtitle: string
  src: string
}

export interface Project {
  id: string
  title: string
  description: string
  image: string
  link: string
  category: string
}

class DataManager {
  private static instance: DataManager
  private storageKey = 'jkeroro-website-data'

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  // 获取所有数据
  getAllData() {
    if (typeof window === 'undefined') return this.getDefaultData()
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
    
    return this.getDefaultData()
  }

  // 保存所有数据
  saveAllData(data: {
    images: AlbumImage[]
    tracks: MusicTrack[]
    projects: Project[]
  }) {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
    }
  }

  // 获取默认数据
  getDefaultData() {
    return {
      images: [
        { id: '1', src: '/me.webp', alt: 'me', width: 550, height: 550, priority: true },
        { id: '2', src: '/Room.jpg', alt: 'album', width: 550, height: 400 },
        { id: '3', src: '/lego-car.jpg', alt: 'album', width: 550, height: 400 },
        { id: '4', src: '/coffee.jpg', alt: 'album', width: 550, height: 400 }
      ] as AlbumImage[],
      
      tracks: [] as MusicTrack[], // 空数组，完全依赖用户上传
      
      projects: [
        { id: '1', title: 'Personal Website', description: 'My personal portfolio website built with Next.js and React', image: '/me.webp', link: 'https://jkeroro.com', category: 'web' },
        { id: '2', title: '3D Portfolio', description: 'Interactive 3D portfolio with Three.js animations', image: '/Room.jpg', link: 'https://3d-portfolio-jade-xi.vercel.app/', category: 'web' },
        { id: '3', title: 'Lego Car Project', description: 'Custom LEGO car design and building project', image: '/lego-car.jpg', link: '#', category: 'design' },
        { id: '4', title: 'Coffee Shop App', description: 'Mobile app for coffee shop management and ordering', image: '/coffee.jpg', link: '#', category: 'mobile' },
        { id: '5', title: 'Music Player', description: 'Custom music player with WebGL visualizations', image: '/header.webp', link: '#', category: 'web' }
      ] as Project[]
    }
  }

  // 图片管理
  getImages(): AlbumImage[] {
    return this.getAllData().images
  }

  saveImages(images: AlbumImage[]) {
    const data = this.getAllData()
    data.images = images
    this.saveAllData(data)
  }

  addImage(image: Omit<AlbumImage, 'id'>) {
    const images = this.getImages()
    const newImage = {
      ...image,
      id: Date.now().toString()
    }
    images.push(newImage)
    this.saveImages(images)
    return newImage
  }

  updateImage(id: string, updates: Partial<AlbumImage>) {
    const images = this.getImages()
    const index = images.findIndex(img => img.id === id)
    if (index !== -1) {
      images[index] = { ...images[index], ...updates }
      this.saveImages(images)
      return images[index]
    }
    return null
  }

  deleteImage(id: string) {
    const images = this.getImages()
    const filtered = images.filter(img => img.id !== id)
    this.saveImages(filtered)
  }

  // 音乐管理
  getTracks(): MusicTrack[] {
    return this.getAllData().tracks
  }

  saveTracks(tracks: MusicTrack[]) {
    const data = this.getAllData()
    data.tracks = tracks
    this.saveAllData(data)
  }

  addTrack(track: Omit<MusicTrack, 'id'>) {
    const tracks = this.getTracks()
    const newTrack = {
      ...track,
      id: Date.now().toString()
    }
    tracks.push(newTrack)
    this.saveTracks(tracks)
    return newTrack
  }

  updateTrack(id: string, updates: Partial<MusicTrack>) {
    const tracks = this.getTracks()
    const index = tracks.findIndex(track => track.id === id)
    if (index !== -1) {
      tracks[index] = { ...tracks[index], ...updates }
      this.saveTracks(tracks)
      return tracks[index]
    }
    return null
  }

  deleteTrack(id: string) {
    const tracks = this.getTracks()
    const filtered = tracks.filter(track => track.id !== id)
    this.saveTracks(filtered)
  }

  // 项目管理
  getProjects(): Project[] {
    return this.getAllData().projects
  }

  saveProjects(projects: Project[]) {
    const data = this.getAllData()
    data.projects = projects
    this.saveAllData(data)
  }

  addProject(project: Omit<Project, 'id'>) {
    const projects = this.getProjects()
    const newProject = {
      ...project,
      id: Date.now().toString()
    }
    projects.push(newProject)
    this.saveProjects(projects)
    return newProject
  }

  updateProject(id: string, updates: Partial<Project>) {
    const projects = this.getProjects()
    const index = projects.findIndex(project => project.id === id)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates }
      this.saveProjects(projects)
      return projects[index]
    }
    return null
  }

  deleteProject(id: string) {
    const projects = this.getProjects()
    const filtered = projects.filter(project => project.id !== id)
    this.saveProjects(filtered)
  }

  // 导出数据
  exportData() {
    const data = this.getAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jkeroro-website-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 导入数据
  importData(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          this.saveAllData(data)
          resolve(true)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
}

export default DataManager
