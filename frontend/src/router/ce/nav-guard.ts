import { useCompanyStore } from "@/stores/company"

export async function handleNavigation(to: any, _: any, next: any) {
  const companyStore = useCompanyStore()
  if (companyStore.companies.length === 0) {
    await companyStore.actionLoadCompanies()
  }
  if (companyStore.companies.length === 0 && to.name !== 'onboarding') {
    next({ name: 'onboarding' })
  } else {
    next()
  }
}
