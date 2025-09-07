"use client";

import { useState } from "react";
import GameEngine from "@/components/game/GameEngine";

type GameState = "menu" | "briefing" | "playing" | "paused" | "victory" | "defeat";

export default function HomePage() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [selectedScenario, setSelectedScenario] = useState(0);

  const scenarios = [
    {
      id: 0,
      name: "Operation Overlord",
      description: "D-Day landings at Normandy, June 6, 1944",
      location: "Normandy, France",
      date: "June 6, 1944",
      objective: "Secure the beachhead and establish Allied foothold in Europe",
      difficulty: "Medium"
    },
    {
      id: 1,
      name: "Battle of Stalingrad",
      description: "Urban warfare in the ruins of Stalingrad",
      location: "Stalingrad, USSR",
      date: "August 1942 - February 1943",
      objective: "Defend the city against German advance",
      difficulty: "Hard"
    },
    {
      id: 2,
      name: "Operation Barbarossa",
      description: "German invasion of the Soviet Union",
      location: "Eastern Front",
      date: "June 22, 1941",
      objective: "Halt the German blitzkrieg advance",
      difficulty: "Expert"
    }
  ];

  const handleStartGame = () => {
    setGameState("briefing");
  };

  const handleStartMission = () => {
    setGameState("playing");
  };

  const handleBackToMenu = () => {
    setGameState("menu");
  };

  if (gameState === "playing") {
    return (
      <GameEngine 
        scenario={scenarios[selectedScenario]}
        onGameStateChange={setGameState}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Background War Image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/2b5f26af-769d-46d6-bacd-defdbc50c6ab.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {gameState === "menu" && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="military-font text-6xl md:text-8xl font-black text-amber-300 stencil-text mb-4">
              WWII
            </h1>
            <h2 className="military-font text-3xl md:text-4xl font-bold text-amber-200 stencil-text mb-2">
              THEATER COMMANDER
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              Strategic Combat Simulation • 1939-1945
            </p>
          </div>

          {/* Main Menu Buttons */}
          <div className="flex flex-col space-y-6 w-full max-w-md">
            <button
              onClick={handleStartGame}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold py-4 px-8 rounded-lg military-font text-xl stencil-text transition-all duration-300 transform hover:scale-105 border-2 border-amber-400 shadow-lg"
            >
              START CAMPAIGN
            </button>
            
            <button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-4 px-8 rounded-lg military-font text-xl stencil-text transition-all duration-300 transform hover:scale-105 border-2 border-gray-400 shadow-lg">
              SETTINGS
            </button>
            
            <button className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-lg military-font text-xl stencil-text transition-all duration-300 transform hover:scale-105 border-2 border-red-600 shadow-lg">
              EXIT
            </button>
          </div>

          {/* Credits */}
          <div className="absolute bottom-8 text-center text-gray-400">
            <p className="text-sm">Historical Strategy Game • Built with Next.js</p>
          </div>
        </div>
      )}

      {gameState === "briefing" && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="max-w-4xl w-full bg-black bg-opacity-80 rounded-lg border-2 border-amber-600 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-800 to-amber-900 p-6 rounded-t-lg border-b-2 border-amber-600">
              <h2 className="military-font text-3xl font-bold text-amber-200 stencil-text text-center">
                MISSION BRIEFING
              </h2>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Mission Image */}
                <div className="space-y-4">
                  <img
                    src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/548be301-bcb5-41cb-b24e-8dafeb3a69ce.png"
                    alt="Mission battlefield map"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-600"
                  />
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <h3 className="military-font text-lg font-bold text-amber-300 mb-2">SCENARIO SELECTION</h3>
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(Number(e.target.value))}
                      className="w-full bg-gray-900 border-2 border-amber-600 rounded-lg p-3 text-white military-font"
                    >
                      {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mission Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="military-font text-2xl font-bold text-amber-300 stencil-text mb-4">
                      {scenarios[selectedScenario].name}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {scenarios[selectedScenario].description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-800 p-3 rounded border border-gray-600">
                      <p className="text-amber-400 font-bold military-font">LOCATION</p>
                      <p className="text-gray-300">{scenarios[selectedScenario].location}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-600">
                      <p className="text-amber-400 font-bold military-font">DATE</p>
                      <p className="text-gray-300">{scenarios[selectedScenario].date}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-600">
                      <p className="text-amber-400 font-bold military-font">DIFFICULTY</p>
                      <p className="text-gray-300">{scenarios[selectedScenario].difficulty}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-600">
                      <p className="text-amber-400 font-bold military-font">FORCES</p>
                      <p className="text-gray-300">Allied Command</p>
                    </div>
                  </div>

                  <div className="bg-red-900 bg-opacity-50 border-2 border-red-600 rounded-lg p-4">
                    <h4 className="military-font text-lg font-bold text-red-300 mb-2">PRIMARY OBJECTIVE</h4>
                    <p className="text-gray-200">{scenarios[selectedScenario].objective}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-700">
                <button
                  onClick={handleBackToMenu}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-lg military-font stencil-text transition-all duration-300"
                >
                  ← BACK TO MENU
                </button>
                <button
                  onClick={handleStartMission}
                  className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-lg military-font stencil-text transition-all duration-300 transform hover:scale-105"
                >
                  BEGIN MISSION →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}