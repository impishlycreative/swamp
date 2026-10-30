window.addEventListener('DOMContentLoaded',()=>{
  const STORAGE_KEY='swamp.mindmap.v1';
  const exportDialog=document.getElementById('exportDialog');
  const exportBtn=document.getElementById('exportBtn');
  const mobileExport=document.getElementById('mobileExport');
  const utilitySheet=document.getElementById('utilitySheet');
  const exportJsonBtn=document.getElementById('exportJson');
  const exportWordBtn=document.getElementById('exportWord');
  const exportPdfBtn=document.getElementById('exportPdf');
  const exportCancel=document.getElementById('exportCancel');

  const toast=message=>{
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(el._exportTimer);
    el._exportTimer=setTimeout(()=>el.classList.remove('show'),1500);
  };
  const currentMap=()=>{
    try{
      const map=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      return map?.nodes&&map?.rootId?map:null;
    }catch{return null;}
  };
  const safeName=value=>String(value||'mindmap').replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').trim().slice(0,80)||'mindmap';
  const mapName=map=>map?.nodes?.[map.rootId]?.text||map?.title||'mindmap';
  const openExportDialog=e=>{
    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
    utilitySheet?.classList.remove('open');
    exportDialog?.classList.remove('hidden');
  };
  const closeExportDialog=()=>exportDialog?.classList.add('hidden');

  // Capture these before the older one-format handlers so Export/Save always
  // opens the format chooser instead of immediately downloading JSON.
  exportBtn?.addEventListener('click',openExportDialog,true);
  mobileExport?.addEventListener('click',openExportDialog,true);
  exportCancel?.addEventListener('click',closeExportDialog);
  exportDialog?.addEventListener('pointerdown',e=>{if(e.target===exportDialog)closeExportDialog();});
  exportDialog?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeExportDialog();}});

  async function saveBlob(blob,name,types){
    if(window.showSaveFilePicker){
      try{
        const handle=await window.showSaveFilePicker({suggestedName:name,types});
        const writable=await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast('Saved');
        return true;
      }catch(err){
        if(err?.name==='AbortError')return false;
        console.warn('Save picker failed; falling back',err);
      }
    }
    try{
      const file=new File([blob],name,{type:blob.type||'application/octet-stream'});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:name});
        toast('Shared / saved');
        return true;
      }
    }catch(err){
      if(err?.name==='AbortError')return false;
      console.warn('Share failed; falling back',err);
    }
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    toast('Downloaded');
    return true;
  }

  function childrenOf(map,id){return Object.values(map.nodes).filter(n=>n.parentId===id);}
  function hierarchyRows(map){
    const rows=[];
    const walk=(id,depth)=>{
      const n=map.nodes[id];
      if(!n)return;
      rows.push({text:n.text||'Untitled',description:n.description||'',depth});
      childrenOf(map,id).forEach(child=>walk(child.id,depth+1));
    };
    walk(map.rootId,0);
    return rows;
  }
  function xmlEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
  function wordDocumentXml(map){
    const paras=[];
    hierarchyRows(map).forEach(row=>{
      const style='Heading'+Math.min(6,row.depth+1);
      const left=Math.min(6480,row.depth*360);
      paras.push(`<w:p><w:pPr><w:pStyle w:val="${style}"/><w:ind w:left="${left}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(row.text)}</w:t></w:r></w:p>`);
      if(row.description.trim()){
        const descLeft=Math.min(6840,(row.depth+1)*360);
        paras.push(`<w:p><w:pPr><w:ind w:left="${descLeft}"/><w:spacing w:after="100"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(row.description)}</w:t></w:r></w:p>`);
      }
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>`;
  }
  function wordStylesXml(){
    let headings='';
    for(let i=1;i<=6;i++){
      headings+=`<w:style w:type="paragraph" w:styleId="Heading${i}"><w:name w:val="heading ${i}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="${Math.max(80,260-i*24)}" w:after="70"/><w:outlineLvl w:val="${i-1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${Math.max(22,38-i*3)}"/></w:rPr></w:style>`;
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>${headings}</w:styles>`;
  }
  const CRC_TABLE=(()=>{const table=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;})();
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  const u16=n=>[n&255,(n>>>8)&255];
  const u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  function zipStore(fileMap){
    const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
    for(const [name,content] of Object.entries(fileMap)){
      const nameBytes=enc.encode(name),data=content instanceof Uint8Array?content:enc.encode(content),crc=crc32(data);
      const local=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,...nameBytes,...data]);
      locals.push(local);
      const central=new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...nameBytes]);
      centrals.push(central);offset+=local.length;
    }
    const centralSize=centrals.reduce((sum,item)=>sum+item.length,0);
    const end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(centrals.length),...u16(centrals.length),...u32(centralSize),...u32(offset),0,0]);
    return new Blob([...locals,...centrals,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }

  async function exportJson(){
    const map=currentMap();if(!map){toast('Nothing to export');return;}
    const blob=new Blob([JSON.stringify(map,null,2)],{type:'application/json'});
    closeExportDialog();
    await saveBlob(blob,`${safeName(mapName(map))}.mindmap.json`,[{description:'MindMap data',accept:{'application/json':['.json']}}]);
  }
  async function exportWord(){
    const map=currentMap();if(!map){toast('Nothing to export');return;}
    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      'word/document.xml':wordDocumentXml(map),
      'word/styles.xml':wordStylesXml(),
      'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    };
    closeExportDialog();
    await saveBlob(zipStore(files),`${safeName(mapName(map))}.docx`,[{description:'Word document',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']}}]);
  }
  function exportPdf(){
    const svg=document.getElementById('svg');
    if(!svg){toast('Nothing to export');return;}
    closeExportDialog();
    // Fit the map before printing so PDF output contains the complete visual map.
    document.getElementById('fitBtn')?.click();
    let style=document.getElementById('mindmapPrintStyle');
    if(!style){
      style=document.createElement('style');
      style.id='mindmapPrintStyle';
      style.textContent='@media print{@page{size:landscape;margin:.3in}body{background:#fff!important}body>*{visibility:hidden!important}#app,#workspace,#svg,#svg *{visibility:visible!important}#app{display:block!important;position:static!important}.topbar{display:none!important}#workspace{position:fixed!important;inset:0!important;background:#fff!important}#workspace>.grid,#inspector,#mobileContext,.mini,.toast,.search,.utility-sheet{display:none!important}#svg{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:#fff!important}}';
      document.head.appendChild(style);
    }
    const cleanup=()=>{style?.remove();window.removeEventListener('afterprint',cleanup);};
    window.addEventListener('afterprint',cleanup,{once:true});
    setTimeout(()=>window.print(),60);
    setTimeout(()=>{if(style?.isConnected)cleanup();},30000);
  }

  exportJsonBtn?.addEventListener('click',exportJson);
  exportWordBtn?.addEventListener('click',exportWord);
  exportPdfBtn?.addEventListener('click',exportPdf);
});
