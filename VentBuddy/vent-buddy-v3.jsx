import { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ANON_NAMES = ["Quiet Storm","Lone Pine","Drifting Cloud","Midnight Fog","Still Water","Fading Echo","Gentle Wave","Hollow Wind","Ember Ash","Soft Rain","Wandering Leaf","Deep Current","Pale Horizon","Silent Peak","Warm Shadow","Neon Drift","Glass Echo","Iron Bloom","Velvet Ash","Cobalt Mist"];
const ANON_COLORS = ["#a78bfa","#fb7185","#34d399","#fbbf24","#60a5fa","#f472b6","#4ade80","#f97316","#38bdf8","#e879f9","#a3e635","#2dd4bf","#fb923c","#c084fc","#86efac"];
const EMOJI_REACTIONS = ["❤️","😢","🤗","😤","💪","🙏","👀","😮","🔥","✨","💯","🥺","🫶","😂","🤩","💔"];
const QUICK_EMOJIS = ["😭","😤","😮‍💨","🥲","😩","🤯","💀","😶","🫠","😅","🙃","❤️‍🩹","🫶","🌊","⚡","🌀","🥹","😬","🤦","🙈","🫣","💫","🫧","🌈"];
const MY_ANON = { name: ANON_NAMES[0], color: ANON_COLORS[0] };

const INITIAL_ROOMS = [
  { id: "work", label: "Work Stress", emoji: "💼", count: 12, desc: "Toxic bosses, deadlines, burnout" },
  { id: "relationships", label: "Relationships", emoji: "💔", count: 8, desc: "Love, heartbreak, connection" },
  { id: "anxiety", label: "Anxiety", emoji: "🌀", count: 21, desc: "Spiraling thoughts, panic, worry" },
  { id: "family", label: "Family", emoji: "🏠", count: 6, desc: "Family drama and dynamics" },
  { id: "general", label: "Just Venting", emoji: "💬", count: 34, desc: "No topic, just let it out" },
];

const SEED_MSGS = {
  work: [
    { id: 1, author: ANON_NAMES[3], color: ANON_COLORS[3], text: "My manager took credit for my entire project. I'm done.", time: "4m ago", reactions: {"😤":3,"💯":2}, likes: 7, dislikes: 0 },
    { id: 2, author: ANON_NAMES[7], color: ANON_COLORS[7], text: "Same boat. Just breathe, we got this 💪", time: "2m ago", reactions: {"❤️":4}, likes: 12, dislikes: 1 },
  ],
  anxiety: [
    { id: 1, author: ANON_NAMES[5], color: ANON_COLORS[5], text: "Can't stop the spiral tonight. Everything feels like too much.", time: "6m ago", reactions: {"🤗":5,"🫶":3}, likes: 9, dislikes: 0 },
    { id: 2, author: ANON_NAMES[11], color: ANON_COLORS[11], text: "You're not alone. Breathe with me: in... hold... out 🌊", time: "3m ago", reactions: {"❤️":7}, likes: 23, dislikes: 0 },
  ],
  relationships: [
    { id: 1, author: ANON_NAMES[2], color: ANON_COLORS[2], text: "They said 'I love you' and then disappeared. How is that even real.", time: "10m ago", reactions: {"😢":6,"🥺":4}, likes: 14, dislikes: 0 },
  ],
  family: [
    { id: 1, author: ANON_NAMES[8], color: ANON_COLORS[8], text: "Holiday dinner ended in a screaming match. Again. Every year.", time: "8m ago", reactions: {"😮":3,"💯":2}, likes: 5, dislikes: 2 },
  ],
  general: [
    { id: 1, author: ANON_NAMES[1], color: ANON_COLORS[1], text: "I just need to say: today was genuinely awful and I'm proud I survived it.", time: "1m ago", reactions: {"💪":8,"❤️":5,"🔥":3}, likes: 31, dislikes: 0 },
    { id: 2, author: ANON_NAMES[9], color: ANON_COLORS[9], text: "That deserves a standing ovation honestly 👏", time: "just now", reactions: {}, likes: 8, dislikes: 0 },
  ],
};

// ─── Floating Like Burst ──────────────────────────────────────────────────────
function FloatBurst({ emoji, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 900); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
      fontSize: 22, pointerEvents: "none", zIndex: 200,
      animation: "floatUp 0.9s ease forwards"
    }}>{emoji}</div>
  );
}

// ─── Drawing Canvas ───────────────────────────────────────────────────────────
function DrawCanvas({ onSend, onClose }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#a78bfa");
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState("pen");
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); setDrawing(true); lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#0f172a" : color;
    ctx.lineWidth = tool === "eraser" ? size * 4 : size;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => setDrawing(false);
  const clear = () => { const ctx = canvasRef.current.getContext("2d"); ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); };
  const sendDrawing = () => onSend(canvasRef.current.toDataURL("image/png"));
  const COLORS = ["#a78bfa","#fb7185","#34d399","#fbbf24","#60a5fa","#f472b6","#ff6b6b","#ffffff","#64748b","#0f172a"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#0f172a", borderRadius: 22, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Draw & Share</span>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => { setColor(c); setTool("pen"); }} style={{
                width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                border: color === c && tool === "pen" ? "2.5px solid white" : "2px solid transparent",
                boxShadow: color === c && tool === "pen" ? `0 0 10px ${c}` : "none", transition: "all 0.15s",
                outline: c === "#0f172a" ? "1px solid rgba(255,255,255,0.2)" : "none"
              }} />
            ))}
          </div>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />
          {[2, 4, 8, 14].map(s => (
            <div key={s} onClick={() => setSize(s)} style={{
              width: s * 2.5 + 10, height: s * 2.5 + 10, borderRadius: "50%", background: color === "#0f172a" ? "#334155" : color,
              cursor: "pointer", border: size === s ? "2px solid white" : "2px solid transparent",
              opacity: size === s ? 1 : 0.5, transition: "all 0.15s", minWidth: 14, minHeight: 14
            }} />
          ))}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />
          <button onClick={() => setTool("eraser")} style={{ background: tool === "eraser" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 10px", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}>⬜ Erase</button>
          <button onClick={clear} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "4px 10px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>🗑 Clear</button>
        </div>
        <canvas ref={canvasRef} width={800} height={380} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} style={{ width: "100%", display: "block", cursor: tool === "eraser" ? "cell" : "crosshair", touchAction: "none" }} />
        <div style={{ padding: "12px 16px", display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px", color: "#94a3b8", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={sendDrawing} style={{ flex: 2, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 12, padding: "10px", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🎨 Send Drawing</button>
        </div>
      </div>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onPick, onClose }) {
  return (
    <div style={{ position: "absolute", bottom: "100%", left: 0, background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 14, zIndex: 100, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", marginBottom: 10, animation: "fadeUp 0.18s ease" }}>
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick emojis</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 3 }}>
        {QUICK_EMOJIS.map(e => (
          <button key={e} onClick={() => { onPick(e); onClose(); }} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            padding: "5px", borderRadius: 10, lineHeight: 1, transition: "all 0.1s"
          }}
            onMouseEnter={ev => { ev.target.style.background = "rgba(255,255,255,0.12)"; ev.target.style.transform = "scale(1.3)"; }}
            onMouseLeave={ev => { ev.target.style.background = "none"; ev.target.style.transform = "scale(1)"; }}
          >{e}</button>
        ))}
      </div>
    </div>
  );
}

// ─── New Channel Modal ────────────────────────────────────────────────────────
function NewChannelModal({ onCreate, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("💬");
  const EMOJIS = ["💬","🔥","😤","💔","🌊","⚡","🎭","🌙","💎","🧠","🌿","🎵","🏔","🌈","👾","🫧","🌸","🎮","🦋","🌺"];

  const create = () => {
    if (!name.trim()) return;
    onCreate({ id: Date.now().toString(), label: name.trim(), emoji, count: 1, desc: desc.trim() || "New anonymous channel" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(10px)" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#0f172a", borderRadius: 22, border: "1px solid rgba(99,102,241,0.3)", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.12)", animation: "fadeUp 0.3s ease" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.1), transparent)" }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Create Anonymous Channel</span>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Pick an emoji</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: 40, height: 40, borderRadius: 11, fontSize: 20, cursor: "pointer",
                  background: emoji === e ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.04)",
                  border: emoji === e ? "1.5px solid rgba(99,102,241,0.7)" : "1px solid rgba(255,255,255,0.07)",
                  transition: "all 0.15s", transform: emoji === e ? "scale(1.12)" : "scale(1)"
                }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Channel Name</div>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} placeholder="e.g. Late Night Thoughts"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border 0.15s" }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Short Description</div>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this channel about?"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border 0.15s" }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <button onClick={create} disabled={!name.trim()} style={{
            background: name.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
            border: "none", borderRadius: 14, padding: "13px", color: "white", fontSize: 14,
            fontWeight: 700, cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.4,
            transition: "all 0.2s", boxShadow: name.trim() ? "0 8px 24px rgba(99,102,241,0.35)" : "none"
          }}>✨ Create Channel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Voice Recorder Hook ──────────────────────────────────────────────────────
function useVoice(onSend) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState([3,3,3,3,3,3,3,3]);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const waveRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        onSend(url, duration);
        stream.getTracks().forEach(t => t.stop());
        setDuration(0);
        clearInterval(waveRef.current);
        setWaveHeights([3,3,3,3,3,3,3,3]);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      let d = 0;
      timerRef.current = setInterval(() => { d++; setDuration(d); if (d >= 60) stop(); }, 1000);
      waveRef.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 8 }, () => Math.floor(Math.random() * 18) + 3));
      }, 120);
    } catch { alert("Microphone access needed for voice messages."); }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    clearInterval(waveRef.current);
    setWaveHeights([3,3,3,3,3,3,3,3]);
    if (mediaRef.current?.state !== "inactive") mediaRef.current?.stop();
    setRecording(false);
  };

  return { recording, duration, waveHeights, start, stop };
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, isMe, onReact, onLike, onDislike }) {
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [likeAnim, setLikeAnim] = useState(false);
  const [dislikeAnim, setDislikeAnim] = useState(false);

  const triggerBurst = (emoji) => {
    const id = Date.now();
    setBursts(b => [...b, { id, emoji }]);
  };

  const handleLike = () => {
    onLike(msg.id);
    setLikeAnim(true);
    triggerBurst("👍");
    setTimeout(() => setLikeAnim(false), 400);
  };

  const handleDislike = () => {
    onDislike(msg.id);
    setDislikeAnim(true);
    triggerBurst("👎");
    setTimeout(() => setDislikeAnim(false), 400);
  };

  const handleReact = (emoji) => {
    onReact(msg.id, emoji);
    triggerBurst(emoji);
    setShowReactPicker(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", animation: "fadeUp 0.25s ease" }}>
      {!isMe && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: msg.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#0f172a", fontWeight: 800, boxShadow: `0 0 12px ${msg.color}70` }}>
          {msg.author[0]}
        </div>
      )}
      <div style={{ maxWidth: "74%", position: "relative" }}>
        {/* Burst animations */}
        {bursts.map(b => <FloatBurst key={b.id} emoji={b.emoji} onDone={() => setBursts(prev => prev.filter(x => x.id !== b.id))} />)}

        {!isMe && <div style={{ fontSize: 10, color: msg.color, marginBottom: 3, fontWeight: 700, letterSpacing: "0.03em" }}>{msg.author}</div>}

        {/* Content */}
        {msg.type === "image" ? (
          <img src={msg.content} alt="shared" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", display: "block" }} />
        ) : msg.type === "file" ? (
          <div style={{ background: isMe ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>📎</span>
            <div><div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{msg.fileName}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{msg.fileSize}</div></div>
          </div>
        ) : msg.type === "audio" ? (
          <div style={{ background: isMe ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎙️</span>
            <audio src={msg.content} controls style={{ height: 28, maxWidth: 160, filter: "invert(1) opacity(0.8)" }} />
            <span style={{ fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{msg.audioDur}s</span>
          </div>
        ) : (
          <div style={{ background: isMe ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "10px 14px", color: "#e2e8f0", fontSize: 14, lineHeight: 1.58 }}>
            {msg.text}
          </div>
        )}

        {/* 👍 👎 + reactions row */}
        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "center" }}>
          {/* Like */}
          <button onClick={handleLike} style={{
            background: likeAnim ? "rgba(99,241,99,0.25)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            padding: "3px 9px", fontSize: 13, cursor: "pointer", color: "#e2e8f0", display: "flex", alignItems: "center", gap: 4,
            transition: "all 0.15s", transform: likeAnim ? "scale(1.25)" : "scale(1)"
          }}>👍 <span style={{ fontSize: 11, color: "#86efac", fontWeight: 600 }}>{msg.likes || 0}</span></button>

          {/* Dislike */}
          <button onClick={handleDislike} style={{
            background: dislikeAnim ? "rgba(241,99,99,0.25)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            padding: "3px 9px", fontSize: 13, cursor: "pointer", color: "#e2e8f0", display: "flex", alignItems: "center", gap: 4,
            transition: "all 0.15s", transform: dislikeAnim ? "scale(1.25)" : "scale(1)"
          }}>👎 <span style={{ fontSize: 11, color: "#fb7185", fontWeight: 600 }}>{msg.dislikes || 0}</span></button>

          {/* Emoji reactions */}
          {Object.entries(msg.reactions || {}).map(([emoji, count]) => count > 0 && (
            <button key={emoji} onClick={() => handleReact(emoji)} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
              padding: "3px 8px", fontSize: 12, cursor: "pointer", color: "#e2e8f0", display: "flex", alignItems: "center", gap: 3,
              transition: "transform 0.12s"
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >{emoji} <span style={{ fontSize: 11, color: "#94a3b8" }}>{count}</span></button>
          ))}

          {/* Add reaction */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowReactPicker(p => !p)} style={{
              background: showReactPicker ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20,
              padding: "3px 8px", fontSize: 13, cursor: "pointer", color: "#64748b", transition: "all 0.15s"
            }}>＋😊</button>
            {showReactPicker && (
              <div style={{ position: "absolute", bottom: "110%", left: isMe ? "auto" : 0, right: isMe ? 0 : "auto", background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 10, zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", display: "flex", flexWrap: "wrap", gap: 3, width: 220, animation: "fadeUp 0.15s ease" }}>
                {EMOJI_REACTIONS.map(e => (
                  <button key={e} onClick={() => handleReact(e)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: 5, borderRadius: 9, transition: "all 0.1s" }}
                    onMouseEnter={ev => { ev.target.style.background = "rgba(255,255,255,0.12)"; ev.target.style.transform = "scale(1.3)"; }}
                    onMouseLeave={ev => { ev.target.style.background = "none"; ev.target.style.transform = "scale(1)"; }}
                  >{e}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#334155", marginTop: 3, textAlign: isMe ? "right" : "left" }}>{msg.time}</div>
      </div>
    </div>
  );
}

// ─── Voice Recording Button ────────────────────────────────────────────────────
function VoiceBtn({ recording, duration, waveHeights, onStart, onStop }) {
  return (
    <button
      onMouseDown={onStart} onMouseUp={onStop} onTouchStart={onStart} onTouchEnd={onStop}
      title="Hold to record voice"
      style={{
        background: recording ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.05)",
        border: recording ? "1.5px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, width: recording ? 72 : 36, height: 36, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "all 0.2s", overflow: "hidden", padding: "0 8px", flexShrink: 0
      }}>
      {recording ? (
        <>
          {waveHeights.map((h, i) => (
            <div key={i} style={{ width: 2.5, height: h, background: "#ef4444", borderRadius: 2, transition: "height 0.1s" }} />
          ))}
          <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginLeft: 2 }}>{duration}s</span>
        </>
      ) : (
        <span style={{ fontSize: 17 }}>🎙️</span>
      )}
    </button>
  );
}

// ─── Peer Chat Room ───────────────────────────────────────────────────────────
function PeerChat({ room }) {
  const [msgs, setMsgs] = useState((SEED_MSGS[room.id] || []).map(m => ({ ...m, reactions: m.reactions || {}, likes: m.likes || 0, dislikes: m.dislikes || 0 })));
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const { recording, duration, waveHeights, start: startRec, stop: stopRec } = useVoice((url, dur) => {
    addMsg({ type: "audio", content: url, audioDur: dur });
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const addMsg = (extra) => {
    setMsgs(prev => [...prev, { id: Date.now(), author: MY_ANON.name, color: MY_ANON.color, time: "just now", reactions: {}, likes: 0, dislikes: 0, isMe: true, ...extra }]);
  };

  const send = () => {
    if (!input.trim()) return;
    addMsg({ text: input.trim() });
    setInput(""); setShowEmoji(false);
  };

  const onReact = (msgId, emoji) => {
    setMsgs(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const r = { ...m.reactions };
      r[emoji] = (r[emoji] || 0) + 1;
      return { ...m, reactions: r };
    }));
  };

  const onLike = (msgId) => setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, likes: (m.likes || 0) + 1 } : m));
  const onDislike = (msgId) => setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, dislikes: (m.dislikes || 0) + 1 } : m));

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => addMsg({ type: "image", content: ev.target.result });
      reader.readAsDataURL(file);
    } else {
      addMsg({ type: "file", fileName: file.name, fileSize: (file.size / 1024).toFixed(1) + " KB" });
    }
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {showDraw && <DrawCanvas onSend={url => { addMsg({ type: "image", content: url }); setShowDraw(false); }} onClose={() => setShowDraw(false)} />}
      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />

      {/* Room header */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <span style={{ fontSize: 22 }}>{room.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{room.label}</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{room.count} anon souls • {room.desc}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(34,197,94,0.2)", flexShrink: 0 }}>● Live</div>
      </div>

      {/* Anon badge */}
      <div style={{ padding: "6px 14px", background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11, color: "#475569", flexShrink: 0 }}>
        🔒 You're <span style={{ color: MY_ANON.color, fontWeight: 700 }}>{MY_ANON.name}</span> — fully anonymous
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {msgs.map(m => <MsgBubble key={m.id} msg={m} isMe={!!m.isMe} onReact={onReact} onLike={onLike} onDislike={onDislike} />)}
        <div ref={bottomRef} />
      </div>

      {/* Toolbar hint strip */}
      <div style={{ padding: "5px 14px", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.03)", fontSize: 10, color: "#334155", display: "flex", gap: 12, flexShrink: 0 }}>
        <span>😊 emoji</span><span>🎨 draw</span><span>📎 file</span><span>🎙️ hold to talk</span>
      </div>

      {/* Input area */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Emoji */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setShowEmoji(p => !p)} style={{ background: showEmoji ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>😊</button>
            {showEmoji && <EmojiPicker onPick={e => setInput(p => p + e)} onClose={() => setShowEmoji(false)} />}
          </div>

          {/* Draw */}
          <button onClick={() => setShowDraw(true)} title="Draw" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🎨</button>

          {/* File */}
          <button onClick={() => fileRef.current?.click()} title="Attach file" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📎</button>

          {/* Voice */}
          <VoiceBtn recording={recording} duration={duration} waveHeights={waveHeights} onStart={startRec} onStop={stopRec} />

          {/* Input */}
          <input
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Share with the room…"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "9px 13px", color: "#f1f5f9", fontSize: 14, outline: "none", minWidth: 0 }}
          />

          {/* Send */}
          <button onClick={send} disabled={!input.trim()} style={{ background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: input.trim() ? "pointer" : "default", opacity: input.trim() ? 1 : 0.4, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
function AiChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey 🫂 I'm your AI Buddy. I'm not here to fix anything — just to listen. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [msgReactions, setMsgReactions] = useState({});
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const { recording, duration, waveHeights, start: startRec, stop: stopRec } = useVoice((url, dur) => {
    addMsg({ type: "audio", content: url, audioDur: dur });
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const addMsg = (extra) => setMessages(prev => [...prev, { role: "user", ...extra }]);

  const send = async (textOverride) => {
    const userMsg = textOverride !== undefined ? textOverride : input.trim();
    if (!userMsg || loading) return;
    setInput(""); setShowEmoji(false);
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text || "[shared a drawing or file]" }));
      history.push({ role: "user", content: userMsg });
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "YOUR_API_KEY", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-opus-4-6", max_tokens: 1000,
          system: `You are VentBuddy AI — a warm, empathetic companion. Listen first, validate feelings, reflect back what you hear. Keep responses to 2-4 sentences. Warm, human, never clinical. Never diagnose. Occasionally use 1-2 relevant emojis naturally. If someone seems in crisis, gently mention professional support is available.`,
          messages: history
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.content?.[0]?.text || "I'm still here. Keep going. 💙" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went quiet on my end. But I'm still here 🫂" }]);
    }
    setLoading(false);
  };

  const reactToMsg = (idx, emoji) => {
    setMsgReactions(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), [emoji]: ((prev[idx] || {})[emoji] || 0) + 1 }
    }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = ev => { addMsg({ type: "image", content: ev.target.result }); send("I'm sharing an image with you."); };
      reader.readAsDataURL(file);
    } else {
      addMsg({ type: "file", fileName: file.name }); send(`I'm sharing a file: ${file.name}`);
    }
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {showDraw && <DrawCanvas onSend={url => { addMsg({ type: "image", content: url }); setShowDraw(false); send("I drew something to show you how I'm feeling."); }} onClose={() => setShowDraw(false)} />}
      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => {
          const reactions = msgReactions[i] || {};
          const hasReactions = Object.values(reactions).some(c => c > 0);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}>
              <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8, width: "100%" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, boxShadow: "0 0 14px rgba(99,102,241,0.4)" }}>🫂</div>
                )}
                <div style={{ maxWidth: "75%" }}>
                  {m.type === "image" ? (
                    <img src={m.content} alt="shared" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", display: "block" }} />
                  ) : m.type === "file" ? (
                    <div style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, color: "white", fontSize: 13 }}>
                      <span>📎</span> {m.fileName}
                    </div>
                  ) : m.type === "audio" ? (
                    <div style={{ background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🎙️</span>
                      <audio src={m.content} controls style={{ height: 28, maxWidth: 150, filter: "invert(1) opacity(0.8)" }} />
                      <span style={{ fontSize: 11, color: m.role === "user" ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>{m.audioDur}s</span>
                    </div>
                  ) : (
                    <div style={{ background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)", border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 15px", color: "#f1f5f9", fontSize: 14, lineHeight: 1.58 }}>
                      {m.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Reaction row for AI messages */}
              {m.role === "assistant" && (
                <div style={{ display: "flex", gap: 4, marginTop: 5, marginLeft: 42, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Quick like/dislike on AI messages */}
                  <button onClick={() => reactToMsg(i, "👍")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: "#e2e8f0", transition: "transform 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >👍{reactions["👍"] > 0 ? ` ${reactions["👍"]}` : ""}</button>
                  <button onClick={() => reactToMsg(i, "❤️")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: "#e2e8f0", transition: "transform 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >❤️{reactions["❤️"] > 0 ? ` ${reactions["❤️"]}` : ""}</button>
                  <button onClick={() => reactToMsg(i, "🤗")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: "#e2e8f0", transition: "transform 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >🤗{reactions["🤗"] > 0 ? ` ${reactions["🤗"]}` : ""}</button>
                  {hasReactions && Object.entries(reactions).filter(([,c]) => c > 0).map(([em, c]) => (
                    <span key={em} style={{ fontSize: 11, color: "#64748b" }}></span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🫂</div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "11px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Toolbar hint */}
      <div style={{ padding: "5px 14px", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.03)", fontSize: 10, color: "#334155", display: "flex", gap: 12, flexShrink: 0 }}>
        <span>😊 emoji</span><span>🎨 draw</span><span>📎 file</span><span>🎙️ hold to talk</span>
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setShowEmoji(p => !p)} style={{ background: showEmoji ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>😊</button>
            {showEmoji && <EmojiPicker onPick={e => setInput(p => p + e)} onClose={() => setShowEmoji(false)} />}
          </div>
          <button onClick={() => setShowDraw(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🎨</button>
          <button onClick={() => fileRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>📎</button>
          <VoiceBtn recording={recording} duration={duration} waveHeights={waveHeights} onStart={startRec} onStop={stopRec} />
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Let it out…" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "9px 13px", color: "#f1f5f9", fontSize: 14, outline: "none", minWidth: 0 }} />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{ background: input.trim() && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: input.trim() && !loading ? "pointer" : "default", opacity: input.trim() && !loading ? 1 : 0.4, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VentBuddy() {
  const [tab, setTab] = useState("home");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newRoomFlash, setNewRoomFlash] = useState(null);

  const createChannel = (channel) => {
    setRooms(prev => [channel, ...prev]);
    setNewRoomFlash(channel.id);
    setTimeout(() => setNewRoomFlash(null), 3000);
    setShowNewChannel(false);
    setSelectedRoom(channel);
    setTab("peer");
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #04060e; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
    @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.12)} }
    @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.2)} 50%{box-shadow:0 0 48px rgba(139,92,246,0.38)} }
    @keyframes floatUp { 0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} 100%{opacity:0;transform:translateX(-50%) translateY(-40px) scale(1.5)} }
    @keyframes newChannelPop { 0%{background:rgba(99,241,99,0.18);border-color:rgba(99,241,99,0.5)} 100%{background:rgba(255,255,255,0.025);border-color:rgba(255,255,255,0.055)} }
    .room-card { transition: all 0.15s ease; cursor: pointer; }
    .room-card:hover { background: rgba(255,255,255,0.07) !important; transform: translateX(3px); border-color: rgba(99,102,241,0.3) !important; }
    .room-card-new { animation: newChannelPop 2.5s ease forwards; }
    input::placeholder { color: rgba(71,85,105,0.75); }
    button:active { transform: scale(0.93) !important; }
  `;

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#04060e", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <style>{css}</style>
      {showNewChannel && <NewChannelModal onCreate={createChannel} onClose={() => setShowNewChannel(false)} />}

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 40% at 15% 15%, rgba(99,102,241,0.1) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 85% 85%, rgba(139,92,246,0.07) 0%, transparent 60%)" }} />

      <div style={{ width: "100%", maxWidth: 430, background: "rgba(11,14,22,0.97)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 26, height: 720, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)", backdropFilter: "blur(24px)", position: "relative", animation: "glow 4s ease-in-out infinite" }}>

        {/* Header */}
        <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
          {(tab === "ai" || tab === "peer") && (
            <button onClick={() => { setTab("home"); setSelectedRoom(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 32, height: 32, cursor: "pointer", color: "#94a3b8", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, filter: "drop-shadow(0 0 10px rgba(139,92,246,0.6))" }}>🫧</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>VentBuddy</div>
              <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                {tab === "home" ? "safe · anonymous · always here" : tab === "ai" ? "AI Buddy — Listening" : selectedRoom?.label}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 20, padding: "3px 9px", fontSize: 10, color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              Safe
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden" }}>

          {/* ── HOME ── */}
          {tab === "home" && (
            <div style={{ height: "100%", overflowY: "auto", padding: "18px 16px" }}>
              {/* Hero */}
              <div style={{ textAlign: "center", marginBottom: 20, animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontSize: 54, marginBottom: 6, filter: "drop-shadow(0 0 28px rgba(139,92,246,0.55))" }}>🫂</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>No judgment. No names.<br />Just a place to breathe.</div>
              </div>

              {/* AI CTA */}
              <div onClick={() => setTab("ai")} style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))", border: "1px solid rgba(99,102,241,0.28)", borderRadius: 18, padding: "15px 16px", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, animation: "fadeUp 0.4s ease 0.1s both", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.55)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.28)"}
              >
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 0 22px rgba(99,102,241,0.5)" }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>Chat with AI Buddy</div>
                  <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.45 }}>Always available · 👍👎 React · 🎨 Draw · 📎 Files · 🎙️ Voice</div>
                </div>
                <span style={{ marginLeft: "auto", color: "#6366f1", fontSize: 20 }}>→</span>
              </div>

              {/* Channels Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10, animation: "fadeUp 0.4s ease 0.2s both" }}>
                <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Anonymous Channels</div>
                <button onClick={() => setShowNewChannel(true)} style={{ marginLeft: "auto", background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 10, padding: "6px 12px", fontSize: 11, color: "#a5b4fc", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", boxShadow: "0 4px 14px rgba(99,102,241,0.2)" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.2)"}
                >
                  ＋ New Channel
                </button>
              </div>

              {/* Room list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {rooms.map((room, i) => (
                  <div key={room.id} className={`room-card${newRoomFlash === room.id ? " room-card-new" : ""}`}
                    onClick={() => { setSelectedRoom(room); setTab("peer"); }}
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "12px 15px", display: "flex", alignItems: "center", gap: 12, animation: `fadeUp 0.4s ease ${0.25 + i * 0.04}s both` }}>
                    <span style={{ fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{room.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 1 }}>{room.label}</div>
                      <div style={{ fontSize: 11, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.desc}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "2px 9px", fontSize: 11, color: "#818cf8", fontWeight: 600 }}>{room.count}</div>
                      <div style={{ fontSize: 9, color: "#1e293b" }}>live</div>
                    </div>
                    {newRoomFlash === room.id && (
                      <div style={{ fontSize: 10, color: "#4ade80", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "2px 8px", animation: "fadeUp 0.3s ease" }}>✨ new</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 18, textAlign: "center", fontSize: 10, color: "#1e293b", lineHeight: 2, animation: "fadeUp 0.4s ease 0.7s both" }}>
                🔒 Identity never revealed · All anonymous<br />
                👍👎 Like · 😊 React · 🎨 Draw · 📎 Files · 🎙️ Voice
              </div>
            </div>
          )}

          {tab === "ai" && <AiChat />}
          {tab === "peer" && selectedRoom && <PeerChat room={selectedRoom} />}
        </div>
      </div>
    </div>
  );
}
