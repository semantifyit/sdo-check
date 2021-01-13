const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 304
 * Non-conform action property
 *
 * The action-property must exist in the schema.org vocabulary (it must end with -input or -output).
 * The value should be a string or a PropertyValueSpecification -> https://schema.org/docs/actions.html
 */
describe('304 - Non-conform action property', () => {
    test("304 - Non-conform action property 1", async () => {
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
                "result": {
                    "@type": "Order",
                    "url-output": "required",
                    "confirmationNumber-output": true
                }
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(304);
        expect(output.errors[0].name).toBe("Non-conform action property");
        expect(output.errors[0].description).toBe("The annotation has an action property ('confirmationNumber-output') with a value that is not a well-formatted string or a PropertyValueSpecification.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("304 - Non-conform action property 2", async () => {
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
                "result": {
                    "@type": "Order",
                    "url-output": {
                        "@type": "WebPage",
                        "url": "https://nfl.com/player/trade/result/"
                    },
                    "confirmationNumber-output": "required"
                }
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(304);
        expect(output.errors[0].name).toBe("Non-conform action property");
        expect(output.errors[0].description).toBe("The annotation has an action property ('url-output') with a value that is not a well-formatted string or a PropertyValueSpecification.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("304 - Non-conform action property 3", async () => {
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
                "result": {
                    "@type": "Order",
                    "url-output": "required",
                    "confirmationNumber-output": "reqjd"
                }
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(304);
        expect(output.errors[0].name).toBe("Non-conform action property");
        expect(output.errors[0].description).toBe("The annotation has an action property ('confirmationNumber-output') with a value that is not a well-formatted string or a PropertyValueSpecification.");
        expect(output.verificationResult).toBe("Invalid");
    });
});