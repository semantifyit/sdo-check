/**
 * @file Main front-end functions of the tool
 */

// Process starts here
$(document).ready(async function() {
    $.material.init();      // Start Material Design feeling for HTML code
    SDOC.$urlRowInput.focus();  // Set cursor focus on the URL input field
    initCodeMirror();      // Initialize Code Mirror
    initListener();        // Initialize event listeners
    $.material.init();      // Run again for dynamically loaded HTML code
    SDOC.$btnStartVerificationSrc.show(); // Make button to start verification based on snippet visible
    const searchUrl = getParameter("url");  // Read optional verification target parameter in URL
    if (searchUrl) {
        // If there is a verification target as parameter in the URL, then automatically start a verification for that target
        SDOC.$urlRowInput.val(searchUrl);
        checkUrlRowInput();
        SDOC.$btnStartVerificationUrl.click();
    }
});

// Global variables
const SDOC = {
    // UI elements (start with $)
    $templateContainer: $('#template-container'),
    $modalContainer: $('#modal-container'),
    $inspectModal : $('#inspect-modal'),
    $inspectModalContent: $('#pre-inspect-modal-content'),
    $urlRowIcon: $('#url-row-icon'),
    $urlRowLoading: $('#url-row-loading'),
    $urlRowInput: $('#url-row-input'),
    $btnStartVerificationUrl: $('#btn-start-verification-url'),
    $btnStartVerificationSrc: $('#btn-start-verification-src'),
    $btnStartVerificationSrcLink: $('#btn-start-verification-src > a'),
    $btnReturnToOverview: $('#btn-return-to-overview'),
    $btnShowRawAnnotation: $('#btn-raw-annotation'),
    $resizer: $('#resizer'),
    $htmlInput: $('#html-input'),
    $htmlSrcLoading: $('#html-src-loading'),
    $semVisLoading: $('#sem-vis-loading'),
    $semVisContainer: $('#sem-vis-container'),
    $semVisContainerVp: $('#sem-vis-container-vp'),
    $annotationOverview: $('#annotation-overview'),
    $annotationDetails: $('#annotation-details'),
    $annotationInvalidJSONLD: $('#annotation-invalid-jsonld'),
    $jsTreeTable: $('#js-tree-table'),
    $jsTreeTableWrapper: $('#js-tree-table-wrapper'),
    $annotationTable: $('#annotation-table'),
    $errorBoard: $('#error-board'),
    $errorBoardContainer: $('#error-board__container'),
    $errorBoardName: $('#error-board__name'),
    $errorBoardPath: $('#error-board__path'),
    // Settings
    animationDuration_fade: 100,
    cmModeHMTL: "htmlmixed",
    cmModeJSONLD: "jsonld",
    // In-memory data
    urlVerificationInProcess: false,
    snippetVerificationInProcess: false,
    sdoAdapterInitialized: false,
    selectedNodeHash: null,
    mySDOAdapter: null,
    extractedAnnotations: {},
    activeAnnotation: undefined
};

// Initializes listener functions for UI elements
function initListener() {
    // If enter is pressed in the URL input field, then the verification is started for that URL
    SDOC.$urlRowInput.on('keyup', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            document.activeElement.blur(); // Removes focus from input field
            SDOC.$btnStartVerificationUrl.click(); // Triggers the verification
        }
    });
    // Set listener for "resizer" column
    setResizeListeners(document.getElementById('resizer'));
    // Change listener for the editor on the left side. Changes the mode of code mirror depending on the actual input
    SDOC.$codeMirror.on('change', function(e) {
        let input = SDOC.$codeMirror.getDoc().getValue();
        if (input !== "") {
            SDOC.$codeMirror.setOption("styleActiveLine", true);
            SDOC.$btnStartVerificationSrcLink.attr("disabled", false);
            if (!anticipateJSON(input)) {
                if (SDOC.$codeMirrorMode !== SDOC.cmModeHMTL) {
                    changeCodeMirrorMode(SDOC.cmModeHMTL);
                }
            } else {
                if (SDOC.$codeMirrorMode !== SDOC.cmModeJSONLD) {
                    changeCodeMirrorMode(SDOC.cmModeJSONLD);
                }
            }
        } else {
            SDOC.$btnStartVerificationSrcLink.attr("disabled", true);
            SDOC.$codeMirror.setOption("styleActiveLine", false);
            if (SDOC.$codeMirrorMode !== SDOC.cmModeHMTL) {
                changeCodeMirrorMode(SDOC.cmModeHMTL);
            }
        }
    });
}

// Makes the column in the center resizable/draggable (divider between editor and visualization)
function setResizeListeners(div) {
    let pageX, divHTMLView, divResultView, divVisContainer, divEditorRow, htmlWidth, resultWidth;
    div.addEventListener('mousedown', function(e) {
        divHTMLView = $('#editor-row > div:nth-child(1)');
        divResultView = $('#editor-row > div:nth-child(3)');
        divEditorRow = $('#editor-row');
        divVisContainer = $('#sem-vis-container');
        pageX = e.pageX;
        htmlWidth = divHTMLView.width();
        resultWidth = divResultView.width();
    });
    document.addEventListener('mousemove', function(e) {
        if (divHTMLView) {
            let diffX = e.pageX - pageX;
            let absoluteWidthHTML = htmlWidth + diffX;
            let absoluteWidthResult = resultWidth - diffX;
            let percentWidthHTML = absoluteWidthHTML * 100 / (absoluteWidthHTML + absoluteWidthResult);
            let percentWidthResult = absoluteWidthResult * 100 / (absoluteWidthHTML + absoluteWidthResult);
            divHTMLView.width(percentWidthHTML + '%');
            divResultView.width(percentWidthResult + '%');
            divVisContainer.width(percentWidthResult * 2 + "%");
        }
    });
    document.addEventListener('mouseup', function(e) {
        divHTMLView = undefined;
    });
}

// Initialize CodeMirror
function initCodeMirror() {
    // Code snippet editor starts in HTML mode
    SDOC.$codeMirrorMode = SDOC.cmModeHMTL;
    // Initialize CodeMirror for code snippet editor
    SDOC.$codeMirror = CodeMirror.fromTextArea(document.getElementById('html-input'), {
        styleActiveLine: false,
        lineNumbers: true,
        lineWrapping: true,
        gutters: ["CodeMirror-lint-markers"],
        lint: false,
        mode: SDOC.$codeMirrorMode
    });
    // Initialize CodeMirror for failed JSON-LD output
    SDOC.$codeMirrorJSONLDFAILED = CodeMirror.fromTextArea(document.getElementById('codemirror-invalid-jsonld'), {
        lineNumbers: true,
        lineWrapping: true,
        gutters: ["CodeMirror-lint-markers"],
        lint: true,
        readOnly: true,
        mode: {name: "application/json", jsonld: true}
    });
}

// Initializes the global SDO Adapter with the latest schema.org vocabulary
async function initSdoAdapter() {
    SDOC.mySDOAdapter = new SDOAdapter();
    await SDOC.mySDOAdapter.addVocabularies(await SDOC.mySDOAdapter.constructSDOVocabularyURL("latest"));
}

// 1.A) Start the verification based on the URL in the url input (fetch HTML code of target URL and put it in the code snippet editor)
async function startVerificationOfURL() {
    if (SDOC.urlVerificationInProcess || SDOC.snippetVerificationInProcess || SDOC.$urlRowInput.val() === "") {
        return;
    }
    SDOC.urlVerificationInProcess = true;
    SDOC.$urlRowIcon.fadeOut(SDOC.animationDuration_fade);
    SDOC.$urlRowLoading.delay(SDOC.animationDuration_fade).fadeIn(SDOC.animationDuration_fade);
    SDOC.$htmlSrcLoading.fadeIn(SDOC.animationDuration_fade);
    closeErrorBoard();
    let userInput = SDOC.$urlRowInput.val();
    history.pushState(null, null, window.location.origin + window.location.pathname + "?url=" + userInput); // Update URL as parameter in the address bar
    // TODO note:
    // We use the public API of semantify.it to retrieve the dynamic HTML of a web page.
    // You can substitute this with your own HTML fetching module (semantify.it uses https://www.npmjs.com/package/puppeteer )
    let res =  await $.ajax({
        type: "POST",
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        url: "https://semantify.it/api/retrieve/html",
        data: JSON.stringify({url: userInput})
    });
    SDOC.$btnStartVerificationSrcLink.attr("disabled", false);
    SDOC.urlVerificationInProcess = false;
    if (res && res.source) {
        SDOC.$codeMirror.getDoc().setValue(res.source);
        startExtractionOfAnnotations();
    } else if (res && res.message) {
        SDOC.$codeMirror.getDoc().setValue(res.message + " Target URL not retrievable.");
    } else {
        SDOC.$codeMirror.getDoc().setValue("Target URL not retrievable.");
    }
    SDOC.$urlRowLoading.fadeOut(SDOC.animationDuration_fade);
    SDOC.$urlRowIcon.delay(SDOC.animationDuration_fade).fadeIn(SDOC.animationDuration_fade);
    SDOC.$htmlSrcLoading.fadeOut(SDOC.animationDuration_fade);
}

// 1.B) Extract annotations from the code snippet editor
async function startExtractionOfAnnotations() {
    let input = SDOC.$codeMirror.getDoc().getValue();
    if (SDOC.urlVerificationInProcess || SDOC.snippetVerificationInProcess || input === "" || SDOC.$btnStartVerificationSrcLink.attr("disabled") === "disabled") {
        return;
    }
    SDOC.snippetVerificationInProcess = true;
    closeErrorBoard();
    SDOC.$semVisLoading.fadeIn(SDOC.animationDuration_fade);
    let html = input;
    if (anticipateJSON(input)) {
        html= '<script type="application/ld+json">' + html + '</script>';
    }
    let annotations = Extractor.extractSemanticAnnotations(html);
    SDOC.extractedAnnotations = transformSemanticExtraction(annotations);
    startVerificationOfFoundAnnotations();
}

// 2) Start verification for all found annotations
async function startVerificationOfFoundAnnotations() {
    if (SDOC.extractedAnnotations.length === 0) {
        // Input was not valid jsonLD or the source code did not contain any structured data
    } else {
        // Semantic data found
        for (let validAn of SDOC.extractedAnnotations) {
            validAn.verificationReport = await GeneralVerificator.isAnnotationValid(validAn.content);
        }
        SDOC.extractedAnnotations = SDOC.extractedAnnotations.sort(function(a, b) {
            return b.verificationReport.errors.length - a.verificationReport.errors.length;
        });
        let counter = 1;
        for (let validAn of SDOC.extractedAnnotations) {
            validAn.entryNr = counter++;
        }
    }
    if (!SDOC.sdoAdapterInitialized) {
        SDOC.sdoAdapterInitialized = true;
        await initSdoAdapter();
    }
    SDOC.snippetVerificationInProcess = false;
    renderAnnotationsOverview();
}

// 3) Render the overview with all annotations found and verified
function renderAnnotationsOverview() {
    SDOC.$annotationOverview.html("");
    for (let validAn of SDOC.extractedAnnotations) {
        SDOC.$annotationOverview.append(createAnnotationEntry(validAn));
    }
    if (SDOC.extractedAnnotations.length === 0) {
        SDOC.$annotationOverview.html("<div class='errorMsg'>No annotations found</div>");
    }
    SDOC.$annotationOverview.css("padding-top", 0);     // Reset start padding
    let maxHeight = SDOC.$resizer.css("height").substring(0, SDOC.$resizer.css("height").length - 2);
    let contentHeight = SDOC.$annotationOverview.css("height").substring(0, SDOC.$annotationOverview.css("height").length - 2);
    SDOC.$annotationOverview.css("padding-top", (maxHeight - contentHeight) / 2); // Reset start padding
    if (SDOC.extractedAnnotations.length !== 1) {
        returnToAnnotationOverview();       // Show overview with all annotations
    } else {
        viewAnnotationDetails(1);   // Show the verification results for the only annotation found
    }
    SDOC.$semVisLoading.fadeOut(SDOC.animationDuration_fade);
}

// Create UI element for an annotation entry (for the annotation overview)
function createAnnotationEntry(annotation) {
    let templateHtml = document.getElementById("template-annotation-entry").innerHTML;
    let verificationHTML = createHTMLForVerificationResult(annotation.verificationReport);
    let typeInfo;
    if (annotation.markup === "invalid jsonld") {
        typeInfo = "<span style='color: red;'>Invalid JSON-LD</span>";
    } else {
        typeInfo = typePrinter(annotation.type);
    }
    return templateHtml
        .replace(/{{entryNr}}/g, annotation.entryNr)
        .replace(/{{type}}/g, typeInfo)
        .replace(/{{errors}}/g, verificationHTML.errorHtml)
        .replace(/{{title}}/g, verificationHTML.titleText)
    ;
}

const iconCheck = '<i class="material-icons val-icon val-icon-ok" style="font-size: 24px !important; font-weight: bold !important; bottom: 0 !important;">check</i>';
const iconWarning = '<i class="material-icons val-icon val-icon-warning" style="bottom: -4px;">warning</i>';
const iconError = '<i class="material-icons val-icon val-icon-error" style="bottom: -4px;">cancel</i>';
const iconCritical = '<i class="material-icons val-icon val-icon-critical" style="bottom: -4px;">warning</i>';

// Returns an object with "errorHtml" and "titleText", which represents the outcome of a verification report for an annotation
function createHTMLForVerificationResult(verificationReport) {
    let errorHtml = "";
    let titleText;
    let amountWarnings = 0;
    let amountErrors = 0;
    let amountCriticals = 0;
    switch (verificationReport.validationResult) {
        case "Valid":
            errorHtml = iconCheck;
            titleText = "This annotation is correct";
            break;
        default:
            amountWarnings = verificationReport.errors.filter(el => el.severity === "Warning").length;
            amountErrors = verificationReport.errors.filter(el => el.severity === "Error").length;
            amountCriticals = verificationReport.errors.filter(el => el.severity === "Critical").length;
            titleText = "This annotation has ";
            if (amountCriticals > 0) {
                errorHtml += '<span class="val-icon-critical bold">' + amountCriticals + '</span> ' + iconCritical;
                titleText += amountCriticals + ' critical error(s)';
                if (amountErrors > 0 || amountWarnings > 0) {
                    titleText += " and ";
                    errorHtml += " ";
                }
            }
            if (amountErrors > 0) {
                errorHtml += '<span class="val-icon-error bold">' + amountErrors + '</span> ' + iconError;
                titleText += amountErrors + ' error(s)';
                if (amountWarnings > 0) {
                    titleText += " and ";
                    errorHtml += " ";
                }
            }
            if (amountWarnings > 0) {
                errorHtml += '<span class="val-icon-warning bold">' + amountWarnings + '</span> ' + iconWarning;
                titleText += amountWarnings + ' warning(s)';
            }
    }
    return {
        errorHtml,
        titleText
    };
}

// 4.B) Show the verification results for a specific annotation (with the visualization)
function viewAnnotationDetails(annNr) {
    SDOC.$semVisContainerVp.addClass("left");
    SDOC.$btnReturnToOverview.fadeIn(250);
    SDOC.$btnReturnToOverview.removeClass("hideBtn");
    SDOC.$btnShowRawAnnotation.fadeIn(250);
    SDOC.$btnShowRawAnnotation.removeClass("hideBtn");
    SDOC.activeAnnotation = SDOC.extractedAnnotations.find(el => el.entryNr === annNr);
    // Render detail header
    let typeInfo;
    let contentToRenderRender;
    if (SDOC.activeAnnotation.markup === "invalid jsonld") {
        typeInfo = "<span style='color: red;'>Invalid JSON-LD</span>";
        SDOC.$jsTreeTableWrapper.css("height", "25px");
        SDOC.$jsTreeTableWrapper.css("overflow", "hidden");
        SDOC.$jsTreeTable.css("padding-bottom", "0px");
        SDOC.$annotationInvalidJSONLD.show();
        contentToRenderRender = jhcpy(SDOC.activeAnnotation);
        contentToRenderRender.content = {}; // We want to show only the "Annotation" row in the visualization, for the global error
        SDOC.$codeMirrorJSONLDFAILED.getDoc().setValue(SDOC.activeAnnotation.content);
    } else {
        typeInfo = typePrinter(SDOC.activeAnnotation.type);
        contentToRenderRender = SDOC.activeAnnotation;
        SDOC.$jsTreeTableWrapper.css("height", "100%");
        SDOC.$jsTreeTableWrapper.css("overflow", "auto");
        SDOC.$jsTreeTable.css("padding-bottom", "30px");
        SDOC.$annotationInvalidJSONLD.hide();
    }
    $($(SDOC.$annotationDetails.children()[0]).children()[0]).html(typeInfo);
    const errorCode = createHTMLForVerificationResult(SDOC.activeAnnotation.verificationReport);
    $($(SDOC.$annotationDetails.children()[0]).children()[1]).html(errorCode.errorHtml);
    $($(SDOC.$annotationDetails.children()[0]).children()[0]).attr("title", errorCode.titleText);
    $($(SDOC.$annotationDetails.children()[0]).children()[1]).attr("title", errorCode.titleText);
    // Render JS Tree
    renderJsTree(contentToRenderRender);
}

// 4.A) Show/Return to the annotation overview (verification results)
function returnToAnnotationOverview() {
    SDOC.$semVisContainerVp.removeClass("left");
    SDOC.$btnReturnToOverview.fadeOut(250);
    SDOC.$btnReturnToOverview.addClass("hideBtn");
    SDOC.$btnShowRawAnnotation.fadeOut(250);
    SDOC.$btnShowRawAnnotation.addClass("hideBtn");
}

// The start verification button is only enabled if there is at least some input
function checkUrlRowInput() {
    let userInput = SDOC.$urlRowInput.val();
    SDOC.$btnStartVerificationUrl.attr("disabled", userInput === "");
}

// Mode can be "htmlmixed" or "jsonld", variables are set at SDOC.cmModeHMTL and SDOC.cmModeJSONLD
function changeCodeMirrorMode(mode) {
    SDOC.$codeMirrorMode = mode;
    if (mode === SDOC.cmModeJSONLD) {
        SDOC.$codeMirror.setOption("mode", {name: "application/json", jsonld: true});
        SDOC.$codeMirror.setOption("lint", true);
    } else {
        SDOC.$codeMirror.setOption("lint", false);
        SDOC.$codeMirror.setOption("mode", mode);
    }
}

// Open modal and show the raw content of an annotation
function viewRawAnnotation() {
    $('#inspect-modal-title').html("View Annotation");
    if (SDOC.activeAnnotation.markup === "invalid jsonld") {
        SDOC.$inspectModalContent.html(SDOC.activeAnnotation.content);
    } else {
        SDOC.$inspectModalContent.html(syntaxHighlight(SDOC.activeAnnotation.content));
    }
    // Enable the copy to clipboard function
    new ClipboardJS('#copyBtnInspect');
    $.material.init();
    SDOC.$inspectModal.modal("show");
}