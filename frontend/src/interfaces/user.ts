

export interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    blocked_at: Date | null
    blocked_until: Date | null
    block_reason: string | null
    blocked_by: string | null
}