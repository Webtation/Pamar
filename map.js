var Pamar = function Pamar(){
  this.mappings = [];
};

Pamar.prototype = Object.create(Object.prototype);
Pamar.prototype.constructor = Pamar;



Pamar.prototype.map = function map(inUrl) {
  var self = this;
  var url = {};
  url.in = this.parse(inUrl);
  url.out = {};
  for (var i = 0; i < this.mappings.length; i++) {
    var mapping = this.mappings[i];
    if (!Array.isArray(mapping) || mapping.length<2) return acc;
    if (self.checkAndOr(url, self.check(url, mapping[0],false, self.conditionNCB.bind(self)), false)) 
      self.check(url, mapping[1],true, self.actionNCB.bind(self)); 
    else self.check(url, mapping[2],true, self.actionNCB.bind(self)); 
  }
    
  url.outStr = this.formatUrl(url.out);
  return url;
} 


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

Pamar.prototype.formatUrl = function formatUrl(url) {
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



Pamar.prototype.check = function check(url, obj, andFlag, nameCB) {
  if (!obj) return true;
  var scheck = this.check.bind(this);
  //nameCB = nameCB.bind(this);
  if (typeof obj === 'string' || obj instanceof String) return [obj];
  if (Array.isArray(obj)) return obj.reduce(function(acc,item){
    acc.push(scheck(url, item, andFlag, nameCB)[0]);
    return acc;
  },[])
  var result = [];
  
  for (var k in obj) {
   if (k[0]==='$') {

      var command = this.commands[k];
      var flag = andFlag;
      if (command.flag !== undefined) flag = command.flag;
      var ncb = nameCB;
      if (command.ncb) ncb = command.ncb.bind(this);

      result.push( command.func.bind(this, url, scheck(url, obj[k], flag, ncb), flag)());
      
      } else {
      result.push ( nameCB(url, k, scheck(url, obj[k], andFlag, nameCB), andFlag));
    }
  }
  return result;

}

Pamar.prototype.conditionNCB = function conditionNCB(url, name, obj, andFlag) {
  var src = url.in[name];
  if (!src) return false;
  for (var i = 0; i < obj.length; i++)
    if ((src.indexOf(obj[i])<0) === andFlag) return !andFlag;
  return andFlag;

}

Pamar.prototype.actionNCB = function actionNCB(url, name, obj, andFlag) {
  if (!url.out[name]) url.out[name] = [];
  obj.forEach(function(item){
    url.out[name].push(item);
  }) 
  return true;
}

Pamar.prototype.srcNCB = function srcNCB(url, name, obj, andFlag) {
  if (!url.in[name]) url.in[name] = [];
  obj.forEach(function(item){
    url.in[name].push(item);
  }) 
  return true;
}

Pamar.prototype.ssrcNCB = function ssrcNCB(url, name, obj, andFlag) {
  if (obj.length === 0) return true;
  url.in[name] = [ obj[obj.length-1]]; 
  return true;
}

Pamar.prototype.renameNCB = function reNameNCB(url, name, obj, andFlag) {
  var des = obj[0];
  url.out[des] = url.out[name];
  delete url.out[name];
  return true;
}


Pamar.prototype.checkBool = function checkBool(url, obj) {
  if (obj===false || obj==='0' || obj==='false') return false;
  return true;
}

Pamar.prototype.checkAndOr = function checkAndOr(url, obj, andFlag) {
  if (obj.length===0) return true;
  return obj.reduce(function(acc,item){
    if (acc!==andFlag) return acc;
    if (item===false || item==='0' || item==='false') return false;
    return true;
  }, andFlag);
}

Pamar.prototype.checkEq = function checkEq(url, obj) {
  for (var i = 1; i < obj.length; i++ )
    if (obj[i]!==obj[0]) return false;
  return true;
}

Pamar.prototype.checkNot = function checkNot(url, obj, andFlag) {
  return !this.checkAndOr(url, obj, andFlag);
}

Pamar.prototype.actionSrc = function actionSrc(url, obj) {
  if (url.in[obj[0]]) return url.in[obj[0]][0];
  return true;
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

Pamar.prototype.actionRename = function actionRename (url, obj, andFlag) {
  return true;
}



Pamar.prototype.subString = function subString(string) {
  if (string.indexOf('@')<0) return string;
  var terms = string.split('@');
  var result = [];
  var text = true;
  terms.forEach(function(term){
    if (text) result.push(term);
    else result.push({$src:term});
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



Pamar.prototype.commands = {

  $or       : { func : Pamar.prototype.checkAndOr, flag : false },
  $and      : { func : Pamar.prototype.checkAndOr, flag : true },
  $eq       : { func : Pamar.prototype.checkEq },
  $not      : { func : Pamar.prototype.checkNot },
  $bool     : { func : Pamar.prototype.checkBool },
  $clear    : { func : Pamar.prototype.actionClear },
  $copy     : { func : Pamar.prototype.actionCopy },
  $comp     : { func : Pamar.prototype.actionComp },
  $src      : { func : Pamar.prototype.actionSrc, ncb : Pamar.prototype.srcNCB },
  $ssrc     : { func : Pamar.prototype.actionSrc, ncb : Pamar.prototype.ssrcNCB },
  $rename   : { func : Pamar.prototype.actionRename, ncb : Pamar.prototype.renameNCB }

}

exports = Pamar;

var url = 'opt=suv,red,gps,lights,regbat';

var test = { $hash : { opt : { suv : {}, red:''}} }

'#h1:red# ; color:red';
'#h1:blue# ; color:blue';

'#h1$opt#'

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

