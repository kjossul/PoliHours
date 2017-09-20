// Client ID and API key from the Developer Console
var CLIENT_ID = '147113309946-6gvpadgqvidiiiuebsmut8p414r637io.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var form = document.getElementById('timetable-exporter');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        form.style.display = 'block';
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        form.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}
/**
 * Creates a new calendar with the given title. Calls also the {@link getLectures} to retrieve the events from the
 * textarea. If everything went good, calls the {@link addEvents} function.
 * @param title  The title of the calendar to add.
 */
function createCalendar(title) {
    try {
        var events = getLectures(document.getElementById('submit-area').value);
    } catch (e) {
        console.warn("Incorrect input.");  // todo actually remove this useless try-catch
        console.log(e);
        return;
    }
    gapi.client.calendar.calendars.insert({'summary': title, 'timeZone': 'Europe/Rome'})
        .then(function (response) {
            addEvents(response.result.id, events);
        });
}

/**
 * Adds the events passed as parameter to the calendar with the given id.
 * @param calendarId  The id of the calendar to insert the events into.
 * @param events The list of events to be inserted.
 */
function addEvents(calendarId, events) {
    events.forEach(function (event) {
        gapi.client.calendar.events.insert({
            'calendarId': calendarId,
            'resource': event
        }).then(function (response) {
            console.info("Successfully added event with id " + response.result.id);
        });
    });
}