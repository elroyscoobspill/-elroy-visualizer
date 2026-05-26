'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const bgImgRef = useRef(null);

  const [producer, setProducer] = useState('ELROY');
  const [beatTitle, setBeatTitle] = useState('RECALIBRATE');
  const [tagline, setTagline] = useState('808S. AMBITION. ASCENSION.');
  const [theme, setTheme] = useState('#ff8a00');
  const [format, setFormat] = useState('vertical');
  const [audioUrl, setAudioUrl] = useState('');
  const [status, setStatus] = useState('Upload an MP3/WAV/M4A, then press Play Visualizer.');

  useEffect(() => { drawFrame(0); return () => cancelAnimationFrame(rafRef.current); }, [producer, beatTitle, tagline, theme, format]);

  function sizeCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    if (format === 'vertical') { c.width = 1080; c.height = 1920; }
    else { c.width = 1920; c.height = 1080; }
  }

  function rgb(hex) {
    const n = parseInt(hex.replace('#',''), 16);
    return [(n>>16)&255, (n>>8)&255, n&255];
  }

  async function setupAudio() {
    if (!audioRef.current || !audioUrl) return false;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }
    await audioCtxRef.current.resume();
    return true;
  }

  async function play() {
    if (!audioUrl) return setStatus('Upload audio first.');
    await setupAudio();
    await audioRef.current.play();
    loop();
    setStatus('Playing. Visualizer is reacting to your beat.');
  }

  function pause() { audioRef.current?.pause(); setStatus('Paused.'); }

  function loop() {
    cancelAnimationFrame(rafRef.current);
    const run = () => {
      drawFrame(audioRef.current?.currentTime || 0);
      rafRef.current = requestAnimationFrame(run);
    };
    run();
  }

  function drawFrame(t) {
    sizeCanvas();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const [r,g,b] = rgb(theme);

    let data = new Uint8Array(128);
    let avg = 0;
    if (analyserRef.current) {
      data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      avg = data.reduce((a,v)=>a+v,0) / data.length / 255;
    }

    const grad = ctx.createRadialGradient(W*.5,H*.38,80,W*.5,H*.48,H*.8);
    grad.addColorStop(0,`rgba(${r},${g},${b},.38)`);
    grad.addColorStop(.35,'#111014');
    grad.addColorStop(1,'#020203');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    if (bgImgRef.current) {
      ctx.save(); ctx.globalAlpha=.25;
      const img = bgImgRef.current, s = Math.max(W/img.width,H/img.height);
      ctx.drawImage(img,(W-img.width*s)/2,(H-img.height*s)/2,img.width*s,img.height*s);
      ctx.restore();
    }

    const baseY = H*.78, step = W/38;
    ctx.fillStyle='#07080d';
    for(let x=-step;x<W+step;x+=step){
      const bh = H*(.12+.2*Math.abs(Math.sin(x*.013)));
      ctx.fillRect(x,baseY-bh,step*.72,H);
      ctx.fillStyle=`rgba(${r},${g},${b},.45)`;
      for(let y=baseY-bh+20;y<baseY-10;y+=34){ if(Math.sin(y+x)>.25) ctx.fillRect(x+step*.22,y,5,9); }
      ctx.fillStyle='#07080d';
    }

    ctx.save();
    ctx.globalAlpha=.3; ctx.strokeStyle=`rgb(${r},${g},${b})`;
    for(let y=baseY+10;y<H;y+=22){
      ctx.beginPath(); ctx.moveTo(0,y);
      for(let x=0;x<W;x+=40) ctx.lineTo(x,y+Math.sin(x*.025+t*2)*4);
      ctx.stroke();
    }
    ctx.restore();

    const cx=W/2, cy=H*(format==='vertical'?.36:.43), rad=Math.min(W,H)*(format==='vertical'?.25:.23);
    ctx.save();
    ctx.shadowColor=`rgb(${r},${g},${b})`; ctx.shadowBlur=35+avg*55;
    ctx.strokeStyle=`rgb(${r},${g},${b})`; ctx.lineWidth=8;
    ctx.beginPath(); ctx.arc(cx,cy,rad+avg*18,0,Math.PI*2); ctx.stroke();

    for(let i=0;i<128;i++){
      const v=data[i%data.length]/255, a=i/128*Math.PI*2-Math.PI/2, len=22+v*130+avg*35;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*(rad+12),cy+Math.sin(a)*(rad+12));
      ctx.lineTo(cx+Math.cos(a)*(rad+len),cy+Math.sin(a)*(rad+len));
      ctx.lineWidth=4; ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle='rgba(0,0,0,.84)';
    ctx.beginPath(); ctx.arc(cx,cy,rad-25,0,Math.PI*2); ctx.fill();

    ctx.textAlign='center';
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.font=`900 ${format==='vertical'?120:140}px Arial`;
    ctx.fillText(producer || 'ELROY',cx,cy-20);
    ctx.fillStyle='#fff';
    ctx.font=`700 ${format==='vertical'?42:48}px Arial`;
    ctx.fillText((beatTitle||'BEAT TITLE').toUpperCase(),cx,cy+75);
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.font=`500 ${format==='vertical'?30:34}px Arial`;
    ctx.fillText((tagline||'').toUpperCase(),cx,cy+130);
    ctx.fillStyle='rgba(255,255,255,.82)';
    ctx.font=`400 ${format==='vertical'?24:28}px Arial`;
    ctx.fillText(`PROD. BY ${(producer||'ELROY').toUpperCase()}`,cx,cy+185);

    const waveY=H*.84, waveW=W*.72, start=(W-waveW)/2;
    ctx.strokeStyle=`rgb(${r},${g},${b})`; ctx.lineWidth=4;
    for(let i=0;i<90;i++){
      const v=data[i%data.length]/255, x=start+i/90*waveW, hh=12+v*110;
      ctx.beginPath(); ctx.moveTo(x,waveY-hh/2); ctx.lineTo(x,waveY+hh/2); ctx.stroke();
    }
  }

  function loadAudio(e) {
    const f=e.target.files?.[0]; if(!f) return;
    setAudioUrl(URL.createObjectURL(f));
    setStatus(`Loaded audio: ${f.name}`);
  }

  function loadBg(e) {
    const f=e.target.files?.[0]; if(!f) return;
    const img = new Image();
    img.onload = () => { bgImgRef.current = img; drawFrame(0); };
    img.src = URL.createObjectURL(f);
    setStatus(`Loaded background: ${f.name}`);
  }

  function downloadPNG() {
    const a=document.createElement('a');
    a.href=canvasRef.current.toDataURL('image/png');
    a.download=`${beatTitle||'visualizer'}-${format}.png`;
    a.click();
  }

  async function record() {
    if(!audioUrl) return setStatus('Upload audio first.');
    await setupAudio();
    const stream=canvasRef.current.captureStream(30);
    if(audioRef.current.captureStream) audioRef.current.captureStream().getAudioTracks().forEach(t=>stream.addTrack(t));
    chunksRef.current=[];
    const rec=new MediaRecorder(stream,{mimeType:'video/webm'});
    recorderRef.current=rec;
    rec.ondataavailable=e=>{ if(e.data.size) chunksRef.current.push(e.data); };
    rec.onstop=()=> {
      const blob=new Blob(chunksRef.current,{type:'video/webm'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`${beatTitle||'visualizer'}-${format}.webm`;
      a.click();
      setStatus('Downloaded video as WebM. Convert to MP4 if your phone/app requires MP4.');
    };
    rec.start();
    await audioRef.current.play();
    loop();
    setStatus('Recording. Press Stop Recording when finished.');
  }

  function stopRecord(){ recorderRef.current?.stop(); audioRef.current?.pause(); }

  return (
    <main className="page">
      <div className="shell">
        <aside className="panel">
          <div className="brand">ELROY</div><div className="sub">VISUALIZER MODULE</div>
          <div className="group"><label>Producer Name</label><input value={producer} onChange={e=>setProducer(e.target.value)} /></div>
          <div className="group"><label>Beat Title</label><input value={beatTitle} onChange={e=>setBeatTitle(e.target.value)} /></div>
          <div className="group"><label>Tagline</label><input value={tagline} onChange={e=>setTagline(e.target.value)} /></div>
          <div className="group"><label>Accent Color</label><input type="color" value={theme} onChange={e=>setTheme(e.target.value)} /></div>
          <div className="group"><label>Format</label><select value={format} onChange={e=>setFormat(e.target.value)}><option value="vertical">TikTok/Reels 9:16</option><option value="wide">YouTube 16:9</option></select></div>
          <div className="group"><label>Audio File</label><input type="file" accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a" onChange={loadAudio}/><div className="note">On iPhone choose Browse → Files, not Photos.</div></div>
          <div className="group"><label>Background Image Optional</label><input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" onChange={loadBg}/></div>
          <button className="btn primary" onClick={play}>Play Visualizer</button>
          <button className="btn secondary" onClick={pause}>Pause</button>
          <button className="btn secondary" onClick={downloadPNG}>Download PNG</button>
          <button className="btn primary" onClick={record}>Record Video</button>
          <button className="btn secondary" onClick={stopRecord}>Stop Recording</button>
          <div className="note">Video export records WebM in-browser. For easiest MP4 export, use Chrome desktop or convert WebM to MP4 after download.</div>
        </aside>
        <section className="stage">
          <canvas ref={canvasRef}></canvas>
          <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous"></audio>
          <div className="controls">
            <button className="btn primary" onClick={play}>Generate / Preview</button>
            <button className="btn secondary" onClick={downloadPNG}>Export Still</button>
            <button className="btn secondary" onClick={record}>Export Video</button>
          </div>
          <div className="status">{status}</div>
        </section>
      </div>
    </main>
  );
}
