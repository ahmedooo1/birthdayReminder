/**
* Calendar functionality for Birthday Reminder App
*/
class Calendar {
    constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentDate = new Date();
    this.calendarElement = null;
    this.monthYearElement = null;
    }
    
    /**
    * Initialize the calendar
    */
    init() {
    this.calendarElement = document.getElementById('calendar');
    this.monthYearElement = document.getElementById('current-month');
    
    if (!this.calendarElement || !this.monthYearElement) {
    console.error("Calendar elements not found");
    return;
    }
    
    this.render();
    
    // Set up event listeners for navigation
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
    this.prevMonth();
    });
    }
    
    if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
    this.nextMonth();
    });
    }
    
    console.log("Calendar initialized");
    }
    
    /**
    * Render the calendar for the current month
    */
    render() {
    if (!this.calendarElement || !this.monthYearElement) {
    console.error("Calendar elements not found during render");
    return;
    }
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update the month/year display
    const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    this.monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear the calendar
    this.calendarElement.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    for (const dayName of dayNames) {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dayName;
    this.calendarElement.appendChild(dayHeader);
    }
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get the last day of the previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Get birthdays for this month
    const birthdays = this.dataManager.getBirthdaysByMonth(month, year);
    
    // Create a map of days with birthdays
    const birthdayMap = new Map();
    for (const birthday of birthdays) {
    const date = new Date(birthday.date);
    const day = date.getDate();
    
    if (!birthdayMap.has(day)) {
    birthdayMap.set(day, []);
    }
    birthdayMap.get(day).push(birthday);
    }
    
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const dayElement = this.createDayElement(day, 'other-month');
    this.calendarElement.appendChild(dayElement);
    }
    
    // Add days for current month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();
    
    for (let day = 1; day <= totalDays; day++) {
    const isToday = isCurrentMonth && day === currentDay;
    const hasBirthday = birthdayMap.has(day);
    
    const classes = [];
    if (isToday) classes.push('today');
    if (hasBirthday) classes.push('has-birthday');
    
    const dayElement = this.createDayElement(day, classes.join(' '));
    
    // Add click event to show birthdays for this day
    if (hasBirthday) {
    dayElement.addEventListener('click', () => {
    this.showBirthdaysForDay(day, month, year, birthdayMap.get(day));
    });
    }
    
    this.calendarElement.appendChild(dayElement);
    }
    
    // Calculate how many days from next month we need to add
    const totalCells = 42; // 6 rows of 7 days
    const remainingCells = totalCells - (startingDayOfWeek + totalDays);
    
    // Add days from next month
    for (let day = 1; day <= remainingCells; day++) {
    const dayElement = this.createDayElement(day, 'other-month');
    this.calendarElement.appendChild(dayElement);
    }
    }
    
    /**
    * Create a day element for the calendar
    * @param {number} day - Day number
    * @param {string} className - Additional class names
    * @returns {HTMLElement} Day element
    */
    createDayElement(day, className = '') {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;
    
    const dayNumber = document.createElement('span');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    
    dayElement.appendChild(dayNumber);
    return dayElement;
    }
    
    /**
    * Show birthdays for a specific day
    * @param {number} day - Day
    * @param {number} month - Month
    * @param {number} year - Year
    * @param {Array} birthdays - Birthdays on this day
    */
    showBirthdaysForDay(day, month, year, birthdays) {
    // Create a modal to show the birthdays
    const modalOverlay = document.getElementById('modal-overlay');
    const birthdayModal = document.getElementById('birthday-modal');
    const modalTitle = document.getElementById('birthday-modal-title');
    const modalBody = document.querySelector('#birthday-modal .modal-body');
    
    if (!modalOverlay || !birthdayModal || !modalTitle || !modalBody) {
    console.error("Modal elements not found");
    return;
    }
    
    // Format the date
    const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const formattedDate = `${day} ${monthNames[month]}`;
    
    // Set the modal title
    modalTitle.textContent = `Anniversaires du ${formattedDate}`;
    
    // Clear the modal body
    modalBody.innerHTML = '';
    
    // Create a list of birthdays
    const birthdaysList = document.createElement('div');
    birthdaysList.className = 'birthdays-list';
    
    for (const birthday of birthdays) {
    const birthdayDate = new Date(birthday.date);
    const age = this.dataManager.calculateAge(birthday.date);
    
    const birthdayCard = document.createElement('div');
    birthdayCard.className = 'birthday-card';
    
    // Get the group if available
    let groupName = '';
    if (birthday.groupId) {
    const group = this.dataManager.getGroupById(birthday.groupId);
    if (group) {
    groupName = group.name;
    }
    }
    
    birthdayCard.innerHTML = `
    <div class="birthday-card-header">
    <span class="birthday-card-name">${birthday.name}</span>
    <span class="birthday-card-date">${age} ans</span>
    </div>
    ${groupName ? `<span class="birthday-card-group">${groupName}</span>` : ''}
    ${birthday.notes ? `<p class="birthday-card-notes">${birthday.notes}</p>` : ''}
    `;
    
    birthdaysList.appendChild(birthdayCard);
    }
    
    modalBody.appendChild(birthdaysList);
    
    // Show the modal
    modalOverlay.classList.remove('hidden');
    birthdayModal.classList.remove('hidden');
    
    // Set up close button
    const closeBtn = document.getElementById('close-birthday-modal');
    const cancelBtn = document.getElementById('cancel-birthday-btn');
    
    if (closeBtn) {
    closeBtn.onclick = () => {
    modalOverlay.classList.add('hidden');
    birthdayModal.classList.add('hidden');
    };
    }
    
    if (cancelBtn) {
    cancelBtn.onclick = () => {
    modalOverlay.classList.add('hidden');
    birthdayModal.classList.add('hidden');
    };
    }
    }
    
    /**
    * Go to the previous month
    */
    prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
    }
    
    /**
    * Go to the next month
    */
    nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
    }
    }
    
    // Calendar will be initialized in app.js