
function CalAPI(auth, schedule) {
  this.auth = auth;
  this.schedule = schedule;

  this.getWithToken = function (url, callback) {
    auth.getToken((token) => {
      fetch(url, {headers: new Headers(
            {'Authorization': 'Bearer ' + token}
          )})
        .then(this.checkStatus)
        .then(callback)
        .catch(function(err) {
          console.log("Token Invalid Or Expired");
          console.log(err);
        });
    });
  }

  this.getCalendarList = function(callback) {
    this.getWithToken('https://www.googleapis.com/calendar/v3/users/me/calendarList', (calendarInfo) => {
        callback(JSON.parse(calendarInfo));
      }
    )
  }

  this.addEvents = function(calID, logFunction) {
    schedule.getScheduleData((scheduleData) => {
      if (scheduleData) {
        let courses = scheduleData.courses;
        this.numOfCourses = 0;
        for (let i = 0; i < courses.length; i++) {
          let course = courses[i];
          if (course.start_time) { // Checks if online class
            let eventData = {
              "start": {
                "dateTime": (new Date(course.start_time)).toISOString(),
                "timeZone": "America/Los_Angeles"
              },
              "end": {
                "dateTime": (new Date(course.end_time)).toISOString(),
                "timeZone": "America/Los_Angeles"
              },
              "summary": course.title,
              "description": course.description,
              "location": course.location,
              "iCalUID": i + "@" + scheduleData.label,

            }
            if (course.freq) {
              eventData["recurrence"] = [
                "RRULE:FREQ=" + course.freq + ";UNTIL=" +
                (new Date(course.until)).toISOString().replace(/(-)|(:)|(\.\d+)/g,"") +
                ";BYDAY=" + course.byday.join(",")
              ];
            }
            this.postWithToken("https://www.googleapis.com/calendar/v3/calendars/" + calID + "/events/import",
              eventData,
              (data) => {
                let logData = {type: "newEvent", data: JSON.parse(data), total:this.numOfCourses, current:i}
                logFunction(logData);
              }
            );
            this.numOfCourses++;
          }
        }
      }
    })
  }

  this.newCalendar = function(calName, logFunction) {
    this.postWithToken("https://www.googleapis.com/calendar/v3/calendars",
      {summary: calName},
      (response) => {
        let calData = JSON.parse(response);
        let logData = {type: "newCalendar", data: calData}
        logFunction(logData);

        this.addEvents(calData.id, logFunction);
      });
  }

  this.postWithToken = function(url, data, callback, secondRun) {
    auth.getToken((token) => {
      fetch(url, {
          headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }),
          method: "POST",
          body: JSON.stringify(data)
        })
        .then(this.checkStatus)
        .then(callback)
        .catch(function(err) {
            console.log(err);
        });
    });
  }

  this.checkStatus = function(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }
}
