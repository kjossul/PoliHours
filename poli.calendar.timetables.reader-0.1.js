var days = {
    'Lun': 1, 'Mon': 1, 'Mar': 2, 'Tue': 2, 'Mer': 3, 'Wed': 3, 'Gio': 4, 'Thu': 4, 'Ven': 5, 'Fri': 5, 'Sab': 6,
    'Sat': 6, 'Dom': 0, 'Sun': 0
};

/**
 * Returns a list of lectures found in the text passed as input. Each object returned is ready to be digested through
 * the Google Calendar API. See {@link https://developers.google.com/google-apps/calendar/v3/reference/events#resource}
 * for further documentation.
 * @param text The textual format of the timetables
 * @returns {Array}
 */
function getLectures(text) {
    var courses = text.split('\n\n\n');
    var lectures = [];
    courses.forEach(function (course) {
        var title = /- (.*) {2}/.exec(course)[1]; // retrieve course title
        var prof = /: (.*) \)/.exec(course)[1]; // match prof name
        var dates = course.match(/\d{2}\/\d{2}\/\d{4}/g).map(function (date) {
            var parts = date.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        });
        var lecturesDescriptions = course.split('\n').slice(2);
        lecturesDescriptions.forEach(function (line) {
            // Day of lectures is shown only in textual format (mon, tue, ..), so to get a Date object we add to the
            // first day of lectures the difference in days using the getDay() method.
            var day = dates[0].addDays(days[line.slice(0, 3)] - dates[0].getDay());
            var hours = line.match(/(\d{2}:\d{2})/g).map(function (hour) {
                var out = new Date(day.getTime());
                out.setHours(parseInt(hour.slice(0, 2)) + 2, parseInt(hour.slice(3, 5)));
                return out;
            });
            var room = / ([0-9A-Z\.]*) \(/.exec(line)[1];
            // the event is set with a weekly recursion, until the last date
            // see https://tools.ietf.org/html/rfc5545#section-3.8.5.3 for recurrence rules
            var endDate = dates[1].toISOString().replace(/\W/g, '');
            lectures.push({
                'summary': title,
                'location': room,
                'start': {
                    'timeZone': 'Europe/Rome',
                    'dateTime': hours[0].toISOString()
                },
                'end': {
                    'timeZone': 'Europe/Rome',
                    'dateTime': hours[1].toISOString()
                },
                'recurrence': ['RRULE:FREQ=WEEKLY;UNTIL=' + endDate.slice(0, -4) + 'Z']
            });
        });
    });
    console.log('oi' + lectures[0].recurrence)
    return lectures;
}

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};