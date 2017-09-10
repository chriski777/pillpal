var Alexa = require('alexa-sdk');
var http = require('http');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var tableName = "user";

var client_name = "";

var welcomeMessage = "Hello! You can ask me for help. What will it be?";

var welcomeReprompt = "You can ask me for your schedule or say help. What will it be?";

var HelpMessage = "Here are some things you can say: Check if I've taken my medicine. Refill my prescriptions. Contact my doctor.  What would you like to do?";

var moreInformation = "See your Alexa app for  more  information."

var tryAgainMessage = "please try again."

var noMedicineErrorMessage = "Sorry, we couldn't find that medicince in the file. " + tryAgainMessage;

var goodbyeMessage = "OK, good bye.";

var newline = "\n";

var output = "";

var alexa;

var pills_left;

var client_intervals;

exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    dynamodb.scan({
        TableName : tableName,
        Limit : 1
    }, function(err, data) {
        if (err) {
            context.done('error','reading dynamodb failed: '+err);
        }
        client_name = data.Items[0]["client_name"].S.split(" ");
        pills_left = data.Items[0]["times_left"].L;
        client_intervals = data.Items[0]["intervals"];
        alexa.registerHandlers(newSessionHandlers);
        alexa.execute();
    });
};

var newSessionHandlers = {
    'LaunchRequest': function () {
        output = "Hello, " + client_name[0];
        this.emit(':ask', output, welcomeReprompt);
    },
    'CheckIntent': function () {
        isDone = true;
        for (var x in pills_left){
            if (pills_left[x].N != 0) {
                isDone = false;
            } 
        }
        if (isDone) {
            appendMSG = "Congratulations! You've finished your medications for today."
        } else {
            appendMSG = "Unfortunately, you still have unfinished medication."
        }
        output = "Hey, " + client_name[0] + appendMSG;
        this.emit(':tell', output);
    },
    'ConfirmAdherenceIntent': function () {
        output = "how do i confirm lmao";
        this.emit(':tell', output);
    },
    'DoctorContactIntent': function(){
        output = "you are a doctor b b";
        this.emit(':tell', output);
    },
    'DoctorIntent': function(){
        output = "doctors! gasp";
        this.emit(':tell', output);
    },
    'ManualAdherenceIntent': function(){
        output = "ignore this";
        this.emit(':tell', output);
    },
    'NextDoseIntent': function(){
        output = "your next dose is right now bihh";
        this.emit(':tell', output);
    },
    'PharmacyInfoIntent': function(){
        output = "boi its cvs, aren't you tryna get that prize";
        this.emit(':tell', output);
    },
    'RefillIntent': function(){
        output = "I refilled your prescription booboo";
        this.emit(':tell', output);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
};
String.prototype.trunc =
    function (n) {
        return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
    };