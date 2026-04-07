import * as yup from "yup";

export const visitorSchema = yup.object({
  name: yup
    .string()
    .required("Visitor name is required"),

  email: yup
    .string()
    .email("Invalid email")
    .required("Email is required"),

  purpose: yup
    .string()
    .required("Purpose of visit is required"),

  personToMeet: yup
    .string()
    .required("Person to meet is required"),

  expectedCheckIn: yup
    .date()
    .transform((value, originalValue) => (originalValue ? new Date(originalValue) : null))
    .typeError("Expected check-in time is required")
    .required("Expected check-in time is required")
    .min(new Date(), "Expected check-in must be in the future"),

  expectedCheckOut: yup
    .date()
    .transform((value, originalValue) => (originalValue ? new Date(originalValue) : null))
    .typeError("Expected checkout time is required")
    .required("Expected checkout time is required")
    .when("expectedCheckIn", (expectedCheckIn, schema) =>
      expectedCheckIn
        ? schema.min(expectedCheckIn, "Expected checkout must be after expected check-in")
        : schema
    ),
});