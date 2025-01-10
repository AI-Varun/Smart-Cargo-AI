import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '../lib/utils'

export function useApi() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const api = {
    get: async (endpoint) => {
      const response = await axios.get(`${baseURL}${endpoint}`);
      return response.data;
    },

    post: async (endpoint, data) => {
      const response = await axios.post(`${baseURL}${endpoint}`, data);
      return response.data;
    },

    put: async (endpoint, data) => {
      const response = await axios.put(`${baseURL}${endpoint}`, data);
      return response.data;
    },

    delete: async (endpoint) => {
      const response = await axios.delete(`${baseURL}${endpoint}`);
      return response.data;
    }
  };

  return api;
}

// Legacy support for existing code
export function useApiQuery(endpoint, queryKey, options = {}) {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: () => fetchApi(`${baseURL}${endpoint}`),
    ...options,
  })
}

export function useApiMutation(endpoint, options = {}) {
  const queryClient = useQueryClient()
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  return useMutation({
    mutationFn: (data) => fetchApi(`${baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      // Invalidate relevant queries after mutation
      if (options.invalidateQueries) {
        queryClient.invalidateQueries(options.invalidateQueries)
      }
    },
    ...options,
  })
}