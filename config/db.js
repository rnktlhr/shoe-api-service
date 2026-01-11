const mysql = require('mysql2');

// Konfigurasi koneksi database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shoe_api_service',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
};

console.log('\n📊 Database Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Password: ${dbConfig.password ? '***' : '(empty)'}\n`);

const pool = mysql.createPool(dbConfig);

// Konversi ke Promise untuk async/await
const promisePool = pool.promise();

// Test koneksi
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to database!\n');
        
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Problem: Username atau Password salah');
            console.error('   Solution: Cek DB_USER dan DB_PASSWORD di file .env');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('   Problem: MySQL Server tidak berjalan atau port salah');
            console.error('   Solution: ');
            console.error('   1. Buka MySQL Workbench');
            console.error('   2. Pastikan koneksi berhasil di Workbench');
            console.error('   3. Cek port di Workbench (Server > Status Variables > port)');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   Problem: Database tidak ditemukan');
            console.error('   Solution: Buat database dengan query:');
            console.error('   CREATE DATABASE shoe_api_service;');
        } else {
            console.error('   Error Code:', err.code);
            console.error('   Error Message:', err.message);
        }
        
        console.error('\n📝 Troubleshooting Steps:');
        console.error('   1. Buka MySQL Workbench dan test koneksi');
        console.error('   2. Pastikan MySQL Server sedang running');
        console.error('   3. Cek kredensial di file .env');
        console.error('   4. Buat database: CREATE DATABASE shoe_api_service;\n');
        return;
    }
    
    console.log('✓ Database connected successfully');
    connection.release();
});

module.exports = promisePool;