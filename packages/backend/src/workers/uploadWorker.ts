/**
 * uploadWorker.ts
 * Placeholder worker for processing uploaded CSV files.
 * Milestone 0 stub — implements a processUpload() placeholder that will be extended in later milestones.
 */

export async function processUpload(jobId: string): Promise<void> {
  // TODO: implement streaming parser, per-row validation, partial commits, and error report generation.
  // This stub exists so other modules can import and invoke the worker in integration tests and CI.
  console.log(`processUpload called for jobId=${jobId} (stub)`)
  return Promise.resolve()
}

export default {
  processUpload,
}
