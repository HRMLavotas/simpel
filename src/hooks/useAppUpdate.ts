/**
 * useAppUpdate
 *
 * Mendeteksi apakah ada versi aplikasi baru yang sudah di-deploy.
 * Cara kerja:
 * - Saat aplikasi pertama dibuka, simpan hash dari index.html ke sessionStorage
 * - Setiap interval (default 5 menit), fetch ulang index.html dan bandingkan hash-nya
 * - Jika berbeda → ada update baru → tampilkan notifikasi ke user
 *
 * Kenapa fetch index.html?
 * - index.html selalu berisi referensi ke file JS/CSS terbaru (dengan content hash)
 * - Vercel dikonfigurasi no-cache untuk index.html sehingga selalu fresh
 * - Tidak perlu service worker atau build plugin tambahan
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 menit
const SESSION_KEY = 'app_build_hash';

async function fetchBuildHash(): Promise<string | null> {
  try {
    // Tambahkan timestamp agar browser tidak cache request ini
    const res = await fetch(`/?_check=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Ambil semua src script — ini berisi content hash dari build terbaru
    // Contoh: <script type="module" crossorigin src="/assets/index-Bx3kP9.js">
    const matches = html.match(/src="\/assets\/[^"]+\.js"/g);
    if (!matches || matches.length === 0) return null;

    // Gabungkan semua script src sebagai fingerprint build
    return matches.sort().join('|');
  } catch {
    return null;
  }
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentHashRef = useRef<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    const latestHash = await fetchBuildHash();
    if (!latestHash) return;

    if (!currentHashRef.current) {
      // Pertama kali — simpan hash saat ini sebagai baseline
      currentHashRef.current = latestHash;
      sessionStorage.setItem(SESSION_KEY, latestHash);
      return;
    }

    if (latestHash !== currentHashRef.current) {
      setUpdateAvailable(true);
      // Hentikan polling setelah update terdeteksi
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    // Ambil hash yang tersimpan dari session (jika ada — tab yang sudah terbuka)
    const savedHash = sessionStorage.getItem(SESSION_KEY);
    if (savedHash) {
      currentHashRef.current = savedHash;
    }

    // Cek pertama kali saat mount (dengan delay kecil agar tidak ganggu load awal)
    const initialTimer = setTimeout(checkForUpdate, 3000);

    // Polling berkala
    intervalRef.current = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    // Cek juga saat tab kembali aktif (user buka tab lain lalu kembali)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(() => {
    // Hapus session hash agar setelah reload hash baru tersimpan
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }, []);

  return { updateAvailable, applyUpdate };
}
