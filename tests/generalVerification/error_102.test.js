const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 102
 * Empty JSON
 *
 * The input annotation must not be empty - null, undefined, empty object, empty array
 */
describe('102 - Empty JSON', () => {
    test("102 - Empty JSON 1", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = null;
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(102);
        expect(output.errors[0].name).toBe("Empty JSON");
        expect(output.errors[0].description).toBe("The input annotation is empty.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("102 - Empty JSON 2", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = undefined;
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(102);
        expect(output.errors[0].name).toBe("Empty JSON");
        expect(output.errors[0].description).toBe("The input annotation is empty.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("102 - Empty JSON 3", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = {};
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(102);
        expect(output.errors[0].name).toBe("Empty JSON");
        expect(output.errors[0].description).toBe("The input annotation is empty.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("102 - Empty JSON 4", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = [];
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(102);
        expect(output.errors[0].name).toBe("Empty JSON");
        expect(output.errors[0].description).toBe("The input annotation is empty.");
        expect(output.verificationResult).toBe("Invalid");
    });
});