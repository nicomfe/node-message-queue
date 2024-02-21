const { fork } = require("child_process")
const { sign } = require("crypto")
const cpuCores = require("os").cpus().length

const ERRORS = {
  INVALID_TOPIC_NAME: "Error: Topic name invalid",
  EMPTY_TOPIC_NAME: "Error: Empty topic name",
  TOPIC_NAME_STRING: "Error: Topic name should be string",
  TOPIC_NAME_EXISTS: "Error: Topic name already exists",
  NO_CPU_AVAILABLE: "Error: No CPU available",
  EMPTY_MESSAGE: "Error: Message is empty",
  QUEUE_EMPTY: "Error: Queue is empty"
}

class MessageQueue {
  constructor() {
    // create a child process for each 
    this.topics = {}
  }
  
  /**
   * Creates a new topic. Fork a new child process for the topic.
   */
  createTopic(topicName) {
    if(this.isEmpty(topicName)) {
      console.error(ERRORS.EMPTY_TOPIC_NAME)
    } else if(typeof topicName !== 'string') {
      console.error(ERRORS.TOPIC_NAME_STRING)
    } else if(this.topicNameExists(topicName)) {
      console.error(ERRORS.TOPIC_NAME_EXISTS)
    } else if(Object.keys(this.topics).length === cpuCores) {
      console.error(ERRORS.NO_CPU_AVAILABLE)
    } else {
      console.log(`Topic Created: ${topicName}`)
      const child = fork(`${__dirname}/child`, [topicName])
      this.topics[topicName] = { child, queue: [] }
      child.on("message", (message) => {
        console.log(`Message Recieved: ${message} from Topic ${topicName}`)
      })
    }
  }

  destroyAllTopics() {
    for (let topicName in this.topics) {
      if (this.topics.hasOwnProperty(topicName)) {
        this.topics[topicName].child.kill()
        delete this.topics[topicName] 
      }
    }
  }

  sendMessage(topicName, message) {
    if (!this.topicNameExists(topicName)) {
      console.error(ERRORS.INVALID_TOPIC_NAME)
    } else if(this.isEmpty(message)) {
      console.error(ERRORS.EMPTY_MESSAGE)
    } else {
      console.log(`Message Added: ${message} to Topic ${topicName}`)
      this.topics[topicName].queue.push(message)
      this.topics[topicName].child.send(message)
    }
  }

  getMessage(topicName) {
    if (!this.topicNameExists(topicName)) {
      console.error(ERRORS.INVALID_TOPIC_NAME)
    } else if(this.topics[topicName].queue.length === 0) {
      console.error(ERRORS.QUEUE_EMPTY)
    } else {
      const messages = this.topics[topicName].queue
      const message = messages.shift()
      this.topics[topicName].child.send({ action: 'send_to_parent', message })
    }
  }

  getSize(topicName) {
    if (!this.topicNameExists(topicName)) {
      console.error(ERRORS.INVALID_TOPIC_NAME)
    } else {
      return this.topics[topicName].queue.length
    }    
  }

  isEmpty(value) {
    if (!value || value === "") {
      return true
    }
    return false
  }
  
  topicNameExists(topicName) {
    return !this.isEmpty(topicName) && this.topics.hasOwnProperty(topicName)
  }
}

module.exports = MessageQueue

