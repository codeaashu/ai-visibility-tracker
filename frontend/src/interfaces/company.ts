export interface Company {
    id: number
    account_id: number
    name: string
    description: string
    name_aliases: string | null
    website: string
    llm_understanding: string
    is_placeholder?: boolean
    created_at: Date | string
    updated_at: Date | string
    products?: string
}


export type CompanyConfig = Omit<Company, 'id' | 'account_id' | 'created_at' | 'updated_at' | 'llm_understanding'>