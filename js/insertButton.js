function addButton(schedule) {
  let scheduleCard = schedule;
  let button = document.createElement("div");
  button.id = "scheduleToCalendar";
  button.style.backgroundImage = "url('" + document.getElementById("buttonLoader").dataset.imgUrl + "')";
  button.addEventListener("click", grabSchedule);
  scheduleCard.insertBefore(button, scheduleCard.children[0]);
}

function grabSchedule () {
  console.log("Test");
  window.postMessage({ type: "schedule", schedule: JSON.stringify(WSData.course_data_for_term(VisualScheduleCard.term))}, "*");
  window.postMessage({ type: "newTab", newSchedule: JSON.stringify(WSData.course_data_for_term(VisualScheduleCard.term))}, "*");
}

let oldHandler = VisualScheduleCard.render_handler;
VisualScheduleCard.render_handler = function() {
  oldHandler();
  addButton(VisualScheduleCard.dom_target[0])
}
VisualScheduleCard.render_init()
