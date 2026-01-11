const db = require('../config/db');

// Middleware untuk validasi API Key
exports.validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API Key tidak ditemukan'
            });
        }

        // Cek API key di database
        const [apiKeys] = await db.query(
            `SELECT ak.*, u.id as user_id, u.username 
             FROM api_keys ak
             JOIN users u ON ak.user_id = u.id
             WHERE ak.api_key = ?`,
            [apiKey]
        );

        if (apiKeys.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'API Key tidak valid'
            });
        }

        const apiKeyData = apiKeys[0];

        // Cek status
        if (apiKeyData.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'API Key tidak aktif'
            });
        }

        // Cek expired
        if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
            return res.status(403).json({
                success: false,
                message: 'API Key sudah kadaluarsa'
            });
        }

        // Update last_used dan request_count
        await db.query(
            'UPDATE api_keys SET last_used = NOW(), request_count = request_count + 1 WHERE id = ?',
            [apiKeyData.id]
        );

        // Log request
        await db.query(
            'INSERT INTO api_logs (api_key_id, endpoint, method, ip_address) VALUES (?, ?, ?, ?)',
            [apiKeyData.id, req.path, req.method, req.ip]
        );

        req.apiKeyData = apiKeyData;
        next();
    } catch (error) {
        console.error('Validate API Key error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memvalidasi API Key'
        });
    }
};

// Get All Shoes (Public API)
exports.getAllShoes = async (req, res) => {
    try {
        const { page = 1, limit = 10, brand, category, minPrice, maxPrice } = req.query;
        const offset = (page - 1) * limit;

        // Build query
        let whereConditions = [];
        let params = [];

        if (brand) {
            whereConditions.push('brand LIKE ?');
            params.push(`%${brand}%`);
        }

        if (category) {
            whereConditions.push('category = ?');
            params.push(category);
        }

        if (minPrice) {
            whereConditions.push('price >= ?');
            params.push(minPrice);
        }

        if (maxPrice) {
            whereConditions.push('price <= ?');
            params.push(maxPrice);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Get total count
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM shoes ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get data
        const [shoes] = await db.query(
            `SELECT * FROM shoes ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: shoes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Shoes error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data sepatu'
        });
    }
};

// Get Shoe by ID
exports.getShoeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [shoes] = await db.query(
            'SELECT * FROM shoes WHERE id = ?',
            [id]
        );

        if (shoes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sepatu tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: shoes[0]
        });
    } catch (error) {
        console.error('Get Shoe by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data sepatu'
        });
    }
};

// Search Shoes
exports.searchShoes = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Parameter pencarian tidak boleh kosong'
            });
        }

        const [shoes] = await db.query(
            `SELECT * FROM shoes 
             WHERE brand LIKE ? OR model LIKE ? OR description LIKE ?
             ORDER BY created_at DESC`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );

        res.json({
            success: true,
            data: shoes,
            count: shoes.length
        });
    } catch (error) {
        console.error('Search Shoes error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mencari sepatu'
        });
    }
};

// Get Categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT DISTINCT category FROM shoes ORDER BY category'
        );

        res.json({
            success: true,
            data: categories.map(c => c.category)
        });
    } catch (error) {
        console.error('Get Categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil kategori'
        });
    }
};

// Get Brands
exports.getBrands = async (req, res) => {
    try {
        const [brands] = await db.query(
            'SELECT DISTINCT brand FROM shoes ORDER BY brand'
        );

        res.json({
            success: true,
            data: brands.map(b => b.brand)
        });
    } catch (error) {
        console.error('Get Brands error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil brand'
        });
    }
};