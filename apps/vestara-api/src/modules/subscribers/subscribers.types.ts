export interface Subscriber {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface ExternalSubscriberItem {
  member?: Subscriber;
  [key: string]: unknown;
}