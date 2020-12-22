/**
 *  @file Functions related to the JS Tree visualization and the error board
 **/

// Create a visualization based on the given annotation
function renderJsTree(annotationEntry) {
    SDOC.$jsTreeTable.html("<div></div>"); // Delete previous content
    let data = createJsTree(annotationEntry); // Create data for visualization based on the given annotation
    // Make all links in the tree selectable (e.g. to select and copy text, that is not possible by default because the rows are links, and therefore automatically draggable)
    const funcRemoveDrag = function() {
        let allTreeAnchors = $('.jstree-anchor');
        allTreeAnchors.attr("draggable", false);
    };
    // Create tree visualization
    SDOC.$jsTreeTable.children(0)
        .jstree({
            plugins: ["core"],
            core: {
                "themes": {
                    "icons": false,
                    "dots": true,
                    "responsive": true,
                    "stripes": false,
                    "rootVisible": true,
                },
                "data": data
            }
        })
        .bind("select_node.jstree", function(event, data) {
            showRelatedErrors(data.node.data);
        })
        .on("ready.jstree", funcRemoveDrag)// At start
        .on("open_node.jstree", funcRemoveDrag); // Every time a node is opened (by default it is drawn draggable
}

// Creates data for the JS Tree visualization based on the given annotation
function createJsTree(annotationEntry) {
    let content = JSON.parse(JSON.stringify(annotationEntry.content));
    let rootNode = createJsTreeNode("Annotation", "", 0, "$", annotationEntry.verificationReport);
    let rootChildren = [];
    for (let prop of Object.keys(content)) {
        if (prop !== "@context") {
            let annotationPath;
            if (prop === "@type" || prop === "@reverse") {
                annotationPath = "$." + prop;
            } else {
                if (prop.includes(":")) {
                    annotationPath = "$." + prop;
                } else {
                    annotationPath = "$.schema:" + prop;
                }
            }
            rootChildren.push(createJsTreeNode(prop, content[prop], 1, annotationPath, annotationEntry.verificationReport));
        }
    }
    rootNode.children = rootChildren;
    return rootNode;
}

// Returns a data node for the JS tree visualization
function createJsTreeNode(text, value, depth, annotationPath, verificationReport) {
    let keyPath = annotationPath; // The path of the current key (key can be a property or an array index)
    let valuePath = null; // The path of the current value (null if the row has no value -> value is object or array)
    let valueType;
    let val = "";
    let children = [];
    if (Array.isArray(value)) {
        // Array of values
        valueType = "arr";
        for (let i = 0; i < value.length; i++) {
            children.push(createJsTreeNode(i, value[i], depth + 1, annotationPath + "/" + i, verificationReport));
        }
    } else if (checkIfObjectIsObject(value)) {
        if (!new RegExp('.*/[0-9]+$',).test(annotationPath)) {
            annotationPath += "/0";
        }

        // Class or typed literal
        valueType = "obj";
        for (let prop of Object.keys(value)) {
            if (prop !== "@context") {
                let newAnnotationPath = annotationPath;
                if (!prop.startsWith("@")) {
                    if (prop.includes(":")) {
                        newAnnotationPath += "." + prop;
                    } else {
                        newAnnotationPath += ".schema:" + prop;
                    }
                } else {
                    newAnnotationPath += "." + prop;
                }
                children.push(createJsTreeNode(prop, value[prop], depth + 1, newAnnotationPath, verificationReport));
            }
        }
    } else {
        // Literal
        valueType = "lit";
        val = value;
        if (!new RegExp('.*/[0-9]+$',).test(annotationPath)) {
            annotationPath += "/0";
        }
        valuePath = annotationPath;
    }
    let depthMod = 24 * (depth + 1) + "px";
    let spanStyle = 'flex: 0 0 calc( ( 100% + ' + depthMod + ' ) * 0.35 - ' + depthMod + ' );';
    let pStyle = 'flex: 1 1 calc( ( 100% + ' + depthMod + ' ) * 0.65 - 26px );';

    // Get the errors from the verification report for the actual visualization row
    let relatedErrors = findRelatedErrors(annotationPath, value, keyPath, valuePath, verificationReport.errors);

    let iconHtml = "";
    let errorClass = "";
    if (relatedErrors.length > 0) {
        if (relatedErrors.find(el => el.severity === "Critical")) {
            iconHtml = '<i class="material-icons val-icon val-icon-critical">warning</i> ';
            errorClass = "jstree-entry-critical";
        } else if (relatedErrors.find(el => el.severity === "Error")) {
            iconHtml = '<i class="material-icons val-icon val-icon-error">cancel</i> ';
            errorClass = "jstree-entry-error";
        } else if (relatedErrors.find(el => el.severity === "Warning")) {
            iconHtml = '<i class="material-icons val-icon val-icon-warning">warning</i> ';
            errorClass = "jstree-entry-warning";
        }
    }
    // Escape value to output and catch rare cases
    if (val === null) {
        val = "<b title='This is a null value' style='color: rebeccapurple'>null</b>";
    } else if (val === undefined) {
        val = "<b title='This is an \"undefined\" value' style='color: rebeccapurple'>undefined</b>";
    } else {
        val = escapeHtml(val);
    }
    let res = {
        'text': "<span style='" + spanStyle + "' class='" + errorClass + "'>" + iconHtml + escapeHtml(text) + "</span><p style='" + pStyle + "' class='" + errorClass + "'>" + val + "</p>",
        'state': {
            'opened': true,
            'selected': false,
        },
        'data': {
            'annotationPath': annotationPath,
            'relatedErrors': relatedErrors,
            'keyPath': keyPath,
            'valuePath': valuePath
        }
    };
    if (valueType !== "lit") {
        res.children = children;
    }

    return res;
}

// Show errors for a given visualization element, if there are any errors
function showRelatedErrors(data) {
    if (data.relatedErrors.length === 0) {
        // No errors to show, do nothing
        return;
    }
    let currentNodeHash = generateHash(JSON.stringify(data));
    if (SDOC.selectedNodeHash === currentNodeHash) {
        // Already showing selected error, do nothing
        return;
    }
    SDOC.selectedNodeHash = currentNodeHash;
    SDOC.$errorBoard.removeClass("left");
    let elementName, pathCode;
    if (data.annotationPath === "$/0") {
        elementName = "General errors";
        pathCode = "<p><p>"; // We need a little bit of blank space below the title
    } else {
        elementName = extractElementNameFromPath(data.annotationPath);
        pathCode = '<p><i class="material-icons">subdirectory_arrow_right</i> <span>' + prettyPrintAnnotationPath(data.annotationPath, SDOC.activeAnnotation.content) + '</span></p>';
    }
    SDOC.$errorBoardName.html(escapeHtml(elementName));
    SDOC.$errorBoardPath.html(pathCode);
    SDOC.$errorBoardContainer.html("");
    let relatedErrors = jhcpy(data.relatedErrors);
    relatedErrors = relatedErrors.sort((a, b) => (a.severity > b.severity) ? 1 : -1);
    for (let errorEntry of relatedErrors) {
        SDOC.$errorBoardContainer.append(createHtmlForErrorEntry(errorEntry));
    }
}

// Creates HTML code for a given error entry
function createHtmlForErrorEntry(errorEntry) {
    let templateHtml = document.getElementById("template-error-entry").innerHTML;
    let errorSeverityClass, errorSeverityIcon, errorHoverTitle;
    switch (errorEntry.severity) {
        case "Warning":
            errorSeverityClass = "yellow";
            errorSeverityIcon = "warning";
            errorHoverTitle = "Severity: Warning";
            break;
        case "Error":
            errorSeverityClass = "red";
            errorSeverityIcon = "cancel";
            errorHoverTitle = "Severity: Error";
            break;
        case "Critical":
            errorSeverityClass = "darkred";
            errorSeverityIcon = "warning";
            errorHoverTitle = "Severity: Critical Error!";
            break;
    }
    return templateHtml
        .replace(/{{errorSeverityClass}}/g, errorSeverityClass)
        .replace(/{{errorSeverityIcon}}/g, errorSeverityIcon)
        .replace(/{{errorTitle}}/g, escapeHtml(errorEntry.name))
        .replace(/{{errorHoverTitle}}/g, escapeHtml(errorHoverTitle))
        .replace(/{{errorDescription}}/g, escapeHtml(errorEntry.description))
        .replace(/{{errorExplain}}/g, createExplainHTML(errorEntry));
}

function extractElementNameFromPath(path) {
    let indexStartProperty = path.lastIndexOf(":") || 0;
    let indexStartType = path.lastIndexOf("@") || 0;
    if (indexStartType > indexStartProperty) {
        indexStartProperty = indexStartType - 1;
    }
    let indexEnd = path.lastIndexOf("/") || path.length;
    return path.substring(indexStartProperty + 1, indexEnd);
}

// Get the errors from the verification report for the given visualization row (part of the actual annotation)
function findRelatedErrors(annotationPath, value, keyPath, valuePath, errors) {
    let foundErrors = [];
    // We could also use the error.name for distinction (important for general errors like 300)
    const rootErrorCodes = [100, 101, 102, 103, 104, 201, 202, 203, 205, 206, 300, 301, 999]; // Those global errors that are shown at the root
    const keyBasedErrorCodes = [303, 304, 305];
    const valueBasedErrorCodes = [207, 300];
    const typeBasedErrorCodes = [309, 200]; // Errors are shown at the @type key of the entity
    const idBasedErrorCodes = [300]; // Errors are shown at the @type key of the entity
    foundErrors.push(...errors.filter(el => el.annotationPath === valuePath && valueBasedErrorCodes.includes(el.errorCode)));
    foundErrors.push(...errors.filter(el => el.annotationPath + "." + el.value === keyPath && keyBasedErrorCodes.includes(el.errorCode)));
    foundErrors.push(...errors.filter(el => keyPath === "$" && (el.annotationPath === "$" || !el.annotationPath) && rootErrorCodes.includes(el.errorCode)));
    foundErrors.push(...errors.filter(el => el.annotationPath + ".@type" === keyPath && typeBasedErrorCodes.includes(el.errorCode)));
    foundErrors.push(...errors.filter(el => el.annotationPath + ".@id" === keyPath && idBasedErrorCodes.includes(el.errorCode)));
    foundErrors.push(...errors.filter(el => el.annotationPath === annotationPath && !valueBasedErrorCodes.includes(el.errorCode) && !keyBasedErrorCodes.includes(el.errorCode) && !typeBasedErrorCodes.includes(el.errorCode) && !idBasedErrorCodes.includes(el.errorCode)));
    return foundErrors;
}

// Hide the error board DIV
function closeErrorBoard() {
    SDOC.$errorBoard.addClass("left");
    SDOC.selectedNodeHash = null;
}