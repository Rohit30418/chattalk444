import React, { useState } from 'react';

const Wit = ({ play, stop }) => {
  const [transcript, setTranscript] = useState('');

  // Example function to send a text query to Wit.ai and get response
  const getWitResponse = async (message) => {
    try {
      const response = await fetch(`https://api.wit.ai/message?v=20200927&q=${encodeURIComponent(message)}`, {
        headers: {
          Authorization: `Bearer 2262BRXCCU7UW3NRJE35C5O777GINS4E`,
        },
      });
  
      const data = await response.json();
      console.log('Wit.ai full response:', data);  // Log full response to inspect it
      handleIntent(data.intents, data.entities);
    } catch (error) {
      console.error('Error fetching Wit.ai response:', error);
    }
  };
  

  const handleIntent = (intents, entities) => {
    console.log(intents);
    
    if (intents.length > 0) {
      const intent = intents[0].name;
      console.log("Recognized intent:", intent);  // Log intent for debugging
  
      console.log(intent);
      
      switch (intent) {
        case 'play_music':
          speak("Playing now.");
          play();  // Ensure the play action is called
          break;
  
        case 'stop_music':
          speak("Stopping now.");
       //   stop();  // Ensure the stop action is called
          break;
  
        default:
          speak("I didn't understand that.");  // Fallback for unrecognized intents
          break;
      }
    } else {
      speak("No intent recognized.");  // Handle case when no intent is found
    }
  };
  

  // Function to use AI voices for responses
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';  // You can set different languages
    speechSynthesis.speak(utterance);
  };

  // Function to handle speech recognition (optional)
  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition.');
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
  
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      getWitResponse(speechToText);
    };
  
    recognition.onerror = (error) => {
      console.error('Speech recognition error:', error);
      alert('There was an error with speech recognition.');
    };
  
    recognition.start();
  };
  

  return (
    <div>
      <button onClick={startRecognition}>Start Recognition</button>
      <p>Recognized Text: {transcript}</p>
    </div>
  );
};

export default Wit;
