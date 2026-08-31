// recents-hijack SUPERFAST - 5x faster
// recents-hijack FAST - تسريع 3x بدون انتظار
// recents-hijack superfast - يخطف زر All الأصلي، يشيل الكلام الفوق، ويصلح التحديد
(function(){
  var busy=false;
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
  var getState=function(){try{return window.__raveStore&&window.__raveStore.getState&&window.__raveStore.getState();}catch(e){return null;}};
  // strong meshId resolver - searches multiple locations
  var resolveMeshId=function(){
    try{
      var st=getState();
      if(st){
        if(st.invites && st.invites.meshId) return st.invites.meshId;
        if(st.invites && st.invites.currentMeshId) return st.invites.currentMeshId;
        if(st.mesh && st.mesh.currentMeshId) return st.mesh.currentMeshId;
        if(st.app && st.app.meshId) return st.app.meshId;
        if(st.router && st.router.location && st.router.location.pathname){
          var mm=st.router.location.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if(mm) return mm[0];
        }
      }
    }catch(e){}
    try{
      var href=location.href;
      var mh=href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if(mh) return mh[0];
      var el=document.querySelector('[data-mesh-id]'); if(el) return el.getAttribute('data-mesh-id');
          // light fallback: search invites only
      try{
        var st2=getState();
        if(st2 && st2.invites){
          var s=JSON.stringify(st2.invites);
          var mm2=s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if(mm2) return mm2[0];
        }
      }catch(e2){}
      // last resort: any UUID on page
      var allH=document.documentElement.outerHTML;
      var mm3=allH.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if(mm3) return mm3[0];
    }catch(e){}
    return null;
  };
  // get selected from meshInvites[mid]
  var getSelected=function(){
    try{
      var st=getState(); if(!st) return [];
      var mid=resolveMeshId();
      if(mid && st.invites && st.invites.meshInvites && st.invites.meshInvites[mid]){
        var inv=st.invites.meshInvites[mid];
        if(inv.selectedUsersList) return inv.selectedUsersList;
        if(inv.selectedUsers) return inv.selectedUsers;
      }
      // fallback قديم
      if(st.invites && st.invites.selectedUsersList) return st.invites.selectedUsersList;
      if(st.invites && st.invites.selectedUsers) return st.invites.selectedUsers;
      return [];
    }catch(e){return [];}
  };
  var getPanel=function(){return document.querySelector('.DMThreads__dm-threads-container')||document.querySelector('[class*="DMThreads"]');};
  var getScroller=function(){
    var p=getPanel(); if(!p) return null;
    var sc=p.querySelector('[data-virtuoso-scroller]'); if(sc) return sc;
    var cands=p.querySelectorAll('div');
    for(var i=0;i<Math.min(cands.length,300);i++){ var el=cands[i]; if(el.scrollHeight>el.clientHeight+40) return el; }
    return p;
  };
  var getExistingAllBtn=function(){
    try{
      var panel=getPanel();
      if(panel){
        var btns=panel.querySelectorAll('button');
        for(var i=0;i<btns.length;i++){
          var b=btns[i]; var t=(b.textContent||'').trim();
          if(t==='All' || t==='None' || t.startsWith('All ') || t.startsWith('All(')) return b;
          if(b.querySelector && (b.innerText||'').trim()==='All') return b;
        }
        var allEls=panel.querySelectorAll('*');
        for(var j=0;j<Math.min(allEls.length,500);j++){
          var el=allEls[j];
          if(el.tagName==='BUTTON' || el.getAttribute('role')==='button'){
            var tt=(el.textContent||'').trim();
            if(tt==='All') return el;
          }
        }
      }
      var btns2=document.querySelectorAll('button');
      for(var k=0;k<btns2.length;k++){
        var txt=(btns2[k].textContent||'').trim();
        if(txt==='All') return btns2[k];
      }
    }catch(e){}
    return null;
  };
  // sync without header info - removes #recents-all-info
  var syncTimer=null; var lastSync=0;
  var syncNow=function(){
    try{
      // remove old info if exists from previous patch
      var oldInfo=document.getElementById('recents-all-info');
      if(oldInfo) oldInfo.remove();
      // remove any recents • selected element from old patch
      try{
        var panel=getPanel();
        if(panel){
          var infos=panel.querySelectorAll('div');
          for(var i=0;i<infos.length;i++){
            var d=infos[i];
            if(d.id!=='recents-all-info' && d.textContent && d.textContent.includes('recents') && d.textContent.includes('selected')){
                      // ensure small element
              if(d.textContent.length<80) d.remove();
            }
          }
        }
      }catch(e){}
      // لا نغير نص الزر إلا إذا مو busy
      if(!busy){
        var st=getState();
        var recents=(st&&st.userSearch&&st.userSearch.recents)||[];
        var sel=getSelected();
        var ab=getExistingAllBtn();
        if(ab){
          if(sel.length>0 && sel.length>=recents.length && recents.length>0){
            if(ab.textContent.trim()==='All') ab.textContent='None';
          } else {
            if(ab.textContent.trim()==='None') ab.textContent='All';
          }
        }
      }
    }catch(e){}
  };
  var sync=function(){
    var now=Date.now();
    if(now-lastSync<500){ if(syncTimer) return; syncTimer=setTimeout(function(){syncTimer=null; lastSync=Date.now(); syncNow();},500); return; }
    lastSync=now; syncNow();
  };

  window.__raveRecentsLoader=null;
  var hookDispatch=function(){
    try{
      if(!window.__raveStore||!window.__raveStore.dispatch) return false;
      if(window.__raveStore.dispatch.__raveHooked) return true;
      var orig=window.__raveStore.dispatch;
      var wrapped=function(action){
        try{
          if(typeof action==='function'){
            var s=action.toString();
            if(s.includes('getRecents')) window.__raveRecentsLoader=action;
          }
        }catch(e){}
        return orig.apply(this, arguments);
      };
      wrapped.__raveHooked=true;
      window.__raveStore.dispatch=wrapped;
      return true;
    }catch(e){return false;}
  };
    var findPopUpCandidatesViaWebpack=function(){
    var out=[];
    try{
      var chunk=window.webpackChunkrave_desktop||self.webpackChunkrave_desktop;
      if(chunk && chunk.push){
        var req=null; try{ chunk.push([['probe-pop2-'+Date.now()],{},function(r){req=r;}]); }catch(e){}
        if(req){
          var c = req.c || req.cache;
          if(c){
            for(var id in c){
              try{
                var mod=c[id]; if(!mod||!mod.exports) continue;
                var ex=mod.exports;
                function isPopUpCandidate(o){
                  return o && typeof o==='object' && 'Fq' in o && 'Ay' in o && o.Fq && o.Ay && o.Ay.actions && o.Ay.actions.createPopUp;
                }
                if(isPopUpCandidate(ex)) out.push(ex);
                if(ex && ex.default && isPopUpCandidate(ex.default)) out.push(ex.default);
                for(var k in ex){
                  var v=ex[k];
                  if(v && typeof v==='object' && isPopUpCandidate(v)) out.push(v);
                  if(v && v.default && isPopUpCandidate(v.default)) out.push(v.default);
                }
              }catch(e2){}
            }
          }
        }
      }
    }catch(e){}
    return out;
  };
  var findPopUpModuleViaWebpack=function(){
    var cands=findPopUpCandidatesViaWebpack();
    if(cands.length) return cands[0];
    return null;
  };
  var showNativeChangelog=function(content){
    try{
      if(window.__raveStore && window.__raveStore.dispatch){
        // direct dispatch like handleSelfKick but with popUpType "Message" (string) - proven to work via manual test
        try{
          window.__raveStore.dispatch({type:'popUp/createPopUp', payload:{content: content, popUpType: 'Message'}});
          console.log('[rave] native direct popUp/createPopUp Message');
          return true;
        }catch(e1){ console.log('[rave] direct Message string failed', e1 && e1.message); }
        try{
          window.__raveStore.dispatch({type:'popUp/createPopUp', payload:{content: content, popUpType: 1}});
          console.log('[rave] native direct popUpType 1');
          return true;
        }catch(e2){}
        // fallback try via webpack candidate if available
        var cands = window.__ravePopUpCandidates || (typeof findPopUpCandidatesViaWebpack==='function' ? findPopUpCandidatesViaWebpack() : []);
        for(var idx=0; idx<cands.length; idx++){
          try{
            var mod=cands[idx];
            var act = mod.Ay.actions.createPopUp({content: content, popUpType: mod.Fq.Message});
            window.__raveStore.dispatch(act);
            console.log('[rave] native via candidate '+idx);
            return true;
          }catch(e){}
        }
      } else {
        console.log('[rave] native not ready store');
      }
    }catch(e){ console.log('[rave] native failed', e && e.message); }
    return false;
  };
var findLoaderViaWebpack=function(){
    try{
      var chunk=window.webpackChunkrave_desktop||self.webpackChunkrave_desktop;
      if(chunk && chunk.push){
        var req=null; try{ chunk.push([['probe-'+Date.now()],{},function(r){req=r;}]); }catch(e){}
        if(req){
          var cache=req.c||req.cache;
          if(cache){
            for(var id in cache){
              var mod=cache[id]; if(!mod||!mod.exports) continue;
              var ex=mod.exports;
              for(var k in ex){
                var v=ex[k];
                if(typeof v==='function'){ try{ var s=v.toString(); if(s.includes('getRecents')&&s.includes('setRecents')) return v; }catch(e){} }
              }
            }
          }
        }
      }
    }catch(e){}
    return null;
  };
  var loadAllRecents=function(){
    return new Promise(async function(resolve){
      try{
        if(window.__raveStore) hookDispatch();
        if(!window.__raveRecentsLoader){ var f=findLoaderViaWebpack(); if(f) window.__raveRecentsLoader=f; }
        var attempts=0, maxAttempts=18, noProgress=0;
        while(attempts++<maxAttempts){
          var st=getState(); if(!st||!st.userSearch) break;
          var cursor=st.userSearch.recentsCursor;
          if(cursor==='end') break;
          var before=(st.userSearch.recents||[]).length;
          var dispatched=false;
          if(window.__raveRecentsLoader){
            try{ var res=window.__raveStore.dispatch(window.__raveRecentsLoader); if(res && typeof res.then==='function') await res; dispatched=true; }catch(e){}
          }
          if(!dispatched){
            var sc=getScroller(); if(sc){ sc.scrollTop=sc.scrollHeight; sc.dispatchEvent(new Event('scroll',{bubbles:true})); }
          }
          await sleep(150);
          var after=(getState().userSearch.recents||[]).length;
          if(after===before){ noProgress++; if(noProgress>=3) break; } else noProgress=0;
          if(after>3000) break;
        }
        resolve();
      }catch(e){ resolve(); }
    });
  };
  var selectAll=function(){
    return new Promise(async function(resolve){
      try{
        if(busy){resolve(); return;}
        busy=true;
        var btn=getExistingAllBtn(); var origText=btn?btn.textContent:'All';
        if(btn) btn.textContent='Loading…';
        console.log('[rave-native] selectAll start mid='+resolveMeshId()+' recents='+(getState().userSearch.recents||[]).length);
        await loadAllRecents();
        var st=getState(); var recents=(st&&st.userSearch&&st.userSearch.recents)||[];
        var sel=getSelected(); var selSet=new Set(sel.map(String));
          // IDs may be numbers or strings - normalize
        var toSelect=recents.filter(function(id){return !selSet.has(String(id));});
        console.log('[rave-native] toSelect '+toSelect.length+'/'+recents.length+' selBefore '+sel.length);
        if(toSelect.length===0){ busy=false; if(btn) btn.textContent='All'; syncNow(); resolve(); return; }
        var meshId=resolveMeshId();
        console.log('[rave-native] meshId '+meshId);
        if(!meshId){ console.error('[rave-native] no meshId - cannot select'); busy=false; if(btn) btn.textContent=origText; alert('meshId not found - open Rave from mesh link'); resolve(); return; }
        if(btn) btn.textContent='Selecting… ('+toSelect.length+')';
        try{
          window.__raveStore.dispatch({type:'invites/toggleSelectedUsers', payload:{meshId:meshId, users:toSelect, toggle:true}});
          await sleep(40);
          var after=getSelected().length;
          console.log('[rave-native] after single '+after+' expected '+recents.length);
          if(after < recents.length){
            var bs=90;
            for(var i=0;i<toSelect.length;i+=bs){
              window.__raveStore.dispatch({type:'invites/toggleSelectedUsers', payload:{meshId:meshId, users:toSelect.slice(i,i+bs), toggle:true}});
              await sleep(30);
            }
          }
          await sleep(40);
          console.log('[rave-native] final selected '+getSelected().length);
        }catch(e){
          console.error('[rave-native] dispatch err',e);
          var bs2=90;
          for(var ii=0;ii<toSelect.length;ii+=bs2){
            try{ window.__raveStore.dispatch({type:'invites/toggleSelectedUsers', payload:{meshId:meshId, users:toSelect.slice(ii,ii+bs2), toggle:true}});}catch(ee){}
            await sleep(30);
          }
        }
        busy=false; if(btn) btn.textContent='All'; syncNow(); resolve();
      }catch(e){ console.error(e); busy=false; var b=getExistingAllBtn(); if(b) b.textContent='All'; syncNow(); resolve(); }
    });
  };
  var selectNone=function(){
    try{
      var sel=getSelected(); if(sel.length===0) return;
      var meshId=resolveMeshId(); if(!meshId) return;
      var btn=getExistingAllBtn(); if(btn) btn.textContent='Clearing…';
      window.__raveStore.dispatch({type:'invites/toggleSelectedUsers', payload:{meshId:meshId, users:sel, toggle:false}});
      setTimeout(function(){ var nb=getExistingAllBtn(); if(nb) nb.textContent='All'; syncNow(); },150);
    }catch(e){}
  };
  var hijackAllBtn=function(){
    try{
      var old=document.getElementById('recents-all-btn');
      if(old) old.remove();
      // remove old info
      var oi=document.getElementById('recents-all-info'); if(oi) oi.remove();
      var btn=getExistingAllBtn();
      if(!btn) return false;
      if(btn.__raveHijacked) return true;
      btn.__raveHijacked=true;
      btn.addEventListener('click', function(e){
        try{
          e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
          if(busy) return;
          var st=getState(); var recents=(st&&st.userSearch&&st.userSearch.recents)||[]; var sel=getSelected();
          if(sel.length>=recents.length && recents.length>0) selectNone();
          else selectAll();
        }catch(err){ console.error(err); }
      }, true);
      try{
        var fk=Object.keys(btn).find(function(k){return k.startsWith('__reactFiber')||k.startsWith('__reactProps');});
        if(fk){
          var fiber=btn[fk]; var props=fiber && (fiber.memoizedProps||fiber.pendingProps);
          if(props && typeof props.onClick==='function'){
            props.onClick=function(e){
              e.preventDefault(); e.stopPropagation();
              if(busy) return;
              var s=getState(); var r=(s&&s.userSearch&&s.userSearch.recents)||[]; var sl=getSelected();
              if(sl.length>=r.length && r.length>0) selectNone(); else selectAll();
            };
          }
        }
      }catch(e){}
      console.log('[rave-native] hijacked original All btn v2');
      return true;
    }catch(e){ console.error(e); return false; }
  };
  var boot=function(){
    try{
      console.log('[rave-native] boot hijack superfast');
      var attempts=0;
      var timer=setInterval(function(){
        attempts++;
        if(window.__raveStore && window.__raveStore.getState){
          clearInterval(timer);
          hookDispatch(); setTimeout(hookDispatch,1200);
          var hijackAttempts=0;
          var hijackTimer=setInterval(function(){
            hijackAttempts++;
            var ok=hijackAllBtn();
            if(ok || hijackAttempts>20) clearInterval(hijackTimer);
            sync();
          },800);
          try{
            var obs=new MutationObserver(function(muts){
              var need=false;
              for(var i=0;i<muts.length;i++) if(muts[i].addedNodes && muts[i].addedNodes.length){ need=true; break; }
              if(need){ hijackAllBtn(); sync(); }
            });
            obs.observe(document.body,{childList:true, subtree:false});
            setTimeout(function(){ var p=getPanel(); if(p) try{ obs.observe(p,{childList:true, subtree:false}); }catch(e){} },2500);
          }catch(e){}
          setInterval(function(){ hijackAllBtn(); sync(); },1400);
          syncNow();
        } else if(attempts>50) clearInterval(timer);
      },600);
    }catch(e){}
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  console.log('[rave-native] recents hijack superfast loaded');
})();

// SAFE Mic volume hide - ENGLISH - robust case-insensitive
(function(){
  function hideMic(){
    try{
      // Strategy 1: find any element whose text is exactly "mic volume" case-insensitive
      var all=document.querySelectorAll('label, span, div, p');
      for(var i=0;i<all.length;i++){
        var el=all[i];
        var txt=(el.textContent||'').trim();
        // only leaf-ish elements to avoid hiding whole page (length check)
        if(txt.length>30) continue;
        if(txt.toLowerCase()==='mic volume' || txt.toLowerCase()==='mic-volume'){
          // walk up to find row that contains slider or is the setting row
          var cur=el;
          for(var d=0;d<4;d++){
            if(!cur) break;
            // if this container has a range input, hide it
            if(cur.querySelector && cur.querySelector('input[type="range"]')){
              cur.style.display='none';
              break;
            }
            // also hide direct parent if it's the row
            if(cur.parentElement && cur.parentElement.children.length<=4){
              // try parent
            }
            cur=cur.parentElement;
          }
          // fallback: hide the element's closest div row
          try{
            var row=el.closest('div');
            if(row) {
              var p=row.parentElement;
              if(p){
                // hide row or its parent if small
                if(row.querySelector('input[type="range"]')) row.style.display='none';
                else if(p.querySelector('input[type="range"]')) p.style.display='none';
                else el.style.display='none';
              }
            }
          }catch(e2){}
        }
      }
      // Strategy 2: hide any range whose nearby label is mic volume
      var ranges=document.querySelectorAll('input[type="range"]');
      for(var j=0;j<ranges.length;j++){
        var aria=(ranges[j].getAttribute('aria-label')||'').toLowerCase();
        var found=false;
        if(aria.includes('mic')) found=true;
        // check sibling text
        if(!found){
          var container=ranges[j].closest('div');
          if(container && container.textContent && container.textContent.toLowerCase().includes('mic volume')){
            found=true;
          } else {
            var parent2=ranges[j].parentElement;
            if(parent2 && parent2.parentElement && parent2.parentElement.textContent.toLowerCase().includes('mic volume')) found=true;
          }
        }
        if(found){
          var pr=ranges[j].closest('div');
          if(pr){
            // walk up 2 levels to hide full row
            var hideEl=pr;
            for(var k=0;k<3;k++){
              if(hideEl.parentElement && hideEl.parentElement.textContent.toLowerCase().includes('mic volume') && hideEl.parentElement.children.length<6){
                hideEl=hideEl.parentElement;
              } else break;
            }
            hideEl.style.display='none';
          }
        }
      }
    }catch(e){}
  }
  setTimeout(hideMic, 600);
  setTimeout(hideMic, 1500);
  setTimeout(hideMic, 3000);
  setInterval(function(){
    try{
      if(document.body.textContent.toLowerCase().includes('mic volume')) hideMic();
    }catch(e){}
  }, 1800);
  try{
    var obs=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var n=muts[i].addedNodes;
        if(n && n.length){
          for(var k=0;k<n.length;k++){
            var nd=n[k];
            if(nd.textContent && nd.textContent.toLowerCase().includes('mic volume')){ hideMic(); setTimeout(hideMic,200); break; }
          }
        }
      }
    });
    obs.observe(document.body,{childList:true, subtree:false});
    setTimeout(function(){
      try{ obs.observe(document.body,{childList:true, subtree:true}); }catch(e){}
    }, 2000);
  }catch(e){}
  // also trigger when Settings/Audio tab clicked
  document.addEventListener('click', function(e){
    var t=(e.target.textContent||'').toLowerCase();
    if(t.includes('audio') || t.includes('sound') || t.includes('settings')){
      setTimeout(hideMic, 400);
      setTimeout(hideMic, 1200);
    }
  }, true);
})();



// AUTO MAXIMIZE ON START - ENGLISH - make window fullscreen/maximized
(function(){
  function doMaximize(){
    try{
      // Try Electron IPC via various exposures
      try{ if(window.require){ var e=window.require('electron'); if(e && e.ipcRenderer) { e.ipcRenderer.invoke('window-setMaximize', true); console.log('[rave] maximize via ipcRenderer'); return; } } }catch(e2){}
      try{ if(window.electron && window.electron.ipcRenderer) { window.electron.ipcRenderer.invoke('window-setMaximize', true); console.log('[rave] maximize via window.electron'); return; } }catch(e2){}
      try{ if(window.ipcRenderer) { window.ipcRenderer.invoke('window-setMaximize', true); console.log('[rave] maximize via window.ipcRenderer'); return; } }catch(e2){}
      // Try via preload exposed API
      try{ if(window.api && window.api.invoke) { window.api.invoke('window-setMaximize', true); } }catch(e2){}
      // Fallback: window maximize via JS (not ideal but tries)
      try{ window.moveTo(0,0); window.resizeTo(screen.availWidth, screen.availHeight); }catch(e2){}
    }catch(e){}
  }
  // run after app loads
  setTimeout(doMaximize, 1200);
  setTimeout(doMaximize, 3000);
  // also try on visibility
  try{ document.addEventListener('visibilitychange', function(){ if(!document.hidden) doMaximize(); }); }catch(e){}
})();

// changelog toast - ENGLISH ONLY v1.8
(function(){
  try{
    var v="2.18-maximized-blur";
    if(localStorage.getItem('rave_patch_version')!==v){
      localStorage.setItem('rave_patch_version',v);
      // wait until app fully loaded then show native center popup (same as kick) - stays until OK
      var _pollAttempts=0;
      var _pollTimer=setInterval(function(){
        _pollAttempts++;
        var storeReady = !!(window.__raveStore && window.__raveStore.dispatch);
        var appLoaded = document.readyState==='complete' && document.body.children.length>1;
        var ready = storeReady && appLoaded;
        // also wait at least 3.5s total so splash/loader finishes
        var minWait = _pollAttempts>=7; // 7*500 = 3500ms
        if((ready && minWait) || _pollAttempts>30){
          clearInterval(_pollTimer);
          // extra 1s so UI settles
          setTimeout(function(){
            var content = 'Rave Update '+v+String.fromCharCode(10)+String.fromCharCode(10)+ (typeof changelogText!=='undefined'?changelogText:'- All button 5x faster (0.3s) - hold All to select all'+String.fromCharCode(10)+'- Instant updates via GitHub');
            var nativeOk = false;
            try{ nativeOk = showNativeChangelog(content); }catch(e){ console.log('[rave] native err',e); }
            console.log('[rave] changelog v='+v+' nativeOk='+nativeOk+' polled '+_pollAttempts);
            setTimeout(function(){
              var hasNative = false;
              try{
                var all = document.querySelectorAll('*');
                for(var i=0;i<all.length;i++){ var el=all[i]; if(el.textContent&&el.textContent.indexOf('Rave Update')!==-1 && el.offsetParent!==null){ hasNative=true; break; } }
              }catch(e){}
              if(!nativeOk || !hasNative){
                if(document.getElementById('rave-fallback-changelog') || document.getElementById('rave-fallback-overlay')) return;
                // overlay with blur covering whole screen like kick
                var overlay=document.createElement('div');
                overlay.id='rave-fallback-overlay';
                overlay.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.4);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);';
                var d=document.createElement('div');
                d.id='rave-fallback-changelog';
                d.className='PopUp__popup-container__zpbry PopUp__popup-appearance__LM1tD';
                d.style.zIndex='99999';
                d.style.backdropFilter='blur(30px)';
                d.style.webkitBackdropFilter='blur(30px)';
                d.innerHTML='<div class="PopUp__popup-text__U_oit">'+ content.split(String.fromCharCode(10)).join('<br>') +'</div><div class="PopUp__popup-button__kKcZA">OK</div>';
                var closeBoth=function(){ try{ d.remove(); }catch(e){} try{ overlay.remove(); }catch(e){} document.removeEventListener('keydown', esc); };
                var esc=function(ev){ if(ev.key==='Escape') closeBoth(); };
                document.addEventListener('keydown', esc);
                setTimeout(function(){
                  var btn=d.querySelector('.PopUp__popup-button__kKcZA');
                  if(btn) btn.onclick=closeBoth;
                  // do NOT close on overlay click - only OK / Escape per user request
                },10);
                document.body.appendChild(overlay);
                document.body.appendChild(d);
                console.log('[rave] fallback changelog shown (persistent until OK, with blur overlay)');
              }
            }, 800);
          }, 1000);
        }
      }, 500);
    }
  }catch(e){}
})();

// CHAT PASTE FIX - keep chat bar focused for spam - ENGLISH
(function(){
  function getChatInput(){
    try{
      var el=document.querySelector('div[contenteditable="true"][role="textbox"]');
      if(el) return el;
      var all=document.querySelectorAll('div[contenteditable="true"]');
      // pick the one inside chat area (closest to bottom)
      if(all.length){
        // prefer last visible one
        for(var i=all.length-1;i>=0;i--){
          var c=all[i];
          if(c.offsetParent!==null && c.clientHeight>20) return c;
        }
        return all[all.length-1];
      }
      el=document.querySelector('textarea[placeholder]');
      if(el) return el;
      el=document.querySelector('input[placeholder*="message" i]');
      if(el) return el;
    }catch(e){}
    return null;
  }
  function focusChat(){
    try{
      var inp=getChatInput();
      if(!inp) return;
      inp.focus();
      // move cursor to end if contenteditable
      if(inp.isContentEditable){
        var sel=window.getSelection();
        if(sel){
          var range=document.createRange();
          range.selectNodeContents(inp);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }catch(e){}
  }
  // after Enter (send), refocus quickly
  document.addEventListener('keydown', function(e){
    if(e.key==='Enter' && !e.shiftKey){
      setTimeout(focusChat, 60);
      setTimeout(focusChat, 250);
      setTimeout(focusChat, 600);
    }
    // Global Ctrl+V: if focus not in input, redirect paste to chat bar
    if(e.ctrlKey && e.key.toLowerCase()==='v'){
      var ae=document.activeElement;
      var isInput = ae && (ae.tagName==='INPUT' || ae.tagName==='TEXTAREA' || ae.isContentEditable);
      if(!isInput){
        var chat=getChatInput();
        if(chat && chat.offsetParent!==null){
          e.preventDefault();
          chat.focus();
          // try clipboard read and insert
          try{
            if(navigator.clipboard && navigator.clipboard.readText){
              navigator.clipboard.readText().then(function(t){
                if(t){
                  if(chat.isContentEditable){
                    document.execCommand('insertText', false, t);
                  } else {
                    var start=chat.selectionStart||chat.value.length;
                    var end=chat.selectionEnd||start;
                    chat.value = chat.value.slice(0,start)+t+chat.value.slice(end);
                    chat.selectionStart=chat.selectionEnd=start+t.length;
                    chat.dispatchEvent(new Event('input',{bubbles:true}));
                  }
                  // keep focused for next paste
                  setTimeout(focusChat, 30);
                }
              }).catch(function(){ setTimeout(focusChat, 30); });
            } else {
              setTimeout(focusChat, 30);
            }
          }catch(err){ setTimeout(focusChat, 30); }
        }
      }
    }
  }, true);
  // also refocus when clicking anywhere in chat except search
  document.addEventListener('click', function(e){
    var ae=document.activeElement;
    if(ae && ae.tagName==='INPUT' && ae.placeholder && ae.placeholder.toLowerCase().includes('search')) return;
    // don't steal if selecting text in messages
  }, true);
  console.log('[rave] chat paste fix loaded');
})();

