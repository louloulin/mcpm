import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

/**
 * 捕获异常中间件
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  
  // 区分不同类型的错误
  if (err instanceof SyntaxError && 'body' in err) {
    // JSON解析错误
    res.status(400).json({
      error: '无效的JSON格式',
      details: err.message
    });
    return;
  }
  
  // 默认服务器错误
  res.status(500).json({
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * 处理404路由
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: '未找到请求的资源',
    path: req.originalUrl
  });
};
