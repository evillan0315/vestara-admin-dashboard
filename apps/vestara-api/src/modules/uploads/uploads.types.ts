export interface UploadBody {
  filename: string;
  content: string;
}

export interface UploadInput {
  filename: string;
  content: string | Buffer | Blob;
  contentType?: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  pathname: string;
  downloadUrl: string;
}