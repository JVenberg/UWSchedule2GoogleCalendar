
window.addEventListener("load", function () {
  addCalendarChangeListener();
});

function addCalendarChangeListener() {
  let schedule = qs("#VisualScheduleCard");
  new MutationObserver(function() {
    console.log(schedule);
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
    loadSchedule();
    chrome.runtime.sendMessage({greeting: "openNewTab"}, function(response) {
      console.log(response.farewell);
    });
  });
  scheduleCard.insertBefore(button, scheduleCard.children[0]);
}

function getTermData() {
  let pattern = /window\.term = ({\n(\s+.+\n)+?\s+});/;
  let result = pattern.exec(document.querySelector("#app_content > script:nth-last-child(2)").innerHTML)[1];
  result = result.replace(/'/g, '"');
  result = result.replace(/,(?=\n\s*})/g, "");
  return JSON.parse(result);
}

function loadSchedule() {
  fetch("https://my.uw.edu/api/v1/schedule/" + getTermData()["display_term"])
  .then(checkStatus)
  .then(function(response) {
    chrome.runtime.sendMessage({greeting: "newSchedule", scheduleString: response}, function(response) {
      console.log(response.farewell);
    });
  })
  .catch(console.log)
}

function qs(query, element) {
  if (element) {
    return element.querySelector(query);
  }
  return document.querySelector(query);
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300 || response.status == 0) {
    return response.text();
  } else {
    return Promise.reject(new Error(response.status + ": " + response.statusText));
  }
}
