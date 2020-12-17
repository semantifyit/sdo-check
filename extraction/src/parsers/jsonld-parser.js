'use strict';
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = function (html) {
    let $html = (0, _utils.getCheerioObject)(html);
    let jsonldData = {};
    $html('script[type="application/ld+json"]').each(function (index, item) {
        try {
            let parsedJSON = JSON.parse((0, _cheerio2.default)(item).text());
            if (!Array.isArray(parsedJSON)) {
                parsedJSON = [parsedJSON];
            }
            parsedJSON.forEach(function (obj) {
                let type = obj['@type'] || obj['type'];
                jsonldData[type] = jsonldData[type] || [];
                jsonldData[type].push(obj);
            });
        } catch (e) {
            // console.log('jsonld-parser.js - Error in jsonld parse - ' + e);
            //the new file failed-jsonld-parser already throws the error
        }
    });
    return jsonldData;
};
let _utils = require('./utils');
let _cheerio = require('cheerio');
let _cheerio2 = _interopRequireDefault(_cheerio);
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
}