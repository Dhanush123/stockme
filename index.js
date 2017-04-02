var builder = require('botbuilder');
var restify = require('restify');

var botConnectorOptions = {
  appId: "c8431942-19ab-42a1-b6c1-457eb8398648",
  appPassword: "HRAMtybh6ranrocPqi602U2"
}

var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);
var server = restify.createServer();

server.post("/api/messages",connector.listen());
server.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});

bot.dialog('/', [
   function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?");
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name +
                     " you've been programming for " + session.userData.coding +
                     " years and use " + session.userData.language + ".");
    }
]);
