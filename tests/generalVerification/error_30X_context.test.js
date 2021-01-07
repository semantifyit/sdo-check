const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 300 concerning @context and 301
 * Non-ideal @context
 * Non-conform @context
 *
 * The @context URI for schema.org is checked. There is a set of accepted URIs, and there is a set of recommended formats.
 * See: https://github.com/semantifyit/sdo-check/issues/1
 */
describe('300 - Non-ideal @context', () => {
    test("300 - Non-ideal @context 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "www.schema.org",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(300);
        expect(output.errors[0].name).toBe("Non-ideal @context");
        expect(output.errors[0].description).toBe("The '@context' of schema.org annotations should be 'https://schema.org/'.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
    test("300 - Non-ideal @context 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://www.schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(300);
        expect(output.errors[0].name).toBe("Non-ideal @context");
        expect(output.errors[0].description).toBe("The '@context' of schema.org annotations should be 'https://schema.org/'.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });

    test("300 - Non-ideal @context 3", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "schema.org",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(300);
        expect(output.errors[0].name).toBe("Non-ideal @context");
        expect(output.errors[0].description).toBe("The '@context' of schema.org annotations should be 'https://schema.org/'.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
});

describe('301 - Non-conform @context', () => {
    test("301 - Non-conform @context 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schem.org/",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(301);
        expect(output.errors[0].name).toBe("Non-conform @context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation does not contain the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("301 - Non-conform @context 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schemaorg",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(301);
        expect(output.errors[0].name).toBe("Non-conform @context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation does not contain the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("301 - Non-conform @context 3", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.orgs",
            "@type": "Person",
            "name": "Aaron Rodgers"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(301);
        expect(output.errors[0].name).toBe("Non-conform @context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation does not contain the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
});