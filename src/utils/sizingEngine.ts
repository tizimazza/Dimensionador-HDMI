import { ProjectInputs, SizingResult, ConfigurableRules } from '../types';

export function calculateSizing(inputs: ProjectInputs, config: ConfigurableRules): SizingResult {
  const result: SizingResult = {
    architectureName: '',
    architectureDescription: '',
    architectureReasoning: '',
    topologyCategory: '',
    recommendedLinks: [],
    bom: [],
    warnings: [],
    bestPractices: [],
    diagramData: {
      sources: Array(inputs.sourcesCount).fill({ name: 'Fonte HDMI', icon: 'Laptop' }),
      displays: Array(inputs.displaysCount).fill({ name: 'Tela / Projetor', distance: inputs.maxDistance, icon: 'Monitor' }),
    }
  };

  const isDist = inputs.sourcesCount > 1 || inputs.displaysCount > 1;

  // 1. Equipamento Central
  let eqName = null;
  let eqSku = '';

  if (inputs.sourcesCount === 1 && inputs.displaysCount > 1) {
    eqName = `Splitter HDMI 1x${inputs.displaysCount <= 2 ? '2' : '4'} 4K`;
    eqSku = inputs.displaysCount <= 2 ? config.skuDictionary.splitter_1x2 : config.skuDictionary.splitter_1x4;
    result.architectureName = 'Distribuição Centralizada (Splitter)';
    result.architectureDescription = 'Uma única fonte de sinal enviada simultaneamente e de forma espelhada para múltiplas telas.';
    result.architectureReasoning = `Como há apenas 1 fonte sendo enviada para ${inputs.displaysCount} telas, o divisor HDMI (Splitter) é a escolha padrão.`;
  } else if (inputs.sourcesCount > 1 && inputs.displaysCount >= 1) {
    const isSmallMatrix = inputs.sourcesCount <= 4 && inputs.displaysCount <= 4;
    eqName = `Matriz HDMI ${isSmallMatrix ? '4x4' : '8x8'} 4K`;
    eqSku = isSmallMatrix ? config.skuDictionary.matrix_4x4 : config.skuDictionary.matrix_8x8;
    result.architectureName = 'Comutação Centralizada (Matriz)';
    result.architectureDescription = 'Qualquer fonte pode ser roteada para qualquer tela, de forma independente.';
    result.architectureReasoning = `Para comutação cruzada de ${inputs.sourcesCount} fontes para ${inputs.displaysCount} telas de forma independente, a Matriz HDMI dedicada foi selecionada.`;
  } else {
    result.architectureName = 'Ponto-a-Ponto Simples';
    result.architectureDescription = 'Ligação direta entre fonte e tela.';
    result.architectureReasoning = 'Sistema básico 1-para-1.';
  }

  if (eqName) {
    result.diagramData.equipmentName = eqName;
    result.bom.push({ id: 'eq_central', category: 'Equipamento', name: eqName, sku: eqSku || 'GEN-EQ', brand: 'AVLIFE', quantity: 1, unit: 'un', notes: '' });
    result.bom.push({ id: 'short_hdmi_cu', category: 'Cabeamento', name: 'Cabo HDMI Curto (Fonte)', sku: config.skuDictionary.short_hdmi, brand: 'Discabos', quantity: inputs.sourcesCount, unit: 'un', notes: 'Para ligar as fontes de vídeo no equipamento.' });
  }

  // Helper function to find closest cable length
  const getClosestCable = (dist: number, available: number[]) => {
    return available.find(l => l >= dist) || available[available.length - 1];
  };

  // 2. Meio de Transmissão baseado em Resolução
  if (inputs.resolution === '1080p' || inputs.resolution === '1080p_3d') {
    if (inputs.maxDistance <= 15) {
      const len = getClosestCable(inputs.maxDistance, [1, 3, 5, 10, 15]);
      result.architectureReasoning += ` Distância suportada nativamente. Utilizando cabo HDMI 1080p de ${len}m.`;
      const sku = config.skuDictionary[`cable_1080p_${len}m`] || `CAB-1080-${len}M`;
      result.bom.push({ id: 'cable_1080p', category: 'Cabeamento', name: `Cabo HDMI 1080p (${len}m)`, sku: sku, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: `Cabo principal até as telas.` });
    } else {
      result.architectureReasoning += ` Para 1080p acima de 15m (até 100m), recomendamos o sistema de Extensão HDMI via IP.`;
      result.diagramData.isAvIp = true;
      result.diagramData.equipmentName = result.diagramData.equipmentName || 'Switch de Rede (Gigabit)';
      const isMany = inputs.sourcesCount > 1;
      const txSku = isMany ? config.skuDictionary.nesc_tx : config.skuDictionary.espo_tx;
      const rxSku = isMany ? config.skuDictionary.nesc_rx : config.skuDictionary.espo_rx;
      
      result.bom.push({ id: 'av_ip_tx', category: 'Equipamento (TX)', name: `Transmissor AV sobre IP`, sku: txSku, brand: 'AVLIFE', quantity: inputs.sourcesCount, unit: 'un', notes: 'Junto a cada fonte.' });
      result.bom.push({ id: 'av_ip_rx', category: 'Equipamento (RX)', name: `Receptor AV sobre IP`, sku: rxSku, brand: 'AVLIFE', quantity: inputs.displaysCount, unit: 'un', notes: 'Atrás de cada tela.' });
      result.bom.push({ id: 'network_switch', category: 'Infraestrutura', name: 'Switch de Rede Gigabit', sku: config.skuDictionary.switch_gigabit, brand: 'Diversas', quantity: 1, unit: 'un', notes: 'Obrigatório suporte a IGMP.' });
      result.bom.push({ id: 'patch_cord', category: 'Cabeamento', name: 'Cabo de Rede Cat6', sku: config.skuDictionary.cat6_meter, brand: 'Diversas', quantity: (inputs.sourcesCount + inputs.displaysCount) * inputs.maxDistance, unit: 'm', notes: `Estimativa de rede.` });
      if (!eqName) { // if no matrix, we need short cables for sources too
          result.bom.push({ id: 'short_hdmi', category: 'Cabeamento', name: 'Cabo HDMI Curto', sku: config.skuDictionary.short_hdmi, brand: 'Discabos', quantity: inputs.sourcesCount + inputs.displaysCount, unit: 'un', notes: 'Para TX e RX.' });
      } else {
          result.bom.push({ id: 'short_hdmi_rx', category: 'Cabeamento', name: 'Cabo HDMI Curto (Tela)', sku: config.skuDictionary.short_hdmi, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: 'Do RX até a tela.' });
      }
    }
  } else if (inputs.resolution === '4k' || inputs.resolution === '4k_30hz' || inputs.resolution === '4k_60hz') {
    if (inputs.maxDistance <= 5) {
      const len = getClosestCable(inputs.maxDistance, [1, 3, 5]);
      result.architectureReasoning += ` Distância suportada. Utilizando cabo HDMI 4K normal de ${len}m.`;
      const sku = config.skuDictionary[`cable_4k_${len}m`] || `CAB-4K-${len}M`;
      result.bom.push({ id: 'cable_4k', category: 'Cabeamento', name: `Cabo HDMI 4K (${len}m)`, sku: sku, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: `Ligação direta para 4K.` });
    } else {
      // 4K > 5m
      if (isDist) { // Tem matrix/splitter -> recomendar HDBaseT para facilitar passagem
        const use150m = inputs.maxDistance > 40; // 70m extender supports 40m 4K
        result.architectureReasoning += ` Como existe comutação e a distância é maior que 5m, recomendamos Extensores HDBaseT 4K para facilitar a passagem em conduíte.`;
        const sku = use150m ? config.skuDictionary.hdbaset_150m : config.skuDictionary.hdbaset_70m;
        result.bom.push({ id: 'hdbaset', category: 'Extensor', name: `Extensor HDBaseT 4K (${use150m ? '150m/120m 4K' : '70m/40m 4K'})`, sku: sku, brand: 'AVLIFE', quantity: inputs.displaysCount, unit: 'un', notes: 'Transmissor e Receptor.' });
        result.bom.push({ id: 'patch_cord', category: 'Infraestrutura', name: 'Cabo de Rede Cat6', sku: config.skuDictionary.cat6_meter, brand: 'Diversas', quantity: inputs.displaysCount * inputs.maxDistance, unit: 'm', notes: `Link HDBaseT.` });
        result.bom.push({ id: 'short_hdmi_rx', category: 'Cabeamento', name: 'Cabo HDMI Curto (Tela)', sku: config.skuDictionary.short_hdmi, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: 'Para telas.' });
      } else { // 1x1 -> Cabo Fibra
        const len = getClosestCable(inputs.maxDistance, [10, 15, 20, 30, 50, 100]);
        result.architectureReasoning += ` Ligação 1-para-1 direta 4K a longa distância. Recomendamos o Cabo HDMI de Fibra Óptica 4K de ${len}m.`;
        const sku = config.skuDictionary[`fiber_4k_${len}m`] || `CAB-4KF-${len}M`;
        result.bom.push({ id: 'fiber_4k', category: 'Cabeamento', name: `Cabo HDMI Fibra Óptica 4K (${len}m)`, sku: sku, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: `Sinal perfeito sem perda.` });
      }
    }
  } else if (inputs.resolution === '8k' || inputs.resolution === '8k_60hz') {
     const len = getClosestCable(inputs.maxDistance, [3, 10, 15, 20, 50]);
     result.architectureReasoning += ` Para altíssima resolução 8K, recomendamos diretamente o Cabo HDMI de Fibra Óptica 8K de ${len}m.`;
     const sku = config.skuDictionary[`fiber_8k_${len}m`] || `CAB-8KF-${len}M`;
     result.bom.push({ id: 'fiber_8k', category: 'Cabeamento', name: `Cabo HDMI Fibra Óptica 8K (${len}m)`, sku: sku, brand: 'Discabos', quantity: inputs.displaysCount, unit: 'un', notes: `Cabo Ultra High Speed 8K.` });
  }

  return result;
}
