var urlMapper = {};

urlMapper.mappings = [];

urlMapper.parse = function parse(url) {

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

urlMapper.check = function check(condition, url, andFlag) {
	for (var c in condition);
	return this.checkCondition(c, condition[c], url, andFlag);
}

urlMapper.arrayCheck = function arrayCheck(src, lookup, andFlag) {
  andFlag = !!andFlag;
  if (Array.isArray(lookup)) {
    for (var i = 0; i < lookup.length; i++)
      if ((src.indexOf(lookup[i])<0) === andFlag) return !andFlag;
    return andFlag;
  } else return (src.indexOf(lookup) >=0);
}

urlMapper.checkCondition = function checkCondition(check, context, url, andFlag) {
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

urlMapper.checkAndOr = function checkAndOr(con, url, andFlag) {
  var self = this;
  if (Array.isArray(con)) return con.reduce(function(acc,c){
    if (acc!==andFlag) return acc;
    return self.check(c,url, andFlag);
  }, andFlag);
  for (var c in con)
    if (this.checkCondition(c,con[c],url, andFlag)!==andFlag) return !andFlag;
  return andFlag;
}

urlMapper.checkNot = function checkNot(con, url, andFlag) {
	for (var c in con);
	return !this.checkCondition(c,con[c],url, andFlag);
}

urlMapper.checkEq = function checkEq(con, url, andFlag) {
  for (var c in con);
  return this.checkCondition(c,con[c],url, andFlag);
}

urlMapper.action = function action(action, inUrl, outUrl) {
  if (!action) return;
  for (var k in action) {
    if (k[0]==='$') {
      if (k==='$clear') this.actionClear(action[i],outUrl);
      if (k==='$copy') this.actionCopy(action[k],inUrl,outUrl);
    } else {
      if (!outUrl.hasOwnProperty(k)) outUrl[k] = []; 
      outUrl[k] = outUrl[k].concat(action[k]);
    }
  }
}

urlMapper.actionClear = function actionClear(scope, outUrl) {
  for (var k in outUrl) 
    if(scope===true || scope===k) delete outUrl[k];
}

urlMapper.actionCopy = function actionCopy(scope, inUrl,outUrl) {
  for (var k in inUrl) 
    if (scope===true || scope===k) {
      if (!outUrl[k]) outUrl[k] = [];
      outUrl[k] = outUrl[k].concat(inUrl[k]);
    }
}

urlMapper.map = function map(inUrl) {
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

urlMapper.toString = function toString(url) {
  var result = "";
  var sep = "";
  for (var k in url) {
    result+= sep + k + "=" + url[k].join(',');
    sep = "&";
  }
  return result;
}


/*
var url = 'sa=2,1,4&tn=6,7,3';

urlMapper.mappings.push([{},{$copy:"tn"}]);
urlMapper.mappings.push([{ $and: {sa : ["1","2"]}},{out:["55","53"]}]);

console.log(urlMapper.toString(urlMapper.map(url)));
*/
