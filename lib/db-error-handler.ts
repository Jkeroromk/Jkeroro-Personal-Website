/**
 * 数据库错误处理辅助函数
 * 用于统一处理 Prisma 数据库连接错误和查询错误
 */

export interface DbErrorInfo {
  isConnectionError: boolean
  isTimeoutError: boolean
  shouldReturnEmpty: boolean
  errorMessage: string
}

/**
 * 检查是否是数据库连接错误
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const errorMessage = error.message.toLowerCase()
  const errorName = error.constructor.name.toLowerCase()

  // Prisma 连接错误代码
  const prismaConnectionErrorCodes = [
    'p1001', // Can't reach database server
    'p1002', // Database server doesn't accept connection
    'p1003', // Database does not exist
    'p1008', // Operations timed out
    'p1009', // Database already exists
    'p1010', // User was denied access
    'p1011', // TLS connection error
    'p1017', // Server has closed the connection
  ]

  // 检查错误代码
  const hasPrismaErrorCode = prismaConnectionErrorCodes.some(code => 
    errorMessage.includes(code.toLowerCase())
  )

  // 检查错误消息关键词
  const connectionErrorKeywords = [
    "can't reach database server",
    "can't reach database",
    "prismaclientinitializationerror",
    "query timeout",
    "connection timeout",
    "connection refused",
    "connection closed",
    "connection reset",
    "econnrefused",
    "etimedout",
    "socket hang up",
    "pool timeout",
    "connection pool",
    "too many connections",
    "server closed the connection",
    "database server doesn't accept connection",
  ]

  const hasConnectionKeyword = connectionErrorKeywords.some(keyword =>
    errorMessage.includes(keyword)
  )

  // 检查错误类型名称
  const connectionErrorTypes = [
    'prismaclientinitializationerror',
    'connectionerror',
    'timeouterror',
  ]

  const hasConnectionType = connectionErrorTypes.some(type =>
    errorName.includes(type)
  )

  return hasPrismaErrorCode || hasConnectionKeyword || hasConnectionType
}

/**
 * 检查是否是超时错误
 */
export function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const errorMessage = error.message.toLowerCase()
  const errorName = error.constructor.name.toLowerCase()

  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorName.includes('timeout') ||
    errorMessage.includes('p1008')
  )
}

/**
 * 获取数据库错误信息
 */
export function getDbErrorInfo(error: unknown): DbErrorInfo {
  const isConnectionError = isDatabaseConnectionError(error)
  const isTimeout = isTimeoutError(error)
  const errorMessage = error instanceof Error ? error.message : String(error)

  return {
    isConnectionError,
    isTimeoutError: isTimeout,
    shouldReturnEmpty: isConnectionError || isTimeout,
    errorMessage,
  }
}

/**
 * 为 Prisma 查询添加超时保护
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  timeoutMessage: string = 'Database query timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ])
}

