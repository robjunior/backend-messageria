export type IntegrationType = 'whatsapp' | 'sms' | 'email' | 'push' | 'telegram' | 'slack';

export type IntegrationProvider =
  | 'twilio'
  | 'meta'
  | 'vonage'
  | 'infobip'
  | 'firebase'
  | 'custom'
  | 'mock'
  | string;

export interface IntegrationConfig {
  id: string;
  orgId: string; // Organização dona da integração
  type: IntegrationType;
  provider: IntegrationProvider;
  credentials: Record<string, string>; // Ex: { apiKey, apiSecret, accountSid, ... }
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  name?: string; // Nome amigável para exibição
  description?: string;
  metadata?: Record<string, unknown>; // Campos extras específicos do provedor
}
