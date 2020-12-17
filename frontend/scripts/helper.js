/**
 * @file Helper functions
 */

// Helper function to read parameters from the actual URL address
function getParameter(paramName) {
    let searchString = window.location.search.substring(1),
        i, val, params = searchString.split("&");
    for (i = 0; i < params.length; i++) {
        val = params[i].split("=");
        if (val[0] === paramName) {
            return val[1];
        }
    }
    return null;
}

// Helper function to transform the rest api request result to a usable form for the frontend
function transformSemanticExtraction(input) {
    let output = [];
    // Jsonld
    let jsonld_keys = Object.keys(input.jsonld);
    for (let i = 0; i < jsonld_keys.length; i++) {
        let actualArray = input.jsonld[jsonld_keys[i]];
        for (let j = 0; j < actualArray.length; j++) {
            let newObj = {};
            newObj.markup = "jsonld";
            newObj.type = actualArray[j]["@type"];
            newObj.content = actualArray[j];
            output.push(newObj);
        }
    }
    // Failed jsonld
    for (let j = 0; j < input.jsonldFailed.length; j++) {
        let newObj = {};
        newObj.markup = "invalid jsonld";
        newObj.type = null;
        newObj.content = input.jsonldFailed[j].failedJSONLD;
        newObj.error = input.jsonldFailed[j].message;
        // Only add if the used vocab is schema.org
        if (input.jsonldFailed[j].failedJSONLD.indexOf("schema.org") >= 0) {
            output.push(newObj);
        }
    }

    // Microdata
    let microdata_keys = Object.keys(input.microdata);
    for (let i = 0; i < microdata_keys.length; i++) {
        let actualArray = input.microdata[microdata_keys[i]];
        for (let j = 0; j < actualArray.length; j++) {
            let newObj = {};
            newObj.markup = "microdata";
            newObj.type = actualArray[j]["@type"];
            newObj.content = actualArray[j];
            output.push(newObj);
        }
    }
    // Rdfa
    let rdfa_keys = Object.keys(input.rdfa);
    for (let i = 0; i < rdfa_keys.length; i++) {
        let actualArray = input.rdfa[rdfa_keys[i]];
        for (let j = 0; j < actualArray.length; j++) {
            let newObj = {};
            newObj.markup = "rdfa";
            newObj.type = actualArray[j]["@type"];
            newObj.content = actualArray[j];
            output.push(newObj);
        }
    }
    return output;
}

// Returns true if the content is "assumed" to be a JSON (with/without errors)
function anticipateJSON(input) {
    input = input.replace(/[\s\t\n\r]/g, "");
    for (let i = 0; i < 50; i++) {
        if (input.charAt(i) === "<") {
            return false;
        }
        if (input.charAt(i) === "{" || input.charAt(i) === "[") {
            return true;
        }
    }
    return input.endsWith("}") || input.endsWith("]");
}

// Creates a hash (unique identifier) for the given string
function generateHash(data) {
    let hash = 0, i, chr;
    for (i = 0; i < data.length; i++) {
        chr = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// Printable, human readable version of an annotation path for a given annotation
function prettyPrintAnnotationPath(annotationPath, annotation) {
    let output = "";
    let foundDelimiter = true;
    let annotationCopy = JSON.parse(JSON.stringify(annotation));
    do {
        // Check property delimiter
        let bigTokens = annotationPath.split("/");
        let smallTokens = bigTokens[0].split(".");
        if (annotationPath.startsWith("$")) { // Start with root
            output = output.concat(rangeToString(annotationCopy["@type"], true).replace("_", "+"));
            annotationPath = annotationPath.substring(1);
        } else if (annotationPath.startsWith("/")) { // Start with range
            if (Array.isArray(annotationCopy[bigTokens[1].split(".")[0]])) {
                annotationCopy = annotationCopy[bigTokens[1].split(".")[0]];
            }
            annotationPath = annotationPath.substring(bigTokens[1].split(".")[0].length + 1);
            let text = bigTokens[1].split(".")[0];
            // Try to get type from annotation object
            if (checkIfObjectIsObject(annotationCopy) && annotationCopy["@type"] !== undefined) {
                text = annotationCopy["@type"];
            }
            output = output.concat(" > " + rangeToString(text, true).replace("_", "+"));
        } else if (annotationPath.startsWith(".")) { // Start with property
            // Obj = sh_getJSONRef_Property(obj, smallTokens[1]);
            if (annotationCopy[prettyPrintURI(smallTokens[1])] !== undefined) {
                annotationCopy = annotationCopy[prettyPrintURI(smallTokens[1])];
            }
            annotationPath = annotationPath.substring(smallTokens[1].length + 1);
            output = output.concat("." + prettyPrintURI(smallTokens[1]));
        } else {
            foundDelimiter = false;
        }
    } while (foundDelimiter);
    return escapeHtml(output);
}

// Returns a human readable version of a type (class)
function typePrinter(typeValue) {
    if (!typeValue) {
        return "Annotation"; // To have a generic fallback value to show
    }
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