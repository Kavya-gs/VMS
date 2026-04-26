import { useState, useCallback, useRef } from "react";
import { LoadingContext } from "./loading-context";

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const requestCountRef = useRef(0);

  const startLoading = useCallback(() => {
    requestCountRef.current += 1;
    setLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    requestCountRef.current = Math.max(0, requestCountRef.current - 1);
    if (requestCountRef.current === 0) {
      setLoading(false);
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
