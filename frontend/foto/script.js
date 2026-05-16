// ==================== LOGIN SYSTEM ====================
// Cek login status
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}


//  ======= JANTUNG =======
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing app...');
    
    // Update user display name
    const userDisplayName = localStorage.getItem('userDisplayName') || 'User';
    const displayElement = document.getElementById('userDisplayName');
    if (displayElement) {
        displayElement.textContent = userDisplayName;
    }
    
    // Initialize dark mode
    initDarkMode();
    
    // Setup navigation berdasarkan role
    setupNavigationBasedOnRole();
    
    // Load data gamepass
    loadGamepassData();
    
    // FORCE RESET STATE SEBELUM LOAD - Pastikan keduanya kosong
    currentActiveMap = '';
    selectedGamepass = null;
    selectedItems = [];
    
    currentActiveMapReseller = '';
    selectedGamepassReseller = null;
    selectedItemsReseller = [];
    
    // Clear semua storage
    clearAllGamepassStorage();
    
    // Load kedua tab - PASTI KOSONG
    loadGiftGamepass();
    loadResellerGamepass();
    
    // Setup vilog protection
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'floppa' || !userRole) {
        setupVilogProtection();
    }
    
    // Load konten berdasarkan role
    const currentRole = localStorage.getItem('userRole');
    
    if (currentRole !== 'floppa') {
        loadTemplates();
        loadPanduan();
        loadFormulir();
        setupEventListeners();
        setupTaxCalculator();
    } else {
        setupTabEventListeners();
        loadVilog();
    }
    
    console.log('✅ App initialization completed - Both tabs forced to empty state');
});

function setupNavigationBasedOnRole() {
    const userRole = localStorage.getItem('userRole');
    const navTabs = document.querySelector('.nav-tabs');
    
    if (!navTabs) return;
    
    console.log('Setting up navigation for role:', userRole);
    
    // Reset navigation
    navTabs.innerHTML = '';
    
    let defaultTab = 'templates'; // Default untuk admin dan cs
    
    switch(userRole) {
        case 'admin': // Dits - Akses penuh, default Template Pesan
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="templates">Template Pesan</div>
                <div class="nav-tab" data-tab="panduan">Panduan</div>
                <div class="nav-tab" data-tab="formulir">Formulir</div>
                <div class="nav-tab" data-tab="tools">Tools</div>
                <div class="nav-tab" data-tab="vilog">Vilog</div>
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
            `;
            defaultTab = 'templates';
            break;
            
        case 'cs': // CS - Tidak ada vilog, default Template Pesan
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="templates">Template Pesan</div>
                <div class="nav-tab" data-tab="panduan">Panduan</div>
                <div class="nav-tab" data-tab="formulir">Formulir</div>
                <div class="nav-tab" data-tab="tools">Tools</div>
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
            `;
            defaultTab = 'templates';
            break;
            
        case 'floppa': // Floppa - Hanya vilog, langsung aktif
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="vilog">Vilog</div>
            `;
            defaultTab = 'vilog';
            break;

        case 'suci': // Suci - Hanya Gift Gamepass
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
            `;
            defaultTab = 'giftgamepass';
            break;
            
        default:
            // Fallback untuk user lama tanpa role
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="templates">Template Pesan</div>
                <div class="nav-tab" data-tab="panduan">Panduan</div>
                <div class="nav-tab" data-tab="formulir">Formulir</div>
                <div class="nav-tab" data-tab="tools">Tools</div>
                <div class="nav-tab" data-tab="vilog">Vilog</div>
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
            `;
            defaultTab = 'templates';
    }
    
    // Setup event listeners untuk tab baru
    setupTabEventListeners();
    
    // Aktifkan tab default berdasarkan role
    activateTab(defaultTab);
}

function activateTab(tabId) {
    console.log('Activating tab:', tabId);
    
    // Non-aktifkan semua tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Aktifkan tab yang dipilih
    const tab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);
    
    if (tab) {
        tab.classList.add('active');
        console.log('Tab activated:', tabId);
    }
    
    if (tabContent) {
        tabContent.classList.add('active');
        console.log('Tab content activated:', tabId);
    }
}

function setupTabEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Jangan simpan state apapun saat pindah tab
            // Biarkan user memilih manual setiap kali
            
            activateTab(tabId);
            resetSearch();
        });
    });
}

// ==================== DARK MODE TOGGLE ====================
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    if (!themeToggle || !themeIcon) {
        console.log('Theme toggle elements not found, retrying...');
        setTimeout(initDarkMode, 100);
        return;
    }
    
    console.log('Theme toggle found, initializing...');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeIcon.textContent = '☀️';
        themeToggle.title = 'Switch to Light Mode';
    } else {
        document.body.classList.remove('dark');
        themeIcon.textContent = '🌙';
        themeToggle.title = 'Switch to Dark Mode';
    }
    
    // Toggle theme
    themeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark');
        
        if (isDark) {
            themeIcon.textContent = '☀️';
            themeToggle.title = 'Switch to Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.textContent = '🌙';
            themeToggle.title = 'Switch to Dark Mode';
            localStorage.setItem('theme', 'light');
        }
        
        console.log('Theme toggled to:', localStorage.getItem('theme'));
    });
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('vilogUnlocked');
    window.location.href = 'login.html';
}

// ==================== DATA HARGA MAYOBLOX ====================
const hargaMayoblox = {
    po: {
        name: "Robux PO (Via Gamepass)",
        rates: {
            100: 14000,
            200: 28000,
            300: 42000,
            400: 56000,
            500: 70000,
            1000: 140000,
            2000: 280000
        },
        calculate: function(robux) {
            return Math.round(robux * 140);
        }
    },
    login: {
        name: "Robux Via Login", 
        rates: {
            100: 17000,
            200: 34000,
            300: 51000,
            400: 68000,
            500: 85000,
            1000: 170000,
            2000: 340000
        },
        calculate: function(robux) {
            return Math.round(robux * 170);
        }
    }
};

// ==================== FUNGSI KALKULATOR HARGA ====================
function hitungHarga() {
    const jumlah = parseInt(document.getElementById('jumlah-robux-calc').value);
    const robuxType = document.querySelector('input[name="robux-type"]:checked').value;
    
    if (!jumlah || jumlah < 100) {
        alert('Masukkan jumlah Robux yang valid! Minimum 100 Robux.');
        return;
    }
    
    const hargaData = hargaMayoblox[robuxType];
    let totalHarga;
    
    if (hargaData.rates[jumlah]) {
        totalHarga = hargaData.rates[jumlah];
    } else {
        totalHarga = hargaData.calculate(jumlah);
    }
    
    const hasilDiv = document.getElementById('hasil-hitung');
    hasilDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 1.2rem; margin-bottom: 10px;">
                <strong>${jumlah.toLocaleString()} Robux</strong>
            </div>
            <div style="font-size: 1.5rem; color: var(--pink-dark); margin-bottom: 10px;">
                <strong>Rp ${totalHarga.toLocaleString('id-ID')}</strong>
            </div>
            <div style="color: var(--muted); font-size: 0.9rem;">
                ${hargaData.name}
            </div>
            <div style="margin-top: 15px; padding: 10px; background: rgba(249, 180, 199, 0.1); border-radius: 8px;">
                <small>
                    <strong>💡 Info:</strong><br>
                    ${robuxType === 'po' 
                        ? '🛒 PO: Estimasi 6-9 jam (maks 1x24 jam)' 
                        : '🔐 Via Login: Proses lebih cepat'}
                </small>
            </div>
        </div>
    `;
    hasilDiv.style.display = 'block';
}

// ==================== DATA TEMPLATES ====================
const templates = {
    "followup-bukti": {
        title: "Follow Up & Permintaan Bukti",
        content: `Supaya mimin bisa bantu follow up masalah kakak, mohon kirimkan:
- Kalau web, Screenshot invoice dari web mayoblox.com
- Kalau tele, Screenshoot chat dan bukti pembayaran

Untuk yang order via gamepass
- Screenshot bagian Pending dari roblox.com/transactions
- Pastikan tipe transaksi diganti ke Penjualan Barang / Sales of Goods ya kak 😊`
    },
    "estimasi-normal": {
        title: "Estimasi Vilog",
        content: `Untuk Vilog estimasi normal 6-9 jam ya ka
Kalau ada kendala/antrian panjang: maksimal 1x24 jam
Karena orderan membludak jadi agak delay, Jika dalam 1x24 jam tidak ada update, mimin bantu langsung ke pusat ya kak`
    },

    "probgp": {
        title: "Untuk Problem Gamepass",
        content: `Hai sobat Mayo! ✨
Mohon maaf ya kalau kamu lagi mengalami kendala saat jajan bobux lewat gamepass. Saat ini Roblox sedang melakukan perbaikan server, jadi beberapa place dan gamepass belum bisa terdeteksi dengan baik.

Tapi jangan khawatir! 💫
Kamu masih bisa jajan seperti biasa lewat via login untuk sementara waktu sampai sistem Roblox kembali normal.
Terima kasih atas pengertiannya ya, sobat Mayo 💛`
    },

    "sudah di forward": {
        title: "Sudah Di Forward", 
        content: `Sudah mimin forward ke pusat ya, ditunggu 1-2 harian proses untuk dipending, jika sudah pending chat mimin lagi ya kak`
    },
    "konfirmasi-proses": {
        title: "Konfirmasi Sedang Diproses",
        content: `Oke kak, mimin bantu forward ke pusat ya 
Mohon ditunggu karna orderan lagi rame banget
Mimin usahain proses secepatnya ya kak 🙏`
    },
    "pesan-sabar": {
        title: "Buat Kode Eror",
        content: `Yang penting kakak udah isi data dengan benar dan transfernya masuk, orderan tetap tercatat dan akan di proses ya kak`
    },
    "high-demand": {
        title: "Info High Demand",
        content: `Ditunggu ya kakak, kami sedang high demand, antriannya membludak. Jika sudah bayar dan kelengkapan untuk di login sudah lengkap maka ditunggu saja 🙏☺`
    },
    "followup-24jam": {
        title: "Follow Up Setelah 24 Jam",
        content: `Jika dalam 1×24 jam belum ada perubahan, kakak bisa konfirmasi lagi ke mimin yaa biar kita bantu proses lebih lanjut.`
    },
    "peringatan-akun": {
        title: "Peringatan Untuk Akun", 
        content: `Akunnya boleh sambil dimainin, yang gak boleh itu pencet LOG OUT ALL DEVICE / KELUARKAN SEMUA PERANGKAT`
    },
    "ucapan-terimakasih": {
        title: "Ucapan Terima Kasih",
        content: `Terimakasih sudah order di mayoblox, ditunggu orderan berikutnya ^_^`
    },
    "followup-masalah": {
        title: "Follow Up Masalah",
        content: `Mimin minta maaf ya kak atas ketidaknyamanannya 🙏
Laporan kakak sudah diteruskan ke pusat dan sedang diinvestigasi, terutama untuk masalah yang melebihi estimasi vilog.
Mohon kesabarannya ya kak, nanti akan mimin update lagi begitu ada progres ✨
Kalau tiba-tiba pending kakak muncul, tolong kabari kami juga ya 🙏`
    }
};

// ==================== DATA PANDUAN ====================
const panduan = {
    "panduan-pending": {
        title: "Panduan Cek Pending",
        content: `Cara cek pending Robux:
1. Buka roblox.com/transactions
2. Kalo belum login, login dulu
3. Pastikan tipe transaksi diganti ke Penjualan Barang / Sales of Goods ya kak 😊
4. Screenshot bagian pending, lalu kirim ke mimin 📸`
    },
    "panduan-pending-tidak-kelihatan": {
        title: "Panduan Cek Pending Tidak Kelihatan",
        content: `Cara cek pending Robux:
1. Buka roblox.com/transactions
2. Kalo belum login, login dulu ya kak
3. Klik titik tiga di pojok kanan atas, lalu aktifkan Mode Desktop
   - Kalau tidak muncul, buka pengaturan browser → scroll ke bawah → aktifkan Mode Desktop
4. Kembali ke halaman roblox.com/transactions
5. Pastikan tipe transaksi diganti ke Penjualan Barang / Sales of Goods ya kak 😊
6. Screenshot bagian pending, lalu kirim ke mimin ya kak 📸`
    },
    "cek-pending-masuk": {
        title: "Cara Cek Kapan Robux Pending Masuk",
        content: `Cara cek kapan pending robux masuk:
1. Buka roblox.com/transactions 
2. Pastikan tipe transaksi diganti ke Penjualan Barang / Sales of Goods ya kak 😊
3. Lihat tanggal di pojok kiri — itu adalah tanggal transaksi pending.
4. Tambahkan 5 hari dari tanggal tersebut untuk mengetahui estimasi tanggal Robux akan masuk otomatis.
5. Di pojok kanan akan terlihat jumlah Robux dan ikon ⏰ (jam). Robux itulah yang akan masuk ke akun kamu setelah masa pending selesai.

📌 Contoh:
Jika di transaksi tertulis 1/10/2025 15:00, maka Robux akan otomatis masuk ke akun kamu pada 6/10/2025 15:00.
Jadi tinggal ditunggu saja ya kak, Robux akan masuk secara otomatis sesuai jadwal tersebut 😊`
    },
    "info-promo": {
        title: "Info Promo",
        content: `Promo Channel WhatsApp:
https://whatsapp.com/channel/0029VapYTiZGOj9ukXwlIu0Z

Jangan lupa follow untuk info promo terbaru! 🎉`
    },
    "cara-order": {
        title: "Cara Order",
        content: `Cara Order:

🛒 Robux via Gamepass 
→ Order lewat mayoblox.com

🔐 Robux via Login 
→ Order lewat @mayoblox (Telegram)

🎁 Gift Gamepass (Bloxfruits, dll) 
→ Order lewat @mayopass

Pilih sesuai kebutuhan kakak ya~ 😊`
    },
    "info-pembelian": {
        title: "Info Pembelian",
        content: `Untuk pembelian kakak bisa langsung hubungi admin ya:
- Robux Via Gamepass dan via login order lewat mayoblox.com
- Robux Via Login order lewat tele @mayoblox
- Gift Gamepass seperti bloxfruits, grow a garden dan lainnya order lewat tele @mayopass`
    },
    "pembelian-instan": {
        title: "Info Pembelian Instan",
        content: `Untuk pembelian Bobux instan pending (bukan preorder), biasanya pending Robux akan langsung muncul di roblox.com/transactions sekitar 10 menit setelah pembayaran.
Kalau belum muncul setelah itu, langsung chat IG @mayoblox untuk complain agar cepat diproses ⚡`
    },
    "penutupan-sementara": {
        title: "Info Penutupan Sementara",
        content: `SobatMayo, terima kasih atas antusiasnya pada produk Robux via Login 🙏
Saat ini antrian sudah sangat panjang, jadi MinMayo close order sementara untuk menyelesaikan pesanan yang ada.
Kalau chat ini sudah MinMayo hapus, artinya sudah open order lagi 💖`
    },
    "keuntungan-premium": {
        title: "Keuntungan Roblox Premium",
        content: `Untuk Creator:
- Dapat Robux dari pemain Premium yang main di game kamu 💰
- Bagi hasil lebih tinggi (70% vs 10%)
- Akses Creator Hub untuk jualan item 👕👖

Untuk Pemain:
- Dapat Robux bulanan dari langganan 💵
- Bonus 10% saat beli Robux 🎉
- Bisa tukar item eksklusif 🧢
- Item khusus & diskon di Avatar Shop 🛍️
- Fitur Premium di beberapa game (boost, hadiah, dll) ⚔️`
    }
};

// ==================== DATA FORMULIR ====================
const formulir = {
    "form-login-tele": {
        title: "Form Transaksi Login (Telegram)",
        content: `Kakak memilih jajan via Login yaa~ 🔐✨
Supaya MinMayo bisa bantu cek & proses lebih cepat, mohon isi data berikut:

📅 Tanggal pembayaran (dan jam):
👤 Username Roblox:
💬 Username Telegram: @
💸 Jumlah pembelian Robux:

Setelah data lengkap, MinMayo langsung bantu cek ya~ 😊💙`
    },
    "form-login-web": {
        title: "Form Transaksi Login (Web)",
        content: `Kakak memilih jajan via Login yaa~ 🔐✨
Supaya MinMayo bisa bantu cek & proses lebih cepat, mohon isi data berikut:

📅 Tanggal pembayaran (dan jam):
👤 Username Roblox:
💬 Invoice web:
💸 Jumlah pembelian Robux:

Setelah data lengkap, MinMayo langsung bantu cek ya~ 😊💙`
    },
    "form-laporan-error": {
        title: "Form Laporan Error System",
        content: `Error System
USN:
ORDER ID:
TIPE ORDER:
Tanggal order:`
    },
    "form-laporan-pending": {
        title: "Form Laporan Pending",
        content: `Pending
USN:
ORDER ID:
TIPE ORDER:
Tanggal order:`
    },
    "form-laporan-robux-hilang": {
        title: "Form Laporan Robux Hilang",
        content: `Robux Hilang
USN:
ORDER ID:
TIPE ORDER:
Tanggal order:`
    },
    "form-laporan-log-proses": {
        title: "Form Laporan Log Proses",
        content: `Log Proses
USN:
ORDER ID:
TIPE ORDER:
Tanggal order:`
    }
};

// ==================== DATA VILOG ====================
const vilog = {
    "bisaa": {
        title: "Exact Match ",
        content: `Street: 475 S Imperial Ave
City: Burns
State: Oregon
ZIP Code: 97720-2349`
    },
     "bisa": {
        title: "Exact Match 2",
        content: `Street: 1000 SW Broadway
City: Portland
State: OR
ZIP Code: 97205-3035`
    },
    "anyak": {
        title: "Exact Match 3",
        content: `Street: 1000 ELM ST
City: MANCHESTER
State: New Hampshire
ZIP Code: 03101-1866`
    },
    "anyaks": {
        title: "Banyak",
        content: `OREGON:
- 1000 SW Broadway, Portland, OR 97205-3035
- 800 SW 5th Ave, Portland, OR 97205-2008  
- 511 SW 10th Ave, Portland, OR 97205-2501

NEW HAMPSHIRE:
- 1100 Elm St, Manchester, NH 03101-1867
- 1000 Hanover St, Manchester, NH 03101-5201

DELAWARE:
- 1000 N King St, Wilmington, DE 19801-3516
- 1101 N Market St, Wilmington, DE 19801-1121

MONTANA:
- 100 N Last Chance Gulch, Helena, MT 59601-4102

ALASKA:
- 1000 Glacier Hwy, Juneau, AK 99801-7804`
    },
    "datas": {
        title: "Banyak 2",
        content: `100% USPS VERIFIED EXACT MATCH yang pasti auto-save:

🏔️ OREGON (100% USPS VERIFIED)

Street: 1000 SW Broadway
City: Portland
State: OR
ZIP Code: 97205-3035

Street: 1211 SW 5th Ave
City: Portland
State: OR  
ZIP Code: 97204-9701

Street: 511 SW 10th Ave
City: Portland
State: OR
ZIP Code: 97205-2501

🗻 NEW HAMPSHIRE (100% USPS VERIFIED)

Street: 1000 Elm St
City: Manchester
State: NH
ZIP Code: 03101-1866

Street: 1100 Elm St
City: Manchester  
State: NH
ZIP Code: 03101-1867

Street: 795 Elm St
City: Manchester
State: NH
ZIP Code: 03101-1803

🏛️ DELAWARE (100% USPS VERIFIED)

Street: 1000 N King St
City: Wilmington
State: DE
ZIP Code: 19801-3516

Street: 1101 N Market St
City: Wilmington
State: DE
ZIP Code: 19801-1121

🌲 MONTANA (100% USPS VERIFIED)

Street: 1000 Park Ave
City: Anaconda
State: MT
ZIP Code: 59711-3016

Street: 301 S Park Ave
City: Helena
State: MT
ZIP Code: 59601-5201

🏔️ ALASKA (100% USPS VERIFIED)

Street: 1000 Glacier Hwy
City: Juneau
State: AK
ZIP Code: 99801-7804

Street: 400 Willoughby Ave
City: Juneau
State: AK
ZIP Code: 99801-1735`
    },
};

// ==================== FUNGSI LOAD DATA ====================
function loadTemplates() {
    const container = document.getElementById('templates-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, template] of Object.entries(templates)) {
        const templateCard = document.createElement('div');
        templateCard.className = 'template-card';
        
        templateCard.innerHTML = `
            <h3>${template.title}</h3>
            <div class="template-content" id="template-${key}">${template.content}</div>
            <button class="btn btn-copy" data-target="template-${key}">Salin Template</button>
        `;
        
        container.appendChild(templateCard);
    }
}

function loadPanduan() {
    const container = document.getElementById('panduan-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, guide] of Object.entries(panduan)) {
        const guideCard = document.createElement('div');
        guideCard.className = 'template-card';
        
        guideCard.innerHTML = `
            <h3>${guide.title}</h3>
            <div class="template-content" id="panduan-${key}">${guide.content}</div>
            <button class="btn btn-copy" data-target="panduan-${key}">Salin Panduan</button>
        `;
        
        container.appendChild(guideCard);
    }
}

function loadFormulir() {
    const container = document.getElementById('formulir-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, form] of Object.entries(formulir)) {
        const formCard = document.createElement('div');
        formCard.className = 'template-card';
        
        formCard.innerHTML = `
            <h3>${form.title}</h3>
            <div class="template-content" id="form-${key}">${form.content}</div>
            <button class="btn btn-copy" data-target="form-${key}">Salin Form</button>
        `;
        
        container.appendChild(formCard);
    }
}

function loadVilog() {
    const container = document.getElementById('vilog-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [key, form] of Object.entries(vilog)) {
        const formCard = document.createElement('div');
        formCard.className = 'template-card';
        
        formCard.innerHTML = `
            <h3>${form.title}</h3>
            <div class="template-content" id="vilog-${key}">${form.content}</div>
            <button class="btn btn-copy" data-target="vilog-${key}">Salin</button>
        `;
        
        container.appendChild(formCard);
    }
    
    // Setup search untuk vilog
    const vilogSearch = document.getElementById('vilog-search');
    if (vilogSearch) {
        vilogSearch.addEventListener('input', filterVilog);
    }
}

// Fungsi search untuk vilog
function filterVilog() {
    const searchTerm = document.getElementById('vilog-search').value.toLowerCase();
    const vilogCards = document.querySelectorAll('#vilog-container .template-card');
    
    vilogCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('.template-content').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Tab Navigation - Gunakan yang baru
    setupTabEventListeners();
    
    // Copy Template
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-copy')) {
            const targetId = e.target.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const templateContent = targetElement.textContent;
                
                navigator.clipboard.writeText(templateContent).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = '✓ Disalin!';
                    e.target.style.background = 'var(--success)';
                    
                    setTimeout(() => {
                        e.target.textContent = originalText;
                        e.target.style.background = '';
                    }, 2000);
                });
            }
        }
    });

    // Search - Hanya setup jika tab tersedia dan user bukan floppa
    const userRole = localStorage.getItem('userRole');
    
    if (userRole !== 'floppa') {
        const templateSearch = document.getElementById('template-search');
        const panduanSearch = document.getElementById('panduan-search');
        const formulirSearch = document.getElementById('formulir-search');
        
        if (templateSearch) templateSearch.addEventListener('input', filterTemplates);
        if (panduanSearch) panduanSearch.addEventListener('input', filterPanduan);
        if (formulirSearch) formulirSearch.addEventListener('input', filterFormulir);
        
        // Quick Actions - Hanya setup jika tab tools tersedia
        const actionCalculator = document.getElementById('action-calculator');
        const actionTanggal = document.getElementById('action-tanggal');
        const actionTax = document.getElementById('action-tax');
        
        if (actionCalculator) {
            actionCalculator.addEventListener('click', () => {
                document.getElementById('calculator-container').style.display = 'block';
                document.getElementById('tanggal-container').style.display = 'none';
                document.getElementById('tax-container').style.display = 'none';
            });
        }
        
        if (actionTanggal) {
            actionTanggal.addEventListener('click', () => {
                document.getElementById('tanggal-container').style.display = 'block';
                document.getElementById('calculator-container').style.display = 'none';
                document.getElementById('tax-container').style.display = 'none';
            });
        }
        
        if (actionTax) {
            actionTax.addEventListener('click', () => {
                document.getElementById('tax-container').style.display = 'block';
                document.getElementById('calculator-container').style.display = 'none';
                document.getElementById('tanggal-container').style.display = 'none';
            });
        }
        
        // Kalkulator Harga - Hanya setup jika tersedia
        const hitungHargaBtn = document.getElementById('hitung-harga');
        if (hitungHargaBtn) {
            hitungHargaBtn.addEventListener('click', hitungHarga);
        }
        
        // Auto calculate - Hanya setup jika tersedia
        const robuxTypeRadios = document.querySelectorAll('input[name="robux-type"]');
        if (robuxTypeRadios.length > 0) {
            robuxTypeRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    const jumlah = document.getElementById('jumlah-robux-calc')?.value;
                    if (jumlah && jumlah >= 100) {
                        hitungHarga();
                    }
                });
            });
        }
        
        const jumlahRobuxCalc = document.getElementById('jumlah-robux-calc');
        if (jumlahRobuxCalc) {
            jumlahRobuxCalc.addEventListener('input', function() {
                const jumlah = parseInt(this.value);
                if (jumlah && jumlah >= 100) {
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(hitungHarga, 500);
                }
            });
        }
        
        // Hitung Tanggal Pending - Hanya setup jika tersedia
        const hitungTanggalBtn = document.getElementById('hitung-tanggal');
        if (hitungTanggalBtn) {
            hitungTanggalBtn.addEventListener('click', hitungTanggal);
        }
        
        // Setup Tax Calculator - Hanya setup jika tersedia
        const taxAmountInput = document.getElementById('tax-amount');
        if (taxAmountInput) {
            setupTaxCalculator();
        }
    }
}

// ==================== FUNGSI SEARCH ====================
function resetSearch() {
    const templateSearch = document.getElementById('template-search');
    const panduanSearch = document.getElementById('panduan-search');
    const formulirSearch = document.getElementById('formulir-search');
    
    if (templateSearch) templateSearch.value = '';
    if (panduanSearch) panduanSearch.value = '';
    if (formulirSearch) formulirSearch.value = '';
    
    const allCards = document.querySelectorAll('.template-card');
    allCards.forEach(card => {
        card.style.display = 'block';
    });
}

function filterTemplates() {
    const searchTerm = document.getElementById('template-search').value.toLowerCase();
    const templateCards = document.querySelectorAll('#templates-container .template-card');
    
    templateCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('.template-content').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

function filterPanduan() {
    const searchTerm = document.getElementById('panduan-search').value.toLowerCase();
    const panduanCards = document.querySelectorAll('#panduan-container .template-card');
    
    panduanCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('.template-content').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

function filterFormulir() {
    const searchTerm = document.getElementById('formulir-search').value.toLowerCase();
    const formulirCards = document.querySelectorAll('#formulir-container .template-card');
    
    formulirCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const content = card.querySelector('.template-content').textContent.toLowerCase();
        const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
        card.style.display = isVisible ? 'block' : 'none';
    });
}

// ==================== FUNGSI TOOLS LAINNYA ====================
function hitungTanggal() {
    const tanggalPendingInput = document.getElementById('tanggal-pending').value;
    
    if (!tanggalPendingInput) {
        alert('Pilih tanggal dan jam pending!');
        return;
    }
    
    const tanggalPending = new Date(tanggalPendingInput);
    const tanggalMasuk = new Date(tanggalPending);
    tanggalMasuk.setDate(tanggalPending.getDate() + 5);
    
    const options = { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const tanggalPendingFormatted = tanggalPending.toLocaleDateString('id-ID', options);
    const tanggalMasukFormatted = tanggalMasuk.toLocaleDateString('id-ID', options);
    
    const hasilDiv = document.getElementById('hasil-tanggal');
    hasilDiv.innerHTML =` <button class="copy-result-btn" onclick="copyTanggalResult()">Salin</button><strong>📅 Tanggal Pending:</strong> ${tanggalPendingFormatted}
<strong>✅ Pending Selesai:</strong> ${tanggalMasukFormatted} `;
    hasilDiv.style.display = 'block';
}

// ==================== TAX CALCULATOR ====================
function setupTaxCalculator() {
    const taxAmountInput = document.getElementById('tax-amount');
    const taxTypeRadios = document.querySelectorAll('input[name="tax-type"]');
    
    taxAmountInput.addEventListener('input', calculateTax);
    taxTypeRadios.forEach(radio => {
        radio.addEventListener('change', calculateTax);
    });
}

function calculateTax() {
    const taxAmount = parseInt(document.getElementById('tax-amount').value);
    const taxType = document.querySelector('input[name="tax-type"]:checked').value;
    const taxInfo = document.getElementById('tax-info');
    
    if (!taxAmount || taxAmount <= 0) {
        taxInfo.innerHTML = `
            <div class="info-card">
                <h4>💡 Tips & Info</h4>
                <ul>
                    <li>Roblox memotong 30% dari setiap transaksi gamepass</li>
                    <li>Untuk mendapatkan <strong>X Robux</strong>, set harga gamepass <strong>X ÷ 0.7</strong></li>
                    <li>Tax rate: <strong>30%</strong> dari harga gamepass</li>
                    <li>Penerimaan: <strong>70%</strong> dari harga gamepass</li>
                </ul>
            </div>
        `;
        return;
    }
    
    let beforeTax, afterTax;
    
    if (taxType === 'before') {
        beforeTax = taxAmount;
        afterTax = Math.floor(beforeTax * 0.7);
        
        taxInfo.innerHTML = `
            <div class="info-card">
                <h4>📊 Hasil Perhitungan</h4>
                <div class="result-item">
                    <div class="result-label">Yang akan diterima</div>
                    <div class="result-value">${afterTax.toLocaleString()} Robux</div>
                </div>
                <div class="tax-tips">
                    <strong>💡 Tips:</strong> Dengan harga gamepass <strong>${beforeTax.toLocaleString()} Robux</strong>, kamu akan mendapatkan <strong>${afterTax.toLocaleString()} Robux</strong>
                </div>
            </div>
        `;
    } else {
        afterTax = taxAmount;
        beforeTax = Math.ceil(afterTax / 0.7);
        
        taxInfo.innerHTML = `
            <div class="info-card">
                <h4>📊 Hasil Perhitungan</h4>
                <div class="result-item">
                    <div class="result-label">Kamu butuh</div>
                    <div class="result-value">${beforeTax.toLocaleString()} Robux</div>
                </div>
                <div class="tax-tips">
                    <strong>💡 Tips:</strong> Set harga gamepass <strong>${beforeTax.toLocaleString()} Robux</strong> untuk mendapatkan <strong>${afterTax.toLocaleString()} Robux</strong>
                </div>
            </div>
        `;
    }
}

// ==================== FUNGSI BANTUAN ====================
function copyTanggalResult() {
    const hasilDiv = document.getElementById('hasil-tanggal');
    if (!hasilDiv) return;
    
    const textToCopy = hasilDiv.textContent.replace('Salin', '').trim();
    
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(textToCopy);
        return;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Hasil perhitungan disalin!');
        
        const copyBtn = hasilDiv.querySelector('.copy-result-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓';
            copyBtn.style.background = 'var(--success)';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        }
    }).catch(err => {
        console.error('Gagal menyalin teks: ', err);
        fallbackCopyTextToClipboard(textToCopy);
    });
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Teks berhasil disalin!');
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showToast('Gagal menyalin teks!');
    }
    
    document.body.removeChild(textArea);
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== VILOG PIN PROTECTION ====================
const VILOG_PIN = "floppafamily";

function setupVilogProtection() {
    console.log("🛡️ Setting up vilog protection...");
    
    const vilogContainer = document.getElementById('vilog-container');
    const pinProtection = document.getElementById('vilog-pin-protection');
    
    if (!vilogContainer || !pinProtection) {
        console.error("❌ Vilog elements not found!");
        return;
    }
    
    // AUTO RESET: Selalu reset status unlock setiap page load
    localStorage.removeItem('vilogUnlocked');
    console.log("🔄 Vilog status reset on page load");
    
    // Selalu tampilkan PIN protection
    pinProtection.style.display = 'block';
    vilogContainer.style.display = 'none';
    
    // Setup toggle password
    const toggleBtn = document.getElementById('toggleVilogPin');
    const pinInput = document.getElementById('vilog-pin');
    
    if (toggleBtn && pinInput) {
        toggleBtn.addEventListener('click', function() {
            if (pinInput.type === 'password') {
                pinInput.type = 'text';
                this.innerHTML = '<span class="toggle-icon">🙈</span>';
            } else {
                pinInput.type = 'password';
                this.innerHTML = '<span class="toggle-icon">👁️</span>';
            }
            pinInput.focus();
        });
        
        // ENTER KEY SUPPORT - Tambahkan event listener untuk Enter key
        pinInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkVilogPin();
            }
        });
        
        // Auto focus ke input PIN
        pinInput.focus();
    }
}

function checkVilogPin() {
    console.log("🔐 Checking PIN...");
    
    const pinInput = document.getElementById('vilog-pin');
    const errorDiv = document.getElementById('pin-error');
    const vilogContainer = document.getElementById('vilog-container');
    const pinProtection = document.getElementById('vilog-pin-protection');
    
    if (!pinInput || !errorDiv || !vilogContainer || !pinProtection) {
        console.error("❌ Elements not found!");
        return;
    }
    
    const enteredPin = pinInput.value;
    console.log("📝 Entered PIN:", enteredPin);
    
    // Validasi PIN
    if (!enteredPin) {
        errorDiv.textContent = "❌ Masukkan PIN terlebih dahulu!";
        errorDiv.style.display = 'block';
        pinInput.focus();
        return;
    }
    
    if (enteredPin === VILOG_PIN) {
        // PIN BENAR
        console.log("✅ PIN CORRECT! Unlocking vilog...");
        localStorage.setItem('vilogUnlocked', 'true');
        pinProtection.style.display = 'none';
        vilogContainer.style.display = 'block';
        loadVilog();
        showToast("✅ PIN benar! Vilog berhasil dibuka.");
    } else {
        // PIN SALAH
        console.log("❌ PIN WRONG! Showing error...");
        errorDiv.textContent = "❌ PIN salah! Coba lagi.";
        errorDiv.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
        
        // Sembunyikan error setelah 3 detik
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// ==================== GIFT GAMEPASS DATA ====================
let gamepassData = {
    "EXPEDITION ANTARTICA": {
        rate: 110,
        items: {
            "Guide": 195,
            "Search and Rescue": 545,
            "VIP": 695,
            "Elit Pack": 395,
            "Pro Pack": 295,
            "Luxury Pack": 345,
            "Health Bottle": 125,
            "Music Backpack": 345,
            "Extra Stamina": 100,
            "Storm Googles": 100,
            "Flags": 40,
            "Flashlight": 70,
            "Backpack Colors": 50
        }
    },
    "FISH IT": {
        rate: 110,
        items: {
            "VIP": 500,
            "Pro Pack": 300,
            "Starter Pack": 150
        }
    }
};

// ==================== RESELLER DATA ====================
let resellerData = {
    "EXPEDITION ANTARTICA": {
        rate: 100, // Rate lebih murah untuk reseller
        items: {
            "Guide": 195,
            "Search and Rescue": 545,
            "VIP": 695,
            "Elit Pack": 395,
            "Pro Pack": 295,
            "Luxury Pack": 345,
            "Health Bottle": 125,
            "Music Backpack": 345,
            "Extra Stamina": 100,
            "Storm Googles": 100,
            "Flags": 40,
            "Flashlight": 70,
            "Backpack Colors": 50
        }
    },
    "FISH IT": {
        rate: 100, // Rate lebih murah untuk reseller
        items: {
            "VIP": 500,
            "Pro Pack": 300,
            "Starter Pack": 150
        }
    }
};

// Variabel untuk Reseller
let selectedGamepassReseller = null;
let selectedItemsReseller = [];
let currentActiveMapReseller = '';

// Load data dari localStorage jika ada
function loadGamepassData() {
    const saved = localStorage.getItem('gamepassData');
    if (saved) {
        gamepassData = JSON.parse(saved);
    }
    
    const savedReseller = localStorage.getItem('resellerData');
    if (savedReseller) {
        resellerData = JSON.parse(savedReseller);
    } else {
        // Jika tidak ada data reseller di localStorage, gunakan data default
        resellerData = {
            "EXPEDITION ANTARTICA": {
                rate: 100,
                items: {
                    "Guide": 195,
                    "Search and Rescue": 545,
                    "VIP": 695,
                    "Elit Pack": 395,
                    "Pro Pack": 295,
                    "Luxury Pack": 345,
                    "Health Bottle": 125,
                    "Music Backpack": 345,
                    "Extra Stamina": 100,
                    "Storm Googles": 100,
                    "Flags": 40,
                    "Flashlight": 70,
                    "Backpack Colors": 50
                }
            },
            "FISH IT": {
                rate: 100,
                items: {
                    "VIP": 500,
                    "Pro Pack": 300,
                    "Starter Pack": 150
                }
            }
        };
        saveGamepassData();
    }
}

// Save data ke localStorage
function saveGamepassData() {
    localStorage.setItem('gamepassData', JSON.stringify(gamepassData));
    localStorage.setItem('resellerData', JSON.stringify(resellerData));
}


function loadGiftGamepass() {
    console.log('🔄 Loading gift gamepass...');
    
    // PASTIKAN STATE KOSONG
    if (!currentActiveMap) {
        selectedGamepass = null;
        selectedItems = [];
    }
    
    loadGamepassMaps();
    updateGamepassView();
    
    // PASTIKAN TAMPILAN "PILIH MAP" TERLIHAT
    const noMapSelected = document.getElementById('no-map-selected');
    const itemsSection = document.getElementById('items-section');
    
    if (noMapSelected) noMapSelected.style.display = 'block';
    if (itemsSection) itemsSection.style.display = 'none';
    
    console.log('✅ Gift gamepass loaded - showing "Pilih Map" message');
}

function loadGamepassMaps() {
    const gamepasses = getGamepasses();
    const mapList = document.getElementById('map-list');
    
    if (!mapList) {
        console.error('Map list container not found!');
        return;
    }
    
    mapList.innerHTML = '';
    
    gamepasses.forEach((gamepass, index) => {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        
        // JANGAN ADA AUTO SELECT - biarkan semua map tidak aktif
        // Hanya aktif jika benar-benar diklik user
        
        mapItem.innerHTML = `
            <div class="map-info">
                <div class="map-name">${gamepass.name}</div>
                <div class="map-rate">Rate: ${gamepass.rate}</div>
            </div>
            <div class="map-actions">
                <button class="btn-edit-small" onclick="event.stopPropagation(); showEditGamepassPopup('${gamepass.name}')">✏️</button>
                <button class="btn-delete-small" onclick="event.stopPropagation(); deleteGamepass('${gamepass.name}')">🗑️</button>
            </div>
        `;
        
        mapItem.addEventListener('click', () => {
            // Hapus class active dari semua map item
            document.querySelectorAll('.map-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Tambah class active ke map yang dipilih
            mapItem.classList.add('active');
            
            // Set map yang dipilih dan RESET SELECTION
            selectedGamepass = gamepass;
            currentActiveMap = gamepass.name;
            
            // RESET SEMUA ITEM YANG DIPILIH DAN HASIL PERHITUNGAN
            selectedItems = [];
            updateSelectedItemsDisplay();
            document.getElementById('calculation-result').style.display = 'none';
            
            // Update tampilan
            updateGamepassView();
        });
        
        mapList.appendChild(mapItem);
    });
    
    // JANGAN AUTO SELECT FIRST MAP - Biarkan kosong sama seperti Reseller
    console.log('✅ Gift Gamepass maps loaded - no auto selection');
}

function getGamepasses() {
    return Object.entries(gamepassData).map(([name, data]) => ({
        name: name,
        rate: data.rate,
        items: Object.entries(data.items).map(([itemName, robux]) => ({
            name: itemName,
            robux: robux
        }))
    }));
}

function updateGamepassView() {
    const itemsSection = document.getElementById('items-section');
    const noMapSelected = document.getElementById('no-map-selected');
    const selectedMapTitle = document.getElementById('selected-map-title');
    
    if (selectedGamepass && currentActiveMap) {
        // Update judul dengan nama map yang dipilih
        selectedMapTitle.textContent = selectedGamepass.name;
        
        // Sembunyikan pesan "pilih map", tampilkan items section
        if (noMapSelected) noMapSelected.style.display = 'none';
        if (itemsSection) itemsSection.style.display = 'block';
        
        // Load items untuk map yang dipilih
        loadItemsForSelectedMap();
    } else {
        // Tampilkan pesan "pilih map", sembunyikan items section
        if (noMapSelected) noMapSelected.style.display = 'block';
        if (itemsSection) itemsSection.style.display = 'none';
        if (selectedMapTitle) selectedMapTitle.textContent = 'Pilih Map Dulu Cuy';
        
        // Reset selected items
        selectedItems = [];
        updateSelectedItemsDisplay();
        document.getElementById('calculation-result').style.display = 'none';
    }
}

function loadItemsForSelectedMap() {
    const itemsList = document.getElementById('items-list');
    
    if (!selectedGamepass || !itemsList) return;
    
    itemsList.innerHTML = '';
    
    selectedGamepass.items.forEach((item, index) => {
        const itemOption = document.createElement('div');
        itemOption.className = 'item-option';
        itemOption.innerHTML = `
            <div class="item-option-name">${item.name}</div>
            <div class="item-option-robux">${item.robux} Robux</div>
        `;
        
        itemOption.addEventListener('click', () => {
            addToSelectedItems(item.name, item.robux);
        });
        
        itemsList.appendChild(itemOption);
    });
}

function addToSelectedItems(name, robux) {
    const selectedItemsContainer = document.getElementById('selected-items');
    if (!selectedItemsContainer) return;
    
    // Tambahkan item ke array selectedItems
    selectedItems.push({
        gamepassName: selectedGamepass.name,
        itemName: name,
        robux: robux
    });
    
    updateSelectedItemsDisplay();
}

function updateSelectedItemsDisplay() {
    const container = document.getElementById('selected-items');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">🛒 Item Terpilih:</h4>
            ${selectedItems.length > 0 ? 
                `<button class="btn btn-small" onclick="clearAllSelectedItems()" style="background: var(--danger); padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                    🗑️ Batalkan
                </button>` : 
                ''
            }
        </div>
    `;
    
    if (selectedItems.length === 0) {
        container.innerHTML += '<div style="color: var(--muted); font-style: italic; text-align: center; padding: 1rem;">Belum ada item terpilih</div>';
        return;
    }
    
    selectedItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.innerHTML = `
            <div class="selected-item-name">${item.itemName}</div>
            <div class="selected-item-robux">${item.robux} Robux</div>
            <button class="remove-item" onclick="removeSelectedItem(${index})" title="Hapus item">×</button>
        `;
        container.appendChild(itemDiv);
    });
}


function removeSelectedItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
        item.remove();
    }
}

function calculateTotal() {
    if (!selectedGamepass) {
        showToast('Pilih map terlebih dahulu!', 'error');
        return;
    }
    
    if (selectedItems.length === 0) {
        showToast('Pilih minimal satu item!', 'error');
        return;
    }
    
    // VALIDASI: Pastikan semua item yang dipilih sesuai dengan map yang aktif
    const validItems = selectedItems.filter(item => item.gamepassName === selectedGamepass.name);
    
    if (validItems.length === 0) {
        showToast('Item yang dipilih tidak sesuai dengan map yang aktif!', 'error');
        selectedItems = [];
        updateSelectedItemsDisplay();
        return;
    }
    
    // Jika ada item yang tidak sesuai, reset selection
    if (validItems.length !== selectedItems.length) {
        selectedItems = validItems;
        updateSelectedItemsDisplay();
    }
    
    let totalRobux = 0;
    let calculationDetails = '<h4 style="margin-bottom: 1rem; color: var(--pink-dark);">📋 Detail Perhitungan:</h4>';
    
    // Group by gamepass
    const itemsByGamepass = {};
    selectedItems.forEach(item => {
        if (!itemsByGamepass[item.gamepassName]) {
            itemsByGamepass[item.gamepassName] = [];
        }
        itemsByGamepass[item.gamepassName].push(item);
    });
    
    let grandTotal = 0;
    
    for (const [gamepassName, items] of Object.entries(itemsByGamepass)) {
        const rate = gamepassData[gamepassName]?.rate || 110;
        let gamepassTotalRobux = 0;
        
        calculationDetails += `
            <div style="margin-bottom: 0.75rem;">
                <strong style="color: var(--text);">${gamepassName}</strong> <span style="color: var(--muted);">(Rate: ${rate})</span>:
            </div>
        `;
        
        items.forEach(item => {
            const itemTotal = item.robux * rate;
            gamepassTotalRobux += item.robux;
            grandTotal += itemTotal;
            
            calculationDetails += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="flex: 1;">${item.itemName}</span>
                    <span style="text-align: right;">
                        <span style="color: var(--pink-dark);">${item.robux}</span> 
                        × 
                        <span style="color: var(--muted);">${rate}</span> 
                        = 
                        <strong style="color: var(--success);">Rp${itemTotal.toLocaleString('id-ID')}</strong>
                    </span>
                </div>
            `;
        });
        
        totalRobux += gamepassTotalRobux;
    }
    
    const resultDiv = document.getElementById('calculation-result');
    resultDiv.innerHTML = `
        ${calculationDetails}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--pink);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem;">
                <span style="color: var(--text);">💰 TOTAL:</span>
                <span style="color: var(--success);" id="total-amount">Rp${grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div style="color: var(--muted); font-size: 0.9rem; text-align: center;">
                Total Robux: <strong>${totalRobux}</strong> | Item: <strong>${selectedItems.length}</strong>
            </div>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn" onclick="clearAllSelectedItems()" style="background: var(--warning); flex: 1;">🔄 Reset</button>
            <button class="btn" onclick="copyTotalAmount()" style="background: var(--success); flex: 1;">📋 Salin Total</button>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// ==================== COPY TOTAL AMOUNT ONLY ====================
function copyTotalAmount() {
    const totalElement = document.getElementById('total-amount');
    if (!totalElement) return;
    
    const totalText = totalElement.textContent.replace('Rp', '').trim();
    
    navigator.clipboard.writeText(totalText).then(() => {
        showToast('Total harga disalin!');
        
        const copyBtn = document.querySelector('button[onclick="copyTotalAmount()"]');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Disalin!';
            copyBtn.style.background = 'var(--success)';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        }
    }).catch(err => {
        console.error('Gagal menyalin teks: ', err);
        showToast('Gagal menyalin total!');
    });
}

// ==================== IMPROVED CLEAR SELECTION ====================
function clearSelection() {
    selectedItems = [];
    updateSelectedItemsDisplay();
    document.getElementById('calculation-result').style.display = 'none';
    
    showToast('Perhitungan direset!');
}



function restoreGamepassState() {
    // SELALU KOSONGKAN SEMUA STATE untuk Gift Gamepass
    currentActiveMap = '';
    selectedGamepass = null;
    selectedItems = [];
    
    // Hapus dari localStorage juga
    localStorage.removeItem('currentActiveMap');
    localStorage.removeItem('selectedItems');
    
    console.log('🔄 Gift Gamepass state reset - no auto select');
}

function restoreGamepassStateReseller() {
    // SELALU KOSONGKAN SEMUA STATE untuk Reseller juga
    currentActiveMapReseller = '';
    selectedGamepassReseller = null;
    selectedItemsReseller = [];
    
    // Hapus dari localStorage juga
    localStorage.removeItem('currentActiveMapReseller');
    localStorage.removeItem('selectedItemsReseller');
    
    console.log('🔄 Reseller Gamepass state reset - no auto select');
}

// Fungsi untuk custom item
function addCustomItem() {
    const nameInput = document.getElementById('custom-item-name');
    const robuxInput = document.getElementById('custom-item-robux');
    
    if (!nameInput || !robuxInput) return;
    
    const name = nameInput.value.trim();
    const robux = parseInt(robuxInput.value);
    
    if (name && !isNaN(robux) && robux > 0) {
        // Tambahkan ke selectedItems
        selectedItems.push({
            gamepassName: selectedGamepass.name,
            itemName: name,
            robux: robux
        });
        
        updateSelectedItemsDisplay();
        nameInput.value = '';
        robuxInput.value = '';
    } else {
        showToast('Masukkan nama item dan jumlah robux yang valid!');
    }
}

// Fungsi untuk reset kalkulasi
function clearCalculation() {
    const selectedItems = document.getElementById('selected-items');
    const resultDiv = document.getElementById('calculation-result');
    
    if (selectedItems) selectedItems.innerHTML = '';
    if (resultDiv) resultDiv.style.display = 'none';
    
    showToast('Perhitungan direset!');
}
function addCustomItem() {
    const nameInput = document.getElementById('custom-item-name');
    const robuxInput = document.getElementById('custom-item-robux');
    
    if (!nameInput || !robuxInput) return;
    
    const name = nameInput.value.trim();
    const robux = parseInt(robuxInput.value);
    
    if (name && !isNaN(robux) && robux > 0) {
        addToSelectedItems(name, robux);
        nameInput.value = '';
        robuxInput.value = '';
    } else {
        showToast('Masukkan nama item dan jumlah robux yang valid!', 'error');
    }
}

// ==================== ADMIN FUNCTIONS ====================
let currentEditGamepass = '';

function showEditGamepassPopup(gamepassName) {
    currentEditGamepass = gamepassName;
    const gamepass = gamepassData[gamepassName];
    
    document.getElementById('edit-gamepass-name').value = gamepassName;
    document.getElementById('edit-gamepass-rate').value = gamepass.rate;
    
    const container = document.getElementById('edit-items-container');
    container.innerHTML = '';
    
    for (const [itemName, robux] of Object.entries(gamepass.items)) {
        addEditItemField(itemName, robux);
    }
    
    document.getElementById('edit-gamepass-popup').style.display = 'flex';
}

function closeEditPopup() {
    document.getElementById('edit-gamepass-popup').style.display = 'none';
    currentEditGamepass = '';
}

// ==================== ADMIN FUNCTIONS UNTUK GIFT GAMEPASS ====================
function showAddGamepassPopup() {
    console.log('🔄 Opening add gamepass popup...');
    
    // Reset form
    document.getElementById('new-gamepass-name').value = '';
    document.getElementById('new-gamepass-rate').value = 110;
    
    // Reset items container
    const container = document.getElementById('new-items-container');
    container.innerHTML = `
        <div class="item-input-row">
            <input type="text" class="form-control new-item-name" placeholder="Nama item">
            <input type="number" class="form-control new-item-robux" placeholder="Robux" style="width: 100px;">
            <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    
    // Show popup
    document.getElementById('add-gamepass-popup').style.display = 'flex';
    console.log('✅ Add gamepass popup opened');
}

function closeAddPopup() {
    document.getElementById('add-gamepass-popup').style.display = 'none';
    console.log('❌ Add gamepass popup closed');
}

function showEditRatesPopup() {
    const container = document.getElementById('rates-list');
    container.innerHTML = '';
    
    for (const [gamepassName, data] of Object.entries(gamepassData)) {
        const rateDiv = document.createElement('div');
        rateDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 6px;';
        
        rateDiv.innerHTML = `
            <span style="flex: 1; font-weight: 500;">${gamepassName}</span>
            <input type="number" id="rate-${gamepassName}" value="${data.rate}" style="width: 80px; padding: 0.5rem; border: 1px solid var(--pink); border-radius: 4px;">
        `;
        
        container.appendChild(rateDiv);
    }
    
    document.getElementById('edit-rates-popup').style.display = 'flex';
}

function closeRatesPopup() {
    document.getElementById('edit-rates-popup').style.display = 'none';
}

function addEditItemField(name = '', robux = '') {
    const container = document.getElementById('edit-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-input-row';
    
    itemDiv.innerHTML = `
        <input type="text" class="form-control edit-item-name" placeholder="Nama item" value="${name}">
        <input type="number" class="form-control edit-item-robux" placeholder="Robux" value="${robux}" style="width: 100px;">
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(itemDiv);
}

function addNewItemField() {
    const container = document.getElementById('new-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-input-row';
    
    itemDiv.innerHTML = `
        <input type="text" class="form-control new-item-name" placeholder="Nama item">
        <input type="number" class="form-control new-item-robux" placeholder="Robux" style="width: 100px;">
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(itemDiv);
    console.log('✅ New item field added');
}

function saveGamepassEdit() {
    const newName = document.getElementById('edit-gamepass-name').value.trim();
    const rate = parseInt(document.getElementById('edit-gamepass-rate').value);
    
    if (!newName || !rate) {
        alert('Mohon isi nama dan rate!');
        return;
    }
    
    // Collect items
    const items = {};
    const itemNames = document.querySelectorAll('.edit-item-name');
    const itemRobux = document.querySelectorAll('.edit-item-robux');
    
    for (let i = 0; i < itemNames.length; i++) {
        const name = itemNames[i].value.trim();
        const robux = parseInt(itemRobux[i].value);
        
        if (name && robux) {
            items[name] = robux;
        }
    }
    
    if (Object.keys(items).length === 0) {
        alert('Tambahkan minimal 1 item!');
        return;
    }
    
    // SIMPAN POSISI MAP YANG SEDANG AKTIF SEBELUM DI-EDIT - SAMA SEPERTI RESELLER
    const wasActive = (currentActiveMap === currentEditGamepass);
    const wasSelectedGamepass = (selectedGamepass && selectedGamepass.name === currentEditGamepass);
    
    // Update data
    delete gamepassData[currentEditGamepass];
    gamepassData[newName] = { rate, items };
    saveGamepassData();
    
    // JIKA MAP YANG DI-EDIT ADALAH YANG SEDANG AKTIF, 
    // MAKA TETAPKAN SEBAGAI MAP AKTIF YANG BARU - SAMA SEPERTI RESELLER
    if (wasActive) {
        currentActiveMap = newName;
        selectedGamepass = { name: newName, rate, items: Object.entries(items).map(([name, robux]) => ({ name, robux })) };
    } else if (wasSelectedGamepass) {
        // Jika gamepass yang diedit adalah yang sedang dipilih, update selectedGamepass juga
        selectedGamepass = { name: newName, rate, items: Object.entries(items).map(([name, robux]) => ({ name, robux })) };
    }
    
    // Reload - TETAP PERTAHANKAN POSISI AKTIF
    loadGiftGamepass();
    closeEditPopup();
    
    showToast('Gamepass berhasil diupdate!');
}

function addNewGamepass() {
    const name = document.getElementById('new-gamepass-name').value.trim();
    const rate = parseInt(document.getElementById('new-gamepass-rate').value);
    
    if (!name || !rate) {
        alert('Mohon isi nama dan rate!');
        return;
    }
    
    // Check if gamepass already exists
    if (gamepassData[name]) {
        alert(`Gamepass "${name}" sudah ada!`);
        return;
    }
    
    // Collect items
    const items = {};
    const itemNames = document.querySelectorAll('.new-item-name');
    const itemRobux = document.querySelectorAll('.new-item-robux');
    
    let hasValidItems = false;
    
    for (let i = 0; i < itemNames.length; i++) {
        const itemName = itemNames[i].value.trim();
        const robux = parseInt(itemRobux[i].value);
        
        if (itemName && robux) {
            items[itemName] = robux;
            hasValidItems = true;
        }
    }
    
    if (!hasValidItems) {
        alert('Tambahkan minimal 1 item yang valid!');
        return;
    }
    
    // Add to data
    gamepassData[name] = { rate, items };
    saveGamepassData();
    
    // Reload - tetap pertahankan map yang aktif sebelumnya
    loadGiftGamepass();
    closeAddPopup();
    
    showToast('Gamepass berhasil ditambahkan!');
    console.log('✅ New gamepass added:', name);
}

function saveAllRates() {
    for (const gamepassName of Object.keys(gamepassData)) {
        const newRate = parseInt(document.getElementById(`rate-${gamepassName}`).value);
        if (newRate && newRate > 0) {
            gamepassData[gamepassName].rate = newRate;
            
            // Update selectedGamepass jika sedang aktif
            if (selectedGamepass && selectedGamepass.name === gamepassName) {
                selectedGamepass.rate = newRate;
            }
        }
    }
    saveGamepassData();
    loadGiftGamepass(); // Tetap pertahankan posisi aktif
    closeRatesPopup();
    showToast('Rates berhasil diupdate!');
}

function deleteGamepass(gamepassName) {
    if (confirm(`Yakin ingin menghapus gamepass "${gamepassName}"?`)) {
        // Reset currentActiveMap jika yang dihapus adalah map yang aktif
        if (currentActiveMap === gamepassName) {
            currentActiveMap = '';
            selectedGamepass = null;
            selectedItems = [];
        } else if (selectedGamepass && selectedGamepass.name === gamepassName) {
            // Jika yang dihapus adalah gamepass yang sedang dipilih
            selectedGamepass = null;
            selectedItems = [];
        }
        
        delete gamepassData[gamepassName];
        saveGamepassData();
        loadGiftGamepass();
        showToast('Gamepass berhasil dihapus!');
    }
}

console.log('✅ All JavaScript functions loaded successfully');

function calculateGamepassTotal() {
    if (selectedItems.length === 0) {
        alert('Pilih minimal 1 item!');
        return;
    }
    
    let totalRobux = 0;
    let grandTotal = 0;
    let detailsHTML = '';
    
    // Group by map
    const itemsByMap = {};
    selectedItems.forEach(item => {
        if (!itemsByMap[item.mapName]) {
            itemsByMap[item.mapName] = [];
        }
        itemsByMap[item.mapName].push(item);
    });
    
    // Calculate for each map
    for (const [mapName, items] of Object.entries(itemsByMap)) {
        const rate = gamepassData[mapName].rate;
        
        detailsHTML += `<div class="calc-detail-section">
            <div class="calc-map-header">${mapName} (Rate: ${rate}):</div>`;
        
        items.forEach(item => {
            const itemTotal = item.robux * rate;
            totalRobux += item.robux;
            grandTotal += itemTotal;
            
            detailsHTML += `
                <div class="calc-detail-row">
                    <span class="calc-item-name">${item.itemName}</span>
                    <span class="calc-item-calc">${item.robux} × ${rate} = Rp${itemTotal.toLocaleString('id-ID')}</span>
                </div>
            `;
        });
        
        detailsHTML += `</div>`;
    }
    
    const resultDiv = document.getElementById('calculation-result');
    resultDiv.innerHTML = `
        <div class="calculation-result-card">
            <div class="calculation-result-header">
                <button class="calc-btn-reset" onclick="resetCalculation()">
                    🔄 Reset
                </button>
                <button class="calc-btn-copy" onclick="copyTotalPrice(${grandTotal})" id="copy-total-btn">
                    📋 Salin Hasil
                </button>
            </div>
            
            <h4 style="color: var(--pink-dark); margin-bottom: 1rem; margin-right: 180px;">📋 Detail Perhitungan:</h4>
            ${detailsHTML}
            <div class="calc-total-section">
                <div class="calc-total-row">
                    <span class="calc-total-label">💰 TOTAL:</span>
                    <span class="calc-total-value">Rp${grandTotal.toLocaleString('id-ID')}</span>
                </div>
                <div class="calc-total-info">Total Robux: ${totalRobux} | Item: ${selectedItems.length}</div>
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

function copyTotalPrice(total) {
    const textToCopy = `Rp${total.toLocaleString('id-ID')}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.getElementById('copy-total-btn');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Disalin!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
        showToast('✓ Harga disalin!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const copyBtn = document.getElementById('copy-total-btn');
        if (copyBtn) {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Disalin!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
        showToast('✓ Harga disalin!');
    });
}


// ==================== RESELLER FUNCTIONS ====================
function loadResellerGamepass() {
    console.log('🔄 Loading reseller gamepass...');
    
    // PASTIKAN STATE KOSONG
    if (!currentActiveMapReseller) {
        selectedGamepassReseller = null;
        selectedItemsReseller = [];
    }
    
    loadGamepassMapsReseller();
    updateGamepassViewReseller();
    
    // PASTIKAN TAMPILAN "PILIH MAP" TERLIHAT
    const noMapSelected = document.getElementById('reseller-no-map-selected');
    const itemsSection = document.getElementById('reseller-items-section');
    
    if (noMapSelected) noMapSelected.style.display = 'block';
    if (itemsSection) itemsSection.style.display = 'none';
    
    console.log('✅ Reseller gamepass loaded - showing "Pilih Map" message');
}

function loadGamepassMapsReseller() {
    const gamepasses = getGamepassesReseller();
    const mapList = document.getElementById('reseller-map-list');
    
    if (!mapList) {
        console.error('Reseller map list container not found!');
        return;
    }
    
    mapList.innerHTML = '';
    
    gamepasses.forEach((gamepass, index) => {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        
        // JANGAN ADA AUTO SELECT - sama seperti Gift Gamepass
        // Hanya aktif jika benar-benar diklik user
        
        mapItem.innerHTML = `
            <div class="map-info">
                <div class="map-name">${gamepass.name}</div>
                <div class="map-rate">Rate: ${gamepass.rate}</div>
            </div>
            <div class="map-actions">
                <button class="btn-edit-small" onclick="event.stopPropagation(); showEditGamepassPopupReseller('${gamepass.name}')">✏️</button>
                <button class="btn-delete-small" onclick="event.stopPropagation(); deleteGamepassReseller('${gamepass.name}')">🗑️</button>
            </div>
        `;
        
        mapItem.addEventListener('click', () => {
            // Hapus class active dari semua map item
            document.querySelectorAll('#reseller-map-list .map-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Tambah class active ke map yang dipilih
            mapItem.classList.add('active');
            
            // Set map yang dipilih dan RESET SELECTION
            selectedGamepassReseller = gamepass;
            currentActiveMapReseller = gamepass.name;
            
            // RESET SEMUA ITEM YANG DIPILIH DAN HASIL PERHITUNGAN
            selectedItemsReseller = [];
            updateSelectedItemsDisplayReseller();
            document.getElementById('reseller-calculation-result').style.display = 'none';
            
            // Update tampilan
            updateGamepassViewReseller();
        });
        
        mapList.appendChild(mapItem);
    });
    
    // JANGAN AUTO SELECT FIRST MAP - sama seperti Gift Gamepass
    console.log('✅ Reseller Gamepass maps loaded - no auto selection');
}


function getGamepassesReseller() {
    return Object.entries(resellerData).map(([name, data]) => ({
        name: name,
        rate: data.rate,
        items: Object.entries(data.items).map(([itemName, robux]) => ({
            name: itemName,
            robux: robux
        }))
    }));
}


function updateGamepassViewReseller() {
    const itemsSection = document.getElementById('reseller-items-section');
    const noMapSelected = document.getElementById('reseller-no-map-selected');
    const selectedMapTitle = document.getElementById('reseller-selected-map-title');
    
    if (selectedGamepassReseller && currentActiveMapReseller) {
        selectedMapTitle.textContent = selectedGamepassReseller.name;
        if (noMapSelected) noMapSelected.style.display = 'none';
        if (itemsSection) itemsSection.style.display = 'block';
        loadItemsForSelectedMapReseller();
    } else {
        // Tampilkan pesan "pilih map", sembunyikan items section
        if (noMapSelected) noMapSelected.style.display = 'block';
        if (itemsSection) itemsSection.style.display = 'none';
        if (selectedMapTitle) selectedMapTitle.textContent = 'Pilih Map Dulu Cuy';
        
        // Reset selected items
        selectedItemsReseller = [];
        updateSelectedItemsDisplayReseller();
        document.getElementById('reseller-calculation-result').style.display = 'none';
    }
}

function loadItemsForSelectedMapReseller() {
    const itemsList = document.getElementById('reseller-items-list');
    
    if (!selectedGamepassReseller || !itemsList) return;
    
    itemsList.innerHTML = '';
    
    selectedGamepassReseller.items.forEach((item, index) => {
        const itemOption = document.createElement('div');
        itemOption.className = 'item-option';
        itemOption.innerHTML = `
            <div class="item-option-name">${item.name}</div>
            <div class="item-option-robux">${item.robux} Robux</div>
        `;
        
        itemOption.addEventListener('click', () => {
            addToSelectedItemsReseller(item.name, item.robux);
        });
        
        itemsList.appendChild(itemOption);
    });
}

function addToSelectedItemsReseller(name, robux) {
    const selectedItemsContainer = document.getElementById('reseller-selected-items');
    if (!selectedItemsContainer) return;
    
    selectedItemsReseller.push({
        gamepassName: selectedGamepassReseller.name,
        itemName: name,
        robux: robux
    });
    
    updateSelectedItemsDisplayReseller();
}

function updateSelectedItemsDisplayReseller() {
    const container = document.getElementById('reseller-selected-items');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="margin: 0;">🛒 Item Terpilih:</h4>
            ${selectedItemsReseller.length > 0 ? 
                `<button class="btn btn-small" onclick="clearAllSelectedItemsReseller()" style="background: var(--danger); padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                    🗑️ Batalkan
                </button>` : 
                ''
            }
        </div>
    `;
    
    if (selectedItemsReseller.length === 0) {
        container.innerHTML += '<div style="color: var(--muted); font-style: italic; text-align: center; padding: 1rem;">Belum ada item terpilih</div>';
        return;
    }
    
    selectedItemsReseller.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.innerHTML = `
            <div class="selected-item-name">${item.itemName}</div>
            <div class="selected-item-robux">${item.robux} Robux</div>
            <button class="remove-item" onclick="removeSelectedItemReseller(${index})" title="Hapus item">×</button>
        `;
        container.appendChild(itemDiv);
    });
}

function removeSelectedItemReseller(index) {
    if (index >= 0 && index < selectedItemsReseller.length) {
        selectedItemsReseller.splice(index, 1);
        updateSelectedItemsDisplayReseller();
    }
}


function calculateTotalReseller() {
    if (!selectedGamepassReseller) {
        showToast('Pilih map terlebih dahulu!', 'error');
        return;
    }
    
    if (selectedItemsReseller.length === 0) {
        showToast('Pilih minimal satu item!', 'error');
        return;
    }
    
    let totalRobux = 0;
    let calculationDetails = '<h4 style="margin-bottom: 1rem; color: var(--pink-dark);">📋 Detail Perhitungan:</h4>';
    
    const itemsByGamepass = {};
    selectedItemsReseller.forEach(item => {
        if (!itemsByGamepass[item.gamepassName]) {
            itemsByGamepass[item.gamepassName] = [];
        }
        itemsByGamepass[item.gamepassName].push(item);
    });
    
    let grandTotal = 0;
    
    for (const [gamepassName, items] of Object.entries(itemsByGamepass)) {
        const rate = resellerData[gamepassName]?.rate || 100;
        let gamepassTotalRobux = 0;
        
        calculationDetails += `
            <div style="margin-bottom: 0.75rem;">
                <strong style="color: var(--text);">${gamepassName}</strong> <span style="color: var(--muted);">(Rate: ${rate})</span>:
            </div>
        `;
        
        items.forEach(item => {
            const itemTotal = item.robux * rate;
            gamepassTotalRobux += item.robux;
            grandTotal += itemTotal;
            
            calculationDetails += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="flex: 1;">${item.itemName}</span>
                    <span style="text-align: right;">
                        <span style="color: var(--pink-dark);">${item.robux}</span> 
                        × 
                        <span style="color: var(--muted);">${rate}</span> 
                        = 
                        <strong style="color: var(--success);">Rp${itemTotal.toLocaleString('id-ID')}</strong>
                    </span>
                </div>
            `;
        });
        
        totalRobux += gamepassTotalRobux;
    }
    
    const resultDiv = document.getElementById('reseller-calculation-result');
    resultDiv.innerHTML = `
        ${calculationDetails}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--pink);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem;">
                <span style="color: var(--text);">💰 TOTAL:</span>
                <span style="color: var(--success);" id="reseller-total-amount">Rp${grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div style="color: var(--muted); font-size: 0.9rem; text-align: center;">
                Total Robux: <strong>${totalRobux}</strong> | Item: <strong>${selectedItemsReseller.length}</strong>
            </div>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button class="btn" onclick="clearSelectionReseller()" style="background: var(--warning); flex: 1;">🔄 Reset</button>
            <button class="btn" onclick="copyTotalAmountReseller()" style="background: var(--success); flex: 1;">📋 Salin Total</button>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

function copyTotalAmountReseller() {
    const totalElement = document.getElementById('reseller-total-amount');
    if (!totalElement) return;
    
    const totalText = totalElement.textContent.replace('Rp', '').trim();
    
    navigator.clipboard.writeText(totalText).then(() => {
        showToast('Total harga disalin!');
    }).catch(err => {
        console.error('Gagal menyalin teks: ', err);
        showToast('Gagal menyalin total!');
    });
}

function clearSelectionReseller() {
    selectedItemsReseller = [];
    updateSelectedItemsDisplayReseller();
    document.getElementById('reseller-calculation-result').style.display = 'none';
    showToast('Perhitungan direset!');
}

function addCustomItemReseller() {
    const nameInput = document.getElementById('reseller-custom-item-name');
    const robuxInput = document.getElementById('reseller-custom-item-robux');
    
    if (!nameInput || !robuxInput) return;
    
    const name = nameInput.value.trim();
    const robux = parseInt(robuxInput.value);
    
    if (name && !isNaN(robux) && robux > 0) {
        addToSelectedItemsReseller(name, robux);
        nameInput.value = '';
        robuxInput.value = '';
    } else {
        showToast('Masukkan nama item dan jumlah robux yang valid!', 'error');
    }
}



function restoreGamepassStateReseller() {
    // Hanya restore currentActiveMapReseller, TIDAK restore selectedItemsReseller
    const savedActiveMap = localStorage.getItem('currentActiveMapReseller');
    
    if (savedActiveMap) {
        currentActiveMapReseller = savedActiveMap;
    }
    
    // SELALU KOSONGKAN selectedItemsReseller saat restore
    selectedItemsReseller = [];
    
    console.log('🔄 Reseller Gamepass state restored - selected items cleared');
}


// ==================== ADMIN FUNCTIONS UNTUK RESELLER ====================
let currentEditGamepassReseller = '';

function showEditGamepassPopupReseller(gamepassName) {
    currentEditGamepassReseller = gamepassName;
    const gamepass = resellerData[gamepassName];
    
    document.getElementById('edit-gamepass-name-reseller').value = gamepassName;
    document.getElementById('edit-gamepass-rate-reseller').value = gamepass.rate;
    
    const container = document.getElementById('edit-items-container-reseller');
    container.innerHTML = '';
    
    for (const [itemName, robux] of Object.entries(gamepass.items)) {
        addEditItemFieldReseller(itemName, robux);
    }
    
    document.getElementById('edit-gamepass-popup-reseller').style.display = 'flex';
}

function closeEditPopupReseller() {
    document.getElementById('edit-gamepass-popup-reseller').style.display = 'none';
    currentEditGamepassReseller = '';
}

function showAddGamepassPopupReseller() {
    document.getElementById('new-gamepass-name-reseller').value = '';
    document.getElementById('new-gamepass-rate-reseller').value = 100;
    
    const container = document.getElementById('new-items-container-reseller');
    container.innerHTML = `
        <div class="item-input-row">
            <input type="text" class="form-control new-item-name-reseller" placeholder="Nama item">
            <input type="number" class="form-control new-item-robux-reseller" placeholder="Robux" style="width: 100px;">
            <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    
    document.getElementById('add-gamepass-popup-reseller').style.display = 'flex';
}

function closeAddPopupReseller() {
    document.getElementById('add-gamepass-popup-reseller').style.display = 'none';
}

function showEditRatesPopupReseller() {
    const container = document.getElementById('rates-list-reseller');
    container.innerHTML = '';
    
    for (const [gamepassName, data] of Object.entries(resellerData)) {
        const rateDiv = document.createElement('div');
        rateDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 6px;';
        
        rateDiv.innerHTML = `
            <span style="flex: 1; font-weight: 500;">${gamepassName}</span>
            <input type="number" id="rate-reseller-${gamepassName}" value="${data.rate}" style="width: 80px; padding: 0.5rem; border: 1px solid var(--pink); border-radius: 4px;">
        `;
        
        container.appendChild(rateDiv);
    }
    
    document.getElementById('edit-rates-popup-reseller').style.display = 'flex';
}

function closeRatesPopupReseller() {
    document.getElementById('edit-rates-popup-reseller').style.display = 'none';
}

function addEditItemFieldReseller(name = '', robux = '') {
    const container = document.getElementById('edit-items-container-reseller');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-input-row';
    
    itemDiv.innerHTML = `
        <input type="text" class="form-control edit-item-name-reseller" placeholder="Nama item" value="${name}">
        <input type="number" class="form-control edit-item-robux-reseller" placeholder="Robux" value="${robux}" style="width: 100px;">
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(itemDiv);
}

function addNewItemFieldReseller() {
    const container = document.getElementById('new-items-container-reseller');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-input-row';
    
    itemDiv.innerHTML = `
        <input type="text" class="form-control new-item-name-reseller" placeholder="Nama item">
        <input type="number" class="form-control new-item-robux-reseller" placeholder="Robux" style="width: 100px;">
        <button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(itemDiv);
}

function saveGamepassEditReseller() {
    const newName = document.getElementById('edit-gamepass-name-reseller').value.trim();
    const rate = parseInt(document.getElementById('edit-gamepass-rate-reseller').value);
    
    if (!newName || !rate) {
        alert('Mohon isi nama dan rate!');
        return;
    }
    
    // Collect items
    const items = {};
    const itemNames = document.querySelectorAll('.edit-item-name-reseller');
    const itemRobux = document.querySelectorAll('.edit-item-robux-reseller');
    
    for (let i = 0; i < itemNames.length; i++) {
        const name = itemNames[i].value.trim();
        const robux = parseInt(itemRobux[i].value);
        
        if (name && robux) {
            items[name] = robux;
        }
    }
    
    if (Object.keys(items).length === 0) {
        alert('Tambahkan minimal 1 item!');
        return;
    }
    
    // SIMPAN POSISI MAP YANG SEDANG AKTIF SEBELUM DI-EDIT - SAMA SEPERTI GIFT GAMEPASS
    const wasActive = (currentActiveMapReseller === currentEditGamepassReseller);
    const wasSelectedGamepass = (selectedGamepassReseller && selectedGamepassReseller.name === currentEditGamepassReseller);
    
    // Update data - HAPUS dulu yang lama, lalu tambah yang baru
    delete resellerData[currentEditGamepassReseller];
    resellerData[newName] = { rate, items };
    saveGamepassData();
    
    // JIKA MAP YANG DI-EDIT ADALAH YANG SEDANG AKTIF, 
    // MAKA TETAPKAN SEBAGAI MAP AKTIF YANG BARU - SAMA SEPERTI GIFT GAMEPASS
    if (wasActive) {
        currentActiveMapReseller = newName;
        selectedGamepassReseller = { name: newName, rate, items: Object.entries(items).map(([name, robux]) => ({ name, robux })) };
    } else if (wasSelectedGamepass) {
        // Jika gamepass yang diedit adalah yang sedang dipilih, update selectedGamepassReseller juga
        selectedGamepassReseller = { name: newName, rate, items: Object.entries(items).map(([name, robux]) => ({ name, robux })) };
    }
    
    // Reload - TETAP PERTAHANKAN POSISI AKTIF
    loadResellerGamepass();
    closeEditPopupReseller();
    
    showToast('Gamepass reseller berhasil diupdate!');
}

function addNewGamepassReseller() {
    const name = document.getElementById('new-gamepass-name-reseller').value.trim();
    const rate = parseInt(document.getElementById('new-gamepass-rate-reseller').value);
    
    if (!name || !rate) {
        alert('Mohon isi nama dan rate!');
        return;
    }
    
    // Collect items
    const items = {};
    const itemNames = document.querySelectorAll('.new-item-name-reseller');
    const itemRobux = document.querySelectorAll('.new-item-robux-reseller');
    
    for (let i = 0; i < itemNames.length; i++) {
        const itemName = itemNames[i].value.trim();
        const robux = parseInt(itemRobux[i].value);
        
        if (itemName && robux) {
            items[itemName] = robux;
        }
    }
    
    if (Object.keys(items).length === 0) {
        alert('Tambahkan minimal 1 item!');
        return;
    }
    
    // Add to data
    resellerData[name] = { rate, items };
    saveGamepassData();
    
    // TETAP PERTAHANKAN MAP YANG SEDANG AKTIF - JANGAN UBAH currentActiveMapReseller
    // Hanya reload tanpa mengubah posisi aktif
    
    // Reload - tetap pertahankan map yang aktif sebelumnya
    loadResellerGamepass();
    closeAddPopupReseller();
    
    showToast('Gamepass reseller berhasil ditambahkan!');
}

function saveAllRatesReseller() {
    for (const gamepassName of Object.keys(resellerData)) {
        const newRate = parseInt(document.getElementById(`rate-reseller-${gamepassName}`).value);
        if (newRate && newRate > 0) {
            resellerData[gamepassName].rate = newRate;
            
            // Update selectedGamepassReseller jika sedang aktif
            if (selectedGamepassReseller && selectedGamepassReseller.name === gamepassName) {
                selectedGamepassReseller.rate = newRate;
            }
        }
    }
    saveGamepassData();
    loadResellerGamepass(); // Tetap pertahankan posisi aktif
    closeRatesPopupReseller();
    showToast('Rates reseller berhasil diupdate!');
}

function deleteGamepassReseller(gamepassName) {
    if (confirm(`Yakin ingin menghapus gamepass "${gamepassName}" dari reseller?`)) {
        // Reset currentActiveMap jika yang dihapus adalah map yang aktif
        if (currentActiveMapReseller === gamepassName) {
            currentActiveMapReseller = '';
            selectedGamepassReseller = null;
            selectedItemsReseller = [];
        } else if (selectedGamepassReseller && selectedGamepassReseller.name === gamepassName) {
            // Jika yang dihapus adalah gamepass yang sedang dipilih
            selectedGamepassReseller = null;
            selectedItemsReseller = [];
        }
        
        delete resellerData[gamepassName];
        saveGamepassData();
        loadResellerGamepass();
        showToast('Gamepass reseller berhasil dihapus!');
    }
}


function removeSelectedItem(index) {
    if (index >= 0 && index < selectedItems.length) {
        selectedItems.splice(index, 1);
        updateSelectedItemsDisplay();
        
        // Sembunyikan hasil perhitungan jika tidak ada item yang dipilih
        if (selectedItems.length === 0) {
            document.getElementById('calculation-result').style.display = 'none';
        }
    }
}

function removeSelectedItemReseller(index) {
    if (index >= 0 && index < selectedItemsReseller.length) {
        selectedItemsReseller.splice(index, 1);
        updateSelectedItemsDisplayReseller();
        
        // Sembunyikan hasil perhitungan jika tidak ada item yang dipilih
        if (selectedItemsReseller.length === 0) {
            document.getElementById('reseller-calculation-result').style.display = 'none';
        }
    }
}

// ==================== FUNGSI CLEAR ALL ITEMS TANPA KONFIRMASI ====================
function clearAllSelectedItems() {
    if (selectedItems.length === 0) {
        showToast('Tidak ada item yang dipilih!', 'error');
        return;
    }
    
    selectedItems = [];
    updateSelectedItemsDisplay();
    document.getElementById('calculation-result').style.display = 'none';
    showToast('Semua item berhasil dibatalkan!');
}

// ==================== FUNGSI CLEAR ALL ITEMS RESELLER TANPA KONFIRMASI ====================
function clearAllSelectedItemsReseller() {
    if (selectedItemsReseller.length === 0) {
        showToast('Tidak ada item yang dipilih!', 'error');
        return;
    }
    
    selectedItemsReseller = [];
    updateSelectedItemsDisplayReseller();
    document.getElementById('reseller-calculation-result').style.display = 'none';
    showToast('Semua item berhasil dibatalkan!');
}

// Tambahkan fungsi untuk clear localStorage yang tidak perlu
function clearUnnecessaryStorage() {
    // Hapus selected items dari localStorage jika ada
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('selectedItemsReseller');
    
    // Hapus currentActiveMap jika ingin reset manual
    // localStorage.removeItem('currentActiveMap');
    // localStorage.removeItem('currentActiveMapReseller');
}

// Tambahkan fungsi clear storage
function clearGiftGamepassStorage() {
    // Hapus semua storage related to gift gamepass
    localStorage.removeItem('currentActiveMap');
    localStorage.removeItem('selectedItems');
    
    // Reset variables
    window.currentActiveMap = '';
    window.selectedGamepass = null;
    window.selectedItems = [];
}

// Panggil di DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Clear gift gamepass storage pertama kali
    clearGiftGamepassStorage();
    
    // ... kode lainnya ...
});

// Fungsi untuk clear semua storage gamepass
function clearAllGamepassStorage() {
    // Hapus semua storage related to gamepass
    localStorage.removeItem('currentActiveMap');
    localStorage.removeItem('selectedItems');
    localStorage.removeItem('currentActiveMapReseller');
    localStorage.removeItem('selectedItemsReseller');
    
    // Reset semua variables
    window.currentActiveMap = '';
    window.selectedGamepass = null;
    window.selectedItems = [];
    window.currentActiveMapReseller = '';
    window.selectedGamepassReseller = null;
    window.selectedItemsReseller = [];
    
    console.log('🧹 All gamepass storage cleared');
}

// Debug function untuk testing
function debugAddGamepass() {
    console.log('=== DEBUG ADD GAMEPASS ===');
    console.log('showAddGamepassPopup function:', typeof showAddGamepassPopup);
    console.log('add-gamepass-popup element:', document.getElementById('add-gamepass-popup'));
    console.log('new-items-container element:', document.getElementById('new-items-container'));
    
    // Test panggil function
    showAddGamepassPopup();
}

// Panggil debug di console jika perlu
// debugAddGamepass();