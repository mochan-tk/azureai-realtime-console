import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = event.event_id && !event.event_id.startsWith("event_");

  return (
    <div className="flex flex-col gap-2 p-2 md:p-3 rounded-md bg-gray-50">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-400 w-4 h-4" />
        ) : (
          <ArrowUp className="text-green-400 w-4 h-4" />
        )}
        <div className="text-xs md:text-sm text-gray-500 break-words">
          {isClient ? "client:" : "server:"}
          &nbsp;{event.type} | {timestamp}
        </div>
      </div>
      <div
        className={`text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs break-words whitespace-pre-wrap">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function EventLog({ events }) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event, index) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    // Use event_id + index to ensure unique keys
    const uniqueKey = event.event_id ? `${event.event_id}_${index}` : `event_${index}`;
    eventsToDisplay.push(
      <Event key={uniqueKey} event={event} timestamp={event.timestamp} />,
    );
  });

  return (
    <div className="flex flex-col gap-2 overflow-x-auto p-2 md:p-0">
      {events.length === 0 ? (
        <div className="text-gray-500 text-sm md:text-base">Awaiting events...</div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}
