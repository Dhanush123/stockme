var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');
var fs = require('fs');
var cloudinary = require('cloudinary');
var crawler = require('img-crawler');
var https = require('https');

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
        builder.Prompts.text(session, "Hello! What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.attachment(session, "Hi " + results.response + "! What picture would you like me to analyze for a logo?");
    },
    function (session, results) {
     console.log(results);

      var urle = "";
      urle = results.response[0].contentUrl;
      console.log("urle: "+urle);

      request(urle, {encoding: 'binary'}, function(error, response, body) {
        // fs.writeFile('imgy.jpg', body, 'binary', function (err) {
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
                      image: { source: { imageUri: result.url } } } ] },
              json: true };
            //results.response.contentUrl
            request(options, function (error, response, body) {
              if (error) throw new Error("GOOGLE ERROR: " + error);

              console.log("GOOGLE BODY1: "+JSON.stringify(body));
              console.log("GOOGLE BODY2: "+JSON.stringify(body.responses));
              company = body.responses[0].logoAnnotations[0].description;
              console.log("descrip:"+company);
              var options = { method: 'GET',
                url: 'https://test3.blackrock.com/tools/hackathon/search-securities',
                qs:
                 { filters: 'assetType:Stock, countryCode:US',
                   useCache: 'true',
                   queryField: 'description',
                   query: company },
                headers:
                 {
                   'cache-control': 'no-cache',
                   accept: 'application/json',
                   'content-type': 'application/json' } };

              request(options, function (error, response, body) {
                if (error) throw new Error(error);
                body = JSON.parse(body);
                console.log(body);
                var ticker = body.resultMap.SEARCH_RESULTS[0].resultList[0].ticker;
                console.log("ticker: "+ticker);
                session.send('I believe this image contains the logo of ' + company + " and it has the ticker: " + ticker + ".\nFeel free to ask me more about this or other companies!");
              });
              // console.log("GOOGLE BODY3: "+body.logoAnnotations.description);
            });

          },
                                     { public_id: "SOS" ,invalidate: true });

    // });
  });
}
]);

dialog.matches("bestFund",[
  function (session){
    var url = "https://test3.blackrock.com/tools/hackathon/search-securities?filters=assetType%3AFund%2C%20countryCode%US&queryField=description&rows=1&sort=stdPerfOneYearAnnualized%20desc&useCache=true";
        https.get(url, function(res) {
          var body = '';

          res.on('data', function (chunk) {
                 body += chunk;
                 });

          res.on('end', function () {
                 var data = JSON.parse(body);
                 var fundName = data.resultMap.SEARCH_RESULTS[0].resultList[0].fundFamilyName;
                 var speechOutput = fundName+"is a great fund based on my analysis!";
                 session.send(speechOutput);
                //  callback(sessionAttributes,buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, true));
                 //eventCallback(stringResult);
                 });
          }).on('error', function (e) {
                console.log("Got error: ", e);
                });
  }
]);
