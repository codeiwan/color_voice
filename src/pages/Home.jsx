import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  
  const handleStart = () => {
    if (name.trim()) {
      // 나중에 name을 상태관리 등으로 넘길 수 있음
      navigate('/listen');
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