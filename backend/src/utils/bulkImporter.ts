import { Readable } from 'stream';
import readline from 'readline';
import { logger } from './logger';

export interface BulkImportConfig<TInput, TOutput = TInput> {
  /**
   * Size of each batch inserted into database (default: 2500)
   */
  batchSize?: number;

  /**
   * Maximum parallel DB batch insertion workers (default: 4)
   */
  concurrency?: number;

  /**
   * Optional transform/validation function per item.
   * Return null or throw error to skip malformed record.
   */
  transform?: (item: TInput, index: number) => Promise<TOutput | null> | TOutput | null;

  /**
   * Database bulk insert execution handler.
   * Receives a batch chunk of validated records and performs DB insertion.
   * Return inserted count if available.
   */
  onBatchInsert: (batch: TOutput[]) => Promise<number | void>;

  /**
   * Real-time progress callback for monitoring large imports.
   */
  onProgress?: (progress: BulkImportProgress) => void;

  /**
   * Max errors to record before stopping logger capture (default: 100)
   */
  maxRecordedErrors?: number;
}

export interface BulkImportProgress {
  processed: number;
  inserted: number;
  failed: number;
  percentage?: number;
  durationMs: number;
  recordsPerSecond: number;
}

export interface BulkImportResult {
  totalProcessed: number;
  insertedCount: number;
  failedCount: number;
  durationMs: number;
  recordsPerSecond: number;
  errors: Array<{ index: number; error: string }>;
}

/**
 * Generic, high-performance Bulk Importer utility optimized for 100,000+ (1 lakh+) records.
 * Uses stream chunking, memory-safe backpressure, parallel worker pools, and batching.
 */
export class BulkImporter {
  /**
   * Process bulk import from an Array or AsyncIterable in memory-optimized batches.
   */
  static async processArray<TInput, TOutput = TInput>(
    items: Iterable<TInput> | AsyncIterable<TInput>,
    config: BulkImportConfig<TInput, TOutput>
  ): Promise<BulkImportResult> {
    const stream = Readable.from(items);
    return this.processStream(stream, config);
  }

  /**
   * Process bulk import from a Node.js Readable Stream (e.g. CSV stream, file stream, network stream).
   */
  static async processStream<TInput, TOutput = TInput>(
    stream: Readable,
    config: BulkImportConfig<TInput, TOutput>
  ): Promise<BulkImportResult> {
    const startTime = process.hrtime.bigint();
    const batchSize = config.batchSize || 2500;
    const concurrency = Math.max(1, config.concurrency || 4);
    const maxErrors = config.maxRecordedErrors || 100;

    let totalProcessed = 0;
    let insertedCount = 0;
    let failedCount = 0;
    const errors: Array<{ index: number; error: string }> = [];

    let currentBatch: TOutput[] = [];
    const pendingWorkers: Promise<void>[] = [];

    const flushBatch = async (batchToInsert: TOutput[]): Promise<void> => {
      if (batchToInsert.length === 0) return;

      try {
        const count = await config.onBatchInsert(batchToInsert);
        insertedCount += typeof count === 'number' ? count : batchToInsert.length;
      } catch (err: any) {
        failedCount += batchToInsert.length;
        if (errors.length < maxErrors) {
          errors.push({
            index: totalProcessed,
            error: `Batch insert error: ${err.message || String(err)}`,
          });
        }
        logger.error(`[BulkImporter] Batch insert failed (${batchToInsert.length} records):`, err);
      }

      const now = process.hrtime.bigint();
      const durationMs = Number(now - startTime) / 1e6;
      const rps = Math.round((totalProcessed / (durationMs / 1000)) || 0);

      if (config.onProgress) {
        config.onProgress({
          processed: totalProcessed,
          inserted: insertedCount,
          failed: failedCount,
          durationMs: Math.round(durationMs),
          recordsPerSecond: rps,
        });
      }
    };

    const enqueueBatch = async (batchToInsert: TOutput[]): Promise<void> => {
      if (pendingWorkers.length >= concurrency) {
        await Promise.race(pendingWorkers);
      }

      const worker = flushBatch(batchToInsert).finally(() => {
        const idx = pendingWorkers.indexOf(worker);
        if (idx !== -1) pendingWorkers.splice(idx, 1);
      });

      pendingWorkers.push(worker);
    };

    for await (const rawItem of stream) {
      totalProcessed++;
      const currentIndex = totalProcessed;

      try {
        let processedItem: TOutput | null = rawItem as unknown as TOutput;
        if (config.transform) {
          processedItem = await config.transform(rawItem, currentIndex);
        }

        if (processedItem !== null && processedItem !== undefined) {
          currentBatch.push(processedItem);
        } else {
          failedCount++;
        }
      } catch (err: any) {
        failedCount++;
        if (errors.length < maxErrors) {
          errors.push({
            index: currentIndex,
            error: err.message || 'Transform validation error',
          });
        }
      }

      if (currentBatch.length >= batchSize) {
        const batchToInsert = currentBatch;
        currentBatch = [];
        await enqueueBatch(batchToInsert);
      }
    }

    // Flush remaining items
    if (currentBatch.length > 0) {
      await enqueueBatch(currentBatch);
    }

    // Wait for all worker batches to finish
    await Promise.all(pendingWorkers);

    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    const rps = Math.round((totalProcessed / (durationMs / 1000)) || 0);

    logger.info(
      `[BulkImporter] Complete | Total: ${totalProcessed} | Inserted: ${insertedCount} | Failed: ${failedCount} | Speed: ${rps} rec/sec | Time: ${Math.round(durationMs)}ms`
    );

    return {
      totalProcessed,
      insertedCount,
      failedCount,
      durationMs: Math.round(durationMs),
      recordsPerSecond: rps,
      errors,
    };
  }

  /**
   * Helper to parse CSV line stream efficiently line by line for bulk import.
   */
  static async processCsvStream<TOutput>(
    inputStream: Readable,
    delimiter = ',',
    config: BulkImportConfig<Record<string, string>, TOutput>
  ): Promise<BulkImportResult> {
    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    let isFirstLine = true;

    async function* lineGenerator() {
      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split(delimiter).map((s) => s.replace(/^"(.*)"$/, '$1').trim());

        if (isFirstLine) {
          headers = parts;
          isFirstLine = false;
          continue;
        }

        const record: Record<string, string> = {};
        headers.forEach((header, idx) => {
          record[header] = parts[idx] || '';
        });

        yield record;
      }
    }

    return this.processStream(Readable.from(lineGenerator()), config);
  }
}
