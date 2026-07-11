import { SubscribersRepository } from "../../modules/subscribers/subscribers.repository.js";
import { SubscribersService } from "../../modules/subscribers/subscribers.service.js";
import { createUploadService } from "../../modules/uploads/uploads.factory.js";

export async function syncSubscribersProcessor(job: any) {
  const repo = new SubscribersRepository();
  const service = new SubscribersService(repo);

  const upload = createUploadService();

  const subscribers = await service.findAll();

  job.log(`Fetched ${subscribers.length}`);

  const payload = JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      count: subscribers.length,
      data: subscribers,
      jobId: job.id,
    },
    null,
    2,
  );

  const result = await upload.uploadFile({
    filename: `subscribers-${Date.now()}.json`,
    folder: "subscribers-snapshots",
    content: payload,
    contentType: "application/json",
  });

  job.log(`Uploaded ${result.url}`);

  return result;
}