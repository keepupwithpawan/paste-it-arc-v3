// DOM elements
const addBtn = document.getElementById('addBtn');
const todoBtn = document.getElementById('todoBtn');
const notesContainer = document.getElementById('notesContainer');
const modeToggle = document.getElementById('modeToggle');

// Initialize notes from storage when popup opens
document.addEventListener('DOMContentLoaded', initializeNotes);

// Button event listeners
addBtn.addEventListener('click', createTextNote);
todoBtn.addEventListener('click', createTodoNote);
modeToggle.addEventListener('click', toggleMode);

// Handle drag and drop for the entire document
document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleDrop);

// Initialize mode from storage
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('mode', (data) => {
    const mode = data.mode || 'light';
    document.body.className = mode;
    updateModeIcon(mode);
  });
});

/**
 * Initialize notes from Chrome storage
 */
function initializeNotes() {
  chrome.storage.local.get('notes', function(data) {
    const notes = data.notes || [];
    notes.forEach(note => {
      if (note.type === 'text') {
        createTextNote(null, note.content);
      } else if (note.type === 'todo') {
        createTodoNote(null, note.items);
      }
    });
  });
}

/**
 * Save all notes to Chrome storage
 */
function saveNotes() {
  const notesElements = document.querySelectorAll('.note');
  const notes = [];

  notesElements.forEach(noteEl => {
    if (noteEl.classList.contains('todo-note')) {
      // Save todo note
      const items = [];
      const todoItems = noteEl.querySelectorAll('.todo-item');
      todoItems.forEach(item => {
        const checkbox = item.querySelector('.todo-checkbox');
        const label = item.querySelector('.todo-label');
        items.push({
          text: label.textContent,
          checked: checkbox.checked
        });
      });
      notes.push({
        type: 'todo',
        items: items
      });
    } else {
      // Save text note
      const content = noteEl.querySelector('.note-content').innerHTML;
      notes.push({
        type: 'text',
        content: content
      });
    }
  });

  chrome.storage.local.set({ 'notes': notes });
}

/**
 * Create a new text note
 * @param {Event} event - The triggering event (can be null)
 * @param {String} content - Optional content to pre-fill (default empty)
 */
function createTextNote(event, content = '') {
  const note = document.createElement('div');
  note.className = 'note';

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-note';
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', function() {
    note.remove();
    saveNotes();
  });

  // Create editable content
  const noteContent = document.createElement('div');
  noteContent.className = 'note-content';
  noteContent.contentEditable = true;
  noteContent.innerHTML = content;
  noteContent.addEventListener('input', handleNoteInput);
  noteContent.addEventListener('blur', saveNotes);

  // Setup drag and drop for this note
  noteContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    noteContent.classList.add('drag-over');
  });

  noteContent.addEventListener('dragleave', () => {
    noteContent.classList.remove('drag-over');
  });

  noteContent.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    noteContent.classList.remove('drag-over');
    handleImageDrop(e, noteContent);
  });

  // Add elements to note
  note.appendChild(deleteBtn);
  note.appendChild(noteContent);

  // Add note to container
  notesContainer.appendChild(note);
  noteContent.focus();

  // Save to storage
  saveNotes();
  return note; // Return note for use in drag-and-drop fallback
}

/**
 * Handle note input changes, check for commands
 * @param {Event} e - Input event
 */
function handleNoteInput(e) {
  const content = e.target.textContent;

  // Check for /check command
  if (content.includes('/check')) {
    const noteElement = e.target.closest('.note');
    const text = content.replace('/check', '').trim();

    // Remove the current note
    noteElement.remove();

    // Create a todo note with the text as first item
    createTodoNote(null, [{ text: text, checked: false }]);
  }
}

/**
 * Create a new to-do list note
 * @param {Event} event - The triggering event (can be null)
 * @param {Array} items - Optional items to pre-fill
 */
function createTodoNote(event, items = null) {
  const note = document.createElement('div');
  note.className = 'note todo-note';

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-note';
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', function() {
    note.remove();
    saveNotes();
  });

  // Create to-do list
  const todoList = document.createElement('ul');
  todoList.className = 'todo-list';

  // Add elements to note
  note.appendChild(deleteBtn);
  note.appendChild(todoList);

  // Add note to container
  notesContainer.appendChild(note);

  // Add initial items or one empty item
  if (items && items.length > 0) {
    items.forEach(item => {
      addTodoItem(todoList, item.text, item.checked);
    });
  } else {
    addTodoItem(todoList);
  }

  // Save to storage
  saveNotes();
}

/**
 * Add a todo item to a todo list
 * @param {HTMLElement} todoList - The todo list element
 * @param {String} text - Optional text (default empty)
 * @param {Boolean} checked - Whether item is checked (default false)
 */
function addTodoItem(todoList, text = '', checked = false) {
  const todoItem = document.createElement('li');
  todoItem.className = 'todo-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = checked;

  const label = document.createElement('div');
  label.className = 'todo-label';
  label.contentEditable = true;
  label.textContent = text;

  if (checked) {
    label.classList.add('todo-checked');
  }

  // Event listeners
  checkbox.addEventListener('change', function() {
    if (this.checked) {
      label.classList.add('todo-checked');
    } else {
      label.classList.remove('todo-checked');
    }

    // Check if all items are checked
    checkAllCompleted(todoList.closest('.todo-note'));
    saveNotes();
  });

  label.addEventListener('blur', saveNotes);

  // Add Enter key listener to create new todo item
  label.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodoItem(todoList);
      saveNotes();
    }
  });

  // Add to todo item
  todoItem.appendChild(checkbox);
  todoItem.appendChild(label);

  // Add to list
  todoList.appendChild(todoItem);

  // Focus the label
  label.focus();
}

/**
 * Check if all todo items are completed
 * @param {HTMLElement} noteElement - The todo note element
 */
function checkAllCompleted(noteElement) {
  const checkboxes = noteElement.querySelectorAll('.todo-checkbox');
  const allCompleted = Array.from(checkboxes).every(box => box.checked);

  if (allCompleted && checkboxes.length > 0) {
    // Animate and delete the note
    noteElement.style.opacity = '0';
    noteElement.style.transform = 'translateX(100%)';

    setTimeout(() => {
      noteElement.remove();
      saveNotes();
    }, 300);
  }
}

/**
 * Handle drag over for image dropping
 * @param {Event} e - Drag event
 */
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy'; // Indicate a copy operation
}

/**
 * Handle drop for images on the document
 * @param {Event} e - Drop event
 */
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  // If not dropped on a specific note, create a new note for the image
  let targetNoteContent = e.target.closest('.note-content');
  if (!targetNoteContent) {
    const note = createTextNote(null, '');
    targetNoteContent = note.querySelector('.note-content');
  }

  // Process the dropped files
  handleImageDrop(e, targetNoteContent);
}

/**
 * Process dropped image and add to note content
 * @param {Event} e - Drop event
 * @param {HTMLElement} noteContent - The note content element
 */
function handleImageDrop(e, noteContent) {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer.files; // Use files directly for simplicity
  if (!files || files.length === 0) {
    console.error('No files found in drop event');
    return;
  }

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) { // Robust image check
      processImage(file, noteContent);
    } else {
      console.warn('Dropped file is not an image:', file.type);
    }
  });
}

/**
 * Process image file and add to note content
 * @param {File} file - The image file
 * @param {HTMLElement} noteContent - The note content element
 */
function processImage(file, noteContent) {
  const reader = new FileReader();

  reader.onload = function(e) {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = 'Dropped image';
    img.style.maxWidth = '100%'; // Ensure image fits container
    noteContent.appendChild(img);
    saveNotes(); // Save after adding the image
  };

  reader.onerror = function() {
    console.error('Failed to read image file:', file.name);
  };

  reader.readAsDataURL(file); // Convert to base64 for display
}

/**
 * Toggle between light and dark mode
 */
function toggleMode() {
  const currentMode = document.body.classList.contains('dark') ? 'dark' : 'light';
  const newMode = currentMode === 'light' ? 'dark' : 'light';

  document.body.className = newMode;
  updateModeIcon(newMode);

  chrome.storage.local.set({ 'mode': newMode });
}

/**
 * Update mode toggle icon
 * @param {string} mode - Current mode ('light' or 'dark')
 */
function updateModeIcon(mode) {
  modeToggle.textContent = mode === 'light' ? '☼' : '☾'; // Sun for light, Moon for dark
}