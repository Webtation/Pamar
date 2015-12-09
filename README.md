# pmMapper

The pmMapper helps to map an existing URL to a different URL, by transforming the query string (url parameters).

## URL query string

URL parameters must be structured as 

```
param1=value1[,value2...]&param2=value1[,value2...]...
```

No special characters are allowed.
Any parameter can have multiple values, seperated by a coma.
If a parameter apears multiple times, it will be treated as a list of values for the same parameter.

## Data model

The pmMapper controls three data-collections.

- Input params  (the query string to be mapped, every request provides params that will be parsed)
- Output params (the resulting query string, with every mapping process, a new output param object will be created)
- Mapping rules (rules are inserted before mapping and will be applied during the mapping process)

## Mapping process

The mapping process parses the input params and creates an empty output params object.
The process will then apply every mapping rule.

The process returns the populated output params object.

## Mapping Rule

A mapping rule can have two or three components, provided as objects in an array

```
{condition object} , { action object} [,{ else action object}] 
```

The else action can be ommited.

