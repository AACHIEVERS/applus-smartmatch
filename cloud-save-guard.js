(function(){
  "use strict";
  if(typeof window.cloudSaveState!=="function" || window.__smCloudSaveGuard)return;
  var original=window.cloudSaveState;
  var busy=false,pending=false;
  function done(){
    busy=false;
    if(pending){
      pending=false;
      window.cloudSaveState();
    }
  }
  window.cloudSaveState=function(){
    if(busy){pending=true;return;}
    busy=true;
    var result=original.apply(window,arguments);
    if(result && typeof result.then==="function"){
      result.then(done,done);
    }else{
      done();
    }
    return result;
  };
  window.__smCloudSaveGuard=true;
})();