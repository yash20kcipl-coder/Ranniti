import { BulkImportResult, BulkImportProgress, BulkImportError, BulkImportBatchResult } from '../utils/bulkImporter';

export type BulkImportProgressCallback = (p: BulkImportProgress) => void;
export type BulkImportContext = Record<string, any>;
export type { BulkImportResult, BulkImportError, BulkImportBatchResult };
export type BulkImportServiceResult = BulkImportResult;
