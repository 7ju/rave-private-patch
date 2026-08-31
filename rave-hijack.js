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


// changelog toast - ENGLISH ONLY v1.8
(function(){
  try{
    var v="1.9-mic-fix";
    if(localStorage.getItem('rave_patch_version')!==v){
      localStorage.setItem('rave_patch_version',v);
      setTimeout(function(){
        var d=document.createElement('div');
        d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99999;background:#1a1a1a;border:1px solid #333;color:#fff;padding:14px 18px;border-radius:10px;font-size:13px;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.5);font-family:sans-serif;';
        d.innerHTML='<b>Rave Update '+v+'</b><br><br>- Mic volume hidden (fixed) (Settings > Audio)<br>- All button 5x faster (0.3s) - hold All to select all<br>- Instant updates via GitHub<br><br><span style="color:#888;font-size:11px">Click to dismiss</span>';
        d.onclick=function(){d.remove();};
        document.body.appendChild(d);
        setTimeout(function(){ if(d.parentNode) d.remove(); },9000);
      },1800);
    }
  }catch(e){}
})();

