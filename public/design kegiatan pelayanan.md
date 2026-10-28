# DESIGN — Card Scan Sakura Cyber (v2)

Preview: `preview-card-scan-sakura-cyber.html` (tampilan tunggal)
Preview responsif: `preview-card-scan-sakura-cyber-responsive.html` (desktop + mobile berdampingan)
Status: preview HTML mandiri, belum dipasang di Next.js.
Sasaran tampilan: desktop Windows (1920×1080 dan 1366×768), mobile 390×844.

---

## Daftar isi
1. Ringkasan
2. Struktur halaman (section dari atas ke bawah)
3. Komponen
4. Perilaku dan state
5. Token desain (warna, font, ukuran, gerak)
6. Layout dan responsif
7. Aksesibilitas
8. Performa
9. Pemasangan ke Next.js
10. Verifikasi
11. Riwayat perubahan

---

## 1. Ringkasan

Carousel kartu kegiatan tanpa ujung. Saat kartu melewati sinar sakura di tengah layar, chip kartu
terurai dari kiri ke kanan. Sirkuit dan sandi gelap berubah menjadi aksara Jepang (Kanji, Hiragana,
Katakana) yang menyala sesaat, lalu stabil dan terbaca.

Nuansa: cyberpunk Jepang, sakura neon, minimalis futuristik. Warna lembut dan tidak jenuh.

---

## 1a. Konten contoh (layanan DJP)

Judul halaman: **Layanan Pajak — 記録**. Setiap kartu adalah satu kegiatan pelayanan:

| Kegiatan | Tanggal contoh |
|---|---|
| Penyuluhan PPh Pasal 21 Karyawan | 1 Okt 2026 |
| Edukasi Pajak Sekolah | 14 Sep 2026 |
| Sosialisasi e-Filing dan e-Bupot | 28 Agu 2026 |
| Coffee Morning Wajib Pajak | 12 Agu 2026 |
| Bimbingan Teknis Pengisian SPT Tahunan | 3 Agu 2026 |
| Layanan Konsultasi NPWP | 22 Jul 2026 |
| Workshop Pelaporan SPT Masa PPN | 5 Jul 2026 |

Nama, tanggal, dan cerita bersifat contoh. Data sebenarnya diisi dari `data/kegiatan.json`
atau dari form admin.

## 2. Struktur halaman

Halaman terdiri dari empat section, dari atas ke bawah:

| Urutan | Section | Isi | Posisi |
|---|---|---|---|
| A | **Header** | Label kecil, judul halaman, subjudul | Absolut, kiri atas, `z-index 9` |
| B | **Stage** | Track kartu, sinar, kelopak | Penuh layar, `overflow hidden` |
| C | **Sinar pemindai** | Garis sakura di tengah, setinggi track | Di atas track, `z-index 6` |
| D | **Hint** | Teks "GESER · SWIPE · SCROLL" | Absolut, bawah tengah |

Section B dan C berada di satu lapisan visual. Section A dan D adalah teks statis di atasnya.

---

## 3. Komponen

### 3.1 Kartu (`.card`)
- Satu kegiatan: chip, foto, info.
- Lebar `clamp(200px, 22vw, 300px)`, tinggi 100% track, radius 1,6rem.
- Border `rgba(242,155,189,.18)`, bayangan gelap lembut.

### 3.2 Chip (`.chip`)
- Latar gelap dengan pola sirkuit: gradien berulang 90° (jarak 22px) dan 0° (jarak 26px).
- Overlay scanline halus (`mix-blend-mode: overlay`).

### 3.3 Glyph (`.glyphs`, canvas)
- Grid 16 kolom × 24 baris.
- Sel terurai: aksara Jepang. Sel belum terurai: sandi hex redup.
- Pita sinar: aksara terang dengan glow.

### 3.4 Foto (`.photo`)
- Hanya tampil di area yang sudah terurai (kiri sinar).
- `mask-image` linear mengikuti posisi tepi.
- Opacity 0,55 saat kartu sudah terurai penuh.

### 3.5 Rim (`.rim`)
- Garis putih-pink 2 px di tepi area terurai, dengan glow 14 px.
- Hanya aktif saat kartu sedang dipindai.

### 3.6 Flash (`.flash`)
- Radial gradient 70 px di tepi terurai.
- Opacity berdenyut sinus, periode sekitar 1 detik.

### 3.7 Info (`.info`)
- Tanggal (Noto Sans JP, huruf kecil berjarak lebar) dan judul (Shippori Mincho).
- Latar gradien gelap 97% dengan `backdrop-filter: blur(3px)` agar tetap terbaca di atas aksara.

### 3.8 Sinar (`#beam`)
Lima lapisan, semuanya setinggi track:

| Lapisan | Fungsi | Nilai utama |
|---|---|---|
| `.b-after` | Jejak di sisi terurai | 240 px, screen blend |
| `.b-glow` | Kabut pink lembut | 240 px, napas 4,2 detik |
| `.b-heat` | Distorsi panas | backdrop blur 2,5 px |
| `.b-plasma` | Cahaya pink tebal | 32 px, kedip steps(2), 2,6 detik |
| `.b-core` | Inti putih-pink | 4 px, glow 12 px |

Tinggi sinar: `clamp(340px, 56vh, 520px)`, posisi `top:50%; translateY(-50%)`.

### 3.9 Kelopak (`#petals`)
- Partikel kecil di latar, canvas 2D.
- 34 partikel di desktop, 10 di layar sempit.

---

## 4. Perilaku dan state

### 4.1 Gerak track
- Kecepatan 55 px/detik ke kiri.
- Saat kursor di atas track: 35% dari kecepatan.
- Drag mouse atau swipe menggeser track langsung.

### 4.2 Posisi relatif
Setiap kartu dihitung dengan `rel = (posisi sinar − x kartu) / lebar kartu`.

| Kondisi | Nilai `rel` | Tampilan |
|---|---|---|
| Belum tersentuh | ≤ 0 | Chip gelap, sandi hex, foto tersembunyi |
| Sedang dipindai | 0 < rel < 1 | Aksara sampai kolom `rel × 16`, foto di kiri sinar, rim dan flash aktif |
| Sudah terurai | ≥ 1 | Aksara penuh, foto opacity 0,55 tanpa mask |

### 4.3 Aturan sel per frame
- Sel terurai: 2% berganti aksara per frame.
- Sel belum terurai: 0,4% berganti sandi per frame.
- Pita sinar: aksara acak dengan kemungkinan 30% berwarna putih.

### 4.4 Komposisi aksara
- Kanji 40%, Hiragana 30%, Katakana 30%.
- Kanji: `桜光夢風雲龍水火空心和道未来電脳夜花月雪京炎鋼刃`
- Hiragana: `あいうえおさくらかぜひかりゆめほしつきはなこころ`
- Katakana: `カタカナネオンサイバーデータヨルユメキラ`

### 4.5 Skala kartu
`skala = 1 − min(jarak_ke_sinar / lebar_layar, 0,25) × 0,25`

---

## 5. Token desain

### 5.1 Warna

| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg-top` | `#140f16` | Latar stage atas |
| `--bg-bottom` | `#0c080d` | Latar stage bawah |
| `--mist` | `rgba(242,155,189,.10)` | Kabut latar |
| `--chip-top` | `#1a131c` | Chip atas |
| `--chip-bottom` | `#0e0a10` | Chip bawah |
| `--glyph` | `rgba(255,236,243,.86)` | Aksara terurai |
| `--glyph-hi` | `#ffffff` | Pita sinar |
| `--dim` | `rgba(242,155,189,.16)` | Sandi belum terurai |
| `--rim` | `#ffd0e0` | Garis tepi |
| `--title` | `#fbeef4` | Judul |
| `--label` | `#f29bbd` | Label |
| `--text-muted` | `#c79bb1` | Teks pendukung |

### 5.2 Tipografi

| Peran | Font | Ukuran |
|---|---|---|
| Judul halaman | Shippori Mincho 400 | `clamp(28px, 4vw, 52px)` |
| Judul kartu | Shippori Mincho 400 | 1,05rem |
| Label dan tanggal | Noto Sans JP 400/600 | 0,62–0,7rem, letter-spacing 0,2–0,24em |
| Teks umum | Zen Kaku Gothic New | 0,9rem |
| Aksara kartu | Noto Sans JP 600 | ukuran sel × 0,8 |

### 5.3 Ukuran dan jarak
- Track: `clamp(340px, 56vh, 520px)`.
- Kartu: `clamp(200px, 22vw, 300px)`.
- Jarak antar kartu: 340 px. Loop: 7 kartu.
- Grid glyph: 16 × 24.
- Sinar: 240 px (glow), tinggi sama dengan track.

### 5.4 Gerak

| Elemen | Nilai |
|---|---|
| Track | 55 px/detik |
| Napas glow | 4,2 detik, alternate |
| Kedip plasma | 2,6 detik, steps(2,end) |
| Flash | sinus, sekitar 1 detik |

---

## 6. Layout dan responsif

### 6.1 Windows desktop
- **1920×1080:** sekitar 5–6 kartu terlihat. Sinar di tengah, header di kiri atas.
- **1366×768 (laptop):** sekitar 4 kartu terlihat. Track tetap `56vh`, tidak ada bagian yang terpotong.
- **Skala 125% atau 150% (default Windows):** teks dan kartu tetap proporsional karena memakai `vw`, `vh`, dan `clamp`.

### 6.2 Mobile (390×844)
- 1–2 kartu terlihat, geser dengan swipe.
- Sinar tetap di tengah, setinggi track.
- Kelopak dikurangi menjadi 10 partikel.

---

## 7. Aksesibilitas
- `prefers-reduced-motion: reduce`: glow dan plasma dimatikan. Track dan aksara tetap berjalan. Disarankan menambahkan mode statis.
- Aksara di canvas tidak dibaca pembaca layar. Judul dan tanggal ada di DOM (`.info`).
- Kartu perlu dibungkus `<a>` atau `<button>` saat dipasang, dengan fokus yang terlihat (outline 2 px `#f29bbd`).
- Kontras judul `#fbeef4` di atas latar gelap melampaui 4,5:1.

---

## 8. Performa
- Canvas glyph digambar ulang setiap frame. Pada perangkat lemah, kurangi grid ke 12 × 18.
- Hindari `backdrop-filter` di banyak elemen sekaligus. Saat ini hanya dipakai di `.info` dan `.b-heat`.
- Kelopak memakai canvas 2D, bukan Three.js.
- Target 60 fps di perangkat Windows dengan GPU integrasi, dengan 7 kartu aktif.

---

## 9. Pemasangan ke Next.js
1. `components/dokumentasi/SakuraScanCard.tsx`: client component untuk satu kartu (chip, glyph, foto, rim, flash).
2. `components/dokumentasi/ScanBeam.tsx`: sinar dengan CSS module.
3. Data dari `lib/types.ts` dan `data/kegiatan.json`.
4. Pasang di `app/dokumentasi/[unit]/page.tsx` menggantikan `ActivityCarousel`, atau sebagai varian.

---

## 10. Verifikasi

| No | Kriteria | Windows 1920×1080 | Windows 1366×768 | Mobile 390×844 |
|---|---|---|---|---|
| 1 | Track berjalan tanpa jeda | ☐ | ☐ | ☐ |
| 2 | Aksara hanya di kiri sinar | ☐ | ☐ | ☐ |
| 3 | Rim dan flash tepat di tepi | ☐ | ☐ | ☐ |
| 4 | Sandi gelap di area belum dipindai | ☐ | ☐ | ☐ |
| 5 | Judul dan tanggal terbaca | ☐ | ☐ | ☐ |
| 6 | Sinar sejajar track, tidak menyentuh margin | ☐ | ☐ | ☐ |
| 7 | Tidak ada frame macet | ☐ | ☐ | ☐ |

---

## 11. Riwayat perubahan

| Versi | Perubahan |
|---|---|
| v1 | Sinar setinggi layar penuh. |
| v2a | Konten diganti ke kegiatan layanan DJP; ditambah preview responsif desktop + mobile. |
| v2 | Sinar dibatasi setinggi track kartu. Struktur dokumen ditulis ulang per section, ditambah token, responsif Windows, dan checklist per perangkat. |
