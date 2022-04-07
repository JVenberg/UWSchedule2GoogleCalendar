function addButton(schedule) {
  let scheduleCard = schedule;
  let button = document.createElement("div");
  button.id = "scheduleToCalendar";
  button.style.backgroundImage = "url('" + document.getElementById("buttonLoader").dataset.imgUrl + "')";
  button.addEventListener("click", grabSchedule);
  scheduleCard.insertBefore(button, scheduleCard.children[0]);
}

function grabSchedule () {
  const schedule = document.getElementById('myuw-visual-schedule').__vue__.$store.state.visual_schedule.value.current;
  schedule.sections = schedule.periods[0].sections;
  window.postMessage({ type: "schedule", schedule: JSON.stringify(schedule)}, "*");
  window.postMessage({ type: "newTab", newSchedule: JSON.stringify(schedule)}, "*");
}

const buttonTimer = setInterval(() => {
  const ele = document.getElementById('myuw-visual-schedule');
  if (ele) {
      addButton(ele.children[0]);
      clearInterval(buttonTimer);
  }
}, 500);
