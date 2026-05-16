// ==================== GLOBAL VARIABLES ====================
let gamepassData = {};
let resellerData = {};

const API_URL = window.location.origin + "/api";

// ==================== BACKEND API FUNCTIONS ====================
async function fetchDataFromServer() {
    try {
        const response = await fetch(`${API_URL}?action=getGamepassData`);
        const data = await response.json();
        if (data.success) {
            gamepassData = data.gamepassData || {};
            resellerData = data.resellerData || {};
            saveToLocalStorage();
            return true;
        }
        return false;
    } catch (error) {
        loadFromLocalStorage();
        return false;
    }
}

async function saveDataToServer() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveGamepassData',
                gamepassData,
                resellerData
            })
        });
        const result = await response.json();
        if (result.success) {
            showToast('✅ Data berhasil disimpan!');
            return true;
        }
        showToast('❌ Gagal menyimpan: ' + result.error, 'error');
        return false;
    } catch {
        showToast('❌ Server tidak terjangkau', 'error');
        return false;
    }
}

async function updateGamepassOnServer(oldName, newName, rate, items) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateGamepass', oldName, newName, rate, items })
        });
        const result = await response.json();
        if (!result.success) showToast('❌ ' + result.error, 'error');
        return result.success;
    } catch {
        showToast('❌ Server tidak terjangkau', 'error');
        return false;
    }
}

async function deleteGamepassOnServer(gamepassName) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteGamepass', gamepassName })
        });
        const result = await response.json();
        if (!result.success) showToast('❌ ' + result.error, 'error');
        return result.success;
    } catch {
        showToast('❌ Server tidak terjangkau', 'error');
        return false;
    }
}

async function updateRatesOnServer(ratesData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateRates', rates: ratesData })
        });
        const result = await response.json();
        return result.success;
    } catch {
        return false;
    }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('gamepassData');
    if (saved) gamepassData = JSON.parse(saved);
    const savedReseller = localStorage.getItem('resellerData');
    if (savedReseller) resellerData = JSON.parse(savedReseller);
}

function saveToLocalStorage() {
    localStorage.setItem('gamepassData', JSON.stringify(gamepassData));
    localStorage.setItem('resellerData', JSON.stringify(resellerData));
}

// ==================== BUTTON TYPE NORMALIZATION ====================
function normalizeButtonTypes() {
    const setType = (btn) => {
        if (btn.closest('form')) return;
        if (!btn.type || btn.type.toLowerCase() === 'submit') btn.type = 'button';
    };
    document.querySelectorAll('button').forEach(setType);
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.tagName === 'BUTTON') setType(node);
                node.querySelectorAll('button').forEach(setType);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// ==================== LOADING SCREEN ====================
window.addEventListener('load', function () {
    const loader = document.getElementById('neoleafLoading');
    if (loader) {
        setTimeout(function () {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, 1500);
    }
});

// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') toast.style.background = 'var(--danger)';
    else if (type === 'warning') toast.style.background = 'var(--warning)';
    document.body.appendChild(toast);
    // Force reflow then add show class for animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }, 3000);
}

// ==================== LOGIN CHECK ====================
if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

// ==================== DOM LOADED ====================
document.addEventListener('DOMContentLoaded', function () {
    const userDisplayName = localStorage.getItem('userDisplayName') || 'User';
    const displayElement = document.getElementById('userDisplayName');
    if (displayElement) displayElement.textContent = userDisplayName;

    initDarkMode();
    setupNavigationBasedOnRole();

    loadFromLocalStorage();
    currentActiveMap = localStorage.getItem('activeGamepass') || '';
    currentActiveMapReseller = localStorage.getItem('activeResellerGamepass') || '';

    setupUI();
    normalizeButtonTypes();

    // Prevent accidental form submissions
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (!form || form.id === 'loginForm') return;
        e.preventDefault();
    });

    // Initial data load
    (async () => {
        const success = await fetchDataFromServer();
        renderMapList();
        renderMapListReseller();

        // Restore active map state after initial render
        restoreActiveMapState();
        restoreActiveMapStateReseller();

        const savedTab = localStorage.getItem('activeTab') || 'giftgamepass';
        activateTab(savedTab);

        if (success) {
            // Start smart polling - only when tab is visible and no popup open
            startSmartPolling();
        }
    })();
});

// ==================== SETUP UI ====================
function setupUI() {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin' || userRole === 'floppa' || !userRole) {
        setupVilogProtection();
    }
    setupToolsEventListeners();
    setupCopyButtons();
    addRefreshButton();
}

// ==================== NAVIGATION ====================
function setupNavigationBasedOnRole() {
    const userRole = localStorage.getItem('userRole');
    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs) return;

    navTabs.innerHTML = '';
    let defaultTab = 'giftgamepass';

    switch (userRole) {
        case 'admin':
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
                <div class="nav-tab" data-tab="tools">Tools</div>`;
            break;
        case 'suci':
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
                <div class="nav-tab" data-tab="tools">Tools</div>`;
            break;
        default:
            navTabs.innerHTML = `
                <div class="nav-tab" data-tab="giftgamepass">Gift Gamepass</div>
                <div class="nav-tab" data-tab="reseller">Reseller</div>
                <div class="nav-tab" data-tab="tools">Tools</div>`;
    }

    setupTabEventListeners();
}

function activateTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const tab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);

    if (tab) tab.classList.add('active');
    if (tabContent) tabContent.classList.add('active');

    try { localStorage.setItem('activeTab', tabId); } catch (e) { /* ignore */ }

    if (tabId === 'giftgamepass') updateGamepassView();
    if (tabId === 'reseller') updateGamepassViewReseller();
}

function setupTabEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            activateTab(this.getAttribute('data-tab'));
        });
    });
}

// ==================== DARK MODE ====================
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (!themeToggle || !themeIcon) { setTimeout(initDarkMode, 100); return; }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeIcon.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        themeIcon.textContent = '🌙';
    }

    themeToggle.addEventListener('click', function () {
        const isDark = document.body.classList.toggle('dark');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeTab');
    window.location.href = 'login.html';
}

// ==================== HARGA MAYOBLOX ====================
const hargaMayoblox = {
    po: {
        name: "Robux PO (Via Gamepass)",
        rates: { 100: 14000, 200: 28000, 300: 42000, 400: 56000, 500: 70000, 1000: 140000, 2000: 280000 },
        calculate: function (robux) { return Math.round(robux * 140); }
    },
    login: {
        name: "Robux Via Login",
        rates: { 80: 16000, 160: 32000, 240: 48000, 320: 64000, 500: 75500, 1000: 150500, 1500: 224500, 2000: 300000, 2500: 372500, 3000: 449000, 4000: 600000, 5000: 750000 },
        calculate: function (robux) {
            if (robux === "450+premium") return 75500;
            if (robux === "1000+premium") return 150500;
            if (robux === "2200+premium") return 303000;
            if (robux === "korblox") return 2405000;
            if (robux === "headless") return 4375000;
            if (robux === 10000) return 1500000;
            if (robux === 22500) return 0;
            if (robux <= 320) return robux * 200;
            return Math.round(robux * 150);
        }
    }
};

// ==================== TOOLS ====================
function setupToolsEventListeners() {
    document.getElementById('action-calculator')?.addEventListener('click', () => showTool('calculator'));
    document.getElementById('action-tanggal')?.addEventListener('click', () => showTool('tanggal'));
    document.getElementById('action-tax')?.addEventListener('click', () => showTool('tax'));
    document.getElementById('hitung-harga')?.addEventListener('click', hitungHarga);
    document.getElementById('hitung-tanggal')?.addEventListener('click', hitungTanggal);
    setupTaxCalculator();
    showTool('calculator');
}

function showTool(toolName) {
    document.getElementById('calculator-tools-container').style.display = toolName === 'calculator' ? 'block' : 'none';
    document.getElementById('tanggal-container').style.display = toolName === 'tanggal' ? 'block' : 'none';
    document.getElementById('tax-container').style.display = toolName === 'tax' ? 'block' : 'none';
}

function hitungHarga() {
    const jumlahInput = document.getElementById('jumlah-robux-calc').value;
    const robuxType = document.querySelector('input[name="robux-type"]:checked').value;
    if (!jumlahInput) { alert('Masukkan jumlah Robux yang valid!'); return; }

    let jumlah, label;
    if (robuxType === 'login') {
        if (jumlahInput.toLowerCase().includes('premium')) {
            if (jumlahInput.includes('450')) { jumlah = "450+premium"; label = "450 Robux + Premium"; }
            else if (jumlahInput.includes('1000')) { jumlah = "1000+premium"; label = "1000 Robux + Premium"; }
            else if (jumlahInput.includes('2200')) { jumlah = "2200+premium"; label = "2200 Robux + Premium"; }
        } else if (jumlahInput.toLowerCase().includes('korblox')) { jumlah = "korblox"; label = "Paket Korblox"; }
        else if (jumlahInput.toLowerCase().includes('headless')) { jumlah = "headless"; label = "Paket Headless"; }
        else if (jumlahInput.includes('10000')) { jumlah = 10000; label = "10.000 Robux Prioritas"; }
        else if (jumlahInput.includes('22500')) { jumlah = 22500; label = "22.500 Robux (SOLD)"; }
        else { jumlah = parseInt(jumlahInput.replace(/\D/g, '')); label = `${jumlah.toLocaleString()} Robux`; }
    } else {
        jumlah = parseInt(jumlahInput);
        label = `${jumlah.toLocaleString()} Robux`;
    }

    const hargaData = hargaMayoblox[robuxType];
    let totalHarga = hargaData.rates[jumlah] !== undefined ? hargaData.rates[jumlah] : hargaData.calculate(jumlah);
    const hasilDiv = document.getElementById('hasil-hitung');
    hasilDiv.innerHTML = totalHarga === 0 ? `
        <div style="text-align:center;">
            <div style="font-size:1.2rem;margin-bottom:10px;"><strong>${label}</strong></div>
            <div style="font-size:1.5rem;color:var(--danger);"><strong>SOLD OUT</strong></div>
        </div>` : `
        <div style="text-align:center;">
            <div style="font-size:1.2rem;margin-bottom:10px;"><strong>${label}</strong></div>
            <div style="font-size:1.5rem;color:var(--pink-dark);"><strong>Rp ${totalHarga.toLocaleString('id-ID')}</strong></div>
            <div style="margin-top:10px;"><small>${robuxType === 'po' ? '🛒 PO: 6-9 jam' : '🔐 Via Login: 3-5 jam'}</small></div>
        </div>`;
    hasilDiv.style.display = 'block';
}

function hitungTanggal() {
    const input = document.getElementById('tanggal-pending').value;
    if (!input) { alert('Pilih tanggal!'); return; }
    const pending = new Date(input);
    const masuk = new Date(pending);
    masuk.setDate(pending.getDate() + 5);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('hasil-tanggal').innerHTML = `<strong>📅 Pending:</strong> ${pending.toLocaleDateString('id-ID', options)}<br><strong>✅ Selesai:</strong> ${masuk.toLocaleDateString('id-ID', options)}`;
    document.getElementById('hasil-tanggal').style.display = 'block';
}

function setupTaxCalculator() {
    document.getElementById('tax-amount')?.addEventListener('input', calculateTax);
    document.querySelectorAll('input[name="tax-type"]').forEach(r => r.addEventListener('change', calculateTax));
}

function calculateTax() {
    const amount = parseInt(document.getElementById('tax-amount').value);
    const type = document.querySelector('input[name="tax-type"]:checked').value;
    const info = document.getElementById('tax-info');
    if (!info) return;
    if (!amount || amount <= 0) {
        info.innerHTML = '<div class="info-card"><h4>💡 Tips & Info</h4><ul><li>Roblox memotong 30% dari setiap transaksi gamepass</li><li>Untuk mendapatkan <strong>X Robux</strong>, set harga gamepass <strong>X ÷ 0.7</strong></li></ul></div>';
        return;
    }
    if (type === 'before') {
        const afterTax = Math.floor(amount * 0.7);
        info.innerHTML = `<div class="info-card"><h4>📊 Hasil Perhitungan</h4><div class="result-item"><div class="result-label">Yang akan diterima</div><div class="result-value">${afterTax.toLocaleString()} Robux</div></div><div class="tax-tips"><strong>💡 Tips:</strong> Dengan harga gamepass <strong>${amount.toLocaleString()} Robux</strong>, kamu akan mendapatkan <strong>${afterTax.toLocaleString()} Robux</strong></div></div>`;
    } else {
        const beforeTax = Math.ceil(amount / 0.7);
        info.innerHTML = `<div class="info-card"><h4>📊 Hasil Perhitungan</h4><div class="result-item"><div class="result-label">Kamu butuh</div><div class="result-value">${beforeTax.toLocaleString()} Robux</div></div><div class="tax-tips"><strong>💡 Tips:</strong> Set harga gamepass <strong>${beforeTax.toLocaleString()} Robux</strong> untuk mendapatkan <strong>${amount.toLocaleString()} Robux</strong></div></div>`;
    }
}

function setupCopyButtons() {
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-copy')) {
            const target = document.getElementById(e.target.getAttribute('data-target'));
            if (target) {
                navigator.clipboard.writeText(target.textContent).then(() => {
                    e.target.textContent = '✓ Disalin!';
                    setTimeout(() => { e.target.textContent = 'Salin'; }, 2000);
                });
            }
        }
    });
}

// ==================== VILOG ====================
const VILOG_PIN = "floppafamily";

function setupVilogProtection() {
    const vilogContainer = document.getElementById('vilog-container');
    const pinProtection = document.getElementById('vilog-pin-protection');
    if (!vilogContainer || !pinProtection) return;
    pinProtection.style.display = 'block';
    vilogContainer.style.display = 'none';
    document.getElementById('toggleVilogPin')?.addEventListener('click', function () {
        const pinInput = document.getElementById('vilog-pin');
        pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('vilog-pin')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') checkVilogPin();
    });
}

function checkVilogPin() {
    const pin = document.getElementById('vilog-pin').value;
    if (pin === VILOG_PIN) {
        document.getElementById('vilog-pin-protection').style.display = 'none';
        document.getElementById('vilog-container').style.display = 'block';
        showToast("✅ PIN benar!");
    } else {
        showToast("❌ PIN salah!", 'error');
    }
}

// ==================== GIFT GAMEPASS SYSTEM ====================
let selectedGamepass = null;
let selectedItems = [];
let currentActiveMap = '';
let selectedGamepassReseller = null;
let selectedItemsReseller = [];
let currentActiveMapReseller = '';

// ==================== RENDER MAP LIST (no full reload, preserves order) ====================
/**
 * renderMapList - renders the gamepass sidebar WITHOUT resetting active state.
 * Only re-renders the list items, then re-applies the current active map.
 */
function renderMapList() {
    const mapList = document.getElementById('map-list');
    if (!mapList) return;

    const gamepasses = Object.entries(gamepassData).map(([name, data]) => ({
        name, rate: data.rate,
        items: Object.entries(data.items).map(([itemName, robux]) => ({ name: itemName, robux }))
    }));

    mapList.innerHTML = '';

    if (gamepasses.length === 0) {
        mapList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);">📭 Tidak ada data</div>';
        return;
    }

    gamepasses.forEach(gamepass => {
        const item = document.createElement('div');
        item.className = 'map-item';
        item.setAttribute('data-map-name', gamepass.name);

        if (gamepass.name === currentActiveMap) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="map-info">
                <div class="map-name">${gamepass.name}</div>
                <div class="map-rate">Rate: ${gamepass.rate}</div>
            </div>
            <div class="map-actions">
                <button type="button" class="btn-edit-small" title="Edit">✏️</button>
                <button type="button" class="btn-delete-small" title="Hapus">🗑️</button>
            </div>`;

        item.querySelector('.btn-edit-small').addEventListener('click', (e) => {
            e.stopPropagation();
            showEditGamepassPopup(gamepass.name);
        });

        item.querySelector('.btn-delete-small').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGamepass(gamepass.name);
        });

        item.addEventListener('click', () => {
            selectMap(gamepass.name);
        });

        mapList.appendChild(item);
    });
}

function selectMap(name) {
    const gamepass = buildGamepassObj(name, gamepassData);
    if (!gamepass) return;

    currentActiveMap = name;
    localStorage.setItem('activeGamepass', name);
    selectedGamepass = gamepass;
    selectedItems = [];

    // Update active class in DOM without re-rendering
    document.querySelectorAll('#map-list .map-item').forEach(i => {
        i.classList.toggle('active', i.getAttribute('data-map-name') === name);
    });

    updateSelectedItemsDisplay();
    const calcResult = document.getElementById('calculation-result');
    if (calcResult) calcResult.style.display = 'none';
    updateGamepassView();
}

function restoreActiveMapState() {
    if (!currentActiveMap || !gamepassData[currentActiveMap]) {
        selectedGamepass = null;
        return;
    }
    selectedGamepass = buildGamepassObj(currentActiveMap, gamepassData);
    // DOM active class already applied in renderMapList
}

function buildGamepassObj(name, data) {
    if (!data[name]) return null;
    return {
        name,
        rate: data[name].rate,
        items: Object.entries(data[name].items).map(([itemName, robux]) => ({ name: itemName, robux }))
    };
}

// Alias for backward compat
function loadGamepassMaps() {
    renderMapList();
}

function updateGamepassView() {
    const noMap = document.getElementById('no-map-selected');
    const itemsSection = document.getElementById('items-section');
    const title = document.getElementById('selected-map-title');

    if (!noMap || !itemsSection || !title) return;

    if (selectedGamepass) {
        title.textContent = selectedGamepass.name;
        noMap.style.display = 'none';
        itemsSection.style.display = 'block';
        loadItemsForSelectedMap();
        setupItemsSearch();
    } else {
        noMap.style.display = '';
        itemsSection.style.display = 'none';
        title.textContent = 'Pilih Map';
    }
}

function setupItemsSearch() {
    const searchInput = document.getElementById('items-search');
    if (!searchInput) return;
    searchInput.value = '';
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    newInput.addEventListener('input', function () {
        const term = this.value.toLowerCase();
        document.querySelectorAll('#items-list .item-option').forEach(option => {
            const name = option.getAttribute('data-item-name') || '';
            option.style.display = name.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

function loadItemsForSelectedMap() {
    const list = document.getElementById('items-list');
    if (!selectedGamepass || !list) return;
    list.innerHTML = '';
    selectedGamepass.items.forEach(item => {
        const count = selectedItems.filter(i => i.itemName === item.name).length;
        const option = document.createElement('div');
        option.className = 'item-option';
        option.setAttribute('data-item-name', item.name);
        option.innerHTML = `
            <div class="item-option-name">${item.name}</div>
            <div class="item-option-robux">${item.robux} Robux</div>
            ${count > 0 ? `<span class="item-counter">${count}</span>` : ''}`;
        option.addEventListener('click', () => {
            addToSelectedItems(item.name, item.robux);
            updateItemCounters();
        });
        list.appendChild(option);
    });
}

function updateItemCounters() {
    document.querySelectorAll('#items-list .item-option').forEach(option => {
        const itemName = option.getAttribute('data-item-name');
        const count = selectedItems.filter(i => i.itemName === itemName).length;
        let counter = option.querySelector('.item-counter');
        if (count > 0) {
            if (!counter) { counter = document.createElement('span'); counter.className = 'item-counter'; option.appendChild(counter); }
            counter.textContent = count;
        } else if (counter) { counter.remove(); }
    });
}

function addToSelectedItems(name, robux) {
    selectedItems.push({ gamepassName: selectedGamepass.name, itemName: name, robux });
    updateSelectedItemsDisplay();
}

function updateSelectedItemsDisplay() {
    const container = document.getElementById('selected-items');
    if (!container) return;
    container.innerHTML = '<h4>🛒 Item Terpilih:</h4>';
    if (selectedItems.length === 0) {
        container.innerHTML += '<div style="color:var(--muted);text-align:center;padding:0.5rem 0;">Belum ada item</div>';
        return;
    }
    selectedItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'selected-item';
        div.innerHTML = `
            <span class="selected-item-name">${item.itemName}</span>
            <span class="selected-item-robux">${item.robux} Robux</span>
            <button type="button" class="remove-item" onclick="removeSelectedItem(${index})">×</button>`;
        container.appendChild(div);
    });
}

function removeSelectedItem(index) {
    selectedItems.splice(index, 1);
    updateSelectedItemsDisplay();
    updateItemCounters();
    if (selectedItems.length === 0) {
        const calcResult = document.getElementById('calculation-result');
        if (calcResult) calcResult.style.display = 'none';
    }
}

function calculateTotal() {
    if (!selectedGamepass || selectedItems.length === 0) { showToast('Pilih map dan item!', 'error'); return; }
    let totalRobux = 0, grandTotal = 0;
    let details = '<h4 style="margin-bottom:1rem;color:var(--pink-dark);">📋 Detail Perhitungan:</h4>';
    const itemsByGamepass = {};
    selectedItems.forEach(item => {
        if (!itemsByGamepass[item.gamepassName]) itemsByGamepass[item.gamepassName] = [];
        itemsByGamepass[item.gamepassName].push(item);
    });
    for (const [gpName, items] of Object.entries(itemsByGamepass)) {
        const rate = gamepassData[gpName]?.rate || 110;
        details += `<div style="margin-bottom:0.5rem;"><strong style="color:var(--text);">${gpName}</strong> <span style="color:var(--muted);font-size:0.85rem;">(Rate: ${rate})</span>:</div>`;
        items.forEach(item => {
            const itemTotal = item.robux * rate;
            totalRobux += item.robux;
            grandTotal += itemTotal;
            details += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0;border-bottom:1px solid var(--border);"><span style="flex:1;">${item.itemName}</span><span style="text-align:right;"><span style="color:var(--pink-dark);font-weight:600;">${item.robux}</span> <span style="color:var(--muted);">× ${rate}</span> = <strong style="color:var(--success);">Rp${itemTotal.toLocaleString('id-ID')}</strong></span></div>`;
        });
    }
    const resultDiv = document.getElementById('calculation-result');
    resultDiv.innerHTML = `
        <div class="calc-detail-section">${details}</div>
        <div class="calc-total-section" style="border-top:2px solid var(--pink);padding-top:1rem;margin-top:1rem;">
            <div class="calc-total-row" style="display:flex;justify-content:space-between;align-items:center;font-size:1.3rem;font-weight:700;margin-bottom:0.5rem;">
                <span style="color:var(--text);">💰 TOTAL:</span>
                <span style="color:var(--success);" id="total-amount">Rp${grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="calc-total-info" style="color:var(--muted);font-size:0.9rem;text-align:center;">
                Total Robux: <strong>${totalRobux}</strong> | Item: <strong>${selectedItems.length}</strong>
            </div>
        </div>
        <div class="calc-action-bar">
            <button type="button" class="btn btn-neoleaf calc-btn-reset" onclick="clearAllSelectedItems()">🔄 Reset</button>
            <button type="button" class="btn btn-neoleaf calc-btn-copy" onclick="copyTotalAmount()">📋 Salin Total</button>
        </div>`;
    resultDiv.style.display = 'block';
}

function copyTotalAmount() {
    const totalElement = document.getElementById('total-amount');
    if (!totalElement) return;
    navigator.clipboard.writeText(totalElement.textContent.replace('Rp', '').trim()).then(() => {
        showToast('Total harga disalin!');
        const btn = document.querySelector('.calc-btn-copy');
        if (btn) { btn.textContent = '✓ Disalin!'; setTimeout(() => { btn.textContent = '📋 Salin Total'; }, 2000); }
    });
}

function clearAllSelectedItems() {
    selectedItems = [];
    updateSelectedItemsDisplay();
    updateItemCounters();
    const calcResult = document.getElementById('calculation-result');
    if (calcResult) calcResult.style.display = 'none';
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

// ==================== ADMIN FUNCTIONS GIFT GAMEPASS ====================
let currentEditGamepass = '';

function showEditGamepassPopup(name) {
    currentEditGamepass = name;
    const data = gamepassData[name];
    if (!data) { showToast('Gamepass tidak ditemukan', 'error'); return; }
    document.getElementById('edit-gamepass-name').value = name;
    document.getElementById('edit-gamepass-rate').value = data.rate;
    document.getElementById('edit-gamepass-bulk').value = '';
    const itemsContainer = document.getElementById('edit-items-rows');
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';
    for (const [itemName, robux] of Object.entries(data.items)) addEditItemField(itemName, robux);
    document.getElementById('edit-gamepass-popup').style.display = 'flex';
}

function filterEditItems(searchTerm) {
    const term = searchTerm.toLowerCase();
    document.querySelectorAll('#edit-items-rows .item-input-row').forEach(row => {
        const nameInput = row.querySelector('.edit-item-name');
        if (nameInput) row.style.display = nameInput.value.toLowerCase().includes(term) ? '' : 'none';
    });
}

function closeEditPopup() { document.getElementById('edit-gamepass-popup').style.display = 'none'; }
function showAddGamepassPopup() {
    document.getElementById('new-gamepass-name').value = '';
    document.getElementById('new-gamepass-rate').value = 110;
    document.getElementById('new-gamepass-bulk').value = '';
    document.getElementById('new-items-container').innerHTML = `<div class="item-input-row"><input type="text" class="form-control new-item-name" placeholder="Nama item"><input type="number" class="form-control new-item-robux" placeholder="Robux" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button></div>`;
    document.getElementById('add-gamepass-popup').style.display = 'flex';
}
function closeAddPopup() { document.getElementById('add-gamepass-popup').style.display = 'none'; }

function showEditRatesPopup() {
    const container = document.getElementById('rates-list');
    container.innerHTML = '';
    for (const [name, data] of Object.entries(gamepassData)) {
        container.innerHTML += `<div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem;"><span style="flex:1;">${name}</span><input type="number" id="rate-${name}" class="form-control" value="${data.rate}" style="width:80px;"></div>`;
    }
    document.getElementById('edit-rates-popup').style.display = 'flex';
}
function closeRatesPopup() { document.getElementById('edit-rates-popup').style.display = 'none'; }

function addEditItemField(name = '', robux = '') {
    const container = document.getElementById('edit-items-rows');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'item-input-row';
    div.innerHTML = `<input type="text" class="form-control edit-item-name" placeholder="Nama item" value="${name}"><input type="number" class="form-control edit-item-robux" placeholder="Robux" value="${robux}" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

function addNewItemField() {
    const container = document.getElementById('new-items-container');
    const div = document.createElement('div');
    div.className = 'item-input-row';
    div.innerHTML = `<input type="text" class="form-control new-item-name" placeholder="Nama item"><input type="number" class="form-control new-item-robux" placeholder="Robux" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

function parseBulkItemsText(text) {
    const items = {};
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const rawLine of lines) {
        const line = rawLine.replace(/\r/g, '').trim();
        const lower = line.toLowerCase();
        if (!line || lower.includes('nama') || lower.includes('jml') || lower.includes('robux') || lower.includes('total')) continue;
        const parts = line.split(/\t|,/).map(p => p.trim()).filter(Boolean);
        let name = '', robuxText = '';
        if (parts.length >= 2) { robuxText = parts.pop(); name = parts.join(' '); }
        else { const match = line.match(/^(.+?)\s+(\d+)$/); if (match) { name = match[1].trim(); robuxText = match[2]; } }
        if (!name || !robuxText) continue;
        const robux = parseInt(robuxText.replace(/[^\d]/g, ''), 10);
        if (!robux || robux <= 0) continue;
        items[name] = robux;
    }
    return items;
}

function populateItemsFromBulk(textareaId, containerId, inputNameClass, inputRobuxClass) {
    const text = document.getElementById(textareaId)?.value || '';
    const items = parseBulkItemsText(text);
    if (Object.keys(items).length === 0) { showToast('Tidak ada item valid.', 'warning'); return false; }
    document.getElementById(containerId).innerHTML = '';
    for (const [name, robux] of Object.entries(items)) {
        const div = document.createElement('div');
        div.className = 'item-input-row';
        div.innerHTML = `<input type="text" class="form-control ${inputNameClass}" placeholder="Nama item" value="${name}"><input type="number" class="form-control ${inputRobuxClass}" placeholder="Robux" style="width:100px;" value="${robux}"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>`;
        document.getElementById(containerId).appendChild(div);
    }
    showToast(`✅ ${Object.keys(items).length} item di-import`);
    return true;
}

function importBulkItemsToNewGamepass() { populateItemsFromBulk('new-gamepass-bulk', 'new-items-container', 'new-item-name', 'new-item-robux'); }
function importBulkItemsToEditGamepass() { populateItemsFromBulk('edit-gamepass-bulk', 'edit-items-rows', 'edit-item-name', 'edit-item-robux'); }
function importBulkItemsToNewGamepassReseller() { populateItemsFromBulk('new-gamepass-bulk-reseller', 'new-items-container-reseller', 'new-item-name-reseller', 'new-item-robux-reseller'); }
function importBulkItemsToEditGamepassReseller() { populateItemsFromBulk('edit-gamepass-bulk-reseller', 'edit-items-rows-reseller', 'edit-item-name-reseller', 'edit-item-robux-reseller'); }

async function saveGamepassEdit() {
    const newName = document.getElementById('edit-gamepass-name').value.trim();
    const rate = parseInt(document.getElementById('edit-gamepass-rate').value);
    if (!newName || !rate) { alert('Isi nama dan rate!'); return; }

    const items = {};
    document.querySelectorAll('.edit-item-name').forEach((nameInput, i) => {
        const name = nameInput.value.trim();
        const robux = parseInt(document.querySelectorAll('.edit-item-robux')[i].value);
        if (name && robux) items[name] = robux;
    });
    if (Object.keys(items).length === 0) { alert('Tambahkan minimal 1 item!'); return; }

    const success = await updateGamepassOnServer(currentEditGamepass, newName, rate, items);
    if (!success) return;

    // Rename in-place, preserving order
    const newGamepassData = {};
    Object.keys(gamepassData).forEach(key => {
        newGamepassData[key === currentEditGamepass ? newName : key] = key === currentEditGamepass ? { rate, items } : gamepassData[key];
    });
    gamepassData = newGamepassData;

    if (resellerData[currentEditGamepass]) {
        const newReseller = {};
        Object.keys(resellerData).forEach(key => {
            newReseller[key === currentEditGamepass ? newName : key] = key === currentEditGamepass ? { rate: resellerData[currentEditGamepass].rate, items } : resellerData[key];
        });
        resellerData = newReseller;
    }

    if (currentActiveMap === currentEditGamepass) {
        currentActiveMap = newName;
        localStorage.setItem('activeGamepass', currentActiveMap);
    }

    saveToLocalStorage();
    closeEditPopup();

    // Re-render list (preserves position)
    renderMapList();
    renderMapListReseller();

    // Update selectedGamepass if it was the edited one
    if (selectedGamepass && (selectedGamepass.name === currentEditGamepass || selectedGamepass.name === newName)) {
        selectedGamepass = buildGamepassObj(newName, gamepassData);
    }

    updateGamepassView();
    showToast('✅ Gamepass diupdate!');
}

async function addNewGamepass() {
    const name = document.getElementById('new-gamepass-name').value.trim();
    const rate = parseInt(document.getElementById('new-gamepass-rate').value);
    if (!name || !rate) { alert('Isi nama dan rate!'); return; }
    if (gamepassData[name]) { alert('Gamepass sudah ada!'); return; }

    const items = {};
    document.querySelectorAll('.new-item-name').forEach((nameInput, i) => {
        const itemName = nameInput.value.trim();
        const robux = parseInt(document.querySelectorAll('.new-item-robux')[i].value);
        if (itemName && robux) items[itemName] = robux;
    });
    if (Object.keys(items).length === 0) { alert('Tambahkan minimal 1 item!'); return; }

    gamepassData[name] = { rate, items };
    saveToLocalStorage();
    await saveDataToServer();
    closeAddPopup();
    renderMapList();
    showToast('✅ Gamepass ditambahkan!');
}

async function saveAllRates() {
    const newRates = {};
    for (const name of Object.keys(gamepassData)) {
        const input = document.getElementById(`rate-${name}`);
        const rate = input ? parseInt(input.value) : 0;
        if (rate > 0) newRates[name] = rate;
    }
    if (Object.keys(newRates).length === 0) { alert('Rate tidak valid!'); return; }

    const success = await updateRatesOnServer(newRates);
    if (!success) return;

    for (const [name, rate] of Object.entries(newRates)) {
        gamepassData[name].rate = rate;
        if (selectedGamepass && selectedGamepass.name === name) selectedGamepass.rate = rate;
    }

    saveToLocalStorage();
    closeRatesPopup();
    renderMapList();
    showToast('✅ Rates diupdate!');
}

async function deleteGamepass(name) {
    if (!confirm(`Hapus "${name}"?`)) return;

    const success = await deleteGamepassOnServer(name);
    if (!success) return;

    delete gamepassData[name];
    if (resellerData[name]) delete resellerData[name];

    if (currentActiveMap === name) {
        currentActiveMap = '';
        localStorage.removeItem('activeGamepass');
        selectedGamepass = null;
        selectedItems = [];
    }

    saveToLocalStorage();
    renderMapList();
    renderMapListReseller();
    updateGamepassView();
    updateSelectedItemsDisplay();
    const calcResult = document.getElementById('calculation-result');
    if (calcResult) calcResult.style.display = 'none';
    showToast('✅ Gamepass dihapus!');
}

// ==================== RESELLER MAP RENDER ====================
function renderMapListReseller() {
    const mapList = document.getElementById('reseller-map-list');
    if (!mapList) return;

    const gamepasses = Object.entries(resellerData).map(([name, data]) => ({
        name, rate: data.rate,
        items: Object.entries(data.items).map(([itemName, robux]) => ({ name: itemName, robux }))
    }));

    mapList.innerHTML = '';

    if (gamepasses.length === 0) {
        mapList.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--muted);">📭 Tidak ada data</div>';
        return;
    }

    gamepasses.forEach(gamepass => {
        const item = document.createElement('div');
        item.className = 'map-item';
        item.setAttribute('data-map-name', gamepass.name);

        if (gamepass.name === currentActiveMapReseller) item.classList.add('active');

        item.innerHTML = `
            <div class="map-info">
                <div class="map-name">${gamepass.name}</div>
                <div class="map-rate">Rate: ${gamepass.rate}</div>
            </div>
            <div class="map-actions">
                <button type="button" class="btn-edit-small" title="Edit">✏️</button>
                <button type="button" class="btn-delete-small" title="Hapus">🗑️</button>
            </div>`;

        item.querySelector('.btn-edit-small').addEventListener('click', (e) => {
            e.stopPropagation();
            showEditGamepassPopupReseller(gamepass.name);
        });
        item.querySelector('.btn-delete-small').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGamepassReseller(gamepass.name);
        });
        item.addEventListener('click', () => selectMapReseller(gamepass.name));

        mapList.appendChild(item);
    });
}

function selectMapReseller(name) {
    const gamepass = buildGamepassObj(name, resellerData);
    if (!gamepass) return;

    currentActiveMapReseller = name;
    localStorage.setItem('activeResellerGamepass', name);
    selectedGamepassReseller = gamepass;
    selectedItemsReseller = [];

    document.querySelectorAll('#reseller-map-list .map-item').forEach(i => {
        i.classList.toggle('active', i.getAttribute('data-map-name') === name);
    });

    updateSelectedItemsDisplayReseller();
    const calcResult = document.getElementById('reseller-calculation-result');
    if (calcResult) calcResult.style.display = 'none';
    updateGamepassViewReseller();
}

function restoreActiveMapStateReseller() {
    if (!currentActiveMapReseller || !resellerData[currentActiveMapReseller]) {
        selectedGamepassReseller = null;
        return;
    }
    selectedGamepassReseller = buildGamepassObj(currentActiveMapReseller, resellerData);
}

// Alias for backward compat
function loadGamepassMapsReseller() { renderMapListReseller(); }

function updateGamepassViewReseller() {
    const noMap = document.getElementById('reseller-no-map-selected');
    const itemsSection = document.getElementById('reseller-items-section');
    const title = document.getElementById('reseller-selected-map-title');

    if (!noMap || !itemsSection || !title) return;

    if (selectedGamepassReseller) {
        title.textContent = selectedGamepassReseller.name;
        noMap.style.display = 'none';
        itemsSection.style.display = 'block';
        loadItemsForSelectedMapReseller();
        setupItemsSearchReseller();
    } else {
        noMap.style.display = '';
        itemsSection.style.display = 'none';
        title.textContent = 'Pilih Map';
    }
}

function setupItemsSearchReseller() {
    const searchInput = document.getElementById('reseller-items-search');
    if (!searchInput) return;
    searchInput.value = '';
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    newInput.addEventListener('input', function () {
        const term = this.value.toLowerCase();
        document.querySelectorAll('#reseller-items-list .item-option').forEach(option => {
            const name = option.getAttribute('data-item-name') || '';
            option.style.display = name.toLowerCase().includes(term) ? '' : 'none';
        });
    });
}

function loadItemsForSelectedMapReseller() {
    const list = document.getElementById('reseller-items-list');
    if (!selectedGamepassReseller || !list) return;
    list.innerHTML = '';
    selectedGamepassReseller.items.forEach(item => {
        const count = selectedItemsReseller.filter(i => i.itemName === item.name).length;
        const option = document.createElement('div');
        option.className = 'item-option';
        option.setAttribute('data-item-name', item.name);
        option.innerHTML = `
            <div class="item-option-name">${item.name}</div>
            <div class="item-option-robux">${item.robux} Robux</div>
            ${count > 0 ? `<span class="item-counter">${count}</span>` : ''}`;
        option.addEventListener('click', () => {
            addToSelectedItemsReseller(item.name, item.robux);
            updateItemCountersReseller();
        });
        list.appendChild(option);
    });
}

function updateItemCountersReseller() {
    document.querySelectorAll('#reseller-items-list .item-option').forEach(option => {
        const itemName = option.getAttribute('data-item-name');
        const count = selectedItemsReseller.filter(i => i.itemName === itemName).length;
        let counter = option.querySelector('.item-counter');
        if (count > 0) {
            if (!counter) { counter = document.createElement('span'); counter.className = 'item-counter'; option.appendChild(counter); }
            counter.textContent = count;
        } else if (counter) { counter.remove(); }
    });
}

function addToSelectedItemsReseller(name, robux) {
    selectedItemsReseller.push({ gamepassName: selectedGamepassReseller.name, itemName: name, robux });
    updateSelectedItemsDisplayReseller();
}

function updateSelectedItemsDisplayReseller() {
    const container = document.getElementById('reseller-selected-items');
    if (!container) return;
    container.innerHTML = '<h4>🛒 Item Terpilih:</h4>';
    if (selectedItemsReseller.length === 0) {
        container.innerHTML += '<div style="color:var(--muted);text-align:center;padding:0.5rem 0;">Belum ada item</div>';
        return;
    }
    selectedItemsReseller.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'selected-item';
        div.innerHTML = `
            <span class="selected-item-name">${item.itemName}</span>
            <span class="selected-item-robux">${item.robux} Robux</span>
            <button type="button" class="remove-item" onclick="removeSelectedItemReseller(${index})">×</button>`;
        container.appendChild(div);
    });
}

function removeSelectedItemReseller(index) {
    selectedItemsReseller.splice(index, 1);
    updateSelectedItemsDisplayReseller();
    updateItemCountersReseller();
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

function calculateTotalReseller() {
    if (!selectedGamepassReseller || selectedItemsReseller.length === 0) { showToast('Pilih map dan item!', 'error'); return; }
    let totalRobux = 0, grandTotal = 0;
    let details = '<h4 style="margin-bottom:1rem;color:var(--pink-dark);">📋 Detail Perhitungan:</h4>';
    const itemsByGamepass = {};
    selectedItemsReseller.forEach(item => {
        if (!itemsByGamepass[item.gamepassName]) itemsByGamepass[item.gamepassName] = [];
        itemsByGamepass[item.gamepassName].push(item);
    });
    for (const [gpName, items] of Object.entries(itemsByGamepass)) {
        const rate = resellerData[gpName]?.rate || 100;
        details += `<div style="margin-bottom:0.5rem;"><strong style="color:var(--text);">${gpName}</strong> <span style="color:var(--muted);font-size:0.85rem;">(Rate: ${rate})</span>:</div>`;
        items.forEach(item => {
            const total = item.robux * rate;
            totalRobux += item.robux;
            grandTotal += total;
            details += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0;border-bottom:1px solid var(--border);"><span style="flex:1;">${item.itemName}</span><span style="text-align:right;"><span style="color:var(--pink-dark);font-weight:600;">${item.robux}</span> <span style="color:var(--muted);">× ${rate}</span> = <strong style="color:var(--success);">Rp${total.toLocaleString('id-ID')}</strong></span></div>`;
        });
    }
    const resultDiv = document.getElementById('reseller-calculation-result');
    resultDiv.innerHTML = `
        <div class="calc-detail-section">${details}</div>
        <div class="calc-total-section" style="border-top:2px solid var(--pink);padding-top:1rem;margin-top:1rem;">
            <div class="calc-total-row" style="display:flex;justify-content:space-between;align-items:center;font-size:1.3rem;font-weight:700;margin-bottom:0.5rem;">
                <span style="color:var(--text);">💰 TOTAL:</span>
                <span style="color:var(--success);" id="reseller-total-amount">Rp${grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="calc-total-info" style="color:var(--muted);font-size:0.9rem;text-align:center;">
                Total Robux: <strong>${totalRobux}</strong> | Item: <strong>${selectedItemsReseller.length}</strong>
            </div>
        </div>
        <div class="calc-action-bar">
            <button type="button" class="btn btn-neoleaf calc-btn-reset" onclick="clearSelectionReseller()">🔄 Reset</button>
            <button type="button" class="btn btn-neoleaf calc-btn-copy" onclick="copyTotalAmountReseller()">📋 Salin Total</button>
        </div>`;
    resultDiv.style.display = 'block';
}

function copyTotalAmountReseller() {
    const totalElement = document.getElementById('reseller-total-amount');
    if (!totalElement) return;
    navigator.clipboard.writeText(totalElement.textContent.replace('Rp', '').trim()).then(() => {
        showToast('Total disalin!');
        const btn = document.querySelector('#reseller .calc-btn-copy');
        if (btn) { btn.textContent = '✓ Disalin!'; setTimeout(() => { btn.textContent = '📋 Salin Total'; }, 2000); }
    });
}

function clearSelectionReseller() {
    selectedItemsReseller = [];
    updateSelectedItemsDisplayReseller();
    updateItemCountersReseller();
    const calcResult = document.getElementById('reseller-calculation-result');
    if (calcResult) calcResult.style.display = 'none';
}

// ==================== ADMIN FUNCTIONS RESELLER ====================
let currentEditGamepassReseller = '';

function showEditGamepassPopupReseller(name) {
    currentEditGamepassReseller = name;
    const data = resellerData[name];
    if (!data) { showToast('Gamepass reseller tidak ditemukan', 'error'); return; }
    document.getElementById('edit-gamepass-name-reseller').value = name;
    document.getElementById('edit-gamepass-rate-reseller').value = data.rate;
    document.getElementById('edit-gamepass-bulk-reseller').value = '';
    const itemsContainer = document.getElementById('edit-items-rows-reseller');
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';
    for (const [itemName, robux] of Object.entries(data.items)) addEditItemFieldReseller(itemName, robux);
    document.getElementById('edit-gamepass-popup-reseller').style.display = 'flex';
}

function filterEditItemsReseller(searchTerm) {
    const term = searchTerm.toLowerCase();
    document.querySelectorAll('#edit-items-rows-reseller .item-input-row').forEach(row => {
        const nameInput = row.querySelector('.edit-item-name-reseller');
        if (nameInput) row.style.display = nameInput.value.toLowerCase().includes(term) ? '' : 'none';
    });
}

function closeEditPopupReseller() { document.getElementById('edit-gamepass-popup-reseller').style.display = 'none'; }

function showAddGamepassPopupReseller() {
    document.getElementById('new-gamepass-name-reseller').value = '';
    document.getElementById('new-gamepass-rate-reseller').value = 100;
    document.getElementById('new-gamepass-bulk-reseller').value = '';
    document.getElementById('new-items-container-reseller').innerHTML = `<div class="item-input-row"><input type="text" class="form-control new-item-name-reseller" placeholder="Nama item"><input type="number" class="form-control new-item-robux-reseller" placeholder="Robux" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button></div>`;
    document.getElementById('add-gamepass-popup-reseller').style.display = 'flex';
}
function closeAddPopupReseller() { document.getElementById('add-gamepass-popup-reseller').style.display = 'none'; }

function showEditRatesPopupReseller() {
    const container = document.getElementById('rates-list-reseller');
    container.innerHTML = '';
    for (const [name, data] of Object.entries(resellerData)) {
        container.innerHTML += `<div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem;"><span style="flex:1;">${name}</span><input type="number" id="rate-reseller-${name}" class="form-control" value="${data.rate}" style="width:80px;"></div>`;
    }
    document.getElementById('edit-rates-popup-reseller').style.display = 'flex';
}
function closeRatesPopupReseller() { document.getElementById('edit-rates-popup-reseller').style.display = 'none'; }

function addEditItemFieldReseller(name = '', robux = '') {
    const container = document.getElementById('edit-items-rows-reseller');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'item-input-row';
    div.innerHTML = `<input type="text" class="form-control edit-item-name-reseller" placeholder="Nama item" value="${name}"><input type="number" class="form-control edit-item-robux-reseller" placeholder="Robux" value="${robux}" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

function addNewItemFieldReseller() {
    const container = document.getElementById('new-items-container-reseller');
    const div = document.createElement('div');
    div.className = 'item-input-row';
    div.innerHTML = `<input type="text" class="form-control new-item-name-reseller" placeholder="Nama item"><input type="number" class="form-control new-item-robux-reseller" placeholder="Robux" style="width:100px;"><button type="button" class="remove-item-btn" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

async function saveGamepassEditReseller() {
    const newName = document.getElementById('edit-gamepass-name-reseller').value.trim();
    const rate = parseInt(document.getElementById('edit-gamepass-rate-reseller').value);
    if (!newName || !rate) { alert('Isi nama dan rate!'); return; }

    const items = {};
    document.querySelectorAll('.edit-item-name-reseller').forEach((nameInput, i) => {
        const name = nameInput.value.trim();
        const robux = parseInt(document.querySelectorAll('.edit-item-robux-reseller')[i].value);
        if (name && robux) items[name] = robux;
    });
    if (Object.keys(items).length === 0) { alert('Tambahkan minimal 1 item!'); return; }

    const success = await updateGamepassOnServer(currentEditGamepassReseller, newName, rate, items);
    if (!success) return;

    const newReseller = {};
    Object.keys(resellerData).forEach(key => {
        newReseller[key === currentEditGamepassReseller ? newName : key] = key === currentEditGamepassReseller ? { rate, items } : resellerData[key];
    });
    resellerData = newReseller;

    if (currentActiveMapReseller === currentEditGamepassReseller) {
        currentActiveMapReseller = newName;
        localStorage.setItem('activeResellerGamepass', currentActiveMapReseller);
    }

    saveToLocalStorage();
    closeEditPopupReseller();
    renderMapListReseller();

    if (selectedGamepassReseller && (selectedGamepassReseller.name === currentEditGamepassReseller || selectedGamepassReseller.name === newName)) {
        selectedGamepassReseller = buildGamepassObj(newName, resellerData);
    }

    updateGamepassViewReseller();
    showToast('✅ Reseller diupdate!');
}

async function addNewGamepassReseller() {
    const name = document.getElementById('new-gamepass-name-reseller').value.trim();
    const rate = parseInt(document.getElementById('new-gamepass-rate-reseller').value);
    if (!name || !rate) { alert('Isi nama dan rate!'); return; }

    const items = {};
    document.querySelectorAll('.new-item-name-reseller').forEach((nameInput, i) => {
        const itemName = nameInput.value.trim();
        const robux = parseInt(document.querySelectorAll('.new-item-robux-reseller')[i].value);
        if (itemName && robux) items[itemName] = robux;
    });
    if (Object.keys(items).length === 0) { alert('Tambahkan minimal 1 item!'); return; }

    resellerData[name] = { rate, items };
    saveToLocalStorage();
    await saveDataToServer();
    closeAddPopupReseller();
    renderMapListReseller();
    showToast('✅ Reseller ditambahkan!');
}

async function saveAllRatesReseller() {
    const newRates = {};
    for (const name of Object.keys(resellerData)) {
        const input = document.getElementById(`rate-reseller-${name}`);
        const rate = input ? parseInt(input.value) : 0;
        if (rate > 0) newRates[name] = rate;
    }
    if (Object.keys(newRates).length === 0) { alert('Rate tidak valid!'); return; }

    const success = await updateRatesOnServer(newRates);
    if (!success) return;

    for (const [name, rate] of Object.entries(newRates)) {
        resellerData[name].rate = rate;
        if (selectedGamepassReseller && selectedGamepassReseller.name === name) selectedGamepassReseller.rate = rate;
    }

    saveToLocalStorage();
    closeRatesPopupReseller();
    renderMapListReseller();
    showToast('✅ Rates reseller diupdate!');
}

async function deleteGamepassReseller(name) {
    if (!confirm(`Hapus "${name}" dari reseller?`)) return;

    const success = await deleteGamepassOnServer(name);
    if (!success) return;

    delete resellerData[name];
    if (currentActiveMapReseller === name) {
        currentActiveMapReseller = '';
        localStorage.removeItem('activeResellerGamepass');
        selectedGamepassReseller = null;
        selectedItemsReseller = [];
    }

    saveToLocalStorage();
    renderMapListReseller();
    updateGamepassViewReseller();
    updateSelectedItemsDisplayReseller();
    const calcResult = document.getElementById('reseller-calculation-result');
    if (calcResult) calcResult.style.display = 'none';
    showToast('✅ Reseller dihapus!');
}

// ==================== REFRESH BUTTON ====================
function addRefreshButton() {
    const giftHeader = document.querySelector('#giftgamepass .tab-header .admin-actions-header');
    if (giftHeader && !document.getElementById('refresh-data-btn')) {
        const btn = document.createElement('button');
        btn.id = 'refresh-data-btn';
        btn.type = 'button';
        btn.className = 'btn btn-neoleaf';
        btn.innerHTML = '🔄 Refresh';
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = '⏳ Loading...';
            await fetchDataFromServer();
            renderMapList();
            renderMapListReseller();
            restoreActiveMapState();
            restoreActiveMapStateReseller();
            updateGamepassView();
            btn.disabled = false;
            btn.innerHTML = '🔄 Refresh';
            showToast('✅ Data di-refresh!');
        };
        giftHeader.appendChild(btn);
    }

    const resellerHeader = document.querySelector('#reseller .tab-header .admin-actions-header');
    if (resellerHeader && !document.getElementById('refresh-data-btn-reseller')) {
        const btn = document.createElement('button');
        btn.id = 'refresh-data-btn-reseller';
        btn.type = 'button';
        btn.className = 'btn btn-neoleaf';
        btn.innerHTML = '🔄 Refresh';
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = '⏳ Loading...';
            await fetchDataFromServer();
            renderMapList();
            renderMapListReseller();
            restoreActiveMapState();
            restoreActiveMapStateReseller();
            updateGamepassViewReseller();
            btn.disabled = false;
            btn.innerHTML = '🔄 Refresh';
            showToast('✅ Data di-refresh!');
        };
        resellerHeader.appendChild(btn);
    }
}

// ==================== SMART POLLING (no spam, no reload) ====================
let pollingTimer = null;
const POLL_INTERVAL = 30000; // 30 seconds - reasonable for realtime without spam

function isAnyPopupOpen() {
    return Array.from(document.querySelectorAll('.popup-overlay')).some(el => el.style.display === 'flex');
}

async function pollIfSafe() {
    // Don't poll if popup is open (user is actively editing)
    if (isAnyPopupOpen()) return;
    // Don't poll if page is hidden (tab is in background)
    if (document.hidden) return;

    const activeTab = document.querySelector('.nav-tab.active');
    if (!activeTab) return;
    const tabId = activeTab.getAttribute('data-tab');
    if (tabId !== 'giftgamepass' && tabId !== 'reseller') return;

    const success = await fetchDataFromServer();
    if (!success) return;

    // Only update the sidebar list (preserves active state via data-map-name)
    renderMapList();
    renderMapListReseller();

    // Refresh item list only if no items selected (avoid disrupting active session)
    if (selectedItems.length === 0 && tabId === 'giftgamepass') {
        restoreActiveMapState();
        updateGamepassView();
    }
    if (selectedItemsReseller.length === 0 && tabId === 'reseller') {
        restoreActiveMapStateReseller();
        updateGamepassViewReseller();
    }
}

function startSmartPolling() {
    // Clear any existing timer
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(pollIfSafe, POLL_INTERVAL);

    // Also poll when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pollIfSafe();
    });
}

console.log('✅ Script loaded successfully');