import { useEffect, useRef, useState } from "react";
import logo from "/assets/miniapp_icon_green.png";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";
import ConversationDisplay from "./ConversationDisplay";
import ShareButton from "./ShareTargetPickerButton";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center z-10">
        <div className="flex items-center gap-2 md:gap-4 w-full m-2 md:m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "20px" }} className="md:w-6" src={logo} />
          <div className="flex-1">
            <h1 className="text-sm md:text-base">デモ・LINEミニアプリ（生成AI・リアルタイム会話）</h1>
          </div>
          <ShareButton />
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0 flex flex-col md:flex-row">
        {/* Main content area */}
        <section className="flex-1 flex flex-col md:mr-80 lg:mr-96">
          {/* Session controls at the top for mobile */}
          <section className="h-20 md:h-24 p-2 md:p-4 border-b md:border-b-0 md:order-last">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
          {/* Conversation display - mobile only */}
          <section className="md:hidden h-64 border-b">
            <ConversationDisplay events={events} isSessionActive={isSessionActive} />
          </section>
          {/* Event log below conversation on mobile, main content on desktop */}
          <section className="flex-1 px-2 md:px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
        </section>
        {/* Tool panel - responsive sidebar */}
        <section className="hidden md:block absolute top-0 w-80 lg:w-96 right-0 bottom-0 p-4 pt-0 overflow-y-auto border-l border-gray-200">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
        {/* Mobile tool panel toggle */}
        <div className="md:hidden fixed bottom-4 right-4 z-20">
          <button
            onClick={() => {
              const toolPanel = document.getElementById('mobile-tool-panel');
              toolPanel.classList.toggle('hidden');
            }}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Mobile tool panel overlay */}
        <div id="mobile-tool-panel" className="hidden md:hidden fixed inset-0 bg-black bg-opacity-50 z-30">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tools</h2>
              <button
                onClick={() => {
                  document.getElementById('mobile-tool-panel').classList.add('hidden');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ToolPanel
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </div>
        </div>
      </main>
    </>
  );
}
