import { useState, useRef, useCallback } from 'react';

export const useAudio = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const speakVenda = useCallback((text: string) => {
        setIsPlayingAudio(true);
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.8;
        u.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const url = URL.createObjectURL(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
                setAudioUrl(url);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch {
            alert("Enable microphone access to practice.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const clearAudio = () => {
        setAudioUrl(null);
        setIsPlayingAudio(false);
    };

    return {
        isRecording,
        audioUrl,
        isPlayingAudio,
        speakVenda,
        startRecording,
        stopRecording,
        clearAudio,
        setAudioUrl
    };
};
