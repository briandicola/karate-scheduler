/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const activities = require('./activities');
const students = require('./students');
const scheds = require('./schedules');
const classes = require('./belt-age-class');
const belts = require('./belt-ranges');
const ages = require('./age-ranges');
const blackbelttests = require('blackbelttestschedule');
const beltpromotions = require('beltpromotionsschedule');

function convertDateToDay(date){
  console.log('Converting date ' + date + ' to day of the week');
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var now = new Date(date);
  var desiredDay = days[ now.getDay() ].toLowerCase();

  return desiredDay;
}

function handleActivityWithTime(activityWithTime, handlerInput){
  console.log('handling activity with time: ' + activityWithTime);
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  sessionAttributes.activityWithTime = activityWithTime;

  let speechOutput = GET_TIME_MESSAGE;

  return responseBuilder
  .speak(speechOutput)
  .reprompt(speechOutput)
  .getResponse();
}

function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
}

function handleTimes(times, handlerInput){
  console.log('times: ' + times);
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;

  let speechOutput = '';

  if(times === 'no times'){
    speechOutput = 'No times were found for this student.';
  }
  else{
    speechOutput = 'The following times were found:  ';
    var arrayLength = times.length;
    var hours;
    for (var i = 0; i < arrayLength; i++) {
      speechOutput += tConvert(times[i]) + ', ';
    }

    speechOutput += '.';
  }

  return responseBuilder
  .speak(speechOutput)
  .getResponse();
}

function handleActivity(activity, handlerInput){
  console.log('handling activity: ' + activity);

  let speechOutput = ACTIVITY_MESSAGE + activity;

  return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
}

function moreInfoNeeded(handlerInput){
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  const belt = sessionAttributes.belt;
  const age = sessionAttributes.age;
  const desiredDay = sessionAttributes.desiredDay;

  console.log('belt: ' + belt + ', ' + 'age: ' + age + ', desired day: ' + desiredDay);

  return !(age && belt && desiredDay);
}

function promptForInfo(handlerInput){
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  const belt = sessionAttributes.belt;
  const age = sessionAttributes.age;

  var speechOutput = '';

  if (!(belt != age)){
    //speechOutput = 'I\'ll need some more information from you.  ';
    speechOutput = '';
  }
  else{
   speechOutput = 'Great.  Now...';
  }

  if (!(age)){
    speechOutput += 'What is your age?  You can say my age is, and then your age.  ';
  }

  if (!(belt)){
    if (!(age)){
      speechOutput += 'Also.  ';
    }
    speechOutput += 'What is the color of your belt?  You can say my belt color is, and then your belt color.';
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(speechOutput)
    .getResponse();
}

function getBeltRange(belt){
  console.log('In getBeltRange.  Searching for belt: ' + belt);
  const myBeltRanges = belts.BELTS;

  for(let range in myBeltRanges) {
    console.log('range: ' + range.toUpperCase());
    console.log('belts in this range: ' + myBeltRanges[range]);
    let arrayLength = myBeltRanges[range].length;

      if(arrayLength != 0){
      for (let i = 0; i < arrayLength; i++) {
        console.log('belt color: ' + myBeltRanges[range][i]);
        if(myBeltRanges[range][i] == belt){
          return range;
        }
      }
    }
  }
  return 'belt range not found';
}

function getAgeRange(age){
  console.log('In getAgeRange.  Searching for age: ' + age);

  if(age >= 12){
      return '12-and-up';
  }

  const myAgeRanges = ages.AGES;

  for(let range in myAgeRanges) {
    console.log('range: ' + range.toUpperCase());
    console.log('ages in this range: ' + myAgeRanges[range]);

    let arrayLength = myAgeRanges[range].length;

    if(arrayLength != 0){
      for (let i = 0; i < arrayLength; i++) {
        console.log('age: ' + myAgeRanges[range][i]);
        if(myAgeRanges[range][i] == age){
          return range;
        }
      }
    }
  }

  return 'age range not found';
}

function getClassForBeltAndAge(handlerInput){
  // age range 6-8 (juniors) is currently not supported
  // we'd have to handle multiple matching age ranges because of the overlap

  const myClasses = classes.CLASSES;
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();

  const belt = sessionAttributes.belt;
  const age = sessionAttributes.age;

  let desiredBeltRange = getBeltRange(belt);
  console.log('desiredBeltRange is: ' + desiredBeltRange);
  if(desiredBeltRange === 'belt range not found'){
    return 'none';
  }

  let desiredAgeRange = getAgeRange(age);
  console.log('desiredAgeRange is: ' + desiredAgeRange);

  let objBelt = myClasses[desiredBeltRange];
  console.log('Type of objBelt is: ' + typeof objBelt);
  console.log('Keys of objBelt is: ' + Object.keys(objBelt));

  let objClass = objBelt[desiredAgeRange];

  console.log('Type of objClass is: ' + typeof objClass);
  //If only one belt range exists for this combination objClass is undefined, otherwise it is an object

  var foundClasses = '';

  if(typeof objClass != 'undefined'){
    let arrayLength = objClass.length;
    console.log('Number of classes for this belt and age: ' + arrayLength);

    if(arrayLength != 0){
      for (let i = 0; i < arrayLength; i++) {
        foundClasses += objClass[i] + ', ';
      }
    }
  }
  else{
    foundClasses = 'none';
  }

  return foundClasses;
}

function returnActivity(handlerInput){
  const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;

   //At this point we should have belt and age, which is enough to find the students class (beginners, advanced etc.)
  let desiredClass = getClassForBeltAndAge(handlerInput);

  let speechOutput = '';

  if(desiredClass === 'none'){
    speechOutput = 'Sorry.  No classes were found.';
  }
  else{
    speechOutput = 'Based on your belt and age, you can attend the following classes: ' + desiredClass + '.  ';
    speechOutput += 'Which class would you like to search for?  You can say search for and then the class name.';
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(speechOutput)
    .getResponse();
}

function validateClassAndDay(desiredClass, desiredDay){
  const mySchedules = scheds.SCHEDS;
  console.log('desired class ' + desiredClass)

  if ( (typeof desiredClass === 'undefined') ||
        (typeof desiredDay === 'undefined') ){
    return false;
  }

  if( typeof mySchedules[desiredClass] === 'undefined'){
    return false;
  }

  let objClass = mySchedules[desiredClass];

  if ( typeof objClass[desiredDay] === 'undefined'){
    return false;
  }

  return true;
}

function handleClassAndDay(handlerInput, desiredClass, desiredDay, gpp){
  const mySchedules = scheds.SCHEDS;
  let objClass = mySchedules[desiredClass];
  let objDay = objClass[desiredDay];
  let arrayLength = objDay.length;

  let speechOutput = 'Checking schedule for ' + desiredClass + ' class on ' + desiredDay + '.  ';

  if(arrayLength != 0){
    speechOutput += getResultMessage(gpp);
    for (let i = 0; i < arrayLength; i++) {
      speechOutput += objDay[i] + ', ';
    }
  }
  else{
    speechOutput += 'No times found.';
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(CONTINUE_MESSAGE)
    .getResponse();
}

function getResultMessage(gpp){
  let msgArr = STANDARD_RESULT_MESSAGES;

  if(gpp){
    msgArr = GPP_RESULT_MESSAGES;
  }

  const msgIndex = Math.floor(Math.random() * msgArr.length);
  const randomMsg = msgArr[msgIndex];
  return randomMsg;
}

function getErrorMessage(gpp){
  let msgArr = STANDARD_ERROR_MESSAGES;

  if(gpp){
    msgArr = GPP_ERROR_MESSAGES;
  }

  const msgIndex = Math.floor(Math.random() * msgArr.length);
  const randomMsg = msgArr[msgIndex];
  return randomMsg;
}

const GetScheduleByClassTodayIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'GetScheduleByClassTodayIntent');
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager} = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const speechOutput = 'Please check classname and day';

    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var now = new Date();
    var desiredDay = days[ now.getDay() ].toLowerCase();
    console.log('In  GetScheduleByClassTodayIntentHandler');

    if (validateClassAndDay(intent.slots.class_name.value.toLowerCase(),desiredDay)){
      return handleClassAndDay(handlerInput,
                                intent.slots.class_name.value.toLowerCase(),
                                desiredDay,
                                sessionAttributes.gpp);
    }
    else{
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    }
  },
};

const GetScheduleByClassAndDayIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'GetScheduleByClassAndDayIntent');
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();
    console.log('In GetScheduleByClassAndDayIntent');

    const speechOutput = 'Please check class name and day';

    if (validateClassAndDay(intent.slots.class_name.value.toLowerCase(),
                              intent.slots.day.value.toLowerCase())){
      return handleClassAndDay(handlerInput,
                                intent.slots.class_name.value.toLowerCase(),
                                intent.slots.day.value.toLowerCase(),
                                sessionAttributes.gpp);
    }
    else{
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    }
  },
};

const GetScheduleByClassAndDateIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'GetScheduleByClassAndDateIntent');
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    console.log('In GetScheduleByClassAndDateIntentHandler');

    const speechOutput = 'Please check classname and day';

    let day = convertDateToDay(intent.slots.date.value.toLowerCase());

    if (validateClassAndDay(intent.slots.class_name.value.toLowerCase(), day)){
      return handleClassAndDay(handlerInput,
                                intent.slots.class_name.value.toLowerCase(),
                                day,
                                sessionAttributes.gpp);
    }
    else{
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    }
  },
};

const WelcomeHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
  },
  handle(handlerInput) {

    const speechOutput = WELCOME_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const OpenIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'OpenIntent';
  },
  handle(handlerInput) {

    const speechOutput = 'Karate scheduler is already open.  ' + CONTINUE_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};


const FindActivityIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'FindActivityIntent');
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();
    console.log('In FindActivityIntentHandler');

    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var now = new Date();
    var desiredDay = days[ now.getDay() ].toLowerCase();
    sessionAttributes.desiredDay = desiredDay;

    const speechOutput = FINDACTIVITY_MESSAGE;

    if(moreInfoNeeded(handlerInput)){
      return promptForInfo(handlerInput);
    }
    else{
      return returnActivity(handlerInput);
    }
  },
};

const SetBeltIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'SetBeltIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.belt = intent.slots.color.value;

    if(moreInfoNeeded(handlerInput)){
      return promptForInfo(handlerInput);
    }
    else{
      return returnActivity(handlerInput);
    }
  },
};

const SetAgeIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'SetAgeIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.age = intent.slots.age.value;

    if(moreInfoNeeded(handlerInput)){
      return promptForInfo(handlerInput);
    }
    else{
      return returnActivity(handlerInput);
    }
  },
};

const SetAgeAndBeltIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'SetAgeAndBeltIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.age = intent.slots.age.value;
    sessionAttributes.belt = intent.slots.color.value;

    if(moreInfoNeeded(handlerInput)){
      return promptForInfo(handlerInput);
    }
    else{
      return returnActivity(handlerInput);
    }
  },
};

const FindActivityByDayIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'FindActivityByDayIntent');
  },
  handle(handlerInput) {

    const speechOutput = GET_DAY_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const FindActivityByStudentIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return (request.type === 'IntentRequest'
        && request.intent.name === 'FindActivityByStudentIntent');
  },
  handle(handlerInput) {

    const speechOutput = GET_STUDENT_MESSAGE;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const GetStudentIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'GetStudentIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;

    let desiredStudent = intent.slots.student.value;
    console.log('desiredStudent: ' + desiredStudent.toUpperCase());

    var times = "no times";
    for(let student in students.STUDENTS) {
      console.log('student: ' + student.toUpperCase());
      if (student.toUpperCase() === desiredStudent.toUpperCase()) {
        console.log('found student: ' + student.toUpperCase());
        times = students.STUDENTS[student];
        break;
      }
    }

    return handleTimes(times, handlerInput);
  },
};

const GetDayIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'GetDayIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;

    let desiredDay = intent.slots.day.value;

    var activityWithTime = "no activities";
    for(let day in activities.ACTIVITIES) {

      if (day.toUpperCase() === desiredDay.toUpperCase()) {
        activityWithTime = activities.ACTIVITIES[day];
        break;
      }
    }

    return handleActivityWithTime(activityWithTime, handlerInput);
  },
};

const GetTimeIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'GetTimeIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    let activityWithTime = sessionAttributes.activityWithTime;
    console.log('activityWithTime: ' + activityWithTime);
    let desiredTime = intent.slots.time.value;

    var activity = "no activity";
    for(let time in activityWithTime) {
      console.log('time: ' + time + ', desiredTime: ' + desiredTime);

      if (time === desiredTime) {
        activity = activityWithTime[time];
        break;
      }
    }

    return handleActivity(activity, handlerInput);
  },
};

const GPPIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'GPPIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    let toggle_value = intent.slots.toggle.value;
    let speechOutput = toggle_value + '-ing GPP';

    if(toggle_value == 'enable'){
      sessionAttributes.gpp = true;
    }
    else if(toggle_value == 'disable'){
      sessionAttributes.gpp = false;
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(CONTINUE_MESSAGE)
      .getResponse();
  },
};

const ResetIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'ResetIntent';
  },
  handle(handlerInput) {
    const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
    const { intent } = requestEnvelope.request;
    const sessionAttributes = attributesManager.getSessionAttributes();

    let reset_value = intent.slots.reset_value.value;
    let speechOutput = 'Resetting ' + reset_value;

    if(reset_value == 'age'){
      sessionAttributes.age = null;
    }
    else if(reset_value == 'belt'){
      sessionAttributes.belt = null;
    }
    else{
      sessionAttributes.age = null;
      sessionAttributes.belt = null;
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(CONTINUE_MESSAGE)
      .getResponse();
  },
};

const BlackBeltTestIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'BlackBeltTestIntent';
  },
  handle(handlerInput) {
    const speechOutput = 'The next black belt test is: ' + blackbelttests.BLACKBELTTESTS[0];

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const BeltPromotionIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'BeltPromotionIntent';
  },
  handle(handlerInput) {
    const speechOutput = 'The next belt promotion is: ' + beltpromotions.BELTPROMOTIONS[0];

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('Error handled: ' + error.message);
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(getErrorMessage(sessionAttributes.gpp))
      .reprompt(getErrorMessage(false))
      .getResponse();
  },
};

const SKILL_NAME = 'karate scheduler';
const WELCOME_MESSAGE = 'Welcome to the karate scheduler.  For help say help.';
const GET_DAY_MESSAGE = 'Please provide the day of the week for your activity.';
const GET_STUDENT_MESSAGE = 'I will find an activity happening today for the student name you provide.  What is the students name?'
const GET_TIME_MESSAGE = 'Please provide the time for your activity, specifying AM or PM.';
const LIST_TIMES_MESSAGE = 'The following times are available for your student: ';
const ACTIVITY_MESSAGE = 'Your activity is: ';
const FINDACTIVITY_MESSAGE = 'Checking schedule.';
const HELP_MESSAGE = 'Karate scheduler help.  You can use this skill to find karate classes.  To exit say exit.  Here are some things you can try.  What time do I have karate today?  Is there a beginners class on Friday?  What time is my advanced class today?  What time is my little champions class on December 1st?  Reset my age and belt.  Enable Genuine People Personality.';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';
const CONTINUE_MESSAGE = 'To continue try asking the scheduler something else.  Or you can say help or exit.'
const CANT_HANDLE_MESSAGE = 'The karate scheduler can not handle this request.  Please refer to the schedule provided by your school.'
const STANDARD_ERROR_MESSAGES = ['Sorry.  An error occurred.'];
const GPP_ERROR_MESSAGES = [
  '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_01"/><say-as interpret-as="interjection">argh!</say-as>  What was that?',
  '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_negative_response_02"/><say-as interpret-as="interjection">ahem!</say-as>  What did you just say?',
  '<audio src="soundbank://soundlibrary/human/amzn_sfx_clear_throat_ahem_01"/><say-as interpret-as="interjection">aw man!</say-as>  Can you say that again?',
  '<audio src="soundbank://soundlibrary/human/amzn_sfx_baby_fuss_01"/><say-as interpret-as="interjection">baa!</say-as>  I\'m not sure what you mean.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_incoming_explosion_01"/><say-as interpret-as="interjection">blah!</say-as>  Sorry, I\'m not sure.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_02"/><say-as interpret-as="interjection">blarg!</say-as>  What was that?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_03"/><say-as interpret-as="interjection">blast!</say-as>  What did you just say?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_2x_01"/><say-as interpret-as="interjection">boo!</say-as>  Can you say that again?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_incoming_explosion_01"/><say-as interpret-as="interjection">boo hoo!</say-as>  I\'m not sure what you mean.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_01"/><say-as interpret-as="interjection">bummer!</say-as>  Sorry, I\'m not sure.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_incoming_explosion_01"/><say-as interpret-as="interjection">darn!</say-as>  What was that?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_2x_01"/><say-as interpret-as="interjection">d’oh!</say-as>  What did you just say?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_02"/><say-as interpret-as="interjection">dun dun dun!</say-as>  Can you say that again?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_01"/><say-as interpret-as="interjection">eek!</say-as>  I\'m not sure what you mean.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_03"/><say-as interpret-as="interjection">good grief!</say-as>  Sorry, I\'m not sure.',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_explosion_03"/><say-as interpret-as="interjection">great scott!</say-as>  What was that?',
  '<audio src="soundbank://soundlibrary/scifi/amzn_sfx_scifi_incoming_explosion_01"/><say-as interpret-as="interjection">ahem!</say-as>  What did you just say?',
];
const STANDARD_RESULT_MESSAGES = ['Here\'s the result:  '];
const GPP_RESULT_MESSAGES = [
  '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_01"/><say-as interpret-as="interjection">bingo!</say-as>  Here\'s the result:  ',
  '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02"/><say-as interpret-as="interjection">booya!</say-as>  Here ya go:  ',
  '<audio src="soundbank://soundlibrary/human/amzn_sfx_crowd_applause_01"/><say-as interpret-as="interjection">aha!</say-as>  Here\'s something:  ',
  '<audio src="soundbank://soundlibrary/human/amzn_sfx_large_crowd_cheer_01"/><say-as interpret-as="interjection">all righty!</say-as>  Found something for you:  ',
  '<audio src="soundbank://soundlibrary/musical/amzn_sfx_drum_and_cymbal_01"/><say-as interpret-as="interjection">bam!</say-as>  Got it:  ',
  '<audio src="soundbank://soundlibrary/musical/amzn_sfx_electric_guitar_01"/><say-as interpret-as="interjection">bang!</say-as>  <say-as interpret-as="interjection">laugh</say-as> Just messing with you.  Here is your result:  ',
];

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GPPIntentHandler,
    ResetIntentHandler,
    BeltPromotionIntentHandler,
    BlackBeltTestIntentHandler,
    OpenIntentHandler,
    WelcomeHandler,
    GetScheduleByClassAndDayIntentHandler,
    GetScheduleByClassAndDateIntentHandler,
    GetScheduleByClassTodayIntentHandler,
    FindActivityIntentHandler,
    SetAgeIntentHandler,
    SetAgeAndBeltIntentHandler,
    SetBeltIntentHandler,
    FindActivityByDayIntentHandler,
    FindActivityByStudentIntentHandler,
    GetStudentIntentHandler,
    GetDayIntentHandler,
    GetTimeIntentHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
