import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, aiResponse, finished } = location.state || {};

  const [sttText, setSttText] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);  // 실시간 인식 토글 상태
  const [isSpeaking, setIsSpeaking] = useState(false);  // 현재 말하고 있는지 여부
  
  const mediaRecorderRef = useRef(null);  // 녹음기 인스턴스 저장
  const audioChunksRef = useRef([]);  // 녹음된 오디오 조각들
  const analyserRef = useRef(null);  // 오디오 분석기 (음성 감지용)
  const audioContextRef = useRef(null);  // Web Audio API의 AudioContext
  const sourceRef = useRef(null);  // 오디오 소스 (마이크)
  const streamRef = useRef(null);  // 마이크 스트림
  const intervalRef = useRef(null);  // 음성 감지 루프 타이머
  
  if (!name || !aiResponse) {
    // 이름 혹은 AI 응답 없이 접근한 경우 홈으로 보냄
    navigate('/');
    return null;
  }

  // 뒤로가기
  const handleBack = () => {
    navigate('/'); // 홈으로 이동
  };

  // 실시간 인식 시작
  const startAutoMode = async () => {
    try {
      // 마이크 권한 요청 + 스트림 얻기
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 오디오 컨텍스트 생성 (브라우저용 오디오 환경)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // 마이크를 오디오 소스로 연결
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // 분석기 노드 생성 → 음성의 세기 측정용
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // 오디오 소스를 분석기에 연결
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);

      let silenceStart = null;
      const silenceThreshold = 2000; // 2초 정적일 경우 멈춤 (단위: ms)

      // 음성 볼륨 주기적으로 측정
      const checkVolume = () => {
        analyser.getByteTimeDomainData(dataArray);
        const volume = dataArray.reduce((a, b) => a + Math.abs(b - 128), 0) / dataArray.length;

        const now = Date.now();

        // 말하는 중이면 녹음 시작
        if (volume > 3) {
          // 일정 볼륨 이상 → 말 시작 → 녹음 시작
          silenceStart = null;  // 말하는 중이면 바로 녹음 시작 + 정적 시간 초기화

          if (!mediaRecorderRef.current) {
            startAutoRecording();  // 실시간 모드용 녹음 함수
          }
        } else {
          // 정적 상태 감지
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            if (!silenceStart) {
              silenceStart = now;  // 처음 정적 시작 시간 기록
            } else if (now - silenceStart > silenceThreshold) {
              stopAutoRecording();  // 정적 시간이 기준 이상 → 녹음 종료
              silenceStart = null;
            }
          }
        }

        setIsSpeaking(volume > 3);  // UI에 초록불 표시용
      };

      // 200ms마다 음성 감지 루프 실행
      intervalRef.current = setInterval(checkVolume, 100);  // 감지 주기 100ms로 민감도 향상
      setIsAutoMode(true);
    } catch (err) {
      alert('마이크 접근에 실패했습니다.');
      console.error(err);
    }
  };

  // 실시간 인식 종료
  const stopAutoMode = () => {
    // 루프 중단
    clearInterval(intervalRef.current);
    setIsAutoMode(false);
    setIsSpeaking(false);

    // 녹음 중이면 정지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // 마이크 스트림 종료
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // 오디오 컨텍스트 종료
    audioContextRef.current?.close();

    // 리셋
    mediaRecorderRef.current = null;
  };

  // 실시간 모드용 녹음 시작
  const startAutoRecording = () => {
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await new Promise((res) => setTimeout(res, 50));  // 녹음 끝난 직후 50ms 기다렸다가 전송 (STT 안정화)
      await sendToSTT(blob);
      mediaRecorderRef.current = null;
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  // 실시간 모드용 녹음 종료
  const stopAutoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // 수동 녹음 스트림 따로 저장
  const manualStreamRef = useRef(null);

  // 수동 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      manualStreamRef.current = stream;  // 수동 녹음 스트림 저장

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendToSTT(blob);

        // 마이크 사용 종료
        if (manualStreamRef.current) {
          manualStreamRef.current.getTracks().forEach(track => track.stop());
          manualStreamRef.current = null;
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('마이크 접근에 실패했습니다.');
      console.error(err);
    }
  };

  // 수동 녹음 종료
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }

    // 만일 onstop 호출 전에 사용자가 수동으로 정지함에 대비
    if (manualStreamRef.current) {
      manualStreamRef.current.getTracks().forEach(track => track.stop());
      manualStreamRef.current = null;
    }
  };

  // STT 요청
  const sendToSTT = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    try {
      const res = await fetch('https://personal-voice.onrender.com/stt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setSttText(data.text || '음성 인식 실패');
    } catch (err) {
      console.error('STT 요청 실패:', err);
      setSttText('STT 오류 발생');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>{name}님, 환영합니다 👋</h1>

      <br/>
      <div style={{
        margin: '40px auto',
        width: '80%',
        maxWidth: '600px',
        backgroundColor: '#f4f4f4',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'left',
        fontSize: '18px'
      }}>
        <strong>🤖 AI 응답:</strong>
        <p style={{ marginTop: '10px' }}>{aiResponse}</p>
      </div>

      {/* 토글 버튼 */}
      <div style={{ marginTop: '30px' }}>
        <button
          onClick={isAutoMode ? stopAutoMode : startAutoMode}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isAutoMode ? '#f44336' : '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {isAutoMode ? '🛑 음성 인식 종료' : '🎤 실시간 음성 인식 시작'}
        </button>
      </div>

      {/* 실시간 음성 감지 박스 */}
      <div style={{
        margin: '20px auto',
        width: '30px',
        height: '30px',
        backgroundColor: isSpeaking ? 'green' : '#ccc',
        borderRadius: '50%'
      }} />
      
      {/* 녹음 컨트롤 */}
      <div style={{ marginTop: '30px' }}>
        <button
          onClick={startRecording}
          disabled={isRecording}
          style={{ marginRight: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          🎤 녹음 시작
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          🛑 녹음 종료
        </button>
      </div>

      {/* STT 결과 출력 */}
      {sttText && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #a5d6a7',
          borderRadius: '6px',
          width: '60%',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontSize: '16px'
        }}>
          <strong>📝 음성 텍스트:</strong>
          <p>{sttText}</p>
        </div>
      )}

      {/* finished 상태 확인용 */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        fontSize: '12px',
        color: finished ? 'green' : 'gray'
      }}>
        상태: {finished ? '완료됨 ✅' : '진행 중... ⏳'}
      </div>
      
      <br />
      <button
        onClick={handleBack}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          cursor: 'pointer',
          backgroundColor: '#eee',
          border: '1px solid #ccc',
          borderRadius: '5px'
        }}
      >
        ← 뒤로가기
      </button>

    </div>
  );
};

export default Chat;