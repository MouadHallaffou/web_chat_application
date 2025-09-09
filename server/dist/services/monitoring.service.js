"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = void 0;
// Replaced custom logger with console to avoid missing module
const cache_service_1 = require("./cache.service");
const mongoose_1 = __importDefault(require("mongoose"));
class MonitoringService {
    constructor() {
        this.METRICS_TTL = 3600; // 1 hour
        this.metrics = new Map();
        this.initializeMetrics();
    }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    async initializeMetrics() {
        try {
            // Initialize basic metrics
            this.metrics.set('active_users', 0);
            this.metrics.set('total_messages', 0);
            this.metrics.set('active_connections', 0);
            this.metrics.set('error_count', 0);
            this.metrics.set('average_response_time', 0);
            // Start periodic metrics collection
            setInterval(() => this.collectMetrics(), 60000); // Every minute
        }
        catch (error) {
            console.error('Failed to initialize metrics:', error);
        }
    }
    async collectMetrics() {
        try {
            // Collect MongoDB metrics
            const dbStats = await mongoose_1.default.connection.db.stats();
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
        }
        catch (error) {
            console.error('Failed to collect metrics:', error);
        }
    }
    async updateMetric(name, value) {
        try {
            this.metrics.set(name, value);
            await cache_service_1.cacheService.setHash('metrics', name, value);
        }
        catch (error) {
            console.error(`Failed to update metric ${name}:`, error);
        }
    }
    async persistMetrics() {
        try {
            const metrics = Object.fromEntries(this.metrics);
            await cache_service_1.cacheService.set('metrics:latest', metrics, this.METRICS_TTL);
        }
        catch (error) {
            console.error('Failed to persist metrics:', error);
        }
    }
    async incrementMetric(name, value = 1) {
        try {
            const currentValue = this.metrics.get(name) || 0;
            await this.updateMetric(name, currentValue + value);
        }
        catch (error) {
            console.error(`Failed to increment metric ${name}:`, error);
        }
    }
    async decrementMetric(name, value = 1) {
        try {
            const currentValue = this.metrics.get(name) || 0;
            await this.updateMetric(name, Math.max(0, currentValue - value));
        }
        catch (error) {
            console.error(`Failed to decrement metric ${name}:`, error);
        }
    }
    async getMetric(name) {
        try {
            return this.metrics.get(name) || 0;
        }
        catch (error) {
            console.error(`Failed to get metric ${name}:`, error);
            return 0;
        }
    }
    async getAllMetrics() {
        try {
            return Object.fromEntries(this.metrics);
        }
        catch (error) {
            console.error('Failed to get all metrics:', error);
            return {};
        }
    }
    async getMetricsHistory(metricName, duration = 3600) {
        try {
            const history = await cache_service_1.cacheService.getHash('metrics:history', metricName);
            return history || {};
        }
        catch (error) {
            console.error(`Failed to get metrics history for ${metricName}:`, error);
            return {};
        }
    }
    async recordResponseTime(duration) {
        try {
            const currentAvg = await this.getMetric('average_response_time');
            const count = await this.getMetric('response_count') || 0;
            const newAvg = (currentAvg * count + duration) / (count + 1);
            await this.updateMetric('average_response_time', newAvg);
            await this.incrementMetric('response_count');
        }
        catch (error) {
            console.error('Failed to record response time:', error);
        }
    }
    async recordError(error) {
        try {
            await this.incrementMetric('error_count');
            console.error('Application error:', error);
        }
        catch (err) {
            console.error('Failed to record error:', err);
        }
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoringService = MonitoringService.getInstance();
