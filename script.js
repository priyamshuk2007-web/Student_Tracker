 // =====================
  // TASK TRACKER
  // =====================
  var tasks = [];
  var tasksDoneThisWeek = 0;

  function addTask() {
    var title = document.getElementById("taskTitle").value.trim();
    var cat = document.getElementById("taskCat").value;
    if (!title) return;
    tasks.push({ title: title, cat: cat, done: false, id: Date.now() });
    document.getElementById("taskTitle").value = "";
    renderTasks();
  }

  function renderTasks() {
    var ul = document.getElementById("taskList");
    ul.innerHTML = "";
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      var li = document.createElement("li");
      if (t.done) li.className = "done";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.setAttribute("data-id", t.id);
      cb.onchange = function() { toggleTask(this.getAttribute("data-id")); };

      var span = document.createElement("span");
      span.className = "task-text";
      span.innerText = t.title;

      var badge = document.createElement("span");
      badge.className = "task-badge";
      badge.innerText = t.cat;

      var del = document.createElement("button");
      del.className = "del-btn";
      del.innerHTML = "&#10005;";
      del.setAttribute("data-id", t.id);
      del.onclick = function() { deleteTask(this.getAttribute("data-id")); };

      li.appendChild(cb);
      li.appendChild(span);
      li.appendChild(badge);
      li.appendChild(del);
      ul.appendChild(li);
    }
  }

  function toggleTask(id) {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id == id) {
        tasks[i].done = !tasks[i].done;
        if (tasks[i].done) {
          tasksDoneThisWeek++;
        } else {
          if (tasksDoneThisWeek > 0) tasksDoneThisWeek--;
        }
        break;
      }
    }
    document.getElementById("statTasks").innerText = tasksDoneThisWeek;
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function(t) { return t.id != id; });
    renderTasks();
  }

  // allow pressing enter to add task
  document.getElementById("taskTitle").addEventListener("keydown", function(e) {
    if (e.key === "Enter") addTask();
  });

  // =====================
  // CALENDAR
  // =====================
  var calNotes = {}; // key = "YYYY-M-D", value = note string
  var currentDate = new Date();
  var calYear = currentDate.getFullYear();
  var calMonth = currentDate.getMonth(); // 0-indexed
  var selectedDay = null;

  var monthNames = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
  var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function renderCalendar() {
    document.getElementById("calMonthLabel").innerText = monthNames[calMonth] + " " + calYear;
    var grid = document.getElementById("calGrid");
    grid.innerHTML = "";

    // day name headers
    for (var d = 0; d < 7; d++) {
      var dn = document.createElement("div");
      dn.className = "day-name";
      dn.innerText = dayNames[d];
      grid.appendChild(dn);
    }

    var firstDay = new Date(calYear, calMonth, 1).getDay();
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    // empty cells
    for (var e = 0; e < firstDay; e++) {
      var blank = document.createElement("div");
      blank.className = "cal-day empty";
      grid.appendChild(blank);
    }

    var today = new Date();

    for (var day = 1; day <= daysInMonth; day++) {
      var cell = document.createElement("div");
      cell.className = "cal-day";
      cell.innerText = day;

      var key = calYear + "-" + calMonth + "-" + day;
      if (calNotes[key]) {
        cell.className += " has-note";
        cell.title = calNotes[key];
      }

      if (calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate()) {
        cell.className += " today";
      }

      cell.setAttribute("data-day", day);
      cell.onclick = function() {
        selectedDay = parseInt(this.getAttribute("data-day"));
        var k = calYear + "-" + calMonth + "-" + selectedDay;
        var popup = document.getElementById("notePopup");
        popup.style.display = "block";
        document.getElementById("noteLabel").innerText = "Note for " + monthNames[calMonth] + " " + selectedDay + ":";
        document.getElementById("noteText").value = calNotes[k] || "";
      };

      grid.appendChild(cell);
    }
  }

  function changeMonth(dir) {
    calMonth += dir;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    if (calMonth < 0) { calMonth = 11; calYear--; }
    document.getElementById("notePopup").style.display = "none";
    selectedDay = null;
    renderCalendar();
  }

  function saveNote() {
    if (selectedDay === null) return;
    var key = calYear + "-" + calMonth + "-" + selectedDay;
    var val = document.getElementById("noteText").value.trim();
    if (val) {
      calNotes[key] = val;
    } else {
      delete calNotes[key];
    }
    document.getElementById("notePopup").style.display = "none";
    selectedDay = null;
    renderCalendar();
  }

  renderCalendar();

  // =====================
  // POMODORO TIMER
  // =====================
  var timerInterval = null;
  var timerRunning = false;
  var timerSeconds = 25 * 60;
  var currentMode = 25;
  var sessions = 0;
  var minutesFocused = 0;
  var secondsElapsed = 0;

  function setMode(mins, btn) {
    if (timerRunning) return; // don't switch while running
    currentMode = mins;
    timerSeconds = mins * 60;
    updateDisplay();
    // update button styles
    var btns = document.getElementsByClassName("timer-mode-btns")[0].getElementsByTagName("button");
    for (var b = 0; b < btns.length; b++) {
      btns[b].className = "";
    }
    btn.className = "active";
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById("startBtn").innerText = "Resume";
    } else {
      timerRunning = true;
      document.getElementById("startBtn").innerText = "Pause";
      timerInterval = setInterval(function() {
        timerSeconds--;
        secondsElapsed++;
        if (secondsElapsed % 60 === 0) {
          minutesFocused++;
          document.getElementById("statTime").innerText = minutesFocused;
        }
        if (timerSeconds <= 0) {
          clearInterval(timerInterval);
          timerRunning = false;
          timerSeconds = 0;
          if (currentMode === 25) {
            sessions++;
            document.getElementById("sessionCount").innerText = sessions;
          }
          document.getElementById("startBtn").innerText = "Start";
          updateDisplay();
          alert(currentMode === 25 ? "Session done! Take a break 🎉" : "Break over! Back to work 💪");
          return;
        }
        updateDisplay();
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = currentMode * 60;
    secondsElapsed = 0;
    document.getElementById("startBtn").innerText = "Start";
    updateDisplay();
  }

  function updateDisplay() {
    var mins = Math.floor(timerSeconds / 60);
    var secs = timerSeconds % 60;
    document.getElementById("timerDisplay").innerText =
      (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

