// Client ID and API key from the Developer Console
var CLIENT_ID = '526107522447-vbf1mmb6749o3d14spfl1mgsvi3rka31.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar";

var authorizeButton = document.getElementById('authorize-button');
var authorizeDiv = document.getElementById('authorize-div');
var logoutDiv = document.getElementById('logout-div');
var signoutButton = document.getElementById('signout-button');
var form = document.getElementById('exporter-form');

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
        authorizeDiv.style.display = 'none';
        form.style.display = 'block';
        logoutDiv.style.display = 'block';
    } else {
        authorizeDiv.style.display = 'block';
        form.style.display = 'none';
        logoutDiv.style.display = 'none';
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
    clearMessages();
    try {
        var events = getLectures(document.getElementById('submit-area').value);
    } catch (e) {
        showError('Could not read timetables. Please check that your input is correct.');
        console.error(e);
        return;
    }
    document.getElementById('submit-button').disabled = true;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('submit-area').value = '';
    if (!document.getElementById('create-new-calendar').checked) {  // use primary calendar, don't create a new one
        addEvents('primary', events);
    } else
        gapi.client.calendar.calendars.insert({'summary': title, 'timeZone': 'Europe/Rome'})
            .then(function (response) {
                addEvents(response.result.id, events, 0);
            }, function (error) {
                showError('Could not create new calendar. Please check your internet connection, or if you signed successfully into Google.');
                console.error(error);
            });
}

/**
 * Adds the events passed as parameter to the calendar with the given id.
 * @param calendarId  The id of the calendar to insert the events into.
 * @param events The list of events to be inserted.
 * @param backoffStage Exponent for the backoff wait time (0, 1, 2, ...)
 */
function addEvents(calendarId, events, backoffStage) {
    var c = events.length;
    sleep(100);
    events.forEach(function (event) {
        gapi.client.calendar.events.insert({
            'calendarId': calendarId,
            'resource': event
        }).then(function (response) {
            console.info("Successfully added event with id " + response.result.id);
            if (--c === 0) {
                showMessage("Added all lectures to the calendar.\n");
                showMessage("<b><a href='https://www.google.com/calendar' target='_blank'>Go to your calendar now</a>.</b>");
                document.getElementById('loading').style.display = 'none';
                document.getElementById('submit-button').disabled = false;
            }
        }, function (response) {
            if (500 <= response.result.error.code <= 503 && backoffStage < 4) {
                /*
                When receiving a 500 or 503 error, the request can be retried after a small amount of time. The suggested
                way to handle such errors is with the exponential backoff method: wait for 0, 1, 2, 4, 8, ... seconds
                (plus a small random amount of milliseconds) before retrying the request. The upper limit that I chose is
                8 seconds, after that it simply stops trying and logs the error.
                 */
                sleep(Math.pow(2, backoffStage) * 1000 + Math.floor(Math.random() * 100));  // waits to avoid API overflowing
                addEvents(calendarId, [event], backoffStage++);  // Tries to add the event one more time
            } else {
                showError("Failed to create event for lecture " + event.summary + ". Please try again.");
                console.error(response);
            }
        });
    });
}

function showMessage(text) {
    document.getElementById('result').innerHTML += text;
}

function showError(text) {
    document.getElementById('error').innerHTML += text;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('submit-button').disabled = false;
}

function clearMessages() {
    document.getElementById('result').innerHTML = '';
    document.getElementById('error').innerHTML = '';
}

// sleep time expects milliseconds
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
