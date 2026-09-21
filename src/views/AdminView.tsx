import React, { useState } from 'react';
import { Settings, Download, Monitor, CheckCircle, Package } from 'lucide-react';
import JSZip from 'jszip';
import { generateWordPressPlugin } from '../utils/wordpressStandalonePlugin';

export default function AdminView() {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const phpContent = generateWordPressPlugin();
      const zip = new JSZip();
      
      const folder = zip.folder("dimensionador-hdmi");
      if (folder) {
        folder.file("dimensionador-hdmi.php", phpContent);
        // Add an empty index.php for basic security best practices
        folder.file("index.php", "<?php\n// Silence is golden.");
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dimensionador-hdmi-v15.0.0.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar o ZIP", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] bg-[#f0f0f1] text-[#3c434a]">
      {/* WP Admin Sidebar Simulation */}
      <div className="w-48 bg-[#1d2327] text-white flex flex-col text-sm shrink-0">
        <div className="p-4 bg-[#2c3338] font-bold border-b border-[#2c3338] flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Dimensionador HDMI
        </div>
        <div className="flex-1 py-2">
          <div className="px-4 py-2 hover:bg-[#2c3338] cursor-pointer text-[#72aee6] font-semibold border-l-4 border-[#72aee6] bg-[#2c3338]">Geração do Plugin</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="bg-white border border-[#c3c4c7] rounded p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-normal text-[#1d2327] mb-2">
              Exportador de Plugin WordPress
            </h1>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto">
              O Dimensionador HDMI agora é um plugin totalmente autônomo com seu próprio painel de controle dentro do WordPress.
            </p>

            <button
              onClick={!isExporting ? handleDownload : undefined}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded text-white font-semibold transition-all ${
                isExporting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {isExporting ? 'Compactando...' : 'Fazer Download do Plugin (ZIP)'} 
              <Download className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white border border-[#c3c4c7] rounded p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                O que mudou na V4?
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Painel de configurações nativo no seu <strong>WP Admin</strong> (Menu "Dimensionador HDMI").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Todos os SKUs agora podem ser editados e salvos diretamente no banco de dados do WordPress.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>Geração em formato <strong>.zip</strong> com index.php de segurança, pronto para upload no painel.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-[#c3c4c7] rounded p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Como Instalar
              </h2>
              <ol className="list-decimal pl-4 space-y-3 text-sm text-slate-600 ml-2">
                <li>Baixe o arquivo <strong>.zip</strong> clicando no botão acima.</li>
                <li>No seu WordPress, vá em <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong>.</li>
                <li>Envie o arquivo ZIP e clique em <strong>Ativar</strong>.</li>
                <li>No menu lateral do WP Admin, clique em <strong>Dimensionador HDMI</strong> para revisar os SKUs padrão.</li>
                <li>Use o shortcode <strong>[dimensionador_hdmi]</strong> em qualquer página.</li>
              </ol>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
