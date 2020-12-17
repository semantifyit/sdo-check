class GeneralVerificationReport {
    constructor(verificationResult, name, description, errors) {
        this["verificationResult"] = verificationResult;
        if (name !== null) {
            this["name"] = name;
        }
        if (description !== null) {
            this["description"] = description;
        }
        this["errors"] = errors;
    }
}

module.exports = GeneralVerificationReport;
/*
verificationResult = "Valid" | "ValidWithWarnings" | "Invalid"
name = string with a name/title for the validation
description = string explaining the validation result
errors = Array of Errors (can be from different @types)
See GeneralValidation.md
 */