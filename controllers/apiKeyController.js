const crypto = require('crypto');
const db = require('../config/db');

// Generate API Key
exports.generateApiKey = async (req, res) => {
    try {
        const { name, expiresInDays } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nama API Key harus diisi'
            });
        }

        // Generate random API key
        const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');

        // Hitung tanggal expired
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        // Insert API key ke database
        const [result] = await db.query(
            'INSERT INTO api_keys (user_id, api_key, name, status, expires_at) VALUES (?, ?, ?, ?, ?)',
            [userId, apiKey, name, 'active', expiresAt]
        );

        res.status(201).json({
            success: true,
            message: 'API Key berhasil dibuat',
            data: {
                id: result.insertId,
                api_key: apiKey,
                name,
                status: 'active',
                expires_at: expiresAt,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Generate API Key error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membuat API Key'
        });
    }
};

// List API Keys User
exports.listUserApiKeys = async (req, res) => {
    try {
        const userId = req.user.id;

        const [apiKeys] = await db.query(
            `SELECT id, api_key, name, status, request_count, last_used, created_at, expires_at 
             FROM api_keys 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: apiKeys
        });
    } catch (error) {
        console.error('List API Keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data API Keys'
        });
    }
};

// Delete API Key User
exports.deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Cek apakah API key milik user
        const [apiKeys] = await db.query(
            'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (apiKeys.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API Key tidak ditemukan'
            });
        }

        // Hapus API key
        await db.query('DELETE FROM api_keys WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'API Key berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete API Key error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus API Key'
        });
    }
};

// Toggle API Key Status
exports.toggleApiKeyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Cek apakah API key milik user
        const [apiKeys] = await db.query(
            'SELECT id, status FROM api_keys WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (apiKeys.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API Key tidak ditemukan'
            });
        }

        const currentStatus = apiKeys[0].status;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        // Update status
        await db.query(
            'UPDATE api_keys SET status = ? WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `API Key berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`,
            data: {
                id,
                status: newStatus
            }
        });
    } catch (error) {
        console.error('Toggle API Key Status error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengubah status API Key'
        });
    }
};