const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 203
 * No @type
 *
 * Every entity in a JSON-LD (represented by an object) is expected to have a @type entry
 */
describe('203 - No @type', () => {
    test("203 - No @type 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(203);
        expect(output.errors[0].name).toBe("No @type");
        expect(output.errors[0].description).toBe("The annotation has no @type.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("203 - No @type 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonLdError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(203);
        expect(output.errors[0].name).toBe("No @type");
        expect(output.errors[0].description).toBe("The annotation has an entity with no @type.");
        expect(output.verificationResult).toBe("Invalid");
    });
});