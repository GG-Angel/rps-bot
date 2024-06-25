import * as fs from "fs";
import * as path from "path";
import { Result } from "./game";

// specifies the stats held for a particular user
export type UserStats = {
  username: string;
  streak: number;
  points: number;
  wins: number;
  losses: number;
  ratio: number;
};

// specifies the object containing user stats; the keys are Discord User IDs
type UserStatsMap = {
  [userId: string]: UserStats;
};

const STATS_FILE_PATH = path.resolve(__dirname, "stats.json");
let userStats: UserStatsMap = {};

// load user stats from JSON file (on bot startup)
export function loadUserStats(): void {
  if (fs.existsSync(STATS_FILE_PATH)) {
    const data = fs.readFileSync(STATS_FILE_PATH, "utf-8");
    userStats = JSON.parse(data);
    console.log("✅ User Stats Loaded!");
  }
}

// save user stats to JSON file (on bot shutdown)
export function saveUserStats(): void {
  const data = JSON.stringify(userStats, null, 2);
  fs.writeFileSync(STATS_FILE_PATH, data, "utf-8");
  console.log(`✅ User Stats Saved to ${STATS_FILE_PATH}`);
}

// adds new users to the database
export function initUser(userId: string, username: string): void {
  if (!userStats[userId]) {
    userStats[userId] = {
      username: username,
      streak: 0,
      points: 500,
      wins: 0,
      losses: 0,
      ratio: 1.0,
    };

    console.log(`📝 Initialized User: ${username}`);
    logUser(getUser(userId));

    saveUserStats();
  } else {
    // update username if needed
    userStats[userId].username = username;
  }
}

// gets a user
export function getUser(userId: string): UserStats {
  return userStats[userId];
}

// checks if a user exists given an id
export function doesUserExist(userId: string): boolean {
  return userStats.hasOwnProperty(userId);
}

// gets a leaderboard of the top 10 players sorted by most points
export function getLeaderboard(): string {
  let leaderboard: string = "";
  let rank: number = 1;

  const sortedStats = Object.keys(userStats)
    .sort((a, b) => getUser(b).points - getUser(a).points) // sort by points
    .slice(0, 10); // get top 10

  const maxUsernameLength = sortedStats.reduce(
    (maxLength, userId) =>
      Math.max(maxLength, getUser(userId).username.length + 4), // +4 for bold
    0
  );

  leaderboard += "```";
  sortedStats.forEach((userId) => {
    const prefix =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
    const user = getUser(userId);
    const padding = "".padEnd(
      maxUsernameLength - user.username.length + (3 - prefix.length),
      " "
    );
    leaderboard += `${prefix} ${user.username} ${padding} ${user.points} pts, ${user.wins} wins\n`;
    rank++;
  });
  leaderboard += "```";

  return leaderboard;
}

// updates a user's stats based on a game's result
export function updateUser(
  user: UserStats,
  result: Result,
  wager: number
): number {
  const previousPoints = user.points;

  switch (result) {
    case "Win":
      user.streak++;
      user.points += Math.floor(2 * Math.pow((user.streak - 1), 2) + 50) // exponential multiplier based on win streak
      user.points += wager; // award wager to winner
      user.wins++;
      break;
    case "Tie":
      user.streak++;
      break;
    case "Loss":
      user.streak = 0;
      user.points -= 50;
      user.points -= wager; // deduct wager from loser
      if (user.points < 0) user.points = 0; // prevent negative points
      user.losses++;
      break;
  }

  user.ratio = parseFloat(
    (user.losses !== 0 ? user.wins / user.losses : user.wins).toFixed(2)
  ); // prevent div by 0
  const currentPoints = user.points;

  console.log(`📝 Updated Stats: ${user.username} - ${result}`);
  logUser(user);

  return currentPoints - previousPoints; // return point difference
}

// displays a user in the console
export function logUser(user: UserStats): void {
  const { username, points, streak, wins, losses, ratio } = user;
  const formattedStats: string = `  📊 ${username}'s Stats:
    Points: ${points} pts
    Win Streak: ${streak}
    Wins: ${wins}
    Losses: ${losses}
    W/L Ratio: ${ratio}`;
  console.log(formattedStats);
}
