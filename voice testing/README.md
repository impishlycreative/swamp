# Voice Testing — Kokoro-only lab

This standalone browser app tests **Kokoro**, not other TTS providers. It is intentionally separate from The Road. Its folder name is literally \`voice testing\`, and the Swamp homepage links to \`voice%20testing/index.html\`.

## Features
- Responsive layout for desktop browsers, iPhone and iPad (no native app install required).
- On-demand Kokoro-82M-v1.0 model download; speech inference runs on the device, not a remote text-to-speech API.
- WebGPU (fp32) preferred when supported; WebAssembly (q8) runs the same Kokoro model as a fallback. WASM may use substantial CPU and memory on older iOS devices.
- American and British English voice presets, including Heart, Bella, Emma and Puck.
- Text input, speech speed, one-click sample lines from The Road, local playback and 16-bit mono PCM WAV export.
- No passwords, analytics, backend, microphone access or persistent voice-recording upload.

## Use
Open Swamp's homepage and select **Voice Testing**, then press **Load Kokoro**, select a voice, enter a phrase and choose **Generate speech**. Press **Download WAV** to export a take.

The model downloads on first use from Hugging Face and the pinned Kokoro browser library is imported from jsDelivr. Browser caching may allow repeat usage without redownloading, but this app does **not** guarantee offline startup, especially on iOS where browser caches can be evicted. Internet access is required for a first-time load.

Kokoro does not include dedicated child-age voices, and spoken "Ha ha ha" is not a genuine laugh sample. Review voices by listening rather than assuming a preset can mimic a young child.

## Implementation
- \`index.html\` contains the UI, playback, and portable WAV writer.
- \`kokoro-worker.js\` uses the official \`kokoro-js@1.2.1\` browser bundle, \`KokoroTTS.from_pretrained()\`, and \`generate(text,{voice,speed})\`.
- The inference worker keeps expensive WASM/GPU initialization away from the main UI thread. WebGPU and WebAssembly are **two execution paths for Kokoro**, not separate speech engines.
- Only English voices are listed in the first release; future catalogue expansion should confirm browser phonemizer support for each language.

## Testing status
Files are committed, but no real device/browsing test of model download, synthesized speech, iOS memory limits, or WAV saving has been completed from this development environment. Test on a current desktop browser and iOS Safari before declaring cross-device audio compatibility. Keep The Road unchanged until a generated take is reviewed.

Upstream: https://github.com/hexgrad/kokoro
Model: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
