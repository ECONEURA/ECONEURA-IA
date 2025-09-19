// Environment Configuration
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/econeura',
  
  // Cache Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key',
  
  // Performance Configuration
  COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || '6'),
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300'),
  
  // Feature Flags
  ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
  ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION !== 'false',
  ENABLE_CACHE: process.env.ENABLE_CACHE !== 'false',
  
  // Production optimizations
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test'
};
