const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 206
 * Use of null
 *
 * A property should not have 'null' as value, because it does not add any semantic meaning in context of a schema.org annotation.
 */
describe('206 - Use of null', () => {
    test("206 - Use of null 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": null
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(206);
        expect(output.errors[0].name).toBe("Use of null");
        expect(output.errors[0].description).toBe("The annotation contains a 'null' value, which is allowed by the JSON-LD specification, but not recommended to use.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
    test("206 - Use of null 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": [
                "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL).",
                null
            ]
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(206);
        expect(output.errors[0].name).toBe("Use of null");
        expect(output.errors[0].description).toBe("The annotation contains a 'null' value, which is allowed by the JSON-LD specification, but not recommended to use.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
});