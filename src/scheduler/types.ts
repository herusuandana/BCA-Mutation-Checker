/**
 * Scheduler types and interfaces
 */

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  interval: number; // milliseconds
  minInterval?: number; // minimum allowed interval (default: 5 minutes)
}

/**
 * Check execution result
 */
export interface CheckResult {
  success: boolean;
  timestamp: Date;
  mutationCount?: number;
  error?: Error;
}

/**
 * Scheduler interface
 */
export interface IScheduler {
  start(): void;
  stop(): void;
  executeCheck(): Promise<CheckResult>;
  isRunning(): boolean;
}
