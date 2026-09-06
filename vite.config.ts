import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isUserOrOrgSite = repositoryName?.toLowerCase().endsWith('.github.io')
const pagesBase = process.env.GITHUB_ACTIONS === 'true' && repositoryName && !isUserOrOrgSite
  ? `/${repositoryName}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
})
