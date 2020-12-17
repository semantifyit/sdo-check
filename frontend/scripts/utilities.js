// IE caches all ajax get requests, so we disable caching if its IE
if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
    $.ajaxSetup({cache: false});
}

function checkIfObjectIsObject(object) {
    if (Array.isArray(object)) {
        return false;
    }
    if (object === undefined || object === null) {
        return false;
    }
    return typeof object === 'object';
}


// CSS class addition to a given stringify JSON to highlight parts and keywords of that JSON
function syntaxHighlight(json) {
    json = JSON.stringify(json, null, 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}


// Make sure each URL is only 1 time in the array
function uniquifyArray(array) {
    let seen = {};
    let result = [];
    for (let i = 0; i < array.length; i++) {
        let item = array[i];
        if (seen[item] !== 1) {
            seen[item] = 1;
            result.push(item);
        }
    }
    return result;
}

// This should be the only function of its kind that is used all over the semantify front-end
function rangeToString(range, prettyPrint) {
    // Converts a range object/string into a string usable in functions
    // If prettyPrint is true -> use prettyPrintURI on each range
    if (Array.isArray(range)) {
        let string = "";
        for (let i = 0; i < range.length; i++) {
            if (prettyPrint) {
                string = string.concat(prettyPrintURI(range[i]));
            } else {
                string = string.concat(range[i]);
            }
            if (i + 1 !== range.length) {
                string = string.concat("_");
            }
        }
        return string;
    } else {
        if (!range) { // To make this function work also for corrupted annotations with missing @type values
            range = "";
        }
        if (prettyPrint) {
            return prettyPrintURI(range);
        } else {
            return range; // Is already string
        }
    }
}

function prettyPrintURI(uri) {
    if (typeof uri === "string") {
        if (uri.startsWith("schema:")) {
            return uri.substring("schema:".length);
        }
    }
    return uri;
}

// JSON hard copy -> creates hard copy of any JSON
function jhcpy(jsonInput) {
    return JSON.parse(JSON.stringify(jsonInput));
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

// Levenshteins distance algorithm, returns the distance (difference value) between two strings
function levDist(s, t) {
    let d = []; // 2d matrix
    // Step 1
    let n = s.length;
    let m = t.length;
    if (n == 0) return m;
    if (m == 0) return n;
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
            if (i == j && d[i][j] > 4) return n;
            let t_j = t.charAt(j - 1);
            let cost = (s_i == t_j) ? 0 : 1; // Step 5
            // Calculate the minimum
            let mi = d[i - 1][j] + 1;
            let b = d[i][j - 1] + 1;
            let c = d[i - 1][j - 1] + cost;
            if (b < mi) mi = b;
            if (c < mi) mi = c;
            d[i][j] = mi; // Step 6
            // Damerau transposition
            if (i > 1 && j > 1 && s_i == t.charAt(j - 2) && s.charAt(i - 2) == t_j) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
            }
        }
    }
    // Step 7
    return d[n][m];
}

// # sourceURL=utilities.js
