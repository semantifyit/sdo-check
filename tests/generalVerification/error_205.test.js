const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 205
 * Double Nested Array
 *
 * Double nested arrays (an array within another array) are not allowed according to the JSON-LD specification
 */
describe('205 - Double Nested Array', () => {
    test("205 - Double Nested Array 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": [["Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."]]
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(205);
        expect(output.errors[0].name).toBe("Double Nested Array");
        expect(output.errors[0].description).toBe("The annotation contains a double nested array, which is not conform to the JSON-LD specification.");
        expect(output.verificationResult).toBe("Invalid");
    });
});