const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Ganti dengan data dari Supabase lo
const SUPABASE_URL = 'https://yuutdtgzjxrzybztrwdc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_o8wTMo0P5AVdgI3M-FprQQ_Q20jmIGZ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// ==================== HELPER FUNCTIONS ====================
async function getGamepassData() {
    const { data, error } = await supabase
        .from('gamepass_data')
        .select('data')
        .eq('type', 'gamepassData')
        .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.data || {};
}

async function getResellerData() {
    const { data, error } = await supabase
        .from('gamepass_data')
        .select('data')
        .eq('type', 'resellerData')
        .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.data || {};
}

async function saveGamepassData(gamepassData) {
    const { error } = await supabase
        .from('gamepass_data')
        .update({ data: gamepassData })
        .eq('type', 'gamepassData');
    
    if (error) throw error;
}

async function saveResellerData(resellerData) {
    const { error } = await supabase
        .from('gamepass_data')
        .update({ data: resellerData })
        .eq('type', 'resellerData');
    
    if (error) throw error;
}

async function deleteGamepass(gamepassName) {
    const gamepassData = await getGamepassData();
    const resellerData = await getResellerData();
    
    delete gamepassData[gamepassName];
    delete resellerData[gamepassName];
    
    await saveGamepassData(gamepassData);
    await saveResellerData(resellerData);
}

async function updateGamepass(oldName, newName, rate, items) {
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
        message: 'Mayoblox API is running with Supabase',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;