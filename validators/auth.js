const yup = require("yup");

const sentOtpValidator = yup.object({
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      "Phone number is not valid"
    ),
});

const otpVerifyValidator = yup.object({
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      "Phone number is not valid"
    ),

  otp: yup
    .string()
    .required("Otp code is required")
    .matches(/^[0-9]+$/, "Otp code is not valid"),

  isSeller: yup.boolean().required(),
});

module.exports = { sentOtpValidator, otpVerifyValidator };
