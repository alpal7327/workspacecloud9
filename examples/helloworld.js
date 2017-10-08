//
// Copyright (c) 2016 Cisco Systems
// Licensed under the MIT License 
//

/* 
 * a Cisco Spark bot that:
 *   - sends a welcome message as he joins a room, 
 *   - answers to a /hello command, and greets the user that chatted him
 *   - supports /help and a fallback helper message
 *   - 
 * + leverages the "node-sparkclient" library for Bot to Cisco Spark communications.
 * 
 */
 
// A Cisco Spark bot that retrieves messages sent in a group and translates it to the requested language.

var SparkBot = require("node-sparkbot");
var bot = new SparkBot();
//bot.interpreter.prefix = "#"; // Remove comment to overlad default / prefix to identify bot commands

var SparkAPIWrapper = require("node-sparkclient");
if (!process.env.SPARK_TOKEN) {
    console.log("Could not start as this bot requires a Cisco Spark API access token.");
    console.log("Please add env variable SPARK_TOKEN on the command line");
    console.log("Example: ");
    console.log("> SPARK_TOKEN=XXXXXXXXXXXX DEBUG=sparkbot* node helloworld.js");
    process.exit(1);
}
var spark = new SparkAPIWrapper(process.env.SPARK_TOKEN);

// Various bot commands users can call

// Help command shows the syntax for typing in the chat if users want to translate something
bot.onCommand("help", function (command) {
    spark.createMessage(command.message.roomId, "Hi, I'm Poko-Translator. \n\nType in /translate <<source language>> <<target language>> <<message>> to be a boko.", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("ERROR: You're already a boko. Cannot post message to a poko chatroom: " + command.message.roomId);
            return;
        }
    });
});

// Fallback command is called when the user inputs an unsupported command.
bot.onCommand("fallback", function (command) {
    spark.createMessage(command.message.roomId, "Sorry kid, don't be a poko. We don't support this poko-feature.\n\nType /help to see REAL Poko-Translator syntax.", { "markdown":true }, function(err, response) {
        if (err) {
            console.log("ERROR: You're already a boko,. Cannot post message to a poko chatroom: " + command.message.roomId);
            return;
        }
    });
});

// Translate command takes in a phrase, source language, and target language, translates the phrase, and posts it to the chatroom.
bot.onCommand("translate", function (command) {
    var text = command.message.text; // Original text
    
    // Target language to translate to
    const target_lang = text.slice(11, 14);
    
    // Phrase we want to translate
    const phrase = text.slice(14, text.length);
    
    // Accessing Google API 
    // Imports the Google Cloud client library
    const Translate = require('@google-cloud/translate');
    
    // Instantiates a client
    const translate = Translate();
    
    // Translates the phrase from the source language into the target language.
    translate.translate(phrase, target_lang)
      .then((results) => {
        let translations = results[0];
        translations = Array.isArray(translations) ? translations : [translations];
    
        console.log('Translations:');
        translations.forEach((translation, i) => {
          console.log(`${phrase[i]} => (${target_lang}) ${translation}`);
        });
      })
      .catch((err) => {
        console.error('ERROR:', err);
      });
    
    spark.createMessage(command.message.roomId, "Hello <@personEmail:" + ">", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: EXTREME POKO ALERT IN ROOM: " + command.message.roomId);
            return;
        }
    });
});


//
// Welcome message 
// sent as the bot is added to a Room
//
bot.onEvent("memberships", "created", function (trigger) {
    var newMembership = trigger.data; // see specs here: https://developer.ciscospark.com/endpoint-memberships-get.html
    if (newMembership.personId != bot.interpreter.person.id) {
        // ignoring
        console.log("new membership fired, but it is not us being added to a room. Ignoring...");
        return;
    }

    // so happy to join
    console.log("bot's just added to room: " + trigger.data.roomId);
    
    spark.createMessage(trigger.data.roomId, "Hi, I am the Hello World bot !\n\nType /hello to see me in action.", { "markdown":true }, function(err, message) {
        if (err) {
            console.log("WARNING: could not post Hello message to room: " + trigger.data.roomId);
            return;
        }

        if (message.roomType == "group") {
            spark.createMessage(trigger.data.roomId, "**Note that this is a 'Group' room. I will wake up only when mentionned.**", { "markdown":true }, function(err, message) {
                if (err) {
                    console.log("WARNING: could not post Mention message to room: " + trigger.data.roomId);
                    return;
                }
            });
        }      
    }); 
});

