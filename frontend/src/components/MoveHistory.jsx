import React from 'react';
import useGameStore from '../store/gameStore';

const MoveHistory = () => {
  const { history } = useGameStore();

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      white: history[i].san,
      black: history[i + 1] ? history[i + 1].san : ''
    });
  }

  return (
    <div className="glass-panel p-4 h-64 overflow-y-auto w-full max-w-sm flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-primary-500 border-b border-gray-700 pb-2">Move History</h3>
      <div className="flex-1">
        {pairs.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No moves yet...</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {pairs.map((pair, index) => (
                <tr key={index} className="border-b border-gray-800 last:border-0">
                  <td className="py-1 text-gray-500 w-8">{index + 1}.</td>
                  <td className="py-1 font-medium">{pair.white}</td>
                  <td className="py-1 font-medium text-gray-300">{pair.black}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
