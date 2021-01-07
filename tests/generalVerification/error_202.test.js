const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 202
 * Bad @Context
 *
 * A JSON-LD @context containing schema.org is expected
 */
describe('202 - Bad @Context', () => {
    test("202 - Bad @Context 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": {
                "@vocab": {
                    "schema": "http://schema.org/"
                }
            },
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(202);
        expect(output.errors[0].name).toBe("Bad @Context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation has a '@vocab' value that is not a String. This value should be a string referencing the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("202 - Bad @Context 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": {
                "myschema": 12345
            },
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(202);
        expect(output.errors[0].name).toBe("Bad @Context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation has an invalid format.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("202 - Bad @Context 3", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": 12345,
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(202);
        expect(output.errors[0].name).toBe("Bad @Context");
        expect(output.errors[0].description).toBe("The '@context' of the annotation has a value that is not a String or an Object.");
        expect(output.verificationResult).toBe("Invalid");
    });
});