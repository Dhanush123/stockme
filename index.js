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
              if(body.responses[0].logoAnnotations[0].description){
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
            }
            else{
              session.send("Unfortunately, I couldn't find what company, if any, is in the picture you sent me. Perhaps try later or with a different picture.");
            }
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
                 var finalMsg = fundName+" is a great fund based on my analysis!";
                 session.send(finalMsg);
                //  callback(sessionAttributes,buildSpeechletResponse(CARD_TITLE, finalMsg, finalMsg, true));
                 //eventCallback(stringResult);
                 });
          }).on('error', function (e) {
                console.log("Got error: ", e);
                });
  }
]);

dialog.matches("portfAnalysis",[
    function(session){
      builder.Prompts.text(session, "Would you like to analyze your stock by the last month or year?");
    },
    function(session,results){
      var url =  "https://test3.blackrock.com/tools/hackathon/portfolio-analysis?calculateExposures=true&calculatePerformance=true&positions=AAPL~50%7CMSFT~50%7C&useCache=true";
   https.get(url, function(res) {
             var body = '';

             res.on('data', function (chunk) {
                    body += chunk;
                    });

             res.on('end', function () {
            var finalMsg;
            var data = JSON.parse(body);
            var performance = 0;
            var yearMonthDay = results.response;
            if (yearMonthDay === "year") {
            performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneYear;
            }
            else if (yearMonthDay === "month") {
            performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneMonth;
            }
            else {
            performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneDay;
            }
            performance = (performance* 100).toFixed(2);

            finalMsg = "Your stock ";
            if (performance < 0) {
            finalMsg += "went down by ";
            }
            else {
            finalMsg += "increased by ";
            }
            finalMsg += Math.abs(performance)+"%";

            if (yearMonthDay === "year") {
            finalMsg += " in the last year";
            }
            else if (yearMonthDay === "month") {
            finalMsg += " in the last month";
            }
            else {
            finalMsg += " in the last day";
            }
            session.send(finalMsg);
            });
          }).on('error', function (e) {
           console.log("Got error: ", e);
           });
    }
]);

dialog.matches("stockAnalyze",[
  function(session){
    builder.Prompts.text(session,"Which stock do you want to analyze? (Ticker name is appreciated)");
  },
  function(session,results){
    var stock = results.response;
    var finalMsg = "";
    var url = "https://test3.blackrock.com/tools/hackathon/search-securities" +
      "?filters=assetType%3AStock%2C%20countryCode%3AUS&useCache=true&queryField=description" + "&query=" + company;
  https.get(url, function(res) {
      var body = '';

      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
          var data = JSON.parse(body);
          var url2 = "https://test3.blackrock.com/tools/hackathon/performance?identifiers=" + stock + "&outputDataExpression=resultMap['RETURNS'][0].latestPerf" + "&useCache=true";
          https.get(url2, function(res) {
              var body = '';

              res.on('data', function(chunk) {
                  body += chunk;
              });

              res.on('end', function() {
                  var data = JSON.parse(body);
                  var performace = (data.oneDay * 100).toFixed(2);
                  //var performace = (data.resultMap.RETURNS[0].latestPerf.oneDay * 100).toFixed(2);
                  finalMsg = stockName + "'s stock ";
                  if (performace < 0) {
                      finalMsg += "decreased by ";
                  } else {
                      finalMsg += "went up by ";
                  }
                  finalMsg += Math.abs(performace) + "%";

                  callback(sessionAttributes,
                      buildSpeechletResponse(CARD_TITLE, finalMsg, finalMsg, true));
                  //eventCallback(stringResult);
              });
          }).on('error', function(e) {
              console.log("Got error: ", e);
          });
              //eventCallback(stringResult);
          });
      }).on('error', function(e) {
          console.log("Got error: ", e);
      });
  }
]);
