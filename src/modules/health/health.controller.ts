import { Request, Response } from 'express';
import { HealthService } from './health.service';
import { sendSuccess } from '../../core/response';

/**
 * Health check controller
 */
export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  /**
   * Basic health check
   */
  check = async (_req: Request, res: Response): Promise<Response> => {
    const health = await this.healthService.getHealthStatus();
    return sendSuccess(res, 'Service is healthy', health);
  };

  /**
   * Detailed health check with dependencies
   */
  detailed = async (_req: Request, res: Response): Promise<Response> => {
    const health = await this.healthService.getDetailedHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return sendSuccess(res, `Service is ${health.status}`, health, statusCode);
  };
}
