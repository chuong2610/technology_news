import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UserAddOutlined,
  BookOutlined 
} from '@ant-design/icons';
import useTranslation from '../hooks/useTranslation';

const { Title, Text } = Typography;

const WelcomeHelper = ({ 
  showForEmpty = true,
  articleCount = 0,
  userCount = 0,
  context = 'general' // 'search', 'recommendations', 'articles'
}) => {
  const { t } = useTranslation();

  // Only show when content is truly minimal
  if (!showForEmpty || (articleCount > 5 && userCount > 3)) {
    return null;
  }

  const getContextualMessage = () => {
    switch (context) {
      case 'search':
        return {
          title: t('welcome.searchEmptyTitle'),
          description: t('welcome.searchEmptyDesc'),
          actions: [
            {
              icon: 'book',
              text: t('welcome.browseContent'),
              onClick: () => window.location.href = '/blogs',
              type: 'default'
            },
            {
              icon: 'plus',
              text: t('welcome.createContent'),
              onClick: () => window.location.href = '/write',
              type: 'primary'
            }
          ]
        };
      case 'recommendations':
        return {
          title: t('welcome.recommendationsEmptyTitle'),
          description: t('welcome.recommendationsEmptyDesc'),
          actions: [
            {
              icon: 'search',
              text: t('welcome.exploreArticles'),
              onClick: () => window.location.href = '/blogs',
              type: 'default'
            }
          ]
        };
      default:
        return {
          title: t('welcome.communityGrowingTitle'),
          description: t('welcome.communityGrowingDesc'),
          actions: [
            {
              icon: 'plus',
              text: t('welcome.writeFirstArticle'),
              onClick: () => window.location.href = '/write',
              type: 'primary'
            },
            {
              icon: 'user-add',
              text: t('welcome.inviteFriends'),
              onClick: () => window.location.href = '/about',
              type: 'default'
            }
          ]
        };
    }
  };

  const { title, description, actions } = getContextualMessage();

  return (
    <Card 
      style={{ 
        margin: '16px 0',
        background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f2ff 100%)',
        border: '1px solid #e6f3ff',
        borderRadius: '12px'
      }}
    >
      <div style={{ textAlign: 'center', padding: '16px' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '8px' }}>
          {title}
        </Title>
        <Text style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
          {description}
        </Text>
        
        {articleCount <= 5 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#856404'
          }}>
            📊 Community Status: {articleCount} articles • {userCount} authors
          </div>
        )}

        <Space style={{ marginTop: '16px' }} wrap>
          {actions.map((action, index) => {
            const getIcon = (iconName) => {
              switch (iconName) {
                case 'book': return <BookOutlined />;
                case 'plus': return <PlusOutlined />;
                case 'search': return <SearchOutlined />;
                case 'user-add': return <UserAddOutlined />;
                default: return null;
              }
            };
            
            return (
              <Button
                key={index}
                type={action.type}
                icon={getIcon(action.icon)}
                onClick={action.onClick}
                size="small"
              >
                {action.text}
              </Button>
            );
          })}
        </Space>
      </div>
    </Card>
  );
};

export default WelcomeHelper;
