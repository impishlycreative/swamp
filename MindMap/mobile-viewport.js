(()=>{'use strict';
  const root=document.documentElement;
  const update=()=>{
    const vv=window.visualViewport;
    if(!vv){
      root.style.setProperty('--mobile-vv-top','0px');
      root.style.setProperty('--mobile-vv-bottom','0px');
      return;
    }
    const top=Math.max(0,vv.offsetTop||0);
    const bottom=Math.max(0,window.innerHeight-(vv.height+top));
    root.style.setProperty('--mobile-vv-top',`${Math.round(top)}px`);
    root.style.setProperty('--mobile-vv-bottom',`${Math.round(bottom)}px`);
  };

  const style=document.createElement('style');
  style.id='mobileVisualViewportDocking';
  style.textContent=`
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      .topbar{top:var(--mobile-vv-top,0px)!important;}
      .mobile-context{bottom:var(--mobile-vv-bottom,0px)!important;}
      .floating{bottom:calc(var(--mobile-vv-bottom,0px) + 8px + env(safe-area-inset-bottom))!important;}
      .toast{bottom:calc(var(--mobile-vv-bottom,0px) + 76px + env(safe-area-inset-bottom))!important;}
    }
  `;
  document.head.appendChild(style);

  update();
  window.addEventListener('resize',update,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(update,50),{passive:true});
  window.visualViewport?.addEventListener('resize',update,{passive:true});
  window.visualViewport?.addEventListener('scroll',update,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(update,0);});
})();
