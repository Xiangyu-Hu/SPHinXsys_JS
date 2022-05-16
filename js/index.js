
import { SimulationWorker } from "./wasm-simulation.js";
let simulationWorker = null;

const runSimulation = () => {
    if (simulationWorker === null) {
        let inputs = [
            'bernoulli_beam_20x.stl'
        ]

        let stls = [];

        for (let i = 0; i < inputs.length; i++) {
            fetch(`input/${inputs[i]}`).then( (res) => {
                res.arrayBuffer().then( (buf) => {
                    console.log(`=============================`);
                    console.log(`input/${inputs[i]}`);
                    console.log(`=============================`);
                    stls.push({ name: inputs[i], buffer: buf });
                    if (stls.length === inputs.length) {
                        simulationWorker = new SimulationWorker(2);
                        simulationWorker.start(stls);
                    }
                })
            });
        }
    }    
}

const pauseSimulation = () => {
    simulationWorker.pause();
}

const resumeSimulation = () => {
    simulationWorker.resume();
}

const stopSimulation = () => {
    simulationWorker.stop();
}


window.runSimulation = runSimulation;
window.pauseSimulation = pauseSimulation;
window.resumeSimulation = resumeSimulation;
window.stopSimulation = stopSimulation;