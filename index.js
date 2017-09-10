var Alexa = require('alexa-sdk');
var http = require('http');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var tableName = "user";

var client_name = "";

var welcomeReprompt = "You can ask me for your schedule or say help. What will it be?";

var HelpMessage = "Here are some things you can say: Check if I've taken my medicine. Refill my prescriptions. Contact my doctor.  What would you like to do?";

var moreInformation = "See your Alexa app for more information."

var tryAgainMessage = "Sorry, I didn't get that. Please try again."

var medRemindReprompt = "Sorry, I didn't get that. Would you like to know what medications you still have to take? "

var noMedicineErrorMessage = "Sorry, we couldn't find that medicince in the file. " + tryAgainMessage;

var goodbyeMessage = "OK, good bye.";

var newline = "\n";

var output = "";

var alexa;

var pills_left;

var client_intervals;

var medNames;

var states = {
    ASKMODE: '_ASKMODE',
    STARTMODE: '_STARTMODE'
};

exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    dynamodb.scan({
        TableName : tableName,
        Limit : 1
    }, function(err, data) {
        if (err) {
            context.done('error','reading dynamodb failed: '+err);
        }
        // change data.Items[0] to specific person
        var allMeds = data.Items[0]["meds"].L;
        medNames = [];
        for (var i in allMeds) {
            var medInfo = allMeds[i].M;
            medNames.push(medInfo.name.S);
        }
        client_name = data.Items[0]["client_name"].S.split(" ");
        pills_left = data.Items[0]["times_left"].L;
        client_intervals = data.Items[0]["intervals"];
        alexa.registerHandlers(newSessionHandlers, startSessionHandlers, askSessionHandlers);
        alexa.execute();
    });
};

var newSessionHandlers = {
    'LaunchRequest': function() {
        this.handler.state = states.STARTMODE;
        output = "Hello, " + client_name[0] + ", " + welcomeReprompt;
        this.emit(':ask', output , welcomeReprompt);
    },
    'Unhandled': function () {
        this.emit(':ask', HelpMessage, HelpMessage);
    }
}
var startSessionHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'CheckIntent': function () {
        isDone = true;
        for (var x in pills_left){
            if (pills_left[x].N != 0) {
                isDone = false;
            } 
        }
        if (isDone) {
            appendMSG = "Congratulations! You've finished your medications for today."
            this.emit(':tell', appendMSG);
        } else {
            appendMSG = "Unfortunately, you still have unfinished medication. Would you like to know what medications you still have to take? "
            this.handler.state = states.ASKMODE;
            this.emit(':ask', appendMSG, medRemindReprompt);           
        }
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
        this.emit(':tell', goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
});
var askSessionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {
    'AMAZON.YesIntent': function () {
        medications = ""
        for (var i in medNames) {
            if (i < medNames.length - 1) {
                medications = medications + " " + pills_left[i].N.toString() + " doses of " + medNames[i] +",";
            } else {
                medications = medications + "and " + pills_left[i].N.toString() + " doses of " + medNames[i];
            }
        }
        this.emit(':tell', "You have " + medications + " left for today.")
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell', "Okay. Make sure to not forget your medication!")
    }
});

String.prototype.trunc =
    function (n) {
        return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
    };