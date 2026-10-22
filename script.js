const getTodayISO = () => new Date().toISOString().split('T')[0];

let tasks = JSON.parse(localStorage.getItem('anchordo_tasks')) || [
    { id: '1', title: 'Implement AnchorDo User Authentication', dueDate: getTodayISO(), category: 'Development', priority: 'high', status: 'completed', createdAt: new Date().toISOString() },
    { id: '2', title: 'Design AnchorDo Landing Page Dark Mode', dueDate: getTodayISO(), category: 'Design', priority: 'medium', status: 'in-progress', createdAt: new Date().toISOString() },
    { id: '3', title: 'Setup AnchorDo CI/CD Pipeline via GitHub Actions', dueDate: getTodayISO(), category: 'Development', priority: 'high', status: 'todo', createdAt: new Date().toISOString() },
    { id: '4', title: 'Review Q3 Analytics and Performance Metrics', dueDate: getTodayISO(), category: 'Work', priority: 'low', status: 'todo', createdAt: new Date().toISOString() }
];

let calendarCurrentDate = new Date();
let selectedCalendarDate = getTodayISO();

let dashboardChartInstance = null;
let categoryChartInstance = null;
let priorityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupTheme();
    setupNavigation();
    setupEventListeners();
    renderAll();
    updateDateDisplay();
}

function updateDateDisplay() {
    const el = document.getElementById('currentDate');
    if (el) {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        el.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

function setupTheme() {
    const savedTheme = localStorage.getItem('anchordo_theme') || 'dark';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }
    localStorage.setItem('anchordo_theme', theme);
    updateThemeIcon(isDark);
}

function toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    applyTheme(isCurrentlyDark ? 'light' : 'dark');
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon) {
        icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
    if (label) {
        label.textContent = isDark ? 'Dark' : 'Light';
    }
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (!page) return;

            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll(`[data-page="${page}"]`).forEach(b => b.classList.add('active'));

            document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) targetPage.classList.remove('hidden');

            renderAll();
        });
    });
}

function setupEventListeners() {
    const quickAddBtn = document.getElementById('quickAddBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const taskForm = document.getElementById('taskForm');

    quickAddBtn?.addEventListener('click', () => openModal());
    closeModalBtn?.addEventListener('click', closeModal);
    cancelTaskBtn?.addEventListener('click', closeModal);

    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    taskForm?.addEventListener('submit', handleTaskSubmit);

    document.getElementById('searchInput')?.addEventListener('input', renderTasks);
    document.getElementById('filterCategory')?.addEventListener('change', renderTasks);
    document.getElementById('filterPriority')?.addEventListener('change', renderTasks);

    document.getElementById('viewListBtn')?.addEventListener('click', () => toggleView('list'));
    document.getElementById('viewBoardBtn')?.addEventListener('click', () => toggleView('board'));

    document.getElementById('exportDataBtn')?.addEventListener('click', exportDataset);
    document.getElementById('importDataInput')?.addEventListener('change', importDataset);
    document.getElementById('resetDataBtn')?.addEventListener('click', resetDataset);

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    document.getElementById('calendarNavBtn')?.addEventListener('click', () => {
        const calNavBtn = document.querySelector('.nav-btn[data-page="calendar"]');
        if (calNavBtn) calNavBtn.click();
    });

    document.getElementById('calPrevMonth')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('calNextMonth')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('scheduleTaskForDateBtn')?.addEventListener('click', () => {
        openModal(null, selectedCalendarDate);
    });
}

function saveTasks() {
    localStorage.setItem('anchordo_tasks', JSON.stringify(tasks));
    renderAll();
}

function renderAll() {
    renderStats();
    renderRecentTasks();
    renderTasks();
    renderBoard();
    renderCalendar();
    renderCharts();
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'in-progress' || t.status === 'todo').length;
    const high = tasks.filter(t => t.priority === 'high').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statHighPriority').textContent = high;

    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('productivityScore').textContent = `${score}%`;
}

function renderRecentTasks() {
    const container = document.getElementById('recentTaskList');
    if (!container) return;

    const recent = [...tasks].reverse().slice(0, 4);
    if (recent.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">No tasks recorded yet.</p>`;
        return;
    }

    container.innerHTML = recent.map(task => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
            <div class="flex items-center gap-3">
                <button onclick="toggleTaskStatus('${task.id}')" class="text-slate-500 hover:text-emerald-400">
                    <i class="${task.status === 'completed' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-regular fa-circle'} text-base"></i>
                </button>
                <div>
                    <span class="${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'} font-medium">${escapeHtml(task.title)}</span>
                    <p class="text-[10px] text-slate-500">Due: ${task.dueDate}</p>
                </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getPriorityBadgeClass(task.priority)}">
                ${task.priority}
            </span>
        </div>
    `).join('');
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYearText = document.getElementById('calendarMonthYear');
    if (!grid || !monthYearText) return;

    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearText.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = "h-20 bg-slate-950/20 rounded-xl border border-slate-800/30";
        grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);

        const isSelected = selectedCalendarDate === dateStr;
        const isToday = getTodayISO() === dateStr;

        const cell = document.createElement('div');
        cell.className = `h-20 p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
            isSelected ? 'border-brand-500 bg-brand-500/10' : isToday ? 'border-amber-500/50 bg-slate-900/80' : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700'
        }`;

        cell.onclick = () => {
            selectedCalendarDate = dateStr;
            renderCalendar();
        };

        cell.innerHTML = `
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold ${isToday ? 'text-amber-400' : 'text-slate-300'}">${day}</span>
                ${dayTasks.length > 0 ? `<span class="text-[9px] bg-brand-600/80 text-white px-1.5 py-0.2 rounded-full font-bold">${dayTasks.length}</span>` : ''}
            </div>
            <div class="space-y-1 overflow-hidden">
                ${dayTasks.slice(0, 2).map(t => `
                    <div class="text-[9px] truncate px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">${escapeHtml(t.title)}</div>
                `).join('')}
                ${dayTasks.length > 2 ? `<p class="text-[8px] text-slate-500 font-semibold">+${dayTasks.length - 2} more</p>` : ''}
            </div>
        `;

        grid.appendChild(cell);
    }

    renderSelectedDateSchedule();
}

function renderSelectedDateSchedule() {
    const titleEl = document.getElementById('selectedDateTitle');
    const container = document.getElementById('selectedDateTaskList');

    if (titleEl) titleEl.textContent = selectedCalendarDate;
    if (!container) return;

    const dayTasks = tasks.filter(t => t.dueDate === selectedCalendarDate);

    if (dayTasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-500 space-y-2">
                <i class="fa-regular fa-calendar-xmark text-2xl"></i>
                <p class="text-xs">No tasks scheduled for this date.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = dayTasks.map(task => `
        <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}">${escapeHtml(task.title)}</span>
                <button onclick="toggleTaskStatus('${task.id}')" class="text-slate-500 hover:text-emerald-400 text-xs">
                    <i class="${task.status === 'completed' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-regular fa-circle'}"></i>
                </button>
            </div>
            <div class="flex items-center justify-between text-[10px]">
                <span class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">${task.category}</span>
                <span class="font-bold uppercase ${getPriorityBadgeClass(task.priority)} px-1.5 py-0.5 rounded">${task.priority}</span>
            </div>
        </div>
    `).join('');
}

function getFilteredTasks() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const cat = document.getElementById('filterCategory')?.value || 'all';
    const prio = document.getElementById('filterPriority')?.value || 'all';

    return tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(query);
        const matchesCat = cat === 'all' || task.category === cat;
        const matchesPrio = prio === 'all' || task.priority === prio;
        return matchesSearch && matchesCat && matchesPrio;
    });
}

function renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-500 py-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/50">No tasks matching criteria.</p>`;
        return;
    }

    container.innerHTML = filtered.map(task => `
        <div class="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl hover:border-slate-700/80 transition-all">
            <div class="flex items-center gap-3.5">
                <button onclick="toggleTaskStatus('${task.id}')" class="text-slate-500 hover:text-emerald-400 transition-colors">
                    <i class="${task.status === 'completed' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-regular fa-circle'} text-lg"></i>
                </button>
                <div>
                    <h4 class="text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}">${escapeHtml(task.title)}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">${task.category}</span>
                        <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
                        <span class="text-[10px] text-slate-500 font-medium"><i class="fa-regular fa-clock"></i> ${task.dueDate}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="editTask('${task.id}')" class="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg text-xs">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-xs">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderBoard() {
    const todoContainer = document.getElementById('boardTodo');
    const inProgressContainer = document.getElementById('boardInProgress');
    const completedContainer = document.getElementById('boardCompleted');

    if (!todoContainer) return;

    const filtered = getFilteredTasks();

    const todo = filtered.filter(t => t.status === 'todo');
    const inProgress = filtered.filter(t => t.status === 'in-progress');
    const completed = filtered.filter(t => t.status === 'completed');

    document.getElementById('todoCount').textContent = todo.length;
    document.getElementById('inProgressCount').textContent = inProgress.length;
    document.getElementById('completedCount').textContent = completed.length;

    todoContainer.innerHTML = todo.map(t => createBoardCard(t)).join('');
    inProgressContainer.innerHTML = inProgress.map(t => createBoardCard(t)).join('');
    completedContainer.innerHTML = completed.map(t => createBoardCard(t)).join('');
}

function createBoardCard(task) {
    return `
        <div class="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 shadow-sm">
            <div class="flex justify-between items-start gap-2">
                <h4 class="text-xs font-semibold text-slate-200 leading-snug">${escapeHtml(task.title)}</h4>
                <button onclick="deleteTask('${task.id}')" class="text-slate-500 hover:text-rose-400 text-xs">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="flex items-center justify-between pt-1 text-[10px]">
                <span class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded">${task.category}</span>
                <div class="flex gap-1">
                    ${task.status !== 'todo' ? `<button onclick="updateStatus('${task.id}', 'todo')" class="p-1 text-slate-400 hover:text-white bg-slate-800 rounded"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
                    ${task.status !== 'completed' ? `<button onclick="updateStatus('${task.id}', '${task.status === 'todo' ? 'in-progress' : 'completed'}')" class="p-1 text-slate-400 hover:text-white bg-slate-800 rounded"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function toggleView(view) {
    const listCont = document.getElementById('listViewContainer');
    const boardCont = document.getElementById('boardViewContainer');
    const listBtn = document.getElementById('viewListBtn');
    const boardBtn = document.getElementById('viewBoardBtn');

    if (view === 'list') {
        listCont.classList.remove('hidden');
        boardCont.classList.add('hidden');
        listBtn.classList.add('bg-slate-800', 'text-white');
        listBtn.classList.remove('text-slate-400');
        boardBtn.classList.remove('bg-slate-800', 'text-white');
        boardBtn.classList.add('text-slate-400');
    } else {
        listCont.classList.add('hidden');
        boardCont.classList.remove('hidden');
        boardBtn.classList.add('bg-slate-800', 'text-white');
        boardBtn.classList.remove('text-slate-400');
        listBtn.classList.remove('bg-slate-800', 'text-white');
        listBtn.classList.add('text-slate-400');
    }
}

function openModal(taskId = null, presetDate = null) {
    const overlay = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');
    const title = document.getElementById('modalTitle');

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDueDate').value = task.dueDate || getTodayISO();
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        title.textContent = 'Edit Task';
    } else {
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        document.getElementById('taskDueDate').value = presetDate || getTodayISO();
        title.textContent = 'Create New Task';
    }

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        box.classList.remove('scale-95');
    }, 10);
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    const box = document.getElementById('modalBox');

    overlay.classList.add('opacity-0');
    box.classList.add('scale-95');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 200);
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const dueDate = document.getElementById('taskDueDate').value || getTodayISO();
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;

    if (!title) return;

    if (id) {
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], title, dueDate, category, priority, status };
        }
    } else {
        tasks.push({
            id: Date.now().toString(),
            title,
            dueDate,
            category,
            priority,
            status,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
    closeModal();
}

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = task.status === 'completed' ? 'todo' : 'completed';
        saveTasks();
    }
}

function updateStatus(id, newStatus) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveTasks();
    }
}

function editTask(id) {
    openModal(id);
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
}

function renderCharts() {
    renderDashboardChart();
    renderAnalyticsCharts();
}

function renderDashboardChart() {
    const ctx = document.getElementById('dashboardChart');
    if (!ctx) return;

    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.length - completed;

    if (dashboardChartInstance) dashboardChartInstance.destroy();

    dashboardChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#10b981', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            cutout: '75%'
        }
    });
}

function renderAnalyticsCharts() {
    const catCtx = document.getElementById('categoryChart');
    const prioCtx = document.getElementById('priorityChart');

    if (!catCtx || !prioCtx) return;

    const categories = ['Work', 'Personal', 'Development', 'Design'];
    const catCounts = categories.map(c => tasks.filter(t => t.category === c).length);

    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Task Count',
                data: catCounts,
                backgroundColor: '#3b82f6',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    const priorities = ['low', 'medium', 'high'];
    const prioCounts = priorities.map(p => tasks.filter(t => t.priority === p).length);

    if (priorityChartInstance) priorityChartInstance.destroy();
    priorityChartInstance = new Chart(prioCtx, {
        type: 'pie',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                data: prioCounts,
                backgroundColor: ['#64748b', '#f59e0b', '#f43f5e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });
}

function exportDataset() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `anchordo_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
}

function importDataset(e) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                alert('Tasks successfully imported!');
            }
        } catch (err) {
            alert('Invalid JSON file format.');
        }
    };
    if (e.target.files[0]) {
        fileReader.readAsText(e.target.files[0]);
    }
}

function resetDataset() {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
        tasks = [];
        saveTasks();
    }
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'high': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
        case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
