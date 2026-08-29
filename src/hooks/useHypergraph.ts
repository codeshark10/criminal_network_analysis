import { useState, useEffect } from 'react';
import { getHypergraph } from '../services/apiClient';
import type { HypergraphResponse } from '../services/apiClient';

export function useHypergraph(caseId: string) {
  const [data, setData] = useState<HypergraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!caseId) return;

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const response = await getHypergraph(caseId);
        if (isMounted) {
          setData(response);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  return { data, isLoading, isError, error };
}
