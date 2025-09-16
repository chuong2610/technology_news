import React from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ className = '' }) => {
  const { language, toggleLanguage, isVietnamese } = useLanguage();
  
  const handleToggle = () => {
    toggleLanguage();
  };
  
  return (
    <Tooltip title={isVietnamese ? 'Switch to English' : 'Chuyển sang tiếng Việt'}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        onClick={handleToggle}
        className={`flex items-center gap-1 ${className}`}
        size="small"
      >
        <span className="hidden sm:inline text-sm">
          {isVietnamese ? 'EN' : 'VI'}
        </span>
      </Button>
    </Tooltip>
  );
};

export default LanguageToggle;
