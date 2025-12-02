# Brainstorming Session Results

**Session Date:** 2025-12-01T00:55:31Z
**Facilitator:** Analyst Agent
**Participant:** Pandu

## Session Start

Backend-focused MVP exploration for campus room-booking system.

## Executive Summary

**Topic:** Sistem peminjaman ruangan kampus (jadwal, approval, verifikasi, kerusakan)

**Session Goals:** Mengupas empat masalah utama secara menyeluruh (bentrok jadwal, tidak ada notifikasi, peminjaman fiktif, laporan kerusakan) dari sudut backend untuk MVP.

**Techniques Used:** Mind Mapping (Structured), Five Whys (Deep)

**Total Ideas Generated:** 4

### Key Themes Identified:

- Backend MVP akan memakai master data internal (slot waktu + kapasitas ruangan) sehingga tidak bergantung scraping real-time dan meminimalkan bentrok
- Workflow approval butuh metadata urgensi dan indikator bentrok agar admin bisa memutuskan cepat
- Sistem harus menyimpan riwayat persetujuan + verifikasi akun untuk mencegah peminjaman fiktif
- Laporan kerusakan perlu diintegrasikan dengan status ruangan supaya tidak bisa dipesan tanpa perbaikan

## Technique Sessions

### Mind Mapping (Structured)

- Master data waktu/ruangan diisi satu kali dari referensi ruang.fit agar MVP backend tidak bergantung scraping real-time
- Workflow approval dipetakan: request masuk → antrean admin → cek bentrok → keputusan → notifikasi status + riwayat booking
- Field permintaan wajib meliputi ruangan, slot waktu, tujuan, tipe pemohon, serta **kapasitas** yang otomatis ditarik dari template referensi agar admin langsung melihat kecocokan daya tampung
- Verifikasi anti-fiktif menggunakan role-based access (SSO backlog) sehingga setiap booking bisa ditelusuri akun peminjam
- Tiket kerusakan dikaitkan langsung dengan booking aktif sehingga backend dapat menandai ruangan bermasalah sebelum kembali tersedia

## Idea Categorization

### Immediate Opportunities

- Buat master data fix untuk ruangan + slot dengan kapasitas yang terlihat jelas di kalender
- Tambahkan kolom prioritas/urgensi dan auto-warning bentrok pada antrean admin
- Hubungkan request dengan akun login (NIM/NIP) dan catatan verifikasi agar booking fiktif bisa dilacak

### Future Innovations

- Integrasi real-time ke ruang.fit via scraping/API otomatis
- Rules engine otomatis untuk auto-approve kelas akademik tertentu
- Alert proaktif ke maintenance jika ruangan lama tidak diperbaiki

### Moonshots

- Sensor IoT di ruangan untuk deteksi kerusakan otomatis
- Auto-scheduling AI yang menyeimbangkan seluruh kelas/UKM secara dinamis

### Insights and Learnings

- Satu sumber data ruangan yang stabil mengurangi bentrok secara signifikan
- Admin butuh indikator prioritas dan overlap langsung di UI supaya keputusan tidak tertunda
- Verifikasi peminjam wajib (SSO/backlog) tapi minimal role-based check sudah cukup untuk MVP
- Ticket kerusakan harus memblokir booking baru sampai ada konfirmasi perbaikan

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: TBD

- Rationale: Fokus backend harus menangani jadwal, approval, keamanan sekaligus, jadi perlu prioritas yang jelas
- Next steps: 1) Normalize master data ruang & slot 2) Bangun API booking + status workflow 3) Buat modul pelaporan kerusakan yang nge-link ke booking
- Resources needed: Backend dev, akses referensi ruang.fit, minimal DB relational
- Timeline: 2 sprint MVP (estimasi diskusi tim)

#### #2 Priority: TBD

- Rationale: Fokus backend harus menangani jadwal, approval, keamanan sekaligus, jadi perlu prioritas yang jelas
- Next steps: 1) Normalize master data ruang & slot 2) Bangun API booking + status workflow 3) Buat modul pelaporan kerusakan yang nge-link ke booking
- Resources needed: Backend dev, akses referensi ruang.fit, minimal DB relational
- Timeline: 2 sprint MVP (estimasi diskusi tim)

#### #3 Priority: TBD

- Rationale: Fokus backend harus menangani jadwal, approval, keamanan sekaligus, jadi perlu prioritas yang jelas
- Next steps: 1) Normalize master data ruang & slot 2) Bangun API booking + status workflow 3) Buat modul pelaporan kerusakan yang nge-link ke booking
- Resources needed: Backend dev, akses referensi ruang.fit, minimal DB relational
- Timeline: 2 sprint MVP (estimasi diskusi tim)

## Reflection and Follow-up

### What Worked Well

- Mind Mapping membantu mem-breakdown modul backend secara cepat
- Diskusi persona (admin/dosen/mahasiswa) bikin requirement lebih presisi

### Areas for Further Exploration

- Detail security/SSO implementation
- Integrasi notifikasi (email/SMS/push)

### Recommended Follow-up Techniques

- Question Storming untuk memastikan semua edge case booking tercakup
- SCAMPER untuk iterasi flow form peminjaman

### Questions That Emerged

- Apakah ada SLA approval resmi?
- Bagaimana proses maintenance memberi status “dalam perbaikan”?

### Next Session Planning

- **Suggested topics:** Detail tech-spec backend, definisi API booking, log audit
- **Recommended timeframe:** Setelah PRD/tech-spec selesai
- **Preparation needed:** Draft struktur DB + daftar endpoint

---

_Session facilitated using the BMAD CIS brainstorming framework_
