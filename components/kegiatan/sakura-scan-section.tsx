"use client"

import { useEffect, useRef } from "react"
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Noto_Sans_JP } from "next/font/google"

const shippori = Shippori_Mincho({ weight: ["400", "500"], subsets: ["latin"], display: "swap" })
const zenKaku = Zen_Kaku_Gothic_New({ weight: ["400", "500"], subsets: ["latin"], display: "swap" })
const notoSansJp = Noto_Sans_JP({ weight: ["400", "600"], subsets: ["latin"], display: "swap" })

// Font Jepang untuk canvas (di-load di bawah, sekali saja)
const JP_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500&family=Zen+Kaku+Gothic+New:wght@400;500&family=Noto+Sans+JP:wght@400;600&display=swap"

const COLS = 16
const ROWS = 24
const KANJI = "桜光夢風雲龍水火空心和道未来電脳夜花月雪京炎鋼刃"
const HIRA = "あいうえおさくらかぜひかりゆめほしつきはなこころ"
const KATA = "カタカナネオンサイバーデータヨルユメキラ"
const HEX = "0123456789ABCDEF"

type Kegiatan = {
  tanggal: string
  judul: string
  foto: string
  posisi?: string
}

// Konten contoh — lihat `public/design kegiatan pelayanan.md` bagian 1a
const KEGIATAN: Kegiatan[] = [
  { tanggal: "1 Okt 2026", judul: "Penyuluhan PPh Pasal 21 Karyawan", foto: "/images/kegiatan/ke1.svg", posisi: "50% 20%" },
  { tanggal: "14 Sep 2026", judul: "Edukasi Pajak Sekolah", foto: "/images/kegiatan/ke2.svg", posisi: "70% 30%" },
  { tanggal: "28 Agu 2026", judul: "Sosialisasi e-Filing dan e-Bupot", foto: "/images/kegiatan/ke3.svg", posisi: "30% 60%" },
  { tanggal: "12 Agu 2026", judul: "Coffee Morning Wajib Pajak", foto: "/images/kegiatan/ke4.svg", posisi: "50% 10%" },
  { tanggal: "3 Agu 2026", judul: "Bimbingan Teknis Pengisian SPT Tahunan", foto: "/images/kegiatan/ke5.svg", posisi: "20% 40%" },
  { tanggal: "22 Jul 2026", judul: "Layanan Konsultasi NPWP", foto: "/images/kegiatan/ke6.svg", posisi: "80% 30%" },
  { tanggal: "5 Jul 2026", judul: "Workshop Pelaporan SPT Masa PPN", foto: "/images/kegiatan/ke7.svg", posisi: "45% 55%" },
]

const randJP = () => {
  const r = Math.random()
  const pool = r < 0.4 ? KANJI : r < 0.7 ? HIRA : KATA
  return pool[Math.floor(Math.random() * pool.length)]
}
const randHex = () => HEX[Math.floor(Math.random() * 16)]

type CardState = {
  card: HTMLDivElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  photo: HTMLDivElement
  flash: HTMLDivElement
  rim: HTMLDivElement
  cells: string[]
  dim: string[]
  w: number
  h: number
}

/**
 * Section "Layanan Pajak — 記録": carousel kartu kegiatan tanpa ujung dengan
 * sinar sakura di tengah. Kartu yang melewati sinar terurai dari kiri ke kanan
 * (sirkuit/hex → aksara Jepang). Spesifikasi: `public/design kegiatan pelayanan.md`.
 */
export function SakuraScanSection() {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const beamRef = useRef<HTMLDivElement>(null)
  const petalsRef = useRef<HTMLCanvasElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const dbg = (window as unknown as { __kegDebug?: string[] }).__kegDebug
    if (dbg) dbg.push("effect")
    const stage = stageRef.current
    const track = trackRef.current
    const petalsCanvas = petalsRef.current
    if (dbg) dbg.push(`stage=${!!stage} track=${!!track} petals=${!!petalsCanvas} cards=${cardRefs.current.length}`)
    if (!stage || !track || !petalsCanvas) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Font Jepang untuk glyph di canvas
    if (!document.getElementById("sakura-scan-jp-font")) {
      const link = document.createElement("link")
      link.id = "sakura-scan-jp-font"
      link.rel = "stylesheet"
      link.href = JP_FONT_HREF
      document.head.appendChild(link)
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cards = cardRefs.current.filter((c): c is HTMLDivElement => Boolean(c))
    const N = cards.length

    const state: CardState[] = cards.map((card) => {
      const cv = card.querySelector("canvas") as HTMLCanvasElement
      return {
        card,
        canvas: cv,
        ctx: cv.getContext("2d")!,
        photo: card.querySelector(".kegiatan-photo") as HTMLDivElement,
        flash: card.querySelector(".kegiatan-flash") as HTMLDivElement,
        rim: card.querySelector(".kegiatan-rim") as HTMLDivElement,
        cells: Array.from({ length: COLS * ROWS }, randJP),
        dim: Array.from({ length: COLS * ROWS }, randHex),
        w: 0,
        h: 0,
      }
    })

    const sizeCanvases = () => {
      state.forEach((s) => {
        s.w = s.card.offsetWidth
        s.h = s.card.offsetHeight
        s.canvas.width = Math.max(1, s.w * dpr)
        s.canvas.height = Math.max(1, s.h * dpr)
        s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      })
    }

    const SPACING = 340
    const SPEED = 55
    let offset = 0
    let last = performance.now()
    let hover = false
    let dragX: number | null = null
    const LOOP = N * SPACING

    const onResize = () => {
      sizeCanvases()
    }

    const onPointerEnter = () => (hover = true)
    const onPointerLeave = () => (hover = false)
    const onPointerDown = (e: PointerEvent) => {
      dragX = e.clientX
      track.setPointerCapture?.(e.pointerId)
    }
    const onPointerUp = () => (dragX = null)
    const onPointerMove = (e: PointerEvent) => {
      if (dragX === null) return
      offset += e.clientX - dragX
      dragX = e.clientX
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      offset += e.deltaY + e.deltaX
    }

    window.addEventListener("resize", onResize)
    track.addEventListener("pointerenter", onPointerEnter)
    track.addEventListener("pointerleave", onPointerLeave)
    track.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointermove", onPointerMove)
    track.addEventListener("wheel", onWheel, { passive: false })
    if (dbg) dbg.push("listeners-ok")

    const drawCard = (s: CardState, rel: number) => {
      const { ctx, w, h, cells, dim } = s
      ctx.clearRect(0, 0, w, h)
      const cw = w / COLS
      const ch = h / ROWS
      const edge = Math.max(0, Math.min(COLS, rel * COLS))
      ctx.font = `600 ${(ch * 0.8).toFixed(1)}px "Noto Sans JP","Zen Kaku Gothic New",monospace`
      ctx.textBaseline = "top"

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = r * COLS + c
          const x = c * cw + cw * 0.12
          const y = r * ch
          if (c + 1 <= edge) {
            // sudah terurai: aksara terbaca
            if (Math.random() < 0.02) cells[idx] = randJP()
            ctx.shadowBlur = 0
            ctx.fillStyle = "rgba(255,236,243,.86)"
            ctx.fillText(cells[idx], x, y)
          } else if (c < edge + 1.2 && rel > 0 && rel < 1.02) {
            // pita sinar: nyala terang
            const f = Math.random()
            ctx.shadowColor = "rgba(255,170,205,.9)"
            ctx.shadowBlur = 10
            ctx.fillStyle = f < 0.3 ? "#ffffff" : "rgba(255,205,225,.95)"
            ctx.fillText(f < 0.5 ? randJP() : cells[idx], x, y)
            ctx.shadowBlur = 0
          } else {
            // belum dipindai: sandi hex gelap
            if (Math.random() < 0.004) dim[idx] = randHex()
            ctx.fillStyle = "rgba(242,155,189,.16)"
            ctx.fillText(dim[idx], x, y)
          }
        }
      }
    }

    let raf = 0
    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      if (dragX === null) offset += SPEED * (hover ? 0.35 : 1) * dt

      const stageW = stage.clientWidth || window.innerWidth
      const beam = stageW / 2
      const cw = cards[0].offsetWidth || 260
      const half = cw / 2

      state.forEach((s, i) => {
        // posisi relatif terhadap sinar, lalu dilipat agar track tak berujung
        const raw = i * SPACING - offset - stageW / 2 + half
        const x = (((raw + half) % LOOP) + LOOP) % LOOP - half
        const center = x + half
        const scale = 1 - Math.min(Math.abs(center - beam) / stageW, 0.25) * 0.25
        s.card.style.transform = `translateX(${x}px) scale(${scale})`

        const rel = (beam - x) / cw
        const edge = Math.max(0, Math.min(100, rel * 100))

        // foto: hanya tampil di area yang sudah terurai (kiri sinar)
        if (rel <= 0) {
          s.photo.style.opacity = "0"
          s.photo.style.maskImage = "none"
          s.photo.style.webkitMaskImage = "none"
        } else if (rel >= 1) {
          s.photo.style.opacity = "0.55"
          s.photo.style.maskImage = "none"
          s.photo.style.webkitMaskImage = "none"
        } else {
          const m = `linear-gradient(to right,#000 0%,#000 ${(edge - 4).toFixed(2)}%,transparent ${(edge + 0.4).toFixed(2)}%)`
          s.photo.style.maskImage = m
          s.photo.style.webkitMaskImage = m
          s.photo.style.opacity = "0.55"
        }

        // rim + flash tepat di tepi terurai
        const active = rel > 0 && rel < 1
        s.rim.style.opacity = active ? "1" : "0"
        s.rim.style.left = `${edge.toFixed(2)}%`
        s.flash.style.opacity = active
          ? (0.45 + 0.25 * Math.sin(t / 90 + i)).toFixed(3)
          : "0"
        s.flash.style.left = `${edge.toFixed(2)}%`

        drawCard(s, rel)
      })

      raf = requestAnimationFrame(frame)
    }

    onResize()
    raf = requestAnimationFrame(frame)
    if (dbg) dbg.push("raf-started")

    // Kelopak sakura di latar
    let petalsRaf = 0
    const pc = petalsCanvas
    const pctx = pc.getContext("2d")!
    let pw = 0
    let ph = 0
    let petals: { x: number; y: number; s: number; v: number; ph: number; a: number }[] = []

    const sizePetals = () => {
      const r = stage.getBoundingClientRect()
      pw = r.width
      ph = r.height
      pc.width = Math.max(1, pw * dpr)
      pc.height = Math.max(1, ph * dpr)
      pc.style.width = `${pw}px`
      pc.style.height = `${ph}px`
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const initPetals = () => {
      const count = pw < 760 ? 10 : 34
      petals = Array.from({ length: count }, () => ({
        x: rnd(0, pw),
        y: rnd(0, ph),
        s: rnd(3, 7),
        v: rnd(4, 9),
        ph: rnd(0, 6.28),
        a: rnd(0.2, 0.5),
      }))
    }
    const drawPetals = () => {
      pctx.clearRect(0, 0, pw, ph)
      for (const p of petals) {
        p.y += p.v / 60
        p.ph += 0.01
        p.x += Math.sin(p.ph) * 0.4
        if (p.y > ph + 10) {
          p.y = -10
          p.x = rnd(0, pw)
        }
        pctx.globalAlpha = p.a
        pctx.fillStyle = "#f6b8d0"
        pctx.beginPath()
        pctx.arc(p.x, p.y, p.s / 2, 0, 6.28)
        pctx.fill()
      }
      petalsRaf = requestAnimationFrame(drawPetals)
    }
    sizePetals()
    initPetals()
    if (reduceMotion) {
      drawPetals()
      cancelAnimationFrame(petalsRaf)
    } else {
      petalsRaf = requestAnimationFrame(drawPetals)
    }
    const onPetalsResize = () => {
      sizePetals()
      initPetals()
    }
    window.addEventListener("resize", onPetalsResize)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(petalsRaf)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("resize", onPetalsResize)
      track.removeEventListener("pointerenter", onPointerEnter)
      track.removeEventListener("pointerleave", onPointerLeave)
      track.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointermove", onPointerMove)
      track.removeEventListener("wheel", onWheel)
    }
  }, [])

  return (
    <section
      id="kegiatan"
      aria-label="Kegiatan pelayanan"
      className={`${zenKaku.className} relative w-full overflow-hidden`}
      style={{
        background:
          "radial-gradient(1000px 640px at 50% 38%, rgba(242,155,189,.10), transparent 70%)," +
          "radial-gradient(700px 500px at 12% 90%, rgba(199,155,177,.07), transparent 70%)," +
          "linear-gradient(180deg,#140f16,#0c080d 80%)",
      }}
    >
      <style jsx>{`
        .kegiatan-stage {
          position: relative;
          width: 100%;
          height: clamp(520px, 82vh, 720px);
          overflow: hidden;
        }
        .kegiatan-head {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9;
          padding: clamp(20px, 4vw, 48px) clamp(20px, 5vw, 80px) 0;
        }
        .kegiatan-label {
          font-size: 0.7rem;
          letter-spacing: 0.24em;
          color: #f29bbd;
          font-family: "Noto Sans JP", system-ui, sans-serif;
        }
        .kegiatan-title {
          font-family: ${shippori.style.fontFamily}, serif;
          font-weight: 400;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 1.15;
          margin-top: 0.5rem;
          color: #fbeef4;
        }
        .kegiatan-sub {
          font-size: 0.9rem;
          color: #c79bb1;
          margin-top: 0.4rem;
          max-width: 36rem;
          line-height: 1.6;
        }
        .kegiatan-petals {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }
        .kegiatan-track {
          position: absolute;
          left: 0;
          top: 52%;
          transform: translateY(-50%);
          height: clamp(340px, 56vh, 520px);
          width: 100%;
          z-index: 2;
          touch-action: pan-y;
          cursor: grab;
        }
        .kegiatan-track:active {
          cursor: grabbing;
        }
        .kegiatan-card {
          position: absolute;
          top: 0;
          width: clamp(200px, 22vw, 300px);
          height: 100%;
          min-height: 340px;
          max-height: 520px;
          border-radius: 1.6rem;
          overflow: hidden;
          background: #1a131c;
          border: 1px solid rgba(242, 155, 189, 0.18);
          box-shadow:
            0 30px 60px -30px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
          will-change: transform;
          left: 0;
        }
        .kegiatan-chip {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 80% 15%, rgba(242, 155, 189, 0.1), transparent 45%),
            repeating-linear-gradient(90deg, rgba(242, 155, 189, 0.08) 0 1px, transparent 1px 22px),
            repeating-linear-gradient(0deg, rgba(242, 155, 189, 0.06) 0 1px, transparent 1px 26px),
            linear-gradient(160deg, #1a131c, #0e0a10);
        }
        .kegiatan-chip::after {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 3px);
          mix-blend-mode: overlay;
        }
        .kegiatan-glyphs {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .kegiatan-photo {
          position: absolute;
          inset: 0;
          background-size: cover;
          opacity: 0;
          filter: saturate(0.75) brightness(0.92);
        }
        .kegiatan-flash {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 70px;
          margin-left: -35px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 210, 226, 0.55),
            rgba(255, 140, 180, 0.12) 50%,
            transparent 70%
          );
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .kegiatan-rim {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, transparent, #fff 15%, #ffd0e0 50%, #fff 85%, transparent);
          box-shadow: 0 0 14px 3px rgba(255, 170, 205, 0.85);
          opacity: 0;
          pointer-events: none;
        }
        .kegiatan-info {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          padding: 1.2rem 1.1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          background: linear-gradient(
            0deg,
            rgba(12, 8, 13, 0.97) 40%,
            rgba(12, 8, 13, 0.6) 75%,
            rgba(12, 8, 13, 0)
          );
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }
        .kegiatan-info span {
          font-family: ${notoSansJp.style.fontFamily}, sans-serif;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          color: #f29bbd;
        }
        .kegiatan-info b {
          font-family: ${shippori.style.fontFamily}, serif;
          font-weight: 400;
          font-size: 1.05rem;
          line-height: 1.3;
          color: #fbeef4;
        }
        .kegiatan-beam {
          position: absolute;
          left: 50%;
          top: 52%;
          height: clamp(340px, 56vh, 520px);
          width: 0;
          transform: translateY(-50%);
          z-index: 6;
          pointer-events: none;
        }
        .b-heat {
          position: absolute;
          left: -34px;
          width: 68px;
          top: 0;
          bottom: 0;
          backdrop-filter: blur(2.5px) saturate(1.25);
          -webkit-backdrop-filter: blur(2.5px) saturate(1.25);
          mask: linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
          -webkit-mask: linear-gradient(90deg, transparent, #000 45%, #000 55%, transparent);
          opacity: 0.8;
        }
        .b-glow {
          position: absolute;
          left: -120px;
          width: 240px;
          top: 0;
          bottom: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 190, 215, 0.38),
            rgba(242, 155, 189, 0.12) 42%,
            transparent 70%
          );
          filter: blur(8px);
          animation: kegiatan-heat 4.2s ease-in-out infinite alternate;
        }
        .b-plasma {
          position: absolute;
          left: -16px;
          width: 32px;
          top: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(242, 130, 175, 0.55) 35%,
            rgba(255, 205, 225, 0.9) 50%,
            rgba(242, 130, 175, 0.55) 65%,
            transparent
          );
          filter: blur(4px);
          animation: kegiatan-flick 2.6s steps(2, end) infinite;
        }
        .b-core {
          position: absolute;
          left: -2px;
          width: 4px;
          top: 0;
          bottom: 0;
          background: linear-gradient(180deg, transparent, #fff 18%, #ffe3ee 50%, #fff 82%, transparent);
          box-shadow: 0 0 12px 3px rgba(255, 200, 222, 0.95);
        }
        .b-after {
          position: absolute;
          left: -260px;
          width: 240px;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(242, 155, 189, 0.16) 82%, rgba(255, 200, 222, 0.2));
          mix-blend-mode: screen;
          filter: blur(3px);
        }
        .kegiatan-hint {
          position: absolute;
          bottom: clamp(16px, 3vh, 32px);
          left: 0;
          right: 0;
          z-index: 9;
          text-align: center;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          color: #c79bb1;
        }
        .kegiatan-card:focus-visible {
          outline: 2px solid #f29bbd;
          outline-offset: 4px;
        }
        @keyframes kegiatan-heat {
          from {
            opacity: 0.75;
            transform: scaleX(0.95);
          }
          to {
            opacity: 1;
            transform: scaleX(1.05);
          }
        }
        @keyframes kegiatan-flick {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.72;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .b-glow,
          .b-plasma {
            animation: none;
          }
        }
      `}</style>

      <div className="kegiatan-stage">
        <canvas ref={petalsRef} className="kegiatan-petals" aria-hidden="true" />

        <div className="kegiatan-head">
          <div className="kegiatan-label">DOKUMENTASI · 桜 · SAKURA SCAN</div>
          <h2 className="kegiatan-title">Layanan Pajak — 記録</h2>
          <p className="kegiatan-sub">
            Setiap kegiatan dipindai oleh cahaya sakura, lalu terurai menjadi aksara.
          </p>
        </div>

        <div ref={trackRef} className="kegiatan-track" aria-label="Carousel kegiatan pelayanan">
          {KEGIATAN.map((k, i) => (
            <article
              key={`${k.judul}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el as HTMLDivElement | null
              }}
              role="group"
              className="kegiatan-card"
              tabIndex={0}
              aria-label={`${k.tanggal} — ${k.judul}`}
            >
              <div className="kegiatan-chip" aria-hidden="true" />
              <canvas className="kegiatan-glyphs" aria-hidden="true" />
              <div
                className="kegiatan-photo"
                style={{ backgroundImage: `url(${k.foto})`, backgroundPosition: k.posisi ?? "50% 50%" }}
                aria-hidden="true"
              />
              <div className="kegiatan-flash" aria-hidden="true" />
              <div className="kegiatan-rim" aria-hidden="true" />
              <div className="kegiatan-info">
                <span>{k.tanggal}</span>
                <b>{k.judul}</b>
              </div>
            </article>
          ))}
        </div>

        <div ref={beamRef} className="kegiatan-beam" aria-hidden="true">
          <div className="b-after" />
          <div className="b-glow" />
          <div className="b-heat" />
          <div className="b-plasma" />
          <div className="b-core" />
        </div>

        <div className="kegiatan-hint">GESER · SWIPE · SCROLL</div>
      </div>
    </section>
  )
}
