const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 104
 * Use of undefined
 *
 * Use of undefined as value - Not valid in JSON
 */
describe('104 - Use of undefined', () => {
    test("104 - Use of undefined 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": undefined
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(104);
        expect(output.errors[0].name).toBe("Use of undefined");
        expect(output.errors[0].description).toBe("The annotation contains an 'undefined' value, which is not conform to the JSON specification.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("104 - Use of undefined 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": [
                undefined,
                "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            ]
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(104);
        expect(output.errors[0].name).toBe("Use of undefined");
        expect(output.errors[0].description).toBe("The annotation contains an 'undefined' value, which is not conform to the JSON specification.");
        expect(output.verificationResult).toBe("Invalid");
    });
});