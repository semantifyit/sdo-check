class ErrorEntry {
    constructor(type, severity, errorCode, name, description, dsPath, annotationPath, value = undefined) {
        this["@type"] = type;
        this["severity"] = severity;
        this["errorCode"] = errorCode;
        if (name !== null) {
            this["name"] = name;
        }
        if (description !== null) {
            this["description"] = description;
        }
        if (dsPath !== null) {
            this["dsPath"] = dsPath;
        }
        if (annotationPath !== null) {
            this["annotationPath"] = annotationPath;
        }
        if (value) {
            this["value"] = value;
        }
    }
}

module.exports = ErrorEntry;

/*
@type:  AnnotationError | DSMetaError | ComplianceError | ExecutionError | JsonError | JsonLdError
severity: Informational | Warning | Error | Critical
errorCode: 3 integers
name: name for the error (can be related to the errorCode)
description: description about the error
dsPath: string indicating the path within the DS where the error occurred
dataPath: string pointing to the Type where the error occurred
value: based on sh:value, this will point to the exact error source (Term/Value that caused the error) - If used, it must be a literal

paths are arrays to easier travers over them and differentiate between "steps" which may include MTEs
e.g. https://docs.google.com/spreadsheets/d/144iAPlBpjFS4WF1-czwmiIo9IFQNtqH2JPrxiJdKuFM/edit#gid=0
 */