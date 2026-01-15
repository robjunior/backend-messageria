export type ScheduledMessage = {
  id: string;
  recipient: string;
  message: string;
  sendAt: number | string;
  channel: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
};
