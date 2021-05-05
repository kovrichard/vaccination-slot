.PHONY: build deploy sh clear tests

# \
!ifndef 0 # \
delete=rmdir /Q /S # \
!else
delete=rm -rf
# \
!endif

compile:
	truffle compile

deploy:
	truffle migrate --reset

sh:
	truffle console

clear:
	$(delete) build

tests:
	truffle test
