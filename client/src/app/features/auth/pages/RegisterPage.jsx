import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../../services/api";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "visitor",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", form);
      alert("Registered successfully");

      navigate("/"); 
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleRegister}
        className="p-6 bg-white shadow-md rounded w-80"
      >
        <h2 className="text-xl mb-4 text-center font-bold">Register</h2>

        <input
          name="name"
          placeholder="Name"
          className="border p-2 mb-3 w-full"
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 mb-3 w-full"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 mb-3 w-full"
          onChange={handleChange}
        />

        <button className="bg-green-500 text-white px-4 py-2 rounded w-full">
          Register
        </button>

        <p className="text-sm mt-3 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;