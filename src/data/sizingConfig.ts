import { ConfigurableRules } from '../types';

export const INITIAL_SIZING_CONFIG: ConfigurableRules = {
  version: "1.2",
  lastUpdated: "2023-11-20",
  distanceThresholds: {
    copperMaxRecommendedMeters: 15,
    fiberAocMaxRecommendedMeters: 100,
    cat6ExtenderMaxMeters: 50,
    hdbasetMaxMeters: 100,
    avOverIpPerHopMeters: 100
  },
  avIpSkus: {
    espoTx: "AVL-ESPO-TX",
    espoRx: "AVL-ESPO-RX",
    nescTx: "AVL-NESC-TX",
    nescRx: "AVL-NESC-RX"
  },
  productLinks: {
    platino: "",
    avis: "",
    ugreen_8k: "",
    ugreen_fiber: "",
    ip_avlife: "",
    hdbaset_70: "",
    hdbaset_150: ""
  },
  skuDictionary: {
    // Infra
    "short_hdmi": "AV-CAB-CU-1.8",
    "cat6_meter": "GEN-CAT6",
    "switch_gigabit": "GEN-SWITCH",
    
    // Distribuição
    "splitter_1x2": "SPL-1X2-4K",
    "splitter_1x4": "SPL-1X4-4K",
    "matrix_4x4": "MTX-4X4-4K",
    "matrix_8x8": "MTX-8X8-4K",
    
    // Cabos 1080p
    "cable_1080p_1m": "CAB-1080-1M",
    "cable_1080p_3m": "CAB-1080-3M",
    "cable_1080p_5m": "CAB-1080-5M",
    "cable_1080p_10m": "CAB-1080-10M",
    "cable_1080p_15m": "CAB-1080-15M",
    
    // IP Extenders (1080p > 15m)
    "espo_tx": "AVL-ESPO-TX",
    "espo_rx": "AVL-ESPO-RX",
    "nesc_tx": "AVL-NESC-TX",
    "nesc_rx": "AVL-NESC-RX",
    
    // Cabos 4K normais
    "cable_4k_1m": "CAB-4K-1M",
    "cable_4k_3m": "CAB-4K-3M",
    "cable_4k_5m": "CAB-4K-5M",
    
    // Cabos 4K Fibra
    "fiber_4k_10m": "CAB-4KF-10M",
    "fiber_4k_15m": "CAB-4KF-15M",
    "fiber_4k_20m": "CAB-4KF-20M",
    "fiber_4k_30m": "CAB-4KF-30M",
    "fiber_4k_50m": "CAB-4KF-50M",
    "fiber_4k_100m": "CAB-4KF-100M",
    
    // HDBaseT Extenders (4K > 5m)
    "hdbaset_70m": "EXT-HDBT-70M",
    "hdbaset_150m": "EXT-HDBT-150M",
    
    // Cabos 8K Fibra
    "fiber_8k_3m": "CAB-8KF-3M",
    "fiber_8k_10m": "CAB-8KF-10M",
    "fiber_8k_15m": "CAB-8KF-15M",
    "fiber_8k_20m": "CAB-8KF-20M",
    "fiber_8k_50m": "CAB-8KF-50M"
  },
  adminEmail: "comercial@discabos.com.br",
  cableCatalog: [
    {
      id: "cab_hdmi_cu_1_8",
      name: "Cabo HDMI Cobre Alta Velocidade (1.8m)",
      sku: "AV-CAB-CU-1.8",
      brand: "Discabos",
      category: "copper",
      maxDistanceMeters: 2,
      supportedResolution: ["1080p_60hz", "4k_30hz", "4k_60hz"],
      bandwidth: "18 Gbps",
      diameter: "7.3mm",
      bestFor: "Conexões curtas de equipamentos no rack",
      conduitRequirement: "Aberto ou > 1 polegada",
      pros: ["Custo-benefício", "Flexibilidade em racks"],
      cons: []
    },
    {
      id: "cab_hdmi_cu_1",
      name: "Cabo HDMI Cobre Alta Velocidade",
      sku: "AV-CAB-CU-01",
      brand: "Discabos",
      category: "copper",
      maxDistanceMeters: 15,
      supportedResolution: ["1080p_60hz", "4k_30hz", "4k_60hz"],
      bandwidth: "18 Gbps",
      diameter: "7.3mm",
      bestFor: "Conexões curtas, racks, monitores locais",
      conduitRequirement: "Aberto ou > 1 polegada",
      pros: ["Custo-benefício", "Durabilidade física", "Passivo"],
      cons: ["Distância limitada", "Atenuação de sinal longas metragens", "Espessura"]
    },
    {
      id: "cab_hdmi_fbr_1",
      name: "Cabo HDMI Fibra Óptica Híbrido (AOC)",
      sku: "AV-CAB-FBR-01",
      brand: "Discabos",
      category: "fiber_aoc",
      maxDistanceMeters: 100,
      supportedResolution: ["1080p_60hz", "4k_60hz", "4k_60hz_hdr"],
      bandwidth: "18 Gbps",
      diameter: "4.5mm",
      bestFor: "Projetores de teto, displays remotos até 100m",
      conduitRequirement: "Mínimo 3/4 polegada",
      pros: ["Zero atenuação de sinal", "Fino e flexível", "Sem interferência EMI"],
      cons: ["Unidirecional (ponta certa)", "Mais frágil a tração que cobre"]
    },
    {
      id: "cab_hdmi_fbr_det",
      name: "Cabo HDMI Fibra Óptica Ponta Destacável",
      sku: "AV-CAB-FBR-DET",
      brand: "AVLIFE",
      category: "fiber_detachable",
      maxDistanceMeters: 100,
      supportedResolution: ["1080p_60hz", "4k_60hz", "4k_60hz_hdr", "8k_60hz_4k_120hz"],
      bandwidth: "48 Gbps (HDMI 2.1)",
      diameter: "4.0mm",
      bestFor: "Passagem em conduítes apertados, instalações complexas, alto tráfego de dados",
      conduitRequirement: "Mínimo 1/2 polegada",
      pros: ["Ponta destacável micro-HDMI facilita passagem", "HDMI 2.1 real (48Gbps)", "Ultra fino"],
      cons: ["Custo premium", "Requer cuidado no encaixe da ponteira"]
    }
  ],
  equipmentCatalog: [
    {
      id: "eq_split_1x2",
      name: "Splitter HDMI 1x2 4K",
      sku: "AVL-SPL-1X2-4K",
      brand: "AVLIFE",
      category: "splitter",
      inputsCount: 1,
      outputsCount: 2,
      maxDistanceMeters: 15,
      bandwidth: "18 Gbps",
      supportedResolutions: ["1080p_60hz", "4k_60hz"],
      description: "Distribui 1 sinal HDMI para 2 telas simultaneamente.",
      keyFeatures: ["EDID management", "Caixa de metal", "Suporte HDR"],
      topologyType: "distribuicao",
      pros: ["Simples e direto", "Telas com imagem idêntica"],
      powerRequirement: "5V DC",
      poeOrPoc: false
    },
    {
      id: "eq_split_1x4",
      name: "Splitter HDMI 1x4 4K",
      sku: "AVL-SPL-1X4-4K",
      brand: "AVLIFE",
      category: "splitter",
      inputsCount: 1,
      outputsCount: 4,
      maxDistanceMeters: 15,
      bandwidth: "18 Gbps",
      supportedResolutions: ["1080p_60hz", "4k_60hz"],
      description: "Distribui 1 sinal HDMI para 4 telas simultaneamente.",
      keyFeatures: ["EDID management", "Cascateável", "Suporte HDR"],
      topologyType: "distribuicao",
      pros: ["Bom para sinalização digital pequena", "Telas com imagem idêntica"],
      powerRequirement: "5V DC",
      poeOrPoc: false
    },
    {
      id: "eq_mat_4x4",
      name: "Matriz HDMI 4x4 4K",
      sku: "AVL-MAT-4X4-4K",
      brand: "AVLIFE",
      category: "matrix_hdmi",
      inputsCount: 4,
      outputsCount: 4,
      maxDistanceMeters: 15,
      bandwidth: "18 Gbps",
      supportedResolutions: ["1080p_60hz", "4k_60hz"],
      description: "Roteia 4 fontes independentes para 4 telas independentes.",
      keyFeatures: ["Controle IR/RS232/IP", "Web GUI", "Extração de Áudio"],
      topologyType: "comutacao",
      pros: ["Flexibilidade total", "Ideal para salas de reunião multi-uso"],
      powerRequirement: "12V DC",
      poeOrPoc: false
    },
    {
      id: "eq_mat_8x8",
      name: "Matriz HDMI 8x8 4K",
      sku: "AVL-MAT-8X8-4K",
      brand: "AVLIFE",
      category: "matrix_hdmi",
      inputsCount: 8,
      outputsCount: 8,
      maxDistanceMeters: 15,
      bandwidth: "18 Gbps",
      supportedResolutions: ["1080p_60hz", "4k_60hz"],
      description: "Roteia 8 fontes independentes para 8 telas independentes.",
      keyFeatures: ["Controle IR/RS232/IP", "Painel Frontal LCD", "Gerenciamento EDID avançado"],
      topologyType: "comutacao",
      pros: ["Grande capacidade", "Controle centralizado"],
      powerRequirement: "12V DC",
      poeOrPoc: false
    },
    {
      id: "eq_ext_hdbaset_70",
      name: "Kit Extensor HDBaseT 70m",
      sku: "AVL-EXT-HDBT-70",
      brand: "AVLIFE",
      category: "extender_hdbaset",
      inputsCount: 1,
      outputsCount: 1,
      maxDistanceMeters: 70,
      bandwidth: "10.2 Gbps",
      supportedResolutions: ["1080p_60hz", "4k_30hz"],
      description: "Estende sinal HDMI via 1 único cabo Cat6 até 70m.",
      keyFeatures: ["Transmissão de IR bi-direcional", "Design ultra fino"],
      topologyType: "extensao",
      pros: ["Aproveita infra de rede existente", "Robusto (HDBaseT)"],
      powerRequirement: "12V DC",
      poeOrPoc: true
    }
  ]
};
