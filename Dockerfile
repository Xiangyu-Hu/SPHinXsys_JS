FROM ubuntu:latest

ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update && apt-get install -y \ 
    apt-utils \
    build-essential \
    cmake \
    libgtest-dev \
    libtbb-dev \
    libboost-all-dev \
    liblapack-dev \
    wget \
    unzip \
    git \
    libxml2-dev \
    uuid-dev \
    libcpprest-dev

WORKDIR /home/SPHinXsys_Virtonomy
COPY ./ /home/SPHinXsys_Virtonomy/
RUN cd /home/SPHinXsys_Virtonomy && rm -rf simulations
ENV HOME_PATH=/home

RUN cd ${HOME_PATH} && wget "https://github.com/mongodb/mongo-c-driver/releases/download/1.19.0/mongo-c-driver-1.19.0.tar.gz" && tar xzf mongo-c-driver-1.19.0.tar.gz \
    && cd mongo-c-driver-1.19.0 && mkdir cmake-build \
    && cd cmake-build && cmake -DENABLE_AUTOMATIC_INIT_AND_CLEANUP=OFF -DENABLE_TESTS=OFF -DENABLE_EXAMPLES=OFF -DENABLE_STATIC=OFF .. && cmake --build . --target install
RUN cd ${HOME_PATH} && rm "mongo-c-driver-1.19.0.tar.gz" && rm -rf mongo-c-driver-1.19.0

RUN cd /usr/local && wget "https://virtonomyplatformdev.blob.core.windows.net/simulation/mongocxx_lib/mongocxx_artifacts.zip?sv=2019-12-12&st=2021-08-31T10%3A08%3A41Z&se=2031-09-01T10%3A08%3A00Z&sr=b&sp=r&sig=UE%2FqXpqbo9SA0lQ05%2BRl9FTuP3UVm%2Ft8l%2BICOMAdkS0%3D"
RUN cd /usr/local && unzip "mongocxx_artifacts.zip?sv=2019-12-12&st=2021-08-31T10:08:41Z&se=2031-09-01T10:08:00Z&sr=b&sp=r&sig=UE%2FqXpqbo9SA0lQ05+Rl9FTuP3UVm%2Ft8l+ICOMAdkS0="
RUN cd /usr/local && rm "mongocxx_artifacts.zip?sv=2019-12-12&st=2021-08-31T10:08:41Z&se=2031-09-01T10:08:00Z&sr=b&sp=r&sig=UE%2FqXpqbo9SA0lQ05+Rl9FTuP3UVm%2Ft8l+ICOMAdkS0="

RUN cd ${HOME_PATH} && wget "https://virtonomyplatformdev.blob.core.windows.net/simulation/simbody_artifacts_2/simbody.zip?sv=2019-12-12&st=2021-11-09T13%3A23%3A29Z&se=2031-11-13T13%3A23%3A00Z&sr=b&sp=r&sig=zDj3rVCbgnECYN2NkVmFP48VarO7PDG%2FNNZBpL6h7dQ%3D"
RUN cd ${HOME_PATH} && unzip "simbody.zip?sv=2019-12-12&st=2021-11-09T13:23:29Z&se=2031-11-13T13:23:00Z&sr=b&sp=r&sig=zDj3rVCbgnECYN2NkVmFP48VarO7PDG%2FNNZBpL6h7dQ="
RUN cd ${HOME_PATH} && rm "simbody.zip?sv=2019-12-12&st=2021-11-09T13:23:29Z&se=2031-11-13T13:23:00Z&sr=b&sp=r&sig=zDj3rVCbgnECYN2NkVmFP48VarO7PDG%2FNNZBpL6h7dQ="

RUN cd /home/SPHinXsys_Virtonomy && git submodule update --init
RUN cd /home/SPHinXsys_Virtonomy/SPHinXsys && git submodule update --init -- ./3rd_party/eigen
RUN cd ${HOME_PATH} && rm -rf build && mkdir build && cd build \
    && cmake /home/SPHinXsys_Virtonomy -DRELEASE_ONLY=1 -DCMAKE_BUILD_TYPE=Release -DTBB_HOME=/usr/lib/x86_64-linux-gnu -DBOOST_HOME=/usr/lib/x86_64-linux-gnu -DSIMBODY_HOME=${HOME_PATH}/simbody \
    && make -j$(nproc)

CMD ["/bin/bash"]
