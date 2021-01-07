const SDOAdapter = require('schema-org-adapter');
const generalVerification = require("./../../verification/src/GeneralVerification");
let alreadyLoaded = false;

// Loads the SDO-Adapter library and uses it to initialize the general verification algorithm (the SDO-Adapter library is excluded on purpose in the general verification code, since the code is supposed to be bundled and loaded in the frontend, where the SDO-Adapter is expected to be loaded already)
async function letSdoAdapterLoad() {
    if (!alreadyLoaded) {
        await generalVerification.initSdoAdapter(SDOAdapter);
        alreadyLoaded = true;
    }
}

module.exports = {
    generalVerification,
    letSdoAdapterLoad
};