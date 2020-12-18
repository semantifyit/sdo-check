# SDO-Check

SDO-Check is a web-tool that enables the fast and simple verification of schema.org annotations. It is the open-source version of the SDO-Check tool of semantify.it (http://sdocheck.semantify.it/). This tool allows the input of a code-snippet or a web-page URL and shows the verification result in form of an interactive tree-visualization with details about all irregularities found.  The verification is based on the latest version of the official schema.org vocabulary, common SEO practices, and recommendations from semantic web experts.

You can find more general informations about the tool at https://semantify.it/sdo-check/

The public repository for this tool is at https://github.com/semantifyit/sdo-check

Any bugs/suggestion can be posted on the issues page at  https://github.com/semantifyit/sdo-check/issues

## Download and run

To download and run this project you need GIT and NodeJS.

In your terminal:

1. `git clone https://github.com/semantifyit/sdo-check.git`
2. `cd sdo-check`
3. `npm install --only=prod` or `npm install` if you want to install dev-dependencies too (to edit and build bundles)
4. `npm start` and your standard browser should open showing sdo-check. If you have 'security' issues try another browser or make a localhost where you serve sdoCheck.html

## Verification Algorithm

Find more about how the verification algorithm works at:

[Schema.org Verification](./docu/GeneralVerification.md)

[Basic Verification](./docu/BasicVerification.md)

(Todo: Add description about the overall verificaitn strategy and the error reporting system)

(Todo: Update and Add the jest tests for the verification algorithm)

## Components

#### Front-end

The front-end contains scripts that enable the functionality of sdo-check. This includes code for the UI handling, the overall verification process, the rendering of the annotations with a tree-visualization, and the advanced error explanation.

#### General Verifier

The General Verifier checks the compliance of semantic annotations based on the schema.org vocabulary.

Since the code was built for the backend we browserify the source code (/src) into a single js file (generalVerificationBundle.js) so that is possible to run it in a browser. 

You have to load the dev-dependencies if you want to edit and rebuild the general verification bundle (node script: buildGeneralVerificator). Note that we omit the required SDO-Adapter here because the frontend already loads this library.

#### Extractor

The Extractor extracts semantic annotations from HTML code.

This module is build based on the abandoned project https://www.npmjs.com/package/web-auto-extractor . Since it is a npm module we browserify the source code (/src) into a single js file (extractorBundle.js) so that is possible to run it in a browser. 

You have to load the dev-dependencies if you want to edit and rebuild the extractor bundle (node script: buildExtractor).

#### Web-page scrapping

Web-page scrapping including dynamically generated HTML content is usually done by a crawler/scrapper like https://www.npmjs.com/package/puppeteer

Since that requires its own backend, which we wanted to omit for this showcase project, we decided to use the public API of semantify.it to do this task. Of course you can substitute this with your own HTML fetching module.

## License 

[CC-BY-SA-3.0](https://creativecommons.org/licenses/by-sa/3.0/)