.PHONY: build deploy sh clear

# \
!ifndef 0 # \
delete=rmdir /Q /S # \
!else
delete=rm -rf
# \
!endif

build:
	truffle compile

deploy:
	truffle migrate

sh:
	truffle console

clear:
	$(delete) build
