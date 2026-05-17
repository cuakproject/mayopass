const { MongoClient } = require('mongodb');

// GANTI DENGAN CONNECTION STRING DARI MONGODB ATLAS LO!
const MONGODB_URI = 'mongodb+srv://mayocuak_db_user:mayoblox123@cluster0.efrs7os.mongodb.net/mayopass?retryWrites=true&w=majority';
const DB_NAME = 'mayopass';
const COLLECTION_NAME = 'gamepass_data';

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

module.exports = async (req, res) => {
  // CORS
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
    
    // GET DATA
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
    
    // SAVE DATA
    if (action === 'saveGamepassData') {
      let gamepassData, resellerData;
      
      if (req.query.data) {
        const decoded = JSON.parse(decodeURIComponent(req.query.data));
        gamepassData = decoded.gamepassData;
        resellerData = decoded.resellerData;
      } else if (req.body) {
        gamepassData = req.body.gamepassData;
        resellerData = req.body.resellerData;
      }
      
      if (gamepassData) {
        await collection.updateOne(
          { type: 'gamepassData' },
          { $set: { data: gamepassData } },
          { upsert: true }
        );
      }
      
      if (resellerData) {
        await collection.updateOne(
          { type: 'resellerData' },
          { $set: { data: resellerData } },
          { upsert: true }
        );
      }
      
      return res.json({ success: true, message: 'Data saved successfully' });
    }
    
    // DELETE
    if (action === 'deleteGamepass') {
      const gamepassName = req.query.gamepassName || req.body?.gamepassName;
      if (!gamepassName) {
        return res.json({ success: false, error: 'gamepassName required' });
      }
      
      const gamepassDoc = await collection.findOne({ type: 'gamepassData' });
      const resellerDoc = await collection.findOne({ type: 'resellerData' });
      
      if (gamepassDoc?.data) delete gamepassDoc.data[gamepassName];
      if (resellerDoc?.data) delete resellerDoc.data[gamepassName];
      
      await collection.updateOne(
        { type: 'gamepassData' },
        { $set: { data: gamepassDoc?.data || {} } }
      );
      await collection.updateOne(
        { type: 'resellerData' },
        { $set: { data: resellerDoc?.data || {} } }
      );
      
      return res.json({ success: true, message: `"${gamepassName}" deleted` });
    }
    
    // UPDATE GAMEPASS
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
      
      return res.json({ success: true, message: `Updated to "${newName}"` });
    }
    
    // UPDATE RATES
    if (action === 'updateRates') {
      let rates = req.query.rates || req.body?.rates;
      if (typeof rates === 'string') {
        try {
          rates = JSON.parse(decodeURIComponent(rates));
        } catch (e) {
          rates = JSON.parse(rates);
        }
      }
      
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
      
      return res.json({ success: true, message: 'Rates updated' });
    }
    
    return res.json({ success: false, error: `Unknown action: ${action}` });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};