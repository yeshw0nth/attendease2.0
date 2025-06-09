// Get DOM elements
const percentageEl = document.getElementById('percentage');
const attendedCountEl = document.getElementById('attended-count');
const absentCountEl = document.getElementById('absent-count');
const heldCountEl = document.getElementById('held-count');
const guidanceMessageEl = document.getElementById('guidance-message');
const presentBtn = document.getElementById('present-btn');
const absentBtn = document.getElementById('absent-btn');
const resetBtn = document.getElementById('reset-btn');
const percentageCircle = document.querySelector('.percentage-circle .circle');
const clickFeedbackEl = document.getElementById('click-feedback');
const targetPercentageInput = document.getElementById('target-percentage'); // New element

// Configuration & State variables
let attended = 0;
let absent = 0;
let targetPercentage = 75; // Default value

// --- Local Storage ---
const STORAGE_KEY = 'attendEaseData'; // Updated storage key

// --- Attendance History for Streak Logic ---
let attendanceHistory = [];

function saveState() {
    const data = {
        attended: attended,
        absent: absent,
        targetPercentage: targetPercentage,
        attendanceHistory: attendanceHistory // Save history
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (dataString) {
        try {
            const data = JSON.parse(dataString);
            attended = data.attended || 0;
            absent = data.absent || 0;
            targetPercentage = data.targetPercentage >= 0 && data.targetPercentage <= 100
                                ? data.targetPercentage
                                : 75;
            attendanceHistory = Array.isArray(data.attendanceHistory) ? data.attendanceHistory : [];
        } catch (e) {
            console.error("Error loading state from localStorage:", e);
            resetState();
        }
    } else {
        saveState();
    }
}

function resetState() {
    attended = 0;
    absent = 0;
    targetPercentage = 75;
    attendanceHistory = [];
    saveState();
    updateDisplay();
}

// --- Calculations & Display Update ---
function updateDisplay() {
    const held = attended + absent;
    const percentage = held === 0 ? 0 : (attended / held) * 100;
    const targetPercentageDecimal = targetPercentage / 100;

    // Animate number changes for counts
    animateNumberChange(attendedCountEl, attended);
    animateNumberChange(absentCountEl, absent);
    animateNumberChange(heldCountEl, held);

    // Update target percentage input value
    targetPercentageInput.value = targetPercentage;

    // Update percentage text
    percentageEl.textContent = `${percentage.toFixed(1)}%`; // Show one decimal place

    // --- Progress Bar ---
    const progressBar = document.getElementById('progress-bar-inner');
    const progressTarget = document.getElementById('progress-bar-target');
    const barOuter = document.querySelector('.progress-bar-outer');
    if (progressBar && barOuter) {
        progressBar.style.width = `${percentage}%`;
        // Set color based on percentage
        let color = '#48bb78'; // green
        if (percentage < 60) color = '#f56565'; // red
        else if (percentage < 75) color = '#f6e05e'; // yellow
        progressBar.style.setProperty('--progress-bar-color', color);
    }
    if (progressTarget && barOuter) {
        // Move target marker
        const barWidth = barOuter.offsetWidth;
        let targetLeft = (targetPercentage / 100) * barWidth;
        // Clamp to bar edges
        targetLeft = Math.max(7, Math.min(barWidth - 7, targetLeft));
        progressTarget.style.left = `${targetLeft}px`;
        progressTarget.setAttribute('data-tooltip', `Target: ${targetPercentage}%`);
    }

    // Update guidance message
    let guidanceMessage = '';
    if (held === 0) {
        guidanceMessage = `Log your first class to see insights based on a ${targetPercentage}% target.`;
    } else if (percentage >= targetPercentage) {
        const maxBunk = Math.floor((attended / targetPercentageDecimal) - held);
        if (maxBunk >= 1) {
            guidanceMessage = `You can bunk up to <strong>${maxBunk}</strong> more class${maxBunk > 1 ? 'es' : ''} and stay above ${targetPercentage}%. Keep it up!`;
        } else if (percentage === targetPercentage) {
             guidanceMessage = `You are exactly at ${targetPercentage}%. Be careful, any absence will drop you below!`;
        }
        else {
             guidanceMessage = `You are currently above ${targetPercentage}%. Good! But be cautious, you might drop below with just one more absence.`;
        }
    } else {
        const neededToAttend = Math.ceil((targetPercentageDecimal * held - attended) / (1 - targetPercentageDecimal));
        if (neededToAttend > 0) {
             guidanceMessage = `You need to attend at least <strong>${neededToAttend}</strong> more class${neededToAttend > 1 ? 'es' : ''} (without further absences) to reach ${targetPercentage}%. Focus!`;
        } else {
             guidanceMessage = `Current percentage is below ${targetPercentage}%. Attend more classes!`;
        }
    }
    guidanceMessageEl.innerHTML = guidanceMessage; // Use innerHTML for strong tag
    saveState(); // Save state after every update
    // Always update streak display
    updateStreakDisplay();
}

// --- Animations & Feedback ---

// Function to animate number change
function animateNumberChange(element, newValue) {
    // Convert newValue to string for comparison, handle potential null/undefined initial state
    const currentText = element.textContent;
    const currentValue = parseInt(currentText, 10); // Use parseInt for comparison

    if (currentValue === newValue && currentText !== '--') return; // No change (and not initial state), no animation

    element.classList.add('animate-change');
    element.textContent = newValue; // Update immediately for visual feedback

    // Remove class after animation ends
    element.addEventListener('animationend', () => {
        element.classList.remove('animate-change');
    }, { once: true });
}

// Function to show click feedback message
function showClickFeedback(message) {
    // Clear existing timeout if any
    if (clickFeedbackEl.timeoutId) {
        clearTimeout(clickFeedbackEl.timeoutId);
        clickFeedbackEl.classList.remove('show'); // Hide immediately before showing new one
        // A small delay might be needed here if hiding is animated
         void clickFeedbackEl.offsetWidth; // Trigger reflow to restart animation if needed
    }


    clickFeedbackEl.textContent = message;
    clickFeedbackEl.classList.add('show');

    // Hide after a few seconds
    clickFeedbackEl.timeoutId = setTimeout(() => {
        clickFeedbackEl.classList.remove('show');
    }, 2500); // Show for 2.5 seconds
}

// Function to add button click animation class
function addButtonAnimation(button) {
    button.classList.add('clicked');
    button.addEventListener('animationend', () => {
        button.classList.remove('clicked');
    }, { once: true });
}

// --- Patch all attendance actions to update history ---
function addAttendance(type) {
    if (type === 'present') {
    attended++;
        attendanceHistory.push('P');
    } else if (type === 'absent') {
        absent++;
        attendanceHistory.push('A');
    }
    updateDisplay();
}
function removeAttendance(type) {
    if (type === 'present' && attended > 0) {
        attended--;
        // Remove last present from history
        for (let i = attendanceHistory.length - 1; i >= 0; i--) {
            if (attendanceHistory[i] === 'P') {
                attendanceHistory.splice(i, 1);
                break;
            }
        }
    } else if (type === 'absent' && absent > 0) {
        absent--;
        // Remove last absent from history
        for (let i = attendanceHistory.length - 1; i >= 0; i--) {
            if (attendanceHistory[i] === 'A') {
                attendanceHistory.splice(i, 1);
                break;
            }
        }
    }
    updateDisplay();
}

presentBtn.addEventListener('click', () => {
    addAttendance('present');
    addButtonAnimation(presentBtn);
    showClickFeedback('✅ Marked Present!');
});
absentBtn.addEventListener('click', () => {
    addAttendance('absent');
    addButtonAnimation(absentBtn);
    showClickFeedback('❌ Marked Absent!');
});

resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all your attendance data? This cannot be undone.')) {
        resetState(); // Use the new resetState function
        showClickFeedback('🔄 Attendance data reset.');
        addButtonAnimation(resetBtn);
    }
});

// Listen for changes on the target percentage input
targetPercentageInput.addEventListener('change', (event) => {
    let value = parseInt(event.target.value, 10);
    // Validate input: ensure it's a number between 0 and 100
    if (isNaN(value) || value < 0) {
        value = 0;
    } else if (value > 100) {
        value = 100;
    }
    targetPercentage = value;
    targetPercentageInput.value = targetPercentage; // Update input value to the validated number
    updateDisplay(); // Recalculate and update UI based on new target
    showClickFeedback(`🎯 Target set to ${targetPercentage}%.`);
});

targetPercentageInput.addEventListener('input', (event) => {
    // Optional: provide immediate feedback if value is out of bounds while typing
    const value = parseInt(event.target.value, 10);
     if (!isNaN(value) && (value < 0 || value > 100)) {
         // Could display a temporary warning next to the input
     }
     // Note: 'change' event is used for the main logic as it fires after the user finishes input.
});

// --- Inline Plus/Minus Attendance Controls ---
const attendedMinusBtn = document.getElementById('attended-minus');
const attendedPlusBtn = document.getElementById('attended-plus');
const absentMinusBtn = document.getElementById('absent-minus');
const absentPlusBtn = document.getElementById('absent-plus');

if (attendedMinusBtn) {
  attendedMinusBtn.addEventListener('click', () => {
    removeAttendance('present');
    showToast('➖ Present count decreased');
  });
}
if (attendedPlusBtn) {
  attendedPlusBtn.addEventListener('click', () => {
    addAttendance('present');
    showToast('➕ Present count increased');
  });
}
if (absentMinusBtn) {
  absentMinusBtn.addEventListener('click', () => {
    removeAttendance('absent');
    showToast('➖ Absent count decreased');
  });
}
if (absentPlusBtn) {
  absentPlusBtn.addEventListener('click', () => {
    addAttendance('absent');
    showToast('➕ Absent count increased');
  });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateDisplay();

    function getMobileElements() {
        return {
            mobilePresentBtn: document.getElementById('mobile-present-btn'),
            mobileAbsentBtn: document.getElementById('mobile-absent-btn'),
        };
    }

    let lastAction = null;
    let actionLock = false;

    function vibrate(ms = 30) {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(ms);
        }
    }

    function showUndoToast(type) {
        const undoMsg = type === 'present' ? '✅ Marked Present!' : '❌ Marked Absent!';
        showToast(
            `${undoMsg} <button class=\"undo-btn\" id=\"undo-btn\" aria-label=\"Undo last action\">Undo</button>`,
            3500
        );
        setTimeout(() => {
            const undoBtn = document.getElementById('undo-btn');
            if (undoBtn) {
                undoBtn.onclick = () => {
                    if (lastAction === 'present' && attended > 0) attended--;
                    if (lastAction === 'absent' && absent > 0) absent--;
                    updateDisplay();
                    showToast('⏪ Action undone!', 1500);
                    vibrate(15);
                    lastAction = null;
                };
            }
        }, 100);
    }

    function handleMobileAction(type) {
        const { mobilePresentBtn, mobileAbsentBtn } = getMobileElements();
        if (actionLock) return;
        actionLock = true;
        setTimeout(() => { actionLock = false; }, 500);
        if (type === 'present') {
            attended++;
            lastAction = 'present';
        } else if (type === 'absent') {
            absent++;
            lastAction = 'absent';
        }
        updateDisplay();
        addButtonAnimation(type === 'present' ? mobilePresentBtn : mobileAbsentBtn);
        vibrate(30);
        showUndoToast(type);
    }

    function attachMobileListeners() {
        const { mobilePresentBtn, mobileAbsentBtn } = getMobileElements();
        if (!mobilePresentBtn || !mobileAbsentBtn) {
            console.warn('Mobile action bar elements not found.');
            return;
        }
        // Remove previous listeners by cloning
        const newPresent = mobilePresentBtn.cloneNode(true);
        const newAbsent = mobileAbsentBtn.cloneNode(true);
        mobilePresentBtn.parentNode.replaceChild(newPresent, mobilePresentBtn);
        mobileAbsentBtn.parentNode.replaceChild(newAbsent, mobileAbsentBtn);
        newPresent.addEventListener('click', () => handleMobileAction('present'));
        newAbsent.addEventListener('click', () => handleMobileAction('absent'));
    }

    // Attach listeners on load
    attachMobileListeners();

    // Sync listeners on every display update
    const origUpdateDisplay = updateDisplay;
    updateDisplay = function() {
        origUpdateDisplay.apply(this, arguments);
        attachMobileListeners();
        updateStreakDisplay();
    };

    // Add style for undo button
    const style = document.createElement('style');
    style.innerHTML = `
      .undo-btn { background: none; border: none; color: #5a67d8; font-weight: 700; font-size: 1em; margin-left: 0.7em; cursor: pointer; text-decoration: underline; border-radius: 4px; padding: 0 0.3em; }
      .undo-btn:active { color: #f56565; }
    `;
    document.head.appendChild(style);
});

// --- UI/UX ENHANCEMENTS ---
// Theme Toggle (devqa.io style)
const themeToggle = document.getElementById('theme-toggle');
const userThemePreference = localStorage.getItem('theme');
if (userThemePreference === 'dark') {
  document.body.classList.add('dark-theme');
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
  });
}

// Onboarding Modal
const onboardingModal = document.getElementById('onboarding-modal');
const helpBtn = document.getElementById('help-btn');
const closeOnboarding = document.getElementById('close-onboarding');
function showOnboarding() {
    if (onboardingModal) onboardingModal.style.display = 'flex';
}
function hideOnboarding() {
    if (onboardingModal) onboardingModal.style.display = 'none';
}
if (helpBtn) helpBtn.addEventListener('click', showOnboarding);
if (closeOnboarding) closeOnboarding.addEventListener('click', hideOnboarding);
// Show onboarding on first visit
if (!localStorage.getItem('attendEaseOnboarded')) {
    showOnboarding();
    localStorage.setItem('attendEaseOnboarded', '1');
}
// Toast Notification System
const toastContainer = document.getElementById('toast-container');
let toastTimeoutId = null;
function showToast(message, duration = 2500) {
    if (!toastContainer) return;
    // Remove any existing toasts before showing a new one
    while (toastContainer.firstChild) {
        toastContainer.removeChild(toastContainer.firstChild);
    }
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    toastTimeoutId = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
        toastTimeoutId = null;
    }, duration);
}
// Override showClickFeedback to use toast
function showClickFeedback(message) {
    showToast(message);
}

// --- PWA Install Prompt ---
let deferredPrompt = null;
const installBtn = document.getElementById('install-pwa-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
  // Hide by default if not available
  installBtn.style.display = 'none';
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('App will be installed!');
      } else {
        showToast('Install dismissed.');
      }
      deferredPrompt = null;
      installBtn.style.display = 'none';
    } else {
      showToast('App is already installed or not available for install.');
    }
  });
}

// --- Settings Modal Logic ---
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');

function openSettings() {
  if (settingsModal) {
    settingsModal.style.display = 'flex';
    // Focus the first input for accessibility
    const firstInput = settingsModal.querySelector('input, button');
    if (firstInput) firstInput.focus();
    document.body.style.overflow = 'hidden';
  }
}
function closeSettings() {
  if (settingsModal) {
    settingsModal.style.display = 'none';
    document.body.style.overflow = '';
    if (settingsBtn) settingsBtn.focus();
  }
}
if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
if (settingsModal) {
  settingsModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettings();
    // Trap focus inside modal
    if (e.key === 'Tab') {
      const focusable = settingsModal.querySelectorAll('input, button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

// --- Manual Edit Attendance Counts ---
const editAttendedBtn = document.getElementById('edit-attended-btn');
const editAbsentBtn = document.getElementById('edit-absent-btn');
const editCountModal = document.getElementById('edit-count-modal');
const editCountForm = document.getElementById('edit-count-form');
const editAttendedInput = document.getElementById('edit-attended-input');
const editAbsentInput = document.getElementById('edit-absent-input');
const cancelEditCountBtn = document.getElementById('cancel-edit-count');
let lastFocusedEditBtn = null;

function openEditCountModal(type) {
  if (!editCountModal) return;
  editCountModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (type === 'attended') {
    editAttendedInput.value = attended;
    editAttendedInput.focus();
    lastFocusedEditBtn = editAttendedBtn;
  } else if (type === 'absent') {
    editAbsentInput.value = absent;
    editAbsentInput.focus();
    lastFocusedEditBtn = editAbsentBtn;
  } else {
    editAttendedInput.value = attended;
    editAbsentInput.value = absent;
    editAttendedInput.focus();
    lastFocusedEditBtn = null;
  }
}
function closeEditCountModal() {
  if (!editCountModal) return;
  editCountModal.style.display = 'none';
  document.body.style.overflow = '';
  if (lastFocusedEditBtn) lastFocusedEditBtn.focus();
}
if (editAttendedBtn) {
  editAttendedBtn.addEventListener('click', () => openEditCountModal('attended'));
}
if (editAbsentBtn) {
  editAbsentBtn.addEventListener('click', () => openEditCountModal('absent'));
}
if (cancelEditCountBtn) {
  cancelEditCountBtn.addEventListener('click', closeEditCountModal);
}
if (editCountModal) {
  editCountModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditCountModal();
    // Trap focus inside modal
    if (e.key === 'Tab') {
      const focusable = editCountModal.querySelectorAll('input, button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
if (editCountForm) {
  editCountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let newAttended = parseInt(editAttendedInput.value, 10);
    let newAbsent = parseInt(editAbsentInput.value, 10);
    if (isNaN(newAttended) || newAttended < 0) newAttended = 0;
    if (isNaN(newAbsent) || newAbsent < 0) newAbsent = 0;
    attended = newAttended;
    absent = newAbsent;
    updateDisplay();
    showToast('✅ Attendance counts updated!');
    closeEditCountModal();
  });
}

// --- Improved Streak Logic ---
let lastStreak = 0;
function updateStreakDisplay() {
  const streakDisplay = document.getElementById('streak-display');
  if (!streakDisplay) return;
  // Calculate streak: count consecutive 'P' from end
  let streak = 0;
  for (let i = attendanceHistory.length - 1; i >= 0; i--) {
    if (attendanceHistory[i] === 'P') streak++;
    else break;
  }
  // Show streak only if streak >= 2
  if (streak >= 2) {
    const animate = streak > lastStreak;
    streakDisplay.innerHTML = `<span class='streak-emoji' role='img' aria-label='Lit' title='Consecutive Presents'>🔥</span>Streak: <span class='streak-count${animate ? ' streak-scroll' : ''}'>${streak}</span>`;
    streakDisplay.title = `🔥 ${streak} consecutive presents!`;
    // Show toast if streak increased
    if (animate) {
      showToast(`🔥 New streak: ${streak}!`);
      // Remove animation class after animation ends for next time
      const streakNum = streakDisplay.querySelector('.streak-count');
      if (streakNum) {
        streakNum.addEventListener('animationend', () => {
          streakNum.classList.remove('streak-scroll');
        }, { once: true });
      }
    }
  } else {
    streakDisplay.innerHTML = '';
    streakDisplay.title = '';
  }
  lastStreak = streak;
}
// --- Streak Animation ---
const style = document.createElement('style');
style.innerHTML = `@keyframes streak-pop { 0% { transform: scale(1.3); color: #ff9800; } 60% { transform: scale(0.95); } 100% { transform: scale(1); color: inherit; } }`;
document.head.appendChild(style);
