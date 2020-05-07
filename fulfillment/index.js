"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");
const mysql = require("mysql");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log("DF Request Headers: " + JSON.stringify(request.headers));
    console.log("DF Request Body: " + JSON.stringify(request.body));

    function connectToDatabase() {
      const connection = mysql.createConnection({
        // *** For Unix Socket Connection: ***
        socketPath: `/cloudsql/promise-mysql-chatbot-cdcilw:us-central1:demo`,
        // *** For TCP/IP Connection: ***
        // host: "HOST",
        // ip: "PORT",
        user: "root",
        password: "cyberraf213",
        database: "demo_db",
      });
      return new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) {
            console.log("Problem connecting to Database: ", err);
            throw err;
          }
        });
        resolve(connection);
      });
    }

    function queryDatabase(connection) {
      return new Promise((resolve, reject) => {
        connection.query(
          `insert into users values ('pau');`,
          (error, results, fields) => {
            resolve(results);
          }
        );
      });
    }

    function welcome(agent) {
      // agent.add(`Welcome to my agent!`);
      return connectToDatabase().then((connection) => {
        try {
          return queryDatabase(connection).then((result) => {
            console.log(result);
            connection.end();
            agent.add("Query Successful " + result);
          });
        } catch (error) {
          agent.add("Exception encountered " + error);
        }
      });
    }

    function fallback(agent) {
      agent.add(`I didn't understand`);
      agent.add(`I'm sorry, can you try again?`);
    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", welcome);
    intentMap.set("Default Fallback Intent", fallback);
    // intentMap.set("intro", yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
  }
);
