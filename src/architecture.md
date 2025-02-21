# Architecture

## Public engine module interface

Engine module public interface:

init(): -> create a new engine module.

addRule(system_function, timestep): -> add a system to the engine.

start(): -> start the engine.

stop(): -> stops the engine

### system_function

Should take in an object that takes the game state data

### Game state data

An object with holds collections of game entities.
