import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/useAuth";

const CheckoutPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState(null);
  const { role, authLoading } = useAuth();

  const navigate = useNavigate();

  const isPrivileged = role === "admin" || role === "security";

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = role === "visitor" ? "/visitors/my-visits" : "/visitors";

      const res = await API.get(endpoint, { showLoader: false });
      const filtered =
        role === "visitor"
          ? res.data
          : res.data.filter((v) => {
              if (v.checkOutTime) return false;

              const isCheckoutRequested = v.status === "checkout-requested";
              const isQrExpired =
                v.status === "approved" &&
                Boolean(v.qrTokenExpiry) &&
                new Date() > new Date(v.qrTokenExpiry);

              return isCheckoutRequested || isQrExpired;
            });
      setVisitors(filtered);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch visitors");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!authLoading && role) {
      fetchVisitors();
    }
  }, [authLoading, role, fetchVisitors]);

  const handleCheckout = async (id) => {
    setCheckingOutId(id);
    try {
      if (role === "visitor") {
        await API.post(`/visitors/request-checkout/${id}`);
        toast.success("Checkout request sent for security approval!");
      } else {
        await API.put(`/visitors/checkout/${id}`);
        toast.success("Checkout approved by security!");
      }
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
    <div className="p-2 sm:p-4 md:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Checkout</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : visitors.length === 0 ? (
        <p className="text-center text-gray-500">No visits found</p>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Checkout</h2>
            {visitors.filter((v) => !v.checkOutTime).length > 0 ? (
              visitors.filter((v) => !v.checkOutTime).map((v) => {
                const expired = v.qrTokenExpiry && new Date() > new Date(v.qrTokenExpiry);
                const notActive = v.expectedCheckIn && new Date() < new Date(v.expectedCheckIn);
                const hostName = v.hostName || v.personToMeet || "Unassigned";
                const isCheckoutRequested = v.status === "checkout-requested";
                const eligibleForSecurity = isCheckoutRequested || expired;

                return (
                  <div key={v._id} className="border bg-white p-4 mb-3 rounded-lg hover:shadow-md transition">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{v.name}</p>
                        <p className="text-sm text-gray-600">Purpose: {v.purpose}</p>
                        <p className="text-sm text-gray-600">Host: {hostName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested check-in: {new Date(v.expectedCheckIn).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested checkout: {new Date(v.expectedCheckOut).toLocaleString()}
                        </p>
                        {isPrivileged && (
                          <p className="text-xs mt-1 text-gray-500">
                            {isCheckoutRequested
                              ? "Eligible: User requested checkout"
                              : expired
                              ? "Eligible: QR expired"
                              : "Not eligible for security checkout"}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <button
                          onClick={() => handleCheckout(v._id)}
                          disabled={
                            checkingOutId === v._id ||
                            (isPrivileged
                              ? !eligibleForSecurity
                              : notActive || isCheckoutRequested)
                          }
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold transition h-fit"
                        >
                          {checkingOutId === v._id
                            ? "Processing..."
                            : isPrivileged
                            ? "Approve Checkout"
                            : isCheckoutRequested
                            ? "Request Sent"
                            : "Request Checkout"}
                        </button>
                        {(expired || notActive || isCheckoutRequested) && (
                          <p className="text-xs text-gray-500">
                            {isCheckoutRequested
                              ? "Waiting for security approval"
                              : expired
                              ? isPrivileged
                                ? "QR expired — approval allowed"
                                : "QR expired — waiting for security"
                              : "QR not active yet"}
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

          <div>
            <h2 className="text-xl font-semibold mb-4">Checkout History</h2>
            {visitors.filter((v) => v.checkOutTime).length > 0 ? (
              <div className="space-y-2">
                {visitors.filter((v) => v.checkOutTime).map((v) => (
                  <div key={v._id} className="border border-green-200 bg-green-50 p-3 rounded flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-sm text-gray-600">{v.purpose}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Checked out: {new Date(v.checkOutTime).toLocaleDateString()} at{" "}
                        {new Date(v.checkOutTime).toLocaleTimeString()}
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