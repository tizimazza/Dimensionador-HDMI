import React, { useState } from 'react';
import { ProjectInputs } from '../types';
import { INITIAL_SIZING_CONFIG } from '../data/sizingConfig';
import { calculateSizing } from '../utils/sizingEngine';
import { Diagram } from '../components/Diagram';
import { Settings, Info, Send, AlertCircle, Mail, ChevronRight, ChevronLeft, CheckCircle2, ExternalLink, Package } from 'lucide-react';

export default function FrontendView() {
  const [step, setStep] = useState(1);
  const [wooProducts, setWooProducts] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [inputs, setInputs] = useState<ProjectInputs>({
    userEmail: 'usuario.logado@empresa.com.br',
    sourcesCount: 1,
    displaysCount: 1,
    maxDistance: 15,
    resolution: '1080p',
    infraType: 'standard_conduit',
    displayMode: 'same_content',
    environment: 'corporativo'
  });

  const [isQuoteSent, setIsQuoteSent] = useState(false);

  const handleInputChange = (field: keyof ProjectInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    // Calculate BoM first to get SKUs
    const sizingResult = calculateSizing(inputs, INITIAL_SIZING_CONFIG);
    const skus = sizingResult.bom.map(item => item.sku);

    // Simulate WP REST API Call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockWcResponse: Record<string, any> = {};
    skus.forEach(sku => {
      mockWcResponse[sku] = {
        id: Math.floor(Math.random() * 10000), // Simula ID do WP
        name: `Produto WooCommerce (${sku})`,
        url: `https://discabos.com.br/produto/${sku.toLowerCase()}`,
        image: `https://via.placeholder.com/80?text=${sku}`
      };
    });
    
    setWooProducts(mockWcResponse);
    setIsCalculating(false);
    setStep(4);
  };

  const sizing = step === 4 ? calculateSizing(inputs, INITIAL_SIZING_CONFIG) : null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-[inherit]">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Wizard Header / Progress */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Settings className="w-6 h-6 text-[#DF1319]" />
            Dimensionador A/V Interativo
          </h2>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(num => (
              <React.Fragment key={num}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= num ? 'bg-[#DF1319] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
                {num < 4 && (
                  <div className={`flex-1 h-1.5 rounded-full ${step > num ? 'bg-[#DF1319]' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-slate-500 px-1">
            <span>Quantidades</span>
            <span>Qualidade</span>
            <span>Ambiente</span>
            <span>Resultado</span>
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 md:p-8 min-h-[350px]">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Quantos equipamentos iremos conectar?</h3>
              <p className="text-slate-600 mb-8">Defina a quantidade de fontes de sinal (computadores, câmeras, decodificadores) e a quantidade de telas onde o sinal será exibido.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <label className="block text-lg font-bold text-slate-700 mb-2">Qtd. de Fontes (Inputs)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={inputs.sourcesCount} 
                    onChange={e => handleInputChange('sourcesCount', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 text-xl font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <label className="block text-lg font-bold text-slate-700 mb-2">Qtd. de Telas (Outputs)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={inputs.displaysCount} 
                    onChange={e => handleInputChange('displaysCount', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 text-xl font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Qual a resolução de vídeo exigida?</h3>
              <p className="text-slate-600 mb-8">O volume de dados (banda) trafegado influencia diretamente no tipo de meio físico necessário.</p>
              
              <div className="max-w-md mx-auto space-y-4">
                {[
                  { id: '1080p', label: 'Full HD (1080p)', desc: 'Qualidade padrão para monitores comuns.' },
                  { id: '1080p_3d', label: 'Full HD 3D', desc: 'Sinal 1080p com dados estereoscópicos.' },
                  { id: '4k_30hz', label: '4K 30Hz', desc: 'Ultra HD básico (Filmes, apresentações).' },
                  { id: '4k_60hz', label: '4K 60Hz', desc: 'Ultra HD com fluidez (60 frames por segundo).' },
                  { id: '8k_60hz', label: '8K 60Hz', desc: 'Extrema resolução, altíssima largura de banda.' },
                ].map(opt => (
                  <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${inputs.resolution === opt.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <input type="radio" name="res" value={opt.id} checked={inputs.resolution === opt.id} onChange={e => handleInputChange('resolution', e.target.value)} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                    <div>
                      <div className="font-bold text-slate-800">{opt.label}</div>
                      <div className="text-sm text-slate-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Como é o ambiente da instalação?</h3>
              <p className="text-slate-600 mb-8">O quão longe o sinal precisará chegar e como a infraestrutura física está preparada?</p>
              
              <div className="max-w-lg mx-auto space-y-6">
                <div>
                  <label className="block text-lg font-bold text-slate-700 mb-2">Distância Máxima (metros)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={inputs.maxDistance} 
                    onChange={e => handleInputChange('maxDistance', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 text-xl font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-slate-500 mt-2">Distância física do rack / equipamento central até a tela mais distante do projeto.</p>
                </div>

                <div>
                  <label className="block text-lg font-bold text-slate-700 mb-2">Infraestrutura (Tubulação)</label>
                  <select 
                    value={inputs.infraType} 
                    onChange={e => handleInputChange('infraType', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                  >
                    <option value="standard_conduit">Conduíte Padrão (1" ou maior)</option>
                    <option value="tight_conduit">Conduíte Apertado (3/4" ou com muitas curvas)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && sizing && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {sizing.isUnsupported ? (
                 <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                   <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                   <h2 className="text-2xl font-bold text-slate-800 mb-2">Projeto Fora do Padrão</h2>
                   <p className="text-slate-600 mb-8 max-w-lg">{sizing.unsupportedReason}</p>
                   
                   <a href={`mailto:${INITIAL_SIZING_CONFIG.adminEmail}?subject=Consulta Projeto Especial AV`} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md flex items-center gap-2">
                     <Mail className="w-5 h-5" />
                     Consulte um de nossos especialistas
                   </a>
                 </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Solução Recomendada</h2>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-bold border border-blue-200 shadow-sm">
                      {sizing.architectureName}
                    </span>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 mb-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center shrink-0 font-bold">1</div>
                      <div>
                        <h4 className="font-bold text-blue-900 mb-1 text-lg">O que é essa solução?</h4>
                        <p className="text-blue-800 leading-relaxed">{sizing.architectureDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center shrink-0 font-bold">2</div>
                      <div>
                        <h4 className="font-bold text-blue-900 mb-1 text-lg">Por que foi escolhida?</h4>
                        <p className="text-blue-800 leading-relaxed">{sizing.architectureReasoning}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Diagrama de Conexão</h3>
                    <Diagram sizing={sizing} inputs={inputs} />
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Links Diretos para os Produtos Sugeridos</h3>
                    {sizing.recommendedLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {sizing.recommendedLinks.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded shadow transition">
                            {link.label}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">O administrador ainda não cadastrou links para esta categoria de produto.</p>
                    )}
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Lista de Materiais (BoM)</h3>
                    <div className="overflow-x-auto rounded border border-slate-200 shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="p-4">Qtd / Uni</th>
                            <th className="p-4">Produto / SKU</th>
                            <th className="p-4">Categoria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sizing.bom.map((item, idx) => {
                            const wcProduct = wooProducts[item.sku];
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-semibold text-slate-800 whitespace-nowrap text-lg">
                                  {item.quantity} <span className="text-xs font-normal text-slate-500 uppercase">{item.unit}</span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-start gap-4">
                                    {wcProduct ? (
                                      <img src={wcProduct.image} alt={item.name} className="w-16 h-16 object-cover rounded border border-slate-200 shrink-0" />
                                    ) : (
                                      <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                                        <Package className="w-6 h-6" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-slate-800 text-base mb-1">{wcProduct ? wcProduct.name : item.name}</div>
                                      <div className="text-xs text-slate-500 font-mono">SKU: {item.sku} | Marca: {item.brand}</div>
                                      {item.notes && <div className="text-[12px] text-slate-400 mt-2 italic border-l-2 border-slate-200 pl-2">{item.notes}</div>}
                                      {wcProduct && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                          <a href={wcProduct.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded transition-colors">
                                            Ver Produto <ExternalLink className="w-3 h-3" />
                                          </a>
                                          <a href={`/?add-to-cart=${wcProduct.id}&quantity=${item.quantity}`} className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#DF1319] hover:bg-[#b90f14] px-3 py-1.5 rounded transition-colors">
                                            Adicionar ao Pedido
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-600 font-semibold">
                                    {item.category}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    {!isQuoteSent ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                        <div className="text-emerald-800">
                          <span className="font-bold text-lg block mb-1">Gostou desta solução?</span>
                          <span className="text-sm opacity-90">Sua solicitação de orçamento será vinculada ao seu e-mail corporativo de forma automática.</span>
                        </div>
                        <button 
                          onClick={() => setIsQuoteSent(true)}
                          className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-3 shadow-md shrink-0 text-lg"
                        >
                          <Send className="w-5 h-5" />
                          Solicitar Orçamento
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center animate-in fade-in zoom-in-95">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <div className="text-emerald-800 font-bold text-xl mb-2">Solicitação enviada com sucesso!</div>
                        <div className="text-emerald-600">Nossa equipe comercial analisará os requisitos e entrará em contato.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
          {step > 1 && step < 4 ? (
            <button onClick={handlePrev} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button onClick={handleNext} className="px-6 py-2.5 bg-[#DF1319] hover:bg-[#b90f14] text-white font-bold rounded-lg transition shadow-md flex items-center gap-2">
              Avançar <ChevronRight className="w-4 h-4" />
            </button>
          ) : step === 3 ? (
            <button onClick={handleCalculate} disabled={isCalculating} className="px-8 py-3 bg-[#DF1319] hover:bg-[#b90f14] disabled:opacity-70 text-white font-bold rounded-lg transition shadow-md flex items-center gap-2 text-lg">
              {isCalculating ? 'Procurando SKUs...' : 'Sugerir Solução Técnica'} {!isCalculating && <ChevronRight className="w-5 h-5" />}
            </button>
          ) : step === 4 ? (
             <button onClick={() => { setStep(1); setIsQuoteSent(false); }} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition flex items-center gap-2">
              Fazer Novo Dimensionamento
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}
