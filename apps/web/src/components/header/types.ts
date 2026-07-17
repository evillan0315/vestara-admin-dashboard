export interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

export type NotificationType =
  | 'booking'
  | 'payment'
  | 'membership'
  | 'companion'
  | 'security'
  | 'system'
  | 'user'
  | 'setting'
  | 'auth'
  | 'activity';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  timestamp: string;
  unread: boolean;
}
