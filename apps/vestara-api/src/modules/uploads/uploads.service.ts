import { put } from "@vercel/blob";

import type {
  UploadInput,
  UploadResult,
} from "./uploads.types.js";
import { UploadRepository } from "./uploads.repository.js";

export class UploadService {
  constructor(
    private readonly uploadRepository: UploadRepository,
  ) {}

  async uploadFile(
    input: UploadInput,
  ): Promise<UploadResult> {
    const path = this.buildPath(
      input.filename,
      input.folder,
    );

    const blob = await put(path, input.content, {
      access: "public",
      contentType: input.contentType,
    });

    await this.uploadRepository.create({
      filename: input.filename,
      url: blob.url,
      pathname: blob.pathname,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
    };
  }

  private buildPath(
    filename: string,
    folder?: string,
  ): string {
    const cleanFile = filename
      .replace(/^\/+/, "")
      .replace(/\s+/g, "-");

    if (!folder) {
      return cleanFile;
    }

    const cleanFolder = folder.replace(
      /^\/+|\/+$/g,
      "",
    );

    return `${cleanFolder}/${cleanFile}`;
  }
}