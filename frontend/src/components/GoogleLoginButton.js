import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAuth } from '../context/AuthContext';

const GoogleLoginButton = ({ onSuccess, onError, disabled = false }) => {
  const googleButtonRef = useRef(null);
  const { googleLogin } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          // width must be a number per Google Identity Services; omit to allow responsive sizing
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        }
      );
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('Google login response received');
      console.log('useAuth.googleLogin value:', googleLogin, 'typeof:', typeof googleLogin);
      if (typeof googleLogin !== 'function') {
        const errMsg = 'googleLogin is not available from AuthContext';
        console.error(errMsg, googleLogin);
        messageApi.error(errMsg);
        if (onError) onError(errMsg);
        return;
      }

      const result = await googleLogin(response.credential);
      
      if (result.success) {
  messageApi.success('Google login successful!');
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        console.error('Google login failed:', result.error);
  messageApi.error(result.error || 'Google login failed');
        if (onError) {
          onError(result.error);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
  messageApi.error('Google login failed: ' + error.message);
      if (onError) {
        onError(error.message);
      }
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {contextHolder}
      <div 
        ref={googleButtonRef} 
        style={{ 
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto'
        }}
      ></div>
      {!process.env.REACT_APP_GOOGLE_CLIENT_ID && (
        <div style={{ 
          color: '#ff4d4f', 
          fontSize: '12px', 
          marginTop: '8px',
          textAlign: 'center' 
        }}>
          Google Client ID not configured
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;