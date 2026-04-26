import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { visitorSchema } from "../../../../validations/visitorSchema";
import API from "../../../../services/api";
import { useAuth } from "../../../../contexts/useAuth";

const TimePickerInput = ({ value, onChange, disabled, isCheckInTime, checkInDate, checkInTime, todayDate, currentTime, isBefore }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState("AM");

  // Parse time value to hour/minute/period
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      const p = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      setHour(hour12);
      setMinute(m);
      setPeriod(p);
    }
  }, [value]);

  // Convert 12-hour format to 24-hour format and update
  const updateTime = (h, m, p) => {
    let hour24 = p === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    const timeStr = `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    
    // Check if time is disabled (in past)
    if (isCheckInTime && checkInDate === todayDate) {
      if (isBefore(timeStr, currentTime)) {
        return; // Don't allow past times
      }
    }
    
    onChange(timeStr);
  };

  const handleHourChange = (e) => {
    const newHour = Number(e.target.value);
    setHour(newHour);
    updateTime(newHour, minute, period);
  };

  const handleMinuteChange = (e) => {
    const newMinute = Number(e.target.value);
    setMinute(newMinute);
    updateTime(hour, newMinute, period);
  };

  const handlePeriodToggle = (newPeriod) => {
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Hour</label>
          <select
            value={hour}
            onChange={handleHourChange}
            disabled={disabled}
            className={`w-full rounded-lg border p-2 transition outline-none text-sm font-medium ${
              disabled
                ? "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                : "border-slate-300 bg-white focus:border-indigo-500"
            }`}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Minute</label>
          <select
            value={minute}
            onChange={handleMinuteChange}
            disabled={disabled}
            className={`w-full rounded-lg border p-2 transition outline-none text-sm font-medium ${
              disabled
                ? "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                : "border-slate-300 bg-white focus:border-indigo-500"
            }`}
          >
            {Array.from({ length: 60 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Period</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handlePeriodToggle("AM")}
              disabled={disabled}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                period === "AM"
                  ? "bg-indigo-500 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handlePeriodToggle("PM")}
              disabled={disabled}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                period === "PM"
                  ? "bg-indigo-500 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm font-medium text-slate-700 text-center bg-slate-50 rounded-lg p-2">
        {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")} {period}
      </div>
    </div>
  );
};

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);
  const [hasActiveVisit, setHasActiveVisit] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const { role, user } = useAuth();

  const securityManualCheckin = role === "security" || role === "admin";

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: yupResolver(visitorSchema),
    defaultValues: {
      name: "",
      email: "",
      purpose: "",
      personToMeet: "",
      expectedCheckIn: "",
      expectedCheckOut: "",
      securityManual: securityManualCheckin,
    },
  });

  const getFirstErrorMessage = () => {
    return (
      errors.name?.message ||
      errors.email?.message ||
      errors.purpose?.message ||
      errors.personToMeet?.message ||
      errors.expectedCheckIn?.message ||
      errors.expectedCheckOut?.message ||
      "Please complete the form before submitting."
    );
  }; 

  const handleCreateCheckinClick = async () => {
    if (loading) return;

    const valid = await trigger();

    if (!valid) {
      toast.error(getFirstErrorMessage());
      return;
    }

    handleSubmit(onSubmit)();
  };

  useEffect(() => {
    if (role !== "visitor") {
      return;
    }

    const checkActiveVisit = async () => {
      try {
        const res = await API.get("/visitors/my-visits");
        const active = res.data.find(
          (v) => v.status === "approved" && v.checkInTime && !v.checkOutTime
        );

        setHasActiveVisit(Boolean(active));

        if (active) {
          toast.dismiss();
          toast.error("Active visit found. Please checkout before new check-in.");
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkActiveVisit();
  }, [role]);

  const navigate = useNavigate();

  const pad = (value) => String(value).padStart(2, "0");

  const getLocalDateString = (date = new Date()) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const getLocalTimeString = (date = new Date()) => {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getCurrentTimePlusBuffer = (minutes = 2) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const setCheckInNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2);
    const nowDate = getLocalDateString(now);
    const nowTime = getLocalTimeString(now);

    setCheckInDate(nowDate);
    setCheckInTime(nowTime);
    updateCheckIn(nowDate, nowTime);
  };

  const todayDate = getLocalDateString();
  const currentTime = getCurrentTimePlusBuffer();

  const composeDateTime = (date, time) => {
    if (!date || !time) return "";
    return `${date}T${time}`;
  };

  const updateCheckIn = (nextDate, nextTime) => {
    setValue("expectedCheckIn", composeDateTime(nextDate, nextTime), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateCheckOut = (nextDate, nextTime) => {
    setValue("expectedCheckOut", composeDateTime(nextDate, nextTime), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const isBefore = (timeA, timeB) => {
    if (!timeA || !timeB) return false;
    return timeA < timeB;
  };

  const onSubmit = async (data) => {
    if (hasActiveVisit) {
      toast.error("Please checkout your previous visit first");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/visitors/checkin", data);
      if (role === "security") {
        toast.success(
          "Visitor created. Credentials and OTP were sent to the visitor. Capture photo next to generate the ID card and appointment email."
        );
        navigate(`/visitor-card/${response.data._id}`);
        return;
      }

      toast.success("Applied for Check-In Successfully!");

      reset({
        purpose: "",
        personToMeet: "",
        expectedCheckIn: "",
        expectedCheckOut: "",
      });

      setCheckInDate("");
      setCheckInTime("");
      setCheckOutDate("");
      setCheckOutTime("");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error checking in visitor";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Visitor Check-In</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit your visit details. Date and time must be in the future.
        </p>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg space-y-5"
      >
        {securityManualCheckin && (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700">Visitor Name</label>
              <input
                type="text"
                placeholder="Visitor Name"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
                className={`mt-1 w-full rounded-xl border p-3 transition outline-none ${errors.name ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
              />
              <p className="text-rose-600 text-sm mt-1">{errors.name?.message || ""}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Visitor Email</label>
              <input
                type="email"
                placeholder="Visitor Email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                className={`mt-1 w-full rounded-xl border p-3 transition outline-none ${errors.email ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
              />
              <p className="text-rose-600 text-sm mt-1">{errors.email?.message || ""}</p>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700">Purpose of Visit</label>
          <input
            type="text"
            placeholder="Purpose of Visit"
            {...register("purpose")}
            aria-invalid={errors.purpose ? "true" : "false"}
            className={`mt-1 w-full rounded-xl border p-3 transition outline-none ${errors.purpose ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.purpose?.message || ""}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Person To Meet</label>
          <input
            type="text"
            placeholder="Person To Meet"
            {...register("personToMeet")}
            aria-invalid={errors.personToMeet ? "true" : "false"}
            className={`mt-1 w-full rounded-xl border p-3 transition outline-none ${errors.personToMeet ? "border-rose-500 bg-rose-50 focus:border-rose-500" : "border-slate-300 focus:border-indigo-500 bg-white"}`}
          />
          <p className="text-rose-600 text-sm mt-1">{errors.personToMeet?.message || ""}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Schedule</p>
          <input type="hidden" {...register("expectedCheckIn")} />
          <input type="hidden" {...register("expectedCheckOut")} />

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <label className="text-sm font-medium text-slate-700">Expected Check-In</label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={checkInDate}
                    min={todayDate}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      setCheckInDate(nextDate);
                      updateCheckIn(nextDate, checkInTime);

                      if (checkOutDate && nextDate && checkOutDate < nextDate) {
                        setCheckOutDate("");
                        setCheckOutTime("");
                        updateCheckOut("", "");
                      }

                      if (checkOutDate === nextDate && checkOutTime && checkInTime && isBefore(checkOutTime, checkInTime)) {
                        setCheckOutTime("");
                        updateCheckOut(checkOutDate, "");
                      }
                    }}
                    aria-invalid={errors.expectedCheckIn ? "true" : "false"}
                    className={`w-full rounded-xl border p-3 transition outline-none ${errors.expectedCheckIn ? "border-rose-500 bg-rose-50" : "border-slate-300"}`}
                  />
                  <button
                    type="button"
                    onClick={setCheckInNow}
                    className="min-w-[88px] rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm font-semibold transition hover:bg-slate-200"
                  >
                    Now
                  </button>
                </div>
                <TimePickerInput
                  value={checkInTime}
                  onChange={(nextTime) => {
                    setCheckInTime(nextTime);
                    updateCheckIn(checkInDate, nextTime);

                    if (checkOutDate === checkInDate && checkOutTime && isBefore(checkOutTime, nextTime)) {
                      setCheckOutTime("");
                      updateCheckOut(checkOutDate, "");
                    }
                  }}
                  isCheckInTime={true}
                  checkInDate={checkInDate}
                  checkInTime={checkInTime}
                  todayDate={todayDate}
                  currentTime={currentTime}
                  isBefore={isBefore}
                />
              </div>
              <p className="text-rose-600 text-sm mt-1">{errors.expectedCheckIn?.message || ""}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <label className="text-sm font-medium text-slate-700">Expected Checkout</label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate || todayDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setCheckOutDate(nextDate);
                    updateCheckOut(nextDate, checkOutTime);

                    if (nextDate === checkInDate && checkOutTime && checkInTime && isBefore(checkOutTime, checkInTime)) {
                      setCheckOutTime("");
                      updateCheckOut(nextDate, "");
                    }
                  }}
                  aria-invalid={errors.expectedCheckOut ? "true" : "false"}
                  className={`w-full rounded-xl border p-3 transition outline-none ${errors.expectedCheckOut ? "border-rose-500 bg-rose-50" : "border-slate-300"}`}
                />
                <TimePickerInput
                  value={checkOutTime}
                  onChange={(nextTime) => {
                    setCheckOutTime(nextTime);
                    updateCheckOut(checkOutDate, nextTime);
                  }}
                  isCheckInTime={false}
                  checkInDate={checkInDate}
                  checkInTime={checkInTime}
                  todayDate={todayDate}
                  currentTime={currentTime}
                  isBefore={isBefore}
                />
              </div>
              <p className="text-rose-600 text-sm mt-1">{errors.expectedCheckOut?.message || ""}</p>
            </div>
          </div>
        </div>

        {role === "visitor" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Requester:</span> {user?.name || "Current user"}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreateCheckinClick}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-3 rounded-xl font-semibold transition"
        >
          {loading ? "Checking In..." : role === "security" ? "Create and Approve Check-In" : "Submit Check-In Request"}
        </button>
      </form>
    </div>
  );
};

export default CheckInPage;