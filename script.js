// Game state
let gameState = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    player: JSON.parse(localStorage.getItem('player')) || {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        lastLogin: null,
        completedTasks: 0,
        achievements: {
            firstTask: false,
            threeStreak: false,
            tenTasks: false
        }
    }
};

// Save game state
function saveGameState() {
    localStorage.setItem('tasks', JSON.stringify(gameState.tasks));
    localStorage.setItem('player', JSON.stringify(gameState.player));
}

// Update player stats display
function updatePlayerStats() {
    // Make sure elements exist before updating them
    const playerLevelEl = document.getElementById('playerLevel');
    const xpProgressEl = document.getElementById('xpProgress');
    const xpTextEl = document.getElementById('xpText');
    const streakCountEl = document.getElementById('streakCount');
    
    if (playerLevelEl) playerLevelEl.textContent = gameState.player.level;
    
    // Update XP progress bar width based on current XP percentage
    if (xpProgressEl) {
        const xpPercentage = Math.min(100, Math.max(0, (gameState.player.xp / gameState.player.xpToNextLevel) * 100));
        xpProgressEl.style.width = `${xpPercentage}%`;
    }
    
    if (xpTextEl) xpTextEl.textContent = `XP: ${gameState.player.xp}/${gameState.player.xpToNextLevel}`;
    if (streakCountEl) streakCountEl.textContent = gameState.player.streak;
    
    // Update achievements
    const ach1El = document.getElementById('ach1');
    const ach2El = document.getElementById('ach2');
    const ach3El = document.getElementById('ach3');
    
    if (ach1El) ach1El.classList.toggle('locked', !gameState.player.achievements.firstTask);
    if (ach2El) ach2El.classList.toggle('locked', !gameState.player.achievements.threeStreak);
    if (ach3El) ach3El.classList.toggle('locked', !gameState.player.achievements.tenTasks);
}

// Add XP to player
function addXP(amount) {
    gameState.player.xp += amount;
    
    // Check for level up
    if (gameState.player.xp >= gameState.player.xpToNextLevel) {
        levelUp();
    }
    
    updatePlayerStats();
    saveGameState();
}

// Level up player
function levelUp() {
    gameState.player.level++;
    gameState.player.xp = gameState.player.xp - gameState.player.xpToNextLevel;
    gameState.player.xpToNextLevel = Math.floor(gameState.player.xpToNextLevel * 1.5);
    
    // Show level up modal
    document.getElementById('newLevel').textContent = gameState.player.level;
    document.getElementById('levelUpModal').style.display = 'flex';
    
    // Play level up sound
    playSound('levelUp');
}

// Close level up modal
function closeModal() {
    document.getElementById('levelUpModal').style.display = 'none';
}

// Play sound effect
function playSound(soundType) {
    // You can implement sound effects here
    console.log(`Playing sound: ${soundType}`);
}

// Check for streak
function checkStreak() {
    const today = new Date().toDateString();
    
    if (gameState.player.lastLogin) {
        const lastLogin = new Date(gameState.player.lastLogin);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin.toDateString() === yesterday.toDateString()) {
            gameState.player.streak++;
            
            // Check for streak achievement
            if (gameState.player.streak >= 3 && !gameState.player.achievements.threeStreak) {
                gameState.player.achievements.threeStreak = true;
                showAchievementNotification('3-Day Streak');
                addXP(50);
            }
        } else if (lastLogin.toDateString() !== today) {
            gameState.player.streak = 1;
        }
    } else {
        gameState.player.streak = 1;
    }
    
    gameState.player.lastLogin = today;
    saveGameState();
    updatePlayerStats();
}

// Show achievement notification
function showAchievementNotification(achievementName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div>
            <h3>Achievement Unlocked!</h3>
            <p>${achievementName}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }, 100);
    
    // Play achievement sound
    playSound('achievement');
}

// Add task
function addTask() {
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const desc = document.getElementById('desc').value;
    const difficulty = document.getElementById('difficulty').value;

    if (!title || !date || !time) {
        alert('Please fill all required fields');
        return;
    }

    // Get XP based on difficulty
    let xpValue = 20; // Default medium
    if (difficulty === 'easy') xpValue = 10;
    if (difficulty === 'hard') xpValue = 40;

    const newTask = { 
        id: Date.now(),
        title, 
        date, 
        time, 
        desc, 
        difficulty,
        xp: xpValue,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    gameState.tasks.push(newTask);
    saveGameState();
    
    // Check for first task achievement
    if (gameState.tasks.length === 1 && !gameState.player.achievements.firstTask) {
        gameState.player.achievements.firstTask = true;
        showAchievementNotification('First Quest');
        addXP(20);
    }
    
    // Clear form fields
    document.getElementById('title').value = '';
    document.getElementById('desc').value = '';
    
    // Update UI
    renderTasks();
    renderCalendar();
}

// Delete task
function deleteTask(index) {
    // Play sound
    playSound('deleteTask');
    
    // Add animation before removing
    const taskElement = document.querySelector(`[data-task-id="${gameState.tasks[index].id}"]`);
    if (taskElement) {
        taskElement.classList.add('deleting');
        setTimeout(() => {
            gameState.tasks.splice(index, 1);
            saveGameState();
            renderTasks();
            renderCalendar();
        }, 300);
    } else {
        gameState.tasks.splice(index, 1);
        saveGameState();
        renderTasks();
        renderCalendar();
    }
}

// Toggle task completion
function toggleCompletion(index) {
    const task = gameState.tasks[index];
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    
    if (task.completed && !wasCompleted) {
        // Task was just completed - add XP
        addXP(task.xp);
        gameState.player.completedTasks++;
        
        // Check for 10 tasks achievement
        if (gameState.player.completedTasks >= 10 && !gameState.player.achievements.tenTasks) {
            gameState.player.achievements.tenTasks = true;
            showAchievementNotification('Complete 10 Quests');
            addXP(100);
        }
        
        // Play completion sound
        playSound('completeTask');
    } else if (!task.completed && wasCompleted) {
        // Task was uncompleted - remove XP
        addXP(-task.xp);
        gameState.player.completedTasks--;
    }
    
    saveGameState();
    renderTasks();
    renderCalendar();
}

// Render a single task item
function renderTaskItem(task, index) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.difficulty} ${task.completed ? 'completed' : ''}`;
    taskDiv.dataset.taskId = task.id;
    
    taskDiv.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
               onchange="toggleCompletion(${index})">
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span><i class="fas fa-calendar-day"></i> ${task.date} at ${task.time}</span>
                <span class="task-difficulty ${task.difficulty}">${task.difficulty}</span>
            </div>
            ${task.desc ? `<div class="task-description">${task.desc}</div>` : ''}
        </div>
        <div class="task-actions">
            <button class="delete-btn" onclick="deleteTask(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    return taskDiv;
}

// Render all tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    if (gameState.tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No quests yet. Add your first quest!</div>';
        return;
    }
    
    gameState.tasks.forEach((task, index) => {
        const taskElement = renderTaskItem(task, index);
        taskList.appendChild(taskElement);
    });
}

// Render calendar
function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    // Clear existing calendar
    while (calendarEl.firstChild) {
        calendarEl.removeChild(calendarEl.firstChild);
    }
    
    // Map tasks to calendar events
    const events = gameState.tasks.map(task => {
        let color;
        if (task.completed) {
            color = '#4caf50'; // Green for completed
        } else {
            switch(task.difficulty) {
                case 'easy': color = '#4caf50'; break;
                case 'medium': color = '#ff9800'; break;
                case 'hard': color = '#f44336'; break;
                default: color = '#7e57c2';
            }
        }
        
        return {
            id: task.id,
            title: task.title,
            start: `${task.date}T${task.time}`,
            allDay: false,
            color: color,
            textColor: 'white',
            extendedProps: {
                description: task.desc,
                difficulty: task.difficulty,
                xp: task.xp
            }
        };
    });
    
    // Create calendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events,
        eventClick: function(info) {
            // Show task details when clicked
            alert(`${info.event.title}\n\nDifficulty: ${info.event.extendedProps.difficulty}\nXP: ${info.event.extendedProps.xp}\n\n${info.event.extendedProps.description || 'No description'}`);
        }
    });
    
    calendar.render();
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date();
    document.getElementById('date').valueAsDate = today;
    
    // Set default time
    document.getElementById('time').value = '12:00';
    
    // Check streak
    checkStreak();
    
    // Update player stats display
    updatePlayerStats();
    
    // Render tasks and calendar
    renderTasks();
    renderCalendar();
});