# SPH_JS_test
Webassembly from SPHinXsys

# Building Webassembly
- Install npm: "sudo apt install npm"
- Install docker: "curl -fsSL https://test.docker.com -o test-docker.sh && sudo sh test-docker.sh"
- Test the installation: "sudo docker run hello-world"
- Now go to the repository folder
- You need every submodule: "git submodule update --init --recursive" incl. simbody and wasmtbb
- Build the docker from the folder of the repository itself: "sudo npm run build-docker-wasm"
- Build the Webassembly project from the folder of the repository itself:  "sudo npm run build-wasm"

# Running the Javascript example
- run the terminal in the "js" folder: "python server.py" - this will open a server
- open the Chrome and go to http://localhost:8000/
- open the console with F12
- when you run the simulation, the output will be shown in the console
