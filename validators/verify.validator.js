const { body } = require("express-validator");

/* =====================================================
   Verify Identity — Request Validation
====================================================== */

const verifyValidator = [
  body("identityType")
    .exists({ checkFalsy: true })
    .withMessage("Identity type is required")
    .isIn(["SAUDI", "RESIDENT"])
    .withMessage("Identity type must be SAUDI or RESIDENT"),

  body("identityNumber")
    .exists({ checkFalsy: true })
    .withMessage("Identity number is required")
    .isString()
    .withMessage("Identity number must be a string")
    .trim()
    .notEmpty()
    .withMessage("Identity number cannot be empty"),

  body("dateOfBirth")
    .exists({ checkFalsy: true })
    .withMessage("Date of birth is required")
    .isString()
    .withMessage("Date of birth must be a string")
    .trim()
    .notEmpty()
    .withMessage("Date of birth cannot be empty"),
];

module.exports = { verifyValidator };
