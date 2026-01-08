
import React, { useEffect, useState } from 'react';
import { X, Construction } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title = "功能提示" }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden relative z-10 transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-90'
        }`}
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Construction size={32} className="text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            该模块正在紧急开发中<br />感谢您的耐心等待
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            我知道了
          </button>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Modal;
