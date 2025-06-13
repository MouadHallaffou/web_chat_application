import { createLogger, format, transports } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Configuration du logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    // Log dans la console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Log dans les fichiers
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// Configuration Elasticsearch si activé
if (process.env.ELASTICSEARCH_ENABLED === 'true') {
  logger.add(new ElasticsearchTransport({
    level: 'info',
    index: 'chatbot-logs',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    }
  }));
}

// Métriques de performance
export const metrics = {
  requestDuration: new Map(),
  activeConnections: 0,
  messageCount: 0,
  errorCount: 0
};

// Middleware de monitoring
export const monitoringMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requestDuration.set(req.path, duration);
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration
    });
  });
  
  next();
};

export default logger; 