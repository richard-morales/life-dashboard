# 🌟 Life Dashboard


A personal productivity dashboard built with **vanilla JavaScript**, **HTML5**, and **CSS3**.  

It provides a collection of standalone widgets designed to help organize daily life, track habits, and monitor progress — all in a single, minimalist interface.

🔗 **Live Demo** → https://richard-morales.github.io/life-dashboard/


## ✨ Features

### 📋 Task Manager

-   Add, complete, and delete tasks.
    
-   Persistent storage with `localStorage`.
    
-   Clean UI with completion effects.

### ✅ Weekly Goals

-   Create **SMART** weekly goals with a target and unit (times, minutes, reps, etc.).
    
-   Pick the weekday(s) you’ll do them with a friendly checkbox picker.
    
-   Progress bar with percentage; visual feedback when completed.
    
-   Subtle safeguards (e.g., disabled states) to keep tracking intentional.
    
-   Saved in `localStorage`.


### 💰 Budget Tracker

-   Track **income and expenses**.
    
-   Auto-calculated totals for income, expenses, and balance.
    
-   Reset button to clear all data.
    
-   Input formatting powered by **Cleave.js**.

### ⏱️ Habit Clock
-   Visual “habit clocks” to count days since a habit started.
    
-   Duration shown in **years, months, and days**.
    
-   Custom ornate clock frame for styling.

### 📈 Progress Tracker
-   Track numeric progress over time (e.g., weight, reps, distance).
    
-   Interactive charts using **Chart.js** with zoom/pan support.
    
-   Summary stats (average, min, max, latest, growth).
    
-   Scrollable history table with sticky header.

### 📝 Quick Notes
-   Rich-text note editor with:
    
    -   Bold/italic, alignment, bullet styles, quotes.
        
    -   Orientation (horizontal/vertical/rotated).
        
    -   Background themes (clean, pastel, galaxy, paper, etc.).
        
-   Export notes to **PDF** and **PNG**.

## 📸 Screenshots

### Dashboard
![Dashboard](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/dashboard.png)

*Overview of the main dashboard with all widgets available.*

### Task Manager
![Task Manager](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/task-manager.png)

*Add, complete, and delete tasks with simple interaction.*

### Weekly Goals
![Weekly Goals](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/weekly-goals.png)

Set weekly goals with targets and track progress visually with a progress bar.

### Progress Tracker
![Progress Tracker](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/progress-tracker.png)

*Interactive chart with zoom/pan and summary stats.*

### Habit Clock
![Habit Clock](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/habit-clock.png)

*Visual ornate clock showing days since a habit started.*

### Quick Notes
![Quick Notes](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/quick-notes.png)

*Rich-text editor with multiple formatting tools and background moods.*

### Budget Tracker
![Budget Tracker](https://github.com/richard-morales/life-dashboard/blob/main/assets/images/screenshots/budget-tracker.png)

*Track your income and expenses with auto-updated totals.*


## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript
    
-   **Charts:** Chart.js (+ chartjs-plugin-zoom)
    
-   **Input formatting:** Cleave.js
    
-   **Icons:** Font Awesome
    
-   **Fonts:** Google Fonts (Roboto, Cinzel, Special Elite, etc.)

## 📂 Project Structure

life-dashboard/  
├── index.html # Main dashboard page  
├── task.html # Task Manager page  
├── task.js # Task Manager logic  
├── goals.html # Weekly Goals page  
├── goals.js # Weekly Goals logic  
├── notes.html # Quick Notes page  
├── notes.js # Quick Notes logic  
├── habits.html # Habit Clock page  
├── habits.js # Habit Clock logic  
├── budget.html # Budget Tracker page  
├── budget.js # Budget Tracker logic  
├── progress.html # Progress Tracker page  
├── progress.js # Progress Tracker logic  
├── style.css # Shared styles  
├── assets/  
│ └── images/  
│ └── screenshots/ # App screenshots  
│ ├── dashboard.png  
│ ├── task-manager.png  
│ ├── weekly-goals.png  
│ ├── quick-notes.png  
│ ├── habit-clock.png  
│ ├── progress-tracker.png  
│ └── budget-tracker.png  
└── README.md # Documentation

## 💾 Persistence

All widgets store data in **localStorage** for a fast, backend-free experience.

## 🚀 Future Improvements

-   Dark mode toggle.
    
-   Cloud sync across devices.
    
-   More data visualization options in Progress Tracker.
    
-   Tagging and search for Quick Notes.


## 👨‍💻 Author

Created by **Richard Camilo Morales**  

- [GitHub](https://github.com/richard-morales)  
- [Portfolio](https://richard-morales.github.io)  

