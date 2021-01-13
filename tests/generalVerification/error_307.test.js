const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 307
 * Non-conform range (string)
 *
 * Every property must have a valid range @type (ranges can be DataTypes, Classes or Enumerations. The exact set of valid ranges is given by the vocabulary).
 * In schema.org strings are always allowed although they are not explicitly stated as ranges. We detect those cases and give a warning instead of an error.
 */
describe('307 - Non-conform range (string)', () => {
    test("307 - Non-conform range (string) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "potentialAction": "trade"
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(307);
        expect(output.errors[0].name).toBe("Non-conform range (string)");
        expect(output.errors[0].description).toBe("The annotation has a property ('potentialAction') with a string as value, although a string is not explicitly allowed as range for this property according to the schema.org vocabulary.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
    test("307 - Non-conform range (string) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "potentialAction": {
                "@type": "TradeAction",
                "priceSpecification": "4.000.000 $"
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Warning");
        expect(output.errors[0].errorCode).toBe(307);
        expect(output.errors[0].name).toBe("Non-conform range (string)");
        expect(output.errors[0].description).toBe("The annotation has a property ('priceSpecification') with a string as value, although a string is not explicitly allowed as range for this property according to the schema.org vocabulary.");
        expect(output.verificationResult).toBe("ValidWithWarnings");
    });
});