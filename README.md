# SDO-Check

SDO-Check is a web-tool that enables the fast and simple verification of schema.org annotations. It is the open-source version of the SDO-Check tool of semantify.it (http://sdocheck.semantify.it/). This tool allows the input of a code-snippet or a web-page URL and shows the verification result in form of an interactive tree-visualization with details about all irregularities found.  The verification is based on the latest version of the official schema.org vocabulary, common SEO practices, and recommendations from semantic web experts.

## Download and run

To download and run this project you need [Git](https://git-scm.com/) and [NodeJS](https://nodejs.org/en/).

In your terminal:

1. `git clone https://github.com/semantifyit/sdo-check.git`
2. `cd sdo-check`
3. `npm install --only=prod` or `npm install` if you want to install dev-dependencies too (to edit and build bundles, to run tests)
4. `npm start` and your standard browser should open showing sdo-check. If you have 'security' issues try another browser or make a localhost where you serve the file sdoCheck.html

## Documentation

You can read/download the documentation of this repository at https://github.com/semantifyit/sdo-check/wiki

## Tests

In order to run tests you must have the dev-dependencies installed.

Tests are done with [jest](https://www.npmjs.com/package/jest) and can be found in the directory `/tests`. You can run the test-suite with `npm test`.

## Further Links

You can find more general informations about the tool at https://semantify.it/sdo-check/

The public repository for this tool is at https://github.com/semantifyit/sdo-check

Any bugs/suggestion can be posted on the issues page at https://github.com/semantifyit/sdo-check/issues

## License 

[CC-BY-SA-3.0](https://creativecommons.org/licenses/by-sa/3.0/)