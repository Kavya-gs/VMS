import { useLoading } from "../contexts/useLoading";
import { CircularProgress } from "@mui/material";

const GlobalLoader = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-8 shadow-2xl">
        <CircularProgress size={40} />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default GlobalLoader;
