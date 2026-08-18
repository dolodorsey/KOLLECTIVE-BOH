export interface BrandConfiguration {
  id: string;
  brand_key: string;
  brand_display_name: string;
  email_from: string | null;
  instagram_account_id: string | null;
  sms_enabled: boolean;
  email_enabled: boolean;
  dm_enabled: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type DirectIntegrationStatus =
  | 'connected'
  | 'needs_verification'
  | 'degraded'
  | 'disabled'
  | 'archived';

export interface DirectIntegration {
  id: string;
  integration_key: string;
  provider: string;
  display_name: string;
  enterprise_entity_id: string | null;
  auth_mode: 'api_key' | 'oauth' | 'service_account' | 'webhook_secret' | 'database' | 'none';
  secret_ref: string | null;
  endpoint_url: string | null;
  capabilities: string[];
  status: DirectIntegrationStatus;
  last_verified_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DirectIntegrationRun {
  id: string;
  integration_id: string | null;
  enterprise_entity_id: string | null;
  action_key: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped';
  request_ref: string | null;
  result_summary: string | null;
  evidence: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface GoogleSheetBackend {
  id: string;
  sheet_key: string;
  spreadsheet_id: string;
  title: string;
  purpose: string;
  authority_scope: string;
  sync_direction: 'source' | 'mirror' | 'bidirectional';
  status: 'connected' | 'needs_verification' | 'stale' | 'error' | 'disabled' | 'archived';
  tab_schema: Record<string, unknown>;
  last_pull_at: string | null;
  last_push_at: string | null;
  last_verified_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
}
