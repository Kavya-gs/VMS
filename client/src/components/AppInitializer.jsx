import { useEffect } from 'react';
import { useLoading } from '../contexts/useLoading';
import { setLoadingContext } from '../services/api';

const AppInitializer = ({ children }) => {
  const loadingContext = useLoading();

  useEffect(() => {
    setLoadingContext(loadingContext);
  }, [loadingContext]);

  return children;
};

export default AppInitializer;
