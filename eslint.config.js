import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // b64() usa Buffer como fallback SOLO para que sea testeable en Vitest
    // (Node); en el navegador nunca se ejecuta esa rama (usa window.btoa).
    files: ['src/services/api.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
