import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '../core/logger';

let prisma: PrismaClient;

export const initializeDatabase = async (): Promise<PrismaClient> => {
  prisma = new PrismaClient({
    log: config.isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

  try {
    await prisma.$connect();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }

  return prisma;
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma?.$disconnect();
  logger.info('Database connection closed');
};

export const getDatabase = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return prisma;
};

export { prisma };
