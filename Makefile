.PHONY: cbuild start stop restart sh logs compile deploy tsh tests addresses

# \
!ifndef 0 # \
delete=rmdir /Q /S # \
cwd=%cd% \
!else 
delete=rm -rf
cwd=$$(pwd)
# \
!endif

container=vaccineslot

# Build the container
cbuild:
	docker build -t $(container) .

# Start the container
start:
	docker run -d --rm --name $(container) --volume $(cwd):/usr/src/app $(container)

# Stop the container
stop:
	docker stop $(container)

# Restart the container
restart: stop start

# Open a shell inside the container
sh:
	docker exec -it $(container) sh

# Watch live logs of the container
logs:
	docker logs -f $(container)

# Compile smart contracts
compile:
	docker exec -it $(container) truffle compile

# Deploy smart contracts to the blockchain
deploy:
	docker exec -it $(container) truffle migrate --reset

# Open truffle shell inside the container
tsh:
	docker exec -it $(container) truffle console

# Run tests
tests:
	docker exec -it $(container) truffle test

addresses:
	docker exec -it $(container) truffle exec addresses.js
