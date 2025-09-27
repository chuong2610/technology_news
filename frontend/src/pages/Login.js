import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import GoogleLoginButton from '../components/GoogleLoginButton';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', values.email);
      const result = await login(values.email, values.password);
      console.log('Login result:', result);
      
      if (result.success) {
        message.success(t('auth.login.loginSuccess'));
        navigate(from, { replace: true });
      } else {
        console.error('Login failed:', result.error);
        message.error(result.error);
      }
    } catch (error) {
      console.error('Login exception:', error);
      message.error(t('auth.login.loginError'));
    } finally {
      setLoading(false);
    }
  
    
  
  };

  const handleGoogleSuccess = (result) => {
    console.log('Google login successful:', result);
    navigate(from, { replace: true });
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>{t('auth.login.title')}</Title>
          <Text type="secondary">{t('auth.login.subtitle')}</Text>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          {/* Google Login Button */}
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={loading}
          />
          
          <Divider>
            <Text type="secondary" style={{ fontSize: '14px' }}>Or sign in with email</Text>
          </Divider>

          <Form.Item
            name="email"
            label={t('auth.login.email')}
            rules={[
              { required: true, message: t('auth.login.emailRequired') },
              { type: 'email', message: t('auth.login.invalidEmail') }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder={t('auth.login.email')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.login.password')}
            rules={[
              { required: true, message: t('auth.login.passwordRequired') },
              { min: 6, message: t('auth.login.passwordMinLength') }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder={t('auth.login.password')}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              {t('auth.login.signIn')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical">
              <Text type="secondary">
                {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.signUp')}</Link>
              </Text>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
