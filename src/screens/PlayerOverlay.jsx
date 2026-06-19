import { useState, useEffect } from 'react'
import PlayerIcon from '../components/PlayerIcon';
import Positions from '../config/Positions'
import { useInterval } from '../hooks/useInterval';
import { isAbsentPlayer } from '../util/playerUtils';

const PlayerOverlay = () => {
  const [playerData, setPlayerData] = useState([[{}, {}, {}, {}, {}], [{}, {}, {}, {}, {}]]);
  const [selectedPlayerIndices, setSelectedPlayerIndices] = useState([-1, -1]);
  const [teamColors, setTeamColors] = useState(["", ""]);
  const [playerPositions, setPlayerPositions] = useState(Positions.ALL_HIDDEN_GAME_POSITIONS);
  const [scene, setScene] = useState("");

  var int = useInterval(() => {
    // there is no emitted event to send 
    if (window.obsstudio) {
      window.obsstudio.getCurrentScene(function (data) {
        if (data.name === "player-select") {
          transitionToPlayerSelectScene()
        } else if (data.name === "players-chosen") {
          transitionToSelectedPlayerScene();
        } else if (data.name === "game-scene") {
          transitionToGameScene();
        } else {
          transitionPlayersOut();
        }
      });
    }
  }, 300);

  useEffect(() => {
    loadFromLocalStorage();

    const onStorage = () => {
      loadFromLocalStorage();
    }
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    }
  }, [])

  const loadFromLocalStorage = () => {
    try {
      const {
        playerData: newPlayerData,
        selectedPlayerIndices: newSelectedPlayers,
        teamColors: newTeamColors
      } = JSON.parse(localStorage.getItem('ctl-player-overlay-config'));
      setPlayerData(playerData => newPlayerData ?? playerData);
      setSelectedPlayerIndices(selectedIndices => newSelectedPlayers ?? selectedIndices);
      setTeamColors(teamColors => newTeamColors ?? teamColors);
      console.log("successfully fetched from localstorage");
    } catch (e) {
      console.log('failed to fetch from localstorage');
    }
  }

  useEffect(() => {
    if (scene === "players-chosen") {
      transitionToSelectedPlayerScene(true);
    } else if (scene === "game-scene") {
      transitionToGameScene(true);
    }
  }, [selectedPlayerIndices]);

  // Lays out all non-absent players evenly, absent players get null (not rendered).
  const buildSpacedPositions = (players, teamIndex, computeCoords) => {
    const activePlayers = players.filter(p => !isAbsentPlayer(p));
    const coords = computeCoords(activePlayers.length, teamIndex);
    let coordIndex = 0;
    return players.map(p => isAbsentPlayer(p) ? null : coords[coordIndex++]);
  };

  // Same, but pulls one player out as "focused" and spaces the rest as bench.
  const buildFocusedPositions = (players, teamIndex, selectedIndex, computeBenchCoords, focusedPosition) => {
    const benchCount = players.filter((p, i) => !isAbsentPlayer(p) && i !== selectedIndex).length;
    const benchCoords = computeBenchCoords(benchCount, teamIndex);
    let benchIndex = 0;
    return players.map((p, i) => {
      if (isAbsentPlayer(p)) return null;
      if (i === selectedIndex) return focusedPosition;
      return benchCoords[benchIndex++];
    });
  };

  const transitionToSelectedPlayerScene = force => {
    if (scene === "players-chosen" && !force) {
      return;
    }
    setScene(scene => "players-chosen");
    const newPlayerPositions = playerData.map((players, teamIndex) => {
      if (selectedPlayerIndices[teamIndex] < 0 || selectedPlayerIndices[teamIndex] >= 5) {
        return buildSpacedPositions(players, teamIndex, Positions.defaultPositions);
      }
      return buildFocusedPositions(
        players,
        teamIndex,
        selectedPlayerIndices[teamIndex],
        Positions.benchPositionsSelected,
        Positions.FOCUSED_PLAYER_SELECTED_POSITIONS[teamIndex]
      );
    });
    setPlayerPositions(newPlayerPositions);
    console.log("transitioning to player chosen screen")
  }
  const transitionToPlayerSelectScene = e => {
    if (scene === "player-select") {
      return;
    }
    setScene(scene => "player-select");
    const newPlayerPositions = playerData.map((players, teamIndex) =>
      buildSpacedPositions(players, teamIndex, Positions.defaultPositions)
    );
    setPlayerPositions(newPlayerPositions);
    console.log("transitioning to player select screen")
  }

  const transitionPlayersOut = () => {
    if (scene === "players-out") {
      return;
    }
    setScene(scene => "players-out");
    setPlayerPositions(Positions.ALL_HIDDEN_GAME_POSITIONS);
    console.log("transitioning players out")
  }

  const transitionToGameScene = force => {
    if (scene === "game-scene" && !force) {
      return;
    }
    setScene(scene => "game-scene");
    const newPlayerPositions = playerData.map((players, teamIndex) => {
      if (selectedPlayerIndices[teamIndex] < 0 || selectedPlayerIndices[teamIndex] >= 5) {
        return Positions.ALL_HIDDEN_GAME_POSITIONS[teamIndex];
      }
      return buildFocusedPositions(
        players,
        teamIndex,
        selectedPlayerIndices[teamIndex],
        Positions.benchPositionsGame,
        Positions.FOCUSED_PLAYER_GAME_POSITIONS[teamIndex]
      );
    });
    console.log('transitioning to game scene');
    setPlayerPositions(newPlayerPositions);
  }

  return (
    <div>
      <main>
        {playerData.map((team, teamIndex) =>
          team.map((player, playerIndex) => {
            if (isAbsentPlayer(player)) {
              return null;
            }
            return (
              <PlayerIcon
                teamColor={teamColors[teamIndex]}
                username={player.name}
                key={playerIndex}
                pos={playerPositions[teamIndex][playerIndex]}
                selected={selectedPlayerIndices[teamIndex] === playerIndex && scene === "players-chosen"}
                eliminated={player.eliminated}
                blurb={player.blurb}
              />
            );
          })
        )}
      </main>
      {/* Testing buttons that should be off screen. */}
      <button onClick={transitionToPlayerSelectScene}>player select scene</button>
      <button onClick={transitionToSelectedPlayerScene}>player chosen scene</button>
      <button onClick={transitionToGameScene}>game scene</button>
    </div>
  )
}

export default PlayerOverlay;
