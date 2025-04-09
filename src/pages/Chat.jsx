import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state?.name;

  if (!name) {
    // 이름 없이 접근한 경우 홈으로 보냄
    navigate('/');
    return null;
  }

  const handleBack = () => {
    navigate('/'); // 홈으로 이동
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>{name}님, 환영합니다 👋</h1>
      <p>여기서부터 채팅이나 기능을 추가할 수 있어요.</p>

      <br/>
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