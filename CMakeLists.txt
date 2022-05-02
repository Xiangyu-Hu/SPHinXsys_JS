project(SPHinXsys_Virtonomy)
cmake_minimum_required(VERSION 3.16)

set(CMAKE_BUILD_TYPE RelWithDebInfo)
set(SPHINXSYS_PROJECT_DIR ${CMAKE_SOURCE_DIR}/SPHinXsys)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${SPHINXSYS_PROJECT_DIR}/cmake)

if(NOT EMSCRIPTEN)
    enable_testing()
    find_package(GTest REQUIRED)
    include(GoogleTest)

    include(${SPHINXSYS_PROJECT_DIR}/cmake/Common.cmake)
    include(${SPHINXSYS_PROJECT_DIR}/cmake/Import3rdpartylibs.cmake)
else()
    set(SPH_ONLY_STATIC_BUILD 1)
    set(BUILD_WITH_SIMBODY 1)
    set(ONLY_3D 1)
    set(BUILD_SPHINXSYS_TESTS 1)
    add_definitions(-D__SIMBODY_WITHOUT_LAPACK__)
    add_definitions(-D__EIGEN__)
    add_definitions(-D__EMSCRIPTEN__)

    remove_definitions(-DTBB_2021_2_0)
    set(TBB_ROOT ${SPHINXSYS_PROJECT_DIR}/3rd_party/wasmtbb)
    include_directories("${TBB_ROOT}/include")
    set(TBBLIBDIR "${TBB_ROOT}/build/linux_wasm32_emscripten_emscripten_wasm32_release")
    set(TBBLIB tbb)

    set(PRE_POST "")
    #set(EM_FLAGS "${PRE_POST} -fPIC -g -O0 --profiling -DUNIX -D__linux__=1 --bind -std=c++14 -s USE_PTHREADS=1 -s DISABLE_EXCEPTION_CATCHING=0")
    set(EM_FLAGS "${PRE_POST} -fPIC -g -O2 -DUNIX -D__linux__=1 -std=c++14 -s USE_PTHREADS=1 -s WASM=1 -s DISABLE_EXCEPTION_CATCHING=0")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EM_FLAGS}")
    set(EM_FLAGS "--bind -s MODULARIZE=1 -s EXPORT_NAME=SPH -s USE_PTHREADS=1 -s NO_FILESYSTEM=0 -s WASM=1 -s INITIAL_MEMORY=536870912 -s ALLOW_MEMORY_GROWTH=0 -s PTHREAD_POOL_SIZE=16")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${EM_FLAGS}")
endif()

if(SPH_ONLY_STATIC_BUILD)
    set(BUILD_STATIC_LIBRARIES 1) # Simbody
    set(BUILD_DYNAMIC_LIBRARIES 0) # Simbody
endif()

# don't build SPHinXsys tests by default
option(BUILD_SPHINXSYS_TESTS "BUILD_SPHINXSYS_TESTS" 0)
# only build 3D lib
option(ONLY_3D "ONLY_3D" 1)
# option to only build release simulations
option(RELEASE_ONLY "RELEASE_ONLY" 0)
# option build  DATABASE_TESTS - 4b_unit_tests_database
## if yes, you need to have AZURE_KEY and MONGODB_KEY as environment varibles, otherwise you can't build
option(DATABASE_TESTS "DATABASE_TESTS" 0)

if(BUILD_WITH_SIMBODY)
    set(SPH_ONLY_STATIC_BUILD 1)
endif()

add_subdirectory(SPHinXsys)
