import {
  Team,
  Player,
  Season,
  GameType,
  TeamRepository,
  PlayerRepository,
  SeasonRepository,
  GameTypeRepository,
  Position,
} from '@/domain';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface LoadDefaultDataResult {
  teamsCreated: number;
  playersCreated: number;
  seasonsCreated: number;
  gameTypesCreated: number;
  message: string;
}

export class LoadDefaultDataUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private playerRepository: PlayerRepository,
    private seasonRepository: SeasonRepository,
    private gameTypeRepository: GameTypeRepository
  ) {}

  public async execute(): Promise<Result<LoadDefaultDataResult>> {
    try {
      let teamsCreated = 0;
      let playersCreated = 0;
      let seasonsCreated = 0;
      let gameTypesCreated = 0;

      // Create default seasons first
      const seasonResult = await this.createDefaultSeasons();
      if (seasonResult.isSuccess && seasonResult.value) {
        seasonsCreated = seasonResult.value.length;
      }

      // Create default game types
      const gameTypeResult = await this.createDefaultGameTypes();
      if (gameTypeResult.isSuccess && gameTypeResult.value) {
        gameTypesCreated = gameTypeResult.value.length;
      }

      // Create default teams with players
      const teamResult = await this.createDefaultTeams();
      if (teamResult.isSuccess && teamResult.value) {
        teamsCreated = teamResult.value.teams.length;
        playersCreated = teamResult.value.totalPlayers;
      }

      const result: LoadDefaultDataResult = {
        teamsCreated,
        playersCreated,
        seasonsCreated,
        gameTypesCreated,
        message: `Successfully loaded sample data: ${teamsCreated} teams with ${playersCreated} MLB players, ${seasonsCreated} seasons, ${gameTypesCreated} game types`,
      };

      return Result.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to load default data: ${message}`);
    }
  }

  private async createDefaultSeasons(): Promise<Result<Season[]>> {
    const currentYear = new Date().getFullYear();
    const seasons: Season[] = [];

    const defaultSeasons = [
      {
        name: `${currentYear} Spring Season`,
        year: currentYear,
        startDate: new Date(currentYear, 2, 1), // March 1st
        endDate: new Date(currentYear, 4, 31), // May 31st
      },
      {
        name: `${currentYear} Summer Season`,
        year: currentYear,
        startDate: new Date(currentYear, 5, 1), // June 1st
        endDate: new Date(currentYear, 7, 31), // August 31st
      },
      {
        name: `${currentYear} Fall Season`,
        year: currentYear,
        startDate: new Date(currentYear, 8, 1), // September 1st
        endDate: new Date(currentYear, 10, 30), // November 30th
      },
    ];

    for (const seasonData of defaultSeasons) {
      // Check if season already exists
      const seasonExists = await this.seasonRepository.existsByNameAndYear(
        seasonData.name,
        seasonData.year
      );

      if (!seasonExists) {
        const season = new Season(
          uuidv4(),
          seasonData.name,
          seasonData.year,
          seasonData.startDate,
          seasonData.endDate
        );

        const savedSeason = await this.seasonRepository.save(season);
        seasons.push(savedSeason);
      }
    }

    return Result.success(seasons);
  }

  private async createDefaultGameTypes(): Promise<Result<GameType[]>> {
    const gameTypes: GameType[] = [];

    const defaultGameTypes = [
      {
        name: 'Regular Season',
        description: 'Standard regular season game',
      },
      {
        name: 'Playoff',
        description: 'Playoff elimination game',
      },
      {
        name: 'Championship',
        description: 'Championship or title game',
      },
      {
        name: 'Tournament',
        description: 'Tournament pool or bracket game',
      },
      {
        name: 'Scrimmage',
        description: 'Practice or scrimmage game',
      },
    ];

    for (const gameTypeData of defaultGameTypes) {
      // Check if game type already exists
      const existingGameType = await this.gameTypeRepository.findByName(
        gameTypeData.name
      );

      if (!existingGameType) {
        const gameType = new GameType(
          uuidv4(),
          gameTypeData.name,
          gameTypeData.description
        );

        const savedGameType = await this.gameTypeRepository.save(gameType);
        gameTypes.push(savedGameType);
      }
    }

    return Result.success(gameTypes);
  }

  private async createDefaultTeams(): Promise<
    Result<{ teams: Team[]; totalPlayers: number }>
  > {
    const teams: Team[] = [];
    let totalPlayers = 0;

    const defaultTeams = [
      {
        name: 'Dodgers All-Stars',
        players: [
          { name: 'Walker Buehler', jersey: 21, position: Position.pitcher() },
          { name: 'Will Smith', jersey: 16, position: Position.catcher() },
          {
            name: 'Freddie Freeman',
            jersey: 5,
            position: Position.firstBase(),
          },
          { name: 'Gavin Lux', jersey: 9, position: Position.secondBase() },
          { name: 'Max Muncy', jersey: 13, position: Position.thirdBase() },
          { name: 'Trea Turner', jersey: 6, position: Position.shortstop() },
          {
            name: 'Teoscar Hernandez',
            jersey: 37,
            position: Position.leftField(),
          },
          { name: 'Tommy Edman', jersey: 25, position: Position.centerField() },
          { name: 'Mookie Betts', jersey: 50, position: Position.rightField() },
          {
            name: 'Shohei Ohtani',
            jersey: 17,
            position: Position.shortFielder(),
          },
          { name: 'Chris Taylor', jersey: 3, position: Position.extraPlayer() },
          {
            name: 'Enrique Hernandez',
            jersey: 8,
            position: Position.extraPlayer(),
          },
        ],
      },
      {
        name: 'Yankees Legends',
        players: [
          { name: 'Gerrit Cole', jersey: 45, position: Position.pitcher() },
          { name: 'Austin Wells', jersey: 12, position: Position.catcher() },
          { name: 'Anthony Rizzo', jersey: 48, position: Position.firstBase() },
          {
            name: 'Gleyber Torres',
            jersey: 25,
            position: Position.secondBase(),
          },
          { name: 'DJ LeMahieu', jersey: 26, position: Position.thirdBase() },
          { name: 'Anthony Volpe', jersey: 11, position: Position.shortstop() },
          { name: 'Alex Verdugo', jersey: 24, position: Position.leftField() },
          { name: 'Aaron Judge', jersey: 99, position: Position.centerField() },
          { name: 'Juan Soto', jersey: 22, position: Position.rightField() },
          {
            name: 'Giancarlo Stanton',
            jersey: 27,
            position: Position.shortFielder(),
          },
          {
            name: 'Oswaldo Cabrera',
            jersey: 95,
            position: Position.extraPlayer(),
          },
        ],
      },
      {
        name: 'Braves Champions',
        players: [
          { name: 'Spencer Strider', jersey: 99, position: Position.pitcher() },
          { name: 'Sean Murphy', jersey: 12, position: Position.catcher() },
          { name: 'Matt Olson', jersey: 28, position: Position.firstBase() },
          { name: 'Ozzie Albies', jersey: 1, position: Position.secondBase() },
          { name: 'Austin Riley', jersey: 27, position: Position.thirdBase() },
          { name: 'Orlando Arcia', jersey: 11, position: Position.shortstop() },
          { name: 'Marcell Ozuna', jersey: 20, position: Position.leftField() },
          {
            name: 'Michael Harris II',
            jersey: 23,
            position: Position.centerField(),
          },
          {
            name: 'Ronald Acuna Jr',
            jersey: 13,
            position: Position.rightField(),
          },
          {
            name: 'Adam Duvall',
            jersey: 14,
            position: Position.shortFielder(),
          },
        ],
      },
    ];

    for (const teamData of defaultTeams) {
      // Check if team already exists
      const existingTeam = await this.teamRepository.findByName(teamData.name);

      if (!existingTeam) {
        // Create new team
        const team = new Team(uuidv4(), teamData.name);
        let savedTeam = await this.teamRepository.save(team);

        // Create players for this team and add them to the team
        for (const playerData of teamData.players) {
          const player = new Player(
            uuidv4(),
            playerData.name,
            playerData.jersey,
            savedTeam.id,
            [playerData.position]
          );

          await this.playerRepository.create(player);
          totalPlayers++;

          // Add player to team and save the updated team
          savedTeam = savedTeam.addPlayer(player.id);
        }

        // Save the team with all players added
        const finalTeam = await this.teamRepository.save(savedTeam);
        teams.push(finalTeam);
      } else if (existingTeam.playerIds.length === 0) {
        // Team exists but has no players - add players to it
        console.log(
          `🔧 Updating existing team ${existingTeam.name} with players`
        );
        let updatedTeam = existingTeam;

        // Create players for this team and add them to the team
        for (const playerData of teamData.players) {
          // Check if player already exists by searching team players
          const teamPlayers = await this.playerRepository.findByTeamId(
            existingTeam.id
          );
          const existingPlayer = teamPlayers.find(
            (p) => p.name === playerData.name
          );

          let player: Player;
          if (!existingPlayer) {
            player = new Player(
              uuidv4(),
              playerData.name,
              playerData.jersey,
              existingTeam.id,
              [playerData.position]
            );
            await this.playerRepository.create(player);
            totalPlayers++;
          } else {
            player = existingPlayer;
          }

          // Add player to team if not already there
          if (!updatedTeam.hasPlayer(player.id)) {
            updatedTeam = updatedTeam.addPlayer(player.id);
          }
        }

        // Save the updated team
        const finalTeam = await this.teamRepository.save(updatedTeam);
        teams.push(finalTeam);
      } else {
        // Team exists and has players - just add to result
        teams.push(existingTeam);
      }
    }

    return Result.success({ teams, totalPlayers });
  }
}
