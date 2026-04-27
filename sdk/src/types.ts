/**
 * SDK Configuration options
 */
export interface IntellectMemoryConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API (default: https://api.intellectmemory.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Memory object
 */
export interface Memory {
  id: string;
  content: string;
  content_hash: string;
  metadata: Record<string, unknown>;
  token_count: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create memory request
 */
export interface CreateMemoryRequest {
  content: string;
  source?: string;
  tags?: string[];
  external_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create memory response
 */
export interface CreateMemoryResponse {
  memory_item_id: string;
  chunk_count: number;
  tokens_used?: number;
  cached?: boolean;
}

/**
 * Update memory request
 */
export interface UpdateMemoryRequest {
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * List memories options
 */
export interface ListMemoriesOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Search request
 */
export interface SearchRequest {
  query: string;
  top_k?: number;
  threshold?: number;
  filters?: {
    tags?: string[];
    source?: string;
  };
}

/**
 * Search result
 */
export interface SearchResult {
  memory: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };
  score: number;
  chunk_index: number;
  chunk_text: string;
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  query_embedding_cached: boolean;
  search_time_ms: number;
  tokens_used: number;
}

/**
 * Project
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create project request
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

/**
 * API Key
 */
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * API Key with secret (only returned on creation)
 */
export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
}

/**
 * Create API key request
 */
export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expires_at?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    has_more: boolean;
    next_cursor?: string;
    total?: number;
  };
}

/**
 * API success response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    request_id: string;
    timestamp: string;
  };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    request_id: string;
    timestamp: string;
  };
}

/**
 * Usage statistics
 */
export interface UsageStats {
  period: {
    start: string;
    end: string;
  };
  plan: {
    id: string;
    name: string;
  };
  usage: {
    tokens_processed: number;
    search_queries: number;
    api_requests: number;
    memories_stored: number;
    api_keys: number;
    projects: number;
    documents_stored_bytes: number;
  };
  limits: {
    tokens_processed: number;
    search_queries: number;
    memories_stored: number;
    api_keys: number;
    projects: number;
    documents_stored_bytes: number;
    rate_limit: number;
  };
  percentage: {
    tokens_processed: number;
    search_queries: number;
    memories_stored: number;
    api_keys: number;
    projects: number;
    documents_stored_bytes: number;
  };
}

/**
 * Daily usage
 */
export interface DailyUsage {
  date: string;
  tokens_processed: number;
  search_queries: number;
  api_requests: number;
}

/**
 * User
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  plan_id: string;
  created_at: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================
// ASK (RAG) Types
// ============================================

/**
 * Ask request (RAG-powered Q&A)
 */
export interface AskRequest {
  question: string;
  top_k?: number;
  threshold?: number;
  max_context_length?: number;
  max_output_tokens?: number;
  allow_general_answer?: boolean;
  filters?: {
    tags?: string[];
    source?: string;
  };
}

/**
 * Ask response
 */
export interface AskResponse {
  answer: string;
  citations: Array<{ id: string; snippet: string }>;
  context_chunks_used: number;
  search_time_ms: number;
  tokens_used: {
    embedding: number;
    completion: number;
    total: number;
  };
  embedding_cached: boolean;
}

// ============================================
// SOLVE Types
// ============================================

/**
 * File for solve context
 */
export interface SolveFile {
  path: string;
  content: string;
}

/**
 * Solve request
 */
export interface SolveRequest {
  problem: string;
  repo_context?: {
    files: SolveFile[];
  };
  constraints?: string[];
  include_patches?: boolean;
}

/**
 * Solve diagnosis
 */
export interface SolveDiagnosis {
  summary: string;
  likely_causes: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Solve fix step
 */
export interface SolveFixStep {
  step: number;
  action: string;
  rationale: string;
  file?: string;
}

/**
 * Solve patch
 */
export interface SolvePatch {
  file: string;
  diff: string;
  description: string;
}

/**
 * Solve response
 */
export interface SolveResponse {
  diagnosis: SolveDiagnosis;
  fix_plan: SolveFixStep[];
  patches?: SolvePatch[];
  warnings?: string[];
  recommendations?: string[];
  tokens_used: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ============================================
// SECURE REVIEW Types
// ============================================

/**
 * Artifact for security review
 */
export interface SecureReviewArtifact {
  name: string;
  content: string;
}

/**
 * Threat model for security review
 */
export interface ThreatModel {
  app_type?: 'web' | 'api' | 'mobile' | 'desktop' | 'embedded' | 'cli';
  auth?: 'none' | 'session' | 'jwt' | 'oauth' | 'api_key' | 'mtls';
  data?: 'public' | 'pii' | 'financial' | 'health' | 'classified';
  infra?: 'cloud' | 'on_prem' | 'hybrid' | 'serverless' | 'edge';
}

/**
 * Secure review request
 */
export interface SecureReviewRequest {
  target: 'code' | 'config';
  artifacts: SecureReviewArtifact[];
  threat_model?: ThreatModel;
  focus_areas?: string[];
}

/**
 * Security finding
 */
export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  location: string;
  evidence: string;
  fix: string;
  cwe_id?: string;
}

/**
 * Secure defaults checklist item
 */
export interface SecureDefaultsItem {
  item: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  note?: string;
}

/**
 * Secure review response
 */
export interface SecureReviewResponse {
  summary: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'secure';
  findings: SecurityFinding[];
  findings_count: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  secure_defaults_checklist: SecureDefaultsItem[];
  recommendations: string[];
  tokens_used: {
    prompt: number;
    completion: number;
    total: number;
  };
}
