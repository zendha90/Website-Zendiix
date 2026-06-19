import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../services';
import { Product, Sale, IncomingGood } from '../services';

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetchApi('/api/products'),
    refetchInterval: 60000,
  });
};

export const useSales = () => {
  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => fetchApi('/api/sales'),
    refetchInterval: 60000,
  });
};

export const useIncomingGoods = () => {
  return useQuery<IncomingGood[]>({
    queryKey: ['incoming-goods'],
    queryFn: () => fetchApi('/api/incoming-goods'),
    refetchInterval: 60000,
  });
};
