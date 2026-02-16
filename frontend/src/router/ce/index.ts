import { createRouter, createWebHistory } from "vue-router";
export { handleNavigation } from "./nav-guard"

export const router = createRouter({
    history: createWebHistory('/'),
    routes: [
        {
            path: '/',
            name: 'landing',
            component: () => import('@/views/LandingView.vue')
        },
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeLayout.vue'),
            children: [
                {
                    path: 'companies',
                    name: 'companies',
                    component: () => import('@/views/CompaniesView.vue')
                },
                {
                    path: 'companies/form/:id',
                    name: 'company-form',
                    component: () => import('@/views/CompanyFormView.vue'),
                    props: route => ({id: route.params.id === 'new' ? 'new' : +route.params.id})
                },
                {
                    path: 'onboarding',
                    name: 'onboarding',
                    component: () => import('@/views/OnboardingWizardView.vue'),
                },
                {
                    path: 'company/:id/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/DashboardView.vue'),
                    props: route => ({id: +route.params.id})
                },
                {
                    path: 'company/:id/details',
                    name: 'company',
                    component: () => import('@/views/CompanyFormView.vue'),
                    props: route => ({id: +route.params.id})
                },
                {
                    path: 'company/:id/prompts',
                    name: 'prompts',
                    component: () => import('@/views/PromptMonitoringView.vue'),
                    props: route => ({id: +route.params.id})
                },
                {
                    path: 'company/:id/recommendations',
                    name: 'recommendations',
                    component: () => import('@/views/RecommendationsView.vue'),
                    props: route => ({id: +route.params.id})
                },
                {
                    path: 'company/:id/recommendations/:recId',
                    name: 'recommendation-details',
                    component: () => import('@/views/RecommendationDetailsView.vue'),
                    props: route => ({companyId: +route.params.id, recId: +route.params.recId})
                },
                {
                    path: 'company/:id/prompts/:promptId',
                    name: 'prompt-details',
                    component: () => import('@/views/PromptDetailsView.vue'),
                    props: route => ({companyId: +route.params.id, promptId: +route.params.promptId})
                }
            ]
        }
    ]
})