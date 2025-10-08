'use client'

import { useEffect, useState } from 'react'
import { firestore } from '../../firebase'
import { collection, getDocs } from 'firebase/firestore'

const DebugPage = () => {
  const [firebaseStatus, setFirebaseStatus] = useState('checking...')
  const [imagesCount, setImagesCount] = useState(0)
  const [tracksCount, setTracksCount] = useState(0)

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        if (!firestore) {
          setFirebaseStatus('❌ Firestore not initialized')
          return
        }

        setFirebaseStatus('✅ Firestore initialized')

        // 检查 images 集合
        try {
          const imagesSnapshot = await getDocs(collection(firestore, 'images'))
          setImagesCount(imagesSnapshot.size)
        } catch (error) {
          console.error('Images collection error:', error)
        }

        // 检查 tracks 集合
        try {
          const tracksSnapshot = await getDocs(collection(firestore, 'tracks'))
          setTracksCount(tracksSnapshot.size)
        } catch (error) {
          console.error('Tracks collection error:', error)
        }

      } catch (error) {
        setFirebaseStatus(`❌ Error: ${error.message}`)
        console.error('Firebase check error:', error)
      }
    }

    checkFirebase()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Firebase Status:</h2>
          <p>{firebaseStatus}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Collections:</h2>
          <p>Images: {imagesCount} documents</p>
          <p>Tracks: {tracksCount} documents</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Environment:</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
          <p>Has Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  )
}

export default DebugPage
