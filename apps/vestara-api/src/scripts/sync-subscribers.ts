import { SubscribersRepository } from "../modules/subscribers/subscribers.repository.js";
import { SubscribersService } from "../modules/subscribers/subscribers.service.js";

import { createUploadService } from "../modules/uploads/uploads.factory.js";

async function main() {
  //
  // Subscribers DI
  //
  const subscribersRepository = new SubscribersRepository();
  const subscribersService = new SubscribersService(subscribersRepository);

  const subscribers = await subscribersService.findAll();

  console.log(`Fetched ${subscribers.length} subscribers`);

  //
  // Upload Service (factory-based DI)
  //
  const uploadService = createUploadService();

  const payload = JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      count: subscribers.length,
      data: subscribers,
    },
    null,
    2,
  );

  const blobResult = await uploadService.uploadFile({
    filename: `subscribers-${Date.now()}.json`,
    folder: "subscribers-snapshots",
    content: payload,
    contentType: "application/json",
  });

  console.log(`Uploaded to blob: ${blobResult.url}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});