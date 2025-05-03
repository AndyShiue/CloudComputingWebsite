'use client';

import React from 'react';
import { Button, Link } from "@nextui-org/react";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function AuthButton() {
  const domain    = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const clientId  = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID!;
  const redirect  = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;

  const { isLoggedIn } = useAuth();
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI!; // ← 分開管理較安全
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID!;
  
    const logoutUrl = `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    window.location.href = logoutUrl;
  }

  const handleLogin = () => {
    const loginUrl  = `https://${domain}/oauth2/authorize?` +
                    `response_type=code&client_id=${clientId}` +
                    `&redirect_uri=${encodeURIComponent(redirect)}` +
                    `&scope=openid+email`;
    router.push(loginUrl);
  }

  return (
    isLoggedIn 
      ? <Button onPress={handleLogout} color="primary" variant="light"> 登出 </Button> 
      : <Button onPress={handleLogin} color="primary" variant="light"> 登入 </Button>
  );
}