
let auth = null;
let calAPI = null;
let schedule = null;
let currentEventNum = 0;

window.addEventListener("load", function() {
  M.AutoInit();

  schedule = new Schedule();
  schedule.setupCalendar($("calendar"), $("today"), $("next-day"), $("prev-day"), $("date-range"));

  $("sign-in-btn").addEventListener("click", toggleLogin);
  $("add-events-btn").addEventListener("click", addEvents);
  $("download-ics-btn").addEventListener("click", schedule.downloadICS);

  auth = new Auth({
    "signInCallback": (userData) => {
      updateUserInfo(userData);
      calAPI.getCalendarList((calendarListData) => {
        updateCalendarList(calendarListData)
      })
    },
    "signOutCallback": resetLoginCredentials,
    "loadingCallback": showLoading
  });

  calAPI = new CalAPI(auth, schedule);
});

function toggleLogin() {
  if (!this.classList.contains("disabled")) {
    if (this.dataset.loggedIn === "false") {
      auth.signIn();
    } else {
      auth.signOut();
    }
  }
}

function updateCalendarList(calListData) {
  if (calListData) {
    let calendarList = calListData.items;
    $("calendar-list").classList.remove("hidden");
    $("calendar-list-info").innerText = "Choose a calendar";

    $("calendar-list").innerHTML = "";
    for (let i = 0; i < calendarList.length; i++) {
      let p = document.createElement("p");
      let label = document.createElement("label");
      let input = document.createElement("input");
      let span = document.createElement("span");

      input.classList.add("with-gap");
      input.name = "calendar-list-radio";
      input.type = "radio";
      input.value = calendarList[i].id;

      span.style.color = shadeHexColor(calendarList[i].backgroundColor, -0.2);
      span.innerText = calendarList[i].summary;

      label.appendChild(input);
      label.appendChild(span);
      p.appendChild(label);
      $("calendar-list").appendChild(p);
    }

    $("calendar-list").innerHTML += ' \
      <p> \
        <label> \
          <input class="with-gap" name="calendar-list-radio" type="radio" value="new-calendar" /> \
          <span> \
            New Calendar: \
            <span class="input-field inline"> \
              <input id="new-calendar-name" placeholder="Name" type="text"> \
            </span> \
          </span> \
        </label> \
      </p> ';

    $("new-calendar-name").addEventListener("focus", () => {
      qs("input[value='new-calendar']").checked = true;
    })
  }
}

function showLoading() {
  $("sign-in-btn").classList.add("disabled");
  $("account-name").innerText = "Loading...";
  $("account-email").innerText = "";
  $("profile-pic").src = "img/blankprofile.jpg";

  $("spinner").classList.remove("hidden");
  $("profile-pic").classList.add("hidden");
}

function updateUserInfo(userData) {
  if (userData) {
    $("account-name").innerText = userData.name;
    $("account-email").innerText = userData.email;
    if (userData.picture) {
      $("profile-pic").src = userData.picture;
    }

    $("sign-in-btn").classList.remove("disabled");

    $("spinner").classList.add("hidden");
    $("profile-pic").classList.remove("hidden");

    $("sign-in-btn").innerText = "Sign Out";
    $("sign-in-btn").dataset.loggedIn = "true";
  } else {
    resetLoginCredentials();
  }
}


function openModal(scheduleData, calendarName) {
  let closeBtn = qs("#progress-modal .modal-close");
  closeBtn.innerText = "Close";
  closeBtn.classList.remove("btn");
  closeBtn.classList.add("btn-flat");

  let instance = M.Modal.getInstance($("progress-modal"));
  $("modal-loader").classList.remove("hidden");

  $("modal-text").innerHTML = "";
  let courseCollection = document.createElement("ul");
  courseCollection.classList.add("collection");

  let courseDictionary = {};
  for (let course of scheduleData.courses) {
    if (course.start_time) {
      let title = course.curr_abbr + " " + course.course_num + " - " + course.course_title;
      if (courseDictionary[title]) {
        courseDictionary[title] += 1;
      } else {
        courseDictionary[title] = 1;
      }
    }
  }

  if (calendarName) {
    courseCollection.classList.add("with-header")
    let list = createLoadListElement("NEW CALENDAR: " + calendarName, 1);
    list.classList.remove("collection-item");
    list.classList.add("collection-header");
    courseCollection.appendChild(list);
  }

  for (let [courseName, eventNumber] of Object.entries(courseDictionary)) {
    courseCollection.appendChild(createLoadListElement(courseName, eventNumber));
  }

  $("modal-text").appendChild(courseCollection);
  instance.open();
}

function createLoadListElement(courseName, eventNumber) {
  let list = document.createElement("li");
  list.classList.add("collection-item");
  list.innerText = courseName;
  list.dataset.title = courseName;

  let outerLoader = document.createElement("div");
  let innerLoader = document.createElement("div");
  outerLoader.classList.add("progress");

  innerLoader.classList.add("determinate");
  innerLoader.dataset.total = eventNumber;
  innerLoader.dataset.current = 0;
  innerLoader.style.width = "0%";

  outerLoader.appendChild(innerLoader);
  list.appendChild(outerLoader);
  return list;
}

function updateModal(title, currentEventNum, totalEventsNum) {
  let courseLi = $("modal-text").querySelector("li[data-title='" + title + "'] .determinate");
  courseLi.dataset.current = parseInt(courseLi.dataset.current) + 1;
  courseLi.style.width = parseInt(courseLi.dataset.current) / parseInt(courseLi.dataset.total) * 100 + "%";

  qs("#modal-loader > div").style.width = currentEventNum / totalEventsNum * 100 + "%";

  if (currentEventNum == totalEventsNum) {
    let closeBtn = qs("#progress-modal .modal-close");
    closeBtn.classList.remove("btn-flat");
    closeBtn.classList.add("btn");
    closeBtn.innerText = "Done";
  }
}

function resetLoginCredentials() {
    $("sign-in-btn").classList.remove("disabled");
    $("spinner").classList.add("hidden");
    qs("#profile-card img").classList.remove("hidden");
    $("account-name").innerText = "Sign In";
    $("sign-in-btn").dataset.loggedIn = "false";
    $("sign-in-btn").innerText = "Sign In With Google";
    $("profile-pic").src = "img/blankprofile.jpg";
    $("calendar-list").innerHTML = "";
    $("calendar-list-info").innerText = "No Calendars Loaded";
}

function addEvents() {
  schedule.getScheduleData(function(scheduleData) {
    let selectedRadio = qs('input[name="calendar-list-radio"]:checked');
    if (selectedRadio) {
      currentEventNum = 0;
      if (selectedRadio.value === "new-calendar") {
        openModal(scheduleData, $("new-calendar-name").value);
        calAPI.newCalendar($("new-calendar-name").value, logNewEvents)
      } else {
        openModal(scheduleData);
        calAPI.addEvents(selectedRadio.value, logNewEvents)
      }
    }
  });
}

function logNewEvents(data) {
  if (data.type === "newCalendar") {
    console.log("NEW CALENDAR: " + data.data.summary);
    updateModal("NEW CALENDAR: " + data.data.summary, currentEventNum, data.total);
  } else {
    currentEventNum++;
    updateModal(data.course.curr_abbr + " " + data.course.course_num + " - " + data.course.course_title, currentEventNum, data.total);
  }
}

function shadeHexColor(color, percent) {
    let f = parseInt(color.slice(1),16);
    let t = percent < 0 ? 0:255;
    let p = percent < 0 ? percent * -1 : percent;
    let R = f >> 16;
    let G = f >> 8 & 0x00FF;
    let B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
                              (Math.round((t - G) * p) + G) * 0x100 +
                              (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function qs(query) {
  return document.querySelector(query);
}

function $(id) {
  return document.getElementById(id);
}
