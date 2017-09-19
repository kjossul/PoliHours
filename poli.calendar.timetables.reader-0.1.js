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
 * @example
 * This is an input that can be digested from this function:
 * 089183 - DATA BASES 2  (Professor: Braga Daniele Maria )
 Semester: 1 Lectures start: 18/09/2017 Lectures end: 19/12/2017
 Monday from 08:15 to 10:15, lesson in lecture theatre L.26.13 (Milano Città Studi - Via Golgi 20 - Edificio 26 - Piano Primo)
 Tuesday from 08:15 to 10:15, lesson in lecture theatre D.0.3 (Milano Città Studi - Via Golgi 40 - Edificio 25 - Piano Seminterrato)
 */
function getLectures(text) {
    text = text.replace(/^\s+|\s+$/g, '');  // Removes trailing and leading whitespace
    var lectures = [];
    text.split('\n\n\n').forEach(function (course) {  // todo try-catch here or change this into classic loop to break if invalid course
        var title = /- (.*) {2}/.exec(course)[1]; // retrieve course title
        var prof = /: (.*) \)/.exec(course)[1]; // match prof name
        var dates = course.match(/\d{2}\/\d{2}\/\d{4}/g).map(function (date) {
            var parts = date.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        });
        var lecturesDescriptions = course.split('\n').slice(2);
        lecturesDescriptions.forEach(function (line) {
            /*
            Day of lectures is shown only in textual format (mon, tue, ..), so to get a Date object we add to the
            first day of lectures the difference in days using the getDay() method.
            */
            var day = dates[0].addDays(days[line.slice(0, 3)] - dates[0].getDay());
            var hours = line.match(/(\d{2}:\d{2})/g).map(function (hour) {
                var out = new Date(day.getTime());
                out.setHours(parseInt(hour.slice(0, 2)), parseInt(hour.slice(3, 5)));
                return out;
            });
            var room = / ([0-9A-Z\.]*) \(/.exec(line)[1];
            /*
            Removes non-alpha characters to comply with ietf recurrence rules formatting
             */
            var endDate = dates[1].toISOString().replace(/\W/g, '');
            dates[1] = dates[1].addDays(1);  // End date must be included as well,
            /*
            The event is set with a weekly recursion, until the last date.
            See https://tools.ietf.org/html/rfc5545#section-3.8.5.3 for recurrence rules
            */
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
                'recurrence': ['RRULE:FREQ=WEEKLY;UNTIL=' + endDate.slice(0, -4) + 'Z']  // trims milliseconds
            });
        });
    });
    return lectures;
}

/**
 * Adds the number of days passed as parameter to the Date.
 * @param days  The number of days to add
 * @returns {Date}
 */
Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};