/**
 * Service Interface Contracts
 * 
 * Domain and application services that provide business logic and 
 * cross-cutting concerns. These services encapsulate complex business
 * rules and coordinate between multiple entities and use cases.
 */

import {
  Player,
  AtBat,
  BaserunnerState,
  BattingResult,
  Scoreboard,
  Game,
  Lineup,
  ExportPackage,
  ExportScope
} from './domain-entities';

// Domain Services (Business Logic)
export interface ScoringService {
  calculateBaserunnerAdvancement(
    result: BattingResult,
    currentState: BaserunnerState
  ): BaserunnerAdvancementCalculation;
  
  calculateRBIs(
    result: BattingResult,
    baserunnersBefore: BaserunnerState,
    baserunnersAfter: BaserunnerState
  ): number;
  
  updatePlayerStatistics(player: Player, atBat: AtBat): Player['statistics'];
  
  calculateBattingAverage(hits: number, atBats: number): number;
  
  calculateOnBasePercentage(
    hits: number, 
    walks: number, 
    hitByPitch: number, 
    atBats: number, 
    sacrificeFlies: number
  ): number;
  
  calculateSluggingPercentage(
    singles: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    atBats: number
  ): number;
  
  isValidBattingResult(result: BattingResult): boolean;
}

export interface BaserunnerAdvancementCalculation {
  newState: BaserunnerState;
  runsScored: string[]; // player IDs
  battingAdvancement: number; // bases advanced by batter
  automaticAdvancement: boolean; // true if calculated automatically
}

export interface LineupService {
  validateLineup(lineup: Lineup): LineupValidationResult;
  
  getNextBatter(lineup: Lineup, currentBattingPosition: number): NextBatterInfo;
  
  canMakeSubstitution(
    lineup: Lineup, 
    playerOut: string, 
    playerIn: string
  ): SubstitutionValidation;
  
  processSubstitution(
    lineup: Lineup,
    playerOut: string,
    playerIn: string,
    newBattingPosition?: number
  ): Lineup;
  
  getDefensivePositions(lineup: Lineup): DefensiveAssignments;
  
  getBattingOrder(lineup: Lineup): BattingOrderInfo[];
}

export interface LineupValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  requiredPositions: string[];
  missingPositions: string[];
}

export interface NextBatterInfo {
  playerId: string;
  battingPosition: number;
  playerName: string;
  isSubstitute: boolean;
  previousAtBats: number;
}

export interface SubstitutionValidation {
  canSubstitute: boolean;
  reason?: string;
  restrictions: string[];
}

export interface DefensiveAssignments {
  [position: string]: {
    playerId: string;
    playerName: string;
    isStarter: boolean;
  };
}

export interface BattingOrderInfo {
  battingPosition: number;
  playerId: string;
  playerName: string;
  isActive: boolean;
  atBats: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GameFlowService {
  startGame(game: Game): GameFlowResult;
  
  processInningChange(
    game: Game, 
    scoreboard: Scoreboard
  ): InningChangeResult;
  
  checkForGameEnd(game: Game, scoreboard: Scoreboard): GameEndCheck;
  
  calculateGameDuration(game: Game): GameDuration;
  
  getGameProgress(game: Game): GameProgress;
  
  canUndoLastAction(game: Game): UndoValidation;
  
  processUndoAction(game: Game, actionId: string): UndoResult;
}

export interface GameFlowResult {
  success: boolean;
  updatedGame: Game;
  initialScoreboard: Scoreboard;
  firstBatter: NextBatterInfo;
}

export interface InningChangeResult {
  newInning: number;
  teamAtBat: 'home' | 'away';
  inningComplete: boolean;
  gameComplete: boolean;
  nextBatter: NextBatterInfo;
}

export interface GameEndCheck {
  isGameComplete: boolean;
  reason?: 'regulation' | 'mercy_rule' | 'time_limit' | 'forfeit';
  finalScore: {
    home: number;
    away: number;
  };
  winner?: 'home' | 'away' | 'tie';
}

export interface GameDuration {
  startTime: Date;
  endTime?: Date;
  elapsedMinutes: number;
  estimatedEndTime?: Date;
}

export interface GameProgress {
  inningsCompleted: number;
  totalInnings: number;
  percentComplete: number;
  phase: 'setup' | 'early' | 'middle' | 'late' | 'extra' | 'complete';
}

export interface UndoValidation {
  canUndo: boolean;
  lastAction?: ActionRecord;
  reason?: string;
}

export interface UndoResult {
  success: boolean;
  restoredState: {
    game: Game;
    scoreboard: Scoreboard;
    lineup: Lineup;
  };
  undoneAction: ActionRecord;
}

export interface ActionRecord {
  id: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  undoData: Record<string, any>;
}

// Application Services (Cross-cutting Concerns)
export interface DataExportService {
  exportToJSON(
    scope: ExportScope,
    filters?: ExportFilters
  ): Promise<ExportPackage>;
  
  exportToCSV(
    scope: ExportScope,
    filters?: ExportFilters
  ): Promise<ExportPackage>;
  
  generateExportFile(exportPackage: ExportPackage): Promise<Blob>;
  
  validateExportData(exportPackage: ExportPackage): ValidationResult;
}

export interface ExportFilters {
  teamIds?: string[];
  seasonIds?: string[];
  gameIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeStatistics?: boolean;
  includeLineups?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
}

export interface DataImportService {
  validateImportFile(file: File): Promise<ImportValidationResult>;
  
  parseImportFile(file: File): Promise<ParsedImportData>;
  
  processImport(
    importData: ParsedImportData,
    strategy: ImportStrategy
  ): Promise<ImportProcessResult>;
  
  resolveConflicts(
    conflicts: DataConflict[],
    resolutions: ConflictResolution[]
  ): Promise<ConflictResolutionResult>;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  dataPreview: ImportDataPreview;
  estimatedImportTime: number;
}

export interface ParsedImportData {
  format: 'JSON' | 'CSV';
  teams: any[];
  players: any[];
  games: any[];
  seasons: any[];
  metadata: ImportMetadata;
}

export interface ImportMetadata {
  sourceApplication: string;
  exportDate: Date;
  version: string;
  recordCounts: Record<string, number>;
}

export interface ImportStrategy {
  conflictResolution: 'merge' | 'replace' | 'skip' | 'ask';
  validateReferences: boolean;
  createMissingReferences: boolean;
  preserveIds: boolean;
}

export interface ImportProcessResult {
  success: boolean;
  importedCounts: Record<string, number>;
  skippedCounts: Record<string, number>;
  errors: ValidationError[];
  conflicts: DataConflict[];
  duration: number;
}

export interface DataConflict {
  entityType: string;
  entityId: string;
  field: string;
  existingValue: any;
  newValue: any;
  conflictType: 'duplicate' | 'reference' | 'validation';
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'keep_existing' | 'use_new' | 'merge' | 'skip';
  mergeStrategy?: 'combine' | 'latest_wins' | 'custom';
}

export interface ConflictResolutionResult {
  resolvedCount: number;
  remainingConflicts: DataConflict[];
  errors: ValidationError[];
}

export interface ImportDataPreview {
  teams: { name: string; playerCount: number }[];
  games: { name: string; date: string; status: string }[];
  seasons: { name: string; year: number }[];
  totalRecords: number;
}

export interface StorageService {
  getStorageInfo(): Promise<StorageInfo>;
  
  optimizeStorage(): Promise<StorageOptimizationResult>;
  
  createBackup(): Promise<BackupResult>;
  
  restoreFromBackup(backupFile: File): Promise<RestoreResult>;
  
  clearAllData(): Promise<void>;
  
  migrateData(fromVersion: string, toVersion: string): Promise<MigrationResult>;
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  usage: {
    teams: number;
    players: number;
    games: number;
    atBats: number;
    other: number;
  };
  lastOptimized?: Date;
  needsOptimization: boolean;
}

export interface StorageOptimizationResult {
  sizeBefore: number;
  sizeAfter: number;
  spaceReclaimed: number;
  optimizationTime: number;
  actions: string[];
}

export interface BackupResult {
  success: boolean;
  backupSize: number;
  recordCount: number;
  backupFile: Blob;
  metadata: BackupMetadata;
}

export interface BackupMetadata {
  created: Date;
  appVersion: string;
  dataVersion: string;
  includesMedia: boolean;
  checksum: string;
}

export interface RestoreResult {
  success: boolean;
  restoredRecords: number;
  warnings: string[];
  errors: string[];
  backupInfo: BackupMetadata;
}

export interface MigrationResult {
  success: boolean;
  migratedRecords: number;
  warnings: string[];
  migrationTime: number;
  fromVersion: string;
  toVersion: string;
}

export interface NotificationService {
  showSuccess(message: string, options?: NotificationOptions): void;
  
  showError(message: string, options?: NotificationOptions): void;
  
  showWarning(message: string, options?: NotificationOptions): void;
  
  showInfo(message: string, options?: NotificationOptions): void;
  
  showConfirmation(
    message: string, 
    options?: ConfirmationOptions
  ): Promise<boolean>;
  
  showProgress(
    operation: string, 
    progress: ProgressInfo
  ): ProgressHandle;
}

export interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface ConfirmationOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface ProgressInfo {
  current: number;
  total: number;
  message?: string;
  canCancel?: boolean;
}

export interface ProgressHandle {
  update(progress: ProgressInfo): void;
  complete(message?: string): void;
  error(message: string): void;
  cancel(): void;
}