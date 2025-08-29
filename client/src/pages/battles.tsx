import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import LiveBattleSystem from "@/components/live-battle-system";
import { useAuth } from "@/hooks/useAuth";

export default function Battles() {
  const { user } = useAuth();
  const [isParticipating, setIsParticipating] = useState(false);

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-red-500">🔴 LIVE</span> Rap <span className="text-electric-500">Battles</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Join live streaming battles with real-time audio. Battle opponents, vote live, climb ranks.
          </p>
          <div className="mt-8">
            <Link href="/live">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 text-lg animate-pulse mr-4">
                🔴 START LIVE BATTLE
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              onClick={() => setIsParticipating(!isParticipating)}
            >
              {isParticipating ? "Leave Battle" : "Join Active Battle"}
            </Button>
          </div>
        </div>

        {/* Live Battle Arena */}
        <div className="mb-8">
          <LiveBattleSystem
            isParticipating={isParticipating}
            onJoinBattle={() => setIsParticipating(true)}
            onLeaveBattle={() => setIsParticipating(false)}
          />
        </div>
      </div>
    </div>
  );
}