const moment = require("moment");

function isObject(object) {
    if (Array.isArray(object)) {
        return false;
    }
    if (object === undefined || object === null) {
        return false;
    }
    return typeof object === 'object';
}

function isString(object) {
    if (object === undefined || object === null) {
        return false;
    }
    return typeof object === 'string' || object instanceof String;
}

function isNumber(object) {
    if (object === undefined || object === null || Number.isNaN(object)) {
        return false;
    }
    return typeof object === 'number';
}

function isBoolean(object) {
    if (object === undefined || object === null) {
        return false;
    }
    return typeof object === 'boolean';
}

function isUndefined(object) {
    return object === undefined;
}

function isNull(object) {
    return object === null;
}

// Levenshteins distance algorithm, returns the distance (difference value) between two strings
function levDist(s, t) {
    let d = []; // 2d matrix
    // Step 1
    let n = s.length;
    let m = t.length;
    if (n === 0) return m;
    if (m === 0) return n;
    // Create an array of arrays in javascript (a descending loop is quicker)
    for (let i = n; i >= 0; i--) d[i] = [];
    // Step 2
    for (let i = n; i >= 0; i--) d[i][0] = i;
    for (let j = m; j >= 0; j--) d[0][j] = j;
    // Step 3
    for (let i = 1; i <= n; i++) {
        let s_i = s.charAt(i - 1);
        // Step 4
        for (let j = 1; j <= m; j++) {
            // Check the jagged ld total so far
            if (i === j && d[i][j] > 4) return n;
            let t_j = t.charAt(j - 1);
            let cost = (s_i === t_j) ? 0 : 1; // Step 5
            // Calculate the minimum
            let mi = d[i - 1][j] + 1;
            let b = d[i][j - 1] + 1;
            let c = d[i - 1][j - 1] + cost;
            if (b < mi) mi = b;
            if (c < mi) mi = c;
            d[i][j] = mi; // Step 6
            // Damerau transposition
            if (i > 1 && j > 1 && s_i === t.charAt(j - 2) && s.charAt(i - 2) === t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }
    // Step 7
    return d[n][m];
}

function mergeArrays(arrA, arrB) {
    for (let i = 0; i < arrB.length; i++) {
        arrA.push(arrB[i]);
    }
    return arrA;
}

function isUrl(s) {
    if (s.substring(0, 4) === "www.") {
        s = "http://".concat(s); // Allow url without protocol
    }
    // Let regex = new RegExp( /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi );
    let regex = new RegExp(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i);
    let result = s.match(regex);
    if (result == null) {
        return false;
    }
    if (result.length === 1) {
        if (result[0].length === s.length) {
            return true;
        }
    }
    return false;
}

// Returns the part of a ds object depending on the given path
// We assume that the dsPath is always given completely from the root (starts with "$")
function resolvePath_graphDS(graphDS, dsPath) {
    // DsPath has following format:
    // $ stands for the root
    // Schema:Bakery stands for a class from the standard SDO vocab
    // Schema:address stands for a property from the standard SDO vocab
    // _ is a delimiter between classes in a MTE class, e.g. "schema:Hotel_schema:Product"
    // . is a delimiter between a class and its property, e.g.  "schema:Hotel.schema:address"
    // / is a delimiter between a property and its range, e.g.  "schema:Hotel.schema:address/schema:PostalAddress"
    // $.schema:address/schema:PostalAddress.schema:addressRegion
    let foundDelimiter = true;
    let resultRef = {};
    try {
        do {
            // Check property delimiter
            let bigTokens = dsPath.split("/");
            if (dsPath.startsWith("$")) { // Start with root
                // Assume that the first element of the graphDS is the root node
                // Set that as the initial resultReference
                resultRef = graphDS[Object.keys(graphDS)[0]];
                dsPath = dsPath.substring(1); // Trim dsPath from processed part
            } else if (dsPath.startsWith(".")) { // Start with property
                let smallTokens = bigTokens[0].split(".");
                resultRef = resolvePathDS_graphProperty(graphDS, resultRef, smallTokens[1]); // SmallTokens[1] is the next property URI, e.g. "schema:address"
                dsPath = dsPath.substring(smallTokens[1].length + 1);  // Trim dsPath from processed part
            } else if (dsPath.startsWith("/")) { // Start with range
                resultRef = resolvePathDS_graphRange(graphDS, resultRef, bigTokens[1].split(".")[0]); // BigTokens[1].split(".")[0] is the next range URI, e.g. "schema:PostalAddress"
                dsPath = dsPath.substring(bigTokens[1].split(".")[0].length + 1);  // Trim dsPath from processed part
            } else {
                foundDelimiter = false;
            }
        } while (foundDelimiter);
        return resultRef;
    } catch (e) {
        console.log(e);
        console.log("dsPath: " + dsPath);
        return null;
    }
}

// Returns the part of a given object that corresponds to the property definition given
// = looks for a given property inside the defined properties of a given class object
function resolvePathDS_graphProperty(graphDS, resultRef, propertyURI) {
    let propArray;
    if (resultRef["sh:targetClass"] !== undefined) { // Is root class
        propArray = resultRef["sh:property"];
    } else {   // Is not root class
        // ResultRef["sh:node"] is a URI
        if (!resultRef["sh:node"] || !graphDS[resultRef["sh:node"]]["sh:property"]) {
            throw new Error("Path is invalid for the given Domain Specification."); // Class has no properties defined
        }
        propArray = graphDS[resultRef["sh:node"]]["sh:property"];
        // PropArray consists of node URIs for propertyShapes at this point
    }
    for (let i = 0; i < propArray.length; i++) {
        if (graphDS[propArray[i]] && graphDS[propArray[i]]["sh:path"] === propertyURI) {
            return graphDS[propArray[i]]; // Return the propertyShape Object
        }
    }
    throw new Error("Path is invalid for the given Domain Specification."); // If no match was found
}

// Returns the part of a given object that corresponds to the range definition given
// = looks for a given range inside the defined ranges of a given property object
function resolvePathDS_graphRange(graphDS, resultRef, rangeURI) {
    if (rangeURI.split("_").length > 1) {
        let classes = rangeURI.split("_");
        rangeURI = [];
        for (let j = 0; j < classes.length; j++) {
            rangeURI.push(classes[j]);
        }
    }
    let rangeArray = resultRef["sh:or"];
    // RangeArray consists of node URIs for range nodes at this point
    for (let i = 0; i < rangeArray.length; i++) {
        if (isString(rangeURI) && graphDS[rangeArray[i]] && graphDS[rangeArray[i]]["sh:datatype"] === rangeURI) {
            return graphDS[rangeArray[i]];
        }
        if (graphDS[rangeArray[i]]["sh:class"] !== undefined && checkIfTypesMatch(graphDS[rangeArray[i]]["sh:class"], rangeURI)) {
            return graphDS[rangeArray[i]];
        }
    }
    throw new Error("Path is invalid for the given Domain Specification."); // If no match was found
}

// Returns the part of a ds object depending on the given path
// We assume that the dsPath is always given completely from the root (starts with "$")
// This function may give non-reference values back! Do not use to SET new data
function resolvePath_graphAnnotation(graphAnn, annotationPath, rootId) {
    // AnnotationPath has following format:
    // $ stands for the root
    // Schema:address stands for a property from the standard SDO vocab
    // 1 stands for the value index for a property(array)
    // . is a delimiter between a class and its property, e.g.  "$.schema:address"
    // / is a delimiter between a property and its range, e.g.  "$.schema:address/1"
    // Ranges of properties are given as their array-index, starting from 0. If there is no array, then that value is referenced by 0.
    // $.schema:address/0.schema:addressRegion/2
    let foundDelimiter = true;
    let result = {};
    try {
        do {
            // Check property delimiter
            let bigTokens = annotationPath.split("/");
            if (annotationPath.startsWith("$")) { // Start with root
                // Assume that the first element of the graphAnn is the root node
                // Set that as the initial resultReference
                result = graphAnn[rootId];
                annotationPath = annotationPath.substring(1); // Trim annotationPath from processed part
            } else if (annotationPath.startsWith(".")) { // Start with property
                let smallTokens = bigTokens[0].split(".");
                result = resolvePathAnnotation_graphProperty(result, smallTokens[1]); // SmallTokens[1] is the next property URI, e.g. "schema:address"
                annotationPath = annotationPath.substring(smallTokens[1].length + 1);  // Trim annotationPath from processed part
            } else if (annotationPath.startsWith("/")) { // Start with range
                result = resolvePathAnnotation_graphRange(graphAnn, result, bigTokens[1].split(".")[0]); // BigTokens[1].split(".")[0] is the range index, e.g. 0
                annotationPath = annotationPath.substring(bigTokens[1].split(".")[0].length + 1);  // Trim annotationPath from processed part
            } else {
                foundDelimiter = false;
            }
        } while (foundDelimiter);
        return result;
    } catch (e) {
        console.log(e);
        console.log("annotationPath: " + annotationPath);
        return null;
    }
}

// Returns the part of a given object that corresponds to the property definition given
// = looks for a given property inside the defined properties of a given class object
function resolvePathAnnotation_graphProperty(resultRef, propertyURI) {
    if (resultRef[propertyURI] !== undefined) {
        return resultRef[propertyURI];
    } else {
        throw new Error("Path is invalid for the given Annotation."); // If no match was found
    }
}

// Returns the part of a given object that corresponds to the range definition given
// = looks for a given range inside the defined ranges of a given property object
function resolvePathAnnotation_graphRange(graphAnn, resultRef, rangeIndex) {
    // ResultRef can be any literal, reference object, or array of such
    rangeIndex = Number(rangeIndex); // Convert to Number since index was parsed from the string path
    if (rangeIndex !== 0 && (!Array.isArray(resultRef) || resultRef.length < rangeIndex + 1)) {
        // Invalid value index
        throw new Error("Path is invalid for the given Annotation."); // If no match was found
    }
    let range;
    if (Array.isArray(resultRef)) {
        // Is array of values
        range = resultRef[rangeIndex];
    } else {
        // Is single value
        range = resultRef;
    }
    if (isObject(range)) {
        // Is reference object - assume that there is a "@id"
        return graphAnn[range["@id"]];
    } else {
        // Is literal
        return range;
    }
}

// Returns the depth inside a DS based on the path given
function getDepthDS(path) {
    // The amount of / inside the path (used for the range of a property) tells how deep the depth is
    return path.split("/").length - 1;
}

// Checks if the URI(s) in types1 (array or single value) match the URI(s) in types2 (array or single value)
function checkIfTypesMatch(types1, types2) {
    if (Array.isArray(types1)) {
        if (Array.isArray(types2)) {
            for (let i = 0; i < types1.length; i++) {
                if (types2.indexOf(types1[i]) === -1) {
                    return false;
                }
            }
            for (let i = 0; i < types2.length; i++) {
                if (types1.indexOf(types2[i]) === -1) {
                    return false;
                }
            }
            return true;
        } else {
            return (types1.length === 1 && types1[0] === types2);
        }
    } else {
        if (Array.isArray(types2)) {
            return (types2.length === 1 && types2[0] === types1);
        } else {
            return (types1 === types2);
        }
    }
}

// Returns the string representation of a type according to the path syntax
function stringifyTypeForPath(typesArray) {
    // _ is a delimiter between classes in a MTE class, e.g. "schema:Hotel_schema:Product"
    let result = "";
    for (let i = 0; i < typesArray.length; i++) {
        result = result.concat(typesArray[i]);
        if (i + 1 !== typesArray.length) {
            result = result.concat("_");
        }
    }
    return result;
}

// Reuses the prettyPrintURI function to prettyPrint vocabulary terms, but allows the input of arrays (MTEs)
function prettyPrintURIMTEs(termDefinition) {
    let result = "";
    if (Array.isArray(termDefinition)) {
        for (let curTerm of termDefinition) {
            result += prettyPrintURI(curTerm) + ",";
        }
        result = result.substring(0, result.length - 1);
    } else {
        result = prettyPrintURI(termDefinition);
    }
    return result;
}

function prettyPrintURI(uri) {
    if (!isString(uri)) {
        console.log("URI THAT IS NOT STRING!");
        console.log(uri);
        return uri;
    }
    if (uri.startsWith("schema:")) {
        return uri.substring("schema:".length);
    }
    return uri;
}

function reversePrettyPrintURI(string) {
    if (string.indexOf(":") === -1) {
        return "schema:" + string;
    }
    return string;
}

// https://schema.org/Time (we allow to omit the seconds)
// https://www.w3.org/TR/xmlschema-2/#isoformats
// Returns the valid time Moment object if accepted, returns false if not valid
function genTimeObj(val) {
    // Todo: Exact definition of accepted formats, and library or implementation to verify them - https://github.com/semantifyit/sdo-check/issues/7
    let validFormats = ["HH:mm:ss.SSSZ", "HH:mm:ss.SSS", "HH:mm:ssZ", "HH:mm:ss", "HH:mmZ", "HH:mm"];
    for (let i = 0; i < validFormats.length; i++) {
        let timeObj = moment(val, validFormats[i], true);
        if (timeObj.isValid()) {
            return timeObj;
        }
    }
    return false;
}

// https://en.wikipedia.org/wiki/ISO_8601#Dates
// https://www.w3.org/TR/xmlschema-2/#isoformats
// ISO_DIS%208601-1.pdf (ISO8601 from 2016)
// Returns the valid date Moment object if accepted, returns false if not valid
function genDateTimeObj(val) {
    // Todo: Exact definition of accepted formats, and library or implementation to verify them - https://github.com/semantifyit/sdo-check/issues/7
    let validFormats = ["YYYY-MM-DDTHH:mm:ss.SZ", "YYYY-MM-DDTHH:mm:ssZ", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ss.S", "YYYY-MM-DDTHH:mmZ", "YYYY-MM-DDTHH:mm"];
    validFormats.push(...["-YYYY-MM-DDTHH:mm:ss.SZ", "-YYYY-MM-DDTHH:mm:ssZ", "-YYYY-MM-DDTHH:mm:ss", "-YYYY-MM-DDTHH:mm:ss.S", "-YYYY-MM-DDTHH:mmZ", "-YYYY-MM-DDTHH:mm"]);
    for (let i = 0; i < validFormats.length; i++) {
        let dateTimeObj = moment(val, validFormats[i], true);
        if (dateTimeObj.isValid()) {
            return dateTimeObj;
        }
    }
    return false;
}

// https://en.wikipedia.org/wiki/ISO_8601#Dates
// https://www.w3.org/TR/xmlschema-2/#isoformats
// ISO_DIS%208601-1.pdf (ISO8601 from 2016)
// Returns the valid date Moment object if accepted, returns false if not valid
function genDateObj(val) {
    // Todo: Exact definition of accepted formats, and library or implementation to verify them - https://github.com/semantifyit/sdo-check/issues/7
    let validFormats = [];
    // Calender Dates - Complete representations
    validFormats.push(...["YYYY-MM-DD", "YYYYMMDD"]);
    // Calender Dates - Representations with reduced precision
    validFormats.push(...["YYYY-MM", "YYYY", "YY"]);
    // Calender Dates - Expanded Representations
    validFormats.push(...["YYYYYY-MM-DD", "YYYYYYMMDD"]);
    validFormats.push(...["YYYYYY-MM", "YYYYYY"]); // A specific century    Basic format: ±YYY Example: +0019 is missing - no way to specifically describe that with moment.js
    // Ordinal Dates - Complete Representations
    validFormats.push(...["YYYY-DDDD", "YYYYDDDD"]);
    // Ordinal Dates - Expanded Representations
    validFormats.push(...["YYYYYY-DDDD", "YYYYYYDDDD"]);
    // Week Dates - Complete Representations
    // validFormats.push(...["GGGG-WWW-D", "GGGGWWWD"]); moment.js has no valid format that includes the letter "W", e.g. for "1985-W15-5",
    // Week Dates - Representations with reduced precision
    // validFormats.push(...["GGGG-WWW", "GGGGWWW"]); moment.js has no valid format that includes the letter "W", e.g. for "1985-W15",
    // Week Dates - Expanded Representations
    validFormats.push(...[moment.HTML5_FMT.WEEK]); // We take at least the only week format that moment.js offers
    //  "--MM-DD", "--MMDD" //these formats are listed in the wiki page, but not in the iso specification 2016
    let momentObj = moment(val, validFormats, true);
    if (momentObj.isValid()) {
        return momentObj;
    } else {
        return false;
    }
}

module.exports = {
    isObject,
    isString,
    isNumber,
    isBoolean,
    isUndefined,
    isNull,
    levDist,
    mergeArrays,
    isUrl,
    resolvePath_graphDS,
    resolvePath_graphAnnotation,
    getDepthDS,
    stringifyTypeForPath,
    prettyPrintURI,
    prettyPrintURIMTEs,
    reversePrettyPrintURI,
    genTimeObj,
    genDateTimeObj,
    genDateObj
};