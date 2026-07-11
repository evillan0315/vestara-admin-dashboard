import axios from "axios";

import type {
  ExternalSubscriberItem,
} from "./subscribers.types.js";

export class SubscribersRepository {
  async findAll(): Promise<ExternalSubscriberItem[]> {
    const baseUrl = process.env.EXTERNAL_API_BASE;
    const token = process.env.EXTERNAL_API_TOKEN;

    if (!baseUrl || !token) {
      throw new Error("Missing external API configuration");
    }

    const url =
      `${baseUrl}/subscribers/?token=${token}&_sort=created_at:DESC`;

    const response = await axios.get<ExternalSubscriberItem[]>(url, {
      timeout: 10_000,
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  }
}