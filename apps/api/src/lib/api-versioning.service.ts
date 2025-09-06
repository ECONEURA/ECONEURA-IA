import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface APIVersion {
  version: string;
  deprecated: boolean;
  sunsetDate?: string;
  changelog: string[];
  breakingChanges: string[];
}

export class APIVersioningService {
  private versions: Map<string, APIVersion> = new Map();
  private currentVersion = 'v1';

  registerVersion(version: string, config: APIVersion): void {
    this.versions.set(version, config);
  }

  getVersion(version: string): APIVersion | null {
    return this.versions.get(version) || null;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  setCurrentVersion(version: string): void {
    this.currentVersion = version;
  }

  isDeprecated(version: string): boolean {
    const versionConfig = this.versions.get(version);
    return versionConfig?.deprecated || false;
  }

  getSupportedVersions(): string[] {
    return Array.from(this.versions.keys());
  }

  validateVersion(version: string): { valid: boolean; message?: string } {
    if (!this.versions.has(version)) {
      return { valid: false, message: `Version ${version} not supported` };
    }

    const versionConfig = this.versions.get(version);
    if (versionConfig?.deprecated) {
      return { valid: false, message: `Version ${version} is deprecated` };
    }

    return { valid: true };
  }
}

export const apiVersioningService = new APIVersioningService();
