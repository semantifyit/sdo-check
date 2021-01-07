const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 302
 * Non-conform @type
 *
 * The @type must exist in the schema.org vocabulary. Further help is given by distinguishing the error causes:
 * blank spaces
 * lower/upper-case problems
 * misspells
 */
describe('302 - Non-conform @type (blank space)', () => {
    test("302 - Non-conform @type (blank space) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Perso n",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(302);
        expect(output.errors[0].name).toBe("Non-conform @type (blank space)");
        expect(output.errors[0].description).toBe("The annotation has a @type entry with at least 1 blank space ('Perso n') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("302 - Non-conform @type (blank space) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Perso n",
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(2); // Also a "invalid range" error is generated as expected
        expect(output.errors[1]["@type"]).toBe("AnnotationError");
        expect(output.errors[1].severity).toBe("Error");
        expect(output.errors[1].errorCode).toBe(302);
        expect(output.errors[1].name).toBe("Non-conform @type (blank space)");
        expect(output.errors[1].description).toBe("The annotation has a @type entry with at least 1 blank space ('Perso n') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('302 - Non-conform @type (uppercase/lowercase)', () => {
    test("302 - Non-conform @type (uppercase/lowercase) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "PersoN",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(302);
        expect(output.errors[0].name).toBe("Non-conform @type (uppercase/lowercase)");
        expect(output.errors[0].description).toBe("The annotation has a @type entry with an uppercase/lowercase error ('PersoN' that should be 'Person').");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("302 - Non-conform @type (uppercase/lowercase) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "person",
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(2); // Also a "invalid range" error is generated as expected
        expect(output.errors[1]["@type"]).toBe("AnnotationError");
        expect(output.errors[1].severity).toBe("Error");
        expect(output.errors[1].errorCode).toBe(302);
        expect(output.errors[1].name).toBe("Non-conform @type (uppercase/lowercase)");
        expect(output.errors[1].description).toBe("The annotation has a @type entry with an uppercase/lowercase error ('person' that should be 'Person').");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('302 - Non-conform @type (misspell)', () => {
    test("302 - Non-conform @type (misspell) 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "Persn",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(302);
        expect(output.errors[0].name).toBe("Non-conform @type (misspell)");
        expect(output.errors[0].description).toBe("The annotation has a wrong spelled @type entry ('Persn', could be one of the following: 'Person') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("302 - Non-conform @type (misspell) 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "Parson",
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(2); // Also a "invalid range" error is generated as expected
        expect(output.errors[1]["@type"]).toBe("AnnotationError");
        expect(output.errors[1].severity).toBe("Error");
        expect(output.errors[1].errorCode).toBe(302);
        expect(output.errors[1].name).toBe("Non-conform @type (misspell)");
        expect(output.errors[1].description).toBe("The annotation has a wrong spelled @type entry ('Parson', could be one of the following: 'Person') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});

describe('302 - Non-conform @type (unknown type)', () => {
    test("302 - Non-conform @type 1", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "TheMVP",
            "name": "Aaron Rodgers",
            "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("AnnotationError");
        expect(output.errors[0].severity).toBe("Error");
        expect(output.errors[0].errorCode).toBe(302);
        expect(output.errors[0].name).toBe("Non-conform @type");
        expect(output.errors[0].description).toBe("The annotation has a @type entry ('TheMVP') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("302 - Non-conform @type 2", async () => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {
            "@context": "http://schema.org/",
            "@type": "SportsTeam",
            "name": "Green Bay Packers",
            "athlete": {
                "@type": "TheMVP",
                "name": "Aaron Rodgers",
                "description": "Aaron Rodgers is an American football quarterback for the Green Bay Packers of the National Football League (NFL)."
            }
        };
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(2); // Also a "invalid range" error is generated as expected
        expect(output.errors[1]["@type"]).toBe("AnnotationError");
        expect(output.errors[1].severity).toBe("Error");
        expect(output.errors[1].errorCode).toBe(302);
        expect(output.errors[1].name).toBe("Non-conform @type");
        expect(output.errors[1].description).toBe("The annotation has a @type entry ('TheMVP') that is not conform to schema.org.");
        expect(output.verificationResult).toBe("Invalid");
    });
});