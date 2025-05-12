

// Main application class

class TaskMasterApp {
    constructor() {
        // Initialize app state
        this.currentUser = null;
        this.tasks = [];
        this.activeSection = 'dashboard';
        
        // DOM elements
        this.authContainer = document.getElementById('auth-container');
        this.mainApp = document.getElementById('main-app');
        this.taskModal = document.getElementById('task-modal');
        
        // Bind event handlers
        this.bindEvents();
        
        // Initialize app
        this.init();
    }
    
    // Initialize the application
    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('taskmaster_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.loadTasks();
            this.showMainApp();
            this.updateDashboard();
            this.renderUpcomingTasks();
            this.initializeChart();
        } else {
            // Show authentication screen
            this.showAuthScreen();
        }
        
        // Set current date
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Bind event listeners to DOM elements
    bindEvents() {
        // Authentication events
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('signup-form').addEventListener('submit', this.handleSignup.bind(this));
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-card').style.display = 'none';
            document.getElementById('signup-card').style.display = 'block';
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-card').style.display = 'none';
            document.getElementById('login-card').style.display = 'block';
        });
        
        // Main app events
        document.getElementById('signout-btn').addEventListener('click', this.handleSignout.bind(this));
        document.getElementById('add-task-btn').addEventListener('click', this.openAddTaskModal.bind(this));
        document.getElementById('close-modal').addEventListener('click', this.closeTaskModal.bind(this));
        document.getElementById('cancel-task').addEventListener('click', this.closeTaskModal.bind(this));
        document.getElementById('task-form').addEventListener('submit', this.handleSaveTask.bind(this));
        document.getElementById('search-tasks').addEventListener('input', this.handleSearchTasks.bind(this));
        
        // Navigation events
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('href').substring(1);
                this.navigateTo(section);
            });
        });
        
        // Chart filter event
        document.getElementById('chart-time-filter').addEventListener('change', this.updateChartData.bind(this));
    }
    
    // Authentication Methods
    
    // Handle login form submission
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        // Validate inputs
        if (!email || !password) {
            errorElement.textContent = 'Please fill in all fields';
            return;
        }
        
        // Check if user exists in localStorage
        const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            errorElement.textContent = 'User not found';
            return;
        }
        
        // Simple password check (in real app use proper auth)
        if (user.password !== password) {
            errorElement.textContent = 'Invalid password';
            return;
        }
        
        // Set current user and save to localStorage
        this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        localStorage.setItem('taskmaster_user', JSON.stringify(this.currentUser));
        
        // Load tasks and show main app
        this.loadTasks();
        this.showMainApp();
        this.updateDashboard();
        this.renderUpcomingTasks();
        this.initializeChart();
    }
    
    // Handle signup form submission
    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        const errorElement = document.getElementById('signup-error');
        
        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            errorElement.textContent = 'Please fill in all fields';
            return;
        }
        
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }
        
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
        if (users.some(u => u.email === email)) {
            errorElement.textContent = 'Email already registered';
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password // In a real app, this should be hashed
        };
        
        // Save to localStorage
        users.push(newUser);
        localStorage.setItem('taskmaster_users', JSON.stringify(users));
        
        // Set current user and save to localStorage
        this.currentUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };
        localStorage.setItem('taskmaster_user', JSON.stringify(this.currentUser));
        
        // Initialize empty tasks array for new user
        localStorage.setItem(`taskmaster_tasks_${this.currentUser.id}`, JSON.stringify([]));
        this.tasks = [];
        
        // Show main app
        this.showMainApp();
        this.updateDashboard();
        this.initializeChart();
    }
    
    // Handle user sign out
    handleSignout() {
        // Clear current user
        this.currentUser = null;
        localStorage.removeItem('taskmaster_user');
        
        // Show auth screen
        this.showAuthScreen();
    }
    
    // Show authentication screen
    showAuthScreen() {
        this.authContainer.style.display = 'flex';
        this.mainApp.style.display = 'none';
        
        // Reset auth forms
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();
        document.getElementById('login-error').textContent = '';
        document.getElementById('signup-error').textContent = '';
        document.getElementById('login-card').style.display = 'block';
        document.getElementById('signup-card').style.display = 'none';
    }
    
    // Show main application UI
    showMainApp() {
        this.authContainer.style.display = 'none';
        this.mainApp.style.display = 'flex';
        
        // Update user info in the sidebar
        document.getElementById('user-name').textContent = this.currentUser.name;
        document.getElementById('user-email').textContent = this.currentUser.email;
    }

    
    
    // Task Management Methods
    
    // Load tasks for current user from localStorage
    loadTasks() {
        if (!this.currentUser) return;
        
        const savedTasks = localStorage.getItem(`taskmaster_tasks_${this.currentUser.id}`);
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    }
    
    // Save tasks to localStorage
    saveTasks() {
        if (!this.currentUser) return;
        
        localStorage.setItem(`taskmaster_tasks_${this.currentUser.id}`, JSON.stringify(this.tasks));
    }
    
    // Open modal to add a new task
    openAddTaskModal() {
        document.getElementById('modal-title').textContent = 'Add New Task';
        document.getElementById('task-form').reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-error').textContent = '';
        
        // Set default due date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('task-due-date').value = this.formatDateForInput(tomorrow);
        
        // Show modal
        this.taskModal.classList.add('show');
    }
    
    // Open modal to edit an existing task
    openEditTaskModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('modal-title').textContent = 'Edit Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-due-date').value = this.formatDateForInput(new Date(task.dueDate));
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-error').textContent = '';
        
        // Show modal
        this.taskModal.classList.add('show');
    }
    
    // Close task modal
    closeTaskModal() {
        this.taskModal.classList.remove('show');
    }
    
    // Handle saving a task (create or update)
    handleSaveTask(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const errorElement = document.getElementById('task-error');
        
        // Validate inputs
        if (!title || !dueDate || !priority) {
            errorElement.textContent = 'Please fill in all required fields';
            return;
        }
        
        if (new Date(dueDate) < new Date().setHours(0, 0, 0, 0)) {
            errorElement.textContent = 'Due date cannot be in the past';
            return;
        }
        
        // Create or update task
        if (taskId) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = {
                    ...this.tasks[taskIndex],
                    title,
                    description,
                    dueDate: new Date(dueDate).getTime(),
                    priority,
                    updatedAt: Date.now()
                };
            }
        } else {
            // Create new task
            const newTask = {
                id: Date.now().toString(),
                title,
                description,
                dueDate: new Date(dueDate).getTime(),
                priority,
                completed: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.tasks.push(newTask);
        }
        
        // Save tasks and update UI
        this.saveTasks();
        this.closeTaskModal();
        this.updateDashboard();
        this.renderUpcomingTasks();
        
        // Show notification (could be enhanced with more UI feedback)
        alert(taskId ? 'Task updated successfully' : 'Task added successfully');
    }
    
    // Toggle task completion status
    toggleTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
            this.tasks[taskIndex].updatedAt = Date.now();
            
            if (this.tasks[taskIndex].completed) {
                this.tasks[taskIndex].completedAt = Date.now();
            } else {
                delete this.tasks[taskIndex].completedAt;
            }
            
            this.saveTasks();
            this.updateDashboard();
            this.renderUpcomingTasks();
        }
    }
    
    // Delete a task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.updateDashboard();
            this.renderUpcomingTasks();
        }
    }
    
    // Search tasks
    handleSearchTasks(e) {
        const searchTerm = e.target.value.toLowerCase();
        this.renderUpcomingTasks(searchTerm);
    }
    
    // UI Update Methods
    
    // Update dashboard statistics and charts
    updateDashboard() {
        if (!this.currentUser) return;
        
        const today = new Date().setHours(0, 0, 0, 0);
        
        // Update task statistics
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const inProgressTasks = this.tasks.filter(t => !t.completed).length;
        const overdueTasks = this.tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;
        
        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('in-progress-tasks').textContent = inProgressTasks;
        document.getElementById('overdue-tasks').textContent = overdueTasks;
        
        // Update task priority breakdown
        const highPriorityTasks = this.tasks.filter(t => t.priority === 'high');
        const mediumPriorityTasks = this.tasks.filter(t => t.priority === 'medium');
        const lowPriorityTasks = this.tasks.filter(t => t.priority === 'low');
        
        const highCompletionRate = highPriorityTasks.length > 0 
            ? Math.round((highPriorityTasks.filter(t => t.completed).length / highPriorityTasks.length) * 100) 
            : 0;
        const mediumCompletionRate = mediumPriorityTasks.length > 0 
            ? Math.round((mediumPriorityTasks.filter(t => t.completed).length / mediumPriorityTasks.length) * 100) 
            : 0;
        const lowCompletionRate = lowPriorityTasks.length > 0 
            ? Math.round((lowPriorityTasks.filter(t => t.completed).length / lowPriorityTasks.length) * 100) 
            : 0;
        
        const priorityElements = document.querySelectorAll('.priority-progress .priority-item');
        if (priorityElements.length === 3) {
            // High priority
            priorityElements[0].querySelector('.progress-bar').style.width = `${highCompletionRate}%`;
            priorityElements[0].querySelector('.progress-text').textContent = `${highCompletionRate}%`;
            
            // Medium priority
            priorityElements[1].querySelector('.progress-bar').style.width = `${mediumCompletionRate}%`;
            priorityElements[1].querySelector('.progress-text').textContent = `${mediumCompletionRate}%`;
            
            // Low priority
            priorityElements[2].querySelector('.progress-bar').style.width = `${lowCompletionRate}%`;
            priorityElements[2].querySelector('.progress-text').textContent = `${lowCompletionRate}%`;
        }
        
        // Update chart if initialized
        this.updateChartData();
    }
    
    // Initialize chart on dashboard
    initializeChart() {
        const ctx = document.getElementById('task-chart').getContext('2d');
        
        // Create initial chart with empty data
        this.taskChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Created Tasks',
                        backgroundColor: 'rgba(67, 97, 238, 0.2)',
                        borderColor: 'rgba(67, 97, 238, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(67, 97, 238, 1)',
                        pointRadius: 4,
                        tension: 0.3,
                        data: []
                    },
                    {
                        label: 'Completed Tasks',
                        backgroundColor: 'rgba(74, 222, 128, 0.2)',
                        borderColor: 'rgba(74, 222, 128, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(74, 222, 128, 1)',
                        pointRadius: 4,
                        tension: 0.3,
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
        
        // Update chart with actual data
        this.updateChartData();
    }
    
    // Update chart data based on time filter
    updateChartData() {
        if (!this.taskChart) return;
        
        const timeFilter = document.getElementById('chart-time-filter').value;
        const today = new Date();
        let startDate, dateFormat, dateStep;
        
        // Determine start date and date format based on filter
        switch (timeFilter) {
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                dateFormat = { month: 'short', day: 'numeric' };
                dateStep = { days: 1 };
                break;
            case 'month':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 29);
                dateFormat = { month: 'short', day: 'numeric' };
                dateStep = { days: 3 };
                break;
            case 'year':
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 11);
                startDate.setDate(1);
                dateFormat = { month: 'short' };
                dateStep = { months: 1 };
                break;
        }
        
        // Generate date labels and empty data arrays
        const labels = [];
        const createdData = [];
        const completedData = [];
        
        // Helper to increment date based on step
        const incrementDate = (date, step) => {
            const newDate = new Date(date);
            if (step.days) {
                newDate.setDate(date.getDate() + step.days);
            } else if (step.months) {
                newDate.setMonth(date.getMonth() + step.months);
            }
            return newDate;
        };
        
        // Generate dates
        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            labels.push(currentDate.toLocaleDateString('en-US', dateFormat));
            
            // Count tasks created on this date
            const createdTasks = this.countTasksInDateRange(
                this.tasks,
                'createdAt',
                currentDate,
                incrementDate(currentDate, dateStep)
            );
            createdData.push(createdTasks);
            
            // Count tasks completed on this date
            const completedTasks = this.countTasksInDateRange(
                this.tasks.filter(t => t.completed),
                'completedAt',
                currentDate,
                incrementDate(currentDate, dateStep)
            );
            completedData.push(completedTasks);
            
            // Move to next date
            currentDate = incrementDate(currentDate, dateStep);
        }
        
        // Update chart data
        this.taskChart.data.labels = labels;
        this.taskChart.data.datasets[0].data = createdData;
        this.taskChart.data.datasets[1].data = completedData;
        this.taskChart.update();
    }
    
    // Count tasks in a specific date range
    countTasksInDateRange(tasks, dateField, startDate, endDate) {
        return tasks.filter(task => {
            const taskDate = new Date(task[dateField]);
            return taskDate >= startDate && taskDate < endDate;
        }).length;
    }
    
    // Render upcoming tasks on dashboard
    renderUpcomingTasks(searchTerm = '') {
        const upcomingTasksContainer = document.getElementById('upcoming-tasks');
        if (!upcomingTasksContainer) return;
        
        const today = new Date().setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        
        // Filter tasks
        let filteredTasks = this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            return !task.completed && dueDate >= today;
        });
        
        // Apply search filter if provided
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) || 
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort by due date (ascending)
        filteredTasks.sort((a, b) => a.dueDate - b.dueDate);
        
        // Limit to 5 tasks for the dashboard
        const displayTasks = filteredTasks.slice(0, 5);
        
        // Generate HTML
        if (displayTasks.length === 0) {
            upcomingTasksContainer.innerHTML = '<p class="no-tasks">No upcoming tasks found.</p>';
            return;
        }
        
        upcomingTasksContainer.innerHTML = displayTasks.map(task => {
            const dueDate = new Date(task.dueDate);
            const isToday = dueDate.setHours(0, 0, 0, 0) === today;
            const isOverdue = dueDate < today;
            
            return `
                <div class="task-item" data-id="${task.id}">
                    <div class="task-checkbox">
                        <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                    </div>
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">
                            ${task.title}
                            ${isOverdue ? '<span class="priority-badge high">Overdue</span>' : ''}
                        </div>
                        <div class="task-details">
                            <div class="task-priority">
                                <span class="priority-badge ${task.priority}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                            </div>
                            <div class="task-date">
                                <i class="fas fa-calendar-day"></i>
                                <span>${isToday ? 'Today' : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit" data-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn delete" data-id="${task.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        upcomingTasksContainer.querySelectorAll('.task-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                this.toggleTaskCompletion(taskId);
            });
        });
        
        upcomingTasksContainer.querySelectorAll('.task-action-btn.edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.id;
                this.openEditTaskModal(taskId);
            });
        });
        
        upcomingTasksContainer.querySelectorAll('.task-action-btn.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.id;
                this.deleteTask(taskId);
            });
        });
    }
    
    // Navigation Methods
    
    // Navigate to a specific section
    navigateTo(section) {
        // Update active section
        this.activeSection = section;
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-nav li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`.sidebar-nav a[href="#${section}"]`).parentElement.classList.add('active');
        
        // For now, we only have dashboard implemented
        // In a full implementation, we would show/hide different sections
        
        // For demonstration purposes, show a notification
        if (section !== 'dashboard') {
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} section would be shown here.`);
            
            // Reset to dashboard
            setTimeout(() => {
                this.navigateTo('dashboard');
            }, 500);
        }
    }
    
    // Utility Methods
    
    // Format date for input field (YYYY-MM-DD)
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create and start the app
    window.taskMasterApp = new TaskMasterApp();
});