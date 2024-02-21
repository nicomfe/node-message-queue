const chai = require("chai");
const { expect } = require("chai");
const app = require("../index");
const should = chai.should();
const cpuCores = require("os").cpus().length;
const randomWords = require("random-words");

const Queue = require("../index");
const messageQueue = new Queue();

let logs = [],
  errorLogs = [],
  topics = {},
  counter = cpuCores;
const topicNames = randomWords(cpuCores);
const messages = randomWords(cpuCores);

before(() => {
  logs = [];
  errorLogs = [];
  console.log = function (log) {
    logs.push(log);
  };
  console.error = function (log) {
    errorLogs.push(log);
  };
});

after(() => {
  messageQueue.destroyAllTopics();
});

describe("Create Message Queue", () => {
  describe("Tests for create topic", () => {
    it("#1 - should create topics on every cpu core available", () => {
      for (let index = 0; index < cpuCores; index++) {
        messageQueue.createTopic(topicNames[index]);
        expect(logs[index]).to.be.equal(`Topic Created: ${topicNames[index]}`);
      }
      expect(logs.length).to.be.equal(cpuCores);
    });
    it("#2 - should send error message if topic name is empty", () => {
      messageQueue.createTopic("");

      expect(errorLogs.length).to.be.equal(1);
      expect(errorLogs[0]).to.be.equal("Error: Empty topic name");
    });
    it("#3 - should send error message if topic already exists", () => {
      messageQueue.createTopic(topicNames[0]);

      expect(errorLogs.length).to.be.equal(2);
      expect(errorLogs[1]).to.be.equal("Error: Topic name already exists");
    });
    it("#4 - should send error message if no cpu core available", () => {
      messageQueue.createTopic(randomWords() + "test");

      expect(errorLogs.length).to.be.equal(3);
      expect(errorLogs[2]).to.be.equal("Error: No CPU available");
    });
    it("#5 - should send error message if topic name is not of string type", () => {
      messageQueue.createTopic(123);

      expect(errorLogs.length).to.be.equal(4);
      expect(errorLogs[3]).to.be.equal("Error: Topic name should be string");
    });
  });

  describe("Tests for send message", () => {
    it("#1 - should send message to all available topics", async () => {
      for (let index = 0; index < cpuCores; index++) {
        let noOfMessages = randomNumber(1, 5);
        if (index == 0) {
          noOfMessages = 1;
        }
        counter += noOfMessages;
        topics[topicNames[index]] = noOfMessages;
        for (let innerIndex = 0; innerIndex < noOfMessages; innerIndex++) {
          messageQueue.sendMessage(topicNames[index], messages[index]);
        }
      }
      await sleep(1000);
      expect(logs.length).to.be.equal(counter);
      for (let index = 0; index < cpuCores; index++) {
        expect(
          logs.indexOf(`Message Added: ${messages[index]} to Topic ${topicNames[index]}`)
        ).to.be.greaterThan(-1);
      }
    });
    it("#2 - should send error message if topic name is invalid", () => {
      messageQueue.sendMessage(randomWords(), "some random message");

      expect(errorLogs.length).to.be.equal(5);
      expect(errorLogs[4]).to.be.equal("Error: Topic name invalid");
    });
    it("#3 - should send error message if queue message is empty", () => {
      messageQueue.sendMessage(topicNames[0], "");

      expect(errorLogs.length).to.be.equal(6);
      expect(errorLogs[5]).to.be.equal("Error: Message is empty");
    });
  });

  describe("Tests for queue size", () => {
    it("#1 - should get queue size of all topics", () => {
      for (let index = 0; index < cpuCores; index++) {
        const topicSize = messageQueue.getSize(topicNames[index]);
        expect(topicSize).to.be.equal(topics[topicNames[index]]);
      }
    });
    it("#2 - should send error if topic name is invalid", () => {
      messageQueue.getSize(randomWords());

      expect(errorLogs.length).to.be.equal(7);
      expect(errorLogs[6]).to.be.equal("Error: Topic name invalid");
    });
  });

  describe("Tests for get message", () => {
    it("#1 - should get queue message from all topics", async () => {
      for (let index = 0; index < cpuCores; index++) {
        messageQueue.getMessage(topicNames[index]);
      }
      await sleep(1000);
      expect(logs.length).to.be.equal(counter + cpuCores);
      for (let index = 0; index < cpuCores; index++) {
        expect(
          logs.indexOf(`Message Recieved: ${messages[index]} from Topic ${topicNames[index]}`)
        ).to.be.greaterThan(-1);
      }
    });
    it("#2 - should send error if topic name is invalid", () => {
      messageQueue.getMessage(randomWords());

      expect(errorLogs.length).to.be.equal(8);
      expect(errorLogs[7]).to.be.equal("Error: Topic name invalid");
    });
    it("#3 - should send error if queue is empty", () => {
      messageQueue.getMessage(topicNames[0]);

      expect(errorLogs.length).to.be.equal(9);
      expect(errorLogs[8]).to.be.equal("Error: Queue is empty");
    });
  });
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}