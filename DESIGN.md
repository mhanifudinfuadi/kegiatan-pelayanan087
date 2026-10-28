# DESIGN.md — Background "Glass Flower Galaxy"

Spesifikasi background layout web berbasis `glass-flower.mp4` (loop 4K) dan `glass-flower.jpg` (poster 2K) dari GetLayers, dengan perubahan dari referensi:

1. **Bunga**: dari perak-putih kebiruan menjadi **biru terang** bercahaya.
2. **Latar**: dari hitam pekat menjadi **ungu gelap bernuansa galaxy**.
3. **Bintang**: banyak titik **putih** tersebar di seluruh latar.
4. **Tanpa teks**: halaman murni visual, hanya background.

---

## 1. Konsep

Bunga daisy dari kaca cair berdiri sendirian di ruang angkasa. Cahaya biru keluar dari ujung kelopak, dikelilingi nebula ungu dan ratusan bintang putih kecil. Bunga adalah satu-satunya pusat perhatian; nebula dan bintang hanya pendukung.

**Suasana**: sunyi, luas, premium.

---

## 2. Palet Warna

| Token | Hex | Peran |
|---|---|---|
| `--space-deep` | `#0A0420` | Dasar terdalam, tepi vignette |
| `--space-violet` | `#1B0B45` | Latar utama ungu galaxy |
| `--nebula-purple` | `#3A1A7A` | Awan nebula utama |
| `--nebula-magenta` | `#7B3FB8` | Aksen nebula, opacity ≤ 0.25 |
| `--flower-blue` | `#3D8BFF` | Warna dasar bunga |
| `--flower-bright` | `#8FD0FF` | Highlight kelopak |
| `--glow-halo` | `#2F6BFF` | Halo di belakang bunga |
| `--star-white` | `#FFFFFF` | Semua titik bintang |

Aturan: biru hanya untuk bunga dan glow-nya, ungu hanya untuk latar, putih hanya untuk bintang.

---

## 3. Struktur Layer (belakang ke depan)

```
z-0  Base gradient ungu galaxy
z-1  Nebula (3 radial gradient blur, drift 90 detik)
z-2  Starfield putih (canvas, 750 titik desktop / 300 mobile)
z-3  Halo biru di belakang bunga
z-4  Bunga (video, blend: screen, ditint biru)
z-5  Vignette (gelapkan tepi)
```

Tidak ada layer konten teks.

---

## 4. Komposisi

```
Desktop                          Mobile
┌──────────────────────────┐    ┌─────────────────┐
│ ·  ·    ·     ·   ·   ·  │    │ ·   ·  ✿   ·   │
│   ·   ·       ✿    ·     │    │  ·     │    ·   │
│ ·        ·    │   ·   ·  │    │     ·  ╰─       │
│    ·   ·      ╰──→       │    │ ·   ·      ·    │
└──────────────────────────┘    └─────────────────┘
```

- Desktop: bunga di tengah-kanan atas (`object-position: 62% 40%`), tangkai melengkung keluar layar bawah.
- Mobile: `object-position: 55% 30%`, halo diperbesar.
- Bintang tersebar merata ke seluruh layar, termasuk sisi kiri yang kosong.

---

## 5. Cara Mengubah Warna

**a. Hitam jadi transparan**: wrapper video memakai `mix-blend-mode: screen` sehingga piksel hitam hilang dan latar ungu terlihat.

**b. Perak jadi biru**: `hue-rotate` tidak bekerja pada abu-abu, jadi layer gradasi biru dengan `mix-blend-mode: color` diletakkan di dalam wrapper yang sama sebelum di-`screen`. Hitam tetap hitam, jadi latar tidak ikut berubah.

```html
<div class="bg" aria-hidden="true">
  <div class="nebula"></div>
  <canvas id="stars"></canvas>
  <div class="halo"></div>
  <div class="flower">
    <img alt="" src="glass-flower-1280.jpg">
    <video autoplay muted loop playsinline src="glass-flower-1280.mp4"></video>
    <div class="tint"></div>
  </div>
  <div class="vig"></div>
</div>
```

```css
:root{--deep:#0A0420;--violet:#1B0B45;--blue:#3D8BFF;--bright:#8FD0FF}
html,body{height:100%;margin:0;background:var(--deep);overflow:hidden}

.bg{position:fixed;inset:0;
  background:radial-gradient(120% 90% at 70% 35%,var(--violet) 0%,var(--deep) 70%)}

.nebula{position:absolute;inset:-10%;filter:blur(40px);
  animation:drift 90s ease-in-out infinite alternate;
  background:
   radial-gradient(40% 35% at 25% 30%,rgba(123,63,184,.22),transparent 70%),
   radial-gradient(45% 40% at 75% 65%,rgba(58,26,122,.55),transparent 70%),
   radial-gradient(30% 30% at 55% 15%,rgba(61,139,255,.12),transparent 70%)}
@keyframes drift{to{transform:translate3d(-3%,2%,0) scale(1.06)}}

#stars{position:absolute;inset:0;width:100%;height:100%}

.halo{position:absolute;left:62%;top:40%;width:55vmin;height:55vmin;
  transform:translate(-50%,-50%);filter:blur(30px);
  background:radial-gradient(circle,rgba(47,107,255,.35),transparent 65%)}

.flower{position:absolute;inset:0;isolation:isolate;background:#000;mix-blend-mode:screen}
.flower video,.flower img{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;object-position:62% 40%}
.tint{position:absolute;inset:0;mix-blend-mode:color;
  background:linear-gradient(180deg,#8FD0FF 0%,#3D8BFF 55%,#2A6BE0 100%)}

.vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 62% 40%,transparent 35%,rgba(10,4,32,.75) 100%)}

@media (max-width:767px){
  .flower video,.flower img{object-position:55% 30%}
  .halo{left:55%;top:30%;width:80vmin;height:80vmin}
  .vig{background:radial-gradient(ellipse at 55% 30%,transparent 35%,rgba(10,4,32,.75) 100%)}
}
@media (prefers-reduced-motion:reduce){.nebula{animation:none}}
```

Catatan: tangkai emas ikut menjadi biru. Untuk mempertahankan sedikit emas, turunkan opacity `.tint` ke 0.85. Jika hasil terlalu pucat, tambahkan `filter:saturate(1.3)` pada `.tint`.

---

## 6. Starfield Putih

| Parameter | Desktop | Mobile |
|---|---|---|
| Jumlah titik | 750 | 300 |
| Radius | 0.4–1.6 px | sama |
| Opacity dasar | 0.45–0.95 | sama |
| Warna | `#FFFFFF` | sama |
| Kelap-kelip | ±25% opacity, lambat | sama |

```js
(function(){
  var c=document.getElementById('stars'),x=c.getContext('2d'),S=[];
  function resize(){
    var d=Math.min(devicePixelRatio||1,2);
    c.width=innerWidth*d;c.height=innerHeight*d;x.setTransform(d,0,0,d,0,0);
    var n=innerWidth<768?300:750;S=[];
    for(var i=0;i<n;i++)S.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:Math.random()*1.2+.4,a:Math.random()*.5+.45,p:Math.random()*6});
    draw(0);
  }
  function draw(t){
    x.clearRect(0,0,innerWidth,innerHeight);
    S.forEach(function(s){
      x.globalAlpha=s.a*(.75+.25*Math.sin(t/1800+s.p));
      x.fillStyle='#FFFFFF';x.beginPath();x.arc(s.x,s.y,s.r,0,6.3);x.fill();
    });
  }
  function loop(t){draw(t);requestAnimationFrame(loop)}
  resize();addEventListener('resize',resize);
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches)requestAnimationFrame(loop);
})();
```

Karena bunga memakai blend `screen`, bintang yang berada tepat di belakang kelopak bisa menyatu dengan glow. Jika terasa ramai, kosongkan bintang dalam radius ±18vmin dari pusat bunga.

---

## 7. Gerak

- Utama: video bunga yang bergerak pelan (loop asli).
- Pendukung: nebula drift 90 detik dan kelap-kelip bintang yang sangat halus.
- `prefers-reduced-motion`: nebula dan bintang berhenti, video dijeda, poster statis tampil.

---

## 8. Aset & Performa

| Aset | Pemakaian |
|---|---|
| `glass-flower.mp4` (4K, ±30 MB) | Master saja, jangan dipakai di web |
| `glass-flower-1280.mp4` | Versi web, ±1 MB (CRF 30, tanpa audio) |
| `glass-flower-1280.jpg` | Poster, ±45 KB (quality 70) |

```bash
ffmpeg -i glass-flower.mp4 -vf "scale=1280:-2" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart glass-flower-1280.mp4
convert glass-flower.jpg -resize 1280x -quality 70 glass-flower-1280.jpg
```

Untuk layar besar, siapkan versi 1920 px (CRF 26) dan pilih dengan `<source media>`.

---

## 9. Aksesibilitas

- Seluruh `.bg` ber-`aria-hidden="true"` dan tanpa interaksi.
- Jika konten ditambahkan nanti, beri scrim `rgba(10,4,32,.4)` dan jaga kontras minimal 4.5:1.
- Video muted + `playsinline` agar autoplay jalan di iOS.

---

## 10. Prinsip

1. Satu pusat perhatian: bunga.
2. Biru = cahaya, ungu = ruang, putih = bintang.
3. Bintang banyak tapi kecil; jangan sampai bersaing dengan glow bunga.
4. Lebih baik gelap dan tenang daripada terang dan ramai.

## 11. Checklist

- [ ] Tidak ada kotak hitam di sekitar video.
- [ ] Bunga terlihat biru terang, bukan abu-abu pucat.
- [ ] Latar terbaca ungu galaxy, bukan hitam.
- [ ] Bintang putih merata dan tidak menutupi bunga.
- [ ] Mode reduced-motion berfungsi.
- [ ] Lisensi aset GetLayers sesuai penggunaan.

*Sumber aset: GetLayers — glassFlower (https://getlayers.ai).*
