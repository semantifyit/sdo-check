/**
 *  @file Functions regarding the additional explanation of errors
 */

// Shows/Hides the additional explanation for an error entry
function toggleExplain(el) {
    let errorExplainDiv = $($(el).closest('.alert').find('.my-alert__error-explain'));
    if (errorExplainDiv.css("visibility") === "hidden") {
        errorExplainDiv.removeClass("hiddenExplanation");
        $(el).text("< show less");
    } else {
        errorExplainDiv.addClass("hiddenExplanation");
        $(el).text("> show more");
    }
}

// Create the HTML code for the additional explanation of a given error entry based on its error code
function createExplainHTML(errorEntry) {
    switch (errorEntry.errorCode) {
        case 999:
            return createExplainHTML_999(errorEntry);
        case 201:
        case 202:
        case 301:
            return createExplainHTML_201(errorEntry);
        case 101:
        case 102:
        case 103:
            return createExplainHTML_101(errorEntry);
        case 203:
            return createExplainHTML_203(errorEntry);
        case 204:
            return createExplainHTML_204(errorEntry);
        case 205:
            return createExplainHTML_205(errorEntry);
        case 206:
            return createExplainHTML_206(errorEntry);
        case 207:
            return createExplainHTML_207(errorEntry);
        case 300:
            if (errorEntry.name === "Non-ideal @context") {
                return createExplainHTML_201(errorEntry);
            }
            if (errorEntry.name === "Unknown range") {
                return createExplainHTML_300_id(errorEntry);
            }
            if (errorEntry.name === "Trailing spaces") {
                return createExplainHTML_300_trailingSpaces(errorEntry);
            }
            break;
        case 302:
            return createExplainHTML_302(errorEntry);
        case 303:
            return createExplainHTML_303(errorEntry);
        case 305:
            return createExplainHTML_305(errorEntry);
        case 306:
            return createExplainHTML_306(errorEntry);
        case 307:
            return createExplainHTML_307(errorEntry);
        case 309:
            return createExplainHTML_309(errorEntry);
    }
    return "No explanation for this error available.";
}

const generalContextExampleAnnotation = {
    "@context": "https://schema.org/",
    "@type": "Hotel",
    "name": "Example Hotel",
    "address": {
        "@type": "PostalAddress",
        "addressCountry": "AT",
        "addressLocality": "Innsbruck",
        "postalCode": "6020",
    }
};

const generalPropertiesExampleAnnotation = {
    "@context": "https://schema.org/",
    "@type": "Person",
    "name": "John Doe",
    "description": "A nerdy dude who likes Jazz music.",
    "hasOccupation": {
        "@type": "Occupation",
        "name": "Programmer",
        "description": "Takes coffee as input and generates code as output."
    }
};

// 999, "Execution Error"
function createExplainHTML_999(errorEntry) {
    return createHTMLForExplanation("<b>Execution errors</b> are caused by unexpected formats or syntax. <b>SDO-Check</b> does not support all format- and serialization-variants that are available for schema.org/RDF. See the <a href='https://semantify.it/sdo-check/' target='_blank'>information about SDO-Check</a> for more details.");
}

// 101 Invalid JSON, 102 Empty JSON, 103 No JSON Object
function createExplainHTML_101(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("SDO-Check expects a <a href='https://www.json.org/json-en.html' target='_blank'>valid JSON object</a> as syntax requirement for the input. See the <a href='https://semantify.it/sdo-check/' target='_blank'>information about SDO-Check</a> for more details.");
    let htmlExample = createHTMLForExample(generalContextExampleAnnotation);
    return htmlExplanation + htmlExample;
}

// 201 No @context, 202 Bad @context, 300 Non-ideal @context, 301 Non-conform @context
function createExplainHTML_201(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("The main purpose of this tool is to verify <b>schema.org annotations on the web</b> and recommend measures to improve their quality. We expect the use of <a href='https://w3c.github.io/json-ld-syntax/#the-context' target='_blank'>@context</a> with the value <code>https://schema.org/</code>, since this is the common and recommended way to define a context for schema.org annotations. See the <a href='https://semantify.it/sdo-check/' target='_blank'>information about SDO-Check</a> for more details.");
    let exampleJSONLD = {};
    exampleJSONLD[highlightExampleValue("@context")] = highlightExampleValue("https://schema.org/");
    exampleJSONLD["@type"] = "Person";
    exampleJSONLD.name = "John Doe";
    exampleJSONLD.description = "A nerdy dude who likes Jazz music.";
    exampleJSONLD.hasOccupation = {
        "@type": "Occupation",
        "name": "Programmer",
        "description": "Takes coffee as input and generates code as output."
    };
    let htmlExample = createHTMLForExample(exampleJSONLD);
    return htmlExplanation + htmlExample;
}

// 203 No @type
function createExplainHTML_203(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("Entities should have a <b>@type</b> definition. The @type definition is needed to identify the schema.org class to which the entity belongs to and make sure that all range- and domain-rules given by schema.org are followed.");
    let htmlExample = "";
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    if (!usedPropertyURI) {
        usedPropertyURI = "schema:addressCountry";
    }
    let usedPropertyObj;
    try {
        usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
    } catch (e) {
        console.log(e);
        console.log("could not find property " + usedPropertyURI);
    }
    if (usedPropertyObj) {
        // Create Example annotation
        const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
        let exampleAnnotation = {
            "@context": "https://schema.org/"
        };
        exampleAnnotation[highlightExampleValue("@type")] = highlightExampleValue(domainType);
        exampleAnnotation[prettyPrintURI(usedPropertyURI)] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), true, true);
        htmlExample = createHTMLForExample(exampleAnnotation);
    }
    return htmlExplanation + htmlExample;
}

// 204 Bad @Type
function createExplainHTML_204(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("The @type definition of an entity must be a string or an array of strings. The @type definition is needed to identify the schema.org class to which the entity belongs to.");
    let exampleJSONLD = jhcpy(generalContextExampleAnnotation);
    exampleJSONLD["@type"] = highlightExampleValue("Hotel");
    exampleJSONLD.address["@type"] = highlightExampleValue("PostalAddress");
    let htmlExample = createHTMLForExample(exampleJSONLD);
    return htmlExplanation + htmlExample;
}

// 205 Double Nested Array
function createExplainHTML_205(errorEntry) {
    return createHTMLForExplanation("The current <a href='https://w3c.github.io/json-ld-syntax/' target='_blank'>JSON-LD specification</a> does not allow <b>double nested arrays</b> (also called multi-dimensional arrays) and a <a href='https://github.com/w3c/json-ld-syntax/issues/7' target='_blank'>change seems unlikely</a>. Double nested arrays should <b>not</b> be used in schema.org annotations.");
}

// 206 Usage of null
function createExplainHTML_206(errorEntry) {
    return createHTMLForExplanation("The use of the <b style='color: rebeccapurple'>null</b> value within JSON-LD is used to ignore or reset values. A property with <b style='color: rebeccapurple'>null</b> as value has the same meaning as if the property was not defined. See the <a href='https://w3c.github.io/json-ld-syntax/#terminology' target='_blank'>JSON-LD specification</a> for more details. In the general context of schema.org it may not be useful to have a property with a <b style='color: rebeccapurple'>null</b> value.");
}

// 207 Empty string
function createExplainHTML_207(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("The purpose of schema.org annotations is to provide <b>information about entities</b> in a structured way. There is no informational gain in having an empty string as value. If a suitable value for a property can't be found, then it may be better to not use that property at all.");
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    let htmlDataContext = "";
    let htmlExample = "";
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create Example annotation
            const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
            let exampleAnnotation = {
                "@context": "https://schema.org/",
                "@type": domainType
            };
            exampleAnnotation[highlightExampleValue(prettyPrintURI(usedPropertyURI))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), true);
            // Create HTML for info boxes
            const rangesHTML = createListHTML(usedPropertyObj.getRanges(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following range(s): " + rangesHTML);
            htmlExample = createHTMLForExample(exampleAnnotation);
        }
    }
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 300 Unknown range
function createExplainHTML_300_id(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("The use of referenced values is a key concept of the semantic web and <a href='https://5stardata.info/en/' target='_blank'>linked open data</a>. Although it is wished to connect structured data this way, the task of verification becomes more complicated due to the remote location of values. The URI used as @id may not be enough to 'fetch' the remote entity (URIs are not always publicly accessible on the web, <a href='https://www.w3.org/TR/cooluris/#semweb' target='_blank'>as they should be</a>). Therefore, SDO-Check does not try to fetch remote values and can't check if the remote entity is a valid range for the given property. This behaviour may change in the future: see the <a href='https://semantify.it/sdo-check/' target='_blank'>information about SDO-Check</a> for more details.");
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    let htmlDataContext = "";
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create HTML for info boxes
            let rangesHTML = createListHTML(usedPropertyObj.getRanges(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following range(s): " + rangesHTML);
        }
    }
    return htmlExplanation + htmlDataContext;
}

// 300 Trailing Spaces
function createExplainHTML_300_trailingSpaces(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("Trailing spaces at the start or at the end of strings are not wanted since they are a product of carelessness during the annotation creation in most cases. Trailing spaces could cause errors and malfunctions (depending on the annotation-consumer), therefore it is recommended to delete them.");
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    let htmlDataContext = "";
    let htmlExample = "";
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create Example annotation
            const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
            let exampleAnnotation = {
                "@context": "https://schema.org/",
                "@type": domainType
            };
            exampleAnnotation[highlightExampleValue(prettyPrintURI(usedPropertyURI))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), true);
            // Create HTML for info boxes
            const rangesHTML = createListHTML(usedPropertyObj.getRanges(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following range(s): " + rangesHTML);
            htmlExample = createHTMLForExample(exampleAnnotation);
        }
    }
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 302 Non-conform @type
function createExplainHTML_302(errorEntry) {
    let valueHtml = "";
    let htmlDataContext = "";
    let htmlExample = "";
    if (errorEntry.value) {
        valueHtml = createSDOLink(prettyPrintURI(errorEntry.value)) + " ";
        let listOfClasses = SDOC.mySDOAdapter.getListOfClasses();
        listOfClasses.push(...SDOC.mySDOAdapter.getListOfEnumerations()); // Include enumerations
        let match;
        let similarityThreshold = 4;
        let similarityMatch = 1000;
        let similarMatches = []; // Entry: {iri: schema:ClassName, distance: 3}
        do {
            for (let c of listOfClasses) {
                let actualDistance = levDist(errorEntry.value, c);
                if (actualDistance < similarityMatch) {
                    similarityMatch = actualDistance;
                    match = c;
                }
                if (actualDistance < similarityThreshold && !similarMatches.find(el => el.iri === c)) {
                    similarMatches.push({
                        iri: c,
                        distance: actualDistance
                    });
                }
            }
            similarityThreshold++;
        } while (similarMatches.length < 2);

        similarMatches.sort(function(a, b) {
            if (a.iri < b.iri)
                return -1;
            return 1;
        });
        similarMatches.sort(function(a, b) {
            if (a.distance < b.distance)
                return -1;
            return 1;
        });
        if (similarMatches.length > 6) {
            similarMatches = similarMatches.slice(0, 6);
        }
        let exampleAnnotation = {
            "@context": "https://schema.org/",
            "@type": highlightExampleValue(prettyPrintURI(match)),
            "name": "Example " + prettyPrintURI(match).toLowerCase()
        };
        const classesHTML = createListHTML(similarMatches, "iri");
        htmlDataContext = createHTMLForDataContext("Schema.org has following similar classes: " + classesHTML);
        htmlExample = createHTMLForExample(exampleAnnotation);

    }
    let htmlExplanation = createHTMLForExplanation("The @type " + valueHtml + "used in the annotation is <b>not</b> a valid schema.org class. Make sure it is spelled correctly (uppercase/lowercase, no blank spaces, etc.).");
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 303 Non-conform property
function createExplainHTML_303(errorEntry) {
    let valueHtml = "";
    let htmlDataContext = "";
    let htmlExample = "";
    if (errorEntry.value) {
        valueHtml = createSDOLink(prettyPrintURI(errorEntry.value)) + " ";
        let listOfProperties = SDOC.mySDOAdapter.getListOfProperties();
        let match;
        let similarityThreshold = 4;
        let similarityMatch = 1000;
        let similarMatches = []; // Entry: {iri: schema:propertyName, distance: 3}
        do {
            for (let p of listOfProperties) {
                let actualDistance = levDist(errorEntry.value, p);
                if (actualDistance < similarityMatch) {
                    similarityMatch = actualDistance;
                    match = p;
                }
                if (actualDistance < similarityThreshold && !similarMatches.find(el => el.iri === p)) {
                    similarMatches.push({
                        iri: p,
                        distance: actualDistance
                    });
                }
            }
            similarityThreshold++;
        } while (similarMatches.length < 2);

        similarMatches.sort(function(a, b) {
            if (a.iri < b.iri)
                return -1;
            return 1;
        });
        similarMatches.sort(function(a, b) {
            if (a.distance < b.distance)
                return -1;
            return 1;
        });
        if (similarMatches.length > 6) {
            similarMatches = similarMatches.slice(0, 6);
        }
        const usedPropertyObj = SDOC.mySDOAdapter.getProperty(match);
        const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
        let exampleAnnotation = {
            "@context": "https://schema.org/",
            "@type": domainType,
        };
        exampleAnnotation[highlightExampleValue(prettyPrintURI(match))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), false);
        const propertiesHtml = createListHTML(similarMatches, "iri");
        htmlDataContext = createHTMLForDataContext("Schema.org has following similar properties: " + propertiesHtml);
        htmlExample = createHTMLForExample(exampleAnnotation);

    }
    let htmlExplanation = createHTMLForExplanation("The property " + valueHtml + "used in the annotation is <b>not</b> a valid schema.org property. Make sure it is spelled correctly (uppercase/lowercase, no blank spaces, etc.).");
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 305 Non-conform domain
function createExplainHTML_305(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("<b>Properties</b> have a set of <b>domains</b> that can use that property. The sub-classes of those domains are also valid domains, because of the <a href='https://schema.org/docs/datamodel.html' target='_blank'>inheritance in schema.org</a>.");
    let htmlDataContext = "";
    let htmlExample = "";
    let usedPropertyURI = errorEntry.value;
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create Example annotation
            const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
            let exampleAnnotation = {
                "@context": "https://schema.org/",
                "@type": highlightExampleValue(domainType)
            };
            exampleAnnotation[highlightExampleValue(prettyPrintURI(usedPropertyURI))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), false);
            // Create HTML for info boxes
            const domainsHtml = createListHTML(usedPropertyObj.getDomains(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following domain(s): " + domainsHtml);
            htmlExample = createHTMLForExample(exampleAnnotation);
        }
    }
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 306 Non-conform range
function createExplainHTML_306(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("<b>Properties</b> have a set of <b>ranges</b> that can be used as values. Those ranges can include certain data-types, classes, and enumerations (their sub-classes are also valid ranges, because of the <a href='https://schema.org/docs/datamodel.html' target='_blank'>inheritance in schema.org</a>).");
    let htmlDataContext = "";
    let htmlExample = "";
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create Example annotation
            const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
            let exampleAnnotation = {
                "@context": "https://schema.org/",
                "@type": domainType
            };
            exampleAnnotation[highlightExampleValue(prettyPrintURI(usedPropertyURI))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), true);
            // Create HTML for info boxes
            const rangesHTML = createListHTML(usedPropertyObj.getRanges(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following range(s): " + rangesHTML);
            htmlExample = createHTMLForExample(exampleAnnotation);
        }
    }
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 307 Non-conform range (string)
function createExplainHTML_307(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("<b>Properties</b> have a set of <b>ranges</b> that can be used as values. Those ranges can include certain data-types, classes, and enumerations (their sub-classes are also valid ranges, because of the <a href='https://schema.org/docs/datamodel.html' target='_blank'>inheritance in schema.org</a>).<br>But the <a href='https://schema.org/docs/datamodel.html#conformance' target='_blank'>conformance concept of schema.org</a> also allows the use of <b>text strings</b> as value for any property, in the spirit of 'some data is better than none'. However, <b>SDO-Check</b>, as a verification tool, encourages the <b>use of structured values</b> that are in compliance with the vocabulary, instead of plain strings.");
    let htmlDataContext = "";
    let htmlExample = "";
    let usedPropertyURI = discoverLastUsedProperty(errorEntry.annotationPath);
    let usedPropertyObj;
    if (usedPropertyURI) {
        try {
            usedPropertyObj = SDOC.mySDOAdapter.getProperty(usedPropertyURI);
        } catch (e) {
            console.log(e);
            console.log("could not find property " + usedPropertyURI);
        }
        if (usedPropertyObj) {
            // Create Example annotation
            const domainType = prettyPrintURI(discoverBestDomainForProperty(usedPropertyObj));
            let exampleAnnotation = {
                "@context": "https://schema.org/",
                "@type": domainType
            };
            exampleAnnotation[highlightExampleValue(prettyPrintURI(usedPropertyURI))] = createRangeExample(discoverBestRangeForDomain(usedPropertyObj), true);
            // Create HTML for info boxes
            const rangesHTML = createListHTML(usedPropertyObj.getRanges(false));
            htmlDataContext = createHTMLForDataContext("The property " + createSDOLink(prettyPrintURI(usedPropertyURI)) + " has following range(s): " + rangesHTML);
            htmlExample = createHTMLForExample(exampleAnnotation);
        }
    }
    return htmlExplanation + htmlDataContext + htmlExample;
}

// 309 Empty entity
function createExplainHTML_309(errorEntry) {
    let htmlExplanation = createHTMLForExplanation("The purpose of schema.org annotations is to provide <b>information about entities</b> in a structured way. There is no informational gain in having an entity without properties. Basic properties that can be used for any entity are for example " + createSDOLink('name') + " and " + createSDOLink('description') + ".");
    let htmlExample = createHTMLForExample(generalPropertiesExampleAnnotation);
    return htmlExplanation + htmlExample;
}

// ExplanationHTML -> html string
function createHTMLForExplanation(explanationHTML) {
    return "<p class='explain'>" + explanationHTML + "</p>";
}

// ExampleAnnotation -> JSON
function createHTMLForExample(exampleAnnotation) {
    return "<div class='example-right'><b>Example</b><pre>" + JSON.stringify(exampleAnnotation, null, 2) + "</pre></div>";
}

// ContentHTML -> html string
function createHTMLForDataContext(contentHTML) {
    return "<div class='data-context'>" + contentHTML + "</div>";
}

// Wrap a given sdo term with a link-html pointing to its sdo page
function createSDOLink(term) {
    return "<a href='https://schema.org/" + encodeURI(term) + "' target='_blank'>" + term + "</a>";
}

// Create html for an <ul> with the given entries
function createListHTML(entries, propertyPath = null) {
    let listHTML = "<ul>";
    for (let entry of entries) {
        let val = entry;
        if (propertyPath) {
            val = val[propertyPath];
        }
        listHTML += "<li>" + createSDOLink(prettyPrintURI(val)) + "</li>";
    }
    listHTML += "</ul>";
    return listHTML;
}

function discoverLastUsedProperty(path) {
    let firstIndex = path.lastIndexOf("schema:");
    let lastIndex = path.lastIndexOf("/");
    let property;
    if (lastIndex < firstIndex) {
        property = path.substring(firstIndex, path.length);
    } else {
        property = path.substring(firstIndex, lastIndex);
    }
    return property;
}

function discoverBestDomainForProperty(usedPropertyObj) {
    let domains = usedPropertyObj.getDomains(false);
    let likableDomains = [];
    for (let d of domains) {
        try {
            let domainSrc = SDOC.mySDOAdapter.getTerm(d).getVocabulary();
            if (domainSrc === "http://schema.org" || domainSrc === "https://schema.org") {
                likableDomains.push(d);
            }
        } catch (e) {
            // Not a good domain
        }
    }
    if (likableDomains.length > 0) {
        return likableDomains[0];
    } else {
        return domains[0];
    }
}

function discoverBestRangeForDomain(usedPropertyObj) {
    // Class > Enumeration > DataType
    let validRanges = usedPropertyObj.getRanges(false);
    let rangeObjs = [];
    for (let r of validRanges) {
        try {
            rangeObjs.push(SDOC.mySDOAdapter.getTerm(r));
        } catch (e) {
            // Not a good range
        }
    }
    let likableRanges = rangeObjs.filter(el => el.getTermType() === "rdfs:Class" && (el.getVocabulary() === "http://schema.org" || el.getVocabulary() === "https://schema.org"));
    if (likableRanges.length > 0) {
        return likableRanges[0].getIRI(true);
    }
    likableRanges = rangeObjs.filter(el => el.getTermType() === "schema:Enumeration" && (el.getVocabulary() === "http://schema.org" || el.getVocabulary() === "https://schema.org"));
    if (likableRanges.length > 0) {
        return likableRanges[0].getIRI(true);
    }
    likableRanges = rangeObjs.filter(el => el.getTermType() === "schema:DataType" && (el.getVocabulary() === "http://schema.org" || el.getVocabulary() === "https://schema.org"));
    if (likableRanges.length > 0) {
        return likableRanges[0].getIRI(true);
    }
    likableRanges = rangeObjs.filter(el => el.getTermType() === "rdfs:Class");
    if (likableRanges.length > 0) {
        return likableRanges[0].getIRI(true);
    }
    likableRanges = rangeObjs.filter(el => el.getTermType() === "schema:Enumeration");
    if (likableRanges.length > 0) {
        return likableRanges[0].getIRI(true);
    }
    return rangeObjs[0].getIRI(true);
}

function createRangeExample(rangeType, highlightRange = false, highlightType = false) {
    let rangeObj = SDOC.mySDOAdapter.getTerm(rangeType);
    let temp, temp2, temp3;
    switch (rangeObj.getTermType()) {
        case "rdfs:Class":
            temp2 = prettyPrintURI(rangeType);
            if (highlightRange) {
                temp2 = highlightExampleValue(temp2);
            }
            temp3 = {};
            if (highlightType) {
                temp3[highlightExampleValue("@type")] = temp2;
            } else {
                temp3["@type"] = temp2;
            }
            temp3.name = "Example " + prettyPrintURI(rangeType).toLowerCase();
            return temp3;
        case "schema:Enumeration":
            temp = rangeObj.getEnumerationMembers()[0];
            if (temp) {
                temp2 = SDOC.mySDOAdapter.getTerm(temp).getIRI(false);
            } else {
                temp2 = "No enumeration example available";
            }
            if (highlightRange) {
                return highlightExampleValue(temp2);
            } else {
                return temp2;
            }
        default:
        // DataType - handle in next switch
    }
    switch (prettyPrintURI(rangeType)) {
        case "Number":
            temp2 = 42;
            break;
        case "Float":
            temp2 = 42.0;
            break;
        case "Integer":
            temp2 = 42;
            break;
        case "Boolean":
            temp2 = true;
            break;
        case "Date":
            temp2 = "1955-06-08"; //  YYYY-MM-DD
            break;
        case "DateTime":
            temp2 = "1955-06-08T13:37:00Z"; //  YYYY-MM-DDTHH:mm:ssZ
            break;
        case "Time":
            temp2 = "13:37:00+01:00"; //  HH:mm:ssZ
            break;
        case "URL":
            temp2 = "http://www.example.com/";
            break;
        default:
            temp2 = "Example Text";
            break;
    }
    if (highlightRange) {
        return highlightExampleValue(temp2);
    } else {
        return temp2;
    }
}

function highlightExampleValue(val) {
    return "<b style='color: #35790b;'>" + val + "</b>";
}