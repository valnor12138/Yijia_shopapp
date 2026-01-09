import React from 'react';

const Test: React.FC = () => {
  console.log('Test component rendered');
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-500">测试组件</h1>
      <p className="text-lg text-gray-700">如果看到这个，说明 React 应用正常工作！</p>
    </div>
  );
};

export default Test;