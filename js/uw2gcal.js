
let auth = null;
let calAPI = null;
let schedule = null;
let currentEventNum = 0;

window.addEventListener("load", function() {
  M.AutoInit();

  $("sign-in-btn").addEventListener("click", toggleLogin);
  $("add-events-btn").addEventListener("click", addEvents);

  schedule = new Schedule();
  schedule.setupCalendar($("calendar"), $("today"), $("next-day"), $("prev-day"), $("date-range"));

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
              <input id="new-calendar-name" type="text"> \
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

function openModal() {
  let instance = M.Modal.getInstance($("progress-modal"));
  instance.open();

  $("modal-loader").classList.remove("hidden");
  $("modal-text").innerHTML = "";
}

function updateModal(text, done) {
  $("modal-text").innerHTML += "<p>" + text + "</p>";
  if (done) {
    $("modal-loader").classList.add("hidden");
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
  let selectedRadio = qs('input[name="calendar-list-radio"]:checked');
  if (selectedRadio) {
    currentEventNum = 0;
    openModal();
    if (selectedRadio.value === "new-calendar") {
      calAPI.newCalendar($("new-calendar-name").value, logNewEvents)
    } else {
      calAPI.addEvents(selectedRadio.value, logNewEvents)
    }
  }
}

function logNewEvents(data) {
  if (data.type === "newCalendar") {
    updateModal("Created Calendar: " + data.data.summary, false);
  } else {
    currentEventNum++;
    updateModal("Added Event: " + data.data.summary + " " + currentEventNum + "/"+ data.total, currentEventNum >= data.total);
  }
}

function shadeHexColor(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function qs(query) {
  return document.querySelector(query);
}

function $(id) {
  return document.getElementById(id);
}
