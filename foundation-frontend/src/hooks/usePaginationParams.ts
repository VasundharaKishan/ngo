import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface PaginationState {
  page: number;
  size: number;
  sort: string;
  q: string;
  status: string;
}

interface UsePaginationResult extends PaginationState {
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setSort: (sort: string) => void;
  setQuery: (q: string) => void;
  setStatus: (status: string) => void;
  reset: () => void;
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 25;
const DEFAULT_SORT = 'createdAt,desc';
const DEFAULT_STATUS = 'ALL';

/**
 * Custom hook for managing pagination state via URL query parameters
 */
export function usePaginationParams(): UsePaginationResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const [state, setState] = useState<PaginationState>(() => ({
    page: Number(searchParams.get('page')) || DEFAULT_PAGE,
    size: Number(searchParams.get('size')) || DEFAULT_SIZE,
    sort: searchParams.get('sort') || DEFAULT_SORT,
    q: searchParams.get('q') || '',
    status: searchParams.get('status') || DEFAULT_STATUS,
  }));

  useEffect(() => {
    const params = new URLSearchParams();
    if (state.page !== DEFAULT_PAGE) params.set('page', String(state.page));
    if (state.size !== DEFAULT_SIZE) params.set('size', String(state.size));
    if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort);
    if (state.q) params.set('q', state.q);
    if (state.status !== DEFAULT_STATUS) params.set('status', state.status);

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, state.size, state.sort, state.q, state.status]);

  const setPage = useCallback((page: number) => setState(prev => ({ ...prev, page })), []);
  const setSize = useCallback((size: number) => setState(prev => ({ ...prev, size, page: 0 })), []);
  const setSort = useCallback((sort: string) => setState(prev => ({ ...prev, sort, page: 0 })), []);
  const setQuery = useCallback((q: string) => setState(prev => ({ ...prev, q, page: 0 })), []);
  const setStatus = useCallback((status: string) => setState(prev => ({ ...prev, status, page: 0 })), []);
  
  const reset = useCallback(() => setState({
    page: DEFAULT_PAGE,
    size: DEFAULT_SIZE,
    sort: DEFAULT_SORT,
    q: '',
    status: DEFAULT_STATUS,
  }), []);

  return { ...state, setPage, setSize, setSort, setQuery, setStatus, reset };
}
