const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o Frontend (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Exemplo: Função para obter versão do app
  getAppVersion: () => process.versions.electron,
  // Aqui você pode adicionar funções para salvar arquivos locais se quiser sair do Google Drive no futuro
});