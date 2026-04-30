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

export interface LienRecord {
  id: string
  companyId: string
  amount: number
  status: 'pending' | 'active' | 'resolved'
  createdAt: Date
}

export interface PhotoAnalysis {
  id: string
  userId: string
  imageUrl: string
  analysisResult: Record<string, unknown>
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'payment' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  environment: string
  checks: {
    api: 'operational' | 'degraded' | 'down'
    database?: 'connected' | 'disconnected'
    stripe?: 'connected' | 'disconnected'
    supabase?: 'connected' | 'disconnected'
  }
}
