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

var promptQuestion = ["Do you have another question you'd like me to answer?", "Is there another question you'd like to ask?", "Is there anything else you want to ask?",
"Do you have another question?", "What else can I do for you?"];

var goodbyeMessage = "OK, good bye.";

var newline = "\n";

var output = "";

var alexa;

var pills_left;

var client_intervals;

var medNames;

var nodeNum;

var medications;

var pharmacyInformation;

var doctorInformation;

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
        pharmacyInformation = data.Items[0]["pharmacy"];
        doctorInformation = data.Items[0]["doctor"];
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
            output = "Congratulations! You've finished your medications for today. "
            var promptIndex = Math.floor(Math.random() * promptQuestion.length);
            this.emit(':ask', output + promptQuestion[promptIndex], promptQuestion[promptIndex]);
        } else {
            appendMSG = "Unfortunately, you still have unfinished medications. Would you like to know what medications you still have to take? "
            this.handler.state = states.ASKMODE;
            nodeNum = 0;
            this.emit(':ask', appendMSG, medRemindReprompt);           
        }
    },
    'ConfirmAdherenceIntent': function () {
        output = "Confirm. ";
        this.emit(':tell', output);
    },
    'DoctorContactIntent': function(){
        output = "I am sending an SMS to your doctor. ";
        var promptIndex = Math.floor(Math.random() * promptQuestion.length);
        this.emit(':ask', output + promptQuestion[promptIndex], promptQuestion[promptIndex]);
    },
    'DoctorIntent': function(){
        output = doctorInformation;
        var promptIndex = Math.floor(Math.random() * promptQuestion.length);
        this.emit(':ask', output + promptQuestion[promptIndex], promptQuestion[promptIndex]);
    },
    'ManualAdherenceIntent': function(){
        output = "ignore this";
        this.emit(':tell', output);
    },
    'NextDoseIntent': function(){
        output = "Your next dose is scheduled at " +  "";
        this.emit(':tell', output);
    },
    'PharmacyInfoIntent': function(){
        output = pharmacyInformation;
        var promptIndex = Math.floor(Math.random() * promptQuestion.length);
        this.emit(':ask', output + promptQuestion[promptIndex], promptQuestion[promptIndex]);
    },
    'RefillIntent': function(){
        output = "I refilled your prescription. You should get a confirmation soon.";
        var promptIndex = Math.floor(Math.random() * promptQuestion.length);
        this.emit(':ask', output + promptQuestion[promptIndex], promptQuestion[promptIndex]);    },
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
    'AMAZON.YesIntent': function () {
        response = "Awesome. What question would you like me to answer?";
        this.emit(':ask',response, HelpMessage);
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell',goodbyeMessage);
    },
    'Unhandled': function () {
        this.emit(':ask', HelpMessage, welcomeReprompt);
    },
});
var askSessionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {
    'AMAZON.YesIntent': function () {
        var response;
        var promptIndex;
        switch(nodeNum) {
            case 0:
                medications = ""
                for (var i in medNames) {
                    if (i < medNames.length - 1) {
                        medications = medications + " " + pills_left[i].N.toString() + " doses of " + medNames[i] +",";
                    } else {
                        medications = medications + "and " + pills_left[i].N.toString() + " doses of " + medNames[i];
                    }
                }
                promptIndex = Math.floor(Math.random() * promptQuestion.length);
                response = "You have " + medications + " left for today. " + promptQuestion[promptIndex];
                break;
        }
        this.handler.state = states.STARTMODE;
        nodeNum = 0;
        this.emit(':ask',response, promptQuestion[promptIndex])
    },
    'AMAZON.NoIntent': function () {
        this.emit(':tell', "Okay. Make sure to not forget!")
    }
});

String.prototype.trunc =
    function (n) {
        return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
    };