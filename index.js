var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');
var fs = require('fs');
var firebase = require("firebase");

var config = {
  apiKey: "AIzaSyAeE2nmOHgdjCn50AWMztNIHu4hC4KJ8Gw",
    authDomain: "la-hacks-2017-4d868.firebaseapp.com",
    databaseURL: "https://la-hacks-2017-4d868.firebaseio.com",
    projectId: "la-hacks-2017-4d868",
    storageBucket: "la-hacks-2017-4d868.appspot.com",
    messagingSenderId: "474072545"
};
firebase.initializeApp(config);
var storageRef = firebase.storage().ref();
var imgyRef = storageRef.child('imgy.jpg');

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

      download(results.response.contentUrl, 'imgy.png', function(){
        console.log('done');

                // function to encode file data to base64 encoded string
        function base64_encode(file) {
            // read binary data
            var bitmap = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return new Buffer(bitmap).toString('base64');
        }

        // function to create file from base64 encoded string
        function base64_decode(base64str, file) {
            // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
            var bitmap = new Buffer(base64str, 'base64');
            // write buffer to file
            fs.writeFileSync(file, bitmap);
            console.log('******** File created from base64 encoded string ********');
        }

        // convert image to base64 encoded string
        var base64str = base64_encode('imgy.jpg');
        console.log("base64",base64str);

        storageRef.putString(base64str, 'base64').then(function(snapshot) {
          console.log('Uploaded a base64 string!');

          var options = { method: 'POST',
            url: 'https://vision.googleapis.com/v1/images:annotate',
            qs: { key: 'AIzaSyCVP_E8hjQHzd4nRAC9wrnFfpzkvOuypl4' },
            headers:
             {
               accept: 'application/json',
               'content-type': 'application/json' },
            body:
             { requests:
                [ { features: [ { type: 'LOGO_DETECTION', maxResults: 3 } ],
                    image: { source: { imageUri: storageRef.child('imgy.jpg').getDownloadURL() } } } ] },
            json: true };
          //results.response.contentUrl
          request(options, function (error, response, body) {
            if (error) throw new Error("GOOGLE ERROR: " + error);

            console.log("GOOGLE BODY1: "+JSON.stringify(body));
            console.log("GOOGLE BODY2: "+JSON.stringify(body.responses));
            // console.log("GOOGLE BODY3: "+body.logoAnnotations.description);
          });
        });
      });
    }
]);
