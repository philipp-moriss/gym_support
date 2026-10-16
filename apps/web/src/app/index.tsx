import { RouterProvider } from 'react-router'
import { AppProviders } from './providers/app-providers'
import { router } from './router/router'
import './styles/index.css'

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
