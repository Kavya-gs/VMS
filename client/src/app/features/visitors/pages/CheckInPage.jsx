import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { visitorSchema } from "../../../../validations/visitorSchema";
import API from "../../../../services/api";

const CheckInPage = () => {

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(visitorSchema)
  });

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "visitor") {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        setValue("name", user.name);
        setValue("email", user.email);
      }
    }
  }, [setValue]);

  const role = localStorage.getItem("role");

  const onSubmit = async (data) => {
    try {
      await API.post("/visitors/checkin", data);
      alert("Visitor Checked In Successfully");
      reset();

    } catch (error) {
      console.error(error);
      alert("Error checking in visitor");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Visitor Check-In</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow rounded p-6 space-y-4"
      >

        {/* Name */}
        <div>
          <input
            type="text"
            placeholder="Visitor Name"
            {...register("name")}
            disabled={role === "visitor"}
            className="w-full border p-3 rounded"
          />
          <p className="text-red-500 text-sm">{errors.name?.message}</p>
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            disabled={role === "visitor"}
            className="w-full border p-3 rounded"
          />
          <p className="text-red-500 text-sm">{errors.email?.message}</p>
        </div>

        {/* Purpose */}
        <div>
          <input
            type="text"
            placeholder="Purpose of Visit"
            {...register("purpose")}
            className="w-full border p-3 rounded"
          />
          <p className="text-red-500 text-sm">{errors.purpose?.message}</p>
        </div>

        {/* Person To Meet */}
        <div>
          <input
            type="text"
            placeholder="Person To Meet"
            {...register("personToMeet")}
            className="w-full border p-3 rounded"
          />
          <p className="text-red-500 text-sm">
            {errors.personToMeet?.message}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          Check In Visitor
        </button>
      </form>
    </div>
  );
};

export default CheckInPage;