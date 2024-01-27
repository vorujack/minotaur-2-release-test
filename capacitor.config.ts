import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ml.minotaur.wallet2',
  appName: 'minotaur 2',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      electronIsEncryption: false,
    },
  },
};

export default config;
