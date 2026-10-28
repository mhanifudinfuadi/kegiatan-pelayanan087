import { CardScanner } from "@/components/card-scanner/card-scanner"
import { SakuraScanSection } from "@/components/kegiatan/sakura-scan-section"


// inspirado por esse site foda - Evervault.com
// https://evervault.com/

export default function Home() {
  return (
    <main className="bg-black">
      {/* Section bunga: latar glass flower galaxy */}
      <CardScanner />

      {/* Section kegiatan pelayanan: carousel kartu scan sakura */}
      <SakuraScanSection />
    </main>
  )
}
