import { UploadRepository } from "./uploads.repository.js";
import { UploadService } from "./uploads.service.js";

export function createUploadService() {
  const repository = new UploadRepository();
  return new UploadService(repository);
}