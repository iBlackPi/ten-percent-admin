import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { App } from './App.tsx';
import { StoreProvider } from './stores/root.tsx';
import { theme } from './theme.ts';
import './app.module.scss';

dayjs.locale('zh-cn');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider theme={theme} locale={zhCN}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
