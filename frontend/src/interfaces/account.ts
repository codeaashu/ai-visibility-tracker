export interface AccountInvite {
  id: number
  account_id: number
  email: string
  token: string
  invited_by: string
  created_at: string
  expires_at: string | null
  accepted_at: string | null
  accepted_by: string | null
}

