import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autoparts.erp',
  appName: 'AutoParts ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Configurações de plugins nativos viriam aqui
  }
};

export default config;