const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 204
 * Bad @type
 *
 * JSON-LD: "@type" value must be a string, an array of strings, an empty object, or a default object.
 */
describe('204 - Bad @type', () => {
    test("204 - Bad @type 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": 1337,
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(204);
        expect(output.errors[0].name).toBe("Bad @type");
        expect(output.errors[0].description).toBe("The annotation has an entity with an invalid @type entry.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("204 - Bad @type 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": true,
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(204);
        expect(output.errors[0].name).toBe("Bad @type");
        expect(output.errors[0].description).toBe("The annotation has an entity with an invalid @type entry.");
        expect(output.verificationResult).toBe("Invalid");
    });
});