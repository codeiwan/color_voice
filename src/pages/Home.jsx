import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  
  const handleStart = async () => {
    if (!name.trim()) return; 

    try {
      const res = await fetch('https://personal-voice.onrender.com/info-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: name,
          message: '시작할게요!',
        }),
      });

      const data = await res.json();

      // /chat로 이동하며 응답 결과 함께 전달
      navigate('/chat', { state: { name, aiResponse: data.response, finished: data.finished } });
    } catch (err) {
      alert('서버 요청에 실패했습니다.');
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>이름을 입력하세요</h1>
      <input
        type="text"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: '10px', fontSize: '16px' }}
      />
      <br /><br />
      <button
        onClick={handleStart}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        시작하기
      </button>
    </div>
  );
};
    
export default Home;