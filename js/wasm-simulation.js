import { SimulationVisualizer } from "./simulation-visualizer.js";

const totalStepsCount = 700;

export class SimulationWorker {
    constructor(step) {
        this.worker = null;
        this.isIntialized = false;
        this.isStoped = false;
        this.isRun = false;
        this.currentStep = 0;
        this.simulationStep = step;
        this.onInitialized = null;
        this.visualizer = new SimulationVisualizer();
        this.resultBuffer = [];
    }

    setOnInitialized(onInitialized) {
        this.onInitialized = onInitialized;
    }

    start(stlsList) {
        this.visualizer.init();
        if (this.worker === null) {
            this.worker = new Worker('worker_simulation.js');
            this.worker.onmessage = (e) => {
                const type = e.data.type;
    
                if (type === 'initialized') {
                    this.isIntialized = true;
                    this.isRun = true;
                    this.isStoped = false;
                    if (this.onInitialized)
                        this.onInitialized();

                    this._simulationStep();
                }
    
                if (type === 'result') {
                    this.resultBuffer.push(e.data.value);
                    this.visualizer.setSimulationResults(this.resultBuffer);
                }

                if (type === 'step_finished') {
                    if (this.currentStep === totalStepsCount || this.isStoped) {
                        this.worker.postMessage({type: 'finish'});
                        this.worker.terminate();
                        this.worker = null;
                        return;
                    }

                    if (this.isRun) {
                        this._simulationStep();
                    }
                }
            }
    
            if (!this.isIntialized) {
                let stlBuffers = [];
                for (let i = 0; i < stlsList.length; i++) {
                    stlBuffers.push({ name: stlsList[i].name, buffer: stlsList[i].buffer });
                }

                this.worker.postMessage({type: 'init', value: stlBuffers});
                return;
            }
        }
    }

    pause() {
        this.isRun = false;
    }

    stop() {
        // this.visualizer.readVtuMock();
        this.isStoped = true;
    }

    resume() {
        this.isRun = true;
        this._simulationStep();
    }

    _simulationStep() {
        this.worker.postMessage({type: 'step', value: this.simulationStep});
        this.currentStep += this.simulationStep;
    }
}

