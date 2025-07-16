import { useState } from "react";
import liff from "@line/liff";

export default function ShareButton() {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      
      // LIFFが初期化されているか確認
      if (!liff.isInClient()) {
        alert("この機能はLINEアプリ内でのみ利用できます");
        return;
      }

      // shareTargetPickerを開く
      const result = await liff.shareTargetPicker([
        {
          type: "text",
          text: "下記URLにアクセスして、デモ・LINEミニアプリを体験しみてください✨\n\nhttps://miniapp.line.me/2007675467-NG8xEZBj"
        }
      ]);

      if (result) {
        console.log("Share successful:", result);
      } else {
        console.log("Share cancelled");
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("シェアに失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`
        px-4 py-2 rounded-lg font-medium text-white text-sm
        ${isSharing 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
        }
        transition-colors duration-200
        flex items-center gap-2
      `}
    >
      {isSharing ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          シェア中...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          友達にシェアする
        </>
      )}
    </button>
  );
}
