(()=>{'use strict';
window.addEventListener('DOMContentLoaded',()=>{
  const exportWordBtn=document.getElementById('exportWord');
  if(!exportWordBtn)return;

  const toast=message=>{
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(el._wordExportTimer);
    el._wordExportTimer=setTimeout(()=>el.classList.remove('show'),1500);
  };
  const safeName=value=>String(value||'mindmap').replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').trim().slice(0,80)||'mindmap';
  const mapName=map=>map?.nodes?.[map.rootId]?.text||map?.title||'mindmap';
  const childrenOf=(map,id)=>Object.values(map?.nodes||{}).filter(n=>n.parentId===id);
  const DETAIL_LABELS={
    traits:'Traits',abilities:'Abilities',goals:'Goals',backstory:'Backstory',relationships:'Relationships',secrets:'Secrets',other:'Other',
    events:'Events',conflict:'Conflict',characters:'Characters',setting:'Setting',outcome:'Outcome',purpose:'Purpose',questions:'Questions',
    details:'Details',history:'History',dangers:'Dangers',uses:'Story use',discovery:'Discovery',meaning:'Meaning',misdirection:'Misdirection',
    payoff:'Payoff',truth:'Truth',who_knows:'Who knows',consequences:'Consequences',plant:'What is planted',promise:'Promise',
    result:'Result',reveal:'Reveal',connections:'Connections',problems:'Problems',facts:'Facts',sources:'Sources',ideas:'Ideas',setup:'Setup'
  };
  const detailLabel=key=>DETAIL_LABELS[key]||String(key||'Details').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
  const detailsOf=node=>{
    const details=node?.writer?.details;
    if(!details||typeof details!=='object'||Array.isArray(details))return[];
    return Object.entries(details).map(([key,items])=>({
      label:detailLabel(key),
      items:(Array.isArray(items)?items:[]).map(item=>({
        text:String(item?.text||'').trim(),
        description:String(item?.description||'').trim()
      })).filter(item=>item.text||item.description)
    })).filter(group=>group.items.length);
  };

  function hierarchyRows(map,project){
    const rows=[];
    const sessions=project?.sessions||project?.maps||{};

    const walk=(currentMap,id,depth,path)=>{
      const node=currentMap?.nodes?.[id];
      if(!node)return;
      const key=`${currentMap.id||'map'}:${id}`;
      if(path.has(key))return;

      const nextPath=new Set(path);
      nextPath.add(key);
      rows.push({text:node.text||'Untitled',description:node.description||'',details:detailsOf(node),depth});

      childrenOf(currentMap,id).forEach(child=>walk(currentMap,child.id,depth+1,nextPath));

      if(node.targetMapId){
        const linked=sessions[node.targetMapId];
        const linkedRoot=linked?.nodes?.[linked.rootId];
        const linkedRootKey=linkedRoot?`${linked.id||node.targetMapId}:${linked.rootId}`:null;
        if(linkedRoot&&linkedRootKey&&!nextPath.has(linkedRootKey)){
          const linkedPath=new Set(nextPath);
          linkedPath.add(linkedRootKey);
          childrenOf(linked,linked.rootId).forEach(child=>walk(linked,child.id,depth+1,linkedPath));
        }
      }
    };

    walk(map,map.rootId,0,new Set());
    return rows;
  }

  function xmlEsc(value){
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  }

  function appendDetails(paras,row){
    if(!row.details?.length)return;
    const baseLeft=Math.min(6840,(row.depth+1)*360);
    paras.push(`<w:p><w:pPr><w:ind w:left="${baseLeft}"/><w:spacing w:before="80" w:after="40"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Details</w:t></w:r></w:p>`);
    row.details.forEach(group=>{
      const groupLeft=Math.min(7200,(row.depth+2)*360);
      paras.push(`<w:p><w:pPr><w:ind w:left="${groupLeft}"/><w:spacing w:before="50" w:after="20"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xmlEsc(group.label)}</w:t></w:r></w:p>`);
      group.items.forEach(item=>{
        const itemLeft=Math.min(7560,(row.depth+3)*360);
        const text=item.text||item.description;
        paras.push(`<w:p><w:pPr><w:ind w:left="${itemLeft}"/><w:spacing w:after="20"/></w:pPr><w:r><w:t xml:space="preserve">• ${xmlEsc(text)}</w:t></w:r></w:p>`);
        if(item.text&&item.description){
          const noteLeft=Math.min(7920,(row.depth+4)*360);
          paras.push(`<w:p><w:pPr><w:ind w:left="${noteLeft}"/><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${xmlEsc(item.description)}</w:t></w:r></w:p>`);
        }
      });
    });
  }

  function wordDocumentXml(map,project){
    const paras=[];
    hierarchyRows(map,project).forEach(row=>{
      const style='Heading'+Math.min(6,row.depth+1);
      const left=Math.min(6480,row.depth*360);
      paras.push(`<w:p><w:pPr><w:pStyle w:val="${style}"/><w:ind w:left="${left}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(row.text)}</w:t></w:r></w:p>`);
      if(row.description.trim()){
        const descLeft=Math.min(6840,(row.depth+1)*360);
        paras.push(`<w:p><w:pPr><w:ind w:left="${descLeft}"/><w:spacing w:after="100"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(row.description)}</w:t></w:r></w:p>`);
      }
      appendDetails(paras,row);
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.join('')}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>`;
  }

  function wordStylesXml(){
    let headings='';
    for(let i=1;i<=6;i++)headings+=`<w:style w:type="paragraph" w:styleId="Heading${i}"><w:name w:val="heading ${i}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="${Math.max(80,260-i*24)}" w:after="70"/><w:outlineLvl w:val="${i-1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${Math.max(22,38-i*3)}"/></w:rPr></w:style>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:sz w:val="22"/></w:rPr></w:style>${headings}</w:styles>`;
  }

  const CRC_TABLE=(()=>{
    const table=[];
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
      table[n]=c>>>0;
    }
    return table;
  })();
  function crc32(bytes){
    let c=0xffffffff;
    for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);
    return(c^0xffffffff)>>>0;
  }
  const u16=n=>[n&255,(n>>>8)&255];
  const u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  function zipStore(fileMap){
    const enc=new TextEncoder(),locals=[],centrals=[];
    let offset=0;
    for(const [name,content] of Object.entries(fileMap)){
      const nameBytes=enc.encode(name);
      const data=content instanceof Uint8Array?content:enc.encode(content);
      const crc=crc32(data);
      const local=new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,...nameBytes,...data]);
      locals.push(local);
      const central=new Uint8Array([80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...nameBytes]);
      centrals.push(central);
      offset+=local.length;
    }
    const centralSize=centrals.reduce((sum,item)=>sum+item.length,0);
    const end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(centrals.length),...u16(centrals.length),...u32(centralSize),...u32(offset),0,0]);
    return new Blob([...locals,...centrals,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }

  async function saveBlob(blob,name){
    if(window.showSaveFilePicker){
      try{
        const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:'Word document',accept:{'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']}}]});
        const writable=await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast('Saved');
        return;
      }catch(err){
        if(err?.name==='AbortError')return;
        console.warn('Save picker failed; falling back',err);
      }
    }
    try{
      const file=new File([blob],name,{type:blob.type});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:name});
        toast('Shared / saved');
        return;
      }
    }catch(err){
      if(err?.name==='AbortError')return;
      console.warn('Share failed; falling back',err);
    }
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    toast('Downloaded');
  }

  async function exportLinkedWord(e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    window.MindMapApp?.save?.();
    const map=window.MindMapApp?.getCurrentMap?.();
    const project=window.MindMapApp?.getProject?.();
    if(!map){toast('Nothing to export');return;}

    const files={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      'word/document.xml':wordDocumentXml(map,project),
      'word/styles.xml':wordStylesXml(),
      'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    };

    document.getElementById('exportDialog')?.classList.add('hidden');
    await saveBlob(zipStore(files),`${safeName(mapName(map))}.docx`);
  }

  exportWordBtn.addEventListener('click',exportLinkedWord,true);
});
})();
