
window.addEventListener("load", function () {
  addCalendarChangeListener();
});

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    chrome.runtime.sendMessage({greeting: "newSchedule", scheduleString: event.data.schedule});
  }
}, false);

function grabSchedule() {
  let s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', chrome.extension.getURL("js/grabSchedule.js"));
  document.body.appendChild(s);
  chrome.runtime.sendMessage({greeting: "openNewTab"});
}

function addCalendarChangeListener() {
  let schedule = qs("#VisualScheduleCard");
  new MutationObserver(function() {
    if (!document.getElementById("scheduleToCalendar")) {
      addButton(schedule);
    }
  }).observe(schedule, {characterData: true,childList: true, subtree: true});
}

function addButton(schedule) {
  let scheduleCard = qs("div", schedule);
  let button = document.createElement("div");
  button.id = "scheduleToCalendar";
  button.style.backgroundImage = "url('" + chrome.extension.getURL("img/calendarAdd.png") + "')";
  button.addEventListener("click", function() {
    grabSchedule();
  });
  scheduleCard.insertBefore(button, scheduleCard.children[0]);
}

function qs(query, element) {
  if (element) {
    return element.querySelector(query);
  }
  return document.querySelector(query);
}
