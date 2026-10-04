import { AsyncLocalStorage } from 'async_hooks';

export interface RequestDataSourceContext {
  sources: Set<string>;
}

export const requestContextStorage = new AsyncLocalStorage<RequestDataSourceContext>();

export class DataSourceTracker {
  /**
   * Record that data for the current request was retrieved from a specific source:
   * e.g. 'Redis', 'Master DB', 'Tenant DB', or 'Tenant DB (name)'.
   */
  static record(source: string): void {
    const store = requestContextStorage.getStore();
    if (store && source) {
      store.sources.add(source);
    }
  }

  /**
   * Get all data sources recorded for the current request context.
   */
  static getSources(): string[] {
    const store = requestContextStorage.getStore();
    return store ? Array.from(store.sources) : [];
  }

  /**
   * Helper: Get formatted summary string of data sources for logs / headers.
   */
  static getSummary(): string {
    const sources = this.getSources();
    return sources.length > 0 ? sources.join(' + ') : 'Direct / Memory';
  }
}
