'use client';

import React from 'react';
import { Achievement } from '@/type/Achievement';

interface Props {
  achievement: Achievement;
}

const AchievementCard = ({ achievement }: Props) => {
  const { name, description, reward, isAchieved, achievedAt } = achievement;

  return (
    <div className={`relative overflow-hidden group p-6 rounded-2xl border transition-all duration-300 ${
      isAchieved 
      ? 'bg-white border-blue-100 shadow-sm hover:shadow-md' 
      : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      {/* 달성 시 우측 상단 뱃지 */}
      {isAchieved && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">
          ACHIEVED
        </div>
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          {/* 아이콘 영역 */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
            isAchieved ? 'bg-blue-50 text-blue-500' : 'bg-gray-200 text-gray-400'
          }`}>
            {isAchieved ? '🏆' : '🔒'}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-bold text-lg leading-tight ${isAchieved ? 'text-gray-900' : 'text-gray-500'}`}>
              {name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* 하단 보상 정보 영역 */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Reward</span>
            <span className={`text-sm font-bold ${isAchieved ? 'text-yellow-500' : 'text-gray-400'}`}>
              🪙 {reward}
            </span>
          </div>
          
          {isAchieved && achievedAt && (
            <span className="text-[11px] text-gray-400">
              {new Date(achievedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;