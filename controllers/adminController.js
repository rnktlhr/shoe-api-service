const db = require('../config/db');

// Get All API Keys (Admin)
exports.getAllApiKeys = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (status) {
            whereClause = 'WHERE ak.status = ?';
            params.push(status);
        }

        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM api_keys ak 
             ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get data with user info
        const [apiKeys] = await db.query(
            `SELECT 
                ak.id, 
                ak.api_key, 
                ak.name, 
                ak.status, 
                ak.request_count, 
                ak.last_used, 
                ak.created_at, 
                ak.expires_at,
                u.id as user_id,
                u.username,
                u.email
             FROM api_keys ak
             JOIN users u ON ak.user_id = u.id
             ${whereClause}
             ORDER BY ak.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: apiKeys,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All API Keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data API Keys'
        });
    }
};

// Delete Inactive API Keys (Admin)
exports.deleteInactiveApiKeys = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM api_keys WHERE status = ?',
            ['inactive']
        );

        res.json({
            success: true,
            message: `${result.affectedRows} API Key tidak aktif berhasil dihapus`
        });
    } catch (error) {
        console.error('Delete Inactive API Keys error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus API Keys'
        });
    }
};

// Delete Specific API Key (Admin)
exports.deleteApiKeyById = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM api_keys WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'API Key tidak ditemukan'
            });
        }

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

// Get API Stats (Admin)
exports.getApiStats = async (req, res) => {
    try {
        // Total API Keys
        const [totalKeys] = await db.query(
            'SELECT COUNT(*) as total FROM api_keys'
        );

        // Active API Keys
        const [activeKeys] = await db.query(
            'SELECT COUNT(*) as total FROM api_keys WHERE status = ?',
            ['active']
        );

        // Inactive API Keys
        const [inactiveKeys] = await db.query(
            'SELECT COUNT(*) as total FROM api_keys WHERE status = ?',
            ['inactive']
        );

        // Total Requests
        const [totalRequests] = await db.query(
            'SELECT SUM(request_count) as total FROM api_keys'
        );

        // Total Users
        const [totalUsers] = await db.query(
            'SELECT COUNT(*) as total FROM users WHERE role = ?',
            ['user']
        );

        // Recent API Logs (Last 10)
        const [recentLogs] = await db.query(
            `SELECT 
                al.id, 
                al.endpoint, 
                al.method, 
                al.ip_address, 
                al.request_time,
                u.username
             FROM api_logs al
             JOIN api_keys ak ON al.api_key_id = ak.id
             JOIN users u ON ak.user_id = u.id
             ORDER BY al.request_time DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                totalApiKeys: totalKeys[0].total,
                activeApiKeys: activeKeys[0].total,
                inactiveApiKeys: inactiveKeys[0].total,
                totalRequests: totalRequests[0].total || 0,
                totalUsers: totalUsers[0].total,
                recentLogs
            }
        });
    } catch (error) {
        console.error('Get API Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil statistik'
        });
    }
};

// Get All Users (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.role, 
                u.created_at,
                COUNT(ak.id) as total_api_keys
             FROM users u
             LEFT JOIN api_keys ak ON u.id = ak.user_id
             GROUP BY u.id
             ORDER BY u.created_at DESC`
        );

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get All Users error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data users'
        });
    }
};