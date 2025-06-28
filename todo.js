const taskInput = document.getElementById('taskInput');
const dueInput = document.getElementById('dueInput');
const priorityInput = document.getElementById('priorityInput');
const taskGroups = document.getElementById('taskGroups');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelector('.dark-toggle').innerText = next === 'dark' ? '☀️' : '🌙';
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('.dark-toggle').innerText = theme === 'dark' ? '☀️' : '🌙';
}

function getRelativeTime(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diff = Math.floor((now - past) / 1000);
  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ];
  for (let unit of units) {
    const value = Math.floor(diff / unit.seconds);
    if (value > 0) return `${value} ${unit.name}${value > 1 ? 's' : ''} ago`;
  }
  return "just now";
}

function getCountdown(dueDate) {
  if (!dueDate) return '';
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  if (diff <= 0) return `<span class="text-danger">⏰ Past due</span>`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `🕒 Due in ${days}d ${hours}h ${mins}m`;
}

function groupByDate(task) {
  if (!task.due) return "🛌 No Due Date";
  const today = new Date();
  const due = new Date(task.due);
  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "❌ Overdue";
  if (diff === 0) return "🗓 Today";
  if (diff === 1) return "📅 Tomorrow";
  return "📆 Future";
}

function priorityClass(priority) {
  switch(priority) {
    case 'high': return 'priority-high';
    case 'low': return 'priority-low';
    case 'medium':
    default: return 'priority-medium';
  }
}

function renderTasks(flashIndex = null) {
  const grouped = {};
  tasks.forEach(task => {
    const group = groupByDate(task);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(task);
  });

  taskGroups.innerHTML = '';

  for (const group in grouped) {
    const section = document.createElement('div');
    section.innerHTML = `<div class="group-header">${group}</div>`;

    const ul = document.createElement('ul');
    ul.className = 'list-group mb-3';

    grouped[group].forEach((task) => {
      const realIndex = tasks.indexOf(task);
      const badgeClass = priorityClass(task.priority);
      const li = document.createElement('li');
      li.className = `list-group-item d-flex justify-content-between align-items-start flex-column fade-in ${task.done ? 'task-done' : ''}`;
      li.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
          <div style="flex:1; display:flex; align-items:center; gap:0.5rem; cursor:pointer;" onclick="toggleTask(${realIndex})">
            <span class="badge badge-priority ${badgeClass}" title="Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}">
              ${task.priority.charAt(0).toUpperCase()}
            </span>
            <span>${task.text}</span>
          </div>
          <div class="d-flex align-items-center ms-2">
            <button class="icon-btn tooltip-container" onclick="editTask(${realIndex})" aria-label="Edit Task"><br>
            ✏️
              <span class="tooltip-text">Edit</span>
            </button>
            <button class="icon-btn tooltip-container" onclick="deleteTask(${realIndex})" aria-label="Delete Task">✖
              <svg viewBox="0 0 24 24"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-4.5l-1-1z"/></svg>
              <span class="tooltip-text">Delete</span>
            </button>
          </div>
        </div>
        <div class="text-muted timestamp mt-1">Created: ${getRelativeTime(task.timestamp)}</div>
        <div class="text-muted countdown">${getCountdown(task.due)}</div>
      `;
      if(realIndex === flashIndex){
        li.classList.add('task-flash');
        setTimeout(() => li.classList.remove('task-flash'), 900);
      }
      ul.appendChild(li);
    });

    section.appendChild(ul);
    taskGroups.appendChild(section);
  }

  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask() {
  const text = taskInput.value.trim();
  const dueDate = dueInput.value || null;
  const priority = priorityInput.value || 'medium';
  if (text !== '') {
    tasks.push({
      text,
      done: false,
      timestamp: new Date().toISOString(),
      due: dueDate,
      priority
    });
    taskInput.value = '';
    dueInput.value = '';
    priorityInput.value = 'medium';
    renderTasks();
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks(index);
}

function editTask(index) {
  // Edit text and priority prompt
  const newText = prompt("Edit task:", tasks[index].text);
  if (newText !== null && newText.trim() !== '') {
    tasks[index].text = newText.trim();

    const newPriority = prompt("Set priority (high, medium, low):", tasks[index].priority);
    if (newPriority !== null) {
      const p = newPriority.toLowerCase();
      if(['high','medium','low'].includes(p)){
        tasks[index].priority = p;
      }
    }
    renderTasks();
  }
}

applySavedTheme();
renderTasks();
setInterval(() => renderTasks(), 60000);