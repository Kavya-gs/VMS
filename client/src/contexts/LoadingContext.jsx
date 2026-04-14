import { createContext, useState, useCallback } from "react";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const startLoading = useCallback(() => {
    setRequestCount((prev) => prev + 1);
    setLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setRequestCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setLoading(false);
      }
      return newCount;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
