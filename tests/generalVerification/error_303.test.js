const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 303
 * Non-conform property
 *
 * The property must exist in the schema.org vocabulary. Further help is given by distinguishing the error causes:
 * blank spaces
 * lower/upper-case problems
 * misspells
 */
describe('303 - Non-conform property (blank space)', () => {
    test("303 - Non-conform property (blank space) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "nam e": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (blank space)");
        expect(output.errors[0].description).toBe("The annotation has a property entry with at least 1 blank space ('nam e') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("303 - Non-conform property (blank space) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Person",
                "nam e": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (blank space)");
        expect(output.errors[0].description).toBe("The annotation has a property entry with at least 1 blank space ('nam e') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('303 - Non-conform property (uppercase/lowercase)', () => {
    test("303 - Non-conform property (uppercase/lowercase) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "Name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (uppercase/lowercase)");
        expect(output.errors[0].description).toBe("The annotation has a property entry with an uppercase/lowercase error ('Name' that should be 'name').");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("303 - Non-conform property (uppercase/lowercase) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Person",
                "naMe": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (uppercase/lowercase)");
        expect(output.errors[0].description).toBe("The annotation has a property entry with an uppercase/lowercase error ('naMe' that should be 'name').");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('303 - Non-conform property (misspell)', () => {
    test("303 - Non-conform property (misspell) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "nam": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (misspell)");
        expect(output.errors[0].description).toBe("The annotation has a wrong spelled property entry ('nam' that could be one of the following: 'map, nsn, name, game').");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("303 - Non-conform property (misspell) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Person",
                "nam": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property (misspell)");
        expect(output.errors[0].description).toBe("The annotation has a wrong spelled property entry ('nam' that could be one of the following: 'map, nsn, name, game').");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('303 - Non-conform property (unknown type)', () => {
    test("303 - Non-conform property 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Person",
            "name": "Aaron Rodgers",
            "explanation": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property");
        expect(output.errors[0].description).toBe("The annotation has a property entry ('explanation') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("303 - Non-conform property 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Person",
                "name": "Aaron Rodgers",
                "explanation": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(303);
        expect(output.errors[0].name).toBe("Non-conform property");
        expect(output.errors[0].description).toBe("The annotation has a property entry ('explanation') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});