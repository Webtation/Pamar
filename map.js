var pmMapper = {};

pmMapper.mappings = [];
pmMapper.inUrl = {};
pmMapper.outUrl = {};

pmMapper.nameCheck = undefined;

pmMapper.parse = function parse(url) {

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



pmMapper.check = function check(obj, andFlag, nameCB) {
  if (!obj) return true;
  var self = this;
  if (typeof obj === 'string' || obj instanceof String) return [obj];
  if (Array.isArray(obj)) return obj.reduce(function(acc,item){
    acc.push(self.check(item, andFlag, nameCB)[0]);
    return acc;
  },[])
  var result = [];
  var cfunc = function (command, flag, ncb) {
    if (flag===undefined) flag = andFlag;
    if (ncb) ncb = ncb.bind(self); else ncb = nameCB;
    return result.push(command.bind(self, self.check(obj[k], flag, ncb), flag)());
  }
  for (var k in obj) {
    if (k[0]==='$') {
      if (k==='$or')  cfunc(this.checkAndOr,false);
      if (k==='$and') cfunc(this.checkAndOr,true);
      if (k==='$eq')  cfunc(this.checkEq);
      if (k==='$bool') cfunc(this.checkBool);
      if (k==='$clear') cfunc(this.actionClear);
      if (k==='$copy') cfunc(this.actionCopy);
      if (k==='$src') cfunc(this.actionSrc, andFlag, this.srcNameCheck);
      if (k==='$ssrc') cfunc(this.actionSrc, andFlag, this.ssrcNameCheck);
      //if (k==='$get') return this.actionGet(action[k],inUrl);
      if (k==='$comp') cfunc(this.actionComp);
    } else {
      result.push ( nameCB(k, this.check(obj[k], andFlag, nameCB), andFlag));
    }
  }
  return result;

}




pmMapper.arrayCheck = function arrayCheck(src, lookup, andFlag) {
  andFlag = !!andFlag;
  if (Array.isArray(lookup)) {
    for (var i = 0; i < lookup.length; i++)
      if ((src.indexOf(lookup[i])<0) === andFlag) return !andFlag;
    return andFlag;
  } else return (src.indexOf(lookup) >=0);
}

pmMapper.checkBool = function checkBool(obj) {
  if (obj===false || obj==='0' || obj==='false') return false;
  return true;
}

pmMapper.checkAndOr = function checkAndOr(obj, andFlag) {
  if (obj.length===0) return true;
  var self = this;
  return obj.reduce(function(acc,item){
    if (acc!==andFlag) return acc;
    return self.checkBool(item);
  }, andFlag);
}

pmMapper.conNameCheck = function conNameCheck(name, obj, andFlag) {
  var src = this.inUrl[name];
  if (!src) return false;
  for (var i = 0; i < obj.length; i++)
    if ((src.indexOf(obj[i])<0) === andFlag) return !andFlag;
  return andFlag;

}

pmMapper.actionNameCheck = function actionNameCheck(name, obj, andFlag) {
  if (!this.outUrl[name]) this.outUrl[name] = [];
  var self = this;
  obj.forEach(function(item){
    self.outUrl[name].push(item);
  }) 
  return true;
}

pmMapper.srcNameCheck = function srcNameCheck(name, obj, andFlag) {
  if (!this.inUrl[name]) this.inUrl[name] = [];
  var self = this;
  obj.forEach(function(item){
    self.inUrl[name].push(item);
  }) 
  return true;
}

pmMapper.ssrcNameCheck = function ssrcNameCheck(name, obj, andFlag) {
  if (obj.length === 0) return;
  this.inUrl[name] = [ obj[obj.length-1]]; 
  return true;
}

pmMapper.actionSrc = function actionSrc(obj) {
  if (this.inUrl[obj[0]]) return this.inUrl[obj[0]][0];
  return true;
}





pmMapper.checkEq = function checkEq(obj) {
  for (var i = 1; i < obj.length; i++ )
    if (obj[i]!==obj[0]) return false;
  return true;
}





pmMapper.actionComp = function actionComp(obj) {
  return obj.reduce(function(acc, item){
    return acc += item;
  },'');
}

pmMapper.actionClear = function actionClear(obj) {
  var self = this;
  obj.forEach(function(item){
    for (var k in self.outUrl)
      if (item === true || item === '*' || item === k) delete self.outUrl[k];
  })
}

pmMapper.actionCopy = function actionCopy(obj) {
  var self = this;
  obj.forEach(function(item){
    for (var k in self.inUrl)
      if (item === true || item === '*' || item === k) {
        if (!self.outUrl[k]) outUrl[k] = [];
        self.outUrl[k] = self.outUrl[k].concat(self.inUrl[k]);
      }
  })
}





pmMapper.map = function map(inUrl) {
  var self = this;
  this.inUrl = this.parse(inUrl);
  var result = this.mappings.reduce(function(acc, mapping){
    if (!Array.isArray(mapping) || mapping.length<2) return acc;
    if (self.checkAndOr(self.check(mapping[0],false, self.conNameCheck.bind(self)), false)) 
      self.check(mapping[1],true, self.actionNameCheck.bind(self)); 
    else self.check(mapping[2],true, self.actionNameCheck.bind(self)); 
    return acc;
  },{});
  return this.outUrl;
} 

pmMapper.toString = function toString(url) {
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

pmMapper.subString = function (string) {
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

pmMapper.acceptItem = function (input) {
  if (typeof input === 'string' || input instanceof String) {
    if (input.trim()==='') return {};
    var terms = input.split(':');
    for (var a = 0; a < terms.length; a++) terms[a] = terms[a].trim();
    if (terms.length % 2) {
      var result = {};
      for (var a=1; a < terms.length; a+=2) result[terms[a]] = this.subString(terms[a+1]);
      var outer = {};
      outer[terms[0]] = result;
      return outer;      
    } else {       
      var result = {};
      for (var a=0; a < terms.length; a+=2) result[terms[a]] = this.subString(terms[a+1]);
      return result;
    }

  } else return input;
}

pmMapper.accept = function (input) {
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



var url = 'tn=1,3&sa=3';
pmMapper.inUrl = pmMapper.parse(url);


//console.log(pmMapper.check({ $or:{sa : '3' }}));

pmMapper.accept([{tn : {$src : 'sa'}},{na : ['1','2']}]);
console.log(pmMapper.mappings);
pmMapper.map(url);

console.log(pmMapper.outUrl);
console.log(pmMapper.inUrl)



