const API_URL = "https://script.google.com/macros/s/AKfycbzkgdnx3uTePnwWonbqyWKHcQQswQp3E6A4gTyloEzze7wqURvlV24zSx-hPO-NftoP/exec"; 
const ID_MITRA_SAYA = "MITRA-001"; // ID simulasi login mitra Anda saat ini

let semuaMitra = [];

// 1. FUNGSI NAVIGASI HALAMAN (SPA)
function pindahHalaman(tujuan) {
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-mitra').classList.remove('active');

    if (tujuan === 'konsumen') {
        document.getElementById('halaman-konsumen').style.display = 'block';
        document.getElementById('halaman-mitra').style.display = 'none';
        document.getElementById('nav-home').classList.add('active');
        muatDaftarMitra();
    } else if (tujuan === 'mitra') {
        document.getElementById('halaman-konsumen').style.display = 'none';
        document.getElementById('halaman-mitra').style.display = 'block';
        document.getElementById('nav-mitra').classList.add('active');
        muatDataDashboardMitra();
    }
}

// 2. LOGIKA SISI KONSUMEN (TAMPILKAN MITRA & BELI)
async function muatDaftarMitra() {
    try {
        let response = await fetch(API_URL);
        semuaMitra = await response.json();
        tampilkanMitra(semuaMitra);
    } catch (error) {
        console.error("Gagal terkoneksi ke Apps Script:", error);
        document.getElementById("kontainer-mitra").innerHTML = `<div class="skeleton-loading" style="color: red;">Gagal memuat data. Periksa kembali API URL Anda.</div>`;
    }
}

function tampilkanMitra(daftarData) {
    let container = document.getElementById("kontainer-mitra");
    container.innerHTML = "";

    if(daftarData.length === 0) {
        container.innerHTML = '<div class="skeleton-loading">Tidak ada mitra tersedia.</div>';
        return;
    }

    daftarData.forEach(mitra => {
        if(mitra.status_aktif === true || mitra.status_aktif === "True" || mitra.status_aktif === "TRUE") {
            container.innerHTML += `
                <div class="kartu-mitra">
                    <div class="info-mitra">
                        <span class="badge-jasa">${mitra.kategori_jasa}</span>
                        <h3>${mitra.nama_mitra}</h3>
                        <p class="harga-jasa">Rp ${Number(mitra.harga).toLocaleString('id-ID')}</p>
                    </div>
                    <button class="btn-pesan" onclick="buatPesanan('${mitra.id_mitra}', ${mitra.harga})">Pesan</button>
                </div>
            `;
        }
    });
}

function filterKategori(kategori) {
    document.querySelectorAll('.category-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (kategori === 'Semua') {
        tampilkanMitra(semuaMitra);
    } else {
        let hasilFilter = semuaMitra.filter(m => m.kategori_jasa.toLowerCase().includes(kategori.toLowerCase()));
        tampilkanMitra(hasilFilter);
    }
}

async function buatPesanan(idMitra, harga) {
    const konfirmasi = confirm(`Konfirmasi pemesanan jasa senilai Rp ${harga.toLocaleString('id-ID')}?`);
    if (!konfirmasi) return;

    const dataTransaksi = {
        id_user: "USR-001",
        id_mitra: idMitra,
        total_bayar: harga
    };

    try {
        let response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(dataTransaksi)
        });
        let hasil = await response.json();
        if(hasil.status === "Sukses") {
            alert("Pesanan Berhasil dibuat!");
        }
    } catch (error) {
        alert("Gagal mengirim pesanan.");
    }
}

// 3. LOGIKA SISI DASHBOARD MITRA
async function muatDataDashboardMitra() {
    let container = document.getElementById("kontainer-pesanan-mitra");
    container.innerHTML = '<div class="skeleton-loading">Memuat data pesanan toko...</div>';

    try {
        // Pada aplikasi nyata, kita akan mengambil data riwayat transaksi khusus ID Mitra ini.
        // Untuk MVP saat ini, data ditarik global lalu difilter di sisi client.
        let response = await fetch(API_URL);
        let dataGlobal = await response.json();
        
        // Asumsi data transaksi dikirim dalam format JSON yang sama atau sheet khusus.
        // Sementara kita tampilkan simulasi antrean statis berdasarkan ID_MITRA_SAYA agar dashboard terisi visualnya.
        let saldoTotal = 450000; // Contoh kalkulasi saldo internal sementara
        document.getElementById("saldo-mitra").innerHTML = `Rp ${saldoTotal.toLocaleString('id-ID')}`;

        container.innerHTML = `
            <div class="card-pesanan">
                <div class="pesanan-header">
                    <span class="id-tx">TX-17198273</span>
                    <span class="status-badge pending">Pending</span>
                </div>
                <p><strong>Layanan:</strong> Servis AC Cuci Rumah</p>
                <p><strong>Pelanggan:</strong> Budi (081234567xx)</p>
                <p><strong>Pendapatan:</strong> Rp 75.000</p>
                <button class="btn-selesai-kerja" onclick="selesaikanPesanan('TX-17198273')">Tandai Selesai Kerja</button>
            </div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="skeleton-loading">Gagal memuat dashboard. Hubungi admin.</div>';
    }
}

function ubahStatusToko() {
    letisChecked = document.getElementById("status-toko-toggle").checked;
    let labelText = document.getElementById("text-status-toko");
    
    if(isChecked) {
        labelText.innerText = "Toko Buka";
        labelText.style.color = "#10b981";
        // Di sini nanti bisa ditambahkan fungsi FETCH POST ke Apps Script untuk ubah status_aktif jadi TRUE di Sheet Mitra
    } else {
        labelText.innerText = "Toko Tutup";
        labelText.style.color = "#6b7280";
        // Di sini fungsi FETCH POST untuk ubah status_aktif jadi FALSE di Sheet Mitra
    }
}

function selesaikanPesanan(idTx) {
    alert(`Pesanan ${idTx} berhasil diselesaikan. Dana ditambahkan ke saldo utama.`);
    muatDataDashboardMitra();
}

function tarikDana() {
    alert("Permintaan penarikan dana berhasil dikirim! Admin akan memproses ke rekening bank Anda dalam 1x24 jam.");
}

// Load default halaman konsumen di awal
window.onload = muatDaftarMitra;