-- Pengumuman: Update SIMPEL v2.19.0 - Fitur Baru
-- Date: 7 Mei 2026

INSERT INTO announcements (
  title,
  content,
  priority,
  start_date,
  end_date,
  is_active,
  created_by
) VALUES (
  '🎉 Update SIMPEL v2.19.0 - Fitur Baru Tersedia!',
  '<h2>Selamat datang di SIMPEL v2.19.0! 🚀</h2>

<p>Kami dengan senang hati mengumumkan pembaruan besar aplikasi SIMPEL dengan berbagai fitur baru yang akan memudahkan pekerjaan Anda:</p>

<h3>🤖 AI Chatbot - Asisten Pintar Anda</h3>
<p>Kini tersedia <strong>AI Chatbot</strong> yang dapat menjawab pertanyaan tentang data pegawai dengan cepat dan akurat!</p>
<ul>
  <li><strong>Tanya dengan bahasa sehari-hari</strong> — "Berapa jumlah PNS?", "Siapa saja Instruktur di unit saya?"</li>
  <li><strong>Jawaban instan</strong> — AI akan mencari data dan memberikan jawaban dalam hitungan detik</li>
  <li><strong>Tampilan rapi</strong> — Hasil ditampilkan dalam tabel yang mudah dibaca</li>
  <li><strong>Mengingat konteks</strong> — Dapat melakukan follow-up questions</li>
</ul>
<p>💡 <em>Akses AI Chatbot dari tombol chat di pojok kanan bawah layar!</em></p>

<h3>👥 Pegawai Non-Aktif - Kelola Status Pegawai</h3>
<p>Fitur baru untuk menandai pegawai yang sudah tidak aktif (pensiun, pindah, resign, dll):</p>
<ul>
  <li><strong>Toggle Status Aktif</strong> — Tandai pegawai sebagai aktif atau non-aktif</li>
  <li><strong>Filter Status</strong> — Pisahkan tampilan pegawai aktif dan non-aktif</li>
  <li><strong>Badge Visual</strong> — Pegawai non-aktif ditandai dengan badge merah</li>
  <li><strong>Statistik Akurat</strong> — Dashboard dan Peta Jabatan hanya menghitung pegawai aktif</li>
</ul>
<p>💡 <em>Temukan filter "Status Aktif" di halaman Data Pegawai!</em></p>

<h3>📢 Sistem Pengumuman</h3>
<p>Admin Pusat kini dapat membuat pengumuman penting yang akan muncul di banner atas dashboard:</p>
<ul>
  <li><strong>Notifikasi Real-time</strong> — Pengumuman muncul otomatis untuk semua user</li>
  <li><strong>Prioritas Warna</strong> — Penting (merah), Normal (biru), Info (hijau)</li>
  <li><strong>Penjadwalan</strong> — Set tanggal mulai dan berakhir otomatis</li>
</ul>

<h3>✨ Peningkatan Lainnya</h3>
<ul>
  <li><strong>Dashboard</strong> — Statistik lebih akurat (hanya pegawai aktif)</li>
  <li><strong>Peta Jabatan</strong> — Matching pegawai lebih presisi</li>
  <li><strong>Data Builder</strong> — Filter Status Aktif tersedia</li>
  <li><strong>Menu Info Sistem</strong> — Dokumentasi lengkap semua fitur</li>
</ul>

<h3>📚 Cara Menggunakan Fitur Baru</h3>
<ol>
  <li><strong>AI Chatbot</strong> — Klik ikon chat di pojok kanan bawah, ketik pertanyaan Anda</li>
  <li><strong>Pegawai Non-Aktif</strong> — Buka Data Pegawai → Edit pegawai → Toggle "Status Aktif"</li>
  <li><strong>Filter Status</strong> — Gunakan dropdown "Status Aktif" di atas tabel Data Pegawai</li>
  <li><strong>Info Lengkap</strong> — Buka menu "Informasi Sistem" untuk melihat semua fitur</li>
</ol>

<h3>🎯 Manfaat untuk Anda</h3>
<ul>
  <li>⚡ <strong>Lebih Cepat</strong> — AI Chatbot menjawab pertanyaan dalam hitungan detik</li>
  <li>📊 <strong>Lebih Akurat</strong> — Data statistik hanya menghitung pegawai aktif</li>
  <li>🎨 <strong>Lebih Rapi</strong> — Pegawai non-aktif terpisah dari pegawai aktif</li>
  <li>💡 <strong>Lebih Mudah</strong> — Tanya AI tanpa perlu buka banyak menu</li>
</ul>

<p><strong>Selamat mencoba fitur-fitur baru! 🎉</strong></p>

<p>Jika ada pertanyaan atau kendala, silakan hubungi Admin Pusat atau gunakan AI Chatbot untuk bantuan.</p>

<p><em>— Tim Pengembang SIMPEL</em></p>',
  'important',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true,
  (SELECT id FROM profiles WHERE email = 'admin@simpel.com' LIMIT 1)
);

-- Verify the announcement was created
SELECT 
  id,
  title,
  priority,
  start_date,
  end_date,
  is_active,
  created_at
FROM announcements
WHERE title LIKE '%v2.19.0%'
ORDER BY created_at DESC
LIMIT 1;
