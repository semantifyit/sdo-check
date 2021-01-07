const testHelper = require("./testHelper");
const verify = testHelper.generalVerification.isAnnotationValid;

/**
 * Tests for Error Code 101
 * Invalid JSON
 *
 * The input annotation must be valid JSON that is parsable by JSON.parse()
 */
describe('101 - Invalid JSON', () => {
    test("101 - Invalid JSON 1", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = "asdf random string";
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(101);
        expect(output.errors[0].name).toBe("Invalid JSON");
        expect(output.errors[0].description).toBe("The input annotation can not be parsed to JSON.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("101 - Invalid JSON 2", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation =  '{"test":asdfa}';
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(101);
        expect(output.errors[0].name).toBe("Invalid JSON");
        expect(output.errors[0].description).toBe("The input annotation can not be parsed to JSON.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("101 - Invalid JSON 3", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation = '';
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(101);
        expect(output.errors[0].name).toBe("Invalid JSON");
        expect(output.errors[0].description).toBe("The input annotation can not be parsed to JSON.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("101 - Invalid JSON 4", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation =  '{"key1":1,"key2":"invalid}';
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(101);
        expect(output.errors[0].name).toBe("Invalid JSON");
        expect(output.errors[0].description).toBe("The input annotation can not be parsed to JSON.");
        expect(output.verificationResult).toBe("Invalid");
    });
    test("101 - Invalid JSON 5", async() => {
        await testHelper.letSdoAdapterLoad();
        let inputAnnotation =  '{"key1":1 "key2":"missing ,"}';
        let output = await verify(inputAnnotation);
        console.log(JSON.stringify(output, null, 2));
        expect(output.errors.length).toBe(1);
        expect(output.errors[0]["@type"]).toBe("JsonError");
        expect(output.errors[0].severity).toBe("Critical");
        expect(output.errors[0].errorCode).toBe(101);
        expect(output.errors[0].name).toBe("Invalid JSON");
        expect(output.errors[0].description).toBe("The input annotation can not be parsed to JSON.");
        expect(output.verificationResult).toBe("Invalid");
    });
});