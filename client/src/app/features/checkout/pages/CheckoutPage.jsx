import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState(null);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const role = localStorage.getItem("role");
  const isPrivileged = role === "admin" || role === "security";

  const navigate = useNavigate();

const fetchVisitors = async () => {
  try {
    setLoading(true);
    const endpoint =
      role === "visitor" ? "/visitors/my-visits" : "/visitors";
      
    const res = await API.get(endpoint);
    // For visitors: show all their visits; for admin/security: show only approved & not checked out
    const filtered = role === "visitor" 
      ? res.data 
      : res.data.filter(v => v.status === "approved" && !v.checkOutTime);
    setVisitors(filtered);
  } catch (error) {
    console.error(error);
    toast.error("Failed to fetch visitors");
  } finally {
    setLoading(false);
  }
};

  const handleCheckout = async (id) => {
    setCheckingOutId(id);
    try {
      await API.put(`/visitors/checkout/${id}`);
      toast.success("Checkout successful!");
      fetchVisitors(); 
      navigate("/dashboard");
    } catch (error) {
      console.error("Checkout failed", error);
      const errorMessage = error.response?.data?.message || "Checkout failed";
      toast.error(errorMessage);
    } finally {
      setCheckingOutId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-center text-gray-500">No visits found</p>
      ) : (
        <>
          {/* Pending Checkouts */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Checkout</h2>
            {visitors.filter(v => v.status === "approved" && !v.checkOutTime).length > 0 ? (
              visitors.filter(v => v.status === "approved" && !v.checkOutTime).map((v) => {
                const expired = v.qrTokenExpiry && new Date() > new Date(v.qrTokenExpiry);
                const notActive = v.expectedCheckIn && new Date() < new Date(v.expectedCheckIn);

                return (
                  <div key={v._id} className="border bg-white p-4 mb-3 rounded-lg hover:shadow-md transition">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{v.name}</p>
                        <p className="text-sm text-gray-600">Purpose: {v.purpose}</p>
                        <p className="text-sm text-gray-600">Host: {v.personToMeet}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested check-in: {new Date(v.expectedCheckIn).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested checkout: {new Date(v.expectedCheckOut).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <button
                          onClick={() => handleCheckout(v._id)}
                          disabled={checkingOutId === v._id ||(!isPrivileged && (expired || notActive))}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold transition h-fit"
                        >
                          {checkingOutId === v._id ? "Checking out..." : "Checkout"}
                        </button>
                        {(expired || notActive) && (
                          <p className="text-xs text-gray-500">
                            {expired ? "QR expired — checkout blocked" : "QR not active yet"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 italic">No pending checkouts</p>
            )}
          </div>

          {/* Checkout History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Checkout History</h2>
            {visitors.filter(v => v.checkOutTime).length > 0 ? (
              <div className="space-y-2">
                {visitors.filter(v => v.checkOutTime).map((v) => (
                  <div key={v._id} className="border border-green-200 bg-green-50 p-3 rounded flex justify-between">
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-sm text-gray-600">{v.purpose}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Checked out: {new Date(v.checkOutTime).toLocaleDateString()} at {new Date(v.checkOutTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="text-green-600 font-medium h-fit">✓ Completed</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No checkout history</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;