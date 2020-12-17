const wae = require('./WebAutoExtractor').default; // Web auto extraction

// Extracts semantic annotations from a given html source code
function extractSemanticAnnotations(html) {
    let parsed = wae().parse(html);
    let result = {};
    result.jsonld = parsed.jsonld;
    result.jsonldFailed = parsed.jsonldFailed;
    result.microdata = parsed.microdata;
    result.rdfa = parsed.rdfa;
    return result;
}

module.exports = {
    extractSemanticAnnotations
};