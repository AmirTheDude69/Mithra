import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './app/App';
import './styles/index.css';

const appId = import.meta.env.VITE_PRIVY_APP_ID;

createRoot(document.getElementById('root')!).render(
  <PrivyProvider
    appId={appId || 'missing-privy-app-id'}
    config={{
      loginMethods: ['google', 'github', 'wallet'],
      appearance: {
        theme: 'light',
        accentColor: '#1a3a5c',
      },
    }}
  >
    <App />
  </PrivyProvider>,
);
