import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { name, aiResponse, finished } = location.state || {};

  if (!name || !aiResponse) {
    // 이름 혹은 AI 응답 없이 접근한 경우 홈으로 보냄
    navigate('/');
    return null;
  }

  const handleBack = () => {
    navigate('/'); // 홈으로 이동
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
      
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        fontSize: '12px',
        color: finished ? 'green' : 'gray'
      }}>
        상태: {finished ? '완료됨 ✅' : '진행 중... ⏳'}
      </div>
    </div>
  );
};

export default Chat;