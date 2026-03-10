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
    .required("Person to meet is required")
});