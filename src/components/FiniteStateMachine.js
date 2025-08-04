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
    //señal inicial
    useEffect(() => {
  if (!canvasRef.current) return;
  
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, width, height);
  
  // Posiciones de los estados (dinámicas)
  const positions = {};
  const numStates = currentMachine.states.length;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  // Generar posiciones en círculo para estados dinámicos
  currentMachine.states.forEach((state, index) => {
    if (numStates === 1) {
      positions[state] = { x: centerX, y: centerY };
    } else {
      const angle = (2 * Math.PI * index) / numStates - Math.PI / 2;
      positions[state] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    }
  });
  
  // Agrupar transiciones por pares de estados para multigrafo
  const transitions = {};
  currentMachine.states.forEach(state => {
    currentMachine.inputAlphabet.forEach(input => {
      const nextState = currentMachine.transitionFunction[state][input];
      const output = currentMachine.outputFunction[state][input];
      
      const key = `${state}-${nextState}`;
      if (!transitions[key]) {
        transitions[key] = [];
      }
      transitions[key].push(`${input},${output}`);
    });
  });
  
  // Dibujar transiciones (aristas múltiples)
  Object.keys(transitions).forEach(key => {
    const [fromState, toState] = key.split('-');
    const labels = transitions[key];
    
    if (!positions[fromState] || !positions[toState]) return;
    
    const start = positions[fromState];
    const end = positions[toState];
    
    if (fromState === toState) {
      // Auto-loop
      const loopRadius = 25;
      const loopX = start.x;
      const loopY = start.y - 50;
      
      ctx.beginPath();
      ctx.arc(loopX, loopY, loopRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Flecha para auto-loop
      ctx.beginPath();
      ctx.moveTo(loopX + loopRadius - 5, loopY - 5);
      ctx.lineTo(loopX + loopRadius, loopY);
      ctx.lineTo(loopX + loopRadius - 5, loopY + 5);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Etiquetas
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels.join(' | '), loopX, loopY - loopRadius - 10);
    } else {
      // Múltiples aristas curvas entre estados diferentes
      const numLabels = labels.length;
      const baseAngle = Math.atan2(end.y - start.y, end.x - start.x);
      
      labels.forEach((label, index) => {
        // Calcular curvatura para múltiples aristas
        const curvature = numLabels > 1 ? (index - (numLabels - 1) / 2) * 0.3 : 0;
        
        // Punto de control para curva
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const controlX = midX + curvature * 60 * Math.cos(baseAngle + Math.PI / 2);
        const controlY = midY + curvature * 60 * Math.sin(baseAngle + Math.PI / 2);
        
        // Dibujar curva
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Calcular punto y ángulo para la flecha
        const t = 0.85; // Posición de la flecha en la curva
        const arrowX = (1-t)*(1-t)*start.x + 2*(1-t)*t*controlX + t*t*end.x;
        const arrowY = (1-t)*(1-t)*start.y + 2*(1-t)*t*controlY + t*t*end.y;
        
        // Calcular tangente para orientar la flecha
        const tangentX = 2*(1-t)*(controlX - start.x) + 2*t*(end.x - controlX);
        const tangentY = 2*(1-t)*(controlY - start.y) + 2*t*(end.y - controlY);
        const arrowAngle = Math.atan2(tangentY, tangentX);
        
        // Dibujar flecha
        const arrowSize = 12;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(arrowAngle - Math.PI/6),
          arrowY - arrowSize * Math.sin(arrowAngle - Math.PI/6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(arrowAngle + Math.PI/6),
          arrowY - arrowSize * Math.sin(arrowAngle + Math.PI/6)
        );
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Etiqueta en el punto medio de la curva
        const labelT = 0.5;
        const labelX = (1-labelT)*(1-labelT)*start.x + 2*(1-labelT)*labelT*controlX + labelT*labelT*end.x;
        const labelY = (1-labelT)*(1-labelT)*start.y + 2*(1-labelT)*labelT*controlY + labelT*labelT*end.y;
        
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillRect(labelX - 15, labelY - 8, 30, 16); // Fondo blanco
        ctx.fillStyle = 'white';
        ctx.fillRect(labelX - 14, labelY - 7, 28, 14);
        ctx.fillStyle = '#1f2937';
        ctx.fillText(label, labelX, labelY + 3);
      });
    }
  });
  
  // Dibujar estados (círculos)
  currentMachine.states.forEach(state => {
    if (!positions[state]) return;
    
    const pos = positions[state];
    
    // Círculo del estado
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = currentState === state ? '#3b82f6' : '#e5e7eb';
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Texto del estado
    ctx.fillStyle = currentState === state ? '#ffffff' : '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state, pos.x, pos.y + 5);
    
    // Marcar estado inicial
    if (state === currentMachine.initialState) {
      ctx.beginPath();
      ctx.moveTo(pos.x - 50, pos.y);
      ctx.lineTo(pos.x - 25, pos.y);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Flecha de inicio
      ctx.beginPath();
      ctx.moveTo(pos.x - 30, pos.y - 5);
      ctx.lineTo(pos.x - 25, pos.y);
      ctx.lineTo(pos.x - 30, pos.y + 5);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Inicio', pos.x - 85, pos.y + 5);
    }
  });
  
}, [currentMachine, currentState]);
    // señal final
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
              onChange={(e) => {
  const newStates = e.target.value.split(',').map(s => s.trim()).filter(s => s);
  setCustomMachine(prev => {
    // Crear nuevas funciones de transición y salida para los nuevos estados
    const newTransitionFunction = {};
    const newOutputFunction = {};
    
    newStates.forEach(state => {
      newTransitionFunction[state] = {};
      newOutputFunction[state] = {};
      prev.inputAlphabet.forEach(input => {
        newTransitionFunction[state][input] = newStates[0] || state;
        newOutputFunction[state][input] = prev.outputAlphabet[0] || '0';
      });
    });
    
    return {
      ...prev,
      states: newStates,
      transitionFunction: newTransitionFunction,
      outputFunction: newOutputFunction
    };
  });
}}
              style={styles.input}
              placeholder="s0, s1, s2"
            />
          </div>
          
          <div>
            <label style={styles.label}>Alfabeto de Entrada</label>
            <input
              type="text"
              value={customMachine.inputAlphabet.join(', ')}
              onChange={(e) => {
  const newInputAlphabet = e.target.value.split(',').map(s => s.trim()).filter(s => s);
  setCustomMachine(prev => {
    // Actualizar funciones para el nuevo alfabeto
    const newTransitionFunction = {};
    const newOutputFunction = {};
    
    prev.states.forEach(state => {
      newTransitionFunction[state] = {};
      newOutputFunction[state] = {};
      newInputAlphabet.forEach(input => {
        newTransitionFunction[state][input] = prev.states[0] || state;
        newOutputFunction[state][input] = prev.outputAlphabet[0] || '0';
      });
    });
    
    return {
      ...prev,
      inputAlphabet: newInputAlphabet,
      transitionFunction: newTransitionFunction,
      outputFunction: newOutputFunction
    };
  });
}}
              style={styles.input}
              placeholder="0, 1"
            />
            <div>
  <label style={styles.label}>Alfabeto de Salida</label>
  <input
    type="text"
    value={customMachine.outputAlphabet.join(', ')}
    onChange={(e) => {
      const newOutputAlphabet = e.target.value.split(',').map(s => s.trim()).filter(s => s);
      setCustomMachine(prev => {
        // Actualizar funciones de salida para el nuevo alfabeto
        const newOutputFunction = {};
        
        prev.states.forEach(state => {
          newOutputFunction[state] = {};
          prev.inputAlphabet.forEach(input => {
            newOutputFunction[state][input] = newOutputAlphabet[0] || '0';
          });
        });
        
        return {
          ...prev,
          outputAlphabet: newOutputAlphabet,
          outputFunction: newOutputFunction
        };
      });
    }}
    style={styles.input}
    placeholder="0, 1, a, b"
  />
</div>
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',  // Cambiar de 300px a 250px
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