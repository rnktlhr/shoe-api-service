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

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM api_keys ak ${whereClause}`,
            params
        );

        const total = countResult[0].total;

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

// Toggle API Key Status (Admin)
exports.toggleApiKeyStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT status FROM api_keys WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'API Key tidak ditemukan'
            });
        }

        const currentStatus = rows[0].status;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        await db.query(
            'UPDATE api_keys SET status = ? WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Status API Key berhasil diubah menjadi ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        console.error('Toggle API Key Status error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengubah status API Key'
        });
    }
};

// Get API Stats (Admin)
exports.getApiStats = async (req, res) => {
    try {
        const [totalKeys] = await db.query('SELECT COUNT(*) as total FROM api_keys');
        const [activeKeys] = await db.query('SELECT COUNT(*) as total FROM api_keys WHERE status = ?', ['active']);
        const [inactiveKeys] = await db.query('SELECT COUNT(*) as total FROM api_keys WHERE status = ?', ['inactive']);
        const [totalRequests] = await db.query('SELECT SUM(request_count) as total FROM api_keys');
        const [totalUsers] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['user']);

        res.json({
            success: true,
            data: {
                totalApiKeys: totalKeys[0].total,
                activeApiKeys: activeKeys[0].total,
                inactiveApiKeys: inactiveKeys[0].total,
                totalRequests: totalRequests[0].total || 0,
                totalUsers: totalUsers[0].total
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

// Get Activity Logs (Admin)
exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, start, end } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        if (start && end) {
            whereClause = 'WHERE al.request_time BETWEEN ? AND ?';
            params.push(`${start} 00:00:00`, `${end} 23:59:59`);
        }

        const [logs] = await db.query(
            `SELECT 
                al.id, 
                al.endpoint, 
                al.method, 
                al.response_status,
                al.ip_address, 
                al.request_time
             FROM api_logs al
             ${whereClause}
             ORDER BY al.request_time DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get Activity Logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil log aktivitas'
        });
    }
};

// Create User (Admin)
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, dan password wajib diisi'
            });
        }

        await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role || 'user']
        );

        res.json({
            success: true,
            message: 'User berhasil dibuat'
        });
    } catch (error) {
        console.error('Create User error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat user'
        });
    }
};

// Update User (Admin)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, password } = req.body;

        let fields = [];
        let params = [];

        if (username) { fields.push('username = ?'); params.push(username); }
        if (email) { fields.push('email = ?'); params.push(email); }
        if (role) { fields.push('role = ?'); params.push(role); }
        if (password) { fields.push('password = ?'); params.push(password); }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada data yang diubah'
            });
        }

        params.push(id);

        const [result] = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'User berhasil diupdate'
        });
    } catch (error) {
        console.error('Update User error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal update user'
        });
    }
};

// Delete User (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'User berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete User error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus user'
        });
    }
};
