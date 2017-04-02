var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');
var fs = require('fs');
// Imports the Google Cloud client library
const Vision = require('@google-cloud/vision');

// Instantiates a client
const vision = Vision();

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

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/464a8df5-febf-410f-b18f-b3d9d7239013?subscription-key=c83e960c6e4a4807902c0e4c68148196&timezoneOffset=0.0&verbose=true&q=';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

dialog.matches('Greeting',[
   function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.attachment(session, "Hi " + results.response + "What picture would you like me to analyze for a logo?");
    },
    function (session, results) {
      console.log(results);

      var download = function(uri, filename, callback){
        request.head(uri, function(err, res, body){
          console.log('content-type:', res.headers['content-type']);
          console.log('content-length:', res.headers['content-length']);

          request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
      };

      download('https://www.google.com/images/srpr/logo3w.png', 'imgy.png', function(){
        console.log('done');
      // The path to the local image file, e.g. "/path/to/image.png"
      // const fileName = '/path/to/image.png';

      // Performs logo detection on the local file
      vision.detectLogos("imgy.png")
        .then((results) => {
          const logos = results[0];

          console.log('Logos:');
          logos.forEach((logo) => console.log(logo));
        });
        // var options = { method: 'POST',
        //   url: 'https://vision.googleapis.com/v1/images:annotate',
        //   qs: { key: 'AIzaSyCVP_E8hjQHzd4nRAC9wrnFfpzkvOuypl4' },
        //   headers:
        //    {
        //      accept: 'application/json',
        //      'content-type': 'application/json' },
        //   body:
        //    { requests:
        //       [ { features: [ { type: 'LOGO_DETECTION', maxResults: 3 } ],
        //           image: { source: { imageUri: 'imgy.png' } } } ] },
        //   json: true };
        // //results.response.contentUrl
        // request(options, function (error, response, body) {
        //   if (error) throw new Error("GOOGLE ERROR: " + error);
        //
        //   console.log("GOOGLE BODY1: "+JSON.stringify(body));
        //   console.log("GOOGLE BODY2: "+JSON.stringify(body.responses));
        //   // console.log("GOOGLE BODY3: "+body.logoAnnotations.description);
        // });
      });
    }
]);
