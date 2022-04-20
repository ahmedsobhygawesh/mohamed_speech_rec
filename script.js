// JavaScript Speech Recognition Init
var SpeechRecognition = window.webkitSpeechRecognition || window.speechRecognition;
var recognition = new webkitSpeechRecognition() || new SpeechRecognition();
var transContent = "";
var noteContent = "";
recognition.continuous = true;
// RTM Global Vars
var isLoggedIn = false;

// Start self notes
$("#note").click(function () {
  console.log('Voice recognition is on.');
  $("#stop-note").attr("disabled", false);
  $("#note").attr("disabled", true);
  $("#stop-transcribe").attr("disabled", true);
  $("#transcribe").attr("disabled", true);
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});

// Stop self notes
$("#stop-note").click(function () {
  console.log('Voice recognition is off.');
  recognition.stop();
  recognition.onresult = function (event) {
    var current = event.resultIndex;
    var transcript = event.results[current][0].transcript;
    noteContent = noteContent + transcript + "<br>";
    $("#note-text").append("<b><i>You said: </i></b> " + noteContent);
    noteContent = '';
  };
  $("#note").attr("disabled", false);
  $("#stop-note").attr("disabled", true);
  $("#stop-transcribe").attr("disabled", true);
  $("#transcribe").attr("disabled", false);
});

// Can't recognise voice
recognition.onerror = function (event) {
  if (event.error == 'no-speech') {
    console.log('Could you please repeat? I didn\'t get what you\'re saying.');
    recognition.stop();
    recognition.start();
  }
}

// Create Agora RTM client
const clientRTM = AgoraRTM.createInstance($("#appid").val(), { enableLogUpload: false });
var accountName = $('#accountName').val();
// Login
clientRTM.login({ uid: accountName }).then(() => {
  console.log('AgoraRTM client login success. Username: ' + accountName);
  isLoggedIn = true;
  // RTM Channel Join
  var channelName = $('#channel').val();
  channel = clientRTM.createChannel(channelName);
  channel.join().then(() => {
    console.log('AgoraRTM client channel join success.');
    // Start transcription for all (RTM)
    $("#transcribe").click(function () {
      console.log('Voice recognition is on.');
      $("#transcribe").attr("disabled", true);
      $("#stop-transcribe").attr("disabled", false);
      $("#stop-note").attr("disabled", true);
      $("#note").attr("disabled", true);
      if (transContent.length) {
        transContent += ' ';
      }
      recognition.start();
    });
    // Stop transcription for all (RTM)
    $("#stop-transcribe").click(function () {
      console.log('Voice recognition is off.');
      recognition.stop();
      recognition.onresult = function (event) {
        var current = event.resultIndex;
        var transcript = event.results[current][0].transcript;
        transContent = transContent + transcript + "<br>";
        singleMessage = transContent;
        channel.sendMessage({ text: singleMessage }).then(() => {
          console.log("Message sent successfully.");
          console.log("Your message was: " + singleMessage + " by " + accountName);
          $("#actual-text").append("<br> <b>Speaker:</b> " + accountName + "<br> <b>Message:</b> " + singleMessage + "<br>");
          transContent = ''
        }).catch(error => {
          console.log("Message wasn't sent due to an error: ", error);
        });
      };
      $("#note").attr("disabled", false);
      $("#stop-note").attr("disabled", true);
      $("#stop-transcribe").attr("disabled", true);
      $("#transcribe").attr("disabled", false);
    });
    // Receive RTM Channel Message
    channel.on('ChannelMessage', ({ text }, senderId) => {
      console.log("Message received successfully.");
      console.log("The message is: " + text + " by " + senderId);
      $("#actual-text").append("<br> <b>Speaker:</b> " + senderId + "<br> <b>Message:</b> " + text + "<br>");
    });
  }).catch(error => {
    console.log('AgoraRTM client channel join failed: ', error);
  }).catch(err => {
    console.log('AgoraRTM client login failure: ', err);
  });
});

document.getElementById("leave").onclick = async function () {
    console.log("Client logged out of RTM.");
    await clientRTM.logout();
}