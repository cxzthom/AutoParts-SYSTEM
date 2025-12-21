import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mecsystem.erp',
  appName: 'MEC System',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Configurações de plugins nativos viriam aqui
  }
};

export default config;