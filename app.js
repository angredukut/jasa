const API_URL = "https://script.google.com/macros/s/AKfycbxjhfDKXOhXac2MFzKpORXRUn65X9Wqy5G7GF2qmgFF54-Nkwah2pzeF2LSZrdP0-9S9Q/exec"; 

let semuaMitra = [];
let userAktif = null; // Menyimpan data siapa yang sedang login
let tipeLoginSekarang = 'konsumen'; // Default tab login

// 1. LOGIKA LOGIN & AUTH
function setTipeLogin(tipe) {
    tipeLoginSekarang = tipe;
    document.getElementById('tab-btn-konsumen').classList.toggle('active', tipe === 'konsumen');
    document.getElementById('tab-btn-mitra').classList.toggle('active', tipe === 'mitra');
}

async function prosesLogin() {
    const idInput = document.getElementById('login-id').value;
    const pinInput = document.getElementById('login-pin').value;

    if (!idInput || !pinInput) {
        alert("Harap isi ID dan PIN!");
        return;
    }

    // Simulasi Login (Nanti bisa ditarik dari Google Sheets)
    // Jika ID mengandung 'MITRA', paksa masuk ke mode mitra
    if (tipeLoginSekarang === 'mitra' && idInput.includes('MITRA')) {
        userAktif = { id: idInput, nama: "Owner " + idInput, role: 'mitra' };
        masukKeAplikasi();
    } else if (tipeLoginSekarang === 'konsumen' && idInput.includes('USR')) {
        userAktif = { id: idInput, nama: "Pelanggan", role: 'konsumen' };
        masukKeAplikasi();
    } else {
        alert("ID tidak sesuai dengan kategori login! (Gunakan USR-xxx atau MITRA-xxx)");
    }
}

function masukKeAplikasi() {
    document.getElementById('halaman-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    if (userAktif.role === 'mitra') {
        document.getElementById('nama-mitra-aktif').innerText = userAktif.id;
        pindahHalaman('mitra');
    } else {
        document.getElementById('nama-user-aktif').innerText = userAktif.nama;
        pindahHalaman('konsumen');
    }
}

function logout() {
    userAktif = null;
    location.reload(); // Cara termudah reset state SPA
}

// 2. NAVIGASI HALAMAN (SPA)
function pindahHalaman(tujuan) {
    // Reset Active Class
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-mitra').classList.remove('active');

    if (tujuan === 'konsumen') {
        document.getElementById('halaman-konsumen').style.display = 'block';
        document.getElementById('halaman-mitra').style.display = 'none';
        document.getElementById('nav-home').classList.add('active');
        muatDaftarMitra();
    } else if (tujuan === 'mitra') {
        // Proteksi: Hanya role mitra yang bisa buka dashboard
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

// 3. LOGIKA KONSUMEN
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
    daftarData.forEach(mitra => {
        if(mitra.status_aktif === true || mitra.status_aktif === "TRUE") {
            container.innerHTML += `
                <div class="kartu-mitra">
                    <div class="info-mitra">
                        <span class="badge-jasa">${mitra.kategori_jasa}</span>
                        <h3>${mitra.nama_mitra}</h3>
                        <p class="harga-jasa">Rp ${Number(mitra.harga).toLocaleString('id-ID')}</p>
                    </div>
                    <button class="btn-pesan" onclick="buatPesanan('${mitra.id_mitra}', ${mitra.harga})">Pesan</button>
                </div>`;
        }
    });
}

// 4. LOGIKA DASHBOARD MITRA
async function muatDataDashboardMitra() {
    let container = document.getElementById("kontainer-pesanan-mitra");
    container.innerHTML = 'Memuat data pesanan...';

    try {
        // Simulasi filter data berdasarkan ID Mitra yang sedang login
        let saldoTotal = 750000; 
        document.getElementById("saldo-mitra").innerHTML = `Rp ${saldoTotal.toLocaleString('id-ID')}`;

        container.innerHTML = `
            <div class="card-pesanan">
                <div class="pesanan-header">
                    <span class="id-tx">TX-99012</span>
                    <span class="status-badge pending">Masuk</span>
                </div>
                <p><strong>Pelanggan:</strong> Budi Santoso</p>
                <p><strong>Layanan:</strong> Servis Rutin</p>
                <button class="btn-selesai-kerja" onclick="alert('Pesanan Selesai!')">Tandai Selesai</button>
            </div>`;
    } catch (error) {
        container.innerHTML = 'Gagal memuat data.';
    }
}

// Perbaikan typo "letisChecked" yang ada di file Anda sebelumnya
async function ubahStatusTokoKeSheets() {
    let isChecked = document.getElementById("status-toko-toggle").checked;
    let labelText = document.getElementById("text-status-toko");
    
    labelText.innerText = isChecked ? "Toko Buka" : "Toko Tutup";
    labelText.style.color = isChecked ? "#10b981" : "#6b7280";

    // Fungsi Fetch POST ke GAS untuk update status_aktif di Sheet
    console.log("Status toko untuk " + userAktif.id + " diubah ke: " + isChecked);
}