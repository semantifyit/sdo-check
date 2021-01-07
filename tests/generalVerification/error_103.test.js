const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 103
 * No JSON Object
 *
 * The input is not a JSON object - input should be an JSON object, and not an array of annotations or something else
 */
describe('103 - Empty JSON', () => {
    test("103 - No JSON Object 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = [
            {
                "@context": "http://schema.org/",
                "@type": "Person",
                "name": "Aaron Rodgers"
            },
            {
                "@context": "http://schema.org/",
                "@type": "Person",
                "name": "Tom Brady"
            }
        ];
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(103);
        expect(output.errors[0].name).toBe("No JSON Object");
        expect(output.errors[0].description).toBe("The input annotation is not a JSON object, as required.");
        expect(output.verificationResult).toBe("Invalid");
    });
});