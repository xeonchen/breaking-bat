#!/usr/bin/env npx tsx

import { readFileSync, existsSync } from 'fs';
import { RuleMatrixService } from '../src/domain/services/RuleMatrixService';
import { BaserunnerState } from '../src/domain/values/BaserunnerState';
import { HitType } from '../src/domain/values/HitType';

interface TestViolation {
  file: string;
  line: number;
  severity: 'error' | 'warning';
  type: string;
  description: string;
  suggestion?: string;
}

interface AtBatScenario {
  before: BaserunnerState;
  after: BaserunnerState;
  hitType: HitType;
  rbis: number;
  outs?: number;
  runsScored: string[];
  line: number;
}

/**
 * Test validation tool to scan for softball rule violations in test files
 */
class TestRuleValidator {
  private ruleMatrix: RuleMatrixService;
  private violations: TestViolation[] = [];

  constructor() {
    this.ruleMatrix = new RuleMatrixService();
  }

  /**
   * Validate all AtBat-related test files
   */
  public async validateTestFiles(): Promise<TestViolation[]> {
    const testFiles = [
      'tests/unit/infrastructure/AtBatRepository.test.ts',
      'tests/unit/application/RecordAtBatUseCase.test.ts',
    ];

    for (const file of testFiles) {
      if (existsSync(file)) {
        console.log(`🔍 Scanning ${file}...`);
        await this.validateTestFile(file);
      } else {
        console.warn(`⚠️  Test file not found: ${file}`);
      }
    }

    return this.violations;
  }

  /**
   * Validate a single test file for rule violations
   */
  private async validateTestFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract AtBat scenarios from test code
    const scenarios = this.extractAtBatScenarios(lines, filePath);

    for (const scenario of scenarios) {
      await this.validateScenario(scenario, filePath);
    }

    // Additional specific validations
    this.validateSpecificPatterns(lines, filePath);
  }

  /**
   * Extract AtBat scenarios from test code
   */
  private extractAtBatScenarios(
    lines: string[],
    filePath: string
  ): AtBatScenario[] {
    const scenarios: AtBatScenario[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for AtBat constructor calls
      if (
        line.includes('new AtBat(') ||
        line.includes('testAtBat = new AtBat(')
      ) {
        const scenario = this.parseAtBatConstructor(lines, i, filePath);
        if (scenario) {
          scenarios.push(scenario);
        }
      }

      // Look for RecordAtBatCommand objects
      if (line.includes('RecordAtBatCommand')) {
        const scenario = this.parseRecordAtBatCommand(lines, i, filePath);
        if (scenario) {
          scenarios.push(scenario);
        }
      }
    }

    return scenarios;
  }

  /**
   * Parse AtBat constructor to extract scenario
   */
  private parseAtBatConstructor(
    lines: string[],
    startLine: number,
    _filePath: string
  ): AtBatScenario | null {
    try {
      // Look for the pattern around lines 19-33 in AtBatRepository.test.ts
      let beforeState: BaserunnerState | null = null;
      let afterState: BaserunnerState | null = null;
      let result: string | null = null;
      let rbis = 0;
      let runsScored: string[] = [];

      // Scan backwards for baserunnersBefore and baserunnerAfter setup
      for (let i = startLine - 10; i < startLine + 20; i++) {
        if (i < 0 || i >= lines.length) continue;

        const line = lines[i];

        // Look for baserunnersBefore setup
        if (
          line.includes('baserunnersBefore') &&
          line.includes('new BaserunnerState(')
        ) {
          const match = line.match(
            /new BaserunnerState\(\s*'([^']*)'?\s*,\s*([^,]*)\s*,\s*'([^']*)'?\s*\)/
          );
          if (match) {
            const first = match[1] === 'null' ? null : match[1];
            const second = match[2] === 'null' ? null : match[2];
            const third = match[3] === 'null' ? null : match[3];
            beforeState = new BaserunnerState(first, second, third);
          }
        }

        // Look for baserunnersAfter setup
        if (
          line.includes('baserunnersAfter') &&
          line.includes('new BaserunnerState(')
        ) {
          const match = line.match(
            /new BaserunnerState\(\s*'([^']*)'?\s*,\s*([^,]*)\s*,\s*([^']*)'?\s*\)/
          );
          if (match) {
            const first = match[1] === 'null' ? null : match[1];
            const second = match[2] === 'null' ? null : match[2];
            const third = match[3] === 'null' ? null : match[3];
            afterState = new BaserunnerState(first, second, third);
          }
        }

        // Look for BattingResult
        if (line.includes('BattingResult.')) {
          const resultMatch = line.match(/BattingResult\.(\w+)\(\)/);
          if (resultMatch) {
            result = resultMatch[1];
          }
        }

        // Look for RBIs
        const rbiMatch =
          line.match(/(\d+),\s*\/\/.*RBI/i) || line.match(/rbis?\s*:\s*(\d+)/i);
        if (rbiMatch) {
          rbis = parseInt(rbiMatch[1]);
        }

        // Look for runsScored
        const runsMatch = line.match(/\[([^\]]*)\]/);
        if (runsMatch && line.includes('runsScored')) {
          runsScored = runsMatch[1]
            .split(',')
            .map((s) => s.trim().replace(/['"]/g, ''))
            .filter((s) => s.length > 0);
        }
      }

      if (beforeState && afterState && result) {
        const hitType = this.battingResultToHitType(result);
        if (hitType) {
          return {
            before: beforeState,
            after: afterState,
            hitType,
            rbis,
            runsScored,
            line: startLine + 1,
          };
        }
      }
    } catch (error) {
      console.warn(
        `Error parsing AtBat constructor at line ${startLine + 1}: ${error}`
      );
    }

    return null;
  }

  /**
   * Parse RecordAtBatCommand to extract scenario
   */
  private parseRecordAtBatCommand(
    lines: string[],
    startLine: number,
    _filePath: string
  ): AtBatScenario | null {
    try {
      // Implementation for parsing RecordAtBatCommand scenarios
      // This would look for the command object structure and extract baserunner states
      // For now, return null as the existing violations are in AtBat constructors
      return null;
    } catch (error) {
      console.warn(
        `Error parsing RecordAtBatCommand at line ${startLine + 1}: ${error}`
      );
      return null;
    }
  }

  /**
   * Convert BattingResult string to HitType enum
   */
  private battingResultToHitType(result: string): HitType | null {
    const mapping: Record<string, HitType> = {
      single: HitType.SINGLE,
      double: HitType.DOUBLE,
      triple: HitType.TRIPLE,
      homeRun: HitType.HOME_RUN,
      walk: HitType.WALK,
      strikeout: HitType.STRIKEOUT,
      groundOut: HitType.GROUND_OUT,
      airOut: HitType.AIR_OUT,
      sacFly: HitType.SACRIFICE_FLY,
      fieldersChoice: HitType.FIELDERS_CHOICE,
      doublePlay: HitType.DOUBLE_PLAY,
      error: HitType.ERROR,
      intentionalWalk: HitType.INTENTIONAL_WALK,
    };

    return mapping[result] || null;
  }

  /**
   * Validate a specific scenario against the rule matrix
   */
  private async validateScenario(
    scenario: AtBatScenario,
    filePath: string
  ): Promise<void> {
    try {
      const result = this.ruleMatrix.validateTransition(
        scenario.before,
        scenario.after,
        scenario.hitType,
        scenario.rbis,
        scenario.outs
      );

      if (!result.isValid) {
        for (const violation of result.violations) {
          this.violations.push({
            file: filePath,
            line: scenario.line,
            severity: 'error',
            type: 'RULE_VIOLATION',
            description: `${violation.message}. Before: ${scenario.before.toString()}, After: ${scenario.after.toString()}, Hit: ${scenario.hitType}`,
            suggestion:
              result.suggestedCorrections.length > 0
                ? `Suggested: ${result.suggestedCorrections[0].description}`
                : undefined,
          });
        }
      }
    } catch (error) {
      this.violations.push({
        file: filePath,
        line: scenario.line,
        severity: 'warning',
        type: 'VALIDATION_ERROR',
        description: `Could not validate scenario: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Validate specific patterns in test code
   */
  private validateSpecificPatterns(lines: string[], filePath: string): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for same player on multiple bases
      if (line.includes('BaserunnerState') || line.includes('baserunners')) {
        this.checkSamePlayerMultipleBases(line, filePath, i + 1);
      }

      // Check for impossible RBI counts
      if (line.includes('rbi') && line.includes(':')) {
        this.checkRBIConsistency(lines, i, filePath);
      }
    }
  }

  /**
   * Check for same player on multiple bases
   */
  private checkSamePlayerMultipleBases(
    line: string,
    filePath: string,
    lineNumber: number
  ): void {
    const playerMatches = line.match(/'([^']+)'/g);
    if (playerMatches && playerMatches.length > 1) {
      const players = playerMatches.map((m) => m.replace(/'/g, ''));
      const uniquePlayers = new Set(players.filter((p) => p !== 'null'));

      if (
        players.length !==
        uniquePlayers.size + players.filter((p) => p === 'null').length
      ) {
        this.violations.push({
          file: filePath,
          line: lineNumber,
          severity: 'error',
          type: 'DUPLICATE_PLAYER',
          description: 'Same player cannot be on multiple bases simultaneously',
          suggestion:
            'Ensure each player appears only once in the BaserunnerState',
        });
      }
    }
  }

  /**
   * Check RBI consistency with runs scored
   */
  private checkRBIConsistency(
    lines: string[],
    lineIndex: number,
    filePath: string
  ): void {
    // Skip if this is a negative test case (testing for failures)
    if (this.isNegativeTestCase(lines, lineIndex)) {
      return;
    }

    // Look for RBI value and corresponding runs scored in nearby lines
    const rbiLine = lines[lineIndex];
    const rbiMatch = rbiLine.match(/rbi:\s*(\d+)/);

    if (rbiMatch) {
      const rbis = parseInt(rbiMatch[1]);

      // Look for runsScored in the next few lines
      for (let i = lineIndex; i < Math.min(lineIndex + 10, lines.length); i++) {
        const line = lines[i];
        if (line.includes('runsScored') && line.includes('[')) {
          const runsMatch = line.match(/\[([^\]]*)\]/);
          if (runsMatch) {
            const runs = runsMatch[1]
              .split(',')
              .filter((s) => s.trim().length > 0 && !s.includes('null'));

            if (rbis !== runs.length) {
              this.violations.push({
                file: filePath,
                line: lineIndex + 1,
                severity: 'error',
                type: 'RBI_MISMATCH',
                description: `RBI count (${rbis}) does not match runs scored count (${runs.length})`,
                suggestion: `Set RBI to ${runs.length} or adjust runs scored to match RBI count`,
              });
            }
          }
          break;
        }
      }
    }
  }

  /**
   * Check if this is a negative test case (expecting failure)
   */
  private isNegativeTestCase(lines: string[], lineIndex: number): boolean {
    // Look for expect(result.isSuccess).toBe(false) in the next 20 lines
    for (let i = lineIndex; i < Math.min(lineIndex + 20, lines.length); i++) {
      const line = lines[i];
      if (
        line.includes('expect(result.isSuccess).toBe(false)') ||
        line.includes('expect(result.error)') ||
        line.includes('// Invalid') ||
        line.includes('// Wrong')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate a report of all violations found
   */
  public generateReport(): void {
    if (this.violations.length === 0) {
      console.log('✅ No rule violations found in test files!');
      return;
    }

    console.log(`\n🚨 Found ${this.violations.length} rule violation(s):\n`);

    // Group violations by file
    const violationsByFile = this.violations.reduce(
      (acc, violation) => {
        if (!acc[violation.file]) {
          acc[violation.file] = [];
        }
        acc[violation.file].push(violation);
        return acc;
      },
      {} as Record<string, TestViolation[]>
    );

    for (const [file, fileViolations] of Object.entries(violationsByFile)) {
      console.log(`📄 ${file}:`);

      for (const violation of fileViolations) {
        const icon = violation.severity === 'error' ? '❌' : '⚠️';
        console.log(
          `  ${icon} Line ${violation.line}: [${violation.type}] ${violation.description}`
        );

        if (violation.suggestion) {
          console.log(`     💡 ${violation.suggestion}`);
        }
      }
      console.log('');
    }

    // Summary
    const errors = this.violations.filter((v) => v.severity === 'error').length;
    const warnings = this.violations.filter(
      (v) => v.severity === 'warning'
    ).length;

    console.log(`📊 Summary: ${errors} error(s), ${warnings} warning(s)`);

    if (errors > 0) {
      console.log(
        '\n🔧 These violations should be fixed to ensure tests follow actual softball rules.'
      );
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🏟️  Breaking-Bat Test Rule Validator');
  console.log('=====================================\n');

  const validator = new TestRuleValidator();

  try {
    await validator.validateTestFiles();
    validator.generateReport();
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
main();

export { TestRuleValidator, TestViolation };
