// Kokoro-only browser inference worker, v1. Imports a pinned official browser bundle.
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
let model = null;
let currentDevice = null;
let running = false;

function report(message, percent) {
  self.postMessage({type:'progress',message,percent});
}

async function initialize() {
  if (model) {
    self.postMessage({type:'ready',device:currentDevice});
    return;
  }
  report('Loading Kokoro JavaScript library…');
  const {KokoroTTS} = await import(LIBRARY_URL);
  if (typeof KokoroTTS?.from_pretrained !== 'function') {
    throw new Error('The Kokoro browser library did not expose KokoroTTS.');
  }
  const progress_callback = (info) => {
    if(!info || typeof info !== 'object') return;
    if(info.status==='progress' && Number.isFinite(info.progress)) {
      report('Downloading Kokoro model: '+Math.round(info.progress)+'%',info.progress);
    } else if(info.status==='initiate' || info.status==='download') {
      report('Preparing Kokoro model files…');
    }
  };
  const options = [
    ...(self.navigator?.gpu ? [{device:'webgpu',dtype:'fp32'}] : []),
    {device:'wasm',dtype:'q8'}
  ];
  let lastError;
  for(const option of options) {
    try {
      report('Starting Kokoro with '+(option.device==='webgpu'?'WebGPU':'WebAssembly')+'…');
      model = await KokoroTTS.from_pretrained(MODEL_ID,{
        ...option,
        progress_callback
      });
      currentDevice = option.device;
      self.postMessage({type:'ready',device:currentDevice});
      return;
    } catch(error) {
      lastError = error;
      report('Kokoro '+option.device+' could not start; '+(option.device==='webgpu'?'trying WebAssembly…':'see error details.'));
    }
  }
  throw lastError || new Error('No compatible Kokoro execution backend was available.');
}

self.addEventListener('message', async (event) => {
  if(running) return;
  const msg=event.data||{};
  if(msg.type!=='load' && msg.type!=='generate') return;
  running=true;
  try {
    if(!model) await initialize();
    else if(msg.type==='load') self.postMessage({type:'ready',device:currentDevice});
    if(msg.type==='generate') {
      const text=String(msg.text||'').trim();
      const voice=String(msg.voice||'af_heart');
      const speed=Number(msg.speed);
      if(!text || text.length>350) throw new Error('Enter between 1 and 350 characters.');
      if(!/^[ab][fm]_[a-z]+$/.test(voice)) throw new Error('Select a supported Kokoro voice.');
      if(!Number.isFinite(speed) || speed<0.65 || speed>1.35) throw new Error('Speech speed must be between 0.65 and 1.35.');
      report('Generating speech with '+voice+'…');
      const raw=await model.generate(text,{voice,speed});
      if(!raw?.audio || !raw.audio.length) throw new Error('Kokoro returned no audio.');
      const samples=raw.audio instanceof Float32Array ? raw.audio : Float32Array.from(raw.audio);
      const sampleRate=Number(raw.sampling_rate)||24000;
      self.postMessage({type:'audio',samples,sampleRate,voice,speed},[samples.buffer]);
    }
  } catch(error) {
    self.postMessage({type:'error',message:error?.message||String(error)});
  } finally {
    running=false;
  }
});