importScripts("bernoulli_beam.js")

let heartSimulation = null;
let simulationStep = 0;

const getVtuStep = 100;

let SPHModule = null;

const initSimulation = (stlsData) => {
  const convertTypedArray = (src, type) => {
    let buffer = new ArrayBuffer(src.byteLength);
    let baseView = new src.constructor(buffer).set(src);
    return new type(buffer);
  }

  const stlToBuffer = (stlBuffer) => {
    let data = new Uint8Array(stlBuffer);

    let bufferSize = data.length
    let buffer = SPHModule._malloc(bufferSize);
    let byteView = convertTypedArray(new Int32Array([bufferSize]), Uint8ClampedArray);

    let bufferArray = new Uint8Array(SPHModule.HEAPU8.buffer, buffer, bufferSize + byteView.length);

    for (let i = 0; i < byteView.length; i++) {
      bufferArray[i] = byteView[i];
    }

    for (let i = 0; i < bufferSize; i++) {
      bufferArray[i + byteView.length] = data[i];
    }

    return buffer;
  }
  
  const resolutionInput = [1.5];
  let resolution = new SPHModule.DoubleVector();
  resolutionInput.forEach( (e) => {
    resolution.push_back(e);
  });

  let stls = new SPHModule.StlsList();
  for (let i = 0; i < stlsData.length; i++) {
    stls.push_back({ name: stlsData[i].name, ptr: stlToBuffer(stlsData[i].buffer) });
  }

  let options = {
      scale_stl: 0.001,
      resolution: resolution,
      rho_0: 1000.0,
      poisson: 0.3,
      Youngs_modulus: 5e8,
      physical_viscosity: 5e6,
      translation: [0.0, 0.0, 0.0],
      stls: stls,
      relative_input_path: "input/"
  };

  heartSimulation = new SPHModule.BernoulliBeam(options);
  heartSimulation.onError( (error) => { console.log(error) } );
}

onmessage = (e) => {
  if (e.data.type === 'init') {

    const Lib = {
        locateFile: (file) => file,
        onRuntimeInitialized: () => {
        },
        mainScriptUrlOrBlob: "./bernoulli_beam.js",
    };

    SPH(Lib).then( (module) => {
      SPHModule = module;
      initSimulation(e.data.value);
      postMessage({type: 'initialized'});
    })
  }

  if (e.data.type === 'step') {
    simulationStep += e.data.value;
    heartSimulation.runSimulation(e.data.value);
    postMessage({type: 'step_finished'});

    if (simulationStep % getVtuStep === 0) {
      let vtuData = heartSimulation.vtuData;
      const retData = {}
      const mapKeysVtu = vtuData.keys();

      for (let i = 0; i < mapKeysVtu.size(); i++) {
        const key = mapKeysVtu.get(i);
        retData[key] = vtuData.get(key)
      }

      console.log({ retData });
      postMessage({type: 'result', value: retData });
    }
  }

  if (e.data.type === 'finish') {
    heartSimulation.delete();
    heartSimulation = null;
  }

}