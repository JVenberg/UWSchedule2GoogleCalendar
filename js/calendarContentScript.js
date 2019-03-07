
loadScript("js/insertButton.js", chrome.extension.getURL("img/calendarAdd.png"), "buttonLoader");

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;
  if (event.data.type) {
    if (event.data.type == "schedule") {
      chrome.runtime.sendMessage({greeting: "newSchedule", scheduleString: event.data.schedule});
    } else if (event.data.type == "newTab") {
      chrome.runtime.sendMessage({greeting: "openNewTab"});
    }
  }
}, false);

function loadScript(script, data, id) {
  let s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', chrome.extension.getURL(script));
  s.dataset.imgUrl = data;
  s.id = id;
  document.body.appendChild(s);
}

function qs(query, element) {
  if (element) {
    return element.querySelector(query);
  }
  return document.querySelector(query);
}
