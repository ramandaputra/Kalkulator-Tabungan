# Kalkulator Keuangan Fleksibel (50:20:20:10 & Kustom)

Aplikasi kalkulator keuangan statis berbasis web untuk mengelola dan membagi anggaran bulanan (*take-home pay*). Mendukung formula 50:20:20:10, berbagai pola finansial populer, serta persentase kustom bebas dengan visualisasi chart bulat interaktif.

## Demo Langsung (GitHub Pages)

Aplikasi dapat diakses langsung melalui:
[https://ramandaputra.github.io/Kalkulator-Tabungan/](https://ramandaputra.github.io/Kalkulator-Tabungan/)

## Fitur Utama

- **Pilihan Pola Populer & Kustom Bebas**:
  - `50 : 20 : 20 : 10` (Standar Kebutuhan, Jajan, Investasi, Dana Darurat)
  - `50 : 30 : 20 : 0` (Klasik Elizabeth Warren)
  - `40 : 20 : 20 : 20` (Proteksi & Investasi Kuat)
  - `60 : 20 : 10 : 10` (Kebutuhan Hidup Tinggi)
  - `70 : 15 : 10 : 5` (Frugal Living)
  - **Kustom**: Ketik angka persentase manual sesuai kebutuhan pribadi (0 s.d. 100%).
- **Chart Bulat Interaktif (SVG Donut Chart)**: Visualisasi proporsi yang responsif dengan efek interaktif saat kursor mengarah ke pos tertentu.
- **Validasi & Penyeimbang Otomatis**: Fitur *"Seimbangkan ke 100%"* untuk menormalkan porsi anggaran secara proporsional jika total melebihi atau kurang dari 100%.
- **Estimasi Harian & Tahunan**: Menampilkan perkiraan jatah pengeluaran per hari (30 hari), akumulasi investasi per tahun, dan target ideal dana darurat.
- **Salin Ringkasan**: Tombol sekali klik untuk menyalin rincian anggaran ke papan klip (*clipboard*).
- **Mode Gelap & Terang**: Dilengkapi pengalih tema yang tersimpan di penyimpanan lokal (*localStorage*) peramban.
- **Ringan & Statis**: Dibangun murni menggunakan HTML5, CSS3, dan Vanilla JavaScript tanpa dependensi eksternal atau koneksi database.

## Struktur Berkas

```
├── .github/
│   └── workflows/
│       └── deploy.yml    # Alur kerja otomatis deployment ke GitHub Pages
├── icon/
│   └── iicon.png         # Logo dan favicon aplikasi
├── index.html            # Halaman utama aplikasi
├── style.css             # Desain antarmuka responsif & tema
├── script.js             # Logika kalkulasi & interaktivitas
├── .gitignore
└── README.md
```

## Menjalankan Secara Lokal

Cukup unduh atau *clone* repositori ini, lalu buka berkas `index.html` langsung di peramban Anda:

```bash
git clone https://github.com/ramandaputra/Kalkulator-Tabungan.git
cd Kalkulator-Tabungan
```

Buka `index.html` dengan klik dua kali atau menggunakan ekstensi Live Server.
