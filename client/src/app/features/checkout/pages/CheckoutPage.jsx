import { useEffect, useState } from "react";
import API from "../../../../services/api";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const role = localStorage.getItem("role");

  const navigate = useNavigate();

const fetchVisitors = async () => {
  try {
    const endpoint =
      role === "visitor" ? "/visitors/my-visits" : "/visitors";
      
    const res = await API.get(endpoint);
    setVisitors(res.data);
  } catch (error) {
    console.error(error);
  }
};

  const handleCheckout = async (id) => {
    try {
      await API.put(`/visitors/checkout/${id}`);
      fetchVisitors(); 
      navigate("/dashboard");
    } catch (error) {
      console.error("Checkout failed", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      {visitors.map((v) => (
        <div key={v._id} className="border p-3 mb-2 flex justify-between">
          <div>
            <p>{v.name}</p>
            <p className="text-sm text-gray-500">{v.purpose}</p>
            {v.checkOutTime && (
              <p className="text-sm text-green-600 mt-1">
                Checked out on:{" "}
                {new Date(v.checkOutTime).toLocaleDateString()} at{" "}
                {new Date(v.checkOutTime).toLocaleTimeString()}
              </p>
            )}
          </div>

          {!v.checkOutTime ? (
            <button
              onClick={() => handleCheckout(v._id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Checkout
            </button>
          ) : (
            <span className="text-green-600 font-medium">Completed</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CheckoutPage;