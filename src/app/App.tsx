import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AppProvider } from './store/AppProvider';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(28, 28, 28, 0.15)',
            color: '#1c1c1c',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.0625rem',
            borderRadius: '0',
            boxShadow: 'none',
          },
        }}
      />
    </AppProvider>
  );
}