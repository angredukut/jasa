// PERBAIKAN: Ganti link di bawah ini dengan URL Web App Apps Script Anda yang asli!
const API_URL = "https://script.google.com/macros/s/AKfycbyn7pgda4P_bgOYA5u1bVsZwbj3lAGwEppQhsW5uHDTY2hYABMSJMIg_2NvH1HmwbkOsA/exec"; 

let semuaMitra = [];
let userAktif = null;
let tipeLoginSekarang = 'konsumen'; 

// Render ikon lucide saat halaman web selesai dimuat pertama kali
window.addEventListener('DOMContentLoaded', () => {
    if(typeof lucide !== 'undefined') lucide.createIcons();
});

// 1. LOGIKA LOGIN & AUTH DENGAN VALIDASI DATABASE
function setTipeLogin(tipe) {
    tipeLoginSekarang = tipe;
    document.getElementById('tab-btn-konsumen').classList.toggle('active', tipe === 'konsumen');
    document.getElementById('tab-btn-mitra').classList.toggle('active', tipe === 'mitra');
}

async function prosesLogin() {
    const idInput = document.getElementById('login-id').value.trim();
    const pinInput = document.getElementById('login-pin').value.trim();

    if (!idInput || !pinInput) {
        alert("Harap isi ID dan PIN!");
        return;
    }

    try {
        let response = await fetch(API_URL);
        let dataMitra = await response.json();
        
        if (tipeLoginSekarang === 'mitra') {
            // Mencari kecocokan ID Mitra dan PIN secara dinamis dari database Sheet
            // GANTI BAGIAN PENCARIAN MITRA DI APP.JS DENGAN INI:
let akunDitemukan = dataMitra.find(m => 
    String(m.id_mitra).toUpperCase() === idInput.toUpperCase() && 
    String(m.pin_login) === pinInput
);

            
            if (akunDitemukan) {
                userAktif = { id: akunDitemukan.id_mitra, nama: akunDitemukan.nama_mitra, role: 'mitra' };
                masukKeAplikasi();
            } else {
                alert("ID Mitra atau PIN salah! Periksa kembali data Anda.");
            }
        } else {
            // Logika login Konsumen (Menggunakan bypass ID 'USR' untuk kebutuhan rilis awal MVP)
            if (idInput.toUpperCase().includes('USR') && pinInput === '123456') {
                userAktif = { id: idInput, nama: "Pelanggan Terhormat", role: 'konsumen' };
                masukKeAplikasi();
            } else {
                alert("Login Konsumen gagal. Gunakan ID berawalan 'USR' dan PIN: 123456");
            }
        }
    } catch (error) {
        console.error("Gagal melakukan autentikasi:", error);
        alert("Terjadi masalah jaringan ke cloud database.");
    }
}

function masukKeAplikasi() {
    document.getElementById('halaman-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    if (userAktif.role === 'mitra') {
        // PERBAIKAN: Memperbaiki salah ketik dari userActive menjadi userAktif
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
        muatDaftarMitra();
    } else if (tujuan === 'mitra') {
        // PERBAIKAN: Melanjutkan kembali fungsi proteksi hak akses halaman yang terpotong
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

// 3. LOGIKA KONSUMEN & FILTER KATEGORI
async function muatDaftarMitra() {
    try {
        let response = await fetch(API_URL);
        semuaMitra = await response.json();
        tampilkanMitra(semuaMitra);
    } catch (error) {
        console.error("Gagal muat data:", error);
    }
}

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

// 4. LOGIKA PEMESANAN (KONEKSI METHOD POST)
// ISI PERBAIKAN FUNGSI DI FILE APP.JS
async function buatPesanan(idMitra, hargaJasa) {
    if (!userAktif || userAktif.role !== 'konsumen') {
        alert("Silakan login sebagai Konsumen terlebih dahulu!");
        return;
    }

    const konfirmasi = confirm(`Kirim pesanan ke Mitra ini?`);
    if (!confirmasi) return;

    const dataTransaksi = {
        id_konsumen: userAktif.id,
        id_mitra: idMitra,
        total_harga: hargaJasa
    };

    try {
        // PERBAIKAN KRITIS: Mengubah headers ke text/plain untuk melewati proteksi CORS browser
        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
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
        console.error("Error order:", error);
        alert("Gagal mengirim pesanan. Pastikan URL API sudah sesuai.");
    }
}

// 5. DASHBOARD OPERATIONS
async function muatDataDashboardMitra() {
    let container = document.getElementById("kontainer-pesanan-mitra");
    container.innerHTML = 'Memuat data pesanan...';
    document.getElementById("saldo-mitra").innerHTML = `Rp 750.000`;
    
    container.innerHTML = `
        <div class="card-pesanan" style="background:#fff; padding:16px; border-radius:12px; border:1px solid #e2e8f0;">
            <p><strong>Status:</strong> <span style="color:#f59e0b;">Pending</span></p>
            <p><strong>Layanan Kerja:</strong> Anda memiliki antrean penanganan aktif</p>
            <button onclick="alert('Fitur pemrosesan pesanan sedang disiapkan!')" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:6px; margin-top:8px; cursor:pointer;">Terima Kerja</button>
        </div>`;
}

async function ubahStatusTokoKeSheets() {
    let isChecked = document.getElementById("status-toko-toggle").checked;
    let labelText = document.getElementById("text-status-toko");
    labelText.innerText = isChecked ? "Toko Buka" : "Toko Tutup";
    labelText.style.color = isChecked ? "#10b981" : "#6b7280";
}
