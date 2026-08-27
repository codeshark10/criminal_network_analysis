export interface FileUploadResult {
  filename: string;
  status: string;
  file_path: string;
  size_bytes: number;
}

export interface UploadCasesResponse {
  message: string;
  total_uploaded: number;
  files: FileUploadResult[];
  pipeline_status: string;
}

/**
 * Uploads one or more .txt documents to the backend.
 * 
 * @param files Array of File objects (must be .txt)
 * @param processImmediately Boolean indicating whether to trigger the graph processing pipeline
 * @returns Promise containing the upload response details
 */
export const uploadCaseDocuments = async (
  files: File[],
  processImmediately: boolean = true
): Promise<UploadCasesResponse> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  // Append process_immediately as a query parameter.
  const url = new URL('/api/cases/upload', window.location.origin);
  url.searchParams.append('process_immediately', processImmediately.toString());

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
    // Note: Do NOT set Content-Type header. The browser automatically sets 
    // multipart/form-data with the correct boundary when passing FormData.
  });

  if (!response.ok) {
    let errorDetail = 'Unable to upload documents. Please check your connection and try again.';
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (e) {
      // Keep default error if parsing fails
    }
    throw new Error(errorDetail);
  }

  return response.json();
};
