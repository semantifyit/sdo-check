'use strict';
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = function (html) {
    let $html = (0, _utils.getCheerioObject)(html);
    let jsonldDataFailed = [];
    $html('script[type="application/ld+json"]').each(function (index, item) {
        let jsonLDText;
        try {
            jsonLDText = (0, _cheerio2.default)(item).text();
            JSON.parse(jsonLDText);
        } catch (e) {
            console.log('Error in jsonld parse - ' + e);
            jsonldDataFailed.push({
                "message": 'Error in jsonld parse - ' + e,
                "failedJSONLD": jsonLDText
            });
        }
    });
    return jsonldDataFailed;
};
let _utils = require('./utils');
let _cheerio = require('cheerio');
let _cheerio2 = _interopRequireDefault(_cheerio);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }