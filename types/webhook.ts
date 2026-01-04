export interface BrandConfiguration {
  id: string;
  brand_key: string;
  brand_display_name: string;
  ghl_location_id: string | null;
  email_from: string | null;
  instagram_account_id: string | null;
  sms_enabled: boolean;
  email_enabled: boolean;
  dm_enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WebhookRegistry {
  id: string;
  workflow_name: string;
  n8n_endpoint: string;
  brand: string | null;
  channel: string | null;
  status: 'active' | 'inactive' | 'testing';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string | null;
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface CreateWebhookInput {
  workflow_name: string;
  n8n_endpoint: string;
  brand?: string;
  channel?: string;
  status?: 'active' | 'inactive' | 'testing';
  metadata?: Record<string, any>;
}

export interface ExecuteWorkflowInput {
  workflow_name: string;
  payload: Record<string, any>;
  brand?: string;
}

export interface WorkflowExecutionResult {
  execution_id: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  output_payload?: Record<string, any>;
  error_message?: string;
  execution_time_ms?: number;
}
