"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoser = exports.getWinner = exports.getSession = exports.progressSession = exports.startSession = exports.authenticateSession = exports.getOffer = exports.processOffer = exports.authenticateOffer = exports.startOffer = void 0;
const users_1 = require("./users");
const activeOffers = {};
const activeSessions = {};
const rpsWinConditions = [
    ["Rock", "Scissors"],
    ["Paper", "Rock"],
    ["Scissors", "Paper"],
];
// generates a unique 10-digit id for sessions and offers
function generateUniqueId() {
    let uniqueId;
    do {
        uniqueId = Math.floor(Math.random() * 10000000000).toString();
    } while (activeOffers.hasOwnProperty(uniqueId) &&
        activeSessions.hasOwnProperty(uniqueId));
    return uniqueId;
}
// starts a new offer
function startOffer(senderId, recieverId, wager = 0) {
    const offerId = generateUniqueId();
    activeOffers[offerId] = {
        id: offerId,
        status: "Pending",
        wager: wager,
        sender: {
            id: senderId,
            stats: (0, users_1.getUser)(senderId),
        },
        recipient: {
            id: recieverId,
            stats: (0, users_1.getUser)(recieverId),
        },
    };
    return getOffer(offerId);
}
exports.startOffer = startOffer;
// checks if a user is the reciever of an offer
function authenticateOffer(userId, offer) {
    return userId === offer.recipient.id;
}
exports.authenticateOffer = authenticateOffer;
// processes offers that are accepted or declined
function processOffer(offer, choice) {
    offer.status = choice;
    if (choice === "Accept")
        return startSession("PVP", offer.recipient.id, offer.sender.id, offer.wager);
}
exports.processOffer = processOffer;
// gets an offer
function getOffer(offerId) {
    return activeOffers[offerId];
}
exports.getOffer = getOffer;
// checks if a user belongs in some specified session
function authenticateSession(userId, session) {
    return userId === session[session.turn].id;
}
exports.authenticateSession = authenticateSession;
// starts a new cpu or pvp session
function startSession(gameType, userId1, userId2 = "", wager = 0) {
    const sessionId = generateUniqueId();
    if (gameType === "CPU") {
        const cpuProfile = {
            username: "🤖 CPU",
            streak: 0,
            points: 0,
            wins: 0,
            losses: 0,
            ratio: 1.0,
        };
        activeSessions[sessionId] = {
            id: sessionId,
            type: "CPU",
            turn: "player2",
            wager: 0,
            player1: {
                // cpu
                id: "CPU",
                stats: cpuProfile,
                choice: ["Rock", "Paper", "Scissors"][Math.floor(Math.random() * 3)],
                result: null,
                pointDifference: "0",
            },
            player2: {
                // user
                id: userId1,
                stats: (0, users_1.getUser)(userId1),
                choice: null,
                result: null,
                pointDifference: null,
            },
        };
    }
    else if (gameType === "PVP") {
        activeSessions[sessionId] = {
            id: sessionId,
            type: "PVP",
            turn: "player1",
            wager: wager,
            player1: {
                // player1 (offerer)
                id: userId1,
                stats: (0, users_1.getUser)(userId1),
                choice: null,
                result: null,
                pointDifference: null,
            },
            player2: {
                // player2 (reciever)
                id: userId2,
                stats: (0, users_1.getUser)(userId2),
                choice: null,
                result: null,
                pointDifference: null,
            },
        };
    }
    const session = getSession(sessionId);
    console.log(`📑 Created Session: ${sessionId}`);
    logSession(session);
    return session;
}
exports.startSession = startSession;
// progresses the session through each stage (both player turns and the result)
function progressSession(session, choice) {
    // helper functions
    function setChoice() {
        session[session.turn].choice = choice;
    }
    function getResult(playerChoice, opponentChoice) {
        if (playerChoice === opponentChoice) {
            return "Tie";
        }
        else if (rpsWinConditions.some((combination) => combination[0] === playerChoice && combination[1] === opponentChoice)) {
            return "Win";
        }
        else {
            return "Loss";
        }
    }
    function formatPointDifference(pointDifference) {
        return pointDifference > 0 ? `+${pointDifference}` : `${pointDifference}`;
    }
    // stage handler
    switch (session.turn) {
        case "player1":
            setChoice();
            session.turn = "player2";
            break;
        case "player2":
            setChoice();
            session.turn = "result";
        // no break to cascade to result stage
        case "result":
            const { player1, player2 } = session;
            player1.result = getResult(player1.choice, player2.choice);
            if (session.player1.id !== "CPU") {
                player1.pointDifference = formatPointDifference((0, users_1.updateUser)(player1.stats, player1.result, session.wager));
            }
            player2.result = getResult(player2.choice, player1.choice);
            player2.pointDifference = formatPointDifference((0, users_1.updateUser)(player2.stats, player2.result, session.wager));
            (0, users_1.saveUserStats)();
            break;
    }
    console.log(`📑 Updated Session: ${session.id}`);
    logSession(session);
}
exports.progressSession = progressSession;
// get a session from its id
function getSession(sessionId) {
    return activeSessions[sessionId];
}
exports.getSession = getSession;
// gets the winner of a finished session
function getWinner(session) {
    return session.player1.result === "Win" ? session.player1 : session.player2;
}
exports.getWinner = getWinner;
// gets the loser of a finished session
function getLoser(session) {
    return session.player1.result === "Loss" ? session.player1 : session.player2;
}
exports.getLoser = getLoser;
// log the current details of a session
function logSession(session) {
    const formattedSession = `  👾 ${session.player1.stats.username} vs. ${session.player2.stats.username}
    Turn: ${session.turn}
    Wager: ${session.wager}
    For ${session.player1.stats.username}:
      Choice: ${session.player1.choice}
      Result: ${session.player1.result}
    For ${session.player2.stats.username}:
      Choice: ${session.player2.choice}
      Result: ${session.player2.result}`;
    console.log(formattedSession);
}
