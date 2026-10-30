(()=>{'use strict';
  const root=document.documentElement;
  const context=()=>document.getElementById('mobileContext');
  const floating=()=>document.getElementById('inspector');
  const toast=()=>document.getElementById('toast');

  const dock=()=>{
    const vv=window.visualViewport;
    const top=Math.max(0,vv?.offsetTop||0);
    const visibleHeight=Math.max(0,vv?.height||window.innerHeight||document.documentElement.clientHeight||0);
    const visibleBottom=top+visibleHeight;

    root.style.setProperty('--mobile-vv-top',`${Math.round(top)}px`);
    root.style.setProperty('--mobile-vv-height',`${Math.round(visibleHeight)}px`);
    root.style.setProperty('--mobile-vv-visible-bottom',`${Math.round(visibleBottom)}px`);

    const bar=context();
    if(bar&&!bar.classList.contains('hidden')){
      const h=Math.max(54,Math.ceil(bar.getBoundingClientRect().height||0));
      const y=Math.max(top,visibleBottom-h);
      bar.style.setProperty('top',`${Math.round(y)}px`,'important');
      bar.style.setProperty('bottom','auto','important');
    }

    const sheet=floating();
    if(sheet?.classList.contains('mobile-open')){
      const h=Math.ceil(sheet.getBoundingClientRect().height||0);
      if(h){
        const y=Math.max(top+8,visibleBottom-h-8);
        sheet.style.setProperty('top',`${Math.round(y)}px`,'important');
        sheet.style.setProperty('bottom','auto','important');
      }
    }

    const t=toast();
    if(t){
      const barHeight=bar&&!bar.classList.contains('hidden')?Math.max(54,Math.ceil(bar.getBoundingClientRect().height||0)):0;
      t.style.setProperty('bottom','auto','important');
      t.style.setProperty('top',`${Math.max(top+8,visibleBottom-barHeight-54)}px`,'important');
    }
  };

  const style=document.createElement('style');
  style.id='mobileVisualViewportDocking';
  style.textContent=`
    @media(max-width:850px),(hover:none) and (pointer:coarse){
      .topbar{top:var(--mobile-vv-top,0px)!important;}
      .mobile-context{bottom:auto!important;}
      .floating.mobile-open{bottom:auto!important;}
    }
  `;
  document.head.appendChild(style);

  let frame=0;
  const schedule=()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      dock();
      setTimeout(dock,40);
    });
  };

  schedule();
  window.addEventListener('load',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,80),{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('pointerdown',schedule,{passive:true});
  document.addEventListener('touchend',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});
})();
