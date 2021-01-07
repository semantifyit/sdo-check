const generalVerificationReport = require("./constructors/GeneralVerificationReport");
const ErrorEntry = require("./constructors/ErrorEntry");
const VUT = require("./VerificationUtilities");
//const SDOAdapter = require('schema-org-adapter'); // We dont add the SDO Adapter in this bundle, since the frontend will load the SDO Adapter anyway. Since the resulting bundle is supposed to be used together with the SDO check tool.
const jsonld = require('jsonld');
const sdoURI = "http://schema.org/";

let sdoAdapterGenVer;   // The SDO Adapter used for the general verification
// initialize the SDO Adapter automatically if it is detected
if (typeof SDOAdapter !== 'undefined') {
    initSdoAdapter();
}


// Creates an SDO-Adapter with the latest working vocabulary file for schema.org
async function initSdoAdapter(SDOAdapterLibrary = null) {
    // This is needed to allow local tests without having to add the SDO Adapter in the bundle
    if (!SDOAdapterLibrary) {
        sdoAdapterGenVer = new SDOAdapter();
    } else {
        sdoAdapterGenVer = new SDOAdapterLibrary();
    }
    const urlLatestSDO = await sdoAdapterGenVer.constructSDOVocabularyURL('latest');
    await sdoAdapterGenVer.addVocabularies([urlLatestSDO]);
}

// AnnotationPath has following format:
// $ stands for the root
// Schema:address stands for a property from the standard SDO vocab
// 1 stands for the value index for a property(array)
// . is a delimiter between a class and its property, e.g.  "$.schema:address"
// / is a delimiter between a property and its range, e.g.  "$.schema:address/1"
// Ranges of properties are given as their array-index, starting from 0. If there is no array, then that value is referenced by 0.
// $.schema:address/0.schema:addressRegion/2

/**
 * Main Function
 * Checks if a given Annotation is in compliance with the Schema.org vocabulary and its format specifications (JSON, JSON-LD)
 * https://bitbucket.org/sti2/semantify-core/wiki/DomainSpecifications/5%20-%20SHACL-DS%20v3/BasicValidation
 * https://bitbucket.org/sti2/semantify-core/wiki/DomainSpecifications/5%20-%20SHACL-DS%20v3/GeneralValidation
 *
 * @param inputAnnotation {object | string} - the schema.org annotation to check
 * @returns {Promise<generalVerificationReport>} the resulting verification report
 */
async function isAnnotationValid(inputAnnotation) {
    let annotation;     // Hard copy of the input annotation that can be freely transformed without changing the original annotation
    let errorReport = [];   // Array holding all found errors during the verification
    try {
        // 1. Lexical and Syntax analysis of annotation
        let lexCheck = lexicalCheckJSON(inputAnnotation, errorReport);
        if (lexCheck.outcome === false) {
            return createGeneralVerificationReport("Invalid", "There was a lexical problem with the annotation.", errorReport);
        } else {
            annotation = lexCheck.annotation;
        }
        // 2. Check @context
        if (!checkContext(annotation, errorReport)) {
            // If there is no context we stop the verification process here
            return createGeneralVerificationReport("Invalid", "There was a problem with the @context of the annotation.", errorReport);
        }
        // 3. Pre-process annotation, so it has a fixed structure we can work on (JSON-LD transformation)
        annotation = await preProcessAnnotation(annotation);
        // 4. Semantic analysis of annotation
        semanticCheckJSONLD(annotation, errorReport);
        // 5. SDO verification of annotation
        errorReport = recursive_sdo_isAnnotationValid(annotation, errorReport, "$");
        // 6. Create and return verification report
        let result = "Valid";
        let resultDescription = "The annotation is a valid Schema.org annotation.";
        if (errorReport.length > 0) {
            result = "ValidWithWarnings";
            resultDescription = "The annotation is valid, but with warnings.";
            for (let err of errorReport) {
                if (err.severity === "Error" || err.severity === "Critical") {
                    result = "Invalid";
                    resultDescription = "The annotation is invalid.";
                    break;
                }
            }
        }
        return createGeneralVerificationReport(result, resultDescription, errorReport);
    } catch (e) {
        // Catch any unexpected error during the verification
        console.log(e);
        if (e.name === "jsonld.InvalidUrl") {
            errorReport.push(createError_999(e.details.code + ": " + e.details.url + " - " + e.message));
        } else if (e.name === "jsonld.SyntaxError" && e.message === "Invalid JSON-LD syntax; \"@type\" value must a string, an array of strings, an empty object, or a default object.") {
            errorReport.push(createError_204(null, e.details.value));
        } else if (e.name === "jsonld.SyntaxError" && e.message === "Invalid JSON-LD syntax; the value of \"@vocab\" in a @context must be a string or null.") {
            // Error 202 Bad @Context - Already generated during checkContext()
        } else if (e.name === "jsonld.SyntaxError" && e.message === "Invalid JSON-LD syntax; @context term values must be strings or objects.") {
            // Error 202 Bad @Context - Already generated during checkContext()
        } else if (e.name === "jsonld.SyntaxError" && e.message === "Invalid JSON-LD syntax; @context must be an object.") {
            // Error 202 Bad @Context - Already generated during checkContext()
        } else {
            errorReport.push(createError_999("There was an error during the verification process, make sure the sent annotation has a valid serialization."));
        }
        return createGeneralVerificationReport("Invalid", "There was an execution error during the verification process, make sure the sent annotation has a valid serialization.", errorReport);
    }
}

/**
 * Executes the lexical check of the annotation
 * @param annotation {object | string} - the schema.org annotation to check
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @returns {object} returns a result object, telling if an error was found, and the annotation as object. These are critical errors, so the verification process is supposed to end here, else an execution error may occur.
 */
function lexicalCheckJSON(annotation, errorReport) {
    let result = {
        outcome: true // Returns false if not valid
    };
    if (annotation === undefined || annotation === null) {
        errorReport.push(createError_102());
        result.outcome = false;
        return result;
    }
    try {
        if (VUT.isString(annotation)) {
            result.annotation = JSON.parse(annotation);
            // Check null values (undefined, double nested arrays, null, invalid type definitions) {
            recursive_checkAnomalies(result.annotation, errorReport);
        } else {
            // Check null values (undefined, double nested arrays, null, invalid type definitions) {
            recursive_checkAnomalies(annotation, errorReport); // Must be done before JSON.stringify, else the undefined values would be lost
            result.annotation = JSON.parse(JSON.stringify(annotation)); // Make hard copy to not change the original object
        }
    } catch (e) {
        // If there is a parse error the input is not valid JSON (therefore not valid JSON-LD)
        errorReport.push(createError_101());
        result.outcome = false;
        return result;
    }
    if (!result.annotation || (VUT.isObject(result.annotation) && Object.keys(result.annotation).length === 0) || (Array.isArray(result.annotation) && result.annotation.length === 0)) {
        // This algorithm expects a non-empty input
        errorReport.push(createError_102());
        result.outcome = false;
    } else if (!VUT.isObject(result.annotation)) {
        // This algorithm expects a single annotation object as input
        errorReport.push(createError_103());
        result.outcome = false;
    }
    return result;
}

/**
 * Function checking the @context of the annotation for acceptable formats (for this tool) - This should be done before the preprocessing
 *
 * @param annotation {object} - the schema.org annotation to check
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @returns {boolean} returns false if there was no context at all
 */
function checkContext(annotation, errorReport) {
    // "@context" : "http://schema.org/" (IRI for schema.org)
    // "@context" : {"@vocab": "http://schema.org/"} (Object for schema.org)
    // "@context" : {"@vocab": "http://schema.org/", "XYZ": "http://additinalVocab.any"} (Object for schema.org and additional vocabularies)
    // There are countless other valid @context variations, but we focus/allow only these for our tool
    // Todo have a closer discussion about which context forms we allow, why and why not
    // Check if root Object of annotation has (valid) "@context"
    if (annotation["@context"] === undefined) {
        // 201 no context - we expect a context for this tool
        errorReport.push(createError_201());
        return false;
    } else {
        if (VUT.isString(annotation["@context"])) {
            if (!checkAllowedSDOContextURI(annotation["@context"])) {
                // 301 non-conform context
                errorReport.push(createError_301());
            } else if (!checkRecommendedSDOContextURI(annotation["@context"])) {
                // 300 Non-ideal @context
                errorReport.push(createError_300_context());
            }
        } else if (VUT.isObject(annotation["@context"])) {
            // @vocab is allowed for the standard context, which should be the schema.org vocabulary
            let foundSdo = false;
            let foundError = false;
            if (annotation["@context"]["@vocab"]) {
                if (VUT.isString(annotation["@context"]["@vocab"])) {
                    if (!checkAllowedSDOContextURI(annotation["@context"]["@vocab"])) {
                        // 301 non-conform context
                        errorReport.push(createError_301());
                        foundError = true;
                    } else if (!checkRecommendedSDOContextURI(annotation["@context"]["@vocab"])) {
                        // 300 Non-ideal @context
                        errorReport.push(createError_300_context());
                        foundError = true;
                    } else {
                        foundSdo = true;
                    }
                } else {
                    foundError = true;
                    errorReport.push(createError_202("The '@context' of the annotation has a '@vocab' value that is not a String. This value should be a string referencing the schema.org vocabulary."));
                }
            }
            let contextKeys = Object.keys(annotation["@context"]);
            for (let i = 0; i < contextKeys.length; i++) {
                if (contextKeys[i] !== "@vocab") {
                    if (VUT.isString(annotation["@context"][contextKeys[i]])) {
                        if (checkRecommendedSDOContextURI(annotation["@context"][contextKeys[i]])) {
                            foundSdo = true;
                        } else if (checkAllowedSDOContextURI(annotation["@context"][contextKeys[i]])) {
                            errorReport.push(createError_300_context());
                            foundError = true;
                            foundSdo = true;
                        }
                    } else {
                        foundError = true;
                        errorReport.push(createError_202("The '@context' of the annotation has an invalid format."));
                    }
                }
            }
            // If the SDO vocabulary has not been found yet and no error has still been produced, then an error is produced now
            if (!foundError && !foundSdo) {
                errorReport.push(createError_301());
            }
        } else {
            // 202 bad context - (we should look into allowing also an array as context)
            errorReport.push(createError_202("The '@context' of the annotation has a value that is not a String or an Object."));
        }
    }
    return true;
}

/**
 * Recursive function that checks JSON and JSON-LD syntax issues in the annotation
 *
 * @param annotationObject {object} - the actual nested object of the annotation
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the verification
 */
function recursive_checkAnomalies(annotationObject, errorReport) {
    // At this point no preprocess can be done yet, so the path would not be consistent! -> no path used
    // Undefined -> jsonld transformation fails (JSON can't have undefined)
    // Null -> jsonld transformation may fail (if a @type is null), or property is omitted (if a value for a property is null)
    // Double nested arrays -> not allowed in JSON-LD
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

/**
 * Preprocess the given annotation with jsonld to bring it in a form that the algorihm expects
 *
 * @param annotation {object} - the schema.org annotation to preprocess
 * @returns {Promise<object>} - the preprocessed schema.org annotation
 */
async function preProcessAnnotation(annotation) {
    // Set @context URI of schema.org to wished value, so that the standard context used for the JSONLD function does not "break" the annotation
    // By using "@vocab": "http://schema.org/" for the input and "schema": "http://schema.org/" for the output we avoid loading the schema.org context
    // (This is wished in order to avoid issues that could arise from loading and converting based on the context file)
    // Todo But we should look into loading the context and try to catch all resulting unexpected transformations
    let globalStandardContext = {
        'schema': sdoURI
    };
    annotation = recursive_compactPreReplacement(annotation, globalStandardContext);
    // https://www.w3.org/TR/json-ld-api/#context-processing-algorithm
    annotation = await jsonld.compact(annotation, globalStandardContext);
    annotation = recursive_compactPostReplacement(annotation);
    return annotation;
}

function recursive_compactPreReplacement(annotationObject, globalStandardContext) {
    if (!annotationObject) {
        return annotationObject;
    }
    if (VUT.isObject(annotationObject["@context"])) {
        let vocabKeys = Object.keys(annotationObject["@context"]);
        for (let i = 0; i < vocabKeys.length; i++) {
            if (!checkAllowedSDOContextURI(annotationObject["@context"][vocabKeys[i]]) && vocabKeys[i] !== "schema" && !globalStandardContext[vocabKeys[i]]) {
                globalStandardContext[vocabKeys[i]] = annotationObject["@context"][vocabKeys[i]];
            } else {
                // Here is the used schema.org URI, set it to the wished value
                annotationObject["@context"][vocabKeys[i]] = sdoURI;
            }
        }
    } else if (VUT.isString(annotationObject["@context"])) {
        // Only one context is given in the case of string
        annotationObject["@context"] = {'@vocab': sdoURI};
    }
    let properties = Object.keys(annotationObject);
    for (let i = 0; i < properties.length; i++) {
        if (!properties[i].startsWith("@")) {
            if (Array.isArray(annotationObject[properties[i]])) {
                for (let j = 0; j < annotationObject[properties[i]].length; j++) {
                    annotationObject[properties[i]][j] = recursive_compactPreReplacement(annotationObject[properties[i]][j], globalStandardContext);
                }
            } else if (VUT.isObject(annotationObject[properties[i]])) {
                annotationObject[properties[i]] = recursive_compactPreReplacement(annotationObject[properties[i]], globalStandardContext);
            }
        }
        // We have to encode whitespaces in property URIs, else the JSON-LD processor will automatically ignore them
        if (properties[i].includes(" ")) {
            let newPropertyKey = properties[i].replaceAll(" ", "%20");
            annotationObject[newPropertyKey] = JSON.parse(JSON.stringify(annotationObject[properties[i]]));
            delete annotationObject[properties[i]];
        }
    }
    return annotationObject;
}

function recursive_compactPostReplacement(annotationObject) {
    if (!annotationObject) {
        return annotationObject;
    }
    let properties = Object.keys(annotationObject);
    for (let i = 0; i < properties.length; i++) {
        if (!properties[i].startsWith("@")) {
            if (Array.isArray(annotationObject[properties[i]])) {
                for (let j = 0; j < annotationObject[properties[i]].length; j++) {
                    annotationObject[properties[i]][j] = recursive_compactPostReplacement(annotationObject[properties[i]][j]);
                }
            } else if (VUT.isObject(annotationObject[properties[i]])) {
                annotationObject[properties[i]] = recursive_compactPostReplacement(annotationObject[properties[i]]);
            }
        }
        // Encode whitespaces back (so they can be detected correctly by the verification algorithm)
        if (properties[i].includes("%20")) {
            let newPropertyKey = properties[i].replaceAll("%20", " ");
            annotationObject[newPropertyKey] = JSON.parse(JSON.stringify(annotationObject[properties[i]]));
            delete annotationObject[properties[i]];
        }
    }
    return annotationObject;
}

/**
 * Check if every nested object in the annotation has a @type value in correct format, as expected
 *
 * @param annotation {object} - the schema.org annotation to check
 * @param errorReport {Array<ErrorEntry>}  - the array holding all the errors found so far
 */
function semanticCheckJSONLD(annotation, errorReport) {
    // Check recursively if all objects in the annotation have (valid) @type
    // JSON-LD and JSON structure check
    if (annotation["@graph"] !== undefined) {
        // For now we allow a @graph, expecting the first item to be the "root node"
        recursive_semantic_isAnnotationValid(annotation["@graph"][0], errorReport, "$");
    } else {
        recursive_semantic_isAnnotationValid(annotation, errorReport, "$");
    }
}

/**
 * Recursive check if every nested object in the annotation has a @type value in correct format, as expected
 * @param annotationObject {object} - the actual nested object in the schema.org annotation to check
 * @param errorReport {Array<ErrorEntry>}  - the array holding all the errors found so far
 * @param path - the path of the actual nested object within the annotation
 */
function recursive_semantic_isAnnotationValid(annotationObject, errorReport, path) {
    // Check if "@type" is set (for root. inner entities are checked at the range level)
    if (annotationObject["@type"] === undefined) {
        if (path === "$") {
            errorReport.push(createError_203("The annotation has no @type.", path));
        }
    } else {
        // Check if "@type" is string or array of strings
        if (VUT.isString(annotationObject["@type"]) === false) {
            if (Array.isArray(annotationObject["@type"])) {
                for (let i = 0; i < annotationObject["@type"].length; i++) {
                    if (VUT.isString(annotationObject["@type"][i]) === false) {
                        // 204 bad type
                        errorReport.push(createError_204(path + ".@type/" + i, annotationObject["@type"][i]));
                        break;
                    }
                }
            } else {
                // 204 bad type
                errorReport.push(createError_204(path + ".@type/0", annotationObject["@type"]));
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

/**
 * Recursive function that verifies nested objects of the annotation one by one (the actual position is saved with the "path" - needed for the error report)
 * @param annotationObject {object} - the actual nested object of the annotation to verify
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path - the actual path of the annotation
 * @returns {Array<ErrorEntry>} - the error report after the verification of the actual nested object
 */
function recursive_sdo_isAnnotationValid(annotationObject, errorReport, path) {
    // Check keys of object, do recursion
    let properties = Object.keys(annotationObject);
    let foundProperties = false;
    for (let prop of properties) {
        // Check if it is @type
        if (prop === "@type") {
            annotationTypeCheck(annotationObject, errorReport, path);
        } else if (prop === "@id") {
            // We assume that this is a link, we cannot check the remote information (security risk and not necessarily URI == URL), but we assume that further properties are defined remotely
            foundProperties = true;
        } else if (prop === "@reverse") {
            foundProperties = true;
            annotationReverseHandling(annotationObject, errorReport, path);
        } else if (prop.substring(0, 1) !== "@") {
            foundProperties = true; // At least one property is included
            if (!checkIfValueIsValidSDOProperty(prop)) {
                // Check if the property is conform to schema.org
                annotationPropertyCheck(annotationObject, prop, errorReport, path);
            } else {
                annotationDomainCheck(annotationObject["@type"], prop, errorReport, path);
                annotationRangeCheck(annotationObject, prop, errorReport, path);
            }
            // Check values of property, if object -> do recursion
            if (Array.isArray(annotationObject[prop])) {
                // Is an array of things, which may contain objects, strings, numbers, booleans
                for (let j = 0; j < annotationObject[prop].length; j++) {
                    if (VUT.isObject(annotationObject[prop][j])) {
                        // Is a object
                        errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[prop][j], [], path + "." + prop + "/" + j));
                    }
                }
            } else if (VUT.isObject(annotationObject[prop])) {
                // Is only 1 object
                errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject[prop], [], path + "." + prop + "/0"));
            }
        }
    }
    if (!foundProperties) {
        // 309 entity with no properties
        errorReport.push(createError_309(path));
    }
    return errorReport;
}

/**
 * Function that does the checks regarding the @type of a nested annotation object
 *
 * @param annotationObject {object} - the actual nested object of the annotation to verify
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path {string} - the actual path of the annotation
 */
function annotationTypeCheck(annotationObject, errorReport, path) {
    // Check if its value is an Array (MultiTypeEntity) or a String (at this point it can only be one of those)
    let prop = "@type";
    let typesToCheck = [];
    if (Array.isArray(annotationObject[prop])) {
        typesToCheck = annotationObject[prop];
    } else {
        typesToCheck.push(annotationObject[prop]);
    }
    for (let j = 0; j < typesToCheck.length; j++) {
        // 302 non-conform type
        // Check if the value(s) is/are conform to schema.org
        if (checkIfValueIsValidSDOClass(typesToCheck[j]) === false) {
            if (checkIfSDOClassHasBlankSpaces(typesToCheck[j]) === true) {
                errorReport.push(createError_302("Non-conform @type (blank space)", "The annotation has a @type entry with at least 1 blank space ('" + VUT.prettyPrintURIMTEs(typesToCheck[j]) + "') that is not conform to schema.org.", path + "." + prop + "/" + j, typesToCheck[j]));
            } else {
                let badCase = checkIfSDOClassHasBadCase(typesToCheck[j]);
                if (badCase !== false) {
                    errorReport.push(createError_302("Non-conform @type (uppercase/lowercase)", "The annotation has a @type entry with an uppercase/lowercase error ('" + VUT.prettyPrintURIMTEs(typesToCheck[j]) + "' that should be '" + VUT.prettyPrintURIMTEs(badCase) + "').", path + "." + prop + "/" + j, typesToCheck[j]));
                } else {
                    let guess = checkIfValueIsWrongSpelledSDOClass(typesToCheck[j]);
                    if (guess === false) {
                        errorReport.push(createError_302("Non-conform @type", "The annotation has a @type entry ('" + VUT.prettyPrintURIMTEs(typesToCheck[j]) + "') that is not conform to schema.org.", path + "." + prop + "/" + j, typesToCheck[j]));
                    } else {
                        errorReport.push(createError_302("Non-conform @type (misspell)", "The annotation has a wrong spelled @type entry ('" + VUT.prettyPrintURIMTEs(typesToCheck[j]) + "', could be one of the following: '" + guess + "') that is not conform to schema.org.", path + "." + prop + "/" + j, typesToCheck[j]));
                    }
                }
            }
        }
    }
}

/**
 * Handles the @reverse JSON-LD keyword
 *
 * @param annotationObject {object} - the actual nested object of the annotation to verify
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path {string} - the actual path of the annotation
 */
function annotationReverseHandling(annotationObject, errorReport, path) {
    // Todo this is not correct, because of the recursive nature of the algorithm we need a new solution for this or we get rid of the @reverse during preprocessing
    // Check keys if object do recursion
    if (Array.isArray(annotationObject["@reverse"])) {
        // Is an array of things, which may contain objects, strings, numbers, booleans
        for (let j = 0; j < annotationObject["@reverse"].length; j++) {
            if (VUT.isObject(annotationObject["@reverse"][j])) {
                // Continue recursive verification for objects
                errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject["@reverse"][j], [], path + ".@reverse/" + j));
            }
        }
    } else if (VUT.isObject(annotationObject["@reverse"])) {
        // Continue recursive verification for objects
        errorReport.push.apply(errorReport, recursive_sdo_isAnnotationValid(annotationObject["@reverse"], [], path + ".@reverse/0"));
    }
}

/**
 * Checks if the conformance of the actual property
 *
 * @param annotationObject {object} - The actual nested object to check
 * @param actualProperty {string} - the actual property
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path {string} - the actual path of the annotation
 */
function annotationPropertyCheck(annotationObject, actualProperty, errorReport, path) {
    let prop = actualProperty;
    if (checkIfActionProperty(prop)) {
        // The property is from the action expansion, value should be a string or a PropertyValueSpecification -> https://schema.org/docs/actions.html
        if (!checkIfValidActionPropertyRange(annotationObject[prop])) {
            // 304 Non-conform action property
            errorReport.push(createError_304("The annotation has an action property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a value that is not a well-formatted string or a PropertyValueSpecification.", path, prop));
        }
    } else {
        // 303 non-conform property
        if (checkIfSDOPropertyHasBlankSpaces(prop)) {
            errorReport.push(createError_303("Non-conform property (blank space)", "The annotation has a property entry with at least 1 blank space ('" + VUT.prettyPrintURIMTEs(prop) + "') that is not conform to schema.org.", path, prop));
        } else {
            let badCaseProperty = checkIfSDOPropertyHasBadCase(prop);
            if (badCaseProperty !== false) {
                errorReport.push(createError_303("Non-conform property (uppercase/lowercase)", "The annotation has a property entry with an uppercase/lowercase error ('" + VUT.prettyPrintURIMTEs(prop) + "' that should be '" + badCaseProperty + "').", path, prop));
            } else {
                let guessProperty = checkIfValueIsWrongSpelledSDOProperty(prop);
                if (guessProperty === false) {
                    errorReport.push(createError_303("Non-conform property", "The annotation has a property entry ('" + VUT.prettyPrintURIMTEs(prop) + "') that is not conform to schema.org.", path, prop));
                } else {
                    errorReport.push(createError_303("Non-conform property (misspell)", "The annotation has a wrong spelled property entry ('" + VUT.prettyPrintURIMTEs(prop) + "' that could be one of the following: '" + guessProperty + "').", path, prop));
                }
            }
        }
    }
}

/**
 * Checks if the @type of the actual nested object is allowed to use the actual property
 *
 * @param annotationType {string | Array<string>} - Type(s) of the actual nested object
 * @param actualProperty {string} - the actual property
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path {string} - the actual path of the annotation
 */
function annotationDomainCheck(annotationType, actualProperty, errorReport, path) {
    // Check if property has the actual type as domain
    if (annotationType !== undefined) {
        let isLegitProperty = false;
        let typeToCheck = [];
        if (Array.isArray(annotationType)) {
            typeToCheck = annotationType;
        } else {
            typeToCheck.push(annotationType);
        }
        // Do not check if domain is valid, if the domain type does not even exist
        let areAllTypesValid = true;
        for (let ttc of typeToCheck) {
            if (!checkIfValueIsValidSDOClass(ttc)) {
                areAllTypesValid = false;
                break;
            }
        }
        if (areAllTypesValid) {
            for (let j = 0; j < typeToCheck.length; j++) {
                try {
                    let classToCheck = sdoAdapterGenVer.getClass(typeToCheck[j]);
                    let propertiesOfType = classToCheck.getProperties(true);
                    if (propertiesOfType.includes(actualProperty)) {
                        isLegitProperty = true;
                        break;
                    }
                } catch (e) {
                    // Error if classToCheck is not in SDO vocabulary
                    // Properties will not be checked
                }
            }
            if (!isLegitProperty) {
                // 305 non-conform domain - property is not usable by the actual type(s)
                errorReport.push(createError_305("The annotation has an entity ('" + VUT.prettyPrintURIMTEs(annotationType) + "') with a property that it is not allowed to use ('" + VUT.prettyPrintURIMTEs(actualProperty) + "') based on the schema.org vocabulary.", path, actualProperty));
            }
        }
    }
}

/**
 * Checks if the ranges of the actual property are valid
 *
 * @param annotationObject {object} - the actual nested object
 * @param actualProperty {string} - the actual property
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @param path {string} - the actual path of the annotation
 */
function annotationRangeCheck(annotationObject, actualProperty, errorReport, path) {
    let prop = actualProperty;
    let valueTypesOfProperty = sdoAdapterGenVer.getProperty(prop).getRanges(false);
    let rangesToCheck = [];
    if (Array.isArray(annotationObject[prop])) {
        rangesToCheck = annotationObject[prop];
    } else {
        rangesToCheck.push(annotationObject[prop]);
    }
    for (let p = 0; p < rangesToCheck.length; p++) {
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
        switch (typeof rangesToCheck[p]) {
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
                sanitizedValue = rangesToCheck[p].replace(/^[\s\t\n\r]*/, "");
                sanitizedValue = sanitizedValue.replace(/[\s\t\n\r]*$/, "");
                if (sanitizedValue !== rangesToCheck[p] && rangesToCheck[p].replace(/ /g, '') !== "") {
                    // 300 Trailing spaces
                    errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Trailing spaces", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a value that has trailing spaces. If those spaces do not exist on purpose, they should be deleted.", null, path + "." + prop + "/" + p, rangesToCheck[p]));
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
                        if (sdoAdapterGenVer.getListOfEnumerations().includes(VUT.reversePrettyPrintURI(valueTypesOfProperty[r]))) {
                            isValueTypeLegit = true;
                        }
                    }
                }
                break;
            case "object":
                // Todo enable "valued datatypes" from jsonld here
                if (rangesToCheck[p]["@type"] !== undefined) {
                    // Check if type used is a subclass of allowed classes
                    if (rec_checkIfTypeIsInRangeOfProperty(rangesToCheck[p]["@type"], valueTypesOfProperty) === true) {
                        isValueTypeLegit = true;
                    } else {
                        isValueTypeLegit = true;
                        // 306 non-conform range
                        errorReport.push(new ErrorEntry("AnnotationError", "Error", 306, "Non-conform range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a value type ('" + VUT.prettyPrintURIMTEs(rangesToCheck[p]["@type"]) + "') that is not conform to schema.org.", null, path + "." + prop + "/" + p, typePrinter(rangesToCheck[p]["@type"])));
                    }
                } else if (rangesToCheck[p]["@type"] === undefined && rangesToCheck[p]["@id"] !== undefined) {
                    // Show warning instead of error
                    isValueTypeLegit = true;
                    let valueToPrint = null;
                    if (!Array.isArray(rangesToCheck[p]["@id"]) && !VUT.isObject(rangesToCheck[p]["@id"])) {
                        valueToPrint = rangesToCheck[p]["@id"];
                    }
                    errorReport.push(new ErrorEntry("AnnotationError", "Warning", 300, "Unknown range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a referenced value (@id is used) for which the range type is unknown. The conformance of the range can not be verified.", null, path + "." + prop + "/" + p, valueToPrint));
                } else if (rangesToCheck[p]["@type"] === undefined && rangesToCheck[p]["@id"] === undefined) {
                    // Show warning instead of error
                    isValueTypeLegit = true;
                    errorReport.push(createError_203("The annotation has an entity with no @type.", path + "." + prop + "/" + p));
                }
                break;
        }
        // This is commented out because the latest stand of us is "show it as error if string is used as range although it is not explicitly stated in schema.org"
        if (typeof rangesToCheck[p] === "string" && isValueTypeLegit === false && sdoAdapterGenVer.getProperty(prop).getRanges(false, {"termType": ["Class", "Enumeration"]}).length > 0) {
            // 307 unexpected string - value has a string as value although it was not allowed by the structured version of SDO (actually, they state "poor data is better than no data", so a string is kind of always allowed). This should be allowed for properties that can have non-datatypes as values. Edit -> we value this as error now!
            errorReport.push(new ErrorEntry("AnnotationError", "Warning", 307, "Non-conform range (string)", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a string as value, although a string is not explicitly allowed as range for this property according to the schema.org vocabulary.", null, path + "." + prop + "/" + p, rangesToCheck[p]));
        } else if (isValueTypeLegit === false) {
            // 306 non-conform range - value has a type which is not allowed by the vocabulary
            errorReport.push(new ErrorEntry("AnnotationError", "Error", 306, "Non-conform range", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with a value type that is not conform to schema.org.", null, path + "." + prop + "/" + p, rangesToCheck[p]));
        }
        if (typeof rangesToCheck[p] === "string" && rangesToCheck[p].replace(/ /g, '') === "") {
            // 207 empty string warning
            errorReport.push(new ErrorEntry("JsonLdError", "Warning", 207, "Empty string", "The annotation has a property ('" + VUT.prettyPrintURIMTEs(prop) + "') with an empty string as value.", null, path + "." + prop + "/" + p, rangesToCheck[p]));
        }
    }
}

// Print the type(s) of an object in a human readable form
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
                let actualClass = sdoAdapterGenVer.getClass(rangeTypes[i]);
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
    return (sdoAdapterGenVer.getListOfClasses().includes(value) || sdoAdapterGenVer.getListOfEnumerations().includes(value));
}

function checkIfSDOClassHasBlankSpaces(value) {
    value = value.replace(/ /g, '');
    // Allow classes and enumerations
    return (sdoAdapterGenVer.getListOfClasses().includes(value) || sdoAdapterGenVer.getListOfEnumerations().includes(value));
}

function checkIfSDOClassHasBadCase(value) {
    value = value.toLowerCase();
    // Allow classes and enumerations
    for (let i = 0; i < sdoAdapterGenVer.getListOfClasses().length; i++) {
        if (value === sdoAdapterGenVer.getListOfClasses()[i].toLowerCase()) {
            return VUT.prettyPrintURI(sdoAdapterGenVer.getListOfClasses()[i]);
        }
    }
    for (let i = 0; i < sdoAdapterGenVer.getListOfEnumerations().length; i++) {
        if (value === sdoAdapterGenVer.getListOfEnumerations()[i].toLowerCase()) {
            return VUT.prettyPrintURI(sdoAdapterGenVer.getListOfEnumerations()[i]);
        }
    }
    return false;
}

function checkIfValueIsWrongSpelledSDOClass(value) {
    let result = [];
    // Allow classes and enumerations
    for (let i = 0; i < sdoAdapterGenVer.getListOfClasses().length; i++) {
        if (VUT.levDist(value, sdoAdapterGenVer.getListOfClasses()[i]) < 3) {
            result.push(VUT.prettyPrintURI(sdoAdapterGenVer.getListOfClasses()[i]));
        }
    }
    for (let i = 0; i < sdoAdapterGenVer.getListOfEnumerations().length; i++) {
        if (VUT.levDist(value, sdoAdapterGenVer.getListOfEnumerations()[i]) < 3) {
            result.push(VUT.prettyPrintURI(sdoAdapterGenVer.getListOfEnumerations()[i]));
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
    return (sdoAdapterGenVer.getListOfProperties().includes(value));
}

function checkIfSDOPropertyHasBlankSpaces(value) {
    value = value.replace(/ /g, '');
    return (sdoAdapterGenVer.getListOfProperties().includes(value));
}

function checkIfSDOPropertyHasBadCase(value) {
    value = value.toLowerCase();
    for (let i = 0; i < sdoAdapterGenVer.getListOfProperties().length; i++) {
        if (value === sdoAdapterGenVer.getListOfProperties()[i].toLowerCase()) {
            return VUT.prettyPrintURI(sdoAdapterGenVer.getListOfProperties()[i]);
        }
    }
    return false;
}

function checkIfValueIsWrongSpelledSDOProperty(value) {
    let result = [];
    for (let i = 0; i < sdoAdapterGenVer.getListOfProperties().length; i++) {
        if (VUT.levDist(value, sdoAdapterGenVer.getListOfProperties()[i]) < 3) {
            result.push(VUT.prettyPrintURI(sdoAdapterGenVer.getListOfProperties()[i]));
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

// Tests if the given property entry is a valid action-property as defined in https://schema.org/docs/actions.html
function checkIfActionProperty(property) {
    if (property.endsWith("-input")) {
        if ((sdoAdapterGenVer.getListOfProperties().includes(property.substring(0, property.length - ("-input").length)))) {
            return true;
        }
    }
    if (property.endsWith("-output")) {
        if ((sdoAdapterGenVer.getListOfProperties().includes(property.substring(0, property.length - ("-output").length)))) {
            return true;
        }
    }
    return false;
}

// Tests if the given value entry is valid for an action-property as defined in https://schema.org/docs/actions.html
function checkIfValidActionPropertyRange(value) {
    if (VUT.isString(value)) {
        return /^\s*([a-z]+=([a-z]?[0-9]?[A-Z]?)+\s)*(required\s*)+(\s*[a-z]+=([a-z]?[0-9]?[A-Z]?)+)*$/.test(value);
    } else if (VUT.isObject(value) && value["@type"].includes("PropertyValueSpecification")) {
        return true;
    }
    return false;
}

/**
 * Returns true if the given URI string complies our recommended format for the schema.org context URI
 *
 * @param URI {string} - the URI to test
 * @returns boolean - returns true if the given URI complies
 */
function checkRecommendedSDOContextURI(URI) {
    return /^https?:\/\/schema\.org\/?$/.test(URI);
}

/**
 * Returns true if the given URI string complies our allowed format for the schema.org context URI
 *
 * @param URI {string} - the URI to test
 * @returns boolean - returns true if the given URI complies
 */
function checkAllowedSDOContextURI(URI) {
    return /^(https?:\/\/)?(www\.)?schema\.org\/?$/.test(URI);
}

/**
 * Creates a verification report with the given data.
 *
 * @param result {string} - "Valid" | "ValidWithWarnings" | "Invalid"
 * @param description {string} - description of the verification result
 * @param errorReport {Array<ErrorEntry>} - Array of errors found during the actual verification
 * @returns {generalVerificationReport} - the created verification report
 */
function createGeneralVerificationReport(result, description, errorReport) {
    return new generalVerificationReport(
        result,
        null,
        description,
        errorReport
    );
}

// Creates an Error for Invalid JSON
function createError_101() {
    return new ErrorEntry(
        "JsonError",
        "Critical",
        101,
        "Invalid JSON",
        "The input annotation can not be parsed to JSON.",
        null,
        null
    );
}

// Creates an Error for Empty JSON
function createError_102() {
    return new ErrorEntry(
        "JsonError",
        "Critical",
        102,
        "Empty JSON",
        "The input annotation is empty.",
        null,
        null
    );
}

// Creates an Error for No JSON Object
function createError_103() {
    return new ErrorEntry(
        "JsonError",
        "Critical",
        103,
        "No JSON Object",
        "The input annotation is not a JSON object, as required.",
        null,
        null
    );
}

// Creates an Error for the Use of undefined
function createError_104() {
    return new ErrorEntry(
        "JsonError",
        "Error",
        104,
        "Use of undefined",
        "The annotation contains an 'undefined' value, which is not conform to the JSON specification.",
        null,
        "$"
    );
}

// Creates an Error for No @context
function createError_201() {
    return new ErrorEntry(
        "JsonLdError",
        "Critical",
        201,
        "No @Context",
        "The annotation has no '@context' entry, as expected.",
        null,
        "$"
    );
}

// Creates an Error for Bad @context
function createError_202(description) {
    return new ErrorEntry(
        "JsonLdError",
        "Critical",
        202,
        "Bad @Context",
        description,
        null,
        "$"
    );
}

// Creates an Error for No @type
function createError_203(description, path) {
    return new ErrorEntry(
        "JsonLdError",
        "Error",
        203,
        "No @type",
        description,
        null,
        path
    );
}

// Creates an Error for Bad @type
function createError_204(path = null, value = null) {
    return new ErrorEntry(
        "JsonLdError",
        "Error",
        204,
        "Bad @type",
        "The annotation has an entity with an invalid @type entry.",
        null,
        path,
        value
    );
}

// Creates an Error for double nested Arrays
function createError_205() {
    return new ErrorEntry(
        "JsonLdError",
        "Error",
        205,
        "Double Nested Array",
        "The annotation contains a double nested array, which is not conform to the JSON-LD specification.",
        null,
        "$"
    );
}

// Creates an Error for the Use of null
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
    return new ErrorEntry(
        "JsonLdError",
        severity,
        206,
        "Use of null",
        description,
        null,
        "$"
    );
}

// Creates an Error for Non-ideal @context
function createError_300_context() {
    return new ErrorEntry(
        "AnnotationError",
        "Warning",
        300,
        "Non-ideal @context",
        "The '@context' of schema.org annotations should be 'https://schema.org/'.",
        null,
        "$"
    );
}

// Creates an Error for Non-conform @context
function createError_301() {
    return new ErrorEntry(
        "AnnotationError",
        "Critical",
        301,
        "Non-conform @context",
        "The '@context' of the annotation does not contain the schema.org vocabulary.",
        null,
        "$"
    );
}

// Creates an Error for Non-conform @type
function createError_302(name, description, annotationPath, value = null) {
    return new ErrorEntry(
        "AnnotationError",
        "Error",
        302,
        name,
        description,
        null,
        annotationPath,
        value
    );
}

// Creates an Error for Non-conform property
function createError_303(name, description, annotationPath, value = null) {
    return new ErrorEntry(
        "AnnotationError",
        "Error",
        303,
        name,
        description,
        null,
        annotationPath,
        value
    );
}

// Creates an Error for Non-conform action property
function createError_304(description, annotationPath, value = null) {
    return new ErrorEntry(
        "AnnotationError",
        "Error",
        304,
        "Non-conform action property",
        description,
        null,
        annotationPath,
        value
    );
}

// Creates an Error for Non-conform domain
function createError_305(description, annotationPath, value = null) {
    return new ErrorEntry(
        "AnnotationError",
        "Error",
        305,
        "Non-conform domain",
        description,
        null,
        annotationPath,
        value
    );
}

// Creates an Error for an Empty entity (no properties other than type)
function createError_309(path) {
    return new ErrorEntry(
        "AnnotationError",
        "Warning",
        309,
        "Empty entity",
        "The annotation has an entity with no properties other than @type.",
        null,
        path
    );
}

// Creates an Execution Error
function createError_999(description) {
    return new ErrorEntry(
        "ExecutionError",
        "Critical",
        999,
        "Execution Error",
        description,
        null,
        "$"
    );
}

module.exports = {
    isAnnotationValid,
    initSdoAdapter
};