// JavaScript Document
"use strict";

var URL_IMG_LOGO = "";
var DB_HOST = "www.db4free.net";
var DB_USER = "zgogi";
var DB_PASSWORD = "1q1r3z4D";
var DB_DATABASE = "zgsoft";
var USE_EMULATOR = false;

var builder = require('botbuilder');
var mysql = require('mysql');

if (USE_EMULATOR) {
  var restify = require('restify');
  var server = restify.createServer();
  server.listen(process.env.port || process.env.PORT || 3978, function () {
     console.log('%s listening to %s', server.name, server.url); 
  });
  
  var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
  });
  
  server.post('/api/messages', connector.listen());
}
else {
  var botbuilder_azure = require("botbuilder-azure");
  
  var connector = new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
  });

  module.exports = { default: bot_connection.listen() }
}


var bot = new builder.UniversalBot(connector);

var sqlConnection = mysql.createConnection({
  host     : DB_HOST,
  user     : DB_USER,
  password : DB_PASSWORD,
  database : DB_DATABASE
});


//------------------------------------------------------------------------------


bot.dialog('/', [
    function (session,result) {
        //session.send("root 1 %s",result);
        //builder.Prompts.text(session, "say");

        sendHelloCard(session);
        session.beginDialog('/menu');
    },
    function (session, results) {
        //session.send("root2 %s",results);
        
        
        
        // Display menu
        //session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("До свидания!");
    }
]);

bot.dialog("/menu", [
  function (session,args) {
    //console.log("MENU 1");
    //console.log(args);
    var msg = new builder.Message(session)
          .textFormat(builder.TextFormat.xml)
          .attachments([
              new builder.HeroCard(session)
                  .title("Главное меню")
                  .subtitle("Выберите раздел")
                  .text("Разделов может быть много")
                  .images([
                      builder.CardImage.create(session, URL_IMG_LOGO)
                  ])
                  .buttons([
                      builder.CardAction.dialogAction(session, "cars", "select:cars", "Машинки"),
                      builder.CardAction.dialogAction(session, "animals", "select:animals", "Зверушки")
                  ])
          ]);
      session.send(msg);
      //builder.Prompts.text(session, msg);

    },
    function(session,args) {
      //console.log("MENU 2");
      //console.log(args);
      session.send("Menu 2 Got %s", args.response);
    
    
    
      //session.endDialog("menu ended");
    }

]);


bot.dialog('/cars', [
    function(session, args) {
      //session.send("-Cars1 %s",args.data);
      console.log("CARS 1");
      console.log(args);
      
      var cmd = args.data.split(":");
      switch (cmd.length) {
        case 2:
          sendCarsCard(session);
          break;
        case 3:
          sendCarsCarousel(session, cmd[2]); 
          break;
      }
    },
    function(session,args) {
      session.send("-Cars2",args);
      console.log("CARS 2");
      console.log(args);
      
      
      
      session.endDialog("cars ended %s", args.data);
    }
]);

bot.dialog('/animals', [
    function (session, args) {
        session.endDialog("Вы выбрали зверушек %s", args.data);
    }
]);

bot.beginDialogAction('menu', '/menu');
bot.beginDialogAction('cars', '/cars');
bot.beginDialogAction('animals', '/animals');

function sendHelloCard(session) {
  var card = new builder.HeroCard(session)
      .title("Тестовый бот")
      .text("Приветсвую тебя!")
      .images([
           builder.CardImage.create(session, URL_IMG_LOGO)
      ]);
  var msg = new builder.Message(session).attachments([card]);
  session.send(msg);
}


function sendCarsCard(session) {
  sqlConnection.query("SELECT year FROM cars GROUP BY year", function(err,rows,fields) {
     var btns = [];
     var actns = [];
     for (var row in rows) {
       console.log(row);
       var r = rows[row];
       var year = String(r['year']); 
       var cmd = "select:cars:"+year;
       btns[row] = builder.CardAction.dialogAction(session, "cars", cmd, year);
       actns[row] = cmd;
     } 

     var filter = actns.join('|');
     //session.send("Filter "+filter);
     console.log("Filter: %s", filter);

     var card = new builder.HeroCard(session)
            .title("Машинки")
            .text("Выберите год")
            .buttons(btns)
     
     var msg = new builder.Message(session).attachments([card]);
     builder.Prompts.choice(session, msg, filter);
  }, session);

}

function sendCarsCarousel(session,year) {
  sqlConnection.query("SELECT * FROM cars WHERE year="+year, 
    function(err,rows,fields) {
      var carousel = [];
      for (var row in rows) {
         carousel[row] = createCarCard(session, rows[row]);      
      }
      var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(carousel);
      session.send(msg);
    }, 
  session);
}

function createCarCard(session, row) {
   return new builder.HeroCard(session)
                    .title(row.name)
                    .text("Здесь должно быть описание объекта %s", row.id)
                    .images([
                        builder.CardImage.create(session, row.image)
                            .tap(builder.CardAction.showImage(session, row.image))
                    ])
}
