import { SubscribersRepository } from "./subscribers.repository.js";

import type {
  Subscriber,
} from "./subscribers.types.js";

export class SubscribersService {
  constructor(
    private readonly subscribersRepository: SubscribersRepository,
  ) {}

  async findAll(): Promise<Subscriber[]> {
    const data = await this.subscribersRepository.findAll();

    const seenEmails = new Set<string>();

    return data
      .map((item) => item.member)
      .filter(
        (member): member is Subscriber =>
          member !== undefined,
      )
      .filter((member) => {
        if (!member.email) {
          return true;
        }

        if (seenEmails.has(member.email)) {
          return false;
        }

        seenEmails.add(member.email);

        return true;
      });
  }
}