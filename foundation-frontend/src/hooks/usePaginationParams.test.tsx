import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { usePaginationParams } from './usePaginationParams';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/admin/users?page=2&size=20&sort=name,asc&q=test&status=ACTIVE']}>
    {children}
  </MemoryRouter>
);

describe('usePaginationParams', () => {
  it('reads initial state from query params', () => {
    const { result } = renderHook(() => usePaginationParams(), { wrapper });
    expect(result.current.page).toBe(2);
    expect(result.current.size).toBe(20);
    expect(result.current.sort).toBe('name,asc');
    expect(result.current.q).toBe('test');
    expect(result.current.status).toBe('ACTIVE');
  });

  it('updates page/size/sort/query/status and resets', () => {
    const { result } = renderHook(() => usePaginationParams(), { wrapper });

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setSize(50));
    act(() => result.current.setSort('createdAt,desc'));
    act(() => result.current.setQuery('new'));
    act(() => result.current.setStatus('INACTIVE'));

    expect(result.current.page).toBe(0); // setSize resets page to 0
    expect(result.current.size).toBe(50);
    expect(result.current.sort).toBe('createdAt,desc');
    expect(result.current.q).toBe('new');
    expect(result.current.status).toBe('INACTIVE');

    act(() => result.current.reset());
    expect(result.current.page).toBe(0);
    expect(result.current.size).toBe(25);
    expect(result.current.sort).toBe('createdAt,desc');
    expect(result.current.q).toBe('');
    expect(result.current.status).toBe('ALL');
  });
});
