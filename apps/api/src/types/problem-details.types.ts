/**
 * Problem Details for HTTP APIs (RFC 7807)
 * https://tools.ietf.org/html/rfc7807
 */
export interface ProblemDetails {
  /**
   * A URI reference that identifies the problem type
   */
  type: string;

  /**
   * A short, human-readable summary of the problem type
   */
  title: string;

  /**
   * The HTTP status code
   */
  status: number;

  /**
   * A human-readable explanation specific to this occurrence of the problem
   */
  detail?: string;

  /**
   * A URI reference that identifies the specific occurrence of the problem
   */
  instance?: string;

  /**
   * Timestamp when the problem occurred
   */
  timestamp?: string;

  /**
   * Additional error details (custom extension)
   */
  errors?: string[];

  /**
   * Trace ID for correlation (custom extension)
   */
  traceId?: string;

  /**
   * Additional custom properties
   */
  [key: string]: any;
}
