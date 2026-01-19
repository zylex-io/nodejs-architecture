import { getDatabase } from '../../config/database';
import { logger } from '../../core/logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
}

export interface DetailedHealthStatus extends HealthStatus {
  dependencies: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    // Add more dependencies as needed (redis, external APIs, etc.)
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * Health check service
 */
export class HealthService {
  /**
   * Get basic health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Get detailed health status with dependency checks
   */
  async getDetailedHealth(): Promise<DetailedHealthStatus> {
    const basicHealth = await this.getHealthStatus();
    const dbHealth = await this.checkDatabase();
    const memoryUsage = this.getMemoryUsage();

    const overallStatus = this.determineOverallStatus([dbHealth.status]);

    return {
      ...basicHealth,
      status: overallStatus,
      dependencies: {
        database: dbHealth,
      },
      memory: memoryUsage,
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{ status: 'connected' | 'disconnected'; latency?: number }> {
    try {
      const start = Date.now();
      const prisma = getDatabase();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return { status: 'connected', latency };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { status: 'disconnected' };
    }
  }

  /**
   * Get memory usage statistics
   */
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  }

  /**
   * Determine overall health status based on dependencies
   */
  private determineOverallStatus(
    statuses: ('connected' | 'disconnected')[],
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const disconnectedCount = statuses.filter((s) => s === 'disconnected').length;

    if (disconnectedCount === statuses.length) {
      return 'unhealthy';
    }

    if (disconnectedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }
}
