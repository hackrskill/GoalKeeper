
// TaskMaster API Service class
class TaskMasterAPI {
    /**
     * Initialize the API service
     */
    constructor() {
        // Ensure required storage structures exist
        this.initializeStorage();
    }
    
    /**
     * Initialize localStorage with required data structures
     */
    initializeStorage() {
        // Initialize users array if not exists
        if (!localStorage.getItem('taskmaster_users')) {
            localStorage.setItem('taskmaster_users', JSON.stringify([]));
        }
        
        // Initialize demo user if no users exist
        const users = JSON.parse(localStorage.getItem('taskmaster_users'));
        if (users.length === 0) {
            const demoUser = {
                id: "demo123",
                name: "Demo User",
                email: "demo@example.com",
                password: "password123"
            };
            
            users.push(demoUser);
            localStorage.setItem('taskmaster_users', JSON.stringify(users));
            
            // Initialize tasks for demo user with sample data
            this.initializeDemoTasks(demoUser.id);
        }
    }
    
    


    /**
     * Create sample tasks for demo user
     * @param {string} userId - User ID to create tasks for
     */
    initializeDemoTasks(userId) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Sample tasks
        const demoTasks = [
            {
                id: "task1",
                title: "Complete project proposal",
                description: "Finish the project proposal document including timeline and budget",
                dueDate: tomorrow.getTime(),
                priority: "high",
                completed: false,
                createdAt: today.getTime() - 86400000,
                updatedAt: today.getTime()
            },
            {
                id: "task2",
                title: "Team meeting",
                description: "Weekly team sync-up meeting",
                dueDate: today.getTime(),
                priority: "medium",
                completed: false,
                createdAt: yesterday.getTime(),
                updatedAt: yesterday.getTime()
            },
            {
                id: "task3",
                title: "Research new technologies",
                description: "Research and make notes on emerging technologies for next quarter",
                dueDate: nextWeek.getTime(),
                priority: "low",
                completed: true,
                createdAt: yesterday.getTime() - 86400000,
                updatedAt: today.getTime(),
                completedAt: today.getTime()
            },
            {
                id: "task4",
                title: "Client presentation",
                description: "Prepare slides for the client presentation",
                dueDate: tomorrow.getTime() + 86400000,
                priority: "high",
                completed: false,
                createdAt: yesterday.getTime(),
                updatedAt: yesterday.getTime()
            },
            {
                id: "task5",
                title: "Code review",
                description: "Review pull requests from development team",
                dueDate: today.getTime(),
                priority: "medium",
                completed: false,
                createdAt: today.getTime() - 172800000,
                updatedAt: today.getTime() - 86400000
            }
        ];
        
        // Save demo tasks to localStorage
        localStorage.setItem(`taskmaster_tasks_${userId}`, JSON.stringify(demoTasks));
    }
    
    /**
     * Get all users
     * @returns {Array} Array of users
     */
    getUsers() {
        return JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    }
    
    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object|null} User object or null if not found
     */
    getUserById(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId) || null;
    }
    
    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Object|null} User object or null if not found
     */
    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email) || null;
    }
    
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Object} Created user object
     */
    createUser(userData) {
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password) {
            throw new Error('Missing required user data');
        }
        
        // Check if email already exists
        if (this.getUserByEmail(userData.email)) {
            throw new Error('Email already registered');
        }
        
        // Create new user with ID
        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            password: userData.password, // In a real app, this should be hashed
            createdAt: Date.now()
        };
        
        // Add user to storage
        const users = this.getUsers();
        users.push(newUser);
        localStorage.setItem('taskmaster_users', JSON.stringify(users));
        
        // Initialize empty tasks array for new user
        localStorage.setItem(`taskmaster_tasks_${newUser.id}`, JSON.stringify([]));
        
        // Return user object without password
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
    
    /**
     * Update user data
     * @param {string} userId - User ID
     * @param {Object} userData - User data to update
     * @returns {Object} Updated user object
     */
    updateUser(userId, userData) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        // Check if trying to change email to one that already exists
        if (userData.email && userData.email !== users[userIndex].email) {
            const existingUser = this.getUserByEmail(userData.email);
            if (existingUser && existingUser.id !== userId) {
                throw new Error('Email already registered');
            }
        }
        
        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            ...userData,
            updatedAt: Date.now()
        };
        
        localStorage.setItem('taskmaster_users', JSON.stringify(users));
        
        // Return updated user without password
        const { password, ...userWithoutPassword } = users[userIndex];
        return userWithoutPassword;
    }
    
    /**
     * Delete a user
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        
        if (filteredUsers.length === users.length) {
            throw new Error('User not found');
        }
        
        localStorage.setItem('taskmaster_users', JSON.stringify(filteredUsers));
        localStorage.removeItem(`taskmaster_tasks_${userId}`);
        
        return true;
    }
    
    /**
     * Authenticate user by email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object|null} User object without password or null if authentication fails
     */
    authenticateUser(email, password) {
        const user = this.getUserByEmail(email);
        
        if (!user || user.password !== password) {
            return null;
        }
        
        // Return user without password
        const { password: pwd, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    /**
     * Get all tasks for a user
     * @param {string} userId - User ID
     * @returns {Array} Array of tasks
     */
    getTasks(userId) {
        return JSON.parse(localStorage.getItem(`taskmaster_tasks_${userId}`) || '[]');
    }
    
    /**
     * Get task by ID
     * @param {string} userId - User ID
     * @param {string} taskId - Task ID
     * @returns {Object|null} Task object or null if not found
     */
    getTaskById(userId, taskId) {
        const tasks = this.getTasks(userId);
        return tasks.find(task => task.id === taskId) || null;
    }
    
    /**
     * Create a new task
     * @param {string} userId - User ID
     * @param {Object} taskData - Task data
     * @returns {Object} Created task object
     */
    createTask(userId, taskData) {
        // Validate required fields
        if (!taskData.title || !taskData.dueDate || !taskData.priority) {
            throw new Error('Missing required task data');
        }
        
        // Create new task with ID
        const newTask = {
            id: Date.now().toString(),
            title: taskData.title,
            description: taskData.description || '',
            dueDate: taskData.dueDate,
            priority: taskData.priority,
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add task to storage
        const tasks = this.getTasks(userId);
        tasks.push(newTask);
        localStorage.setItem(`taskmaster_tasks_${userId}`, JSON.stringify(tasks));
        
        return newTask;
    }
    
    /**
     * Update task data
     * @param {string} userId - User ID
     * @param {string} taskId - Task ID
     * @param {Object} taskData - Task data to update
     * @returns {Object} Updated task object
     */
    updateTask(userId, taskId, taskData) {
        const tasks = this.getTasks(userId);
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }
        
        // Update task data
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...taskData,
            updatedAt: Date.now()
        };
        
        // If setting completed status, update completedAt timestamp
        if (taskData.completed !== undefined) {
            if (taskData.completed) {
                tasks[taskIndex].completedAt = Date.now();
            } else {
                delete tasks[taskIndex].completedAt;
            }
        }
        
        localStorage.setItem(`taskmaster_tasks_${userId}`, JSON.stringify(tasks));
        
        return tasks[taskIndex];
    }
    
    /**
     * Delete a task
     * @param {string} userId - User ID
     * @param {string} taskId - Task ID
     * @returns {boolean} Success status
     */
    deleteTask(userId, taskId) {
        const tasks = this.getTasks(userId);
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            throw new Error('Task not found');
        }
        
        localStorage.setItem(`taskmaster_tasks_${userId}`, JSON.stringify(filteredTasks));
        
        return true;
    }
    
    /**
     * Get task statistics for a user
     * @param {string} userId - User ID
     * @returns {Object} Task statistics
     */
    getTaskStatistics(userId) {
        const tasks = this.getTasks(userId);
        const today = new Date().setHours(0, 0, 0, 0);
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const inProgressTasks = tasks.filter(t => !t.completed).length;
        const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;
        
        // Calculate completion rate
        const completionRate = totalTasks > 0 
            ? Math.round((completedTasks / totalTasks) * 100) 
            : 0;
        
        // Calculate priority stats
        const highPriorityTasks = tasks.filter(t => t.priority === 'high');
        const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
        const lowPriorityTasks = tasks.filter(t => t.priority === 'low');
        
        const highCompletionRate = highPriorityTasks.length > 0 
            ? Math.round((highPriorityTasks.filter(t => t.completed).length / highPriorityTasks.length) * 100) 
            : 0;
        const mediumCompletionRate = mediumPriorityTasks.length > 0 
            ? Math.round((mediumPriorityTasks.filter(t => t.completed).length / mediumPriorityTasks.length) * 100) 
            : 0;
        const lowCompletionRate = lowPriorityTasks.length > 0 
            ? Math.round((lowPriorityTasks.filter(t => t.completed).length / lowPriorityTasks.length) * 100) 
            : 0;
        
        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            completionRate,
            priorityStats: {
                high: {
                    total: highPriorityTasks.length,
                    completed: highPriorityTasks.filter(t => t.completed).length,
                    completionRate: highCompletionRate
                },
                medium: {
                    total: mediumPriorityTasks.length,
                    completed: mediumPriorityTasks.filter(t => t.completed).length,
                    completionRate: mediumCompletionRate
                },
                low: {
                    total: lowPriorityTasks.length,
                    completed: lowPriorityTasks.filter(t => t.completed).length,
                    completionRate: lowCompletionRate
                }
            }
        };
    }
    
    /**
     * Get task activity data for charts
     * @param {string} userId - User ID
     * @param {string} timeFrame - Time frame: 'week', 'month', or 'year'
     * @returns {Object} Task activity data
     */
    getTaskActivityData(userId, timeFrame = 'week') {
        const tasks = this.getTasks(userId);
        const today = new Date();
        let startDate, dateFormat, dateStep;
        
        // Determine start date and date format based on filter
        switch (timeFrame) {
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
            default:
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                dateFormat = { month: 'short', day: 'numeric' };
                dateStep = { days: 1 };
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
                tasks,
                'createdAt',
                currentDate,
                incrementDate(currentDate, dateStep)
            );
            createdData.push(createdTasks);
            
            // Count tasks completed on this date
            const completedTasks = this.countTasksInDateRange(
                tasks.filter(t => t.completed),
                'completedAt',
                currentDate,
                incrementDate(currentDate, dateStep)
            );
            completedData.push(completedTasks);
            
            // Move to next date
            currentDate = incrementDate(currentDate, dateStep);
        }
        
        return {
            labels,
            datasets: [
                {
                    label: 'Created Tasks',
                    data: createdData
                },
                {
                    label: 'Completed Tasks',
                    data: completedData
                }
            ]
        };
    }
    
    /**
     * Count tasks in a specific date range
     * @param {Array} tasks - Array of tasks
     * @param {string} dateField - Date field to check
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Number of tasks in range
     */
    countTasksInDateRange(tasks, dateField, startDate, endDate) {
        return tasks.filter(task => {
            const taskDate = new Date(task[dateField]);
            return taskDate >= startDate && taskDate < endDate;
        }).length;
    }
    
    /**
     * Search tasks for a user
     * @param {string} userId - User ID
     * @param {string} searchTerm - Search term
     * @returns {Array} Filtered tasks
     */
    searchTasks(userId, searchTerm) {
        if (!searchTerm) {
            return this.getTasks(userId);
        }
        
        const term = searchTerm.toLowerCase();
        const tasks = this.getTasks(userId);
        
        return tasks.filter(task => 
            task.title.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term))
        );
    }
    
    /**
     * Export user data including tasks
     * @param {string} userId - User ID
     * @returns {Object} User data with tasks
     */
    exportUserData(userId) {
        const user = this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const { password, ...userWithoutPassword } = user;
        const tasks = this.getTasks(userId);
        
        return {
            user: userWithoutPassword,
            tasks
        };
    }
    
    /**
     * Import user data including tasks
     * @param {Object} userData - User data with tasks
     * @returns {Object} Imported user data
     */
    importUserData(userData) {
        if (!userData.user || !userData.user.email || !Array.isArray(userData.tasks)) {
            throw new Error('Invalid import data format');
        }
        
        // Check if user exists
        let user = this.getUserByEmail(userData.user.email);
        
        if (user) {
            // Update existing user
            user = this.updateUser(user.id, userData.user);
        } else {
            // Create new user
            user = this.createUser({
                name: userData.user.name,
                email: userData.user.email,
                password: userData.user.password || 'imported123' // Default password if not provided
            });
        }
        
        // Import tasks
        localStorage.setItem(`taskmaster_tasks_${user.id}`, JSON.stringify(userData.tasks || []));
        
        return {
            user,
            tasksCount: userData.tasks.length
        };
    }
    
    /**
     * Clear all user data (for testing/development purposes)
     */
    clearAllData() {
        // Get all keys in localStorage
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('taskmaster_')) {
                keys.push(key);
            }
        }
        
        // Remove all taskmaster-related keys
        keys.forEach(key => localStorage.removeItem(key));
        
        // Re-initialize storage
        this.initializeStorage();
    }
}

// Initialize the API service when script is loaded
window.taskMasterAPI = new TaskMasterAPI();