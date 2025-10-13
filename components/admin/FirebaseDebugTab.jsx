'use client'

import React, { useEffect, useState } from 'react'
import { checkFirebaseConnection, database, firestore, incrementViewCount, addComment, trackVisitorLocation } from '../../firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database, 
  Cloud, 
  Users, 
  MessageSquare,
  RefreshCw,
  Activity,
  Bell
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const FirebaseDebugTab = () => {
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = () => {
    const status = checkFirebaseConnection()
    setConnectionStatus(status)
    setLastUpdate(new Date().toLocaleTimeString())
  }

  const testViewerCount = async () => {
    setIsLoading(true)
    try {
      await incrementViewCount()
      setTestResults(prev => ({ ...prev, viewerCount: { status: 'success', message: 'Viewer count incremented successfully' } }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, viewerCount: { status: 'error', message: error.message } }))
    }
    setIsLoading(false)
  }

  const testAddComment = async () => {
    if (!comment.trim()) return
    
    setIsLoading(true)
    try {
      await addComment(comment)
      setTestResults(prev => ({ ...prev, addComment: { status: 'success', message: 'Comment added successfully' } }))
      setComment('')
    } catch (error) {
      setTestResults(prev => ({ ...prev, addComment: { status: 'error', message: error.message } }))
    }
    setIsLoading(false)
  }

  const testLocationTracking = async () => {
    setIsLoading(true)
    try {
      await trackVisitorLocation()
      setTestResults(prev => ({ ...prev, locationTracking: { status: 'success', message: 'Location tracking completed' } }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, locationTracking: { status: 'error', message: error.message } }))
    }
    setIsLoading(false)
  }


  const getStatusIcon = (status) => {
    switch (status) {
      case true:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case false:
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTestResultIcon = (result) => {
    if (!result) return <AlertCircle className="h-4 w-4 text-gray-500" />
    return result.status === 'success' 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            Firebase Connection Status
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnectionStatus}
              className="ml-auto text-black border-gray-600 hover:bg-gray-200 hover:text-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Last updated: {lastUpdate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.app)}
                <span className="text-white">App</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.database)}
                <span className="text-white">Realtime DB</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.firestore)}
                <span className="text-white">Firestore</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.auth)}
                <span className="text-white">Auth</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.storage)}
                <span className="text-white">Storage</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Functions */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5" />
            Firebase Function Tests
          </CardTitle>
          <CardDescription className="text-gray-400">
            Test Firebase functions to ensure they're working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Viewer Count Test */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              {getTestResultIcon(testResults.viewerCount)}
              <div>
                <h4 className="text-white font-medium">Viewer Count</h4>
                <p className="text-gray-400 text-sm">
                  {testResults.viewerCount?.message || 'Test viewer count increment'}
                </p>
              </div>
            </div>
            <Button 
              onClick={testViewerCount} 
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-black border-gray-600 hover:bg-gray-200 hover:text-black"
            >
              <Users className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>

          {/* Location Tracking Test */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              {getTestResultIcon(testResults.locationTracking)}
              <div>
                <h4 className="text-white font-medium">Location Tracking</h4>
                <p className="text-gray-400 text-sm">
                  {testResults.locationTracking?.message || 'Test visitor location tracking'}
                </p>
              </div>
            </div>
            <Button 
              onClick={testLocationTracking} 
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-black border-gray-600 hover:bg-gray-200 hover:text-black"
            >
              <Cloud className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>


          {/* Comment Test */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {getTestResultIcon(testResults.addComment)}
              <div>
                <h4 className="text-white font-medium">Add Comment</h4>
                <p className="text-gray-400 text-sm">
                  {testResults.addComment?.message || 'Test comment submission'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter test comment..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                rows={2}
              />
              <Button 
                onClick={testAddComment} 
                disabled={isLoading || !comment.trim()}
                variant="outline"
                size="sm"
                className="self-end text-black border-gray-600 hover:bg-gray-200 hover:text-black"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Environment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Badge variant="outline" className="mb-2 text-white border-gray-600">
                Environment: {process.env.NODE_ENV}
              </Badge>
              <p className="text-gray-400 text-sm">
                Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">
                Debug Mode: {process.env.NODE_ENV === 'development' ? '✅ Enabled' : '❌ Disabled'}
              </p>
              <p className="text-gray-400 text-sm">
                Console Logs: {process.env.NODE_ENV === 'development' ? '✅ Active' : '❌ Silent'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FirebaseDebugTab
