import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { visitorSchema } from "../../../../validations/visitorSchema";
import API from "../../../../services/api";

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);
  const [userData, setUserData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: yupResolver(visitorSchema),
  });

  // useEffect(() => {
  //   const role = localStorage.getItem("role");
  //   if (role === "visitor") {
  //     const user = JSON.parse(localStorage.getItem("user"));
  //     if (user) {
  //       setValue("name", user.name);
  //       setValue("email", user.email);
  //     }
  //   }
  // }, [setValue]);
  useEffect(() => {
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("ROLE:", role);
  console.log("USER:", user);

  if (role === "visitor" && user) {
    setUserData(user);

    setValue("name", user.name);
    setValue("email", user.email);
  }
}, [setValue]);

  useEffect(() => {
  const checkActiveVisit = async () => {
    try {
      const res = await API.get("/visitors/my-visits");

      const active = res.data.find(
        (v) =>
          v.status === "approved" &&
          v.checkInTime &&
          !v.checkOutTime
      );

      setHasActiveVisit(!!active);

      if (active) {
        toast.dismiss(); 
        toast.error("Active visit found. Please checkout before new check-in.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  checkActiveVisit();
}, []);

  const role = localStorage.getItem("role");

 
  const onSubmit = async (data) => {
  if (hasActiveVisit) {
    toast.error("Please checkout your previous visit first");
    return;
  }

  setLoading(true);
  try {
    await API.post("/visitors/checkin", data);
    toast.success("Visitor Checked In Successfully!");
    reset({
  name: userData?.name || "",
  email: userData?.email || "",
  purpose: "",
  personToMeet: "",
  expectedCheckIn: "",
  expectedCheckOut: "",
});
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Error checking in visitor";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
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
            aria-invalid={errors.name ? "true" : "false"}
            className={`w-full rounded border p-3 transition ${errors.name ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.name?.message || ""}</p>
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            disabled={role === "visitor"}
            aria-invalid={errors.email ? "true" : "false"}
            className={`w-full rounded border p-3 transition ${errors.email ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.email?.message || ""}</p>
        </div>

        {/* Purpose */}
        <div>
          <input
            type="text"
            placeholder="Purpose of Visit"
            {...register("purpose")}
            aria-invalid={errors.purpose ? "true" : "false"}
            className={`w-full rounded border p-3 transition ${errors.purpose ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.purpose?.message || ""}</p>
        </div>

        {/* Person To Meet */}
        <div>
          <input
            type="text"
            placeholder="Person To Meet"
            {...register("personToMeet")}
            aria-invalid={errors.personToMeet ? "true" : "false"}
            className={`w-full rounded border p-3 transition ${errors.personToMeet ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.personToMeet?.message || ""}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Expected Check-In</label>
            <input
              type="datetime-local"
              {...register("expectedCheckIn")}
              aria-invalid={errors.expectedCheckIn ? "true" : "false"}
              className={`w-full rounded border p-3 transition ${errors.expectedCheckIn ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
            />
            <p className="text-rose-600 text-sm mt-1">{errors.expectedCheckIn?.message || ""}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Expected Checkout</label>
            <input
              type="datetime-local"
              {...register("expectedCheckOut")}
              aria-invalid={errors.expectedCheckOut ? "true" : "false"}
              className={`w-full rounded border p-3 transition ${errors.expectedCheckOut ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
            />
            <p className="text-rose-600 text-sm mt-1">{errors.expectedCheckOut?.message || ""}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded font-semibold transition"
        >
          {loading ? "Checking In..." : "Check In Visitor"}
        </button>
      </form>
    </div>
  );
};

export default CheckInPage;