import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Upload, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const userData = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        avatar: avatarFile
      };

      const result = await register(userData);
      if (result.success) {
        message.success(t('auth.register.registerSuccess'));
        navigate('/');
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error(t('auth.register.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file) {
      // Since beforeUpload returns false, we need to handle the file directly
      const file = info.file.originFileObj || info.file;
      setAvatarFile(file);
    }
  };

  const handleGoogleSuccess = (result) => {
    console.log('Google login successful:', result);
    navigate('/');
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
  };

  const uploadProps = {
    name: 'avatar',
    listType: 'picture',
    maxCount: 1,
    beforeUpload: () => false,
    onChange: handleAvatarChange,
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '24px'
    }}>
      <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>{t('auth.register.title')}</Title>
          <Text type="secondary">{t('auth.register.subtitle')}</Text>
        </div>

        <Form
          name="register"
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
            <Text type="secondary" style={{ fontSize: '14px' }}>Or register with email</Text>
          </Divider>

          <Form.Item
            name="full_name"
            label={t('auth.register.firstName')}
            rules={[
              { required: true, message: t('auth.register.firstNameRequired') },
              { min: 2, message: 'Full name must be at least 2 characters!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder={t('auth.register.firstName')}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('auth.register.email')}
            rules={[
              { required: true, message: t('auth.register.emailRequired') },
              { type: 'email', message: t('auth.register.invalidEmail') }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder={t('auth.register.email')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.register.password')}
            rules={[
              { required: true, message: t('auth.register.passwordRequired') },
              { min: 6, message: t('auth.register.passwordMinLength') }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder={t('auth.register.password')}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('auth.register.confirmPassword')}
            dependencies={['password']}
            rules={[
              { required: true, message: t('auth.register.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('auth.register.passwordMismatch')));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder={t('auth.register.confirmPassword')}
            />
          </Form.Item>

          <Form.Item
            label="Avatar (optional)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Choose image</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              {t('auth.register.signUp')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical">
              <Text type="secondary">
                {t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.signIn')}</Link>
              </Text>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
