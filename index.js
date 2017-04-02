var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');
var fs = require('fs');
var cloudinary = require('cloudinary');

     var crawler = require('img-crawler');

cloudinary.config({
  cloud_name: 'octabytes',
  api_key: '393134871951925',
  api_secret: 'fegjRet5hCx2RxgUk3NuYpuXd-s'
});

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

var company = "";

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

      var urle = "";
      urle = results.response[0].contentUrl;
      console.log("urle: "+urle);


// var options = { method: 'POST',
//   url: 'https://vision.googleapis.com/v1/images:annotate',
//   qs: { key: 'AIzaSyCVP_E8hjQHzd4nRAC9wrnFfpzkvOuypl4' },
//   headers:
//    { 'postman-token': '0f5e9ef8-9037-a202-9750-ae59713705fb',
//      'cache-control': 'no-cache',
//      accept: 'application/json',
//      'content-type': 'application/json' },
//   body:
//    { requests:
//       [ { features: [ { type: 'LOGO_DETECTION', maxResults: 3 } ],
//           image: { source: { imageUri: urle } } } ] },
//   json: true };
//
// request(options, function (error, response, body) {
//   if (error) throw new Error(error);
//
//   console.log(body);
//   session.send('I believe this image contains the logo of ' + body.responses[0].logoAnnotations[0].description);
// });

      request(url, {encoding: 'binary'}, function(error, response, body) {
        fs.writeFile('imgy.jpg', body, 'binary', function (err) {
          console.log('done');
          cloudinary.uploader.upload(urle, function(result) { console.log(result);
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
                      image: { source: { imageUri: "http://res.cloudinary.com/octabytes/image/upload/v1491116301/imgy.jpg" } } } ] },
              json: true };
            //results.response.contentUrl
            request(options, function (error, response, body) {
              if (error) throw new Error("GOOGLE ERROR: " + error);

              console.log("GOOGLE BODY1: "+JSON.stringify(body));
              console.log("GOOGLE BODY2: "+JSON.stringify(body.responses));
              company = body.responses[0].logoAnnotations[0].description;
              console.log("descrip:"+company);
              session.send('I believe this image contains the logo of ' + company);
              // console.log("GOOGLE BODY3: "+body.logoAnnotations.description);
            });

          },
                                     { public_id: "imgy" });

    });
  });
}
]);
