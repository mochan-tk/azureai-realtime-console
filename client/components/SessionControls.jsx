import { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={`${isActivating ? "bg-gray-600" : "bg-red-600"} text-sm md:text-base px-4 md:px-6`}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "starting..." : "start session"}
      </Button>
    </div>
  );
}

function SessionActive({ stopSession, sendTextMessage }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-2 md:gap-4">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="send a message..."
        className="border border-gray-200 rounded-full p-2 md:p-4 flex-1 text-sm md:text-base"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        icon={<MessageSquare height={14} className="md:w-4 md:h-4" />}
        className="bg-blue-400 text-sm md:text-base px-2 md:px-4"
      >
        <span className="hidden md:inline">send text</span>
        <span className="md:hidden">send</span>
      </Button>
      <Button 
        onClick={stopSession} 
        icon={<CloudOff height={14} className="md:w-4 md:h-4" />}
        className="text-sm md:text-base px-2 md:px-4"
      >
        <span className="hidden md:inline">disconnect</span>
        <span className="md:hidden">stop</span>
      </Button>
    </div>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="flex gap-2 md:gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}
