const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 309
 * Empty entity
 *
 * An entity should have more properties than only @type. Else it has not much semantic value.
 */
describe('309 - Empty entity', () => {
    test("309 - Empty entity 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(309);
        expect(output.errors[0].name).toBe("Empty entity");
        expect(output.errors[0].description).toBe("The annotation has an entity with no properties other than @type.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
    test("309 - Empty entity 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "potentialAction": {
                "@type": "TradeAction"
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(309);
        expect(output.errors[0].name).toBe("Empty entity");
        expect(output.errors[0].description).toBe("The annotation has an entity with no properties other than @type.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
});