const API = "";

// ==================== Toast 轻提示 ====================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 2800);
}

// ==================== 全局数据 ====================
let currentList = [];
let filteredList = [];
let currentAdminTab = 'orders';  // 'orders' 或 'users'

// ==================== 登录/注册切换 ====================
let isLoginMode = true;
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authSwitchText = document.getElementById('authSwitchText');
const authError = document.getElementById('authError');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');

authSwitchBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = '📝 登录';
        authSubmitBtn.innerText = '登录';
        authSwitchText.innerText = '还没有账号？';
        authSwitchBtn.innerText = '去注册';
    } else {
        authTitle.innerText = '📝 注册';
        authSubmitBtn.innerText = '注册';
        authSwitchText.innerText = '已有账号？';
        authSwitchBtn.innerText = '去登录';
    }
    authError.innerText = '';
});

// ==================== 登录/注册提交 ====================
authSubmitBtn.addEventListener('click', async () => {
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    if (!username || !password) {
        authError.innerText = '⚠️ 请填写完整信息';
        return;
    }

    const endpoint = isLoginMode ? '/api/login' : '/api/register';
    try {
        const res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        if (res.ok) {
            const result = await res.json();
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('username', result.data.username);
            localStorage.setItem('user_id', result.data.id);
            localStorage.setItem('is_admin', result.data.is_admin);   // 存储管理员标识
            authError.innerText = '';
            showApp();
        } else {
            const error = await res.json();
            authError.innerText = '❌ ' + (error.detail || '请求失败');
        }
    } catch (e) {
        authError.innerText = '❌ 网络错误：' + e.message;
    }
});

authPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') authSubmitBtn.click();
});

// ==================== Token 工具 ====================
function getToken() { return localStorage.getItem('token'); }
function isLoggedIn() { return !!getToken(); }

// ==================== 界面切换 ====================
function showApp() {
    const username = localStorage.getItem('username');
    document.getElementById('welcomeUser').innerText = '👋 ' + username + '，欢迎回来！';
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    loadData();

    // 判断是否为管理员，显示/隐藏管理按钮
    const isAdmin = localStorage.getItem('is_admin') === '1';
    document.getElementById('adminBtn').style.display = isAdmin ? 'inline-block' : 'none';
    
    // 确保退出管理模式
    document.getElementById('adminModeBar').classList.add('hidden');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('is_admin');
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('totalIncome').innerText = '0.00';
    document.getElementById('totalExpense').innerText = '0.00';
    document.getElementById('totalBalance').innerText = '0.00';
    document.getElementById('adminModeBar').classList.add('hidden');
    showToast('👋 已安全退出', 'success');
}

// ==================== 开机自检 ====================
if (isLoggedIn()) { showApp(); }

// ==================== 加载数据 ====================
async function loadData() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            showToast('⚠️ 加载失败：' + (err.detail || '未知错误'), 'error');
            return;
        }
        const result = await res.json();
        const list = result.data || [];
        currentList = list;
        filteredList = [...list];
        applyFilters();
    } catch (e) {
        showToast('⚠️ 加载失败：' + e.message, 'error');
    }
}

// ==================== 筛选引擎 ====================
function applyFilters() {
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const filterType = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

    let result = [...currentList];
    if (filterType !== 'all') {
        result = result.filter(item => item.type === filterType);
    }
    if (keyword !== '') {
        result = result.filter(item => item.remark && item.remark.toLowerCase().includes(keyword));
    }

    filteredList = result;
    renderTable(filteredList);
    calcStats(filteredList);
}

// ==================== 渲染普通表格（6列） ====================
function renderTable(list) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">📭 暂无记录</td></tr>';
        return;
    }
    list.forEach(item => {
        const typeText = item.type === 'income' ? '💹 收入' : '💸 支出';
        const color = item.type === 'income' ? '#28a745' : '#dc3545';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${typeText}</td>
            <td style="color:${color};font-weight:bold;">${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.remark || '-'}</td>
            <td>${item.created_at ? item.created_at.replace('T', ' ') : '-'}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${item.id})">✏️</button>
                <button class="btn-danger" onclick="handleDelete(${item.id})">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== 统计 ====================
function calcStats(list) {
    let totalIncome = 0, totalExpense = 0;
    list.forEach(item => {
        const amt = parseFloat(item.amount) || 0;
        if (item.type === 'income') totalIncome += amt;
        else totalExpense += amt;
    });
    document.getElementById('totalIncome').innerText = totalIncome.toFixed(2);
    document.getElementById('totalExpense').innerText = totalExpense.toFixed(2);
    document.getElementById('totalBalance').innerText = (totalIncome - totalExpense).toFixed(2);
}

// ==================== 新增账单 ====================
async function handleAdd() {
    const token = getToken();
    if (!token) return;
    const type = document.getElementById('inputType').value;
    const amount = document.getElementById('inputAmount').value.trim();
    const remark = document.getElementById('inputRemark').value.trim();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showToast('⚠️ 请输入有效金额', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: `type=${type}&amount=${amount}&remark=${encodeURIComponent(remark)}`
        });

        if (res.ok) {
            document.getElementById('inputAmount').value = '';
            document.getElementById('inputRemark').value = '';
            await loadData();
            showToast('✅ 添加成功！', 'success');
        } else {
            const err = await res.json();
            showToast('❌ 添加失败：' + (err.detail || '未知错误'), 'error');
        }
    } catch (e) {
        showToast('❌ 网络错误：' + e.message, 'error');
    }
}

// ==================== 删除账单 ====================
async function handleDelete(id) {
    const token = getToken();
    if (!token) return;
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
        const res = await fetch(`${API}/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            await loadData();
            showToast('🗑️ 删除成功！', 'success');
        } else {
            const err = await res.json();
            showToast('❌ 删除失败：' + (err.detail || '未知错误'), 'error');
        }
    } catch (e) {
        showToast('❌ 网络错误：' + e.message, 'error');
    }
}

// ==================== 编辑弹窗 ====================
function openEditModal(id) {
    const item = currentList.find(i => i.id === id);
    if (!item) {
        alert('数据不存在，请刷新重试');
        return;
    }
    document.getElementById('editId').value = item.id;
    document.getElementById('editType').value = item.type;
    document.getElementById('editAmount').value = item.amount;
    document.getElementById('editRemark').value = item.remark || '';
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function saveEdit() {
    const id = document.getElementById('editId').value;
    const type = document.getElementById('editType').value;
    const amount = document.getElementById('editAmount').value.trim();
    const remark = document.getElementById('editRemark').value.trim();
    const token = getToken();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        alert('请输入有效金额');
        return;
    }

    try {
        const res = await fetch(`${API}/orders/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: `type=${type}&amount=${amount}&remark=${encodeURIComponent(remark)}`
        });

        if (res.ok) {
            closeEditModal();
            showToast('✅ 修改成功！', 'success');
            await loadData();
        } else {
            const err = await res.json();
            alert('修改失败：' + (err.detail || '未知错误'));
        }
    } catch (e) {
        alert('网络错误：' + e.message);
    }
}

// ==================== 导出 Excel ====================
async function exportExcel() {
    const token = getToken();
    if (!token) {
        showToast('⚠️ 请先登录', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/orders/export`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            showToast('❌ 导出失败：' + (err.detail || '未知错误'), 'error');
            return;
        }

        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = '账单.xlsx';
        if (contentDisposition) {
            let match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
            if (match) {
                filename = decodeURIComponent(match[1]);
            } else {
                match = contentDisposition.match(/filename=(.+)/);
                if (match) {
                    filename = match[1];
                }
            }
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✅ 导出成功！', 'success');
    } catch (e) {
        showToast('❌ 导出失败：' + e.message, 'error');
    }
}

// ==================== 筛选按钮事件 ====================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        applyFilters();
    });
});

document.getElementById('searchInput').addEventListener('input', function() {
    applyFilters();
});


// ================================================================
// ==================== 管理员后台（含用户管理） ====================
// ================================================================

function enterAdminMode() {
    document.getElementById('adminModeBar').classList.remove('hidden');
    switchAdminTab('orders');  // 默认显示账单总览
}

function exitAdminMode() {
    document.getElementById('adminModeBar').classList.add('hidden');
    // 恢复普通视图
    loadData();
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    // 更新高亮
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    if (tab === 'orders') {
        loadAdminOrders();
    } else if (tab === 'users') {
        loadAdminUsers();
    }
}

// ---------- 账单总览 ----------
async function loadAdminOrders() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            alert('加载账单数据失败：' + (err.detail || '无权限'));
            return;
        }
        const result = await res.json();
        renderAdminTable(result.data || []);
    } catch (e) {
        alert('网络错误：' + e.message);
    }
}

function renderAdminTable(list) {
    // 修改表头（增加“用户名”列）
    const thead = document.querySelector('#tableBody').parentElement.querySelector('thead');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>类型</th>
                <th>金额</th>
                <th>备注</th>
                <th>时间</th>
                <th>用户名</th>
                <th>操作</th>
            </tr>
        `;
    }

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">📭 暂无任何用户记录</td></tr>';
        return;
    }
    list.forEach(item => {
        const typeText = item.type === 'income' ? '💹 收入' : '💸 支出';
        const color = item.type === 'income' ? '#28a745' : '#dc3545';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${typeText}</td>
            <td style="color:${color};font-weight:bold;">${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.remark || '-'}</td>
            <td>${item.created_at ? item.created_at.replace('T', ' ') : '-'}</td>
            <td><strong>${item.username || '已注销'}</strong></td>
            <td><button class="btn-danger" onclick="alert('管理员不能在此删除，请在数据库操作')">禁止删除</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ---------- 用户管理 ----------
async function loadAdminUsers() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            alert('加载用户列表失败：' + (err.detail || '无权限'));
            return;
        }
        const result = await res.json();
        renderAdminUsers(result.data || []);
    } catch (e) {
        alert('网络错误：' + e.message);
    }
}

function renderAdminUsers(users) {
    // 修改表头为用户管理格式
    const thead = document.querySelector('#tableBody').parentElement.querySelector('thead');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>操作</th>
            </tr>
        `;
    }

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">📭 暂无用户</td></tr>';
        return;
    }

    users.forEach(user => {
        const roleText = user.is_admin === 1 ? '👑 管理员' : '👤 普通用户';
        const statusText = user.is_active === 1 ? '✅ 启用' : '⛔ 禁用';
        const statusColor = user.is_active === 1 ? '#28a745' : '#dc3545';
        const toggleText = user.is_active === 1 ? '禁用' : '启用';
        const toggleColor = user.is_active === 1 ? '#dc3545' : '#28a745';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${roleText}</td>
            <td style="color:${statusColor};font-weight:bold;">${statusText}</td>
            <td>${user.created_at ? user.created_at.replace('T', ' ') : '-'}</td>
            <td>
                <button class="btn-toggle" style="background:${toggleColor};color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;" onclick="toggleUserStatus(${user.id})">${toggleText}</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function toggleUserStatus(targetUserId) {
    if (!confirm('确定要切换该用户的状态吗？')) return;
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API}/admin/users/${targetUserId}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            alert('操作失败：' + (err.detail || '未知错误'));
            return;
        }
        const result = await res.json();
        alert(result.msg);
        // 刷新用户列表
        loadAdminUsers();
    } catch (e) {
        alert('网络错误：' + e.message);
    }
}