const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 306
 * Non-conform range
 *
 * Every property must have a valid range @type (ranges can be DataTypes, Classes or Enumerations. The exact set of valid ranges is given by the vocabulary).
 */
describe('306 - Non-conform range', () => {
    test("306 - Non-conform range 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "description": true
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(306);
        expect(output.errors[0].name).toBe("Non-conform range");
        expect(output.errors[0].description).toBe("The annotation has a property ('description') with a value type that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("306 - Non-conform range 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "potentialAction": {
                "@type": "EntryPoint",
                "urlTemplate": "https://nfl.com/player/trade/",
                "encodingType": "application/ld+json",
                "contentType": "application/ld+json"
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(306);
        expect(output.errors[0].name).toBe("Non-conform range");
        expect(output.errors[0].description).toBe("The annotation has a property ('potentialAction') with a value type ('EntryPoint') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});