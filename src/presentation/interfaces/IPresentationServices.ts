/**
 * Presentation Layer Interfaces
 *
 * These interfaces define contracts for presentation concerns like
 * UI state management, user interactions, and data formatting.
 */

/**
 * UI State Manager Interface
 * Abstracts UI state management (Zustand, Redux, etc.)
 */
export interface IUIStateManager<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: StateListener<T>): () => void;
  reset(): void;
}

/**
 * Navigation Service Interface
 * Abstracts navigation and routing
 */
export interface INavigationService {
  navigate(path: string, params?: Record<string, any>): void;
  goBack(): void;
  getCurrentPath(): string;
  getParams(): Record<string, any>;
}

/**
 * Notification Service Interface
 * Handles user notifications and alerts
 */
export interface INotificationService {
  showSuccess(message: string, options?: NotificationOptions): void;
  showError(message: string, options?: NotificationOptions): void;
  showWarning(message: string, options?: NotificationOptions): void;
  showInfo(message: string, options?: NotificationOptions): void;
  dismiss(notificationId?: string): void;
}

/**
 * Form Validation Service Interface
 * Handles form validation logic
 */
export interface IFormValidationService {
  validateField(
    field: string,
    value: any,
    rules: ValidationRule[]
  ): ValidationResult;
  validateForm(
    form: Record<string, any>,
    schema: ValidationSchema
  ): FormValidationResult;
}

/**
 * Data Formatter Service Interface
 * Handles data formatting for display
 */
export interface IDataFormatterService {
  formatDate(date: Date, format?: DateFormat): string;
  formatNumber(value: number, options?: NumberFormatOptions): string;
  formatCurrency(value: number, currency?: string): string;
  formatPercentage(value: number, decimals?: number): string;
}

/**
 * Theme Service Interface
 * Manages application theming
 */
export interface IThemeService {
  getCurrentTheme(): Theme;
  setTheme(theme: Theme): void;
  getAvailableThemes(): Theme[];
  toggleColorMode(): void;
}

/**
 * Modal Service Interface
 * Manages modal dialogs and overlays
 */
export interface IModalService {
  open(modalId: string, props?: Record<string, any>): void;
  close(modalId: string): void;
  closeAll(): void;
  isOpen(modalId: string): boolean;
}

// Presentation-specific types
export type StateListener<T> = (state: T) => void;

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string[]>;
  globalErrors: string[];
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule[];
}

export type DateFormat = 'short' | 'medium' | 'long' | 'full' | string;

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

/**
 * Presentation Data Transfer Objects
 * Define how data flows between Application and Presentation layers
 */
export interface PresentationTeam {
  id: string;
  name: string;
  players: PresentationPlayer[];
  seasonIds: string[];
  isActive: boolean;
}

export interface PresentationPlayer {
  id: string;
  name: string;
  jerseyNumber: string;
  positions: string[];
  isActive: boolean;
  stats?: PresentationPlayerStats;
}

export interface PresentationGame extends PresentationGameMethods {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  opponent: string;
  date: Date;
  status: PresentationGameStatus;
  lineupId?: string;
  finalScore?: PresentationGameScore;
}

export interface PresentationPlayerStats {
  battingAverage: string;
  hits: number;
  atBats: number;
  runs: number;
  rbis: number;
}

export interface PresentationGameType {
  id: string;
  name: string;
  description: string;
  hasDescription(): boolean;
  getDisplayName(): string;
  getSummary(): string;
  update(name: string, description?: string): PresentationGameType;
}

export interface PresentationSeason {
  id: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  isActive(): boolean;
  hasStarted(): boolean;
  hasEnded(): boolean;
  getDurationInDays(): number;
  containsDate(date: Date): boolean;
}

export type PresentationGameStatus =
  | 'setup'
  | 'in_progress'
  | 'completed'
  | 'suspended';

export interface PresentationGameScore {
  homeScore: number;
  awayScore: number;
}

export interface PresentationGameMethods {
  getVenueText(): string;
  setLineup(lineupId: string): PresentationGameMethods;
}

export interface PresentationPosition {
  value: string;
  getPositionNumber(): number;
  isDefensivePosition(): boolean;
  getDisplayName(): string;
  getAbbreviation(): string;
  getFullName(): string;
  equals(other: PresentationPosition): boolean;
  toString(): string;
}

export type PresentationPositionFactory = {
  isValid(position: string): boolean;
  pitcher(): PresentationPosition;
  catcher(): PresentationPosition;
  firstBase(): PresentationPosition;
  secondBase(): PresentationPosition;
  thirdBase(): PresentationPosition;
  shortstop(): PresentationPosition;
  leftField(): PresentationPosition;
  centerField(): PresentationPosition;
  rightField(): PresentationPosition;
  shortFielder(): PresentationPosition;
  extraPlayer(): PresentationPosition;
  getAllPositions(): PresentationPosition[];
  fromValue(value: string): PresentationPosition;
};
