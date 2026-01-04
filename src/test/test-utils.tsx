import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/themes/ThemeContext';
import { CharacterBuilderProvider } from '@/contexts/CharacterBuilderContext';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface WrapperProps {
  children: React.ReactNode;
}

// Full provider wrapper for integration tests
function AllProviders({ children }: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <CharacterBuilderProvider>
            {children}
            <Toaster />
          </CharacterBuilderProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Theme-only wrapper for component tests
function ThemeWrapper({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Character builder wrapper for context tests
function CharacterBuilderWrapper({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CharacterBuilderProvider>
          {children}
        </CharacterBuilderProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Custom render function with all providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Render with theme only
const renderWithTheme = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ThemeWrapper, ...options });

// Render with character builder context
const renderWithCharacterBuilder = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: CharacterBuilderWrapper, ...options });

export * from '@testing-library/react';
export { 
  customRender as render, 
  renderWithTheme, 
  renderWithCharacterBuilder 
};
