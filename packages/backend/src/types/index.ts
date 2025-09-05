export interface AuthRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
}

export interface EmissionCreateDTO {
  site_id: string
  emission_type: string
  value: string
  unit: string
  timestamp: string
  reference_id?: string
}

export interface EmissionDTO extends EmissionCreateDTO {
  id: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Pagination {
  total: number
  page: number
  per_page: number
}

/**
 * Additional DTOs for M0 completeness (scaffolding)
 */

export interface SiteDTO {
  id: string
  name: string
  metadata?: unknown
  created_at: string
}

export interface AuditLogDTO {
  id: string
  user_id?: string
  action: string
  target_type: string
  target_id?: string
  diff?: unknown
  created_at: string
}

export interface CsvMappingDTO {
  id: string
  name: string
  mapping: unknown
  created_by?: string
  created_at: string
}

export interface UploadJobDTO {
  id: string
  user_id?: string
  file_url?: string
  status: string
  inserted_count?: number
  failed_count?: number
  error_file_url?: string
  created_at: string
  updated_at: string
}

export interface ReportDTO {
  id: string
  site_id: string
  period_from: string
  period_to: string
  format: string
  file_url?: string
  status: string
  created_at: string
}

export interface ErpConnectorDTO {
  id: string
  site_id: string
  type: string
  config: string
  last_sync_at?: string
  status: string
  created_at: string
}

/**
 * RBAC / Auth DTOs (Milestone 1)
 */
export interface PermissionDTO {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface RoleDTO {
  id: string
  name: string
  description?: string
  is_builtin: boolean
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface UserWithRolesDTO {
  id: string
  username: string
  roles: RoleDTO[]
  permissions: string[]
  created_at: string
}

export interface RefreshSessionDTO {
  id: string
  user_id: string
  expires_at: string
  revoked_at?: string
  created_at: string
}
