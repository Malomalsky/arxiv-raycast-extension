export interface ArxivPaper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  primaryCategory: string;
  published: Date;
  updated: Date;
  pdfUrl: string;
  arxivUrl: string;
  comment?: string;
  journalRef?: string;
  doi?: string;
  citationCount?: number;
  readingStatus?: 'new' | 'reading' | 'read';
  isDownloaded?: boolean;
}

export interface Bookmark {
  paperId: string;
  paper: ArxivPaper;
  addedAt: Date;
  tags: string[];
  notes?: string;
  rating?: number;
}

export interface Subscription {
  id: string;
  type: 'category' | 'author' | 'keyword';
  value: string;
  name: string;
  createdAt: Date;
  lastChecked: Date;
  color?: string;
}

export interface SearchFilter {
  sortBy: 'relevance' | 'submittedDate' | 'lastUpdatedDate' | 'citationCount';
  sortOrder: 'ascending' | 'descending';
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  categories?: string[];
  onlyBookmarked?: boolean;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultsCount: number;
}

export const ARXIV_CATEGORIES = {
  'Computer Science': {
    'cs.AI': 'Artificial Intelligence',
    'cs.AR': 'Hardware Architecture',
    'cs.CC': 'Computational Complexity',
    'cs.CE': 'Computational Engineering',
    'cs.CG': 'Computational Geometry',
    'cs.CL': 'Computation and Language',
    'cs.CR': 'Cryptography and Security',
    'cs.CV': 'Computer Vision',
    'cs.CY': 'Computers and Society',
    'cs.DB': 'Databases',
    'cs.DC': 'Distributed Computing',
    'cs.DL': 'Digital Libraries',
    'cs.DM': 'Discrete Mathematics',
    'cs.DS': 'Data Structures and Algorithms',
    'cs.ET': 'Emerging Technologies',
    'cs.FL': 'Formal Languages',
    'cs.GT': 'Computer Science and Game Theory',
    'cs.GR': 'Graphics',
    'cs.HC': 'Human-Computer Interaction',
    'cs.IR': 'Information Retrieval',
    'cs.IT': 'Information Theory',
    'cs.LG': 'Machine Learning',
    'cs.LO': 'Logic in Computer Science',
    'cs.MA': 'Multiagent Systems',
    'cs.MM': 'Multimedia',
    'cs.NI': 'Networking and Internet Architecture',
    'cs.NE': 'Neural and Evolutionary Computing',
    'cs.NA': 'Numerical Analysis',
    'cs.OS': 'Operating Systems',
    'cs.PF': 'Performance',
    'cs.PL': 'Programming Languages',
    'cs.RO': 'Robotics',
    'cs.SE': 'Software Engineering',
    'cs.SI': 'Social and Information Networks',
    'cs.SD': 'Sound',
    'cs.SC': 'Symbolic Computation',
    'cs.SY': 'Systems and Control'
  },
  'Physics': {
    'astro-ph': 'Astrophysics',
    'cond-mat': 'Condensed Matter',
    'gr-qc': 'General Relativity and Quantum Cosmology',
    'hep-ex': 'High Energy Physics - Experiment',
    'hep-lat': 'High Energy Physics - Lattice',
    'hep-ph': 'High Energy Physics - Phenomenology',
    'hep-th': 'High Energy Physics - Theory',
    'math-ph': 'Mathematical Physics',
    'nlin': 'Nonlinear Sciences',
    'nucl-ex': 'Nuclear Experiment',
    'nucl-th': 'Nuclear Theory',
    'physics': 'Physics',
    'quant-ph': 'Quantum Physics'
  },
  'Mathematics': {
    'math.AG': 'Algebraic Geometry',
    'math.AT': 'Algebraic Topology',
    'math.AP': 'Analysis of PDEs',
    'math.CT': 'Category Theory',
    'math.CA': 'Classical Analysis and ODEs',
    'math.CO': 'Combinatorics',
    'math.AC': 'Commutative Algebra',
    'math.CV': 'Complex Variables',
    'math.DG': 'Differential Geometry',
    'math.DS': 'Dynamical Systems',
    'math.FA': 'Functional Analysis',
    'math.GM': 'General Mathematics',
    'math.GN': 'General Topology',
    'math.GT': 'Geometric Topology',
    'math.GR': 'Group Theory',
    'math.HO': 'History and Overview',
    'math.IT': 'Information Theory',
    'math.KT': 'K-Theory and Homology',
    'math.LO': 'Logic',
    'math.MP': 'Mathematical Physics',
    'math.MG': 'Metric Geometry',
    'math.NT': 'Number Theory',
    'math.NA': 'Numerical Analysis',
    'math.OA': 'Operator Algebras',
    'math.OC': 'Optimization and Control',
    'math.PR': 'Probability',
    'math.QA': 'Quantum Algebra',
    'math.RT': 'Representation Theory',
    'math.RA': 'Rings and Algebras',
    'math.SP': 'Spectral Theory',
    'math.ST': 'Statistics Theory',
    'math.SG': 'Symplectic Geometry'
  },
  'Quantitative Biology': {
    'q-bio.BM': 'Biomolecules',
    'q-bio.CB': 'Cell Behavior',
    'q-bio.GN': 'Genomics',
    'q-bio.MN': 'Molecular Networks',
    'q-bio.NC': 'Neurons and Cognition',
    'q-bio.OT': 'Other Quantitative Biology',
    'q-bio.PE': 'Populations and Evolution',
    'q-bio.QM': 'Quantitative Methods',
    'q-bio.SC': 'Subcellular Processes',
    'q-bio.TO': 'Tissues and Organs'
  },
  'Quantitative Finance': {
    'q-fin.CP': 'Computational Finance',
    'q-fin.EC': 'Economics',
    'q-fin.GN': 'General Finance',
    'q-fin.MF': 'Mathematical Finance',
    'q-fin.PM': 'Portfolio Management',
    'q-fin.PR': 'Pricing of Securities',
    'q-fin.RM': 'Risk Management',
    'q-fin.ST': 'Statistical Finance',
    'q-fin.TR': 'Trading and Market Microstructure'
  },
  'Statistics': {
    'stat.AP': 'Applications',
    'stat.CO': 'Computation',
    'stat.ML': 'Machine Learning',
    'stat.ME': 'Methodology',
    'stat.OT': 'Other Statistics',
    'stat.TH': 'Statistics Theory'
  }
};