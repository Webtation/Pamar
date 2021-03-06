# Pamar

Pamar helps to map an existing URL to a different URL, by transforming the query string (url parameters).

## URL query string

URL parameters must be structured as 

```
param1=value1[,value2...]&param2=value1[,value2...]...
```

No special characters are allowed.
Any parameter can have multiple values, seperated by a coma.
If a parameter apears multiple times, it will be treated as a list of values for the same parameter.

## Simple example

```
Input
foo=bar&prod=test
```

```
Mapping Rule
[{ foo : 'bar'} , { test : ' pass', day : 'fri'}]
```

```
Output
test=pass&day=fri
```

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

The else action can be omitted.


### Condition Object

Unless otherwise specified, all conditions are checked against the input params.

A single string is generally treated like an array with only a single string.

As any parameter can have multiple values, a check for a single value returns true, if the value-list contains the value.
(Example months=jan,feb,may returns true for months : feb)

By default, all conditions are checked under the OR-assumption.  With the $and-operator it can be changed to AND.

```
{}  // Empty condition, always true.
{foo : 'bar'}  or {foo : ['bar']} // true for param 'foo' with a value 'bar'
{foo : ['bar','box']}  // true for param 'foo' with value 'bar' OR 'box'
{foo : 'bar', prod : 'test'}  // true for param 'foo' with 'bar' OR 'prod' with 'test'
```


```
{ $or :  { remaining condition } }  // remaining condition will be under OR-assumption (default behavior)
{ $and:  { remaining condition } }  // remaining condition will be under AND-assumption

{ $and :  { day : 'sun', prod : 'test'}}  // true for param 'day' with 'sun' AND 'prod' with 'test'
{ $and :  { day : ['sun','mon']}  // true for param 'day' with value 'sun' AND 'mon'

```

## Action object

Unless otherwise specified, all actions are done to the output params.

A single string is generally treated like an array with only a single string.

```
{}  // Empty action, does nothing.
{foo : 'bar'}  or {foo : ['bar']} // adds 'bar' to the param 'foo'
{foo : ['bar','box']}  // adds 'bar' AND 'box' to the param 'foo'
{foo : 'bar', prod : 'test'}  // adds 'bar' to 'foo' and 'test' to 'prod'
```

```
{ $copy : true} or { $copy : '*' }  // copies all params from the input to the output
{ $copy : 'foo'} or { $copy : ['foo'] }  // copies the param 'foo' from the input to the output
{ $clear : true} or { $clear : '*' }  // deletes all params from the output
{ $clear : 'foo'} or { $clear : ['foo'] }  // deletes the param 'foo' from the output
```

## Short notation

All mapping rules are difined in condition and action objects.  For convinience some mapping rules can be difined in strings.
(Elements within the string will be trimmed.)

```
Same mapping rule
[{ foo : 'bar' }, { test : 'pass' }]  // default syntax as objects
[ ' foo : bar ' , ' test : pass ' ]  // using two strings
' foo : bar ; test : pass '  // using one string, no array needed
```

- String is split at semi-colon (;) for condition and action object.
- For condition and action, string is split at colon (:)
- If even items, one object is created: { item0 : 'item1', item2 : 'item3' ...}
- If odd items, one object is created with a nested object:  { item0 : { item1 : 'item2', item3 : 'item4'...}}
- Items are split at ',' creating an array of strings

```
' $and : foo : bar,box '  // { $and : { foo : ['bar', 'box'] } }
' $copy : * : $clear : test'  // { $copy : '*', $clear : 'test' }
```

## Complex example

Asume a remote-control toy-car.  The customer can chose different options, according to which different parts need to be ordered.

- You can chose an SUV or sedan.  
- They can come in two different color:  black, red.
- You can opt for GPS, the GPS module for the SUV is always black, for the sedan in colors : black or red.  (measure lap times and speed, use smart-phone app to see tracks on google map)
- Option all-wheel-drive needs special controls for remote
- Lights-package comes with head-lights and rear-lights, needs special controls for remote
- You always get the correct remote
- You can chose between regular or extended battery (extended is heavier but provides more power, if no battery is specified, you get the regular battery (default))
- You always get a standard charger


```
PRT#  DESCRIPTION
1201  model suv with engine, black
1202  model suv with engine, red
1211  model sedan with engine, black
1212  model sedan with engine, red
5631  gps module, black
5635  gps module, red
2420  remote standard
2421  remote with all-wheel-drive
2422  remote with light-controls
2423  remote with all-wheel-drive and light-controls
2201  head-lights (fit both suv and sedan)
2202  rear-lights (fit both suv and sedan)
4870  regular battery
4871  extended battery
5000  standard charger
```

- Following options are available:  suv, sedan, black, red, gps, awd, lights, regbat, extbat
- The options will be provided with the param 'options'
- The output needs the partnumbers in 'parts'
- The output also needs a parameter 'transport' set to 'package'

```
Example input
opt=suv,red,gps,lights,regbat

Example output
parts=1202,5631,2422,2201,2202,4870,5000&transport=package
```

### Mapping rules

```
[
  ' $and : opt : suv  , black ; parts : 1201',
  ' $and : opt : suv  , red   ; parts : 1202',
  ' $and : opt : sedan, black ; parts : 1203',
  ' $and : opt : sedan, red   ; parts : 1204',
  [ {$and: { opt:'gps',$or:{opt:['black','suv']}}} , 'parts : 5631'],
  ' $and : opt : sedan, red, gps  ;  parts : 5635',
  ' $not : opt : awd, lights ;  parts : 2420',
  [ {$and: { opt : 'awd', $not :{ opt : 'lights'}}}, ' parts: 2421'],
  [ {$and: { opt : 'lights', $not :{ opt : 'awd'}}}, ' parts: 2422'],
  ' $and : opt : awd, lights ; parts : 2423',
  ' opt : lights ; parts : 2201, 2202',
  ' opt : extbat ; parts : 4871 ; parts : 4870',
  ' ; parts : 5000',
  ' ; transport : package'
]
```

### Reference

Pamar is used in www.slidebaker.com in order to map product logic to image logic.  This way, the complex image building logic is hidden from a system, that only works with the product itself.
