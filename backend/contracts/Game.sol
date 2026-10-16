pragma solidity ^0.8.24;

contract Reach21 {
    enum GameStatus {
        None,
        Waiting,
        Active,
        Finished,
        Cancelled
    }

    struct Game {
        address player1;
        address player2;
        address turn;
        address winner;
        address lastMover;
        uint8 target;
        uint8 total;
        uint8 lastMove;
        GameStatus status;
        uint64 lastActionAt;
    }

    uint8 public constant MIN_TARGET = 15;
    uint8 public constant MAX_TARGET = 31;
    uint8 public constant MIN_STEP = 1;
    uint8 public constant MAX_STEP = 3;
    uint64 public constant TURN_TIMEOUT = 1 days;

    uint256 public gameCount;
    mapping(uint256 => Game) private games;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public gamesPlayed;
    mapping(address => uint256[]) private playerGames;

    event GameCreated(uint256 indexed gameId, address indexed player1, uint8 target);
    event GameStarted(uint256 indexed gameId, address indexed player1, address indexed player2, uint8 target);
    event MoveMade(uint256 indexed gameId, address indexed player, uint8 amount, uint8 newTotal);
    event GameFinished(uint256 indexed gameId, address indexed winner, bool byTimeout);
    event GameCancelled(uint256 indexed gameId);

    modifier exists(uint256 gameId) {
        require(gameId != 0 && gameId <= gameCount, "Mac neeksiste");
        _;
    }

    function createGame(uint8 target) external returns (uint256 gameId) {
        require(target >= MIN_TARGET && target <= MAX_TARGET, "Merkis jabut 15-31");

        gameId = ++gameCount;
        Game storage g = games[gameId];
        g.player1 = msg.sender;
        g.turn = msg.sender;
        g.target = target;
        g.status = GameStatus.Waiting;
        g.lastActionAt = uint64(block.timestamp);

        playerGames[msg.sender].push(gameId);
        emit GameCreated(gameId, msg.sender, target);
    }

    function joinGame(uint256 gameId) external exists(gameId) {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Waiting, "Macam nevar pievienoties");
        require(msg.sender != g.player1, "Nevar spelet pret sevi");

        g.player2 = msg.sender;
        g.status = GameStatus.Active;
        g.lastActionAt = uint64(block.timestamp);

        playerGames[msg.sender].push(gameId);
        emit GameStarted(gameId, g.player1, msg.sender, g.target);
    }

    function makeMove(uint256 gameId, uint8 amount) external exists(gameId) {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Active, "Spele nenotiek");
        require(msg.sender == g.turn, "Nav tava karta");
        require(amount >= MIN_STEP && amount <= MAX_STEP, "Gajiens jabut 1-3");
        require(uint256(g.total) + amount <= g.target, "Parsniedz merki");

        g.total += amount;
        g.lastMove = amount;
        g.lastMover = msg.sender;
        g.lastActionAt = uint64(block.timestamp);
        emit MoveMade(gameId, msg.sender, amount, g.total);

        if (g.total == g.target) {
            _finish(gameId, g, msg.sender, false);
        } else {
            g.turn = (msg.sender == g.player1) ? g.player2 : g.player1;
        }
    }

    function cancelGame(uint256 gameId) external exists(gameId) {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Waiting, "Var atcelt tikai gaidosu macu");
        require(msg.sender == g.player1, "Tikai izveidotajs");

        g.status = GameStatus.Cancelled;
        g.turn = address(0);
        emit GameCancelled(gameId);
    }

    function claimTimeout(uint256 gameId) external exists(gameId) {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Active, "Spele nenotiek");
        require(msg.sender == g.player1 || msg.sender == g.player2, "Tu neesi speletajs");
        require(msg.sender != g.turn, "Tava karta - nevar prasit timeout");
        require(block.timestamp >= uint256(g.lastActionAt) + TURN_TIMEOUT, "Laiks vel nav beidzies");

        _finish(gameId, g, msg.sender, true);
    }

    function getGame(uint256 gameId) external view exists(gameId) returns (Game memory) {
        return games[gameId];
    }

    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    function _finish(uint256 gameId, Game storage g, address winner, bool byTimeout) private {
        g.status = GameStatus.Finished;
        g.winner = winner;
        g.turn = address(0);
        g.lastActionAt = uint64(block.timestamp);

        wins[winner] += 1;
        gamesPlayed[g.player1] += 1;
        gamesPlayed[g.player2] += 1;

        emit GameFinished(gameId, winner, byTimeout);
    }
}
