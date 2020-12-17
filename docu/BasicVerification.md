# Error List for Basic Verification

Error codes regarding the basic validation: Execution/JSON/JSON-LD

Execution Error

| ErrorCode | Name | Severity | Description |
| :---: | :---: | :---: | :--- |
| 999 | Execution error | Critical | Unexpected error happened during the validation execution

JSON Error Codes start with 1

| ErrorCode | Name | Severity | Description |
| :---: | :---: | :---: | :--- |
| 100 | JSON related Error|	Error |Generic JSON related error.
| 101 | Invalid JSON |Critical|	The input is not valid JSON. - string that can not be parsed to json
| 102 | Empty JSON | Critical| The input is empty - null, empty object, "", undefined, []
| 103 | No JSON Object |Critical	|The input is not a JSON object - input should be an JSON object, and not an array of annotations, or something else
| 104 | 	Usage of undefined	| Error| 	Usage of undefined as value - Not valid in JSON

JSON-LD Error Codes start with 2

| ErrorCode | Name | Severity | Description |
| :---: | :---: | :---: | :--- |
| 200	| JSON-LD related Error	| Error| 	Generic JSON-LD related error.
| 201	| No @context| 	Critical| 	The input has no @context
| 202	| Bad @context	| Error| 	The input has an invalid @context. Must be something in different syntax possibilities, only one @context in whole document expected.
| 203	| No @type	| Critical| 	Object misses a @type property.
| 204	| Bad @type| 	Error| 	Object has an invalid @type - must be string or array of strings
| 205	| Double Nested Array| 	Error| 	The input contains a double nested array, which is not conform to the JSON-LD Specification.
| 206| 	Usage of null| 	Warning| 	Usage of null as value - The use of the null value within JSON-LD is used to ignore or reset values. null has the same meaning as if the dictionary member was not defined.
| 207	| Usage of empty string| 	Warning	| Usage of an empty string as value