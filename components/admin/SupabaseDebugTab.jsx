'use client'

import React, { useEffect, useState } from 'react'
import { checkSupabaseConnection } from '../../supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Server,
  Key
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const SupabaseDebugTab = () => {
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [serverStatus, setServerStatus] = useState(null) // 服务器端状态
  const [dbStatus, setDbStatus] = useState(null) // 数据库连接状态
  const [directConnectionTest, setDirectConnectionTest] = useState(null) // 直接连接测试
  const [testResults, setTestResults] = useState({})
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    checkConnectionStatus()
    checkDatabaseStatus()
    testDirectConnection()
  }, [])

  const testDirectConnection = async () => {
    try {
      const response = await fetch('/api/admin/test-db-connection')
      if (response.ok) {
        const data = await response.json()
        setDirectConnectionTest(data)
      }
    } catch (error) {
      console.error('Error testing direct connection:', error)
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/admin/db-status')
      if (response.ok) {
        const data = await response.json()
        setDbStatus(data)
      } else {
        const error = await response.json()
        setDbStatus({
          error: error.message || 'Failed to check database status',
        })
      }
    } catch (error) {
      console.error('Error checking database status:', error)
      setDbStatus({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const checkConnectionStatus = async () => {
    // 客户端检查（只能检查 NEXT_PUBLIC_ 变量）
    const clientStatus = checkSupabaseConnection()
    
    // 服务器端检查（通过 API）
    try {
      const response = await fetch('/api/admin/supabase-status')
      if (response.ok) {
        const serverStatusData = await response.json()
        setServerStatus(serverStatusData) // 保存服务器端状态
        setConnectionStatus({
          ...clientStatus,
          serviceRoleKey: serverStatusData.serviceRoleKey,
          databaseUrl: serverStatusData.databaseUrl,
        })
      } else {
        setConnectionStatus(clientStatus)
      }
    } catch (error) {
      console.error('Error fetching server status:', error)
      setConnectionStatus(clientStatus)
    }
    
    setLastUpdate(new Date().toLocaleTimeString())
  }

  const testViewerCount = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stats/view', { method: 'POST' })
      if (response.ok) {
        setTestResults(prev => ({ ...prev, viewerCount: { status: 'success', message: 'Viewer count incremented successfully' } }))
      } else {
        throw new Error('Failed to increment viewer count')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, viewerCount: { status: 'error', message: error.message } }))
    }
    setIsLoading(false)
  }

  const testAddComment = async () => {
    if (!comment.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      })
      if (response.ok) {
        setTestResults(prev => ({ ...prev, addComment: { status: 'success', message: 'Comment added successfully' } }))
        setComment('')
      } else {
        throw new Error('Failed to add comment')
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, addComment: { status: 'error', message: error.message } }))
    }
    setIsLoading(false)
  }

  const testLocationTracking = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stats/countries', { method: 'POST' })
      if (response.ok) {
        setTestResults(prev => ({ ...prev, locationTracking: { status: 'success', message: 'Location tracking completed' } }))
      } else {
        throw new Error('Failed to track location')
      }
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
            Supabase Connection Status
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.client)}
                <span className="text-white">Client</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.url)}
                <span className="text-white">URL</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.anonKey)}
                <span className="text-white">Anon Key</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.serviceRoleKey)}
                <span className="text-white">Service Key</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(connectionStatus.databaseUrl)}
                <span className="text-white">Database URL</span>
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
            API Function Tests
          </CardTitle>
          <CardDescription className="text-gray-400">
            Test API functions to ensure they're working correctly
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
          <CardDescription className="text-gray-400">
            Configuration status for development and production environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Environment Badge */}
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`text-white border-gray-600 ${
                  process.env.NODE_ENV === 'development' 
                    ? 'bg-green-500/20 border-green-500' 
                    : 'bg-blue-500/20 border-blue-500'
                }`}
              >
                {process.env.NODE_ENV === 'development' ? '🔧 Development' : '🚀 Production'}
              </Badge>
              <span className="text-gray-400 text-sm">
                {process.env.NODE_ENV === 'development' ? 'Debug mode enabled' : 'Production mode'}
              </span>
            </div>

            {/* Supabase Configuration */}
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Supabase Configuration
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300 text-sm">Supabase URL</span>
                  <Badge 
                    variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300 text-sm">Anon Key</span>
                  <Badge 
                    variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300 text-sm">Service Role Key</span>
                  <Badge 
                    variant={serverStatus?.serviceRoleKey ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {serverStatus?.serviceRoleKey ? '✅ Set' : '❌ Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-300 text-sm">Database URL</span>
                  <Badge 
                    variant={serverStatus?.databaseUrl ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {serverStatus?.databaseUrl ? '✅ Set' : '❌ Missing'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Database Connection Status */}
            {dbStatus && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Connection Status
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Connection Test</span>
                      {dbStatus.connection?.success ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500">
                          ✅ Connected
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ❌ Failed
                        </Badge>
                      )}
                    </div>
                    {dbStatus.connection?.error && (
                      <p className="text-red-400 text-xs mt-2">{dbStatus.connection.error}</p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Database URL</span>
                      {dbStatus.environment?.hasDatabaseUrl ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500">
                          ✅ Set
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ❌ Missing
                        </Badge>
                      )}
                    </div>
                    {dbStatus.environment?.databaseUrlPreview && (
                      <p className="text-gray-400 text-xs mt-2 font-mono break-all">
                        {dbStatus.environment.databaseUrlPreview}
                      </p>
                    )}
                  </div>

                  {dbStatus.tables?.success && (
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm">Tables Found</span>
                        <Badge variant="default" className="bg-blue-500/20 text-white border-blue-500">
                          {dbStatus.tables.tables.length}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dbStatus.tables.tables.map((table) => (
                          <Badge key={table} variant="outline" className="text-xs text-white border-gray-600">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {dbStatus.dataCounts && (
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <div className="text-white text-sm mb-2">Data Counts</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-white">
                        <div>Images: <span className="text-white">{dbStatus.dataCounts.images}</span></div>
                        <div>Tracks: <span className="text-white">{dbStatus.dataCounts.tracks}</span></div>
                        <div>Projects: <span className="text-white">{dbStatus.dataCounts.projects}</span></div>
                        <div>Comments: <span className="text-white">{dbStatus.dataCounts.comments}</span></div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={checkDatabaseStatus}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Database Status
                  </Button>
                </div>
              </div>
            )}

            {/* Direct Connection Test */}
            {directConnectionTest && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Direct Database Connection Test (绕过 Prisma)
                </h4>
                <div className="space-y-2">
                  {directConnectionTest.checks?.map((check, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm">{check.name}</span>
                        {check.success ? (
                          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500">
                            ✅ Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">❌ Failed</Badge>
                        )}
                      </div>
                      {check.details && (
                        <div className="text-gray-400 text-xs mt-2">
                          {typeof check.details === 'string' ? (
                            <p className="text-white">{check.details}</p>
                          ) : (
                            <pre className="whitespace-pre-wrap text-white">{JSON.stringify(check.details, null, 2)}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={testDirectConnection}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Test Direct Connection
                  </Button>
                </div>
              </div>
            )}

            {/* Development Settings */}
            {process.env.NODE_ENV === 'development' && (
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Development Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300 text-sm">Debug Mode</span>
                    <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500">
                      ✅ Enabled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300 text-sm">Console Logs</span>
                    <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500">
                      ✅ Active
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SupabaseDebugTab

