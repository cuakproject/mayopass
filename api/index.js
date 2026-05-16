const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection String
const MONGODB_URI = 'mongodb+srv://mayocuak_db_user:WCFdmV3UzfNwVsem@cluster0.efrs7os.mongodb.net/?appName=Cluster0';
const DB_NAME = 'mayopass';
const COLLECTION_NAME = 'gamepasses';

let db;
let client;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
    if (db) return db;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB Atlas');
        
        // Create collection with indexes if not exists
        const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
        if (collections.length === 0) {
            await db.createCollection(COLLECTION_NAME);
            await db.collection(COLLECTION_NAME).createIndex({ type: 1 });
            
            // Insert default data
            await db.collection(COLLECTION_NAME).insertMany([
                { type: 'gamepassData', data: {} },
                { type: 'resellerData', data: {} }
            ]);
            console.log('✅ Default collections created');
        }
        
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Helper functions
async function getGamepassData() {
    const database = await connectDB();
    const doc = await database.collection(COLLECTION_NAME).findOne({ type: 'gamepassData' });
    return doc ? doc.data : {};
}

async function getResellerData() {
    const database = await connectDB();
    const doc = await database.collection(COLLECTION_NAME).findOne({ type: 'resellerData' });
    return doc ? doc.data : {};
}

async function saveGamepassData(gamepassData) {
    const database = await connectDB();
    await database.collection(COLLECTION_NAME).updateOne(
        { type: 'gamepassData' },
        { $set: { data: gamepassData } },
        { upsert: true }
    );
}

async function saveResellerData(resellerData) {
    const database = await connectDB();
    await database.collection(COLLECTION_NAME).updateOne(
        { type: 'resellerData' },
        { $set: { data: resellerData } },
        { upsert: true }
    );
}

async function deleteGamepass(gamepassName) {
    const database = await connectDB();
    const gamepassData = await getGamepassData();
    const resellerData = await getResellerData();
    
    delete gamepassData[gamepassName];
    delete resellerData[gamepassName];
    
    await saveGamepassData(gamepassData);
    await saveResellerData(resellerData);
}

async function updateGamepass(oldName, newName, rate, items) {
    const database = await connectDB();
    const gamepassData = await getGamepassData();
    const resellerData = await getResellerData();
    
    const hasGamepass = gamepassData[oldName];
    const hasReseller = resellerData[oldName];
    
    if (hasGamepass) {
        delete gamepassData[oldName];
        gamepassData[newName] = { rate: parseInt(rate), items };
    }
    
    if (hasReseller) {
        const resellerRate = hasGamepass ? gamepassData[newName].rate : rate;
        delete resellerData[oldName];
        resellerData[newName] = { rate: parseInt(resellerRate), items };
    }
    
    await saveGamepassData(gamepassData);
    await saveResellerData(resellerData);
}

async function updateRates(rates) {
    const database = await connectDB();
    const gamepassData = await getGamepassData();
    
    for (const [name, newRate] of Object.entries(rates)) {
        if (gamepassData[name]) {
            gamepassData[name].rate = parseInt(newRate);
        }
    }
    
    await saveGamepassData(gamepassData);
}

// ==================== API ENDPOINTS ====================
app.all('/api', async (req, res) => {
    try {
        await connectDB();
        const action = req.query.action || req.body?.action;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: 'Action parameter is required'
            });
        }

        // 1. GET ALL DATA
        if (action === 'getGamepassData') {
            const gamepassData = await getGamepassData();
            const resellerData = await getResellerData();
            return res.json({
                success: true,
                gamepassData: gamepassData,
                resellerData: resellerData
            });
        }

        // 2. SAVE DATA
        else if (action === 'saveGamepassData') {
            let gamepassData, resellerData;

            if (req.query.data) {
                const decoded = JSON.parse(decodeURIComponent(req.query.data));
                gamepassData = decoded.gamepassData;
                resellerData = decoded.resellerData;
            } else if (req.body) {
                gamepassData = req.body.gamepassData;
                resellerData = req.body.resellerData;
            }

            if (!gamepassData && !resellerData) {
                return res.json({
                    success: false,
                    error: 'No data provided'
                });
            }

            if (gamepassData) {
                const current = await getGamepassData();
                Object.assign(current, gamepassData);
                await saveGamepassData(current);
            }

            if (resellerData) {
                await saveResellerData(resellerData);
            }

            return res.json({
                success: true,
                message: 'Data saved successfully'
            });
        }

        // 3. DELETE GAMEPASS
        else if (action === 'deleteGamepass') {
            const gamepassName = req.query.gamepassName || req.body?.gamepassName;

            if (!gamepassName) {
                return res.json({
                    success: false,
                    error: 'gamepassName is required'
                });
            }

            await deleteGamepass(gamepassName);

            return res.json({
                success: true,
                message: `Gamepass "${gamepassName}" deleted successfully`
            });
        }

        // 4. UPDATE GAMEPASS
        else if (action === 'updateGamepass') {
            let { oldName, newName, rate, items } = req.query;

            if (req.body && req.body.oldName) {
                ({ oldName, newName, rate, items } = req.body);
            }

            if (!oldName || !newName || !rate) {
                return res.json({
                    success: false,
                    error: 'oldName, newName, and rate are required'
                });
            }

            if (typeof items === 'string') {
                try {
                    items = JSON.parse(decodeURIComponent(items));
                } catch (e) {
                    try {
                        items = JSON.parse(items);
                    } catch (e2) {
                        return res.json({
                            success: false,
                            error: 'Invalid items format'
                        });
                    }
                }
            }

            await updateGamepass(oldName, newName, rate, items);

            return res.json({
                success: true,
                message: `Gamepass updated from "${oldName}" to "${newName}"`
            });
        }

        // 5. UPDATE RATES ONLY
        else if (action === 'updateRates') {
            let rates = req.query.rates || req.body?.rates;

            if (typeof rates === 'string') {
                try {
                    rates = JSON.parse(decodeURIComponent(rates));
                } catch (e) {
                    try {
                        rates = JSON.parse(rates);
                    } catch (e2) {
                        return res.json({
                            success: false,
                            error: 'Invalid rates format'
                        });
                    }
                }
            }

            if (!rates || Object.keys(rates).length === 0) {
                return res.json({
                    success: false,
                    error: 'Rates data is required'
                });
            }

            await updateRates(rates);

            return res.json({
                success: true,
                message: 'Rates updated successfully'
            });
        }

        else {
            return res.json({
                success: false,
                error: `Unknown action: ${action}`
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Mayoblox API is running with MongoDB',
        timestamp: new Date().toISOString()
    });
});

// Start server (hanya untuk local run)
if (require.main === module) {
    app.listen(PORT, async () => {
        await connectDB();
        console.log(`✅ Mayoblox API running on http://localhost:${PORT}`);
    });
}

// Export untuk Vercel
module.exports = app;