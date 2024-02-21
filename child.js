process.on('message', (message) => {
  if(message.action === 'send_to_parent') {
    process.send(message.message);
  }
});