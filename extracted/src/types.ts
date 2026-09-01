export type MemoryId = 'ocean' | 'city' | 'message';

export type EnvironmentalObjectId = 'terminal' | 'transceiver';

export type DiscoveryId =
  | MemoryId
  | 'archive_core'
  | 'secret_signal'
  | EnvironmentalObjectId;

export interface MemoryData {
  id: MemoryId;
  number: string;
  code: string;
  title: string;
  subtitle: string;
  themeColor: string; // hex
  glowColor: string;  // css color string
  accentColor: string;
  position: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  bodyLines: string[];
  metadata: {
    year: string;
    classification: string;
    sector: string;
    integrity: string;
    timestamp: string;
  };
}

export interface EnvironmentalObjectData {
  id: EnvironmentalObjectId;
  code: string;
  title: string;
  status: string;
  lastActivityLabel: string;
  lastActivity: string;
  notes: string[];
  position: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
}

export interface ArchivalFragment {
  id: string;
  code: string;
  quote: string;
  position: [number, number, number];
  sector: string;
}

export interface SecretSignalData {
  title: string;
  source: string;
  age: string;
  frequency: string;
  status: string;
  message: string;
  subtext: string;
  position: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
}

export const ARCHIVAL_FRAGMENTS: ArchivalFragment[] = [
  {
    id: 'frag-1',
    code: 'RECORD 0192',
    quote: 'We thought the network would outlive us.',
    position: [-2.6, -3.8, 1.8],
    sector: 'SECTOR-04 // POWER CONDUIT',
  },
  {
    id: 'frag-2',
    code: 'RECORD 0841',
    quote: 'Day 3,941. Still waiting.',
    position: [3.8, -3.8, -2.4],
    sector: 'SECTOR-09 // PERIMETER BENCH',
  },
  {
    id: 'frag-3',
    code: 'RECORD 1107',
    quote: 'Everyone kept saying someone would come back.',
    position: [-4.8, -2.8, -3.2],
    sector: 'SECTOR-12 // RELAY MAST',
  },
  {
    id: 'frag-4',
    code: 'RECORD 2014',
    quote: 'Do not erase the archive.',
    position: [2.2, -3.6, 4.4],
    sector: 'SECTOR-02 // CORE FEED',
  },
  {
    id: 'frag-5',
    code: 'RECORD 2098',
    quote: 'If the stars do not answer, leave the record burning.',
    position: [-0.8, 3.2, -4.5],
    sector: 'SECTOR-01 // CEILING GANTRY',
  },
];

export const ENVIRONMENTAL_OBJECTS: Record<EnvironmentalObjectId, EnvironmentalObjectData> = {
  terminal: {
    id: 'terminal',
    code: 'OBJECT 07',
    title: 'COMMUNICATION TERMINAL',
    status: 'OFFLINE',
    lastActivityLabel: 'LAST ACTIVITY',
    lastActivity: '2098-11-03',
    notes: [
      'Cathode decay across upper sector.',
      'Manual input queue drained 32,840 days ago.',
    ],
    position: [-2.8, -3.7, 0.6],
    cameraTarget: [-2.8, -3.5, 0.6],
    cameraPosition: [-2.8, -2.9, 3.2],
  },
  transceiver: {
    id: 'transceiver',
    code: 'OBJECT 12',
    title: 'RESONANCE TRANSCEIVER',
    status: 'DAMAGED',
    lastActivityLabel: 'LAST LOG',
    lastActivity: '2098-12-21',
    notes: [
      'Antenna assembly sheared at base.',
      'Receiving coil retains faint solar capacitance.',
    ],
    position: [3.4, -3.6, 2.8],
    cameraTarget: [3.4, -3.4, 2.8],
    cameraPosition: [3.4, -2.7, 5.2],
  },
};

export const SECRET_SIGNAL_DATA: SecretSignalData = {
  title: 'FINAL SIGNAL',
  source: 'UNKNOWN',
  age: 'UNKNOWN',
  frequency: '1420.4057 MHz // HYDROGEN LINE',
  status: 'RECEIVING',
  message: 'Someone is still listening.',
  subtext: 'ANOMALY DETECTED AT THE PERIPHERY OF THE RECORD',
  position: [8.4, 4.8, -6.2],
  cameraTarget: [8.4, 4.8, -6.2],
  cameraPosition: [8.4, 5.0, -3.0],
};

export const MEMORIES_DATA: Record<MemoryId, MemoryData> = {
  ocean: {
    id: 'ocean',
    number: '01',
    code: 'MEMORY 01',
    title: 'THE OCEAN',
    subtitle: 'HYDROSOUND RECORDING // ATLANTIC CORE',
    themeColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    accentColor: '#38bdf8',
    position: [-4.2, 1.2, 2.2],
    cameraTarget: [-4.2, 1.2, 2.2],
    cameraPosition: [-4.2, 1.8, 6.2],
    bodyLines: [
      'Before the silence, people gathered here to watch the water.',
      'The archive remembers billions of voices asking the same question:',
      'What comes after us?'
    ],
    metadata: {
      year: '2098',
      classification: 'NATURAL WORLD // HYDROLOGICAL ARCHIVE',
      sector: 'SECTOR-07 (SURVIVING TIDE NODE)',
      integrity: '99.4% RECOVERED',
      timestamp: 'OCTOBER 2098 // 23:59:00 UTC'
    }
  },
  city: {
    id: 'city',
    number: '02',
    code: 'MEMORY 02',
    title: 'THE CITY',
    subtitle: 'URBAN GRID RESIDUALS // METROPOLIS 4',
    themeColor: '#ffb300',
    glowColor: 'rgba(255, 179, 0, 0.4)',
    accentColor: '#f59e0b',
    position: [4.4, 1.8, 1.6],
    cameraTarget: [4.4, 1.8, 1.6],
    cameraPosition: [4.4, 2.4, 5.8],
    bodyLines: [
      'The last traffic signal blinked for eleven years after the streets emptied.',
      'Someone kept the lights on because they believed somebody would return.'
    ],
    metadata: {
      year: '2098',
      classification: 'CIVILIZATION // GRID LOGISTICS',
      sector: 'METRO GRID // AUTOMATED RELAY',
      integrity: '98.1% RECOVERED',
      timestamp: 'NOVEMBER 2098 // 04:12:18 UTC'
    }
  },
  message: {
    id: 'message',
    number: '03',
    code: 'MEMORY 03',
    title: 'THE MESSAGE',
    subtitle: 'HUMAN RESIDUAL TRANSMISSION // FINAL LOG',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#34d399',
    position: [0.2, -2.6, 3.4],
    cameraTarget: [0.2, -2.6, 3.4],
    cameraPosition: [0.2, -2.0, 7.4],
    bodyLines: [
      'IF YOU ARE READING THIS,',
      'HUMANITY WAS HERE.',
      'WE WERE FRIGHTENED.',
      'WE WERE CURIOUS.',
      'WE TRIED.'
    ],
    metadata: {
      year: '2098',
      classification: 'SPECIES TESTAMENT // FINAL COGNITION',
      sector: 'EARTH BROADCAST NODE 01',
      integrity: '100% DECRYPTED',
      timestamp: 'DECEMBER 2098 // 00:00:01 UTC'
    }
  }
};
