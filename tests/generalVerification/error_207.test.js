const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 207
 * Empty string
 *
 * A string should not be empty (it has no semantic value in most cases)
 */
describe('207 - Empty string', () => {
    test("207 - Empty string 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": ""
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(207);
        expect(output.errors[0].name).toBe("Empty string");
        expect(output.errors[0].description).toBe("The annotation has a property ('description') with an empty string as value.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
    test("207 - Empty string 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": [
                "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL).",
                ""
            ]
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(207);
        expect(output.errors[0].name).toBe("Empty string");
        expect(output.errors[0].description).toBe("The annotation has a property ('description') with an empty string as value.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
});