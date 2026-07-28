// SINKRONISASI: Menggunakan URL rilis /exec Anda yang sudah terbukti aktif secara publik
const API_URL = "https://google.com"; 

let semuaMitra = [];
let userAktif = null;
let tipeLoginSekarang = 'konsumen'; 

// STRATEGI CTO: Begitu halaman HTML selesai dimuat, langsung unduh data dari Google Sheets di latar belakang
window.addEventListener('DOMContentLoaded', () => {
    if(typeof lucide !== 'undefined') lucide.createIcons();
    ambilDataAwalDariSheets();
});

async function ambilDataAwalDariSheets() {
    console.log("Memulai pengunduhan data latar belakang dari Google Sheets...");
    try {
        let response = await fetch(API_URL);
        semuaMitra = await response.json();
        console.log("Data Mitra Berhasil Disimpan:", semuaMitra);
    } catch (error) {
        console.error("Gagal memuat data awal dari Sheets:", error);
    }
}

// 1. LOGIKA LOGIN & AUTH
function setTipeLogin(tipe) {
    tipeLoginSekarang = tipe;
    document.getElementById('tab-btn-konsumen').classList.toggle('active', tipe === 'konsumen');
    document.getElementById('tab-btn-mitra').classList.toggle('active', tipe === 'mitra');
}

function prosesLogin() {
    const idInput = document.getElementById('login-id').value.trim();
    const pinInput = document.getElementById('login-pin').value.trim();

    if (!idInput || !pinInput) {
        alert("Harap isi ID dan PIN!");
        return;
    }

    // Proteksi: Jika data latar belakang belum selesai diunduh
    if (semuaMitra.length === 0) {
        alert("Aplikasi sedang menghubungkan koneksi ke database. Silakan tunggu 3 detik lalu klik masuk kembali.");
        ambilDataAwalDariSheets(); // Pemicu cadangan jika koneksi pertama sempat terputus
        return;
    }
    
    if (tipeLoginSekarang === 'mitra') {
        // PERBAIKAN KEBAL HURUF BESAR/KECIL: Mengantisipasi kesalahan ketik masukan dari pengguna
        let akunDitemukan = semuaMitra.find(m => 
            String(m.id_mitra).toUpperCase() === idInput.toUpperCase() && 
            String(m.pin_login) === pinInput
        );
        
        if (akunDitemukan) {
            userAktif = { id: akunDitemukan.id_mitra, nama: akunDitemukan.nama_mitra, role: 'mitra' };
            masukKeAplikasi();
        } else {
            alert("ID Mitra atau PIN salah! Periksa kembali data pada tabel Sheet Anda.");
        }
    } else {
        // Logika login akun Konsumen untuk fase rilis awal MVP
        if (idInput.toUpperCase().includes('USR') && pinInput === '123456') {
            userAktif = { id: idInput, nama: "Pelanggan Terhormat", role: 'konsumen' };
            masukKeAplikasi();
        } else {
            alert("Login Konsumen gagal. Gunakan ID berawalan USR dan PIN: 123456");
        }
    }
}

function masukKeAplikasi() {
    document.getElementById('halaman-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    if (userAktif.role === 'mitra') {
        document.getElementById('nama-mitra-aktif').innerText = userAktif.nama;
        pindahHalaman('mitra');
    } else {
        document.getElementById('nama-user-aktif').innerText = userAktif.nama;
        pindahHalaman('konsumen');
    }
}

function logout() {
    userAktif = null;
    location.reload();
}

// 2. NAVIGASI HALAMAN (SPA)
function pindahHalaman(tujuan) {
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-mitra').classList.remove('active');

    if (tujuan === 'konsumen') {
        document.getElementById('halaman-konsumen').style.display = 'block';
        document.getElementById('halaman-mitra').style.display = 'none';
        document.getElementById('nav-home').classList.add('active');
        tampilkanMitra(semuaMitra); // Langsung tampilkan data yang sudah ada di memori lokal
    } else if (tujuan === 'mitra') {
        if(userAktif.role !== 'mitra') {
            alert("Akses Ditolak. Anda bukan akun Mitra.");
            return;
        }
        document.getElementById('halaman-konsumen').style.display = 'none';
        document.getElementById('halaman-mitra').style.display = 'block';
        document.getElementById('nav-mitra').classList.add('active');
        muatDataDashboardMitra();
    }
}

// 3. LOGIKA PENAMPILAN DATA JASA KONSUMEN
function tampilkanMitra(daftarData) {
    let container = document.getElementById("kontainer-mitra");
    container.innerHTML = "";
    
    if(!daftarData || daftarData.length === 0) {
        container.innerHTML = "<p style='padding:16px; color:#6b7280;'>Layanan tidak ditemukan.</p>";
        return;
    }

    daftarData.forEach(mitra => {
        if(mitra.status_aktif === true || String(mitra.status_aktif).toUpperCase() === "TRUE") {
            container.innerHTML += `
                <div class="kartu-mitra" style="background:#fff; padding:16px; border-radius:12px; margin-bottom:12px; border:1px solid #e2e8f0;">
                    <div class="info-mitra">
                        <span class="badge-jasa" style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">${mitra.kategori_jasa}</span>
                        <h3 style="margin-top:8px; font-size:16px;">${mitra.nama_mitra}</h3>
                        <p style="color:#6b7280; font-size:12px;">Kota: ${mitra.lokasi_kota}</p>
                        <p class="harga-jasa" style="color:#10b981; font-weight:700; margin-top:4px;">Rp ${Number(mitra.harga).toLocaleString('id-ID')}</p>
                    </div>
                    <button class="btn-pesan" onclick="buatPesanan('${mitra.id_mitra}', ${mitra.harga})" style="background:#0284c7; color:#fff; border:none; width:100%; padding:8px; border-radius:8px; margin-top:12px; cursor:pointer;">Pesan Sekarang</button>
                </div>`;
        }
    });
    if(typeof lucide !== 'undefined') lucide.createIcons(); 
}

function filterKategori(kategori) {
    document.querySelectorAll('.category-card').forEach(card => card.classList.remove('active'));
    if(window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    if (kategori === 'Semua') {
        tampilkanMitra(semuaMitra);
    } else {
        let hasilFilter = semuaMitra.filter(mitra => String(mitra.kategori_jasa).toLowerCase() === kategori.toLowerCase());
        tampilkanMitra(hasilFilter);
    }
}

// 4. LOGIKA TRANSAKSI PEMESANAN (MENGHINDARI BLOKIR CORS)
async function buatPesanan(idMitra, hargaJasa) {
    if (!userAktif || userAktif.role !== 'konsumen') {
        alert("Silakan login sebagai Konsumen terlebih dahulu!");
        return;
    }

    const konfirmasi = confirm(`Kirim pesanan ke Mitra ini?`);
    if (!konfirmasi) return;

    const dataTransaksi = {
        id_konsumen: userAktif.id,
        id_mitra: idMitra,
        total_harga: hargaJasa
    };

    try {
        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8" // Menghindari preflight OPTIONS browser
            },
            body: JSON.stringify(dataTransaksi)
        });
        let hasil = await response.json();

        if (hasil.status === "sukses") {
            alert("Pesanan Anda sukses dicatat di database!");
        } else {
            alert("Gagal membuat pesanan: " + hasil.message);
        }
    } catch (error) {
        console.error("Error saat mencatat transaksi:", error);
        alert("Transaksi gagal terkirim.");
    }
}

// 5. DASHBOARD OPERASIONAL
async function muatDataDashboardMitra() {
    let container = document.getElementById("kontainer-pesanan-mitra");
    container.innerHTML = 'Memuat data pesanan...';
    document.getElementById("saldo-mitra").innerHTML = `Rp 750.000`;
    
    container.innerHTML = `
        <div class="card-pesanan" style="background:#fff; padding:16px; border-radius:12px; border:1px solid #e2e8f0;">
            <p><strong>Status:</strong> <span style="color:#f59e0b;">Pending</span></p>
            <p><strong>Layanan Kerja:</strong> Anda memiliki antrean operasional penanganan aktif</p>
            <button onclick="alert('Fitur pemrosesan pesanan sedang disiapkan!')" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:6px; margin-top:8px; cursor:pointer;">Terima Kerja</button>
        </div>`;
}

async function ubahStatusTokoKeSheets() {
    let isChecked = document.getElementById("status-toko-toggle").checked;
    let labelText = document.getElementById("text-status-toko");
    labelText.innerText = isChecked ? "Toko Buka" : "Toko Tutup";
    labelText.style.color = isChecked ? "#10b981" : "#6b7280";
}
