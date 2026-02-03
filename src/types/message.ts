export type MessageChannel =
  | "whatsapp"
  | "sms"
  | "email"
  | "push"
  | "telegram"
  | "slack";
export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "file"
  | "location"
  | "contact";
export type MessageStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "delivered"
  | "failed"
  | "deleted"
  | "cancelled";

export interface MessageOwnership {
  orgId: string; // Organization that owns the message
  authorId: string; // User who created/scheduled the message
}

export interface ScheduledMessage extends MessageOwnership {
  id: string;
  recipient: string;
  message: string;
  sendAt: number | string; // Timestamp (ms) or ISO string
  channel: MessageChannel;
  type: MessageType;
  status: MessageStatus;
  isDraft: boolean;
  isDeleted: boolean;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  deliveredAt?: string; // ISO string
  deletedAt?: string; // ISO string
  sentAt?: string; // ISO string
  failedAt?: string; // ISO string
  error?: string; // Error message if failed
  metadata?: Record<string, unknown>; // Optional extra info (attachments, etc)
}
