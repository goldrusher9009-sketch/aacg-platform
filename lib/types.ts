export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export interface Company {
  id: string
  name: string
  userId: string
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  company_id: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at?: string
}

export interface MechanicsLien {
  id: string
  project_id: string
  company_id: string
  contractor_id: string
  property_address: string
  lien_amount: number
  status: 'draft' | 'filed' | 'satisfied' | 'expired' | 'disputed'
  filing_date: string
  expiration_date?: string
  description?: string
  created_at: string
  updated_at?: string
}

export interface LienRecord {
  id: string
  companyId: string
  amount: number
  status: 'pending' | 'active' | 'resolved'
  createdAt: Date
}

export interface PhotoAnalysis {
  id: string
  project_id: string
  photo_url: string
  analysis_type: 'damage' | 'progress' | 'compliance' | 'safety'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_results?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface Transaction {
  id: string
  companyId: string
  amount: number
  type: string
  status: string
  createdAt: Date
}

export interface HealthCheckResponse {
  status: 'ok' | 'error'
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
  }
  meta?: {
    timestamp: string
    request_id?: string
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta?: {
    timestamp: string
    request_id?: string
  }
}
