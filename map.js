var pmMapper = {};

pmMapper.mappings = [];

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

pmMapper.check = function check(condition, url, andFlag) {
	for (var c in condition);
	return this.checkCondition(c, condition[c], url, andFlag);
}

pmMapper.arrayCheck = function arrayCheck(src, lookup, andFlag) {
  andFlag = !!andFlag;
  if (Array.isArray(lookup)) {
    for (var i = 0; i < lookup.length; i++)
      if ((src.indexOf(lookup[i])<0) === andFlag) return !andFlag;
    return andFlag;
  } else return (src.indexOf(lookup) >=0);
}

pmMapper.checkCondition = function checkCondition(check, context, url, andFlag) {
  if (!check) return true;
	if (check[0]==='$') {
    	if (check==='$and') return this.checkAndOr(context, url, true);
    	if (check==='$or') return this.checkAndOr(context, url, false);
    	if (check==='$not') return this.checkNot(context, url, andFlag);
      if (check==='$eq') return this.checkEq(context, url, andFlag);
    } else 
      if (url.hasOwnProperty(check) && this.arrayCheck(url[check],context, andFlag)) return true;
    return false;
}

pmMapper.checkAndOr = function checkAndOr(con, url, andFlag) {
  var self = this;
  if (Array.isArray(con)) return con.reduce(function(acc,c){
    if (acc!==andFlag) return acc;
    return self.check(c,url, andFlag);
  }, andFlag);
  for (var c in con)
    if (this.checkCondition(c,con[c],url, andFlag)!==andFlag) return !andFlag;
  return andFlag;
}

pmMapper.checkNot = function checkNot(con, url, andFlag) {
	for (var c in con);
	return !this.checkCondition(c,con[c],url, andFlag);
}

pmMapper.checkEq = function checkEq(con, url, andFlag) {
  for (var c in con);
  return this.checkCondition(c,con[c],url, andFlag);
}

pmMapper.action = function action(action, inUrl, outUrl) {
  if (!action) return;
  for (var k in action) {
    if (k[0]==='$') {
      if (k==='$clear') this.actionClear(action[i],outUrl);
      if (k==='$copy') this.actionCopy(action[k],inUrl,outUrl);
      if (k==='$src') this.actionSrc(action[k],inUrl);
      if (k==='$ssrc') this.actionSSrc(action[k],inUrl);
    } else {
      if (!outUrl.hasOwnProperty(k)) outUrl[k] = []; 
      outUrl[k] = outUrl[k].concat(action[k]);
    }
  }
}

pmMapper.actionClear = function actionClear(scope, outUrl) {
  for (var k in outUrl) 
    if(scope===true || scope===k) delete outUrl[k];
}

pmMapper.actionCopy = function actionCopy(scope, inUrl,outUrl) {
  for (var k in inUrl) 
    if (scope===true || scope===k) {
      if (!outUrl[k]) outUrl[k] = [];
      outUrl[k] = outUrl[k].concat(inUrl[k]);
    }
}

pmMapper.actionSrc = function actionSrc(item, inUrl) {
  for (var name in item) break;
  if (!inUrl[name]) inUrl[name] = [];
  if (Array.isArray(inUrl[name])) 
    inUrl[name].push(item[name]); 
  else inUrl[name] = [ inUrl[name], item[name]];
}

pmMapper.actionSSrc = function actionSSrc (item, inUrl) {
  for (var name in item) break;
  inUrl[name] = item[name];
}

pmMapper.map = function map(inUrl) {
  var self = this;
  inUrl = this.parse(inUrl);
  var result = this.mappings.reduce(function(acc, mapping){
    if (!Array.isArray(mapping) || mapping.length<2) return acc;
    if (self.check(mapping[0],inUrl,false)) 
      self.action(mapping[1],inUrl,acc); 
    else self.action(mapping[2],inUrl,acc);
    return acc;
  },{});
  return result;
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

pmMapper.acceptItem = function (input) {
  if (typeof input === 'string' || input instanceof String) {
    var terms = input.split(':');
    for (var a = 0; a < terms.length; a++) terms[a] = terms[a].trim();
    if (terms.length % 2) {
      var result = {};
      for (var a=1; a < terms.length; a+=2) result[terms[a]] = terms[a+1];
      var outer = {};
      outer[terms[0]] = result;
      return outer;      
    } else {       
      var result = {};
      for (var a=0; a < terms.length; a+=2) result[terms[a]] = terms[a+1];
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


/*
var url = 'tn=1,3&sa=3';

pmMapper.mappings.push([{},{$copy:"tn"}]);
pmMapper.mappings.push([{ $and: {sa : ["1","2"]}},{out:["55","53"]}]);

pmMapper.accept([{tn:'1'}, {$ssrc:{type:'normal'}} ]);
pmMapper.accept('tn:1 ; $ssrc:type:normal');
pmMapper.accept([{tn:'2'}, {$ssrc:{type:'short'}} ]);

// 'tn:2;$ssrc:type:normal'

pmMapper.accept(['tn:3', {$ssrc:{farbe:'blau'}} ]);
pmMapper.accept([{tn:'4'}, {$ssrc:{farbe:'grau'}} ]);

pmMapper.mappings.push([{$and:{farbe:'blau',type:'short'}}, {comp:'01_01'} ]);
//pmMapper.mappings.push([{$and:{farbe:'blau',type:'normal'}}, {comp:'01_02'} ]);

pmMapper.accept('$and : farbe : blau : type : normal   ; comp : 01_02');

pmMapper.mappings.push([{},{$copy:'tn',sb:'3'}]);




console.log(pmMapper.toString(pmMapper.map(url)));
*/