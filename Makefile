.PHONY: cbuild start stop restart sh logs compile deploy tsh tests

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

cbuild:
	docker build -t $(container) .

start:
	docker run -d --rm --name $(container) --volume $(cwd):/usr/src/app $(container)

stop:
	docker stop $(container)

restart: stop start

sh:
	docker exec -it $(container) sh

logs:
	docker logs -f $(container)

compile:
	docker exec -it $(container) truffle compile

deploy:
	docker exec -it $(container) truffle migrate --reset

tsh:
	docker exec -it $(container) truffle console

tests:
	docker exec -it $(container) truffle test
