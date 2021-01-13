const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 305
 * Non-conform domain
 *
 * Every property must have a valid domain @type.
 */
describe('305 - Non-conform domain', () => {
    test("305 - Non-conform domain 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "opens": "08:00:00",
                "closes": "20:00:00"
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(305);
        expect(output.errors[0].name).toBe("Non-conform domain");
        expect(output.errors[0].description).toBe("The annotation has an entity ('Person') with a property that it is not allowed to use ('hoursAvailable') based on the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("305 - Non-conform domain 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "potentialAction": {
                "@type": "TradeAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://nfl.com/player/trade/",
                    "encodingType": "application/ld+json",
                    "contentType": "application/ld+json"
                },
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "opens": "08:00:00",
                    "closes": "20:00:00"
                }
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(305);
        expect(output.errors[0].name).toBe("Non-conform domain");
        expect(output.errors[0].description).toBe("The annotation has an entity ('TradeAction') with a property that it is not allowed to use ('hoursAvailable') based on the schema.org vocabulary.");
        expect(output.verificationResult).toBe("Invalid");
    });
});