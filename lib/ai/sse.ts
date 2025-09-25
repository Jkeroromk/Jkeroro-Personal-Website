/**
 * SSE (Server-Sent Events) 解析工具
 * 用于解析 AI API 返回的流式响应
 */

/**
 * 异步生成器函数，用于解析 SSE 流
 * 逐行解析 data: 开头的内容，从 choices[0].delta.content 拿 token
 * @param res - Response 对象
 * @yields {string} - 从 choices[0].delta.content 提取的内容 token
 */
export async function* sseIterator(res: Response): AsyncGenerator<string, void, unknown> {
  if (!res.body) {
    throw new Error('Response body is null');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // 解码数据并添加到缓冲区
      buffer += decoder.decode(value, { stream: true });
      
      // 按行分割数据
      const lines = buffer.split('\n');
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || '';

      // 处理每一行
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 只处理以 "data:" 开头的行
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6); // 移除 "data: " 前缀
          
          // 忽略空行和结束标记
          if (data === '' || data === '[DONE]') {
            continue;
          }

          try {
            // 解析 JSON 数据
            const parsed = JSON.parse(data);
            
            // 从 choices[0].delta.content 提取内容 token
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content && typeof content === 'string') {
              yield content;
            }
          } catch (error) {
            // 静默忽略非法 JSON 行
            console.warn('Failed to parse SSE data:', data, error);
          }
        }
      }
    }
  } finally {
    // 确保释放 reader
    reader.releaseLock();
  }
}

/**
 * 解析 SSE 流并返回完整响应
 * @param res - Response 对象
 * @returns {Promise<string>} - 完整的响应内容
 */
export async function parseSSEResponse(res: Response): Promise<string> {
  let fullContent = '';
  
  for await (const token of sseIterator(res)) {
    fullContent += token;
  }
  
  return fullContent;
}