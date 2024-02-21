const { fork } = require("child_process");
const { sign } = require("crypto");
const cpuCores = require("os").cpus().length;

class MessageQueue {
  constructor() {
    // create a child process for each 
    this.topics = {};
  }

  /**
   * Creates a new topic. Fork a new child process for the topic.
   */
  createTopic(topicName) {
    if(!topicName || topicName === "") {
      console.error("Error: Empty topic name");
    } else if(typeof topicName !== 'string') {
      console.error("Error: Topic name should be string");
    } else if(this.topics[topicName]) {
      console.error(`Error: Topic name already exists`);
    } else if(Object.keys(this.topics).length === cpuCores) {
      console.error("Error: No CPU available");
    } else {
      console.log(`Topic Created: ${topicName}`)
      const child = fork(`${__dirname}/child`, [topicName])
      this.topics[topicName] = { child, queue: [] }
      child.on("message", (message) => {
        console.log(`Message Recieved: ${message} from Topic ${topicName}`);
      })
    }
  }

  destroyAllTopics() {
    for (let topicName in this.topics) {
      if (this.topics.hasOwnProperty(topicName)) {
        this.topics[topicName].child.kill()
        delete this.topics[topicName]; 
      }
    }
  }

  sendMessage(topicName, message) {
    if (!topicName || !this.topics.hasOwnProperty(topicName)) {
      console.error("Error: Topic name invalid");
    } else if(!message || message === "") {
      console.error("Error: Message is empty");
    } else {
      console.log(`Message Added: ${message} to Topic ${topicName}`);
      this.topics[topicName].queue.push(message);
      this.topics[topicName].child.send(message);
    }
  }

  getMessage(topicName) {
    if (!topicName || topicName === "" || !this.topics[topicName]) {
      console.error("Error: Topic name invalid");
    }else if(this.topics[topicName].queue.length === 0) {
      console.error("Error: Queue is empty")
    } else {
      const messages = this.topics[topicName].queue;
      const message = messages.shift();
      this.topics[topicName].child.send({ action: 'send_to_parent', message });
    }
  }

  getSize(topicName) {
    if (!topicName || !this.topics[topicName]) {
      console.error("Error: Topic name invalid");
    } else {
      return this.topics[topicName].queue.length;
    }    
  }
}

module.exports = MessageQueue;

