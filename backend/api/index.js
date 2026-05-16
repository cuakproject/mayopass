const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// ==================== HELPER FUNCTIONS ====================
async function readData() {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        // Return empty data if file doesn't exist
        return { gamepassData: {}, resellerData: {} };
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// ==================== API ENDPOINTS ====================
app.all('/api', async (req, res) => {
    try {
        // Get action from query (GET) or body (POST)
        const action = req.query.action || req.body?.action;

        if (!action) {
            return res.status(400).json({
                success: false,
                error: 'Action parameter is required'
            });
        }

        // 1. GET ALL DATA
        if (action === 'getGamepassData') {
            const data = await readData();
            return res.json({
                success: true,
                gamepassData: data.gamepassData,
                resellerData: data.resellerData
            });
        }

        // 2. SAVE DATA (partial update)
        else if (action === 'saveGamepassData') {
            let gamepassData, resellerData;

            // Support both GET and POST
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

            const current = await readData();

            // Merge gamepassData
            if (gamepassData) {
                Object.assign(current.gamepassData, gamepassData);
            }

            // Overwrite resellerData completely
            if (resellerData) {
                current.resellerData = resellerData;
            }

            await writeData(current);

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

            const current = await readData();

            delete current.gamepassData[gamepassName];

            if (current.resellerData[gamepassName]) {
                delete current.resellerData[gamepassName];
            }

            await writeData(current);

            return res.json({
                success: true,
                message: `Gamepass "${gamepassName}" deleted successfully`
            });
        }

        // 4. UPDATE GAMEPASS (rename, rate, items)
        else if (action === 'updateGamepass') {
            let { oldName, newName, rate, items } = req.query;

            // Prioritize POST body
            if (req.body && req.body.oldName) {
                ({ oldName, newName, rate, items } = req.body);
            }

            if (!oldName || !newName || !rate) {
                return res.json({
                    success: false,
                    error: 'oldName, newName, and rate are required'
                });
            }

            rate = parseInt(rate);

            // Parse items if it's a string (from GET URL)
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

            const current = await readData();
            const hasGamepass = Boolean(current.gamepassData[oldName]);
            const hasReseller = Boolean(current.resellerData[oldName]);

            if (!hasGamepass && !hasReseller) {
                return res.json({
                    success: false,
                    error: `Gamepass "${oldName}" not found`
                });
            }

            if (hasGamepass) {
                delete current.gamepassData[oldName];
                current.gamepassData[newName] = { rate, items };
            }

            if (hasReseller) {
                const resellerOld = current.resellerData[oldName];
                const resellerRate = hasGamepass ? resellerOld.rate : rate;
                delete current.resellerData[oldName];
                current.resellerData[newName] = {
                    rate: resellerRate,
                    items: items
                };
            }

            await writeData(current);

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

            const current = await readData();

            for (const [name, newRate] of Object.entries(rates)) {
                if (current.gamepassData[name]) {
                    current.gamepassData[name].rate = parseInt(newRate);
                }
            }

            await writeData(current);

            return res.json({
                success: true,
                message: 'Rates updated successfully'
            });
        }

        // Unknown action
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
        message: 'Mayoblox API is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Mayoblox API running on http://localhost:${PORT}`);
    console.log(`📁 Data file: ${DATA_FILE}`);
});