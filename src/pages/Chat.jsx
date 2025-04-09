import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, aiResponse, finished } = location.state || {};

  const [sttText, setSttText] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioChunksRef = useRef([]);
  
  if (!name || !aiResponse) {
    // 이름 혹은 AI 응답 없이 접근한 경우 홈으로 보냄
    navigate('/');
    return null;
  }

  // 뒤로가기
  const handleBack = () => {
    navigate('/'); // 홈으로 이동
  };

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendToSTT(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('마이크 접근에 실패했습니다.');
      console.error(err);
    }
  };

  // 녹음 종료
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
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