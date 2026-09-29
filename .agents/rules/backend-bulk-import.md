# Backend High-Volume Bulk Import Rule

For importing large datasets (100,000+ / 1 lakh+ entries such as voters, users, transactions, analytics records):

## Guidelines
1. **Always Use `src/utils/bulkImporter.ts`**: Do not write custom loop insertions or `Array.map` async calls for bulk data operations.
2. **Never Load All Records in Memory**: Always stream large CSV/JSON files or process iterables chunk by chunk (`BulkImporter.processStream` or `BulkImporter.processCsvStream`).
3. **Batch DB Inserts**: Always use chunked batching (`batchSize: 2500 - 5000`) and parallel worker execution (`concurrency: 4`).
4. **Transform & Non-Blocking Validation**: Pass a `transform` function to filter/validate malformed rows without throwing or crashing the entire import stream.
5. **Report Performance Metrics**: Capture and return `totalProcessed`, `insertedCount`, `failedCount`, `durationMs`, and `recordsPerSecond`.
