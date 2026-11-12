import type { ThemeConfig } from 'antd';

/** 与用户端同一套品牌色，后台保持更紧凑的控件高度。 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#12B886',
    colorLink: '#0E9F75',
    colorSuccess: '#46B90C',
    colorWarning: '#E6AD0C',
    colorError: '#D9221E',
    colorInfo: '#2176D9',
    colorBgLayout: '#F4F8FC',
    colorText: '#1F2D3D',
    colorTextSecondary: '#5B6B7B',
    colorBorder: '#E3EAF2',
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Button: { primaryShadow: 'none', fontWeight: 500 },
  },
};
