type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onerror: ((event: { error: string }) => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<
          ArrayLike<{
            transcript: string;
          }>
        >;
      }) => void)
    | null;
  onend: (() => void) | null;
}

interface BrowserSpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function browserSpeechSupported() {
  if (typeof window === "undefined") {
    return false;
  }

  const speechWindow = window as BrowserSpeechWindow;
  return Boolean(
    speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
  );
}

export function startBrowserSpeechRecognition(options: {
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}) {
  if (typeof window === "undefined") {
    throw new Error("Speech recognition is only available in the browser.");
  }

  const speechWindow = window as BrowserSpeechWindow;
  const Recognition =
    speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

  if (!Recognition) {
    throw new Error("Browser speech recognition is not available.");
  }

  const recognition = new Recognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "es-CR";
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript ?? "")
      .join(" ")
      .trim();

    if (transcript) {
      options.onResult(transcript);
    }
  };
  recognition.onerror = (event) => {
    options.onError(event.error);
  };
  recognition.onend = () => {
    options.onEnd();
  };
  recognition.start();

  return {
    stop() {
      recognition.stop();
    }
  };
}
