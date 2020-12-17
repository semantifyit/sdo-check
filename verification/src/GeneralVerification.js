const generalVerificationReport = require("./constructors/GeneralVerificationReport");
const ErrorEntry = require("./constructors/ErrorEntry");
const VUT = require("./VerificationUtilities");
//const SDOAdapter = require('schema-org-adapter'); // We dont add the SDO Adapter in this bundle, since the frontend will load the SDO Adapter anyway. Since the resulting bundle is supposed to be used together with the SDO check tool.
const jsonld = require('jsonld');
let sdoAdapter_genVal;
let classesURIList;
let propertiesURIList;
let dataTypeURIList;
let enumerationsURIList;

// AnnotationPath has following format:
// $ stands for the root
// Schema:address stands for a property from the standard SDO vocab
// 1 stands for the value index for a property(array)
// . is a delimiter between a class and its property, e.g.  "$.schema:address"
// / is a delimiter between a property and its range, e.g.  "$.schema:address/1"
// Ranges of properties are given as their array-index, starting from 0. If there is no array, then that value is referenced by 0.
// $.schema:address/0.schema:addressRegion/2

sdoAdapter_genVal = new SDOAdapter();
initSdoAdapter();

async function initSdoAdapter() {
    const urlLatestSDO = await sdoAdapter_genVal.constructSDOVocabularyURL('latest');
    await sdoAdapter_genVal.addVocabularies([urlLatestSDO]);
    classesURIList = sdoAdapter_genVal.getListOfClasses();
    propertiesURIList = sdoAdapter_genVal.getListOfProperties();
    dataTypeURIList = sdoAdapter_genVal.getListOfDataTypes();
    enumerationsURIList = sdoAdapter_genVal.getListOfEnumerations();
}

/**
 * Checks if a given Annotation is in compliance with the Schema.org vocabulary and its format specifications (JSON, JSON-LD)
 *
 * @param {object | string} inputAnnotation - the schema.org annotation to check
 * @returns {Promise<GeneralVerificationReport>} the resulting verification report
 */
async function isAnnotationValid(inputAnnotation) {
    let annotation;
    let errorReport = [];
    try {
        // 1. Lexical and Syntax analysis of annotation
        let lexCheck = lexicalCheckJSON(inputAnnotation, errorReport);
        if (lexCheck.outcome === false) {
            return new generalVerificationReport("Invalid", null, null, errorReport);
        } else {
            annotation = lexCheck.annotation;
        }
        // 2. Check @context
        if (!checkContext(annotation, errorReport)) {
            return new generalVerificationReport("Invalid", null, null, errorReport);
        }
        // 2.5 check null values (undefined, double nested arrays, null, invalid type definitions) {
        recursive_checkAnomalies(annotation, errorReport);
        // 3. Pre-process annotation, so it has a fixed structure we can work on (JSON-LD transformation)
        annotation = await preProcessAnnotation(annotation);
        // 4. Semantic analysis of annotation
        semanticCheckJSONLD(annotation, errorReport);
        // 5. SDO verification of annotation
        errorReport = recursive_sdo_isAnnotationValid(annotation, errorReport, "$");
        if (errorReport.length > 0) {
            let resultTitle = "ValidWithWarnings";
            let resultDesc = "The annotation is valid, but with warnings.";
            for (let i = 0; i < errorReport.length; i++) {
                if (errorReport[i].severity === "Error" || errorReport[i].severity === "Critical") {
                    resultTitle = "Invalid";
                    resultDesc = "The annotation is invalid.";
                    break;
                }
            }
            return new generalVerificationReport(resultTitle, null, resultDesc, errorReport);
        }
        // Everything correct
        return new generalVerificationReport("Valid", null, "The annotation is a valid JSON-LD.", errorReport);
    } catch
        (e) {
        console.log(e);
        if (e.name === "jsonld.InvalidUrl") {
            errorReport.push(new ErrorEntry("ExecutionError", "Critical", 999, "Execution Error", e.details.code + ": " + e.details.url + " - " + e.message, null, "$"));
        } else {
            errorReport.push(new ErrorEntry("ExecutionError", "Critical", 999, "Execution Error", "There was an error during the verification process, make sure the sent annotation has a valid serialization.", null, "$"));
        }
        return new generalVerificationReport("Invalid", null, "There was an execution error during the verification process, make sure the sent annotation has a valid serialization.", errorReport);
    }
}

// Checking the @context of the annotation for acceptable formats (for this tool)
// "@context" : "http://schema.org/" (IRI for schema.org)
// "@context" : {"@vocab": "http://schema.org/"} (Object for schema.org)
// "@context" : {"@vocab": "http://schema.org/", "XYZ": "http://additinalVocab.any"} (Object for schema.org and additional vocabularies)
// There are countless other valid @context variations, but we focus/allow only these for our tool
function checkContext(annotation, errorReport) {
    // Check if root Object of annotation has (valid) "@context"
    if (annotation["@context"] === undefined) {
        // 201 no context - If we do the preprocessing before this check (like it is now) we put a standard @context, so this error would not happen at all
        errorReport.push(new ErrorEntry("JsonLdError", "Critical", 201, "No @Context", "The annotation has no '@context' entry, as expected.", null, "$"));
        return false;
    } else {
        if (VUT.isString(annotation["@context"])) {
            if (/^(https?:\/\/)?(www.)?schema.org\/?$/.test(annotation["@context"]) === false) {
                // 301 non-conform context
                errorReport.push(new ErrorEntry("AnnotationError", "Critical", 301, "Non-conform @context", "The '@context' of the annotation has an incorrect value.", null, "$"));
            } else if (/^https?:\/\/schema.org\/$/.test(annotation["@context"]) === false) {
                // 300 warning -> should use http://schema.org/ as context
                errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Non-ideal @context", "The '@context' of schema.org annotations should be 'https://schema.org/'.", null, "$"));
            }
        } else if (VUT.isObject(annotation["@context"])) {
            // @vocab is allowed for standard context, which should be schema.org vocabulary
            let foundSdo = false;
            let foundError = false;
            if (annotation["@context"]["@vocab"]) {
                if (VUT.isString(annotation["@context"]["@vocab"])) {
                    if (/^(https?:\/\/)?(www.)?schema.org\/?$/.test(annotation["@context"]["@vocab"]) === false) {
                        // 301 non-conform context
                        errorReport.push(new ErrorEntry("AnnotationError", "Critical", 301, "Non-conform @context", "The '@context' of the annotation has an incorrect value.", null, "$"));
                        foundError = true;
                    } else if (/^https?:\/\/schema.org\/$/.test(annotation["@context"]["@vocab"]) === false) {
                        // 300 warning -> should use https://schema.org/ as context
                        errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Non-ideal @context", "The '@context' of schema.org annotations should be 'https://schema.org/'.", null, "$"));
                        foundError = true;
                    } else {
                        foundSdo = true;
                    }
                } else {
                    foundError = true;
                    errorReport.push(new ErrorEntry("JsonLdError", "Critical", 202, "Bad @context", "The '@context' of the annotation has a '@vocab' value that is not a String. This value should be a string referencing the schema.org vocabulary.", null, "$"));
                }
            }
            let contextKeys = Object.keys(annotation["@context"]);
            for (let i = 0; i < contextKeys.length; i++) {
                if (contextKeys[i] !== "@vocab") {
                    if (VUT.isString(annotation["@context"][contextKeys[i]])) {
                        if (/^https?:\/\/schema.org\/$/.test(annotation["@context"][contextKeys[i]]) === true) {
                            foundSdo = true;
                        } else if (/^(https?:\/\/)?(www.)?schema.org\/?$/.test(annotation["@context"][contextKeys[i]]) === true) {
                            errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Non-ideal @context", "The '@context' of schema.org annotations should be 'https://schema.org/'.", null, "$"));
                            foundError = true;
                            foundSdo = true;
                        }
                    } else {
                        foundError = true;
                        errorReport.push(new ErrorEntry("JsonLdError", "Critical", 202, "Bad @context", "The '@context' of the annotation has an invalid format.", null, "$"));
                    }
                }
            }
            if (!foundError && !foundSdo) {
                errorReport.push(new ErrorEntry("AnnotationError", "Critical", 301, "Non-conform @context", "The '@context' of the annotation does not contain the schema.org vocabulary.", null, "$"));
            }
        } else {
            // 202 bad context - should be removed actually, different syntax possibilities of @context should be allowed
            errorReport.push(new ErrorEntry("JsonLdError", "Critical", 202, "Bad @context", "The '@context' of the annotation has a value that is not a String or an Object.", null, "$"));
        }
    }
    return true;
}

/**
 *
 * @param {object } annotation - the schema.org annotation to check
 * @param {array} errorReport - the array holding all the errors found so far
 */
function semanticCheckJSONLD(annotation, errorReport) {
    // Check recursively if all objects in the annotation have (valid) @type
    // JSON-LD and JSON structure check
    if (annotation["@graph"] !== undefined) {
        recursive_semantic_isAnnotationValid(annotation["@graph"][0], errorReport, "$");
    } else {
        recursive_semantic_isAnnotationValid(annotation, errorReport, "$");
    }
}

/**
 * Executes the lexical check of the annotation
 * @param {object | string} annotation - the schema.org annotation to check
 * @param {array} errorReport - the array holding all the errors found so far
 * @returns {object} returns a result object, telling if an error was found, and the annotation as object. These are critical errors, so the verification process is supposed to end here, else an execution error may occur.
 */
function lexicalCheckJSON(annotation, errorReport) {
    let result = {
        outcome: true // Returns false if not valid
    };
    try {
        if (VUT.isString(annotation)) {
            result.annotation = JSON.parse(annotation);
        } else {
            result.annotation = JSON.parse(JSON.stringify(annotation)); // make hard copy to not change the original object
        }
    } catch (e) {
        errorReport.push(new ErrorEntry("JsonError", "Critical", 101, "Invalid JSON", "The input annotation can not be parsed to JSON.", null, null));
        result.outcome = false;
        return result;
    }
    if (VUT.isObject(result.annotation) && Object.keys(result.annotation).length === 0 || (Array.isArray(result.annotation) && result.annotation.length === 0) || result.annotation === undefined || result.annotation === null) {
        errorReport.push(new ErrorEntry("JsonError", "Critical", 102, "Empty JSON", "The input annotation is empty.", null, null));
        result.outcome = false;
    } else if (!VUT.isObject(result.annotation)) {
        errorReport.push(new ErrorEntry("JsonError", "Critical", 103, "No JSON Object", "The input annotation is not a JSON object, as required.", null, null));
        result.outcome = false;
    }
    return result;
}

let sdoURI = "http://schema.org/";

async function preProcessAnnotation(annotation) {
    // Set @context URI of schema.org to wished value, so that the standard context used for the JSONLD function does not "break" the annotation
    // By using "@vocab": "http://schema.org/" for the input and "schema": "http://schema.org/" for the output we avoid loading the schema.org context
    // (This is wished in order to avoid issues that could arise from loading and converting based on the context file)
    // But we should look into loading the context and try to catch all resulting unexpected transformations
    let globalStandardContext = {
        'schema': sdoURI
    };
    annotation = recursive_contextReplacement(annotation, globalStandardContext);
    // https://www.w3.org/TR/json-ld-api/#context-processing-algorithm
    annotation = await jsonld.compact(annotation, globalStandardContext);
    return annotation;
}

function recursive_contextReplacement(annotation, globalStandardContext) {
    if (VUT.isObject(annotation["@context"])) {
        let vocabKeys = Object.keys(annotation["@context"]);
        for (let i = 0; i < vocabKeys.length; i++) {
            if (/^(https?:\/\/)?(www.)?schema.org\/?$/.test(annotation["@context"][vocabKeys[i]]) === false && vocabKeys[i] !== "schema" && !globalStandardContext[vocabKeys[i]]) {
                globalStandardContext[vocabKeys[i]] = annotation["@context"][vocabKeys[i]];
            } else {
                // Here is the used schema.org URI, set it to the wished value
                annotation["@context"][vocabKeys[i]] = sdoURI;
            }
        }
    } else if (VUT.isString(annotation["@context"])) {
        // Only one context is given in the case of string
        annotation["@context"] = {'@vocab': sdoURI};
    }
    let properties = Object.keys(annotation);
    for (let i = 0; i < properties.length; i++) {
        if (!properties[i].startsWith("@")) {
            if (Array.isArray(annotation[properties[i]])) {
                for (let j = 0; j < annotation[properties[i]].length; j++) {
                    annotation[properties[i]][j] = recursive_contextReplacement(annotation[properties[i]][j], globalStandardContext);
                }
            } else if (VUT.isObject(annotation[properties[i]])) {
                annotation[properties[i]] = recursive_contextReplacement(annotation[properties[i]], globalStandardContext);
            }
        }
    }
    return annotation;
}

function recursive_sdo_isAnnotationValid(annotationObject, errorReport, path) {
    // Check keys of object, do recursion
    let properties = Object.keys(annotationObject);
    let annotationType = annotationObject["@type"]; // At this stage we already checked if there is an annotation type and if it has a valid type (string/array of strings)

    let propNotFound = true;
    for (let i = 0; i < properties.length; i++) {
        // Check if it is @type
        if (properties[i] === "@type") {
            // Check if its value is an Array (MultiTypeEntity) or a String (at this point it can only be one of those)
            let toCheck = [];
            if (Array.isArray(annotationObject[properties[i]])) {
                toCheck = annotationObject[properties[i]];
            } else {
                toCheck.push(annotationObject[properties[i]]);
            }
            for (let j = 0; j < toCheck.length; j++) {
                // Check if the value(s) is/are conform to schema.org
                if (checkIfValueIsValidSDOClass(toCheck[j]) === false) {
                    if (checkIfSDOClassHasBlankSpaces(toCheck[j]) === true) {
                        // 302 non-conform type
                        errorReport.push(new ErrorEntry("AnnotationError", "Error", 302, "Non-conform @type (blank space)", "The annotation has a @type entry with at least 1 blank space ('" + VUT.prettyPrintURIMTEs(toCheck[j]) + "') that is not conform to schema.org.", null, path + "." + properties[i] + "/" + j, toCheck[j]));
                    } else {
                        let badCase = checkIfSDOClassHasBadCase(toCheck[j]);
                        if (badCase !== false) {
                            // 302 non-conform type
                            errorReport.push(new ErrorEntry("AnnotationError", "Error", 302, "Non-conform @type (uppercase/lowercase)", "The annotation has a @type entry with an uppercase/lowercase error ('" + VUT.prettyPrintURIMTEs(toCheck[j]) + "' that should be '" + VUT.prettyPrintURIMTEs(badCase) + "').", null, path + "." + properties[i] + "/" + j, toCheck[j]));
                        } else {
                            let guess = checkIfValueIsWrongSpelledSDOClass(toCheck[j]);
                            if (guess === false) {
                                // 302 non-conform type
                                errorReport.push(new ErrorEntry("AnnotationError", "Error", 302, "Non-conform @type", "The annotation has a @type entry ('" + VUT.prettyPrintURIMTEs(toCheck[j]) + "') that is not conform to schema.org.", null, path + "." + properties[i] + "/" + j, toCheck[j]));
                            } else {
                                // 302 non-conform type
                                errorReport.push(new ErrorEntry("AnnotationError", "Error", 302, "Non-conform @type (misspell)", "The annotation has a wrong spelled @type entry ('" + VUT.prettyPrintURIMTEs(toCheck[j]) + "', could be one of the following: '" + guess + "') that is not conform to schema.org.", null, path + "." + properties[i] + "/" + j, toCheck[j]));
                            }
                        }
                    }
                }
            }
        } else if (properties[i] === "@id") {
            propNotFound = false; // We assume that this is a link, we cannot check the remote information
        } else if (properties[i].substring(0, 1) !== "@") {
            propNotFound = false; // At least one property is included
            // Check if the property is conform to schema.org
            if (checkIfValueIsValidSDOProperty(properties[i]) === false) {
                if (checkIfValueIsActionSDOProperty(properties[i]) === true) {
                    // The property is from the action expansion, value should be a string
                    // Todo check if type is an action
                    // Todo https://schema.org/docs/actions.html
                    if (VUT.isString(annotationObject[properties[i]]) === false) {
                        // 304 bad action property
                        errorReport.push(new ErrorEntry("AnnotationError", "Error", 304, "Misused Action", "The annotation has an action property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a value that is not a string.", null, path + "." + properties[i]));
                    }
                } else {
                    if (checkIfSDOPropertyHasBlankSpaces(properties[i]) === true) {
                        // 303 non-conform property
                        errorReport.push(new ErrorEntry("AnnotationError", "Error", 303, "Non-conform property (blank space)", "The annotation has a property entry with at least 1 blank space ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') that is not conform to schema.org.", null, path, properties[i]));
                    } else {
                        let badCaseProperty = checkIfSDOPropertyHasBadCase(properties[i]);
                        if (badCaseProperty !== false) {
                            // 303 non-conform property
                            errorReport.push(new ErrorEntry("AnnotationError", "Error", 303, "Non-conform property (uppercase/lowercase)", "The annotation has a property entry with an uppercase/lowercase error ('" + VUT.prettyPrintURIMTEs(properties[i]) + "' that should be '" + badCaseProperty + "').", null, path, properties[i]));
                        } else {
                            let guessProperty = checkIfValueIsWrongSpelledSDOProperty(properties[i]);
                            if (guessProperty === false) {
                                // 303 non-conform property
                                errorReport.push(new ErrorEntry("AnnotationError", "Error", 303, "Non-conform property", "The annotation has a property entry ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') that is not conform to schema.org.", null, path, properties[i]));
                            } else {
                                // 303 non-conform property
                                errorReport.push(new ErrorEntry("AnnotationError", "Error", 303, "Non-conform property (misspell)", "The annotation has a wrong spelled property entry ('" + VUT.prettyPrintURIMTEs(properties[i]) + "' that could be one of the following: '" + guessProperty + "').", null, path, properties[i]));
                            }
                        }
                    }
                }
            } else {
                // Check if property has the actual type as domain
                if (annotationType !== undefined) {
                    let isLegitProperty = false;
                    let toCheck = [];
                    if (Array.isArray(annotationType)) {
                        toCheck = annotationType;
                    } else {
                        toCheck.push(annotationType);
                    }
                    let areAllTypesValid = true;
                    for (let j = 0; j < toCheck.length; j++) {
                        if (checkIfValueIsValidSDOClass(toCheck[j]) === false) {
                            areAllTypesValid = false;
                            break;
                        }
                    }
                    if (areAllTypesValid) {
                        for (let j = 0; j < toCheck.length; j++) {
                            try {
                                let classToCheck = sdoAdapter_genVal.getClass(toCheck[j]);
                                let propertiesOfType = classToCheck.getProperties(true);
                                if (propertiesOfType.includes(properties[i])) {
                                    isLegitProperty = true;
                                    break;
                                }
                            } catch (e) {
                                // Error if classToCheck is not in SDO vocabulary
                                // Properties will not be checked
                            }
                        }
                        // Property
                        if (isLegitProperty === false) {
                            // 305 non-conform domain - property is not usable by the actual type(s)
                            errorReport.push(new ErrorEntry("AnnotationError", "Error", 305, "Non-conform domain", "The annotation has an entity ('" + VUT.prettyPrintURIMTEs(annotationType) + "') with a property that it is not allowed to use ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') based on the schema.org vocabulary.", null, path, properties[i]));
                        }
                    }
                }
                // Check if value type for property is allowed
                let valueTypesOfProperty = sdoAdapter_genVal.getProperty(properties[i]).getRanges(false);
                let toCheck = [];
                if (Array.isArray(annotationObject[properties[i]])) {
                    toCheck = annotationObject[properties[i]];
                } else {
                    toCheck.push(annotationObject[properties[i]]);
                }
                for (let p = 0; p < toCheck.length; p++) {
                    // Check value type here
                    // SDO type - JS typeof
                    // Text, URL, Time, Date, DateTime - string
                    // Boolean - boolean, string
                    // Number, Integer, Float - number, string
                    // NULL - object (warning?)
                    // Class - object (check @type)
                    // Enumeration - object, string

                    let isValueTypeLegit = false;
                    let sanitizedValue;
                    switch (typeof toCheck[p]) {
                        case "number":
                            if (valueTypesOfProperty.includes("schema:Number") || valueTypesOfProperty.includes("schema:Integer") || valueTypesOfProperty.includes("schema:Float") || valueTypesOfProperty.includes("schema:Thing")) {
                                isValueTypeLegit = true;
                            }
                            break;
                        case "boolean":
                            if (valueTypesOfProperty.includes("schema:Boolean") || valueTypesOfProperty.includes("schema:Thing")) {
                                isValueTypeLegit = true;
                            }
                            break;
                        case "string":
                            sanitizedValue = toCheck[p].replace(/^[\s\t\n\r]*/, "");
                            sanitizedValue = sanitizedValue.replace(/[\s\t\n\r]*$/, "");
                            if (sanitizedValue !== toCheck[p] && toCheck[p].replace(/ /g, '') !== "") {
                                // 300 Trailing spaces
                                errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Trailing spaces", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a value that has trailing spaces. If those spaces do not exist on purpose, they should be deleted.", null, path + "." + properties[i] + "/" + p, toCheck[p]));
                            }
                            if (valueTypesOfProperty.includes("schema:Text") || valueTypesOfProperty.includes("schema:Thing")) {
                                isValueTypeLegit = true;
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:Number") || valueTypesOfProperty.includes("schema:Float")) {
                                let doubleVal = Number(sanitizedValue);
                                let isNumber = VUT.isNumber(doubleVal);
                                if (isNumber) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:Integer")) {
                                let intVal = Number(sanitizedValue);
                                let isInt = Number.isInteger(intVal);
                                if (isInt) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:Boolean")) {
                                if (sanitizedValue === "true" || sanitizedValue === "false") {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:URL")) {
                                let isURL = VUT.isUrl(sanitizedValue);
                                if (isURL) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:Time")) {
                                let timeObj = VUT.genTimeObj(sanitizedValue);
                                if (timeObj !== false) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:DateTime")) {
                                let dateTimeObj = VUT.genDateTimeObj(sanitizedValue);
                                if (dateTimeObj !== false) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit && valueTypesOfProperty.includes("schema:Date")) {
                                let dateObj = VUT.genDateObj(sanitizedValue);
                                if (dateObj !== false) {
                                    isValueTypeLegit = true;
                                }
                            }
                            if (!isValueTypeLegit) {
                                // SDO enumeration
                                for (let r = 0; r < valueTypesOfProperty.length; r++) {
                                    if (enumerationsURIList.includes(VUT.reversePrettyPrintURI(valueTypesOfProperty[r]))) {
                                        isValueTypeLegit = true;
                                    }
                                }
                            }
                            break;
                        case "object":
                            // Todo enable "valued datatypes" from jsonld here
                            if (toCheck[p]["@type"] !== undefined) {
                                // Check if type used is a subclass of allowed classes
                                if (rec_checkIfTypeIsInRangeOfProperty(toCheck[p]["@type"], valueTypesOfProperty) === true) {
                                    isValueTypeLegit = true;
                                } else {
                                    isValueTypeLegit = true;
                                    // 306 non-conform range
                                    errorReport.push(new ErrorEntry("AnnotationError", "Error", 306, "Non-conform range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a value type ('" + VUT.prettyPrintURIMTEs(toCheck[p]["@type"]) + "') that is not conform to schema.org.", null, path + "." + properties[i] + "/" + p, typePrinter(toCheck[p]["@type"])));
                                }
                            } else if (toCheck[p]["@type"] === undefined && toCheck[p]["@id"] !== undefined) {
                                // Show warning instead of error
                                isValueTypeLegit = true;
                                let valueToPrint = null;
                                if (!Array.isArray(toCheck[p]["@id"]) && !VUT.isObject(toCheck[p]["@id"])) {
                                    valueToPrint = toCheck[p]["@id"];
                                }
                                errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Unknown range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a referenced value (@id is used) for which the range type is unknown. The conformance of the range can not be verified.", null, path + "." + properties[i] + "/" + p, valueToPrint));
                            } else if (toCheck[p]["@type"] === undefined && toCheck[p]["@id"] === undefined) {
                                // Show warning instead of error
                                isValueTypeLegit = true;
                                errorReport.push(new ErrorEntry("JsonLdError", "Error", 203, "No @type", "The annotation has an entity with no @type.", null, path + "." + properties[i] + "/" + p, null));
                            }
                            break;
                    }
                    // This is commented out because the latest stand of us is "show it as error if string is used as range although it is not explicitly stated in schema.org"
                    if (typeof toCheck[p] === "string" && isValueTypeLegit === false && sdoAdapter_genVal.getProperty(properties[i]).getRanges(false, {"termType": ["Class", "Enumeration"]}).length > 0) {
                        // 307 unexpected string - value has a string as value although it was not allowed by the structured version of SDO (actually, they state "poor data is better than no data", so a string is kind of always allowed). This should be allowed for properties that can have non-datatypes as values. Edit -> we value this as error now!
                        errorReport.push(new ErrorEntry("AnnotationError", "Warning", 307, "Non-conform range (string)", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a string as value, although a string is not explicitly allowed as range for this property according to the schema.org vocabulary.", null, path + "." + properties[i] + "/" + p, toCheck[p]));
                    } else if (isValueTypeLegit === false) {
                        // 306 non-conform range - value has a type which is not allowed by the vocabulary
                        errorReport.push(new ErrorEntry("AnnotationError", "Error", 306, "Non-conform range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with a value type that is not conform to schema.org.", null, path + "." + properties[i] + "/" + p, toCheck[p]));
                    }
                    if (typeof toCheck[p] === "string" && toCheck[p].replace(/ /g, '') === "") {
                        // 207 empty string warning
                        errorReport.push(new ErrorEntry("JsonLdError", "Warning", 207, "Empty string", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(properties[i]) + "') with an empty string as value.", null, path + "." + properties[i] + "/" + p, toCheck[p]));
                    }
                }
            }
            // Check values of property, if object -> do recursion
            if (Array.isArray(annotationObject[properties[i]])) {
                // Is an array of things, which may contain objects, strings, numbers, booleans
                for (let j = 0; j < annotationObject[properties[i]].length; j++) {
                    if (VUT.isObject(annotationObject[properties[i]][j])) {
                        // Is a object
                        errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[properties[i]][j], [], path + "." + properties[i] + "/" + j));
                    }
                }
            } else if (VUT.isObject(annotationObject[properties[i]])) {
                // Is only 1 object
                errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[properties[i]], [], path + "." + properties[i] + "/0"));
            }
        } else if (properties[i] === "@reverse") {
            // Check keys if object do recursion
            if (Array.isArray(annotationObject[properties[i]])) {
                propNotFound = false; // At least one property is included
                // Is an array of things, which may contain objects, strings, numbers, booleans
                for (let j = 0; j < properties.length; j++) {
                    if (VUT.isObject(annotationObject[properties[i]][j])) {
                        // Is a object
                        errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[properties[i]][j], [], path + "." + properties[i] + "/" + j));
                    }
                }
            } else if (VUT.isObject(annotationObject[properties[i]])) {
                propNotFound = false; // At least one property is included
                // Is only 1 object
                errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[properties[i]], [], path + "." + properties[i] + "/0"));
            }
        }
    }
    if (propNotFound) {
        // 309 entity with no properties
        errorReport.push(new ErrorEntry("AnnotationError", "Warning", 309, "Empty entity", "The annotation has an entity with no properties other than @type.", null, path));
    }
    return errorReport;
}

function typePrinter(typeValue) {
    let res = "";
    if (Array.isArray(typeValue)) {
        for (let i = 0; i < typeValue.length; i++) {
            res += typeValue[i];
            if (i !== typeValue.length - 1) {
                res += " + ";
            }
        }
    } else {
        res = typeValue;
    }
    return res;
}

// Returns true if the given type is in the range of the given property rangeTypes
// Subclasses are taken into consideration (recursion)
function rec_checkIfTypeIsInRangeOfProperty(type, rangeTypes) {
    if (Array.isArray(rangeTypes)) {
        for (let i = 0; i < rangeTypes.length; i++) {
            let typesToCheck = [];
            if (Array.isArray(type) === true) {
                typesToCheck = type;
            } else {
                typesToCheck.push(type);
            }
            for (let j = 0; j < typesToCheck.length; j++) {
                if (typesToCheck[j] === rangeTypes[i]) {
                    return true;
                }
            }

            try {
                let actualClass = sdoAdapter_genVal.getClass(rangeTypes[i]);
                if (rec_checkIfTypeIsInRangeOfProperty(type, actualClass.getSubClasses(true)) === true) {
                    return true;
                }
            } catch (e) {
                // Range is a DataType or an Enumeration, therefore we don't further check its subClasses
            }
        }
    }
    return false;
}

// Checks if a value is a class conform to sdo
function checkIfValueIsValidSDOClass(value) {
    // Allow classes and enumerations
    return (classesURIList.includes(value) || enumerationsURIList.includes(value));
}

function checkIfSDOClassHasBlankSpaces(value) {
    value = value.replace(/ /g, '');
    // Allow classes and enumerations
    return (classesURIList.includes(value) || enumerationsURIList.includes(value));
}

function checkIfSDOClassHasBadCase(value) {
    value = value.toLowerCase();
    // Allow classes and enumerations
    for (let i = 0; i < classesURIList.length; i++) {
        if (value === classesURIList[i].toLowerCase()) {
            return VUT.prettyPrintURI(classesURIList[i]);
        }
    }
    for (let i = 0; i < enumerationsURIList.length; i++) {
        if (value === enumerationsURIList[i].toLowerCase()) {
            return VUT.prettyPrintURI(enumerationsURIList[i]);
        }
    }
    return false;
}

function checkIfValueIsWrongSpelledSDOClass(value) {
    let result = [];
    // Allow classes and enumerations
    for (let i = 0; i < classesURIList.length; i++) {
        if (VUT.levDist(value, classesURIList[i]) < 3) {
            result.push(VUT.prettyPrintURI(classesURIList[i]));
        }
    }
    for (let i = 0; i < enumerationsURIList.length; i++) {
        if (VUT.levDist(value, enumerationsURIList[i]) < 3) {
            result.push(VUT.prettyPrintURI(enumerationsURIList[i]));
        }
    }
    if (result.length === 0) {
        return false;
    } else {
        let types = "";
        for (let j = 0; j < result.length; j++) {
            if (j + 1 === result.length) {
                types = types.concat(result[j]);
            } else {
                types = types.concat(result[j] + ", ");
            }
        }
        return types;
    }
}

// Checks if a value is a property conform to sdo
function checkIfValueIsValidSDOProperty(value) {
    return (propertiesURIList.includes(value));
}

function checkIfSDOPropertyHasBlankSpaces(value) {
    value = value.replace(/ /g, '');
    return (propertiesURIList.includes(value));
}

function checkIfSDOPropertyHasBadCase(value) {
    value = value.toLowerCase();
    for (let i = 0; i < propertiesURIList.length; i++) {
        if (value === propertiesURIList[i].toLowerCase()) {
            return VUT.prettyPrintURI(propertiesURIList[i]);
        }
    }
    return false;
}

function checkIfValueIsWrongSpelledSDOProperty(value) {
    let result = [];
    for (let i = 0; i < propertiesURIList.length; i++) {
        if (VUT.levDist(value, propertiesURIList[i]) < 3) {
            result.push(VUT.prettyPrintURI(propertiesURIList[i]));
        }
    }
    if (result.length === 0) {
        return false;
    } else {
        let types = "";
        for (let j = 0; j < result.length; j++) {
            if (j + 1 === result.length) {
                types = types.concat(result[j]);
            } else {
                types = types.concat(result[j] + ", ");
            }
        }
        return types;
    }
}

function checkIfValueIsActionSDOProperty(value) {
    if (value.endsWith("-input")) {
        if ((propertiesURIList.includes(value.substring(0, value.length - ("-input").length)))) {
            return true;
        }
    }
    if (value.endsWith("-output")) {
        if ((propertiesURIList.includes(value.substring(0, value.length - ("-output").length)))) {
            return true;
        }
    }
    return false;
}

// At this point no preprocess can be done yet, so the path would not be consistent! -> no path used
// Undefined -> jsonld transformation fails (JSON can't have undefined)
// Null -> jsonld transformation may fail (if a @type is null), or property is ommited (if a value for a property is null)
// Double nested arrays -> not allowed in JSON-LD
function recursive_checkAnomalies(annotationObject, errorReport) {
    for (let k of Object.keys(annotationObject)) {
        if (annotationObject[k] === undefined) {
            errorReport.push(createError_104());
        } else if (annotationObject[k] === null) {
            if (k === "@type") {
                errorReport.push(createError_206(true));
            } else {
                errorReport.push(createError_206(false));
            }
        } else if (VUT.isObject(annotationObject[k])) {
            recursive_checkAnomalies(annotationObject[k], errorReport);
        } else if (Array.isArray(annotationObject[k])) {
            for (let k2 of Object.keys(annotationObject[k])) {
                if (annotationObject[k][k2] === undefined) {
                    errorReport.push(createError_104());
                } else if (annotationObject[k][k2] === null) {
                    if (k === "@type") {
                        errorReport.push(createError_206(true));
                    } else {
                        errorReport.push(createError_206(false));
                    }
                } else if (VUT.isObject(annotationObject[k][k2])) {
                    recursive_checkAnomalies(annotationObject[k][k2], errorReport);
                } else if (Array.isArray(annotationObject[k][k2])) {
                    errorReport.push(createError_205());
                }
            }
        }
    }
}

// Usage of undefined
function createError_104() {
    return new ErrorEntry("JsonError", "Error", 104, "Usage of undefined", "The annotation contains an 'undefined' value, which is not conform to the JSON specification.", null, "$");
}

// Usage of null
function createError_206(errorCausingNull = false) {
    let severity;
    let description;
    if (errorCausingNull) {
        severity = "Critical";
        description = "The annotation contains a 'null' value as a @type, which causes errors during the JSON-LD processing.";
    } else {
        severity = "Warning";
        description = "The annotation contains a 'null' value, which is allowed by the JSON-LD specification, but not recommended to use.";
    }
    return new ErrorEntry("JsonLdError", severity, 206, "Usage of null", description, null, "$");
}

// Double nested Array
function createError_205() {
    return new ErrorEntry("JsonLdError", "Error", 205, "Double Nested Array", "The annotation contains a double nested array, which is not conform to the JSON-LD specification.", null, "$");
}

// Recursive check if a SDO Annotation (JSON object) is valid
function recursive_semantic_isAnnotationValid(annotationObject, errorReport, path) {
    // Check if "@type" is set (for root. inner entities are checked at the range level)
    if (annotationObject["@type"] === undefined) {
        if (path === "$") {
            errorReport.push(new ErrorEntry("JsonLdError", "Error", 203, "No @type", "The annotation has no @type.", null, path, null));
        }
    } else {
        // Check if "@type" is string or array of strings
        if (VUT.isString(annotationObject["@type"]) === false) {
            if (Array.isArray(annotationObject["@type"])) {
                for (let i = 0; i < annotationObject["@type"].length; i++) {
                    if (VUT.isString(annotationObject["@type"][i]) === false) {
                        // 204 bad type
                        errorReport.push(new ErrorEntry("JsonLdError", "Error", 204, "Bad @type", "The annotation has an entity with an invalid @type entry.", null, path + ".@type/" + i));
                        break;
                    }
                }
            } else {
                // 204 bad type
                errorReport.push(new ErrorEntry("JsonLdError", "Error", 204, "Bad @type", "The annotation has an entity with an invalid @type entry.", null, path + ".@type/0"));
            }
        }
    }
    // Check keys if object do recursion
    let properties = Object.keys(annotationObject);
    for (let i = 0; i < properties.length; i++) {
        // If (properties[i].substring(0, 1) !== "@") { // removed this because @reverse would be omited
        if (Array.isArray(annotationObject[properties[i]])) {
            // Is an array of things, which may contain objects, strings, numbers, booleans
            for (let j = 0; j < annotationObject[properties[i]].length; j++) {
                if (VUT.isObject(annotationObject[properties[i]][j])) {
                    // Is a object
                    recursive_semantic_isAnnotationValid(annotationObject[properties[i]][j], errorReport, path + "." + properties[i] + "/" + j);
                }
            }
        } else if (VUT.isObject(annotationObject[properties[i]])) {
            // Is only 1 object
            recursive_semantic_isAnnotationValid(annotationObject[properties[i]], errorReport, path + "." + properties[i] + "/0");
        }
    }
}

module.exports = {
    isAnnotationValid
};