export interface UploadRecord {
  filename: string;
  url: string;
  pathname: string;
  createdAt?: Date;
}

export class UploadRepository {
  async create(data: UploadRecord): Promise<void> {
    // prisma.upload.create(...)
  }

  async findAll(): Promise<UploadRecord[]> {
    // prisma.upload.findMany()
    return [];
  }
}