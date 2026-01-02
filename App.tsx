
import React, { useState, useMemo } from 'react';
import { Screen, Player, MarkType, GridState, ClueItem, DeductionResult } from './types';
import { SUSPECTS, WEAPONS, LOCATIONS, PLAYER_COLORS } from './constants';
import { ClueCell } from './components/ClueCell';
import { MarkIcon } from './components/MarkIcon';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [grid, setGrid] = useState<GridState>({});
  const [showDeduction, setShowDeduction] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeTool, setActiveTool] = useState<MarkType>(MarkType.NO);

  const startNewGame = () => {
    setCurrentScreen(Screen.SETUP);
  };

  const handleSetupSubmit = () => {
    const newPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: `p${i}`,
      name: i === 0 ? 'Você' : `Jog. ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      isUser: i === 0
    }));
    setPlayers(newPlayers);
    
    const initialGrid: GridState = {};
    [...SUSPECTS, ...WEAPONS, ...LOCATIONS].forEach(item => {
      initialGrid[item.id] = {};
      newPlayers.forEach(player => {
        initialGrid[item.id][player.id] = MarkType.EMPTY;
      });
    });
    
    setGrid(initialGrid);
    setCurrentScreen(Screen.GAME);
    setShowExitConfirm(false);
  };

  const handleCellClick = (itemId: string, playerId: string) => {
    setGrid(prev => {
      const currentMark = prev[itemId][playerId];
      const nextMark = (currentMark === activeTool || activeTool === MarkType.EMPTY) 
        ? MarkType.EMPTY 
        : activeTool;
      
      const newGrid = {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [playerId]: nextMark
        }
      };

      if (nextMark === MarkType.YES || nextMark === MarkType.REVEALED) {
        players.forEach(p => {
          if (p.id !== playerId) {
            newGrid[itemId][p.id] = MarkType.NO;
          }
        });
      }

      return newGrid;
    });
  };

  const deduction = useMemo((): DeductionResult => {
    const getCandidates = (items: ClueItem[]) => {
      return items.filter(item => {
        const row = grid[item.id] || {};
        return !Object.values(row).some(m => m === MarkType.YES || m === MarkType.REVEALED);
      }).map(i => i.name);
    };

    return {
      suspects: getCandidates(SUSPECTS),
      weapons: getCandidates(WEAPONS),
      locations: getCandidates(LOCATIONS)
    };
  }, [grid]);

  const isSolutionItem = (itemId: string, categoryItems: ClueItem[]) => {
    const row = grid[itemId] || {};
    if (Object.values(row).some(m => m === MarkType.YES || m === MarkType.REVEALED)) return false;

    const categoryCandidates = categoryItems.filter(item => {
      const r = grid[item.id] || {};
      return !Object.values(r).some(m => m === MarkType.YES || m === MarkType.REVEALED);
    });

    return categoryCandidates.length === 1 && categoryCandidates[0].id === itemId;
  };

  const renderSection = (title: string, items: ClueItem[]) => (
    <div className="mb-6">
      <div className="bg-slate-800/95 border-y border-slate-700 flex sticky top-0 z-10 backdrop-blur-md">
        <div className="w-32 min-w-[8rem] px-3 py-2 text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center border-r border-slate-700/50">
          {title}
        </div>
        <div className="flex-1 flex overflow-hidden">
           {players.map(p => (
             <div key={p.id} className="w-12 min-w-[3rem] border-l border-slate-700/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></div>
             </div>
           ))}
        </div>
      </div>

      {items.map(item => {
        const isSolution = isSolutionItem(item.id, items);
        return (
          <div 
            key={item.id} 
            className={`flex border-b border-slate-800/80 transition-all ${isSolution ? 'bg-green-500/10' : 'hover:bg-slate-800/30'}`}
          >
            <div className={`w-32 min-w-[8rem] px-3 py-3 text-[11px] flex items-center truncate border-r border-slate-700/50 shadow-sm ${isSolution ? 'text-green-400 font-black italic' : 'text-slate-300 font-medium'}`}>
              {item.name}
              {isSolution && <i className="fa-solid fa-envelope ml-auto text-[9px] text-green-500/50"></i>}
            </div>
            <div className="flex-1 flex overflow-x-auto scrollbar-hide-x">
              {players.map(player => (
                <div key={`${item.id}-${player.id}`} className="w-12 min-w-[3rem] shrink-0">
                  <ClueCell 
                    type={grid[item.id]?.[player.id] || MarkType.EMPTY}
                    onClick={() => handleCellClick(item.id, player.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (currentScreen === Screen.HOME) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 overflow-hidden">
        <div className="relative mb-12 animate-in fade-in zoom-in duration-700">
          <div className="w-48 h-48 bg-gradient-to-br from-orange-500 via-red-600 to-red-800 rounded-[40px] flex items-center justify-center app-icon-shadow border border-white/20 relative overflow-hidden">
            <div className="absolute top-2 w-16 h-4 bg-slate-900/30 rounded-full"></div>
            <div className="relative">
              <i className="fa-solid fa-clipboard text-8xl text-white/90"></i>
              <div className="absolute inset-0 flex items-center justify-center mt-2 mr-2">
                <i className="fa-solid fa-magnifying-glass text-4xl text-slate-900 rotate-12 drop-shadow-lg"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter text-white italic drop-shadow-2xl">
            Detective <span className="text-orange-500 block sm:inline">Sheet</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 opacity-60">Planilha de Dedução Digital</p>
        </div>
        
        <div className="w-full max-w-xs">
          <button 
            onClick={startNewGame}
            className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-2xl"
          >
            <i className="fa-solid fa-play text-xs"></i>
            <span className="tracking-[0.2em] text-sm uppercase">Novo Jogo</span>
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen === Screen.SETUP) {
    return (
      <div className="h-full bg-slate-950 p-6 flex flex-col overflow-hidden">
        <header className="mb-10 flex items-center gap-4">
          <button onClick={() => setCurrentScreen(Screen.HOME)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 text-slate-500">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Configurar Partida</h2>
        </header>

        <div className="max-w-md mx-auto w-full space-y-12 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jogadores</label>
              <span className="text-orange-500 font-black text-xl">{playerCount}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`py-5 rounded-2xl font-black border-2 transition-all ${
                    playerCount === num 
                    ? 'bg-orange-600 border-orange-500 text-white shadow-lg' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSetupSubmit}
          className="w-full bg-orange-600 text-white font-black py-5 rounded-2xl tracking-[0.2em] text-sm uppercase shadow-2xl mt-auto"
        >
          Iniciar Investigação
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 flex flex-col select-none overflow-hidden font-sans relative">
      {/* CABEÇALHO FIXO COM NOVO JOGO */}
      <header className="bg-slate-900 border-b border-slate-700 h-16 shrink-0 z-50 px-4 flex items-center justify-between shadow-lg">
        <div className="flex flex-col">
          <h2 className="font-black text-[11px] tracking-widest text-white uppercase leading-none">Detective Sheet</h2>
          <span className="text-[8px] font-bold text-orange-500 uppercase mt-1 tracking-tighter italic">Investigação Ativa</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDeduction(!showDeduction)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${showDeduction ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}
            `}
          >
            <i className="fa-solid fa-magnifying-glass-chart"></i>
          </button>
          
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-xl border border-red-500/30 transition-all font-black text-[9px] uppercase tracking-widest"
          >
            Novo Jogo
          </button>
        </div>
      </header>

      {/* CABEÇALHO DOS JOGADORES (FIXO ABAIXO DO HEADER PRINCIPAL) */}
      <div className="bg-slate-900 border-b-2 border-slate-700 flex h-12 shrink-0 z-40 shadow-md">
        <div className="w-32 min-w-[8rem] bg-slate-900 border-r-2 border-slate-700 px-3 flex items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Planilha</span>
        </div>
        <div className="flex-1 flex overflow-x-auto scrollbar-hide-x">
          {players.map(p => (
            <div key={p.id} className="w-12 min-w-[3rem] shrink-0 flex flex-col items-center justify-center border-l border-slate-800/50">
              <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: p.color }}></div>
              <span className="text-[7px] font-black text-white uppercase mt-1 truncate w-full text-center px-0.5">
                {p.isUser ? 'EU' : p.name.split(' ')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DE ROLAGEM PRINCIPAL COM SCROLLBAR VISÍVEL */}
      <div className="flex-1 overflow-y-auto bg-slate-950 relative scroll-container custom-scrollbar overscroll-none" style={{ touchAction: 'pan-y' }}>
        <div className="pb-32">
          {renderSection('Quem?', SUSPECTS)}
          {renderSection('O Quê?', WEAPONS)}
          {renderSection('Onde?', LOCATIONS)}
          
          {/* Espaço extra no final para facilitar correções sem bater no final da tela */}
          <div className="h-20 flex items-center justify-center opacity-20 pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-slate-700 text-4xl"></i>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO (ÚNICA FORMA DE VOLTAR) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-[32px] p-8 max-w-xs w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
            </div>
            <h3 className="text-center text-white font-black text-lg leading-tight mb-2 uppercase italic">Reiniciar Jogo?</h3>
            <p className="text-center text-slate-400 text-xs mb-8">
              Você só poderá recomeçar se confirmar agora. O progresso atual será perdido.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setCurrentScreen(Screen.HOME)}
                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg"
              >
                Confirmar e Sair
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-slate-800 text-slate-400 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR FIXO (SEMPRE VISÍVEL) */}
      <div className="bg-slate-900 border-t border-slate-700 px-4 py-4 pb-10 z-50 h-28 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center gap-1 overflow-x-auto scrollbar-hide-x">
          {[MarkType.EMPTY, MarkType.NO, MarkType.YES, MarkType.MAYBE, MarkType.STRONG, MarkType.REVEALED].map(type => (
            <button 
              key={type} 
              onClick={() => setActiveTool(type)}
              className="flex flex-col items-center gap-1.5 min-w-[50px] outline-none"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border-2
                ${activeTool === type 
                  ? 'bg-orange-600/20 border-orange-500 scale-110 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                  : 'bg-slate-800 border-slate-700'}
              `}>
                {type === MarkType.EMPTY ? (
                  <i className="fa-solid fa-eraser text-slate-400 text-xl"></i>
                ) : (
                  <MarkIcon type={type} className="text-xl" />
                )}
              </div>
              <span className={`text-[7px] font-black uppercase tracking-tighter ${activeTool === type ? 'text-orange-500' : 'text-slate-500'}`}>
                {type === MarkType.EMPTY ? 'Apagar' : type === MarkType.REVEALED ? 'Visto' : 
                 type === MarkType.NO ? 'Não é' : 
                 type === MarkType.YES ? 'Confirm.' : 
                 type === MarkType.MAYBE ? 'Talvez' : 'Forte'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PAINEL DE DEDUÇÃO */}
      {showDeduction && (
        <div className="fixed inset-x-0 bottom-32 z-[60] px-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-orange-600/50 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
             <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-orange-500 tracking-widest uppercase italic">Possíveis no Envelope</h4>
              <button onClick={() => setShowDeduction(false)} className="text-slate-600 p-2"><i className="fa-solid fa-times"></i></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Culpado', data: deduction.suspects },
                { label: 'Local', data: deduction.locations },
                { label: 'Arma', data: deduction.weapons }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                  <span className="text-[7px] font-black text-slate-500 uppercase mb-1.5">{item.label}</span>
                  <span className={`text-[9px] font-black leading-tight h-8 flex items-center justify-center ${item.data.length === 1 ? 'text-green-400' : 'text-slate-300'}`}>
                    {item.data.length === 1 ? item.data[0] : `${item.data.length} Opções`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
