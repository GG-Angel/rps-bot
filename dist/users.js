"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logUser = exports.updateUser = exports.getLeaderboard = exports.getUser = exports.initUser = exports.saveUserStats = exports.loadUserStats = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const STATS_FILE_PATH = path.resolve(__dirname, "stats.json");
let userStats = {};
// load user stats from JSON file (on bot startup)
function loadUserStats() {
    if (fs.existsSync(STATS_FILE_PATH)) {
        const data = fs.readFileSync(STATS_FILE_PATH, "utf-8");
        userStats = JSON.parse(data);
        console.log("✅ User Stats Loaded!");
    }
}
exports.loadUserStats = loadUserStats;
// save user stats to JSON file (on bot shutdown)
function saveUserStats() {
    const data = JSON.stringify(userStats, null, 2);
    fs.writeFileSync(STATS_FILE_PATH, data, "utf-8");
    console.log(`✅ User Stats Saved to ${STATS_FILE_PATH}`);
}
exports.saveUserStats = saveUserStats;
// adds new users to the database
function initUser(userId, username) {
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
    }
    else {
        // update username if needed
        userStats[userId].username = username;
    }
}
exports.initUser = initUser;
// gets a user
function getUser(userId) {
    return userStats[userId];
}
exports.getUser = getUser;
// gets a leaderboard of all users sorted by most points
function getLeaderboard() {
    let leaderboard = "";
    let rank = 1;
    Object.keys(userStats)
        .sort((a, b) => userStats[b].points - userStats[a].points)
        .forEach((userId) => {
        const prefix = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
        const user = userStats[userId];
        leaderboard += `${prefix} <@${userId}> - ${user.points} pts, ${user.wins} wins\n`;
        rank++;
    });
    return leaderboard;
}
exports.getLeaderboard = getLeaderboard;
// updates a user's stats based on a game's result
function updateUser(user, result, wager) {
    const previousPoints = user.points;
    switch (result) {
        case "Win":
            user.streak++;
            user.points += Math.floor(25 * (0.25 * user.streak + 1)); // multiplier based on win streak
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
            if (user.points < 0)
                user.points = 0; // prevent negative points
            user.losses++;
            break;
    }
    user.ratio = user.losses !== 0 ? user.wins / user.losses : user.wins; // prevent div by 0
    const currentPoints = user.points;
    console.log(`📝 Updated Stats: ${user.username} - ${result}`);
    logUser(user);
    return currentPoints - previousPoints; // return point difference
}
exports.updateUser = updateUser;
// displays a user in the console
function logUser(user) {
    const { username, points, streak, wins, losses, ratio } = user;
    const formattedStats = `  📊 ${username}'s Stats:
    Points: ${points} pts
    Win Streak: ${streak}
    Wins: ${wins}
    Losses: ${losses}
    W/L Ratio: ${ratio}`;
    console.log(formattedStats);
}
exports.logUser = logUser;
