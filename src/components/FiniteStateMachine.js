import { useState, useEffect, useRef } from 'react';
import { Play, Edit, Save, RotateCcw, Eye, Table, Settings } from 'lucide-react';

const FiniteStateMachine = () => {
  // Estados de la aplicación
  const [mode, setMode] = useState('example'); // 'example' o 'custom'
  const [currentState, setCurrentState] = useState('s0');
  const [inputString, setInputString] = useState('110111');
  const [outputString, setOutputString] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTable, setShowTable] = useState(false);

  // Definición de la máquina (ejemplo del libro)
  const [machine, setMachine] = useState({
    states: ['s0', 's1', 's2', 's3', 's4'],
    inputAlphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    initialState: 's0',
    // Función de transición v(s,x) -> s'
    transitionFunction: {
      's0': { '0': 's0', '1': 's1' },
      's1': { '0': 's2', '1': 's4' },
      's2': { '0': 's0', '1': 's3' },
      's3': { '0': 's0', '1': 's4' },
      's4': { '0': 's2', '1': 's4' }
    },
    // Función de salida w(s,x) -> o
    outputFunction: {
      's0': { '0': '0', '1': '1' },
      's1': { '0': '1', '1': '1' },
      's2': { '0': '0', '1': '1' },
      's3': { '0': '0', '1': '0' },
      's4': { '0': '0', '1': '1' }
    }
  });

  // Estados para máquina personalizada
  const [customMachine, setCustomMachine] = useState({
    states: ['s0', 's1'],
    inputAlphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    initialState: 's0',
    transitionFunction: {
      's0': { '0': 's0', '1': 's1' },
      's1': { '0': 's0', '1': 's1' }
    },
    outputFunction: {
      's0': { '0': '0', '1': '1' },
      's1': { '0': '1', '1': '0' }
    }
  });

  const currentMachine = mode === 'example' ? machine : customMachine;

  // Procesar cadena de entrada
  const processString = async () => {
    if (!inputString) return;
    
    setProcessing(true);
    setOutputString('');
    setCurrentStep(0);
    
    let state = currentMachine.initialState;
    let output = '';
    
    setCurrentState(state);
    
    for (let i = 0; i < inputString.length; i++) {
      const input = inputString[i];
      
      if (!currentMachine.inputAlphabet.includes(input)) {
        alert(`Símbolo '${input}' no está en el alfabeto de entrada`);
        setProcessing(false);
        return;
      }
      
      // Obtener salida
      const outputSymbol = currentMachine.outputFunction[state][input];
      output += outputSymbol;
      
      // Transición de estado
      const nextState = currentMachine.transitionFunction[state][input];
      
      setOutputString(output);
      setCurrentState(nextState);
      setCurrentStep(i + 1);
      
      state = nextState;
      
      // Pausa para visualización
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setProcessing(false);
  };

  // Resetear procesamiento
  const reset = () => {
    setCurrentState(currentMachine.initialState);
    setOutputString('');
    setCurrentStep(0);
    setProcessing(false);
  };

  // Componente de tabla de transiciones
  const TransitionTable = () => {
    const m = currentMachine;
    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Tabla de Transiciones y Salidas</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Estado</th>
                {m.inputAlphabet.map(input => (
                  <th key={input} style={styles.tableHeader}>
                    Entrada: {input}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.states.map(state => (
                <tr key={state} style={currentState === state ? styles.tableRowActive : styles.tableRow}>
                  <td style={styles.tableCell}>
                    <strong>{state}</strong>
                  </td>
                  {m.inputAlphabet.map(input => (
                    <td key={input} style={styles.tableCell}>
                      <div style={styles.transitionCell}>
                        <div>v({state},{input}) = <span style={styles.transitionValue}>
                          {m.transitionFunction[state][input]}
                        </span></div>
                        <div>w({state},{input}) = <span style={styles.outputValue}>
                          {m.outputFunction[state][input]}
                        </span></div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Componente de diagrama de estados
  const StateDiagram = () => {
    const canvasRef = useRef(null);
    
    useEffect(() => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Limpiar canvas
      ctx.clearRect(0, 0, width, height);
      
      // Posiciones de los estados (ajustadas para el ejemplo)
      const positions = {
        's0': { x: 150, y: 200 },
        's1': { x: 300, y: 100 },
        's2': { x: 450, y: 200 },
        's3': { x: 300, y: 300 },
        's4': { x: 500, y: 100 }
      };
      
      // Dibujar transiciones
      const m = currentMachine;
      m.states.forEach(state => {
        if (!positions[state]) return;
        
        m.inputAlphabet.forEach(input => {
          const nextState = m.transitionFunction[state][input];
          const output = m.outputFunction[state][input];
          
          if (positions[nextState]) {
            const start = positions[state];
            const end = positions[nextState];
            
            if (state === nextState) {
              // Auto-loop
              ctx.beginPath();
              ctx.arc(start.x, start.y - 40, 20, 0, 2 * Math.PI);
              ctx.strokeStyle = '#666';
              ctx.stroke();
              
              // Etiqueta
              ctx.fillStyle = '#333';
              ctx.font = '12px Arial';
              ctx.fillText(`${input},${output}`, start.x - 15, start.y - 65);
            } else {
              // Flecha entre estados
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.strokeStyle = '#666';
              ctx.stroke();
              
              // Punta de flecha
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              ctx.beginPath();
              ctx.moveTo(end.x - 15 * Math.cos(angle - Math.PI/6), end.y - 15 * Math.sin(angle - Math.PI/6));
              ctx.lineTo(end.x, end.y);
              ctx.lineTo(end.x - 15 * Math.cos(angle + Math.PI/6), end.y - 15 * Math.sin(angle + Math.PI/6));
              ctx.stroke();
              
              // Etiqueta
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              ctx.fillStyle = '#333';
              ctx.font = '12px Arial';
              ctx.fillText(`${input},${output}`, midX - 10, midY - 5);
            }
          }
        });
      });
      
      // Dibujar estados
      m.states.forEach(state => {
        if (!positions[state]) return;
        
        const pos = positions[state];
        
        // Círculo del estado
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        ctx.fillStyle = currentState === state ? '#3B82F6' : '#E5E7EB';
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Texto del estado
        ctx.fillStyle = currentState === state ? '#FFFFFF' : '#374151';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(state, pos.x, pos.y + 5);
        
        // Marcar estado inicial
        if (state === m.initialState) {
          ctx.beginPath();
          ctx.moveTo(pos.x - 50, pos.y);
          ctx.lineTo(pos.x - 25, pos.y);
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#059669';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText('Inicio', pos.x - 80, pos.y + 5);
        }
      });
      
    }, [currentMachine, currentState]);
    
    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Diagrama de Estados</h3>
        <canvas 
          ref={canvasRef}
          width={600}
          height={400}
          style={styles.canvas}
        />
      </div>
    );
  };

  // Editor de máquina personalizada
  const CustomMachineEditor = () => {
    const updateTransition = (state, input, nextState) => {
      setCustomMachine(prev => ({
        ...prev,
        transitionFunction: {
          ...prev.transitionFunction,
          [state]: {
            ...prev.transitionFunction[state],
            [input]: nextState
          }
        }
      }));
    };

    const updateOutput = (state, input, output) => {
      setCustomMachine(prev => ({
        ...prev,
        outputFunction: {
          ...prev.outputFunction,
          [state]: {
            ...prev.outputFunction[state],
            [input]: output
          }
        }
      }));
    };

    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Editor de Máquina Personalizada</h3>
        
        <div style={styles.editorGrid}>
          <div>
            <label style={styles.label}>Estados (separados por coma)</label>
            <input
              type="text"
              value={customMachine.states.join(', ')}
              onChange={(e) => setCustomMachine(prev => ({
                ...prev,
                states: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              style={styles.input}
              placeholder="s0, s1, s2"
            />
          </div>
          
          <div>
            <label style={styles.label}>Alfabeto de Entrada</label>
            <input
              type="text"
              value={customMachine.inputAlphabet.join(', ')}
              onChange={(e) => setCustomMachine(prev => ({
                ...prev,
                inputAlphabet: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              style={styles.input}
              placeholder="0, 1"
            />
          </div>
        </div>

        {/* Tabla de edición */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Estado</th>
                {customMachine.inputAlphabet.map(input => (
                  <th key={input} style={styles.tableHeader}>
                    {input}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customMachine.states.map(state => (
                <tr key={state}>
                  <td style={styles.tableCell}>
                    <strong>{state}</strong>
                  </td>
                  {customMachine.inputAlphabet.map(input => (
                    <td key={input} style={styles.tableCell}>
                      <div style={styles.editorCell}>
                        <select
                          value={customMachine.transitionFunction[state]?.[input] || ''}
                          onChange={(e) => updateTransition(state, input, e.target.value)}
                          style={styles.select}
                        >
                          {customMachine.states.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <select
                          value={customMachine.outputFunction[state]?.[input] || ''}
                          onChange={(e) => updateOutput(state, input, e.target.value)}
                          style={styles.select}
                        >
                          {customMachine.outputAlphabet.map(o => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Máquina de Estado Finito (FSM)
        </h1>
        
        {/* Selector de modo */}
        <div style={styles.modeSelector}>
          <button
            onClick={() => setMode('example')}
            style={mode === 'example' ? styles.modeButtonActive : styles.modeButton}
          >
            <Eye size={16} style={{marginRight: '8px'}} />
            Ejemplo del Libro
          </button>
          <button
            onClick={() => setMode('custom')}
            style={mode === 'custom' ? styles.modeButtonActive : styles.modeButton}
          >
            <Edit size={16} style={{marginRight: '8px'}} />
            Máquina Personalizada
          </button>
        </div>

        {/* Definición de la máquina */}
        <div style={styles.definition}>
          <h2 style={styles.definitionTitle}>
            Definición: M = (S, P, O, v, w)
          </h2>
          <div style={styles.definitionGrid}>
            <div style={styles.definitionItem}>
              <strong>S (Estados):</strong>
              <div style={styles.definitionValue}>
                {currentMachine.states.join(', ')}
              </div>
            </div>
            <div style={styles.definitionItem}>
              <strong>P (Entrada):</strong>
              <div style={styles.definitionValue}>
                {currentMachine.inputAlphabet.join(', ')}
              </div>
            </div>
            <div style={styles.definitionItem}>
              <strong>O (Salida):</strong>
              <div style={styles.definitionValue}>
                {currentMachine.outputAlphabet.join(', ')}
              </div>
            </div>
            <div style={styles.definitionItem}>
              <strong>Estado Inicial:</strong>
              <div style={styles.definitionValueInitial}>
                {currentMachine.initialState}
              </div>
            </div>
            <div style={styles.definitionItem}>
              <strong>Estado Actual:</strong>
              <div style={styles.definitionValueCurrent}>
                {currentState}
              </div>
            </div>
          </div>
        </div>

        {/* Editor personalizado */}
        {mode === 'custom' && <CustomMachineEditor />}

        {/* Procesamiento */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Procesamiento de Cadena</h2>
          
          <div style={styles.processingControls}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Cadena de Entrada:
              </label>
              <input
                type="text"
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                style={styles.stringInput}
                placeholder="110111"
                disabled={processing}
              />
            </div>
            
            <div style={styles.buttonGroup}>
              <button
                onClick={processString}
                disabled={processing || !inputString}
                style={processing || !inputString ? styles.buttonDisabled : styles.buttonPrimary}
              >
                <Play size={16} style={{marginRight: '8px'}} />
                {processing ? 'Procesando...' : 'Procesar'}
              </button>
              
              <button
                onClick={reset}
                style={styles.buttonSecondary}
              >
                <RotateCcw size={16} style={{marginRight: '8px'}} />
                Reset
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div style={styles.resultGrid}>
            <div>
              <label style={styles.label}>Entrada:</label>
              <div style={styles.resultInput}>
                {inputString.split('').map((char, i) => (
                  <span 
                    key={i} 
                    style={i < currentStep ? styles.processedChar : styles.unprocessedChar}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label style={styles.label}>Salida:</label>
              <div style={styles.resultOutput}>
                {outputString || '─'}
              </div>
            </div>
            
            <div>
              <label style={styles.label}>Progreso:</label>
              <div style={styles.resultProgress}>
                {currentStep} / {inputString.length}
              </div>
            </div>
          </div>
        </div>

        {/* Controles de visualización */}
        <div style={styles.visualControls}>
          <button
            onClick={() => setShowTable(!showTable)}
            style={styles.buttonSecondary}
          >
            <Table size={16} style={{marginRight: '8px'}} />
            {showTable ? 'Ocultar' : 'Mostrar'} Tabla
          </button>
        </div>

        {/* Visualizaciones */}
        <div style={styles.visualizations}>
          <StateDiagram />
          {showTable && <TransitionTable />}
        </div>
      </div>
    </div>
  );
};

// Estilos CSS-in-JS
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  },
  modeSelector: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px'
  },
  modeButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modeButtonActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '600',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  definition: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  definitionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  definitionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    fontSize: '14px'
  },
  definitionItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  definitionValue: {
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px'
  },
  definitionValueInitial: {
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#dbeafe',
    borderRadius: '4px',
    fontWeight: '600',
    color: '#1d4ed8'
  },
  definitionValueCurrent: {
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#dcfce7',
    borderRadius: '4px',
    fontWeight: '600',
    color: '#166534'
  },
  card: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px'
  },
  processingControls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'end',
    marginBottom: '16px'
  },
  inputGroup: {
    flex: '1',
    minWidth: '300px'
  },
  stringInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '18px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  buttonPrimary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#10b981',
    color: 'white',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonSecondary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#6b7280',
    color: 'white',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#9ca3af',
    color: 'white',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'not-allowed'
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  resultInput: {
    padding: '12px',
    backgroundColor: '#dbeafe',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '18px'
  },
  resultOutput: {
    padding: '12px',
    backgroundColor: '#dcfce7',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '18px'
  },
  resultProgress: {
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px'
  },
  processedChar: {
    color: '#1d4ed8',
    fontWeight: 'bold'
  },
  unprocessedChar: {
    color: '#9ca3af'
  },
  visualControls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px'
  },
  visualizations: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px'
  },
  canvas: {
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    minWidth: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #d1d5db'
  },
  tableHeaderRow: {
    backgroundColor: '#f3f4f6'
  },
  tableHeader: {
    border: '1px solid #d1d5db',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600'
  },
  tableRow: {
    backgroundColor: 'white'
  },
  tableRowActive: {
    backgroundColor: '#dbeafe'
  },
  tableCell: {
    border: '1px solid #d1d5db',
    padding: '12px',
    textAlign: 'center'
  },
  transitionCell: {
    fontSize: '12px'
  },
  transitionValue: {
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  outputValue: {
    fontWeight: 'bold',
    color: '#059669'
  },
  editorCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  select: {
    fontSize: '12px',
    padding: '4px',
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  }
};

export default FiniteStateMachine;