// Lambda Function code for Alexa.
// Paste this into your index.js file.

const Alexa = require("ask-sdk");
const https = require("https");

const invocationName = "dementia scotland";

// Session Attributes
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.

function getMemoryAttributes() {
  const memoryAttributes = {
    history: [],

    // The remaining attributes will be useful after DynamoDB persistence is configured
    launchCount: 0,
    lastUseTimestamp: 0,

    lastSpeechOutput: {},
    nextIntent: []

    // "favoriteColor":"",
    // "name":"",
    // "namePronounce":"",
    // "email":"",
    // "mobileNumber":"",
    // "city":"",
    // "state":"",
    // "postcode":"",
    // "birthday":"",
    // "bookmark":0,
    // "wishlist":[],
  };
  return memoryAttributes;
}

const maxHistorySize = 20; // remember only latest 20 intents

// 1. Intent Handlers =============================================

const AMAZON_FallbackIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let previousSpeech = getPreviousSpeechOutput(sessionAttributes);

    return responseBuilder
      .speak(
        "Sorry I didnt catch what you said, " +
          stripSpeak(previousSpeech.outputSpeech)
      )
      .reprompt(stripSpeak(previousSpeech.reprompt))
      .getResponse();
  }
};

const AMAZON_CancelIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.CancelIntent"
    );
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = "Okay, talk to you later! ";

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const AMAZON_HelpIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let intents = getCustomIntents();
    let sampleIntent = randomElement(intents);

    let say = "You asked for help. ";

    // let previousIntent = getPreviousIntent(sessionAttributes);
    // if (previousIntent && !handlerInput.requestEnvelope.session.new) {
    //     say += 'Your last intent was ' + previousIntent + '. ';
    // }
    // say +=  'I understand  ' + intents.length + ' intents, '

    say +=
      " Here something you can ask me, " + getSampleUtterance(sampleIntent);

    return responseBuilder
      .speak(say)
      .reprompt("try again, " + say)
      .getResponse();
  }
};

const AMAZON_StopIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.StopIntent"
    );
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = "Okay, talk to you later! ";

    return responseBuilder
      .speak(say)
      .withShouldEndSession(true)
      .getResponse();
  }
};

const AMAZON_NavigateHomeIntent_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.NavigateHomeIntent"
    );
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const responseBuilder = handlerInput.responseBuilder;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let say = "Hello from AMAZON.NavigateHomeIntent. ";

    return responseBuilder
      .speak(say)
      .reprompt("try again, " + say)
      .getResponse();
  }
};


const LaunchRequest_Handler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;

    let say =
      "hello" +
      " and welcome to " +
      invocationName +
      ' ! I can tell you about the support options, events and activities by Alzheimer Scotland, or help by giving you the answer to some of the common questions about Dementia. What would you like to know more about?';
    let skillTitle = capitalize(invocationName);

    return responseBuilder
      .speak(say)
      .reprompt("try again, " + say)
      .withStandardCard(
        "Welcome!",
        "Hello!\nThis is a card for your skill, " + skillTitle,
        welcomeCardImg.smallImageUrl,
        welcomeCardImg.largeImageUrl
      )
      .getResponse();
  }
};

////// Conversation Tree starts here ////////

const makeHandler = (GetFunctionName, sayValue) => {
  return {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return (
        request.type === "IntentRequest" &&
        request.intent.name === GetFunctionName
      );
    },
    handle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      const responseBuilder = handlerInput.responseBuilder;
      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      let say = sayValue;

      return responseBuilder
        .speak(say)
        .reprompt("try again, " + say)
        .getResponse();
    }
  };
};

const GetSupportOptions_Handler = makeHandler(
  "GetSupportOptions",
  "Alzheimer Scotland offers support via a 24 Hour Helpline, a website, Scotland-wide Resource Centres, and support events. Which one would you like to know more about?"
);

const GetPhoneNumber_Handler = makeHandler(
  "GetPhoneNumber",
  'You can call the 24 hour freephone Dementia Helpline on zero, eight, zero, eight, eight, zero, eight, three, zero, zero, zero.'
);

const GetWebsite_Handler = makeHandler(
  "GetWebsite",
  "The website is www.alzscot.org."
);

const GetResourceCentre_Handler = makeHandler(
  "GetResourceCentre",
  "The nearest resource centre to you is: The Prentice Centre, 1 Granton Mains, Edinburgh, EH4 4GA."
);

const GetActivities_Handler = makeHandler(
  "GetActivities",
  "In your area there is the Singing Group for People with Dementia and their Carers, The Dementia Cafe, The Oasis Cafe, The Sunflower Cafe."
);

const GetSingingGroup_Handler = makeHandler(
  "GetSingingGroup",
  "This happens on Wednesday the 10th and 24th of April at Fairmilehead Parish Church Hall, 1a Frogston Road West, Edinburgh, EH10 7AA. You can contact  Anne Sommerville on 0131 447 5132 or Moira Pate 0131 667 8336 for more information."
);

const GetDementiaCafe_Handler = makeHandler(
  "GetDementiaCafe",
  "This happens on Wednesday the 10th and 24th of April at 12 noon to 2.30pm in Dalkeith Baptist Church, North Wynd (the lane between Nationwide and Halifax Bank of Scotland, off High Street)."
);

const GetOasisCafe_Handler = makeHandler(
  "GetOasisCafe",
  "This happens on Friday 12th April at 2 o’clock in the afternoon at Meadowbank Church of Scotland, 83 London Road, Edinburgh, EH7 5TT. For more information call 0131 551 9350."
);

const GetSunflowerCafe_Handler = makeHandler(
  "GetSunflowerCafe",
  "This happens on Wednesday 17th of April from 2 till 3.30 pm at Palmerston Place Church, 10 Palmerston Place, Edinburgh, EH12 5AA. For more information call 0131 220 1690."
);

const GetCommonQuestions_Handler = makeHandler(
  "GetCommonQuestions",
  "The topics of the most common questions regarding Dementia  <break time='0.05s' /> are: Diagnosis, Medication, Prognosis, Support Options, and Financial or Legal options . Which one are you interested in?"
);

const GetDiagnosisQuestions_Handler = makeHandler(
  "GetDiagnosisQuestions",
  "Those who are recently diagnosed with Dementia often ask about the difference between Dementia and Alzheimers, and whether dementia is heredetary. Which are you interested in?"
);

const GetDifferenceBetweenDementiaAndAlzheimersAnswer_Handler = makeHandler(
  "GetDifferenceBetweenDementiaAndAlzheimersAnswer",
  "Dementia is the umbrella term, and there are many types of dementia. Alzheimers is the most common type of dementia, followed closely by vascular dementia and less common types such as Lewy Body or Frontal Temporal Dementia."
);

const GetIsDementiaHeredetaryAnswer_Handler = makeHandler(
  "GetIsDementiaHeredetaryAnswer",
  "In most cases dementia is not inherited. However, in some rare cases, a parent may pass a gene that increases the risk of developing dementia. If someone has developed dementia at an earlier age (under 60 years old), then there is a greater chance that it may be a type of dementia that can be passed on."
);

const GetMedicationQuestions_Handler = makeHandler(
  "GetMedicationQuestions",
  "Those who are recently diagnosed with Dementia often ask about what medication is available, and about how it will help them live with the condition. Ask me about either of these."
);

const GetWhatMedicationExistsQuestion_Handler = makeHandler(
  "GetWhatMedicationExistsQuestion",
  "There are different types of medication available for treating Dementia. Which medication a person can take depends on the type of dementia that they have. For more information, contact Alzheimer Scotland through one of the support options."
);




/////// Conversation Tree Ends /////////



const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${
        handlerInput.requestEnvelope.request.reason
      }`
    );
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Error handled: ${error.message}`);
    // console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);

    return handlerInput.responseBuilder
      .speak("Sorry, an error occurred.  Please say again.")
      .reprompt("Sorry, an error occurred.  Please say again.")
      .getResponse();
  }
};

// 2. Constants ===========================================================================

// Here you can define static data, to be used elsewhere in your code.  For example:
//    const myString = "Hello World";
//    const myArray  = [ "orange", "grape", "strawberry" ];
//    const myObject = { "city": "Boston",  "state":"Massachusetts" };

const APP_ID = undefined; // TODO replace with your Skill ID (OPTIONAL).

// 3.  Helper Functions ===================================================================

function capitalize(myString) {
  return myString.replace(/(?:^|\s)\S/g, function(a) {
    return a.toUpperCase();
  });
}

function randomElement(myArray) {
  return myArray[Math.floor(Math.random() * myArray.length)];
}

function stripSpeak(str) {
  return str.replace("<speak>", "").replace("</speak>", "");
}

function getSlotValues(filledSlots) {
  const slotValues = {};

  Object.keys(filledSlots).forEach(item => {
    const name = filledSlots[item].name;

    if (
      filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code
    ) {
      switch (
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code
      ) {
        case "ER_SUCCESS_MATCH":
          slotValues[name] = {
            heardAs: filledSlots[item].value,
            resolved:
              filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0]
                .value.name,
            ERstatus: "ER_SUCCESS_MATCH"
          };
          break;
        case "ER_SUCCESS_NO_MATCH":
          slotValues[name] = {
            heardAs: filledSlots[item].value,
            resolved: "",
            ERstatus: "ER_SUCCESS_NO_MATCH"
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        heardAs: filledSlots[item].value,
        resolved: "",
        ERstatus: ""
      };
    }
  }, this);

  return slotValues;
}

function getExampleSlotValues(intentName, slotName) {
  let examples = [];
  let slotType = "";
  let slotValuesFull = [];

  let intents = model.interactionModel.languageModel.intents;
  for (let i = 0; i < intents.length; i++) {
    if (intents[i].name == intentName) {
      let slots = intents[i].slots;
      for (let j = 0; j < slots.length; j++) {
        if (slots[j].name === slotName) {
          slotType = slots[j].type;
        }
      }
    }
  }
  let types = model.interactionModel.languageModel.types;
  for (let i = 0; i < types.length; i++) {
    if (types[i].name === slotType) {
      slotValuesFull = types[i].values;
    }
  }

  examples.push(slotValuesFull[0].name.value);
  examples.push(slotValuesFull[1].name.value);
  if (slotValuesFull.length > 2) {
    examples.push(slotValuesFull[2].name.value);
  }

  return examples;
}

function sayArray(myData, penultimateWord = "and") {
  let result = "";

  myData.forEach(function(element, index, arr) {
    if (index === 0) {
      result = element;
    } else if (index === myData.length - 1) {
      result += ` ${penultimateWord} ${element}`;
    } else {
      result += `, ${element}`;
    }
  });
  return result;
}
function supportsDisplay(handlerInput) {
  // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.)
  //  Enable your skill for display as shown here: https://alexa.design/enabledisplay
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces
      .Display;

  return hasDisplay;
}

const welcomeCardImg = {
  smallImageUrl:
    "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png",
  largeImageUrl:
    "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png"
};

const DisplayImg1 = {
  title: "Jet Plane",
  url: "https://s3.amazonaws.com/skill-images-789/display/plane340_340.png"
};
const DisplayImg2 = {
  title: "Starry Sky",
  url:
    "https://s3.amazonaws.com/skill-images-789/display/background1024_600.png"
};

function getCustomIntents() {
  const modelIntents = model.interactionModel.languageModel.intents;

  let customIntents = [];

  for (let i = 0; i < modelIntents.length; i++) {
    if (
      modelIntents[i].name.substring(0, 7) != "AMAZON." &&
      modelIntents[i].name !== "LaunchRequest"
    ) {
      customIntents.push(modelIntents[i]);
    }
  }
  return customIntents;
}

function getSampleUtterance(intent) {
  return randomElement(intent.samples);
}

function getPreviousIntent(attrs) {
  if (attrs.history && attrs.history.length > 1) {
    return attrs.history[attrs.history.length - 2].IntentRequest;
  } else {
    return false;
  }
}

function getPreviousSpeechOutput(attrs) {
  if (attrs.lastSpeechOutput && attrs.history.length > 1) {
    return attrs.lastSpeechOutput;
  } else {
    return false;
  }
}

function timeDelta(t1, t2) {
  const dt1 = new Date(t1);
  const dt2 = new Date(t2);
  const timeSpanMS = dt2.getTime() - dt1.getTime();
  const span = {
    timeSpanMIN: Math.floor(timeSpanMS / (1000 * 60)),
    timeSpanHR: Math.floor(timeSpanMS / (1000 * 60 * 60)),
    timeSpanDAY: Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)),
    timeSpanDesc: ""
  };

  if (span.timeSpanHR < 2) {
    span.timeSpanDesc = span.timeSpanMIN + " minutes";
  } else if (span.timeSpanDAY < 2) {
    span.timeSpanDesc = span.timeSpanHR + " hours";
  } else {
    span.timeSpanDesc = span.timeSpanDAY + " days";
  }

  return span;
}

const InitMemoryAttributesInterceptor = {
  process(handlerInput) {
    let sessionAttributes = {};
    if (handlerInput.requestEnvelope.session["new"]) {
      sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      let memoryAttributes = getMemoryAttributes();

      if (Object.keys(sessionAttributes).length === 0) {
        Object.keys(memoryAttributes).forEach(function(key) {
          // initialize all attributes from global list

          sessionAttributes[key] = memoryAttributes[key];
        });
      }
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
  }
};

const RequestHistoryInterceptor = {
  process(handlerInput) {
    const thisRequest = handlerInput.requestEnvelope.request;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let history = sessionAttributes["history"] || [];

    let IntentRequest = {};
    if (thisRequest.type === "IntentRequest") {
      let slots = [];

      IntentRequest = {
        IntentRequest: thisRequest.intent.name
      };

      if (thisRequest.intent.slots) {
        for (let slot in thisRequest.intent.slots) {
          let slotObj = {};
          slotObj[slot] = thisRequest.intent.slots[slot].value;
          slots.push(slotObj);
        }

        IntentRequest = {
          IntentRequest: thisRequest.intent.name,
          slots: slots
        };
      }
    } else {
      IntentRequest = { IntentRequest: thisRequest.type };
    }
    if (history.length > maxHistorySize - 1) {
      history.shift();
    }
    history.push(IntentRequest);

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
  }
};

const RequestPersistenceInterceptor = {
  process(handlerInput) {
    if (handlerInput.requestEnvelope.session["new"]) {
      return new Promise((resolve, reject) => {
        handlerInput.attributesManager
          .getPersistentAttributes()

          .then(sessionAttributes => {
            sessionAttributes = sessionAttributes || {};

            sessionAttributes["launchCount"] += 1;

            handlerInput.attributesManager.setSessionAttributes(
              sessionAttributes
            );

            handlerInput.attributesManager
              .savePersistentAttributes()
              .then(() => {
                resolve();
              })
              .catch(err => {
                reject(err);
              });
          });
      });
    } // end session['new']
  }
};

const ResponseRecordSpeechOutputInterceptor = {
  process(handlerInput, responseOutput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let lastSpeechOutput = {
      outputSpeech: responseOutput.outputSpeech.ssml,
      reprompt: responseOutput.reprompt.outputSpeech.ssml
    };

    sessionAttributes["lastSpeechOutput"] = lastSpeechOutput;

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
  }
};

const ResponsePersistenceInterceptor = {
  process(handlerInput, responseOutput) {
    const ses =
      typeof responseOutput.shouldEndSession == "undefined"
        ? true
        : responseOutput.shouldEndSession;

    if (
      ses ||
      handlerInput.requestEnvelope.request.type == "SessionEndedRequest"
    ) {
      // skill was stopped or timed out

      let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

      sessionAttributes["lastUseTimestamp"] = new Date(
        handlerInput.requestEnvelope.request.timestamp
      ).getTime();

      handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);

      return new Promise((resolve, reject) => {
        handlerInput.attributesManager
          .savePersistentAttributes()
          .then(() => {
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  }
};

// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    AMAZON_FallbackIntent_Handler,
    AMAZON_CancelIntent_Handler,
    AMAZON_HelpIntent_Handler,
    AMAZON_StopIntent_Handler,
    AMAZON_NavigateHomeIntent_Handler,
    GetSupportOptions_Handler,
    GetPhoneNumber_Handler,
    GetWebsite_Handler,
    GetResourceCentre_Handler,
    GetActivities_Handler,
    GetSingingGroup_Handler,
    GetDementiaCafe_Handler,
    GetOasisCafe_Handler,
    GetSunflowerCafe_Handler,
    GetCommonQuestions_Handler,
    GetDiagnosisQuestions_Handler,
    GetDifferenceBetweenDementiaAndAlzheimersAnswer_Handler,
    GetIsDementiaHeredetaryAnswer_Handler,
    GetMedicationQuestions_Handler,
    GetWhatMedicationExistsQuestion_Handler,
    LaunchRequest_Handler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(InitMemoryAttributesInterceptor)
  .addRequestInterceptors(RequestHistoryInterceptor)

  // .addResponseInterceptors(ResponseRecordSpeechOutputInterceptor)

  // .addRequestInterceptors(RequestPersistenceInterceptor)
  // .addResponseInterceptors(ResponsePersistenceInterceptor)

  // .withTableName("askMemorySkillTable")
  // .withAutoCreateTable(true)

  .lambda();
