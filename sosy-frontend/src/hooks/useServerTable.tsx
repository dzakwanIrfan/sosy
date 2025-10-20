'use client';

import { useState, useEffect, useCallback } from 'react';
import { SortingState, PaginationState, ColumnFiltersState, OnChangeFn } from '@tanstack/react-table';

export interface ServerTableState {
  pagination: PaginationState;
  sorting: SortingState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
}

export interface ServerTableResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface UseServerTableProps<T> {
  fetchData: (params: any) => Promise<ServerTableResponse<T>>;
  initialPageSize?: number;
}

export function useServerTable<T>({ 
  fetchData, 
  initialPageSize = 10 
}: UseServerTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [state, setState] = useState<ServerTableState>({
    pagination: {
      pageIndex: 0,
      pageSize: initialPageSize,
    },
    sorting: [],
    globalFilter: '',
    columnFilters: [],
  });

  const fetchServerData = useCallback(async () => {
    setLoading(true);
    try {
      // Convert table state to API params
      const params: any = {
        page: state.pagination.pageIndex + 1, // API uses 1-based pagination
        page_size: state.pagination.pageSize,
      };

      // Add search
      if (state.globalFilter) {
        params.search = state.globalFilter;
      }

      // Add sorting
      if (state.sorting.length > 0) {
        const sort = state.sorting[0];
        params.sort_by = sort.id;
        params.sort_order = sort.desc ? 'desc' : 'asc';
      }

      // Add column filters
      state.columnFilters.forEach(filter => {
        if (filter.value !== undefined && filter.value !== null) {
          if (Array.isArray(filter.value) && filter.value.length > 0) {
            // Handle faceted filters (multiple selection)
            if (filter.id === 'is_active' || filter.id === 'is_superuser') {
              // If only one value is selected, pass it as boolean
              if (filter.value.length === 1) {
                params[filter.id] = filter.value[0] === 'true';
              }
              // If multiple values selected, don't apply server-side filter (show all)
            } else if (filter.id === 'user_status') {
              // For WordPress users status filter
              if (filter.value.length === 1) {
                params[filter.id] = parseInt(filter.value[0]);
              }
            } else {
              // For other filters, pass array as-is or join them
              params[filter.id] = filter.value;
            }
          } else if (typeof filter.value === 'string' && filter.value.trim()) {
            params[filter.id] = filter.value;
          } else if (typeof filter.value === 'boolean') {
            params[filter.id] = filter.value;
          } else if (typeof filter.value === 'number') {
            params[filter.id] = filter.value;
          }
        }
      });

      console.info('Server table params:', params); // Debug log

      const response = await fetchData(params);
      
      setData(response.data);
      setTotalCount(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Failed to fetch server data:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [fetchData, state]);

  useEffect(() => {
    fetchServerData();
  }, [fetchServerData]);

  // Proper handler functions that match TanStack Table's OnChangeFn type
  const setPagination: OnChangeFn<PaginationState> = useCallback((updaterOrValue) => {
    setState(prev => ({
      ...prev,
      pagination: typeof updaterOrValue === 'function' 
        ? updaterOrValue(prev.pagination)
        : updaterOrValue
    }));
  }, []);

  const setSorting: OnChangeFn<SortingState> = useCallback((updaterOrValue) => {
    setState(prev => ({
      ...prev,
      sorting: typeof updaterOrValue === 'function'
        ? updaterOrValue(prev.sorting)
        : updaterOrValue
    }));
  }, []);

  const setGlobalFilter = useCallback((globalFilter: string) => {
    setState(prev => ({ 
      ...prev, 
      globalFilter,
      pagination: { ...prev.pagination, pageIndex: 0 } // Reset to first page on search
    }));
  }, []);

  const setColumnFilters: OnChangeFn<ColumnFiltersState> = useCallback((updaterOrValue) => {
    setState(prev => {
      const newColumnFilters = typeof updaterOrValue === 'function'
        ? updaterOrValue(prev.columnFilters)
        : updaterOrValue;
      
      return {
        ...prev,
        columnFilters: newColumnFilters,
        pagination: { ...prev.pagination, pageIndex: 0 } // Reset to first page on filter
      };
    });
  }, []);

  const refetch = useCallback(() => {
    fetchServerData();
  }, [fetchServerData]);

  return {
    data,
    loading,
    totalCount,
    totalPages,
    state,
    setPagination,
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    refetch,
  };
}