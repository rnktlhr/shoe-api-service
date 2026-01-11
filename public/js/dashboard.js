// Check authentication
requireAuth();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    document.getElementById('userGreeting').textContent = `Hello, ${user.username}!`;
    
    // Show admin link if user is admin
    if (user.role === 'admin') {
        document.getElementById('adminLink').style.display = 'inline-block';
    }
    
    loadApiKeys();
});

// Generate API Key
document.getElementById('generateKeyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const keyName = document.getElementById('keyName').value;
    const generateBtn = document.getElementById('generateBtn');
    const alertContainer = document.getElementById('generateAlert');
    
    // Validasi input
    if (!keyName.trim()) {
        alertContainer.innerHTML = `
            <div class="alert alert-error">
                ❌ Nama API Key harus diisi
            </div>
        `;
        return;
    }
    
    // Disable button and show loading
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    alertContainer.innerHTML = '';
    
    try {
        console.log('Sending request to:', `${API_URL}/api/keys/generate`);
        console.log('Token:', getAuthToken());
        
        const response = await fetch(`${API_URL}/api/keys/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ name: keyName })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            alertContainer.innerHTML = `
                <div class="alert alert-success">
                    ✅ API Key berhasil dibuat!
                    <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px; word-break: break-all;">
                        <strong>Your API Key:</strong><br>
                        <code>${data.data.api_key}</code>
                        <button onclick="copyToClipboard('${data.data.api_key}')" class="btn btn-sm btn-primary" style="margin-left: 10px;">
                            Copy
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('keyName').value = '';
            loadApiKeys();
            
            // Clear alert after 10 seconds
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 10000);
        } else {
            alertContainer.innerHTML = `
                <div class="alert alert-error">
                    ❌ ${data.message || 'Gagal membuat API Key'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Generate key error:', error);
        alertContainer.innerHTML = `
            <div class="alert alert-error">
                ❌ Terjadi kesalahan saat membuat API Key<br>
                <small>Error: ${error.message}</small>
            </div>
        `;
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Key';
    }
});

// Load API Keys
async function loadApiKeys() {
    try {
        console.log('Loading API keys...');
        const response = await fetch(`${API_URL}/api/keys/list`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        console.log('Load keys response status:', response.status);
        const data = await response.json();
        console.log('Load keys data:', data);
        
        if (data.success) {
            displayApiKeys(data.data);
            updateStats(data.data);
            populatePlaygroundKeys(data.data);
        } else {
            document.getElementById('apiKeysList').innerHTML = `
                <div class="alert alert-error">${data.message}</div>
            `;
        }
    } catch (error) {
        console.error('Load keys error:', error);
        document.getElementById('apiKeysList').innerHTML = `
            <div class="alert alert-error">Terjadi kesalahan saat memuat API Keys<br>
            <small>Error: ${error.message}</small></div>
        `;
    }
}

// Display API Keys
function displayApiKeys(keys) {
    const container = document.getElementById('apiKeysList');
    const user = getCurrentUser();
    const isAdmin = user.role === 'admin';
    
    if (keys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔑</div>
                <p>Belum ada API Key. Buat API Key pertama Anda sekarang!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = keys.map(key => `
        <div class="api-key-item">
            <div class="api-key-header">
                <span class="api-key-name">${key.name}</span>
                <span class="badge ${key.status === 'active' ? 'badge-success' : 'badge-danger'}">
                    ${key.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
            </div>
            <div class="api-key-body">
                <div class="api-key-value">
                    ${key.api_key}
                    <button class="copy-btn" onclick="copyToClipboard('${key.api_key}')">Copy</button>
                </div>
                <div class="api-key-info">
                    <span>📊 Requests: ${key.request_count}</span>
                    <span>⏰ Last Used: ${key.last_used ? new Date(key.last_used).toLocaleString('id-ID') : 'Belum digunakan'}</span>
                    <span>📅 Created: ${new Date(key.created_at).toLocaleDateString('id-ID')}</span>
                </div>
            </div>
            ${isAdmin ? `
                <div class="api-key-actions">
                    <button class="btn btn-sm ${key.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleKeyStatus(${key.id})">
                        ${key.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKey(${key.id})">
                        Hapus
                    </button>
                </div>
            ` : `
                <div class="api-key-actions">
                    <span style="color: #6b7280; font-size: 0.875rem;">
                        ℹ️ Hubungi admin untuk menonaktifkan atau menghapus API key
                    </span>
                </div>
            `}
        </div>
    `).join('');
}

// Update Stats
function updateStats(keys) {
    const totalKeys = keys.length;
    const activeKeys = keys.filter(k => k.status === 'active').length;
    const totalRequests = keys.reduce((sum, k) => sum + k.request_count, 0);
    
    document.getElementById('totalKeys').textContent = totalKeys;
    document.getElementById('activeKeys').textContent = activeKeys;
    document.getElementById('totalRequests').textContent = totalRequests.toLocaleString('id-ID');
}

// Toggle Key Status
async function toggleKeyStatus(keyId) {
    if (!confirm('Yakin ingin mengubah status API Key ini?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/keys/${keyId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Status API Key berhasil diubah!');
            loadApiKeys();
        } else {
            alert('❌ ' + (data.message || 'Gagal mengubah status'));
        }
    } catch (error) {
        console.error('Toggle status error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

// Delete Key
async function deleteKey(keyId) {
    if (!confirm('Yakin ingin menghapus API Key ini? Tindakan ini tidak dapat dibatalkan!')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/keys/${keyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ API Key berhasil dihapus!');
            loadApiKeys();
        } else {
            alert('❌ ' + (data.message || 'Gagal menghapus API Key'));
        }
    } catch (error) {
        console.error('Delete key error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ API Key berhasil disalin!');
    }).catch((error) => {
        console.error('Copy failed:', error);
        // Fallback method untuk browser lama
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('✅ API Key berhasil disalin!');
        } catch (err) {
            alert('❌ Gagal menyalin API Key. Silakan salin manual.');
        }
        document.body.removeChild(textArea);
    });
}

/* =========================
   API PLAYGROUND LOGIC
========================= */

// Fungsi untuk mengisi dropdown API Key di Playground
function populatePlaygroundKeys(keys) {
    const select = document.getElementById('playgroundKeySelect');
    if (!select) return;
    
    const activeKeys = keys.filter(k => k.status === 'active');
    
    if (activeKeys.length === 0) {
        select.innerHTML = '<option value="">Tidak ada API Key aktif - Buat API Key terlebih dahulu</option>';
        document.getElementById('testRequestBtn').disabled = true;
        return;
    }
    
    document.getElementById('testRequestBtn').disabled = false;
    select.innerHTML = activeKeys.map(k => `
        <option value="${k.api_key}">${k.name} (${k.api_key.substring(0, 12)}...)</option>
    `).join('');
}

// Event Listener untuk Tombol Test Request
document.getElementById('testRequestBtn').addEventListener('click', async () => {
    const endpoint = document.getElementById('playgroundEndpoint').value;
    const apiKey = document.getElementById('playgroundKeySelect').value;
    const resultDiv = document.getElementById('playgroundResult');
    const resultPre = document.getElementById('resultJson');
    const statusSpan = document.getElementById('responseStatus');
    const btn = document.getElementById('testRequestBtn');

    if (!apiKey) {
        alert('❌ Pilih API Key aktif terlebih dahulu!');
        return;
    }

    // Tampilkan loading
    btn.disabled = true;
    btn.innerHTML = '⏳ Testing...';
    resultDiv.style.display = 'block';
    resultPre.textContent = '// Menghubungi server...';
    statusSpan.textContent = '';
    statusSpan.className = 'response-status';

    try {
        const startTime = performance.now();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        const data = await response.json();
        
        // Update status badge
        if (response.ok) {
            statusSpan.textContent = `✅ ${response.status} OK (${responseTime}ms)`;
            statusSpan.className = 'response-status success';
        } else {
            statusSpan.textContent = `❌ ${response.status} Error (${responseTime}ms)`;
            statusSpan.className = 'response-status error';
        }
        
        // Format JSON agar rapi (indentasi 2 spasi)
        resultPre.textContent = JSON.stringify(data, null, 2);
        
        // Scroll ke tampilan hasil
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Reload stats untuk update request count
        setTimeout(() => loadApiKeys(), 500);
        
    } catch (error) {
        statusSpan.textContent = '❌ Connection Error';
        statusSpan.className = 'response-status error';
        resultPre.textContent = `Error: ${error.message}\n\nPastikan:\n1. Server backend berjalan di ${API_URL}\n2. API Key valid dan aktif\n3. Endpoint tersedia di server`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '▶️ Test Request';
    }
});