export interface N8nWebhookPayload {
  [key: string]: unknown;
}

export interface N8nWebhookResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class N8nClient {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || '';
  }

  async post<T = unknown>(
    endpoint: string,
    payload: N8nWebhookPayload
  ): Promise<N8nWebhookResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.webhookUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`N8n webhook failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      console.error('[N8nClient] Webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async trigger(webhookPath: string, payload: N8nWebhookPayload): Promise<boolean> {
    const result = await this.post(webhookPath, payload);
    return result.success;
  }
}

export const n8nClient = new N8nClient();
