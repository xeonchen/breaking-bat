import {
  RecordAtBatUseCase,
  RecordAtBatCommand,
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
    atBatData: RecordAtBatCommand
  ): Promise<AtBatRecordingResult> {
    try {
      const result = await this.recordAtBatUseCase.execute(atBatData);

      if (result.isSuccess && result.value) {
        const atBat = result.value;
        return {
          success: true,
          atBatId: atBat.id,
          runsScored: 0, // This would need to be calculated separately
          rbis: atBat.rbis,
          advanceInning: false, // This would need to be determined separately
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
