"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MenuStateProps {
  onStartGame: () => void;
  onSelectScenario: (scenario: string) => void;
  selectedScenario: string;
}

const scenarios = [
  {
    id: 'normandy',
    title: 'Operation Overlord',
    subtitle: 'Normandy Landings - June 6, 1944',
    description: 'Lead the Allied forces in the largest amphibious invasion in history. Break through German defenses and establish a foothold in Nazi-occupied Europe.',
    difficulty: 'Medium',
    image: 'https://placehold.co/400x200?text=D-Day+Landing+Normandy+Beach+Allied+Troops+Advancing'
  },
  {
    id: 'stalingrad',
    title: 'Battle of Stalingrad',
    subtitle: 'Eastern Front - Winter 1942',
    description: 'Command Soviet forces in brutal urban warfare. Defend every building, every street in the turning point of the Eastern Front.',
    difficulty: 'Hard',
    image: 'https://placehold.co/400x200?text=Stalingrad+Winter+Battle+Soviet+Tanks+Urban+Combat'
  },
  {
    id: 'berlin',
    title: 'Fall of Berlin',
    subtitle: 'Final Assault - April 1945',
    description: 'The final push to end the war in Europe. Storm the Reich Chancellery and bring down the Nazi regime once and for all.',
    difficulty: 'Expert',
    image: 'https://placehold.co/400x200?text=Berlin+1945+Soviet+Advance+Reichstag+Final+Battle'
  }
];

export default function MenuState({ onStartGame, onSelectScenario, selectedScenario }: MenuStateProps) {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-black text-amber-400 mb-4 tracking-wider drop-shadow-2xl"
            style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
          WWII
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold text-slate-200 mb-2"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          THEATER COMMANDER
        </h2>
        <p className="text-lg text-slate-400 font-light">Strategic Command • Historical Battles • Tactical Warfare</p>
      </div>

      {!showCredits ? (
        <>
          {/* Scenario Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-6xl w-full">
            {scenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedScenario === scenario.id 
                    ? 'ring-2 ring-amber-400 bg-slate-700/90' 
                    : 'bg-slate-800/80 hover:bg-slate-700/80'
                }`}
                onClick={() => onSelectScenario(scenario.id)}
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={scenario.image}
                    alt={scenario.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                    scenario.difficulty === 'Medium' ? 'bg-yellow-600 text-white' :
                    scenario.difficulty === 'Hard' ? 'bg-orange-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {scenario.difficulty}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-amber-400 text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {scenario.title}
                  </CardTitle>
                  <CardDescription className="text-slate-300 font-medium">
                    {scenario.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {scenario.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 items-center">
            <Button
              onClick={onStartGame}
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold px-12 py-4 text-xl shadow-2xl transition-all duration-300 hover:scale-105"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              DEPLOY TO BATTLE
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowCredits(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              CREDITS
            </Button>
          </div>

          {/* Controls Info */}
          <div className="mt-8 text-center text-slate-400 text-sm">
            <p className="mb-2">⚡ CONTROLS: Mouse to select and command units • WASD or Arrow keys to move camera</p>
            <p>🎯 OBJECTIVE: Capture enemy positions • Manage resources • Achieve tactical superiority</p>
          </div>
        </>
      ) : (
        /* Credits Screen */
        <div className="max-w-2xl w-full text-center">
          <Card className="bg-slate-800/90 p-8">
            <CardHeader>
              <CardTitle className="text-amber-400 text-3xl mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                BATTLE CREDITS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-bold text-lg mb-2">Game Design & Development</h3>
                <p>BLACKBOX.AI Strategic Gaming Division</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Historical Consultancy</h3>
                <p>Based on authentic WWII military records and tactical documentation</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Audio Design</h3>
                <p>Period-accurate sound effects and orchestral score</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Special Thanks</h3>
                <p>To the veterans and historians who preserved these crucial moments in history</p>
              </div>
            </CardContent>
            <Button
              onClick={() => setShowCredits(false)}
              variant="outline"
              className="mt-6 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              RETURN TO COMMAND
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}