# General Verification of schema.org annotations

## Introduction

The general verification of schema.org annotations is defined as the process of checking if a given schema.org annotation in JSON-LD format is in compliance with the following specifications:

* JSON
* JSON-LD
* Schema.org

Additionally, restrictions are added/softened depending on real-world practices and usages (e.g. [schema.org's pragmatic view on conformance](https://schema.org/docs/datamodel.html#conformance), [Google's structured data testing tool](https://search.google.com/structured-data/testing-tool))

The output of the verification process is provided as an error report in a structured way (JSON-LD) with a specific data model (GeneralValidationReport). Any abnormalities are expressed through corresponding error entries. The documentation file "BasicValidation.md" provides the error list for JSON and JSON-LD specific errors. In the following the error list for schema.org is provided.

## Error List for General Verification of schema.org annotations

Error Codes for the General Verification of schema.org annotations start with 3

| ErrorCode | Name | Severity | Description |
| :---: | :---: | :---: | :--- |
| 300 | Generic schema.org Verification error | Any |Can be used as super-type for any error regarding the general validation |
| 301 | Non-conform @context | Error | Used @context must use/include schema.org
| 302 | Non-conform @type | Error | Used @type is non-conform to schema.org
| 303 | Non-conform property | Error | Used property is non-conform to schema.org
| 304 | Wrongly formatted action property | Error | Used action property (input-/output-) has a value that is not a string
| 305 | Non-conform domain | Error | Used property has a domain that is not allowed to use according to schema.org 
| 306 | Non-conform range | Error | Used property has a range that is not allowed to use according to schema.org 
| 307 | Unexpected string | Error | Used property has a string as value, although it is not explicitly allowed by to schema.org 
| 308 | Wrongly formatted enumeration | Warning | Used property has an enumeration value that is non-conform to schema.org (must be a URL stated as enumeration value)
| 309 | Empty entity | Warning | Used property has a range that is an entity with no properties

## Misc

### Context

The JSON-LD @Context allows to define a certain semantic in a lot of different syntactic ways (see [JSON-LD spec](https://w3c.github.io/json-ld-syntax/#the-context)), however, our algorithm expects/allows a certain sub-set of @context based on the overall practices of schema.org annotations.
Independent of the different syntactic variations, the most important takeaway is to use the right namespace for schema.org

#### Schema.org namespace

The perfect namespace for schema.org has been the following:
```
http://schema.org/
```

And schema.org states that with the time it should be shifted to use https (https://schema.org/docs/faq.html#19), so the following namespace should be recommended:
```
https://schema.org/
```

However, the following variants are possible for the namespace parts (according to examples of schema.org and [google](https://search.google.com/structured-data/testing-tool)):

```
"http" or "https" or without protocol
with "www." or without
with "/" at the end or without
```

Our verification tool should recommend **https://schema.org/** if one the variations is used that are not one of the above optimal namespaces.

#### Context variants

The following variations are allowed by our verification algorithm, where the first one is the recommended one.

##### 1. Single default @context

There is only 1 vocabulary used and defined as a simple string value. This is the most common seen notation variant.

```  
{
  "@context": "http://schema.org/",
  "@type": "Person",
  "birthDate":  "1989-09-20"
}
```

##### 2. Single default @context using @vocab

Like the first variant, but using the "@vocab" keyword to define the standard vocabulary.


```  
{
  "@context": {
    "@vocab": "http://schema.org/"
  },
  "@type": "Person",
  "birthDate":  "1989-09-20"
}
```

##### 3. Single-Termed Context

A single term that defines the schema.org vocabulary. It is used as shorthand for the absolute URI part without the vocabulary term identifier -> "schema:Person" instead of "http://schema.org/Person".

```  
{
    "@context": {
        "schema": "http://schema.org/"
    },
    "@type": "schema:Person",
    "schema:birthDate": "1989-09-20"   
}
```

##### 4. Multiple Vocabularies, default using @vocab
        
The "@vocab" keyword defines the standard vocabulary (terms without vocabulary indicator), and additional vocabularies are defined with specific vocabulary indicators. The standard @vocab should be schema.org 
        
       
```  
{
  "@context": {
    "@vocab": "http://schema.org/",
    "exmp": "http://example.com/"
  },
  "@type": "Person",
  "birthDate":  "1989-09-20",
  "exmp:socialIdNr": "A-23435"
}
```

##### 5. Multi-Termed Context

Multiple vocabularies that are defined by specific terms.

```  
{
    "@context": {
        "schema": "http://schema.org/",
        "exmp": "http://example.com/"
    },
    "@type": "schema:Person",
    "schema:birthDate": "1989-09-20",
    "exmp:socialIdNr": "A-23435"   
}
```

### @graph

It is allowed to use a @graph keyword that "wraps" the annotation, but every node in this graph is seen as a tree (inner nodes) instead of loosely nodes (entities in the graph connected by URIs).

```  
{
    "@context": {
        "schema": "http://schema.org/",
        "exmp": "http://example.com/"
    },
    "@graph": [
        {
            "@type": "schema:Person",
            "schema:birthDate": "1989-09-20",
            "exmp:socialIdNr": "A-23435",
            "schema:address": {
                "@type": "schema:PostalAddress",
                "name": "Au Gasse 34"
            }
        }
    ]   
}
```


### Typed values 

Typed values are those literals expressed by an object having @type of the data type and @value for the actual value. It is very useful to define a specific data-type, but unfortunately not embraced in practice, and not supported by [google](https://search.google.com/structured-data/testing-tool) (checked 10.2019). So, our algorithm does not allow this syntax. (Example: 1. link is typed value. 2. link is how it is used in practise).

Our algorithm could show a warning for typed values.

```JSON
{
    "sameAs": [
        {
            "@type": "URL",
            "@value": "https://twitter.com/Link1"
        },
        "https://twitter.com/Link2"
    ]
}
```

### Enumerations

The enumerations model of schema.org is very unclear. It is still to discuss/figure out, what is allowed/recommended in regards of enumerations. Basically, they could be accepted as Entities (e.g. CreditCard) or URIs (e.g. Monday).


### Actions

schema.org documentation about actions: https://schema.org/docs/actions.html

Action entities may have "action"-specific input and output properties. Those may have as value a String or a PropertyValueSpecification-typed object.