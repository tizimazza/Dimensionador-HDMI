export type ResolutionType = '1080p_60hz' | '4k_30hz' | '4k_60hz' | '4k_60hz_hdr' | '8k_60hz_4k_120hz' | string;

export interface CableOption {
  id: string;
  name: string;
  sku: string;
  brand: 'Discabos' | 'AVLIFE' | 'UGREEN' | 'ATEN' | 'CRESTRON';
  category: 'copper' | 'fiber_aoc' | 'fiber_detachable' | 'cat6';
  maxDistanceMeters: number;
  supportedResolution: string[];
  bandwidth: string;
  diameter: string;
  bestFor: string;
  conduitRequirement: string;
  pros: string[];
  cons: string[];
}

export interface EquipmentOption {
  id: string;
  name: string;
  sku: string;
  brand: 'Discabos' | 'AVLIFE' | 'UGREEN' | 'ATEN' | 'CRESTRON';
  category: 'splitter' | 'matrix_hdmi' | 'extender_hdbaset' | 'av_over_ip_tx' | 'av_over_ip_rx';
  inputsCount: number;
  outputsCount: number;
  maxDistanceMeters: number;
  bandwidth: string;
  supportedResolutions: string[];
  description: string;
  keyFeatures: string[];
  topologyType: string;
  pros: string[];
  powerRequirement: string;
  poeOrPoc: boolean;
}

export interface ConfigurableRules {
  version: string;
  lastUpdated: string;
  distanceThresholds: {
    copperMaxRecommendedMeters: number;
    fiberAocMaxRecommendedMeters: number;
    cat6ExtenderMaxMeters: number;
    hdbasetMaxMeters: number;
    avOverIpPerHopMeters: number;
  };
  avIpSkus: {
    espoTx: string;
    espoRx: string;
    nescTx: string;
    nescRx: string;
  };
  productLinks: {
    platino: string;
    avis: string;
    ugreen_8k: string;
    ugreen_fiber: string;
    ip_avlife: string;
    hdbaset_70: string;
    hdbaset_150: string;
  };
  skuDictionary: Record<string, string>;
  adminEmail: string;
  cableCatalog: CableOption[];
  equipmentCatalog: EquipmentOption[];
}

export interface ProjectInputs {
  projectName?: string;
  clientName?: string;
  userEmail?: string;
  userPhone?: string;
  sourcesCount: number;
  displaysCount: number;
  maxDistance: number;
  resolution: string;
  infraType: string;
  displayMode: string;
  environment: string;
}

export interface BomItem {
  id: string;
  category: string;
  name: string;
  sku: string;
  brand: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface SizingResult {
  architectureName: string;
  architectureDescription: string;
  architectureReasoning: string;
  topologyCategory: string;
  primaryCable?: CableOption;
  primaryEquipment?: EquipmentOption | null;
  recommendedLinks: Array<{ label: string; url: string }>;
  bom: BomItem[];
  warnings: string[];
  bestPractices: string[];
  isUnsupported?: boolean;
  unsupportedReason?: string;
  diagramData: {
    sources: Array<{ name: string; icon: string }>;
    displays: Array<{ name: string; distance: number; icon: string }>;
    equipmentName?: string;
    cablesToDisplays?: string;
    isAvIp?: boolean;
  };
}

export interface PresetProject {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  inputs: ProjectInputs;
}

export interface BrandThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  headerBgColor: string;
  accentColor: string;
  themeName: string;
}
