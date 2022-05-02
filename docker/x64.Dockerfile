FROM ubuntu:20.04

ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update && apt-get install -y \ 
    apt-utils \
    build-essential \
    cmake \
    ninja-build \
    libgtest-dev \
    libtbb-dev \
    libboost-all-dev \
    liblapack-dev \
    wget \
    unzip \
    git \
    ccache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*    

ENV TBB_HOME=/usr/lib/x86_64-linux-gnu
ENV BOOST_HOME=/usr/lib/x86_64-linux-gnu
ENV SIMBODY_HOME=/home/simbody

RUN cd /home && wget "https://virtonomyplatformdev.blob.core.windows.net/simulation/simbody_lib/simbody.zip?sv=2019-12-12&st=2021-08-03T14%3A03%3A58Z&se=2022-08-04T14%3A03%3A00Z&sr=b&sp=r&sig=j4pjSwzRMV3OzRtKeYUv62zutZ3Td3M8khRxd3lsEYs%3D"
RUN cd /home && unzip "simbody.zip?sv=2019-12-12&st=2021-08-03T14:03:58Z&se=2022-08-04T14:03:00Z&sr=b&sp=r&sig=j4pjSwzRMV3OzRtKeYUv62zutZ3Td3M8khRxd3lsEYs=" \
    && export SIMBODY_HOME=/home/simbody

RUN cd /usr/src/gtest \
    && cmake CMakeLists.txt \
    && make

ENV CCACHE_DIR /app/.ccache

WORKDIR /app