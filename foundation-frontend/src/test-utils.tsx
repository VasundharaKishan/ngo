import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { ReactElement } from 'react';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', routerProps, ...renderOptions }: AppRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {children}
        </MemoryRouter>
      </HelmetProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
