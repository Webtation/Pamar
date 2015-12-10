var Pamar = function Pamar(){
  this.mappings = [];
};

Pamar.prototype = Object.create(Object.prototype);
Pamar.prototype.constructor = Pamar;




Pamar.prototype.parse = function parse(url) {

  var params = url.split('&');
  return params.reduce(function(acc,param){
    var terms = param.split('=');
    var name = terms[0];
    var particles = []; 
    if (terms[1]) particles = terms[1].split(',');
    acc[name] = particles;
    return acc;
  },{})

}



Pamar.prototype.check = function check(url, obj, andFlag, nameCB) {
  if (!obj) return true;
  var self = this;
  if (typeof obj === 'string' || obj instanceof String) return [obj];
  if (Array.isArray(obj)) return obj.reduce(function(acc,item){
    acc.push(self.check(url, item, andFlag, nameCB)[0]);
    return acc;
  },[])
  var result = [];
  var cfunc = function (command, flag, ncb) {
    if (flag===undefined) flag = andFlag;
    if (ncb) ncb = ncb.bind(self); else ncb = nameCB;
    return result.push(command.bind(self, url, self.check(url, obj[k], flag, ncb), flag)());
  }
  for (var k in obj) {
   if (k[0]==='$') {
      if (k==='$or')  cfunc(this.checkAndOr,false);
      if (k==='$and') cfunc(this.checkAndOr,true);
      if (k==='$eq')  cfunc(this.checkEq);
      if (k==='$not') cfunc(this.checkNot);
      if (k==='$bool') cfunc(this.checkBool);
      if (k==='$clear') cfunc(this.actionClear);
      if (k==='$copy') cfunc(this.actionCopy);
      if (k==='$src') cfunc(this.actionSrc, andFlag, this.srcNameCheck);
      if (k==='$ssrc') cfunc(this.actionSrc, andFlag, this.ssrcNameCheck);
      if (k==='$comp') cfunc(this.actionComp);
    } else {
      result.push ( nameCB(url, k, this.check(url, obj[k], andFlag, nameCB), andFlag));
    }
  }
  return result;

}




Pamar.prototype.arrayCheck = function arrayCheck(src, lookup, andFlag) {
  andFlag = !!andFlag;
  if (Array.isArray(lookup)) {
    for (var i = 0; i < lookup.length; i++)
      if ((src.indexOf(lookup[i])<0) === andFlag) return !andFlag;
    return andFlag;
  } else return (src.indexOf(lookup) >=0);
}

Pamar.prototype.checkBool = function checkBool(url, obj) {
  if (obj===false || obj==='0' || obj==='false') return false;
  return true;
}

Pamar.prototype.checkAndOr = function checkAndOr(url, obj, andFlag) {
  if (obj.length===0) return true;
  var self = this;
  return obj.reduce(function(acc,item){
    if (acc!==andFlag) return acc;
    return self.checkBool(url, item);
  }, andFlag);
}

Pamar.prototype.conNameCheck = function conNameCheck(url, name, obj, andFlag) {
  var src = url.in[name];
  if (!src) return false;
  for (var i = 0; i < obj.length; i++)
    if ((src.indexOf(obj[i])<0) === andFlag) return !andFlag;
  return andFlag;

}

Pamar.prototype.actionNameCheck = function actionNameCheck(url, name, obj, andFlag) {
  if (!url.out[name]) url.out[name] = [];
  obj.forEach(function(item){
    url.out[name].push(item);
  }) 
  return true;
}

Pamar.prototype.srcNameCheck = function srcNameCheck(url, name, obj, andFlag) {
  if (!url.in[name]) url.in[name] = [];
  obj.forEach(function(item){
    url.in[name].push(item);
  }) 
  return true;
}

Pamar.prototype.ssrcNameCheck = function ssrcNameCheck(url, name, obj, andFlag) {
  if (obj.length === 0) return;
  url.in[name] = [ obj[obj.length-1]]; 
  return true;
}

Pamar.prototype.actionSrc = function actionSrc(url, obj) {
  if (url.in[obj[0]]) return url.in[obj[0]][0];
  return true;
}


Pamar.prototype.checkEq = function checkEq(url, obj) {
  for (var i = 1; i < obj.length; i++ )
    if (obj[i]!==obj[0]) return false;
  return true;
}

Pamar.prototype.checkNot = function checkEq(url, obj, andFlag) {
  return !this.checkAndOr(url, obj, andFlag);
}


Pamar.prototype.actionComp = function actionComp(url, obj) {
  return obj.reduce(function(acc, item){
    return acc += item;
  },'');
}

Pamar.prototype.actionClear = function actionClear(url, obj) {
  obj.forEach(function(item){
    for (var k in url.out)
      if (item === true || item === '*' || item === k) delete url.out[k];
  })
}

Pamar.prototype.actionCopy = function actionCopy(url, obj) {
  obj.forEach(function(item){
    for (var k in url.in)
      if (item === true || item === '*' || item === k) {
        if (!url.out[k]) url.out[k] = [];
        url.out[k] = url.out[k].concat(self.url.in[k]);
      }
  })
}





Pamar.prototype.map = function map(inUrl) {
  var self = this;
  var url = {};
  url.in = this.parse(inUrl);
  url.out = {};
  for (var i = 0; i < this.mappings.length; i++) {
    var mapping = this.mappings[i];
    if (!Array.isArray(mapping) || mapping.length<2) return acc;
    if (self.checkAndOr(url, self.check(url, mapping[0],false, self.conNameCheck.bind(self)), false)) 
      self.check(url, mapping[1],true, self.actionNameCheck.bind(self)); 
    else self.check(url, mapping[2],true, self.actionNameCheck.bind(self)); 
  }
    
  url.outStr = this.toString(url.out);
  return url;
} 

Pamar.prototype.toString = function toString(url) {
  var result = "";
  var sep = "";
  for (var k in url) {
    if (Array.isArray(url[k]))
      result+= sep + k + "=" + url[k].join(',');
    else result+= sep + k + "=" + url[k];
    sep = "&";
  }
  return result;
}

Pamar.prototype.subString = function subString(string) {
  if (string.indexOf('@')<0) return string;
  var terms = string.split('@');
  var result = [];
  var text = true;
  terms.forEach(function(term){
    if (text) result.push(term);
    else result.push({$get:term});
    text = !text;
  })
  return {$comp: result};

}

Pamar.prototype.splitItem = function(string) {
  var items = string.split(',');
  for (var i = 0; i < items.length; i++)
    items[i] = this.subString(items[i].trim());
  return items;

}

Pamar.prototype.acceptItem = function acceptItem(input) {
  if (typeof input === 'string' || input instanceof String) {
    if (input.trim()==='') return {};
    var terms = input.split(':');
    for (var a = 0; a < terms.length; a++) terms[a] = terms[a].trim();
    if (terms.length % 2) {
      var result = {};
      for (var a=1; a < terms.length; a+=2) result[terms[a]] = this.splitItem(terms[a+1]);
      var outer = {};
      outer[terms[0]] = result;
      return outer;      
    } else {       
      var result = {};
      for (var a=0; a < terms.length; a+=2) result[terms[a]] = this.splitItem(terms[a+1]);
      return result;
    }

  } else return input;
}

Pamar.prototype.accept = function accept(input) {
  if (!input) return;
  if (Array.isArray(input)) {
    if (input.size===0) return;
    var ps = [];
    var self = this;
    if (input.size===1) ps.push({});
    input.forEach(function(item){
      ps.push(self.acceptItem(item));
    })
    this.mappings.push(ps);
  } else {
    var terms = input.split(';');
    this.accept(terms);
  }
}

Pamar.prototype.acceptAll = function acceptAll(mappings) {
  for (var i = 0; i < mappings.length; i++)
    this.accept(mappings[i]);
}

exports = Pamar;

/*
var url = 'opt=suv,red,gps,lights,regbat';

var pm = new Pamar;

pm.acceptAll([
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
)



var ret = pm.map(url);

console.log(ret.outStr);
*/