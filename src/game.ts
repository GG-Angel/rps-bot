import { UserStats, getUser, saveUserStats, updateUser } from "./users";

export type RPSChoice = "Rock" | "Paper" | "Scissors";
export type Result = "Win" | "Tie" | "Loss";
export type Player = {
  id: string;
  stats: UserStats;
  choice: RPSChoice | null;
  result: Result | null;
  pointDifference: string | null;
};

export type Offer = {
  id: string;
  status: "Pending" | "Accept" | "Decline";
  wager: number;
  sender: {
    id: string;
    stats: UserStats;
  };
  recipient: {
    id: string;
    stats: UserStats;
  };
};

export type Session = {
  id: string;
  type: "CPU" | "PVP";
  turn: "player1" | "player2" | "result";
  wager: number;
  player1: Player;
  player2: Player;
};

type OfferMap = {
  [offerId: string]: Offer;
};

type SessionMap = {
  [sessionId: string]: Session;
};

const activeOffers: OfferMap = {};
const activeSessions: SessionMap = {};

const rpsWinConditions = [
  ["Rock", "Scissors"],
  ["Paper", "Rock"],
  ["Scissors", "Paper"],
];

// generates a unique 10-digit id for sessions and offers
function generateUniqueId(): string {
  let uniqueId;
  do {
    uniqueId = Math.floor(Math.random() * 10000000000).toString();
  } while (
    activeOffers.hasOwnProperty(uniqueId) &&
    activeSessions.hasOwnProperty(uniqueId)
  );
  return uniqueId;
}

// starts a new offer
export function startOffer(
  senderId: string,
  recieverId: string,
  wager: number = 0
): Offer {
  const offerId = generateUniqueId();
  activeOffers[offerId] = {
    id: offerId,
    status: "Pending",
    wager: wager,
    sender: {
      id: senderId,
      stats: getUser(senderId),
    },
    recipient: {
      id: recieverId,
      stats: getUser(recieverId),
    },
  };
  return getOffer(offerId);
}

// checks if a user is the reciever of an offer
export function authenticateOffer(userId: string, offer: Offer): boolean {
  return userId === offer.recipient.id;
}

// checks if an offer exists given an offer id
export function doesOfferExist(offerId: string) {
  return activeOffers.hasOwnProperty(offerId);
}

// processes offers that are accepted or declined
export function processOffer(
  offer: Offer,
  choice: "Accept" | "Decline"
): Session | void {
  offer.status = choice;
  if (choice === "Accept")
    return startSession(
      "PVP",
      offer.recipient.id,
      offer.sender.id,
      offer.wager
    );
}

// gets an offer
export function getOffer(offerId: string): Offer {
  return activeOffers[offerId];
}

// checks if a user belongs in some session
export function authenticateSession(userId: string, session: Session): boolean {
  return userId === session.player1.id || userId === session.player2.id;
}

// checks if it is currently a player's turn
export function isPlayerTurn(userId: string, session: Session): boolean {
  return userId === session[session.turn as "player1" | "player2"].id;
}

// checks if a session exists given a session id
export function doesSessionExist(sessionId: string) {
  return activeSessions.hasOwnProperty(sessionId);
}

// starts a new cpu or pvp session
export function startSession(
  gameType: "CPU" | "PVP",
  userId1: string,
  userId2: string = "",
  wager: number = 0
): Session {
  const sessionId = generateUniqueId();
  if (gameType === "CPU") {
    const cpuProfile: UserStats = {
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
        choice: ["Rock", "Paper", "Scissors"][Math.floor(Math.random() * 3)] as RPSChoice,
        result: null,
        pointDifference: "0",
      },
      player2: {
        // user
        id: userId1,
        stats: getUser(userId1),
        choice: null,
        result: null,
        pointDifference: null,
      },
    };
  } else if (gameType === "PVP") {
    activeSessions[sessionId] = {
      id: sessionId,
      type: "PVP",
      turn: "player1",
      wager: wager,
      player1: {
        // player1 (offerer)
        id: userId1,
        stats: getUser(userId1),
        choice: null,
        result: null,
        pointDifference: null,
      },
      player2: {
        // player2 (reciever)
        id: userId2,
        stats: getUser(userId2),
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

// progresses the session through each stage (both player turns and the result)
export function progressSession(session: Session, choice: RPSChoice): void {
  // helper functions
  function setChoice(): void {
    session[session.turn as "player1" | "player2"].choice = choice;
  }
  function getResult(
    playerChoice: RPSChoice,
    opponentChoice: RPSChoice
  ): Result {
    if (playerChoice === opponentChoice) {
      return "Tie";
    } else if (
      rpsWinConditions.some(
        (combination) =>
          combination[0] === playerChoice && combination[1] === opponentChoice
      )
    ) {
      return "Win";
    } else {
      return "Loss";
    }
  }
  function formatPointDifference(pointDifference: number) {
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
      player1.result = getResult(
        player1.choice as RPSChoice,
        player2.choice as RPSChoice
      );
      if (session.player1.id !== "CPU") {
        player1.pointDifference = formatPointDifference(
          updateUser(player1.stats, player1.result, session.wager)
        );
      }
      player2.result = getResult(
        player2.choice as RPSChoice,
        player1.choice as RPSChoice
      );
      player2.pointDifference = formatPointDifference(
        updateUser(player2.stats, player2.result, session.wager)
      );
      saveUserStats();
      break;
  }

  console.log(`📑 Updated Session: ${session.id}`);
  logSession(session);
}

// get a session from its id
export function getSession(sessionId: string): Session {
  return activeSessions[sessionId];
}

// gets the winner of a finished session
export function getWinner(session: Session): Player {
  return session.player1.result === "Win" ? session.player1 : session.player2;
}

// gets the loser of a finished session
export function getLoser(session: Session): Player {
  return session.player1.result === "Loss" ? session.player1 : session.player2;
}

// log the current details of a session
function logSession(session: Session): void {
  const hideChoices: boolean = true;
  const { player1, player2 } = session;
  const formattedSession: string = `  👾 ${
    session.player1.stats.username
  } vs. ${session.player2.stats.username}
    Turn: ${session.turn}
    Wager: ${session.wager}
    For ${player1.stats.username}:
      Choice: ${hideChoices ? "hidden" : player1.choice}
      Result: ${player1.result}
    For ${player2.stats.username}:
      Choice: ${hideChoices ? "hidden" : player2.choice}
      Result: ${player2.result}`;
  console.log(formattedSession);
}
