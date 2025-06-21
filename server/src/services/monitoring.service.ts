import { logger } from './logger.service';
import { cacheService } from './cache.service';
import mongoose from 'mongoose';

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, number>;
  private readonly METRICS_TTL = 3600; // 1 hour

  private constructor() {
    this.metrics = new Map();
    this.initializeMetrics();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private async initializeMetrics() {
    try {
      // Initialize basic metrics
      this.metrics.set('active_users', 0);
      this.metrics.set('total_messages', 0);
      this.metrics.set('active_connections', 0);
      this.metrics.set('error_count', 0);
      this.metrics.set('average_response_time', 0);

      // Start periodic metrics collection
      setInterval(() => this.collectMetrics(), 60000); // Every minute
    } catch (error) {
      logger.error('Failed to initialize metrics:', error);
    }
  }

  private async collectMetrics() {
    try {
      // Collect MongoDB metrics
      const dbStats = await mongoose.connection.db.stats();
      await this.updateMetric('db_connections', dbStats.connections);
      await this.updateMetric('db_operations', dbStats.opcounters.total);

      // Collect memory usage
      const memoryUsage = process.memoryUsage();
      await this.updateMetric('memory_heap_used', Math.round(memoryUsage.heapUsed / 1024 / 1024));
      await this.updateMetric('memory_heap_total', Math.round(memoryUsage.heapTotal / 1024 / 1024));

      // Collect CPU usage
      const cpuUsage = process.cpuUsage();
      await this.updateMetric('cpu_user', cpuUsage.user);
      await this.updateMetric('cpu_system', cpuUsage.system);

      // Store metrics in Redis for persistence
      await this.persistMetrics();
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  private async updateMetric(name: string, value: number) {
    try {
      this.metrics.set(name, value);
      await cacheService.setHash('metrics', name, value);
    } catch (error) {
      logger.error(`Failed to update metric ${name}:`, error);
    }
  }

  private async persistMetrics() {
    try {
      const metrics = Object.fromEntries(this.metrics);
      await cacheService.set('metrics:latest', metrics, this.METRICS_TTL);
    } catch (error) {
      logger.error('Failed to persist metrics:', error);
    }
  }

  public async incrementMetric(name: string, value: number = 1) {
    try {
      const currentValue = this.metrics.get(name) || 0;
      await this.updateMetric(name, currentValue + value);
    } catch (error) {
      logger.error(`Failed to increment metric ${name}:`, error);
    }
  }

  public async decrementMetric(name: string, value: number = 1) {
    try {
      const currentValue = this.metrics.get(name) || 0;
      await this.updateMetric(name, Math.max(0, currentValue - value));
    } catch (error) {
      logger.error(`Failed to decrement metric ${name}:`, error);
    }
  }

  public async getMetric(name: string): Promise<number> {
    try {
      return this.metrics.get(name) || 0;
    } catch (error) {
      logger.error(`Failed to get metric ${name}:`, error);
      return 0;
    }
  }

  public async getAllMetrics(): Promise<Record<string, number>> {
    try {
      return Object.fromEntries(this.metrics);
    } catch (error) {
      logger.error('Failed to get all metrics:', error);
      return {};
    }
  }

  public async getMetricsHistory(
    metricName: string,
    duration: number = 3600
  ): Promise<Record<string, number>> {
    try {
      const history = await cacheService.getHash<Record<string, number>>(
        'metrics:history',
        metricName
      );
      return history || {};
    } catch (error) {
      logger.error(`Failed to get metrics history for ${metricName}:`, error);
      return {};
    }
  }

  public async recordResponseTime(duration: number) {
    try {
      const currentAvg = await this.getMetric('average_response_time');
      const count = await this.getMetric('response_count') || 0;
      const newAvg = (currentAvg * count + duration) / (count + 1);
      
      await this.updateMetric('average_response_time', newAvg);
      await this.incrementMetric('response_count');
    } catch (error) {
      logger.error('Failed to record response time:', error);
    }
  }

  public async recordError(error: Error) {
    try {
      await this.incrementMetric('error_count');
      logger.error('Application error:', error);
    } catch (err) {
      logger.error('Failed to record error:', err);
    }
  }
}

export const monitoringService = MonitoringService.getInstance(); 