import {
  RecordAtBatUseCase,
  RecordAtBatRequest,
} from '@/application/use-cases/RecordAtBatUseCase';

export interface AtBatRecordingResult {
  success: boolean;
  atBatId?: string;
  runsScored?: number;
  rbis?: number;
  advanceInning?: boolean;
  error?: string;
}

export class AtBatRecordingIntegration {
  constructor(private recordAtBatUseCase: RecordAtBatUseCase) {}

  public async recordAtBat(
    atBatData: RecordAtBatRequest
  ): Promise<AtBatRecordingResult> {
    try {
      const result = await this.recordAtBatUseCase.execute(atBatData);

      return {
        success: true,
        atBatId: result.atBatId,
        runsScored: result.runsScored,
        rbis: result.rbis,
        advanceInning: result.advanceInning,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
