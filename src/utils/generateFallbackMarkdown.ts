/**
 * Generate clean fallback markdown report when AI API fails
 * This function creates a well-structured markdown report without word truncation issues
 */

interface PositionDetail {
  id: string;
  name: string;
  category: string;
  existingAsn: number;
  existingNonAsn: number;
  totalExisting: number;
  abkCount: number;
  gap: number;
  kejuruanDetails?: Record<string, number>;
}

interface PolicyParam {
  id: string;
  category: string;
  title: string;
  value?: string;
  description?: string;
  parent_id?: string | null;
}

interface FallbackMarkdownParams {
  selectedDepartment: string;
  locName: string;
  internalTotals: {
    asn: number;
    nonAsn: number;
    abk: number;
    gap: number;
  };
  bpsTpt: string;
  bpsNeet: string;
  bpsTik: string;
  bpsSektor: string;
  sarpras: string;
  positionDetails: PositionDetail[];
  policyParams: PolicyParam[];
  selectedStrategies: string[];
}

export function generateFallbackMarkdown(params: FallbackMarkdownParams): string {
  const {
    selectedDepartment,
    locName,
    internalTotals,
    bpsTpt,
    bpsNeet,
    bpsTik,
    bpsSektor,
    sarpras,
    positionDetails,
    policyParams,
    selectedStrategies
  } = params;

  const tptN = parseFloat(bpsTpt || '0');
  const urg = tptN > 7 ? 'KRITIS' : tptN > 4 ? 'WASPADA' : 'OPTIMAL';
  
  const jabfungs = policyParams.filter(p => p.category === 'jabfung' && p.parent_id);
  const programs = policyParams.filter(p => p.category === 'program' && p.parent_id);
  const strategis = policyParams.filter(p => p.category === 'strategi' && p.parent_id);

  const activeStrategis = selectedStrategies.length > 0
    ? strategis.filter(s => selectedStrategies.some(sel => s.title.includes(sel)))
    : strategis;

  const isStrSelected = selectedStrategies.length > 0;
  const isStr1 = !isStrSelected || selectedStrategies.some(s => s.includes('Strategi 1'));
  const isStr2 = !isStrSelected || selectedStrategies.some(s => s.includes('Strategi 2'));
  const isStr3 = !isStrSelected || selectedStrategies.some(s => s.includes('Strategi 3'));
  const isStr4 = !isStrSelected || selectedStrategies.some(s => s.includes('Strategi 4'));

  let score = 50;
  if (internalTotals.asn > 0) score += 15;
  if (tptN < 6) score += 15;
  if (sarpras && sarpras.length > 20) score += 10;
  if (score > 100) score = 100;

  const sections: string[] = [];
  
  // Header
  sections.push('## Laporan Analisis Kebutuhan SDM');
  sections.push(`### ${selectedDepartment} | ${locName}`);
  sections.push('');
  sections.push('> ⚠️ **Catatan Sistem:** Laporan ini di-generate menggunakan **Mesin Analisis Aturan Vokasi SIMPEL (Lokal)** karena integrasi DeepSeek API belum terhubung atau dibatasi.');
  sections.push('');
  
  // Section 1: Ringkasan Eksekutif
  sections.push('### 1. Ringkasan Eksekutif');
  sections.push('');
  sections.push(`Berdasarkan analisis silang data internal **Peta Jabatan** dengan indikator eksternal **Big Data BPS**, Unit Kerja **${selectedDepartment}** yang berlokasi di **${locName}** saat ini memiliki **defisit total sebanyak ${internalTotals.gap} personel**.`);
  sections.push('');
  sections.push(`Tingkat Pengangguran Terbuka (TPT) daerah tercatat sebesar **${bpsTpt || '0%'}** dengan status kerawanan **${urg}**. Mengingat sektor ekonomi dominan di wilayah ini adalah **${bpsSektor || 'Belum Ditentukan'}**, diperlukan percepatan pemenuhan dan penyelarasan kompetensi instruktur agar output pelatihan berdaya serap tinggi dan relevan.`);
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 2: Analisis Gap
  sections.push('### 2. Analisis Gap & Mismatch Kejuruan');
  sections.push('');
  sections.push('Peta Jabatan saat ini menunjukkan ketidakseimbangan alokasi pegawai. Di bawah ini adalah rincian formasi kritis yang mengalami defisit berdasarkan batas Anggaran Beban Kerja (ABK):');
  sections.push('');
  sections.push('| Jabatan Formasi | Kategori | Eksisting | ABK Ideal | Gap / Kekurangan |');
  sections.push('| :--- | :--- | :---: | :---: | :---: |');
  
  positionDetails.forEach(p => {
    const gapText = p.gap > 0 ? `Kurang ${p.gap}` : p.gap < 0 ? `Lebih ${Math.abs(p.gap)}` : 'Sesuai';
    sections.push(`| ${p.name} | ${p.category} | ${p.totalExisting} | ${p.abkCount} | ${gapText} |`);
  });
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 3: Formasi Jabatan
  if (isStr1) {
    sections.push('### 3. Formasi Jabatan Ideal (Aktif via Strategi 1: Penyiapan SDM Satpel)');
    sections.push('');
    sections.push(`Guna mendukung akselerasi ketenagakerjaan di **${locName}**, UPT/Satpel baru harus mengadopsi alokasi penataan posisi berdasarkan hasil analisis gap riil beban kerja:`);
    sections.push('');
    sections.push('| Jabatan Baru | Target Jumlah | Alasan Strategis Pemenuhan |');
    sections.push('| :--- | :---: | :--- |');
    
    const gapPositions = positionDetails.filter(p => p.gap > 0);
    if (gapPositions.length > 0) {
      gapPositions.forEach(p => {
        sections.push(`| ${p.name} | ${p.gap} | Pemenuhan standar pelayanan minimum UPT dan rasio peserta praktik. |`);
      });
    } else {
      sections.push('| Instruktur Kejuruan Baru | 2 | Penguatan formasi kejuruan prioritas daerah. |');
    }
    
    sections.push('');
    sections.push(`*Rekomendasi Penempatan*: Berdasarkan TPT sebesar **${bpsTpt}**, prioritaskan penugasan formasi pengajar pada kelas kejuruan berbasis **${bpsSektor}** guna memotong kesenjangan penyerapan tenaga kerja daerah.`);
  } else {
    sections.push('### 3. Formasi Jabatan Ideal');
    sections.push('');
    sections.push('*(Strategi 1: Penyiapan & Alokasi SDM Satpel Baru tidak diaktifkan. Menggunakan konfigurasi alokasi personel administratif standar).*');
  }
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 4: Rekrutmen
  if (isStr4) {
    sections.push('### 4. Rekomendasi Rekrutmen & Kualifikasi (Aktif via Strategi 4: Peningkatan Kapasitas SDM)');
    sections.push('');
    sections.push('Sesuai dengan regulasi formal Kemnaker RI, peningkatan kompetensi instruktur eksisting difokuskan pada:');
    sections.push('');
    sections.push('* **Peningkatan Kapasitas Terarah**:');
    
    if (jabfungs.length > 0) {
      jabfungs.forEach(jf => {
        sections.push(`  - **Upgrading ke ${jf.title}** (Golongan ${jf.value || 'N/A'}): Akselerasi program pelatihan asesor lisensi dan metodologi mengajar.`);
      });
    } else {
      sections.push('  - Pelatihan metodologi pengajaran modern');
      sections.push('  - Sertifikasi asesor kompetensi BNSP');
    }
    
    sections.push('* **Rasio Kelas Praktik (Permenaker No. 6/2025)**:');
    sections.push('  - Kelas praktik wajib menggunakan rasio **1 Instruktur : 16 Peserta** dengan pendampingan penuh instruktur tersertifikasi.');
  } else {
    sections.push('### 4. Rekomendasi Rekrutmen & Kualifikasi');
    sections.push('');
    sections.push('*(Strategi 4: Peningkatan Kapasitas & Upgrading Instruktur tidak diaktifkan. Kualifikasi rekrutmen mengikuti panduan dasar).*');
  }
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 5: Program Pelatihan
  if (isStr3) {
    sections.push('### 5. Program Pelatihan Prioritas (PBK) (Aktif via Strategi 3: Penyelarasan Program Pelatihan)');
    sections.push('');
    sections.push(`Program pelatihan diselaraskan secara langsung dengan kebutuhan pasar kerja lokal di **${locName}** dan sektor **${bpsSektor}**:`);
    sections.push('');
    
    if (programs.length > 0) {
      programs.forEach(pr => {
        sections.push(`* **PBK ${pr.title}**: Penyiapan kurikulum khusus bersertifikat BNSP untuk meningkatkan daya saing kelulusan lokal.`);
      });
    } else {
      sections.push('* **PBK Kejuruan Prioritas**: Disesuaikan dengan sektor dominan wilayah');
    }
  } else {
    sections.push('### 5. Program Pelatihan Prioritas (PBK)');
    sections.push('');
    sections.push('*(Strategi 3: Penyelarasan Program Pelatihan tidak diaktifkan. Program diklat diselenggarakan menggunakan standar kurikulum nasional umum).*');
  }
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 6: Sarpras
  if (isStr2) {
    sections.push('### 6. Pengadaan Sarpras Prioritas (Aktif via Strategi 2: Pemenuhan Sarpras Potensi Wilayah)');
    sections.push('');
    sections.push('Menyesuaikan dengan kondisi sarpras eksisting UPT:');
    sections.push('');
    sections.push(`> *"${sarpras || 'Data inventaris sarpras belum terisi.'}"*`);
    sections.push('');
    sections.push('**Rencana Pemenuhan Sarpras Berbasis Industri Wilayah**:');
    sections.push('');
    sections.push(`1. Modernisasi peralatan praktikum utama agar sesuai dengan standar teknologi industri modern berbasis **${bpsSektor}** di daerah **${locName}**.`);
    sections.push('2. Pengadaan modul ajar digital interaktif serta platform simulator penunjang kelas teori.');
  } else {
    sections.push('### 6. Pengadaan Sarpras Prioritas');
    sections.push('');
    sections.push('*(Strategi 2: Pemenuhan Sarpras Wilayah tidak diaktifkan. Inventaris sarpras mengikuti alokasi anggaran operasional standar).*');
  }
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 7: Implementasi
  sections.push('### 7. Rencana Implementasi per Strategi');
  sections.push('');
  sections.push(`Penerapan aksi strategis berbasis arah kebijakan nasional Ditjen Binalavotas (Menampilkan ${selectedStrategies.length > 0 ? 'Strategi Terpilih' : 'Semua Strategi'}):`);
  sections.push('');
  
  if (activeStrategis.length > 0) {
    activeStrategis.forEach(str => {
      const actionText = str.title.includes('Strategi 1') 
        ? `Hitung rasio kebutuhan riil instruktur di ${selectedDepartment} berdasarkan jumlah anjab dan ABK, lakukan penugasan instruktur ASN/Non-ASN baru ke lokasi.`
        : str.title.includes('Strategi 2')
        ? `Lakukan audit kelayakan workshop di wilayah ${locName}, lakukan pengadaan peralatan baru yang relevan dengan sektor ekonomi ${bpsSektor}.`
        : str.title.includes('Strategi 3')
        ? `Susun 3 kurikulum PBK baru bersama komite vokasi daerah, gandeng industri lokal untuk pelaksanaan OJT (On-the-Job Training) siswa.`
        : `Selenggarakan diklat ToT metodologi pengajaran dan sertifikasi asesor kompetensi BNSP bagi instruktur ${selectedDepartment} secara berkala.`;
      
      sections.push(`* **${str.title}** (${str.value || 'Umum'}):`);
      sections.push(`  - *Deskripsi*: ${str.description || 'Langkah taktis pemenuhan strategi vokasi.'}`);
      sections.push(`  - *Langkah Aksi Spesifik*: ${actionText}`);
      sections.push('');
    });
  } else {
    sections.push('* Tidak ada strategi spesifik yang dipilih. Menggunakan pendekatan standar.');
  }
  
  sections.push('---');
  sections.push('');
  
  // Section 8: Risiko
  sections.push('### 8. Analisis Risiko & Rencana Mitigasi');
  sections.push('');
  sections.push('Menghadapi tantangan tak terduga di lapangan, UPT dipersiapkan dengan skenario pemulihan taktis sesuai strategi terpilih:');
  sections.push('');
  
  if (activeStrategis.length > 0) {
    activeStrategis.forEach((str, index) => {
      const riskTitle = str.title.includes('Strategi 1') 
        ? 'Keterbatasan kuota alokasi formasi pegawai baru di Satpel daerah.'
        : str.title.includes('Strategi 2')
        ? 'Peralatan workshop baru cepat mengalami kerusakan atau keusangan akibat kurangnya pemeliharaan.'
        : str.title.includes('Strategi 3')
        ? 'Minimnya keterlibatan industri lokal dalam penyerapan alumni pelatihan.'
        : 'Resistensi instruktur senior terhadap keharusan sertifikasi kompetensi baru.';
      
      const riskMitigasi = str.title.includes('Strategi 1')
        ? 'Gunakan sistem asisten pengajar (co-instructor) dari alumni balai terbaik untuk mengatasi gap jangka pendek.'
        : str.title.includes('Strategi 2')
        ? 'Sertakan klausul garansi dan maintenance berkala dalam pengadaan alat, serta diklat perawatan alat bagi laboran.'
        : str.title.includes('Strategi 3')
        ? 'Bentuk Bursa Kerja Khusus (BKK) mandiri di tingkat Satpel dan adakan job fair berkala dengan asosiasi pengusaha setempat.'
        : 'Sosialisasikan insentif karir dan pemenuhan syarat naik pangkat fungsional bagi yang bersertifikat.';
      
      sections.push(`* **Skenario Risiko ${index + 1}: ${riskTitle}**`);
      sections.push(`  - *Strategi Kunci*: **${str.title}**`);
      sections.push(`  - *Mitigasi*: ${riskMitigasi}`);
      sections.push('');
    });
  } else {
    sections.push('* Analisis risiko akan disesuaikan dengan strategi yang dipilih.');
  }
  
  sections.push('---');
  sections.push('');
  
  // Section 9: Timeline
  sections.push('### 9. Timeline Implementasi');
  sections.push('');
  sections.push('Skema jadwal pelaksanaan pemenuhan kebutuhan SDM dan Sarpras UPT:');
  sections.push('');
  sections.push('| Tahap | Periode | Aksi Nyata | Penanggung Jawab (PIC) |');
  sections.push('| :--- | :---: | :--- | :--- |');
  
  if (isStr1) {
    sections.push('| **Tahap SDM (Str 1)** | Bulan 1 - 2 | Penyusunan anjab, analisis beban kerja lokal, dan penempatan formasi pegawai baru. | Kepala Kantor UPT / Satpel |');
  }
  if (isStr2) {
    sections.push('| **Tahap Sarpras (Str 2)** | Bulan 3 - 5 | Pengajuan proposal modernisasi workshop dan instalasi alat praktikum bersertifikat K3. | Kasubag Tata Usaha & Logistik |');
  }
  if (isStr3) {
    sections.push('| **Tahap Program (Str 3)** | Bulan 6 - 8 | Registrasi program PBK baru ke Ditbina Lattas dan penyusunan MoU OJT bersama industri. | Koordinator Bidang Pelatihan |');
  }
  if (isStr4) {
    sections.push('| **Tahap Kapasitas (Str 4)** | Bulan 9 - 10 | Pengiriman instruktur fungsional ke diklat metodologi mengajar (ToT) dan sertifikasi asesor. | Koordinator Instruktur |');
  }
  sections.push('| **Tahap Evaluasi** | Bulan 11 - 12 | Pengukuran keterserapan alumni di industri via SIAPkerja dan pencapaian target strategis. | Seksi Penempatan & Kemitraan |');
  
  sections.push('');
  sections.push('---');
  sections.push('');
  
  // Section 10: Skor
  sections.push(`### 10. Skor Kesiapan Operasional: ${score}/100`);
  sections.push('');
  const readinessLevel = score >= 80 ? 'PRISTINE (Sangat Siap)' : score >= 60 ? 'FLEXIBLE (Cukup Siap)' : 'CRITICAL (Perlu Perhatian)';
  sections.push(`* **Analisis Kesiapan**: UPT berada pada level kesiapan **${readinessLevel}**. Pemenuhan sarpras prioritas tinggi dan pemenuhan defisit instruktur akan mendongkrak skor kesiapan operasional menuju 100%.`);
  
  return sections.join('\n');
}
