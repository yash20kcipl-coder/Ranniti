import store from '@/redux/store';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppRoutes from '@/routes/AppRoutes';
import { getThemeTokens } from '@/styles/theme';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

const ThemedToaster = () => {
  const { theme } = useTheme();
  const t = getThemeTokens(theme);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: t.surface,
          color: t.textPrimary,
          border: `1px solid ${t.border}`,
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          boxShadow: t.shadowRaised,
        },
      }}
    />
  );
};

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ThemedToaster />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

