document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const generateBtn = document.getElementById('generate-btn');
    const loadBtn = document.getElementById('load-btn');
    const saveBtn = document.getElementById('save-btn');
    const backBtn = document.getElementById('back-btn');
    const subjectInput = document.getElementById('subject');
    const scoreInput = document.getElementById('score');
    const subjectsList = document.getElementById('subjects-list');
    const scheduleContainer = document.getElementById('schedule-container');
    const motivationMessage = document.getElementById('motivation-message');

    // State
    let subjects = [];
    let schedule = [];

    // Motivational messages
    const motivationalMessages = [
        "Don't worry about your scores. With consistent effort, you'll improve!",
        "Every expert was once a beginner. Keep going!",
        "Your dedication today will pay off tomorrow.",
        "Small progress is still progress. Keep it up!",
        "The difference between success and failure is persistence."
    ];

    // Set random motivational message
    motivationMessage.textContent = getRandomMotivationalMessage();

    // Tab functionality
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const tabId = trigger.getAttribute('data-tab');
            
            // Update active tab trigger
            tabTriggers.forEach(t => t.classList.remove('active'));
            trigger.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active'); // FIXED HERE
        });
    });

    // Add subject
    addSubjectBtn.addEventListener('click', () => {
        const subjectName = subjectInput.value.trim();
        const subjectScore = parseInt(scoreInput.value);
        
        if (subjectName && !isNaN(subjectScore) && subjectScore >= 0 && subjectScore <= 100) {
            subjects.push({ name: subjectName, score: subjectScore });
            subjectInput.value = '';
            scoreInput.value = '';
            updateSubjectsList();
            updateGenerateButton();
        } else {
            alert('Please enter a valid subject name and score (0-100).');
        }
    });

    // Generate schedule
    generateBtn.addEventListener('click', generateSchedule);

    // Save schedule
    saveBtn.addEventListener('click', () => {
        const data = {
            subjects,
            schedule,
            date: new Date().toISOString()
        };
        localStorage.setItem('goalTrackerData', JSON.stringify(data));
        alert('Schedule saved successfully!');
    });

    // Load schedule
    loadBtn.addEventListener('click', () => {
        const savedData = localStorage.getItem('goalTrackerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            subjects = data.subjects;
            schedule = data.schedule;
            updateSubjectsList();
            updateScheduleDisplay();
            updateGenerateButton();
            updateSaveButton();
            
            // Switch to schedule tab
            tabTriggers[1].click();
        } else {
            alert('No saved schedule found.');
        }
    });

    // Back to subjects
    backBtn.addEventListener('click', () => {
        tabTriggers[0].click();
    });

    // Helper functions
    function updateSubjectsList() {
        if (subjects.length === 0) {
            subjectsList.innerHTML = '<p class="empty-message">No subjects added yet.</p>';
            return;
        }
        
        subjectsList.innerHTML = '';
        subjects.forEach((subject, index) => {
            const subjectItem = document.createElement('div');
            subjectItem.className = 'subject-item';
            
            const badgeClass = subject.score < 60 ? 'badge-destructive' : 
                              subject.score < 80 ? 'badge-outline' : 'badge-default';
            
            subjectItem.innerHTML = `
                <div class="subject-name">${subject.name}</div>
                <div class="badge ${badgeClass}">Score: ${subject.score}</div>
            `;
            
            subjectsList.appendChild(subjectItem);
        });
    }

    function updateGenerateButton() {
        generateBtn.disabled = subjects.length === 0;
    }

    function updateSaveButton() {
        saveBtn.disabled = schedule.length === 0;
    }

    function generateSchedule() {
        if (subjects.length === 0) return;

        // Sort subjects by score (lowest first)
        const sortedSubjects = [...subjects].sort((a, b) => a.score - b.score);
        
        // Initialize schedule
        schedule = [];
        let currentTime = new Date();
        currentTime.setHours(17, 30, 0); // 5:30 PM
        
        let remainingMinutes = 270; // 4.5 hours (5:30 PM to 10:00 PM)
        let subjectIndex = 0;
        const totalSubjects = sortedSubjects.length;

        while (remainingMinutes > 0 && subjectIndex < totalSubjects) {
            const subject = sortedSubjects[subjectIndex];
            
            const scoreFactor = (100 - subject.score) / 100;
            let studyDuration = Math.max(30, Math.min(45, Math.round(45 * scoreFactor)));

            studyDuration = Math.min(studyDuration, remainingMinutes);

            schedule.push({
                time: formatTime(currentTime),
                activity: `Study ${subject.name}`,
                duration: studyDuration,
                isBreak: false
            });

            currentTime = new Date(currentTime.getTime() + studyDuration * 60000);
            remainingMinutes -= studyDuration;

            if (remainingMinutes >= 15 && (subjectIndex < totalSubjects - 1 || remainingMinutes >= 45)) {
                schedule.push({
                    time: formatTime(currentTime),
                    activity: 'Break / Rest',
                    duration: 15,
                    isBreak: true
                });

                currentTime = new Date(currentTime.getTime() + 15 * 60000);
                remainingMinutes -= 15;
            }

            subjectIndex++;
            if (subjectIndex >= totalSubjects && remainingMinutes >= 30) {
                subjectIndex = 0;
            }
        }
        
        updateScheduleDisplay();
        updateSaveButton();
        tabTriggers[1].click();
    }

    function updateScheduleDisplay() {
        if (schedule.length === 0) {
            scheduleContainer.innerHTML = `<p>No schedule generated yet. Add subjects and generate a schedule first.</p>`;
            return;
        }
        
        scheduleContainer.innerHTML = '';

        schedule.forEach((item, index) => {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';

            scheduleItem.innerHTML = `
                <span class="schedule-time">${item.time}</span>
                <div class="badge ${item.isBreak ? 'badge-outline' : 'badge-secondary'}">
                    ${item.duration} min
                </div>
                <p class="schedule-activity ${item.isBreak ? 'break' : ''}">
                    ${item.activity}
                </p>
            `;
            
            scheduleContainer.appendChild(scheduleItem);
        });
    }

    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
    }

    function getRandomMotivationalMessage() {
        return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    }

    // Initialize
    updateSubjectsList();
    updateGenerateButton();
    updateSaveButton();
});
