const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 201
 * No @Context
 *
 * A JSON-LD @context containing schema.org is expected
 */
describe('201 - No @Context', () => {
    test("201 - No @Context 1", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(201);
        expect(output.errors[0].name).toBe("No @Context");
        expect(output.errors[0].description).toBe("The annotation has no '@context' entry, as expected.");
        expect(output.verificationResult).toBe("Invalid");
    });
});