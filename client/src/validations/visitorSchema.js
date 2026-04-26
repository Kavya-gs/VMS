import * as yup from "yup";

const parseDateValue = (value) => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === null || rawValue === undefined || rawValue === "" || rawValue === "null") {
    return null;
  }

  const date = new Date(rawValue);
  return isNaN(date.getTime()) ? null : date;
};

export const visitorSchema = yup.object({
  securityManual: yup.boolean().default(false),

  name: yup
    .string()
    .trim()
    .when("securityManual", (securityManual = false, schema) =>
      securityManual
        ? schema.required("Visitor name is required for manual check-in")
        : schema.notRequired()
    ),

  email: yup
    .string()
    .trim()
    .when("securityManual", (securityManual, schema) =>
      securityManual
        ? schema.email("Enter a valid email address").required("Visitor email is required for manual check-in")
        : schema.email("Enter a valid email address").notRequired()
    ),

  purpose: yup
    .string()
    .required("Purpose of visit is required"),

  personToMeet: yup
    .string()
    .trim()
    .required("Person to meet is required"),

  expectedCheckIn: yup
    .date()
    .nullable()
    .transform((value, originalValue) => parseDateValue(originalValue))
    .typeError("Expected check-in time is required")
    .required("Expected check-in time is required")
    .test(
      "future-check-in",
      "Expected check-in must be in the future",
      (value) => !value || value.getTime() > Date.now()
    ),

  expectedCheckOut: yup
    .date()
    .nullable()
    .transform((value, originalValue) => parseDateValue(originalValue))
    .typeError("Expected checkout time is required")
    .required("Expected checkout time is required")
    .when("expectedCheckIn", (expectedCheckIn, schema) => {
      const parsedCheckIn = parseDateValue(expectedCheckIn);
      return parsedCheckIn
        ? schema.min(parsedCheckIn, "Expected checkout must be after expected check-in")
        : schema;
    }),
});