/* =========================
   INITIALIZE ADMIN DASHBOARD
========================= */
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan user login & admin
    requireAdmin();

    const user = getCurrentUser();
    if (user) {
        document.getElementById('userGreeting').textContent = `Admin: ${user.username}`;
    }

    // Set default dates for logs
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    document.getElementById('logEndDate').valueAsDate = today;
    document.getElementById('logStartDate').valueAsDate = weekAgo;

    loadStats();
    loadApiKeys();
    loadUsers();
    loadLogs();
});

/* =========================
   TAB SWITCHING
========================= */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Set button as active
    event.target.classList.add('active');
}

/* =========================
   LOAD STATISTICS
========================= */
async function loadStats() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.error('Auth token tidak ditemukan');
            return;
        }

        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Gagal load stats:', response.status);
            return;
        }

        const result = await response.json();
        if (!result.success) return;

        const stats = result.data;

        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalApiKeys').textContent = stats.totalApiKeys || 0;
        document.getElementById('activeApiKeys').textContent = stats.activeApiKeys || 0;
        document.getElementById('inactiveApiKeys').textContent = stats.inactiveApiKeys || 0;
        document.getElementById('totalRequests').textContent = (stats.totalRequests || 0).toLocaleString('id-ID');
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

/* =========================
   LOAD API KEYS
========================= */
async function loadApiKeys() {
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchUser').value;
    
    let url = `${API_URL}/api/admin/api-keys?`;
    if (status) url += `status=${status}&`;
    if (search) url += `search=${search}`;

    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Gagal load API keys:', response.status);
            return;
        }

        const result = await response.json();
        if (result.success) {
            displayApiKeys(result.data);
        }
    } catch (error) {
        console.error('Load API keys error:', error);
        document.getElementById('apiKeysTable').innerHTML = `
            <div class="alert alert-error">Error loading API keys: ${error.message}</div>
        `;
    }
}

/* =========================
   DISPLAY API KEYS
========================= */
function displayApiKeys(keys) {
    const container = document.getElementById('apiKeysTable');

    if (!keys || keys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔑</div>
                <p>Tidak ada data API Keys</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Key Name</th>
                        <th>API Key</th>
                        <th>Status</th>
                        <th>Requests</th>
                        <th>Last Used</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${keys.map(key => `
                        <tr>
                            <td>${key.id}</td>
                            <td>
                                <strong>${key.username}</strong><br>
                                <small>${key.email}</small>
                            </td>
                            <td><strong>${key.name}</strong></td>
                            <td>
                                <code class="api-key-display">${key.api_key.substring(0, 24)}...</code>
                                <button class="copy-btn-small" onclick="copyToClipboard('${key.api_key}')">📋</button>
                            </td>
                            <td>
                                <span class="badge ${key.status === 'active' ? 'badge-success' : 'badge-danger'}">
                                    ${key.status}
                                </span>
                            </td>
                            <td><strong>${key.request_count}</strong></td>
                            <td>${key.last_used ? new Date(key.last_used).toLocaleString('id-ID') : '-'}</td>
                            <td>${new Date(key.created_at).toLocaleDateString('id-ID')}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm ${key.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                    onclick="toggleApiKeyStatus(${key.id}, '${key.status}')">
                                    ${key.status === 'active' ? '🔒 Disable' : '✅ Enable'}
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminDeleteKey(${key.id})">
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/* =========================
   LOAD USERS
========================= */
async function loadUsers() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const result = await response.json();
        if (result.success) {
            displayUsers(result.data);
        }
    } catch (error) {
        console.error('Load users error:', error);
        document.getElementById('usersTable').innerHTML = `
            <div class="alert alert-error">Error loading users: ${error.message}</div>
        `;
    }
}

/* =========================
   DISPLAY USERS
========================= */
function displayUsers(users) {
    const container = document.getElementById('usersTable');

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>Tidak ada data users</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Total API Keys</th>
                        <th>Registered</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td><strong>${user.username}</strong></td>
                            <td>${user.email}</td>
                            <td>
                                <span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">
                                    ${user.role}
                                </span>
                            </td>
                            <td><strong>${user.total_api_keys || 0}</strong></td>
                            <td>${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                            <td class="action-buttons">
                                <button class="btn btn-sm btn-primary" onclick="showEditUserModal(${user.id}, '${user.username}', '${user.email}', '${user.role}')">
                                    ✏️ Edit
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.username}')">
                                    🗑️ Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/* =========================
   LOAD LOGS
========================= */
async function loadLogs() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const startDate = document.getElementById('logStartDate').value;
        const endDate = document.getElementById('logEndDate').value;
        const userFilter = document.getElementById('logUserFilter').value;

        let url = `${API_URL}/api/admin/logs?`;
        if (startDate) url += `start=${startDate}&`;
        if (endDate) url += `end=${endDate}&`;
        if (userFilter) url += `user=${userFilter}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const result = await response.json();
        if (result.success) {
            displayLogs(result.data);
        }
    } catch (error) {
        console.error('Load logs error:', error);
        document.getElementById('logsTable').innerHTML = `
            <div class="alert alert-error">Error loading logs: ${error.message}</div>
        `;
    }
}

/* =========================
   DISPLAY LOGS
========================= */
function displayLogs(logs) {
    const container = document.getElementById('logsTable');

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>Tidak ada aktivitas log</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Endpoint</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${log.id}</td>
                            <td><strong>${log.username}</strong></td>
                            <td><code>${log.endpoint}</code></td>
                            <td><span class="badge badge-info">${log.method}</span></td>
                            <td><span class="badge ${log.status_code < 400 ? 'badge-success' : 'badge-danger'}">${log.status_code || '-'}</span></td>
                            <td>${log.ip_address}</td>
                            <td>${new Date(log.request_time).toLocaleString('id-ID')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/* =========================
   TOGGLE API KEY STATUS
========================= */
async function toggleApiKeyStatus(keyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (!confirm(`Ubah status API Key menjadi ${newStatus}?`)) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/api-keys/${keyId}/toggle`, {
            method: 'PUT', // ⬅️ HARUS PUT, bukan PATCH
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Status berhasil diubah menjadi ${newStatus}!`);
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal mengubah status'));
        }
    } catch (error) {
        console.error('Toggle status error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}


/* =========================
   DELETE API KEYS
========================= */
async function adminDeleteKey(id) {
    if (!confirm('Yakin ingin menghapus API Key ini? Tindakan tidak dapat dibatalkan!')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/api-keys/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const result = await response.json();
        if (result.success) {
            alert('✅ API Key berhasil dihapus!');
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal menghapus API Key'));
        }
    } catch (error) {
        console.error('Delete key error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

async function deleteInactiveKeys() {
    if (!confirm('⚠️ Hapus SEMUA API Key yang inactive?\n\nTindakan ini TIDAK DAPAT dibatalkan!')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/api-keys/inactive`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const result = await response.json();
        if (result.success) {
            alert(`✅ Berhasil menghapus ${result.data.deleted} inactive API Keys!`);
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal menghapus inactive keys'));
        }
    } catch (error) {
        console.error('Delete inactive keys error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

/* =========================
   USER MANAGEMENT
========================= */
function showCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'flex';
}

function showEditUserModal(id, username, email, role) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = role;
    document.getElementById('editPassword').value = '';
    document.getElementById('editUserModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Create User Form
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        username: document.getElementById('newUsername').value,
        email: document.getElementById('newEmail').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newRole').value
    };

    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (result.success) {
            alert('✅ User berhasil dibuat!');
            closeModal('createUserModal');
            document.getElementById('createUserForm').reset();
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal membuat user'));
        }
    } catch (error) {
        console.error('Create user error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
});

// Edit User Form
document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const userData = {
        username: document.getElementById('editUsername').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value
    };

    const password = document.getElementById('editPassword').value;
    if (password) {
        userData.password = password;
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        if (result.success) {
            alert('✅ User berhasil diupdate!');
            closeModal('editUserModal');
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal update user'));
        }
    } catch (error) {
        console.error('Update user error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
});

// Delete User
async function deleteUser(userId, username) {
    if (!confirm(`⚠️ Yakin ingin menghapus user "${username}"?\n\nSemua API Keys milik user ini juga akan terhapus!\n\nTindakan ini TIDAK DAPAT dibatalkan!`)) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const result = await response.json();
        if (result.success) {
            alert('✅ User berhasil dihapus!');
            refreshData();
        } else {
            alert('❌ ' + (result.message || 'Gagal menghapus user'));
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    }
}

/* =========================
   EXPORT FUNCTIONS
========================= */
function exportData() {
    const confirmed = confirm('Export semua API Keys ke CSV?');
    if (!confirmed) return;

    // Get current filtered data from table
    const table = document.querySelector('#apiKeysTable table');
    if (!table) {
        alert('Tidak ada data untuk diexport');
        return;
    }

    let csv = 'ID,User,Email,Key Name,API Key,Status,Requests,Last Used,Created\n';
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [
            cells[0].textContent, // ID
            cells[1].querySelector('strong').textContent, // Username
            cells[1].querySelector('small').textContent, // Email
            cells[2].textContent, // Key Name
            cells[3].querySelector('code').textContent, // API Key
            cells[4].textContent.trim(), // Status
            cells[5].textContent, // Requests
            cells[6].textContent, // Last Used
            cells[7].textContent // Created
        ];
        csv += rowData.join(',') + '\n';
    });

    downloadCSV(csv, 'api-keys-export.csv');
}

function exportUsers() {
    const table = document.querySelector('#usersTable table');
    if (!table) {
        alert('Tidak ada data untuk diexport');
        return;
    }

    let csv = 'ID,Username,Email,Role,Total API Keys,Registered\n';
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [
            cells[0].textContent, // ID
            cells[1].textContent, // Username
            cells[2].textContent, // Email
            cells[3].textContent.trim(), // Role
            cells[4].textContent, // Total API Keys
            cells[5].textContent // Registered
        ];
        csv += rowData.join(',') + '\n';
    });

    downloadCSV(csv, 'users-export.csv');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Data berhasil diexport ke ${filename}!`);
}

/* =========================
   SYSTEM INFO
========================= */
function showSystemInfo() {
    alert(`
🖥️ System Information

Server: ${API_URL}
User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
Online: ${navigator.onLine}

Current Time: ${new Date().toLocaleString('id-ID')}
    `.trim());
}

/* =========================
   COPY TO CLIPBOARD
========================= */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ API Key berhasil disalin!');
    }).catch((error) => {
        console.error('Copy failed:', error);
        alert('❌ Gagal menyalin API Key');
    });
}

/* =========================
   REFRESH ALL DATA
========================= */
function refreshData() {
    loadStats();
    loadApiKeys();
    loadUsers();
    loadLogs();
    alert('✅ Data berhasil direfresh!');
}