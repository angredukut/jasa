// SINKRONISASI: Menggunakan URL rilis /exec yang terbukti aktif
const API_URL = "https://script.google.com/macros/s/AKfycbyn7pgda4P_bgOYA5u1bVsZwbj3lAGwEppQhsW5uHDTY2hYABMSJMIg_2NvH1HmwbkOsA/exec"; 

let semuaMitra = [];
let userAktif = null;
let tipeLoginSekarang = 'konsumen'; 

function ambilDataAwalDariSheets() {
    console.log("Memulai pengunduhan data via JSONP...");
    const script = document.createElement('script');
    script.src = `${API_URL}?callback=handleJSONPResponse`;
    script.onerror = function() { console.error("Gagal memuat skrip database."); };
    document.body.appendChild(script);
}

window.handleJSONPResponse = function(data) {
    if (Array.isArray(data)) {
        semuaMitra = data;
        console.log("Data Mitra Berhasil Disimpan dari JSONP:", semuaMitra);
        // Otomatis re-render jika sedang aktif di halaman konsumen
        if(userAktif && userAktif.role === 'konsumen') tampilkanMitra(semuaMitra);
    }
};

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

    if (semuaMitra.length === 0) {
        alert("Aplikasi sedang menghubungkan koneksi ke database. Silakan tunggu 3 detik lalu klik masuk kembali.");
        ambilDataAwalDariSheets();
        return;
    }
    
    if (tipeLoginSekarang === 'mitra') {
        let akunDitemukan = semuaMitra.find(m => 
            String(m.id_mitra).toUpperCase() === idInput.toUpperCase() && 
            String(m.pin_login) === pinInput
        );
        
        if (akunDitemukan) {
            userAktif = { id: akunDitemukan.id_mitra, nama: akunDitemukan.nama_mitra, role: 'mitra' };
            masukKeAplikasi();
        } else {
            alert("ID Mitra atau PIN salah!");
        }
    } else {
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

function pindahHalaman(tujuan) {
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-mitra').classList.remove('active');

    if (tujuan === 'konsumen') {
        document.getElementById('halaman-konsumen').style.display = 'block';
        document.getElementById('halaman-mitra').style.display = 'none';
        document.getElementById('nav-home').classList.add('active');
        tampilkanMitra(semuaMitra);
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

/* REDESIGN UI KARTU MITRA DALAM JAVASCRIPT */
function tampilkanMitra(daftarData) {
    let container = document.getElementById("kontainer-mitra");
    container.innerHTML = "";
    
    if(!daftarData || daftarData.length === 0) {
        container.innerHTML = "<p style='padding:24px; color:#6b7280; text-align:center;'>Layanan tidak ditemukan.</p>";
        return;
    }

    daftarData.forEach(mitra => {
        if(mitra.status_aktif === true || String(mitra.status_aktif).toUpperCase() === "TRUE") {
            container.innerHTML += `
                <div class="kartu-mitra">
                    <div class="mitra-card-header">
                        <span class="badge-jasa">${mitra.kategori_jasa}</span>
                        <button class="favorite-btn" aria-label="Favorit"><i data-lucide="heart"></i></button>
                    </div>
                    <div class="mitra-body">
                        <h3>
                            ${mitra.nama_mitra}
                            <i data-lucide="check-circle-2" class="verified-icon"></i>
                        </h3>
                        <div class="mitra-meta">
                            <div class="rating-box">
                                <i data-lucide="star"></i> 4.9
                            </div>
                            <span>•</span>
                            <span>${mitra.lokasi_kota}</span>
                        </div>
                    </div>
                    <div class="mitra-footer">
                        <div class="price-tag">
                            <span class="price-label">Mulai Dari</span>
                            <span class="harga-jasa">Rp ${Number(mitra.harga).toLocaleString('id-ID')}</span>
                        </div>
                        <button class="btn-pesan" onclick="buatPesanan('${mitra.id_mitra}', ${mitra.harga})">Pesan Jasa</button>
                    </div>
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
            headers: { "Content-Type": "text/plain;charset=utf-8" },
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

async function muatDataDashboardMitra() {
    let container = document.getElementById("kontainer-pesanan-mitra");
    document.getElementById("saldo-mitra").innerHTML = `Rp 750.000`;
    
    container.innerHTML = `
        <div class="kartu-mitra" style="grid-column: 1 / -1;">
            <div class="mitra-card-header">
                <span class="badge-jasa" style="background:#FEF3C7; color:#D97706;">Pending Order</span>
                <span style="font-size:0.75rem; color:#6B7280;">TRX-2026-001</span>
            </div>
            <div class="mitra-body">
                <h3>Permintaan Jasa Baru</h3>
                <p style="font-size:0.875rem; color:#6B7280; margin-top:4px;">Konsumen membutuhkan penanganan unit AC (Cuci & Freon).</p>
            </div>
            <div class="mitra-footer" style="margin-top:16px;">
                <div class="price-tag">
                    <span class="price-label">Estimasi Pendapatan</span>
                    <span class="harga-jasa">Rp 150.000</span>
                </div>
                <button class="btn-pesan" style="background:#10B981;" onclick="alert('Fitur pemrosesan pesanan sedang disiapkan!')">Terima Kerja</button>
            </div>
        </div>`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

async function ubahStatusTokoKeSheets() {
    let isChecked = document.getElementById("status-toko-toggle").checked;
    let labelText = document.getElementById("text-status-toko");
    labelText.innerText = isChecked ? "Toko Buka" : "Toko Tutup";
    labelText.style.color = isChecked ? "#10B981" : "#6B7280";
}

// Unduh data awal saat script dimuat
ambilDataAwalDariSheets();