const { MongoClient } = require('mongodb');

// ==================== KONFIGURASI ====================
// Ganti dengan connection string MongoDB Atlas Anda
const MONGODB_URI = 'mongodb+srv://mayocuak_db_user:mayoblox123@cluster0.efrs7os.mongodb.net/mayopass?retryWrites=true&w=majority';
const DB_NAME = 'mayopass';
const COLLECTION_NAME = 'gamepass_data';
const RESELLER_RATE = 90; // Rate global untuk reseller (bisa diubah sesuai keinginan)

// ==================== KONEKSI DATABASE ====================
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  cachedClient = client;
  cachedDb = db;
  return db;
}

// ==================== MAIN HANDLER ====================
module.exports = async (req, res) => {
  // CORS - biar bisa diakses dari mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const action = req.query.action || req.body?.action;
  
  try {
    const db = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // ==================== GET DATA ====================
    if (action === 'getGamepassData') {
      let gamepassDoc = await collection.findOne({ type: 'gamepassData' });
      let resellerDoc = await collection.findOne({ type: 'resellerData' });
      
      // Kalo kosong, create default
      if (!gamepassDoc) {
        await collection.insertOne({ type: 'gamepassData', data: {} });
        gamepassDoc = { data: {} };
      }
      if (!resellerDoc) {
        await collection.insertOne({ type: 'resellerData', data: {} });
        resellerDoc = { data: {} };
      }
      
      return res.json({
        success: true,
        gamepassData: gamepassDoc.data || {},
        resellerData: resellerDoc.data || {}
      });
    }
    
    // ==================== SAVE DATA (DENGAN SYNC OTOMATIS) ====================
    if (action === 'saveGamepassData') {
      let gamepassData, resellerData;
      
      // Ambil data dari query parameter (GET) atau body (POST)
      if (req.query.data) {
        const decoded = JSON.parse(decodeURIComponent(req.query.data));
        gamepassData = decoded.gamepassData;
        resellerData = decoded.resellerData;
      } else if (req.body) {
        gamepassData = req.body.gamepassData;
        resellerData = req.body.resellerData;
      }
      
      // ===== 1. PROSES GAMEPASS DATA =====
      if (gamepassData && Object.keys(gamepassData).length > 0) {
        // Ambil data gamepass yang sudah ada
        const gamepassDoc = await collection.findOne({ type: 'gamepassData' });
        const currentGamepassData = gamepassDoc?.data || {};
        
        // Merge dengan data baru (update atau tambah)
        for (const [gameName, gameValue] of Object.entries(gamepassData)) {
          // Kalo ada items, berarti ini gamepass lengkap
          if (gameValue.items) {
            currentGamepassData[gameName] = {
              rate: gameValue.rate || 100,
              items: gameValue.items
            };
          } 
          // Kalo cuma rate doang (update rate)
          else if (gameValue.rate && !gameValue.items) {
            if (currentGamepassData[gameName]) {
              currentGamepassData[gameName].rate = gameValue.rate;
            }
          }
        }
        
        // Simpan gamepassData yang sudah di-merge
        await collection.updateOne(
          { type: 'gamepassData' },
          { $set: { data: currentGamepassData } },
          { upsert: true }
        );
        
        // ===== 2. SYNC OTOMATIS KE RESELLER DENGAN RATE 90 =====
        const resellerDoc = await collection.findOne({ type: 'resellerData' });
        const currentResellerData = resellerDoc?.data || {};
        
        // Loop setiap gamepass yang ada di gamepassData
        for (const [gameName, gameValue] of Object.entries(currentGamepassData)) {
          // Kalo gamepass punya items, masukin ke reseller dengan rate RESELLER_RATE
          if (gameValue.items) {
            currentResellerData[gameName] = {
              rate: RESELLER_RATE,
              items: gameValue.items
            };
          }
        }
        
        // Simpan resellerData yang sudah di-sync
        await collection.updateOne(
          { type: 'resellerData' },
          { $set: { data: currentResellerData } },
          { upsert: true }
        );
      }
      
      // ===== 3. PROSES RESELLER DATA MANUAL (OPSIONAL) =====
      // Kalo ada kiriman resellerData manual, tetap diproses
      if (resellerData && Object.keys(resellerData).length > 0) {
        const resellerDoc = await collection.findOne({ type: 'resellerData' });
        const currentResellerData = resellerDoc?.data || {};
        
        for (const [gameName, gameValue] of Object.entries(resellerData)) {
          if (gameValue.items) {
            currentResellerData[gameName] = {
              rate: gameValue.rate || RESELLER_RATE,
              items: gameValue.items
            };
          } else if (gameValue.rate && !gameValue.items) {
            if (currentResellerData[gameName]) {
              currentResellerData[gameName].rate = gameValue.rate;
            }
          }
        }
        
        await collection.updateOne(
          { type: 'resellerData' },
          { $set: { data: currentResellerData } },
          { upsert: true }
        );
      }
      
      return res.json({ 
        success: true, 
        message: 'Data saved successfully with auto-sync to reseller!' 
      });
    }
    
    // ==================== DELETE GAMEPASS ====================
    if (action === 'deleteGamepass') {
      const gamepassName = req.query.gamepassName || req.body?.gamepassName;
      if (!gamepassName) {
        return res.json({ success: false, error: 'gamepassName required' });
      }
      
      // Hapus dari gamepassData
      const gamepassDoc = await collection.findOne({ type: 'gamepassData' });
      const gamepassData = gamepassDoc?.data || {};
      delete gamepassData[gamepassName];
      
      await collection.updateOne(
        { type: 'gamepassData' },
        { $set: { data: gamepassData } },
        { upsert: true }
      );
      
      // Hapus juga dari resellerData
      const resellerDoc = await collection.findOne({ type: 'resellerData' });
      const resellerData = resellerDoc?.data || {};
      delete resellerData[gamepassName];
      
      await collection.updateOne(
        { type: 'resellerData' },
        { $set: { data: resellerData } },
        { upsert: true }
      );
      
      return res.json({ 
        success: true, 
        message: `"${gamepassName}" deleted from both gamepass and reseller` 
      });
    }
    
    // ==================== UPDATE GAMEPASS (RENAME) ====================
    if (action === 'updateGamepass') {
      let { oldName, newName, rate, items } = req.query;
      if (req.body?.oldName) {
        ({ oldName, newName, rate, items } = req.body);
      }
      
      if (!oldName || !newName || !rate) {
        return res.json({ success: false, error: 'oldName, newName, rate required' });
      }
      
      if (typeof items === 'string') {
        try {
          items = JSON.parse(decodeURIComponent(items));
        } catch (e) {
          items = JSON.parse(items);
        }
      }
      
      // Update di gamepassData
      const gamepassDoc = await collection.findOne({ type: 'gamepassData' });
      const gamepassData = gamepassDoc?.data || {};
      
      if (gamepassData[oldName]) {
        gamepassData[newName] = { rate: parseInt(rate), items };
        delete gamepassData[oldName];
      }
      
      await collection.updateOne(
        { type: 'gamepassData' },
        { $set: { data: gamepassData } },
        { upsert: true }
      );
      
      // Update juga di resellerData dengan rate RESELLER_RATE
      const resellerDoc = await collection.findOne({ type: 'resellerData' });
      const resellerData = resellerDoc?.data || {};
      
      if (resellerData[oldName]) {
        resellerData[newName] = { rate: RESELLER_RATE, items };
        delete resellerData[oldName];
      }
      
      await collection.updateOne(
        { type: 'resellerData' },
        { $set: { data: resellerData } },
        { upsert: true }
      );
      
      return res.json({ 
        success: true, 
        message: `Gamepass updated from "${oldName}" to "${newName}" in both collections` 
      });
    }
    
    // ==================== UPDATE RATES ONLY ====================
    if (action === 'updateRates') {
      let rates = req.query.rates || req.body?.rates;
      if (typeof rates === 'string') {
        try {
          rates = JSON.parse(decodeURIComponent(rates));
        } catch (e) {
          rates = JSON.parse(rates);
        }
      }
      
      // Update rate di gamepassData
      const gamepassDoc = await collection.findOne({ type: 'gamepassData' });
      const gamepassData = gamepassDoc?.data || {};
      
      for (const [name, newRate] of Object.entries(rates)) {
        if (gamepassData[name]) {
          gamepassData[name].rate = parseInt(newRate);
        }
      }
      
      await collection.updateOne(
        { type: 'gamepassData' },
        { $set: { data: gamepassData } },
        { upsert: true }
      );
      
      // Rate di resellerData TIDAK ikut berubah (tetap 90 sesuai RESELLER_RATE)
      // Tapi kalo mau di-sync juga, uncomment kode di bawah:
      /*
      const resellerDoc = await collection.findOne({ type: 'resellerData' });
      const resellerData = resellerDoc?.data || {};
      
      for (const [name] of Object.entries(rates)) {
        if (resellerData[name]) {
          resellerData[name].rate = RESELLER_RATE; // Tetep pake rate reseller
        }
      }
      
      await collection.updateOne(
        { type: 'resellerData' },
        { $set: { data: resellerData } },
        { upsert: true }
      );
      */
      
      return res.json({ 
        success: true, 
        message: 'Rates updated successfully (reseller rates unchanged)' 
      });
    }
    
    // ==================== UNKNOWN ACTION ====================
    return res.json({ 
      success: false, 
      error: `Unknown action: ${action}` 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};