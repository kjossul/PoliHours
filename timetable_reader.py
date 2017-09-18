import re
from _datetime import datetime, timedelta

days = {'Lun': 0, 'Mon': 0, 'Mar': 1, 'Tue': 1, 'Mer': 2, 'Wed': 2, 'Gio': 3, 'Thu': 3, 'Ven': 4, 'Fri': 4, 'Sab': 5,
        'Sat': 5, 'Dom': 6, 'Sun': 6}


def get_lectures(text):
    """
    Returns a list of lectures found in the text (has to be the synoptic version of the timetables). The output value
    is a list of dictionaries, already in the format for the Google Calendar Api. See 
    https://developers.google.com/google-apps/calendar/v3/reference/events#resource for documentation.
    
    :param text: The synoptic version of the timetables
    :type text: str
    :return: 
    :rtype: list of dict
    """
    courses = text.split('\n\n\n')
    lectures = []
    for course in courses:
        name, prof = re.search('- (.*) {2}.*: (.*) \)', course).groups()
        first, last = [datetime.strptime(date, '%d/%m/%Y') for date in re.findall('(\d{2}\/\d{2}\/\d{4})', course)]
        first_day = days[first.strftime('%A')[:3]]
        for line in course.split('\n')[2:]:
            if len(line) < 3: break  # avoids blank lines
            day = first + timedelta(days=days[line[:3]] - first_day)  # gets the day of the lecture
            start, end = [day.replace(hour=int(time[:2]), minute=int(time[-2:])) for time in
                          re.findall('(\d{2}:\d{2})', line)]  # calculates start and end time
            room = re.search(' ([0-9A-Z\.]*) \(', line).group(1)
            #  the event is set with a weekly recursion, until the last date
            #  see https://tools.ietf.org/html/rfc5545#section-3.8.5.3 for recurrence rules
            lectures.append({'summary': name,
                             'location': room,
                             'start': {'timeZone': 'Europe/Rome',
                                       'dateTime': start.strftime('%Y-%m-%dT%H:%M:%S')},
                             'end': {'timeZone': 'Europe/Rome',
                                     'dateTime': end.strftime('%Y-%m-%dT%H:%M:%S')},
                             'recurrence': [f'RRULE:FREQ=WEEKLY;UNTIL={last.strftime("%Y%m%dT230000Z")}']
                             })
    return lectures

result = []
for file in ('timetable_it.txt', 'timetable_en.txt'):
    with open(file) as f:
        result.append(get_lectures(''.join(f.readlines())))

assert result[0] == result[1]  # both italian and english version of the timetables should yield the same result
