import { useEffect, useState } from "react";

export default function ConversationDisplay({ events, isSessionActive }) {
  const [conversationItems, setConversationItems] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    // デバッグ用：送信されたイベントをコンソールに出力
    console.log("ConversationDisplay: Processing", events.length, "events");

    const items = [];

    // 全イベントを時系列順にソート
    const sortedEvents = [...events].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    // 処理済みアイテムのIDを追跡
    const processedIds = new Set();

    // イベントを順番に処理してアイテムを作成
    sortedEvents.forEach(event => {
      // ユーザーのメッセージ作成イベント
      if (event.type === "conversation.item.created" && event.item && event.item.role === "user") {
        const itemId = event.item.id;
        if (processedIds.has(itemId)) return;
        processedIds.add(itemId);
        
        if (event.item.content && Array.isArray(event.item.content)) {
          event.item.content.forEach((contentItem) => {
            if (contentItem.type === "input_text" && contentItem.text) {
              const userItem = {
                id: `user_${itemId}`,
                role: "user",
                content: contentItem.text,
                timestamp: event.timestamp
              };
              items.push(userItem);
            } else if (contentItem.type === "input_audio") {
              const audioContent = contentItem.transcript || "[音声入力]";
              const userItem = {
                id: `user_${itemId}`,
                role: "user",
                content: audioContent,
                timestamp: event.timestamp
              };
              items.push(userItem);
            }
          });
        }
      }
      
      // アシスタントの音声転写完了イベント
      else if (event.type === "response.audio_transcript.done" && event.transcript) {
        const responseId = event.response_id;
        const transcriptId = `assistant_audio_${responseId}`;
        if (processedIds.has(transcriptId)) return;
        processedIds.add(transcriptId);
        
        const assistantItem = {
          id: transcriptId,
          role: "assistant",
          content: event.transcript,
          timestamp: event.timestamp
        };
        items.push(assistantItem);
      }
      
      // レスポンス完了イベント（テキスト応答用）
      else if (event.type === "response.done" && event.response && event.response.output) {
        const responseId = event.response.id;
        const textId = `assistant_text_${responseId}`;
        if (processedIds.has(textId)) return;
        processedIds.add(textId);
        
        event.response.output.forEach(outputItem => {
          if (outputItem.type === "message" && outputItem.content) {
            outputItem.content.forEach(contentItem => {
              if (contentItem.type === "text") {
                const assistantItem = {
                  id: textId,
                  role: "assistant",
                  content: contentItem.text,
                  timestamp: event.timestamp
                };
                items.push(assistantItem);
              }
            });
          }
        });
      }
    });

    // 再度時系列順にソート
    items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    console.log("ConversationDisplay: Final conversation items", items);
    setConversationItems(items);
  }, [events]);

  if (!isSessionActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">セッションを開始すると会話が表示されます</p>
      </div>
    );
  }

  if (conversationItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">会話を始めてください...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3">
      {conversationItems.map((item) => (
        <div
          key={item.id}
          className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              item.role === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            <p className="text-xs opacity-70 mt-1">
              {item.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
